# Doctor Marriage Bureau — Quick Start

Use [`PROJECT_SSOT.md`](PROJECT_SSOT.md) for ownership and
[`HOSTINGER_DEPLOY_GUIDE.md`](HOSTINGER_DEPLOY_GUIDE.md) for production.

## Production topology

- Marketing website: <https://doctormarriagebureau.com.pk> — separate WordPress site.
- Web app: <https://panel.doctormarriagebureau.com.pk> — separate Laravel site, API, and admin.
- Both sites are hosted separately on the same Hostinger account but use separate quotas: WordPress uses its PHP/website quota with generous limits, while Laravel uses the project's web-app quota. The Laravel deployment workflow does not deploy WordPress.

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

The mobile app is not deployed by the Hostinger Laravel artifact.

## GitHub Actions validation

The configured GitHub Actions workflow runs backend quality, a MySQL regression
and database-backup smoke test, and the React member-panel
lint/format/typecheck/build pipeline:

```text
backend-quality
backend-mysql-smoke
user-frontend-quality
```

Production deployment and remote operations use the dedicated GitHub Actions
Hostinger workflows. The CI workflow does not validate WordPress/Elementor.

## Production status and logs

Direct SSH is blocked from the local network. Use the approved workflows:

```powershell
gh workflow run "Hostinger Production Status" --repo jerryboganda/DoctorMarriageBureauLaravel
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="tail -100 storage/logs/laravel.log"
```

Current blocker: Hostinger has no production `.env`, so
`https://panel.doctormarriagebureau.com.pk/api/health` returns HTTP 500.
Provision it securely, then clear/rebuild caches and re-run the health check.
Do not print `.env`, OTPs, tokens, or credentials in workflow output.
