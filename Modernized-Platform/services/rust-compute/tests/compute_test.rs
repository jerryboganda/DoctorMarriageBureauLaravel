use doctormarriagebureau_compute::{
    batch_score_candidates, calculate_compatibility, calculate_hamming_distance,
    calculate_similarity_percentage, compare_photo_hashes, compute_dct_hash_128,
    compute_dct_hash_64, compute_gradient_hash_128, compute_gradient_hash_64,
    compute_matrix_scores, decode_image, process_image_hash, BatchScoreRequest,
    CandidateProfile, CompareHashesRequest, HashAlgorithm, HashBitSize, HashImageRequest,
    ImportanceLevel, MatrixScoreRequest, PartnerExpectations, PreferenceWeights,
    SimilarityConfidence, TravelMode,
};
use image::{ImageBuffer, Rgb};
use std::time::Instant;

/// Helper to generate a synthetic test RGB image buffer (e.g. gradient or pattern)
fn create_test_image(width: u32, height: u32, offset: u8) -> Vec<u8> {
    let mut imgbuf = ImageBuffer::new(width, height);
    for (x, y, pixel) in imgbuf.enumerate_pixels_mut() {
        let r = (((x ^ y) * 23).wrapping_add(offset as u32)) as u8;
        let g = (((x.wrapping_mul(7) + y.wrapping_mul(13))).wrapping_add(offset as u32)) as u8;
        let b = ((((x + y) * 31) % 256).wrapping_add(offset as u32)) as u8;
        *pixel = Rgb([r, g, b]);
    }

    let mut png_bytes = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut png_bytes);
    image::DynamicImage::ImageRgb8(imgbuf)
        .write_to(&mut cursor, image::ImageOutputFormat::Png)
        .expect("Failed to encode test png");
    png_bytes
}

/// Helper to generate a candidate doctor profile for testing
fn create_candidate(
    id: i64,
    age: i32,
    religion_id: i64,
    sect_id: i64,
    caste_id: i64,
    city_id: i64,
    country_id: i64,
    marital_status: &str,
    height: f64,
    degree: &str,
    speciality: &str,
) -> CandidateProfile {
    CandidateProfile {
        user_id: id,
        age,
        religion_id,
        religion_name: "Islam".to_string(),
        sect_id,
        sect_name: "Sunni".to_string(),
        caste_id,
        caste_name: "Syed".to_string(),
        city_id,
        city_name: "Lahore".to_string(),
        state_id: 1,
        country_id,
        country_name: "Pakistan".to_string(),
        marital_status: marital_status.to_string(),
        height,
        degree: degree.to_string(),
        speciality: speciality.to_string(),
        active_travel: None,
    }
}

/// Helper to generate seeker expectations
fn create_seeker_expectations() -> PartnerExpectations {
    PartnerExpectations {
        user_id: 100,
        min_age: 26,
        max_age: 32,
        min_height: 5.2,
        max_height: 5.8,
        marital_status: vec!["Never Married".to_string()],
        religion_id: 1, // Islam
        sect_ids: vec![1], // Sunni
        caste_ids: vec![10], // Syed
        city_ids: vec![1], // Lahore
        country_ids: vec![1], // Pakistan
        preferred_specialities: vec!["Cardiology".to_string(), "FCPS".to_string()],
        weights: PreferenceWeights {
            age_weight: ImportanceLevel::MustHave,
            religion_weight: ImportanceLevel::Dealbreaker,
            location_weight: ImportanceLevel::MustHave,
            marital_status_weight: ImportanceLevel::Dealbreaker,
            height_weight: ImportanceLevel::NiceToHave,
            language_caste_weight: ImportanceLevel::Flexible,
        },
    }
}

#[test]
fn test_image_hashing_dct_and_gradient() {
    let img_bytes = create_test_image(64, 64, 0);
    let dyn_img = decode_image(&img_bytes).expect("Failed to decode synthetic image");

    // Test DCT 64-bit and 128-bit
    let hash_dct_64 = compute_dct_hash_64(&dyn_img);
    let hash_dct_128 = compute_dct_hash_128(&dyn_img);

    assert_ne!(hash_dct_64, 0, "DCT 64-bit hash should not be 0");
    assert_ne!(hash_dct_128, 0, "DCT 128-bit hash should not be 0");

    // Test Gradient 64-bit and 128-bit
    let hash_grad_64 = compute_gradient_hash_64(&dyn_img);
    let hash_grad_128 = compute_gradient_hash_128(&dyn_img);

    assert_ne!(hash_grad_64, 0, "Gradient 64-bit hash should not be 0");
    assert_ne!(hash_grad_128, 0, "Gradient 128-bit hash should not be 0");

    // Verify determinism
    let hash_dct_64_repeat = compute_dct_hash_64(&dyn_img);
    assert_eq!(hash_dct_64, hash_dct_64_repeat, "Hash must be deterministic");
}

#[test]
fn test_process_image_hash_handler() {
    let img_bytes = create_test_image(128, 128, 10);
    let req = HashImageRequest {
        image_base64: None,
        image_bytes: Some(img_bytes),
        algorithm: HashAlgorithm::Dct,
        bit_size: HashBitSize::Bits64,
    };

    let resp = process_image_hash(req).expect("Failed to process image hash");
    assert!(resp.success);
    assert_eq!(resp.bit_size, 64);
    assert_eq!(resp.hash_hex.len(), 16);
    assert!(resp.hash_u64.is_some());
    assert_eq!(resp.image_width, 128);
    assert_eq!(resp.image_height, 128);
}

#[test]
fn test_hamming_distance_and_duplicate_detection() {
    let hash1 = "ffff0000ffff0000";
    let hash2 = "ffff0000ffff0000"; // Identical
    let hash3 = "ffff0000ffff0001"; // 1 bit diff
    let hash4 = "0000ffff0000ffff"; // Inverted

    let dist_identical = calculate_hamming_distance(hash1, hash2).unwrap();
    assert_eq!(dist_identical, 0);

    let sim_identical = calculate_similarity_percentage(dist_identical, 64);
    assert_eq!(sim_identical, 100.0);

    let dist_1bit = calculate_hamming_distance(hash1, hash3).unwrap();
    assert_eq!(dist_1bit, 1);

    let dist_inverted = calculate_hamming_distance(hash1, hash4).unwrap();
    assert_eq!(dist_inverted, 64);

    let sim_inverted = calculate_similarity_percentage(dist_inverted, 64);
    assert_eq!(sim_inverted, 0.0);

    // Test duplicate comparison request
    let comp_req = CompareHashesRequest {
        hash_a: hash1.to_string(),
        hash_b: hash3.to_string(),
        threshold: 10,
    };

    let comp_resp = compare_photo_hashes(comp_req).unwrap();
    assert!(comp_resp.is_duplicate);
    assert_eq!(comp_resp.confidence, SimilarityConfidence::NearDuplicate);
    assert_eq!(comp_resp.hamming_distance, 1);
}

#[test]
fn test_single_candidate_scoring_perfect_match() {
    let seeker = create_seeker_expectations();
    let perfect_candidate = create_candidate(
        1, 28, 1, 1, 10, 1, 1, "Never Married", 5.5, "FCPS", "Cardiology",
    );

    let breakdown = calculate_compatibility(&seeker, &perfect_candidate);
    assert_eq!(breakdown.age_score, 100.0);
    assert_eq!(breakdown.religion_score, 100.0);
    assert_eq!(breakdown.location_score, 100.0);
    assert_eq!(breakdown.marital_status_score, 100.0);
    assert_eq!(breakdown.height_score, 100.0);
    assert_eq!(breakdown.language_caste_score, 100.0);
    assert_eq!(breakdown.total_score, 100.0);
    assert!(!breakdown.dealbreaker_violated);
}

#[test]
fn test_dealbreaker_violation_penalty() {
    let seeker = create_seeker_expectations();
    // Candidate has different religion (Religion is Dealbreaker)
    let candidate = create_candidate(
        2, 28, 2, 0, 10, 1, 1, "Never Married", 5.5, "FCPS", "Cardiology",
    );

    let breakdown = calculate_compatibility(&seeker, &candidate);
    assert_eq!(breakdown.religion_score, 0.0);
    assert!(breakdown.dealbreaker_violated);
    // When dealbreaker is violated, total score is capped/penalized <= 35.0
    assert!(breakdown.total_score <= 35.0);
}

#[test]
fn test_travel_mode_location_override() {
    let seeker = create_seeker_expectations();
    let mut candidate = create_candidate(
        3, 28, 1, 1, 10, 999, 1, "Never Married", 5.5, "FCPS", "Cardiology",
    );

    // Default city is 999 (Different city in Pakistan: 60%)
    let b1 = calculate_compatibility(&seeker, &candidate);
    assert_eq!(b1.location_score, 60.0);

    // Activate travel mode to Lahore (City ID 1: 100%)
    candidate.active_travel = Some(TravelMode {
        id: 1,
        user_id: 3,
        city_id: 1,
        city_name: "Lahore".to_string(),
        country_id: 1,
        is_active: true,
    });

    let b2 = calculate_compatibility(&seeker, &candidate);
    assert_eq!(b2.location_score, 100.0);
}

#[test]
fn test_batch_scoring_performance_and_latency() {
    let seeker = create_seeker_expectations();

    // Generate 5,000 candidate doctor profiles
    let mut candidates = Vec::with_capacity(5000);
    for i in 0..5000 {
        let age = 22 + (i % 20) as i32;
        let religion_id = if i % 10 == 0 { 2 } else { 1 };
        let sect_id = if i % 2 == 0 { 1 } else { 2 };
        let caste_id = if i % 5 == 0 { 10 } else { 20 };
        let city_id = if i % 3 == 0 { 1 } else { 2 };
        let marital = if i % 4 == 0 { "Divorced" } else { "Never Married" };
        let height = 5.0 + ((i % 15) as f64 * 0.1);
        let spec = if i % 3 == 0 { "Cardiology" } else { "Pediatrics" };

        candidates.push(create_candidate(
            i as i64, age, religion_id, sect_id, caste_id, city_id, 1, marital, height, "MBBS", spec,
        ));
    }

    let req = BatchScoreRequest {
        seeker_expectations: seeker,
        seeker_travel: None,
        candidates,
        min_score: 50.0,
        exclude_dealbreakers: true,
        limit: 100,
    };

    let start = Instant::now();
    let resp = batch_score_candidates(req);
    let duration = start.elapsed();

    assert!(resp.success);
    assert_eq!(resp.total_candidates, 5000);
    assert!(resp.matched_candidates > 0);
    assert!(resp.results.len() <= 100);

    // Ensure sorted descending
    for i in 1..resp.results.len() {
        assert!(resp.results[i - 1].total_score >= resp.results[i].total_score);
    }

    println!(
        "Batch score for 5,000 candidates completed in: {:?} (service recorded: {} µs / {:.2} ms)",
        duration, resp.computation_time_us, resp.computation_time_ms
    );

    // Vectorized Rayon engine should process 5,000 candidates with high throughput
    assert!(
        resp.computation_time_ms < 500.0,
        "Vectorized batch scoring must be fast"
    );
}

#[test]
fn test_matrix_scoring_multiple_seekers_candidates() {
    let mut seekers = Vec::new();
    for i in 0..10 {
        let mut exp = create_seeker_expectations();
        exp.user_id = 1000 + i;
        exp.min_age = 24 + i as i32;
        seekers.push(exp);
    }

    let mut candidates = Vec::new();
    for i in 0..50 {
        candidates.push(create_candidate(
            i as i64,
            26 + (i % 8) as i32,
            1,
            1,
            10,
            1,
            1,
            "Never Married",
            5.4,
            "FCPS",
            "Cardiology",
        ));
    }

    let req = MatrixScoreRequest {
        seekers,
        candidates,
    };

    let resp = compute_matrix_scores(req);
    assert!(resp.success);
    assert_eq!(resp.seekers_count, 10);
    assert_eq!(resp.candidates_count, 50);
    assert_eq!(resp.total_scores_computed, 500);
    assert_eq!(resp.score_matrix.len(), 10);
    assert_eq!(resp.score_matrix[0].len(), 50);
}
