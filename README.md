# Doctor Marriage Bureau

> ⚠️ **ACTIVE PLATFORM & DEVELOPMENT STACK**:  
> The **Astro 5 + React Web App** in `Modernized-Platform/apps/web` is the **ONLY active stack** being developed and maintained.  
> The root Laravel PHP app (`app/`, `dmb-webapp`) and WordPress marketing site are **LEGACY**. Do NOT make changes to legacy directories.

Doctor Marriage Bureau (DMB) is an exclusive matrimonial platform designed specifically for doctors and medical professionals.

## Quick Demo Credentials

- **Doctor Account**: `doctor@hospital.org` / `Doctor@123` (Dr. Faisal Maqsood — Cardiologist)
- **Female Doctor Account**: `ayesha@hospital.org` / `Doctor@123` (Dr. Ayesha Malik — Dermatologist)
- **1-Click Quick Login**: Instant login is available directly on `/login/`.

## Start here

| Need | Document |
|---|---|
| System map, ownership, source of truth, and boundaries | [`PROJECT_SSOT.md`](PROJECT_SSOT.md) |
| Hostinger deployment, remote access, health checks, and blog sync | [`HOSTINGER_DEPLOY_GUIDE.md`](HOSTINGER_DEPLOY_GUIDE.md) |
| Authentication/API behavior | [`AUTH_PRODUCTION_READY.md`](AUTH_PRODUCTION_READY.md) |
| Mobile quick start | [`DMB Mobile App/README.md`](DMB%20Mobile%20App/README.md) |
| CI definition | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |

## Repository and source of truth

- GitHub: [`jerryboganda/DoctorMarriageBureauLaravel`](https://github.com/jerryboganda/DoctorMarriageBureauLaravel)
- Production branch: `main`
- Local repository: `D:\Projects\Doctor Marriage Bureau`
- The GitHub repository is the source of truth for Laravel, frontends, the
  `wordpress-plugin/` bridge, deployment scripts, and documentation.
- Production deploys are artifact-based. Secrets and runtime state are never
  committed or shipped in the artifact.
- All durable Laravel state lives outside the Git checkout under
  `$HOME/.dmb-persistent`. The release script preserves the production `.env`
  and immutable `APP_KEY`, uploads, `storage/app`, admin add-ons, logs, file
  sessions, legacy SQL backups, deployment metadata, retained releases, and
  pre-migration database backups there, then recreates and validates runtime
  symlinks after every deployment.
- Hostinger hPanel Git auto-deploy must remain disabled. Only the approved
  GitHub Actions deployment may change production.
- Do not use `master`, an old VPS checkout, Vercel, or a local build as a
  production source of truth.

## Public surfaces and ownership

| Surface | URL | Owner and boundary |
|---|---|---|
| Marketing website | <https://doctormarriagebureau.com.pk> | WordPress on Hostinger. Public pages, navigation, Elementor sections, header/footer, social links, and marketing copy are maintained in WordPress. |
| WordPress administration | <https://doctormarriagebureau.com.pk/wp-login.php> | WordPress admin and Elementor access. Credentials are supplied at runtime; never store them here. |
| Member web app | <https://panel.doctormarriagebureau.com.pk> | Laravel-hosted React/Vite user panel. |
| Laravel API | <https://panel.doctormarriagebureau.com.pk/api> | Same Laravel production application as the member panel. Health endpoint: `/api/health`. |
| Laravel admin | <https://panel.doctormarriagebureau.com.pk/admin> | Member, package, blog, payment, settings, and operational administration. |
| Mobile app | `DMB Mobile App/` | React Native/Expo source and EAS build configuration; it consumes the Laravel API. |

The marketing website and Laravel web app are separate Hostinger sites under the
same account but use separate quota types. WordPress uses its separate
PHP/website quota with generous limits; the Laravel web app uses the project's
web-app quota. Keep their application, document-root, and quota boundaries
separate: the Laravel GitHub Actions release updates only
`panel.doctormarriagebureau.com.pk`, while WordPress content and Elementor
layout changes are managed on the marketing site itself.

`api.doctormarriagebureau.com.pk` appears in older frontend and release
documents. It is not the Hostinger workflow health target and must be treated
as a legacy/unverified hostname until DNS and certificates are explicitly
confirmed.

## Package landing page and prices

- The Laravel server-rendered package page is
  `https://panel.doctormarriagebureau.com.pk/packages`.
- The React web panel and mobile app load packages from `GET /api/packages`;
  add-ons come from `GET /api/addons`.
- Package names, prices, validity, proposal/contact/photo limits, and active
  status are database-backed `packages` records. They are not authoritative
  in React constants or WordPress copy.
- Administrators manage them at Laravel Admin → **Premium Packages**
  (`/admin/packages`). Activate/deactivate changes what the public package
  page returns.
- Payment methods and checkout callbacks remain Laravel/API concerns. Do not
  reproduce prices in the WordPress Elementor page unless the owner accepts a
  manually maintained marketing copy.

## Marketing content, social links, and blogs

- WordPress owns the public marketing layout. Use WordPress Pages → **Edit
  with Elementor** for landing-page sections and Elementor Theme Builder
  header/footer content.
- Laravel marketing templates/settings remain in
  `resources/views/frontend/` and `resources/views/admin/marketing/`; they are
  not the owner of the live WordPress Elementor layout.
- Laravel Admin → Settings → **Social Media Login** configures OAuth providers;
  it is not the location of public Facebook/Instagram/WhatsApp links.
- Public social-link URLs are maintained in the WordPress Elementor
  header/footer (and any corresponding WordPress menu/widget):
  - Facebook: `https://www.facebook.com/profile.php?id=61583278677249`
  - YouTube: `https://youtube.com/@DoctorsMarriageBureauo`
  - Instagram: `https://www.instagram.com/doctorsmarriagebureauofficial`
  - TikTok: `https://www.tiktok.com/@doctorsmariagebuearu`
- Blog ownership is intentionally asymmetric: Laravel Admin → **Blog** is the
  source of truth for synced blog posts. The `DMB Laravel Sync` plugin in
  `wordpress-plugin/` receives posts at
  `/wp-json/dmb/v1/sync-post` and deletion requests at
  `/wp-json/dmb/v1/delete-post`.
- `wp:sync-blogs` pushes Laravel posts to WordPress. `wp:import-blogs` imports
  existing published WordPress posts into Laravel; linked records are not
  overwritten. See the deployment guide for the secure configuration and
  commands.
- The plugin also provides the `dmb_random_proposals_slider` Elementor widget
  and `[dmb_proposals]` shortcode. It reads the public Laravel proposals API
  or the daily cached payload.

## Development

### Laravel

Prerequisites: PHP 8.2+, Composer, MySQL-compatible database, and Node.js 20+
for the repository build.

```powershell
cd "D:\Projects\Doctor Marriage Bureau"
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate
```

Use a local `.env` only. Never copy production values into the repository or
paste credentials into commands, issues, or documentation.

### Member web panel

```powershell
cd "D:\Projects\Doctor Marriage Bureau\New User Panel Frontend"
npm ci
npm run dev
npm run ci
```

Set `VITE_API_URL`/the project’s API base setting in an ignored
`.env.local`. For the repository-level Hostinger build use:

```powershell
cd "D:\Projects\Doctor Marriage Bureau"
npm run hostinger:build
```

### Mobile app

Use Node.js 18–20 for the current Expo/Metro toolchain:

```powershell
cd "D:\Projects\Doctor Marriage Bureau\DMB Mobile App"
npm ci
npm run typecheck
npm start
npx eas build --platform android --profile preview --no-wait
```

The mobile app is not included in the Hostinger production artifact. Its
`build:web` target is CI validation/build output only unless a separate
release is approved.

## Validation and deployment

- GitHub Actions is the only CI/CD and validation platform. The `Project CI`
  workflow runs Laravel quality, Laravel/MySQL regression and backup smoke
  tests, and the React member-panel quality pipeline. Hostinger deployment and
  remote operations also run through GitHub Actions workflows.
- Approved production workflows are the repository’s
  `Hostinger Deploy Dispatch`, `Hostinger Build And Deploy`,
  `Hostinger Remote Exec`, and `Hostinger Production Status` workflows.
- Direct SSH from the local network is blocked. Use GitHub Actions for
  production access.
- Every deployment creates and validates a compressed database backup before
  running migrations, enters Laravel maintenance mode for the migration/code
  switch, uses quota-safe hard links for the retained release, cleans failed
  release workspaces and incoming artifacts, and fails unless the production
  health endpoint returns HTTP 200.
- Vercel configuration exists in `vercel.json`, but no active production
  ownership is established there. Hostinger remains the production boundary.

Read [`HOSTINGER_DEPLOY_GUIDE.md`](HOSTINGER_DEPLOY_GUIDE.md) before any
production operation. Do not commit or run `git add -A` for unrelated local
files when preparing a deployment.
