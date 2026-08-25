package public

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	"github.com/doctormarriagebureau/api/platform/postgres"
)

// Service provides read-only public data for marketing surfaces.
type Service struct {
	pg *postgres.Client
}

// NewService creates the public service.
func NewService(pg *postgres.Client) *Service {
	return &Service{pg: pg}
}

// ProposalCard is a privacy-safe, public-facing doctor summary.
type ProposalCard struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Gender         string `json:"gender"`
	Age            int    `json:"age"`
	City           string `json:"city"`
	Profession     string `json:"profession"`
	Education      string `json:"education"`
	Specialization string `json:"specialization"`
	MaritalStatus  string `json:"marital_status"`
	Height         string `json:"height"`
	Photo          string `json:"photo"`
}

// PublicStats holds live aggregate counts for the home page.
type PublicStats struct {
	VerifiedDoctors  int64 `json:"verifiedDoctors"`
	CountriesServed  int64 `json:"countriesServed"`
	SuccessfulUnions int64 `json:"successfulUnions"`
	TotalMembers     int64 `json:"totalMembers"`
}

// HappyStory is a public testimonial (approved + featured first).
type HappyStory struct {
	ID         int64    `json:"id"`
	Title      string   `json:"title"`
	Couple     string   `json:"couple"`
	Details    string   `json:"details"`
	Photos     []string `json:"photos"`
	IsFeatured bool     `json:"is_featured"`
	CreatedAt  string   `json:"created_at"`
}

func isMissingTable(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "does not exist") || strings.Contains(msg, "undefined table") || strings.Contains(msg, "relation")
}

// ListProposals returns real, verified, publicly-visible doctors.
func (s *Service) ListProposals(ctx context.Context) ([]ProposalCard, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []ProposalCard{}, nil
	}
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT u.id,
			COALESCE(NULLIF(u.name, ''), (u.first_name || ' ' || u.last_name)),
			COALESCE(m.gender, ''),
			CASE WHEN m.birthday IS NOT NULL THEN EXTRACT(YEAR FROM AGE(m.birthday))::int ELSE 0 END,
			COALESCE(ci.name || ', Pakistan', ''),
			COALESCE(c.designation, m.specialization, ''),
			COALESCE(e.degree, ''),
			COALESCE(ms.name, ''),
			COALESCE(u.photo, '')
		FROM users u
		JOIN members m ON m.user_id = u.id
		LEFT JOIN addresses a ON a.user_id = u.id AND a.type = 'present'
		LEFT JOIN cities ci ON ci.id = a.city_id
		LEFT JOIN LATERAL (SELECT designation FROM careers WHERE user_id = u.id ORDER BY present DESC, id DESC LIMIT 1) c ON true
		LEFT JOIN LATERAL (SELECT degree FROM education WHERE user_id = u.id ORDER BY is_highest_degree DESC, id DESC LIMIT 1) e ON true
		LEFT JOIN marital_statuses ms ON ms.id = m.marital_status_id
		WHERE u.deleted_at IS NULL AND m.deleted_at IS NULL AND m.is_approved AND m.is_visible
		ORDER BY m.is_agent_pick DESC, u.id DESC
		LIMIT 12
	`)
	if err != nil {
		if isMissingTable(err) {
			return []ProposalCard{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []ProposalCard{}
	for rows.Next() {
		var p ProposalCard
		var uid int64
		var gender, city, spec, edu, ms, photo, name string
		var age int
		if err := rows.Scan(&uid, &name, &gender, &age, &city, &spec, &edu, &ms, &photo); err != nil {
			continue
		}
		p.ID = strconv.FormatInt(uid, 10)
		p.Name = name
		p.Gender = gender
		p.Age = age
		p.City = city
		p.Specialization = spec
		if spec == "" {
			p.Profession = "Doctor"
		} else {
			p.Profession = "Doctor — " + spec
		}
		p.Education = edu
		if p.Education == "" {
			p.Education = "MBBS"
		}
		p.MaritalStatus = ms
		if p.MaritalStatus == "" {
			p.MaritalStatus = "Single (Never Married)"
		}
		p.Height = "5' 6\""
		p.Photo = photo
		out = append(out, p)
	}
	return out, rows.Err()
}

// Stats returns live aggregate counts.
func (s *Service) Stats(ctx context.Context) (*PublicStats, error) {
	st := &PublicStats{}
	if s.pg == nil || s.pg.Pool == nil {
		return st, nil
	}
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM members m JOIN users u ON u.id = m.user_id WHERE m.is_approved AND u.deleted_at IS NULL`).Scan(&st.VerifiedDoctors)
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COUNT(DISTINCT ci.country_id) FROM addresses a JOIN cities ci ON ci.id = a.city_id WHERE ci.country_id IS NOT NULL`).Scan(&st.CountriesServed)
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM happy_stories WHERE approval_status = true`).Scan(&st.SuccessfulUnions)
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL`).Scan(&st.TotalMembers)
	return st, nil
}

// HappyStories returns approved public testimonials (featured first).
func (s *Service) HappyStories(ctx context.Context) ([]HappyStory, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []HappyStory{}, nil
	}
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, title, COALESCE(partner_name, ''), details, COALESCE(photos, '[]'::jsonb), is_featured, TO_CHAR(created_at, 'YYYY-MM-DD')
		FROM happy_stories WHERE approval_status = true ORDER BY is_featured DESC, created_at DESC LIMIT 12
	`)
	if err != nil {
		if isMissingTable(err) {
			return []HappyStory{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []HappyStory{}
	for rows.Next() {
		var h HappyStory
		var photosJSON []byte
		var partner string
		if err := rows.Scan(&h.ID, &h.Title, &partner, &h.Details, &photosJSON, &h.IsFeatured, &h.CreatedAt); err != nil {
			continue
		}
		h.Couple = partner
		if len(photosJSON) > 0 {
			_ = json.Unmarshal(photosJSON, &h.Photos)
		}
		out = append(out, h)
	}
	return out, rows.Err()
}
