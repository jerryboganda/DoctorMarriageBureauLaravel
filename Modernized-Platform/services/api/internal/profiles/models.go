package profiles

import (
	"time"
)

// FullProfileResponse aggregates all 1-to-1 profile tables.
type FullProfileResponse struct {
	Basics               BasicsSection          `json:"basics"`
	MarriageIntent       MarriageIntentSection  `json:"marriage_intent"`
	Lifestyle            LifestyleSection       `json:"lifestyle"`
	Career               CareerSection          `json:"career"`
	Family               FamilySection          `json:"family"`
	Spiritual            SpiritualSection       `json:"spiritual"`
	Preferences          PreferencesSection     `json:"preferences"`
	Media                MediaSection           `json:"media"`
	QualityScore         QualityScoreResult     `json:"quality_score"`
	VisibilitySettings   VisibilitySettings     `json:"visibility_settings"`
	PreferencePriorities map[string]string      `json:"preference_priorities"`
}

// BasicsSection represents personal details and residency.
type BasicsSection struct {
	FullName          string           `json:"full_name"`
	FirstName         string           `json:"first_name"`
	LastName          string           `json:"last_name"`
	Email             string           `json:"email"`
	Phone             string           `json:"phone"`
	Photo             string           `json:"photo"`
	Birthday          *string          `json:"birthday"`
	Age               int              `json:"age"`
	Gender            string           `json:"gender"`
	Height            *float64         `json:"height"`
	Weight            *int             `json:"weight"`
	MaritalStatusID   *int64           `json:"marital_status_id"`
	MaritalStatusName string           `json:"marital_status_name,omitempty"`
	OnBehalvesID      *int64           `json:"on_behalves_id"`
	Nationality       string           `json:"nationality"`
	KnownLanguages    []string         `json:"known_languages"`
	KnownLanguageIDs  []int64          `json:"known_language_ids"`
	ImmigrationStatus string           `json:"immigration_status"`
	CurrentResidency  ResidencyDetails `json:"current_residency"`
}

// ResidencyDetails represents location of present address.
type ResidencyDetails struct {
	Country   string `json:"country"`
	State     string `json:"state"`
	City      string `json:"city"`
	CountryID *int64 `json:"country_id"`
	StateID   *int64 `json:"state_id"`
	CityID    *int64 `json:"city_id"`
}

// MarriageIntentSection represents timeline and seriousness.
type MarriageIntentSection struct {
	Timeline              string `json:"timeline"`
	RelocationWillingness string `json:"relocation_willingness"`
	SeriousnessLevel      string `json:"seriousness_level"`
}

// LifestyleSection represents dietary habits, personality, hobbies.
type LifestyleSection struct {
	Diet              string   `json:"diet"`
	Drink             string   `json:"drink"`
	Smoke             string   `json:"smoke"`
	LivingWith        string   `json:"living_with"`
	SleepSchedule     string   `json:"sleep_schedule"`
	PersonalityTags   []string `json:"personality_tags"`
	Hobbies           string   `json:"hobbies"`
	Interests         string   `json:"interests"`
	Music             string   `json:"music"`
	Books             string   `json:"books"`
	Movies            string   `json:"movies"`
	Sports            string   `json:"sports"`
	FitnessActivities string   `json:"fitness_activities"`
	Affection         string   `json:"affection"`
	Humor             string   `json:"humor"`
	PoliticalViews    string   `json:"political_views"`
}

// EducationItem represents an academic credential.
type EducationItem struct {
	ID          int64   `json:"id,omitempty"`
	Degree      string  `json:"degree"`
	Institution string  `json:"institution"`
	Start       *string `json:"start"`
	End         *string `json:"end"`
	Present     bool    `json:"present"`
	IsHighest   bool    `json:"is_highest"`
}

// CareerItem represents a job/employment position.
type CareerItem struct {
	ID               int64   `json:"id,omitempty"`
	Designation      string  `json:"designation"`
	Company          string  `json:"company"`
	Start            *string `json:"start"`
	End              *string `json:"end"`
	Present          bool    `json:"present"`
	WorkLocationType string  `json:"work_location_type"`
}

// CareerSection represents medical qualifications and employment history.
type CareerSection struct {
	Education            []EducationItem `json:"education"`
	Careers              []CareerItem    `json:"careers"`
	AnnualIncomeRangeID  *int64          `json:"annual_income_range_id"`
	MedicalSpeciality    string          `json:"medical_speciality,omitempty"`
	MedicalRegistration  string          `json:"medical_registration,omitempty"`
}

// FamilySection represents familial relationships.
type FamilySection struct {
	FamilyType            string `json:"family_type"`
	Father                string `json:"father"`
	Mother                string `json:"mother"`
	FatherOccupation      string `json:"father_occupation"`
	MotherOccupation      string `json:"mother_occupation"`
	NoOfBrothers          int    `json:"no_of_brothers"`
	NoOfSisters           int    `json:"no_of_sisters"`
	AboutParents          string `json:"about_parents"`
	AboutSiblings         string `json:"about_siblings"`
	FamilyLocationCity    string `json:"family_location_city"`
	FamilyLocationCountry string `json:"family_location_country"`
}

// SpiritualSection represents religious and caste background.
type SpiritualSection struct {
	ReligionID    *int64 `json:"religion_id"`
	ReligionName  string `json:"religion_name"`
	SectID        *int64 `json:"sect_id"`
	SectName      string `json:"sect_name"`
	CasteID       *int64 `json:"caste_id"`
	CasteName     string `json:"caste_name"`
	SubCasteID    *int64 `json:"sub_caste_id"`
	Gothra        string `json:"gothra"`
	Ethnicity     string `json:"ethnicity"`
	PersonalValue string `json:"personal_value"`
	FamilyValueID *int64 `json:"family_value_id"`
}

// PreferencesSection represents partner expectations.
type PreferencesSection struct {
	MinAge               *int     `json:"min_age"`
	MaxAge               *int     `json:"max_age"`
	Height               *float64 `json:"height"`
	Weight               *int     `json:"weight"`
	MaritalStatusID      *int64   `json:"marital_status_id"`
	ChildrenAcceptable   string   `json:"children_acceptable"`
	ReligionID           *int64   `json:"religion_id"`
	CasteID              *int64   `json:"caste_id"`
	Education            string   `json:"education"`
	Profession           string   `json:"profession"`
	SmokingAcceptable    string   `json:"smoking_acceptable"`
	DrinkingAcceptable   string   `json:"drinking_acceptable"`
	Diet                 string   `json:"diet"`
	BodyType             string   `json:"body_type"`
	Complexion           string   `json:"complexion"`
	PreferredCountryID   *int64   `json:"preferred_country_id"`
	PreferredStateID     *int64   `json:"preferred_state_id"`
	SpecialityPreference []string `json:"speciality_preference"`
}

// GalleryImage represents a photo in the member's profile album.
type GalleryImage struct {
	ID           int64  `json:"id"`
	URL          string `json:"url"`
	BlurredURL   string `json:"blurred_url,omitempty"`
	PrivacyLevel string `json:"privacy_level"`
	IsMain       bool   `json:"is_main"`
	SortOrder    int    `json:"sort_order"`
}

// MediaSection represents media files and audio/video introductions.
type MediaSection struct {
	MainPhoto      string         `json:"main_photo"`
	Gallery        []GalleryImage `json:"gallery"`
	VoiceIntroPath string         `json:"voice_intro_path,omitempty"`
	VoiceIntroURL  string         `json:"voice_intro_url,omitempty"`
	IntroVideoPath string         `json:"intro_video_path,omitempty"`
	IntroVideoURL  string         `json:"intro_video_url,omitempty"`
}

// QualityScoreImprovement represents an action to boost profile score.
type QualityScoreImprovement struct {
	Action  string `json:"action"`
	Points  int    `json:"points"`
	Section string `json:"section"`
}

// QualityScoreResult represents quality calculation output.
type QualityScoreResult struct {
	Total        int                       `json:"total"`
	Level        string                    `json:"level"`
	Breakdown    map[string]float64        `json:"breakdown"`
	Improvements []QualityScoreImprovement `json:"improvements"`
}

// VisibilitySettings holds granular privacy toggles.
type VisibilitySettings struct {
	ProfileVisible        bool `json:"profile_visible"`
	Incognito             bool `json:"incognito"`
	ProfilePhotoBlur      bool `json:"profile_photo_blur"`
	PhotoVisibilityPublic bool `json:"photo_visibility_public"`
	PhotoVisibilityMembers bool `json:"photo_visibility_members"`
	ShowContactDetails    bool `json:"show_contact_details"`
	ShowPhone             bool `json:"show_phone"`
	ShowEmail             bool `json:"show_email"`
	ShowLocation          bool `json:"show_location"`
	ShowFamilyDetails     bool `json:"show_family_details"`
	ScreenshotDeterrence  bool `json:"screenshot_deterrence"`
}

// TaxonomyItem represents standard taxonomy lookup items.
type TaxonomyItem struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Code string `json:"code,omitempty"`
}

// ProfileAuditLogEntry records changes to sections.
type ProfileAuditLogEntry struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Section   string    `json:"section"`
	OldValues string    `json:"old_values"`
	NewValues string    `json:"new_values"`
	CreatedAt time.Time `json:"created_at"`
}
