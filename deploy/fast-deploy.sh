#!/bin/bash
# Fast, service-aware production deploy.
# Called by GitHub Actions after `git pull`. Rebuilds only what changed.
set -euo pipefail

# ── Parse flags ───────────────────────────────────────────────────────────────
BACKEND="false"
COMPOSER_LOCK="false"
FRONTEND="false"
ADMIN="false"
APP_DOCKERFILE="false"
NGINX="false"
COMPOSE_CHANGED="false"

for arg in "$@"; do
  case "$arg" in
    --backend=*)       BACKEND="${arg#*=}" ;;
    --composer-lock=*) COMPOSER_LOCK="${arg#*=}" ;;
    --frontend=*)      FRONTEND="${arg#*=}" ;;
    --admin=*)         ADMIN="${arg#*=}" ;;
    --app-dockerfile=*)APP_DOCKERFILE="${arg#*=}" ;;
    --nginx=*)         NGINX="${arg#*=}" ;;
    --compose=*)       COMPOSE_CHANGED="${arg#*=}" ;;
  esac
done

DC="docker compose"
DEPLOYED=0

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           Doctor Marriage Bureau — Deploy            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo "  backend=$BACKEND  composer_lock=$COMPOSER_LOCK"
echo "  frontend=$FRONTEND  admin=$ADMIN"
echo "  app_dockerfile=$APP_DOCKERFILE  nginx=$NGINX  compose=$COMPOSE_CHANGED"
echo ""

# ── App container (PHP/Laravel backend) ───────────────────────────────────────
if [ "$APP_DOCKERFILE" = "true" ]; then
  # Dockerfile or PHP-FPM config changed — must rebuild the image
  echo "[app] Dockerfile changed — rebuilding image..."
  DOCKER_BUILDKIT=1 $DC build app
  $DC up -d app
  DEPLOYED=1

elif [ "$COMPOSE_CHANGED" = "true" ]; then
  # docker-compose.yml changed — re-apply service config (uses cached image)
  echo "[app] compose.yml changed — re-applying config..."
  $DC up -d app
  DEPLOYED=1

elif [ "$COMPOSER_LOCK" = "true" ]; then
  # New PHP dependencies — restart triggers start.sh which installs them
  echo "[app] composer.lock changed — restarting to install deps..."
  $DC restart app
  # Give PHP-FPM time to come back up
  sleep 5
  DEPLOYED=1

elif [ "$BACKEND" = "true" ]; then
  # PHP source / config / routes changed — refresh caches in running container
  # Zero downtime: no restart, no rebuild (~8-12 seconds)
  echo "[app] PHP source changed — refreshing caches..."
  $DC exec -T app php artisan config:cache
  $DC exec -T app php artisan route:cache
  $DC exec -T app php artisan view:cache
  $DC exec -T app php artisan event:cache
  DEPLOYED=1
fi

# ── Nginx (web container) ─────────────────────────────────────────────────────
if [ "$NGINX" = "true" ]; then
  echo "[web] nginx.conf changed — hot-reloading nginx..."
  $DC exec -T web nginx -s reload
  DEPLOYED=1
fi

# ── New User Panel Frontend ───────────────────────────────────────────────────
if [ "$FRONTEND" = "true" ]; then
  echo "[frontend] Source changed — rebuilding image..."
  DOCKER_BUILDKIT=1 $DC build frontend
  $DC up -d frontend
  DEPLOYED=1
fi

# ── Admin Panel Frontend ──────────────────────────────────────────────────────
if [ "$ADMIN" = "true" ]; then
  echo "[admin] Source changed — rebuilding image..."
  DOCKER_BUILDKIT=1 $DC build admin
  $DC up -d admin
  DEPLOYED=1
fi

# ── Nothing required ─────────────────────────────────────────────────────────
if [ "$DEPLOYED" = "0" ]; then
  echo "No service-affecting changes detected — nothing to restart."
  echo ""
  docker ps --filter "name=marriagebureau" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  exit 0
fi

# ── Health check ─────────────────────────────────────────────────────────────
echo ""
echo "[health] Waiting for services..."
sleep 4

HEALTHY=0
for i in 1 2 3 4 5; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://localhost:8086/" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "502" ] && [ "$HTTP_CODE" != "503" ]; then
    echo "✓ Backend healthy — HTTP $HTTP_CODE (attempt $i)"
    HEALTHY=1
    break
  fi
  echo "  attempt $i/5 — HTTP $HTTP_CODE, retrying in 5s..."
  sleep 5
done

if [ "$HEALTHY" = "0" ]; then
  echo ""
  echo "✗ Health check failed. Last 50 lines from app:"
  $DC logs --tail=50 app
  exit 1
fi

# ── Final status ─────────────────────────────────────────────────────────────
echo ""
docker ps --filter "name=marriagebureau" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "✓ Deploy complete"
