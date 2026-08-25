package payments

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/doctormarriagebureau/api/internal/models"
	"github.com/doctormarriagebureau/api/internal/notifications"
	"github.com/doctormarriagebureau/api/platform/postgres"
)

var (
	ErrPackageNotFound     = errors.New("package not found")
	ErrCouponNotFound      = errors.New("invalid or expired coupon code")
	ErrCouponMaxUsed       = errors.New("coupon usage limit exceeded")
	ErrPaymentNotFound     = errors.New("payment record not found")
	ErrInsufficientBalance = errors.New("insufficient wallet balance")
	ErrInvalidAmount       = errors.New("amount must be greater than zero")
)

// CouponValidationResult provides detailed price breakdown after discount.
type CouponValidationResult struct {
	CouponCode      string  `json:"coupon_code"`
	OriginalPrice   float64 `json:"original_price"`
	DiscountPercent float64 `json:"discount_percent"`
	DiscountAmount  float64 `json:"discount_amount"`
	FinalPrice      float64 `json:"final_price"`
	IsValid         bool    `json:"is_valid"`
	Message         string  `json:"message"`
}

// Service defines payment and subscription management.
type Service interface {
	ListPackages(ctx context.Context) ([]models.Package, error)
	GetPackage(ctx context.Context, id int64) (*models.Package, error)
	ValidateCoupon(ctx context.Context, code string, packageID int64) (*CouponValidationResult, error)
	InitiateStripeCheckout(ctx context.Context, userID, packageID int64, couponCode, successURL, cancelURL string) (*StripeSession, error)
	ProcessStripeWebhook(ctx context.Context, payload []byte, signatureHeader string) error
	SubmitManualPayment(ctx context.Context, userID, packageID int64, method, transactionID, proofKey, couponCode string) (*models.PackagePayment, error)
	ReviewManualPayment(ctx context.Context, paymentID int64, isApproved bool, adminNotes string) (*models.PackagePayment, error)
	ListPendingManualPayments(ctx context.Context) ([]models.PackagePayment, error)
	ListMyPayments(ctx context.Context, userID int64) ([]models.PackagePayment, error)
	GetCurrentSubscription(ctx context.Context, userID int64) (map[string]interface{}, error)
	GetWallet(ctx context.Context, userID int64) (*models.Wallet, error)
	TopUpWallet(ctx context.Context, userID int64, amount float64, method, refID string) (*models.Wallet, error)
	DeductWallet(ctx context.Context, userID int64, amount float64, details string) (*models.Wallet, error)
}

type paymentService struct {
	pg            *postgres.Client
	notifier      *notifications.Service
	stripeSecret  string
	webhookSecret string
}

// NewPaymentService initializes the Postgres-backed payment service.
func NewPaymentService(pg *postgres.Client, notifier *notifications.Service, stripeSecret, webhookSecret string) Service {
	if webhookSecret == "" {
		webhookSecret = "whsec_test_secret_doctor_marriage_bureau_12345"
	}
	return &paymentService{
		pg:            pg,
		notifier:      notifier,
		stripeSecret:  stripeSecret,
		webhookSecret: webhookSecret,
	}
}

const packageCols = `
	id, name, COALESCE(price, 0), COALESCE(validity, 30),
	COALESCE(express_interest, 0), COALESCE(contact, 0), COALESCE(photo_gallery, 0),
	COALESCE(profile_image_view, 0), COALESCE(gallery_image_view, 0), COALESCE(profile_viewers_view, 0),
	COALESCE(auto_profile_match, false), COALESCE(image, ''), COALESCE(active, true), created_at
`

func scanPackage(row interface{ Scan(...interface{}) error }) (*models.Package, error) {
	var p models.Package
	err := row.Scan(
		&p.ID, &p.Name, &p.Price, &p.ValidityDays,
		&p.ProposalLimit, &p.ContactViewLimit, &p.PhotoGalleryLimit,
		&p.ProfileImageViewLimit, &p.GalleryImageViewLimit, &p.ProfileViewersViewLimit,
		&p.AutoProfileMatch, &p.Image, &p.IsActive, &p.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// ListPackages returns active packages ordered by price.
func (s *paymentService) ListPackages(ctx context.Context) ([]models.Package, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT `+packageCols+` FROM packages
		WHERE active = true AND status = true AND deleted_at IS NULL
		ORDER BY price ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.Package{}
	for rows.Next() {
		p, err := scanPackage(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

// GetPackage fetches a single active package.
func (s *paymentService) GetPackage(ctx context.Context, id int64) (*models.Package, error) {
	row := s.pg.Pool.QueryRow(ctx, `
		SELECT `+packageCols+` FROM packages WHERE id = $1 AND deleted_at IS NULL
	`, id)
	p, err := scanPackage(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPackageNotFound
		}
		return nil, err
	}
	return p, nil
}

// couponInfo mirrors a coupons row.
type couponInfo struct {
	ID             int64
	Code           string
	DiscountType   string
	DiscountValue  float64
	MinAmount      *float64
	MaxRedemptions *int
	UsedCount      int
}

func (s *paymentService) findCoupon(ctx context.Context, code string) (*couponInfo, error) {
	var c couponInfo
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT id, code, discount_type, COALESCE(discount_value, 0), min_amount, max_redemptions, COALESCE(used_count, 0)
		FROM coupons
		WHERE UPPER(code) = UPPER($1)
		  AND is_active = true
		  AND (starts_at IS NULL OR starts_at <= NOW())
		  AND (expires_at IS NULL OR expires_at > NOW())
	`, code).Scan(&c.ID, &c.Code, &c.DiscountType, &c.DiscountValue, &c.MinAmount, &c.MaxRedemptions, &c.UsedCount)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCouponNotFound
		}
		return nil, err
	}
	if c.MaxRedemptions != nil && c.UsedCount >= *c.MaxRedemptions {
		return nil, ErrCouponMaxUsed
	}
	return &c, nil
}

// applyCoupon computes final price for a package with an optional coupon.
func (s *paymentService) applyCoupon(ctx context.Context, pkg *models.Package, couponCode string) (float64, float64, *couponInfo, error) {
	if strings.TrimSpace(couponCode) == "" {
		return pkg.Price, 0, nil, nil
	}
	c, err := s.findCoupon(ctx, couponCode)
	if err != nil {
		return 0, 0, nil, err
	}
	if c.MinAmount != nil && pkg.Price < *c.MinAmount {
		return 0, 0, nil, fmt.Errorf("coupon requires a minimum amount of %.0f", *c.MinAmount)
	}
	var discount float64
	if c.DiscountType == "percent" || c.DiscountType == "percentage" {
		discount = pkg.Price * c.DiscountValue / 100.0
	} else {
		discount = c.DiscountValue
	}
	discount = math.Min(discount, pkg.Price)
	final := math.Round((pkg.Price-discount)*100) / 100
	return final, discount, c, nil
}

// ValidateCoupon returns price breakdown for a coupon + package pair.
func (s *paymentService) ValidateCoupon(ctx context.Context, code string, packageID int64) (*CouponValidationResult, error) {
	pkg, err := s.GetPackage(ctx, packageID)
	if err != nil {
		return nil, err
	}
	final, discount, c, err := s.applyCoupon(ctx, pkg, code)
	if err != nil {
		return nil, err
	}
	percent := 0.0
	if pkg.Price > 0 {
		percent = math.Round(discount/pkg.Price*10000) / 100
	}
	return &CouponValidationResult{
		CouponCode:      c.Code,
		OriginalPrice:   pkg.Price,
		DiscountPercent: percent,
		DiscountAmount:  discount,
		FinalPrice:      final,
		IsValid:         true,
		Message:         "Coupon applied successfully",
	}, nil
}

// InitiateStripeCheckout creates a pending payment and returns a checkout session.
func (s *paymentService) InitiateStripeCheckout(ctx context.Context, userID, packageID int64, couponCode, successURL, cancelURL string) (*StripeSession, error) {
	pkg, err := s.GetPackage(ctx, packageID)
	if err != nil {
		return nil, err
	}
	final, discount, coupon, err := s.applyCoupon(ctx, pkg, couponCode)
	if err != nil {
		return nil, err
	}

	paymentCode := "pay_" + uuid.NewString()
	var couponID *int64
	var couponCodeVal *string
	if coupon != nil {
		couponID = &coupon.ID
		couponCodeVal = &coupon.Code
	}

	_, err = s.pg.Pool.Exec(ctx, `
		INSERT INTO package_payments (user_id, package_id, amount, original_amount, discount_amount, coupon_id, coupon_code, payment_method, payment_status, payment_code, offline_payment, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'stripe', 'pending', $8, 0, NOW(), NOW())
	`, userID, packageID, final, pkg.Price, discount, couponID, couponCodeVal, paymentCode)
	if err != nil {
		return nil, err
	}

	sessionID := "cs_" + strings.ReplaceAll(uuid.NewString(), "-", "")
	return &StripeSession{
		ID:          sessionID,
		URL:         fmt.Sprintf("https://checkout.stripe.com/c/pay/%s", sessionID),
		AmountTotal: int64(final * 100),
		Currency:    "pkr",
		ClientRefID: paymentCode,
		Metadata: map[string]string{
			"payment_code": paymentCode,
			"package_id":   fmt.Sprintf("%d", packageID),
			"user_id":      fmt.Sprintf("%d", userID),
		},
		Status: "open",
	}, nil
}

// ProcessStripeWebhook verifies and applies checkout.session.completed events.
func (s *paymentService) ProcessStripeWebhook(ctx context.Context, payload []byte, signatureHeader string) error {
	if !VerifyStripeSignature(payload, signatureHeader, s.webhookSecret) {
		return ErrInvalidStripeSignature
	}

	var event StripeWebhookEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return fmt.Errorf("invalid webhook payload: %w", err)
	}

	if event.Type != "checkout.session.completed" && event.Type != "payment_intent.succeeded" {
		return nil // Acknowledge unhandled event types.
	}

	var sessionObj struct {
		ClientReferenceID string            `json:"client_reference_id"`
		Metadata          map[string]string `json:"metadata"`
	}
	if err := json.Unmarshal(event.Data.Object, &sessionObj); err != nil {
		return fmt.Errorf("invalid session object: %w", err)
	}

	paymentCode := sessionObj.ClientReferenceID
	if paymentCode == "" && sessionObj.Metadata != nil {
		paymentCode = sessionObj.Metadata["payment_code"]
	}
	if paymentCode == "" {
		return errors.New("payment code missing in webhook")
	}

	var paymentID, userID, packageID int64
	var status string
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT id, user_id, package_id, payment_status FROM package_payments WHERE payment_code = $1
	`, paymentCode).Scan(&paymentID, &userID, &packageID, &status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrPaymentNotFound
		}
		return err
	}
	if status == "completed" {
		return nil // Idempotent.
	}

	return s.completePayment(ctx, paymentID, userID, packageID)
}

// completePayment marks a payment complete and provisions the package.
func (s *paymentService) completePayment(ctx context.Context, paymentID, userID, packageID int64) error {
	pkg, err := s.GetPackage(ctx, packageID)
	if err != nil {
		return err
	}

	err = s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `
			UPDATE package_payments SET payment_status = 'completed', updated_at = NOW() WHERE id = $1
		`, paymentID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			UPDATE coupons SET used_count = used_count + 1, updated_at = NOW()
			WHERE id = (SELECT coupon_id FROM package_payments WHERE id = $1) AND (SELECT coupon_id FROM package_payments WHERE id = $1) IS NOT NULL
		`, paymentID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			UPDATE members SET
				current_package_id = $1,
				package_validity = CURRENT_DATE + ($2 || ' days')::interval,
				remaining_interest = $3,
				remaining_contact_view = $4,
				remaining_photo_gallery = $5,
				remaining_profile_image_view = $6,
				remaining_gallery_image_view = $7,
				remaining_profile_viewer_view = $8,
				updated_at = NOW()
			WHERE user_id = $9
		`, packageID, pkg.ValidityDays, pkg.ProposalLimit, pkg.ContactViewLimit,
			pkg.PhotoGalleryLimit, pkg.ProfileImageViewLimit, pkg.GalleryImageViewLimit,
			pkg.ProfileViewersViewLimit, userID); err != nil {
			return err
		}
		membership := 2
		if pkg.Price <= 0 {
			membership = 1
		}
		if _, err := tx.Exec(ctx, `
			UPDATE users SET membership = $1, updated_at = NOW() WHERE id = $2
		`, membership, userID); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}

	s.notifier.Push(ctx, userID, "package_activated", "Package activated",
		fmt.Sprintf("Your %s package is now active. Enjoy your premium benefits!", pkg.Name),
		map[string]interface{}{"package_id": packageID, "action_url": "/packages/"})
	return nil
}

const paymentCols = `
	pp.id, pp.user_id, pp.package_id, COALESCE(pk.name, ''),
	COALESCE(pp.original_amount, pp.amount), COALESCE(pp.discount_amount, 0), pp.amount,
	COALESCE(pp.coupon_code, ''), pp.payment_method, pp.payment_status,
	COALESCE(pp.custom_payment_transaction_id, COALESCE(pp.payment_code, '')),
	COALESCE(pp.custom_payment_proof, ''), COALESCE(pp.custom_payment_details, ''),
	pp.created_at, pp.updated_at
`

func scanPayment(row interface{ Scan(...interface{}) error }) (*models.PackagePayment, error) {
	var p models.PackagePayment
	err := row.Scan(
		&p.ID, &p.UserID, &p.PackageID, &p.PackageName,
		&p.Amount, &p.Discount, &p.FinalAmount,
		&p.CouponCode, &p.PaymentMethod, &p.PaymentStatus,
		&p.TransactionID, &p.PaymentProof, &p.AdminNotes,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// SubmitManualPayment records a JazzCash/EasyPaisa/bank transfer receipt for review.
func (s *paymentService) SubmitManualPayment(ctx context.Context, userID, packageID int64, method, transactionID, proofKey, couponCode string) (*models.PackagePayment, error) {
	if !IsValidManualMethod(method) {
		return nil, ErrInvalidPaymentMethod
	}
	if strings.TrimSpace(transactionID) == "" {
		return nil, ErrTransactionIDMissing
	}

	pkg, err := s.GetPackage(ctx, packageID)
	if err != nil {
		return nil, err
	}
	final, discount, coupon, err := s.applyCoupon(ctx, pkg, couponCode)
	if err != nil {
		return nil, err
	}

	var couponID *int64
	var couponCodeVal *string
	if coupon != nil {
		couponID = &coupon.ID
		couponCodeVal = &coupon.Code
	}

	var paymentID int64
	err = s.pg.Pool.QueryRow(ctx, `
		INSERT INTO package_payments (user_id, package_id, amount, original_amount, discount_amount, coupon_id, coupon_code, payment_method, payment_status, payment_code, offline_payment, custom_payment_name, custom_payment_transaction_id, custom_payment_proof, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'under_review', $9, 1, $8, $10, NULLIF($11, ''), NOW(), NOW())
		RETURNING id
	`, userID, packageID, final, pkg.Price, discount, couponID, couponCodeVal,
		strings.ToLower(method), "pay_"+uuid.NewString(), transactionID, proofKey).Scan(&paymentID)
	if err != nil {
		return nil, err
	}

	row := s.pg.Pool.QueryRow(ctx, `
		SELECT `+paymentCols+` FROM package_payments pp
		LEFT JOIN packages pk ON pk.id = pp.package_id
		WHERE pp.id = $1
	`, paymentID)
	return scanPayment(row)
}

// ReviewManualPayment approves or rejects a manual payment (admin operation).
func (s *paymentService) ReviewManualPayment(ctx context.Context, paymentID int64, isApproved bool, adminNotes string) (*models.PackagePayment, error) {
	var userID, packageID int64
	var status string
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT user_id, package_id, payment_status FROM package_payments WHERE id = $1
	`, paymentID).Scan(&userID, &packageID, &status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPaymentNotFound
		}
		return nil, err
	}

	if isApproved {
		if err := s.completePayment(ctx, paymentID, userID, packageID); err != nil {
			return nil, err
		}
	} else {
		if _, err := s.pg.Pool.Exec(ctx, `
			UPDATE package_payments SET payment_status = 'rejected', custom_payment_details = NULLIF($1, ''), updated_at = NOW()
			WHERE id = $2
		`, adminNotes, paymentID); err != nil {
			return nil, err
		}
		s.notifier.Push(ctx, userID, "payment_rejected", "Payment rejected",
			"Your manual payment could not be verified. Please contact support.",
			map[string]interface{}{"payment_id": paymentID, "action_url": "/packages/"})
	}

	row := s.pg.Pool.QueryRow(ctx, `
		SELECT `+paymentCols+` FROM package_payments pp
		LEFT JOIN packages pk ON pk.id = pp.package_id
		WHERE pp.id = $1
	`, paymentID)
	return scanPayment(row)
}

// ListPendingManualPayments returns payments awaiting admin review.
func (s *paymentService) ListPendingManualPayments(ctx context.Context) ([]models.PackagePayment, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT `+paymentCols+` FROM package_payments pp
		LEFT JOIN packages pk ON pk.id = pp.package_id
		WHERE pp.payment_status = 'under_review' AND pp.offline_payment = 1
		ORDER BY pp.created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.PackagePayment{}
	for rows.Next() {
		p, err := scanPayment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

// ListMyPayments returns the caller's payment history.
func (s *paymentService) ListMyPayments(ctx context.Context, userID int64) ([]models.PackagePayment, error) {
	rows, err := s.pg.Pool.Query(ctx, `
		SELECT `+paymentCols+` FROM package_payments pp
		LEFT JOIN packages pk ON pk.id = pp.package_id
		WHERE pp.user_id = $1
		ORDER BY pp.created_at DESC LIMIT 100
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.PackagePayment{}
	for rows.Next() {
		p, err := scanPayment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

// GetCurrentSubscription reports the caller's active package and quotas.
func (s *paymentService) GetCurrentSubscription(ctx context.Context, userID int64) (map[string]interface{}, error) {
	var (
		packageID       *int64
		packageValidity *time.Time
		remInterest     *int
		remContact      *int
		remPhotoGallery *int
	)
	err := s.pg.Pool.QueryRow(ctx, `
		SELECT current_package_id, package_validity, remaining_interest, remaining_contact_view, remaining_photo_gallery
		FROM members WHERE user_id = $1
	`, userID).Scan(&packageID, &packageValidity, &remInterest, &remContact, &remPhotoGallery)
	if err != nil {
		return nil, err
	}

	result := map[string]interface{}{
		"package":                  nil,
		"package_validity":         packageValidity,
		"remaining_interest":       remInterest,
		"remaining_contact_view":   remContact,
		"remaining_photo_gallery":  remPhotoGallery,
		"is_active":                false,
	}
	if packageID != nil {
		if pkg, perr := s.GetPackage(ctx, *packageID); perr == nil {
			result["package"] = pkg
			result["is_active"] = packageValidity == nil || packageValidity.After(time.Now())
		}
	}
	return result, nil
}

// GetWallet returns balance plus recent wallet activity.
func (s *paymentService) GetWallet(ctx context.Context, userID int64) (*models.Wallet, error) {
	w := &models.Wallet{UserID: userID, UpdatedAt: time.Now()}
	err := s.pg.Pool.QueryRow(ctx, `SELECT COALESCE(balance, 0) FROM users WHERE id = $1`, userID).Scan(&w.Balance)
	if err != nil {
		return nil, err
	}

	rows, err := s.pg.Pool.Query(ctx, `
		SELECT id, amount, COALESCE(payment_method, ''), COALESCE(transaction_id, ''), approval, created_at
		FROM wallets WHERE user_id = $1 ORDER BY id DESC LIMIT 50
	`, userID)
	if err != nil {
		return w, nil
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var amount float64
		var method, txID string
		var approval int
		var createdAt time.Time
		if rows.Scan(&id, &amount, &method, &txID, &approval, &createdAt) == nil {
			status := "pending approval"
			if approval == 1 {
				status = "approved"
			} else if approval == 2 {
				status = "rejected"
			}
			w.History = append(w.History, models.WalletTransaction{
				ID:        id,
				UserID:    userID,
				Type:      "credit",
				Amount:    amount,
				Details:   strings.TrimSpace(fmt.Sprintf("%s %s (%s)", method, txID, status)),
				CreatedAt: createdAt,
			})
		}
	}

	// Include wallet debits recorded in transactions.
	dRows, err := s.pg.Pool.Query(ctx, `
		SELECT id, COALESCE(additional_content, '{}'), created_at
		FROM transactions WHERE user_id = $1 AND gateway = 'wallet' ORDER BY id DESC LIMIT 50
	`, userID)
	if err == nil {
		defer dRows.Close()
		for dRows.Next() {
			var id int64
			var content string
			var createdAt time.Time
			if dRows.Scan(&id, &content, &createdAt) == nil {
				var meta struct {
					Amount  float64 `json:"amount"`
					Details string  `json:"details"`
				}
				_ = json.Unmarshal([]byte(content), &meta)
				w.History = append(w.History, models.WalletTransaction{
					ID:        id,
					UserID:    userID,
					Type:      "debit",
					Amount:    meta.Amount,
					Details:   meta.Details,
					CreatedAt: createdAt,
				})
			}
		}
	}

	return w, nil
}

// TopUpWallet records a top-up request pending admin approval.
func (s *paymentService) TopUpWallet(ctx context.Context, userID int64, amount float64, method, refID string) (*models.Wallet, error) {
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}
	_, err := s.pg.Pool.Exec(ctx, `
		INSERT INTO wallets (user_id, amount, payment_method, transaction_id, approval, offline_payment, created_at, updated_at)
		VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), 0, 1, NOW(), NOW())
	`, userID, amount, method, refID)
	if err != nil {
		return nil, err
	}
	s.notifier.Push(ctx, userID, "wallet_topup_submitted", "Top-up received",
		fmt.Sprintf("Your top-up request of PKR %.0f is pending verification.", amount),
		map[string]interface{}{"action_url": "/wallet/"})
	return s.GetWallet(ctx, userID)
}

// DeductWallet spends wallet balance atomically.
func (s *paymentService) DeductWallet(ctx context.Context, userID int64, amount float64, details string) (*models.Wallet, error) {
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}
	err := s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		var balance float64
		if err := tx.QueryRow(ctx, `SELECT COALESCE(balance, 0) FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&balance); err != nil {
			return err
		}
		if balance < amount {
			return ErrInsufficientBalance
		}
		if _, err := tx.Exec(ctx, `UPDATE users SET balance = balance - $1, updated_at = NOW() WHERE id = $2`, amount, userID); err != nil {
			return err
		}
		meta, _ := json.Marshal(map[string]interface{}{"amount": amount, "details": details})
		if _, err := tx.Exec(ctx, `
			INSERT INTO transactions (user_id, gateway, payment_type, additional_content, created_at, updated_at)
			VALUES ($1, 'wallet', 'debit', $2, NOW(), NOW())
		`, userID, string(meta)); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetWallet(ctx, userID)
}
