#!/usr/bin/env bash
set -euo pipefail

artifact="${1:-}"
if [ -z "$artifact" ] || [ ! -f "$artifact" ]; then
  echo "Usage: bash deploy/hostinger-release.sh <artifact.tar.gz>" >&2
  exit 1
fi

root="$(pwd)"
timestamp="$(date +%Y%m%d%H%M%S)"
release_dir="$root/.builds/release-$timestamp"
preserved_env="$root/.builds/config/.env"

mkdir -p "$root/.builds" "$root/.builds/config" "$release_dir"
if [ -f "$root/.env" ]; then
  cp "$root/.env" "$preserved_env"
fi

tar -xzf "$artifact" -C "$release_dir"

if [ -f "$preserved_env" ]; then
  cp "$preserved_env" "$release_dir/.env"
elif [ ! -f "$release_dir/.env" ]; then
  echo "Missing production .env; aborting before release copy." >&2
  exit 1
fi

if [ -d "$root/vendor" ]; then
  rm -rf "$release_dir/vendor"
  cp -a "$root/vendor" "$release_dir/vendor"
fi

if [ -d "$root/public/uploads" ]; then
  mkdir -p "$release_dir/public"
  rm -rf "$release_dir/public/uploads"
  cp -a "$root/public/uploads" "$release_dir/public/uploads"
fi

if [ -d "$root/storage/app/public/uploads" ]; then
  mkdir -p "$release_dir/storage/app/public"
  rm -rf "$release_dir/storage/app/public/uploads"
  cp -a "$root/storage/app/public/uploads" "$release_dir/storage/app/public/uploads"
fi

for built_path in public/user-panel; do
  if [ -d "$release_dir/$built_path" ]; then
    rm -rf "$root/$built_path"
  fi
done

if [ -d "$release_dir/public/user-panel/assets" ]; then
  rm -rf "$root/assets"
fi

cp -a "$release_dir"/. "$root"/

if [ -f "$preserved_env" ] && [ ! -f "$root/.env" ]; then
  cp "$preserved_env" "$root/.env"
fi
if [ ! -f "$root/.env" ]; then
  echo "Production .env was not restored; aborting." >&2
  exit 1
fi
chmod 600 "$root/.env"

if [ ! -f "$root/vendor/autoload.php" ] && [ -f "$release_dir/vendor/autoload.php" ]; then
  rm -rf "$root/vendor"
  cp -a "$release_dir/vendor" "$root/vendor"
fi
if [ ! -f "$root/vendor/autoload.php" ]; then
  echo "Composer vendor/autoload.php is missing after release copy; aborting." >&2
  exit 1
fi

for built_path in public/user-panel; do
  if [ ! -f "$root/$built_path/index.html" ] && [ -f "$release_dir/$built_path/index.html" ]; then
    rm -rf "$root/$built_path"
    mkdir -p "$root/$(dirname "$built_path")"
    cp -a "$release_dir/$built_path" "$root/$built_path"
  fi
  if [ ! -f "$root/$built_path/index.html" ]; then
    echo "Missing built SPA at $built_path/index.html after release copy; aborting." >&2
    exit 1
  fi
done

rm -rf "$root/public/admin-panel"

chmod 755 "$root/public" "$root/public/user-panel" "$root/bootstrap" "$root/bootstrap/cache" "$root/storage" 2>/dev/null || true
find "$root/public/user-panel" -type d -exec chmod 755 {} \;
find "$root/public/user-panel" -type f -exec chmod 644 {} \;

find "$root" -maxdepth 1 -type f \( \
  -name '*.sql' -o \
  -name '*.tar.gz' -o \
  -name '*.zip' -o \
  -name '_ide_helper.php' -o \
  -name '_ide_helper_models.php' \
  \) -delete
rm -f "$root/public/error_log"

composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

php artisan optimize:clear
php artisan migrate --force
if ! php artisan storage:link; then
  if [ -d "$root/storage/app/public" ]; then
    rm -rf "$root/public/storage"
    mkdir -p "$root/public/storage"
    cp -a "$root/storage/app/public"/. "$root/public/storage"/
  fi
fi
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

find "$root/.builds" -mindepth 1 -maxdepth 1 -type d -name 'release-*' | sort | head -n -3 | xargs -r rm -rf

echo "Hostinger release completed: $timestamp"
