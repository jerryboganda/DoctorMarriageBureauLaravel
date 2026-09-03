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
| **WordPress Marketing Site** | **LEGACY (DO NOT EDIT)** | External WordPress / `wordpress-plugin/` |

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

The production web app and API are hosted on the **Production VPS (`185.252.233.186`)** using Docker Compose. The WordPress marketing website is an external installation.

### WordPress marketing website

- URL: <https://doctormarriagebureau.com.pk>
- Admin: <https://doctormarriagebureau.com.pk/wp-login.php>
- Host: External WordPress installation.
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
- Deployment location: Production VPS (`185.252.233.186`) at `/opt/docker/doctormarriagebureau`.

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
- It consumes the same API but has an independent native release boundary.

### Admin Panel Frontend directory

`Admin Panel Frontend/` exists in the checkout, but the active platform is `Modernized-Platform/apps/web`.

## 3. Packages, prices, and public marketing

- Laravel public package page: `/packages`.
- WordPress marketing package page: `https://doctormarriagebureau.com.pk/packages/`.
- Current public offer copy: **PKR 5,000 for 3 months** and **PKR 8,000 for
  6 months**. Database package records remain authoritative for
  checkout and active status.
- API package feed: `GET /api/packages`; add-ons: `GET /api/addons`.
- Admin package management: `/admin/packages` (**Premium Packages**).
- Authoritative price/limit fields are the database `packages` records:
  `name`, `price`, `validity`, proposal/contact/gallery limits, and `active`.
- React and mobile checkout consume the API. WordPress Elementor price sections
  are marketing copy only and can drift; verify against the API before
  publishing or changing prices.
- Settings under `resources/views/admin/marketing/` and
  `resources/views/admin/website_settings/` support the server-rendered
  surface. They do not replace WordPress Elementor ownership.
- Admin → Settings → **Social Media Login** holds OAuth provider
  configuration. Public social links belong to the WordPress Elementor
  header/footer. The approved public URLs are:
  - Facebook: `https://www.facebook.com/profile.php?id=61583278677249`
  - YouTube: `https://youtube.com/@DoctorsMarriageBureauo`
  - Instagram: `https://www.instagram.com/doctorsmarriagebureauofficial`
  - TikTok: `https://www.tiktok.com/@doctorsmariagebuearu`

## 4. Blog and proposal synchronization

The blog and proposals API endpoints serve content dynamically to the external WordPress site:

- `POST /wp-json/dmb/v1/sync-post`
- `POST /wp-json/dmb/v1/delete-post`
- `POST /wp-json/dmb/v1/proposals`

Requests are authenticated with a runtime secret in the environment.
Operational commands run directly on the Production VPS (`185.252.233.186`):

```bash
ssh root@185.252.233.186 "docker exec -it dmb-webapp php artisan wp:sync-blogs"
ssh root@185.252.233.186 "docker exec -it dmb-webapp php artisan wp:import-blogs"
```

`wp:sync-blogs` pushes Laravel posts. `wp:import-blogs` imports existing
published WordPress posts; linked records are skipped. Scheduled sync jobs are
defined by the Laravel scheduler. The plugin also supplies the Elementor
widget `dmb_random_proposals_slider` and shortcode `[dmb_proposals]`.

## 5. Production VPS deployment boundary (185.252.233.186)

The production deployment runs on the dedicated Production VPS:

- Server IP: `185.252.233.186`
- Application root on VPS: `/opt/docker/doctormarriagebureau`
- Stack: Docker Compose (`Modernized-Platform/infra/docker/docker-compose.production.yml` and root stack)
- Proxy: Nginx Proxy Manager (`nginx-proxy-manager-app-1`)
- Database: PostgreSQL 16 (`doctor_marriage_bureau`) container `dmb-postgres`

Approved workflows:

| Workflow | File | Boundary |
|---|---|---|
| Production VPS Deploy | `.github/workflows/deploy.yml` | Deploys `main` directly to VPS `185.252.233.186` via SSH |
| VPS Data Sync | `.github/workflows/vps-data-sync.yml` | Synchronizes data to new Postgres DB on VPS `185.252.233.186` |

## 6. CI and release validation

GitHub Actions CI configuration is `.github/workflows/ci.yml`. Its current
`Project CI` workflow runs backend and frontend quality checks.
Production deployment runs via `.github/workflows/deploy.yml`.

The CI workflow does not build native mobile releases or validate the external WordPress site; those remain separate boundaries.

## 7. Environment and safety rules

- `.env`, `.env.local`, `.env.production`, SSH keys, OAuth credentials,
  payment credentials, mail credentials, sync secrets, database passwords, and
  tokens are runtime-only and must remain uncommitted.
- CI creates a disposable `.env` from `.env.example`; it is not production
  configuration.
- Never run key generation or destructive database commands against production.
- Never use logs, OTP output, test accounts, or copied production databases in
  documentation.

## 8. Known contradictions and historical context

- The production source of truth is the **Production VPS (`185.252.233.186`)** running `main`.
- `vercel.json` is a legacy/configured build surface with no evidence of
  current production ownership. Do not deploy there unless ownership is
  explicitly approved.
- The checked-in WordPress bridge contains runtime authentication material.
  This documentation does not reproduce it; rotation/removal is a separate
  security change and is intentionally outside a documentation-only task.
