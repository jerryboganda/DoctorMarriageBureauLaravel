package payments

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/doctormarriagebureau/api/pkg/middleware"
	"github.com/doctormarriagebureau/api/pkg/response"
)

// Handler handles Payment and Subscription HTTP requests.
type Handler struct {
	service Service
}

// NewHandler creates a new Payment handler.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// Routes sets up Chi routing for Payments domain.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/packages", h.HandleListPackages)
	r.Post("/coupons/validate", h.HandleValidateCoupon)
	r.Post("/checkout/stripe", h.HandleStripeCheckout)
	r.Post("/manual/submit", h.HandleManualPayment)
	r.Post("/manual/{id}/review", h.HandleReviewManualPayment)
	r.Get("/manual/pending", h.HandleListPendingManual)
	r.Get("/manual/accounts", h.HandleGetCollectionAccounts)
	r.Get("/history", h.HandleListMyPayments)
	r.Get("/subscription", h.HandleGetSubscription)
	r.Get("/wallet", h.HandleGetWallet)
	r.Post("/wallet/topup", h.HandleTopUpWallet)
	r.Post("/wallet/deduct", h.HandleDeductWallet)

	return r
}

// HandleGetCollectionAccounts handles GET /api/v1/payments/manual/accounts
func (h *Handler) HandleGetCollectionAccounts(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, GetDefaultCollectionAccounts(), "Collection accounts retrieved")
}

// HandleListMyPayments handles GET /api/v1/payments/history
func (h *Handler) HandleListMyPayments(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	list, err := h.service.ListMyPayments(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "HISTORY_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, list, "Payment history retrieved")
}

// HandleGetSubscription handles GET /api/v1/payments/subscription
func (h *Handler) HandleGetSubscription(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	sub, err := h.service.GetCurrentSubscription(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "SUBSCRIPTION_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, sub, "Subscription retrieved")
}

// HandleListPackages handles GET /api/v1/packages
func (h *Handler) HandleListPackages(w http.ResponseWriter, r *http.Request) {
	packages, err := h.service.ListPackages(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "PACKAGES_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, packages, "Packages retrieved successfully")
}

// HandleValidateCoupon handles POST /api/v1/coupons/validate
func (h *Handler) HandleValidateCoupon(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code      string `json:"code"`
		PackageID int64  `json:"package_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Code == "" || req.PackageID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "code and package_id are required", nil)
		return
	}

	result, err := h.service.ValidateCoupon(r.Context(), req.Code, req.PackageID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "COUPON_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, result, "Coupon is valid")
}

// HandleStripeCheckout handles POST /api/v1/payments/checkout/stripe
func (h *Handler) HandleStripeCheckout(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		PackageID  int64  `json:"package_id"`
		CouponCode string `json:"coupon_code"`
		SuccessURL string `json:"success_url"`
		CancelURL  string `json:"cancel_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PackageID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Valid package_id required", nil)
		return
	}

	session, err := h.service.InitiateStripeCheckout(r.Context(), userID, req.PackageID, req.CouponCode, req.SuccessURL, req.CancelURL)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "CHECKOUT_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, session, "Stripe Checkout session created")
}

// HandleStripeWebhook handles POST /api/v1/payments/webhooks/stripe
func (h *Handler) HandleStripeWebhook(w http.ResponseWriter, r *http.Request) {
	signature := r.Header.Get("Stripe-Signature")
	if signature == "" {
		response.Error(w, http.StatusBadRequest, "MISSING_SIGNATURE", "Stripe-Signature header missing", nil)
		return
	}

	payload, err := io.ReadAll(r.Body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "READ_ERROR", "Failed to read request body", nil)
		return
	}

	if err := h.service.ProcessStripeWebhook(r.Context(), payload, signature); err != nil {
		response.Error(w, http.StatusBadRequest, "WEBHOOK_VERIFICATION_FAILED", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"received": true}, "Webhook processed successfully")
}

// HandleManualPayment handles POST /api/v1/payments/manual/submit
func (h *Handler) HandleManualPayment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		PackageID     int64  `json:"package_id"`
		Method        string `json:"method"` // "jazzcash", "easypaisa", "bank_transfer"
		TransactionID string `json:"transaction_id"`
		ProofKey      string `json:"proof_key"`
		CouponCode    string `json:"coupon_code"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	payment, err := h.service.SubmitManualPayment(r.Context(), userID, req.PackageID, req.Method, req.TransactionID, req.ProofKey, req.CouponCode)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "MANUAL_PAYMENT_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusCreated, payment, "Manual receipt submitted for admin review")
}

// HandleReviewManualPayment handles POST /api/v1/payments/manual/{id}/review
func (h *Handler) HandleReviewManualPayment(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	paymentID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || paymentID <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid payment ID", nil)
		return
	}

	var req struct {
		IsApproved bool   `json:"is_approved"`
		AdminNotes string `json:"admin_notes"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Invalid JSON payload", err.Error())
		return
	}

	payment, err := h.service.ReviewManualPayment(r.Context(), paymentID, req.IsApproved, req.AdminNotes)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "REVIEW_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, payment, "Payment review recorded")
}

// HandleListPendingManual handles GET /api/v1/payments/manual/pending
func (h *Handler) HandleListPendingManual(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.ListPendingManualPayments(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "LIST_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, list, "Pending manual payments retrieved")
}

// HandleGetWallet handles GET /api/v1/wallet
func (h *Handler) HandleGetWallet(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	wallet, err := h.service.GetWallet(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "WALLET_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, wallet, "Wallet retrieved")
}

// HandleTopUpWallet handles POST /api/v1/wallet/topup
func (h *Handler) HandleTopUpWallet(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		Amount float64 `json:"amount"`
		Method string  `json:"method"`
		RefID  string  `json:"ref_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Valid positive amount required", nil)
		return
	}

	wallet, err := h.service.TopUpWallet(r.Context(), userID, req.Amount, req.Method, req.RefID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "TOPUP_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, wallet, "Wallet top-up successful")
}

// HandleDeductWallet handles POST /api/v1/wallet/deduct
func (h *Handler) HandleDeductWallet(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
		return
	}

	var req struct {
		Amount  float64 `json:"amount"`
		Details string  `json:"details"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Valid positive amount required", nil)
		return
	}

	wallet, err := h.service.DeductWallet(r.Context(), userID, req.Amount, req.Details)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "DEDUCT_ERROR", err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, wallet, "Wallet deduction successful")
}
