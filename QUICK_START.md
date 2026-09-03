# Doctor Marriage Bureau — Quick Start

Use [`PROJECT_SSOT.md`](PROJECT_SSOT.md) for ownership and
[`VPS_DEPLOYMENT_GUIDE.md`](VPS_DEPLOYMENT_GUIDE.md) for Production VPS (`185.252.233.186`).

## Production topology

- Marketing website: <https://doctormarriagebureau.com.pk> — external WordPress site.
- Web app & API: <https://panel.doctormarriagebureau.com.pk> — running on Production VPS (`185.252.233.186`).
- Deployment: Docker Compose on VPS at `/opt/docker/doctormarriagebureau`.

## Local Laravel setup

Prerequisites: PHP 8.2+, Composer, MySQL-compatible database, and Node.js 20+.

```powershell
cd "D:\Projects\Doctor Marriage Bureau"
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

Use local-only values in `.env`. Never copy production configuration or
credentials into this repository.

## Member web panel

```powershell
cd "D:\Projects\Doctor Marriage Bureau\New User Panel Frontend"
npm ci
npm run dev

# Full local quality/build gate
npm run ci
```

Configure the API URL in an ignored `.env.local`. The production panel is
`https://panel.doctormarriagebureau.com.pk`; the API is the `/api` path on the
same host.

## Mobile app

Use Node.js 18–20:

```powershell
cd "D:\Projects\Doctor Marriage Bureau\DMB Mobile App"
npm ci
npm run typecheck
npm start

# EAS preview build
npx eas build --platform android --profile preview --no-wait
```

The mobile app is built independently via EAS.

## GitHub Actions validation

The configured GitHub Actions workflow runs backend quality, a MySQL regression
and database-backup smoke test, and the React member-panel
lint/format/typecheck/build pipeline:

```text
backend-quality
backend-mysql-smoke
user-frontend-quality
```

Production deployment runs via `.github/workflows/deploy.yml` directly targeting the Production VPS (`185.252.233.186`).

## Production status and logs

Access the Production VPS (`185.252.233.186`):

```bash
ssh root@185.252.233.186
cd /opt/docker/doctormarriagebureau
docker compose ps
docker compose logs -f app
```

