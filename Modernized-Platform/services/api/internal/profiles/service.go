package profiles

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/doctormarriagebureau/api/internal/assets"
	"github.com/doctormarriagebureau/api/internal/cards"
	"github.com/doctormarriagebureau/api/platform/postgres"
	"github.com/doctormarriagebureau/api/platform/redis"
)

var (
	ErrInvalidSection = errors.New("invalid section specified")
	ErrProfileNotFound = errors.New("profile not found")
)

// Service handles profile management and aggregation.
type Service struct {
	pg    *postgres.Client
	redis *redis.Client
}

// NewService creates a new profiles Service instance.
func NewService(pg *postgres.Client, rdb *redis.Client) *Service {
	return &Service{
		pg:    pg,
		redis: rdb,
	}
}

// GetFullProfile aggregates data across 9 1-to-1 profile tables.
func (s *Service) GetFullProfile(ctx context.Context, userID int64) (*FullProfileResponse, error) {
	resp := &FullProfileResponse{
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
		PreferencePriorities: make(map[string]string),
	}

	// 1. Fetch User & Member core data
	userQuery := `
		SELECT 
			u.first_name, u.last_name, u.email, COALESCE(u.phone, ''), ` + assets.PhotoSQLWithUserFallback("u.photo", "u.id") + `,
			m.gender, CAST(m.birthday AS TEXT), m.on_behalves_id, COALESCE(m.nationality, ''),
			COALESCE(m.marriage_timeline, ''), COALESCE(m.relocation_willingness, ''), COALESCE(m.seriousness_level, 'marriage'),
			m.voice_intro_path, m.intro_video_path, m.known_languages, m.marital_status_id
		FROM users u
		LEFT JOIN members m ON m.user_id = u.id
		WHERE u.id = $1 AND u.deleted_at IS NULL
	`

	var (
		firstName, lastName, email, phone, photo string
		gender, nationality                      string
		birthday                                 *string
		onBehalfID                               *int64
		timeline, relocation, seriousness        string
		voiceIntroPath, introVideoPath           *string
		knownLanguagesJSON                       []byte
		memberMaritalStatusID                    *int64
	)

	err := s.pg.Pool.QueryRow(ctx, userQuery, userID).Scan(
		&firstName, &lastName, &email, &phone, &photo,
		&gender, &birthday, &onBehalfID, &nationality,
		&timeline, &relocation, &seriousness,
		&voiceIntroPath, &introVideoPath, &knownLanguagesJSON, &memberMaritalStatusID,
	)
	if err != nil {
		return nil, ErrProfileNotFound
	}

	resp.Basics.FirstName = firstName
	resp.Basics.LastName = lastName
	resp.Basics.FullName = strings.TrimSpace(firstName + " " + lastName)
	resp.Basics.Email = email
	resp.Basics.Phone = phone
	resp.Basics.Photo = photo
	resp.Basics.Gender = cards.NormalizeGender(gender)
	resp.Basics.Birthday = birthday
	resp.Basics.OnBehalvesID = onBehalfID
	resp.Basics.Nationality = nationality

	if birthday != nil && *birthday != "" {
		resp.Basics.Age = calculateAge(*birthday)
	}

	if len(knownLanguagesJSON) > 0 {
		_ = json.Unmarshal(knownLanguagesJSON, &resp.Basics.KnownLanguageIDs)
	}

	resp.MarriageIntent.Timeline = timeline
	resp.MarriageIntent.RelocationWillingness = relocation
	resp.MarriageIntent.SeriousnessLevel = seriousness

	if voiceIntroPath != nil {
		resp.Media.VoiceIntroPath = *voiceIntroPath
		resp.Media.VoiceIntroURL = *voiceIntroPath
	}
	if introVideoPath != nil {
		resp.Media.IntroVideoPath = *introVideoPath
		resp.Media.IntroVideoURL = *introVideoPath
	}
	resp.Media.MainPhoto = photo

	// 2. Fetch Physical Attributes
	_ = s.pg.Pool.QueryRow(ctx, "SELECT height, weight FROM physical_attributes WHERE user_id = $1", userID).
		Scan(&resp.Basics.Height, &resp.Basics.Weight)

	resp.Basics.MaritalStatusID = memberMaritalStatusID
	if resp.Basics.MaritalStatusID != nil {
		_ = s.pg.Pool.QueryRow(ctx, "SELECT name FROM marital_statuses WHERE id = $1", *resp.Basics.MaritalStatusID).
			Scan(&resp.Basics.MaritalStatusName)
	}

	_ = s.pg.Pool.QueryRow(ctx, "SELECT COALESCE(immigration_status, '') FROM recidencies WHERE user_id = $1", userID).
		Scan(&resp.Basics.ImmigrationStatus)
	_ = s.pg.Pool.QueryRow(ctx, "SELECT COALESCE(specialization, ''), COALESCE(medical_license_number, '') FROM members WHERE user_id = $1", userID).
		Scan(&resp.Career.MedicalSpeciality, &resp.Career.MedicalRegistration)

	// 3. Fetch Spiritual Background
	spiritualQuery := `
		SELECT 
			sb.religion_id, COALESCE(r.name, ''),
			sb.sect_id, COALESCE(s.name, ''),
			sb.caste_id, COALESCE(c.name, ''),
			sb.sub_caste_id, COALESCE(sb.gothra, ''), COALESCE(sb.ethnicity, ''),
			COALESCE(sb.personal_value, ''), sb.family_value_id
		FROM spiritual_backgrounds sb
		LEFT JOIN religions r ON r.id = sb.religion_id
		LEFT JOIN sects s ON s.id = sb.sect_id
		LEFT JOIN castes c ON c.id = sb.caste_id
		WHERE sb.user_id = $1
	`
	_ = s.pg.Pool.QueryRow(ctx, spiritualQuery, userID).Scan(
		&resp.Spiritual.ReligionID, &resp.Spiritual.ReligionName,
		&resp.Spiritual.SectID, &resp.Spiritual.SectName,
		&resp.Spiritual.CasteID, &resp.Spiritual.CasteName,
		&resp.Spiritual.SubCasteID, &resp.Spiritual.Gothra, &resp.Spiritual.Ethnicity,
		&resp.Spiritual.PersonalValue, &resp.Spiritual.FamilyValueID,
	)

	// 4. Fetch Lifestyle & Hobbies & Attitudes
	lifestyleQuery := `
		SELECT 
			COALESCE(l.diet, ''), COALESCE(l.drink, ''), COALESCE(l.smoke, ''),
			COALESCE(l.living_with, ''), COALESCE(l.sleep_schedule, ''), l.personality_tags,
			COALESCE(h.hobbies, ''), COALESCE(h.interests, ''), COALESCE(h.music, ''),
			COALESCE(h.books, ''), COALESCE(h.movies, ''), COALESCE(h.sports, ''),
			COALESCE(h.fitness_activities, ''),
			COALESCE(a.affection, ''), COALESCE(a.humor, ''), COALESCE(a.political_views, '')
		FROM lifestyles l
		LEFT JOIN hobbies h ON h.user_id = l.user_id
		LEFT JOIN attitudes a ON a.user_id = l.user_id
		WHERE l.user_id = $1
	`
	var personalityJSON []byte
	_ = s.pg.Pool.QueryRow(ctx, lifestyleQuery, userID).Scan(
		&resp.Lifestyle.Diet, &resp.Lifestyle.Drink, &resp.Lifestyle.Smoke,
		&resp.Lifestyle.LivingWith, &resp.Lifestyle.SleepSchedule, &personalityJSON,
		&resp.Lifestyle.Hobbies, &resp.Lifestyle.Interests, &resp.Lifestyle.Music,
		&resp.Lifestyle.Books, &resp.Lifestyle.Movies, &resp.Lifestyle.Sports,
		&resp.Lifestyle.FitnessActivities,
		&resp.Lifestyle.Affection, &resp.Lifestyle.Humor, &resp.Lifestyle.PoliticalViews,
	)
	if len(personalityJSON) > 0 {
		_ = json.Unmarshal(personalityJSON, &resp.Lifestyle.PersonalityTags)
	}

	// 5. Fetch Family
	familyQuery := `
		SELECT 
			COALESCE(family_type, ''), COALESCE(father, ''), COALESCE(mother, ''),
			COALESCE(father_occupation, ''), COALESCE(mother_occupation, ''),
			COALESCE(no_of_brothers, 0), COALESCE(no_of_sisters, 0),
			COALESCE(about_parents, ''), COALESCE(about_siblings, ''),
			COALESCE(location_city, ''), COALESCE(location_country, '')
		FROM families WHERE user_id = $1
	`
	_ = s.pg.Pool.QueryRow(ctx, familyQuery, userID).Scan(
		&resp.Family.FamilyType, &resp.Family.Father, &resp.Family.Mother,
		&resp.Family.FatherOccupation, &resp.Family.MotherOccupation,
		&resp.Family.NoOfBrothers, &resp.Family.NoOfSisters,
		&resp.Family.AboutParents, &resp.Family.AboutSiblings,
		&resp.Family.FamilyLocationCity, &resp.Family.FamilyLocationCountry,
	)

	// 6. Fetch Education & Careers
	eduRows, err := s.pg.Pool.Query(ctx, "SELECT id, degree, institution, CAST(start AS TEXT), CAST(\"end\" AS TEXT), present, is_highest_degree FROM education WHERE user_id = $1 ORDER BY \"end\" DESC NULLS FIRST", userID)
	if err == nil {
		defer eduRows.Close()
		for eduRows.Next() {
			var item EducationItem
			_ = eduRows.Scan(&item.ID, &item.Degree, &item.Institution, &item.Start, &item.End, &item.Present, &item.IsHighest)
			resp.Career.Education = append(resp.Career.Education, item)
			if item.IsHighest && resp.Career.MedicalSpeciality == "" && item.Degree != "" {
				resp.Career.MedicalSpeciality = item.Degree
			}
		}
	}

	carRows, err := s.pg.Pool.Query(ctx, "SELECT id, designation, company, CAST(start AS TEXT), CAST(\"end\" AS TEXT), present, COALESCE(work_location_type, 'onsite') FROM careers WHERE user_id = $1 ORDER BY \"end\" DESC NULLS FIRST", userID)
	if err == nil {
		defer carRows.Close()
		for carRows.Next() {
			var item CareerItem
			_ = carRows.Scan(&item.ID, &item.Designation, &item.Company, &item.Start, &item.End, &item.Present, &item.WorkLocationType)
			resp.Career.Careers = append(resp.Career.Careers, item)
		}
	}

	// 7. Fetch Partner Expectations
	prefQuery := `
		SELECT 
			min_age, max_age, height, weight, marital_status_id,
			COALESCE(children_acceptable, ''), religion_id, caste_id,
			COALESCE(education, ''), COALESCE(profession, ''),
			COALESCE(smoking_acceptable, ''), COALESCE(drinking_acceptable, ''),
			COALESCE(diet, ''), COALESCE(body_type, ''), COALESCE(complexion, ''),
			preferred_country_id, preferred_state_id, speciality_preferences
		FROM partner_expectations WHERE user_id = $1
	`
	var specPrefJSON []byte
	_ = s.pg.Pool.QueryRow(ctx, prefQuery, userID).Scan(
		&resp.Preferences.MinAge, &resp.Preferences.MaxAge,
		&resp.Preferences.Height, &resp.Preferences.Weight,
		&resp.Preferences.MaritalStatusID, &resp.Preferences.ChildrenAcceptable,
		&resp.Preferences.ReligionID, &resp.Preferences.CasteID,
		&resp.Preferences.Education, &resp.Preferences.Profession,
		&resp.Preferences.SmokingAcceptable, &resp.Preferences.DrinkingAcceptable,
		&resp.Preferences.Diet, &resp.Preferences.BodyType, &resp.Preferences.Complexion,
		&resp.Preferences.PreferredCountryID, &resp.Preferences.PreferredStateID,
		&specPrefJSON,
	)
	if len(specPrefJSON) > 0 {
		_ = json.Unmarshal(specPrefJSON, &resp.Preferences.SpecialityPreference)
	}

	// 8. Fetch Gallery Images
	imgRows, err := s.pg.Pool.Query(ctx, "SELECT id, "+assets.PhotoSQL("image")+", "+assets.PhotoSQL("blurred_url")+", COALESCE(privacy_level, 'public'), COALESCE(is_main_photo, false), COALESCE(sort_order, 0) FROM gallery_images WHERE user_id = $1 AND deleted_at IS NULL ORDER BY sort_order", userID)
	if err == nil {
		defer imgRows.Close()
		for imgRows.Next() {
			var img GalleryImage
			_ = imgRows.Scan(&img.ID, &img.URL, &img.BlurredURL, &img.PrivacyLevel, &img.IsMain, &img.SortOrder)
			resp.Media.Gallery = append(resp.Media.Gallery, img)
		}
	}

	// 9. Fetch Residency Address
	addrQuery := `
		SELECT 
			a.country_id, COALESCE(co.name, ''),
			a.state_id, COALESCE(st.name, ''),
			a.city_id, COALESCE(ci.name, '')
		FROM addresses a
		LEFT JOIN countries co ON co.id = a.country_id
		LEFT JOIN states st ON st.id = a.state_id
		LEFT JOIN cities ci ON ci.id = a.city_id
		WHERE a.user_id = $1 AND a.type = 'present' LIMIT 1
	`
	_ = s.pg.Pool.QueryRow(ctx, addrQuery, userID).Scan(
		&resp.Basics.CurrentResidency.CountryID, &resp.Basics.CurrentResidency.Country,
		&resp.Basics.CurrentResidency.StateID, &resp.Basics.CurrentResidency.State,
		&resp.Basics.CurrentResidency.CityID, &resp.Basics.CurrentResidency.City,
	)

	// 10. Fetch Visibility Settings
	vis, err := s.GetVisibility(ctx, userID)
	if err == nil && vis != nil {
		resp.VisibilitySettings = *vis
	}

	// 11. Calculate Quality Score
	resp.QualityScore = s.CalculateQualityScore(ctx, userID, resp)

	return resp, nil
}

// UpdateSection updates a specific 6-step profile section.
func (s *Service) UpdateSection(ctx context.Context, userID int64, section string, payload json.RawMessage) (interface{}, *QualityScoreResult, error) {
	secLower := strings.ToLower(section)
	validSections := map[string]bool{
		"basics":      true,
		"lifestyle":   true,
		"career":      true,
		"family":      true,
		"preferences": true,
		"media":       true,
	}
	if !validSections[secLower] {
		return nil, nil, ErrInvalidSection
	}

	if s.pg == nil || s.pg.Pool == nil {
		return nil, nil, errors.New("database service unavailable")
	}

	now := time.Now()

	err := s.pg.WithTransaction(ctx, func(tx pgx.Tx) error {
		switch secLower {
		case "basics":
			var req struct {
				FirstName         string   `json:"first_name"`
				LastName          string   `json:"last_name"`
				Phone             string   `json:"phone"`
				Gender            string   `json:"gender"`
				Birthday          *string  `json:"birthday"`
				Height            *float64 `json:"height"`
				Weight            *int     `json:"weight"`
				MaritalStatusID   *int64   `json:"marital_status_id"`
				Nationality       string   `json:"nationality"`
				Timeline          string   `json:"timeline"`
				Relocation        string   `json:"relocation_willingness"`
				Seriousness       string   `json:"seriousness_level"`
				CountryID           *int64  `json:"country_id"`
				StateID             *int64  `json:"state_id"`
				CityID              *int64  `json:"city_id"`
				KnownLanguageIDs    []int64 `json:"known_language_ids"`
				ImmigrationStatus   string  `json:"immigration_status"`
			}
			if err := json.Unmarshal(payload, &req); err != nil {
				return err
			}

			if req.FirstName != "" || req.LastName != "" || req.Phone != "" {
				if _, err := tx.Exec(ctx, `
					UPDATE users SET 
						first_name = COALESCE(NULLIF($1, ''), first_name),
						last_name = COALESCE(NULLIF($2, ''), last_name),
						phone = COALESCE(NULLIF($3, ''), phone),
						updated_at = $4
					WHERE id = $5
				`, req.FirstName, req.LastName, req.Phone, now, userID); err != nil {
					return err
				}
			}

			langJSON, _ := json.Marshal(req.KnownLanguageIDs)
			if _, err := tx.Exec(ctx, basicsMemberSQL, req.Gender, req.Birthday, req.Nationality, req.Timeline, req.Relocation, req.Seriousness, langJSON, req.MaritalStatusID, now, userID); err != nil {
				return err
			}

			if _, err := tx.Exec(ctx, basicsPhysicalSQL, userID, req.Height, req.Weight, now); err != nil {
				return err
			}

			if req.CountryID != nil || req.StateID != nil || req.CityID != nil {
				if _, err := tx.Exec(ctx, `
					INSERT INTO addresses (user_id, type, country_id, state_id, city_id, created_at, updated_at)
					VALUES ($1, 'present', $2, $3, $4, $5, $5)
					ON CONFLICT (user_id, type) DO UPDATE SET 
						country_id = EXCLUDED.country_id,
						state_id = EXCLUDED.state_id,
						city_id = EXCLUDED.city_id,
						updated_at = EXCLUDED.updated_at
				`, userID, req.CountryID, req.StateID, req.CityID, now); err != nil {
					return err
				}
			}

			if req.ImmigrationStatus != "" {
				if _, err := tx.Exec(ctx, `
					INSERT INTO recidencies (user_id, immigration_status, created_at, updated_at)
					VALUES ($1, $2, $3, $3)
					ON CONFLICT (user_id) DO UPDATE SET
						immigration_status = EXCLUDED.immigration_status,
						updated_at = EXCLUDED.updated_at
				`, userID, req.ImmigrationStatus, now); err != nil {
					return err
				}
			}

		case "lifestyle":
			var req struct {
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
			if err := json.Unmarshal(payload, &req); err != nil {
				return err
			}

			tagJSON, _ := json.Marshal(req.PersonalityTags)
			_, _ = tx.Exec(ctx, `
				INSERT INTO lifestyles (user_id, diet, drink, smoke, living_with, sleep_schedule, personality_tags, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
				ON CONFLICT (user_id) DO UPDATE SET
					diet = EXCLUDED.diet, drink = EXCLUDED.drink, smoke = EXCLUDED.smoke,
					living_with = EXCLUDED.living_with, sleep_schedule = EXCLUDED.sleep_schedule,
					personality_tags = EXCLUDED.personality_tags, updated_at = EXCLUDED.updated_at
			`, userID, req.Diet, req.Drink, req.Smoke, req.LivingWith, req.SleepSchedule, tagJSON, now)

			_, _ = tx.Exec(ctx, `
				INSERT INTO hobbies (user_id, hobbies, interests, music, books, movies, sports, fitness_activities, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
				ON CONFLICT (user_id) DO UPDATE SET
					hobbies = EXCLUDED.hobbies, interests = EXCLUDED.interests, music = EXCLUDED.music,
					books = EXCLUDED.books, movies = EXCLUDED.movies, sports = EXCLUDED.sports,
					fitness_activities = EXCLUDED.fitness_activities, updated_at = EXCLUDED.updated_at
			`, userID, req.Hobbies, req.Interests, req.Music, req.Books, req.Movies, req.Sports, req.FitnessActivities, now)

		case "career":
			var req struct {
				Education           []EducationItem `json:"education"`
				Careers             []CareerItem    `json:"careers"`
				MedicalSpeciality   string          `json:"medical_speciality"`
				MedicalRegistration string          `json:"medical_registration"`
			}
			if err := json.Unmarshal(payload, &req); err != nil {
				return err
			}

			if req.MedicalSpeciality != "" || req.MedicalRegistration != "" {
				_, _ = tx.Exec(ctx, `
					UPDATE members SET
						specialization = COALESCE(NULLIF($1, ''), specialization),
						medical_license_number = COALESCE(NULLIF($2, ''), medical_license_number),
						updated_at = $3
					WHERE user_id = $4
				`, req.MedicalSpeciality, req.MedicalRegistration, now, userID)
			}

			// Update education list
			_, _ = tx.Exec(ctx, "DELETE FROM education WHERE user_id = $1", userID)
			for _, e := range req.Education {
				_, _ = tx.Exec(ctx, `
					INSERT INTO education (user_id, degree, institution, start, "end", present, is_highest_degree, created_at, updated_at)
					VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, $8, $8)
				`, userID, e.Degree, e.Institution, e.Start, e.End, e.Present, e.IsHighest, now)
			}

			// Update career list
			_, _ = tx.Exec(ctx, "DELETE FROM careers WHERE user_id = $1", userID)
			for _, c := range req.Careers {
				_, _ = tx.Exec(ctx, `
					INSERT INTO careers (user_id, designation, company, start, "end", present, work_location_type, created_at, updated_at)
					VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, $8, $8)
				`, userID, c.Designation, c.Company, c.Start, c.End, c.Present, c.WorkLocationType, now)
			}

		case "family":
			var req struct {
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
				ReligionID            *int64 `json:"religion_id"`
				SectID                *int64 `json:"sect_id"`
				CasteID               *int64 `json:"caste_id"`
				SubCasteID            *int64 `json:"sub_caste_id"`
				Ethnicity             string `json:"ethnicity"`
				PersonalValue         string `json:"personal_value"`
			}
			if err := json.Unmarshal(payload, &req); err != nil {
				return err
			}

			_, _ = tx.Exec(ctx, `
				INSERT INTO families (
					user_id, family_type, father, mother, father_occupation, mother_occupation,
					no_of_brothers, no_of_sisters, about_parents, about_siblings,
					location_city, location_country, created_at, updated_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
				ON CONFLICT (user_id) DO UPDATE SET
					family_type = EXCLUDED.family_type, father = EXCLUDED.father, mother = EXCLUDED.mother,
					father_occupation = EXCLUDED.father_occupation, mother_occupation = EXCLUDED.mother_occupation,
					no_of_brothers = EXCLUDED.no_of_brothers, no_of_sisters = EXCLUDED.no_of_sisters,
					about_parents = EXCLUDED.about_parents, about_siblings = EXCLUDED.about_siblings,
					location_city = EXCLUDED.location_city, location_country = EXCLUDED.location_country,
					updated_at = EXCLUDED.updated_at
			`, userID, req.FamilyType, req.Father, req.Mother, req.FatherOccupation, req.MotherOccupation,
				req.NoOfBrothers, req.NoOfSisters, req.AboutParents, req.AboutSiblings,
				req.FamilyLocationCity, req.FamilyLocationCountry, now)

			_, _ = tx.Exec(ctx, `
				INSERT INTO spiritual_backgrounds (user_id, religion_id, sect_id, caste_id, sub_caste_id, ethnicity, personal_value, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
				ON CONFLICT (user_id) DO UPDATE SET
					religion_id = EXCLUDED.religion_id, sect_id = EXCLUDED.sect_id, caste_id = EXCLUDED.caste_id,
					sub_caste_id = EXCLUDED.sub_caste_id, ethnicity = EXCLUDED.ethnicity,
					personal_value = COALESCE(NULLIF(EXCLUDED.personal_value, ''), spiritual_backgrounds.personal_value),
					updated_at = EXCLUDED.updated_at
			`, userID, req.ReligionID, req.SectID, req.CasteID, req.SubCasteID, req.Ethnicity, req.PersonalValue, now)

		case "preferences":
			var req struct {
				MinAge               *int     `json:"min_age"`
				MaxAge               *int     `json:"max_age"`
				Height               *float64 `json:"height"`
				Weight               *int     `json:"weight"`
				MaritalStatusID      *int64   `json:"marital_status_id"`
				ReligionID           *int64   `json:"religion_id"`
				CasteID              *int64   `json:"caste_id"`
				Education            string   `json:"education"`
				Profession           string   `json:"profession"`
				SmokingAcceptable    string   `json:"smoking_acceptable"`
				DrinkingAcceptable   string   `json:"drinking_acceptable"`
				ChildrenAcceptable   string   `json:"children_acceptable"`
				Diet                 string   `json:"diet"`
				PreferredCountryID   *int64   `json:"preferred_country_id"`
				PreferredStateID     *int64   `json:"preferred_state_id"`
				SpecialityPreference []string `json:"speciality_preference"`
			}
			if err := json.Unmarshal(payload, &req); err != nil {
				return err
			}

			specJSON, _ := json.Marshal(req.SpecialityPreference)
			_, _ = tx.Exec(ctx, `
				INSERT INTO partner_expectations (
					user_id, min_age, max_age, height, weight, marital_status_id,
					religion_id, caste_id, education, profession,
					smoking_acceptable, drinking_acceptable, children_acceptable, diet,
					preferred_country_id, preferred_state_id, speciality_preferences, created_at, updated_at
				) VALUES (
					$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18
				)
				ON CONFLICT (user_id) DO UPDATE SET
					min_age = EXCLUDED.min_age, max_age = EXCLUDED.max_age, height = EXCLUDED.height,
					weight = EXCLUDED.weight, marital_status_id = EXCLUDED.marital_status_id,
					religion_id = EXCLUDED.religion_id, caste_id = EXCLUDED.caste_id,
					education = EXCLUDED.education, profession = EXCLUDED.profession,
					smoking_acceptable = EXCLUDED.smoking_acceptable, drinking_acceptable = EXCLUDED.drinking_acceptable,
					children_acceptable = EXCLUDED.children_acceptable,
					diet = EXCLUDED.diet, preferred_country_id = EXCLUDED.preferred_country_id,
					preferred_state_id = EXCLUDED.preferred_state_id, speciality_preferences = EXCLUDED.speciality_preferences,
					updated_at = EXCLUDED.updated_at
			`, userID, req.MinAge, req.MaxAge, req.Height, req.Weight, req.MaritalStatusID,
				req.ReligionID, req.CasteID, req.Education, req.Profession,
				req.SmokingAcceptable, req.DrinkingAcceptable, req.ChildrenAcceptable, req.Diet,
				req.PreferredCountryID, req.PreferredStateID, specJSON, now)

		case "media":
			var req struct {
				MainPhoto      string `json:"main_photo"`
				VoiceIntroPath string `json:"voice_intro_path"`
				IntroVideoPath string `json:"intro_video_path"`
			}
			if err := json.Unmarshal(payload, &req); err != nil {
				return err
			}

			if req.MainPhoto != "" {
				_, _ = tx.Exec(ctx, "UPDATE users SET photo = $1, photo_approved = false, updated_at = $2 WHERE id = $3", req.MainPhoto, now, userID)
			}
			if req.VoiceIntroPath != "" || req.IntroVideoPath != "" {
				_, _ = tx.Exec(ctx, `
					UPDATE members SET 
						voice_intro_path = COALESCE(NULLIF($1, ''), voice_intro_path),
						intro_video_path = COALESCE(NULLIF($2, ''), intro_video_path),
						updated_at = $3
					WHERE user_id = $4
				`, req.VoiceIntroPath, req.IntroVideoPath, now, userID)
			}

		default:
			return ErrInvalidSection
		}

		if _, err := tx.Exec(ctx, profileAuditSQL, userID, section, string(payload), now); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	// Fetch updated profile and recalculate score
	updatedProfile, err := s.GetFullProfile(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	return updatedProfile, &updatedProfile.QualityScore, nil
}

// CalculateQualityScore computes weighted completion score (0-100%) across 7 categories.
func (s *Service) CalculateQualityScore(ctx context.Context, userID int64, profile *FullProfileResponse) QualityScoreResult {
	if profile == nil {
		var err error
		profile, err = s.GetFullProfile(ctx, userID)
		if err != nil {
			return QualityScoreResult{Total: 0, Level: "NEEDS WORK", Breakdown: map[string]float64{}}
		}
	}

	weights := map[string]float64{
		"basics":      20.0,
		"photos":      20.0,
		"lifestyle":   15.0,
		"career":      15.0,
		"family":      10.0,
		"preferences": 10.0,
		"media":       10.0,
	}

	breakdown := make(map[string]float64)
	var improvements []QualityScoreImprovement

	// 1. Basics (20%) - 10 checks
	basicsScore := 0
	basicsTotal := 10
	if profile.Basics.FirstName != "" {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add your first name", Points: 2, Section: "basics"})
	}
	if profile.Basics.LastName != "" {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add your last name", Points: 2, Section: "basics"})
	}
	if profile.Basics.Birthday != nil {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add your date of birth", Points: 2, Section: "basics"})
	}
	if profile.Basics.Gender != "" {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Select your gender", Points: 2, Section: "basics"})
	}
	if profile.Basics.Height != nil {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Set your height", Points: 2, Section: "basics"})
	}
	if len(profile.Basics.KnownLanguageIDs) > 0 || len(profile.Basics.KnownLanguages) > 0 {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add languages you speak", Points: 2, Section: "basics"})
	}
	if profile.Basics.Nationality != "" {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add your nationality", Points: 2, Section: "basics"})
	}
	if profile.Basics.CurrentResidency.City != "" || profile.Basics.CurrentResidency.Country != "" {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add current residency location", Points: 2, Section: "basics"})
	}
	if profile.MarriageIntent.Timeline != "" {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Set marriage timeline", Points: 2, Section: "basics"})
	}
	if profile.MarriageIntent.RelocationWillingness != "" {
		basicsScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Set relocation preference", Points: 2, Section: "basics"})
	}
	breakdown["basics"] = (float64(basicsScore) / float64(basicsTotal)) * weights["basics"]

	// 2. Photos (20%) - Profile photo (2 pts) + up to 3 gallery photos (1 pt each)
	photosScore := 0
	photosTotal := 5
	galleryCount := len(profile.Media.Gallery)
	if profile.Basics.Photo != "" {
		photosScore += 2
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Upload a primary profile photo", Points: 8, Section: "media"})
	}
	if galleryCount > 3 {
		photosScore += 3
	} else {
		photosScore += galleryCount
	}
	if galleryCount < 3 {
		needed := 3 - galleryCount
		improvements = append(improvements, QualityScoreImprovement{
			Action:  fmt.Sprintf("Add %d more gallery photo(s)", needed),
			Points:  needed * 4,
			Section: "media",
		})
	}
	breakdown["photos"] = (float64(photosScore) / float64(photosTotal)) * weights["photos"]

	// 3. Lifestyle (15%) - 6 checks
	lifeScore := 0
	lifeTotal := 6
	if profile.Lifestyle.Diet != "" {
		lifeScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Select dietary preference", Points: 3, Section: "lifestyle"})
	}
	if profile.Lifestyle.Drink != "" {
		lifeScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Select drinking habit", Points: 3, Section: "lifestyle"})
	}
	if profile.Lifestyle.Smoke != "" {
		lifeScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Select smoking habit", Points: 3, Section: "lifestyle"})
	}
	if profile.Lifestyle.LivingWith != "" {
		lifeScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Select living situation", Points: 3, Section: "lifestyle"})
	}
	if profile.Lifestyle.Hobbies != "" {
		lifeScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add your hobbies", Points: 3, Section: "lifestyle"})
	}
	if profile.Lifestyle.Interests != "" {
		lifeScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add your interests", Points: 3, Section: "lifestyle"})
	}
	breakdown["lifestyle"] = (float64(lifeScore) / float64(lifeTotal)) * weights["lifestyle"]

	// 4. Career (15%) - Education (2 pts) + Career (2 pts)
	careerScore := 0
	careerTotal := 4
	if len(profile.Career.Education) > 0 {
		careerScore += 2
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add your medical qualifications and education", Points: 8, Section: "career"})
	}
	if len(profile.Career.Careers) > 0 {
		careerScore += 2
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add your medical practice / career details", Points: 7, Section: "career"})
	}
	breakdown["career"] = (float64(careerScore) / float64(careerTotal)) * weights["career"]

	// 5. Family (10%) - 5 checks
	famScore := 0
	famTotal := 5
	if profile.Family.FatherOccupation != "" {
		famScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add father's occupation", Points: 2, Section: "family"})
	}
	if profile.Family.MotherOccupation != "" {
		famScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Add mother's occupation", Points: 2, Section: "family"})
	}
	if profile.Family.FamilyType != "" {
		famScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Select family type", Points: 2, Section: "family"})
	}
	if profile.Spiritual.ReligionID != nil {
		famScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Select religion", Points: 2, Section: "family"})
	}
	if profile.Spiritual.CasteID != nil {
		famScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Select caste / biradari", Points: 2, Section: "family"})
	}
	breakdown["family"] = (float64(famScore) / float64(famTotal)) * weights["family"]

	// 6. Preferences (10%) - 5 checks
	prefScore := 0
	prefTotal := 5
	if profile.Preferences.MinAge != nil && profile.Preferences.MaxAge != nil {
		prefScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Set partner preferred age range", Points: 2, Section: "preferences"})
	}
	if profile.Preferences.Height != nil {
		prefScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Set partner preferred height", Points: 2, Section: "preferences"})
	}
	if profile.Preferences.ReligionID != nil {
		prefScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Set partner religion preference", Points: 2, Section: "preferences"})
	}
	if profile.Preferences.Education != "" {
		prefScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Set partner education preference", Points: 2, Section: "preferences"})
	}
	if profile.Preferences.PreferredCountryID != nil {
		prefScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Set partner preferred location", Points: 2, Section: "preferences"})
	}
	breakdown["preferences"] = (float64(prefScore) / float64(prefTotal)) * weights["preferences"]

	// 7. Media (10%) - Voice intro (1 pt) + Intro video (1 pt)
	mediaScore := 0
	mediaTotal := 2
	if profile.Media.VoiceIntroPath != "" {
		mediaScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Record a voice introduction", Points: 5, Section: "media"})
	}
	if profile.Media.IntroVideoPath != "" {
		mediaScore++
	} else {
		improvements = append(improvements, QualityScoreImprovement{Action: "Upload an introductory video", Points: 5, Section: "media"})
	}
	breakdown["media"] = (float64(mediaScore) / float64(mediaTotal)) * weights["media"]

	var totalSum float64
	for k, v := range breakdown {
		breakdown[k] = math.Round(v*10) / 10
		totalSum += v
	}

	total := int(math.Round(totalSum))
	level := "NEEDS WORK"
	if total >= 80 {
		level = "EXCELLENT"
	} else if total >= 60 {
		level = "GOOD"
	} else if total >= 40 {
		level = "FAIR"
	}

	// Sort improvements descending by points impact
	sort.Slice(improvements, func(i, j int) bool {
		return improvements[i].Points > improvements[j].Points
	})

	if len(improvements) > 8 {
		improvements = improvements[:8]
	}

	return QualityScoreResult{
		Total:        total,
		Level:        level,
		Breakdown:    breakdown,
		Improvements: improvements,
	}
}

// GetVisibility retrieves granular privacy toggles for the user.
func (s *Service) GetVisibility(ctx context.Context, userID int64) (*VisibilitySettings, error) {
	vis := &VisibilitySettings{
		ProfileVisible:         true,
		Incognito:              false,
		ProfilePhotoBlur:       false,
		PhotoVisibilityPublic:  true,
		PhotoVisibilityMembers: true,
		ShowContactDetails:     false,
		ShowPhone:              false,
		ShowEmail:              false,
		ShowLocation:           true,
		ShowFamilyDetails:      true,
		ScreenshotDeterrence:   true,
	}

	if s.pg != nil && s.pg.Pool != nil {
		query := `
			SELECT 
				COALESCE(profile_photo, 'public'),
				COALESCE(phone, 'hidden'),
				COALESCE(family_details, 'public'),
				COALESCE(is_anonymous, false)
			FROM field_visibility_settings WHERE user_id = $1
		`
		var photoPref, phonePref, familyPref string
		var isAnonymous bool
		err := s.pg.Pool.QueryRow(ctx, query, userID).Scan(&photoPref, &phonePref, &familyPref, &isAnonymous)
		if err == nil {
			vis.Incognito = isAnonymous
			vis.ProfilePhotoBlur = photoPref == "blurred"
			vis.PhotoVisibilityPublic = photoPref == "public"
			vis.PhotoVisibilityMembers = photoPref != "hidden"
			vis.ShowPhone = phonePref == "public"
			vis.ShowFamilyDetails = familyPref != "hidden"
		}
	}

	return vis, nil
}

// UpdateVisibility saves privacy toggles.
func (s *Service) UpdateVisibility(ctx context.Context, userID int64, flags map[string]interface{}) (*VisibilitySettings, error) {
	photoPref := "public"
	if blur, ok := flags["profile_photo_blur"].(bool); ok && blur {
		photoPref = "blurred"
	}
	phonePref := "hidden"
	familyPref := "public"
	isAnonymous := false
	if incognito, ok := flags["incognito"].(bool); ok {
		isAnonymous = incognito
	}
	if showPhone, ok := flags["show_phone"].(bool); ok && showPhone {
		phonePref = "public"
	}

	if s.pg != nil && s.pg.Pool != nil {
		now := time.Now()
		_, err := s.pg.Pool.Exec(ctx, `
			INSERT INTO field_visibility_settings (user_id, profile_photo, phone, family_details, is_anonymous, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $6)
			ON CONFLICT (user_id) DO UPDATE SET
				profile_photo = EXCLUDED.profile_photo,
				phone = EXCLUDED.phone,
				family_details = EXCLUDED.family_details,
				is_anonymous = EXCLUDED.is_anonymous,
				updated_at = EXCLUDED.updated_at
		`, userID, photoPref, phonePref, familyPref, isAnonymous, now)
		if err != nil {
			return nil, err
		}
	}

	return s.GetVisibility(ctx, userID)
}

// UpdatePreferencePriorities saves importance weights (dealbreaker, must_have, nice_to_have, flexible).
func (s *Service) UpdatePreferencePriorities(ctx context.Context, userID int64, priorities map[string]string) (map[string]string, error) {
	for field, priority := range priorities {
		if _, err := s.pg.Pool.Exec(ctx, `
			INSERT INTO partner_preference_priorities (user_id, field_name, priority_type, created_at, updated_at)
			VALUES ($1, $2, $3, NOW(), NOW())
			ON CONFLICT (user_id, field_name) DO UPDATE SET priority_type = EXCLUDED.priority_type, updated_at = NOW()
		`, userID, field, priority); err != nil {
			return nil, err
		}
	}

	return priorities, nil
}

// DownloadBiodata generates the formatted biodata payload and printable text/PDF stream.
func (s *Service) DownloadBiodata(ctx context.Context, requesterID, targetUserID int64) (*BiodataDocument, []byte, error) {
	targetProfile, err := s.GetFullProfile(ctx, targetUserID)
	if err != nil {
		return nil, nil, err
	}

	// Fetch user candidate code
	var code string
	_ = s.pg.Pool.QueryRow(ctx, "SELECT COALESCE(code, '') FROM users WHERE id = $1", targetUserID).Scan(&code)
	if code == "" {
		code = fmt.Sprintf("DMB-%06d", targetUserID)
	}

	// Check if contact information should be masked
	maskContact := true
	if requesterID == targetUserID {
		maskContact = false
	} else {
		vis, _ := s.GetVisibility(ctx, targetUserID)
		if vis != nil && vis.ShowContactDetails {
			maskContact = false
		}
	}

	// Log viewer audit trail
	_, _ = s.pg.Pool.Exec(ctx, "INSERT INTO profile_viewers (user_id, viewed_by, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())", targetUserID, requesterID)

	doc := GenerateBiodataDocument(targetProfile, code, maskContact)
	pdfText := GenerateBiodataPDFText(doc)

	return doc, pdfText, nil
}

// ListMaritalStatuses returns all marital statuses.
func (s *Service) ListMaritalStatuses(ctx context.Context) ([]TaxonomyItem, error) {
	rows, err := s.pg.Pool.Query(ctx, "SELECT id, name FROM marital_statuses ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TaxonomyItem
	for rows.Next() {
		var item TaxonomyItem
		_ = rows.Scan(&item.ID, &item.Name)
		list = append(list, item)
	}
	return list, nil
}

// ListCountries returns all countries.
func (s *Service) ListCountries(ctx context.Context) ([]TaxonomyItem, error) {
	rows, err := s.pg.Pool.Query(ctx, "SELECT id, name, COALESCE(code, '') FROM countries ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TaxonomyItem
	for rows.Next() {
		var item TaxonomyItem
		_ = rows.Scan(&item.ID, &item.Name, &item.Code)
		list = append(list, item)
	}
	return list, nil
}

// ListStates returns all states for a country.
func (s *Service) ListStates(ctx context.Context, countryID int64) ([]TaxonomyItem, error) {
	rows, err := s.pg.Pool.Query(ctx, "SELECT id, name FROM states WHERE country_id = $1 ORDER BY name", countryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TaxonomyItem
	for rows.Next() {
		var item TaxonomyItem
		_ = rows.Scan(&item.ID, &item.Name)
		list = append(list, item)
	}
	return list, nil
}

// ListCities returns all cities for a state.
func (s *Service) ListCities(ctx context.Context, stateID int64) ([]TaxonomyItem, error) {
	rows, err := s.pg.Pool.Query(ctx, "SELECT id, name FROM cities WHERE state_id = $1 ORDER BY name", stateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TaxonomyItem
	for rows.Next() {
		var item TaxonomyItem
		_ = rows.Scan(&item.ID, &item.Name)
		list = append(list, item)
	}
	return list, nil
}

// ListReligions returns all religions.
func (s *Service) ListReligions(ctx context.Context) ([]TaxonomyItem, error) {
	rows, err := s.pg.Pool.Query(ctx, "SELECT id, name FROM religions ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TaxonomyItem
	for rows.Next() {
		var item TaxonomyItem
		_ = rows.Scan(&item.ID, &item.Name)
		list = append(list, item)
	}
	return list, nil
}

// ListSects returns all sects for a religion.
func (s *Service) ListSects(ctx context.Context, religionID int64) ([]TaxonomyItem, error) {
	var rows pgx.Rows
	var err error
	if religionID > 0 {
		rows, err = s.pg.Pool.Query(ctx, "SELECT id, name FROM sects WHERE religion_id = $1 ORDER BY name", religionID)
	} else {
		rows, err = s.pg.Pool.Query(ctx, "SELECT id, name FROM sects ORDER BY name")
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TaxonomyItem
	for rows.Next() {
		var item TaxonomyItem
		_ = rows.Scan(&item.ID, &item.Name)
		list = append(list, item)
	}
	return list, nil
}

// ListCastes returns all castes for a religion.
func (s *Service) ListCastes(ctx context.Context, religionID int64) ([]TaxonomyItem, error) {
	var rows pgx.Rows
	var err error
	if religionID > 0 {
		rows, err = s.pg.Pool.Query(ctx, "SELECT id, name FROM castes WHERE religion_id = $1 ORDER BY name", religionID)
	} else {
		rows, err = s.pg.Pool.Query(ctx, "SELECT id, name FROM castes ORDER BY name")
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TaxonomyItem
	for rows.Next() {
		var item TaxonomyItem
		_ = rows.Scan(&item.ID, &item.Name)
		list = append(list, item)
	}
	return list, nil
}

// ListSpecialities returns all medical specialties.
func (s *Service) ListSpecialities(ctx context.Context) ([]TaxonomyItem, error) {
	rows, err := s.pg.Pool.Query(ctx, "SELECT id, name FROM specialities ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TaxonomyItem
	for rows.Next() {
		var item TaxonomyItem
		_ = rows.Scan(&item.ID, &item.Name)
		list = append(list, item)
	}
	return list, nil
}

func calculateAge(birthdayStr string) int {
	t, err := time.Parse("2006-01-02", birthdayStr)
	if err != nil {
		return 0
	}
	now := time.Now()
	age := now.Year() - t.Year()
	if now.YearDay() < t.YearDay() {
		age--
	}
	if age < 0 {
		return 0
	}
	return age
}
