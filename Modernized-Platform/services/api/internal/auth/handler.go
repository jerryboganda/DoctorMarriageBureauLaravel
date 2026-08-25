package auth

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/doctormarriagebureau/api/internal/middleware"
	"github.com/doctormarriagebureau/api/internal/response"
)

// Handler handles HTTP requests for the auth domain.
type Handler struct {
	service *Service
}

// NewHandler creates a new auth Handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers all authentication and account security endpoints.
func (h *Handler) RegisterRoutes(r chi.Router, authMw func(http.Handler) http.Handler, rateAuth, rateSens func(http.Handler) http.Handler) {
	r.Route("/auth", func(r chi.Router) {
		// Public Auth Endpoints
		r.With(rateAuth).Post("/signup", h.HandleSignup)
		r.With(rateAuth).Post("/signin", h.HandleSignin)
		r.With(rateSens).Post("/2fa/challenge", h.Handle2FAChallenge)
		r.With(rateSens).Post("/forgot-password", h.HandleForgotPassword)
		r.With(rateSens).Post("/reset-password", h.HandleResetPassword)

		// Protected Auth Endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMw)

			r.Get("/me", h.HandleGetMe)
			r.Get("/user-by-token", h.HandleGetMe)
			r.Post("/logout", h.HandleLogout)
			r.With(rateSens).Post("/verify-email/send", h.HandleSendEmailOTP)
			r.With(rateSens).Post("/verify-email/confirm", h.HandleVerifyEmailOTP)
			r.With(rateSens).Post("/2fa/setup", h.Handle2FASetup)
			r.With(rateSens).Post("/2fa/enable", h.Handle2FAEnable)
			r.With(rateSens).Post("/2fa/disable", h.Handle2FADisable)
			r.With(rateSens).Post("/step-up/initiate", h.HandleStepUpInitiate)
			r.With(rateSens).Post("/step-up/verify", h.HandleStepUpVerify)
			r.With(rateSens).Post("/change-password", h.HandleChangePassword)
		})
	})
}

// HandleSignup handles member registration.
func (h *Handler) HandleSignup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	telemetry := ParseDeviceTelemetry(r.RemoteAddr, r.UserAgent())
	result, err := h.service.Signup(r.Context(), req, telemetry)
	if err != nil {
		if err == ErrEmailAlreadyExists {
			response.Error(w, http.StatusConflict, "EMAIL_EXISTS", err.Error(), nil)
			return
		}
		if err == ErrPasswordTooShort || err == ErrPasswordNeedsLetter || err == ErrPasswordNeedsNumber {
			response.BadRequest(w, "WEAK_PASSWORD", err.Error(), nil)
			return
		}
		response.BadRequest(w, "SIGNUP_FAILED", err.Error(), nil)
		return
	}

	response.Created(w, "Registration successful", result)
}

// HandleSignin handles user login.
func (h *Handler) HandleSignin(w http.ResponseWriter, r *http.Request) {
	var req SigninRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	telemetry := ParseDeviceTelemetry(r.RemoteAddr, r.UserAgent())
	result, err := h.service.Signin(r.Context(), req, telemetry)
	if err != nil {
		if err == ErrAccountBlocked {
			response.Forbidden(w, "ACCOUNT_BLOCKED", err.Error())
			return
		}
		if err == ErrAccountDeactivated {
			response.Forbidden(w, "ACCOUNT_DEACTIVATED", err.Error())
			return
		}
		response.Unauthorized(w, "INVALID_CREDENTIALS", err.Error())
		return
	}

	response.OK(w, result.Message, result)
}

// Handle2FAChallenge handles TOTP or recovery code submission.
func (h *Handler) Handle2FAChallenge(w http.ResponseWriter, r *http.Request) {
	var req TwoFactorChallengeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	telemetry := ParseDeviceTelemetry(r.RemoteAddr, r.UserAgent())
	result, err := h.service.Verify2FAChallenge(r.Context(), req, telemetry)
	if err != nil {
		response.Unauthorized(w, "INVALID_2FA_CODE", err.Error())
		return
	}

	response.OK(w, result.Message, result)
}

// HandleForgotPassword handles password reset OTP request.
func (h *Handler) HandleForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	if _, err := h.service.ForgotPassword(r.Context(), req.Email); err != nil {
		if err == ErrUserNotFound {
			response.NotFound(w, "No account found with provided email address")
			return
		}
		if err == ErrRateLimitExceeded {
			response.TooManyRequests(w, err.Error())
			return
		}
		response.InternalServerError(w, err.Error())
		return
	}

	response.OK(w, "Password reset verification code dispatched to email", map[string]interface{}{
		"email":     req.Email,
		"code_sent": true,
	})
}

// HandleResetPassword handles password reset with verified OTP.
func (h *Handler) HandleResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	if err := h.service.ResetPassword(r.Context(), req); err != nil {
		if err == ErrInvalidOTP {
			response.BadRequest(w, "INVALID_CODE", err.Error(), nil)
			return
		}
		if err == ErrPasswordMismatch {
			response.BadRequest(w, "PASSWORD_MISMATCH", err.Error(), nil)
			return
		}
		response.BadRequest(w, "RESET_FAILED", err.Error(), nil)
		return
	}

	response.OK(w, "Password updated successfully. You may now sign in with your new password.", nil)
}

// HandleSendEmailOTP sends an email verification code.
func (h *Handler) HandleSendEmailOTP(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	if _, err := h.service.SendEmailOTP(r.Context(), user.Email); err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.OK(w, "Verification code sent to email", map[string]interface{}{
		"email":      user.Email,
		"code_sent": true,
	})
}

// HandleVerifyEmailOTP verifies the email OTP.
func (h *Handler) HandleVerifyEmailOTP(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	var req struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	if err := h.service.VerifyEmailOTP(r.Context(), user.Email, req.Code); err != nil {
		response.BadRequest(w, "INVALID_CODE", "Invalid or expired verification code", nil)
		return
	}

	response.OK(w, "Email verified successfully", nil)
}

// HandleGetMe returns the authenticated user's profile summary.
func (h *Handler) HandleGetMe(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	summary, err := h.service.GetMe(r.Context(), user.ID)
	if err != nil {
		response.NotFound(w, "User not found")
		return
	}

	response.OK(w, "User retrieved successfully", summary)
}

// HandleLogout revokes the current session token.
func (h *Handler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	token := middleware.GetToken(r.Context())
	if token != "" {
		_ = h.service.Logout(r.Context(), token)
	}

	response.OK(w, "Logged out successfully", nil)
}

// Handle2FASetup initiates 2FA configuration.
func (h *Handler) Handle2FASetup(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	setup, err := h.service.Setup2FA(r.Context(), user.ID, user.Email)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.OK(w, "2FA setup initiated", setup)
}

// Handle2FAEnable activates 2FA with passcode.
func (h *Handler) Handle2FAEnable(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	var req struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	if err := h.service.Enable2FA(r.Context(), user.ID, req.Code); err != nil {
		response.BadRequest(w, "INVALID_2FA_CODE", err.Error(), nil)
		return
	}

	response.OK(w, "Two-factor authentication enabled successfully", nil)
}

// Handle2FADisable turns off 2FA.
func (h *Handler) Handle2FADisable(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	var req struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	if err := h.service.Disable2FA(r.Context(), user.ID, req.Password); err != nil {
		response.Forbidden(w, "INVALID_PASSWORD", err.Error())
		return
	}

	response.OK(w, "Two-factor authentication disabled successfully", nil)
}

// HandleStepUpInitiate generates a temporary step-up token.
func (h *Handler) HandleStepUpInitiate(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	var req struct {
		ActionType string `json:"action_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.ActionType = "account_update"
	}
	if req.ActionType == "" {
		req.ActionType = "account_update"
	}

	stepUp, err := h.service.InitiateStepUp(r.Context(), user.ID, req.ActionType)
	if err != nil {
		response.InternalServerError(w, err.Error())
		return
	}

	response.OK(w, "Step-up authentication session created", stepUp)
}

// HandleStepUpVerify validates a step-up token.
func (h *Handler) HandleStepUpVerify(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Unauthorized(w, "UNAUTHORIZED", "Authentication required")
		return
	}

	var req struct {
		Token      string `json:"token"`
		ActionType string `json:"action_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	if err := h.service.VerifyStepUp(r.Context(), user.ID, req.Token, req.ActionType); err != nil {
		response.Forbidden(w, "INVALID_STEP_UP_TOKEN", err.Error())
		return
	}

	response.OK(w, "Step-up authorization verified", nil)
}

// HandleChangePassword handles POST /api/v1/auth/change-password
func (h *Handler) HandleChangePassword(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "INVALID_REQUEST", "Failed to parse JSON body", err.Error())
		return
	}

	if err := h.service.ChangePassword(r.Context(), user.ID, req.CurrentPassword, req.NewPassword); err != nil {
		if err == ErrInvalidCredentials {
			response.Error(w, http.StatusForbidden, "INVALID_PASSWORD", "Current password is incorrect", nil)
			return
		}
		response.BadRequest(w, "CHANGE_PASSWORD_FAILED", err.Error(), nil)
		return
	}

	response.OK(w, "Password changed successfully", map[string]bool{"changed": true})
}
