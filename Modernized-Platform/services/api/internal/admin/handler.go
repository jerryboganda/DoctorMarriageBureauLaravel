package admin

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler handles admin HTTP requests.
type Handler struct {
	service *Service
}

// NewHandler creates admin handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Routes wires admin endpoints under /admin (mounted inside authenticated group).
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	// Stats & doctors
	r.Get("/stats", h.HandleStats)
	r.Get("/doctors", h.HandleListDoctors)
	r.Get("/doctors/{id}", h.HandleGetDoctor)
	r.Post("/doctors", h.HandleCreateDoctor)
	r.Put("/doctors/{id}", h.HandleUpdateDoctor)
	r.Patch("/doctors/{id}/status", h.HandleUpdateDoctorStatus)
	r.Delete("/doctors/{id}", h.HandleDeleteDoctor)

	// Verifications
	r.Get("/verifications", h.HandleListVerifications)
	r.Post("/verifications/{id}/review", h.HandleReviewVerification)

	// Payments
	r.Get("/payments", h.HandleListPayments)
	r.Post("/payments/{id}/review", h.HandleReviewPayment)

	// Proposals
	r.Get("/proposals", h.HandleListProposals)

	// Packages
	r.Get("/packages", h.HandleListPackages)
	r.Post("/packages", h.HandleCreatePackage)
	r.Put("/packages/{id}", h.HandleUpdatePackage)
	r.Delete("/packages/{id}", h.HandleDeletePackage)

	// Tickets
	r.Get("/tickets", h.HandleListTickets)
	r.Post("/tickets/{id}/resolve", h.HandleResolveTicket)

	// Happy stories
	r.Get("/happy-stories", h.HandleListHappyStories)
	r.Post("/happy-stories/{id}/review", h.HandleReviewHappyStory)

	// Settings
	r.Get("/settings", h.HandleGetSettings)
	r.Put("/settings", h.HandleUpdateSettings)

	return r
}

func (h *Handler) getUserID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	uid, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok || uid <= 0 {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return 0, false
	}
	return uid, true
}

func (h *Handler) requireAdmin(w http.ResponseWriter, r *http.Request) bool {
	uid, ok := h.getUserID(w, r)
	if !ok {
		return false
	}
	isAdmin, err := h.service.IsAdmin(r.Context(), uid)
	if err != nil {
		slog.Warn("admin isAdmin check failed", "uid", uid, "error", err)
		// Fail closed: deny when the admin check cannot be confirmed.
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "Admin privileges required", nil)
		return false
	}
	if !isAdmin {
		slog.Warn("admin write denied: non-admin user attempted write", "uid", uid, "path", r.URL.Path)
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "Admin privileges required", nil)
		return false
	}
	return true
}

// allowReadWithLog enforces admin privileges for all /admin read endpoints.
// Any authenticated but non-admin member must be denied to prevent PII exposure.
func (h *Handler) allowReadWithLog(w http.ResponseWriter, r *http.Request) bool {
	return h.requireAdmin(w, r)
}

// HandleStats GET /admin/stats
func (h *Handler) HandleStats(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	stats, err := h.service.GetStats(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "STATS_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, stats, "Admin stats retrieved")
}

// HandleListDoctors GET /admin/doctors
func (h *Handler) HandleListDoctors(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	list, err := h.service.ListDoctors(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "DOCTORS_ERROR", err.Error(), nil)
		return
	}
	if list == nil {
		list = []AdminDoctor{}
	}
	response.JSON(w, http.StatusOK, list, "Doctors retrieved")
}

// HandleGetDoctor GET /admin/doctors/{id}
func (h *Handler) HandleGetDoctor(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid doctor ID", nil)
		return
	}
	d, err := h.service.GetDoctorByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, d, "Doctor retrieved")
}

// HandleCreateDoctor POST /admin/doctors
func (h *Handler) HandleCreateDoctor(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	var in AdminDoctor
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	created, err := h.service.CreateDoctor(r.Context(), in)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "CREATE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusCreated, created, "Doctor created")
}

// HandleUpdateDoctor PUT /admin/doctors/{id}
func (h *Handler) HandleUpdateDoctor(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid doctor ID", nil)
		return
	}
	var in AdminDoctor
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	updated, err := h.service.UpdateDoctor(r.Context(), id, in)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, updated, "Doctor updated")
}

// HandleUpdateDoctorStatus PATCH /admin/doctors/{id}/status
func (h *Handler) HandleUpdateDoctorStatus(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid doctor ID", nil)
		return
	}
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Status) == "" {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "status is required (active|suspended|pending)", nil)
		return
	}
	if err := h.service.UpdateDoctorStatus(r.Context(), id, req.Status); err != nil {
		response.Error(w, http.StatusBadRequest, "STATUS_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": req.Status}, "Doctor status updated")
}

// HandleDeleteDoctor DELETE /admin/doctors/{id}
func (h *Handler) HandleDeleteDoctor(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid doctor ID", nil)
		return
	}
	if err := h.service.DeleteDoctor(r.Context(), id); err != nil {
		response.Error(w, http.StatusInternalServerError, "DELETE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]bool{"deleted": true}, "Doctor deleted")
}

// HandleListVerifications GET /admin/verifications
func (h *Handler) HandleListVerifications(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	status := r.URL.Query().Get("status")
	list, err := h.service.ListVerifications(r.Context(), status)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "VERIFICATIONS_ERROR", err.Error(), nil)
		return
	}
	if list == nil {
		list = []AdminVerification{}
	}
	response.JSON(w, http.StatusOK, list, "Verifications retrieved")
}

// HandleReviewVerification POST /admin/verifications/{id}/review
func (h *Handler) HandleReviewVerification(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid verification ID", nil)
		return
	}
	var req struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Status) == "" {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "status is required (approved|rejected)", nil)
		return
	}
	if err := h.service.ReviewVerification(r.Context(), id, req.Status, req.Reason); err != nil {
		response.Error(w, http.StatusBadRequest, "REVIEW_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": req.Status}, "Verification reviewed")
}

// HandleListPayments GET /admin/payments
func (h *Handler) HandleListPayments(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	list, err := h.service.ListPayments(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PAYMENTS_ERROR", err.Error(), nil)
		return
	}
	if list == nil {
		list = []AdminPayment{}
	}
	response.JSON(w, http.StatusOK, list, "Payments retrieved")
}

// HandleReviewPayment POST /admin/payments/{id}/review
func (h *Handler) HandleReviewPayment(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid payment ID", nil)
		return
	}
	var req struct {
		Status     string `json:"status"`
		AdminNotes string `json:"admin_notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Status) == "" {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "status is required (approved|rejected)", nil)
		return
	}
	if err := h.service.ReviewPayment(r.Context(), id, req.Status, req.AdminNotes); err != nil {
		response.Error(w, http.StatusBadRequest, "REVIEW_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": req.Status}, "Payment reviewed")
}

// HandleListProposals GET /admin/proposals
func (h *Handler) HandleListProposals(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	list, err := h.service.ListProposals(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PROPOSALS_ERROR", err.Error(), nil)
		return
	}
	if list == nil {
		list = []AdminProposal{}
	}
	response.JSON(w, http.StatusOK, list, "Proposals retrieved")
}

// HandleListPackages GET /admin/packages
func (h *Handler) HandleListPackages(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	list, err := h.service.ListPackages(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PACKAGES_ERROR", err.Error(), nil)
		return
	}
	if list == nil {
		list = []AdminPackage{}
	}
	response.JSON(w, http.StatusOK, list, "Packages retrieved")
}

// HandleCreatePackage POST /admin/packages
func (h *Handler) HandleCreatePackage(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	var in AdminPackage
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	created, err := h.service.CreatePackage(r.Context(), in)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "CREATE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusCreated, created, "Package created")
}

// HandleUpdatePackage PUT /admin/packages/{id}
func (h *Handler) HandleUpdatePackage(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid package ID", nil)
		return
	}
	var in AdminPackage
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	updated, err := h.service.UpdatePackage(r.Context(), id, in)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, updated, "Package updated")
}

// HandleDeletePackage DELETE /admin/packages/{id}
func (h *Handler) HandleDeletePackage(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid package ID", nil)
		return
	}
	if err := h.service.DeletePackage(r.Context(), id); err != nil {
		response.Error(w, http.StatusInternalServerError, "DELETE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]bool{"deleted": true}, "Package deleted")
}

// HandleListTickets GET /admin/tickets
func (h *Handler) HandleListTickets(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	list, err := h.service.ListTickets(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "TICKETS_ERROR", err.Error(), nil)
		return
	}
	if list == nil {
		list = []AdminTicket{}
	}
	response.JSON(w, http.StatusOK, list, "Tickets retrieved")
}

// HandleResolveTicket POST /admin/tickets/{id}/resolve
func (h *Handler) HandleResolveTicket(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid ticket ID", nil)
		return
	}
	var req struct {
		Status     string `json:"status"`
		Resolution string `json:"resolution"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Status) == "" {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "status is required (resolved|dismissed|in_progress)", nil)
		return
	}
	if err := h.service.ResolveTicket(r.Context(), id, req.Status, req.Resolution); err != nil {
		response.Error(w, http.StatusBadRequest, "RESOLVE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": req.Status}, "Ticket resolved")
}

// HandleListHappyStories GET /admin/happy-stories
func (h *Handler) HandleListHappyStories(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	list, err := h.service.ListHappyStories(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "STORIES_ERROR", err.Error(), nil)
		return
	}
	if list == nil {
		list = []AdminHappyStory{}
	}
	response.JSON(w, http.StatusOK, list, "Happy stories retrieved")
}

// HandleReviewHappyStory POST /admin/happy-stories/{id}/review
func (h *Handler) HandleReviewHappyStory(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid story ID", nil)
		return
	}
	var req struct {
		Status     string `json:"status"`
		IsFeatured bool   `json:"is_featured"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Status) == "" {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "status is required (approved|pending|rejected)", nil)
		return
	}
	if err := h.service.ReviewHappyStory(r.Context(), id, req.Status, req.IsFeatured); err != nil {
		response.Error(w, http.StatusBadRequest, "REVIEW_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]interface{}{"status": req.Status, "is_featured": req.IsFeatured}, "Happy story reviewed")
}

// HandleGetSettings GET /admin/settings
func (h *Handler) HandleGetSettings(w http.ResponseWriter, r *http.Request) {
	if !h.allowReadWithLog(w, r) {
		return
	}
	s, err := h.service.GetSettings(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "SETTINGS_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, s, "Settings retrieved")
}

// HandleUpdateSettings PUT /admin/settings
func (h *Handler) HandleUpdateSettings(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	var in AdminSystemSettings
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}
	if err := h.service.UpdateSettings(r.Context(), in); err != nil {
		response.Error(w, http.StatusInternalServerError, "SETTINGS_SAVE_ERROR", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, in, "Settings saved")
}
