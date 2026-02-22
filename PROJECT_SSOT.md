# 🏥 DOCTOR MARRIAGE BUREAU (DMB) — Single Source of Truth

> **Last Updated**: February 22, 2026
> **Document Purpose**: THE ONLY file any AI agent or developer needs to fully understand this project.
> **Supersedes**: `memory_bank.md`, `QUICK_START.md`, `AUTH_PRODUCTION_READY.md`, `linux vps memory file.md`, `DMB Mobile App/INTEGRATION_STATUS.md`, `DMB Mobile App/DEPLOYMENT_READY.md`, `DMB Mobile App/README.md`, `New User Panel Frontend/README.md`

---

## 1. PROJECT IDENTITY

**Doctors Marriage Bureau (DMB)** is a professional matrimonial platform for doctors and medical professionals. It features AI-driven matching, private communication, a "Family Portal" for trusted profile management, and a tiered subscription monetization system.

| Property | Value |
|----------|-------|
| **Total API Endpoints** | 285+ |
| **System Status** | ✅ Production Live |
| **Mobile App** | ✅ 100% Feature Parity |
| **Web Panel** | ✅ Production Live |
| **GitHub Repo** | `github.com/jerryboganda/DoctorMarriageBureauLaravel` |
| **Branch** | `master` |

---

## 2. THE TRINITY ARCHITECTURE

Three synchronized components. **Any change to Backend API responses requires immediate updates to BOTH frontends.**

### 2.1 Backend (Laravel) — The Core

| Property | Value |
|----------|-------|
| **Framework** | Laravel 10+ (PHP 8.2+) |
| **Local Path** | `c:\laragon\www\marriagebureau\` |
| **VPS Path** | `/root/doctormarriagebureau` |
| **Production API** | `https://api.doctormarriagebureau.com.pk/api` |
| **Admin Panel** | `https://api.doctormarriagebureau.com.pk/admin` |
| **Auth** | Laravel Sanctum (Token-based) |
| **Real-time** | Laravel Echo + Soketi (Pusher Protocol) |
| **Email** | Brevo SMTP (`smtp-relay.brevo.com:587`, user: `8a2be7001@smtp-brevo.com`) |
| **From Address** | `noreply@doctormarriagebureau.com.pk` |
| **Payments** | PayPal, Stripe, Paystack, Razorpay, SSLCommerz, PhonePe, Instamojo |

### 2.2 User Web Panel (React) — The Dashboard

| Property | Value |
|----------|-------|
| **Framework** | React 18 + Vite 6.4.1 + TypeScript |
| **Local Path** | `New User Panel Frontend/` |
| **Production URL** | `https://panel.doctormarriagebureau.com.pk` |
| **Styling** | Tailwind CSS v3 (`primary: #d41173`) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **State** | React Context + Local State |
| **Build** | Docker (Node 18-alpine → Nginx) |
| **Bundle** | Route-split Vite bundles; `FamilyPortalView` reduced to ~30 KB and heavy PDF engine lazy-loaded (`html2pdf` ~985 KB chunk loaded on demand) |

### 2.3 Mobile App (React Native) — The Native Experience

| Property | Value |
|----------|-------|
| **Framework** | React Native + Expo SDK 55 |
| **Local Path** | `DMB Mobile App/` |
| **Bundle ID** | `com.doctorsmarriagebureau.app` |
| **Styling** | NativeWind v4 + Tailwind v3 |
| **State** | Zustand + expo-secure-store |
| **Animations** | Moti + Reanimated |
| **Build** | EAS (Expo Application Services) |
| **Node Requirement** | 18-20 (NOT 24+, breaks Metro) |

---

## 3. INFRASTRUCTURE & VPS

### 3.1 Server Details

| Property | Value |
|----------|-------|
| **IP** | `185.252.233.186` |
| **OS** | Ubuntu 24.04.3 LTS |
| **User** | `root` (SSH key auth) |
| **SSH Key** | `C:\Users\Admin\.ssh\id_rsa` |
| **Docker** | v29.1.5 |

### 3.2 Docker Containers

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `marriagebureau-app` | Custom (PHP-FPM) | — | Laravel API + CLI |
| `marriagebureau-web` | nginx:alpine | 8086:80 | Nginx Proxy to App |
| `marriagebureau-db` | mysql:8.0 | — | MySQL Database |
| `marriagebureau-frontend` | Custom (Node→Nginx) | 3000:80 | React Web Panel |
| `marriagebureau-soketi` | soketi | 6001 | WebSocket Server |

### 3.3 Docker Compose Build Args (Frontend)

```yaml
VITE_API_BASE_URL: https://api.doctormarriagebureau.com.pk/api
VITE_PUSHER_APP_KEY: 3f7e1c4b5a6d7e8f9a0b1c2d3e4f5a6b
VITE_PUSHER_HOST: soketi.polytronx.com
VITE_PUSHER_PORT: 443
VITE_PUSHER_SCHEME: https
```

### 3.4 Database Credentials

| Property | Value |
|----------|-------|
| **Database** | `marriagebureau` |
| **User** | `marriagebureau` |
| **Password** | `MarriageBureauPass123!` |
| **Root Password** | `MarriageBureauRootPass123!` |

### 3.5 Other Services on VPS

| Port | Service |
|------|---------|
| 80/443 | Nginx Proxy Manager |
| 81 | NPM Admin UI |
| 8000/9443 | Portainer |
| 8085 | StreamVault |
| 8083 | Polytronx WordPress |
| 8081 | Aims Academy WordPress |
| 8080 | Amad Diagnostic Centre |
| 9000 | Ovo WPP |

---

## 4. ACCESS CREDENTIALS

| Service | URL/Host | Email/User | Password |
|---------|----------|------------|----------|
| **Admin Panel** | `/admin` | `admin@admin.com` | `welcome123` |
| **Test User** | Panel/Mobile | `mindreader420123@gmail.com` | `test1234` |
| **VPS SSH** | `185.252.233.186` | `root` | SSH Key (`~/.ssh/id_rsa`) |
| **MySQL** | Docker internal | `marriagebureau` | `MarriageBureauPass123!` |
| **MySQL Root** | Docker internal | `root` | `MarriageBureauRootPass123!` |

---

## 5. DEPLOYMENT STRATEGY (MANDATORY)

> **⚠️ CRITICAL: ALWAYS use Git-based deployment. NEVER use direct SCP/file copy.**

### 5.1 Standard Backend + Frontend Deploy

```powershell
# 1. LOCAL: Commit and push
cd e:\laragon\www\DMB
git add -A
git commit -m "descriptive commit message"
git push origin master

# 2. VPS: Pull, rebuild, deploy (single SSH command)
ssh root@185.252.233.186 "cd /root/doctormarriagebureau && git pull origin master && docker exec marriagebureau-app php artisan optimize:clear && docker compose build frontend && docker compose up -d frontend"
```

### 5.2 Backend-Only Deploy (No frontend changes)

```powershell
ssh root@185.252.233.186 "cd /root/doctormarriagebureau && git pull origin master && docker exec marriagebureau-app php artisan optimize:clear"
```

### 5.3 Frontend-Only Deploy

```powershell
ssh root@185.252.233.186 "cd /root/doctormarriagebureau && git pull origin master && docker compose build frontend && docker compose up -d frontend"
```

### 5.4 Database Migrations

```powershell
ssh root@185.252.233.186 "cd /root/doctormarriagebureau && docker exec marriagebureau-app php artisan migrate --force"
```

### 5.5 Cache & Nginx

```bash
# Clear all Laravel caches
docker exec marriagebureau-app php artisan optimize:clear

# Nginx config has Cache-Control: no-cache for index.html, but expires 1y for assets
# Users may need hard refresh after JS bundle hash changes
```

### 5.6 Debugging on Production

```bash
# View Laravel logs
docker exec marriagebureau-app tail -100 /var/www/html/storage/logs/laravel.log

# View OTP codes in logs
docker exec marriagebureau-app grep "VERIFICATION\|OTP" /var/www/html/storage/logs/laravel.log | tail -20

# Run artisan tinker
docker exec -it marriagebureau-app php artisan tinker

# Run a PHP script on VPS
docker exec marriagebureau-app php /var/www/script_name.php

# MySQL access
docker exec -it marriagebureau-db mysql -u root -pMarriageBureauRootPass123! marriagebureau
```

---

## 6. AUTHENTICATION SYSTEM

### 6.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Create account |
| POST | `/api/signin` | Login (email/phone + password) |
| POST | `/api/social-login` | OAuth (Google/Facebook) |
| POST | `/api/logout` | Invalidate token |
| POST | `/api/send-email-verification` | Send email OTP |
| POST | `/api/verify-email-code` | Verify email OTP |
| POST | `/api/send-phone-verification` | Send phone OTP |
| POST | `/api/verify-phone-code` | Verify phone OTP |
| POST | `/api/forgot/password` | Initiate password reset (auto-detects email/phone) |
| POST | `/api/verify/password/reset` | Verify reset OTP |
| POST | `/api/reset/password` | Complete password reset |
| POST | `/api/auth/2fa/challenge` | 2FA verification |
| GET | `/api/user-by-token` | Get current user |

### 6.2 Auth Flow Notes

- **Signin** accepts `email_or_phone` field (both email and phone)
- **Forgot Password** auto-detects email vs phone from `email_or_phone` field
- **Phone Formats**: `+923001234567`, `03001234567`, `3001234567` (all normalized to E.164)
- **OTP Codes**: Logged to `storage/logs/laravel.log` (SMS provider not active for MVP)
- **Token**: Laravel Sanctum with IP + User-Agent tracking
- **2FA**: Optional, challenge-based
- **Auto-Approval**: New users auto-approved (no admin intervention)
- **Social Login**: Google + Facebook OAuth 2.0

### 6.3 Security Features

- bcrypt password hashing
- Sanctum token auth (revocable)
- Email + Phone OTP verification
- 2FA support with recovery codes
- Step-up auth for sensitive actions
- 5-minute OTP expiry
- Token metadata tracking (IP, User-Agent, timestamp)

---

## 7. COMPLETE API REFERENCE (285+ Endpoints)

### 7.1 Profile Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/full-profile` | Complete profile (aggregated) |
| POST | `/api/full-profile/update` | Bulk update all sections |
| GET | `/api/member/basic-info` | Basic info section |
| POST | `/api/member/basic-info/update` | Update basic info |
| GET | `/api/member/physical-attributes` | Physical attributes |
| POST | `/api/member/physical-attributes/update` | Update physical |
| GET | `/api/member/spiritual-background` | Religious info |
| POST | `/api/member/spiritual-background/update` | Update spiritual |
| GET | `/api/member/family-info` | Family background |
| POST | `/api/member/family-info/update` | Update family |
| GET | `/api/member/life-style` | Lifestyle prefs |
| POST | `/api/member/life-style/update` | Update lifestyle |
| GET | `/api/member/hobbies-interests` | Hobbies |
| POST | `/api/member/hobbies/update` | Update hobbies |
| GET | `/api/member/partner-expectation` | Partner preferences |
| POST | `/api/member/partner-expectation/update` | Update preferences |
| GET | `/api/member/residency-info` | Residency details |
| POST | `/api/member/residency-info/update` | Update residency |
| GET | `/api/member/astronomic` | Astrology info |
| POST | `/api/member/astronomic/update` | Update astrology |
| GET | `/api/member/attitude-behavior` | Attitude/behavior |
| POST | `/api/member/attitude-behavior/update` | Update attitude |
| GET | `/api/member/introduction` | Profile introduction |
| POST | `/api/member/introduction-update` | Update introduction |
| POST | `/api/member/contact-info/update` | Update contact |
| POST | `/api/member/address/update` | Update address |
| POST | `/api/member/change/password` | Change password |
| POST | `/api/upload-profile-picture` | Upload profile photo |
| GET | `/api/profile/download-biodata` | Download PDF biodata |

### 7.2 Education & Career (CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/member/education` | List / Add education |
| GET/PUT/DELETE | `/api/member/education/{id}` | Get / Update / Delete |
| GET/POST | `/api/member/career` | List / Add career |
| GET/PUT/DELETE | `/api/member/career/{id}` | Get / Update / Delete |

### 7.3 Gallery & Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/gallery-image` | List gallery images |
| POST | `/api/member/gallery-image` | Upload gallery image |
| DELETE | `/api/member/gallery-image/{id}` | Delete image |
| POST/DELETE | `/api/member/profile/media/voice` | Upload/Delete voice intro |
| POST/DELETE | `/api/member/profile/media/video` | Upload/Delete video intro |
| GET | `/api/member/gallery-image-view-request` | Pending image requests |
| POST | `/api/member/gallery-image-view-request` | Request image access |
| POST | `/api/member/gallery-image-view-request/accept` | Accept request |
| POST | `/api/member/gallery-image-view-request/reject` | Reject request |

### 7.4 Profile Quality & Visibility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/profile/quality-score` | Profile completeness |
| GET/POST | `/api/member/profile/visibility` | Get/Toggle visibility |
| GET | `/api/member/profile/full` | Full profile (ProfileCenter) |
| GET | `/api/member/profile/history` | Edit history |
| POST | `/api/member/profile/section/{section}` | Update specific section |
| POST | `/api/member/profile/preference-priorities` | Set preference weights |

### 7.5 Discovery & Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discovery` | Discovery feed (agent_picks, high_intent, recently_active) |
| GET | `/api/discovery/search` | Search with filters (q, age_min, age_max, religion, profession) |
| GET | `/api/match-intelligence/{id}` | AI match analysis |
| POST | `/api/match-tuner/tune` | Adjust matching preferences |
| GET | `/api/member/public-profile/{id}` | View public profile |

**Discovery API Response**: Returns `ActiveUserResource` which includes:
- `interest_status`: `1` (no interest), `0` (interest sent), `'do_response'` (received interest)
- `interest_text`: Human-readable status
- `shortlist_status`: `1` (not shortlisted), `0` (shortlisted)
- Profile data: name, age, location, specialty, matchPercentage, avatarUrl, etc.

### 7.6 Interest & Shortlist

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/member/express-interest` | Send interest/proposal |
| GET | `/api/member/interest-requests` | Incoming interests |
| POST | `/api/member/interest-accept` | Accept interest |
| POST | `/api/member/interest-reject` | Reject interest |
| GET | `/api/member/my-interests` | Sent interests |
| GET | `/api/check-interest-status/{userId}` | Check status |
| GET | `/api/member/my-shortlists` | Shortlisted profiles |
| POST | `/api/member/add-to-shortlist` | Add to shortlist |
| POST | `/api/member/remove-from-shortlist` | Remove from shortlist |
| GET | `/api/member/my-profile-viewers` | Who viewed profile |

### 7.7 Messaging & Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/chat-list` | All chat threads |
| GET | `/api/member/chat-view/{id}` | Messages in thread |
| POST | `/api/member/chat-reply` | Send message |
| POST | `/api/member/chat/old-messages` | Load older messages |

### 7.8 Progression Pipeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/progression/active` | Active progressions |
| GET | `/api/member/progression/stages` | Stage definitions |
| GET | `/api/member/progression/partner/{id}` | Progression with partner |
| POST | `/api/member/progression/update-stage` | Update stage |

### 7.9 Family Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/family` | Family data |
| POST | `/api/family/update-profile` | Update family profile |
| POST | `/api/family/guardian/add` | Add guardian |
| POST/PUT | `/api/family/guardian/update/{id}` | Update guardian |
| DELETE | `/api/family/guardian/delete/{id}` | Delete guardian |
| POST | `/api/family/photo/upload` | Upload family photo |
| DELETE | `/api/family/photo/delete/{id}` | Delete family photo |
| POST | `/api/family/approval/approve/{id}` | Approve match |
| POST | `/api/family/approval/reject/{id}` | Reject match |

### 7.10 Account Security

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/account/security-status` | Security overview |
| POST | `/api/member/account/2fa/setup` | Enable 2FA |
| POST | `/api/member/account/2fa/verify` | Verify 2FA |
| DELETE | `/api/member/account/2fa` | Disable 2FA |
| DELETE | `/api/member/account/devices/{tokenId}` | Revoke device |
| DELETE | `/api/member/account/devices-others` | Revoke all other |
| POST | `/api/member/account/step-up/initiate` | Step-up auth |
| POST | `/api/member/account/deactivate` | Deactivate |
| POST | `/api/member/account/delete` | Delete permanently |

### 7.11 Profile Ownership & Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/account/ownership` | Ownership status |
| POST | `/api/member/account/ownership/transfer` | Initiate transfer |
| POST | `/api/member/account/managers/invite` | Invite manager |
| PUT | `/api/member/account/managers/{id}/permissions` | Update permissions |
| DELETE | `/api/member/account/managers/{id}` | Remove manager |

### 7.12 Subscriptions & Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | Available packages |
| POST | `/api/member/package-purchase` | Purchase package |
| GET | `/api/member/package-purchase-history` | Purchase history |
| GET | `/api/addons` | Available addons |
| POST | `/api/member/addon-purchase` | Purchase addon |
| POST | `/api/member/coupons/validate` | Validate coupon |
| GET | `/api/payment-types` | Payment methods |

### 7.13 Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/wallet` | Wallet details |
| GET | `/api/member/my-wallet-balance` | Balance |
| POST | `/api/member/wallet-recharge` | Recharge |
| POST | `/api/member/wallet-withdraw-request-store` | Request withdrawal |

### 7.14 Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/notifications` | All notifications |
| GET | `/api/member/notifications/feed` | Notification feed |
| POST | `/api/member/notifications/mark-read` | Mark read |
| GET | `/api/member/mark-all-as-read` | Mark all read |
| GET/POST | `/api/member/notifications/preferences` | Notification prefs |

### 7.15 Support & Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/my-tickets` | List tickets |
| POST | `/api/member/support-ticket/store` | Create ticket |
| GET | `/api/member/support-ticket/{id}` | View ticket |
| POST | `/api/member/ticket-reply` | Reply to ticket |
| GET | `/api/member/support-ticket/categories` | Categories |

### 7.16 Communities, Referrals, Stories, Misc

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/member/communities` | List/Create communities |
| POST | `/api/member/communities/{id}/join` | Join |
| DELETE | `/api/member/communities/{id}/leave` | Leave |
| GET | `/api/member/referral-code` | Referral code |
| GET | `/api/member/referred-users` | Referred users |
| GET | `/api/member/my-referral-earnings` | Earnings |
| GET | `/api/happy-stories` | Success stories |
| POST | `/api/member/happy-story` | Submit story |
| GET | `/api/member/profile-dropdown` | All dropdown options |
| GET | `/api/member/countries` | Countries list |
| GET | `/api/member/states/{countryId}` | States |
| GET | `/api/member/cities/{stateId}` | Cities |
| GET | `/api/member/religions` | Religions |
| POST | `/api/member/report-member` | Report member |
| POST | `/api/member/add-to-ignore-list` | Block user |
| POST | `/api/member/verification-info-store` | Submit verification docs |
| POST | `/api/onboarding/complete` | Complete onboarding |
| POST | `/api/update-device-token` | Update FCM token |

### 7.17 Dashboard Widgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/incoming-interests` | Recent interests |
| GET | `/api/dashboard/mutual-match` | Mutual matches |
| GET | `/api/dashboard/today-matches` | Today's matches |
| GET | `/api/dashboard/recent-visitors` | Recent visitors |

---

## 8. DATABASE SCHEMA

### 8.1 Core Tables (60+)

| Table | Description |
|-------|-------------|
| `users` | Core account (email, password, role, approved, blocked) |
| `members` | Profile (gender, birthday, specialization, is_agent_pick, is_high_intent, is_visible, travel_mode, onboarding_completed) |
| `addresses` | Multi-type addresses |
| `educations` | Multiple education entries per user |
| `careers` | Multiple career entries per user |
| `physical_attributes` | Height, weight, complexion |
| `spiritual_backgrounds` | Religion, caste, sub-caste |
| `partner_expectations` | Matching criteria + `general` (free text ideal partner description) |
| `hobbies` | User hobbies |
| `lifestyles` | Diet, smoke, drink, property, property_details, living_with, sleep_schedule, personality_tags |
| `astrologies` | Birth time, rashi, nakshatra |
| `recidencies` | Citizenship, visa status |
| `attitudes` | Personality traits |
| `families` | Family information |

### 8.2 Relationship Tables

| Table | Description |
|-------|-------------|
| `express_interests` | Interest/proposal requests between users |
| `shortlists` | Shortlisted profiles |
| `chat_threads` | Messaging threads |
| `chat_messages` | Individual messages |
| `profile_viewers` | Profile view logs |
| `ignored_users` | Blocked users |
| `member_reports` | Reported members |
| `member_progressions` | Match progression tracking |

### 8.3 Financial Tables

| Table | Description |
|-------|-------------|
| `packages` | Subscription packages |
| `package_payments` | Package purchases |
| `addon_products` | Individual addons |
| `addon_payments` | Addon purchases |
| `coupons` | Discount coupons |
| `wallets` | User wallets |
| `wallet_transactions` | Wallet history |

### 8.4 Support Tables

| Table | Description |
|-------|-------------|
| `support_tickets` | Support tickets |
| `support_categories` | Ticket categories |
| `support_replies` | Ticket replies |
| `happy_stories` | Success stories |
| `notifications` | User notifications |
| `profile_option_values` | Dropdown options (religion, caste, property, diet, etc.) |

---

## 9. FRONTEND COMPONENT MAP

### 9.1 React Web Panel (`New User Panel Frontend/`)

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `App.tsx` | Main shell, routing, proposal state | All navigation |
| `AuthModal.tsx` | Login/Signup/Social | `/signin`, `/signup`, `/social-login` |
| `DiscoveryView.tsx` | Browse profiles, search, filters | `/discovery`, `/discovery/search` |
| `ProfileDetailModal.tsx` | View another user's full profile | `/member/public-profile/{id}`, `/match-intelligence/{id}` |
| `ProfileEditView.tsx` | Edit own profile (all sections) | `/full-profile`, `/full-profile/update` |
| `ProposalModal.tsx` | Send proposal with message | `/member/express-interest` |
| `MatchIntelligenceModal.tsx` | AI compatibility analysis | `/match-intelligence/{id}` |
| `MatchTunerModal.tsx` | Adjust matching preferences | `/match-tuner/tune` |
| `MessagesView.tsx` | Chat interface | `/member/chat-list`, `/member/chat-view/{id}` |
| `SettingsView.tsx` | Security, 2FA, visibility, tickets | `/member/account/*`, `/member/my-tickets` |
| `FamilyPortalView.tsx` | Family management | `/family`, `/family/guardian/*` |
| `CommunityView.tsx` | Community browsing | `/member/communities` |
| `ProgressionView.tsx` | Match progression pipeline | `/member/progression/*` |
| `NotificationsView.tsx` | Notification feed | `/member/notifications` |
| `PaymentModal.tsx` | Package/addon purchase | `/packages`, `/addons` |
| `SubscriptionModal.tsx` | Subscription management | `/packages` |
| `WelcomeScreen.tsx` | Landing/homepage | `/home` |
| `ProfileGridCard` | Profile card in discovery grid | (inline in DiscoveryView.tsx) |

### 9.2 React Native Mobile (`DMB Mobile App/`)

| Screen | Purpose | Key APIs |
|--------|---------|----------|
| `app/login.tsx` | Login | `/signin` |
| `app/register/index.tsx` | Registration | `/signup`, `/send-*-verification` |
| `app/forgot-password.tsx` | Password reset | `/forgot/password`, `/reset/password` |
| `app/onboarding.tsx` | First-time setup | `/onboarding/complete` |
| `app/(tabs)/index.tsx` | Dashboard/Proposals | `/member/interest-requests`, `/dashboard/stats` |
| `app/(tabs)/discovery.tsx` | Browse profiles | `/discovery`, `/discovery/search` |
| `app/(tabs)/messages.tsx` | Chat | `/member/chat-list`, `/member/chat-view/{id}` |
| `app/(tabs)/profile.tsx` | Profile editor (6 tabs) | `/full-profile`, `/full-profile/update` |
| `app/(tabs)/settings.tsx` | Settings | `/member/account/*` |
| `app/family-portal.tsx` | Family portal | `/family` |
| `app/shortlist.tsx` | Shortlist management | `/member/my-shortlists` |
| `app/wallet.tsx` | Wallet | `/member/wallet` |
| `app/support-tickets.tsx` | Support | `/member/support-ticket` |
| `app/interests.tsx` | Sent/received interests | `/member/interest-requests`, `/member/my-interests` |
| `app/payment.tsx` | Package purchase | `/packages`, `/member/package-purchase` |
| `app/notifications.tsx` | Notifications | `/member/notifications` |
| `app/photo-gallery.tsx` | Photo management | `/member/gallery-image` |
| `app/member/[id].tsx` | View other profile | `/member/public-profile/{id}` |

---

## 10. API RESOURCE COMPATIBILITY (Trinity Sync)

> **CRITICAL**: Both frontends may use different field names for the same API data.

| Resource | React Panel Fields | Mobile App Fields | Notes |
|----------|-------------------|-------------------|-------|
| `ActiveUserResource` | `id`, `name`, `avatarUrl`, `interest_status`, `interestStatus` | `id`, `name`, `photo`, `interest_status` | Frontend normalizes via `normalizeProfile()` |
| `GalleryImageResource` | `is_main`, `privacy_level`, `url` | `is_primary`, `is_private`, `thumbnail` | Returns ALL fields |
| `SupportTicketResource` | `status` (capitalized) | `status_key` (lowercase) | Mobile normalizes |
| `IgnoredUserResource` | `user_id`, `photo`, `name` (root) | `ignored_user.id` (nested) | Returns BOTH structures |

### Route Prefix Guide

| Type | React Panel | Mobile App |
|------|-------------|------------|
| Auth | `/signin`, `/signup` | `/signin`, `/signup` |
| Public | `/packages`, `/addons` | `/packages`, `/addons` |
| Member | `/member/my-tickets` | `/member/my-tickets` |
| Dashboard | `/dashboard/stats` | `/member/dashboard` |

---

## 11. CRITICAL FRONTEND PATTERNS

### 11.1 Image Fallback System

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;
const DEFAULT_FEMALE_AVATAR = `${API_BASE}/assets/img/female-avatar-place.png`;
```

All `<img>` tags include `onError` fallback handlers.

### 11.2 Profile Normalization (Web Panel)

`DiscoveryView.tsx` has a `normalizeProfile()` function that maps API response fields to the `ProfileMatch` TypeScript interface. Key mappings:
- `interest_status` → `interestStatus` (1=none, 0=sent, 'do_response'=received)
- `interest_text` → `interestText`
- `avatarUrl` ← `profile.avatarUrl ?? profile.photo`
- Gender-based fallback avatar

### 11.3 Z-Index Hierarchy (Web Panel)

| Component | Z-Index |
|-----------|---------|
| Mobile sidebar overlay | `z-40` |
| Mobile sidebar | `z-50` |
| Desktop sidebar | `lg:z-20` |
| Filter panel | `z-[5]` |
| Dashboard header | `z-10` |
| Modal backdrops | `z-50` |

### 11.4 ProfileDetailModal — Critical Architecture Note

The `ProfileDetailModal.tsx` does **NOT** use `framer-motion`'s `motion.div` for its container. It uses a plain `<div>` with `fixed bottom-0` positioning. **Reason**: `motion.div` injects `transform: translateY(0px)` which creates a new containing block on mobile WebKit, breaking `overflow-y: auto` scroll. This was the root cause of 3 iterations of scroll bugs.

**Structure**: `div(fixed backdrop) → div(fixed bottom-0, height:95vh) → div(h-full overflow-y-auto) → [header + sticky tabs + content]`

---

## 12. KNOWN PATTERNS & CONSTRAINTS

| Pattern | Description |
|---------|-------------|
| **License Bypass** | `MemberUtility::member_check()` always returns `true` (self-hosted) |
| **Activation Bypass** | `CoreComponentRepository::instantiateShopRepository()` commented out |
| **Trusted Proxies** | Set to `'*'` in `TrustProxies.php` for reverse proxy HTTPS |
| **Dual Endpoints** | Both `/full-profile/update` (unified) and `/member/basic-info/update` (granular) exist |
| **Phone Normalization** | `PhoneUtility.php` centralizes all phone → `+923XXXXXXXXX` format |
| **Match Percentage** | Currently `rand(85, 98)` placeholder in `ActiveUserResource` |
| **SMS Not Active** | OTP codes logged to `storage/logs/laravel.log` (no SMS provider for MVP) |
| **Email Provider** | Brevo SMTP (migrated Feb 4, 2026) |
| **Google SMTP Blocked** | Ports 25, 587, 2525 blocked on VPS network; Brevo used instead |
| **i18n (Web Panel)** | `react-i18next` with `en.json` + `ur.json` locale files (~1350 keys each); Noto Sans Arabic font for Urdu |
| **i18n (Mobile App)** | `i18next` + `expo-secure-store` for persistence; same key structure as web |
| **Interest Status** | 5-state machine: `none`, `sent_pending`, `sent_accepted`, `received_pending`, `received_accepted` — derived from `interest_status` + `interest_text` |

---

## 13. RECENT CHANGES LOG

### February 22, 2026 - SPA Sync, Status Consistency, and Performance Hardening

| Commit | Change | Files | Status |
|--------|--------|-------|--------|
| `e01300a` | Fixed notification `View Details` action to route into dashboard proposals view | `New User Panel Frontend/components/NotificationsView.tsx` | Deployed |
| `54e61e9` | Added app-level sync trigger and immediate refresh wiring across App, Sidebar, Notifications, and Discovery | `New User Panel Frontend/App.tsx`, `New User Panel Frontend/components/Sidebar.tsx`, `New User Panel Frontend/components/NotificationsView.tsx`, `New User Panel Frontend/components/DiscoveryView.tsx` | Deployed |
| `de8a975` | Introduced canonical interest-status parser and unified proposal status handling across discovery/profile/proposal flows | `New User Panel Frontend/utils/interestStatus.ts`, `New User Panel Frontend/components/DiscoveryView.tsx`, `New User Panel Frontend/components/ProfileDetailModal.tsx`, `New User Panel Frontend/components/ProposalModal.tsx` | Deployed |
| `d0761b4` | Removed per-card member-info request pattern and switched to shared proposal status map from sent/received interests | `New User Panel Frontend/components/DiscoveryView.tsx`, `New User Panel Frontend/components/MatchIntelligenceModal.tsx` | Deployed |
| `960e22c` | Reduced background polling/load pressure, deduped refresh cycles, and improved fallback retry without hard reloads | `New User Panel Frontend/App.tsx`, `New User Panel Frontend/components/LoadingTimeoutFallback.tsx`, `New User Panel Frontend/components/MessagesView.tsx`, `New User Panel Frontend/components/Sidebar.tsx`, `New User Panel Frontend/components/RightSidebar.tsx`, `New User Panel Frontend/components/SettingsView.tsx` | Deployed |
| `1693d83` | Lazy-loaded biodata PDF dependencies so heavy PDF engine is no longer part of core Family Portal chunk | `New User Panel Frontend/components/FamilyPortalView.tsx` | Deployed |

Key outcomes:
- Proposal state now stays consistent after action, navigation, and reload.
- Notification updates are lighter and no longer force unnecessary broad refresh paths.
- Polling is visibility-aware to reduce wasted API/network work in inactive tabs.
- Family Portal initial load is faster; `html2pdf` is loaded only when download is requested.

### February 13, 2026 — Interest Status Awareness & i18n Completion

| Change | Files | Status |
|--------|-------|--------|
| **Backend ternary bug fix** — `MemberController::member_info` always returned `'received interest'` due to PHP operator precedence; fixed with proper if/elseif chain | `MemberController.php` | ✅ Deployed |
| **Backend `interest_text` added** to `member_info` response — differentiates pending vs accepted interest | `MemberController.php` | ✅ Deployed |
| **ProfileDetailModal 4-state CTA** — fetches `/member-info/{id}` alongside public-profile; shows: Chat Now (accepted), Awaiting Response (sent pending), Respond to Interest (received), Send Proposal (none) | `ProfileDetailModal.tsx` | ✅ Deployed |
| **DiscoveryView ProfileGridCard 5-state badges** — emerald/chat for accepted, amber/clock for pending, blue/heart for received, send buttons only when no interest | `DiscoveryView.tsx` | ✅ Deployed |
| **ProposalModal + MatchIntelligenceModal guards** — prevent duplicate proposals to already-connected profiles | `ProposalModal.tsx`, `MatchIntelligenceModal.tsx` | ✅ Deployed |
| **31 missing profile modal translation keys** added to both en.json and ur.json — tab labels, section headings, CTA states, compatibility text | `en.json`, `ur.json` | ✅ Deployed |
| **12 code-side translation key mismatches fixed** — AuthModal (8 fixes: role labels, phone hint, encryption badge, OTP help) + ProgressionView (4 fixes: task names) | `AuthModal.tsx`, `ProgressionView.tsx` | ✅ Deployed |

**Interest Status State Machine** (ProfileDetailModal + ProfileGridCard):
- `interest_status === 0` + `interest_text` contains "Accepted" → `sent_accepted` → Green "Chat Now"
- `interest_status === 0` + pending → `sent_pending` → Amber "Awaiting Response"
- `interest_status === 'do_response'` + accepted → `received_accepted` → Green "Chat Now"
- `interest_status === 'do_response'` + pending → `received_pending` → Blue "Respond to Interest"
- `interest_status === 1` or none → `none` → Pink "Send Proposal"
- Backend `member_info` format: `'mutual'`, `'sent interest'`, `'received interest'`, `'no interest'` (also handled)

### February 12, 2026 — Complete Urdu i18n & Sidebar Fixes

| Change | Files | Status |
|--------|-------|--------|
| **Full Urdu i18n** — 30+ web components (~620 strings), 35 mobile screens + 10 components (~690 strings), 4 backend PHP translation files | `en.json`, `ur.json`, `locales/en/*.php`, `locales/ur/*.php` | ✅ Deployed |
| **Language toggle** — globe icon in web sidebar + mobile settings, stores preference in localStorage/SecureStore | `LanguageToggle.tsx`, `Sidebar.tsx`, mobile `settings.tsx` | ✅ Deployed |
| **Sidebar layout fix** — bottom section changed from `absolute bottom-0` to `shrink-0` flex child; removed `pb-24` hack | `Sidebar.tsx` | ✅ Deployed |
| **Language toggle styling** — icon bumped to `w-5 h-5 shrink-0`, amber hover colors, proper `gap-3 px-4 py-3 rounded-xl` styling | `LanguageToggle.tsx`, `Sidebar.tsx` | ✅ Deployed |

### February 11, 2026 — Profile Fields & Proposal Status Fix

| Change | Files | Status |
|--------|-------|--------|
| **"Ideal Partner" textarea** in Partner Preferences | `ProfileEditView.tsx`, `ProfileController.php` | ✅ Deployed |
| **Property → House rename** + removed "Plot Only" and "Under Construction Home" | `ProfileEditView.tsx`, `ProfileOptionValueSeeder.php`, `fix_property_options.php` | ✅ Deployed |
| **ProfileDetailModal complete redesign** (mobile-first, hide empty sections) | `ProfileDetailModal.tsx` | ✅ Deployed |
| **ProfileDetailModal scroll fix** (removed framer-motion wrapper) | `ProfileDetailModal.tsx` | ✅ Deployed (3 iterations) |
| **Property text box** in Habits & Lifestyle | `ProfileEditView.tsx`, `ProfileController.php`, `Lifestyle.php`, migration | ✅ Deployed |
| **Proposal Sent status** in Explore Profiles | `DiscoveryView.tsx`, `ProfileDetailModal.tsx`, `types.ts` | ✅ Deployed |

**Proposal Status Bug Fix Details**:
- Backend API already returned `interest_status` and `interest_text` via `ActiveUserResource`
- Frontend `normalizeProfile()` was dropping these fields
- Added `interestStatus` and `interestText` to `ProfileMatch` type
- Pre-populate `superLiked` state from API data on fetch
- `ProfileGridCard` now shows green "Sent" badge instead of Send Proposal button
- `ProfileDetailModal` initializes `sent` state from `profile.interestStatus`

### February 6, 2026 — Profile Header, Family Portal & Fixes

- Glassmorphic premium header redesign (mobile app)
- Family Portal invite via Share API
- QR code biodata sharing (`react-native-qrcode-svg`)
- Interests screen data mapping crash fix
- Privacy settings bulk update fix

### February 5, 2026 — Production Hardening & Stitch

- Brevo SMTP migration for reliable email
- Password reset flow repair (mobile)
- Google Stitch MCP integration
- EAS build fixes (buffer polyfill, expo-crypto sync)
- Onboarding enforcement in AuthGuard
- Payment flow → expo-web-browser
- Phone normalization centralization (`PhoneUtility.php`)

### February 3, 2026 — Mobile Feature Parity (100%)

- 14 new screens: shortlist, wallet, support-tickets, profile-viewers, referrals, devices, change-password, payment, interests, privacy-settings, blocked-users, ignore-list, delete-account, photo-gallery
- Profile tab expansion (3 → 6 tabs)
- Settings enhancement with Quick Access

### February 2, 2026

- Proxy fix (`TrustProxies` → `$proxies = '*'`)
- Frontend-backend alignment audit (282 endpoints)

### February 1, 2026

- Admin panel login fix
- Password reset utility

### January 31, 2026

- Google + Facebook OAuth for React Panel
- Full VPS Docker deployment

### January 30, 2026

- Twilio SMS/OTP with E.164 normalization
- Avatar/media fixes
- Options data restoration (15+ dropdown categories)

---

## 14. MOBILE APP TECHNICAL DETAILS

### 14.1 Key Dependencies

```json
{
  "expo": "55.0.0-preview.9",
  "nativewind": "^4.2.1",
  "tailwindcss": "^3.4.19",
  "react-native-reanimated": "^4.2.1",
  "moti": "^0.30.0",
  "@shopify/flash-list": "^2.2.1",
  "zustand": "^5.0.11",
  "axios": "^1.13.4",
  "buffer": "^6.0.3",
  "react-native-qrcode-svg": "^6.3.12"
}
```

### 14.2 Critical Constraints

| Issue | Solution |
|-------|----------|
| NativeWind requires Tailwind v3 | Install `tailwindcss@3`, NOT v4 |
| Metro fails on Windows | Postinstall patch for `pathToFileURL()` |
| Node 24+ breaks Metro | Use Node 18-20 via fnm/nvm |
| `react-native-svg` needs `Buffer` | Polyfilled in `_layout.tsx` |
| Google Auth crash | Dynamic native hook in `useGoogleAuth.ts` |

### 14.3 Build Commands

```powershell
cd "c:\laragon\www\marriagebureau\DMB Mobile App"

# Type check
npx tsc --noEmit

# Development
npm start

# EAS Build
npx eas build --platform android --profile preview --no-wait
```

---

## 15. WEB PANEL BUILD & RUN

### 15.1 Local Development

```powershell
cd "c:\laragon\www\marriagebureau\New User Panel Frontend"

# Create .env.local with:
# VITE_API_URL=http://localhost:8000/api

npm install
npm run dev
```

### 15.2 Production Build (via Docker)

The `Dockerfile` in `New User Panel Frontend/` handles:
1. `npm install` (Node 18-alpine)
2. `npm run build` (Vite production)
3. Copy `dist/` to Nginx
4. Apply custom `nginx.conf` (Cache-Control headers)

---

## 16. FILE STRUCTURE QUICK REFERENCE

```
├── app/
│   ├── Http/Controllers/Api/     # 20+ API controllers
│   ├── Http/Resources/           # ActiveUserResource, etc.
│   ├── Models/                   # Eloquent models
│   ├── Services/                 # Business logic
│   └── Utility/                  # MemberUtility, PhoneUtility, EmailUtility
├── config/                       # Laravel config files
├── database/
│   ├── migrations/               # DB schema changes
│   └── seeders/                  # ProfileOptionValueSeeder, etc.
├── routes/
│   ├── api.php                   # All API routes (700+ lines)
│   └── web.php                   # Admin + legacy web routes
├── New User Panel Frontend/      # React + Vite + Tailwind
│   ├── components/               # All React components
│   ├── types.ts                  # TypeScript interfaces
│   ├── utils/                    # api.ts, motion.ts
│   ├── Dockerfile                # Multi-stage build
│   └── nginx.conf                # Frontend serving config
├── DMB Mobile App/               # Expo + React Native
│   ├── app/                      # Expo Router screens
│   ├── components/               # Shared components
│   ├── stores/                   # Zustand stores
│   └── utils/                    # API utils
├── docker-compose.yml            # All 5 containers
├── deploy/                       # Backend Dockerfile + nginx.conf
└── PROJECT_SSOT.md               # THIS FILE (Single Source of Truth)
```

---

## 17. TROUBLESHOOTING QUICK REFERENCE

| Problem | Solution |
|---------|----------|
| **Frontend not updating after deploy** | Verify deployed git SHA on VPS, confirm new hashed `assets/index-*.js` is served, then hard refresh only if browser still has stale index |
| **Migration fails "column already exists"** | Mark old migration as ran: insert into `migrations` table |
| **API returns 500** | Check `docker exec marriagebureau-app tail -100 /var/www/html/storage/logs/laravel.log` |
| **OTP not received** | Check logs: `grep "OTP\|VERIFICATION" laravel.log` (SMS not active for MVP) |
| **Proposal button shows "Send" for already-sent** | Fixed Feb 13 — full 5-state awareness via `interest_status` + `interest_text` |
| **Mobile scroll broken in modal** | NEVER use `motion.div` as scroll container on mobile WebKit |
| **Metro bundler crash (Node 24)** | Switch to Node 18-20: `nvm use 20` |
| **Docker build fails** | Check `docker compose build --no-cache` and look at step output |
| **Nginx 502 Bad Gateway** | Container may be restarting: `docker ps -a` then `docker logs <container>` |
| **Permission denied on .env** | `docker exec marriagebureau-app chown www-data:www-data .env` |

---

> **Protocol**: This SSOT must be updated after any structural change, new feature deployment, or infrastructure modification. It is the ONLY document that matters.
