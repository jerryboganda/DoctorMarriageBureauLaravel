package discovery

import (
	"context"
	"encoding/json"
	"errors"
	"sort"
	"strconv"
	"time"

	"github.com/doctormarriagebureau/api/internal/assets"
	"github.com/doctormarriagebureau/api/internal/cards"
	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

// SearchFilter represents parametric search filters.
type SearchFilter struct {
	MinAge     int     `json:"min_age"`
	MaxAge     int     `json:"max_age"`
	CityID     int64   `json:"city_id"`
	CountryID  int64   `json:"country_id"`
	ReligionID int64   `json:"religion_id"`
	CasteID    int64   `json:"caste_id"`
	Speciality string  `json:"speciality"`
	Degree     string  `json:"degree"`
	Gender     string  `json:"gender"`
	MinHeight  float64 `json:"min_height"`
	MaxHeight  float64 `json:"max_height"`
	Search     string  `json:"search"`
	Limit      int     `json:"limit"`
	Offset     int     `json:"offset"`
}

// Service defines discovery and match intelligence business operations.
type Service interface {
	GetFeed(ctx context.Context, userID int64, feedType string, page, limit int) ([]models.DoctorCard, int64, error)
	Search(ctx context.Context, viewerID int64, filter SearchFilter) ([]models.DoctorCard, int64, error)
	GetMatchIntelligence(ctx context.Context, userID int64, candidateID int64) (*models.ScoreBreakdownDTO, error)
	UpdateMatchTuner(ctx context.Context, userID int64, weights models.PreferenceWeights) error
	ToggleAnonymous(ctx context.Context, userID int64) (bool, error)
	EnableTravelMode(ctx context.Context, userID int64, cityID, countryID int64, cityName, countryName string, durationDays int) (*models.TravelMode, error)
	DisableTravelMode(ctx context.Context, userID int64) error
}

type discoveryService struct {
	pg *postgres.Client
}

// NewDiscoveryService initializes the Postgres-backed Discovery Service.
func NewDiscoveryService(pg *postgres.Client) Service {
	return &discoveryService{pg: pg}
}

// loadExpectations builds PartnerExpectations from the partner_expectations row.
func (s *discoveryService) loadExpectations(ctx context.Context, userID int64) *models.PartnerExpectations {
	exp := &models.PartnerExpectations{UserID: userID}
	var (
		minAge, maxAge                    *int
		height                            *float64
		maritalStatusID, religionID       *int64
		casteID, prefCountryID, prefState *int64
		resCountryID                      *int64
		specPrefs                         []byte
		ageImp, hgtImp, marImp            *string
		relImp, langImp, resImp           *string
	)
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT min_age, max_age, height, marital_status_id, religion_id, caste_id,
		       preferred_country_id, preferred_state_id, residence_country_id,
		       COALESCE(speciality_preferences, '[]'::jsonb),
		       age_importance, height_importance, marital_status_importance,
		       religion_importance, language_importance, residence_importance
		FROM partner_expectations
		WHERE user_id = $1 AND deleted_at IS NULL
	`, userID).Scan(
		&minAge, &maxAge, &height, &maritalStatusID, &religionID, &casteID,
		&prefCountryID, &prefState, &resCountryID, &specPrefs,
		&ageImp, &hgtImp, &marImp, &relImp, &langImp, &resImp,
	)
	if err != nil {
		// Sensible defaults when no expectations set yet.
		exp.MinAge, exp.MaxAge = 22, 45
		return exp
	}

	if minAge != nil {
		exp.MinAge = *minAge
	}
	if maxAge != nil {
		exp.MaxAge = *maxAge
	}
	if height != nil {
		// Single target height widens into a band of ±0.5 ft.
		exp.MinHeight = *height - 0.5
		exp.MaxHeight = *height + 0.5
	}
	if religionID != nil {
		exp.ReligionID = *religionID
	}
	if casteID != nil {
		exp.CasteIDs = []int64{*casteID}
	}
	if prefCountryID != nil {
		exp.CountryIDs = append(exp.CountryIDs, *prefCountryID)
	}
	if resCountryID != nil && (prefCountryID == nil || *resCountryID != *prefCountryID) {
		exp.CountryIDs = append(exp.CountryIDs, *resCountryID)
	}
	if maritalStatusID != nil {
		var msName string
		if s.pg.Pool.QueryRow(ctx, `SELECT name FROM marital_statuses WHERE id = $1`, *maritalStatusID).Scan(&msName) == nil && msName != "" {
			exp.MaritalStatus = []string{msName}
		}
	}
	if len(specPrefs) > 0 {
		_ = json.Unmarshal(specPrefs, &exp.PreferredSpecialities)
	}

	imp := func(v *string) models.ImportanceLevel {
		if v == nil {
			return ""
		}
		return models.ImportanceLevel(*v)
	}
	exp.Weights = models.PreferenceWeights{
		AgeWeight:           imp(ageImp),
		HeightWeight:        imp(hgtImp),
		MaritalStatusWeight: imp(marImp),
		ReligionWeight:      imp(relImp),
		LanguageCasteWeight: imp(langImp),
		LocationWeight:      imp(resImp),
	}
	return exp
}

// candidateRow captures scoring inputs alongside the doctor card.
type candidateRow struct {
	card models.DoctorCard
	prof CandidateProfile
}

// fetchCandidates returns opposite-gender, visible, non-excluded candidates with scoring fields.
func (s *discoveryService) fetchCandidates(ctx context.Context, viewerID int64, feedType string, limit, offset int) ([]candidateRow, error) {
	var viewerGender string
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(gender, '') FROM members WHERE user_id = $1`, viewerID).Scan(&viewerGender)
	oppositeGender := cards.OppositeGender(viewerGender)

	query := `
		SELECT
			u.id, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''),
			COALESCE(DATE_PART('year', AGE(m.birthday))::int, 0),
			` + cards.GenderCanonicalSQL("m.gender") + `,
			COALESCE(edu.degree, ''), COALESCE(car.speciality, ''),
			COALESCE(ci.name, ''), COALESCE(co.name, ''),
			COALESCE(cst.name, ''), COALESCE(rel.name, ''),
			COALESCE(ms.name, ''), COALESCE(pa.height, 0),
			` + assets.PhotoSQLWithUserFallback("u.photo", "u.id") + `,
			(COALESCE(u.photo_approved, 0) = 0),
			(m.is_approved AND u.email_verified_at IS NOT NULL),
			(COALESCE(m.travel_mode, false) AND (m.travel_expires_at IS NULL OR m.travel_expires_at > NOW())),
			COALESCE(m.travel_city, ''),
			COALESCE(sb.religion_id, 0), COALESCE(sb.sect_id, 0), COALESCE(sb.caste_id, 0),
			COALESCE(addr.city_id, 0), COALESCE(addr.state_id, 0), COALESCE(addr.country_id, 0)
		FROM users u
		JOIN members m ON m.user_id = u.id
		LEFT JOIN LATERAL (
			SELECT c.speciality_id, COALESCE(s2.name, c.designation, '') AS speciality
			FROM careers c LEFT JOIN specialities s2 ON s2.id = c.speciality_id
			WHERE c.user_id = u.id ORDER BY c.present DESC, c.id DESC LIMIT 1
		) car ON TRUE
		LEFT JOIN LATERAL (
			SELECT e.degree FROM education e WHERE e.user_id = u.id
			ORDER BY e.is_highest_degree DESC, e.id DESC LIMIT 1
		) edu ON TRUE
		LEFT JOIN LATERAL (
			SELECT a.city_id, a.state_id, a.country_id FROM addresses a
			WHERE a.user_id = u.id AND a.type = 'present' ORDER BY a.id DESC LIMIT 1
		) addr ON TRUE
		LEFT JOIN cities ci ON ci.id = addr.city_id
		LEFT JOIN countries co ON co.id = addr.country_id
		LEFT JOIN spiritual_backgrounds sb ON sb.user_id = u.id
		LEFT JOIN religions rel ON rel.id = sb.religion_id
		LEFT JOIN castes cst ON cst.id = sb.caste_id
		LEFT JOIN physical_attributes pa ON pa.user_id = u.id
		LEFT JOIN marital_statuses ms ON ms.id = m.marital_status_id
		LEFT JOIN field_visibility_settings fvs ON fvs.user_id = u.id AND fvs.field_name = '_global'
		WHERE u.user_type = 'member'
		  AND u.id != $1
		  AND u.deleted_at IS NULL
		  AND COALESCE(u.blocked, false) = false
		  AND COALESCE(u.deactivated, false) = false
		  AND COALESCE(m.is_visible, true) = true
		  AND COALESCE(fvs.is_anonymous, false) = false
		  AND NOT EXISTS (
			SELECT 1 FROM ignored_users ig
			WHERE (ig.user_id = $1 AND ig.ignored_user = u.id) OR (ig.user_id = u.id AND ig.ignored_user = $1)
		  )
	`
	args := []interface{}{viewerID}
	if oppositeGender != "" {
		query += ` AND ` + cards.GenderEqualsSQL("m.gender", "$2")
		args = append(args, oppositeGender)
	}
	if feedType == "travel" {
		query += ` AND COALESCE(m.travel_mode, false) = true AND (m.travel_expires_at IS NULL OR m.travel_expires_at > NOW())`
	}

	switch feedType {
	case "new":
		query += ` ORDER BY u.created_at DESC`
	case "travel":
		query += ` ORDER BY u.updated_at DESC`
	default:
		query += ` ORDER BY COALESCE(u.membership, 1) DESC, u.updated_at DESC`
	}
	query += ` LIMIT ` + strconv.Itoa(limit) + ` OFFSET ` + strconv.Itoa(offset)

	rows, err := s.pg.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []candidateRow{}
	for rows.Next() {
		var cr candidateRow
		c := &cr.card
		p := &cr.prof
		if err := rows.Scan(
			&c.UserID, &c.FirstName, &c.LastName, &c.Age, &c.Gender,
			&c.Degree, &c.Speciality, &c.CityName, &c.CountryName,
			&c.Caste, &c.Religion, &c.MaritalStatus, &c.Height,
			&c.ProfilePhotoURL, &c.IsPhotoBlurred, &c.IsVerified,
			&c.IsTravelMode, &c.TravelCity,
			&p.ReligionID, &p.SectID, &p.CasteID,
			&p.CityID, &p.StateID, &p.CountryID,
		); err != nil {
			return nil, err
		}
		p.UserID = c.UserID
		p.Age = c.Age
		p.ReligionName = c.Religion
		p.CasteName = c.Caste
		p.CityName = c.CityName
		p.CountryName = c.CountryName
		p.MaritalStatus = c.MaritalStatus
		p.Height = c.Height
		p.Degree = c.Degree
		p.Speciality = c.Speciality
		if canon := cards.NormalizeGender(c.Gender); canon != "" {
			c.Gender = canon
		}
		out = append(out, cr)
	}
	return out, rows.Err()
}

func (s *discoveryService) countCandidates(ctx context.Context, viewerID int64, feedType string) (int64, error) {
	var viewerGender string
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(gender, '') FROM members WHERE user_id = $1`, viewerID).Scan(&viewerGender)
	oppositeGender := cards.OppositeGender(viewerGender)

	query := `
		SELECT COUNT(*)
		FROM users u
		JOIN members m ON m.user_id = u.id
		LEFT JOIN field_visibility_settings fvs ON fvs.user_id = u.id AND fvs.field_name = '_global'
		WHERE u.user_type = 'member'
		  AND u.id != $1
		  AND u.deleted_at IS NULL
		  AND COALESCE(u.blocked, false) = false
		  AND COALESCE(u.deactivated, false) = false
		  AND COALESCE(m.is_visible, true) = true
		  AND COALESCE(fvs.is_anonymous, false) = false
		  AND NOT EXISTS (
			SELECT 1 FROM ignored_users ig
			WHERE (ig.user_id = $1 AND ig.ignored_user = u.id) OR (ig.user_id = u.id AND ig.ignored_user = $1)
		  )
	`
	args := []interface{}{viewerID}
	if oppositeGender != "" {
		query += ` AND ` + cards.GenderEqualsSQL("m.gender", "$2")
		args = append(args, oppositeGender)
	}
	if feedType == "travel" {
		query += ` AND COALESCE(m.travel_mode, false) = true AND (m.travel_expires_at IS NULL OR m.travel_expires_at > NOW())`
	}

	var total int64
	if err := s.pg.Pool.QueryRow(ctx, query, args...).Scan(&total); err != nil {
		return 0, err
	}
	return total, nil
}

// GetFeed returns one numbered page of personalized doctor cards.
func (s *discoveryService) GetFeed(ctx context.Context, userID int64, feedType string, page, limit int) ([]models.DoctorCard, int64, error) {
	if limit <= 0 || limit > 50 {
		limit = 12
	}
	if page <= 0 {
		page = 1
	}

	total, err := s.countCandidates(ctx, userID, feedType)
	if err != nil {
		return nil, 0, err
	}
	last := int64(1)
	if total > 0 {
		last = (total + int64(limit) - 1) / int64(limit)
	}
	if int64(page) > last {
		page = int(last)
	}
	offset := (page - 1) * limit

	rowsData, err := s.fetchCandidates(ctx, userID, feedType, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	exp := s.loadExpectations(ctx, userID)
	result := make([]models.DoctorCard, 0, len(rowsData))
	for i := range rowsData {
		breakdown := CalculateCompatibility(exp, &rowsData[i].prof, nil)
		card := rowsData[i].card
		card.CompatibilityScore = breakdown.TotalScore
		card.ScoreBreakdown = &breakdown
		result = append(result, card)
	}

	if feedType == "" || feedType == "recommended" {
		sort.SliceStable(result, func(i, j int) bool {
			si, sj := result[i], result[j]
			if si.ScoreBreakdown != nil && sj.ScoreBreakdown != nil &&
				si.ScoreBreakdown.DealbreakerViolated != sj.ScoreBreakdown.DealbreakerViolated {
				return !si.ScoreBreakdown.DealbreakerViolated
			}
			return si.CompatibilityScore > sj.CompatibilityScore
		})
	}

	return result, total, nil
}

// Search performs parametric candidate search.
func (s *discoveryService) Search(ctx context.Context, viewerID int64, filter SearchFilter) ([]models.DoctorCard, int64, error) {
	f := cards.Filters{
		Gender:     filter.Gender,
		MinAge:     filter.MinAge,
		MaxAge:     filter.MaxAge,
		CityID:     filter.CityID,
		CountryID:  filter.CountryID,
		ReligionID: filter.ReligionID,
		CasteID:    filter.CasteID,
		Speciality: filter.Speciality,
		Degree:     filter.Degree,
		MinHeight:  filter.MinHeight,
		MaxHeight:  filter.MaxHeight,
		Search:     filter.Search,
		Limit:      filter.Limit,
		Offset:     filter.Offset,
	}
	if viewerID > 0 {
		f.ExcludeIDs = []int64{viewerID}
		if f.Gender == "" {
			var viewerGender string
			_ = s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(gender, '') FROM members WHERE user_id = $1`, viewerID).Scan(&viewerGender)
			f.Gender = cards.OppositeGender(viewerGender)
		}
	}
	return cards.FetchCards(ctx, s.pg, f)
}

// GetMatchIntelligence explains compatibility factors for a candidate.
func (s *discoveryService) GetMatchIntelligence(ctx context.Context, userID int64, candidateID int64) (*models.ScoreBreakdownDTO, error) {
	rowsData, err := s.fetchCandidateByID(ctx, candidateID)
	if err != nil {
		return nil, err
	}
	exp := s.loadExpectations(ctx, userID)
	breakdown := CalculateCompatibility(exp, &rowsData.prof, nil)
	return &breakdown, nil
}

// fetchCandidateByID loads one candidate's scoring profile.
func (s *discoveryService) fetchCandidateByID(ctx context.Context, candidateID int64) (*candidateRow, error) {
	var cr candidateRow
	c := &cr.card
	p := &cr.prof
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT
			u.id, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''),
			COALESCE(DATE_PART('year', AGE(m.birthday))::int, 0),
			`+cards.GenderCanonicalSQL("m.gender")+`,
			COALESCE(edu.degree, ''), COALESCE(car.speciality, ''),
			COALESCE(ci.name, ''), COALESCE(co.name, ''),
			COALESCE(cst.name, ''), COALESCE(rel.name, ''),
			COALESCE(ms.name, ''), COALESCE(pa.height, 0),
			COALESCE(sb.religion_id, 0), COALESCE(sb.sect_id, 0), COALESCE(sb.caste_id, 0),
			COALESCE(addr.city_id, 0), COALESCE(addr.state_id, 0), COALESCE(addr.country_id, 0)
		FROM users u
		JOIN members m ON m.user_id = u.id
		LEFT JOIN LATERAL (
			SELECT c2.speciality_id, COALESCE(s2.name, c2.designation, '') AS speciality
			FROM careers c2 LEFT JOIN specialities s2 ON s2.id = c2.speciality_id
			WHERE c2.user_id = u.id ORDER BY c2.present DESC, c2.id DESC LIMIT 1
		) car ON TRUE
		LEFT JOIN LATERAL (
			SELECT e.degree FROM education e WHERE e.user_id = u.id
			ORDER BY e.is_highest_degree DESC, e.id DESC LIMIT 1
		) edu ON TRUE
		LEFT JOIN LATERAL (
			SELECT a.city_id, a.state_id, a.country_id FROM addresses a
			WHERE a.user_id = u.id AND a.type = 'present' ORDER BY a.id DESC LIMIT 1
		) addr ON TRUE
		LEFT JOIN cities ci ON ci.id = addr.city_id
		LEFT JOIN countries co ON co.id = addr.country_id
		LEFT JOIN spiritual_backgrounds sb ON sb.user_id = u.id
		LEFT JOIN religions rel ON rel.id = sb.religion_id
		LEFT JOIN castes cst ON cst.id = sb.caste_id
		LEFT JOIN physical_attributes pa ON pa.user_id = u.id
		LEFT JOIN marital_statuses ms ON ms.id = m.marital_status_id
		WHERE u.id = $1
	`, candidateID).Scan(
		&c.UserID, &c.FirstName, &c.LastName, &c.Age, &c.Gender,
		&c.Degree, &c.Speciality, &c.CityName, &c.CountryName,
		&c.Caste, &c.Religion, &c.MaritalStatus, &c.Height,
		&p.ReligionID, &p.SectID, &p.CasteID,
		&p.CityID, &p.StateID, &p.CountryID,
	)
	if err != nil {
		return nil, errors.New("candidate not found")
	}
	p.UserID = c.UserID
	p.Age = c.Age
	p.ReligionName = c.Religion
	p.CasteName = c.Caste
	p.CityName = c.CityName
	p.CountryName = c.CountryName
	p.MaritalStatus = c.MaritalStatus
	p.Height = c.Height
	p.Degree = c.Degree
	p.Speciality = c.Speciality
	if canon := cards.NormalizeGender(c.Gender); canon != "" {
		c.Gender = canon
	}
	return &cr, nil
}

// UpdateMatchTuner persists the 6-factor importance weights.
func (s *discoveryService) UpdateMatchTuner(ctx context.Context, userID int64, weights models.PreferenceWeights) error {
	valid := map[models.ImportanceLevel]bool{
		"": true, models.ImportanceDealbreaker: true, models.ImportanceMustHave: true,
		models.ImportanceNiceToHave: true, models.ImportanceFlexible: true,
	}
	for _, wgt := range []models.ImportanceLevel{
		weights.AgeWeight, weights.ReligionWeight, weights.LocationWeight,
		weights.MaritalStatusWeight, weights.HeightWeight, weights.LanguageCasteWeight,
	} {
		if !valid[wgt] {
			return errors.New("invalid importance level: " + string(wgt))
		}
	}

	_, err := s.pg.Pool.Exec(ctx, `
		INSERT INTO partner_expectations (
			user_id, age_importance, religion_importance, residence_importance,
			marital_status_importance, height_importance, language_importance,
			created_at, updated_at
		) VALUES ($1, NULLIF($2,''), NULLIF($3,''), NULLIF($4,''), NULLIF($5,''), NULLIF($6,''), NULLIF($7,''), NOW(), NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			age_importance = EXCLUDED.age_importance,
			religion_importance = EXCLUDED.religion_importance,
			residence_importance = EXCLUDED.residence_importance,
			marital_status_importance = EXCLUDED.marital_status_importance,
			height_importance = EXCLUDED.height_importance,
			language_importance = EXCLUDED.language_importance,
			updated_at = NOW()
	`, userID,
		string(weights.AgeWeight), string(weights.ReligionWeight), string(weights.LocationWeight),
		string(weights.MaritalStatusWeight), string(weights.HeightWeight), string(weights.LanguageCasteWeight),
	)
	return err
}

// ToggleAnonymous flips incognito mode.
func (s *discoveryService) ToggleAnonymous(ctx context.Context, userID int64) (bool, error) {
	var newState bool
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO field_visibility_settings (user_id, field_name, is_visible, is_anonymous, created_at, updated_at)
		VALUES ($1, '_global', true, true, NOW(), NOW())
		ON CONFLICT (user_id, field_name) DO UPDATE SET
			is_anonymous = NOT COALESCE(field_visibility_settings.is_anonymous, false),
			updated_at = NOW()
		RETURNING is_anonymous
	`, userID).Scan(&newState)
	return newState, err
}

// EnableTravelMode sets a temporary location override.
func (s *discoveryService) EnableTravelMode(ctx context.Context, userID int64, cityID, countryID int64, cityName, countryName string, durationDays int) (*models.TravelMode, error) {
	if durationDays <= 0 || durationDays > 90 {
		durationDays = 14
	}

	resolvedCity := cityName
	if resolvedCity == "" && cityID > 0 {
		_ = s.pg.Pool.QueryRow(ctx, `SELECT name FROM cities WHERE id = $1`, cityID).Scan(&resolvedCity)
	}
	if countryName == "" && countryID > 0 {
		_ = s.pg.Pool.QueryRow(ctx, `SELECT name FROM countries WHERE id = $1`, countryID).Scan(&countryName)
	}

	expiresAt := time.Now().AddDate(0, 0, durationDays)
	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE members SET
			travel_mode = true,
			travel_city = $1,
			travel_country = $2,
			travel_expires_at = $3,
			updated_at = NOW()
		WHERE user_id = $4
	`, resolvedCity, countryName, expiresAt, userID)
	if err != nil {
		return nil, err
	}

	return &models.TravelMode{
		UserID:    userID,
		CityID:    cityID,
		CityName:  resolvedCity,
		CountryID: countryID,
		ExpiresAt: expiresAt,
		IsActive:  true,
	}, nil
}

// DisableTravelMode clears the temporary location override.
func (s *discoveryService) DisableTravelMode(ctx context.Context, userID int64) error {
	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE members SET
			travel_mode = false,
			travel_city = NULL,
			travel_country = NULL,
			travel_expires_at = NULL,
			updated_at = NOW()
		WHERE user_id = $1
	`, userID)
	return err
}
