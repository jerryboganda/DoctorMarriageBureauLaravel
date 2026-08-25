package engagement

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler exposes engagement routes (overview, referrals, family, communities, settings).
type Handler struct {
	service *Service
}

// NewHandler creates the engagement handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Routes wires engagement endpoints.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/overview", h.HandleOverview)
	r.Get("/referrals", h.HandleReferrals)
	r.Get("/family", h.HandleGetFamily)
	r.Put("/family", h.HandleUpsertFamily)
	r.Post("/family/guardians", h.HandleAddGuardian)
	r.Delete("/family/guardians/{id}", h.HandleDeleteGuardian)
	r.Get("/communities", h.HandleListCommunities)
	r.Post("/communities/{id}/join", h.HandleJoinCommunity)
	r.Post("/communities/{id}/leave", h.HandleLeaveCommunity)
	r.Get("/settings/notifications", h.HandleGetNotificationPrefs)
	r.Put("/settings/notifications", h.HandleUpdateNotificationPrefs)
	r.Put("/settings/visibility", h.HandleSetVisibility)
	r.Post("/account/deactivate", h.HandleDeactivate)

	return r
}

func (h *Handler) userID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return 0, false
	}
	return userID, true
}

// HandleOverview handles GET /api/v1/dashboard/overview
func (h *Handler) HandleOverview(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	ov, err := h.service.GetOverview(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "OVERVIEW_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, ov, "Dashboard overview retrieved")
}

// HandleReferrals handles GET /api/v1/dashboard/referrals
func (h *Handler) HandleReferrals(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	info, err := h.service.GetReferralInfo(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "REFERRALS_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, info, "Referral info retrieved")
}

// HandleGetFamily handles GET /api/v1/dashboard/family
func (h *Handler) HandleGetFamily(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	fp, err := h.service.GetFamily(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "FAMILY_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, fp, "Family profile retrieved")
}

// HandleUpsertFamily handles PUT /api/v1/dashboard/family
func (h *Handler) HandleUpsertFamily(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	var in UpsertFamilyInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	fp, err := h.service.UpsertFamily(r.Context(), userID, in)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "FAMILY_SAVE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, fp, "Family profile saved")
}

// HandleAddGuardian handles POST /api/v1/dashboard/family/guardians
func (h *Handler) HandleAddGuardian(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	var in GuardianInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	g, err := h.service.AddGuardian(r.Context(), userID, in)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "GUARDIAN_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusCreated, g, "Guardian added")
}

// HandleDeleteGuardian handles DELETE /api/v1/dashboard/family/guardians/{id}
func (h *Handler) HandleDeleteGuardian(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid guardian ID", nil)
		return
	}
	if err := h.service.DeleteGuardian(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusBadRequest, "GUARDIAN_DELETE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]bool{"deleted": true}, "Guardian removed")
}

// HandleListCommunities handles GET /api/v1/dashboard/communities
func (h *Handler) HandleListCommunities(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	list, err := h.service.ListCommunities(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "COMMUNITIES_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, list, "Communities retrieved")
}

// HandleJoinCommunity handles POST /api/v1/dashboard/communities/{id}/join
func (h *Handler) HandleJoinCommunity(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid community ID", nil)
		return
	}
	status, err := h.service.JoinCommunity(r.Context(), userID, id)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "JOIN_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": status}, "Community join processed")
}

// HandleLeaveCommunity handles POST /api/v1/dashboard/communities/{id}/leave
func (h *Handler) HandleLeaveCommunity(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid community ID", nil)
		return
	}
	if err := h.service.LeaveCommunity(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "LEAVE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "left"}, "Community left")
}

// HandleGetNotificationPrefs handles GET /api/v1/dashboard/settings/notifications
func (h *Handler) HandleGetNotificationPrefs(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	prefs, err := h.service.GetNotificationPrefs(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PREFS_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, prefs, "Notification preferences retrieved")
}

// HandleUpdateNotificationPrefs handles PUT /api/v1/dashboard/settings/notifications
func (h *Handler) HandleUpdateNotificationPrefs(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	var p NotificationPrefs
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	saved, err := h.service.UpdateNotificationPrefs(r.Context(), userID, p)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PREFS_SAVE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, saved, "Notification preferences saved")
}

// HandleSetVisibility handles PUT /api/v1/dashboard/settings/visibility
func (h *Handler) HandleSetVisibility(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	var in struct {
		Visible bool `json:"visible"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	if err := h.service.SetProfileVisibility(r.Context(), userID, in.Visible); err != nil {
		response.Error(w, http.StatusInternalServerError, "VISIBILITY_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]bool{"visible": in.Visible}, "Profile visibility updated")
}

// HandleDeactivate handles POST /api/v1/dashboard/account/deactivate
func (h *Handler) HandleDeactivate(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.userID(w, r)
	if !ok {
		return
	}
	if err := h.service.DeactivateAccount(r.Context(), userID); err != nil {
		response.Error(w, http.StatusInternalServerError, "DEACTIVATE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]bool{"deactivated": true}, "Account deactivated")
}
