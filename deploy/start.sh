#!/bin/sh
set -e

# ── Cron for Laravel scheduler ──────────────────────────────────────────────
echo '* * * * * cd /var/www && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1' | crontab -
service cron start

# ── Composer: only run if vendor is missing or lock file is newer ────────────
# On redeploys where only PHP source changed (not dependencies), this saves
# 60-120 seconds. Full install still runs on first boot or after composer.lock
# changes.
mkdir -p /var/www/bootstrap/cache
if [ ! -f /var/www/vendor/autoload.php ] || \
   [ /var/www/composer.lock -nt /var/www/vendor/autoload.php ]; then
  echo "[start.sh] Running composer install..."
  composer install --no-interaction --optimize-autoloader --no-dev
else
  echo "[start.sh] Composer deps up-to-date, skipping install"
fi

# ── Storage symlink (idempotent) ─────────────────────────────────────────────
if [ ! -e /var/www/public/storage ]; then
  php artisan storage:link
fi

# ── Caches ───────────────────────────────────────────────────────────────────
php artisan config:cache || true
php artisan event:cache  || true
php artisan view:cache   || true

# ── Start PHP-FPM ────────────────────────────────────────────────────────────
exec php-fpm
