#!/bin/bash
# Update .env to use Brevo SMTP
cd /root/doctormarriagebureau

# Backup existing .env
cp .env .env.backup

# Update MAIL settings for Brevo
sed -i 's/MAIL_HOST=.*/MAIL_HOST=smtp-relay.brevo.com/' .env
sed -i 's/MAIL_PORT=.*/MAIL_PORT=587/' .env
sed -i 's/MAIL_USERNAME=.*/MAIL_USERNAME=8a2be7001@smtp-brevo.com/' .env
sed -i 's/MAIL_PASSWORD=.*/MAIL_PASSWORD=xsmtpsib-829e4356e79618db21805414d5780cc36c453a8639549604edda6f3172e1d912-RpeL42Mq7IJ2Ai8Q/' .env
sed -i 's/MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/' .env
sed -i "s/MAIL_FROM_ADDRESS=.*/MAIL_FROM_ADDRESS=noreply@doctormarriagebureau.com.pk/" .env
sed -i "s/MAIL_FROM_NAME=.*/MAIL_FROM_NAME='Doctor Marriage Bureau'/" .env

# Clear Laravel cache
docker exec marriagebureau-app php artisan config:clear
docker exec marriagebureau-app php artisan cache:clear

# Verify the update
echo "=== MAIL CONFIGURATION UPDATE ==="
grep "MAIL_" .env
echo "=== UPDATE COMPLETE ==="
