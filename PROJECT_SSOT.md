# Doctor Marriage Bureau — Single Source of Truth

> **Active Stack:** Astro 5 + React Web App (`Modernized-Platform/apps/web`)  
> **Legacy Status:** Laravel PHP (`app/`, `dmb-webapp`) and WordPress are **LEGACY**. All future development, editing, and feature additions must take place ONLY in the Astro + React web platform.  
> **Repository:** `jerryboganda/DoctorMarriageBureauLaravel`  
> **Production branch:** `main`

## 1. Active Platform vs Legacy Systems

| Area | Status | Location / Role |
|---|---|---|
| **Active Member & Public Web App** | **Active Stack (Source of Truth)** | `Modernized-Platform/apps/web` (Astro 5 + React + Tailwind) |
| **Active Backend API** | **Active API** | `Modernized-Platform/services/api` (Go / REST API) |
| **Laravel PHP Monolith** | **LEGACY (DO NOT EDIT)** | `app/`, `resources/`, `routes/` |
| **Old User Panel** | **LEGACY (DO NOT EDIT)** | `New User Panel Frontend/` |
| **WordPress Marketing Site** | **LEGACY (DO NOT EDIT)** | Hostinger WordPress / `wordpress-plugin/` |

## 2. Demo & Quick Access Accounts

- **Primary Doctor Account**:
  - Email: `doctor@hospital.org` (or `03001234567`)
  - Password: `Doctor@123`
  - Name: `Dr. Faisal Maqsood` (Interventional Cardiologist)
- **Female Doctor Account**:
  - Email: `ayesha@hospital.org`
  - Password: `Doctor@123`
  - Name: `Dr. Ayesha Malik` (Dermatologist)
- **1-Click Quick Login**: Available directly on `/login/`.

## 2. Surface and ownership map

The project has two separate production sites on the same Hostinger account but
on separate quota types. The WordPress marketing website uses its separate
PHP/website quota with generous limits. The Laravel web app uses the project's
web-app quota. Treat them as separate application, document-root, and quota
boundaries, not as one deployable application. The Laravel release workflow
changes only the panel app; WordPress content and layout changes remain outside
that workflow.

### WordPress marketing website

- URL: <https://doctormarriagebureau.com.pk>
- Admin: <https://doctormarriagebureau.com.pk/wp-login.php>
- Host: same Hostinger account, separate WordPress installation.
- WordPress admin owns public page content, Elementor sections, navigation,
  header/footer, public social links, and marketing copy.
- The repository does not contain the live Elementor page JSON/content. Use
  WordPress admin → Pages → **Edit with Elementor** and Theme Builder for
  layout changes.
- The repository plugin is `wordpress-plugin/dmb-bridge.php`; the distributable
  archive is `wordpress-plugin/dmb-bridge.zip`. Never put the bridge secret or
  WordPress credentials in documentation.

### Laravel member web app

- URL: <https://panel.doctormarriagebureau.com.pk>
- Source: `New User Panel Frontend/`.
- Stack: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Zustand.
- The root `server.js` serves `public/user-panel/` and proxies `/api`,
  `/sanctum`, `/broadcasting`, media paths, and Soketi WebSocket paths.
- Build entry: root `npm run hostinger:build`, which builds the user panel.
- The mobile app and the unused `Admin Panel Frontend/` directory are not
  included by the Hostinger deployment archive.

### Laravel API and admin

- Canonical API base: `https://panel.doctormarriagebureau.com.pk/api`.
- Route definitions: `routes/api.php`, `routes/web.php`, and `routes/admin.php`.
- Health check: `GET /api/health`.
- Admin URL: `https://panel.doctormarriagebureau.com.pk/admin`.
- Laravel owns authentication, member profiles, discovery/matching, proposals,
  chat, notifications, Family Portal, communities, progression, payments,
  packages, blogs, support, and settings.
- Authentication uses Laravel Sanctum. API clients must use the route contract;
  do not copy endpoint lists from old VPS documents without checking routes.
- `api.doctormarriagebureau.com.pk` is referenced by historical documents and
  older frontend defaults. It is not the current workflow health target and
  must not be treated as canonical without an explicit DNS decision.

### Mobile app

- Source: `DMB Mobile App/`.
- Stack: Expo SDK 55 preview packages, React Native, Expo Router, NativeWind
  v4, Zustand, `expo-secure-store`.
- Bundle identifier: `com.doctorsmarriagebureau.app`.
- Node constraint: use Node 18–20; Node 24 is known to break Metro.
- CI/build commands: `npm run ci`, `npm run build:web`, and EAS commands from
  the mobile README.
- It consumes the same Laravel API but has an independent native release
  boundary. No mobile artifact is deployed by the Hostinger workflow.

### Admin Panel Frontend directory

`Admin Panel Frontend/` exists in the checkout, but the current root
`package.json`, GitHub Actions workflow, and Hostinger artifact build target
`New User Panel Frontend/`. Treat the admin directory as non-production unless
an explicit deployment decision updates those boundaries.

## 3. Packages, prices, and public marketing

- Laravel public package page: `/packages`.
- WordPress marketing package page: `https://doctormarriagebureau.com.pk/packages/`.
- Current public offer copy: **PKR 5,000 for 3 months** and **PKR 8,000 for
  6 months**. Laravel database package records remain authoritative for
  checkout and active status.
- API package feed: `GET /api/packages`; add-ons: `GET /api/addons`.
- Admin package management: `/admin/packages` (**Premium Packages**).
- Authoritative price/limit fields are the database `packages` records:
  `name`, `price`, `validity`, proposal/contact/gallery limits, and `active`.
- React and mobile checkout consume the API. WordPress Elementor price sections
  are marketing copy only and can drift; verify against Laravel before
  publishing or changing prices.
- Laravel settings under `resources/views/admin/marketing/` and
  `resources/views/admin/website_settings/` support the Laravel-rendered
  surface. They do not replace WordPress Elementor ownership.
- Laravel Admin → Settings → **Social Media Login** holds OAuth provider
  configuration. Public social links belong to the WordPress Elementor
  header/footer. The approved public URLs are:
  - Facebook: `https://www.facebook.com/profile.php?id=61583278677249`
  - YouTube: `https://youtube.com/@DoctorsMarriageBureauo`
  - Instagram: `https://www.instagram.com/doctorsmarriagebureauofficial`
  - TikTok: `https://www.tiktok.com/@doctorsmariagebuearu`

## 4. Blog and proposal synchronization

Laravel Admin → Blog is the source of truth for synchronized posts. The
WordPress plugin exposes:

- `POST /wp-json/dmb/v1/sync-post`
- `POST /wp-json/dmb/v1/delete-post`
- `POST /wp-json/dmb/v1/proposals`

Requests are authenticated with a runtime secret in the Laravel environment
and WordPress plugin configuration. The secret value must never appear in
source, logs, issues, or documentation.

Operational commands run through `Hostinger Remote Exec`:

```powershell
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="php artisan wp:sync-blogs"
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="php artisan wp:import-blogs"
```

`wp:sync-blogs` pushes Laravel posts. `wp:import-blogs` imports existing
published WordPress posts; linked records are skipped. Scheduled sync jobs are
defined by the Laravel scheduler. The plugin also supplies the Elementor
widget `dmb_random_proposals_slider` and shortcode `[dmb_proposals]`.

## 5. Hostinger deployment boundary

Hostinger details are intentionally limited to non-secret routing information:

- Server endpoint: `145.79.25.8`, SSH port `65002`.
- Application root:
  `/home/u776151780/domains/panel.doctormarriagebureau.com.pk/public_html`.
- Direct SSH from the local network is blocked; GitHub Actions is the
  supported access path.
- The artifact excludes `.env`, `.env.*`, all `storage/app` data, add-ons,
  uploads, logs, caches, mobile source, `.github`, and development-only trees
  `node_modules`.
- `$HOME/.dmb-persistent` is the only durable Laravel filesystem boundary. It
  holds `config/production.env`, the immutable production `APP_KEY`, uploads,
  `storage/app`, admin add-ons, legacy SQL backups, logs, file sessions,
  pre-migration database backups, release metadata, incoming artifacts, locks,
  and retained releases.
- The live checkout uses validated symlinks into that external directory for
  `.env`, `public/uploads`, `public/addons`, `sqlbackups`, `storage/app`,
  `storage/logs`, and `storage/framework/sessions`. `public/storage` is
  recreated by the release shell.
- Hostinger disables PHP's `symlink()` function; deployment symlinks, including
  `public/storage`, are created by the release shell.
- The MySQL database is external to the checkout. Every release creates and
  validates a compressed snapshot in `$HOME/.dmb-persistent/db-backups` before
  migrations; the latest seven are retained by default.
- Releases on the shared Hostinger filesystem use hard-linked live files to
  avoid doubling account quota usage. Failed release directories and incoming
  artifacts are removed immediately.
- Hostinger hPanel Git auto-deploy must be disabled. It is not concurrency-aware
  and can replace the checkout outside the protected GitHub Actions release.

Approved workflows:

| Workflow | File | Boundary |
|---|---|---|
| Hostinger Build And Deploy | `.github/workflows/deploy.yml` | Build artifact; deploy only when `deploy=true` |
| Hostinger Deploy Dispatch | `.github/workflows/hostinger-deploy-dispatch.yml` | Approved manual full deployment of latest `main` |
| Hostinger Remote Exec | `.github/workflows/hostinger-remote-exec.yml` | Approved remote commands |
| Hostinger Production Status | `.github/workflows/hostinger-status-check.yml` | Host and `/api/health` check; scheduled every six hours |

Do not change workflow behavior as part of a documentation task. GitHub
repository/environment secrets are runtime inputs only; document names, never
values.

## 6. CI and release validation

GitHub Actions CI configuration is `.github/workflows/ci.yml`. Its current
`Project CI` workflow runs:

1. `backend-quality`: Composer validation, PHP lint/format/static analysis,
   and backend tests.
2. `backend-mysql-smoke`: MySQL schema import, migrations, API regression, and
   database-backup validation.
3. `user-frontend-quality`: npm lint, Prettier check, TypeScript check, and
   production build for `New User Panel Frontend/`.

GitHub Actions is the only CI/CD platform for this repository. Production
deployment, remote commands, and health checks also use the workflows under
`.github/workflows/`.

The CI workflow does not deploy to Hostinger, build native mobile releases, or
validate the WordPress/Elementor site; those remain separate boundaries.

## 7. Environment and safety rules

- `.env`, `.env.local`, `.env.production`, SSH keys, OAuth credentials,
  payment credentials, mail credentials, sync secrets, database passwords, and
  tokens are runtime-only and must remain uncommitted.
- CI creates a disposable `.env` from `.env.example`; it is not production
  configuration.
- Production blog sync requires the relevant `WP_*` variables, including the
  Hostinger DNS/origin override `WP_RESOLVE_TO_IP`; values belong in the
  server-side environment and must not be copied here.
- Keep every `.env` assignment on its own line. In particular, do not join the
  sync secret to another setting.
- Use `php artisan optimize:clear` and rebuild caches only after the
  environment has been securely provisioned.
- Never run `php artisan key:generate` in production. The existing `APP_KEY`
  must survive every release because database values such as 2FA secrets are
  encrypted with it.
- Never use logs, OTP output, test accounts, or copied production databases in
  documentation.

## 8. Known contradictions and historical context

- Older SSOT/release docs say `master`, VPS, Docker Compose production, or
  `api.doctormarriagebureau.com.pk`; current workflows say `main`, Hostinger,
  and the panel API. The current boundary in this document wins.
- The performance release documents under `docs/` are historical records and
  explicitly refer to a retired VPS.
- Some mobile documents say Expo 54/55 or claim production readiness. The
  checked-in package currently uses Expo 55 preview dependencies, while
  production approval still depends on the current health and release checks.
  Treat those documents as feature history, not a production approval.
- `vercel.json` is a legacy/configured build surface with no evidence of
  current production ownership. Do not deploy there unless ownership is
  explicitly approved.
- The checked-in WordPress bridge contains runtime authentication material.
  This documentation does not reproduce it; rotation/removal is a separate
  security change and is intentionally outside a documentation-only task.
