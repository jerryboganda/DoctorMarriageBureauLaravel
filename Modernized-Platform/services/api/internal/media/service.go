package media

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/doctormarriagebureau/api/internal/assets"
	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/internal/notifications"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

var (
	ErrAccessRequestNotFound = errors.New("media access request not found")
	ErrUnauthorized          = errors.New("unauthorized action on media access request")
	ErrSelfRequest           = errors.New("cannot request media access for yourself")
	ErrInvalidFileType       = errors.New("unsupported file type; allowed: jpg, jpeg, png, webp")
)

// PresignedUploadResponse describes how to upload a file to the API.
type PresignedUploadResponse struct {
	UploadURL string            `json:"upload_url"`
	Key       string            `json:"key"`
	ExpiresAt time.Time         `json:"expires_at"`
	Headers   map[string]string `json:"headers,omitempty"`
}

// SharedUserDTO represents a doctor granted access to a private gallery.
type SharedUserDTO struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Photo      string    `json:"photo"`
	Gender     string    `json:"gender"`
	Degree     string    `json:"degree"`
	Speciality string    `json:"speciality"`
	City       string    `json:"city"`
	SharedAt   time.Time `json:"shared_at"`
}

// GalleryPrivacyResponse summarizes gallery privacy level, shared friends, and pending requests.
type GalleryPrivacyResponse struct {
	Privacy         string                            `json:"privacy"` // "public", "private", "only_share_with"
	SharedUsers     []SharedUserDTO                   `json:"shared_users"`
	PendingRequests []models.ViewGalleryImageRequest `json:"pending_requests"`
}

// Service defines media storage and access request operations.
type Service interface {
	GetPresignedUploadURL(ctx context.Context, userID int64, fileName, contentType, category string) (*PresignedUploadResponse, error)
	SaveUpload(ctx context.Context, userID int64, fileName, category string, isPrimary, isPrivate bool, content io.Reader) (*models.GalleryImage, error)
	ConfirmUpload(ctx context.Context, userID int64, key, category string, isPrimary, isPrivate bool) (*models.GalleryImage, error)
	DeleteImage(ctx context.Context, userID, imageID int64) error
	RequestMediaAccess(ctx context.Context, requesterID, targetUserID int64) (*models.ViewGalleryImageRequest, error)
	AcceptMediaAccess(ctx context.Context, ownerID, requestID int64) (*models.ViewGalleryImageRequest, error)
	RejectMediaAccess(ctx context.Context, ownerID, requestID int64) (*models.ViewGalleryImageRequest, error)
	ListAccessRequests(ctx context.Context, userID int64, reqType string) ([]models.ViewGalleryImageRequest, error)
	GetUserMedia(ctx context.Context, viewerID, targetUserID int64) ([]models.GalleryImage, error)
	GetGalleryPrivacy(ctx context.Context, userID int64) (*GalleryPrivacyResponse, error)
	SetGalleryPrivacy(ctx context.Context, userID int64, privacy string) error
	ShareGalleryWithUser(ctx context.Context, ownerID, targetUserID int64) (*SharedUserDTO, error)
	RevokeGalleryAccess(ctx context.Context, ownerID, targetUserID int64) error
	SetProfilePhoto(ctx context.Context, userID, imageID int64) error
}

type mediaService struct {
	pg        *postgres.Client
	notifier  *notifications.Service
	uploadDir string
	baseURL   string
}

// NewMediaService initializes the disk-backed media service.
func NewMediaService(pg *postgres.Client, notifier *notifications.Service, uploadDir, baseURL string) Service {
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	if baseURL == "" {
		baseURL = "/uploads"
	}
	return &mediaService{pg: pg, notifier: notifier, uploadDir: uploadDir, baseURL: strings.TrimRight(baseURL, "/")}
}

var allowedExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
}

func (s *mediaService) buildKey(userID int64, fileName, category string) (string, error) {
	if category == "" {
		category = "gallery"
	}
	ext := strings.ToLower(filepath.Ext(fileName))
	if ext == "" {
		ext = ".jpg"
	}
	if !allowedExtensions[ext] {
		return "", ErrInvalidFileType
	}
	return fmt.Sprintf("%s/%d/%s%s", category, userID, uuid.NewString(), ext), nil
}

// GetPresignedUploadURL describes the direct upload endpoint for a generated key.
func (s *mediaService) GetPresignedUploadURL(ctx context.Context, userID int64, fileName, contentType, category string) (*PresignedUploadResponse, error) {
	key, err := s.buildKey(userID, fileName, category)
	if err != nil {
		return nil, err
	}
	return &PresignedUploadResponse{
		UploadURL: "/api/v1/media/upload",
		Key:       key,
		ExpiresAt: time.Now().Add(30 * time.Minute),
		Headers:   map[string]string{},
	}, nil
}

// SaveUpload stores the file on disk and records the gallery image.
func (s *mediaService) SaveUpload(ctx context.Context, userID int64, fileName, category string, isPrimary, isPrivate bool, content io.Reader) (*models.GalleryImage, error) {
	key, err := s.buildKey(userID, fileName, category)
	if err != nil {
		return nil, err
	}

	fullPath := filepath.Join(s.uploadDir, filepath.FromSlash(key))
	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return nil, fmt.Errorf("failed to prepare upload directory: %w", err)
	}

	f, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to store upload: %w", err)
	}
	defer f.Close()

	// Cap uploads at 10 MB.
	if _, err := io.Copy(f, io.LimitReader(content, 10<<20)); err != nil {
		return nil, fmt.Errorf("failed to write upload: %w", err)
	}

	return s.record(ctx, userID, key, isPrimary, isPrivate)
}

// ConfirmUpload records a gallery image for an already-uploaded key.
func (s *mediaService) ConfirmUpload(ctx context.Context, userID int64, key, category string, isPrimary, isPrivate bool) (*models.GalleryImage, error) {
	if key == "" {
		return nil, errors.New("upload key is required")
	}
	return s.record(ctx, userID, key, isPrimary, isPrivate)
}

func (s *mediaService) record(ctx context.Context, userID int64, key string, isPrimary, isPrivate bool) (*models.GalleryImage, error) {
	url := s.baseURL + "/" + strings.TrimLeft(key, "/")
	privacy := "public"
	if isPrivate {
		privacy = "private"
	}

	var img models.GalleryImage
	err := s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		if isPrimary {
			if _, err := tx.Exec(ctx, `
				UPDATE gallery_images SET is_main_photo = false, updated_at = NOW() WHERE user_id = $1
			`, userID); err != nil {
				return err
			}
			if _, err := tx.Exec(ctx, `
				UPDATE users SET photo = $1, photo_approved = 1, updated_at = NOW() WHERE id = $2
			`, url, userID); err != nil {
				return err
			}
		}
		var privacyOut string
		if err := tx.QueryRow(ctx, `
			INSERT INTO gallery_images (user_id, image, privacy_level, is_main_photo, sort_order, created_at, updated_at)
			VALUES ($1, $2, $3, $4, COALESCE((SELECT MAX(sort_order) + 1 FROM gallery_images WHERE user_id = $1), 1), NOW(), NOW())
			RETURNING id, user_id, image, privacy_level, is_main_photo, created_at
		`, userID, url, privacy, isPrimary).Scan(&img.ID, &img.UserID, &img.ImageURL, &privacyOut, &img.IsPrimary, &img.CreatedAt); err != nil {
			return err
		}
		img.IsPrivate = privacyOut != "public"
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &img, nil
}

// DeleteImage removes a gallery image owned by the user.
func (s *mediaService) DeleteImage(ctx context.Context, userID, imageID int64) error {
	var image string
	err := s.pg.Pool.QueryRow(ctx, `
		UPDATE gallery_images SET deleted_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
		RETURNING image
	`, imageID, userID).Scan(&image)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("image not found")
		}
		return err
	}
	// Best-effort removal of the file on disk.
	if rel := strings.TrimPrefix(image, s.baseURL+"/"); rel != image {
		_ = os.Remove(filepath.Join(s.uploadDir, filepath.FromSlash(rel)))
	}
	return nil
}

const accessRequestCols = `
	vgi.id, vgi.user_id, vgi.requested_by,
	TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
	vgi.status, vgi.created_at, vgi.updated_at
`

func statusToString(status int) string {
	switch status {
	case 1:
		return "accepted"
	case 2:
		return "rejected"
	default:
		return "pending"
	}
}

func scanAccessRequest(row interface{ Scan(...interface{}) error }) (*models.ViewGalleryImageRequest, error) {
	var r models.ViewGalleryImageRequest
	var status int
	err := row.Scan(&r.ID, &r.OwnerUserID, &r.RequestedByUserID, &r.RequesterName, &status, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		return nil, err
	}
	r.Status = statusToString(status)
	return &r, nil
}

// RequestMediaAccess asks a member for access to their private gallery.
func (s *mediaService) RequestMediaAccess(ctx context.Context, requesterID, targetUserID int64) (*models.ViewGalleryImageRequest, error) {
	if requesterID == targetUserID {
		return nil, ErrSelfRequest
	}

	var existingID int64
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT id FROM view_gallery_images WHERE user_id = $1 AND requested_by = $2 AND status IN (0, 1) LIMIT 1
	`, targetUserID, requesterID).Scan(&existingID)
	if err == nil {
		return nil, errors.New("an access request already exists for this member")
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	var newID int64
	err = s.pg.Pool.QueryRow(ctx, `
		INSERT INTO view_gallery_images (user_id, requested_by, status, created_at, updated_at)
		VALUES ($1, $2, 0, NOW(), NOW()) RETURNING id
	`, targetUserID, requesterID).Scan(&newID)
	if err != nil {
		return nil, err
	}

	s.notifier.Push(ctx, targetUserID, "media_access_requested", "Photo access request",
		"A member has requested access to your private photos.", map[string]interface{}{
			"request_id": newID,
			"action_url": "/settings/",
		})

	row := s.pg.Pool.QueryRow(ctx, `
		SELECT `+accessRequestCols+` FROM view_gallery_images vgi
		JOIN users u ON u.id = vgi.requested_by WHERE vgi.id = $1
	`, newID)
	return scanAccessRequest(row)
}

func (s *mediaService) reviewAccess(ctx context.Context, ownerID, requestID int64, newStatus int) (*models.ViewGalleryImageRequest, error) {
	var requesterID int64
	err := s.pg.Pool.QueryRow(ctx, `
		UPDATE view_gallery_images SET status = $1, updated_at = NOW()
		WHERE id = $2 AND user_id = $3
		RETURNING requested_by
	`, newStatus, requestID, ownerID).Scan(&requesterID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAccessRequestNotFound
		}
		return nil, err
	}

	if newStatus == 1 {
		s.notifier.Push(ctx, requesterID, "media_access_granted", "Photo access granted",
			"Your photo access request has been approved.", map[string]interface{}{
				"action_url": "/discover/",
			})
	}

	row := s.pg.Pool.QueryRow(ctx, `
		SELECT `+accessRequestCols+` FROM view_gallery_images vgi
		JOIN users u ON u.id = vgi.requested_by WHERE vgi.id = $1
	`, requestID)
	return scanAccessRequest(row)
}

// AcceptMediaAccess approves a pending request.
func (s *mediaService) AcceptMediaAccess(ctx context.Context, ownerID, requestID int64) (*models.ViewGalleryImageRequest, error) {
	return s.reviewAccess(ctx, ownerID, requestID, 1)
}

// RejectMediaAccess declines a pending request.
func (s *mediaService) RejectMediaAccess(ctx context.Context, ownerID, requestID int64) (*models.ViewGalleryImageRequest, error) {
	return s.reviewAccess(ctx, ownerID, requestID, 2)
}

// ListAccessRequests lists received (default) or sent requests.
func (s *mediaService) ListAccessRequests(ctx context.Context, userID int64, reqType string) ([]models.ViewGalleryImageRequest, error) {
	query := `
		SELECT ` + accessRequestCols + ` FROM view_gallery_images vgi
		JOIN users u ON u.id = vgi.requested_by
		WHERE vgi.user_id = $1 ORDER BY vgi.created_at DESC LIMIT 100
	`
	if reqType == "sent" {
		query = `
			SELECT ` + accessRequestCols + ` FROM view_gallery_images vgi
			JOIN users u ON u.id = vgi.user_id
			WHERE vgi.requested_by = $1 ORDER BY vgi.created_at DESC LIMIT 100
		`
	}
	rows, err := s.pg.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.ViewGalleryImageRequest{}
	for rows.Next() {
		r, err := scanAccessRequest(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *r)
	}
	return out, rows.Err()
}

// GetUserMedia returns a member's gallery, hiding private images without granted access.
func (s *mediaService) GetUserMedia(ctx context.Context, viewerID, targetUserID int64) ([]models.GalleryImage, error) {
	hasAccess := viewerID == targetUserID
	var galleryPrivacy string
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(gallery_privacy, 'public') FROM members WHERE user_id = $1`, targetUserID).Scan(&galleryPrivacy)
	if galleryPrivacy == "" {
		galleryPrivacy = "public"
	}

	if !hasAccess {
		if galleryPrivacy == "private" {
			hasAccess = false
		} else if galleryPrivacy == "only_share_with" || galleryPrivacy == "shared" {
			var status int
			err := s.pg.Pool.QueryRow(ctx, `
				SELECT status FROM view_gallery_images
				WHERE user_id = $1 AND requested_by = $2
				ORDER BY id DESC LIMIT 1
			`, targetUserID, viewerID).Scan(&status)
			hasAccess = err == nil && status == 1
		} else {
			hasAccess = true
		}
	}

	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, user_id, ` + assets.PhotoSQL("image") + `, privacy_level, is_main_photo, created_at
		FROM gallery_images
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY is_main_photo DESC, sort_order, id
	`, targetUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.GalleryImage{}
	for rows.Next() {
		var img models.GalleryImage
		var privacy string
		if err := rows.Scan(&img.ID, &img.UserID, &img.ImageURL, &privacy, &img.IsPrimary, &img.CreatedAt); err != nil {
			return nil, err
		}
		img.IsPrivate = (galleryPrivacy != "public") || (privacy != "public")
		if img.IsPrivate && !hasAccess {
			img.ImageURL = "" // Locked — frontend renders a locked tile.
		}
		out = append(out, img)
	}
	return out, rows.Err()
}

// GetGalleryPrivacy returns the member's privacy level, shared doctors, and incoming requests.
func (s *mediaService) GetGalleryPrivacy(ctx context.Context, userID int64) (*GalleryPrivacyResponse, error) {
	var privacy string
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(gallery_privacy, 'public') FROM members WHERE user_id = $1`, userID).Scan(&privacy)
	if privacy == "" {
		privacy = "public"
	}

	sharedUsers := []SharedUserDTO{}
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT 
			v.id, 
			u.id, 
			COALESCE(u.first_name, ''), 
			COALESCE(u.last_name, ''), 
			`+assets.PhotoSQLWithUserFallback("u.photo", "u.id")+`, 
			COALESCE(m.gender, ''),
			COALESCE(edu.degree, ''), 
			COALESCE(car.speciality, ''),
			COALESCE(ci.name, ''),
			v.updated_at
		FROM view_gallery_images v
		JOIN users u ON u.id = v.requested_by
		LEFT JOIN members m ON m.user_id = u.id
		LEFT JOIN addresses a ON a.user_id = u.id AND a.type = 'present'
		LEFT JOIN cities ci ON ci.id = a.city_id
		LEFT JOIN LATERAL (
			SELECT e.degree FROM education e WHERE e.user_id = u.id ORDER BY e.is_highest_degree DESC, e.id DESC LIMIT 1
		) edu ON TRUE
		LEFT JOIN LATERAL (
			SELECT COALESCE(s2.name, c.designation, '') AS speciality
			FROM careers c LEFT JOIN specialities s2 ON s2.id = c.speciality_id
			WHERE c.user_id = u.id ORDER BY c.present DESC, c.id DESC LIMIT 1
		) car ON TRUE
		WHERE v.user_id = $1 AND v.status = 1
		ORDER BY v.updated_at DESC
	`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var u SharedUserDTO
			if err := rows.Scan(&u.ID, &u.UserID, &u.FirstName, &u.LastName, &u.Photo, &u.Gender, &u.Degree, &u.Speciality, &u.City, &u.SharedAt); err == nil {
				sharedUsers = append(sharedUsers, u)
			}
		}
	}

	pending, _ := s.ListAccessRequests(ctx, userID, "received")

	return &GalleryPrivacyResponse{
		Privacy:         privacy,
		SharedUsers:     sharedUsers,
		PendingRequests: pending,
	}, nil
}

// SetGalleryPrivacy sets members.gallery_privacy and synchronizes gallery_images.
func (s *mediaService) SetGalleryPrivacy(ctx context.Context, userID int64, privacy string) error {
	if privacy != "public" && privacy != "private" && privacy != "only_share_with" && privacy != "shared" {
		privacy = "public"
	}
	if privacy == "shared" {
		privacy = "only_share_with"
	}

	_, err := s.pg.Pool.Exec(ctx, `
		UPDATE members SET gallery_privacy = $1, updated_at = NOW() WHERE user_id = $2
	`, privacy, userID)
	if err != nil {
		return err
	}

	imgPrivacy := "public"
	if privacy == "private" {
		imgPrivacy = "private"
	} else if privacy == "only_share_with" {
		imgPrivacy = "shared"
	}

	_, err = s.pg.Pool.Exec(ctx, `
		UPDATE gallery_images SET privacy_level = $1, updated_at = NOW() WHERE user_id = $2 AND is_main_photo = false
	`, imgPrivacy, userID)
	return err
}

// ShareGalleryWithUser grants a specific friend / doctor permission to view private gallery photos.
func (s *mediaService) ShareGalleryWithUser(ctx context.Context, ownerID, targetUserID int64) (*SharedUserDTO, error) {
	if ownerID == targetUserID {
		return nil, errors.New("cannot share gallery with yourself")
	}

	var exists bool
	_ = s.pg.Pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND deleted_at IS NULL)`, targetUserID).Scan(&exists)
	if !exists {
		return nil, errors.New("doctor or member with this ID not found")
	}

	var reqID int64
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT id FROM view_gallery_images WHERE user_id = $1 AND requested_by = $2 LIMIT 1
	`, ownerID, targetUserID).Scan(&reqID)

	if err == nil && reqID > 0 {
		_, err = s.pg.Pool.Exec(ctx, `UPDATE view_gallery_images SET status = 1, updated_at = NOW() WHERE id = $1`, reqID)
	} else {
		_, err = s.pg.Pool.Exec(ctx, `INSERT INTO view_gallery_images (user_id, requested_by, status, created_at, updated_at) VALUES ($1, $2, 1, NOW(), NOW())`, ownerID, targetUserID)
	}
	if err != nil {
		return nil, err
	}

	// Switch privacy to only_share_with if it was strictly private
	var currentPrivacy string
	_ = s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(gallery_privacy, 'public') FROM members WHERE user_id = $1`, ownerID).Scan(&currentPrivacy)
	if currentPrivacy == "private" {
		_ = s.SetGalleryPrivacy(ctx, ownerID, "only_share_with")
	}

	var u SharedUserDTO
	_ = s.pg.Pool.QueryRow(ctx, `
		SELECT 
			v.id, 
			u.id, 
			COALESCE(u.first_name, ''), 
			COALESCE(u.last_name, ''), 
			`+assets.PhotoSQLWithUserFallback("u.photo", "u.id")+`, 
			COALESCE(m.gender, ''),
			COALESCE(edu.degree, ''), 
			COALESCE(car.speciality, ''),
			COALESCE(ci.name, ''),
			v.updated_at
		FROM view_gallery_images v
		JOIN users u ON u.id = v.requested_by
		LEFT JOIN members m ON m.user_id = u.id
		LEFT JOIN addresses a ON a.user_id = u.id AND a.type = 'present'
		LEFT JOIN cities ci ON ci.id = a.city_id
		LEFT JOIN LATERAL (
			SELECT e.degree FROM education e WHERE e.user_id = u.id ORDER BY e.is_highest_degree DESC, e.id DESC LIMIT 1
		) edu ON TRUE
		LEFT JOIN LATERAL (
			SELECT COALESCE(s2.name, c.designation, '') AS speciality
			FROM careers c LEFT JOIN specialities s2 ON s2.id = c.speciality_id
			WHERE c.user_id = u.id ORDER BY c.present DESC, c.id DESC LIMIT 1
		) car ON TRUE
		WHERE v.user_id = $1 AND v.requested_by = $2 AND v.status = 1
		ORDER BY v.id DESC LIMIT 1
	`, ownerID, targetUserID).Scan(&u.ID, &u.UserID, &u.FirstName, &u.LastName, &u.Photo, &u.Gender, &u.Degree, &u.Speciality, &u.City, &u.SharedAt)

	return &u, nil
}

// RevokeGalleryAccess removes gallery access permission for a member.
func (s *mediaService) RevokeGalleryAccess(ctx context.Context, ownerID, targetUserID int64) error {
	_, err := s.pg.Pool.Exec(ctx, `
		DELETE FROM view_gallery_images WHERE user_id = $1 AND requested_by = $2
	`, ownerID, targetUserID)
	return err
}

// SetProfilePhoto sets an existing gallery image as the primary profile photo.
func (s *mediaService) SetProfilePhoto(ctx context.Context, userID, imageID int64) error {
	return s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		var imgURL string
		err := tx.QueryRow(ctx, `
			SELECT image FROM gallery_images WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
		`, imageID, userID).Scan(&imgURL)
		if err != nil {
			return errors.New("photo not found in gallery")
		}
		if _, err := tx.Exec(ctx, `UPDATE gallery_images SET is_main_photo = false, updated_at = NOW() WHERE user_id = $1`, userID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE gallery_images SET is_main_photo = true, updated_at = NOW() WHERE id = $1`, imageID); err != nil {
			return err
		}
		_, err = tx.Exec(ctx, `UPDATE users SET photo = $1, photo_approved = 1, updated_at = NOW() WHERE id = $2`, imgURL, userID)
		return err
	})
}
