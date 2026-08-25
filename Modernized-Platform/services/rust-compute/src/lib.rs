pub mod hasher;
pub mod matcher;

pub use hasher::{
    calculate_hamming_distance, calculate_similarity_percentage, compare_photo_hashes,
    compute_dct_hash_128, compute_dct_hash_64, compute_gradient_hash_128, compute_gradient_hash_64,
    decode_image, decode_image_base64, process_image_hash, CompareHashesRequest,
    CompareHashesResponse, HashAlgorithm, HashBitSize, HashImageRequest, HashImageResponse,
    HasherError, SimilarityConfidence,
};

pub use matcher::{
    batch_score_candidates, calculate_compatibility, compute_matrix_scores, BatchScoreRequest,
    BatchScoreResponse, CandidateProfile, ImportanceLevel, MatrixScoreRequest, MatrixScoreResponse,
    PartnerExpectations, PreferenceWeights, ScoreBreakdown, ScoredCandidate, TravelMode,
};
