package progression

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/doctormarriagebureau/api/internal/cards"
	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

var (
	ErrProgressionNotFound = errors.New("progression not found")
	ErrNotOwner            = errors.New("you do not own this progression")
	ErrStageNotFound       = errors.New("stage not found")
)

// Service defines courtship progression business logic.
type Service interface {
	GetStages(ctx context.Context) ([]models.ProgressionStage, error)
	ListProgressions(ctx context.Context, userID int64) ([]models.MemberProgression, error)
	GetActiveProgression(ctx context.Context, userID int64) (*models.MemberProgression, error)
	GetProgression(ctx context.Context, userID, progressionID int64) (*models.MemberProgression, error)
	StartCourtship(ctx context.Context, userID, partnerID int64) (*models.MemberProgression, error)
	UpdateStage(ctx context.Context, progressionID, userID, stageID int64, notes string) (*models.MemberProgression, error)
	CreateChecklistItem(ctx context.Context, progressionID, userID int64, title string) (*models.ProgressionChecklistItem, error)
	ToggleChecklistItem(ctx context.Context, itemID, userID int64, isCompleted bool) (*models.ProgressionChecklistItem, error)
	AddVenueItem(ctx context.Context, progressionID, userID int64, name, venueType, notes string, estimatedCost float64) (*models.ProgressionVenueItem, error)
	AddBudgetItem(ctx context.Context, progressionID, userID int64, label, category string, amount float64, notes string) (*models.ProgressionBudgetItem, error)
	AddEvent(ctx context.Context, progressionID, userID int64, title, eventAt, location, notes string) (*models.ProgressionEvent, error)
}

type progressionService struct {
	pg *postgres.Client
}

// NewProgressionService initializes the Postgres-backed progression service.
func NewProgressionService(pg *postgres.Client) Service {
	return &progressionService{pg: pg}
}

// GetStages returns all configured stages in order.
func (s *progressionService) GetStages(ctx context.Context) ([]models.ProgressionStage, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, COALESCE(slug, ''), name, COALESCE("order", 0), COALESCE(progress_percent, 0), COALESCE(description, '')
		FROM progression_stages ORDER BY "order" ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.ProgressionStage{}
	for rows.Next() {
		var st models.ProgressionStage
		if err := rows.Scan(&st.ID, &st.Slug, &st.Name, &st.OrderIndex, &st.ProgressPercent, &st.Description); err != nil {
			return nil, err
		}
		out = append(out, st)
	}
	return out, rows.Err()
}

const progressionCols = `
	mp.id, mp.user_id, mp.partner_id, mp.current_stage_id,
	COALESCE(ps.slug, ''), COALESCE(ps.name, ''), COALESCE(mp.total_progress_percent, 0),
	mp.status, COALESCE(mp.next_steps, ''), mp.created_at, mp.updated_at
`

func scanProgression(row interface{ Scan(...interface{}) error }) (*models.MemberProgression, error) {
	var p models.MemberProgression
	var stageID *int64
	err := row.Scan(
		&p.ID, &p.UserID, &p.PartnerID, &stageID,
		&p.StageSlug, &p.StageName, &p.ProgressPercent,
		&p.Status, &p.Notes, &p.StartedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if stageID != nil {
		p.CurrentStageID = *stageID
	}
	return &p, nil
}

// ListProgressions returns all of a user's journeys with partner cards.
func (s *progressionService) ListProgressions(ctx context.Context, userID int64) ([]models.MemberProgression, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT `+progressionCols+`
		FROM member_progressions mp
		LEFT JOIN progression_stages ps ON ps.id = mp.current_stage_id
		WHERE mp.user_id = $1 OR mp.partner_id = $1
		ORDER BY mp.updated_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.MemberProgression{}
	partnerIDs := []int64{}
	for rows.Next() {
		p, err := scanProgression(rows)
		if err != nil {
			return nil, err
		}
		// Normalize so "partner" is always the other person.
		if p.UserID != userID && p.PartnerID == userID {
			p.UserID, p.PartnerID = userID, p.UserID
		}
		out = append(out, *p)
		partnerIDs = append(partnerIDs, p.PartnerID)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	cardMap, cerr := cards.FetchByIDs(ctx, s.pg, partnerIDs)
	if cerr == nil {
		for i := range out {
			if card := cardMap[out[i].PartnerID]; card != nil {
				out[i].Partner = card
				out[i].PartnerName = card.FirstName + " " + card.LastName
			}
		}
	}
	return out, nil
}

// GetActiveProgression returns the most recently updated active journey with full detail.
func (s *progressionService) GetActiveProgression(ctx context.Context, userID int64) (*models.MemberProgression, error) {
	row := s.pg.Pool.QueryRow(ctx, `
		SELECT `+progressionCols+`
		FROM member_progressions mp
		LEFT JOIN progression_stages ps ON ps.id = mp.current_stage_id
		WHERE (mp.user_id = $1 OR mp.partner_id = $1) AND mp.status = 'active'
		ORDER BY mp.updated_at DESC
		LIMIT 1
	`, userID)
	p, err := scanProgression(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProgressionNotFound
		}
		return nil, err
	}
	if p.UserID != userID && p.PartnerID == userID {
		p.UserID, p.PartnerID = userID, p.UserID
	}
	return s.hydrate(ctx, p)
}

// GetProgression returns one journey (must be a participant) with full detail.
func (s *progressionService) GetProgression(ctx context.Context, userID, progressionID int64) (*models.MemberProgression, error) {
	row := s.pg.Pool.QueryRow(ctx, `
		SELECT `+progressionCols+`
		FROM member_progressions mp
		LEFT JOIN progression_stages ps ON ps.id = mp.current_stage_id
		WHERE mp.id = $1
	`, progressionID)
	p, err := scanProgression(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProgressionNotFound
		}
		return nil, err
	}
	if p.UserID != userID && p.PartnerID != userID {
		return nil, ErrNotOwner
	}
	if p.PartnerID == userID {
		p.UserID, p.PartnerID = userID, p.UserID
	}
	return s.hydrate(ctx, p)
}

// hydrate loads partner card, checklist, venues, budget and events.
func (s *progressionService) hydrate(ctx context.Context, p *models.MemberProgression) (*models.MemberProgression, error) {
	if card, err := cards.FetchOne(ctx, s.pg, p.PartnerID); err == nil && card != nil {
		p.Partner = card
		p.PartnerName = card.FirstName + " " + card.LastName
	}

	clRows, err := s.pg.Pool.Query(ctx, `
		SELECT id, member_progression_id, title, is_completed, completed_at, created_at
		FROM progression_checklist_items WHERE member_progression_id = $1 ORDER BY sort_order, id
	`, p.ID)
	if err == nil {
		defer clRows.Close()
		for clRows.Next() {
			var it models.ProgressionChecklistItem
			if clRows.Scan(&it.ID, &it.ProgressionID, &it.Title, &it.IsCompleted, &it.CompletedAt, &it.CreatedAt) == nil {
				p.ChecklistItems = append(p.ChecklistItems, it)
			}
		}
	}

	vRows, err := s.pg.Pool.Query(ctx, `
		SELECT id, member_progression_id, name, COALESCE(venue_type, ''), COALESCE(estimated_cost, 0),
		       COALESCE(rating, 0), COALESCE(status, 'shortlisted'), visited_at, COALESCE(notes, ''), created_at
		FROM progression_venues WHERE member_progression_id = $1 ORDER BY id
	`, p.ID)
	if err == nil {
		defer vRows.Close()
		for vRows.Next() {
			var v models.ProgressionVenueItem
			if vRows.Scan(&v.ID, &v.ProgressionID, &v.Name, &v.VenueType, &v.EstimatedCost, &v.Rating, &v.Status, &v.VisitedAt, &v.Notes, &v.CreatedAt) == nil {
				p.Venues = append(p.Venues, v)
			}
		}
	}

	bRows, err := s.pg.Pool.Query(ctx, `
		SELECT id, member_progression_id, label, COALESCE(amount, 0), COALESCE(category, ''),
		       COALESCE(status, 'planned'), COALESCE(notes, ''), created_at
		FROM progression_budget_items WHERE member_progression_id = $1 ORDER BY id
	`, p.ID)
	if err == nil {
		defer bRows.Close()
		for bRows.Next() {
			var b models.ProgressionBudgetItem
			if bRows.Scan(&b.ID, &b.ProgressionID, &b.Label, &b.Amount, &b.Category, &b.Status, &b.Notes, &b.CreatedAt) == nil {
				p.BudgetItems = append(p.BudgetItems, b)
			}
		}
	}

	eRows, err := s.pg.Pool.Query(ctx, `
		SELECT id, member_progression_id, title, event_at, COALESCE(location, ''),
		       COALESCE(status, 'scheduled'), COALESCE(notes, ''), created_at
		FROM progression_events WHERE member_progression_id = $1 ORDER BY event_at DESC NULLS LAST, id DESC
	`, p.ID)
	if err == nil {
		defer eRows.Close()
		for eRows.Next() {
			var e models.ProgressionEvent
			if eRows.Scan(&e.ID, &e.ProgressionID, &e.Title, &e.EventAt, &e.Location, &e.Status, &e.Notes, &e.CreatedAt) == nil {
				p.Events = append(p.Events, e)
			}
		}
	}

	return p, nil
}

// requireParticipant verifies membership in the progression.
func (s *progressionService) requireParticipant(ctx context.Context, progressionID, userID int64) error {
	var count int
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM member_progressions WHERE id = $1 AND (user_id = $2 OR partner_id = $2)
	`, progressionID, userID).Scan(&count)
	if err != nil {
		return err
	}
	if count == 0 {
		return ErrProgressionNotFound
	}
	return nil
}

// StartCourtship begins a new journey with a partner at the first stage.
func (s *progressionService) StartCourtship(ctx context.Context, userID, partnerID int64) (*models.MemberProgression, error) {
	if userID == partnerID {
		return nil, errors.New("cannot start a courtship with yourself")
	}

	var stageID int64
	var progressPercent int
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT id, COALESCE(progress_percent, 0) FROM progression_stages ORDER BY "order" ASC LIMIT 1
	`).Scan(&stageID, &progressPercent)
	if err != nil {
		return nil, errors.New("no progression stages configured")
	}

	var existingID int64
	err = s.pg.Pool.QueryRow(ctx, `
		SELECT id FROM member_progressions
		WHERE (user_id = $1 AND partner_id = $2) OR (user_id = $2 AND partner_id = $1)
		LIMIT 1
	`, userID, partnerID).Scan(&existingID)
	if err == nil {
		return nil, errors.New("a courtship journey with this partner already exists")
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	var newID int64
	err = s.pg.Pool.QueryRow(ctx, `
		INSERT INTO member_progressions (user_id, partner_id, current_stage_id, status, total_progress_percent, created_at, updated_at)
		VALUES ($1, $2, $3, 'active', $4, NOW(), NOW())
		RETURNING id
	`, userID, partnerID, stageID, progressPercent).Scan(&newID)
	if err != nil {
		return nil, err
	}
	return s.GetProgression(ctx, userID, newID)
}

// UpdateStage moves a journey to another stage.
func (s *progressionService) UpdateStage(ctx context.Context, progressionID, userID, stageID int64, notes string) (*models.MemberProgression, error) {
	if err := s.requireParticipant(ctx, progressionID, userID); err != nil {
		return nil, err
	}

	var progressPercent int
	var stageName string
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT COALESCE(progress_percent, 0), name FROM progression_stages WHERE id = $1
	`, stageID).Scan(&progressPercent, &stageName)
	if err != nil {
		return nil, ErrStageNotFound
	}

	status := "active"
	if progressPercent >= 100 {
		status = "completed"
	}

	_, err = s.pg.Pool.Exec(ctx, `
		UPDATE member_progressions
		SET current_stage_id = $1, total_progress_percent = $2, status = $3,
		    next_steps = COALESCE(NULLIF($4, ''), next_steps), updated_at = NOW()
		WHERE id = $5
	`, stageID, progressPercent, status, notes, progressionID)
	if err != nil {
		return nil, err
	}

	_, _ = s.pg.Pool.Exec(ctx, `
		INSERT INTO progression_events (member_progression_id, title, event_at, status, notes, created_at, updated_at)
		VALUES ($1, $2, NOW(), 'completed', NULLIF($3, ''), NOW(), NOW())
	`, progressionID, "Moved to stage: "+stageName, notes)

	return s.GetProgression(ctx, userID, progressionID)
}

// CreateChecklistItem adds a checklist task.
func (s *progressionService) CreateChecklistItem(ctx context.Context, progressionID, userID int64, title string) (*models.ProgressionChecklistItem, error) {
	if title == "" {
		return nil, errors.New("title is required")
	}
	if err := s.requireParticipant(ctx, progressionID, userID); err != nil {
		return nil, err
	}
	var it models.ProgressionChecklistItem
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO progression_checklist_items (member_progression_id, title, is_completed, sort_order, created_by, updated_by, created_at, updated_at)
		VALUES ($1, $2, false, COALESCE((SELECT MAX(sort_order) + 1 FROM progression_checklist_items WHERE member_progression_id = $1), 1), $3, $3, NOW(), NOW())
		RETURNING id, member_progression_id, title, is_completed, completed_at, created_at
	`, progressionID, title, userID).Scan(&it.ID, &it.ProgressionID, &it.Title, &it.IsCompleted, &it.CompletedAt, &it.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &it, nil
}

// ToggleChecklistItem marks a checklist task complete/incomplete.
func (s *progressionService) ToggleChecklistItem(ctx context.Context, itemID, userID int64, isCompleted bool) (*models.ProgressionChecklistItem, error) {
	var it models.ProgressionChecklistItem
	err := s.pg.Pool.QueryRow(ctx, `
		UPDATE progression_checklist_items pci
		SET is_completed = $1,
		    completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
		    updated_by = $2, updated_at = NOW()
		FROM member_progressions mp
		WHERE pci.id = $3 AND mp.id = pci.member_progression_id AND (mp.user_id = $2 OR mp.partner_id = $2)
		RETURNING pci.id, pci.member_progression_id, pci.title, pci.is_completed, pci.completed_at, pci.created_at
	`, isCompleted, userID, itemID).Scan(&it.ID, &it.ProgressionID, &it.Title, &it.IsCompleted, &it.CompletedAt, &it.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("checklist item not found")
		}
		return nil, err
	}
	return &it, nil
}

// AddVenueItem records a venue idea.
func (s *progressionService) AddVenueItem(ctx context.Context, progressionID, userID int64, name, venueType, notes string, estimatedCost float64) (*models.ProgressionVenueItem, error) {
	if name == "" {
		return nil, errors.New("venue name is required")
	}
	if err := s.requireParticipant(ctx, progressionID, userID); err != nil {
		return nil, err
	}
	var v models.ProgressionVenueItem
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO progression_venues (member_progression_id, name, venue_type, estimated_cost, status, notes, created_at, updated_at)
		VALUES ($1, $2, NULLIF($3, ''), $4, 'shortlisted', NULLIF($5, ''), NOW(), NOW())
		RETURNING id, member_progression_id, name, COALESCE(venue_type, ''), COALESCE(estimated_cost, 0), COALESCE(rating, 0), status, visited_at, COALESCE(notes, ''), created_at
	`, progressionID, name, venueType, estimatedCost, notes).Scan(
		&v.ID, &v.ProgressionID, &v.Name, &v.VenueType, &v.EstimatedCost, &v.Rating, &v.Status, &v.VisitedAt, &v.Notes, &v.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

// AddBudgetItem records a budget line.
func (s *progressionService) AddBudgetItem(ctx context.Context, progressionID, userID int64, label, category string, amount float64, notes string) (*models.ProgressionBudgetItem, error) {
	if label == "" {
		return nil, errors.New("budget label is required")
	}
	if err := s.requireParticipant(ctx, progressionID, userID); err != nil {
		return nil, err
	}
	var b models.ProgressionBudgetItem
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO progression_budget_items (member_progression_id, label, amount, category, status, notes, created_at, updated_at)
		VALUES ($1, $2, $3, NULLIF($4, ''), 'planned', NULLIF($5, ''), NOW(), NOW())
		RETURNING id, member_progression_id, label, COALESCE(amount, 0), COALESCE(category, ''), status, COALESCE(notes, ''), created_at
	`, progressionID, label, amount, category, notes).Scan(
		&b.ID, &b.ProgressionID, &b.Label, &b.Amount, &b.Category, &b.Status, &b.Notes, &b.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// AddEvent schedules a milestone (meeting, call, family dinner).
func (s *progressionService) AddEvent(ctx context.Context, progressionID, userID int64, title, eventAt, location, notes string) (*models.ProgressionEvent, error) {
	if title == "" {
		return nil, errors.New("event title is required")
	}
	if err := s.requireParticipant(ctx, progressionID, userID); err != nil {
		return nil, err
	}
	var e models.ProgressionEvent
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO progression_events (member_progression_id, title, event_at, location, status, notes, created_at, updated_at)
		VALUES ($1, $2, NULLIF($3, '')::timestamptz, NULLIF($4, ''), 'scheduled', NULLIF($5, ''), NOW(), NOW())
		RETURNING id, member_progression_id, title, event_at, COALESCE(location, ''), status, COALESCE(notes, ''), created_at
	`, progressionID, title, eventAt, location, notes).Scan(
		&e.ID, &e.ProgressionID, &e.Title, &e.EventAt, &e.Location, &e.Status, &e.Notes, &e.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &e, nil
}
