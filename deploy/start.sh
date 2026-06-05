#!/bin/bash
# Install cron job for Laravel scheduler
echo '* * * * * cd /var/www && php artisan schedule:run >> /dev/null 2>&1' | crontab -
service cron start

# Run composer install and start php-fpm
composer install --no-interaction --optimize-autoloader --no-dev
php artisan config:cache || true
php artisan event:cache || true
php artisan view:cache || true
php-fpm
