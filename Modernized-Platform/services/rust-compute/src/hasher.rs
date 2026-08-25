use image::{DynamicImage, GenericImageView};
use img_hash::{HashAlg, HasherConfig};
use serde::{Deserialize, Serialize};
use std::time::Instant;

/// Supported perceptual hash algorithms
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum HashAlgorithm {
    /// Discrete Cosine Transform perceptual hash (pHash)
    Dct,
    /// Difference / Gradient perceptual hash (dHash)
    Gradient,
    /// Double gradient hash
    DoubleGradient,
    /// Mean / Average perceptual hash (aHash)
    Mean,
    /// Block perceptual hash (bHash)
    Blockhash,
}

/// Bit size for perceptual hash output
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum HashBitSize {
    /// 64-bit hash (8x8 matrix)
    Bits64,
    /// 128-bit hash (16x8 or 8x16 matrix)
    Bits128,
    /// 256-bit hash (16x16 matrix)
    Bits256,
}

impl Default for HashBitSize {
    fn default() -> Self {
        Self::Bits64
    }
}

/// Image hash computation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashImageRequest {
    /// Base64-encoded image string OR raw image URL
    #[serde(default)]
    pub image_base64: Option<String>,
    /// Optional binary image bytes passed directly
    #[serde(skip)]
    pub image_bytes: Option<Vec<u8>>,
    /// Desired algorithm (defaults to DCT)
    #[serde(default = "default_algorithm")]
    pub algorithm: HashAlgorithm,
    /// Hash bit size (defaults to 64-bit)
    #[serde(default)]
    pub bit_size: HashBitSize,
}

fn default_algorithm() -> HashAlgorithm {
    HashAlgorithm::Dct
}

/// Hash computation output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashImageResponse {
    pub success: bool,
    pub algorithm: HashAlgorithm,
    pub bit_size: usize,
    pub hash_hex: String,
    pub hash_u64: Option<u64>,
    pub hash_u128: Option<u128>,
    pub execution_time_us: u64,
    pub image_width: u32,
    pub image_height: u32,
}

/// Hash comparison request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompareHashesRequest {
    pub hash_a: String,
    pub hash_b: String,
    /// Threshold distance to classify as duplicate (default: 10)
    #[serde(default = "default_threshold")]
    pub threshold: u32,
}

fn default_threshold() -> u32 {
    10
}

/// Hash comparison response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompareHashesResponse {
    pub hamming_distance: u32,
    pub similarity_percentage: f64,
    pub is_duplicate: bool,
    pub confidence: SimilarityConfidence,
    pub explanation: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SimilarityConfidence {
    Identical,
    NearDuplicate,
    PossibleVariant,
    Distinct,
}

#[derive(Debug)]
pub enum HasherError {
    ImageDecodeError(String),
    Base64DecodeError(String),
    InvalidHexError(String),
    LengthMismatchError(String),
}

impl std::fmt::Display for HasherError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ImageDecodeError(e) => write!(f, "Image decode failed: {}", e),
            Self::Base64DecodeError(e) => write!(f, "Base64 decode failed: {}", e),
            Self::InvalidHexError(e) => write!(f, "Invalid hex hash string: {}", e),
            Self::LengthMismatchError(e) => write!(f, "Hash length mismatch: {}", e),
        }
    }
}

impl std::error::Error for HasherError {}

// ---------------------------------------------------------------------------
// Image Hashing Implementation
// ---------------------------------------------------------------------------

/// Decodes an image from raw bytes with auto-format detection (PNG, JPEG, WebP)
pub fn decode_image(bytes: &[u8]) -> Result<DynamicImage, HasherError> {
    image::load_from_memory(bytes)
        .map_err(|e| HasherError::ImageDecodeError(e.to_string()))
}

/// Decodes an image from a base64 string (handles optional data URI prefix)
pub fn decode_image_base64(base64_str: &str) -> Result<DynamicImage, HasherError> {
    use base64::Engine;
    let clean_str = if let Some(idx) = base64_str.find(";base64,") {
        &base64_str[idx + 8..]
    } else {
        base64_str.trim()
    };

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(clean_str)
        .map_err(|e| HasherError::Base64DecodeError(e.to_string()))?;

    decode_image(&bytes)
}

/// Compute perceptual hash using standard DCT algorithm (pHash)
/// Resizes to 32x32 grayscale, computes 2D DCT, takes low-frequency 8x8 matrix,
/// computes median value, and produces 64-bit or 128-bit hash.
pub fn compute_dct_hash_64(img: &DynamicImage) -> u64 {
    let gray = img.resize_exact(32, 32, image::imageops::FilterType::Triangle).to_luma8();
    let mut matrix = [[0.0f64; 32]; 32];
    for y in 0..32 {
        for x in 0..32 {
            matrix[y][x] = gray.get_pixel(x as u32, y as u32)[0] as f64;
        }
    }

    // 2D Discrete Cosine Transform (DCT-II)
    let mut dct = [[0.0f64; 32]; 32];
    let pi = std::f64::consts::PI;

    for u in 0..8 {
        for v in 0..8 {
            let mut sum = 0.0f64;
            for x in 0..32 {
                for y in 0..32 {
                    let cos_x = ((2.0 * x as f64 + 1.0) * u as f64 * pi / 64.0).cos();
                    let cos_y = ((2.0 * y as f64 + 1.0) * v as f64 * pi / 64.0).cos();
                    sum += matrix[y][x] * cos_x * cos_y;
                }
            }
            let cu = if u == 0 { 1.0 / std::f64::consts::SQRT_2 } else { 1.0 };
            let cv = if v == 0 { 1.0 / std::f64::consts::SQRT_2 } else { 1.0 };
            dct[v][u] = 0.25 * cu * cv * sum;
        }
    }

    // Exclude DC component (0,0) when computing median of 8x8 low frequencies
    let mut values = Vec::with_capacity(64);
    for v in 0..8 {
        for u in 0..8 {
            if u != 0 || v != 0 {
                values.push(dct[v][u]);
            }
        }
    }
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median = values[values.len() / 2];

    let mut hash: u64 = 0;
    let mut bit = 0;
    for v in 0..8 {
        for u in 0..8 {
            if dct[v][u] > median {
                hash |= 1 << (63 - bit);
            }
            bit += 1;
        }
    }
    hash
}

/// Compute 128-bit DCT hash (16x8 matrix)
pub fn compute_dct_hash_128(img: &DynamicImage) -> u128 {
    let gray = img.resize_exact(32, 32, image::imageops::FilterType::Triangle).to_luma8();
    let mut matrix = [[0.0f64; 32]; 32];
    for y in 0..32 {
        for x in 0..32 {
            matrix[y][x] = gray.get_pixel(x as u32, y as u32)[0] as f64;
        }
    }

    let mut dct = [[0.0f64; 16]; 8];
    let pi = std::f64::consts::PI;

    for u in 0..16 {
        for v in 0..8 {
            let mut sum = 0.0f64;
            for x in 0..32 {
                for y in 0..32 {
                    let cos_x = ((2.0 * x as f64 + 1.0) * u as f64 * pi / 64.0).cos();
                    let cos_y = ((2.0 * y as f64 + 1.0) * v as f64 * pi / 64.0).cos();
                    sum += matrix[y][x] * cos_x * cos_y;
                }
            }
            let cu = if u == 0 { 1.0 / std::f64::consts::SQRT_2 } else { 1.0 };
            let cv = if v == 0 { 1.0 / std::f64::consts::SQRT_2 } else { 1.0 };
            dct[v][u] = 0.25 * cu * cv * sum;
        }
    }

    let mut values = Vec::with_capacity(128);
    for v in 0..8 {
        for u in 0..16 {
            if u != 0 || v != 0 {
                values.push(dct[v][u]);
            }
        }
    }
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median = values[values.len() / 2];

    let mut hash: u128 = 0;
    let mut bit = 0;
    for v in 0..8 {
        for u in 0..16 {
            if dct[v][u] > median {
                hash |= 1 << (127 - bit);
            }
            bit += 1;
        }
    }
    hash
}

/// Compute Gradient / Difference hash (dHash 64-bit)
/// Resizes to 9x8 grayscale, compares adjacent columns
pub fn compute_gradient_hash_64(img: &DynamicImage) -> u64 {
    let gray = img.resize_exact(9, 8, image::imageops::FilterType::Triangle).to_luma8();
    let mut hash: u64 = 0;
    let mut bit = 0;

    for y in 0..8 {
        for x in 0..8 {
            let left = gray.get_pixel(x as u32, y as u32)[0];
            let right = gray.get_pixel((x + 1) as u32, y as u32)[0];
            if left > right {
                hash |= 1 << (63 - bit);
            }
            bit += 1;
        }
    }
    hash
}

/// Compute Gradient / Difference hash (dHash 128-bit: 17x8)
pub fn compute_gradient_hash_128(img: &DynamicImage) -> u128 {
    let gray = img.resize_exact(17, 8, image::imageops::FilterType::Triangle).to_luma8();
    let mut hash: u128 = 0;
    let mut bit = 0;

    for y in 0..8 {
        for x in 0..16 {
            let left = gray.get_pixel(x as u32, y as u32)[0];
            let right = gray.get_pixel((x + 1) as u32, y as u32)[0];
            if left > right {
                hash |= 1 << (127 - bit);
            }
            bit += 1;
        }
    }
    hash
}

/// Compute perceptual hash using `img_hash` crate config
pub fn compute_img_hash_crate(
    img: &DynamicImage,
    alg: HashAlgorithm,
    bit_size: HashBitSize,
) -> (String, Vec<u8>) {
    let (w, h) = match bit_size {
        HashBitSize::Bits64 => (8, 8),
        HashBitSize::Bits128 => (16, 8),
        HashBitSize::Bits256 => (16, 16),
    };

    let hash_alg = match alg {
        HashAlgorithm::Gradient => HashAlg::Gradient,
        HashAlgorithm::DoubleGradient => HashAlg::DoubleGradient,
        HashAlgorithm::Mean => HashAlg::Mean,
        HashAlgorithm::Blockhash => HashAlg::Blockhash,
        HashAlgorithm::Dct => HashAlg::Gradient, // fallback to gradient if DCT not configured in img_hash
    };

    let hasher = HasherConfig::new()
        .hash_size(w, h)
        .hash_alg(hash_alg)
        .to_hasher();

    let hash = hasher.hash_image(img);
    let bytes = hash.as_bytes().to_vec();
    let hex_str = bytes_to_hex(&bytes);
    (hex_str, bytes)
}

/// Main entry point to hash an image with full metrics
pub fn process_image_hash(req: HashImageRequest) -> Result<HashImageResponse, HasherError> {
    let start = Instant::now();

    let img = if let Some(raw_bytes) = req.image_bytes {
        decode_image(&raw_bytes)?
    } else if let Some(base64_data) = req.image_base64 {
        decode_image_base64(&base64_data)?
    } else {
        return Err(HasherError::ImageDecodeError(
            "Neither raw bytes nor base64 data provided".to_string(),
        ));
    };

    let (width, height) = img.dimensions();

    let (hash_hex, hash_u64, hash_u128, bit_count) = match (req.algorithm, req.bit_size) {
        (HashAlgorithm::Dct, HashBitSize::Bits64) => {
            let h = compute_dct_hash_64(&img);
            (format!("{:016x}", h), Some(h), None, 64)
        }
        (HashAlgorithm::Dct, HashBitSize::Bits128) => {
            let h = compute_dct_hash_128(&img);
            (format!("{:032x}", h), None, Some(h), 128)
        }
        (HashAlgorithm::Gradient, HashBitSize::Bits64) => {
            let h = compute_gradient_hash_64(&img);
            (format!("{:016x}", h), Some(h), None, 64)
        }
        (HashAlgorithm::Gradient, HashBitSize::Bits128) => {
            let h = compute_gradient_hash_128(&img);
            (format!("{:032x}", h), None, Some(h), 128)
        }
        _ => {
            let (hex_str, bytes) = compute_img_hash_crate(&img, req.algorithm, req.bit_size);
            let bit_cnt = bytes.len() * 8;
            let u64_val = if bytes.len() == 8 {
                let mut arr = [0u8; 8];
                arr.copy_from_slice(&bytes[..8]);
                Some(u64::from_be_bytes(arr))
            } else {
                None
            };
            (hex_str, u64_val, None, bit_cnt)
        }
    };

    let elapsed = start.elapsed().as_micros() as u64;

    Ok(HashImageResponse {
        success: true,
        algorithm: req.algorithm,
        bit_size: bit_count,
        hash_hex,
        hash_u64,
        hash_u128,
        execution_time_us: elapsed,
        image_width: width,
        image_height: height,
    })
}

// ---------------------------------------------------------------------------
// Hamming Distance & Duplicate Doctor Photo Detection
// ---------------------------------------------------------------------------

/// Calculates Hamming distance between two 64-bit integers
#[inline]
pub fn hamming_distance_u64(a: u64, b: u64) -> u32 {
    (a ^ b).count_ones()
}

/// Calculates Hamming distance between two 128-bit integers
#[inline]
pub fn hamming_distance_u128(a: u128, b: u128) -> u32 {
    (a ^ b).count_ones()
}

/// Calculates Hamming distance between two byte slices
pub fn hamming_distance_bytes(a: &[u8], b: &[u8]) -> Result<u32, HasherError> {
    if a.len() != b.len() {
        return Err(HasherError::LengthMismatchError(format!(
            "Byte slices have different lengths: {} vs {}",
            a.len(),
            b.len()
        )));
    }

    let mut dist = 0u32;
    for (byte_a, byte_b) in a.iter().zip(b.iter()) {
        dist += (byte_a ^ byte_b).count_ones();
    }
    Ok(dist)
}

/// Calculates Hamming distance between two hex string hashes
pub fn calculate_hamming_distance(hex_a: &str, hex_b: &str) -> Result<u32, HasherError> {
    let bytes_a = hex_to_bytes(hex_a)?;
    let bytes_b = hex_to_bytes(hex_b)?;
    hamming_distance_bytes(&bytes_a, &bytes_b)
}

/// Calculates similarity percentage based on Hamming distance and total bits (0.0% to 100.0%)
pub fn calculate_similarity_percentage(distance: u32, total_bits: usize) -> f64 {
    if total_bits == 0 {
        return 0.0;
    }
    let max_dist = total_bits as f64;
    let dist = (distance as f64).min(max_dist);
    let sim = (1.0 - (dist / max_dist)) * 100.0;
    (sim * 10.0).round() / 10.0
}

/// Compares two photo perceptual hashes and returns similarity metrics & duplicate verdict
pub fn compare_photo_hashes(req: CompareHashesRequest) -> Result<CompareHashesResponse, HasherError> {
    let distance = calculate_hamming_distance(&req.hash_a, &req.hash_b)?;
    let total_bits = (req.hash_a.trim().len() / 2) * 8;
    let similarity = calculate_similarity_percentage(distance, total_bits);

    let (confidence, is_duplicate, explanation) = if distance == 0 {
        (
            SimilarityConfidence::Identical,
            true,
            "Exact match: Photos have identical perceptual hashes.".to_string(),
        )
    } else if distance <= req.threshold / 2 {
        (
            SimilarityConfidence::NearDuplicate,
            true,
            format!(
                "Near-duplicate photo detected (Hamming distance: {}, similarity: {:.1}%). Likely resized, compressed, or watermarked duplicate.",
                distance, similarity
            ),
        )
    } else if distance <= req.threshold {
        (
            SimilarityConfidence::PossibleVariant,
            true,
            format!(
                "Potential variant photo detected (Hamming distance: {}, similarity: {:.1}%). Meets duplicate detection threshold (<= {}).",
                distance, similarity, req.threshold
            ),
        )
    } else {
        (
            SimilarityConfidence::Distinct,
            false,
            format!(
                "Distinct photos (Hamming distance: {}, similarity: {:.1}%). Exceeds duplicate threshold (> {}).",
                distance, similarity, req.threshold
            ),
        )
    };

    Ok(CompareHashesResponse {
        hamming_distance: distance,
        similarity_percentage: similarity,
        is_duplicate,
        confidence,
        explanation,
    })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

pub fn bytes_to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

pub fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, HasherError> {
    let clean = hex.trim();
    if clean.len() % 2 != 0 {
        return Err(HasherError::InvalidHexError("Hex string has odd length".to_string()));
    }

    (0..clean.len())
        .step_by(2)
        .map(|i| {
            u8::from_str_radix(&clean[i..i + 2], 16)
                .map_err(|e| HasherError::InvalidHexError(e.to_string()))
        })
        .collect()
}
