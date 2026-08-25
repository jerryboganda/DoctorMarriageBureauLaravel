package notifications

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler serves notification HTTP endpoints.
type Handler struct {
	service *Service
}

// NewHandler creates a notifications handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Routes wires notification endpoints.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.HandleList)
	r.Get("/unread-count", h.HandleUnreadCount)
	r.Post("/{id}/read", h.HandleMarkRead)
	r.Post("/read-all", h.HandleMarkAllRead)
	return r
}

// HandleList handles GET /api/v1/notifications
func (h *Handler) HandleList(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	items, total, unread, err := h.service.List(r.Context(), userID, limit, offset)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "NOTIFICATIONS_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"items":        items,
		"total":        total,
		"unread_count": unread,
	}, "Notifications retrieved")
}

// HandleUnreadCount handles GET /api/v1/notifications/unread-count
func (h *Handler) HandleUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	unread, err := h.service.UnreadCount(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "NOTIFICATIONS_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]int64{"unread_count": unread}, "Unread count retrieved")
}

// HandleMarkRead handles POST /api/v1/notifications/{id}/read
func (h *Handler) HandleMarkRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Notification ID required", nil)
		return
	}

	if err := h.service.MarkRead(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "NOTIFICATIONS_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"read": true}, "Notification marked as read")
}

// HandleMarkAllRead handles POST /api/v1/notifications/read-all
func (h *Handler) HandleMarkAllRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	if err := h.service.MarkAllRead(r.Context(), userID); err != nil {
		response.Error(w, http.StatusInternalServerError, "NOTIFICATIONS_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"read": true}, "All notifications marked as read")
}
