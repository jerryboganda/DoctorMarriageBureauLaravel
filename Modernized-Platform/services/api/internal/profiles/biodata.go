package profiles

import (
	"bytes"
	"fmt"
	"math"
	"strings"
	"time"
)

// BiodataDocument represents structured biodata tailored for doctors.
type BiodataDocument struct {
	GeneratedAt        time.Time          `json:"generated_at"`
	DocID              string             `json:"doc_id"`
	CandidateCode      string             `json:"candidate_code"`
	FullName           string             `json:"full_name"`
	Age                int                `json:"age"`
	Gender             string             `json:"gender"`
	HeightFormatted    string             `json:"height_formatted"`
	WeightFormatted    string             `json:"weight_formatted"`
	MaritalStatus      string             `json:"marital_status"`
	CurrentLocation    string             `json:"current_location"`
	MedicalSpeciality  string             `json:"medical_speciality"`
	Qualifications     []EducationItem    `json:"qualifications"`
	CareerHistory      []CareerItem       `json:"career_history"`
	Spiritual          SpiritualSection   `json:"spiritual"`
	Lifestyle          LifestyleSection   `json:"lifestyle"`
	Family             FamilySection      `json:"family"`
	PartnerPreferences PreferencesSection `json:"partner_preferences"`
	ContactMasked      bool               `json:"contact_masked"`
	Phone              string             `json:"phone,omitempty"`
	Email              string             `json:"email,omitempty"`
}

// GenerateBiodataDocument builds a formatted Doctor Biodata payload.
func GenerateBiodataDocument(profile *FullProfileResponse, userCode string, maskContact bool) *BiodataDocument {
	heightStr := "Not specified"
	if profile.Basics.Height != nil {
		feet := int(*profile.Basics.Height / 30.48)
		remCm := math.Mod(*profile.Basics.Height, 30.48)
		inches := int(math.Round(remCm / 2.54))
		heightStr = fmt.Sprintf("%d'%d\" (%.0f cm)", feet, inches, *profile.Basics.Height)
	}

	weightStr := "Not specified"
	if profile.Basics.Weight != nil {
		weightStr = fmt.Sprintf("%d kg", *profile.Basics.Weight)
	}

	loc := profile.Basics.CurrentResidency.City
	if profile.Basics.CurrentResidency.Country != "" {
		if loc != "" {
			loc += ", " + profile.Basics.CurrentResidency.Country
		} else {
			loc = profile.Basics.CurrentResidency.Country
		}
	}
	if loc == "" {
		loc = "Not specified"
	}

	doc := &BiodataDocument{
		GeneratedAt:        time.Now(),
		DocID:              fmt.Sprintf("BIO-%s-%d", userCode, time.Now().Unix()),
		CandidateCode:      userCode,
		FullName:           profile.Basics.FullName,
		Age:                profile.Basics.Age,
		Gender:             profile.Basics.Gender,
		HeightFormatted:    heightStr,
		WeightFormatted:    weightStr,
		MaritalStatus:      profile.Basics.MaritalStatusName,
		CurrentLocation:    loc,
		MedicalSpeciality:  profile.Career.MedicalSpeciality,
		Qualifications:     profile.Career.Education,
		CareerHistory:      profile.Career.Careers,
		Spiritual:          profile.Spiritual,
		Lifestyle:          profile.Lifestyle,
		Family:             profile.Family,
		PartnerPreferences: profile.Preferences,
		ContactMasked:      maskContact,
	}

	if !maskContact {
		doc.Phone = profile.Basics.Phone
		doc.Email = profile.Basics.Email
	} else {
		doc.Phone = "[Hidden by Privacy Settings / Available upon Connection]"
		doc.Email = "[Hidden by Privacy Settings / Available upon Connection]"
	}

	return doc
}

// GenerateBiodataPDFText generates a clean, structured text biodata formatted for printing or PDF stream conversion.
func GenerateBiodataPDFText(doc *BiodataDocument) []byte {
	var b bytes.Buffer

	divider := strings.Repeat("=", 68)
	subdivider := strings.Repeat("-", 68)

	b.WriteString(divider + "\n")
	b.WriteString("                 DOCTOR MARRIAGE BUREAU\n")
	b.WriteString("             Verified Medical Doctor Biodata\n")
	b.WriteString(divider + "\n\n")

	b.WriteString(fmt.Sprintf("Candidate Ref : %s\n", doc.CandidateCode))
	b.WriteString(fmt.Sprintf("Generated On  : %s\n", doc.GeneratedAt.Format("02 Jan 2006 15:04 MST")))
	b.WriteString(fmt.Sprintf("Document ID   : %s\n\n", doc.DocID))

	b.WriteString(subdivider + "\n")
	b.WriteString("1. PERSONAL & PHYSICAL PROFILE\n")
	b.WriteString(subdivider + "\n")
	b.WriteString(fmt.Sprintf("Full Name      : %s\n", doc.FullName))
	b.WriteString(fmt.Sprintf("Age / Gender   : %d Years / %s\n", doc.Age, doc.Gender))
	b.WriteString(fmt.Sprintf("Height / Weight: %s / %s\n", doc.HeightFormatted, doc.WeightFormatted))
	b.WriteString(fmt.Sprintf("Marital Status : %s\n", doc.MaritalStatus))
	b.WriteString(fmt.Sprintf("Location       : %s\n\n", doc.CurrentLocation))

	b.WriteString(subdivider + "\n")
	b.WriteString("2. MEDICAL QUALIFICATIONS & CAREER\n")
	b.WriteString(subdivider + "\n")
	if len(doc.Qualifications) > 0 {
		b.WriteString("Academic Degrees:\n")
		for _, q := range doc.Qualifications {
			b.WriteString(fmt.Sprintf("  • %s - %s\n", q.Degree, q.Institution))
		}
	} else {
		b.WriteString("Qualifications: Registered Medical Professional\n")
	}

	if len(doc.CareerHistory) > 0 {
		b.WriteString("Professional Practice:\n")
		for _, c := range doc.CareerHistory {
			b.WriteString(fmt.Sprintf("  • %s at %s (%s)\n", c.Designation, c.Company, c.WorkLocationType))
		}
	}
	b.WriteString("\n")

	b.WriteString(subdivider + "\n")
	b.WriteString("3. RELIGIOUS & COMMUNITY BACKGROUND\n")
	b.WriteString(subdivider + "\n")
	b.WriteString(fmt.Sprintf("Religion / Sect: %s / %s\n", doc.Spiritual.ReligionName, doc.Spiritual.SectName))
	b.WriteString(fmt.Sprintf("Caste / Biradari: %s\n", doc.Spiritual.CasteName))
	if doc.Spiritual.Ethnicity != "" {
		b.WriteString(fmt.Sprintf("Ethnicity      : %s\n", doc.Spiritual.Ethnicity))
	}
	b.WriteString("\n")

	b.WriteString(subdivider + "\n")
	b.WriteString("4. FAMILY BACKGROUND\n")
	b.WriteString(subdivider + "\n")
	b.WriteString(fmt.Sprintf("Family Type    : %s\n", doc.Family.FamilyType))
	b.WriteString(fmt.Sprintf("Father's Occ.  : %s\n", doc.Family.FatherOccupation))
	b.WriteString(fmt.Sprintf("Mother's Occ.  : %s\n", doc.Family.MotherOccupation))
	b.WriteString(fmt.Sprintf("Siblings       : %d Brothers, %d Sisters\n", doc.Family.NoOfBrothers, doc.Family.NoOfSisters))
	if doc.Family.FamilyLocationCity != "" {
		b.WriteString(fmt.Sprintf("Family Origin  : %s, %s\n", doc.Family.FamilyLocationCity, doc.Family.FamilyLocationCountry))
	}
	b.WriteString("\n")

	b.WriteString(subdivider + "\n")
	b.WriteString("5. PARTNER EXPECTATIONS\n")
	b.WriteString(subdivider + "\n")
	if doc.PartnerPreferences.MinAge != nil && doc.PartnerPreferences.MaxAge != nil {
		b.WriteString(fmt.Sprintf("Age Range      : %d - %d Years\n", *doc.PartnerPreferences.MinAge, *doc.PartnerPreferences.MaxAge))
	}
	if doc.PartnerPreferences.Education != "" {
		b.WriteString(fmt.Sprintf("Education Pref : %s\n", doc.PartnerPreferences.Education))
	}
	if doc.PartnerPreferences.Profession != "" {
		b.WriteString(fmt.Sprintf("Profession Pref: %s\n", doc.PartnerPreferences.Profession))
	}
	b.WriteString("\n")

	b.WriteString(subdivider + "\n")
	b.WriteString("6. CONTACT & VERIFICATION STATUS\n")
	b.WriteString(subdivider + "\n")
	b.WriteString(fmt.Sprintf("Phone Contact  : %s\n", doc.Phone))
	b.WriteString(fmt.Sprintf("Email Address  : %s\n", doc.Email))
	b.WriteString("Verification   : Verified by Doctor Marriage Bureau Matrimonial Desk\n\n")

	b.WriteString(divider + "\n")
	b.WriteString(" Confidential Document — For Prospective Match Review Only\n")
	b.WriteString(divider + "\n")

	return b.Bytes()
}
