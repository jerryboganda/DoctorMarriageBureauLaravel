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
| Production VPS deployment, remote access, health checks | [`VPS_DEPLOYMENT_GUIDE.md`](VPS_DEPLOYMENT_GUIDE.md) |
| Authentication/API behavior | [`AUTH_PRODUCTION_READY.md`](AUTH_PRODUCTION_READY.md) |
| Mobile quick start | [`DMB Mobile App/README.md`](DMB%20Mobile%20App/README.md) |
| CI definition | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |

## Repository and source of truth

- GitHub: [`jerryboganda/DoctorMarriageBureauLaravel`](https://github.com/jerryboganda/DoctorMarriageBureauLaravel)
- Production branch: `main`
- Local repository: `f:\projects\Doctor Marriage Bureau`
- Production VPS: `185.252.233.186`
- The GitHub repository is the source of truth for all services, frontends, and documentation.
- Production deploys are automated via GitHub Actions (`.github/workflows/deploy.yml`).

## Public surfaces and ownership

| Surface | URL | Owner and boundary |
|---|---|---|
| Marketing website | <https://doctormarriagebureau.com.pk> | External WordPress marketing site. |
| WordPress administration | <https://doctormarriagebureau.com.pk/wp-login.php> | WordPress admin and Elementor access. |
| Member web app | <https://panel.doctormarriagebureau.com.pk> | Web app and user portal on Production VPS (`185.252.233.186`). |
| API service | <https://panel.doctormarriagebureau.com.pk/api> | API running on Production VPS (`185.252.233.186`). Health endpoint: `/api/health`. |
| Admin panel | <https://panel.doctormarriagebureau.com.pk/admin> | Member, package, and operational administration. |
| Mobile app | `DMB Mobile App/` | React Native/Expo source; consumes the API. |

The marketing website and member web app are separate installations. The member web app runs directly on Production VPS (`185.252.233.186`), while WordPress content is managed on the marketing website.

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
`.env.local`.

### Mobile app

Use Node.js 18–20 for the current Expo/Metro toolchain:

```powershell
cd "f:\projects\Doctor Marriage Bureau\DMB Mobile App"
npm ci
npm run typecheck
npm start
npx eas build --platform android --profile preview --no-wait
```

The mobile app target is independent of the VPS web release.

## Validation and deployment

- GitHub Actions is the automated CI/CD platform.
- Production deploys run via `.github/workflows/deploy.yml` directly targeting the Production VPS (`185.252.233.186`).
- Direct SSH access to the Production VPS:
  ```bash
  ssh root@185.252.233.186
  cd /opt/docker/doctormarriagebureau
  docker compose ps
  ```
- Detailed production architecture and emergency operations are documented in [`VPS_DEPLOYMENT_GUIDE.md`](VPS_DEPLOYMENT_GUIDE.md).

