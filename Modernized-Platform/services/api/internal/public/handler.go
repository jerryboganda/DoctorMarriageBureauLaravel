package public

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/internal/response"
)

// Handler serves public, unauthenticated marketing data.
type Handler struct {
	service *Service
}

// NewHandler creates the public handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Routes wires public endpoints under /api/public (no auth).
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/proposals", h.HandleProposals)
	r.Get("/stats", h.HandleStats)
	r.Get("/happy-stories", h.HandleHappyStories)
	return r
}

// HandleProposals GET /api/public/proposals
func (h *Handler) HandleProposals(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.ListProposals(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PUBLIC_PROPOSALS_ERROR", err.Error(), nil)
		return
	}
	response.OK(w, "Public proposals", data)
}

// HandleStats GET /api/public/stats
func (h *Handler) HandleStats(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.Stats(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PUBLIC_STATS_ERROR", err.Error(), nil)
		return
	}
	response.OK(w, "Public stats", data)
}

// HandleHappyStories GET /api/public/happy-stories
func (h *Handler) HandleHappyStories(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.HappyStories(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PUBLIC_STORIES_ERROR", err.Error(), nil)
		return
	}
	response.OK(w, "Public happy stories", data)
}
