# Performance Audit Baseline (2026-02-23)

## Scope
- Laravel API + React user panel + production VPS runtime
- Focus: stale-state regressions, realtime UX consistency, request/query efficiency

## Baseline Signals
- Discovery and sidebar polling caused repeated overlapping calls across `/discovery`, `/member/interest-requests`, `/member/chat-list`, `/member/notifications/feed`.
- Proposal state could be optimistic in UI but overwritten by stale refresh payloads.
- Notification `View Details` navigation relied on narrow type mapping and could no-op on variant type names.
- Chat unread counters in multiple backend endpoints used `read_at` against `chats`, while chat flow uses `seen`.
- `ActiveUserResource` + `MemberUtility` + interest resources had repeated per-row lookups (N+1 profile metadata/interest status lookups).

## Initial Frontend Build Baseline
- Main chunk: ~266 KB (`assets/index-SYjF-eB8.js`)
- Heavy lazy chunk: ~985 KB (`assets/html2pdf-B6k3aq1q.js`, lazy loaded)

## Primary Bottlenecks Categorized
- Critical:
  - Proposal status desync after mutation due optimistic state being replaced by stale server map.
  - Unread count query mismatch (`read_at` vs `seen`) causing chat badge inconsistency.
- High:
  - Polling overlap/race in discovery/sidebar/messages flows.
  - N+1 resource composition for discovery and interest lists.
- Medium:
  - Inconsistent notification type routing behavior.
  - Avatar URL normalization gaps causing broken asset calls.

## Wave 1 Target
- Lock single canonical proposal state path (list/detail/modal).
- Prevent stale response overwrite with request sequencing + cancellation.
- Normalize unread semantics and navigation routing.
- Reduce unnecessary polling pressure and backend row-by-row resource queries.

## Route Cache Baseline/Follow-up
- Baseline route-cache blockers were repeated named routes across API/web/admin/support resources and auth overlays.
- Follow-up normalization introduced scoped generated names (`*.resource.*`, `api.member.*`) while preserving existing custom names in use.
- Target state: `php artisan route:cache` compiles successfully in local and production runtime.
