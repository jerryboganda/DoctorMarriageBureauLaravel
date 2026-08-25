package chat

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler handles chat and presence HTTP & WebSocket requests.
type Handler struct {
	service Service
}

// NewHandler creates a new Chat handler.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// Routes sets up Chi routing for Chat domain.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/ws", h.HandleWebSocket)
	r.Get("/threads", h.HandleListThreads)
	r.Get("/threads/{id}/messages", h.HandleGetMessages)
	r.Post("/threads/{id}/messages", h.HandleSendMessage)
	r.Post("/threads/{id}/share-biodata", h.HandleShareBiodata)
	r.Post("/presence/heartbeat", h.HandleHeartbeat)
	r.Get("/presence/{id}", h.HandleGetPresence)

	return r
}

// HandleWebSocket upgrades HTTP to WebSocket connection.
func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// The Authenticate middleware runs before this handler and sets the
	// authenticated user ID in context. Never trust a user-supplied query param.
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || userID <= 0 {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	hub := h.service.GetHub()
	client := NewClient(hub, conn, userID, h.service)
	hub.register <- client

	go client.WritePump()
	go client.ReadPump()
}

// HandleListThreads handles GET /api/v1/chat/threads
func (h *Handler) HandleListThreads(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	threads, err := h.service.ListThreads(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "THREADS_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, threads, "Chat threads retrieved successfully")
}

// HandleGetMessages handles GET /api/v1/chat/threads/{id}/messages
func (h *Handler) HandleGetMessages(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	threadID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || threadID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid thread ID", nil)
		return
	}

	cursor := r.URL.Query().Get("cursor")
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	messages, err := h.service.GetMessages(r.Context(), userID, threadID, cursor, limit)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "MESSAGES_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, messages, "Messages retrieved and marked as read")
}

// HandleSendMessage handles POST /api/v1/chat/threads/{id}/messages
func (h *Handler) HandleSendMessage(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	threadID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || threadID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid thread ID", nil)
		return
	}

	var req struct {
		Message        string `json:"message"`
		AttachmentKey  string `json:"attachment_key"`
		IsBiodataShare bool   `json:"is_biodata_share"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	msg, err := h.service.SendMessage(r.Context(), userID, threadID, req.Message, req.AttachmentKey, req.IsBiodataShare)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "SEND_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusCreated, msg, "Message sent")
}

// HandleShareBiodata handles POST /api/v1/chat/threads/{id}/share-biodata
func (h *Handler) HandleShareBiodata(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	threadID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || threadID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid thread ID", nil)
		return
	}

	msg, err := h.service.ShareBiodata(r.Context(), userID, threadID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "SHARE_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, msg, "Biodata shared in conversation")
}

// HandleHeartbeat handles POST /api/v1/chat/presence/heartbeat
func (h *Handler) HandleHeartbeat(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	if err := h.service.RecordHeartbeat(userID); err != nil {
		response.Error(w, http.StatusInternalServerError, "HEARTBEAT_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"online": true}, "Presence heartbeat acknowledged")
}

// HandleGetPresence handles GET /api/v1/chat/presence/{id}
func (h *Handler) HandleGetPresence(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || targetID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid user ID", nil)
		return
	}

	isOnline := h.service.IsUserOnline(targetID)
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"user_id":   targetID,
		"is_online": isOnline,
	}, "Presence status retrieved")
}
