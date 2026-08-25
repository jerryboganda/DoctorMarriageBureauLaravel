package profiles

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestNormalizeOptionGroup(t *testing.T) {
	if got := NormalizeOptionGroup("Marriage-Timeline"); got != "marriage_timeline" {
		t.Fatalf("got %q", got)
	}
	if got := NormalizeOptionGroup("relocation_willingness"); got != "relocation_willingness" {
		t.Fatalf("got %q", got)
	}
}

func TestAllowedProfileOptionGroup(t *testing.T) {
	if !AllowedProfileOptionGroup("marriage_timeline") {
		t.Fatal("marriage_timeline should be allowed")
	}
	if AllowedProfileOptionGroup("drop table") {
		t.Fatal("unknown group must be rejected")
	}
}

func TestGroupProfileOptions(t *testing.T) {
	grouped := GroupProfileOptions([]ProfileOption{
		{Group: "marriage_timeline", Value: "immediate", Label: "Immediately (0-6 months)"},
		{Group: "relocation_willingness", Value: "not_willing", Label: "Not willing to relocate"},
		{Group: "marriage_timeline", Value: "1_year", Label: "Within 1 year"},
	})
	if len(grouped["marriage_timeline"]) != 2 {
		t.Fatalf("timeline options = %d", len(grouped["marriage_timeline"]))
	}
	if grouped["relocation_willingness"][0].Value != "not_willing" {
		t.Fatalf("relocation value = %q", grouped["relocation_willingness"][0].Value)
	}
}

func TestProfileOptionsRouteExists(t *testing.T) {
	handler := NewHandler(NewService(nil, nil))
	r := chi.NewRouter()
	handler.RegisterRoutes(r, func(next http.Handler) http.Handler { return next })

	req := httptest.NewRequest(http.MethodGet, "/taxonomy/profile-options", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	if rr.Code == http.StatusNotFound {
		t.Fatal("GET /taxonomy/profile-options is not registered")
	}
}
