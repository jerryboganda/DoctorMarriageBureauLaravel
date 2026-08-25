package middleware

import (
	"context"
)

type contextKey string

const (
	UserIDKey    contextKey = "userID"
	UserEmailKey contextKey = "userEmail"
	UserTypeKey  contextKey = "userType"
)

// GetUserIDFromContext retrieves the user ID from context.
func GetUserIDFromContext(ctx context.Context) (int64, bool) {
	val := ctx.Value(UserIDKey)
	if val == nil {
		return 0, false
	}
	uid, ok := val.(int64)
	return uid, ok
}

// WithUserID returns a new context with the given user ID.
func WithUserID(ctx context.Context, userID int64) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}
