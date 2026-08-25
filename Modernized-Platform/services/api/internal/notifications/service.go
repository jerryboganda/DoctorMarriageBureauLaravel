// Package notifications persists and serves user notifications.
package notifications

import (
	"context"
	"encoding/json"
	"time"

	"github.com/doctormarriagebureau/api/platform/postgres"
)

// Notification is the API-facing notification DTO.
type Notification struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Title     string                 `json:"title"`
	Body      string                 `json:"body"`
	ActionURL string                 `json:"action_url,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
	ReadAt    *time.Time             `json:"read_at"`
	CreatedAt time.Time              `json:"created_at"`
}

// Service persists notifications in PostgreSQL.
type Service struct {
	pg *postgres.Client
}

// NewService creates a notifications service.
func NewService(pg *postgres.Client) *Service {
	return &Service{pg: pg}
}

// Push inserts a notification for a user. Failures are non-fatal by design;
// callers should not abort their main flow when a notification fails.
func (s *Service) Push(ctx context.Context, userID int64, notifType, title, body string, extra map[string]interface{}) {
	if s == nil || s.pg == nil || s.pg.Pool == nil {
		return
	}
	payload := map[string]interface{}{
		"title": title,
		"body":  body,
	}
	for k, v := range extra {
		payload[k] = v
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	_, _ = s.pg.Pool.Exec(ctx, `
		INSERT INTO notifications (id, type, notifiable_type, notifiable_id, data, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, 'App\Models\User', $2, $3, NOW(), NOW())
	`, notifType, userID, data)
}

// List returns notifications for a user (newest first) plus total and unread counts.
func (s *Service) List(ctx context.Context, userID int64, limit, offset int) ([]Notification, int64, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	var total, unread int64
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT COUNT(*), COUNT(*) FILTER (WHERE read_at IS NULL)
		FROM notifications
		WHERE notifiable_id = $1
	`, userID).Scan(&total, &unread)
	if err != nil {
		return nil, 0, 0, err
	}

	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id::text, type, COALESCE(data, '{}'::jsonb), read_at, created_at
		FROM notifications
		WHERE notifiable_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, 0, 0, err
	}
	defer rows.Close()

	out := []Notification{}
	for rows.Next() {
		var n Notification
		var raw []byte
		if err := rows.Scan(&n.ID, &n.Type, &raw, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, 0, 0, err
		}
		if len(raw) > 0 {
			var data map[string]interface{}
			if json.Unmarshal(raw, &data) == nil {
				n.Data = data
			}
		}
		out = append(out, Present(n))
	}
	return out, total, unread, rows.Err()
}

// UnreadCount returns the number of unread notifications.
func (s *Service) UnreadCount(ctx context.Context, userID int64) (int64, error) {
	var unread int64
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM notifications WHERE notifiable_id = $1 AND read_at IS NULL
	`, userID).Scan(&unread)
	return unread, err
}

// MarkRead marks a single notification as read.
func (s *Service) MarkRead(ctx context.Context, userID int64, id string) error {
	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE notifications SET read_at = NOW(), updated_at = NOW()
		WHERE id::text = $1 AND notifiable_id = $2 AND read_at IS NULL
	`, id, userID)
	return err
}

// MarkAllRead marks all of a user's notifications as read.
func (s *Service) MarkAllRead(ctx context.Context, userID int64) error {
	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE notifications SET read_at = NOW(), updated_at = NOW()
		WHERE notifiable_id = $1 AND read_at IS NULL
	`, userID)
	return err
}
