package discovery

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler handles HTTP requests for discovery and matching intelligence.
type Handler struct {
	service Service
}

// NewHandler creates a new Discovery HTTP handler.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// Routes sets up Chi routing for Discovery domain.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.HandleFeed)
	r.Get("/search", h.HandleSearch)
	r.Get("/profile/{id}", h.HandleGetProfile)
	r.Get("/match-intelligence/{id}", h.HandleMatchIntel)
	r.Post("/match-tuner", h.HandleMatchTuner)
	r.Post("/toggle-anonymous", h.HandleToggleIncognito)
	r.Post("/travel-mode/enable", h.HandleEnableTravelMode)
	r.Post("/travel-mode/disable", h.HandleDisableTravelMode)

	return r
}

// HandleFeed handles GET /api/v1/discovery
func (h *Handler) HandleFeed(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	feedType := r.URL.Query().Get("feed")
	limit := 12
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	page := 1
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if parsedPage, err := strconv.Atoi(pageStr); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	} else if cursor := r.URL.Query().Get("cursor"); cursor != "" {
		if offset, err := strconv.Atoi(cursor); err == nil && offset > 0 {
			page = offset/limit + 1
		}
	}

	cards, total, err := h.service.GetFeed(r.Context(), userID, feedType, page, limit)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "FEED_ERROR", err.Error(), nil)
		return
	}

	lastPage := int64(1)
	if total > 0 {
		lastPage = (total + int64(limit) - 1) / int64(limit)
	}
	if int64(page) > lastPage {
		page = int(lastPage)
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"items":     cards,
		"total":     total,
		"page":      page,
		"per_page":  limit,
		"last_page": lastPage,
		"has_more":  int64(page) < lastPage,
	}, "Discovery feed fetched successfully")
}

// HandleSearch handles GET /api/v1/discovery/search
func (h *Handler) HandleSearch(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserIDFromContext(r.Context())
	q := r.URL.Query()

	filter := SearchFilter{
		Speciality: q.Get("speciality"),
		Degree:     q.Get("degree"),
		Gender:     q.Get("gender"),
		Search:     q.Get("search"),
	}

	if val := q.Get("min_age"); val != "" {
		filter.MinAge, _ = strconv.Atoi(val)
	}
	if val := q.Get("max_age"); val != "" {
		filter.MaxAge, _ = strconv.Atoi(val)
	}
	if val := q.Get("city_id"); val != "" {
		filter.CityID, _ = strconv.ParseInt(val, 10, 64)
	}
	if val := q.Get("country_id"); val != "" {
		filter.CountryID, _ = strconv.ParseInt(val, 10, 64)
	}
	if val := q.Get("religion_id"); val != "" {
		filter.ReligionID, _ = strconv.ParseInt(val, 10, 64)
	}
	if val := q.Get("caste_id"); val != "" {
		filter.CasteID, _ = strconv.ParseInt(val, 10, 64)
	}
	if val := q.Get("min_height"); val != "" {
		filter.MinHeight, _ = strconv.ParseFloat(val, 64)
	}
	if val := q.Get("max_height"); val != "" {
		filter.MaxHeight, _ = strconv.ParseFloat(val, 64)
	}
	if val := q.Get("limit"); val != "" {
		filter.Limit, _ = strconv.Atoi(val)
	}
	if filter.Limit <= 0 {
		filter.Limit = 12
	}
	if val := q.Get("page"); val != "" {
		if page, err := strconv.Atoi(val); err == nil && page > 0 {
			filter.Offset = (page - 1) * filter.Limit
		}
	} else if val := q.Get("offset"); val != "" {
		filter.Offset, _ = strconv.Atoi(val)
	}

	cards, total, err := h.service.Search(r.Context(), userID, filter)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "SEARCH_ERROR", err.Error(), nil)
		return
	}

	page := 1
	if filter.Limit > 0 {
		page = filter.Offset/filter.Limit + 1
	}
	lastPage := int64(1)
	if total > 0 {
		lastPage = (total + int64(filter.Limit) - 1) / int64(filter.Limit)
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"items":     cards,
		"total":     total,
		"page":      page,
		"per_page":  filter.Limit,
		"last_page": lastPage,
		"offset":    filter.Offset,
		"limit":     filter.Limit,
		"has_more":  int64(page) < lastPage,
	}, "Search results retrieved")
}

// HandleGetProfile handles GET /api/v1/discovery/profile/{id}
func (h *Handler) HandleGetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	candidateID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || candidateID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid candidate ID", nil)
		return
	}

	card, err := h.service.GetProfile(r.Context(), userID, candidateID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, card, "Profile fetched")
}

// HandleMatchIntel handles GET /api/v1/discovery/match-intelligence/{id}
func (h *Handler) HandleMatchIntel(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	idStr := chi.URLParam(r, "id")
	candidateID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || candidateID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid candidate ID", nil)
		return
	}

	breakdown, err := h.service.GetMatchIntelligence(r.Context(), userID, candidateID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, breakdown, "Match intelligence calculated")
}

// HandleMatchTuner handles POST /api/v1/discovery/match-tuner
func (h *Handler) HandleMatchTuner(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		Weights models.PreferenceWeights `json:"importance_weights"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	if err := h.service.UpdateMatchTuner(r.Context(), userID, req.Weights); err != nil {
		response.Error(w, http.StatusInternalServerError, "TUNER_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, req.Weights, "Match tuner priorities updated successfully")
}

// HandleToggleIncognito handles POST /api/v1/discovery/toggle-anonymous
func (h *Handler) HandleToggleIncognito(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	isAnonymous, err := h.service.ToggleAnonymous(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "TOGGLE_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"is_anonymous": isAnonymous}, "Incognito mode toggled")
}

// HandleEnableTravelMode handles POST /api/v1/discovery/travel-mode/enable
func (h *Handler) HandleEnableTravelMode(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		CityID       int64  `json:"city_id"`
		CountryID    int64  `json:"country_id"`
		CityName     string `json:"city_name"`
		City         string `json:"city"`
		CountryName  string `json:"country_name"`
		Country      string `json:"country"`
		DurationDays int    `json:"duration_days"`
		Days         int    `json:"days"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	if req.CityName == "" {
		req.CityName = req.City
	}
	if req.CountryName == "" {
		req.CountryName = req.Country
	}
	if req.DurationDays <= 0 {
		req.DurationDays = req.Days
	}

	if req.CityID <= 0 && req.CityName == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "A destination city is required", nil)
		return
	}

	travelMode, err := h.service.EnableTravelMode(r.Context(), userID, req.CityID, req.CountryID, req.CityName, req.CountryName, req.DurationDays)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "TRAVEL_MODE_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, travelMode, "Travel mode activated")
}

// HandleDisableTravelMode handles POST /api/v1/discovery/travel-mode/disable
func (h *Handler) HandleDisableTravelMode(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	if err := h.service.DisableTravelMode(r.Context(), userID); err != nil {
		response.Error(w, http.StatusInternalServerError, "TRAVEL_MODE_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"is_active": false}, "Travel mode disabled")
}
