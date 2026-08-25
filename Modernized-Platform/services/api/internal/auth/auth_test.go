package auth

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

func TestVerifyPassword_Laravel2y(t *testing.T) {
	// Generate real $2a$ and prefix with $2y$ to simulate Laravel
	real2a, err := bcrypt.GenerateFromPassword([]byte("DoctorPass123"), 10)
	if err != nil {
		t.Fatalf("failed to generate bcrypt hash: %v", err)
	}

	laravelBcryptHash := "$2y$" + string(real2a[4:])

	// Verify existing Laravel hash matches without modification
	if !VerifyPassword("DoctorPass123", laravelBcryptHash) {
		t.Errorf("expected Laravel $2y$ hash to verify successfully")
	}

	// Verify incorrect password fails
	if VerifyPassword("WrongPassword123", laravelBcryptHash) {
		t.Errorf("expected wrong password to fail verification")
	}

	// Verify needs rehash
	if !NeedsRehash(laravelBcryptHash, DefaultBcryptCost) {
		t.Errorf("expected $2y$ hash to require rehash to modern cost")
	}
}

func TestVerifyPassword_Standard2a(t *testing.T) {
	rawPass := "SecureDoctor#2026"
	hash, err := HashPassword(rawPass)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	if !VerifyPassword(rawPass, hash) {
		t.Errorf("expected standard hash to verify successfully")
	}

	if VerifyPassword("InvalidPass#2026", hash) {
		t.Errorf("expected incorrect password to fail")
	}
}

func TestPasswordStrengthValidation(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"Too short", "Doc1", true},
		{"No numbers", "DoctorPassword", true},
		{"No letters", "1234567890", true},
		{"Valid alphanumeric", "DoctorPass2026", false},
		{"Valid complex", "My$ecurePass123", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePasswordStrength(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePasswordStrength() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestSanctumToken_Hashing(t *testing.T) {
	tokenID := int64(42)
	sanctumToken, err := CreateSanctumToken(tokenID)
	if err != nil {
		t.Fatalf("failed to create sanctum token: %v", err)
	}

	if !strings.HasPrefix(sanctumToken.Plain, "42|") {
		t.Errorf("expected token prefix '42|', got '%s'", sanctumToken.Plain)
	}

	// Verify hash matches sha256 of plain token random part
	plainRandom := sanctumToken.Plain[3:]
	expectedHashBytes := sha256.Sum256([]byte(plainRandom))
	expectedHash := hex.EncodeToString(expectedHashBytes[:])

	if sanctumToken.Hash != expectedHash {
		t.Errorf("expected hash %s, got %s", expectedHash, sanctumToken.Hash)
	}

	// Test HashToken helper
	if HashToken(sanctumToken.Plain) != expectedHash {
		t.Errorf("HashToken output does not match expected hash")
	}
}

func TestGenerate6DigitOTP(t *testing.T) {
	for i := 0; i < 50; i++ {
		otp, err := Generate6DigitOTP()
		if err != nil {
			t.Fatalf("failed to generate OTP: %v", err)
		}
		if len(otp) != 6 {
			t.Errorf("expected OTP length 6, got %d (value: %s)", len(otp), otp)
		}
		num, err := strconv.Atoi(otp)
		if err != nil || num < 0 || num > 999999 {
			t.Errorf("invalid OTP numeric value: %s", otp)
		}
	}
}

func TestTOTP_GenerationAndVerification(t *testing.T) {
	email := "dr.test@doctormarriagebureau.com"
	setup, err := GenerateTOTPSetup(email)
	if err != nil {
		t.Fatalf("failed to generate TOTP setup: %v", err)
	}

	if setup.Secret == "" {
		t.Errorf("expected non-empty TOTP secret")
	}
	if !strings.HasPrefix(setup.QRCodeURI, "otpauth://totp/") {
		t.Errorf("expected valid OTP QR URI, got '%s'", setup.QRCodeURI)
	}
	if len(setup.RecoveryCodes) != 8 {
		t.Errorf("expected 8 recovery codes, got %d", len(setup.RecoveryCodes))
	}

	// Generate current valid TOTP passcode
	passcode, err := totp.GenerateCode(setup.Secret, time.Now())
	if err != nil {
		t.Fatalf("failed to generate code: %v", err)
	}

	if !VerifyTOTPCode(passcode, setup.Secret) {
		t.Errorf("expected TOTP code %s to verify against secret %s", passcode, setup.Secret)
	}

	// Verify invalid passcode fails
	if VerifyTOTPCode("000000", setup.Secret) && passcode != "000000" {
		t.Errorf("expected invalid passcode to fail")
	}
}

func TestRecoveryCodes_GenerationAndConsumption(t *testing.T) {
	codes, err := GenerateRecoveryCodes(8)
	if err != nil {
		t.Fatalf("failed to generate recovery codes: %v", err)
	}

	if len(codes) != 8 {
		t.Fatalf("expected 8 codes, got %d", len(codes))
	}

	// Check code format: XXXXX-XXXXX (11 chars with hyphen)
	for _, c := range codes {
		if len(c) != 11 || c[5] != '-' {
			t.Errorf("invalid recovery code format: %s", c)
		}
	}

	// Consume first code
	codeToUse := codes[0]
	consumed, remaining := ConsumeRecoveryCode(codeToUse, codes)
	if !consumed {
		t.Errorf("expected recovery code %s to be consumed", codeToUse)
	}
	if len(remaining) != 7 {
		t.Errorf("expected 7 remaining codes, got %d", len(remaining))
	}

	// Try consuming same code again (should fail)
	consumedAgain, _ := ConsumeRecoveryCode(codeToUse, remaining)
	if consumedAgain {
		t.Errorf("expected already consumed code to fail")
	}
}

func TestStepUpToken(t *testing.T) {
	token, err := GenerateStepUpToken("change_email")
	if err != nil {
		t.Fatalf("failed to generate step-up token: %v", err)
	}

	if len(token.Token) != 64 {
		t.Errorf("expected 64-char token, got length %d", len(token.Token))
	}
	if token.ActionType != "change_email" {
		t.Errorf("expected action_type 'change_email', got '%s'", token.ActionType)
	}
	if token.ExpiresAt.Before(time.Now().Add(9 * time.Minute)) {
		t.Errorf("expected 10-minute expiry window")
	}
}

func TestParseDeviceTelemetry(t *testing.T) {
	uaChrome := "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
	t1 := ParseDeviceTelemetry("192.168.1.100", uaChrome)
	if t1.Browser != "Chrome" || t1.OS != "Windows" || t1.DeviceType != "desktop" {
		t.Errorf("failed to parse Chrome on Windows: %+v", t1)
	}

	uaIPhone := "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
	t2 := ParseDeviceTelemetry("10.0.0.1", uaIPhone)
	if t2.DeviceType != "mobile" || t2.OS != "iOS" {
		t.Errorf("failed to parse iPhone: %+v", t2)
	}
}

func TestAuthHTTPHandlers(t *testing.T) {
	svc := NewService(nil, nil)
	handler := NewHandler(svc)

	r := chi.NewRouter()
	noopMw := func(next http.Handler) http.Handler { return next }
	handler.RegisterRoutes(r, noopMw, noopMw, noopMw)

	// 1. Test POST /auth/signup with invalid JSON body
	req := httptest.NewRequest(http.MethodPost, "/auth/signup", bytes.NewReader([]byte("invalid json")))
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for malformed json, got %d", rr.Code)
	}

	// 2. Test POST /auth/signin with invalid JSON body
	req = httptest.NewRequest(http.MethodPost, "/auth/signin", bytes.NewReader([]byte("invalid json")))
	rr = httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for malformed json, got %d", rr.Code)
	}

	// 3. Test POST /auth/2fa/challenge with empty body
	req = httptest.NewRequest(http.MethodPost, "/auth/2fa/challenge", bytes.NewReader([]byte("{}")))
	rr = httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for empty 2fa challenge, got %d", rr.Code)
	}

	// 4. Test POST /auth/forgot-password with invalid body
	req = httptest.NewRequest(http.MethodPost, "/auth/forgot-password", bytes.NewReader([]byte("not json")))
	rr = httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for malformed json, got %d", rr.Code)
	}

	// 5. Test POST /auth/reset-password with invalid body
	req = httptest.NewRequest(http.MethodPost, "/auth/reset-password", bytes.NewReader([]byte("not json")))
	rr = httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for malformed json, got %d", rr.Code)
	}

	// 6. Test POST /auth/logout
	req = httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
	rr = httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 for logout, got %d", rr.Code)
	}
}
