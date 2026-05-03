FROM php:8.3-fpm-bullseye

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        cron \
        git \
        unzip \
        zip \
        libicu-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libonig-dev \
        libxml2-dev \
        libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j4 bcmath exif gd intl mbstring pdo_mysql xml zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY deploy/start.sh /usr/local/bin/start.sh
COPY deploy/php/www.conf /usr/local/etc/php-fpm.d/www.conf
RUN chmod +x /usr/local/bin/start.sh

WORKDIR /var/www

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/start.sh"]
