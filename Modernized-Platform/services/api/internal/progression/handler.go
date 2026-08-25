package progression

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler handles Courtship Progression HTTP requests.
type Handler struct {
	service Service
}

// NewHandler creates a new progression handler.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// Routes sets up Chi routing for Courtship Progression domain.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/stages", h.HandleGetStages)
	r.Get("/active", h.HandleGetActive)
	r.Get("/", h.HandleList)
	r.Post("/start", h.HandleStart)
	r.Get("/{id}", h.HandleGetOne)
	r.Patch("/{id}/stage", h.HandleUpdateStage)
	r.Post("/{id}/items", h.HandleCreateItem)
	r.Patch("/items/{item_id}", h.HandleUpdateItem)

	return r
}

// HandleList handles GET /api/v1/progression/
func (h *Handler) HandleList(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	items, err := h.service.ListProgressions(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "LIST_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, items, "Courtship journeys retrieved")
}

// HandleGetOne handles GET /api/v1/progression/{id}
func (h *Handler) HandleGetOne(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	progID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || progID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid progression ID", nil)
		return
	}

	prog, err := h.service.GetProgression(r.Context(), userID, progID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, prog, "Courtship journey retrieved")
}

// HandleGetStages handles GET /api/v1/progression/stages
func (h *Handler) HandleGetStages(w http.ResponseWriter, r *http.Request) {
	stages, err := h.service.GetStages(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "STAGES_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, stages, "Progression stages retrieved")
}

// HandleGetActive handles GET /api/v1/progression/active
func (h *Handler) HandleGetActive(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	prog, err := h.service.GetActiveProgression(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, prog, "Active courtship progression retrieved")
}

// HandleStart handles POST /api/v1/progression/start
func (h *Handler) HandleStart(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		PartnerID int64 `json:"partner_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PartnerID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Valid partner_id is required", nil)
		return
	}

	prog, err := h.service.StartCourtship(r.Context(), userID, req.PartnerID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "START_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusCreated, prog, "Courtship progression started")
}

// HandleUpdateStage handles PATCH /api/v1/progression/{id}/stage
func (h *Handler) HandleUpdateStage(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	progID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || progID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid progression ID", nil)
		return
	}

	var req struct {
		StageID int64  `json:"stage_id"`
		Notes   string `json:"notes"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.StageID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Valid stage_id is required", nil)
		return
	}

	prog, err := h.service.UpdateStage(r.Context(), progID, userID, req.StageID, req.Notes)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "UPDATE_STAGE_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, prog, "Courtship stage updated")
}

// HandleCreateItem handles POST /api/v1/progression/{id}/items
func (h *Handler) HandleCreateItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	progID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || progID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid progression ID", nil)
		return
	}

	var req struct {
		ItemType      string  `json:"item_type"` // "checklist", "venue", "budget", "event"
		Title         string  `json:"title"`
		Name          string  `json:"name"`
		VenueType     string  `json:"venue_type"`
		Label         string  `json:"label"`
		Category      string  `json:"category"`
		Notes         string  `json:"notes"`
		EstimatedCost float64 `json:"estimated_cost"`
		Amount        float64 `json:"amount"`
		EventAt       string  `json:"event_at"`
		Location      string  `json:"location"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	switch req.ItemType {
	case "venue":
		venue, err := h.service.AddVenueItem(r.Context(), progID, userID, req.Name, req.VenueType, req.Notes, req.EstimatedCost)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VENUE_ERROR", err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusCreated, venue, "Venue added to courtship plan")
	case "budget":
		label := req.Label
		if label == "" {
			label = req.Title
		}
		amount := req.Amount
		if amount == 0 {
			amount = req.EstimatedCost
		}
		budget, err := h.service.AddBudgetItem(r.Context(), progID, userID, label, req.Category, amount, req.Notes)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "BUDGET_ERROR", err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusCreated, budget, "Budget item recorded")
	case "event":
		event, err := h.service.AddEvent(r.Context(), progID, userID, req.Title, req.EventAt, req.Location, req.Notes)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "EVENT_ERROR", err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusCreated, event, "Event scheduled")
	case "checklist":
		fallthrough
	default:
		item, err := h.service.CreateChecklistItem(r.Context(), progID, userID, req.Title)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "CHECKLIST_ERROR", err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusCreated, item, "Checklist item created")
	}
}

// HandleUpdateItem handles PATCH /api/v1/progression/items/{item_id}
func (h *Handler) HandleUpdateItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "item_id")
	itemID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || itemID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid item ID", nil)
		return
	}

	var req struct {
		IsCompleted bool `json:"is_completed"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	item, err := h.service.ToggleChecklistItem(r.Context(), itemID, userID, req.IsCompleted)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "TOGGLE_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, item, "Item status updated")
}
