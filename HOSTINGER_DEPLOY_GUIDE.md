# Hostinger Production Deployment Guide

> **Reviewed:** 2026-07-31
> **Repository:** `jerryboganda/DoctorMarriageBureauLaravel`
> **Branch:** `main`

## Production boundary

Hostinger shared hosting is the production boundary for the Laravel member
panel and API:

- Panel: <https://panel.doctormarriagebureau.com.pk>
- API: <https://panel.doctormarriagebureau.com.pk/api>
- Health: `GET /api/health`
- App root:
  `/home/u776151780/domains/panel.doctormarriagebureau.com.pk/public_html`
- Host endpoint: `145.79.25.8:65002`
- Marketing WordPress: <https://doctormarriagebureau.com.pk>
- WordPress admin: <https://doctormarriagebureau.com.pk/wp-login.php>

Hostinger and WordPress share an account but are separate applications on
separate quota types. The WordPress marketing site uses its separate
PHP/website quota with generous limits. The Laravel web app uses the project's
web-app quota. Their application, document-root, and quota boundaries must
remain separate. WordPress public pages and Elementor layouts are not deployed
by the Laravel workflow, and the Laravel workflow changes only
`panel.doctormarriagebureau.com.pk`.

The production environment is provisioned server-side and `/api/health` must
return HTTP 200 before a deploy is considered successful. Deployment artifacts
deliberately exclude `.env` and `.env.*`.

Direct SSH from the local development network is blocked by the router/ISP.
Use GitHub Actions for every production server operation. Do not add a
credential, key, password, token, or sync secret to this file.

## Approved GitHub Actions workflows

| Workflow | File | Use |
|---|---|---|
| `Hostinger Build And Deploy` | `.github/workflows/deploy.yml` | Builds the artifact on push/manual run; deploy job runs only with `deploy=true` |
| `Hostinger Deploy Dispatch` | `.github/workflows/hostinger-deploy-dispatch.yml` | Approved manual full deployment of the latest `main` |
| `Hostinger Remote Exec` | `.github/workflows/hostinger-remote-exec.yml` | Runs a supplied command in the production app root |
| `Hostinger Production Status` | `.github/workflows/hostinger-status-check.yml` | Reports host/git state and calls the health endpoint |

The workflows consume GitHub repository/environment secrets at runtime. The
repository documents only their names and purpose, never their values.

Hostinger's hPanel Git auto-deploy must be **disabled**. It is not the production
release mechanism, does not use the deployment lock, and may fresh-clone the
checkout while GitHub Actions is releasing. The approved GitHub Actions
workflow is the only production deployment path.

## Persistence contract

`public_html` is replaceable application code. No irreplaceable state may live
only inside it. The durable boundary is:

```text
$HOME/.dmb-persistent/
├── config/production.env       # chmod 600; includes immutable APP_KEY
├── uploads/                    # member photos and uploaded media
├── storage/app/                # Laravel public and private application files
├── addons/                     # administrator-uploaded add-on archives
├── sqlbackups/                 # legacy administrator-created SQL backups
├── logs/                       # retained, daily-rotated Laravel logs
├── sessions/                   # file sessions, when that driver is active
├── db-backups/                 # validated pre-migration .sql.gz snapshots
├── deployments/               # idempotency markers
├── incoming/                   # short-lived deployment artifacts
├── locks/                      # release concurrency lock
└── releases/                   # one retained extracted release by default
```

The release script migrates legacy state into this directory, then recreates
and validates these links on every run:

- `.env → $HOME/.dmb-persistent/config/production.env`
- `public/uploads → $HOME/.dmb-persistent/uploads`
- `public/addons → $HOME/.dmb-persistent/addons`
- `sqlbackups → $HOME/.dmb-persistent/sqlbackups`
- `storage/app → $HOME/.dmb-persistent/storage/app`
- `storage/logs → $HOME/.dmb-persistent/logs`
- `storage/framework/sessions → $HOME/.dmb-persistent/sessions`
- `public/storage → storage/app/public` through a shell-created symlink

Hostinger disables PHP's `symlink()` function, so the release script must create
`public/storage` with the shell. Do not replace this with `php artisan
storage:link` on production.

Laravel cache data, compiled views, and cached configuration are disposable and
are rebuilt during release. The MySQL database is already external to the
checkout; each deployment creates a compressed backup before migrations and
aborts if that backup is missing, empty, or invalid.

Never run `php artisan key:generate` in production. `APP_KEY` encrypts existing
application data, including 2FA secrets and recovery codes, and must remain
unchanged for the lifetime of the production database.

### Recovering upload media

Restore recovered media into `$HOME/.dmb-persistent/uploads`, not directly into
`public/uploads`. Use `Hostinger Remote Exec` for the operation, preserve the
original `uploads/all/...` paths, and compare restored filenames with the
`uploads.file_name` database values. After recovery, verify a representative
member photo through its public HTTPS URL; an SSH-side file listing alone does
not prove the web server can follow the symlink.

## Deploy latest `main`

Only deploy a reviewed commit that is already pushed to `main`:

```powershell
cd "D:\Projects\Doctor Marriage Bureau"
git status
git push origin main
gh workflow run "Hostinger Deploy Dispatch" --repo jerryboganda/DoctorMarriageBureauLaravel
```

The same action is available in GitHub: **Actions → Hostinger Deploy Dispatch
→ Run workflow**. Wait for both the build and deploy jobs. A green artifact
build does not prove that production is configured or healthy. The deploy job
now polls `/api/health` and fails unless production returns HTTP 200.

## Check production status

```powershell
gh workflow run "Hostinger Production Status" --repo jerryboganda/DoctorMarriageBureauLaravel
curl.exe -i https://panel.doctormarriagebureau.com.pk/api/health
```

Expected healthy response is HTTP 200 with an `ok` status payload.

## Safe remote operations

Run commands through the workflow, not a local SSH session:

```powershell
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="php artisan --version"
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="df -h"
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="tail -100 storage/logs/laravel.log"
```

After secure environment provisioning, use cache/migration commands deliberately
and record their result:

```powershell
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="php artisan migrate --force"
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache"
```

Do not print `.env`, secrets, tokens, OTP values, or database credentials in
workflow output. `Hostinger Remote Exec` serializes operations on the shared
account, retries only the SSH connection preflight, and sends the requested
command exactly once. `Hostinger Production Status` uses the same preflight
and keepalive settings, so a temporary refusal of new sessions is reported as
an SSH preflight failure rather than being confused with an application-health
failure. If the final command reports a broken SSH stream, do not blindly
rerun it: its remote completion is unknown and a destructive command could
otherwise execute twice. Verify its marker/state with a short read-only
command first.

Hostinger shared hosting can temporarily refuse SSH while a large recursive
operation consumes the account's CPU, I/O, process, or inode budget. Keep
remote commands bounded to one known project path; do not run account-wide
`find`, `du`, or `rm -rf` over the foreground SSH session. For large cleanup,
use the hPanel File Manager or a separately guarded background operation, then
verify completion before opening another SSH session. The Laravel deployment
workflow has its own serialized release lock and health check.

## Environment requirements

The server-side environment source of truth is
`$HOME/.dmb-persistent/config/production.env`, not the checkout `.env`. Create
or update it only through an approved secure server operation; never print it.
The release script links it into `public_html` with mode 600. At minimum,
validate the values for:

- Laravel application key, environment, URL, logging, session, cache, queue,
  and database connection.
- Mail/SMTP and optional SMS provider.
- Sanctum/CORS origins for the panel.
- OAuth provider settings and payment gateway credentials.
- WordPress sync settings: `WP_SYNC_ENABLED`, `WP_BASE_URL`,
  `WP_POST_STATUS`, `WP_RESOLVE_TO_IP`, and the runtime `WP_SYNC_SECRET`.

Keep one variable per line. `WP_RESOLVE_TO_IP` is required by the current
Hostinger-to-WordPress routing arrangement. Never paste the actual values into
this guide, GitHub issues, commands, or logs.

## WordPress ownership and blog sync

Marketing site administration is separate:

1. WordPress admin: <https://doctormarriagebureau.com.pk/wp-login.php>.
2. Elementor owns the public landing page, header/footer, public social links,
   and marketing sections.
3. `DMB Laravel Sync` (`wordpress-plugin/dmb-bridge.php`) receives Laravel
   posts and proposal payloads.
4. Laravel Admin → Blog remains the source of truth for synchronized posts.

Run sync commands remotely:

```powershell
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="php artisan wp:sync-blogs"
gh workflow run "Hostinger Remote Exec" --repo jerryboganda/DoctorMarriageBureauLaravel -f command="php artisan wp:import-blogs"
```

`wp:sync-blogs` pushes Laravel posts. `wp:import-blogs` imports published
WordPress posts and skips already linked records. The plugin provides
`dmb_random_proposals_slider` for Elementor and `[dmb_proposals]` for
shortcodes. Install/update it in WordPress admin using the reviewed archive
`wordpress-plugin/dmb-bridge.zip`; do not edit production plugin files
manually.

## Packages and prices

- Public Laravel package page: `/packages`.
- API: `GET /api/packages` and `GET /api/addons`.
- Admin: `/admin/packages` (**Premium Packages**).
- Database records, not WordPress copy or frontend constants, are authoritative
  for package price, validity, limits, and active status.

## Deployment safety and recovery

- A release is serialized by a lock outside the checkout and is idempotent by
  GitHub release ID, even after a checkout replacement.
- All Hostinger workflows use the shared `hostinger-production` concurrency
  group, so a deployment, status check, or remote maintenance command cannot
  compete for the same account SSH/resources.
- Failed extracted releases and their incoming artifacts are deleted
  immediately. Application failures are not retried; only SSH
  disconnects/timeouts are retried, preventing repeated attempts from
  exhausting the Hostinger account quota.
- Composer installation and artifact checks run in the extracted release before
  the live code is changed.
- On Hostinger's shared filesystem, the validated release is overlaid with hard
  links so the live checkout and retained release do not consume duplicate file
  blocks. A normal copy is used only if the paths are on different filesystems.
- A gzip-tested database snapshot is written to
  `$HOME/.dmb-persistent/db-backups` before every migration. Seven snapshots are
  retained by default (`DMB_DB_BACKUP_RETENTION` can change this).
- Laravel maintenance mode covers migrations and the live code switch. A failed
  release attempts to restore application availability and the workflow remains
  red.
- The workflow independently polls `/api/health` after the SSH release.
- The uploaded artifact is removed after success and one extracted release is
  retained by default (`DMB_RELEASE_RETENTION` can change this).
- `Hostinger Production Status` validates every required persistent symlink as
  well as the public health endpoint.

Do not place backups at the application root. Store database/media recovery
material under `$HOME/.dmb-persistent` so checkout cleanup or hPanel cannot
remove it.

### Rollback notes

- Preserve the last known-good commit and health result before a release.
- If application code is bad, redeploy the last known-good `main` commit.
- Do not overwrite or delete
  `$HOME/.dmb-persistent/config/production.env` during rollback.
- If the health endpoint remains HTTP 500, inspect Laravel logs through
  `Hostinger Remote Exec`, verify the environment exists and is readable, then
  clear/rebuild caches after correction.
- Database restore is destructive and must use an approved Hostinger recovery
  procedure and a selected validated snapshot from `db-backups`; code rollback
  alone does not reverse migrations, payments, or data changes.

## Non-production/legacy surfaces

- `vercel.json` exists, but Vercel is not an approved production deployment
  boundary.
- `docs/perf-release-2026-02.md` records a retired VPS deployment and is
  historical.
- `api.doctormarriagebureau.com.pk` appears in older documents/code and is not
  the current Hostinger health target.
