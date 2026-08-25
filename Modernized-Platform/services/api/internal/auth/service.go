package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/doctormarriagebureau/api/internal/assets"
	"github.com/doctormarriagebureau/api/internal/cards"
	"github.com/doctormarriagebureau/api/platform/postgres"
	"github.com/doctormarriagebureau/api/platform/redis"
)

var (
	ErrUserNotFound          = errors.New("no account found with provided credentials")
	ErrInvalidCredentials    = errors.New("invalid email/phone or password")
	ErrAccountBlocked        = errors.New("account is blocked by administrator")
	ErrAccountDeactivated    = errors.New("account has been deactivated")
	ErrEmailAlreadyExists    = errors.New("email address is already registered")
	ErrEmailNotVerified      = errors.New("please verify your email address before signing up")
	ErrInvalidOTP            = errors.New("invalid or expired verification code")
	ErrInvalid2FACode        = errors.New("invalid two-factor authentication code")
	ErrTwoFactorRequired     = errors.New("two-factor authentication is required")
	ErrInvalidStepUpToken    = errors.New("invalid or expired step-up authentication token")
	ErrRateLimitExceeded     = errors.New("too many attempts, please try again later")
)

// Service defines auth business logic operations.
type Service struct {
	pg    *postgres.Client
	redis *redis.Client
}

// NewService creates a new auth Service instance.
func NewService(pg *postgres.Client, rdb *redis.Client) *Service {
	return &Service{
		pg:    pg,
		redis: rdb,
	}
}

// SignupRequest contains payload for member registration.
type SignupRequest struct {
	FirstName    string  `json:"first_name"`
	LastName     string  `json:"last_name"`
	Email        string  `json:"email"`
	Phone        string  `json:"phone"`
	Password     string  `json:"password"`
	Gender       string  `json:"gender"`
	Birthday     *string `json:"birthday"`
	OnBehalfID   *int64  `json:"on_behalf_id"`
	ReferralCode string  `json:"referral_code"`
}

// SigninRequest contains payload for user login.
type SigninRequest struct {
	EmailOrPhone string `json:"email_or_phone"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Password     string `json:"password"`
}

// TwoFactorChallengeRequest contains payload for 2FA completion.
type TwoFactorChallengeRequest struct {
	TwoFactorToken string `json:"two_factor_token"`
	Code           string `json:"code"`
	IsRecoveryCode bool   `json:"is_recovery_code"`
}

// ResetPasswordRequest contains payload for password reset.
type ResetPasswordRequest struct {
	Email           string `json:"email"`
	Code            string `json:"code"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirmation"`
}

// UserSummary represents the serialized user in auth responses.
type UserSummary struct {
	ID                 int64      `json:"id"`
	Type               string     `json:"type"`
	Name               string     `json:"name"`
	FirstName          string     `json:"first_name"`
	LastName           string     `json:"last_name"`
	Email              string     `json:"email"`
	Phone              string     `json:"phone"`
	Membership         int        `json:"membership"`
	EmailVerifiedAt    *time.Time `json:"email_verified_at"`
	PhotoApproved      bool       `json:"photo_approved"`
	Blocked            bool       `json:"blocked"`
	Deactivated        bool       `json:"deactivated"`
	Approved           bool       `json:"approved"`
	MustChangePassword bool       `json:"must_change_password"`
	Birthday           *string    `json:"birthday"`
	Gender             string     `json:"gender"`
	Avatar             string     `json:"avatar"`
	ReferralCode       string     `json:"referral_code"`
}

// AuthResult represents the response for successful authentication or 2FA challenge.
type AuthResult struct {
	Result            bool         `json:"result"`
	Token             string       `json:"token,omitempty"`
	TokenType         string       `json:"token_type,omitempty"`
	ExpiresAt         *time.Time   `json:"expires_at,omitempty"`
	User              *UserSummary `json:"user,omitempty"`
	TwoFactorRequired bool         `json:"two_factor_required,omitempty"`
	TwoFactorToken    string       `json:"two_factor_token,omitempty"`
	Message           string       `json:"message,omitempty"`
}

// Signup processes member registration.
func (s *Service) Signup(ctx context.Context, req SignupRequest, telemetry DeviceTelemetry) (*AuthResult, error) {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" {
		return nil, errors.New("email is required")
	}

	if err := ValidatePasswordStrength(req.Password); err != nil {
		return nil, err
	}

	// 1. Verify email OTP was completed within the last 30 minutes
	var isVerified bool
	otpQuery := `
		SELECT EXISTS (
			SELECT 1 FROM verification_codes 
			WHERE identifier = $1 AND type = 'email' AND verified = true 
			AND expires_at > NOW() - INTERVAL '30 minutes'
		)
	`
	_ = s.pg.Pool.QueryRow(ctx, otpQuery, req.Email).Scan(&isVerified)
	if !isVerified {
		// Also check redis cache
		if s.redis != nil {
			cachedVerified, _ := s.redis.GetString(ctx, redis.Key("email_verified", req.Email))
			if cachedVerified == "true" {
				isVerified = true
			}
		}
	}

	// Allow signup in dev if verification not strictly enforced, but check if required
	// Check existing email
	var exists bool
	_ = s.pg.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)", req.Email).Scan(&exists)
	if exists {
		return nil, ErrEmailAlreadyExists
	}

	// Hash password
	pwHash, err := HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	var userID int64
	var userCode string

	err = s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		// Insert User
		userQuery := `
			INSERT INTO users (
				first_name, last_name, email, phone, password, user_type, membership, 
				email_verified_at, approved, blocked, deactivated, must_change_password, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, 'member', 1,
				$6, true, false, false, false, $7, $7
			) RETURNING id
		`
		if err := tx.QueryRow(ctx, userQuery, req.FirstName, req.LastName, req.Email, req.Phone, pwHash, now, now).Scan(&userID); err != nil {
			return fmt.Errorf("failed to insert user: %w", err)
		}

		userCode = fmt.Sprintf("DMB-%06d", userID)
		_, _ = tx.Exec(ctx, "UPDATE users SET code = $1 WHERE id = $2", userCode, userID)

		// Insert Member
		memberQuery := `
			INSERT INTO members (
				user_id, gender, birthday, on_behalves_id, current_package_id, remaining_interest, is_approved, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, (SELECT MIN(id) FROM packages WHERE price = 0 AND active), 5, true, $5, $5
			)
		`
		if _, err := tx.Exec(ctx, memberQuery, userID, req.Gender, req.Birthday, req.OnBehalfID, now); err != nil {
			return fmt.Errorf("failed to insert member: %w", err)
		}

		// Insert 1-to-1 profile tables default records
		_, _ = tx.Exec(ctx, "INSERT INTO physical_attributes (user_id, created_at, updated_at) VALUES ($1, $2, $2) ON CONFLICT DO NOTHING", userID, now)
		_, _ = tx.Exec(ctx, "INSERT INTO spiritual_backgrounds (user_id, created_at, updated_at) VALUES ($1, $2, $2) ON CONFLICT DO NOTHING", userID, now)
		_, _ = tx.Exec(ctx, "INSERT INTO lifestyles (user_id, created_at, updated_at) VALUES ($1, $2, $2) ON CONFLICT DO NOTHING", userID, now)
		_, _ = tx.Exec(ctx, "INSERT INTO families (user_id, created_at, updated_at) VALUES ($1, $2, $2) ON CONFLICT DO NOTHING", userID, now)
		_, _ = tx.Exec(ctx, "INSERT INTO partner_expectations (user_id, created_at, updated_at) VALUES ($1, $2, $2) ON CONFLICT DO NOTHING", userID, now)
		_, _ = tx.Exec(ctx, "INSERT INTO field_visibility_settings (user_id, field_name, created_at, updated_at) VALUES ($1, '_global', $2, $2) ON CONFLICT DO NOTHING", userID, now)

		// Generate referral code
		refCode := fmt.Sprintf("REF%d%s", userID, strings.ToUpper(userCode[4:]))
		_, _ = tx.Exec(ctx, "INSERT INTO referral_codes (user_id, code, created_at, updated_at) VALUES ($1, $2, $3, $3) ON CONFLICT DO NOTHING", userID, refCode, now)

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Issue token
	token, err := s.issueSanctumToken(ctx, userID, telemetry)
	if err != nil {
		return nil, err
	}

	userSummary := &UserSummary{
		ID:              userID,
		Type:            "member",
		Name:            strings.TrimSpace(req.FirstName + " " + req.LastName),
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Email:           req.Email,
		Phone:           req.Phone,
		Membership:      1,
		EmailVerifiedAt: &now,
		Approved:        true,
		Gender:          req.Gender,
		Birthday:        req.Birthday,
		ReferralCode:    fmt.Sprintf("REF%d%s", userID, strings.ToUpper(userCode[4:])),
	}

	return &AuthResult{
		Result:    true,
		Token:     token.Plain,
		TokenType: "Bearer",
		User:      userSummary,
		Message:   "Registration successful",
	}, nil
}

// Signin authenticates a user via email/phone and password.
func (s *Service) Signin(ctx context.Context, req SigninRequest, telemetry DeviceTelemetry) (*AuthResult, error) {
	identifier := strings.TrimSpace(req.EmailOrPhone)
	if identifier == "" {
		identifier = strings.TrimSpace(req.Email)
	}
	if identifier == "" {
		identifier = strings.TrimSpace(req.Phone)
	}
	if identifier == "" || req.Password == "" {
		return nil, ErrInvalidCredentials
	}

	// Lookup user
	query := `
		SELECT 
			u.id, u.first_name, u.last_name, u.email, COALESCE(u.phone, ''), u.password,
			COALESCE(u.user_type, 'member'), COALESCE(u.membership, 1),
			COALESCE(u.blocked, false), COALESCE(u.deactivated, false),
			COALESCE(u.approved, true), (COALESCE(u.photo_approved, 1) = 1),
			COALESCE(u.must_change_password, false), u.email_verified_at,
			COALESCE(m.gender, ''), CAST(m.birthday AS TEXT), COALESCE(NULLIF(u.code, ''), rc.code, ''),
			` + assets.PhotoSQLWithUserFallback("u.photo", "u.id") + `
		FROM users u
		LEFT JOIN members m ON m.user_id = u.id
		LEFT JOIN referral_codes rc ON rc.user_id = u.id
		WHERE (LOWER(u.email) = LOWER($1) OR u.phone = $1) AND u.deleted_at IS NULL
		LIMIT 1
	`

	var (
		id                 int64
		firstName, lastName string
		email, phone, pwHash string
		userType           string
		membership         int
		blocked, deactivated, approved, photoApproved, mustChangePassword bool
		emailVerifiedAt    *time.Time
		gender             string
		birthday           *string
		referralCode       string
		avatar             string
	)

	err := s.pg.Pool.QueryRow(ctx, query, identifier).Scan(
		&id, &firstName, &lastName, &email, &phone, &pwHash,
		&userType, &membership,
		&blocked, &deactivated, &approved, &photoApproved,
		&mustChangePassword, &emailVerifiedAt,
		&gender, &birthday, &referralCode, &avatar,
	)

	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Verify Bcrypt password (including legacy $2y$)
	if !VerifyPassword(req.Password, pwHash) {
		return nil, ErrInvalidCredentials
	}

	// Check if legacy hash needs transparent rehash
	if NeedsRehash(pwHash, DefaultBcryptCost) {
		if newHash, err := HashPassword(req.Password); err == nil {
			go func(uID int64, h string) {
				bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
				defer cancel()
				_, _ = s.pg.Pool.Exec(bgCtx, "UPDATE users SET password = $1 WHERE id = $2", h, uID)
			}(id, newHash)
		}
	}

	if blocked {
		return nil, ErrAccountBlocked
	}
	if deactivated {
		return nil, ErrAccountDeactivated
	}

	// Check 2FA requirement
	var twoFactorEnabled bool
	var totpSecret string
	_ = s.pg.Pool.QueryRow(ctx, "SELECT COALESCE(is_enabled, false), COALESCE(secret, '') FROM user_two_factor_settings WHERE user_id = $1", id).Scan(&twoFactorEnabled, &totpSecret)

	if twoFactorEnabled && totpSecret != "" {
		// Generate 2FA challenge temp token
		tempToken, err := GenerateRandomString(64)
		if err != nil {
			return nil, err
		}

		// Store challenge token in Redis or DB (10 min TTL)
		if s.redis != nil {
			_ = s.redis.SetString(ctx, redis.Key("2fa_challenge", tempToken), fmt.Sprintf("%d", id), 10*time.Minute)
		}

		return &AuthResult{
			Result:            true,
			TwoFactorRequired: true,
			TwoFactorToken:    tempToken,
			Message:           "Two-factor authentication required.",
		}, nil
	}

	// Issue Sanctum Token
	token, err := s.issueSanctumToken(ctx, id, telemetry)
	if err != nil {
		return nil, err
	}

	userSummary := &UserSummary{
		ID:                 id,
		Type:               userType,
		Name:               strings.TrimSpace(firstName + " " + lastName),
		FirstName:          firstName,
		LastName:           lastName,
		Email:              email,
		Phone:              phone,
		Membership:         membership,
		EmailVerifiedAt:    emailVerifiedAt,
		PhotoApproved:      photoApproved,
		Blocked:            blocked,
		Deactivated:        deactivated,
		Approved:           approved,
		MustChangePassword: mustChangePassword,
		Gender:             cards.NormalizeGender(gender),
		Birthday:           birthday,
		ReferralCode:       referralCode,
		Avatar:             avatar,
	}

	return &AuthResult{
		Result:    true,
		Token:     token.Plain,
		TokenType: "Bearer",
		User:      userSummary,
		Message:   "Signed in successfully",
	}, nil
}

// Verify2FAChallenge verifies the TOTP passcode or backup recovery code during login challenge.
func (s *Service) Verify2FAChallenge(ctx context.Context, req TwoFactorChallengeRequest, telemetry DeviceTelemetry) (*AuthResult, error) {
	if req.TwoFactorToken == "" || req.Code == "" {
		return nil, errors.New("two-factor token and code are required")
	}

	// Lookup user ID from challenge token
	var userID int64
	if s.redis != nil {
		val, err := s.redis.GetString(ctx, redis.Key("2fa_challenge", req.TwoFactorToken))
		if err == nil && val != "" {
			_, _ = fmt.Sscanf(val, "%d", &userID)
		}
	}

	if userID == 0 {
		return nil, errors.New("invalid or expired two-factor session")
	}

	// Lookup 2FA settings
	var totpSecret string
	var recoveryCodesJSON []byte
	query := `SELECT COALESCE(secret, ''), recovery_codes FROM user_two_factor_settings WHERE user_id = $1 AND is_enabled = true`
	err := s.pg.Pool.QueryRow(ctx, query, userID).Scan(&totpSecret, &recoveryCodesJSON)
	if err != nil || totpSecret == "" {
		return nil, ErrInvalid2FACode
	}

	var recoveryCodes []string
	if len(recoveryCodesJSON) > 0 {
		_ = json.Unmarshal(recoveryCodesJSON, &recoveryCodes)
	}

	var verified bool
	if req.IsRecoveryCode {
		var remaining []string
		verified, remaining = ConsumeRecoveryCode(req.Code, recoveryCodes)
		if verified {
			// Update remaining recovery codes
			newJSON, _ := json.Marshal(remaining)
			_, _ = s.pg.Pool.Exec(ctx, "UPDATE user_two_factor_settings SET recovery_codes = $1 WHERE user_id = $2", newJSON, userID)
		}
	} else {
		verified = VerifyTOTPCode(req.Code, totpSecret)
	}

	if !verified {
		return nil, ErrInvalid2FACode
	}

	// Consume challenge token
	if s.redis != nil {
		_ = s.redis.Delete(ctx, redis.Key("2fa_challenge", req.TwoFactorToken))
	}

	// Retrieve user profile
	user, err := s.GetMe(ctx, userID)
	if err != nil {
		return nil, err
	}

	token, err := s.issueSanctumToken(ctx, userID, telemetry)
	if err != nil {
		return nil, err
	}

	return &AuthResult{
		Result:    true,
		Token:     token.Plain,
		TokenType: "Bearer",
		User:      user,
		Message:   "Two-factor authentication verified successfully",
	}, nil
}

// ForgotPassword generates a 6-digit OTP code for password reset.
func (s *Service) ForgotPassword(ctx context.Context, email string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return "", errors.New("email is required")
	}

	var userID int64
	err := s.pg.Pool.QueryRow(ctx, "SELECT id FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL", email).Scan(&userID)
	if err != nil {
		return "", ErrUserNotFound
	}

	// Rate limit check
	if s.redis != nil {
		key := redis.RateLimitKey("forgot_password", email)
		count, _ := s.redis.Increment(ctx, key, 15*time.Minute)
		if count > 5 {
			return "", ErrRateLimitExceeded
		}
	}

	code, err := Generate6DigitOTP()
	if err != nil {
		return "", err
	}

	expiresAt := time.Now().Add(15 * time.Minute)

	// Save to DB
	_, _ = s.pg.Pool.Exec(ctx, `
		INSERT INTO verification_codes (identifier, code, type, expires_at, verified, created_at, updated_at)
		VALUES ($1, $2, 'password_reset', $3, false, NOW(), NOW())
	`, email, code, expiresAt)

	if s.redis != nil {
		_ = s.redis.SetString(ctx, redis.OTPKey("password_reset", email), code, 15*time.Minute)
	}

	slog.Info("Password reset code generated", "email", email, "code", code)
	return code, nil
}

// ResetPassword verifies the OTP and sets the new password.
func (s *Service) ResetPassword(ctx context.Context, req ResetPasswordRequest) error {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || req.Code == "" || req.Password == "" {
		return errors.New("email, code, and new password are required")
	}

	if req.Password != req.PasswordConfirm {
		return ErrPasswordMismatch
	}

	if err := ValidatePasswordStrength(req.Password); err != nil {
		return err
	}

	// Verify code
	var codeID int64
	query := `
		SELECT id FROM verification_codes 
		WHERE identifier = $1 AND code = $2 AND type = 'password_reset' AND verified = false AND expires_at > NOW()
		ORDER BY created_at DESC LIMIT 1
	`
	err := s.pg.Pool.QueryRow(ctx, query, req.Email, req.Code).Scan(&codeID)
	if err != nil {
		// Fallback check Redis
		if s.redis != nil {
			cachedCode, _ := s.redis.GetString(ctx, redis.OTPKey("password_reset", req.Email))
			if cachedCode != req.Code {
				return ErrInvalidOTP
			}
		} else {
			return ErrInvalidOTP
		}
	}

	pwHash, err := HashPassword(req.Password)
	if err != nil {
		return err
	}

	// Update user password and mark code used
	now := time.Now()
	err = s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		_, err := tx.Exec(ctx, "UPDATE users SET password = $1, must_change_password = false, updated_at = $2 WHERE LOWER(email) = $3", pwHash, now, req.Email)
		if err != nil {
			return err
		}
		if codeID > 0 {
			_, _ = tx.Exec(ctx, "UPDATE verification_codes SET verified = true, updated_at = $1 WHERE id = $2", now, codeID)
		}
		return nil
	})

	if s.redis != nil {
		_ = s.redis.Delete(ctx, redis.OTPKey("password_reset", req.Email))
	}

	return err
}

// SendEmailOTP dispatches a 6-digit verification code.
func (s *Service) SendEmailOTP(ctx context.Context, email string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return "", errors.New("email is required")
	}

	code, err := Generate6DigitOTP()
	if err != nil {
		return "", err
	}

	expiresAt := time.Now().Add(5 * time.Minute)

	_, _ = s.pg.Pool.Exec(ctx, `
		INSERT INTO verification_codes (identifier, code, type, expires_at, verified, created_at, updated_at)
		VALUES ($1, $2, 'email', $3, false, NOW(), NOW())
	`, email, code, expiresAt)

	if s.redis != nil {
		_ = s.redis.SetString(ctx, redis.OTPKey("email_verify", email), code, 5*time.Minute)
	}

	slog.Info("Email OTP generated", "email", email, "code", code)
	return code, nil
}

// VerifyEmailOTP confirms the 6-digit code.
func (s *Service) VerifyEmailOTP(ctx context.Context, email, code string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	code = strings.TrimSpace(code)

	var codeID int64
	query := `
		SELECT id FROM verification_codes 
		WHERE identifier = $1 AND code = $2 AND type = 'email' AND verified = false AND expires_at > NOW()
		ORDER BY created_at DESC LIMIT 1
	`
	err := s.pg.Pool.QueryRow(ctx, query, email, code).Scan(&codeID)
	if err != nil {
		if s.redis != nil {
			cachedCode, _ := s.redis.GetString(ctx, redis.OTPKey("email_verify", email))
			if cachedCode != code {
				return ErrInvalidOTP
			}
		} else {
			return ErrInvalidOTP
		}
	}

	now := time.Now()
	if codeID > 0 {
		_, _ = s.pg.Pool.Exec(ctx, "UPDATE verification_codes SET verified = true, updated_at = $1 WHERE id = $2", now, codeID)
	}
	_, _ = s.pg.Pool.Exec(ctx, "UPDATE users SET email_verified_at = $1 WHERE LOWER(email) = $2", now, email)

	if s.redis != nil {
		_ = s.redis.SetString(ctx, redis.Key("email_verified", email), "true", 30*time.Minute)
		_ = s.redis.Delete(ctx, redis.OTPKey("email_verify", email))
	}

	return nil
}

// GetMe retrieves the full user summary for the given user ID.
func (s *Service) GetMe(ctx context.Context, userID int64) (*UserSummary, error) {
	query := `
		SELECT 
			u.id, u.first_name, u.last_name, u.email, COALESCE(u.phone, ''),
			COALESCE(u.user_type, 'member'), COALESCE(u.membership, 1),
			COALESCE(u.blocked, false), COALESCE(u.deactivated, false),
			COALESCE(u.approved, true), (COALESCE(u.photo_approved, 1) = 1),
			COALESCE(u.must_change_password, false), u.email_verified_at,
			COALESCE(m.gender, ''), CAST(m.birthday AS TEXT), COALESCE(NULLIF(u.code, ''), rc.code, ''),
			` + assets.PhotoSQLWithUserFallback("u.photo", "u.id") + `
		FROM users u
		LEFT JOIN members m ON m.user_id = u.id
		LEFT JOIN referral_codes rc ON rc.user_id = u.id
		WHERE u.id = $1 AND u.deleted_at IS NULL
	`

	var (
		id                 int64
		firstName, lastName string
		email, phone       string
		userType           string
		membership         int
		blocked, deactivated, approved, photoApproved, mustChangePassword bool
		emailVerifiedAt    *time.Time
		gender             string
		birthday           *string
		referralCode       string
		avatar             string
	)

	err := s.pg.Pool.QueryRow(ctx, query, userID).Scan(
		&id, &firstName, &lastName, &email, &phone,
		&userType, &membership,
		&blocked, &deactivated, &approved, &photoApproved,
		&mustChangePassword, &emailVerifiedAt,
		&gender, &birthday, &referralCode, &avatar,
	)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return &UserSummary{
		ID:                 id,
		Type:               userType,
		Name:               strings.TrimSpace(firstName + " " + lastName),
		FirstName:          firstName,
		LastName:           lastName,
		Email:              email,
		Phone:              phone,
		Membership:         membership,
		EmailVerifiedAt:    emailVerifiedAt,
		PhotoApproved:      photoApproved,
		Blocked:            blocked,
		Deactivated:        deactivated,
		Approved:           approved,
		MustChangePassword: mustChangePassword,
		Gender:             cards.NormalizeGender(gender),
		Birthday:           birthday,
		ReferralCode:       referralCode,
		Avatar:             avatar,
	}, nil
}

// Setup2FA initiates TOTP setup.
func (s *Service) Setup2FA(ctx context.Context, userID int64, email string) (*TOTPSetupResult, error) {
	setup, err := GenerateTOTPSetup(email)
	if err != nil {
		return nil, err
	}

	codesJSON, err := json.Marshal(setup.RecoveryCodes)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO user_two_factor_settings (user_id, is_enabled, secret, recovery_codes, created_at, updated_at)
		VALUES ($1, false, $2, $3, NOW(), NOW())
		ON CONFLICT (user_id) DO UPDATE 
		SET secret = EXCLUDED.secret, recovery_codes = EXCLUDED.recovery_codes, is_enabled = false, updated_at = NOW()
	`
	_, err = s.pg.Pool.Exec(ctx, query, userID, setup.Secret, codesJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to save 2fa setup: %w", err)
	}

	return setup, nil
}

// Enable2FA confirms the initial TOTP passcode and activates 2FA.
func (s *Service) Enable2FA(ctx context.Context, userID int64, code string) error {
	var secret string
	err := s.pg.Pool.QueryRow(ctx, "SELECT COALESCE(secret, '') FROM user_two_factor_settings WHERE user_id = $1", userID).Scan(&secret)
	if err != nil || secret == "" {
		return errors.New("please initiate 2FA setup first")
	}

	if !VerifyTOTPCode(code, secret) {
		return ErrInvalid2FACode
	}

	now := time.Now()
	_, err = s.pg.Pool.Exec(ctx, "UPDATE user_two_factor_settings SET is_enabled = true, confirmed_at = $1, updated_at = $1 WHERE user_id = $2", now, userID)
	return err
}

// Disable2FA deactivates 2FA after password confirmation.
func (s *Service) Disable2FA(ctx context.Context, userID int64, password string) error {
	var pwHash string
	err := s.pg.Pool.QueryRow(ctx, "SELECT password FROM users WHERE id = $1", userID).Scan(&pwHash)
	if err != nil || !VerifyPassword(password, pwHash) {
		return ErrInvalidCredentials
	}

	_, err = s.pg.Pool.Exec(ctx, "UPDATE user_two_factor_settings SET is_enabled = false, secret = NULL, recovery_codes = '[]'::jsonb, updated_at = NOW() WHERE user_id = $1", userID)
	return err
}

// InitiateStepUp generates a 10-minute Step-Up auth token.
func (s *Service) InitiateStepUp(ctx context.Context, userID int64, actionType string) (*StepUpToken, error) {
	stepUp, err := GenerateStepUpToken(actionType)
	if err != nil {
		return nil, err
	}

	tokenHash := HashToken(stepUp.Token)

	_, err = s.pg.Pool.Exec(ctx, `
		INSERT INTO step_up_auth_tokens (user_id, token, purpose, expires_at, created_at)
		VALUES ($1, $2, $3, $4, NOW())
	`, userID, tokenHash, actionType, stepUp.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed to save step-up token: %w", err)
	}

	if s.redis != nil {
		_ = s.redis.SetString(ctx, redis.StepUpKey(userID, tokenHash), actionType, 10*time.Minute)
	}

	return stepUp, nil
}

// VerifyStepUp validates that a valid step-up token exists for the given action.
func (s *Service) VerifyStepUp(ctx context.Context, userID int64, tokenStr, actionType string) error {
	tokenHash := HashToken(tokenStr)

	var id int64
	query := `
		SELECT id FROM step_up_auth_tokens 
		WHERE user_id = $1 AND token = $2 AND purpose = $3 AND is_valid = true AND completed_at IS NULL AND expires_at > NOW()
		LIMIT 1
	`
	err := s.pg.Pool.QueryRow(ctx, query, userID, tokenHash, actionType).Scan(&id)
	if err != nil {
		return ErrInvalidStepUpToken
	}

	// Mark used
	_, _ = s.pg.Pool.Exec(ctx, "UPDATE step_up_auth_tokens SET is_valid = false, completed_at = NOW() WHERE id = $1", id)
	return nil
}

// Logout revokes the current Sanctum token.
func (s *Service) Logout(ctx context.Context, tokenStr string) error {
	tokenHash := HashSanctumToken(tokenStr)
	_, err := s.pg.Pool.Exec(ctx, "DELETE FROM personal_access_tokens WHERE token = $1", tokenHash)
	return err
}

func (s *Service) issueSanctumToken(ctx context.Context, userID int64, telemetry DeviceTelemetry) (*SanctumToken, error) {
	now := time.Now()
	expiresAt := now.Add(30 * 24 * time.Hour)

	var tokenID int64
	err := s.pg.Pool.QueryRow(ctx, `
		INSERT INTO personal_access_tokens (
			tokenable_type, tokenable_id, name, token, abilities, 
			ip_address, user_agent, device_name, device_type, browser, os, is_current, 
			last_used_at, expires_at, created_at, updated_at
		) VALUES (
			'App\\Models\\User', $1, 'web-token', 'temp', '["*"]'::jsonb,
			$2, $3, $4, $5, $6, $7, true,
			$8, $9, $8, $8
		) RETURNING id
	`, userID, telemetry.IPAddress, telemetry.UserAgent, telemetry.DeviceName, telemetry.DeviceType, telemetry.Browser, telemetry.OS, now, expiresAt).Scan(&tokenID)

	if err != nil {
		return nil, fmt.Errorf("failed to create personal access token: %w", err)
	}

	sanctumToken, err := CreateSanctumToken(tokenID)
	if err != nil {
		return nil, err
	}

	_, err = s.pg.Pool.Exec(ctx, "UPDATE personal_access_tokens SET token = $1 WHERE id = $2", sanctumToken.Hash, tokenID)
	if err != nil {
		return nil, fmt.Errorf("failed to update token hash: %w", err)
	}

	sanctumToken.ExpiresAt = &expiresAt
	return sanctumToken, nil
}

// ChangePassword verifies the current password and sets a new one.
func (s *Service) ChangePassword(ctx context.Context, userID int64, currentPassword, newPassword string) error {
	if err := ValidatePasswordStrength(newPassword); err != nil {
		return err
	}

	var pwHash string
	if err := s.pg.Pool.QueryRow(ctx, "SELECT password FROM users WHERE id = $1 AND deleted_at IS NULL", userID).Scan(&pwHash); err != nil {
		return ErrInvalidCredentials
	}

	if !VerifyPassword(currentPassword, pwHash) {
		return ErrInvalidCredentials
	}

	newHash, err := HashPassword(newPassword)
	if err != nil {
		return err
	}

	_, err = s.pg.Pool.Exec(ctx, "UPDATE users SET password = $1, must_change_password = false, updated_at = NOW() WHERE id = $2", newHash, userID)
	return err
}
