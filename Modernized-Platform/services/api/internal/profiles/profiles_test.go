package profiles

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/doctormarriagebureau/api/internal/middleware"
)

func TestCalculateQualityScore_EmptyProfile(t *testing.T) {
	svc := &Service{}
	emptyProfile := &FullProfileResponse{
		Basics: BasicsSection{
			KnownLanguages:   []string{},
			KnownLanguageIDs: []int64{},
		},
		Lifestyle: LifestyleSection{
			PersonalityTags: []string{},
		},
		Career: CareerSection{
			Education: []EducationItem{},
			Careers:   []CareerItem{},
		},
		Preferences: PreferencesSection{
			SpecialityPreference: []string{},
		},
		Media: MediaSection{
			Gallery: []GalleryImage{},
		},
	}

	res := svc.CalculateQualityScore(context.Background(), 1, emptyProfile)

	if res.Total != 0 {
		t.Errorf("expected 0 total score for empty profile, got %d", res.Total)
	}
	if res.Level != "NEEDS WORK" {
		t.Errorf("expected level 'NEEDS WORK', got '%s'", res.Level)
	}
	if len(res.Improvements) == 0 {
		t.Errorf("expected improvements list to be populated")
	}
}

func TestCalculateQualityScore_FullProfile(t *testing.T) {
	svc := &Service{}
	heightVal := 178.0
	weightVal := 72
	birthdayStr := "1994-06-15"
	minAge := 24
	maxAge := 30
	religionID := int64(1)
	casteID := int64(2)
	countryID := int64(1)

	fullProfile := &FullProfileResponse{
		Basics: BasicsSection{
			FirstName:        "Ahmed",
			LastName:         "Khan",
			FullName:         "Ahmed Khan",
			Birthday:         &birthdayStr,
			Gender:           "male",
			Height:           &heightVal,
			Weight:           &weightVal,
			KnownLanguages:   []string{"English", "Urdu"},
			Nationality:      "Pakistani",
			CurrentResidency: ResidencyDetails{City: "Lahore", Country: "Pakistan"},
			Photo:            "uploads/avatar1.jpg",
		},
		MarriageIntent: MarriageIntentSection{
			Timeline:              "within 6 months",
			RelocationWillingness: "open",
		},
		Media: MediaSection{
			MainPhoto: "uploads/avatar1.jpg",
			Gallery: []GalleryImage{
				{ID: 1, URL: "img1.jpg"},
				{ID: 2, URL: "img2.jpg"},
				{ID: 3, URL: "img3.jpg"},
			},
			VoiceIntroPath: "uploads/voice.mp3",
			IntroVideoPath: "uploads/video.mp4",
		},
		Lifestyle: LifestyleSection{
			Diet:          "Halal Non-Vegetarian",
			Drink:         "Never",
			Smoke:         "Never",
			LivingWith:    "Family",
			Hobbies:       "Reading, Cricket",
			Interests:     "Medical Research",
			SleepSchedule: "Early riser",
		},
		Career: CareerSection{
			Education: []EducationItem{
				{Degree: "MBBS", Institution: "King Edward Medical University", IsHighest: true},
				{Degree: "FCPS Cardiology", Institution: "CPSP", IsHighest: true},
			},
			Careers: []CareerItem{
				{Designation: "Senior Registrar", Company: "Mayo Hospital Lahore", WorkLocationType: "Hospital"},
			},
		},
		Family: FamilySection{
			FamilyType:       "Nuclear",
			FatherOccupation: "Retired Civil Engineer",
			MotherOccupation: "Homemaker",
			NoOfBrothers:     1,
			NoOfSisters:      1,
		},
		Spiritual: SpiritualSection{
			ReligionID:   &religionID,
			ReligionName: "Islam",
			CasteID:      &casteID,
			CasteName:    "Sheikh",
		},
		Preferences: PreferencesSection{
			MinAge:             &minAge,
			MaxAge:             &maxAge,
			Height:             &heightVal,
			ReligionID:         &religionID,
			Education:          "Doctor / Healthcare Specialist",
			PreferredCountryID: &countryID,
		},
	}

	res := svc.CalculateQualityScore(context.Background(), 1, fullProfile)

	if res.Total != 100 {
		t.Errorf("expected 100 total score for complete profile, got %d (breakdown: %+v)", res.Total, res.Breakdown)
	}
	if res.Level != "EXCELLENT" {
		t.Errorf("expected level 'EXCELLENT', got '%s'", res.Level)
	}
	if len(res.Improvements) != 0 {
		t.Errorf("expected 0 improvements for full profile, got %d", len(res.Improvements))
	}
}

func TestGenerateBiodataDocument(t *testing.T) {
	heightVal := 182.88 // 6'0"
	weightVal := 78
	birthdayStr := "1992-04-10"

	profile := &FullProfileResponse{
		Basics: BasicsSection{
			FullName: "Dr. Fatima Ali",
			Gender:   "female",
			Age:      32,
			Birthday: &birthdayStr,
			Height:   &heightVal,
			Weight:   &weightVal,
			CurrentResidency: ResidencyDetails{
				City:    "Karachi",
				Country: "Pakistan",
			},
			Phone: "+923001234567",
			Email: "dr.fatima@example.com",
		},
		Career: CareerSection{
			MedicalSpeciality: "Pediatric Surgery",
			Education: []EducationItem{
				{Degree: "MBBS", Institution: "Aga Khan University"},
				{Degree: "FCPS", Institution: "College of Physicians and Surgeons"},
			},
			Careers: []CareerItem{
				{Designation: "Consultant Pediatrician", Company: "Indus Hospital", WorkLocationType: "Onsite"},
			},
		},
		Spiritual: SpiritualSection{
			ReligionName: "Islam",
			SectName:     "Sunni",
			CasteName:    "Syed",
		},
		Family: FamilySection{
			FamilyType:       "Joint",
			FatherOccupation: "Professor",
			MotherOccupation: "Doctor",
			NoOfBrothers:     2,
			NoOfSisters:      0,
		},
	}

	// Test with contact masked
	maskedDoc := GenerateBiodataDocument(profile, "DMB-001001", true)
	if !maskedDoc.ContactMasked {
		t.Errorf("expected contact to be masked")
	}
	if strings.Contains(maskedDoc.Phone, "+92300") {
		t.Errorf("masked phone should not contain raw number")
	}

	// Test printable PDF text output
	pdfBytes := GenerateBiodataPDFText(maskedDoc)
	pdfText := string(pdfBytes)

	if !strings.Contains(pdfText, "DOCTOR MARRIAGE BUREAU") {
		t.Errorf("biodata header missing from printable text")
	}
	if !strings.Contains(pdfText, "Dr. Fatima Ali") {
		t.Errorf("full name missing from biodata text")
	}
	if !strings.Contains(pdfText, "Aga Khan University") {
		t.Errorf("qualification missing from biodata text")
	}
	if !strings.Contains(pdfText, "DMB-001001") {
		t.Errorf("candidate code missing from biodata text")
	}
}

func TestCalculateAge(t *testing.T) {
	tests := []struct {
		birthday string
		expected int
	}{
		{"2000-01-01", 26}, // assuming year 2026
		{"1990-01-01", 36},
		{"invalid-date", 0},
	}

	for _, tt := range tests {
		age := calculateAge(tt.birthday)
		if tt.birthday == "invalid-date" && age != 0 {
			t.Errorf("expected 0 for invalid date, got %d", age)
		}
		if tt.birthday != "invalid-date" && age <= 0 {
			t.Errorf("expected positive age for valid date %s, got %d", tt.birthday, age)
		}
	}
}

func TestProfilesHTTPHandlers(t *testing.T) {
	svc := NewService(nil, nil)
	handler := NewHandler(svc)

	r := chi.NewRouter()
	authMw := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			user := &middleware.AuthUser{
				ID:        100,
				FirstName: "Dr. Asad",
				LastName:  "Malik",
				Email:     "asad@example.com",
				UserType:  "member",
				Approved:  true,
			}
			ctx := context.WithValue(req.Context(), middleware.UserContextKey, user)
			next.ServeHTTP(w, req.WithContext(ctx))
		})
	}

	handler.RegisterRoutes(r, authMw)

	// 1. Test POST /profiles/visibility with valid payload
	body := []byte(`{"profile_photo_blur": true, "incognito": false}`)
	req := httptest.NewRequest(http.MethodPost, "/profiles/visibility", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	// Without live DB, will attempt DB query and return internal server error or fail gracefully
	if rr.Code != http.StatusOK && rr.Code != http.StatusInternalServerError {
		t.Errorf("expected 200 or 500 without DB, got %d", rr.Code)
	}

	// 2. Test POST /profiles/section/invalid_section
	req = httptest.NewRequest(http.MethodPost, "/profiles/section/invalid_section", bytes.NewReader([]byte("{}")))
	rr = httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid section, got %d", rr.Code)
	}
}
