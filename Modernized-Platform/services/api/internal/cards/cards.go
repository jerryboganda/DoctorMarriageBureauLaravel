// Package cards provides shared doctor-card queries used by discovery,
// matching, shortlists and the dashboard overview.
package cards

import (
	"context"
	"fmt"
	"strings"

	"github.com/doctormarriagebureau/api/internal/assets"
	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

// Filters narrows down candidate card listings.
type Filters struct {
	Gender     string
	MinAge     int
	MaxAge     int
	CityID     int64
	CountryID  int64
	StateID    int64
	ReligionID int64
	CasteID    int64
	SectID     int64
	Speciality string
	Degree     string
	MinHeight  float64
	MaxHeight  float64
	ExcludeIDs []int64
	OnlyIDs    []int64
	Search     string
	Limit      int
	Offset     int
}

var cardSelect = `
SELECT
	u.id,
	COALESCE(u.first_name, ''),
	COALESCE(u.last_name, ''),
	COALESCE(DATE_PART('year', AGE(m.birthday))::int, 0),
	` + GenderCanonicalSQL("m.gender") + `,
	COALESCE(edu.degree, ''),
	COALESCE(car.speciality, ''),
	COALESCE(ci.name, ''),
	COALESCE(co.name, ''),
	COALESCE(cst.name, ''),
	COALESCE(rel.name, ''),
	COALESCE(ms.name, ''),
	COALESCE(pa.height, 0),
	` + assets.PhotoSQLWithUserFallback("u.photo", "u.id") + `,
	(COALESCE(u.photo_approved, 0) = 0),
	(m.is_approved AND u.email_verified_at IS NOT NULL),
	COALESCE(m.travel_mode, false),
	COALESCE(m.travel_city, '')
FROM users u
JOIN members m ON m.user_id = u.id
LEFT JOIN LATERAL (
	SELECT c.speciality_id, COALESCE(s.name, c.designation, '') AS speciality
	FROM careers c
	LEFT JOIN specialities s ON s.id = c.speciality_id
	WHERE c.user_id = u.id
	ORDER BY c.present DESC, c.id DESC
	LIMIT 1
) car ON TRUE
LEFT JOIN LATERAL (
	SELECT e.degree
	FROM education e
	WHERE e.user_id = u.id
	ORDER BY e.is_highest_degree DESC, e.id DESC
	LIMIT 1
) edu ON TRUE
LEFT JOIN LATERAL (
	SELECT a.city_id, a.state_id, a.country_id
	FROM addresses a
	WHERE a.user_id = u.id AND a.type = 'present'
	ORDER BY a.id DESC
	LIMIT 1
) addr ON TRUE
LEFT JOIN cities ci ON ci.id = addr.city_id
LEFT JOIN countries co ON co.id = addr.country_id
LEFT JOIN spiritual_backgrounds sb ON sb.user_id = u.id
LEFT JOIN religions rel ON rel.id = sb.religion_id
LEFT JOIN castes cst ON cst.id = sb.caste_id
LEFT JOIN physical_attributes pa ON pa.user_id = u.id
LEFT JOIN marital_statuses ms ON ms.id = m.marital_status_id
`

// baseConditions returns the standard "listable member" conditions.
func baseConditions() []string {
	return []string{
		"u.user_type = 'member'",
		"u.deleted_at IS NULL",
		"COALESCE(u.blocked, false) = false",
		"COALESCE(u.deactivated, false) = false",
		"COALESCE(m.is_visible, true) = true",
	}
}

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func scanCard(row rowScanner) (*models.DoctorCard, error) {
	var c models.DoctorCard
	err := row.Scan(
		&c.UserID, &c.FirstName, &c.LastName, &c.Age, &c.Gender,
		&c.Degree, &c.Speciality, &c.CityName, &c.CountryName,
		&c.Caste, &c.Religion, &c.MaritalStatus, &c.Height,
		&c.ProfilePhotoURL, &c.IsPhotoBlurred, &c.IsVerified,
		&c.IsTravelMode, &c.TravelCity,
	)
	if err != nil {
		return nil, err
	}
	if canon := NormalizeGender(c.Gender); canon != "" {
		c.Gender = canon
	}
	return &c, nil
}

// FetchCards returns doctor cards matching the filters, plus a total count.
func FetchCards(ctx context.Context, pg *postgres.Client, f Filters) ([]models.DoctorCard, int64, error) {
	conds := baseConditions()
	args := []interface{}{}
	idx := 1

	addCond := func(condFmt string, val interface{}) {
		conds = append(conds, fmt.Sprintf(condFmt, idx))
		args = append(args, val)
		idx++
	}

	if canon := NormalizeGender(f.Gender); canon != "" {
		conds = append(conds, GenderEqualsSQL("m.gender", fmt.Sprintf("$%d", idx)))
		args = append(args, canon)
		idx++
	}
	if f.MinAge > 0 {
		addCond("DATE_PART('year', AGE(m.birthday)) >= $%d", f.MinAge)
	}
	if f.MaxAge > 0 {
		addCond("DATE_PART('year', AGE(m.birthday)) <= $%d", f.MaxAge)
	}
	if f.CityID > 0 {
		addCond("addr.city_id = $%d", f.CityID)
	}
	if f.StateID > 0 {
		addCond("addr.state_id = $%d", f.StateID)
	}
	if f.CountryID > 0 {
		addCond("addr.country_id = $%d", f.CountryID)
	}
	if f.ReligionID > 0 {
		addCond("sb.religion_id = $%d", f.ReligionID)
	}
	if f.CasteID > 0 {
		addCond("sb.caste_id = $%d", f.CasteID)
	}
	if f.SectID > 0 {
		addCond("sb.sect_id = $%d", f.SectID)
	}
	if f.Speciality != "" {
		addCond("car.speciality ILIKE '%%' || $%d || '%%'", f.Speciality)
	}
	if f.Degree != "" {
		addCond("edu.degree ILIKE '%%' || $%d || '%%'", f.Degree)
	}
	if f.MinHeight > 0 {
		addCond("pa.height >= $%d", f.MinHeight)
	}
	if f.MaxHeight > 0 {
		addCond("pa.height <= $%d", f.MaxHeight)
	}
	if f.Search != "" {
		conds = append(conds, fmt.Sprintf("(u.first_name ILIKE '%%' || $%d || '%%' OR u.last_name ILIKE '%%' || $%d || '%%' OR car.speciality ILIKE '%%' || $%d || '%%' OR ci.name ILIKE '%%' || $%d || '%%')", idx, idx, idx, idx))
		args = append(args, f.Search)
		idx++
	}
	if len(f.ExcludeIDs) > 0 {
		conds = append(conds, fmt.Sprintf("u.id != ALL($%d)", idx))
		args = append(args, f.ExcludeIDs)
		idx++
	}
	if len(f.OnlyIDs) > 0 {
		conds = append(conds, fmt.Sprintf("u.id = ANY($%d)", idx))
		args = append(args, f.OnlyIDs)
		idx++
	}

	where := "WHERE " + strings.Join(conds, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM (" + cardSelect + where + ") q"
	if err := pg.Pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := f.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	query := cardSelect + where +
		fmt.Sprintf(" ORDER BY COALESCE(u.membership,1) DESC, u.updated_at DESC LIMIT %d OFFSET %d", limit, f.Offset)

	rows, err := pg.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := []models.DoctorCard{}
	for rows.Next() {
		c, err := scanCard(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *c)
	}
	return out, total, rows.Err()
}

// FetchByIDs returns cards for specific user IDs keyed by user ID.
func FetchByIDs(ctx context.Context, pg *postgres.Client, ids []int64) (map[int64]*models.DoctorCard, error) {
	result := map[int64]*models.DoctorCard{}
	if len(ids) == 0 {
		return result, nil
	}
	query := cardSelect + " WHERE u.id = ANY($1)"
	rows, err := pg.Pool.Query(ctx, query, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		c, err := scanCard(rows)
		if err != nil {
			return nil, err
		}
		result[c.UserID] = c
	}
	return result, rows.Err()
}

// FetchOne returns a single card or nil when the user is not found.
func FetchOne(ctx context.Context, pg *postgres.Client, userID int64) (*models.DoctorCard, error) {
	m, err := FetchByIDs(ctx, pg, []int64{userID})
	if err != nil {
		return nil, err
	}
	return m[userID], nil
}

// NormalizeGender maps legacy numeric codes and labels onto male/female.
func NormalizeGender(g string) string {
	switch strings.ToLower(strings.TrimSpace(g)) {
	case "male", "m", "1":
		return "male"
	case "female", "f", "2":
		return "female"
	default:
		return ""
	}
}

// OppositeGender returns the opposite canonical gender, or "" if unknown.
func OppositeGender(g string) string {
	switch NormalizeGender(g) {
	case "male":
		return "female"
	case "female":
		return "male"
	default:
		return ""
	}
}

// GenderCanonicalSQL returns male/female for a gender column, including Laravel 1/2.
func GenderCanonicalSQL(column string) string {
	return fmt.Sprintf(`CASE
		WHEN LOWER(TRIM(COALESCE(%s, ''))) IN ('male', 'm', '1') THEN 'male'
		WHEN LOWER(TRIM(COALESCE(%s, ''))) IN ('female', 'f', '2') THEN 'female'
		ELSE LOWER(TRIM(COALESCE(%s, '')))
	END`, column, column, column)
}

// GenderEqualsSQL compares a gender column against a canonical male/female param,
// treating legacy Laravel values 1/2 as male/female.
func GenderEqualsSQL(column, param string) string {
	return "(" + GenderCanonicalSQL(column) + ") = " + param
}
