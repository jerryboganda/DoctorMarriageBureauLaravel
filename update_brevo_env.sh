#!/bin/bash
# Update .env to use Brevo SMTP
set -euo pipefail

: "${BREVO_SMTP_LOGIN:?Set BREVO_SMTP_LOGIN before running this script.}"
: "${BREVO_SMTP_KEY:?Set BREVO_SMTP_KEY before running this script.}"

cd /root/doctormarriagebureau

# Backup existing .env
cp .env .env.backup

# Update MAIL settings for Brevo
sed -i 's/MAIL_MAILER=.*/MAIL_MAILER=smtp/' .env
grep -q '^MAIL_MAILER=' .env || printf '\nMAIL_MAILER=smtp\n' >> .env
sed -i 's/MAIL_HOST=.*/MAIL_HOST=smtp-relay.brevo.com/' .env
sed -i 's/MAIL_PORT=.*/MAIL_PORT=587/' .env
sed -i "s/MAIL_USERNAME=.*/MAIL_USERNAME=${BREVO_SMTP_LOGIN}/" .env
sed -i "s/MAIL_PASSWORD=.*/MAIL_PASSWORD=${BREVO_SMTP_KEY}/" .env
sed -i 's/MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/' .env
sed -i "s/MAIL_FROM_ADDRESS=.*/MAIL_FROM_ADDRESS=noreply@doctormarriagebureau.com.pk/" .env
sed -i "s/MAIL_FROM_NAME=.*/MAIL_FROM_NAME='Doctor Marriage Bureau'/" .env

# Clear Laravel cache
docker exec marriagebureau-app php artisan config:clear
docker exec marriagebureau-app php artisan cache:clear

# Verify the update
echo "=== MAIL CONFIGURATION UPDATE ==="
grep "MAIL_" .env | sed 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=[hidden]/'
echo "=== UPDATE COMPLETE ==="
