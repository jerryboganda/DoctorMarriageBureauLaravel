package response

import (
	"encoding/json"
	"math"
	"net/http"
)

// Response represents a standard success response envelope.
type Response struct {
	Success    bool        `json:"success"`
	Message    string      `json:"message,omitempty"`
	Data       interface{} `json:"data,omitempty"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

// ErrorDetail represents detailed error information.
type ErrorDetail struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// ErrorResponse represents a standard error response envelope.
type ErrorResponse struct {
	Success bool        `json:"success"`
	Error   ErrorDetail `json:"error"`
}

// Pagination represents pagination metadata.
type Pagination struct {
	CurrentPage int   `json:"current_page"`
	PerPage     int   `json:"per_page"`
	Total       int64 `json:"total"`
	TotalPages  int   `json:"total_pages"`
	HasMore     bool  `json:"has_more"`
}

// JSON sends a generic JSON response with given status code.
func JSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload != nil {
		_ = json.NewEncoder(w).Encode(payload)
	}
}

// OK sends HTTP 200 with success envelope and data.
func OK(w http.ResponseWriter, message string, data interface{}) {
	JSON(w, http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Created sends HTTP 201 with success envelope and data.
func Created(w http.ResponseWriter, message string, data interface{}) {
	JSON(w, http.StatusCreated, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Paginated sends HTTP 200 with paginated data and metadata.
func Paginated(w http.ResponseWriter, message string, data interface{}, page, perPage int, total int64) {
	if perPage <= 0 {
		perPage = 20
	}
	if page <= 0 {
		page = 1
	}
	totalPages := int(math.Ceil(float64(total) / float64(perPage)))
	hasMore := page < totalPages

	JSON(w, http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
		Pagination: &Pagination{
			CurrentPage: page,
			PerPage:     perPage,
			Total:       total,
			TotalPages:  totalPages,
			HasMore:     hasMore,
		},
	})
}

// Error sends an error envelope with given HTTP status code.
func Error(w http.ResponseWriter, status int, code, message string, details interface{}) {
	JSON(w, status, ErrorResponse{
		Success: false,
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

// BadRequest sends HTTP 400.
func BadRequest(w http.ResponseWriter, code, message string, details interface{}) {
	if code == "" {
		code = "BAD_REQUEST"
	}
	Error(w, http.StatusBadRequest, code, message, details)
}

// Unauthorized sends HTTP 401.
func Unauthorized(w http.ResponseWriter, code, message string) {
	if code == "" {
		code = "UNAUTHORIZED"
	}
	Error(w, http.StatusUnauthorized, code, message, nil)
}

// Forbidden sends HTTP 403.
func Forbidden(w http.ResponseWriter, code, message string) {
	if code == "" {
		code = "FORBIDDEN"
	}
	Error(w, http.StatusForbidden, code, message, nil)
}

// NotFound sends HTTP 404.
func NotFound(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Resource not found"
	}
	Error(w, http.StatusNotFound, "NOT_FOUND", message, nil)
}

// TooManyRequests sends HTTP 429.
func TooManyRequests(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Too many requests. Please slow down."
	}
	Error(w, http.StatusTooManyRequests, "TOO_MANY_REQUESTS", message, nil)
}

// InternalServerError sends HTTP 500.
func InternalServerError(w http.ResponseWriter, message string) {
	if message == "" {
		message = "An unexpected error occurred. Please try again later."
	}
	Error(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message, nil)
}
