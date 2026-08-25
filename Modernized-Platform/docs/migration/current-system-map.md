# Doctor Marriage Bureau — Current System Architecture Map & Discovery Analysis

> **HISTORICAL.** Live product is Astro 5 + Go in `Modernized-Platform/` (`apps/web`, `services/api`). Laravel + React below is the **legacy** system this document was written against. Do not implement new work in Laravel/React.

**Document Status:** Historical baseline (pre-cutover)  
**Audited Codebases (legacy):** `Web App/` (Laravel 11 + React 18 SPA) & `Marketing-Website/` (Astro 5)  
**Production VPS:** `185.252.233.186` (`panel.doctormarriagebureau.com.pk`, `doctormarriagebureau.com.pk`)  
**Target Migration:** Go Modular Monolith + Astro 5 React Islands + PostgreSQL 16 + Redis 7 + Cloudflare R2 + Rust Compute  

---

## 1. System Topology & Operational Infrastructure

The current production system runs on a single VPS hosting Docker containers managed behind Nginx Proxy Manager:

```text
                                 [ Ingress Traffic (Port 80/443) ]
                                                │
                                                ▼
                     ┌──────────────────────────────────────────────────────┐
                     │          Nginx Proxy Manager Container               │
                     │         (nginx-proxy-manager-app-1)                  │
                     │  SSL / Let's Encrypt / HTTP->HTTPS Auto Redirect     │
                     └───────────────┬──────────────────────┬───────────────┘
                                     │                      │
                  panel.doctormarriagebureau.com.pk         │ doctormarriagebureau.com.pk
                                     │                      │
                                     ▼                      ▼
┌─ dmb-webapp Container (Port 8088) ──────────────────┐  ┌─ dmb-astro-website (Port 8089) ──┐
│ Ubuntu 24.04 + PHP 8.3 FPM + Nginx + Node 22        │  │ Astro 5 SSG Marketing Portal     │
│ Memory Limit: 768MB                                 │  │ Nginx Alpine Web Server          │
│                                                     │  │ 36 Pre-rendered Blog Articles    │
│ Daemons (Supervisord):                              │  │ Static Public Landing Pages      │
│  ├── 1. php-fpm8.3 (FastCGI Socket)                 │  └──────────────────────────────────┘
│  ├── 2. nginx (Reverse proxy for API & SPA bundle)  │
│  ├── 3. php artisan queue:work (default queue)      │
│  └── 4. cron (php artisan schedule:run / min)       │
│                                                     │
│ Static Assets: /var/www/html/public/spa-dist/       │
│ Laravel API:   /var/www/html/routes/api.php         │
└──────────────────────┬──────────────────────────────┘
                       │ TCP 3306
                       ▼
┌─ dmb-mysql Container (Port 3306) ───────────────────┐
│ MySQL 8.0 InnoDB (utf8mb4_unicode_ci)               │
│ Memory Limit: 512MB | Volume: dmb-mysql-data        │
│ 105 Domain & Lookup Tables                          │
└─────────────────────────────────────────────────────┘
```

---

## 2. Component Boundaries & Responsibilities

| Component | Current Technology | Target Replacement | Key Responsibilities |
|---|---|---|---|
| **Marketing Portal** | Astro 5 + Tailwind (`Marketing-Website/`) | Unified `apps/web/src/pages/*` | Public SEO pages, blog articles, pricing teaser, high-intent landing funnels. |
| **Member Web App** | React 18.3 SPA (`Web App/New User Panel Frontend/`) | Astro 5 + React Islands (`apps/web/`) | Discovery grid/map, profile editor, proposals, realtime chat, courtship progression, settings. |
| **Backend API** | Laravel 11 / PHP 8.3 (`Web App/app/`) | Go 1.22 Modular Monolith (`services/api/`) | High-throughput REST API, WebSocket hub, Sanctum/Bcrypt auth, matchmaking algorithms, quotas. |
| **Primary Relational Store** | MySQL 8.0 InnoDB | PostgreSQL 16 Alpine | User accounts, profiles, proposals, chats, transactions, normalized relational taxonomy. |
| **Ephemeral / Cache / PubSub**| File Cache / Database Queue | Redis 7 Alpine | Session cache, presence tracking, rate limiting, typing broadcast, async worker queues. |
| **Media & Photos** | Local Disk `/public/uploads/` | Cloudflare R2 + CDN | User avatars, gallery albums, voice/video bios, payment receipts, private blurring. |
| **Compute Heavy Jobs** | Synchronous PHP / Intervention | Rust Compute Engine (`services/rust-compute/`) | Perceptual image hashing (`img_hash`), duplicate doctor photo detection, vectorized batch scoring. |

---

## 3. Core Business Domains & Laravel Service Layer

The existing business logic is concentrated in 7 domain services under `Web App/app/Services/`:

### 3.1 Match Compatibility Engine (`MatchScoreService.php`)
- Calculates a weighted 0–100% compatibility score across **6 core factors**:
  1. **Medical Specialty & Career Level:** Doctors matching equivalent or compatible specialties.
  2. **Age Difference:** Penalty applied for age deviation exceeding partner preferences.
  3. **Religious Sect & Lineage:** Sect (Sunni, Shia, etc.) and Biradari compatibility weighting.
  4. **Geographic Proximity:** City/Province match, domestic vs overseas diaspora matching.
  5. **Height & Physical Attributes:** Matching specified range filters.
  6. **Marital Status & Family Values:** Never Married vs Divorced/Widowed alignment.
- Handles user-weighted priority levels: `dealbreaker`, `must_have`, `nice_to_have`, `flexible`.

### 3.2 Proposal & Quota State Machine (`InterestService.php` & `MemberCommunicationLimitService.php`)
- Manages proposal lifecycle transitions: `pending` $\rightarrow$ `accepted` $\rightarrow$ `rejected` $\rightarrow$ `withdrawn`.
- **Free/Unverified Quota:** Maximum 5 lifetime proposals; blocked from initiating messages.
- **Premium Quotas:** Decrements `proposal_limit` and `contact_view_limit` from active package.
- **Auto-provisioning:** Upon acceptance, automatically creates a new `ChatThread` between users and emits WebSocket notification.

### 3.3 Referral & Affiliate Engine (`ReferralService.php`)
- Multi-tier referral code tracking with fraud prevention (IP matching, self-referral lockout).
- Auto-provisions free package upgrades or wallet balance upon referred user email verification / first purchase.

### 3.4 Account Security & Step-Up Auth (`AccountSecurityController.php`)
- **Sanctum Authentication:** Cryptographic API Bearer tokens with device tracking.
- **2FA TOTP:** RFC 6238 compliant authenticator app support with backup recovery codes.
- **Step-Up Authentication:** High-risk actions (disabling 2FA, ownership transfer, revoking active sessions) require a 10-minute temporary `StepUpAuthToken`.

---

## 4. Critical Data Flows

### 4.1 Discovery & Parametric Search Flow
```text
[ React Frontend ] ──GET /api/discovery/search?city=1&speciality=Cardiology──► [ Go API / PostgreSQL ]
                                                                                      │
                                                                           Compound B-Tree Index
                                                                           (is_approved, gender, city_id)
                                                                                      │
[ Candidate JSON + Blurred Media URLs ] ◄─────────────────────────────────────────────┘
```

### 4.2 Real-time Messaging Flow
```text
[ Client A ] ──WS SEND {thread_id: 12, message: "Hello Doctor"}──► [ Go WebSocket Gateway ]
                                                                            │
                                                       ┌────────────────────┴────────────────────┐
                                                       ▼                                         ▼
                                            [ PostgreSQL INSERT ]                       [ Redis Pub/Sub Fan-out ]
                                            chats table durable record                  channel: chat.12 & user.B
                                                                                                 │
                                                                                                 ▼
                                                                                       [ Client B Browser WS ]
```

---

## 5. Identified Architectural Bottlenecks in Current Stack

1. **PHP-FPM Worker Starvation:** Synchronous HTTP requests for heavy biodata PDF generation and large image uploads tie up PHP-FPM workers, degrading API responsiveness.
2. **N+1 Query Overheads:** Aggregating 9 separate profile tables (`members`, `physical_attributes`, `spiritual_backgrounds`, etc.) in Eloquent generates multiple sub-queries per profile card.
3. **Local Filesystem Media Bottleneck:** Storing user media directly on local disk makes horizontal scaling impossible and prevents edge caching.
4. **Missing Perceptual Duplicate Detection:** Uploaded medical credential photos and profile pictures are not verified for duplicates across the database.

---

## 6. Migration Blueprint & Transition Roadmap

The modernization follows the **Strangler Pattern**:
1. **Phase 1:** Monorepo scaffold & architectural discovery documentation (Complete).
2. **Phase 2:** PostgreSQL 16 DDL migration & MySQL-to-PostgreSQL zero-loss ETL pipeline.
3. **Phase 3:** Go Modular Monolith API implementing all endpoints with exact response parity.
4. **Phase 4:** Astro 5 web platform embedding optimized React Islands.
5. **Phase 5:** Rust compute worker for perceptual photo deduplication and batch match scoring.
6. **Phase 6:** Automated golden-case differential parity validation before production cutover.
