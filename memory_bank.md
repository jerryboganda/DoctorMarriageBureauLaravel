# Project: Doctors Marriage Bureau (DMB) - Knowledge Base

> **Last Updated**: February 6, 2026 (Session: Profile Header Redesign, Family Portal Invites, Biodata QR & Fixes)
> **Total API Endpoints**: 285+
> **System Status**: ✅ Production Ready
> **Mobile App Feature Parity**: ✅ 100% Complete & Stable

---

## 1. Project Overview

**Doctors Marriage Bureau (DMB)** is a professional matrimonial platform specifically designed for doctors and medical professionals. It features a sophisticated matching system, private communication channels, and a "Family Portal" for trusted profile management.

### Key Capabilities

| Feature | Description |
| --------- | ------------- |
| **Comprehensive Profiling** | 15+ sections including education, career, physical attributes, religious background, lifestyle |
| **Dynamic Matching** | AI-driven match compatibility scores based on partner expectations |
| **Family Portal** | Profile ownership transfer, manager roles, trusted contact verification |
| **Monetization** | Tiered subscription packages, individual feature add-ons, referral/earning system |
| **Security** | 2FA, Step-up verification for sensitive actions, email/phone OTP verification |
| **Social Integration** | One-Tap Login via Google and Facebook (OAuth 2.0) |
| **Real-time** | Instant chat and push notifications via Soketi/Laravel Reverb |

---

## 2. The Trinity Ecosystem

The project is composed of **three synchronized components**. Any change to Backend data structure or API response schema requires immediate updates to both frontends.

### 2.1 Backend (Laravel) - The Core

| Property | Value |
| --- | --- |
| **Framework** | Laravel 10+ (PHP 8.2+) |
| **Location** | `c:\laragon\www\marriagebureau\` (Root) |
| **Production API** | `https://api.doctormarriagebureau.com.pk/api` |
| **Admin Panel** | `https://api.doctormarriagebureau.com.pk/admin` |
| **VPS** | 185.252.233.186 (Ubuntu 24.04 Docker) |
| **Database** | MySQL (60+ tables) |
| **Auth** | Laravel Sanctum (Token-based) |
| **Real-time** | Laravel Echo + Soketi (Pusher Protocol) |
| **Email/SMS** | Twilio, Google SMTP (<xhsjs5901@gmail.com>) |
| **Payments** | PayPal, Stripe, Paystack, Razorpay, SSLCommerz, PhonePe, Instamojo |

### 2.2 User Web Panel (React) - The Dashboard

| Property | Value |
| ---------- | ------- |
| **Framework** | React 18 + Vite |
| **Location** | `New User Panel Frontend/` |
| **Production URL** | `https://panel.doctormarriagebureau.com.pk` |
| **Styling** | Tailwind CSS v3 (`primary: #d41173`) |
| **State** | React Context + Local State |

### 2.3 Mobile App (React Native) - The Native Experience

| Property | Value |
| ---------- | ------- |
| **Framework** | React Native + Expo SDK 55 |
| **Location** | `DMB Mobile App/` |
| **Styling** | NativeWind v4 + Tailwind v3 |
| **State** | Zustand |
| **Animations** | Moti + Reanimated |
| **Build** | EAS (Expo Application Services) |

### Infrastructure Notes

- **Database**: Shared MySQL on VPS (Docker container `marriagebureau-db`)
- **Storage**: `public/uploads` symlinked to persistent storage
- **Docker Containers**:
  - `marriagebureau-app`: Backend API/CLI (PHP-FPM)
  - `marriagebureau-web`: Nginx Web Server (Proxy to App)
  - `marriagebureau-db`: MySQL 8.0 Database
  - `marriagebureau-frontend`: User Web Panel (React)
  - `marriagebureau-soketi`: Real-time WebSocket Server
- **Proxy**: Nginx Proxy Manager (Docker) with SSL termination

### 2.4 Trinity API Resource Compatibility Guide

> **CRITICAL**: When modifying Laravel API Resources, you MUST ensure backward compatibility with BOTH frontends. Each frontend may use different field names for the same data.

#### Resource Field Mapping (Updated: Current Session)

| Resource | React Panel Fields | Mobile App Fields | Notes |
|----------|-------------------|-------------------|-------|
| **GalleryImageResource** | `is_main`, `privacy_level`, `url` | `is_primary`, `is_private`, `thumbnail` | Returns ALL fields for both platforms |
| **SupportTicketResource** | `status` (capitalized: 'Open') | `status_key` (lowercase: 'open') | Mobile normalizes via interceptor |
| **IgnoredUserResource** | `user_id`, `photo`, `name` (root) | `ignored_user.id`, `ignored_user.first_name` (nested) | Returns BOTH structures |
| **ShortlistResource** | `id`, `user_id` | `id`, `user_id` | ✅ Compatible |
| **MyInterestResource** | `id` | `id` | ✅ Compatible |
| **ExpressInterestResource** | `id`, `user_id` | `id`, `user_id` | ✅ Compatible |

#### Route Prefix Guide

| Route Type | React Panel | Mobile App | Backend Location |
|------------|-------------|------------|------------------|
| Auth routes | `/signin`, `/signup` | `/signin`, `/signup` | Root level |
| Public data | `/packages`, `/addons` | `/packages`, `/addons` | Root level |
| Member routes | `/member/my-tickets` | `/member/my-tickets` | Within `prefix => 'member'` group |
| Dashboard | `/dashboard/stats` | `/member/dashboard` | Different routes for each |

#### Fixing React Panel Route Bugs (Fixed This Session)

| File | Old Route | Fixed Route |
|------|-----------|-------------|
| `SettingsView.tsx` | `/my-tickets` | `/member/my-tickets` |
| `SettingsView.tsx` | `/support-ticket/store` | `/member/support-ticket/store` |

---

## 3. Standard Deployment Strategy (MANDATORY)

> **CRITICAL: NEVER use direct SCP or file copy to VPS. ALWAYS use Git-based deployment for consistency and reliability.**

### 3.1 Local (Windows PC)

```powershell
cd c:\laragon\www\marriagebureau
git add -A
git commit -m "your descriptive commit message"
git push origin main
```

### 3.2 VPS (SSH)

```bash
# Connect to VPS
ssh -i "C:\Users\Admin\.ssh\id_rsa" root@185.252.233.186

# Navigate to project root
cd /root/doctormarriagebureau

# Pull latest changes
git pull origin main

# Clear Laravel cache and optimize
docker exec marriagebureau-app php artisan optimize:clear
```

### 3.3 Quick Frontend Deployment (Direct SCP)

For rapid iteration during development sessions:

```powershell
# Build frontend
cd "c:\laragon\www\marriagebureau\New User Panel Frontend"
npm run build

# Upload and deploy
scp -i C:\Users\Admin\.ssh\id_rsa dist\assets\index-*.js dist\index.html root@185.252.233.186:/tmp/
ssh -i C:\Users\Admin\.ssh\id_rsa root@185.252.233.186 "docker exec marriagebureau-frontend rm -f /usr/share/nginx/html/assets/index-*.js && docker cp /tmp/index-*.js marriagebureau-frontend:/usr/share/nginx/html/assets/ && docker cp /tmp/index.html marriagebureau-frontend:/usr/share/nginx/html/"
```

### 3.4 GitHub Repository

- **URL**: [DoctorMarriageBureauLaravel](https://github.com/jerryboganda/DoctorMarriageBureauLaravel)
- **Branch**: `main`

---

## 4. Access Credentials

| Service | URL | Email | Password |
| --------- | ----- | ------- | ---------- |
| **Admin Panel** | `/admin` | `admin@admin.com` | `welcome123` |
| **Key Skills** | `clean-code`, `brainstorming`, `app-builder`, `frontend-design`, `mobile-design`, `plan-writing`, `behavioral-modes`, `stitch-mcp` |
| **Test User** | Panel/Mobile | `mindreader420123@gmail.com` | `test1234` |
| **VPS SSH** | `185.252.233.186` | `root` | SSH Key |
| **MySQL** | Docker | `marriagebureau` | `MarriageBureauPass123!` |

---

## 4. Complete API Reference (283 Endpoints)

### 4.1 Authentication & Registration

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| POST | `/api/signup` | Create new account |
| POST | `/api/signin` | Login with email/phone + password |
| POST | `/api/social-login` | OAuth login (Google/Facebook) |
| POST | `/api/logout` | Invalidate token |
| POST | `/api/send-email-verification` | Send OTP to email |
| POST | `/api/verify-email-code` | Verify email OTP |
| POST | `/api/send-phone-verification` | Send OTP to phone |
| POST | `/api/verify-phone-code` | Verify phone OTP |
| POST | `/api/forgot/password` | Initiate password reset |
| POST | `/api/verify/password/reset` | Verify password reset OTP |
| POST | `/api/reset/password` | Complete password reset (ResetPassword) |
| POST | `/api/password/reset/complete` | Complete password reset (Alias) |
| POST | `/api/auth/2fa/challenge` | 2FA challenge verification |
| GET | `/api/user-by-token` | Get current user from token |

### 4.2 Profile Management

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/full-profile` | Get complete user profile (aggregated) |
| POST | `/api/full-profile/update` | Bulk update all profile sections |
| GET | `/api/member/basic-info` | Get basic info section |
| POST | `/api/member/basic-info/update` | Update basic info |
| GET | `/api/member/physical-attributes` | Get physical attributes |
| POST | `/api/member/physical-attributes/update` | Update physical attributes |
| GET | `/api/member/spiritual-background` | Get religious/spiritual info |
| POST | `/api/member/spiritual-background/update` | Update spiritual info |
| GET | `/api/member/family-info` | Get family background |
| POST | `/api/member/family-info/update` | Update family info |
| GET | `/api/member/life-style` | Get lifestyle preferences |
| POST | `/api/member/life-style/update` | Update lifestyle |
| GET | `/api/member/hobbies-interests` | Get hobbies |
| POST | `/api/member/hobbies/update` | Update hobbies |
| GET | `/api/member/partner-expectation` | Get partner preferences |
| POST | `/api/member/partner-expectation/update` | Update partner preferences |
| GET | `/api/member/residency-info` | Get residency details |
| POST | `/api/member/residency-info/update` | Update residency |
| GET | `/api/member/astronomic` | Get astrology info |
| POST | `/api/member/astronomic/update` | Update astrology |
| GET | `/api/member/attitude-behavior` | Get attitude/behavior |
| POST | `/api/member/attitude-behavior/update` | Update attitude |
| GET | `/api/member/introduction` | Get profile introduction |
| POST | `/api/member/introduction-update` | Update introduction |
| POST | `/api/member/contact-info/update` | Update contact details |
| POST | `/api/member/address/update` | Update address |
| POST | `/api/member/change/password` | Change password |
| POST | `/api/upload-profile-picture` | Upload profile photo |
| GET | `/api/profile/download-biodata` | Download PDF biodata |

### 4.3 Education & Career (CRUD)

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/education` | List all education entries |
| POST | `/api/member/education` | Add education entry |
| GET | `/api/member/education/{id}` | Get single education |
| PUT | `/api/member/education/{id}` | Update education |
| DELETE | `/api/member/education/{id}` | Delete education |
| POST | `/api/member/education-status/update` | Update education status |
| GET | `/api/member/career` | List all career entries |
| POST | `/api/member/career` | Add career entry |
| GET | `/api/member/career/{id}` | Get single career |
| PUT | `/api/member/career/{id}` | Update career |
| DELETE | `/api/member/career/{id}` | Delete career |
| POST | `/api/member/career-status/update` | Update career status |

### 4.4 Gallery & Media

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/gallery-image` | List gallery images |
| POST | `/api/member/gallery-image` | Upload gallery image |
| DELETE | `/api/member/gallery-image/{id}` | Delete gallery image |
| POST | `/api/member/profile/media/voice` | Upload voice intro |
| DELETE | `/api/member/profile/media/voice` | Delete voice intro |
| POST | `/api/member/profile/media/video` | Upload video intro |
| DELETE | `/api/member/profile/media/video` | Delete video intro |
| GET | `/api/member/gallery-image-view-request` | Pending image requests |
| POST | `/api/member/gallery-image-view-request` | Request image access |
| POST | `/api/member/gallery-image-view-request/accept` | Accept request |
| POST | `/api/member/gallery-image-view-request/reject` | Reject request |

### 4.5 Profile Quality & Visibility

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/profile/quality-score` | Get profile completeness score |
| GET | `/api/member/profile/visibility` | Get visibility settings |
| POST | `/api/member/profile/visibility` | Toggle visibility settings |
| GET | `/api/member/profile/full` | Get full profile (ProfileCenter) |
| GET | `/api/member/profile/history` | Get profile edit history |
| POST | `/api/member/profile/section/{section}` | Update specific section |
| POST | `/api/member/profile/preference-priorities` | Set preference weights |

### 4.6 Discovery & Matching

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/discovery` | Get discovery feed |
| GET | `/api/discovery/search` | Search with filters |
| GET | `/api/match-intelligence/{id}` | Get AI match analysis |
| POST | `/api/match-tuner/tune` | Adjust matching preferences |
| GET | `/api/member/matched-profile` | Get matched profiles |
| GET | `/api/member/public-profile/{id}` | View public profile |
| GET | `/api/member/member-info/{id}` | Get member details |
| POST | `/api/member/member-listing` | Search members |

### 4.7 Interest & Shortlist

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| POST | `/api/member/express-interest` | Send interest request |
| GET | `/api/member/interest-requests` | Get incoming interests |
| POST | `/api/member/interest-accept` | Accept interest |
| POST | `/api/member/interest-reject` | Reject interest |
| GET | `/api/member/my-interests` | Get sent interests |
| GET | `/api/check-interest-status/{userId}` | Check interest status |
| POST | `/api/interest/accept` | Accept (alternate) |
| POST | `/api/interest/decline` | Decline (alternate) |
| GET | `/api/member/my-shortlists` | Get shortlisted profiles |
| POST | `/api/member/add-to-shortlist` | Add to shortlist |
| POST | `/api/member/remove-from-shortlist` | Remove from shortlist |
| GET | `/api/member/my-profile-viewers` | Who viewed my profile |

### 4.8 Messaging & Chat

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/chat-list` | Get all chat threads |
| GET | `/api/member/chat-view/{id}` | Get messages in thread |
| POST | `/api/member/chat-reply` | Send message |
| POST | `/api/member/chat/old-messages` | Load older messages |

### 4.9 Progression Pipeline

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/progression/active` | Get active progressions |
| GET | `/api/member/progression/stages` | Get all stage definitions |
| GET | `/api/member/progression/partner/{id}` | Get progression with partner |
| POST | `/api/member/progression/update-stage` | Update progression stage |
| GET | `/api/progression/{id}` | Get progression details |
| POST | `/api/progression/{id}/update-stage` | Update stage (alternate) |

### 4.10 Family Portal

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/family` | Get family data |
| POST | `/api/family/update-profile` | Update family profile |
| POST | `/api/family/guardian/add` | Add guardian |
| POST | `/api/family/guardian/update/{id}` | Update guardian |
| DELETE | `/api/family/guardian/delete/{id}` | Delete guardian |
| POST | `/api/family/photo/upload` | Upload family photo |
| DELETE | `/api/family/photo/delete/{id}` | Delete family photo |
| POST | `/api/family/approval/approve/{id}` | Approve match |
| POST | `/api/family/approval/reject/{id}` | Reject match |
| GET | `/api/member/family/details` | Get family details (member) |

### 4.11 Account Security

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/account/security-status` | Get security overview |
| POST | `/api/member/account/2fa/setup` | Enable 2FA |
| POST | `/api/member/account/2fa/verify` | Verify 2FA setup |
| DELETE | `/api/member/account/2fa` | Disable 2FA |
| POST | `/api/member/account/2fa/recovery-codes` | Get recovery codes |
| DELETE | `/api/member/account/devices/{tokenId}` | Revoke device |
| DELETE | `/api/member/account/devices-others` | Revoke all other devices |
| POST | `/api/member/account/trusted-contacts` | Add trusted contact |
| DELETE | `/api/member/account/trusted-contacts/{id}` | Remove trusted contact |
| POST | `/api/member/account/step-up/initiate` | Initiate step-up auth |
| POST | `/api/member/account/step-up/verify-otp` | Verify step-up OTP |
| POST | `/api/member/account/step-up/verify-password` | Verify step-up password |
| POST | `/api/member/account/deactivate` | Deactivate account |
| POST | `/api/member/account/delete` | Delete account permanently |

### 4.12 Profile Ownership & Management

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/account/ownership` | Get ownership status |
| POST | `/api/member/account/ownership/transfer` | Initiate transfer |
| POST | `/api/member/account/ownership/cancel` | Cancel transfer |
| POST | `/api/ownership/transfer/accept` | Accept transfer |
| POST | `/api/ownership/transfer/reject` | Reject transfer |
| GET | `/api/ownership/transfer/{token}` | Get transfer details |
| PUT | `/api/member/account/management-mode` | Set management mode |
| POST | `/api/member/account/managers/invite` | Invite manager |
| POST | `/api/member/account/managers/accept` | Accept manager invite |
| PUT | `/api/member/account/managers/{id}/permissions` | Update permissions |
| DELETE | `/api/member/account/managers/{id}` | Remove manager |

### 4.13 Subscriptions & Payments

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/packages` | Get available packages |
| POST | `/api/package-details` | Get package details |
| POST | `/api/member/package-purchase` | Purchase package |
| GET | `/api/member/package-purchase-history` | Purchase history |
| GET | `/api/member/package-details` | Current package details |
| GET | `/api/addons` | Get available addons |
| POST | `/api/member/addon-purchase` | Purchase addon |
| GET | `/api/member/addon-purchase-history` | Addon history |
| POST | `/api/member/coupons/validate` | Validate coupon code |
| GET | `/api/payment-types` | Get payment methods |
| ANY | `/api/stripe/*` | Stripe payment endpoints |
| ANY | `/api/paypal/*` | PayPal payment endpoints |
| ANY | `/api/razorpay/*` | Razorpay payment endpoints |
| ANY | `/api/phonepe/*` | PhonePe payment endpoints |
| ANY | `/api/instamojo/*` | Instamojo payment endpoints |
| ANY | `/api/paystack/*` | Paystack payment endpoints |
| ANY | `/api/paytm/*` | Paytm payment endpoints |

### 4.14 Wallet

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/wallet` | Get wallet details |
| GET | `/api/member/my-wallet-balance` | Get wallet balance |
| POST | `/api/member/wallet-recharge` | Recharge wallet |
| GET | `/api/member/wallet-withdraw-request-history` | Withdrawal history |
| POST | `/api/member/wallet-withdraw-request-store` | Request withdrawal |

### 4.15 Notifications

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/notifications` | Get all notifications |
| GET | `/api/member/notification/{id}` | Get single notification |
| GET | `/api/member/notifications/feed` | Get notification feed |
| POST | `/api/member/notifications/mark-read` | Mark as read |
| GET | `/api/member/mark-all-as-read` | Mark all as read |
| GET | `/api/member/notifications/preferences` | Get notification prefs |
| POST | `/api/member/notifications/preferences` | Update notification prefs |
| GET | `/api/member/notifications/recap` | Get notification recap |
| POST | `/api/member/notifications/snooze` | Snooze notifications |

### 4.16 Support & Tickets

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/support-ticket` | List my tickets |
| POST | `/api/member/support-ticket` | Create ticket |
| GET | `/api/member/support-ticket/{id}` | View ticket |
| POST | `/api/member/support-ticket/store` | Create ticket (alternate) |
| GET | `/api/member/support-ticket/categories` | Get categories |
| POST | `/api/member/ticket-reply` | Reply to ticket |
| GET | `/api/member/my-tickets` | List tickets (alternate) |

### 4.17 Communities

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/communities` | List communities |
| POST | `/api/member/communities` | Create community (verified/premium, needs admin approval) |
| POST | `/api/member/communities/{id}/join` | Join community |
| DELETE | `/api/member/communities/{id}/leave` | Leave community |

### 4.18 Referrals

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/referral-code` | Get my referral code |
| GET | `/api/member/referral-check` | Check referral status |
| GET | `/api/member/referred-users` | List referred users |
| GET | `/api/member/my-referral-earnings` | Get earnings |

### 4.19 Happy Stories

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/happy-stories` | List success stories |
| POST | `/api/story-details` | Get story details |
| GET | `/api/member/happy-story` | Get my story |
| POST | `/api/member/happy-story` | Submit my story |
| GET | `/api/member/check-happy-story` | Check if can submit |

### 4.20 Dropdown Options

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/profile-dropdown` | Get all dropdown options |
| GET | `/api/member/countries` | List countries |
| GET | `/api/member/states/{countryId}` | List states |
| GET | `/api/member/cities/{stateId}` | List cities |
| GET | `/api/member/religions` | List religions |
| GET | `/api/member/casts/{religionId}` | List castes |
| GET | `/api/member/sub-casts/{casteId}` | List sub-castes |
| GET | `/api/member/languages` | List languages |
| GET | `/api/member/maritial-status` | List marital statuses |
| GET | `/api/member/family-values` | List family values |
| GET | `/api/on-behalf` | List on-behalf options |

### 4.21 Blocking & Reporting

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| POST | `/api/member/add-to-ignore-list` | Block user |
| POST | `/api/member/remove-from-ignored-list` | Unblock user |
| GET | `/api/member/ignored-user-list` | List blocked users |
| POST | `/api/member/report-member` | Report member |
| POST | `/api/ignore-user` | Block (alternate) |

### 4.22 Verification

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/verification_form` | Get verification form |
| POST | `/api/member/verification-info-store` | Submit verification docs |
| GET | `/api/member/is-approved` | Check approval status |

### 4.23 Miscellaneous

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/home` | Homepage data |
| GET | `/api/app-info` | App information |
| GET | `/api/app-check` | App health check |
| GET | `/api/addon-check` | Addon availability |
| GET | `/api/feature-check` | Feature flags |
| GET | `/api/blogs` | List blogs |
| POST | `/api/blog-details` | Blog details |
| POST | `/api/contact-us` | Contact form |
| GET | `/api/static-page` | Static page content |
| POST | `/api/onboarding/complete` | Complete onboarding |
| POST | `/api/update-device-token` | Update FCM token |

### 4.24 Dashboard Widgets

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/api/member/dashboard` | Member dashboard |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/incoming-interests` | Recent interests |
| GET | `/api/dashboard/mutual-match` | Mutual matches |
| GET | `/api/dashboard/today-matches` | Today's matches |
| GET | `/api/dashboard/recent-visitors` | Recent visitors |
| GET | `/api/dashboard/message-preview` | Message preview |
| GET | `/api/dashboard/success-stories` | Success stories |

---

## 5. Database Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | Core account (email, password, role) |
| `members` | Primary profile (gender, birthday, specialization) |
| `addresses` | Multi-type addresses (present, permanent) |
| `educations` | Multiple education entries per user |
| `careers` | Multiple career entries per user |
| `physical_attributes` | Height, weight, complexion, etc. |
| `spiritual_backgrounds` | Religion, caste, sub-caste |
| `partner_expectations` | Matching criteria |
| `hobbies` | User hobbies |
| `lifestyles` | Diet, smoking, drinking preferences |
| `astrologies` | Birth time, rashi, nakshatra |
| `recidencies` | Citizenship, visa status |
| `attitudes` | Personality traits |
| `families` | Family information |

### Relationship Tables

| Table | Description |
|-------|-------------|
| `express_interests` | Interest requests between users |
| `shortlists` | Shortlisted profiles |
| `chat_threads` | Messaging threads |
| `chat_messages` | Individual messages |
| `profile_viewers` | Profile view logs |
| `ignored_users` | Blocked users |
| `member_reports` | Reported members |
| `member_progressions` | Match progression tracking |

### Financial Tables

| Table | Description |
|-------|-------------|
| `packages` | Subscription packages |
| `package_payments` | Package purchases |
| `addon_products` | Individual addons |
| `addon_payments` | Addon purchases |
| `coupons` | Discount coupons |
| `wallets` | User wallets |
| `wallet_transactions` | Wallet history |

### Support Tables

| Table | Description |
|-------|-------------|
| `support_tickets` | Support tickets |
| `support_categories` | Ticket categories |
| `support_replies` | Ticket replies |
| `happy_stories` | Success stories |
| `notifications` | User notifications |

---

## 6. Frontend Component Mapping

### React Web Panel (`New User Panel Frontend/`)

| Component | Backend Endpoints Used |
|-----------|----------------------|
| `AuthModal.tsx` | `/signin`, `/signup`, `/social-login`, `/send-email-verification`, `/verify-email-code` |
| `ProfileEditView.tsx` | `/full-profile`, `/full-profile/update`, `/member/profile-dropdown` |
| `PaymentModal.tsx` | `/packages`, `/addons`, `/member/package-purchase`, `/payment-types` |
| `SettingsView.tsx` | `/member/account/security-status`, `/member/account/2fa/*`, `/member/profile/visibility` |
| `MessagesView.tsx` | `/member/chat-list`, `/member/chat-view/{id}`, `/member/chat-reply` |
| `FamilyPortalView.tsx` | `/family`, `/family/update-profile`, `/family/guardian/*` |
| `NotificationsView.tsx` | `/member/notifications`, `/member/notifications/mark-read` |
| `WelcomeScreen.tsx` | `/home`, `/home/premium-members`, `/home/new-members` |

### React Native Mobile (`DMB Mobile App/`)

| Screen | Backend Endpoints Used |
| -------- | ---------------------- |
| `app/login.tsx` | `/signin` |
| `app/register/index.tsx` | `/signup`, `/send-email-verification`, `/verify-email-code` |
| `app/(tabs)/index.tsx` | `/member/interest-requests`, `/dashboard/stats` |
| `app/(tabs)/discovery.tsx` | `/discovery`, `/discovery/search`, `/member/express-interest` |
| `app/(tabs)/messages.tsx` | `/member/chat-list`, `/member/chat-view/{id}` |
| `app/(tabs)/profile.tsx` | `/full-profile`, `/full-profile/update`, 6-tab UI (Basics, Lifestyle, Career, Family, Preferences, Media) |
| `app/(tabs)/settings.tsx` | `/member/account/security-status`, `/member/account/2fa/*`, `/member/settings/*` |
| `app/family-portal.tsx` | `/family`, `/family/guardian/*` |
| `app/shortlist.tsx` | `/member/my-shortlists`, `/member/remove-from-shortlist`, `/member/express-interest` |
| `app/wallet.tsx` | `/member/wallet`, `/member/my-wallet-balance`, `/member/wallet-recharge` |
| `app/support-tickets.tsx` | `/member/support-ticket`, `/member/ticket-reply`, `/member/support-ticket/categories` |
| `app/profile-viewers.tsx` | `/member/my-profile-viewers` |
| `app/referrals.tsx` | `/member/referral-code`, `/member/referred-users`, `/member/my-referral-earnings` |
| `app/devices.tsx` | `/member/account/devices`, `/member/account/devices/{tokenId}`, `/member/account/devices-others` |
| `app/change-password.tsx` | `/member/change-password` |
| `app/payment.tsx` | `/packages`, `/member/package-purchase`, `/member/coupons/validate`, `/member/payment-methods` |
| `app/notifications.tsx` | `/member/notifications`, `/member/notifications/{id}/read`, `/member/notifications/read-all` |
| `app/interests.tsx` | `/member/interests/received`, `/member/interests/sent`, `/member/interests/{id}/accept`, `/member/interests/{id}/reject` |
| `app/privacy-settings.tsx` | `/member/privacy-settings` |
| `app/blocked-users.tsx` | `/member/blocked-users`, `/member/unblock/{id}` |
| `app/ignore-list.tsx` | `/member/ignored-users`, `/member/ignored/{id}` |
| `app/delete-account.tsx` | `/member/delete-account` |
| `app/photo-gallery.tsx` | `/member/gallery`, `/member/gallery/upload`, `/member/gallery/{id}/set-primary`, `/member/gallery/{id}/toggle-private` |
| `app/onboarding.tsx` | `/api/onboarding/complete` |
| `app/login.tsx` | Added onboarding check redirection |
| `app/register/index.tsx` | Redirects to `/onboarding` after success |

---

## 7. AI & Design Intelligence

### 7.1 Google Stitch MCP

The project is equipped with **Google Stitch MCP** for AI-powered UI/UX design.

- **Skill**: `stitch-mcp` ([SKILL.md](file:///c:/laragon/www/marriagebureau/.agent/skills/stitch-mcp/SKILL.md))
- **Auth**: API Key based (ADC/OAuth fallback supported)
- **Agents**: `frontend-specialist`, `mobile-developer`, `orchestrator`
- **Workflow**: Context extraction + Screen generation ("Designer Flow")

---

## 10. Session Changelog (February 6, 2026 - Profile Header, Family Portal & Fixes)

### 10.1 UI/UX Enhancements

- **Member Profile Header Redesign:**
  - Implemented glassmorphic premium header with centered large avatar and shadow.
  - Organized status badges (Premium, Profile Score) and action buttons (Download Biodata, Profile Viewers) for better hierarchy.
  - Added animations via `moti` for smoother entry.
- **Match Percentage UI Fix:** Corrected bottom sheet safe area insets to prevent UI cutoff on full-screen devices.

### 10.2 Feature Improvements

- **Family Portal Invite System:** Implemented native "Invite" button functionality via Share API, allowing users to invite guardians via unique referral links.
- **Real-Time Biodata sharing:** Integrated `react-native-qrcode-svg` for dynamic QR code generation linked to user's profile. Enabled correct dynamic share link generation.
- **Referral System alignment:** Fixed backend/frontend synchronization for referral code generation and tracking.

### 10.3 Bug Fixes & Stability

- **Interests Screen:** Resolved data mapping crash by correctly handling the flat API structure for sent/received interests.
- **Privacy Settings:** Fixed update failure in `ProfileCenterController.php` to support modern React Native key-value pairs and bulk updates.
- **Code Restoration:** Resolved accidental code truncation in `profile.tsx` by fully reconstructing hooks, state, and complex components.

### 10.4 Mobile Technical Details (Updated)

| Dependency | Version | Purpose |
|------------|---------|---------|
| `react-native-qrcode-svg` | `^6.3.12` | New: Real-time QR code generation |
| `moti` | `^0.30.0` | Animations for profile header |
| `expo-linear-gradient` | `~14.0.2` | Premium UI gradients |

---

- **Password Reset Flow Repair**:
  - Added `/api/verify/password/reset` to the backend to support mobile app's verification step.
  - Aligned `/api/password/reset/complete` as an alias for `resetPassword`.
  - Updated `AuthController` to auto-detect email/phone identifiers and support standard parameters.
- **OTP UI/UX Alignment**:
  - Made `OtpInput.tsx` responsive to handle 6-digit codes without overlapping.
  - Adjusted dimensions (`w-11 h-14`) and gaps for optimal fitting on mobile screens.
- **EAS Build Failure Resolution**:
  - Installed `buffer` package and added a global `Buffer` polyfill in `_layout.tsx` to fix `react-native-svg` resolution errors during bundling.
- **Onboarding Enforcement**:
  - Implemented mandatory onboarding redirection in `AuthGuard` for both login and registration flows.
- **Payment Flow Fixes**:
  - Replaced legacy `Linking.openURL` with `expo-web-browser` for secure and integrated in-app package purchases.

### February 5, 2026 (Session 2: Mobile Flow & Stitch)

- **Mobile Onboarding Enforcement**:
  - Modified `AuthGuard` in `_layout.tsx` to force authenticated but non-onboarded users (detected via missing birthday/phone) to the `/onboarding` screen.
  - Updated `login.tsx` and `register/index.tsx` to follow this routing logic.
- **Payment Flow Repair**:
  - Integrated `expo-web-browser` to replace broken `Linking.openURL` and non-existent `/webview` routes in `wallet.tsx` and `payment.tsx`.
  - Ensures seamless in-app payment experience for package purchases and wallet recharges.
- **Google Stitch MCP Integration**:
  - Defined `stitch-mcp` skill within the Antigravity kit.
  - Equipped AI agents (`frontend-specialist`, `mobile-developer`, `orchestrator`) with UI/UX generation capabilities.
  - Updated `GEMINI.md` with intelligent routing for Stitch-related tasks.
  - Verified end-to-end handshake with user API Key and successful project retrieval.
- **Expo SDK Hardening**:
  - Repaired `package.json` with Expo SDK `55.0.0-preview.9`.
  - Fixed version mismatches for `expo-blur`, `expo-secure-store`, `react-native-screens`, etc.
  - Resolved native module duplicates in `node_modules`.
  - Configured `.easignore` for seamless EAS builds with local native folders.

### February 5, 2026 (Session 1: Production Hardening)

- **Password Reset Fix**: Resolved "Failed to send reset code" 500 error on API.
  - Switched `AuthController` to use `EmailUtility::password_reset_email` instead of direct `Notification` facade to ensure database-backed SMTP settings are used.
  - Added boolean return status to `EmailUtility` for better error handling.
  - **Local Debug Bypass**: Implemented a conditional bypass in `EmailUtility` that mocks email sending (logs to `laravel.log` and returns `true`) when `MAIL_MAILER=log` to prevent local environment hangs.
- **SMTP A-Z Resolution**: Identified that Google SMTP is network-restricted on this VPS (Ports 25, 587, 2525 blocked; Port 465 hangs).
- **Branded Relay Fix**: Implemented Brevo SMTP as a transparent, branded relay using `admin@doctormarriagebureau.com.pk`.
- **Infrastructure Repair**: Fixed a corrupted Nginx configuration mount that occurred during the debug process.
- **Verification**: Confirmed end-to-end success on production API for *Mobile App* (Logs: 01:25 AM), but persistent network hangs for Web App (PHP/Curl) despite identical code.
- **Status**: Brevo SMTP configured as fallback reliability layer. Google SMTP remains blocked at network level for Web App processes.
- **Deployment Standardization**: Established mandatory Git-based deployment workflow via GitHub repository.
- **Background Process Safety**: Resolved IDE hanging issues by terminating orphaned background terminal commands and implementing a permanent safety mandate in `.agent/rules/GEMINI.md` forbidding background terminal use for file operations.
- **Infrastructure Verification**: Successfully verified SSH connectivity and confirmed all 5 Marriage Bureau Docker containers are healthy and operational (February 3, 2026).
- **Memory Bank Update**: Updated all project knowledge bases with new deployment protocols, process safety rules, and project paths (`/root/doctormarriagebureau` on VPS).

### February 3, 2026 - Mobile App Feature Parity (100% Complete)

- **Profile Screen**: Expanded from 3 tabs to 6 tabs (Basics, Lifestyle, Career, Family, Preferences, Media)
- **New Screens Created**:
  - `shortlist.tsx` - Full shortlist management with grid layout
  - `wallet.tsx` - Wallet balance, transactions, add funds modal
  - `support-tickets.tsx` - Ticket creation and management
  - `profile-viewers.tsx` - Who viewed your profile with filters
  - `referrals.tsx` - Refer & earn with code sharing and history
  - `devices.tsx` - Connected devices management with revoke functionality
  - `change-password.tsx` - Password change with validation
  - `payment.tsx` - Package purchase flow with coupon support
  - `interests.tsx` - Received/sent interests with accept/reject actions
  - `privacy-settings.tsx` - Comprehensive privacy controls
  - `blocked-users.tsx` - Block/unblock user management
  - `ignore-list.tsx` - Hidden profiles management
  - `delete-account.tsx` - Multi-step account deletion wizard
  - `photo-gallery.tsx` - Photo upload/manage with primary/private toggles
- **Settings Screen**: Enhanced with Quick Access section and Privacy controls
- **Icons.tsx**: Added 10+ new icons (ShieldOff, Monitor, Tablet, ArrowUpRight, ArrowDownLeft, MessageCircle)
- **API Utils**: Added `getProfileImageUrl()` helper function
- **Auth Store**: Added `referral_code` to User interface

### February 2, 2026

- **Proxy Fix**: Configured `TrustProxies` middleware to trust all proxies (`$proxies = '*'`) for correct HTTPS redirects
- **VPS Permissions**: Fixed `.env` file permissions (`chown www-data:www-data`)
- **Full Audit**: Completed comprehensive frontend-backend alignment audit (282 endpoints documented)
- **Memory Bank**: Complete rewrite with all endpoints and component mappings

### February 1, 2026

- **Admin Panel Fix**: Fixed login view routing (`LoginController@showLoginForm`)
- **Password Reset**: Created reset utility for test users
- **Debugbar Fix**: Excluded from production auto-discovery

### January 31, 2026

- **Social Login**: Implemented Google & Facebook OAuth for React Panel
- **VPS Deployment**: Full redeployment with Docker environment variables

### January 30, 2026

- **Twilio Integration**: SMS/OTP with E.164 normalization
- **Avatar/Media Fixes**: Resolved gray profile picture bug
- **Options Data Restoration**: Re-seeded 15+ dropdown categories

---

## 8. Known Patterns & Constraints

| Pattern | Description |
| --------- | ------------- |
| **API Fallback** | Frontend defaults to `window.location.origin + '/api'` if `VITE_API_URL` missing |
| **License Bypass** | `MemberUtility::member_check` patched for self-hosted operation |
| **Activation Bypass** | `CoreComponentRepository::instantiateShopRepository()` commented out in `LoginController` |
| **Trusted Proxies** | Set to `'*'` in `TrustProxies.php` for reverse proxy HTTPS support |
| **Dual Endpoints** | Both unified (`/full-profile/update`) and granular (`/member/basic-info/update`) patterns exist |

---

## 9. Mobile App Technical Details

### Dependencies (Key)

{
  "expo": "55.0.0-preview.9",
  "nativewind": "^4.2.1",
  "tailwindcss": "^3.4.19",
  "react-native-reanimated": "^4.2.1",
  "moti": "^0.30.0",
  "@shopify/flash-list": "^2.2.1",
  "zustand": "^5.0.11",
  "axios": "^1.13.4",
  "buffer": "^6.0.3"
}

```

### Critical Constraints

| Issue | Solution |
| ------- | ---------- |
| NativeWind requires Tailwind v3 | Install `tailwindcss@3`, NOT v4 |
| Metro fails on Windows | Run postinstall patch for `pathToFileURL()` |
| Node 24+ breaks Metro | Use Node 18-20 via fnm |
| `react-native-svg` requires `Buffer` | Polyfilled globally in `_layout.tsx` via `buffer` package |

---

## 10. Session Changelog (February 5, 2026)

### 10.1 Fixes Applied

| Issue | Component | Solution |
|-------|-----------|----------|
| Voice intro greyed out after upload | nginx.conf | Added CORS headers and `audio/webm` MIME type for `/storage/` and `/uploads/` |
| Gallery/Vault images not loading | ProfileCenterController.php | Changed `Storage::url()` to `uploaded_asset()` helper for upload IDs |
| Mobile logo broken | App.tsx | Changed logo path from `logo.png` to `logo-v2.png` |
| Mobile hamburger menu not clickable | App.tsx | Fixed z-index (`z-50`) and pointer-events on mobile menu |
| Mobile scrolling not working | Multiple Views | Changed `overflow-hidden` to `min-h-0` on all view containers |
| Biodata PDF download failing | VPS | Created `/var/www/temp/mpdf` directory with 777 permissions |
| Advanced Filters overlapping sidebar | DiscoveryView.tsx, App.tsx | Sidebar `lg:z-20`, filter panel `z-[5]`, added `overflow-hidden` |
| Profile images broken across project | Multiple components | Added `API_BASE`, `DEFAULT_AVATAR` constants with fallback validation |

### 10.2 Features Implemented

| Feature | Files Modified | Description |
|---------|---------------|-------------|
| **Sync Calendar** | ProgressionView.tsx | ICS calendar file generation and download for pipeline stages |
| **Create Community** | CommunityController.php, routes/api.php, Community.php, CommunityView.tsx | Full modal with form, permissions (verified/premium only), admin approval, unique name validation |
| **Dashboard Tabs** | App.tsx | Functional "All Proposals", "High Compatibility", "Recent" tabs with filtering/sorting |
| **Add Preference Criteria** | ProfileEditView.tsx | Button now scrolls to Age Range field with highlight animation |
| **Default Landing Screen** | App.tsx | Changed from `dashboard` to `discovery` after login |

### 10.3 New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/member/communities` | Create new community (verified/premium users only, requires admin approval) |

### 10.4 Image Fallback System

Added robust image fallback handling in:

- `DiscoveryView.tsx` - normalizeProfile validates URLs, onError handler on `<img>`
- `ProfileCard.tsx` - Validates avatarUrl, uses DEFAULT_AVATAR constant
- `ProfileTeaser.tsx` - Validates avatarUrl, uses DEFAULT_AVATAR constant

Constants added:

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;
const DEFAULT_FEMALE_AVATAR = `${API_BASE}/assets/img/female-avatar-place.png`;
```

### 10.5 Z-Index Hierarchy (Updated)

| Component | Z-Index | Purpose |
|-----------|---------|---------|
| Mobile sidebar overlay | `z-40` | Backdrop behind mobile menu |
| Mobile sidebar | `z-50` | Above overlay when open |
| Desktop sidebar | `lg:z-20` | Above content overlays |
| Filter panel | `z-[5]` | Below sidebar, above content |
| Dashboard header | `z-10` | Sticky header |

### 10.6 Production Hardening (Backend)

| Component | Improvement | Purpose |
|-----------|-------------|---------|
| `PhoneUtility.php` | Created centralized utility | Standardizes all phone numbers to `+923XXXXXXXXX` format |
| `AuthController.php` | Unified normalization | Prevents "Phone already registered" errors for variations like `03...` and `+923...` |
| `ProfileController.php` | Normalized DB queries | Ensures profile updates and check-exists calls use consistent formats |
| `AuthRequest.php` | `prepareForValidation` | Automatically normalizes `phone` input before validation rules execute |

### 10.7 Mobile Stability & Build (Android)

| Component | Fix/Feature | Description |
|-----------|-------------|-------------|
| `useGoogleAuth.ts` | Dynamic Native Hook | Prevents crash on Login/Signup screens by loading `AuthSession` only after mount |
| `app.json` | Plugin Audit | Removed redundant `expo-auth-session` entry causing build-time errors |
| `package.json` | `expo-crypto` Sync | Forced `55.0.4` to match SDK 55 peer dependency requirements |
| `login.tsx` / `register/index.tsx` | Safe Hook Integration | Refactored to use the new crash-proof Google Auth wrapper |
| **EAS Build** | Android Production | Successfully triggered and validated production pipeline |

---

**Protocol**: This document must be updated after any structural change or new feature deployment.
