package engagement

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/doctormarriagebureau/api/internal/assets"
	"github.com/doctormarriagebureau/api/internal/cards"
	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

// Service implements dashboard overview, referrals, family, community and settings.
type Service struct {
	pg *postgres.Client
}

// NewService creates the engagement service.
func NewService(pg *postgres.Client) *Service {
	return &Service{pg: pg}
}

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------

// OverviewStats aggregates dashboard counters.
type OverviewStats struct {
	ProfileViews             int64 `json:"profile_views"`
	PendingInterestsReceived int64 `json:"pending_interests_received"`
	InterestsSent            int64 `json:"interests_sent"`
	AcceptedMatches          int64 `json:"accepted_matches"`
	ShortlistedMe            int64 `json:"shortlisted_me"`
	MyShortlists             int64 `json:"my_shortlists"`
	UnreadMessages           int64 `json:"unread_messages"`
	UnreadNotifications      int64 `json:"unread_notifications"`
	ActiveChats              int64 `json:"active_chats"`
}

// OverviewUser is the header block of the dashboard.
type OverviewUser struct {
	ID                int64  `json:"id"`
	Name              string `json:"name"`
	FirstName         string `json:"first_name"`
	Photo             string `json:"photo"`
	Code              string `json:"code"`
	Membership        int    `json:"membership"`
	IsVerified        bool   `json:"is_verified"`
	ProfileCompletion int    `json:"profile_completion"`
	Gender            string `json:"gender"`
}

// OverviewSubscription summarizes package status.
type OverviewSubscription struct {
	PackageName string     `json:"package_name"`
	IsPaid      bool       `json:"is_paid"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	Remaining   map[string]interface{} `json:"remaining"`
}

// Overview is the full dashboard overview payload.
type Overview struct {
	User                OverviewUser          `json:"user"`
	Stats               OverviewStats         `json:"stats"`
	Subscription        OverviewSubscription  `json:"subscription"`
	RecentNotifications []NotificationLite    `json:"recent_notifications"`
	Suggestions         []models.DoctorCard   `json:"suggestions"`
}

// NotificationLite is a compact notification row.
type NotificationLite struct {
	ID        string          `json:"id"`
	Type      string          `json:"type"`
	Data      json.RawMessage `json:"data"`
	ReadAt    *time.Time      `json:"read_at,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

// GetOverview builds the dashboard overview for a user.
func (s *Service) GetOverview(ctx context.Context, userID int64) (*Overview, error) {
	ov := &Overview{}

	var firstName, lastName, name, photo, code, gender pgtypeText
	var membership, photoApproved int
	var isApproved bool
	var emailVerifiedAt *time.Time
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT COALESCE(u.first_name,''), COALESCE(u.last_name,''), COALESCE(u.name,''),
		       ` + assets.PhotoSQLWithUserFallback("u.photo", "u.id") + `, COALESCE(u.code,''), COALESCE(u.membership,1), COALESCE(u.photo_approved,1),
		       u.email_verified_at, COALESCE(m.is_approved,false), COALESCE(m.gender,'')
		FROM users u
		LEFT JOIN members m ON m.user_id = u.id
		WHERE u.id = $1
	`, userID).Scan(&firstName.v, &lastName.v, &name.v, &photo.v, &code.v, &membership, &photoApproved,
		&emailVerifiedAt, &isApproved, &gender.v)
	if err != nil {
		return nil, err
	}
	_ = photoApproved

	displayName := strings.TrimSpace(name.v)
	if displayName == "" {
		displayName = strings.TrimSpace(firstName.v + " " + lastName.v)
	}

	ov.User = OverviewUser{
		ID:         userID,
		Name:       displayName,
		FirstName:  firstName.v,
		Photo:      photo.v,
		Code:       code.v,
		Membership: membership,
		IsVerified: isApproved && emailVerifiedAt != nil,
		Gender:     gender.v,
	}
	ov.User.ProfileCompletion = s.profileCompletion(ctx, userID)

	// Aggregate counters in one round trip.
	err = s.pg.Pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM profile_viewers WHERE user_id = $1),
			(SELECT COUNT(*) FROM express_interests WHERE user_id = $1 AND status = 0),
			(SELECT COUNT(*) FROM express_interests WHERE interested_by = $1 AND status = 0),
			(SELECT COUNT(*) FROM express_interests WHERE (user_id = $1 OR interested_by = $1) AND status = 1),
			(SELECT COUNT(*) FROM shortlists WHERE user_id_target = $1),
			(SELECT COUNT(*) FROM shortlists WHERE user_id = $1),
			(SELECT COUNT(*) FROM chats c JOIN chat_threads t ON t.id = c.chat_thread_id
			   WHERE (t.sender_user_id = $1 OR t.receiver_user_id = $1) AND c.sender_user_id <> $1 AND NOT c.seen),
			(SELECT COUNT(*) FROM notifications WHERE notifiable_id = $1 AND read_at IS NULL),
			(SELECT COUNT(*) FROM chat_threads WHERE (sender_user_id = $1 OR receiver_user_id = $1) AND active)
	`, userID).Scan(
		&ov.Stats.ProfileViews, &ov.Stats.PendingInterestsReceived, &ov.Stats.InterestsSent,
		&ov.Stats.AcceptedMatches, &ov.Stats.ShortlistedMe, &ov.Stats.MyShortlists,
		&ov.Stats.UnreadMessages, &ov.Stats.UnreadNotifications, &ov.Stats.ActiveChats,
	)
	if err != nil {
		return nil, err
	}

	ov.Subscription = s.subscription(ctx, userID)
	ov.RecentNotifications = s.recentNotifications(ctx, userID, 5)

	// Suggestions: opposite-gender members, newest first.
	f := cards.Filters{Limit: 4, ExcludeIDs: []int64{userID}}
	if og := cards.OppositeGender(gender.v); og != "" {
		f.Gender = og
	}
	if sugg, _, err := cards.FetchCards(ctx, s.pg, f); err == nil {
		ov.Suggestions = sugg
	} else {
		ov.Suggestions = []models.DoctorCard{}
	}

	return ov, nil
}

type pgtypeText struct{ v string }

func (s *Service) profileCompletion(ctx context.Context, userID int64) int {
	var filled, total int
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT
			(CASE WHEN COALESCE(u.photo,'') <> '' THEN 1 ELSE 0 END) +
			(CASE WHEN m.birthday IS NOT NULL THEN 1 ELSE 0 END) +
			(CASE WHEN COALESCE(m.gender,'') <> '' THEN 1 ELSE 0 END) +
			(CASE WHEN EXISTS (SELECT 1 FROM physical_attributes pa WHERE pa.user_id = u.id) THEN 1 ELSE 0 END) +
			(CASE WHEN EXISTS (SELECT 1 FROM education e WHERE e.user_id = u.id) THEN 1 ELSE 0 END) +
			(CASE WHEN EXISTS (SELECT 1 FROM careers c WHERE c.user_id = u.id) THEN 1 ELSE 0 END) +
			(CASE WHEN EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id) THEN 1 ELSE 0 END) +
			(CASE WHEN EXISTS (SELECT 1 FROM families f WHERE f.user_id = u.id) THEN 1 ELSE 0 END) +
			(CASE WHEN EXISTS (SELECT 1 FROM partner_expectations pe WHERE pe.user_id = u.id) THEN 1 ELSE 0 END) +
			(CASE WHEN EXISTS (SELECT 1 FROM spiritual_backgrounds sb WHERE sb.user_id = u.id) THEN 1 ELSE 0 END) +
			(CASE WHEN EXISTS (SELECT 1 FROM gallery_images g WHERE g.user_id = u.id AND g.deleted_at IS NULL) THEN 1 ELSE 0 END),
			11
		FROM users u
		LEFT JOIN members m ON m.user_id = u.id
		WHERE u.id = $1
	`, userID).Scan(&filled, &total)
	if err != nil || total == 0 {
		return 0
	}
	return int(float64(filled) / float64(total) * 100)
}

func (s *Service) subscription(ctx context.Context, userID int64) OverviewSubscription {
	sub := OverviewSubscription{PackageName: "Free", Remaining: map[string]interface{}{}}

	var pkgName *string
	var validity *time.Time
	var membership int
	var remInterest, remContact, remPhoto, remProfileImg, remGalleryImg, remViewers *int
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT p.name, m.package_validity, COALESCE(u.membership,1),
		       m.remaining_interest, m.remaining_contact_view, m.remaining_photo_gallery,
		       m.remaining_profile_image_view, m.remaining_gallery_image_view, m.remaining_profile_viewer_view
		FROM users u
		LEFT JOIN members m ON m.user_id = u.id
		LEFT JOIN packages p ON p.id = m.current_package_id
		WHERE u.id = $1
	`, userID).Scan(&pkgName, &validity, &membership,
		&remInterest, &remContact, &remPhoto, &remProfileImg, &remGalleryImg, &remViewers)
	if err != nil {
		return sub
	}

	if pkgName != nil && *pkgName != "" {
		sub.PackageName = *pkgName
	}
	sub.IsPaid = membership >= 2
	sub.ExpiresAt = validity
	put := func(key string, v *int) {
		if v != nil {
			sub.Remaining[key] = *v
		} else {
			sub.Remaining[key] = nil
		}
	}
	put("interests", remInterest)
	put("contact_views", remContact)
	put("photo_gallery", remPhoto)
	put("profile_image_views", remProfileImg)
	put("gallery_image_views", remGalleryImg)
	put("profile_viewers_views", remViewers)
	return sub
}

func (s *Service) recentNotifications(ctx context.Context, userID int64, limit int) []NotificationLite {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id::text, type, data, read_at, created_at
		FROM notifications
		WHERE notifiable_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, userID, limit)
	if err != nil {
		return []NotificationLite{}
	}
	defer rows.Close()

	out := []NotificationLite{}
	for rows.Next() {
		var n NotificationLite
		if err := rows.Scan(&n.ID, &n.Type, &n.Data, &n.ReadAt, &n.CreatedAt); err != nil {
			continue
		}
		out = append(out, n)
	}
	return out
}

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------

// ReferralInfo is the /referrals payload.
type ReferralInfo struct {
	Code                string         `json:"code"`
	ShareURL            string         `json:"share_url"`
	TotalClicks         int64          `json:"total_clicks"`
	SuccessfulReferrals int64          `json:"successful_referrals"`
	PendingReferrals    int64          `json:"pending_referrals"`
	Referrals           []ReferralItem `json:"referrals"`
}

// ReferralItem is one referred user row.
type ReferralItem struct {
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	Status      string     `json:"status"`
	Source      string     `json:"source"`
	QualifiedAt *time.Time `json:"qualified_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

func randomReferralSuffix(n int) string {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	var sb strings.Builder
	for i := 0; i < n; i++ {
		idx, _ := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		sb.WriteByte(alphabet[idx.Int64()])
	}
	return sb.String()
}

// GetReferralInfo returns (and lazily creates) the user's referral code plus stats.
func (s *Service) GetReferralInfo(ctx context.Context, userID int64) (*ReferralInfo, error) {
	info := &ReferralInfo{Referrals: []ReferralItem{}}

	var codeID int64
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT id, code, COALESCE(total_clicks,0), COALESCE(successful_referrals,0)
		FROM referral_codes WHERE user_id = $1
	`, userID).Scan(&codeID, &info.Code, &info.TotalClicks, &info.SuccessfulReferrals)
	if errors.Is(err, pgx.ErrNoRows) {
		// Generate a unique code: DR + 6 chars.
		for attempt := 0; attempt < 5; attempt++ {
			candidate := "DR" + randomReferralSuffix(6)
			insErr := s.pg.Pool.QueryRow(ctx, `
				INSERT INTO referral_codes (user_id, code, status, total_clicks, successful_referrals, created_at, updated_at)
				VALUES ($1, $2, 'active', 0, 0, NOW(), NOW())
				ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
				RETURNING id, code
			`, userID, candidate).Scan(&codeID, &info.Code)
			if insErr == nil {
				break
			}
			err = insErr
		}
		if info.Code == "" {
			return nil, fmt.Errorf("failed to provision referral code: %w", err)
		}
	} else if err != nil {
		return nil, err
	}

	info.ShareURL = "https://panel.doctormarriagebureau.com.pk/register/?ref=" + info.Code

	rows, err := s.pg.Pool.Query(ctx, `
		SELECT r.id, TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')),
		       r.status, COALESCE(r.source,''), r.qualified_at, r.created_at
		FROM referrals r
		JOIN users u ON u.id = r.referred_user_id
		WHERE r.referrer_user_id = $1
		ORDER BY r.created_at DESC
		LIMIT 100
	`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var item ReferralItem
			if err := rows.Scan(&item.ID, &item.Name, &item.Status, &item.Source, &item.QualifiedAt, &item.CreatedAt); err == nil {
				if item.Status == "pending" {
					info.PendingReferrals++
				}
				info.Referrals = append(info.Referrals, item)
			}
		}
	}

	return info, nil
}

// ---------------------------------------------------------------------------
// Family
// ---------------------------------------------------------------------------

// FamilyProfile mirrors the families table.
type FamilyProfile struct {
	Father           string          `json:"father"`
	Mother           string          `json:"mother"`
	FatherOccupation string          `json:"father_occupation"`
	MotherOccupation string          `json:"mother_occupation"`
	NoOfSisters      *int            `json:"no_of_sisters"`
	NoOfBrothers     *int            `json:"no_of_brothers"`
	AboutParents     string          `json:"about_parents"`
	AboutSiblings    string          `json:"about_siblings"`
	LocationCity     string          `json:"location_city"`
	LocationCountry  string          `json:"location_country"`
	TraditionLevel   string          `json:"tradition_level"`
	AffluenceLevel   string          `json:"affluence_level"`
	Interests        json.RawMessage `json:"interests"`
	Guardians        []Guardian      `json:"guardians"`
}

// Guardian is a family guardian contact.
type Guardian struct {
	ID               int64  `json:"id"`
	Name             string `json:"name"`
	Relationship     string `json:"relationship"`
	Phone            string `json:"phone"`
	Email            string `json:"email"`
	IsPrimaryContact bool   `json:"is_primary_contact"`
}

// GetFamily returns the family profile with guardians.
func (s *Service) GetFamily(ctx context.Context, userID int64) (*FamilyProfile, error) {
	fp := &FamilyProfile{Guardians: []Guardian{}, Interests: json.RawMessage("[]")}

	var familyID int64
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT id, COALESCE(father,''), COALESCE(mother,''), COALESCE(father_occupation,''), COALESCE(mother_occupation,''),
		       no_of_sisters, no_of_brothers, COALESCE(about_parents,''), COALESCE(about_siblings,''),
		       COALESCE(location_city,''), COALESCE(location_country,''), COALESCE(tradition_level,''),
		       COALESCE(affluence_level,''), COALESCE(interests, '[]'::jsonb)
		FROM families WHERE user_id = $1
	`, userID).Scan(&familyID, &fp.Father, &fp.Mother, &fp.FatherOccupation, &fp.MotherOccupation,
		&fp.NoOfSisters, &fp.NoOfBrothers, &fp.AboutParents, &fp.AboutSiblings,
		&fp.LocationCity, &fp.LocationCountry, &fp.TraditionLevel, &fp.AffluenceLevel, &fp.Interests)
	if errors.Is(err, pgx.ErrNoRows) {
		return fp, nil
	}
	if err != nil {
		return nil, err
	}

	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, COALESCE(name,''), COALESCE(relationship,''), COALESCE(phone,''), COALESCE(email,''), COALESCE(is_primary_contact,false)
		FROM family_guardians WHERE family_id = $1 ORDER BY is_primary_contact DESC, id
	`, familyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var g Guardian
			if err := rows.Scan(&g.ID, &g.Name, &g.Relationship, &g.Phone, &g.Email, &g.IsPrimaryContact); err == nil {
				fp.Guardians = append(fp.Guardians, g)
			}
		}
	}
	return fp, nil
}

// UpsertFamilyInput is the PUT /family payload.
type UpsertFamilyInput struct {
	Father           *string         `json:"father"`
	Mother           *string         `json:"mother"`
	FatherOccupation *string         `json:"father_occupation"`
	MotherOccupation *string         `json:"mother_occupation"`
	NoOfSisters      *int            `json:"no_of_sisters"`
	NoOfBrothers     *int            `json:"no_of_brothers"`
	AboutParents     *string         `json:"about_parents"`
	AboutSiblings    *string         `json:"about_siblings"`
	LocationCity     *string         `json:"location_city"`
	LocationCountry  *string         `json:"location_country"`
	TraditionLevel   *string         `json:"tradition_level"`
	AffluenceLevel   *string         `json:"affluence_level"`
	Interests        json.RawMessage `json:"interests"`
}

// UpsertFamily creates or updates the family row.
func (s *Service) UpsertFamily(ctx context.Context, userID int64, in UpsertFamilyInput) (*FamilyProfile, error) {
	interests := in.Interests
	if len(interests) == 0 {
		interests = json.RawMessage("[]")
	}
	_, err := s.pg.Pool.Exec(ctx, `
		INSERT INTO families (user_id, father, mother, father_occupation, mother_occupation,
			no_of_sisters, no_of_brothers, about_parents, about_siblings,
			location_city, location_country, tradition_level, affluence_level, interests, created_at, updated_at)
		VALUES ($1, COALESCE($2,''), COALESCE($3,''), COALESCE($4,''), COALESCE($5,''),
			$6, $7, COALESCE($8,''), COALESCE($9,''), COALESCE($10,''), COALESCE($11,''),
			COALESCE($12,''), COALESCE($13,''), $14, NOW(), NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			father = COALESCE($2, families.father),
			mother = COALESCE($3, families.mother),
			father_occupation = COALESCE($4, families.father_occupation),
			mother_occupation = COALESCE($5, families.mother_occupation),
			no_of_sisters = COALESCE($6, families.no_of_sisters),
			no_of_brothers = COALESCE($7, families.no_of_brothers),
			about_parents = COALESCE($8, families.about_parents),
			about_siblings = COALESCE($9, families.about_siblings),
			location_city = COALESCE($10, families.location_city),
			location_country = COALESCE($11, families.location_country),
			tradition_level = COALESCE($12, families.tradition_level),
			affluence_level = COALESCE($13, families.affluence_level),
			interests = CASE WHEN $15 THEN $14 ELSE families.interests END,
			updated_at = NOW()
	`, userID, in.Father, in.Mother, in.FatherOccupation, in.MotherOccupation,
		in.NoOfSisters, in.NoOfBrothers, in.AboutParents, in.AboutSiblings,
		in.LocationCity, in.LocationCountry, in.TraditionLevel, in.AffluenceLevel,
		interests, len(in.Interests) > 0)
	if err != nil {
		return nil, err
	}
	return s.GetFamily(ctx, userID)
}

// GuardianInput is the guardian create/update payload.
type GuardianInput struct {
	Name             string `json:"name"`
	Relationship     string `json:"relationship"`
	Phone            string `json:"phone"`
	Email            string `json:"email"`
	IsPrimaryContact bool   `json:"is_primary_contact"`
}

func (s *Service) familyIDFor(ctx context.Context, userID int64) (int64, error) {
	var familyID int64
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO families (user_id, created_at, updated_at) VALUES ($1, NOW(), NOW())
		ON CONFLICT (user_id) DO UPDATE SET updated_at = families.updated_at
		RETURNING id
	`, userID).Scan(&familyID)
	return familyID, err
}

// AddGuardian adds a guardian contact.
func (s *Service) AddGuardian(ctx context.Context, userID int64, in GuardianInput) (*Guardian, error) {
	if strings.TrimSpace(in.Name) == "" {
		return nil, errors.New("guardian name is required")
	}
	familyID, err := s.familyIDFor(ctx, userID)
	if err != nil {
		return nil, err
	}
	var g Guardian
	err = s.pg.Pool.QueryRow(ctx, `
		INSERT INTO family_guardians (family_id, user_id, name, relationship, phone, email, is_primary_contact, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, name, COALESCE(relationship,''), COALESCE(phone,''), COALESCE(email,''), is_primary_contact
	`, familyID, userID, in.Name, in.Relationship, in.Phone, in.Email, in.IsPrimaryContact).
		Scan(&g.ID, &g.Name, &g.Relationship, &g.Phone, &g.Email, &g.IsPrimaryContact)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// DeleteGuardian removes a guardian contact owned by the user.
func (s *Service) DeleteGuardian(ctx context.Context, userID, guardianID int64) error {
	tag, err := s.pg.Pool.Exec(ctx, `
		DELETE FROM family_guardians g USING families f
		WHERE g.id = $1 AND g.family_id = f.id AND f.user_id = $2
	`, guardianID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("guardian not found")
	}
	return nil
}

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

// Community is a community row with the viewer's membership state.
type Community struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	Type         string `json:"type"`
	Description  string `json:"description"`
	IsPrivate    bool   `json:"is_private"`
	MemberCount  int64  `json:"member_count"`
	MyStatus     string `json:"my_status"` // none | pending | approved
}

// ListCommunities lists active communities with membership info.
func (s *Service) ListCommunities(ctx context.Context, userID int64) ([]Community, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT c.id, c.name, c.slug, COALESCE(c.type,''), COALESCE(c.description,''), c.is_private,
		       (SELECT COUNT(*) FROM community_memberships cm WHERE cm.community_id = c.id AND cm.status = 'approved'),
		       COALESCE((SELECT cm2.status FROM community_memberships cm2 WHERE cm2.community_id = c.id AND cm2.user_id = $1), 'none')
		FROM communities c
		WHERE c.is_active
		ORDER BY c.name
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []Community{}
	for rows.Next() {
		var c Community
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Type, &c.Description, &c.IsPrivate, &c.MemberCount, &c.MyStatus); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// JoinCommunity requests or activates membership.
func (s *Service) JoinCommunity(ctx context.Context, userID, communityID int64) (string, error) {
	var isPrivate bool
	if err := s.pg.Pool.QueryRow(ctx, `SELECT is_private FROM communities WHERE id = $1 AND is_active`, communityID).Scan(&isPrivate); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", errors.New("community not found")
		}
		return "", err
	}

	status := "approved"
	if isPrivate {
		status = "pending"
	}
	approvedAt := "NOW()"
	if isPrivate {
		approvedAt = "NULL"
	}

	_, err := s.pg.Pool.Exec(ctx, `
		INSERT INTO community_memberships (community_id, user_id, status, role, requested_at, approved_at, created_at, updated_at)
		VALUES ($1, $2, $3, 'member', NOW(), `+approvedAt+`, NOW(), NOW())
		ON CONFLICT (community_id, user_id) DO UPDATE SET
			status = CASE WHEN community_memberships.status = 'approved' THEN 'approved' ELSE $3 END,
			updated_at = NOW()
	`, communityID, userID, status)
	if err != nil {
		return "", err
	}
	return status, nil
}

// LeaveCommunity removes membership.
func (s *Service) LeaveCommunity(ctx context.Context, userID, communityID int64) error {
	_, err := s.pg.Pool.Exec(ctx, `
		DELETE FROM community_memberships WHERE community_id = $1 AND user_id = $2
	`, communityID, userID)
	return err
}

// ---------------------------------------------------------------------------
// Notification settings & account
// ---------------------------------------------------------------------------

// NotificationPrefs mirrors user_notification_preferences.
type NotificationPrefs struct {
	EmailDigest       bool       `json:"email_digest"`
	Whatsapp          bool       `json:"whatsapp"`
	PushNotifications bool       `json:"push_notifications"`
	SMS               bool       `json:"sms"`
	WeeklyDigest      bool       `json:"weekly_digest"`
	ProfileSnoozed    bool       `json:"profile_snoozed"`
	SnoozeUntil       *time.Time `json:"snooze_until,omitempty"`
}

// GetNotificationPrefs fetches (or defaults) notification preferences.
func (s *Service) GetNotificationPrefs(ctx context.Context, userID int64) (*NotificationPrefs, error) {
	p := &NotificationPrefs{EmailDigest: true, PushNotifications: true, WeeklyDigest: true}
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT email_digest, whatsapp, push_notifications, sms, weekly_digest, profile_snoozed, snooze_until
		FROM user_notification_preferences WHERE user_id = $1
	`, userID).Scan(&p.EmailDigest, &p.Whatsapp, &p.PushNotifications, &p.SMS, &p.WeeklyDigest, &p.ProfileSnoozed, &p.SnoozeUntil)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	return p, nil
}

// UpdateNotificationPrefs upserts notification preferences.
func (s *Service) UpdateNotificationPrefs(ctx context.Context, userID int64, p NotificationPrefs) (*NotificationPrefs, error) {
	_, err := s.pg.Pool.Exec(ctx, `
		INSERT INTO user_notification_preferences (user_id, email_digest, whatsapp, push_notifications, sms, weekly_digest, profile_snoozed, snooze_until, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			email_digest = $2, whatsapp = $3, push_notifications = $4, sms = $5,
			weekly_digest = $6, profile_snoozed = $7, snooze_until = $8, updated_at = NOW()
	`, userID, p.EmailDigest, p.Whatsapp, p.PushNotifications, p.SMS, p.WeeklyDigest, p.ProfileSnoozed, p.SnoozeUntil)
	if err != nil {
		return nil, err
	}
	return s.GetNotificationPrefs(ctx, userID)
}

// SetProfileVisibility toggles members.is_visible (profile snooze).
func (s *Service) SetProfileVisibility(ctx context.Context, userID int64, visible bool) error {
	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE members SET is_visible = $1, updated_at = NOW() WHERE user_id = $2
	`, visible, userID)
	return err
}

// DeactivateAccount marks users.deactivated true.
func (s *Service) DeactivateAccount(ctx context.Context, userID int64) error {
	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE users SET deactivated = true, updated_at = NOW() WHERE id = $1
	`, userID)
	return err
}
