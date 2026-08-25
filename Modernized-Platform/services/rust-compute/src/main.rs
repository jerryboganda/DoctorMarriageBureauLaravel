use axum::{
    extract::{DefaultBodyLimit, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use doctormarriagebureau_compute::{
    batch_score_candidates, compare_photo_hashes, compute_matrix_scores, process_image_hash,
    BatchScoreRequest, CompareHashesRequest, HashImageRequest, MatrixScoreRequest,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::{error, info};

/// Shared service application state
#[derive(Clone)]
pub struct AppState {
    pub start_time: Instant,
    pub total_hashes_computed: Arc<AtomicU64>,
    pub total_candidates_scored: Arc<AtomicU64>,
    pub total_batches_processed: Arc<AtomicU64>,
    pub redis_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
    pub uptime_seconds: u64,
    pub memory_rss_mb: Option<f64>,
    pub redis_connected: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsResponse {
    pub service: String,
    pub version: String,
    pub uptime_seconds: u64,
    pub total_hashes_computed: u64,
    pub total_candidates_scored: u64,
    pub total_batches_processed: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub success: bool,
    pub error: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,doctormarriagebureau_compute=debug".into()),
        )
        .init();

    info!("Starting Doctor Marriage Bureau Rust Compute Engine v0.1.0...");

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8081);

    let redis_url = std::env::var("REDIS_URL").ok();

    let state = AppState {
        start_time: Instant::now(),
        total_hashes_computed: Arc::new(AtomicU64::new(0)),
        total_candidates_scored: Arc::new(AtomicU64::new(0)),
        total_batches_processed: Arc::new(AtomicU64::new(0)),
        redis_url,
    };

    // Permissive CORS for microservice RPC
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build Axum router
    // Allow up to 25MB for high-resolution doctor photo uploads
    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/api/compute/health", get(health_handler))
        .route("/api/compute/stats", get(stats_handler))
        .route("/api/compute/hash-image", post(hash_image_handler))
        .route("/api/compute/compare-hashes", post(compare_hashes_handler))
        .route("/api/compute/batch-score", post(batch_score_handler))
        .route("/api/compute/matrix-score", post(matrix_score_handler))
        .layer(DefaultBodyLimit::max(25 * 1024 * 1024))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("Compute microservice listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("Compute microservice cleanly shut down.");
    Ok(())
}

/// Health check handler
async fn health_handler(State(state): State<AppState>) -> impl IntoResponse {
    let uptime = state.start_time.elapsed().as_secs();

    // Check optional Redis connectivity
    let mut redis_ok = false;
    if let Some(ref r_url) = state.redis_url {
        if let Ok(client) = redis::Client::open(r_url.as_str()) {
            if let Ok(mut con) = client.get_multiplexed_tokio_connection().await {
                redis_ok = redis::cmd("PING")
                    .query_async::<_, String>(&mut con)
                    .await
                    .is_ok();
            }
        }
    }

    let resp = HealthResponse {
        status: "ok".to_string(),
        service: "doctormarriagebureau-compute".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: uptime,
        memory_rss_mb: None,
        redis_connected: redis_ok,
    };

    (StatusCode::OK, Json(resp))
}

/// Service statistics handler
async fn stats_handler(State(state): State<AppState>) -> impl IntoResponse {
    let resp = StatsResponse {
        service: "doctormarriagebureau-compute".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: state.start_time.elapsed().as_secs(),
        total_hashes_computed: state.total_hashes_computed.load(Ordering::Relaxed),
        total_candidates_scored: state.total_candidates_scored.load(Ordering::Relaxed),
        total_batches_processed: state.total_batches_processed.load(Ordering::Relaxed),
    };

    (StatusCode::OK, Json(resp))
}

/// Perceptual image hashing endpoint
async fn hash_image_handler(
    State(state): State<AppState>,
    Json(payload): Json<HashImageRequest>,
) -> impl IntoResponse {
    match process_image_hash(payload) {
        Ok(res) => {
            state.total_hashes_computed.fetch_add(1, Ordering::Relaxed);
            (StatusCode::OK, Json(serde_json::to_value(res).unwrap()))
        }
        Err(err) => {
            error!("Image hashing error: {}", err);
            (
                StatusCode::BAD_REQUEST,
                Json(serde_json::to_value(ErrorResponse {
                    success: false,
                    error: err.to_string(),
                }).unwrap()),
            )
        }
    }
}

/// Compare perceptual hashes endpoint
async fn compare_hashes_handler(
    Json(payload): Json<CompareHashesRequest>,
) -> impl IntoResponse {
    match compare_photo_hashes(payload) {
        Ok(res) => (StatusCode::OK, Json(serde_json::to_value(res).unwrap())),
        Err(err) => {
            error!("Hash comparison error: {}", err);
            (
                StatusCode::BAD_REQUEST,
                Json(serde_json::to_value(ErrorResponse {
                    success: false,
                    error: err.to_string(),
                }).unwrap()),
            )
        }
    }
}

/// Vectorized batch candidate compatibility scoring endpoint
async fn batch_score_handler(
    State(state): State<AppState>,
    Json(payload): Json<BatchScoreRequest>,
) -> impl IntoResponse {
    let num_candidates = payload.candidates.len() as u64;
    let res = batch_score_candidates(payload);

    state.total_candidates_scored.fetch_add(num_candidates, Ordering::Relaxed);
    state.total_batches_processed.fetch_add(1, Ordering::Relaxed);

    (StatusCode::OK, Json(serde_json::to_value(res).unwrap()))
}

/// N x M Compatibility matrix scoring endpoint
async fn matrix_score_handler(
    State(state): State<AppState>,
    Json(payload): Json<MatrixScoreRequest>,
) -> impl IntoResponse {
    let total_scores = (payload.seekers.len() * payload.candidates.len()) as u64;
    let res = compute_matrix_scores(payload);

    state.total_candidates_scored.fetch_add(total_scores, Ordering::Relaxed);
    state.total_batches_processed.fetch_add(1, Ordering::Relaxed);

    (StatusCode::OK, Json(serde_json::to_value(res).unwrap()))
}

/// Graceful shutdown signal listener
async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Failed to install Ctrl+C signal handler");
    info!("Termination signal received, beginning graceful shutdown...");
}
