#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"

cd "$DEPLOY_PATH"

OLD_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "NONE")

git fetch /tmp/dmb-main.bundle HEAD
git reset --hard FETCH_HEAD
git update-ref refs/remotes/origin/main HEAD
rm -f /tmp/dmb-main.bundle
[ -L dmb_app ] && rm dmb_app || true

NEW_HEAD=$(git rev-parse HEAD)
echo "==> Deployed: ${OLD_HEAD:0:8} -> ${NEW_HEAD:0:8}"

if [ "$OLD_HEAD" = "NONE" ] || [ "$OLD_HEAD" = "$NEW_HEAD" ]; then
  CHANGED="all"
else
  CHANGED=$(git diff --name-only "$OLD_HEAD" "$NEW_HEAD" 2>/dev/null || echo "all")
fi

echo "==> Changed files:"
echo "$CHANGED" | head -30
echo "---"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

REBUILD_APP=false
REBUILD_FRONTEND=false
REBUILD_ADMIN=false

if [ "$CHANGED" = "all" ]; then
  REBUILD_APP=true
  REBUILD_FRONTEND=true
  REBUILD_ADMIN=true
else
  if echo "$CHANGED" | grep -qE '^(app/|config/|routes/|database/|deploy/Dockerfile|deploy/start\.sh|deploy/php/|composer\.(json|lock))'; then
    REBUILD_APP=true
  fi
  if echo "$CHANGED" | grep -qE '^New User Panel Frontend/'; then
    REBUILD_FRONTEND=true
  fi
  if echo "$CHANGED" | grep -qE '^Admin Panel Frontend/'; then
    REBUILD_ADMIN=true
  fi
fi

BUILD_TARGETS=""
$REBUILD_APP && BUILD_TARGETS="$BUILD_TARGETS app"
$REBUILD_FRONTEND && BUILD_TARGETS="$BUILD_TARGETS frontend"
$REBUILD_ADMIN && BUILD_TARGETS="$BUILD_TARGETS admin"
BUILD_TARGETS=$(echo "$BUILD_TARGETS" | xargs)

if [ -n "$BUILD_TARGETS" ]; then
  echo "==> Building: $BUILD_TARGETS"
  docker compose build $BUILD_TARGETS
else
  echo "==> No Docker build needed"
fi

docker compose up -d --no-build app web frontend admin soketi db

if [ "$CHANGED" = "all" ] || echo "$CHANGED" | grep -q 'deploy/nginx.conf'; then
  echo "==> Restarting web (nginx config changed)"
  docker compose restart web
fi

if [ "$CHANGED" = "all" ] || echo "$CHANGED" | grep -qE '^database/migrations/'; then
  echo "==> Running migrations..."
  docker compose exec -T app php artisan migrate --force
fi

echo "==> Refreshing Laravel caches..."
docker compose exec -T app sh -lc 'mkdir -p public/uploads/all && chown -R www-data:www-data storage bootstrap/cache public/uploads && chmod -R u+rwX,g+rwX storage bootstrap/cache public/uploads'
docker compose exec -T app php artisan optimize:clear
docker compose exec -T app php artisan config:cache
docker compose exec -T app php artisan route:cache
docker compose exec -T app php artisan view:cache
docker compose exec -T app php artisan event:cache

echo "==> Waiting for DB health..."
for i in $(seq 1 24); do
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' marriagebureau-db 2>/dev/null || echo "missing")
  [ "$STATUS" = "healthy" ] && break
  echo "  ($i) DB status: $STATUS"
  sleep 5
done
docker inspect -f '{{.State.Health.Status}}' marriagebureau-db | grep -qx healthy

echo "==> Verifying app can reach MySQL..."
docker compose exec -T app php artisan tinker --execute="DB::connection()->getPdo(); echo config('database.connections.mysql.host');"
echo

docker ps --filter 'name=marriagebureau' --format 'table {{.Names}}\t{{.Status}}'
