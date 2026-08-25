package matching

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler handles matching and proposal HTTP requests.
type Handler struct {
	service Service
}

// NewHandler creates a new matching handler.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// Routes sets up Chi routing for matching domain.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Post("/express", h.HandleExpressInterest)
	r.Get("/requests", h.HandleListRequests)
	r.Post("/{id}/accept", h.HandleAcceptInterest)
	r.Post("/{id}/reject", h.HandleRejectInterest)
	r.Post("/{id}/withdraw", h.HandleWithdrawInterest)

	return r
}

// ShortlistRoutes sets up Chi routing for shortlists domain.
func (h *Handler) ShortlistRoutes() chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.HandleListShortlists)
	r.Post("/", h.HandleAddShortlist)
	r.Delete("/{user_id}", h.HandleRemoveShortlist)

	return r
}

// HandleExpressInterest handles POST /api/v1/interests/express
func (h *Handler) HandleExpressInterest(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		UserID  int64  `json:"user_id"`
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	if req.UserID <= 0 {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Target user ID is required", nil)
		return
	}

	proposal, err := h.service.ExpressInterest(r.Context(), userID, req.UserID, req.Message)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "PROPOSAL_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, proposal, "Interest expressed successfully")
}

// HandleListRequests handles GET /api/v1/interests/requests?type=received|sent
func (h *Handler) HandleListRequests(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	reqType := r.URL.Query().Get("type")
	list, err := h.service.ListInterests(r.Context(), userID, reqType)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "LIST_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, list, "Interests retrieved successfully")
}

// HandleAcceptInterest handles POST /api/v1/interests/{id}/accept
func (h *Handler) HandleAcceptInterest(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	proposalID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || proposalID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID", nil)
		return
	}

	proposal, err := h.service.AcceptInterest(r.Context(), userID, proposalID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ACCEPT_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, proposal, "Proposal accepted and chat thread provisioned")
}

// HandleRejectInterest handles POST /api/v1/interests/{id}/reject
func (h *Handler) HandleRejectInterest(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	proposalID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || proposalID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID", nil)
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	proposal, err := h.service.RejectInterest(r.Context(), userID, proposalID, req.Reason)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "REJECT_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, proposal, "Proposal rejected")
}

// HandleWithdrawInterest handles POST /api/v1/interests/{id}/withdraw
func (h *Handler) HandleWithdrawInterest(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	proposalID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || proposalID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID", nil)
		return
	}

	proposal, err := h.service.WithdrawInterest(r.Context(), userID, proposalID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "WITHDRAW_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, proposal, "Proposal withdrawn")
}

// HandleListShortlists handles GET /api/v1/shortlists
func (h *Handler) HandleListShortlists(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	shortlists, err := h.service.ListShortlists(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "SHORTLIST_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, shortlists, "Shortlists retrieved")
}

// HandleAddShortlist handles POST /api/v1/shortlists
func (h *Handler) HandleAddShortlist(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		UserID int64 `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Valid user_id required", nil)
		return
	}

	shortlist, err := h.service.AddShortlist(r.Context(), userID, req.UserID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "SHORTLIST_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, shortlist, "Added to shortlists")
}

// HandleRemoveShortlist handles DELETE /api/v1/shortlists/{user_id}
func (h *Handler) HandleRemoveShortlist(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	targetStr := chi.URLParam(r, "user_id")
	targetID, err := strconv.ParseInt(targetStr, 10, 64)
	if err != nil || targetID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid target user ID", nil)
		return
	}

	if err := h.service.RemoveShortlist(r.Context(), userID, targetID); err != nil {
		response.Error(w, http.StatusInternalServerError, "SHORTLIST_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"removed": true}, "Removed from shortlists")
}
