package auth

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"

	"github.com/pquerna/otp/totp"
)

// TOTPSetupResult contains the generated TOTP secret, provisioning URI, and recovery codes.
type TOTPSetupResult struct {
	Secret        string   `json:"secret"`
	QRCodeURI     string   `json:"qr_code_uri"`
	RecoveryCodes []string `json:"recovery_codes"`
}

// GenerateTOTPSetup generates a new RFC 6238 TOTP secret, QR URI, and 8 recovery codes.
func GenerateTOTPSetup(accountEmail string) (*TOTPSetupResult, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Doctor Marriage Bureau",
		AccountName: accountEmail,
		Period:      30,
		Digits:      6,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate totp key: %w", err)
	}

	recoveryCodes, err := GenerateRecoveryCodes(8)
	if err != nil {
		return nil, fmt.Errorf("failed to generate recovery codes: %w", err)
	}

	return &TOTPSetupResult{
		Secret:        key.Secret(),
		QRCodeURI:     key.URL(),
		RecoveryCodes: recoveryCodes,
	}, nil
}

// VerifyTOTPCode verifies a 6-digit TOTP passcode against the user's secret.
func VerifyTOTPCode(passcode, secret string) bool {
	if secret == "" || passcode == "" {
		return false
	}
	passcode = strings.TrimSpace(passcode)
	return totp.Validate(passcode, secret)
}

// GenerateRecoveryCodes generates count unique 10-character alphanumeric recovery codes.
func GenerateRecoveryCodes(count int) ([]string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // omit ambiguous chars (0, O, 1, I)
	codes := make([]string, count)

	for i := 0; i < count; i++ {
		b := make([]byte, 10)
		for j := 0; j < 10; j++ {
			idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
			if err != nil {
				return nil, err
			}
			b[j] = charset[idx.Int64()]
		}
		// Format as XXXXX-XXXXX
		codes[i] = fmt.Sprintf("%s-%s", string(b[:5]), string(b[5:]))
	}

	return codes, nil
}

// ConsumeRecoveryCode checks if the given code exists in the recovery codes slice.
// If found, it removes the code and returns true and the remaining slice.
func ConsumeRecoveryCode(inputCode string, codes []string) (bool, []string) {
	cleanInput := strings.ToUpper(strings.TrimSpace(strings.ReplaceAll(inputCode, "-", "")))
	if cleanInput == "" {
		return false, codes
	}

	for i, code := range codes {
		cleanStored := strings.ToUpper(strings.TrimSpace(strings.ReplaceAll(code, "-", "")))
		if cleanInput == cleanStored {
			remaining := append(codes[:i], codes[i+1:]...)
			return true, remaining
		}
	}

	return false, codes
}
