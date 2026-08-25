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
	if !hasAccess {
		var status int
		err := s.pg.Pool.QueryRow(ctx, `
			SELECT status FROM view_gallery_images
			WHERE user_id = $1 AND requested_by = $2
			ORDER BY id DESC LIMIT 1
		`, targetUserID, viewerID).Scan(&status)
		hasAccess = err == nil && status == 1
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
		img.IsPrivate = privacy != "public"
		if img.IsPrivate && !hasAccess {
			img.ImageURL = "" // Locked — frontend renders a locked tile.
		}
		out = append(out, img)
	}
	return out, rows.Err()
}
