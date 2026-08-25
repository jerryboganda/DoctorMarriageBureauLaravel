package models

import (
	"time"
)

// User represents the root user entity.
type User struct {
	ID              int64      `json:"id"`
	Email           string     `json:"email"`
	FirstName       string     `json:"first_name"`
	LastName        string     `json:"last_name"`
	UserType        string     `json:"user_type"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	Status          bool       `json:"status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// Member represents the extended matrimonial profile.
type Member struct {
	ID                int64      `json:"id"`
	UserID            int64      `json:"user_id"`
	Gender            string     `json:"gender"`
	Birthday          *time.Time `json:"birthday"`
	Age               int        `json:"age"`
	MaritalStatus     string     `json:"marital_status"`
	IsApproved        bool       `json:"is_approved"`
	PackageID         *int64     `json:"package_id"`
	RemainingInterest int        `json:"remaining_interest"`
	PackageExpiresAt  *time.Time `json:"package_expires_at"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// PhysicalAttributes represents physical details.
type PhysicalAttributes struct {
	ID         int64   `json:"id"`
	UserID     int64   `json:"user_id"`
	Height     float64 `json:"height"` // in feet or cm
	Weight     int     `json:"weight"`
	EyeColor   string  `json:"eye_color"`
	Complexion string  `json:"complexion"`
}

// SpiritualBackground represents religious and caste/biradari details.
type SpiritualBackground struct {
	ID         int64  `json:"id"`
	UserID     int64  `json:"user_id"`
	ReligionID int64  `json:"religion_id"`
	Religion   string `json:"religion"`
	SectID     int64  `json:"sect_id"`
	Sect       string `json:"sect"`
	CasteID    int64  `json:"caste_id"`
	Caste      string `json:"caste"`
	SubCaste   string `json:"sub_caste"`
	Ethnicity  string `json:"ethnicity"`
}

// Recidency represents location and citizenship details.
type Recidency struct {
	ID                   int64  `json:"id"`
	UserID               int64  `json:"user_id"`
	CityID               int64  `json:"city_id"`
	CityName             string `json:"city_name"`
	StateID              int64  `json:"state_id"`
	StateName            string `json:"state_name"`
	CountryID            int64  `json:"country_id"`
	CountryName          string `json:"country_name"`
	CitizenshipCountryID int64  `json:"citizenship_country_id"`
}

// EducationCareer represents doctor medical qualification and career.
type EducationCareer struct {
	ID          int64  `json:"id"`
	UserID      int64  `json:"user_id"`
	Degree      string `json:"degree"`     // MBBS, FCPS, BDS, MD, etc.
	Speciality  string `json:"speciality"` // Cardiology, Pediatrics, etc.
	Institution string `json:"institution"`
	Occupation  string `json:"occupation"`
	IncomeLevel string `json:"income_level"`
}

// ImportanceLevel defines importance weights in matching preferences.
type ImportanceLevel string

const (
	ImportanceDealbreaker ImportanceLevel = "dealbreaker"
	ImportanceMustHave    ImportanceLevel = "must_have"
	ImportanceNiceToHave  ImportanceLevel = "nice_to_have"
	ImportanceFlexible    ImportanceLevel = "flexible"
)

// PreferenceWeights represents user-configured weights for the 6 factors.
type PreferenceWeights struct {
	AgeWeight           ImportanceLevel `json:"age_weight"`
	ReligionWeight      ImportanceLevel `json:"religion_weight"`
	LocationWeight      ImportanceLevel `json:"location_weight"`
	MaritalStatusWeight ImportanceLevel `json:"marital_status_weight"`
	HeightWeight        ImportanceLevel `json:"height_weight"`
	LanguageCasteWeight ImportanceLevel `json:"language_caste_weight"`
}

// PartnerExpectations represents ideal partner preferences.
type PartnerExpectations struct {
	UserID                int64             `json:"user_id"`
	MinAge                int               `json:"min_age"`
	MaxAge                int               `json:"max_age"`
	MinHeight             float64           `json:"min_height"`
	MaxHeight             float64           `json:"max_height"`
	MaritalStatus         []string          `json:"marital_status"`
	ReligionID            int64             `json:"religion_id"`
	SectIDs               []int64           `json:"sect_ids"`
	CasteIDs              []int64           `json:"caste_ids"`
	CityIDs               []int64           `json:"city_ids"`
	CountryIDs            []int64           `json:"country_ids"`
	PreferredSpecialities []string          `json:"preferred_specialities"`
	Weights               PreferenceWeights `json:"weights"`
}

// TravelMode represents temporary travel location override.
type TravelMode struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	CityID    int64     `json:"city_id"`
	CityName  string    `json:"city_name"`
	CountryID int64     `json:"country_id"`
	ExpiresAt time.Time `json:"expires_at"`
	IsActive  bool      `json:"is_active"`
}

// FieldVisibilitySettings represents privacy flags.
type FieldVisibilitySettings struct {
	UserID        int64  `json:"user_id"`
	ProfilePhoto  string `json:"profile_photo"` // "public", "members_only", "on_request", "blurred"
	Phone         string `json:"phone"`
	FamilyDetails string `json:"family_details"`
	IsAnonymous   bool   `json:"is_anonymous"` // Incognito mode
}

// DoctorCard represents public/feed candidate view.
type DoctorCard struct {
	UserID             int64              `json:"user_id"`
	FirstName          string             `json:"first_name"`
	LastName           string             `json:"last_name"`
	Age                int                `json:"age"`
	Gender             string             `json:"gender"`
	Degree             string             `json:"degree"`
	Speciality         string             `json:"speciality"`
	CityName           string             `json:"city_name"`
	CountryName        string             `json:"country_name"`
	Caste              string             `json:"caste"`
	Religion           string             `json:"religion"`
	MaritalStatus      string             `json:"marital_status"`
	Height             float64            `json:"height"`
	ProfilePhotoURL    string             `json:"profile_photo_url"`
	IsPhotoBlurred     bool               `json:"is_photo_blurred"`
	IsVerified         bool               `json:"is_verified"`
	CompatibilityScore float64            `json:"compatibility_score,omitempty"`
	ScoreBreakdown     *ScoreBreakdownDTO `json:"score_breakdown,omitempty"`
	IsTravelMode       bool               `json:"is_travel_mode,omitempty"`
	TravelCity         string             `json:"travel_city,omitempty"`
}

// ScoreBreakdownDTO provides granular factor scores.
type ScoreBreakdownDTO struct {
	AgeScore           float64 `json:"age_score"`
	ReligionScore      float64 `json:"religion_score"`
	LocationScore      float64 `json:"location_score"`
	MaritalStatusScore float64 `json:"marital_status_score"`
	HeightScore        float64 `json:"height_score"`
	LanguageCasteScore float64 `json:"language_caste_score"`
	TotalScore         float64 `json:"total_score"`
	DealbreakerViolated bool   `json:"dealbreaker_violated"`
}

// Proposal status constants
type ProposalStatus string

const (
	ProposalStatusPending   ProposalStatus = "pending"
	ProposalStatusAccepted  ProposalStatus = "accepted"
	ProposalStatusRejected  ProposalStatus = "rejected"
	ProposalStatusWithdrawn ProposalStatus = "withdrawn"
)

// ExpressInterest represents a proposal/interest.
type ExpressInterest struct {
	ID                int64          `json:"id"`
	SenderUserID      int64          `json:"sender_user_id"`
	SenderName        string         `json:"sender_name,omitempty"`
	RecipientUserID   int64          `json:"recipient_user_id"`
	RecipientName     string         `json:"recipient_name,omitempty"`
	Status            ProposalStatus `json:"status"`
	Message           string         `json:"message"`
	DeclineReason     string         `json:"decline_reason,omitempty"`
	ChatThreadID      *int64         `json:"chat_thread_id,omitempty"`
	Candidate         *DoctorCard    `json:"candidate,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

// Shortlist represents saved bookmarks.
type Shortlist struct {
	ID                int64     `json:"id"`
	UserID            int64     `json:"user_id"`
	ShortlistedUserID int64     `json:"shortlisted_user_id"`
	Candidate         *DoctorCard `json:"candidate,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

// IgnoredUser represents blocked/ignored users.
type IgnoredUser struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"user_id"`
	IgnoredUserID int64     `json:"ignored_user_id"`
	CreatedAt     time.Time `json:"created_at"`
}

// ProgressionStage represents courtship stages.
type ProgressionStage struct {
	ID              int64  `json:"id"`
	Slug            string `json:"slug"`
	Name            string `json:"name"`
	OrderIndex      int    `json:"order_index"`
	ProgressPercent int    `json:"progress_percent"`
	Description     string `json:"description"`
}

// MemberProgression represents active courtship relationship.
type MemberProgression struct {
	ID              int64                      `json:"id"`
	UserID          int64                      `json:"user_id"`
	PartnerID       int64                      `json:"partner_id"`
	PartnerName     string                     `json:"partner_name,omitempty"`
	Partner         *DoctorCard                `json:"partner,omitempty"`
	CurrentStageID  int64                      `json:"current_stage_id"`
	StageSlug       string                     `json:"stage_slug,omitempty"`
	StageName       string                     `json:"stage_name,omitempty"`
	ProgressPercent int                        `json:"progress_percent"`
	Status          string                     `json:"status"` // "active", "completed", "cancelled"
	Notes           string                     `json:"notes,omitempty"`
	StartedAt       time.Time                  `json:"started_at"`
	UpdatedAt       time.Time                  `json:"updated_at"`
	ChecklistItems  []ProgressionChecklistItem `json:"checklist_items,omitempty"`
	Venues          []ProgressionVenueItem     `json:"venues,omitempty"`
	BudgetItems     []ProgressionBudgetItem    `json:"budget_items,omitempty"`
	Events          []ProgressionEvent         `json:"events,omitempty"`
}

// ProgressionItemType represents checklist vs venue vs budget.
type ProgressionItemType string

const (
	ItemTypeChecklist ProgressionItemType = "checklist"
	ItemTypeVenue     ProgressionItemType = "venue"
	ItemTypeBudget    ProgressionItemType = "budget"
)

// ProgressionChecklistItem represents a checklist task.
type ProgressionChecklistItem struct {
	ID            int64      `json:"id"`
	ProgressionID int64      `json:"progression_id"`
	Title         string     `json:"title"`
	IsCompleted   bool       `json:"is_completed"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

// ProgressionVenueItem represents planned venues.
type ProgressionVenueItem struct {
	ID            int64      `json:"id"`
	ProgressionID int64      `json:"progression_id"`
	Name          string     `json:"name"`
	VenueType     string     `json:"venue_type"`
	EstimatedCost float64    `json:"estimated_cost"`
	Rating        float64    `json:"rating"`
	Status        string     `json:"status"` // "shortlisted", "visited", "booked", "rejected"
	VisitedAt     *time.Time `json:"visited_at,omitempty"`
	Notes         string     `json:"notes,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

// ProgressionBudgetItem represents budget ledger entry.
type ProgressionBudgetItem struct {
	ID            int64     `json:"id"`
	ProgressionID int64     `json:"progression_id"`
	Label         string    `json:"label"`
	Amount        float64   `json:"amount"`
	Category      string    `json:"category"`
	Status        string    `json:"status"` // "planned", "paid", "cancelled"
	Notes         string    `json:"notes,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// ProgressionEvent represents scheduled milestones (meetings, calls, dinners).
type ProgressionEvent struct {
	ID            int64      `json:"id"`
	ProgressionID int64      `json:"progression_id"`
	Title         string     `json:"title"`
	EventAt       *time.Time `json:"event_at,omitempty"`
	Location      string     `json:"location,omitempty"`
	Status        string     `json:"status"` // "scheduled", "completed", "cancelled"
	Notes         string     `json:"notes,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

// ChatThread represents a conversation between two matched members.
type ChatThread struct {
	ID            int64        `json:"id"`
	UserOneID     int64        `json:"user_one_id"`
	UserTwoID     int64        `json:"user_two_id"`
	OtherUser     *DoctorCard  `json:"other_user,omitempty"`
	LastMessage   string       `json:"last_message"`
	LastMessageAt *time.Time   `json:"last_message_at"`
	UnreadCount   int          `json:"unread_count"`
	CreatedAt     time.Time    `json:"created_at"`
}

// ChatMessage represents a single message in a thread.
type ChatMessage struct {
	ID             int64     `json:"id"`
	ThreadID       int64     `json:"thread_id"`
	SenderUserID   int64     `json:"sender_user_id"`
	ReceiverUserID int64     `json:"receiver_user_id"`
	Message        string    `json:"message"`
	AttachmentURL  string    `json:"attachment_url,omitempty"`
	IsBiodataShare bool      `json:"is_biodata_share"`
	IsRead         bool      `json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
}

// GalleryImage represents user media.
type GalleryImage struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	ImageURL   string    `json:"image_url"`
	BlurredURL string    `json:"blurred_url"`
	Thumb256   string    `json:"thumb_256,omitempty"`
	Card640    string    `json:"card_640,omitempty"`
	Large1280  string    `json:"large_1280,omitempty"`
	IsPrimary  bool      `json:"is_primary"`
	IsPrivate  bool      `json:"is_private"`
	CreatedAt  time.Time `json:"created_at"`
}

// ViewGalleryImageRequest represents access requests for private/blurred photos.
type ViewGalleryImageRequest struct {
	ID                int64     `json:"id"`
	OwnerUserID       int64     `json:"owner_user_id"`
	RequestedByUserID int64     `json:"requested_by_user_id"`
	RequesterName     string    `json:"requester_name,omitempty"`
	Status            string    `json:"status"` // "pending", "accepted", "rejected"
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// Package represents a membership subscription tier.
type Package struct {
	ID                      int64     `json:"id"`
	Name                    string    `json:"name"`
	Description             string    `json:"description"`
	Price                   float64   `json:"price"`
	ValidityDays            int       `json:"validity_days"`
	ProposalLimit           int       `json:"proposal_limit"`
	ContactViewLimit        int       `json:"contact_view_limit"`
	PhotoGalleryLimit       int       `json:"photo_gallery_limit"`
	ProfileImageViewLimit   int       `json:"profile_image_view_limit"`
	GalleryImageViewLimit   int       `json:"gallery_image_view_limit"`
	ProfileViewersViewLimit int       `json:"profile_viewers_view_limit"`
	AutoProfileMatch        bool      `json:"auto_profile_match"`
	Image                   string    `json:"image,omitempty"`
	IsActive                bool      `json:"is_active"`
	CreatedAt               time.Time `json:"created_at"`
}

// Coupon represents discount coupons.
type Coupon struct {
	ID              int64      `json:"id"`
	Code            string     `json:"code"`
	DiscountPercent float64    `json:"discount_percent"`
	MaxUses         int        `json:"max_uses"`
	UsedCount       int        `json:"used_count"`
	ExpiresAt       *time.Time `json:"expires_at"`
	IsActive        bool       `json:"is_active"`
}

// PackagePayment represents payment transactions.
type PackagePayment struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"user_id"`
	PackageID     int64     `json:"package_id"`
	PackageName   string    `json:"package_name,omitempty"`
	Amount        float64   `json:"amount"`
	Discount      float64   `json:"discount"`
	FinalAmount   float64   `json:"final_amount"`
	CouponCode    string    `json:"coupon_code,omitempty"`
	PaymentMethod string    `json:"payment_method"` // "stripe", "jazzcash", "easypaisa", "bank_transfer", "wallet"
	PaymentStatus string    `json:"payment_status"` // "pending", "under_review", "completed", "rejected"
	TransactionID string    `json:"transaction_id"`
	PaymentProof  string    `json:"payment_proof,omitempty"`
	AdminNotes    string    `json:"admin_notes,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Wallet represents member credit wallet.
type Wallet struct {
	ID        int64               `json:"id"`
	UserID    int64               `json:"user_id"`
	Balance   float64             `json:"balance"`
	UpdatedAt time.Time           `json:"updated_at"`
	History   []WalletTransaction `json:"history,omitempty"`
}

// WalletTransaction represents a balance debit/credit.
type WalletTransaction struct {
	ID        int64     `json:"id"`
	WalletID  int64     `json:"wallet_id"`
	UserID    int64     `json:"user_id"`
	Type      string    `json:"type"` // "credit", "debit"
	Amount    float64   `json:"amount"`
	Details   string    `json:"details"`
	CreatedAt time.Time `json:"created_at"`
}
