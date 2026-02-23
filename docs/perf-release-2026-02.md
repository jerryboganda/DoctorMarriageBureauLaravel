# Production Release Runbook - Perf Wave 1 (2026-02-23)

## Branch
- `perf/wave1-realtime-stability`
- merged into `master` as commit `1f2c723`
- tag: `release/perf-wave1-2026-02`

## Pre-Deploy Safety
1. Record current commit hash on VPS.
2. Create DB backup dump.
3. Backup `.env` and runtime config snapshots.
4. Prepare rollback commit references.

## Deploy Steps
1. `git pull` latest code on VPS.
2. Build frontend image and restart frontend container.
3. Run safe additive migration for performance indexes.
4. Clear + rebuild Laravel caches.
5. Restart queue workers if required.
6. Smoke test core flows.

## Rollback
1. Checkout previous release commit and redeploy frontend image.
2. Run migration rollback for additive index migration if needed.
3. Restore backed-up env/config if runtime regressions appear.

## Wave 1 Scope Implemented
- Realtime proposal-state consistency across discovery/dashboard/modal.
- Notification routing hardening (`View Details`).
- Polling overlap reduction and fetch race safeguards.
- Chat unread semantics fix (`seen`-based counting).
- Discovery/interest resource query and N+1 optimizations.
- Additive DB indexes for interest/view/chat hot paths.

## Post-Deploy Observation Window
- 30-60 minutes active log/latency monitoring.
- Validate stale-state regressions are resolved without hard refresh.

## Deployment Execution Log (2026-02-23 UTC)
- VPS path: `/root/doctormarriagebureau`
- DB backup: `backups/db_20260223_014312.sql.gz`
- Env backup: `backups/.env_20260223_014312`
- Release marker: `backups/release_20260223_014312.txt`
- Migration applied:
  - `2026_02_23_210000_add_performance_indexes_for_realtime_queries`
- Frontend image rebuilt and container recreated successfully.
- Laravel `route:cache` failed due pre-existing duplicate named route conflict (`api.razorpay.payment`), so route cache was cleared and deployment proceeded with config cache enabled.
- Runtime hardening applied on VPS:
  - `APP_DEBUG` switched from `true` to `false`
  - Laravel config cache rebuilt after env update
- Follow-up route collision fixes deployed:
  - Renamed legacy callback route name to avoid Razorpay duplicate:
    - `api.razorpay.legacy_payment` (kept `api.razorpay.payment` for `pay-with-razorpay`)
  - Fixed Instamojo route name typo collision:
    - `api.instamojo.pay` (was incorrectly `api.phonepe.pay`)
  - Namespaced API image request route names to prevent cross-panel collisions:
    - `api.gallery_image_view_request_accept/reject`
    - `api.profile_picture_view_request_accept/reject`
