package response

import (
	"encoding/json"
	"net/http"
)

// StandardEnvelope defines the unified API response schema.
type StandardEnvelope struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

// APIError represents structured error details.
type APIError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// PaginatedData defines standard pagination metadata.
type PaginatedData struct {
	Items      interface{} `json:"items"`
	Total      int64       `json:"total"`
	Cursor     string      `json:"cursor,omitempty"`
	NextCursor string      `json:"next_cursor,omitempty"`
	HasMore    bool        `json:"has_more"`
}

// JSON sends a successful JSON response.
func JSON(w http.ResponseWriter, statusCode int, data interface{}, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(StandardEnvelope{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// Paginated sends a paginated successful response.
func Paginated(w http.ResponseWriter, statusCode int, items interface{}, total int64, cursor, nextCursor string, hasMore bool, message string) {
	JSON(w, statusCode, PaginatedData{
		Items:      items,
		Total:      total,
		Cursor:     cursor,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}, message)
}

// Error sends a structured JSON error response.
func Error(w http.ResponseWriter, statusCode int, code string, message string, details interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(StandardEnvelope{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}
