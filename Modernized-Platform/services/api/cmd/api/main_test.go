package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/doctormarriagebureau/api/internal/config"
	"github.com/doctormarriagebureau/api/internal/middleware"
	"github.com/doctormarriagebureau/api/internal/response"
)

func TestHealthCheckEndpoint(t *testing.T) {
	cfg := &config.Config{
		AppEnv:         "test",
		AppPort:        "8080",
		RateLimitAPI:   1000,
		RateLimitAuth:  10,
		RateLimitSens:  6,
		AllowedOrigins: []string{"*"},
	}

	router := SetupRouter(cfg, nil, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp response.Response
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !resp.Success {
		t.Errorf("expected success: true, got false")
	}

	dataMap, ok := resp.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("expected data to be map[string]interface{}, got %T", resp.Data)
	}

	if dataMap["status"] != "healthy" {
		t.Errorf("expected status 'healthy', got %v", dataMap["status"])
	}
}

func TestNotFoundRoute(t *testing.T) {
	cfg := &config.Config{
		AppEnv:         "test",
		AppPort:        "8080",
		RateLimitAPI:   1000,
		RateLimitAuth:  10,
		RateLimitSens:  6,
		AllowedOrigins: []string{"*"},
	}

	router := SetupRouter(cfg, nil, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/non-existent-route", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rr.Code)
	}
}

func TestCORSHeaders(t *testing.T) {
	cfg := &config.Config{
		AppEnv:         "test",
		AppPort:        "8080",
		RateLimitAPI:   1000,
		RateLimitAuth:  10,
		RateLimitSens:  6,
		AllowedOrigins: []string{"http://localhost:3000"},
	}

	router := SetupRouter(cfg, nil, nil)

	req := httptest.NewRequest(http.MethodOptions, "/api/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK && rr.Code != http.StatusNoContent {
		t.Fatalf("expected status 200 or 204 for OPTIONS preflight, got %d", rr.Code)
	}

	allowOrigin := rr.Header().Get("Access-Control-Allow-Origin")
	if allowOrigin != "http://localhost:3000" {
		t.Errorf("expected Access-Control-Allow-Origin 'http://localhost:3000', got '%s'", allowOrigin)
	}
}

func TestResponseHelpers(t *testing.T) {
	// 1. Success OK
	rr1 := httptest.NewRecorder()
	response.OK(rr1, "All good", map[string]string{"foo": "bar"})
	if rr1.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr1.Code)
	}

	// 2. Created
	rr2 := httptest.NewRecorder()
	response.Created(rr2, "Created entity", map[string]int{"id": 123})
	if rr2.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", rr2.Code)
	}

	// 3. Paginated
	rr3 := httptest.NewRecorder()
	response.Paginated(rr3, "List fetched", []string{"a", "b"}, 1, 10, 25)
	if rr3.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr3.Code)
	}
	var pageResp response.Response
	_ = json.Unmarshal(rr3.Body.Bytes(), &pageResp)
	if pageResp.Pagination == nil || pageResp.Pagination.TotalPages != 3 || !pageResp.Pagination.HasMore {
		t.Errorf("expected pagination with 3 pages and has_more=true, got %+v", pageResp.Pagination)
	}

	// 4. Bad Request
	rr4 := httptest.NewRecorder()
	response.BadRequest(rr4, "INVALID_INPUT", "Missing field", map[string]string{"field": "email"})
	if rr4.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr4.Code)
	}

	// 5. Unauthorized
	rr5 := httptest.NewRecorder()
	response.Unauthorized(rr5, "TOKEN_EXPIRED", "Token has expired")
	if rr5.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr5.Code)
	}

	// 6. Forbidden
	rr6 := httptest.NewRecorder()
	response.Forbidden(rr6, "ACCOUNT_BLOCKED", "Account blocked")
	if rr6.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rr6.Code)
	}

	// 7. Not Found
	rr7 := httptest.NewRecorder()
	response.NotFound(rr7, "User not found")
	if rr7.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr7.Code)
	}

	// 8. Too Many Requests
	rr8 := httptest.NewRecorder()
	response.TooManyRequests(rr8, "Rate limit exceeded")
	if rr8.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", rr8.Code)
	}

	// 9. Internal Server Error
	rr9 := httptest.NewRecorder()
	response.InternalServerError(rr9, "DB crash")
	if rr9.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rr9.Code)
	}
}

func TestRateLimiterMiddleware(t *testing.T) {
	limiter := middleware.RateLimiter(nil, "test_tier", 2, time.Second)
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	wrapped := limiter(testHandler)

	// Call 1: Allowed
	req1 := httptest.NewRequest(http.MethodGet, "/test", nil)
	rr1 := httptest.NewRecorder()
	wrapped.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Errorf("call 1: expected 200, got %d", rr1.Code)
	}

	// Call 2: Allowed
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	rr2 := httptest.NewRecorder()
	wrapped.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusOK {
		t.Errorf("call 2: expected 200, got %d", rr2.Code)
	}

	// Call 3: Rate Limited
	req3 := httptest.NewRequest(http.MethodGet, "/test", nil)
	rr3 := httptest.NewRecorder()
	wrapped.ServeHTTP(rr3, req3)
	if rr3.Code != http.StatusTooManyRequests {
		t.Errorf("call 3: expected 429, got %d", rr3.Code)
	}
}
