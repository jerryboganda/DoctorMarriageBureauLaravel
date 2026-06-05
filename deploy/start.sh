#!/bin/sh

# Install cron job for Laravel scheduler
echo '* * * * * cd /var/www && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1' | crontab -
service cron start

# Run composer install and start php-fpm
mkdir -p /var/www/bootstrap/cache
composer install --no-interaction --optimize-autoloader --no-dev

if [ ! -e /var/www/public/storage ]; then
  php artisan storage:link
fi

php artisan config:cache || true
php artisan event:cache || true
php artisan view:cache || true
php-fpm
