package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/doctormarriagebureau/api/internal/response"
	pkgmw "github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

type authContextKey string

const (
	UserContextKey  authContextKey = "auth_user"
	TokenContextKey authContextKey = "auth_token"
)

// AuthUser represents an authenticated user in request context.
type AuthUser struct {
	ID                 int64      `json:"id"`
	FirstName          string     `json:"first_name"`
	LastName           string     `json:"last_name"`
	Email              string     `json:"email"`
	Phone              string     `json:"phone"`
	UserType           string     `json:"user_type"`
	Membership         int        `json:"membership"`
	Blocked            bool       `json:"blocked"`
	Deactivated        bool       `json:"deactivated"`
	Approved           bool       `json:"approved"`
	PhotoApproved      bool       `json:"photo_approved"`
	MustChangePassword bool       `json:"must_change_password"`
	EmailVerifiedAt    *time.Time `json:"email_verified_at"`
	MemberID           *int64     `json:"member_id"`
	Gender             string     `json:"gender"`
	Birthday           *string    `json:"birthday"`
}

// Authenticate returns a middleware that validates Laravel Sanctum tokens against PostgreSQL.
func Authenticate(pgClient *postgres.Client) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				// WebSocket clients cannot set custom headers; accept token via query param.
				if qt := strings.TrimSpace(r.URL.Query().Get("token")); qt != "" {
					authHeader = "Bearer " + qt
				}
			}
			if authHeader == "" {
				response.Unauthorized(w, "MISSING_TOKEN", "Authentication token is required")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				response.Unauthorized(w, "INVALID_TOKEN_FORMAT", "Invalid authorization header format. Expected 'Bearer <token>'")
				return
			}

			tokenStr := strings.TrimSpace(parts[1])
			if tokenStr == "" {
				response.Unauthorized(w, "EMPTY_TOKEN", "Token string cannot be empty")
				return
			}

			// Parse Sanctum token: id|plaintext or raw token
			tokenHash := HashSanctumToken(tokenStr)

			if pgClient == nil || pgClient.Pool == nil {
				response.InternalServerError(w, "Database service unavailable")
				return
			}

			// Lookup token and associated user in database
			query := `
				SELECT 
					u.id, u.first_name, u.last_name, u.email, COALESCE(u.phone, ''),
					COALESCE(u.user_type, 'member'), COALESCE(u.membership, 1),
					COALESCE(u.blocked, false), COALESCE(u.deactivated, false),
					COALESCE(u.approved, true), (COALESCE(u.photo_approved, 1) = 1),
					COALESCE(u.must_change_password, false), u.email_verified_at,
					m.id AS member_id, COALESCE(m.gender, ''), CAST(m.birthday AS TEXT)
				FROM personal_access_tokens pat
				JOIN users u ON pat.tokenable_id = u.id AND pat.tokenable_type IN ('App\\Models\\User', 'users')
				LEFT JOIN members m ON m.user_id = u.id
				WHERE pat.token = $1 AND (pat.expires_at IS NULL OR pat.expires_at > NOW())
				LIMIT 1
			`

			var user AuthUser
			var memberID *int64
			var birthday *string

			err := pgClient.Pool.QueryRow(r.Context(), query, tokenHash).Scan(
				&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.Phone,
				&user.UserType, &user.Membership,
				&user.Blocked, &user.Deactivated,
				&user.Approved, &user.PhotoApproved,
				&user.MustChangePassword, &user.EmailVerifiedAt,
				&memberID, &user.Gender, &birthday,
			)

			if err != nil {
				// Also check if token was provided in plain format or matches legacy hash
				response.Unauthorized(w, "INVALID_TOKEN", "The provided authentication token is invalid or expired")
				return
			}

			user.MemberID = memberID
			user.Birthday = birthday

			// Check Account Status Constraints
			if user.Blocked {
				response.Forbidden(w, "ACCOUNT_BLOCKED", "Your account has been blocked by administration. Please contact support.")
				return
			}

			if user.Deactivated {
				response.Forbidden(w, "ACCOUNT_DEACTIVATED", "Your account has been deactivated. Please contact support.")
				return
			}

			if user.MustChangePassword {
				path := r.URL.Path
				if !strings.HasSuffix(path, "/reset-password") && !strings.HasSuffix(path, "/logout") && !strings.HasSuffix(path, "/change-password") {
					response.Forbidden(w, "PASSWORD_CHANGE_REQUIRED", "You are required to change your password before continuing.")
					return
				}
			}

			// Update last_used_at on token asynchronously
			go func(hash string) {
				ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
				defer cancel()
				_, _ = pgClient.Pool.Exec(ctx, "UPDATE personal_access_tokens SET last_used_at = NOW() WHERE token = $1", hash)
			}(tokenHash)

			// Store user in context (both internal and pkg keys so all handlers resolve the real user)
			ctx := context.WithValue(r.Context(), UserContextKey, &user)
			ctx = context.WithValue(ctx, TokenContextKey, tokenStr)
			ctx = pkgmw.WithUserID(ctx, user.ID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// HashSanctumToken computes the SHA-256 hash according to Laravel Sanctum specification.
// Sanctum tokens are structured as "<id>|<plainTextToken>" or plain token string.
func HashSanctumToken(tokenStr string) string {
	plainText := tokenStr
	if idx := strings.Index(tokenStr, "|"); idx != -1 {
		plainText = tokenStr[idx+1:]
	}
	hash := sha256.Sum256([]byte(plainText))
	return hex.EncodeToString(hash[:])
}

// GetUser extracts the authenticated user from context.
func GetUser(ctx context.Context) *AuthUser {
	if user, ok := ctx.Value(UserContextKey).(*AuthUser); ok {
		return user
	}
	return nil
}

// GetToken extracts the raw token string from context.
func GetToken(ctx context.Context) string {
	if token, ok := ctx.Value(TokenContextKey).(string); ok {
		return token
	}
	return ""
}

// RequireApproved ensures the user has approved status.
func RequireApproved() func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := GetUser(r.Context())
			if user == nil {
				response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
				return
			}
			if !user.Approved && user.UserType != "admin" {
				response.Forbidden(w, "ACCOUNT_NOT_APPROVED", "Your profile is pending admin approval")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireEmailVerified ensures the user's email is verified.
func RequireEmailVerified() func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := GetUser(r.Context())
			if user == nil {
				response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
				return
			}
			if user.EmailVerifiedAt == nil && user.UserType != "admin" {
				response.Forbidden(w, "EMAIL_NOT_VERIFIED", "Please verify your email address before continuing")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
