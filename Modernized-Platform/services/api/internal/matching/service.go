package matching

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/internal/notifications"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

var (
	ErrProposalNotFound        = errors.New("proposal not found")
	ErrProposalSelf            = errors.New("cannot express interest in yourself")
	ErrProposalAlreadyExists   = errors.New("an active proposal already exists between users")
	ErrUnverifiedLimitReached  = errors.New("unverified members are limited to 5 active proposals")
	ErrInsufficientQuota       = errors.New("insufficient proposal quota; please upgrade your package")
	ErrUnauthorized            = errors.New("unauthorized action on proposal")
	ErrInvalidStatusTransition = errors.New("invalid proposal status transition")
)

// Interest status integers as stored in express_interests.status.
const (
	statusPending   = 0
	statusAccepted  = 1
	statusRejected  = 2
	statusWithdrawn = 3
)

// defaultFreeInterests is granted when a member has no package quota row value.
const defaultFreeInterests = 5

func statusToModel(s int) models.ProposalStatus {
	switch s {
	case statusAccepted:
		return models.ProposalStatusAccepted
	case statusRejected:
		return models.ProposalStatusRejected
	case statusWithdrawn:
		return models.ProposalStatusWithdrawn
	default:
		return models.ProposalStatusPending
	}
}

// ChatThreadProvisioner creates chat threads upon acceptance.
type ChatThreadProvisioner interface {
	GetOrCreateThread(ctx context.Context, userOneID, userTwoID int64) (*models.ChatThread, error)
}

// Service defines matching and proposal business logic.
type Service interface {
	ExpressInterest(ctx context.Context, senderID, recipientID int64, message string) (*models.ExpressInterest, error)
	ListInterests(ctx context.Context, userID int64, filterType string) ([]models.ExpressInterest, error)
	AcceptInterest(ctx context.Context, receiverID, proposalID int64) (*models.ExpressInterest, error)
	RejectInterest(ctx context.Context, receiverID, proposalID int64, reason string) (*models.ExpressInterest, error)
	WithdrawInterest(ctx context.Context, senderID, proposalID int64) (*models.ExpressInterest, error)

	// Shortlists
	AddShortlist(ctx context.Context, userID, candidateID int64) (*models.Shortlist, error)
	RemoveShortlist(ctx context.Context, userID, candidateID int64) error
	ListShortlists(ctx context.Context, userID int64) ([]models.Shortlist, error)

	// Ignore List
	IgnoreUser(ctx context.Context, userID, targetUserID int64) error
	UnignoreUser(ctx context.Context, userID, targetUserID int64) error
	ListIgnoredUsers(ctx context.Context, userID int64) ([]int64, error)
}

type matchingService struct {
	pg         *postgres.Client
	threadProv ChatThreadProvisioner
	notifier   *notifications.Service
}

// NewMatchingService initializes the Postgres-backed matching service.
func NewMatchingService(pg *postgres.Client, threadProv ChatThreadProvisioner, notifier *notifications.Service) Service {
	return &matchingService{pg: pg, threadProv: threadProv, notifier: notifier}
}

func (s *matchingService) scanInterest(row interface{ Scan(...interface{}) error }) (*models.ExpressInterest, error) {
	var p models.ExpressInterest
	var status int
	var declineReason, message *string
	err := row.Scan(
		&p.ID, &p.RecipientUserID, &p.SenderUserID, &status,
		&message, &declineReason, &p.ChatThreadID,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if message != nil {
		p.Message = *message
	}
	if declineReason != nil {
		p.DeclineReason = *declineReason
	}
	p.Status = statusToModel(status)
	return &p, nil
}

const interestCols = `id, user_id, interested_by, status, message, decline_reason, chat_thread_id, created_at, updated_at`

// ExpressInterest creates a proposal with validation, unverified limits, and quota deduction.
func (s *matchingService) ExpressInterest(ctx context.Context, senderID, recipientID int64, message string) (*models.ExpressInterest, error) {
	if senderID == recipientID {
		return nil, ErrProposalSelf
	}

	// Target must exist and be an active member.
	var targetExists bool
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM users u JOIN members m ON m.user_id = u.id
			WHERE u.id = $1 AND u.user_type = 'member' AND u.deleted_at IS NULL
			  AND COALESCE(u.blocked,false) = false AND COALESCE(u.deactivated,false) = false
		)
	`, recipientID).Scan(&targetExists)
	if err != nil {
		return nil, err
	}
	if !targetExists {
		return nil, errors.New("target member not found")
	}

	// Cannot send if either party ignored the other.
	var isIgnored bool
	err = s.pg.Pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM ignored_users
			WHERE (user_id = $1 AND ignored_user = $2) OR (user_id = $2 AND ignored_user = $1)
		)
	`, recipientID, senderID).Scan(&isIgnored)
	if err != nil {
		return nil, err
	}
	if isIgnored {
		return nil, errors.New("cannot send proposal to this user")
	}

	var created *models.ExpressInterest
	err = s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		// Existing pending/accepted proposal in either direction blocks a new one.
		var existsActive bool
		if err := tx.QueryRow(ctx, `
			SELECT EXISTS(
				SELECT 1 FROM express_interests
				WHERE ((user_id = $1 AND interested_by = $2) OR (user_id = $2 AND interested_by = $1))
				  AND status IN (0, 1)
			)
		`, recipientID, senderID).Scan(&existsActive); err != nil {
			return err
		}
		if existsActive {
			return ErrProposalAlreadyExists
		}

		// Load sender member state with row lock for quota update.
		var isApproved bool
		var remaining *int
		if err := tx.QueryRow(ctx, `
			SELECT m.is_approved, m.remaining_interest
			FROM members m WHERE m.user_id = $1 FOR UPDATE
		`, senderID).Scan(&isApproved, &remaining); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return errors.New("sender member profile not found")
			}
			return err
		}

		if !isApproved {
			var pendingCount int
			if err := tx.QueryRow(ctx, `
				SELECT COUNT(*) FROM express_interests WHERE interested_by = $1 AND status = 0
			`, senderID).Scan(&pendingCount); err != nil {
				return err
			}
			if pendingCount >= 5 {
				return ErrUnverifiedLimitReached
			}
		}

		quota := defaultFreeInterests
		if remaining != nil {
			quota = *remaining
		}
		if quota <= 0 {
			return ErrInsufficientQuota
		}
		if _, err := tx.Exec(ctx, `
			UPDATE members SET remaining_interest = $1, updated_at = NOW() WHERE user_id = $2
		`, quota-1, senderID); err != nil {
			return err
		}

		row := tx.QueryRow(ctx, `
			INSERT INTO express_interests (user_id, interested_by, status, message, created_at, updated_at)
			VALUES ($1, $2, 0, NULLIF($3, ''), NOW(), NOW())
			RETURNING `+interestCols+`
		`, recipientID, senderID, message)
		p, err := s.scanInterest(row)
		if err != nil {
			return err
		}
		created = p
		return nil
	})
	if err != nil {
		return nil, err
	}

	s.notifier.Push(ctx, recipientID, "proposal_received", "New proposal received",
		"A doctor has expressed interest in your profile.", map[string]interface{}{
			"proposal_id": created.ID,
			"sender_id":   senderID,
			"action_url":  "/proposals/",
		})

	s.enrichInterests(ctx, []models.ExpressInterest{*created})
	return created, nil
}

// ListInterests returns proposals for a user filtered by "received" or "sent".
func (s *matchingService) ListInterests(ctx context.Context, userID int64, filterType string) ([]models.ExpressInterest, error) {
	query := `SELECT ` + interestCols + ` FROM express_interests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`
	if filterType == "sent" {
		query = `SELECT ` + interestCols + ` FROM express_interests WHERE interested_by = $1 ORDER BY created_at DESC LIMIT 200`
	}

	rows, err := s.pg.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.ExpressInterest{}
	for rows.Next() {
		p, err := s.scanInterest(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	s.enrichInterests(ctx, out)

	// Attach counterpart card: sender for received lists, recipient for sent lists.
	ids := make([]int64, 0, len(out))
	for i := range out {
		if filterType == "sent" {
			ids = append(ids, out[i].RecipientUserID)
		} else {
			ids = append(ids, out[i].SenderUserID)
		}
	}
	cardMap, err := fetchCardsByIDs(ctx, s.pg, ids)
	if err == nil {
		for i := range out {
			if filterType == "sent" {
				out[i].Candidate = cardMap[out[i].RecipientUserID]
			} else {
				out[i].Candidate = cardMap[out[i].SenderUserID]
			}
		}
	}
	return out, nil
}

// enrichInterests fills sender/recipient display names.
func (s *matchingService) enrichInterests(ctx context.Context, items []models.ExpressInterest) {
	if len(items) == 0 {
		return
	}
	idSet := map[int64]bool{}
	for _, p := range items {
		idSet[p.SenderUserID] = true
		idSet[p.RecipientUserID] = true
	}
	ids := make([]int64, 0, len(idSet))
	for id := range idSet {
		ids = append(ids, id)
	}
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) FROM users WHERE id = ANY($1)
	`, ids)
	if err != nil {
		return
	}
	defer rows.Close()
	names := map[int64]string{}
	for rows.Next() {
		var id int64
		var name string
		if rows.Scan(&id, &name) == nil {
			names[id] = name
		}
	}
	for i := range items {
		items[i].SenderName = names[items[i].SenderUserID]
		items[i].RecipientName = names[items[i].RecipientUserID]
	}
}

func (s *matchingService) getInterest(ctx context.Context, proposalID int64) (*models.ExpressInterest, error) {
	row := s.pg.Pool.QueryRow(ctx, `SELECT `+interestCols+` FROM express_interests WHERE id = $1`, proposalID)
	p, err := s.scanInterest(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProposalNotFound
		}
		return nil, err
	}
	return p, nil
}

// AcceptInterest accepts a pending proposal and provisions a chat thread.
func (s *matchingService) AcceptInterest(ctx context.Context, receiverID, proposalID int64) (*models.ExpressInterest, error) {
	p, err := s.getInterest(ctx, proposalID)
	if err != nil {
		return nil, err
	}
	if p.RecipientUserID != receiverID {
		return nil, ErrUnauthorized
	}
	if p.Status != models.ProposalStatusPending {
		return nil, ErrInvalidStatusTransition
	}

	var threadID *int64
	if s.threadProv != nil {
		if thread, terr := s.threadProv.GetOrCreateThread(ctx, p.SenderUserID, p.RecipientUserID); terr == nil && thread != nil {
			threadID = &thread.ID
		}
	}

	row := s.pg.Pool.QueryRow(ctx, `
		UPDATE express_interests
		SET status = 1, chat_thread_id = COALESCE($1, chat_thread_id), updated_at = NOW()
		WHERE id = $2
		RETURNING `+interestCols+`
	`, threadID, proposalID)
	updated, err := s.scanInterest(row)
	if err != nil {
		return nil, err
	}

	s.notifier.Push(ctx, p.SenderUserID, "proposal_accepted", "Proposal accepted",
		"Your proposal has been accepted. You can now start chatting.", map[string]interface{}{
			"proposal_id": proposalID,
			"action_url":  "/messages/",
		})

	s.enrichInterests(ctx, []models.ExpressInterest{*updated})
	return updated, nil
}

// RejectInterest declines a pending proposal.
func (s *matchingService) RejectInterest(ctx context.Context, receiverID, proposalID int64, reason string) (*models.ExpressInterest, error) {
	p, err := s.getInterest(ctx, proposalID)
	if err != nil {
		return nil, err
	}
	if p.RecipientUserID != receiverID {
		return nil, ErrUnauthorized
	}
	if p.Status != models.ProposalStatusPending {
		return nil, ErrInvalidStatusTransition
	}

	row := s.pg.Pool.QueryRow(ctx, `
		UPDATE express_interests
		SET status = 2, decline_reason = NULLIF($1, ''), updated_at = NOW()
		WHERE id = $2
		RETURNING `+interestCols+`
	`, reason, proposalID)
	updated, err := s.scanInterest(row)
	if err != nil {
		return nil, err
	}

	s.notifier.Push(ctx, p.SenderUserID, "proposal_rejected", "Proposal update",
		"Your proposal was declined.", map[string]interface{}{
			"proposal_id": proposalID,
			"action_url":  "/proposals/?tab=sent",
		})

	s.enrichInterests(ctx, []models.ExpressInterest{*updated})
	return updated, nil
}

// WithdrawInterest withdraws a pending proposal by its sender.
func (s *matchingService) WithdrawInterest(ctx context.Context, senderID, proposalID int64) (*models.ExpressInterest, error) {
	p, err := s.getInterest(ctx, proposalID)
	if err != nil {
		return nil, err
	}
	if p.SenderUserID != senderID {
		return nil, ErrUnauthorized
	}
	if p.Status != models.ProposalStatusPending {
		return nil, ErrInvalidStatusTransition
	}

	row := s.pg.Pool.QueryRow(ctx, `
		UPDATE express_interests SET status = 3, updated_at = NOW()
		WHERE id = $1
		RETURNING `+interestCols+`
	`, proposalID)
	updated, err := s.scanInterest(row)
	if err != nil {
		return nil, err
	}
	s.enrichInterests(ctx, []models.ExpressInterest{*updated})
	return updated, nil
}

// AddShortlist bookmarks a candidate.
func (s *matchingService) AddShortlist(ctx context.Context, userID, candidateID int64) (*models.Shortlist, error) {
	if userID == candidateID {
		return nil, errors.New("cannot shortlist yourself")
	}
	var sl models.Shortlist
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO shortlists (user_id, user_id_target, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
		ON CONFLICT (user_id, user_id_target) DO UPDATE SET updated_at = NOW()
		RETURNING id, user_id, user_id_target, created_at
	`, userID, candidateID).Scan(&sl.ID, &sl.UserID, &sl.ShortlistedUserID, &sl.CreatedAt)
	if err != nil {
		return nil, err
	}
	if card, cerr := fetchCardByID(ctx, s.pg, candidateID); cerr == nil {
		sl.Candidate = card
	}
	return &sl, nil
}

// RemoveShortlist removes a bookmark.
func (s *matchingService) RemoveShortlist(ctx context.Context, userID, candidateID int64) error {
	tag, err := s.pg.Pool.Exec(ctx, `
		DELETE FROM shortlists WHERE user_id = $1 AND user_id_target = $2
	`, userID, candidateID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("shortlist entry not found")
	}
	return nil
}

// ListShortlists returns all bookmarks with candidate cards attached.
func (s *matchingService) ListShortlists(ctx context.Context, userID int64) ([]models.Shortlist, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, user_id, user_id_target, created_at
		FROM shortlists WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.Shortlist{}
	ids := []int64{}
	for rows.Next() {
		var sl models.Shortlist
		if err := rows.Scan(&sl.ID, &sl.UserID, &sl.ShortlistedUserID, &sl.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, sl)
		ids = append(ids, sl.ShortlistedUserID)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	cardMap, err := fetchCardsByIDs(ctx, s.pg, ids)
	if err == nil {
		for i := range out {
			out[i].Candidate = cardMap[out[i].ShortlistedUserID]
		}
	}
	return out, nil
}

// IgnoreUser hides a user from discovery and proposals.
func (s *matchingService) IgnoreUser(ctx context.Context, userID, targetUserID int64) error {
	_, err := s.pg.Pool.Exec(ctx, `
		INSERT INTO ignored_users (user_id, ignored_user, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
		ON CONFLICT (user_id, ignored_user) DO NOTHING
	`, userID, targetUserID)
	return err
}

// UnignoreUser removes a user from the ignore list.
func (s *matchingService) UnignoreUser(ctx context.Context, userID, targetUserID int64) error {
	_, err := s.pg.Pool.Exec(ctx, `
		DELETE FROM ignored_users WHERE user_id = $1 AND ignored_user = $2
	`, userID, targetUserID)
	return err
}

// ListIgnoredUsers returns ignored user IDs.
func (s *matchingService) ListIgnoredUsers(ctx context.Context, userID int64) ([]int64, error) {
	rows, err := s.pg.Pool.Query(ctx, `SELECT ignored_user FROM ignored_users WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []int64{}
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, rows.Err()
}
