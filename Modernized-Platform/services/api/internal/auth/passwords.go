package auth

import (
	"errors"
	"fmt"
	"strings"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

const (
	DefaultBcryptCost = 12
)

var (
	ErrPasswordTooShort     = errors.New("password must be at least 8 characters long")
	ErrPasswordNeedsLetter  = errors.New("password must contain at least one letter")
	ErrPasswordNeedsNumber  = errors.New("password must contain at least one number")
	ErrPasswordMismatch     = errors.New("password and confirmation do not match")
	ErrInvalidPasswordHash  = errors.New("invalid password or credentials")
)

// HashPassword hashes a plaintext password with bcrypt at DefaultBcryptCost.
func HashPassword(password string) (string, error) {
	if err := ValidatePasswordStrength(password); err != nil {
		return "", err
	}
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), DefaultBcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(bytes), nil
}

// VerifyPassword verifies a plaintext password against a stored bcrypt hash.
// It handles PHP/Laravel $2y$ prefixes by normalizing them to standard $2a$ for Go bcrypt compatibility.
func VerifyPassword(password, storedHash string) bool {
	if storedHash == "" || password == "" {
		return false
	}

	// Normalize PHP Laravel bcrypt prefix ($2y$ -> $2a$)
	normalizedHash := storedHash
	if strings.HasPrefix(storedHash, "$2y$") {
		normalizedHash = "$2a$" + storedHash[4:]
	}

	err := bcrypt.CompareHashAndPassword([]byte(normalizedHash), []byte(password))
	return err == nil
}

// NeedsRehash checks if the stored hash was generated with legacy algorithm or low cost.
func NeedsRehash(storedHash string, targetCost int) bool {
	if strings.HasPrefix(storedHash, "$2y$") {
		return true
	}
	cost, err := bcrypt.Cost([]byte(storedHash))
	if err != nil {
		return true
	}
	return cost < targetCost
}

// ValidatePasswordStrength ensures the password meets security requirements.
func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return ErrPasswordTooShort
	}

	var hasLetter, hasNumber bool
	for _, ch := range password {
		if unicode.IsLetter(ch) {
			hasLetter = true
		}
		if unicode.IsNumber(ch) {
			hasNumber = true
		}
	}

	if !hasLetter {
		return ErrPasswordNeedsLetter
	}
	if !hasNumber {
		return ErrPasswordNeedsNumber
	}

	return nil
}
