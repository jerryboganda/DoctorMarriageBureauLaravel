package payments

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

var (
	ErrInvalidStripeSignature = errors.New("invalid Stripe webhook signature")
	ErrStripeEventExpired     = errors.New("stripe webhook event timestamp expired")
)

// StripeSession represents checkout session metadata.
type StripeSession struct {
	ID             string            `json:"id"`
	URL            string            `json:"url"`
	PaymentIntent  string            `json:"payment_intent"`
	AmountTotal    int64             `json:"amount_total"` // in cents
	Currency       string            `json:"currency"`
	CustomerEmail  string            `json:"customer_email"`
	ClientRefID    string            `json:"client_reference_id"`
	Metadata       map[string]string `json:"metadata"`
	Status         string            `json:"status"` // "open", "complete", "expired"
}

// StripeWebhookEvent represents inbound Stripe webhook envelope.
type StripeWebhookEvent struct {
	ID         string          `json:"id"`
	Type       string          `json:"type"` // e.g. "checkout.session.completed", "payment_intent.succeeded"
	Created    int64           `json:"created"`
	Data       StripeEventData `json:"data"`
}

// StripeEventData represents object container in Stripe event.
type StripeEventData struct {
	Object json.RawMessage `json:"object"`
}

// VerifyStripeSignature validates the Stripe-Signature HMAC-SHA256 header.
// Header format: t=timestamp,v1=signature
func VerifyStripeSignature(payload []byte, signatureHeader, secret string) bool {
	if signatureHeader == "" || secret == "" {
		return false
	}

	parts := strings.Split(signatureHeader, ",")
	var timestamp string
	var signature string

	for _, part := range parts {
		kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
		if len(kv) == 2 {
			if kv[0] == "t" {
				timestamp = kv[1]
			} else if kv[0] == "v1" {
				signature = kv[1]
			}
		}
	}

	if timestamp == "" || signature == "" {
		return false
	}

	// Verify timestamp is within 5 minutes
	tsInt, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return false
	}
	diff := time.Now().Unix() - tsInt
	if diff < -60 || diff > 300 {
		return false
	}

	// Compute HMAC-SHA256 over timestamp + "." + payload
	signedPayload := fmt.Sprintf("%s.%s", timestamp, string(payload))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signedPayload))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expectedSignature), []byte(signature))
}

// GenerateMockStripeSignature produces a valid Stripe-Signature header for testing.
func GenerateMockStripeSignature(payload []byte, secret string, t time.Time) string {
	ts := strconv.FormatInt(t.Unix(), 10)
	signedPayload := fmt.Sprintf("%s.%s", ts, string(payload))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signedPayload))
	sig := hex.EncodeToString(mac.Sum(nil))

	return fmt.Sprintf("t=%s,v1=%s", ts, sig)
}
