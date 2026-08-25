package profiles

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/doctormarriagebureau/api/internal/middleware"
	"github.com/doctormarriagebureau/api/internal/response"
)

// Handler handles HTTP requests for profiles and taxonomy.
type Handler struct {
	service *Service
}

// NewHandler creates a new profiles Handler instance.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers profile and taxonomy HTTP routes.
func (h *Handler) RegisterRoutes(r chi.Router, authMw func(http.Handler) http.Handler) {
	// Protected Profile Routes
	r.Route("/profiles", func(r chi.Router) {
		r.Use(authMw)

		r.Get("/full", h.HandleGetFullProfile)
		r.Post("/section/{section}", h.HandleUpdateSection)
		r.Get("/quality-score", h.HandleGetQualityScore)
		r.Get("/visibility", h.HandleGetVisibility)
		r.Post("/visibility", h.HandleUpdateVisibility)
		r.Post("/preferences/priorities", h.HandleUpdatePriorities)
		r.Get("/download-biodata", h.HandleDownloadBiodata)
	})

	// Public Taxonomy Routes
	r.Route("/taxonomy", func(r chi.Router) {
		r.Get("/marital-statuses", h.HandleListMaritalStatuses)
		r.Get("/countries", h.HandleListCountries)
		r.Get("/states/{id}", h.HandleListStates)
		r.Get("/cities/{id}", h.HandleListCities)
		r.Get("/religions", h.HandleListReligions)
		r.Get("/sects", h.HandleListSects)
		r.Get("/sects/{religion_id}", h.HandleListSects)
		r.Get("/castes", h.HandleListCastes)
		r.Get("/castes/{religion_id}", h.HandleListCastes)
		r.Get("/specialities", h.HandleListSpecialities)
		r.Get("/profile-options", h.HandleListProfileOptions)
		r.Get("/profile-options/{group}", h.HandleListProfileOptions)
	})
}

// HandleGetFullProfile returns the aggregated profile for the authenticated user.
func (h *Handler) HandleGetFullProfile(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	profile, err := h.service.GetFullProfile(r.Context(), user.ID)
	if err != nil {
		response.NotFound(w, "Profile not found")
		return
	}

	response.OK(w, "Profile retrieved successfully", profile)
}

// HandleUpdateSection updates a specific 6-step section.
func (h *Handler) HandleUpdateSection(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	section := chi.URLParam(r, "section")
	if section == "" {
		response.BadRequest(w, "INVALID_SECTION", "Section parameter is required", nil)
		return
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		response.BadRequest(w, "INVALID_BODY", "Failed to read request payload", nil)
		return
	}

	updated, qScore, err := h.service.UpdateSection(r.Context(), user.ID, section, bodyBytes)
	if err != nil {
		if err == ErrInvalidSection {
			response.BadRequest(w, "INVALID_SECTION", fmt.Sprintf("Invalid section name: %s", section), nil)
			return
		}
		response.InternalServerError(w, fmt.Sprintf("Failed to update %s: %s", section, err.Error()))
		return
	}

	response.OK(w, fmt.Sprintf("%s updated successfully", strings.Title(section)), map[string]interface{}{
		"section":       section,
		"profile":       updated,
		"quality_score": qScore,
	})
}

// HandleGetQualityScore computes the user's completion score and improvements.
func (h *Handler) HandleGetQualityScore(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	score := h.service.CalculateQualityScore(r.Context(), user.ID, nil)
	response.OK(w, "Quality score calculated successfully", score)
}

// HandleGetVisibility retrieves current visibility settings.
func (h *Handler) HandleGetVisibility(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	vis, err := h.service.GetVisibility(r.Context(), user.ID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.OK(w, "Visibility settings retrieved", vis)
}

// HandleUpdateVisibility updates privacy settings.
func (h *Handler) HandleUpdateVisibility(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	var flags map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&flags); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	updated, err := h.service.UpdateVisibility(r.Context(), user.ID, flags)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.OK(w, "Visibility settings updated successfully", updated)
}

// HandleUpdatePriorities updates match tuner partner weights.
func (h *Handler) HandleUpdatePriorities(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	var req struct {
		Priorities map[string]string `json:"priorities"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	updated, err := h.service.UpdatePreferencePriorities(r.Context(), user.ID, req.Priorities)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.OK(w, "Preference priorities updated successfully", updated)
}

// HandleDownloadBiodata exports formatted Doctor biodata as structured JSON or printable text.
func (h *Handler) HandleDownloadBiodata(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	targetUserID := user.ID
	memberParam := r.URL.Query().Get("member_id")
	if memberParam == "" {
		memberParam = r.URL.Query().Get("user_id")
	}
	if memberParam != "" {
		if parsedID, err := strconv.ParseInt(memberParam, 10, 64); err == nil {
			targetUserID = parsedID
		}
	}

	format := r.URL.Query().Get("format") // "pdf" or "json"

	doc, pdfText, err := h.service.DownloadBiodata(r.Context(), user.ID, targetUserID)
	if err != nil {
		response.NotFound(w, "Candidate profile not found")
		return
	}

	if format == "pdf" || format == "text" {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"biodata_%s.txt\"", doc.CandidateCode))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(pdfText)
		return
	}

	response.OK(w, "Biodata document generated successfully", map[string]interface{}{
		"document": doc,
		"text":     string(pdfText),
	})
}

// Taxonomy Handlers

func (h *Handler) HandleListMaritalStatuses(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.ListMaritalStatuses(r.Context())
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "Marital statuses retrieved", list)
}

func (h *Handler) HandleListCountries(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.ListCountries(r.Context())
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "Countries retrieved", list)
}

func (h *Handler) HandleListStates(w http.ResponseWriter, r *http.Request) {
	countryID, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	list, err := h.service.ListStates(r.Context(), countryID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "States retrieved", list)
}

func (h *Handler) HandleListCities(w http.ResponseWriter, r *http.Request) {
	stateID, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	list, err := h.service.ListCities(r.Context(), stateID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "Cities retrieved", list)
}

func (h *Handler) HandleListReligions(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.ListReligions(r.Context())
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "Religions retrieved", list)
}

func (h *Handler) HandleListSects(w http.ResponseWriter, r *http.Request) {
	religionID, _ := strconv.ParseInt(chi.URLParam(r, "religion_id"), 10, 64)
	list, err := h.service.ListSects(r.Context(), religionID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "Sects retrieved", list)
}

func (h *Handler) HandleListCastes(w http.ResponseWriter, r *http.Request) {
	religionID, _ := strconv.ParseInt(chi.URLParam(r, "religion_id"), 10, 64)
	list, err := h.service.ListCastes(r.Context(), religionID)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "Castes retrieved", list)
}

func (h *Handler) HandleListSpecialities(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.ListSpecialities(r.Context())
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "Medical specialities retrieved", list)
}

func (h *Handler) HandleListProfileOptions(w http.ResponseWriter, r *http.Request) {
	if h.service == nil || h.service.pg == nil || h.service.pg.Pool == nil {
		response.InternalServerError(w, "database service unavailable")
		return
	}
	group := chi.URLParam(r, "group")
	if group == "" {
		list, err := h.service.ListAllProfileOptions(r.Context())
		if err != nil {
			response.InternalServerError(w, err.Error())
			return
		}
		response.OK(w, "Profile options retrieved", list)
		return
	}
	if !AllowedProfileOptionGroup(group) {
		response.BadRequest(w, "INVALID_GROUP", "Unknown profile option group", nil)
		return
	}
	list, err := h.service.ListProfileOptions(r.Context(), group)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}
	response.OK(w, "Profile options retrieved", list)
}
