package media

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler handles media upload and privacy access HTTP requests.
type Handler struct {
	service Service
}

// NewHandler creates a new Media handler.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// Routes sets up Chi routing for Media domain.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Post("/upload-url", h.HandleGetPresignedURL)
	r.Post("/upload", h.HandleDirectUpload)
	r.Post("/confirm", h.HandleConfirmUpload)
	r.Delete("/{id}", h.HandleDeleteImage)
	r.Post("/access-requests", h.HandleRequestAccess)
	r.Post("/access-requests/{id}/accept", h.HandleAcceptAccess)
	r.Post("/access-requests/{id}/reject", h.HandleRejectAccess)
	r.Get("/access-requests", h.HandleListAccessRequests)
	r.Get("/user/{id}", h.HandleGetUserMedia)

	return r
}

// HandleDirectUpload handles POST /api/v1/media/upload (multipart form).
func (h *Handler) HandleDirectUpload(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	if err := r.ParseMultipartForm(12 << 20); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_UPLOAD", "Invalid multipart form", err.Error())
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "FILE_REQUIRED", "A 'file' form field is required", nil)
		return
	}
	defer file.Close()

	category := r.FormValue("category")
	isPrimary := r.FormValue("is_primary") == "true" || r.FormValue("is_primary") == "1"
	isPrivate := r.FormValue("is_private") == "true" || r.FormValue("is_private") == "1"

	img, err := h.service.SaveUpload(r.Context(), userID, header.Filename, category, isPrimary, isPrivate, file)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "UPLOAD_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusCreated, img, "Image uploaded successfully")
}

// HandleDeleteImage handles DELETE /api/v1/media/{id}
func (h *Handler) HandleDeleteImage(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	imageID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || imageID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid image ID", nil)
		return
	}

	if err := h.service.DeleteImage(r.Context(), userID, imageID); err != nil {
		response.Error(w, http.StatusBadRequest, "DELETE_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"deleted": true}, "Image deleted")
}

// HandleGetPresignedURL handles POST /api/v1/media/upload-url
func (h *Handler) HandleGetPresignedURL(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		FileName    string `json:"file_name"`
		ContentType string `json:"content_type"`
		Category    string `json:"category"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	if req.FileName == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "file_name is required", nil)
		return
	}

	resp, err := h.service.GetPresignedUploadURL(r.Context(), userID, req.FileName, req.ContentType, req.Category)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "UPLOAD_URL_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, resp, "Presigned upload URL generated")
}

// HandleConfirmUpload handles POST /api/v1/media/confirm
func (h *Handler) HandleConfirmUpload(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		Key       string `json:"key"`
		Category  string `json:"category"`
		IsPrimary bool   `json:"is_primary"`
		IsPrivate bool   `json:"is_private"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Key == "" {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "storage key is required", nil)
		return
	}

	media, err := h.service.ConfirmUpload(r.Context(), userID, req.Key, req.Category, req.IsPrimary, req.IsPrivate)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "CONFIRM_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, media, "Media registered and processed")
}

// HandleRequestAccess handles POST /api/v1/media/access-requests
func (h *Handler) HandleRequestAccess(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		TargetUserID int64 `json:"target_user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.TargetUserID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "target_user_id is required", nil)
		return
	}

	accessReq, err := h.service.RequestMediaAccess(r.Context(), userID, req.TargetUserID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ACCESS_REQUEST_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, accessReq, "Media access request dispatched")
}

// HandleAcceptAccess handles POST /api/v1/media/access-requests/{id}/accept
func (h *Handler) HandleAcceptAccess(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	requestID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || requestID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid request ID", nil)
		return
	}

	accessReq, err := h.service.AcceptMediaAccess(r.Context(), userID, requestID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ACCEPT_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, accessReq, "Media access granted")
}

// HandleRejectAccess handles POST /api/v1/media/access-requests/{id}/reject
func (h *Handler) HandleRejectAccess(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	requestID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || requestID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid request ID", nil)
		return
	}

	accessReq, err := h.service.RejectMediaAccess(r.Context(), userID, requestID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "REJECT_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, accessReq, "Media access request rejected")
}

// HandleListAccessRequests handles GET /api/v1/media/access-requests?type=received|sent
func (h *Handler) HandleListAccessRequests(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	reqType := r.URL.Query().Get("type")
	list, err := h.service.ListAccessRequests(r.Context(), userID, reqType)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "LIST_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, list, "Access requests retrieved")
}

// HandleGetUserMedia handles GET /api/v1/media/user/{id}
func (h *Handler) HandleGetUserMedia(w http.ResponseWriter, r *http.Request) {
	viewerID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	targetUserID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || targetUserID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid target user ID", nil)
		return
	}

	mediaList, err := h.service.GetUserMedia(r.Context(), viewerID, targetUserID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "MEDIA_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, mediaList, "User media retrieved")
}
