use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::time::Instant;

/// Importance level for scoring factors
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ImportanceLevel {
    Dealbreaker,
    MustHave,
    NiceToHave,
    Flexible,
}

impl Default for ImportanceLevel {
    fn default() -> Self {
        Self::Flexible
    }
}

impl ImportanceLevel {
    #[inline(always)]
    pub fn multiplier(&self) -> f64 {
        match self {
            ImportanceLevel::Dealbreaker => 10.0,
            ImportanceLevel::MustHave => 4.0,
            ImportanceLevel::NiceToHave => 2.0,
            ImportanceLevel::Flexible => 1.0,
        }
    }
}

/// User-configured preference weights
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreferenceWeights {
    #[serde(default = "default_must_have")]
    pub age_weight: ImportanceLevel,
    #[serde(default = "default_dealbreaker")]
    pub religion_weight: ImportanceLevel,
    #[serde(default = "default_must_have")]
    pub location_weight: ImportanceLevel,
    #[serde(default = "default_dealbreaker")]
    pub marital_status_weight: ImportanceLevel,
    #[serde(default = "default_nice_to_have")]
    pub height_weight: ImportanceLevel,
    #[serde(default = "default_flexible")]
    pub language_caste_weight: ImportanceLevel,
}

fn default_must_have() -> ImportanceLevel {
    ImportanceLevel::MustHave
}
fn default_dealbreaker() -> ImportanceLevel {
    ImportanceLevel::Dealbreaker
}
fn default_nice_to_have() -> ImportanceLevel {
    ImportanceLevel::NiceToHave
}
fn default_flexible() -> ImportanceLevel {
    ImportanceLevel::Flexible
}

impl Default for PreferenceWeights {
    fn default() -> Self {
        Self {
            age_weight: ImportanceLevel::MustHave,
            religion_weight: ImportanceLevel::Dealbreaker,
            location_weight: ImportanceLevel::MustHave,
            marital_status_weight: ImportanceLevel::Dealbreaker,
            height_weight: ImportanceLevel::NiceToHave,
            language_caste_weight: ImportanceLevel::Flexible,
        }
    }
}

/// Partner expectations / seeker criteria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PartnerExpectations {
    #[serde(default)]
    pub user_id: i64,
    #[serde(default)]
    pub min_age: i32,
    #[serde(default)]
    pub max_age: i32,
    #[serde(default)]
    pub min_height: f64,
    #[serde(default)]
    pub max_height: f64,
    #[serde(default)]
    pub marital_status: Vec<String>,
    #[serde(default)]
    pub religion_id: i64,
    #[serde(default)]
    pub sect_ids: Vec<i64>,
    #[serde(default)]
    pub caste_ids: Vec<i64>,
    #[serde(default)]
    pub city_ids: Vec<i64>,
    #[serde(default)]
    pub country_ids: Vec<i64>,
    #[serde(default)]
    pub preferred_specialities: Vec<String>,
    #[serde(default)]
    pub weights: PreferenceWeights,
}

/// Travel mode configuration
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TravelMode {
    #[serde(default)]
    pub id: i64,
    #[serde(default)]
    pub user_id: i64,
    #[serde(default)]
    pub city_id: i64,
    #[serde(default)]
    pub city_name: String,
    #[serde(default)]
    pub country_id: i64,
    #[serde(default)]
    pub is_active: bool,
}

/// Candidate profile data required for matching
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CandidateProfile {
    pub user_id: i64,
    pub age: i32,
    #[serde(default)]
    pub religion_id: i64,
    #[serde(default)]
    pub religion_name: String,
    #[serde(default)]
    pub sect_id: i64,
    #[serde(default)]
    pub sect_name: String,
    #[serde(default)]
    pub caste_id: i64,
    #[serde(default)]
    pub caste_name: String,
    #[serde(default)]
    pub city_id: i64,
    #[serde(default)]
    pub city_name: String,
    #[serde(default)]
    pub state_id: i64,
    #[serde(default)]
    pub country_id: i64,
    #[serde(default)]
    pub country_name: String,
    #[serde(default)]
    pub marital_status: String,
    #[serde(default)]
    pub height: f64,
    #[serde(default)]
    pub degree: String,
    #[serde(default)]
    pub speciality: String,
    #[serde(default)]
    pub active_travel: Option<TravelMode>,
}

/// Granular 6-factor score breakdown
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ScoreBreakdown {
    pub age_score: f64,
    pub religion_score: f64,
    pub location_score: f64,
    pub marital_status_score: f64,
    pub height_score: f64,
    pub language_caste_score: f64,
    pub total_score: f64,
    pub dealbreaker_violated: bool,
}

/// Candidate match scoring result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoredCandidate {
    pub candidate_id: i64,
    pub total_score: f64,
    pub dealbreaker_violated: bool,
    pub breakdown: ScoreBreakdown,
}

/// Batch score request payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchScoreRequest {
    pub seeker_expectations: PartnerExpectations,
    #[serde(default)]
    pub seeker_travel: Option<TravelMode>,
    pub candidates: Vec<CandidateProfile>,
    #[serde(default = "default_min_score")]
    pub min_score: f64,
    #[serde(default)]
    pub exclude_dealbreakers: bool,
    #[serde(default = "default_limit")]
    pub limit: usize,
}

fn default_min_score() -> f64 {
    0.0
}

fn default_limit() -> usize {
    100
}

/// Batch score response payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchScoreResponse {
    pub success: bool,
    pub total_candidates: usize,
    pub matched_candidates: usize,
    pub computation_time_us: u64,
    pub computation_time_ms: f64,
    pub results: Vec<ScoredCandidate>,
}

/// Compatibility Matrix Request (N seekers x M candidates)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatrixScoreRequest {
    pub seekers: Vec<PartnerExpectations>,
    pub candidates: Vec<CandidateProfile>,
}

/// Compatibility Matrix Response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatrixScoreResponse {
    pub success: bool,
    pub seekers_count: usize,
    pub candidates_count: usize,
    pub total_scores_computed: usize,
    pub computation_time_us: u64,
    pub computation_time_ms: f64,
    /// 2D Matrix of scores: matrix[seeker_idx][candidate_idx]
    pub score_matrix: Vec<Vec<f64>>,
}

// ---------------------------------------------------------------------------
// Core Scoring Algorithm (Vectorized & Zero-Allocation Path)
// ---------------------------------------------------------------------------

/// Fast round to 1 decimal place
#[inline(always)]
fn round1(val: f64) -> f64 {
    (val * 10.0).round() / 10.0
}

/// Internal optimized representation of seeker expectations for batch processing
pub struct CompiledSeekerExpectations<'a> {
    pub min_age: i32,
    pub max_age: i32,
    pub min_height: f64,
    pub max_height: f64,
    pub marital_status_lower: Vec<String>,
    pub religion_id: i64,
    pub sect_ids: &'a [i64],
    pub caste_ids: &'a [i64],
    pub city_ids: &'a [i64],
    pub country_ids: &'a [i64],
    pub preferred_specialities_lower: Vec<String>,
    pub weights: &'a PreferenceWeights,
    pub w_age: f64,
    pub w_rel: f64,
    pub w_loc: f64,
    pub w_mar: f64,
    pub w_hgt: f64,
    pub w_cas: f64,
    pub total_weights: f64,
}

impl<'a> CompiledSeekerExpectations<'a> {
    pub fn new(exp: &'a PartnerExpectations) -> Self {
        let min_age = if exp.min_age <= 0 && exp.max_age <= 0 {
            0
        } else if exp.min_age <= 0 {
            18
        } else {
            exp.min_age
        };

        let max_age = if exp.min_age <= 0 && exp.max_age <= 0 {
            0
        } else if exp.max_age <= 0 {
            70
        } else {
            exp.max_age
        };

        let min_height = if exp.min_height <= 0.0 && exp.max_height <= 0.0 {
            0.0
        } else if exp.min_height <= 0.0 {
            4.0
        } else {
            exp.min_height
        };

        let max_height = if exp.min_height <= 0.0 && exp.max_height <= 0.0 {
            0.0
        } else if exp.max_height <= 0.0 {
            7.0
        } else {
            exp.max_height
        };

        let marital_status_lower = exp
            .marital_status
            .iter()
            .map(|s| s.to_lowercase())
            .collect();

        let preferred_specialities_lower = exp
            .preferred_specialities
            .iter()
            .map(|s| s.to_lowercase())
            .collect();

        let w_age = exp.weights.age_weight.multiplier();
        let w_rel = exp.weights.religion_weight.multiplier();
        let w_loc = exp.weights.location_weight.multiplier();
        let w_mar = exp.weights.marital_status_weight.multiplier();
        let w_hgt = exp.weights.height_weight.multiplier();
        let w_cas = exp.weights.language_caste_weight.multiplier();
        let total_weights = w_age + w_rel + w_loc + w_mar + w_hgt + w_cas;

        Self {
            min_age,
            max_age,
            min_height,
            max_height,
            marital_status_lower,
            religion_id: exp.religion_id,
            sect_ids: &exp.sect_ids,
            caste_ids: &exp.caste_ids,
            city_ids: &exp.city_ids,
            country_ids: &exp.country_ids,
            preferred_specialities_lower,
            weights: &exp.weights,
            w_age,
            w_rel,
            w_loc,
            w_mar,
            w_hgt,
            w_cas,
            total_weights,
        }
    }

    #[inline(always)]
    pub fn score_candidate(&self, candidate: &CandidateProfile) -> ScoreBreakdown {
        // 1. Age Factor Score (0 - 100)
        let age_score = if self.min_age > 0 || self.max_age > 0 {
            let min_a = self.min_age;
            let max_a = self.max_age;
            if candidate.age >= min_a && candidate.age <= max_a {
                100.0
            } else if candidate.age < min_a {
                let diff = (min_a - candidate.age) as f64;
                (100.0 - (diff * 20.0)).max(0.0)
            } else {
                let diff = (candidate.age - max_a) as f64;
                (100.0 - (diff * 20.0)).max(0.0)
            }
        } else {
            100.0
        };

        // 2. Religion & Sect Factor Score (0 - 100)
        let religion_score = if self.religion_id > 0 {
            if candidate.religion_id == self.religion_id {
                if !self.sect_ids.is_empty() {
                    let sect_matched = self.sect_ids.iter().any(|&sid| sid == candidate.sect_id);
                    if sect_matched {
                        100.0
                    } else if candidate.sect_id > 0 {
                        50.0 // partial match: same religion, different sect
                    } else {
                        100.0
                    }
                } else {
                    100.0
                }
            } else {
                0.0
            }
        } else {
            100.0
        };

        // 3. Location Factor Score (0 - 100)
        let (cand_city_id, cand_country_id) = match &candidate.active_travel {
            Some(t) if t.is_active => (t.city_id, t.country_id),
            _ => (candidate.city_id, candidate.country_id),
        };

        let location_score = if !self.city_ids.is_empty() || !self.country_ids.is_empty() {
            let city_matched = self.city_ids.iter().any(|&cid| cid == cand_city_id);
            if city_matched {
                100.0
            } else {
                let country_matched = self.country_ids.iter().any(|&coid| coid == cand_country_id);
                if country_matched {
                    60.0 // same country, different city
                } else if !self.country_ids.is_empty() {
                    10.0 // different country
                } else {
                    100.0
                }
            }
        } else {
            100.0
        };

        // 4. Marital Status Factor Score (0 - 100)
        let marital_score = if !self.marital_status_lower.is_empty() && !candidate.marital_status.is_empty() {
            let cand_status_lower = candidate.marital_status.to_lowercase();
            let matched = self.marital_status_lower.iter().any(|s| s == &cand_status_lower);
            if matched {
                100.0
            } else {
                0.0
            }
        } else {
            100.0
        };

        // 5. Height Factor Score (0 - 100)
        let height_score = if self.min_height > 0.0 || self.max_height > 0.0 {
            let min_h = self.min_height;
            let max_h = self.max_height;
            if candidate.height >= min_h && candidate.height <= max_h {
                100.0
            } else if candidate.height < min_h {
                let diff = min_h - candidate.height;
                (100.0 - (diff * 50.0)).max(0.0)
            } else {
                let diff = candidate.height - max_h;
                (100.0 - (diff * 50.0)).max(0.0)
            }
        } else {
            100.0
        };

        // 6. Language, Caste / Biradari & Medical Speciality Score (0 - 100)
        let caste_matched = if !self.caste_ids.is_empty() {
            self.caste_ids.iter().any(|&cid| cid == candidate.caste_id)
        } else {
            true
        };

        let med_matched = if !self.preferred_specialities_lower.is_empty() {
            let spec_lower = candidate.speciality.to_lowercase();
            let deg_lower = candidate.degree.to_lowercase();
            self.preferred_specialities_lower
                .iter()
                .any(|pref| spec_lower.contains(pref) || deg_lower.contains(pref))
        } else {
            true
        };

        let caste_and_med_score = if caste_matched && med_matched {
            100.0
        } else if caste_matched || med_matched {
            60.0
        } else if !self.caste_ids.is_empty() || !self.preferred_specialities_lower.is_empty() {
            20.0
        } else {
            100.0
        };

        // Dealbreaker check:
        // If any factor marked as "dealbreaker" scores < 40, dealbreaker is violated.
        let dealbreaker_violated = (self.weights.age_weight == ImportanceLevel::Dealbreaker && age_score < 40.0)
            || (self.weights.religion_weight == ImportanceLevel::Dealbreaker && religion_score < 40.0)
            || (self.weights.location_weight == ImportanceLevel::Dealbreaker && location_score < 40.0)
            || (self.weights.marital_status_weight == ImportanceLevel::Dealbreaker && marital_score < 40.0)
            || (self.weights.height_weight == ImportanceLevel::Dealbreaker && height_score < 40.0)
            || (self.weights.language_caste_weight == ImportanceLevel::Dealbreaker && caste_and_med_score < 40.0);

        // Compute weighted average
        let total_weighted_score = (age_score * self.w_age)
            + (religion_score * self.w_rel)
            + (location_score * self.w_loc)
            + (marital_score * self.w_mar)
            + (height_score * self.w_hgt)
            + (caste_and_med_score * self.w_cas);

        let mut composite_score = if self.total_weights > 0.0 {
            total_weighted_score / self.total_weights
        } else {
            0.0
        };

        if dealbreaker_violated {
            // Heavily penalize if dealbreaker is violated
            composite_score = (composite_score * 0.2).min(35.0);
        }

        ScoreBreakdown {
            age_score: round1(age_score),
            religion_score: round1(religion_score),
            location_score: round1(location_score),
            marital_status_score: round1(marital_score),
            height_score: round1(height_score),
            language_caste_score: round1(caste_and_med_score),
            total_score: round1(composite_score),
            dealbreaker_violated,
        }
    }
}

/// Calculate compatibility score between a single seeker and candidate
pub fn calculate_compatibility(
    seeker_exp: &PartnerExpectations,
    candidate: &CandidateProfile,
) -> ScoreBreakdown {
    let compiled = CompiledSeekerExpectations::new(seeker_exp);
    compiled.score_candidate(candidate)
}

/// Batch score candidates with vectorized / parallel Rayon acceleration
pub fn batch_score_candidates(req: BatchScoreRequest) -> BatchScoreResponse {
    let start = Instant::now();
    let total_candidates = req.candidates.len();

    let compiled = CompiledSeekerExpectations::new(&req.seeker_expectations);

    // Use Rayon parallel processing for batches of 100+ candidates, sequential for small sets
    let mut scored_results: Vec<ScoredCandidate> = if total_candidates >= 100 {
        req.candidates
            .par_iter()
            .map(|cand| {
                let breakdown = compiled.score_candidate(cand);
                ScoredCandidate {
                    candidate_id: cand.user_id,
                    total_score: breakdown.total_score,
                    dealbreaker_violated: breakdown.dealbreaker_violated,
                    breakdown,
                }
            })
            .filter(|sc| {
                if req.exclude_dealbreakers && sc.dealbreaker_violated {
                    return false;
                }
                sc.total_score >= req.min_score
            })
            .collect()
    } else {
        req.candidates
            .iter()
            .map(|cand| {
                let breakdown = compiled.score_candidate(cand);
                ScoredCandidate {
                    candidate_id: cand.user_id,
                    total_score: breakdown.total_score,
                    dealbreaker_violated: breakdown.dealbreaker_violated,
                    breakdown,
                }
            })
            .filter(|sc| {
                if req.exclude_dealbreakers && sc.dealbreaker_violated {
                    return false;
                }
                sc.total_score >= req.min_score
            })
            .collect()
    };

    // Sort descending by total score
    scored_results.sort_by(|a, b| {
        b.total_score
            .partial_cmp(&a.total_score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let matched_candidates = scored_results.len();

    // Apply limit
    if req.limit > 0 && scored_results.len() > req.limit {
        scored_results.truncate(req.limit);
    }

    let elapsed = start.elapsed();
    let elapsed_us = elapsed.as_micros() as u64;
    let elapsed_ms = (elapsed.as_nanos() as f64) / 1_000_000.0;

    BatchScoreResponse {
        success: true,
        total_candidates,
        matched_candidates,
        computation_time_us: elapsed_us,
        computation_time_ms: round1(elapsed_ms * 100.0) / 100.0,
        results: scored_results,
    }
}

/// Computes an N x M compatibility matrix across seekers and candidate profiles
pub fn compute_matrix_scores(req: MatrixScoreRequest) -> MatrixScoreResponse {
    let start = Instant::now();
    let seekers_count = req.seekers.len();
    let candidates_count = req.candidates.len();
    let total_scores_computed = seekers_count * candidates_count;

    let compiled_seekers: Vec<CompiledSeekerExpectations> = req
        .seekers
        .iter()
        .map(CompiledSeekerExpectations::new)
        .collect();

    // Parallelize over seekers
    let score_matrix: Vec<Vec<f64>> = compiled_seekers
        .par_iter()
        .map(|seeker| {
            req.candidates
                .iter()
                .map(|cand| seeker.score_candidate(cand).total_score)
                .collect()
        })
        .collect();

    let elapsed = start.elapsed();
    let elapsed_us = elapsed.as_micros() as u64;
    let elapsed_ms = (elapsed.as_nanos() as f64) / 1_000_000.0;

    MatrixScoreResponse {
        success: true,
        seekers_count,
        candidates_count,
        total_scores_computed,
        computation_time_us: elapsed_us,
        computation_time_ms: round1(elapsed_ms * 100.0) / 100.0,
        score_matrix,
    }
}
