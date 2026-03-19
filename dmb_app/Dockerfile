# ─── Stage 1: Build Flutter Web ───────────────────────────────────────────────
FROM ghcr.io/cirruslabs/flutter:3.22.3 AS builder

WORKDIR /app

# Copy pubspec first for layer caching
COPY pubspec.yaml ./
COPY pubspec.lock* ./

# Get dependencies
RUN flutter pub get

# Copy the full project
COPY . .

# Build for web with CanvasKit renderer (best fidelity, matches mobile view)
RUN flutter build web --release --web-renderer canvaskit --dart-define=FLUTTER_WEB_USE_SKIA=true

# ─── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:alpine

# Copy built web files
COPY --from=builder /app/build/web /usr/share/nginx/html

# nginx config: serve SPA with history fallback
COPY deploy/nginx-web.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
