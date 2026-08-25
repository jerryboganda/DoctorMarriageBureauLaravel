package chat

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/doctormarriagebureau/api/internal/cards"
	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/internal/notifications"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

var (
	ErrThreadNotFound = errors.New("chat thread not found")
	ErrNotParticipant = errors.New("user is not a participant in this chat thread")
)

// Service defines real-time chat and presence operations.
type Service interface {
	ListThreads(ctx context.Context, userID int64) ([]models.ChatThread, error)
	GetOrCreateThread(ctx context.Context, userOneID, userTwoID int64) (*models.ChatThread, error)
	GetMessages(ctx context.Context, userID, threadID int64, cursor string, limit int) ([]models.ChatMessage, error)
	SendMessage(ctx context.Context, senderID, threadID int64, message, attachmentURL string, isBiodata bool) (*models.ChatMessage, error)
	ShareBiodata(ctx context.Context, senderID, threadID int64) (*models.ChatMessage, error)
	RecordHeartbeat(userID int64) error
	IsUserOnline(userID int64) bool
	BroadcastTyping(threadID, userID int64, isTyping bool)
	GetHub() *Hub
}

type chatService struct {
	pg       *postgres.Client
	hub      *Hub
	notifier *notifications.Service

	mu       sync.RWMutex
	presence map[int64]time.Time // [userID]lastHeartbeat
}

// NewChatService initializes the Postgres-backed chat service.
func NewChatService(pg *postgres.Client, hub *Hub, notifier *notifications.Service) Service {
	if hub == nil {
		hub = NewHub()
		go hub.Run()
	}
	return &chatService{
		pg:       pg,
		hub:      hub,
		notifier: notifier,
		presence: make(map[int64]time.Time),
	}
}

func (s *chatService) GetHub() *Hub {
	return s.hub
}

// threadParticipants returns the two participant IDs of a thread.
func (s *chatService) threadParticipants(ctx context.Context, threadID int64) (int64, int64, bool, error) {
	var senderID, receiverID int64
	var active bool
	var blockedBy *int64
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT sender_user_id, receiver_user_id, active, blocked_by_user
		FROM chat_threads WHERE id = $1
	`, threadID).Scan(&senderID, &receiverID, &active, &blockedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, 0, false, ErrThreadNotFound
		}
		return 0, 0, false, err
	}
	blocked := blockedBy != nil && *blockedBy > 0
	return senderID, receiverID, active && !blocked, nil
}

// ListThreads returns all conversations with the latest message and unread counts.
func (s *chatService) ListThreads(ctx context.Context, userID int64) ([]models.ChatThread, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT
			t.id, t.sender_user_id, t.receiver_user_id, t.created_at,
			COALESCE(lm.message, ''), lm.created_at,
			COALESCE(un.unread, 0)
		FROM chat_threads t
		LEFT JOIN LATERAL (
			SELECT c.message, c.created_at
			FROM chats c WHERE c.chat_thread_id = t.id
			ORDER BY c.id DESC LIMIT 1
		) lm ON TRUE
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS unread
			FROM chats c
			WHERE c.chat_thread_id = t.id AND c.sender_user_id != $1 AND c.seen = false
		) un ON TRUE
		WHERE (t.sender_user_id = $1 OR t.receiver_user_id = $1) AND t.active = true
		ORDER BY COALESCE(lm.created_at, t.created_at) DESC
		LIMIT 100
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	threads := []models.ChatThread{}
	otherIDs := []int64{}
	for rows.Next() {
		var t models.ChatThread
		var lastAt *time.Time
		if err := rows.Scan(&t.ID, &t.UserOneID, &t.UserTwoID, &t.CreatedAt, &t.LastMessage, &lastAt, &t.UnreadCount); err != nil {
			return nil, err
		}
		t.LastMessageAt = lastAt
		threads = append(threads, t)
		if t.UserOneID == userID {
			otherIDs = append(otherIDs, t.UserTwoID)
		} else {
			otherIDs = append(otherIDs, t.UserOneID)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	cardMap, cerr := cards.FetchByIDs(ctx, s.pg, otherIDs)
	if cerr == nil {
		for i := range threads {
			otherID := threads[i].UserTwoID
			if otherID == userID {
				otherID = threads[i].UserOneID
			}
			threads[i].OtherUser = cardMap[otherID]
		}
	}
	return threads, nil
}

// GetOrCreateThread ensures a thread exists between two users.
func (s *chatService) GetOrCreateThread(ctx context.Context, userOneID, userTwoID int64) (*models.ChatThread, error) {
	var t models.ChatThread
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT id, sender_user_id, receiver_user_id, created_at
		FROM chat_threads
		WHERE (sender_user_id = $1 AND receiver_user_id = $2)
		   OR (sender_user_id = $2 AND receiver_user_id = $1)
		LIMIT 1
	`, userOneID, userTwoID).Scan(&t.ID, &t.UserOneID, &t.UserTwoID, &t.CreatedAt)
	if err == nil {
		return &t, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	code := "thr_" + hex.EncodeToString(buf)

	err = s.pg.Pool.QueryRow(ctx, `
		INSERT INTO chat_threads (sender_user_id, receiver_user_id, thread_code, active, created_at, updated_at)
		VALUES ($1, $2, $3, true, NOW(), NOW())
		RETURNING id, sender_user_id, receiver_user_id, created_at
	`, userOneID, userTwoID, code).Scan(&t.ID, &t.UserOneID, &t.UserTwoID, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// GetMessages returns messages (oldest first) and marks incoming ones as read.
func (s *chatService) GetMessages(ctx context.Context, userID, threadID int64, cursor string, limit int) ([]models.ChatMessage, error) {
	p1, p2, _, err := s.threadParticipants(ctx, threadID)
	if err != nil {
		return nil, err
	}
	if userID != p1 && userID != p2 {
		return nil, ErrNotParticipant
	}

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	query := `
		SELECT id, chat_thread_id, sender_user_id, message, COALESCE(attachment, ''), COALESCE(is_biodata_share, false), seen, created_at
		FROM chats
		WHERE chat_thread_id = $1
	`
	args := []interface{}{threadID}
	if cursor != "" {
		query += " AND id < $2"
		args = append(args, cursor)
	}
	query += fmt.Sprintf(" ORDER BY id DESC LIMIT %d", limit)

	rows, err := s.pg.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	msgs := []models.ChatMessage{}
	for rows.Next() {
		var m models.ChatMessage
		if err := rows.Scan(&m.ID, &m.ThreadID, &m.SenderUserID, &m.Message, &m.AttachmentURL, &m.IsBiodataShare, &m.IsRead, &m.CreatedAt); err != nil {
			return nil, err
		}
		if m.SenderUserID == p1 {
			m.ReceiverUserID = p2
		} else {
			m.ReceiverUserID = p1
		}
		msgs = append(msgs, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Reverse to oldest-first for rendering.
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}

	// Mark incoming as read.
	_, _ = s.pg.Pool.Exec(ctx, `
		UPDATE chats SET seen = true, updated_at = NOW()
		WHERE chat_thread_id = $1 AND sender_user_id != $2 AND seen = false
	`, threadID, userID)

	return msgs, nil
}

// SendMessage persists and broadcasts a message.
func (s *chatService) SendMessage(ctx context.Context, senderID, threadID int64, message, attachmentURL string, isBiodata bool) (*models.ChatMessage, error) {
	p1, p2, open, err := s.threadParticipants(ctx, threadID)
	if err != nil {
		return nil, err
	}
	if senderID != p1 && senderID != p2 {
		return nil, ErrNotParticipant
	}
	if !open {
		return nil, errors.New("this conversation is not active")
	}
	if message == "" && attachmentURL == "" {
		return nil, errors.New("message cannot be empty")
	}

	receiverID := p1
	if senderID == p1 {
		receiverID = p2
	}

	var m models.ChatMessage
	err = s.pg.Pool.QueryRow(ctx, `
		INSERT INTO chats (chat_thread_id, sender_user_id, message, attachment, is_biodata_share, seen, created_at, updated_at)
		VALUES ($1, $2, $3, NULLIF($4, ''), $5, false, NOW(), NOW())
		RETURNING id, chat_thread_id, sender_user_id, message, COALESCE(attachment, ''), COALESCE(is_biodata_share, false), seen, created_at
	`, threadID, senderID, message, attachmentURL, isBiodata).Scan(
		&m.ID, &m.ThreadID, &m.SenderUserID, &m.Message, &m.AttachmentURL, &m.IsBiodataShare, &m.IsRead, &m.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	m.ReceiverUserID = receiverID

	_, _ = s.pg.Pool.Exec(ctx, `UPDATE chat_threads SET updated_at = NOW() WHERE id = $1`, threadID)

	channel := fmt.Sprintf("chat.%d", threadID)
	s.hub.BroadcastToChannel(channel, "message:new", senderID, m)
	s.hub.BroadcastToUser(receiverID, "message:new", m)

	if !s.IsUserOnline(receiverID) {
		s.notifier.Push(ctx, receiverID, "message_received", "New message",
			"You have a new message waiting for you.", map[string]interface{}{
				"thread_id":  threadID,
				"sender_id":  senderID,
				"action_url": "/messages/",
			})
	}

	return &m, nil
}

// ShareBiodata sends a biodata-share message in the conversation.
func (s *chatService) ShareBiodata(ctx context.Context, senderID, threadID int64) (*models.ChatMessage, error) {
	return s.SendMessage(ctx, senderID, threadID, "📄 Biodata shared — view full profile for details.", "", true)
}

// RecordHeartbeat updates in-memory presence and refreshes Redis presence.
func (s *chatService) RecordHeartbeat(userID int64) error {
	s.mu.Lock()
	s.presence[userID] = time.Now()
	s.mu.Unlock()
	if s.hub != nil {
		s.hub.MarkPresence(userID, "service")
	}
	return nil
}

// IsUserOnline reports presence within the last 2 minutes, an active socket, or Redis presence.
func (s *chatService) IsUserOnline(userID int64) bool {
	if s.hub != nil {
		if s.hub.IsUserConnected(userID) {
			return true
		}
		if s.hub.IsOnlineRedis(userID) {
			return true
		}
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	last, ok := s.presence[userID]
	return ok && time.Since(last) < 2*time.Minute
}

// BroadcastTyping relays typing indicators to the thread channel.
func (s *chatService) BroadcastTyping(threadID, userID int64, isTyping bool) {
	event := "typing:stop"
	if isTyping {
		event = "typing:start"
	}
	s.hub.BroadcastToChannel(fmt.Sprintf("chat.%d", threadID), event, userID, map[string]int64{"user_id": userID})
}
