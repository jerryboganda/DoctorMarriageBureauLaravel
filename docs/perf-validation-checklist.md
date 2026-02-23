# Performance Validation Checklist (Wave 1)

## Build/Static
- [x] React production build passes (`npm.cmd run build`)
- [ ] Laravel test suite (run in container during deploy gate)
- [ ] Laravel route sanity check on production container
- [x] Local route cache compile passes (`php artisan route:cache`)

## Route Normalization (Backward-Safe)
- [x] Duplicate named routes removed from web/admin/api/support route sets
- [x] Conflicting resource-generated names remapped to `*.resource.*`
- [x] API member resource names remapped to `api.member.*`
- [x] Auth name collisions normalized (`logout.get`, `verification.resend.get`, `password.update.email_code`)
- [ ] Production route cache compile passes on VPS
- [ ] Smoke-test legacy route helpers used by Blade views

## Realtime Consistency
- [ ] Send proposal from discovery card, verify status badge updates immediately
- [ ] Send proposal from profile modal, verify card + modal + dashboard consistency
- [ ] Accept/withdraw flow updates dashboard and discovery without hard refresh
- [ ] Notification `View Details` always navigates to valid destination

## Messaging/Unread
- [ ] Dashboard message preview unread count matches chat-list unseen count
- [ ] Opening chat marks unseen messages correctly and updates counters

## Navigation/SPA Behavior
- [ ] Route transitions preserve local state where expected
- [ ] No forced full reloads for status refresh
- [ ] Focus/visibility return triggers safe data refresh without request storms

## Stability
- [ ] No infinite render loops
- [ ] No console/network error loops
- [ ] No broken auth/session/onboarding flows

## Production Post-Deploy
- [ ] Core smoke test: auth, discovery, dashboard, notifications, messages, profile
- [ ] Monitor logs for 30-60 minutes
- [ ] Rollback not required
