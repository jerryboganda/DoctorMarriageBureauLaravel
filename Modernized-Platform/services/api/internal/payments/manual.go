package payments

import (
	"errors"
	"strings"
)

var (
	ErrInvalidPaymentMethod = errors.New("invalid payment method; supported: jazzcash, easypaisa, bank_transfer")
	ErrTransactionIDMissing = errors.New("transaction ID / receipt reference is required")
)

// SupportedManualMethods defines accepted local Pakistani payment methods.
var SupportedManualMethods = map[string]bool{
	"jazzcash":      true,
	"easypaisa":     true,
	"bank_transfer": true,
}

// IsValidManualMethod checks if method is supported in Pakistan.
func IsValidManualMethod(method string) bool {
	return SupportedManualMethods[strings.ToLower(strings.TrimSpace(method))]
}

// PakistaniBankDetails contains official collection bank account details.
type PakistaniBankDetails struct {
	BankName      string `json:"bank_name"`
	AccountTitle  string `json:"account_title"`
	AccountNumber string `json:"account_number"`
	IBAN          string `json:"iban"`
	BranchCode    string `json:"branch_code"`
	JazzCashTill  string `json:"jazzcash_till"`
	EasyPaisaTill string `json:"easypaisa_till"`
}

// GetDefaultCollectionAccounts returns official deposit details.
func GetDefaultCollectionAccounts() PakistaniBankDetails {
	return PakistaniBankDetails{
		BankName:      "Meezan Bank Islamic",
		AccountTitle:  "Doctor Marriage Bureau (Pvt) Ltd",
		AccountNumber: "0102030405060708",
		IBAN:          "PK36MEZN0001020304050607",
		BranchCode:    "0102",
		JazzCashTill:  "03001234567",
		EasyPaisaTill: "03451234567",
	}
}
