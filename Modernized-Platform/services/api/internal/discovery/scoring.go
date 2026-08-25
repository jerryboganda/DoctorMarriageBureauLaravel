package discovery

import (
	"math"
	"strings"

	"github.com/doctormarriagebureau/api/internal/models"
)

// CandidateProfile represents profile fields required for scoring.
type CandidateProfile struct {
	UserID        int64
	Age           int
	ReligionID    int64
	ReligionName  string
	SectID        int64
	SectName      string
	CasteID       int64
	CasteName     string
	CityID        int64
	CityName      string
	StateID       int64
	CountryID     int64
	CountryName   string
	MaritalStatus string
	Height        float64 // feet or cm
	Degree        string  // MBBS, FCPS, MD, BDS, etc.
	Speciality    string  // Cardiology, Pediatrics, General Surgery, etc.
	ActiveTravel  *models.TravelMode
}

// FactorWeights maps importance string to numerical multiplier.
func getWeightMultiplier(weight models.ImportanceLevel) float64 {
	switch weight {
	case models.ImportanceDealbreaker:
		return 10.0
	case models.ImportanceMustHave:
		return 4.0
	case models.ImportanceNiceToHave:
		return 2.0
	case models.ImportanceFlexible:
		fallthrough
	default:
		return 1.0
	}
}

// CalculateCompatibility calculates the 6-factor weighted compatibility score (0 - 100%).
func CalculateCompatibility(seekerExp *models.PartnerExpectations, candidate *CandidateProfile, seekerTravel *models.TravelMode) models.ScoreBreakdownDTO {
	if seekerExp == nil || candidate == nil {
		return models.ScoreBreakdownDTO{TotalScore: 0}
	}

	weights := seekerExp.Weights
	// Defaults if not set
	if weights.AgeWeight == "" {
		weights.AgeWeight = models.ImportanceMustHave
	}
	if weights.ReligionWeight == "" {
		weights.ReligionWeight = models.ImportanceDealbreaker
	}
	if weights.LocationWeight == "" {
		weights.LocationWeight = models.ImportanceMustHave
	}
	if weights.MaritalStatusWeight == "" {
		weights.MaritalStatusWeight = models.ImportanceDealbreaker
	}
	if weights.HeightWeight == "" {
		weights.HeightWeight = models.ImportanceNiceToHave
	}
	if weights.LanguageCasteWeight == "" {
		weights.LanguageCasteWeight = models.ImportanceFlexible
	}

	// 1. Age Factor Score (0 - 100)
	ageScore := 100.0
	if seekerExp.MinAge > 0 || seekerExp.MaxAge > 0 {
		minA := seekerExp.MinAge
		if minA <= 0 {
			minA = 18
		}
		maxA := seekerExp.MaxAge
		if maxA <= 0 {
			maxA = 70
		}
		if candidate.Age >= minA && candidate.Age <= maxA {
			ageScore = 100.0
		} else if candidate.Age < minA {
			diff := float64(minA - candidate.Age)
			ageScore = math.Max(0, 100.0-(diff*20.0))
		} else {
			diff := float64(candidate.Age - maxA)
			ageScore = math.Max(0, 100.0-(diff*20.0))
		}
	}

	// 2. Religion & Sect Factor Score (0 - 100)
	religionScore := 100.0
	if seekerExp.ReligionID > 0 {
		if candidate.ReligionID == seekerExp.ReligionID {
			religionScore = 100.0
			// If sects specified
			if len(seekerExp.SectIDs) > 0 {
				sectMatched := false
				for _, sid := range seekerExp.SectIDs {
					if sid == candidate.SectID {
						sectMatched = true
						break
					}
				}
				if !sectMatched && candidate.SectID > 0 {
					religionScore = 50.0 // partial match: same religion, different sect
				}
			}
		} else {
			religionScore = 0.0
		}
	}

	// 3. Location Factor Score (0 - 100)
	// Consider travel mode overrides
	candCityID := candidate.CityID
	candCountryID := candidate.CountryID
	if candidate.ActiveTravel != nil && candidate.ActiveTravel.IsActive {
		candCityID = candidate.ActiveTravel.CityID
		candCountryID = candidate.ActiveTravel.CountryID
	}

	locationScore := 100.0
	if len(seekerExp.CityIDs) > 0 || len(seekerExp.CountryIDs) > 0 {
		cityMatched := false
		for _, cid := range seekerExp.CityIDs {
			if cid == candCityID {
				cityMatched = true
				break
			}
		}

		if cityMatched {
			locationScore = 100.0
		} else {
			countryMatched := false
			for _, coid := range seekerExp.CountryIDs {
				if coid == candCountryID {
					countryMatched = true
					break
				}
			}
			if countryMatched {
				locationScore = 60.0 // same country, different city
			} else if len(seekerExp.CountryIDs) > 0 {
				locationScore = 10.0 // different country
			}
		}
	}

	// 4. Marital Status Factor Score (0 - 100)
	maritalScore := 100.0
	if len(seekerExp.MaritalStatus) > 0 && candidate.MaritalStatus != "" {
		matched := false
		for _, ms := range seekerExp.MaritalStatus {
			if strings.EqualFold(ms, candidate.MaritalStatus) {
				matched = true
				break
			}
		}
		if matched {
			maritalScore = 100.0
		} else {
			maritalScore = 0.0
		}
	}

	// 5. Height Factor Score (0 - 100)
	heightScore := 100.0
	if seekerExp.MinHeight > 0 || seekerExp.MaxHeight > 0 {
		minH := seekerExp.MinHeight
		maxH := seekerExp.MaxHeight
		if minH <= 0 {
			minH = 4.0
		}
		if maxH <= 0 {
			maxH = 7.0
		}
		if candidate.Height >= minH && candidate.Height <= maxH {
			heightScore = 100.0
		} else if candidate.Height < minH {
			diff := minH - candidate.Height
			heightScore = math.Max(0, 100.0-(diff*50.0))
		} else {
			diff := candidate.Height - maxH
			heightScore = math.Max(0, 100.0-(diff*50.0))
		}
	}

	// 6. Language, Caste / Biradari & Medical Speciality Score (0 - 100)
	casteAndMedScore := 100.0
	casteMatched := true
	if len(seekerExp.CasteIDs) > 0 {
		casteMatched = false
		for _, cid := range seekerExp.CasteIDs {
			if cid == candidate.CasteID {
				casteMatched = true
				break
			}
		}
	}

	medMatched := true
	if len(seekerExp.PreferredSpecialities) > 0 {
		medMatched = false
		for _, pref := range seekerExp.PreferredSpecialities {
			if strings.Contains(strings.ToLower(candidate.Speciality), strings.ToLower(pref)) ||
				strings.Contains(strings.ToLower(candidate.Degree), strings.ToLower(pref)) {
				medMatched = true
				break
			}
		}
	}

	if casteMatched && medMatched {
		casteAndMedScore = 100.0
	} else if casteMatched || medMatched {
		casteAndMedScore = 60.0
	} else if len(seekerExp.CasteIDs) > 0 || len(seekerExp.PreferredSpecialities) > 0 {
		casteAndMedScore = 20.0
	}

	// Dealbreaker check:
	// If any factor marked as "dealbreaker" scores < 40, dealbreaker is violated.
	dealbreakerViolated := false
	factors := []struct {
		score  float64
		weight models.ImportanceLevel
	}{
		{ageScore, weights.AgeWeight},
		{religionScore, weights.ReligionWeight},
		{locationScore, weights.LocationWeight},
		{maritalScore, weights.MaritalStatusWeight},
		{heightScore, weights.HeightWeight},
		{casteAndMedScore, weights.LanguageCasteWeight},
	}

	for _, f := range factors {
		if f.weight == models.ImportanceDealbreaker && f.score < 40.0 {
			dealbreakerViolated = true
			break
		}
	}

	// Compute weighted average
	wAge := getWeightMultiplier(weights.AgeWeight)
	wRel := getWeightMultiplier(weights.ReligionWeight)
	wLoc := getWeightMultiplier(weights.LocationWeight)
	wMar := getWeightMultiplier(weights.MaritalStatusWeight)
	wHgt := getWeightMultiplier(weights.HeightWeight)
	wCas := getWeightMultiplier(weights.LanguageCasteWeight)

	totalWeightedScore := (ageScore * wAge) +
		(religionScore * wRel) +
		(locationScore * wLoc) +
		(maritalScore * wMar) +
		(heightScore * wHgt) +
		(casteAndMedScore * wCas)

	totalWeights := wAge + wRel + wLoc + wMar + wHgt + wCas
	compositeScore := totalWeightedScore / totalWeights

	if dealbreakerViolated {
		// Cap or penalize composite score heavily if dealbreaker is violated
		compositeScore = math.Min(compositeScore*0.2, 35.0)
	}

	return models.ScoreBreakdownDTO{
		AgeScore:           math.Round(ageScore*10) / 10,
		ReligionScore:      math.Round(religionScore*10) / 10,
		LocationScore:      math.Round(locationScore*10) / 10,
		MaritalStatusScore: math.Round(maritalScore*10) / 10,
		HeightScore:        math.Round(heightScore*10) / 10,
		LanguageCasteScore: math.Round(casteAndMedScore*10) / 10,
		TotalScore:         math.Round(compositeScore*10) / 10,
		DealbreakerViolated: dealbreakerViolated,
	}
}
