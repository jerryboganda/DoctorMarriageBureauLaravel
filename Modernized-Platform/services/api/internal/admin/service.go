package admin

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/doctormarriagebureau/api/internal/assets"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

// ---------- Models matching frontend admin.ts ----------
type AdminStats struct {
	TotalDoctors         int64   `json:"totalDoctors"`
	VerifiedDoctors      int64   `json:"verifiedDoctors"`
	VerifiedPercentage   float64 `json:"verifiedPercentage"`
	TotalRevenuePkr      float64 `json:"totalRevenuePkr"`
	PendingVerifications int64   `json:"pendingVerifications"`
	PendingPayments      int64   `json:"pendingPayments"`
	ActiveProposals      int64   `json:"activeProposals"`
	OpenTickets          int64   `json:"openTickets"`
}

type AdminDoctor struct {
	ID               int64   `json:"id"`
	UserID           int64   `json:"user_id"`
	Name             string  `json:"name"`
	FirstName        string  `json:"first_name"`
	LastName         string  `json:"last_name"`
	Email            string  `json:"email"`
	Phone            string  `json:"phone"`
	Gender           string  `json:"gender"`
	Age              int     `json:"age"`
	Degree           string  `json:"degree"`
	Speciality       string  `json:"speciality"`
	SubSpeciality    string  `json:"sub_speciality,omitempty"`
	Hospital         string  `json:"hospital"`
	CityName         string  `json:"city_name"`
	CountryName      string  `json:"country_name"`
	PMDCNumber       string  `json:"pmdc_number"`
	PMDCStatus       string  `json:"pmdc_status"`
	PMDCDocumentURL  string  `json:"pmdc_document_url,omitempty"`
	PackageID        int64   `json:"package_id"`
	PackageName      string  `json:"package_name"`
	TempPassword     string  `json:"temp_password,omitempty"`
	Status           string  `json:"status"`
	PhotoApproved    bool    `json:"photo_approved"`
	Avatar           string  `json:"avatar"`
	CreatedAt        string  `json:"created_at"`
	LastActive       string  `json:"last_active"`
	AdminNotes       string  `json:"admin_notes,omitempty"`
	MaritalStatus    string  `json:"marital_status"`
	Religion         string  `json:"religion"`
	Caste            string  `json:"caste"`
	HeightCm         float64 `json:"height_cm"`
	About            string  `json:"about"`
}

type AdminVerification struct {
	ID              int64  `json:"id"`
	DoctorID        int64  `json:"doctor_id"`
	DoctorName      string `json:"doctor_name"`
	Avatar          string `json:"avatar"`
	Speciality      string `json:"speciality"`
	Hospital        string `json:"hospital"`
	City            string `json:"city"`
	PMDCNumber      string `json:"pmdc_number"`
	DocumentType    string `json:"document_type"`
	DocumentURL     string `json:"document_url"`
	SubmittedAt     string `json:"submitted_at"`
	Status          string `json:"status"`
	RejectionReason string `json:"rejection_reason,omitempty"`
	ReviewedAt      string `json:"reviewed_at,omitempty"`
	ReviewedBy      string `json:"reviewed_by,omitempty"`
}

type AdminPayment struct {
	ID            int64   `json:"id"`
	DoctorID      int64   `json:"doctor_id"`
	DoctorName    string  `json:"doctor_name"`
	DoctorEmail   string  `json:"doctor_email"`
	Avatar        string  `json:"avatar"`
	PackageID     int64   `json:"package_id"`
	PackageName   string  `json:"package_name"`
	AmountPkr     float64 `json:"amount_pkr"`
	PaymentMethod string  `json:"payment_method"`
	TransactionID string  `json:"transaction_id"`
	ProofImage    string  `json:"proof_image"`
	Status        string  `json:"status"`
	SubmittedAt   string  `json:"submitted_at"`
	AdminNotes    string  `json:"admin_notes,omitempty"`
	ReviewedAt    string  `json:"reviewed_at,omitempty"`
}

type AdminProposal struct {
	ID                int64  `json:"id"`
	SenderID          int64  `json:"sender_id"`
	SenderName        string `json:"sender_name"`
	SenderAvatar      string `json:"sender_avatar"`
	SenderSpecialty   string `json:"sender_specialty"`
	SenderCity        string `json:"sender_city"`
	RecipientID       int64  `json:"recipient_id"`
	RecipientName     string `json:"recipient_name"`
	RecipientAvatar   string `json:"recipient_avatar"`
	RecipientSpecialty string `json:"recipient_specialty"`
	RecipientCity     string `json:"recipient_city"`
	Status            string `json:"status"`
	MatchPercentage   int    `json:"match_percentage"`
	CreatedAt         string `json:"created_at"`
	Notes             string `json:"notes,omitempty"`
}

type AdminPackage struct {
	ID             int64    `json:"id"`
	Name           string   `json:"name"`
	Tagline        string   `json:"tagline"`
	PricePkr       float64  `json:"price_pkr"`
	DurationDays   int      `json:"duration_days"`
	ProposalQuota  int      `json:"proposal_quota"`
	ContactUnlocks int      `json:"contact_unlocks"`
	BadgeColor     string   `json:"badge_color"`
	IsFeatured     bool     `json:"is_featured"`
	IsActive       bool     `json:"is_active"`
	Perks          []string `json:"perks"`
}

type AdminTicket struct {
	ID              int64  `json:"id"`
	TicketNumber    string `json:"ticket_number"`
	ReporterID      int64  `json:"reporter_id"`
	ReporterName    string `json:"reporter_name"`
	ReporterEmail   string `json:"reporter_email"`
	ReportedID      *int64 `json:"reported_id,omitempty"`
	ReportedName    string `json:"reported_name,omitempty"`
	Type            string `json:"type"`
	Priority        string `json:"priority"`
	Subject         string `json:"subject"`
	Description     string `json:"description"`
	Status          string `json:"status"`
	CreatedAt       string `json:"created_at"`
	AdminResolution string `json:"admin_resolution,omitempty"`
}

type AdminHappyStory struct {
	ID           int64  `json:"id"`
	CoupleTitle  string `json:"couple_title"`
	GroomName    string `json:"groom_name"`
	GroomSpecialty string `json:"groom_specialty"`
	BrideName    string `json:"bride_name"`
	BrideSpecialty string `json:"bride_specialty"`
	MarriageDate string `json:"marriage_date"`
	City         string `json:"city"`
	Story        string `json:"story"`
	PhotoURL     string `json:"photo_url"`
	Status       string `json:"status"`
	CreatedAt    string `json:"created_at"`
	IsFeatured   bool   `json:"is_featured"`
}

type AdminSystemSettings struct {
	Specialties     []string `json:"specialties"`
	Cities          []string `json:"cities"`
	Hospitals       []string `json:"hospitals"`
	Sects           []string `json:"sects"`
	Castes          []string `json:"castes"`
	MaintenanceMode bool     `json:"maintenance_mode"`
	AutoApprovePMDC bool     `json:"auto_approve_pmdc"`
	EmergencyNotice string   `json:"emergency_notice"`
	ContactPhone    string   `json:"contact_phone"`
	ContactEmail    string   `json:"contact_email"`
	ContactWhatsapp string   `json:"contact_whatsapp"`
}

// Service holds admin business logic.
type Service struct {
	pg *postgres.Client
}

// NewService creates admin service.
func NewService(pg *postgres.Client) *Service {
	return &Service{pg: pg}
}

func isMissingTable(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "does not exist") || strings.Contains(msg, "relation") && strings.Contains(msg, "does not exist")
}

func timeToString(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

func nullableTimeToString(t *time.Time) string {
	if t == nil || t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

// IsAdmin checks if user is admin via membership=3 or user_type='admin'.
// Returns false without error if user not found; logs for read paths.
func (s *Service) IsAdmin(ctx context.Context, userID int64) (bool, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return false, nil
	}
	var isAdmin bool
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM users WHERE id=$1 AND (membership=3 OR LOWER(COALESCE(user_type,'')) IN ('admin', 'staff'))
		)
	`, userID).Scan(&isAdmin)
	if err != nil {
		if isMissingTable(err) {
			return false, nil
		}
		return false, err
	}
	return isAdmin, nil
}

// GetStats returns live counts.
func (s *Service) GetStats(ctx context.Context) (*AdminStats, error) {
	stats := &AdminStats{}
	if s.pg == nil || s.pg.Pool == nil {
		return stats, nil
	}
	// totalDoctors
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE user_type='member' AND deleted_at IS NULL`).Scan(&stats.TotalDoctors)
	// verifiedDoctors
	if err := s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM members WHERE is_approved = true`).Scan(&stats.VerifiedDoctors); err != nil && !isMissingTable(err) {
		slog.Warn("admin stats verifiedDoctors query failed", "error", err)
	}
	// pending verifications = members not approved
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM members WHERE COALESCE(is_approved,false)=false`).Scan(&stats.PendingVerifications)
	// pending payments
	if err := s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM package_payments WHERE payment_status IN ('under_review','pending')`).Scan(&stats.PendingPayments); err != nil && !isMissingTable(err) {
		slog.Warn("admin stats pendingPayments failed", "error", err)
	}
	// total revenue
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount),0) FROM package_payments WHERE payment_status IN ('completed','approved')`).Scan(&stats.TotalRevenuePkr)
	// active proposals (pending interests)
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM express_interests WHERE status = 0`).Scan(&stats.ActiveProposals)
	// open tickets
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM support_tickets WHERE status IN ('open','pending','in_progress') AND deleted_at IS NULL`).Scan(&stats.OpenTickets)

	if stats.TotalDoctors > 0 {
		stats.VerifiedPercentage = float64(stats.VerifiedDoctors) / float64(stats.TotalDoctors) * 100
		// round to 1 decimal
		stats.VerifiedPercentage = float64(int(stats.VerifiedPercentage*10+0.5)) / 10
	}
	return stats, nil
}

// doctorSelectSQL returns base select for admin doctors with joins.
func doctorSelectSQL() string {
	avatarSQL := assets.PhotoSQLWithUserFallback("u.photo", "u.id")
	return `
	SELECT
		u.id,
		u.id,
		COALESCE(NULLIF(TRIM(COALESCE(u.name,'')),''), TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), 'Dr. Unknown'),
		COALESCE(u.first_name,''),
		COALESCE(u.last_name,''),
		COALESCE(u.email,''),
		COALESCE(u.phone,''),
		COALESCE(m.gender,''),
		COALESCE(DATE_PART('year', AGE(COALESCE(m.birthday, NOW() - INTERVAL '30 years')))::int, 0),
		COALESCE(edu.degree,''),
		COALESCE(car.speciality,''),
		COALESCE(car.company,''),
		COALESCE(ci.name,''),
		COALESCE(co.name,''),
		COALESCE(m.medical_license_number,''),
		CASE WHEN COALESCE(m.is_approved,false)=true THEN 'verified' WHEN COALESCE(u.photo_approved,1)=0 THEN 'pending' ELSE 'pending' END,
		COALESCE(m.verification_document,''),
		COALESCE(m.current_package_id,0),
		COALESCE(pkg.name,''),
		CASE WHEN COALESCE(u.blocked,false)=true OR COALESCE(u.deactivated,false)=true THEN 'suspended' WHEN COALESCE(m.is_approved,false)=true THEN 'active' ELSE 'pending' END,
		(COALESCE(u.photo_approved,1)=1),
		` + avatarSQL + `,
		u.created_at,
		COALESCE(u.updated_at, u.created_at),
		COALESCE(ms.name,''),
		COALESCE(rel.name,''),
		COALESCE(cst.name,''),
		COALESCE(pa.height,0),
		COALESCE(fam.about_description,'')
	FROM users u
	LEFT JOIN members m ON m.user_id = u.id
	LEFT JOIN LATERAL (
		SELECT e.degree FROM education e WHERE e.user_id = u.id ORDER BY e.is_highest_degree DESC, e.id DESC LIMIT 1
	) edu ON true
	LEFT JOIN LATERAL (
		SELECT c.designation, c.company, COALESCE(s.name, c.designation, c.company, '') AS speciality
		FROM careers c LEFT JOIN specialities s ON s.id = c.speciality_id
		WHERE c.user_id = u.id ORDER BY c.present DESC, c.id DESC LIMIT 1
	) car ON true
	LEFT JOIN LATERAL (
		SELECT a.city_id, a.country_id FROM addresses a WHERE a.user_id = u.id AND a.type='present' ORDER BY a.id DESC LIMIT 1
	) addr ON true
	LEFT JOIN cities ci ON ci.id = addr.city_id
	LEFT JOIN countries co ON co.id = addr.country_id
	LEFT JOIN physical_attributes pa ON pa.user_id = u.id
	LEFT JOIN spiritual_backgrounds sb ON sb.user_id = u.id
	LEFT JOIN religions rel ON rel.id = sb.religion_id
	LEFT JOIN castes cst ON cst.id = sb.caste_id
	LEFT JOIN marital_statuses ms ON ms.id = m.marital_status_id
	LEFT JOIN packages pkg ON pkg.id = m.current_package_id
	LEFT JOIN families fam ON fam.user_id = u.id
	`
}

func scanDoctor(rows pgx.Row) (*AdminDoctor, error) {
	var d AdminDoctor
	var createdAt, updatedAt time.Time
	var age int
	var height float64
	var photoApproved bool
	err := rows.Scan(
		&d.ID,
		&d.UserID,
		&d.Name,
		&d.FirstName,
		&d.LastName,
		&d.Email,
		&d.Phone,
		&d.Gender,
		&age,
		&d.Degree,
		&d.Speciality,
		&d.Hospital,
		&d.CityName,
		&d.CountryName,
		&d.PMDCNumber,
		&d.PMDCStatus,
		&d.PMDCDocumentURL,
		&d.PackageID,
		&d.PackageName,
		&d.Status,
		&photoApproved,
		&d.Avatar,
		&createdAt,
		&updatedAt,
		&d.MaritalStatus,
		&d.Religion,
		&d.Caste,
		&height,
		&d.About,
	)
	if err != nil {
		return nil, err
	}
	d.Age = age
	d.HeightCm = height
	d.PhotoApproved = photoApproved
	d.CreatedAt = timeToString(createdAt)
	d.LastActive = timeToString(updatedAt)
	// normalize gender
	switch strings.ToLower(strings.TrimSpace(d.Gender)) {
	case "m", "male", "1":
		d.Gender = "male"
	case "f", "female", "2":
		d.Gender = "female"
	default:
		if d.Gender == "" {
			d.Gender = "male"
		}
	}
	if d.PMDCStatus == "" {
		d.PMDCStatus = "pending"
	}
	if d.Status == "" {
		d.Status = "pending"
	}
	return &d, nil
}

// ListDoctors returns all doctors for admin.
func (s *Service) ListDoctors(ctx context.Context) ([]AdminDoctor, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []AdminDoctor{}, nil
	}
	query := doctorSelectSQL() + ` WHERE u.user_type='member' AND u.deleted_at IS NULL ORDER BY u.created_at DESC LIMIT 500`
	rows, err := s.pg.Pool.Query(ctx, query)
	if err != nil {
		if isMissingTable(err) {
			return []AdminDoctor{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []AdminDoctor{}
	for rows.Next() {
		d, err := scanDoctor(rows)
		if err != nil {
			continue
		}
		out = append(out, *d)
	}
	return out, rows.Err()
}

// GetDoctorByID fetches single doctor.
func (s *Service) GetDoctorByID(ctx context.Context, id int64) (*AdminDoctor, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return nil, errors.New("database unavailable")
	}
	query := doctorSelectSQL() + ` WHERE u.id=$1 AND u.deleted_at IS NULL LIMIT 1`
	row := s.pg.Pool.QueryRow(ctx, query, id)
	d, err := scanDoctor(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("doctor not found")
		}
		return nil, err
	}
	return d, nil
}

// CreateDoctor inserts a new doctor member.
func (s *Service) CreateDoctor(ctx context.Context, in AdminDoctor) (*AdminDoctor, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return nil, errors.New("database unavailable")
	}
	if strings.TrimSpace(in.Email) == "" {
		return nil, errors.New("email is required")
	}
	// Check duplicate
	var exists bool
	_ = s.pg.Pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email)=LOWER($1) AND deleted_at IS NULL)`, in.Email).Scan(&exists)
	if exists {
		return nil, errors.New("email already exists")
	}
	// Generate a secure random initial password; force a reset on first login.
	password := randomPassword()
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return nil, err
	}
	var userID int64
	now := time.Now()
	firstName := in.FirstName
	lastName := in.LastName
	if firstName == "" && lastName == "" && in.Name != "" {
		parts := strings.Fields(in.Name)
		if len(parts) > 0 {
			firstName = parts[0]
		}
		if len(parts) > 1 {
			lastName = strings.Join(parts[1:], " ")
		}
	}
	gender := in.Gender
	if gender == "" {
		gender = "male"
	}
	err = s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		if err := tx.QueryRow(ctx, `
			INSERT INTO users (first_name, last_name, name, email, phone, password, user_type, membership, approved, blocked, deactivated, photo, photo_approved, email_verified_at, must_change_password, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,'member',1,true,false,false,'',1,NOW(),true,$7,$7) RETURNING id
		`, firstName, lastName, strings.TrimSpace(firstName+" "+lastName), in.Email, in.Phone, string(hash), now).Scan(&userID); err != nil {
			return err
		}
		code := fmt.Sprintf("DMB-%06d", userID)
		_, _ = tx.Exec(ctx, `UPDATE users SET code=$1 WHERE id=$2`, code, userID)
		// members
		var pkgID *int64
		if in.PackageID > 0 {
			pkgID = &in.PackageID
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO members (user_id, gender, medical_license_number, verification_document, current_package_id, is_approved, is_visible, onboarding_completed, remaining_interest, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,false,true,false,5,$6,$6)
		`, userID, gender, in.PMDCNumber, in.PMDCDocumentURL, pkgID, now)
		if err != nil {
			return err
		}
		// physical
		if in.HeightCm > 0 {
			_, _ = tx.Exec(ctx, `INSERT INTO physical_attributes (user_id, height, created_at, updated_at) VALUES ($1,$2,$3,$3) ON CONFLICT (user_id) DO UPDATE SET height=EXCLUDED.height, updated_at=$3`, userID, in.HeightCm, now)
		} else {
			_, _ = tx.Exec(ctx, `INSERT INTO physical_attributes (user_id, created_at, updated_at) VALUES ($1,$2,$2) ON CONFLICT (user_id) DO NOTHING`, userID, now)
		}
		// education
		if in.Degree != "" {
			_, _ = tx.Exec(ctx, `INSERT INTO education (user_id, degree, institution, is_highest_degree, created_at, updated_at) VALUES ($1,$2,'',true,$3,$3)`, userID, in.Degree, now)
		}
		// careers
		if in.Speciality != "" || in.Hospital != "" {
			_, _ = tx.Exec(ctx, `INSERT INTO careers (user_id, designation, company, present, created_at, updated_at) VALUES ($1,$2,$3,true,$4,$4)`, userID, in.Speciality, in.Hospital, now)
		}
		// addresses if city provided
		if in.CityName != "" {
			// lookup city id
			var cityID *int64
			var cid int64
			if err := tx.QueryRow(ctx, `SELECT id FROM cities WHERE LOWER(name)=LOWER($1) LIMIT 1`, in.CityName).Scan(&cid); err == nil {
				cityID = &cid
			}
			if cityID != nil {
				var stateID, countryID *int64
				var sid, coid sqlNullInt64
				_ = tx.QueryRow(ctx, `SELECT state_id, country_id FROM cities WHERE id=$1`, *cityID).Scan(&sid, &coid)
				if sid.Valid {
					v := sid.Int64
					stateID = &v
				}
				if coid.Valid {
					v := coid.Int64
					countryID = &v
				}
				_, _ = tx.Exec(ctx, `INSERT INTO addresses (user_id, type, city_id, state_id, country_id, created_at, updated_at) VALUES ($1,'present',$2,$3,$4,$5,$5) ON CONFLICT (user_id, type) DO UPDATE SET city_id=EXCLUDED.city_id, state_id=EXCLUDED.state_id, country_id=EXCLUDED.country_id, updated_at=EXCLUDED.updated_at`, userID, cityID, stateID, countryID, now)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	d, err := s.GetDoctorByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	d.TempPassword = password
	return d, nil
}

// randomPassword returns a cryptographically secure random password (16 chars).
func randomPassword() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$"
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		// Fallback (extremely unlikely) to a time-seeded value.
		return fmt.Sprintf("%d%x", time.Now().UnixNano(), []byte("dmb"))
	}
	out := make([]byte, len(b))
	for i, c := range b {
		out[i] = charset[int(c)%len(charset)]
	}
	return string(out)
}

type sqlNullInt64 struct {
	Int64 int64
	Valid bool
}

func (n *sqlNullInt64) Scan(value interface{}) error {
	if value == nil {
		n.Valid = false
		return nil
	}
	switch v := value.(type) {
	case int64:
		n.Int64 = v
		n.Valid = true
	case int32:
		n.Int64 = int64(v)
		n.Valid = true
	case int:
		n.Int64 = int64(v)
		n.Valid = true
	default:
		n.Valid = false
	}
	return nil
}

// UpdateDoctor updates doctor fields.
func (s *Service) UpdateDoctor(ctx context.Context, id int64, in AdminDoctor) (*AdminDoctor, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return nil, errors.New("database unavailable")
	}
	// Check exists
	var exists bool
	_ = s.pg.Pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1 AND deleted_at IS NULL)`, id).Scan(&exists)
	if !exists {
		return nil, errors.New("doctor not found")
	}
	firstName := in.FirstName
	lastName := in.LastName
	if firstName == "" && lastName == "" && in.Name != "" {
		parts := strings.Fields(in.Name)
		if len(parts) > 0 {
			firstName = parts[0]
		}
		if len(parts) > 1 {
			lastName = strings.Join(parts[1:], " ")
		}
	}
	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE users SET first_name=COALESCE(NULLIF($1,''), first_name), last_name=COALESCE(NULLIF($2,''), last_name), name= CASE WHEN $3<>'' THEN $3 ELSE name END, email=COALESCE(NULLIF($4,''), email), phone=COALESCE(NULLIF($5,''), phone), updated_at=NOW() WHERE id=$6
	`, firstName, lastName, strings.TrimSpace(firstName+" "+lastName), in.Email, in.Phone, id)
	if err != nil {
		return nil, err
	}
	// members update
	_, _ = s.pg.Pool.Exec(ctx, `
		INSERT INTO members (user_id, gender, medical_license_number, verification_document, current_package_id, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
		ON CONFLICT (user_id) DO UPDATE SET gender=COALESCE(NULLIF($2,''), members.gender), medical_license_number=COALESCE(NULLIF($3,''), members.medical_license_number), verification_document=COALESCE(NULLIF($4,''), members.verification_document), current_package_id=COALESCE($5, members.current_package_id), updated_at=NOW()
	`, id, in.Gender, in.PMDCNumber, in.PMDCDocumentURL, nullableInt64(in.PackageID))
	// physical height
	if in.HeightCm > 0 {
		_, _ = s.pg.Pool.Exec(ctx, `INSERT INTO physical_attributes (user_id, height, created_at, updated_at) VALUES ($1,$2,NOW(),NOW()) ON CONFLICT (user_id) DO UPDATE SET height=$2, updated_at=NOW()`, id, in.HeightCm)
	}
	// education
	if in.Degree != "" {
		_, _ = s.pg.Pool.Exec(ctx, `UPDATE education SET degree=$1, updated_at=NOW() WHERE user_id=$2`, in.Degree, id)
		if pgErr := s.pg.Pool.QueryRow(ctx, `SELECT 1 FROM education WHERE user_id=$1 LIMIT 1`, id).Scan(new(int)); errors.Is(pgErr, pgx.ErrNoRows) {
			_, _ = s.pg.Pool.Exec(ctx, `INSERT INTO education (user_id, degree, is_highest_degree, created_at, updated_at) VALUES ($1,$2,true,NOW(),NOW())`, id, in.Degree)
		}
	}
	// careers
	if in.Speciality != "" || in.Hospital != "" {
		_, _ = s.pg.Pool.Exec(ctx, `UPDATE careers SET designation=COALESCE(NULLIF($1,''), designation), company=COALESCE(NULLIF($2,''), company), updated_at=NOW() WHERE user_id=$3`, in.Speciality, in.Hospital, id)
		if pgErr := s.pg.Pool.QueryRow(ctx, `SELECT 1 FROM careers WHERE user_id=$1 LIMIT 1`, id).Scan(new(int)); errors.Is(pgErr, pgx.ErrNoRows) {
			_, _ = s.pg.Pool.Exec(ctx, `INSERT INTO careers (user_id, designation, company, present, created_at, updated_at) VALUES ($1,$2,$3,true,NOW(),NOW())`, id, in.Speciality, in.Hospital)
		}
	}
	// city
	if in.CityName != "" {
		var cityID int64
		if err := s.pg.Pool.QueryRow(ctx, `SELECT id FROM cities WHERE LOWER(name)=LOWER($1) LIMIT 1`, in.CityName).Scan(&cityID); err == nil {
			var stateID, countryID *int64
			var sid, coid sqlNullInt64
			_ = s.pg.Pool.QueryRow(ctx, `SELECT state_id, country_id FROM cities WHERE id=$1`, cityID).Scan(&sid, &coid)
			if sid.Valid {
				v := sid.Int64
				stateID = &v
			}
			if coid.Valid {
				v := coid.Int64
				countryID = &v
			}
			_, _ = s.pg.Pool.Exec(ctx, `INSERT INTO addresses (user_id, type, city_id, state_id, country_id, created_at, updated_at) VALUES ($1,'present',$2,$3,$4,NOW(),NOW()) ON CONFLICT (user_id, type) DO UPDATE SET city_id=EXCLUDED.city_id, state_id=EXCLUDED.state_id, country_id=EXCLUDED.country_id, updated_at=NOW()`, id, cityID, stateID, countryID)
		}
	}
	return s.GetDoctorByID(ctx, id)
}

func nullableInt64(v int64) *int64 {
	if v == 0 {
		return nil
	}
	return &v
}

// UpdateDoctorStatus toggles blocked/active.
func (s *Service) UpdateDoctorStatus(ctx context.Context, id int64, status string) error {
	if s.pg == nil || s.pg.Pool == nil {
		return errors.New("database unavailable")
	}
	switch strings.ToLower(status) {
	case "active":
		_, err := s.pg.Pool.Exec(ctx, `UPDATE users SET blocked=false, deactivated=false, approved=true, updated_at=NOW() WHERE id=$1`, id)
		if err != nil {
			return err
		}
		_, _ = s.pg.Pool.Exec(ctx, `UPDATE members SET is_approved=true, updated_at=NOW() WHERE user_id=$1`, id)
	case "suspended":
		_, err := s.pg.Pool.Exec(ctx, `UPDATE users SET blocked=true, updated_at=NOW() WHERE id=$1`, id)
		return err
	case "pending":
		_, err := s.pg.Pool.Exec(ctx, `UPDATE users SET blocked=false, deactivated=false, approved=false, updated_at=NOW() WHERE id=$1`, id)
		if err != nil {
			return err
		}
		_, _ = s.pg.Pool.Exec(ctx, `UPDATE members SET is_approved=false, updated_at=NOW() WHERE user_id=$1`, id)
	default:
		return errors.New("invalid status")
	}
	return nil
}

// DeleteDoctor soft deletes user.
func (s *Service) DeleteDoctor(ctx context.Context, id int64) error {
	if s.pg == nil || s.pg.Pool == nil {
		return errors.New("database unavailable")
	}
	_, err := s.pg.Pool.Exec(ctx, `UPDATE users SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, id)
	return err
}

// ListVerifications returns pending/approved verifications from members.
func (s *Service) ListVerifications(ctx context.Context) ([]AdminVerification, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []AdminVerification{}, nil
	}
	avatarSQL := assets.PhotoSQLWithUserFallback("u.photo", "u.id")
	docSQL := `COALESCE(
		NULLIF(` + assets.PhotoSQL("m.verification_document") + `, ''),
		NULLIF((
			SELECT CASE
				WHEN (elem->>'value') ~ '^[0-9]+$' THEN (
					SELECT CASE
						WHEN up.file_name LIKE '/%' THEN replace(up.file_name, '/public/uploads/', '/uploads/')
						WHEN up.file_name LIKE 'uploads/%' THEN '/' || up.file_name
						ELSE '/uploads/' || up.file_name
					END
					FROM uploads up WHERE up.id = (elem->>'value')::bigint LIMIT 1
				)
				WHEN (elem->>'value') LIKE '/%' THEN replace(elem->>'value', '/public/uploads/', '/uploads/')
				WHEN (elem->>'value') LIKE 'uploads/%' THEN '/' || (elem->>'value')
				WHEN (elem->>'value') != '' THEN '/uploads/' || (elem->>'value')
				ELSE ''
			END
			FROM jsonb_array_elements(CASE WHEN LEFT(LTRIM(COALESCE(u.verification_info, '')), 1) = '[' THEN u.verification_info::jsonb ELSE '[]'::jsonb END) elem
			WHERE (elem->>'type') = 'file' AND elem->>'value' IS NOT NULL AND elem->>'value' != ''
			LIMIT 1
		), ''),
		''
	)`
	pmdcSQL := `COALESCE(
		NULLIF(m.medical_license_number, ''),
		(
			SELECT elem->>'value'
			FROM jsonb_array_elements(CASE WHEN LEFT(LTRIM(COALESCE(u.verification_info, '')), 1) = '[' THEN u.verification_info::jsonb ELSE '[]'::jsonb END) elem
			WHERE (elem->>'type') IN ('text', 'string') AND elem->>'value' IS NOT NULL AND elem->>'value' != ''
			LIMIT 1
		),
		''
	)`
	query := `
	SELECT
		m.id,
		m.user_id,
		TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')),
		` + avatarSQL + `,
		COALESCE(car.speciality,''),
		COALESCE(car.company,''),
		COALESCE(ci.name,''),
		` + pmdcSQL + `,
		` + docSQL + `,
		m.created_at,
		COALESCE(NULLIF(m.verification_status,''), CASE WHEN COALESCE(m.is_approved,false)=true THEN 'approved' ELSE 'pending' END),
		COALESCE(m.rejection_reason, ''),
		COALESCE(m.reviewed_at, m.updated_at, m.created_at)
	FROM members m
	JOIN users u ON u.id=m.user_id AND u.deleted_at IS NULL
	LEFT JOIN LATERAL (
		SELECT c.company, COALESCE(s.name, c.designation,'') AS speciality
		FROM careers c LEFT JOIN specialities s ON s.id=c.speciality_id
		WHERE c.user_id=u.id ORDER BY c.present DESC, c.id DESC LIMIT 1
	) car ON true
	LEFT JOIN LATERAL (
		SELECT a.city_id FROM addresses a WHERE a.user_id=u.id AND a.type='present' ORDER BY a.id DESC LIMIT 1
	) addr ON true
	LEFT JOIN cities ci ON ci.id=addr.city_id
	ORDER BY CASE 
		WHEN COALESCE(m.verification_status, CASE WHEN COALESCE(m.is_approved,false)=true THEN 'approved' ELSE 'pending' END) = 'pending' THEN 0 
		WHEN COALESCE(m.verification_status, '') = 'rejected' THEN 1 
		ELSE 2 
	END, m.created_at DESC
	LIMIT 200
	`
	rows, err := s.pg.Pool.Query(ctx, query)
	if err != nil {
		if isMissingTable(err) {
			return []AdminVerification{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []AdminVerification{}
	for rows.Next() {
		var v AdminVerification
		var submittedAt, reviewedAt time.Time
		var status string
		err := rows.Scan(&v.ID, &v.DoctorID, &v.DoctorName, &v.Avatar, &v.Speciality, &v.Hospital, &v.City, &v.PMDCNumber, &v.DocumentURL, &submittedAt, &status, &v.RejectionReason, &reviewedAt)
		if err != nil {
			continue
		}
		v.SubmittedAt = timeToString(submittedAt)
		v.Status = status
		if status == "approved" || status == "rejected" {
			v.ReviewedAt = timeToString(reviewedAt)
		}
		v.DocumentType = "PMDC License Card"
		out = append(out, v)
	}
	return out, rows.Err()
}

// ReviewVerification approves or rejects a verification (updates members.is_approved and members.verification_status).
func (s *Service) ReviewVerification(ctx context.Context, id int64, status string, reason string) error {
	if s.pg == nil || s.pg.Pool == nil {
		return errors.New("database unavailable")
	}
	switch strings.ToLower(status) {
	case "approved":
		_, err := s.pg.Pool.Exec(ctx, `
			UPDATE members 
			SET is_approved=true, 
			    verification_status='approved', 
			    rejection_reason='', 
			    reviewed_at=NOW(), 
			    updated_at=NOW() 
			WHERE id=$1`, id)
		return err
	case "rejected":
		_, err := s.pg.Pool.Exec(ctx, `
			UPDATE members 
			SET is_approved=false, 
			    verification_status='rejected', 
			    rejection_reason=$2, 
			    reviewed_at=NOW(), 
			    updated_at=NOW() 
			WHERE id=$1`, id, strings.TrimSpace(reason))
		if err != nil {
			return err
		}
		slog.Info("verification rejected", "member_id", id, "reason", reason)
		return nil
	default:
		return errors.New("invalid review status")
	}
}

// ListPayments returns all package payments for admin.
func (s *Service) ListPayments(ctx context.Context) ([]AdminPayment, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []AdminPayment{}, nil
	}
	avatarSQL := assets.PhotoSQLWithUserFallback("u.photo", "u.id")
	proofSQL := assets.PhotoSQL("pp.custom_payment_proof")
	query := `
	SELECT
		pp.id,
		pp.user_id,
		TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')),
		COALESCE(u.email,''),
		` + avatarSQL + `,
		pp.package_id,
		COALESCE(pkg.name,''),
		COALESCE(pp.amount,0),
		COALESCE(pp.payment_method,''),
		COALESCE(pp.custom_payment_transaction_id, COALESCE(pp.payment_code,'')),
		` + proofSQL + `,
		CASE WHEN pp.payment_status IN ('completed','approved') THEN 'approved' WHEN pp.payment_status IN ('rejected','failed') THEN 'rejected' ELSE 'pending' END,
		pp.created_at,
		COALESCE(pp.custom_payment_details,''),
		pp.updated_at
	FROM package_payments pp
	JOIN users u ON u.id=pp.user_id
	LEFT JOIN packages pkg ON pkg.id=pp.package_id
	ORDER BY pp.created_at DESC
	LIMIT 200
	`
	rows, err := s.pg.Pool.Query(ctx, query)
	if err != nil {
		if isMissingTable(err) {
			return []AdminPayment{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []AdminPayment{}
	for rows.Next() {
		var p AdminPayment
		var submittedAt, reviewedAt time.Time
		var status string
		err := rows.Scan(&p.ID, &p.DoctorID, &p.DoctorName, &p.DoctorEmail, &p.Avatar, &p.PackageID, &p.PackageName, &p.AmountPkr, &p.PaymentMethod, &p.TransactionID, &p.ProofImage, &status, &submittedAt, &p.AdminNotes, &reviewedAt)
		if err != nil {
			continue
		}
		p.Status = status
		if p.PaymentMethod == "" {
			p.PaymentMethod = "Bank Transfer"
		} else {
			// normalize to frontend expected labels
			switch strings.ToLower(p.PaymentMethod) {
			case "jazzcash":
				p.PaymentMethod = "JazzCash"
			case "easypaisa":
				p.PaymentMethod = "EasyPaisa"
			case "bank_transfer", "bank":
				p.PaymentMethod = "Bank Transfer"
			case "stripe":
				p.PaymentMethod = "Stripe / Card"
			default:
				p.PaymentMethod = strings.Title(p.PaymentMethod)
			}
		}
		p.SubmittedAt = timeToString(submittedAt)
		if status != "pending" {
			p.ReviewedAt = timeToString(reviewedAt)
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// ReviewPayment approves or rejects a payment.
func (s *Service) ReviewPayment(ctx context.Context, id int64, status string, adminNotes string) error {
	if s.pg == nil || s.pg.Pool == nil {
		return errors.New("database unavailable")
	}
	var userID, packageID int64
	var currentStatus string
	err := s.pg.Pool.QueryRow(ctx, `SELECT user_id, package_id, payment_status FROM package_payments WHERE id=$1`, id).Scan(&userID, &packageID, &currentStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("payment not found")
		}
		return err
	}
	switch strings.ToLower(status) {
	case "approved":
		// Mark completed and provision package
		// Use similar logic to payments service completePayment but inline
		return s.completePaymentForAdmin(ctx, id, userID, packageID, adminNotes)
	case "rejected":
		_, err := s.pg.Pool.Exec(ctx, `UPDATE package_payments SET payment_status='rejected', custom_payment_details=COALESCE(NULLIF($1,''), custom_payment_details), updated_at=NOW() WHERE id=$2`, adminNotes, id)
		return err
	default:
		return errors.New("invalid payment review status")
	}
}

func (s *Service) completePaymentForAdmin(ctx context.Context, paymentID, userID, packageID int64, adminNotes string) error {
	// fetch package validity and limits
	var validity, expressInterest, contact, photoGallery, profileImageView, galleryImageView, profileViewersView int
	var price float64
	var pkgName string
	err := s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(name,''), COALESCE(price,0), COALESCE(validity,30), COALESCE(express_interest,0), COALESCE(contact,0), COALESCE(photo_gallery,0), COALESCE(profile_image_view,0), COALESCE(gallery_image_view,0), COALESCE(profile_viewers_view,0) FROM packages WHERE id=$1`, packageID).Scan(&pkgName, &price, &validity, &expressInterest, &contact, &photoGallery, &profileImageView, &galleryImageView, &profileViewersView)
	if err != nil {
		// fallback defaults
		validity = 90
		expressInterest = 30
	}
	membership := 2
	if price <= 0 {
		membership = 1
	}
	return s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `UPDATE package_payments SET payment_status='completed', custom_payment_details=COALESCE(NULLIF($1,''), custom_payment_details), updated_at=NOW() WHERE id=$2`, adminNotes, paymentID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			UPDATE members SET current_package_id=$1, package_validity=CURRENT_DATE + ($2 || ' days')::interval, remaining_interest=$3, remaining_contact_view=$4, remaining_photo_gallery=$5, remaining_profile_image_view=$6, remaining_gallery_image_view=$7, remaining_profile_viewer_view=$8, updated_at=NOW() WHERE user_id=$9
		`, packageID, validity, expressInterest, contact, photoGallery, profileImageView, galleryImageView, profileViewersView, userID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE users SET membership=$1, updated_at=NOW() WHERE id=$2`, membership, userID); err != nil {
			return err
		}
		return nil
	})
}

// ListProposals returns all proposals for admin.
func (s *Service) ListProposals(ctx context.Context) ([]AdminProposal, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []AdminProposal{}, nil
	}
	senderAvatarSQL := assets.PhotoSQLWithUserFallback("su.photo", "su.id")
	recipientAvatarSQL := assets.PhotoSQLWithUserFallback("ru.photo", "ru.id")
	query := `
	SELECT
		ei.id,
		ei.interested_by,
		TRIM(COALESCE(su.first_name,'') || ' ' || COALESCE(su.last_name,'')),
		` + senderAvatarSQL + `,
		COALESCE(scar.speciality,''),
		COALESCE(sci.name,''),
		ei.user_id,
		TRIM(COALESCE(ru.first_name,'') || ' ' || COALESCE(ru.last_name,'')),
		` + recipientAvatarSQL + `,
		COALESCE(rcar.speciality,''),
		COALESCE(rci.name,''),
		CASE ei.status WHEN 0 THEN 'pending' WHEN 1 THEN 'accepted' WHEN 2 THEN 'declined' WHEN 3 THEN 'declined' ELSE 'pending' END,
		COALESCE(pm.match_percentage,0),
		ei.created_at,
		COALESCE(ei.message,'')
	FROM express_interests ei
	JOIN users su ON su.id=ei.interested_by
	JOIN users ru ON ru.id=ei.user_id
	LEFT JOIN LATERAL (SELECT COALESCE(s.name, c.designation,'') AS speciality FROM careers c LEFT JOIN specialities s ON s.id=c.speciality_id WHERE c.user_id=su.id ORDER BY c.present DESC, c.id DESC LIMIT 1) scar ON true
	LEFT JOIN LATERAL (SELECT COALESCE(s.name, c.designation,'') AS speciality FROM careers c LEFT JOIN specialities s ON s.id=c.speciality_id WHERE c.user_id=ru.id ORDER BY c.present DESC, c.id DESC LIMIT 1) rcar ON true
	LEFT JOIN LATERAL (SELECT a.city_id FROM addresses a WHERE a.user_id=su.id AND a.type='present' ORDER BY a.id DESC LIMIT 1) saddr ON true
	LEFT JOIN cities sci ON sci.id=saddr.city_id
	LEFT JOIN LATERAL (SELECT a.city_id FROM addresses a WHERE a.user_id=ru.id AND a.type='present' ORDER BY a.id DESC LIMIT 1) raddr ON true
	LEFT JOIN cities rci ON rci.id=raddr.city_id
	LEFT JOIN profile_matches pm ON ((pm.user_id=ei.interested_by AND pm.match_id=ei.user_id) OR (pm.user_id=ei.user_id AND pm.match_id=ei.interested_by))
	ORDER BY ei.created_at DESC
	LIMIT 200
	`
	rows, err := s.pg.Pool.Query(ctx, query)
	if err != nil {
		if isMissingTable(err) {
			return []AdminProposal{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []AdminProposal{}
	for rows.Next() {
		var p AdminProposal
		var status string
		var createdAt time.Time
		err := rows.Scan(&p.ID, &p.SenderID, &p.SenderName, &p.SenderAvatar, &p.SenderSpecialty, &p.SenderCity, &p.RecipientID, &p.RecipientName, &p.RecipientAvatar, &p.RecipientSpecialty, &p.RecipientCity, &status, &p.MatchPercentage, &createdAt, &p.Notes)
		if err != nil {
			continue
		}
		p.Status = status
		p.CreatedAt = timeToString(createdAt)
		out = append(out, p)
	}
	return out, rows.Err()
}

// ListPackages returns packages for admin.
func (s *Service) ListPackages(ctx context.Context) ([]AdminPackage, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []AdminPackage{}, nil
	}
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, COALESCE(name,''), COALESCE(price,0), COALESCE(validity,30), COALESCE(express_interest,0), COALESCE(contact,0), COALESCE(active,true), COALESCE(status,true), COALESCE(badge_color,''), COALESCE(tagline,''), COALESCE(perks,'[]'::jsonb), COALESCE(is_featured,false)
		FROM packages WHERE deleted_at IS NULL ORDER BY price ASC
	`)
	if err != nil {
		if isMissingTable(err) {
			return []AdminPackage{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []AdminPackage{}
	for rows.Next() {
		var p AdminPackage
		var active, status bool
		var validity int
		var badgeColor, tagline string
		var perksJSON []byte
		var isFeatured bool
		err := rows.Scan(&p.ID, &p.Name, &p.PricePkr, &validity, &p.ProposalQuota, &p.ContactUnlocks, &active, &status, &badgeColor, &tagline, &perksJSON, &isFeatured)
		if err != nil {
			continue
		}
		p.DurationDays = validity
		p.IsActive = active && status
		p.IsFeatured = isFeatured
		p.BadgeColor = badgeColor
		p.Tagline = tagline
		if len(perksJSON) > 0 {
			_ = json.Unmarshal(perksJSON, &p.Perks)
		}
		if p.BadgeColor == "" {
			p.BadgeColor = "#6b7280"
		}
		if len(p.Perks) == 0 {
			p.Perks = []string{
				fmt.Sprintf("%d proposal quota", p.ProposalQuota),
				fmt.Sprintf("%d contact unlocks", p.ContactUnlocks),
				fmt.Sprintf("%d days validity", p.DurationDays),
			}
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// CreatePackage inserts new package.
func (s *Service) CreatePackage(ctx context.Context, in AdminPackage) (*AdminPackage, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return nil, errors.New("database unavailable")
	}
	if strings.TrimSpace(in.Name) == "" {
		return nil, errors.New("package name is required")
	}
	var id int64
	perksJSON, _ := json.Marshal(in.Perks)
	if len(perksJSON) == 0 {
		perksJSON = []byte("[]")
	}
	badge := in.BadgeColor
	if badge == "" {
		badge = "#6b7280"
	}
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO packages (name, price, validity, express_interest, contact, photo_gallery, profile_image_view, gallery_image_view, profile_viewers_view, auto_profile_match, badge_color, tagline, perks, is_featured, active, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,10,100,50,25,true,$6,$7,$8,$9,$10,$10,NOW(),NOW()) RETURNING id
	`, in.Name, in.PricePkr, in.DurationDays, in.ProposalQuota, in.ContactUnlocks, badge, in.Tagline, string(perksJSON), in.IsFeatured, in.IsActive).Scan(&id)
	if err != nil {
		return nil, err
	}
	in.ID = id
	in.BadgeColor = badge
	if len(in.Perks) == 0 {
		in.Perks = []string{
			fmt.Sprintf("%d proposals", in.ProposalQuota),
			fmt.Sprintf("%d contacts", in.ContactUnlocks),
		}
	}
	return &in, nil
}

// UpdatePackage updates existing package.
func (s *Service) UpdatePackage(ctx context.Context, id int64, in AdminPackage) (*AdminPackage, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return nil, errors.New("database unavailable")
	}
	perksJSON, _ := json.Marshal(in.Perks)
	if len(perksJSON) == 0 {
		perksJSON = []byte("[]")
	}
	badge := in.BadgeColor
	if badge == "" {
		badge = "#6b7280"
	}
	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE packages SET name=COALESCE(NULLIF($1,''), name), price=$2, validity=$3, express_interest=$4, contact=$5, badge_color=$6, tagline=$7, perks=$8, is_featured=$9, active=$10, status=$10, updated_at=NOW() WHERE id=$11
	`, in.Name, in.PricePkr, in.DurationDays, in.ProposalQuota, in.ContactUnlocks, badge, in.Tagline, string(perksJSON), in.IsFeatured, in.IsActive, id)
	if err != nil {
		return nil, err
	}
	in.ID = id
	in.BadgeColor = badge
	return &in, nil
}

// DeletePackage soft deletes.
func (s *Service) DeletePackage(ctx context.Context, id int64) error {
	if s.pg == nil || s.pg.Pool == nil {
		return errors.New("database unavailable")
	}
	_, err := s.pg.Pool.Exec(ctx, `UPDATE packages SET deleted_at=NOW(), active=false, status=false, updated_at=NOW() WHERE id=$1`, id)
	return err
}

// ListTickets returns support tickets.
func (s *Service) ListTickets(ctx context.Context) ([]AdminTicket, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []AdminTicket{}, nil
	}
	query := `
	SELECT
		st.id,
		st.ticket_id,
		st.sender_user_id,
		TRIM(COALESCE(su.first_name,'') || ' ' || COALESCE(su.last_name,'')),
		COALESCE(su.email,''),
		st.assigned_user_id,
		TRIM(COALESCE(ru.first_name,'') || ' ' || COALESCE(ru.last_name,'')),
		COALESCE(sc.name,'Technical Support'),
		st.subject,
		st.description,
		COALESCE(st.status,'open'),
		st.created_at,
		COALESCE((SELECT reply FROM support_ticket_replies WHERE support_ticket_id=st.id ORDER BY id DESC LIMIT 1),'')
	FROM support_tickets st
	JOIN users su ON su.id=st.sender_user_id
	LEFT JOIN users ru ON ru.id=st.assigned_user_id
	LEFT JOIN support_categories sc ON sc.id=st.support_category_id
	WHERE st.deleted_at IS NULL
	ORDER BY st.created_at DESC
	LIMIT 200
	`
	rows, err := s.pg.Pool.Query(ctx, query)
	if err != nil {
		if isMissingTable(err) {
			return []AdminTicket{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []AdminTicket{}
	for rows.Next() {
		var t AdminTicket
		var status string
		var createdAt time.Time
		var assignedID *int64
		var ticketID string
		err := rows.Scan(&t.ID, &ticketID, &t.ReporterID, &t.ReporterName, &t.ReporterEmail, &assignedID, &t.ReportedName, &t.Type, &t.Subject, &t.Description, &status, &createdAt, &t.AdminResolution)
		if err != nil {
			continue
		}
		t.TicketNumber = ticketID
		t.ReportedID = assignedID
		// normalize status
		switch strings.ToLower(status) {
		case "open", "pending":
			t.Status = "open"
		case "in_progress", "in progress":
			t.Status = "in_progress"
		case "resolved", "closed", "completed":
			t.Status = "resolved"
		case "dismissed", "rejected":
			t.Status = "dismissed"
		default:
			t.Status = "open"
		}
		// map type to allowed frontend enum
		switch strings.ToLower(t.Type) {
		case "harassment", "harassment report":
			t.Type = "Harassment Report"
		case "fake pmdc", "fake pmdc claim":
			t.Type = "Fake PMDC Claim"
		case "payment", "payment issue":
			t.Type = "Payment Issue"
		case "account dispute":
			t.Type = "Account Dispute"
		default:
			// keep as is but ensure fallback
			if t.Type == "" {
				t.Type = "Technical Support"
			} else if t.Type != "Harassment Report" && t.Type != "Fake PMDC Claim" && t.Type != "Payment Issue" && t.Type != "Account Dispute" && t.Type != "Technical Support" {
				t.Type = "Technical Support"
			}
		}
		t.Priority = "medium"
		if strings.Contains(strings.ToLower(t.Subject), "urgent") || strings.Contains(strings.ToLower(t.Description), "urgent") {
			t.Priority = "urgent"
		} else if t.Status == "open" {
			t.Priority = "high"
		}
		t.CreatedAt = timeToString(createdAt)
		out = append(out, t)
	}
	return out, rows.Err()
}

// ResolveTicket updates ticket status and adds reply.
func (s *Service) ResolveTicket(ctx context.Context, id int64, status string, resolution string) error {
	if s.pg == nil || s.pg.Pool == nil {
		return errors.New("database unavailable")
	}
	normalized := strings.ToLower(status)
	var dbStatus string
	switch normalized {
	case "resolved", "closed":
		dbStatus = "resolved"
	case "dismissed", "rejected":
		dbStatus = "dismissed"
	case "in_progress", "in progress", "open":
		dbStatus = "in_progress"
	default:
		return errors.New("invalid ticket status")
	}
	_, err := s.pg.Pool.Exec(ctx, `UPDATE support_tickets SET status=$1, updated_at=NOW() WHERE id=$2`, dbStatus, id)
	if err != nil {
		return err
	}
	if strings.TrimSpace(resolution) != "" {
		// find reporter to attribute reply to admin system - use assigned or sender
		var reporterID int64
		_ = s.pg.Pool.QueryRow(ctx, `SELECT sender_user_id FROM support_tickets WHERE id=$1`, id).Scan(&reporterID)
		// Use reporter as replier fallback, ideally admin id but we don't have it here; use reporter
		_, _ = s.pg.Pool.Exec(ctx, `INSERT INTO support_ticket_replies (support_ticket_id, replied_user_id, reply, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW())`, id, reporterID, resolution)
	}
	return nil
}

// ListHappyStories returns happy stories.
func (s *Service) ListHappyStories(ctx context.Context) ([]AdminHappyStory, error) {
	if s.pg == nil || s.pg.Pool == nil {
		return []AdminHappyStory{}, nil
	}
	query := `
	SELECT
		hs.id,
		COALESCE(hs.title,'Happy Story'),
		TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')),
		COALESCE(scar.speciality,''),
		COALESCE(hs.partner_name,''),
		'' as bride_specialty,
		hs.created_at,
		COALESCE(ci.name,''),
		COALESCE(hs.details,''),
		COALESCE(hs.photos::text,'[]'),
		CASE WHEN COALESCE(hs.approval_status,false)=true THEN 'approved' ELSE 'pending' END,
		hs.created_at,
		false
	FROM happy_stories hs
	JOIN users u ON u.id=hs.user_id
	LEFT JOIN LATERAL (SELECT COALESCE(s.name, c.designation,'') AS speciality FROM careers c LEFT JOIN specialities s ON s.id=c.speciality_id WHERE c.user_id=u.id ORDER BY c.present DESC, c.id DESC LIMIT 1) scar ON true
	LEFT JOIN LATERAL (SELECT a.city_id FROM addresses a WHERE a.user_id=u.id AND a.type='present' ORDER BY a.id DESC LIMIT 1) addr ON true
	LEFT JOIN cities ci ON ci.id=addr.city_id
	WHERE hs.deleted_at IS NULL
	ORDER BY hs.created_at DESC
	LIMIT 200
	`
	rows, err := s.pg.Pool.Query(ctx, query)
	if err != nil {
		if isMissingTable(err) {
			return []AdminHappyStory{}, nil
		}
		return nil, err
	}
	defer rows.Close()
	out := []AdminHappyStory{}
	for rows.Next() {
		var h AdminHappyStory
		var marriageDate, createdAt time.Time
		var photosRaw string
		var status string
		var isFeatured bool
		err := rows.Scan(&h.ID, &h.CoupleTitle, &h.GroomName, &h.GroomSpecialty, &h.BrideName, &h.BrideSpecialty, &marriageDate, &h.City, &h.Story, &photosRaw, &status, &createdAt, &isFeatured)
		if err != nil {
			continue
		}
		h.MarriageDate = timeToString(marriageDate)
		h.CreatedAt = timeToString(createdAt)
		h.Status = status
		h.IsFeatured = isFeatured
		// parse photos json
		photosRaw = strings.TrimSpace(photosRaw)
		if photosRaw != "" && photosRaw != "[]" {
			var arr []string
			if err := json.Unmarshal([]byte(photosRaw), &arr); err == nil && len(arr) > 0 {
				h.PhotoURL = arr[0]
			} else {
				// fallback: photos is JSON string like '["url"]' with text cast
				// try to extract first quoted string
				h.PhotoURL = strings.Trim(photosRaw, "[]\" ")
			}
		}
		if h.PhotoURL == "" {
			h.PhotoURL = "/uploads/happy-stories/placeholder.jpg"
		}
		out = append(out, h)
	}
	return out, rows.Err()
}

// ReviewHappyStory updates approval_status.
func (s *Service) ReviewHappyStory(ctx context.Context, id int64, status string, isFeatured bool) error {
	if s.pg == nil || s.pg.Pool == nil {
		return errors.New("database unavailable")
	}
	var approved bool
	switch strings.ToLower(status) {
	case "approved":
		approved = true
	case "pending", "rejected":
		approved = false
	default:
		return errors.New("invalid happy story status")
	}
	_, err := s.pg.Pool.Exec(ctx, `UPDATE happy_stories SET approval_status=$1, is_featured=$2, updated_at=NOW() WHERE id=$3`, approved, isFeatured, id)
	return err
}

// GetSettings returns system settings aggregated from DB.
func (s *Service) GetSettings(ctx context.Context) (*AdminSystemSettings, error) {
	settings := &AdminSystemSettings{
		Specialties: []string{},
		Cities:      []string{},
		Hospitals:   []string{},
		Sects:       []string{},
		Castes:      []string{},
	}
	if s.pg == nil || s.pg.Pool == nil {
		return settings, nil
	}
	// specialties
	if rows, err := s.pg.Pool.Query(ctx, `SELECT name FROM specialities ORDER BY name`); err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			if rows.Scan(&name) == nil {
				settings.Specialties = append(settings.Specialties, name)
			}
		}
	} else if !isMissingTable(err) {
		slog.Warn("admin settings specialties failed", "error", err)
	}
	// cities
	if rows, err := s.pg.Pool.Query(ctx, `SELECT name FROM cities ORDER BY name LIMIT 200`); err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			if rows.Scan(&name) == nil {
				settings.Cities = append(settings.Cities, name)
			}
		}
	}
	// hospitals = distinct careers.company
	if rows, err := s.pg.Pool.Query(ctx, `SELECT DISTINCT company FROM careers WHERE company IS NOT NULL AND company <> '' ORDER BY company LIMIT 100`); err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			if rows.Scan(&name) == nil {
				settings.Hospitals = append(settings.Hospitals, name)
			}
		}
	}
	// sects
	if rows, err := s.pg.Pool.Query(ctx, `SELECT name FROM sects ORDER BY name`); err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			if rows.Scan(&name) == nil {
				settings.Sects = append(settings.Sects, name)
			}
		}
	}
	// castes
	if rows, err := s.pg.Pool.Query(ctx, `SELECT name FROM castes ORDER BY name`); err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			if rows.Scan(&name) == nil {
				settings.Castes = append(settings.Castes, name)
			}
		}
	}
	// settings key-values
	kv := map[string]string{}
	if rows, err := s.pg.Pool.Query(ctx, `SELECT type, COALESCE(value,'') FROM settings WHERE deleted_at IS NULL`); err == nil {
		defer rows.Close()
		for rows.Next() {
			var k, v string
			if rows.Scan(&k, &v) == nil {
				kv[k] = v
			}
		}
	}
	// helper to parse bool
	parseBool := func(key string) bool {
		v := strings.ToLower(strings.TrimSpace(kv[key]))
		return v == "true" || v == "1" || v == "yes" || v == "on"
	}
	settings.MaintenanceMode = parseBool("maintenance_mode")
	settings.AutoApprovePMDC = parseBool("auto_approve_pmdc")
	settings.EmergencyNotice = kv["emergency_notice"]
	settings.ContactPhone = kv["contact_phone"]
	if settings.ContactPhone == "" {
		settings.ContactPhone = kv["contact_phone_number"]
	}
	settings.ContactEmail = kv["contact_email"]
	settings.ContactWhatsapp = kv["contact_whatsapp"]
	// Admin-configured taxonomy overrides (stored as JSON arrays in settings KV).
	parseArr := func(key string) ([]string, bool) {
		raw, ok := kv[key]
		if !ok || raw == "" {
			return nil, false
		}
		var arr []string
		if err := json.Unmarshal([]byte(raw), &arr); err != nil {
			return nil, false
		}
		return arr, true
	}
	if arr, ok := parseArr("admin_specialties"); ok {
		settings.Specialties = arr
	}
	if arr, ok := parseArr("admin_cities"); ok {
		settings.Cities = arr
	}
	if arr, ok := parseArr("admin_hospitals"); ok {
		settings.Hospitals = arr
	}
	if arr, ok := parseArr("admin_sects"); ok {
		settings.Sects = arr
	}
	if arr, ok := parseArr("admin_castes"); ok {
		settings.Castes = arr
	}
	// defaults if empty
	if len(settings.Specialties) == 0 {
		settings.Specialties = []string{"Cardiology", "Dermatology", "General Medicine"}
	}
	if len(settings.Cities) == 0 {
		settings.Cities = []string{"Lahore", "Karachi", "Islamabad"}
	}
	return settings, nil
}

// UpdateSettings upserts settings keys.
func (s *Service) UpdateSettings(ctx context.Context, in AdminSystemSettings) error {
	if s.pg == nil || s.pg.Pool == nil {
		return errors.New("database unavailable")
	}
	upsert := func(key, value string) error {
		_, err := s.pg.Pool.Exec(ctx, `
			INSERT INTO settings (type, value, created_at, updated_at)
			VALUES ($1,$2,NOW(),NOW())
			ON CONFLICT (type) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
		`, key, value)
		return err
	}
	boolStr := func(b bool) string {
		if b {
			return "true"
		}
		return "false"
	}
	if err := upsert("maintenance_mode", boolStr(in.MaintenanceMode)); err != nil && !isMissingTable(err) {
		return err
	}
	if err := upsert("auto_approve_pmdc", boolStr(in.AutoApprovePMDC)); err != nil && !isMissingTable(err) {
		return err
	}
	_ = upsert("emergency_notice", in.EmergencyNotice)
	_ = upsert("contact_phone", in.ContactPhone)
	_ = upsert("contact_email", in.ContactEmail)
	_ = upsert("contact_whatsapp", in.ContactWhatsapp)
	// Persist admin-configured taxonomy lists (non-destructive: stored as JSON in settings KV).
	toJSON := func(arr []string) string {
		if arr == nil {
			arr = []string{}
		}
		b, _ := json.Marshal(arr)
		return string(b)
	}
	_ = upsert("admin_specialties", toJSON(in.Specialties))
	_ = upsert("admin_cities", toJSON(in.Cities))
	_ = upsert("admin_hospitals", toJSON(in.Hospitals))
	_ = upsert("admin_sects", toJSON(in.Sects))
	_ = upsert("admin_castes", toJSON(in.Castes))
	slog.Info("admin settings updated", "maintenance", in.MaintenanceMode, "auto_approve", in.AutoApprovePMDC)
	return nil
}
