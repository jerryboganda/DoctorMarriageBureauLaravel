# Doctor Marriage Bureau — Parity Test Plan & Differential Verification Harness

> **HISTORICAL.** Live product is Go + Astro. Laravel is no longer the reference implementation for new work.

**Target:** 100% Behavioral, HTTP Status, JSON Schema, and Database State Parity  
**Legacy reference (historical):** Laravel 11  
**Live implementation:** Go modular monolith (`services/api`) + Astro (`apps/web`) + PostgreSQL 16 + Redis 7  
**Test Harness:** Python 3.11+ / Pytest Differential Automation Suite (`tests/parity/`)  

---

## 1. Differential Testing Methodology

The verification harness executes the same HTTP request sequence against both the legacy Laravel server and the new Go server, validating:
1. **HTTP Status Code:** Must match exactly (e.g. 200, 201, 401, 403, 422, 423).
2. **Standard Error Code Envelopes:** Exact string matches on error codes (e.g., `ACCOUNT_BLOCKED`, `PASSWORD_CHANGE_REQUIRED`, `INVALID_CREDENTIALS`, `QUOTA_EXCEEDED`).
3. **JSON Response Structure:** Key names, types, and nested object hierarchies must align.
4. **Database State Mutations:** Database records created/updated must match foreign keys and cascade rules.

```text
                             [ Pytest Differential Runner ]
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
          [ Request to Laravel ]                         [ Request to Go API ]
       http://localhost:8088/api/...                  http://localhost:8080/api/v1/...
                    │                                             │
                    ▼                                             ▼
          [ Response A (JSON) ]                         [ Response B (JSON) ]
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           ▼
                              [ DeepDiff Comparison Engine ]
                                  - Structural Key Parity
                                  - Value Equivalence (modulo timestamps/IDs)
                                  - Assert 0 Differences
```

---

## 2. Test Suites & Verification Matrix

### Suite 1: Authentication & Account Security (`test_auth_parity.py`)
- **TC-AUTH-01: Legacy Password Hash Verification:** Assert that Go's `passwords.go` validates legacy Laravel `$2y$` and `$2a$` Bcrypt hashes without forcing password resets.
- **TC-AUTH-02: 2FA TOTP Challenge Flow:** Trigger signin for 2FA-enabled account; verify Go returns `requires_2fa: true` and temporary challenge token matching Laravel's response.
- **TC-AUTH-03: Gated Status Codes:** Verify disabled accounts receive `403 ACCOUNT_BLOCKED` and forced resets receive `423 PASSWORD_CHANGE_REQUIRED`.
- **TC-AUTH-04: Multi-device Token Revocation:** Confirm revoking token revokes only targeted device session.

### Suite 2: Profile Center & Privacy Suite (`test_profile_parity.py`)
- **TC-PROF-01: 9-Section Aggregation:** Compare `/api/member/profile/full` vs `/api/v1/profiles/full` for identical nested keys: `basics`, `family`, `career`, `lifestyle`, `spiritual`, `expectations`.
- **TC-PROF-02: Dynamic Quality Score:** Assert 100% calculation score match across 10 sample test profiles with varying levels of completion.
- **TC-PROF-03: Field-level Privacy Blurring:** Verify blurred photo URLs and hidden contact details are masked when accessed by non-connected or non-premium users.
- **TC-PROF-04: Biodata PDF Stream:** Verify PDF output headers (`Content-Type: application/pdf`) and generated document structure.

### Suite 3: Discovery & Match Intelligence Suite (`test_discovery_parity.py`)
- **TC-DISC-01: 6-Factor Compatibility Scoring:** Compare score outputs between `MatchScoreService.php` and Go's `scoring.go` across 50 test pairs. Assert identical percentages.
- **TC-DISC-02: Parametric Search Filters:** Execute 20 filter combinations (Age, Biradari, Religion, Medical Specialty, Metro City); assert exact candidate set match.
- **TC-DISC-03: Suppression Lists:** Assert that blocked (`ignored_users`) and existing connected profiles are excluded from candidate feeds.
- **TC-DISC-04: Travel Mode Candidate Injection:** Verify candidates in active travel locations appear in target city search results.

### Suite 4: Proposals, Quotas & State Machine (`test_matching_parity.py`)
- **TC-PROP-01: Free User Quota Ceiling:** Assert that an unverified free user cannot express interest beyond 5 candidates, returning `403 PROPOSAL_QUOTA_EXCEEDED`.
- **TC-PROP-02: Proposal Acceptance & Chat Provisioning:** Send interest $\rightarrow$ accept $\rightarrow$ assert `express_interests.status = 'accepted'` and new `chat_threads` record auto-created.
- **TC-PROP-03: Proposal Decline with Reason:** Verify proposal decline updates status to `'rejected'` and logs decline reason code.
- **TC-PROP-04: Shortlist Bookmark Idempotency:** Assert adding the same candidate twice to shortlist returns success without duplicate database rows.

### Suite 5: Real-time Messaging & WebSockets (`test_chat_parity.py`)
- **TC-CHAT-01: Bidirectional Message Delivery:** Send message via Go WebSocket gateway; assert recipient receives message frame within 20ms.
- **TC-CHAT-02: Message Persistence & Unread Counter:** Assert new message is stored in PostgreSQL and recipient's unread counter increments by 1.
- **TC-CHAT-03: In-Chat Biodata Sharing:** Verify instant biodata card sharing renders system event in message history.

### Suite 6: Payments, Subscriptions & Entitlements (`test_payments_parity.py`)
- **TC-PAY-01: Stripe Webhook Provisioning:** Replay test Stripe checkout webhook; verify membership package validity date is extended and proposal quotas replenished.
- **TC-PAY-02: Coupon Discount Engine:** Test percentage and fixed amount coupons; verify calculated discount matches Laravel penny-for-penny.
- **TC-PAY-03: Manual Pakistani Payment Workflow:** Submit JazzCash/EasyPaisa transaction ID and proof key; assert status is `'due'` pending admin review.

### Suite 7: Database ETL & Data Integrity (`verify_data_integrity.py`)
- **TC-DB-01: Table Row Count Equality:** Assert 100% row count match across all 40+ migrated tables between MySQL and PostgreSQL.
- **TC-DB-02: Foreign Key Cascade Validation:** Assert 0 orphaned rows in child tables (`physical_attributes`, `families`, `chats`, `express_interests`).
- **TC-DB-03: SHA-256 Column Checksums:** Compute hash sums on primary data columns to verify zero character corruption or encoding issues.

---

## 3. Execution Runbook & Pass/Fail Criteria

### Running the Differential Parity Suite:
```bash
# 1. Start reference Laravel & MySQL
docker compose -f docker-compose.yml up -d

# 2. Start Go API, PostgreSQL & Redis
cd Modernized-Platform
docker compose -f infra/docker/docker-compose.yml up -d

# 3. Execute Pytest Parity Test Suite
pytest tests/parity/ -v --html=parity_report.html
```

### Pass Criteria for Production Cutover:
1. **100% Passed Tests:** Zero test failures across all 7 suites.
2. **Sub-10ms API Latency:** 95th percentile response time < 10ms on Go API (vs ~120ms on Laravel).
3. **Zero Orphaned Records:** Data integrity script validates 100% referential integrity in PostgreSQL.
4. **WebSocket Concurrency:** Minimum 5,000 concurrent active WebSocket connections sustained without dropped packets.
