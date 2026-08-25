package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"
	"time"
)

// SanctumToken represents a generated token with plaintext and hashed values.
type SanctumToken struct {
	ID        int64      `json:"id"`
	Plain     string     `json:"token"`
	Hash      string     `json:"-"`
	Name      string     `json:"name"`
	ExpiresAt *time.Time `json:"expires_at"`
}

// DeviceTelemetry contains extracted client device metadata.
type DeviceTelemetry struct {
	IPAddress string `json:"ip_address"`
	UserAgent string `json:"user_agent"`
	DeviceName string `json:"device_name"`
	DeviceType string `json:"device_type"`
	Browser   string `json:"browser"`
	OS        string `json:"os"`
}

// StepUpToken represents a short-lived token for high-risk operations.
type StepUpToken struct {
	Token     string    `json:"token"`
	ActionType string    `json:"action_type"`
	ExpiresAt time.Time `json:"expires_at"`
}

// GenerateRandomString generates a secure random alphanumeric string of length n.
func GenerateRandomString(n int) (string, error) {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	bytes := make([]byte, n)
	for i := 0; i < n; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		if err != nil {
			return "", err
		}
		bytes[i] = letters[num.Int64()]
	}
	return string(bytes), nil
}

// Generate6DigitOTP generates a cryptographically secure 6-digit numeric OTP.
func Generate6DigitOTP() (string, error) {
	maxVal := big.NewInt(1000000) // 0 to 999999
	n, err := rand.Int(rand.Reader, maxVal)
	if err != nil {
		return "", fmt.Errorf("failed to generate random OTP: %w", err)
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// CreateSanctumToken builds a new token string and hash formatted for Laravel Sanctum compatibility.
func CreateSanctumToken(tokenID int64) (*SanctumToken, error) {
	plainRandom, err := GenerateRandomString(40)
	if err != nil {
		return nil, fmt.Errorf("failed to generate random token: %w", err)
	}

	plainToken := fmt.Sprintf("%d|%s", tokenID, plainRandom)
	hash := HashToken(plainRandom)

	return &SanctumToken{
		ID:    tokenID,
		Plain: plainToken,
		Hash:  hash,
		Name:  "web-token",
	}, nil
}

// HashToken computes the SHA-256 hash of a plain token string.
func HashToken(token string) string {
	plain := token
	if idx := strings.Index(token, "|"); idx != -1 {
		plain = token[idx+1:]
	}
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}

// HashSanctumToken computes the SHA-256 hash according to Laravel Sanctum format.
func HashSanctumToken(token string) string {
	return HashToken(token)
}

// GenerateStepUpToken creates a 10-minute step-up authentication token.
func GenerateStepUpToken(actionType string) (*StepUpToken, error) {
	raw, err := GenerateRandomString(64)
	if err != nil {
		return nil, fmt.Errorf("failed to generate step-up token: %w", err)
	}
	return &StepUpToken{
		Token:      raw,
		ActionType: actionType,
		ExpiresAt:  time.Now().Add(10 * time.Minute),
	}, nil
}

// ParseDeviceTelemetry extracts device, browser, and OS info from UserAgent and IP.
func ParseDeviceTelemetry(ip, userAgent string) DeviceTelemetry {
	telemetry := DeviceTelemetry{
		IPAddress: ip,
		UserAgent: userAgent,
		DeviceType: "desktop",
		Browser:   "Unknown",
		OS:        "Unknown",
	}

	uaLower := strings.ToLower(userAgent)

	// Detect Device Type
	if strings.Contains(uaLower, "mobile") || strings.Contains(uaLower, "android") || strings.Contains(uaLower, "iphone") {
		telemetry.DeviceType = "mobile"
	} else if strings.Contains(uaLower, "ipad") || strings.Contains(uaLower, "tablet") {
		telemetry.DeviceType = "tablet"
	}

	// Detect OS
	if strings.Contains(uaLower, "iphone") || strings.Contains(uaLower, "ipad") || strings.Contains(uaLower, "ios") {
		telemetry.OS = "iOS"
	} else if strings.Contains(uaLower, "android") {
		telemetry.OS = "Android"
	} else if strings.Contains(uaLower, "windows") {
		telemetry.OS = "Windows"
	} else if strings.Contains(uaLower, "macintosh") || strings.Contains(uaLower, "mac os") {
		telemetry.OS = "macOS"
	} else if strings.Contains(uaLower, "linux") {
		telemetry.OS = "Linux"
	}

	// Detect Browser
	if strings.Contains(uaLower, "edg/") {
		telemetry.Browser = "Edge"
	} else if strings.Contains(uaLower, "chrome/") && !strings.Contains(uaLower, "edg/") {
		telemetry.Browser = "Chrome"
	} else if strings.Contains(uaLower, "safari/") && !strings.Contains(uaLower, "chrome/") {
		telemetry.Browser = "Safari"
	} else if strings.Contains(uaLower, "firefox/") {
		telemetry.Browser = "Firefox"
	}

	telemetry.DeviceName = fmt.Sprintf("%s on %s", telemetry.Browser, telemetry.OS)
	return telemetry
}
