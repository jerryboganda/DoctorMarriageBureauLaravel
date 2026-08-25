# Doctor Marriage Bureau — React Component Reuse & Astro Island Matrix

> **HISTORICAL.** Live UI is Astro in `Modernized-Platform/apps/web`. `New User Panel Frontend/` is **legacy** and must not be treated as the active app.

**Audit Source (legacy):** `Web App/New User Panel Frontend/components/` (44 Components)  
**Live platform:** Astro 5 (`apps/web/src/`)  
**Hydration Engine:** `@astrojs/react` with selective island directives  
**State Architecture:** Zustand 5 (`authStore.ts`), React Context, and typed Axios API client  

---

## 1. Complete 44-Component Inventory & Migration Strategy

| # | Component Name | Legacy Path | Target Astro Island | Reuse Strategy | Hydration Directive | State Dependencies | API Adjustments Required |
|---|---|---|---|---|---|---|---|
| 1 | `AuthModal.tsx` | `components/AuthModal.tsx` | `components/react/auth/AuthModal.tsx` | Direct Reuse | `client:load` | Zustand `authStore` | Migrate to `/api/v1/auth/signup` and `/signin` |
| 2 | `BiodataPDFTemplate.tsx`| `components/BiodataPDFTemplate.tsx`| `components/react/profile/BiodataPDFTemplate.tsx`| Direct Reuse | `client:idle` | Props / Profile Data | jsPDF dynamic import on button click |
| 3 | `CallModal.tsx` | `components/CallModal.tsx` | `components/react/chat/CallModal.tsx` | Direct Reuse | `client:idle` | Local state | Dynamic WebRTC / Contact View Trigger |
| 4 | `CommunityView.tsx` | `components/CommunityView.tsx` | `components/react/community/CommunityView.tsx` | Direct Reuse | `client:load` | Zustand `authStore` | Migrate to `/api/v1/communities` |
| 5 | `CountryCodeSelector.tsx`| `components/CountryCodeSelector.tsx`| `components/react/common/CountryCodeSelector.tsx`| Subcomponent | Inside parent island | Props (flags, phone codes) | None (pure UI control) |
| 6 | `CredentialVerificationModal.tsx`| `components/CredentialVerificationModal.tsx`| `components/react/verification/CredentialVerificationModal.tsx`| Direct Reuse | `client:idle` | Props / Local state | Point to `/api/v1/media/upload-url` for PMDC licenses |
| 7 | `DeclineModal.tsx` | `components/DeclineModal.tsx` | `components/react/proposals/DeclineModal.tsx` | Subcomponent | Inside parent island | Props (proposal ID, onDecline) | Migrate to `/api/v1/interests/{id}/reject` |
| 8 | `DiscoveryView.tsx` | `components/DiscoveryView.tsx` | `components/react/discovery/DiscoveryView.tsx` | Direct Reuse | `client:load` | Zustand `authStore`, Local filters | Migrate to `/api/v1/discovery` and `/search` |
| 9 | `ErrorBoundary.tsx` | `components/ErrorBoundary.tsx` | `components/react/common/ErrorBoundary.tsx` | Subcomponent | Inside parent layout | React Error State | Global fallback boundary |
| 10 | `FamilyPortalView.tsx`| `components/FamilyPortalView.tsx`| `components/react/family/FamilyPortalView.tsx`| Direct Reuse | `client:load` | Zustand `authStore` | Migrate to `/api/v1/family/*` |
| 11 | `FloatingContactButton.tsx`| `components/FloatingContactButton.tsx`| `components/react/common/FloatingContactButton.tsx`| Direct Reuse | `client:idle` | Local state (open/close) | Connect to WhatsApp / Support API |
| 12 | `LanguageToggle.tsx` | `components/LanguageToggle.tsx` | `components/react/common/LanguageToggle.tsx` | Direct Reuse | `client:load` | `i18next` language switcher | Toggles `i18n.changeLanguage('ur'/'en')` & HTML `dir` |
| 13 | `LoadingTimeoutFallback.tsx`| `components/LoadingTimeoutFallback.tsx`| `components/react/common/LoadingTimeoutFallback.tsx`| Subcomponent | Inside parent island | Timer hook | Reusable loading placeholder |
| 14 | `MatchIntelligenceModal.tsx`| `components/MatchIntelligenceModal.tsx`| `components/react/discovery/MatchIntelligenceModal.tsx`| Direct Reuse | `client:idle` | Props / Candidate Data | Migrate to `/api/v1/discovery/match-intelligence/{id}` |
| 15 | `MatchTunerModal.tsx`| `components/MatchTunerModal.tsx`| `components/react/discovery/MatchTunerModal.tsx`| Direct Reuse | `client:idle` | Props / Weight Sliders | Migrate to `/api/v1/discovery/match-tuner` |
| 16 | `MediaAccessRequestModal.tsx`| `components/MediaAccessRequestModal.tsx`| `components/react/media/MediaAccessRequestModal.tsx`| Direct Reuse | `client:idle` | Props / Request State | Migrate to `/api/v1/media/access-requests` |
| 17 | `MessagesView.tsx` | `components/MessagesView.tsx` | `components/react/chat/MessagesView.tsx` | Direct Reuse | `client:load` | Zustand `authStore`, Pusher/WS | Connect to Go native WebSocket `/api/v1/chat/ws` |
| 18 | `NotificationDetailModal.tsx`| `components/NotificationDetailModal.tsx`| `components/react/notifications/NotificationDetailModal.tsx`| Subcomponent | Inside parent island | Props / Notification payload | Mark read on view |
| 19 | `NotificationsView.tsx`| `components/NotificationsView.tsx`| `components/react/notifications/NotificationsView.tsx`| Direct Reuse | `client:load` | Zustand `authStore` | Migrate to `/api/v1/notifications` |
| 20 | `OnboardingModal.tsx`| `components/OnboardingModal.tsx`| `components/react/auth/OnboardingModal.tsx` | Direct Reuse | `client:load` | Zustand `authStore` | Step wizard updating 6 basic profile attributes |
| 21 | `PasswordField.tsx` | `components/PasswordField.tsx` | `components/react/common/PasswordField.tsx` | Subcomponent | Inside parent island | Local state (show/hide) | Pure UI input component |
| 22 | `PasswordResetModal.tsx`| `components/PasswordResetModal.tsx`| `components/react/auth/PasswordResetModal.tsx`| Direct Reuse | `client:load` | Local state (step 1-3) | Migrate to `/api/v1/auth/reset-password` |
| 23 | `PaymentModal.tsx` | `components/PaymentModal.tsx` | `components/react/payments/PaymentModal.tsx` | Direct Reuse | `client:idle` | Props / Selected package | Stripe Checkout redirect + Manual Proof upload |
| 24 | `PremiumMessagingModal.tsx`| `components/PremiumMessagingModal.tsx`| `components/react/chat/PremiumMessagingModal.tsx`| Subcomponent | Inside parent island | Props | Interceptor for unverified or free quota limits |
| 25 | `ProfileCard.tsx` | `components/ProfileCard.tsx` | `components/react/discovery/ProfileCard.tsx` | Subcomponent | Inside parent island | Props (Doctor candidate) | Renders candidate details, tags, blurred photo |
| 26 | `ProfileDetailModal.tsx`| `components/ProfileDetailModal.tsx`| `components/react/discovery/ProfileDetailModal.tsx`| Subcomponent | Inside parent island | Props / Candidate ID | Triggers `ProfileDetailWidget` |
| 27 | `ProfileDetailWidget.tsx`| `components/ProfileDetailWidget.tsx`| `components/react/profile/ProfileDetailWidget.tsx`| Direct Reuse | `client:load` | Props / Member ID | Comprehensive tabbed doctor profile viewer |
| 28 | `ProfileEditView.tsx`| `components/ProfileEditView.tsx`| `components/react/profile/ProfileEditView.tsx`| Direct Reuse | `client:load` | Zustand `authStore`, Section State| Migrate to `/api/v1/profiles/section/{section}` |
| 29 | `ProfileTeaser.tsx` | `components/ProfileTeaser.tsx` | `components/react/marketing/ProfileTeaser.tsx`| Direct Reuse | `client:visible` | Public props (anonymized) | Teaser cards on homepage |
| 30 | `ProgressionView.tsx`| `components/ProgressionView.tsx`| `components/react/progression/ProgressionView.tsx`| Direct Reuse | `client:load` | Zustand `authStore`, Stage State | Migrate to `/api/v1/progression/*` |
| 31 | `ProposalModal.tsx` | `components/ProposalModal.tsx` | `components/react/proposals/ProposalModal.tsx` | Direct Reuse | `client:idle` | Props (target user) | Express Interest modal with custom note |
| 32 | `ReferralPopupModal.tsx`| `components/ReferralPopupModal.tsx`| `components/react/referrals/ReferralPopupModal.tsx`| Subcomponent | Inside parent island | Props / Referral Link | Social share buttons & copy referral code |
| 33 | `ReferralView.tsx` | `components/ReferralView.tsx` | `components/react/referrals/ReferralView.tsx` | Direct Reuse | `client:load` | Zustand `authStore` | Migrate to `/api/v1/referral/my-stats` |
| 34 | `ReportModal.tsx` | `components/ReportModal.tsx` | `components/react/common/ReportModal.tsx` | Direct Reuse | `client:idle` | Props (reported user) | Submit member moderation ticket |
| 35 | `RightSidebar.tsx` | `components/RightSidebar.tsx` | `components/react/dashboard/RightSidebar.tsx` | Direct Reuse | `client:load` | Zustand `authStore` | Profile completion bar, wallet quick widget |
| 36 | `SettingsView.tsx` | `components/SettingsView.tsx` | `components/react/settings/SettingsView.tsx` | Direct Reuse | `client:load` | Zustand `authStore`, Privacy State| 2FA, devices, blocked list, password update |
| 37 | `Sidebar.tsx` | `components/Sidebar.tsx` | `components/react/layout/Sidebar.tsx` | Direct Reuse | `client:load` | Route navigation, unread badges | Dynamic badge counts from WebSocket |
| 38 | `StepUpVerificationModal.tsx`| `components/StepUpVerificationModal.tsx`| `components/react/auth/StepUpVerificationModal.tsx`| Direct Reuse | `client:idle` | Props (action, onSuccess) | Step-up auth modal (10-min valid session) |
| 39 | `SubscriptionModal.tsx`| `components/SubscriptionModal.tsx`| `components/react/payments/SubscriptionModal.tsx`| Direct Reuse | `client:idle` | Props / Package list | Displays tiers: Silver, Gold, Platinum |
| 40 | `TravelModeModal.tsx`| `components/TravelModeModal.tsx`| `components/react/discovery/TravelModeModal.tsx`| Direct Reuse | `client:idle` | Props / Location select | Migrate to `/api/v1/discovery/travel-mode/enable` |
| 41 | `TwoFactorSetupModal.tsx`| `components/TwoFactorSetupModal.tsx`| `components/react/settings/TwoFactorSetupModal.tsx`| Direct Reuse | `client:idle` | Props / TOTP secret | Displays QR code SVG & recovery codes |
| 42 | `VerificationModal.tsx`| `components/VerificationModal.tsx`| `components/react/verification/VerificationModal.tsx`| Direct Reuse | `client:idle` | Props / Doc uploads | PMDC medical license & CNIC upload |
| 43 | `WalletView.tsx` | `components/WalletView.tsx` | `components/react/wallet/WalletView.tsx` | Direct Reuse | `client:load` | Zustand `authStore` | Recharge balance & view transactions |
| 44 | `WelcomeScreen.tsx` | `components/WelcomeScreen.tsx` | `components/react/auth/WelcomeScreen.tsx` | Refactored | `client:load` on `/login` | Zustand `authStore` | Split into Astro static hero + dynamic auth modal |

---

## 2. Shared Utilities & State Stores

- **Zustand Auth Store (`src/stores/authStore.ts`):** Holds user profile, Sanctum Bearer token in memory and local storage, active package status, and unread notification/message counts.
- **Typed Axios Client (`src/lib/api/client.ts`):** Configured with Bearer token injection, dynamic base URL (`import.meta.env.PUBLIC_API_URL`), and standard JSON error handling.
- **Internationalization (`src/locales/`):** Loaded via `react-i18next` supporting `en` (English) and `ur` (Urdu) with automatic RTL styling.
