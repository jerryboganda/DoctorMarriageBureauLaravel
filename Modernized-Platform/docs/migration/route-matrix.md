# Doctor Marriage Bureau — Complete Route Matrix & Hydration Strategy

**Target Architecture:** Astro 5 SSR/SSG + Selective Hydrated React 18 Islands  
**Design System:** Tailwind CSS (Medical Fuchsia `#FF206E`, Deep Navy `#1E1B38`) + View Transitions (`<ClientRouter />`)  
**Internationalization:** English (LTR) & Urdu (RTL with `"Noto Sans Arabic"`)  

---

## 1. Route Migration & Hydration Mapping

| # | Route URL | Legacy Implementation | Target Astro Route | Render Mode | Hydrated React Island | Hydration Directive | Auth Guard | SEO / Meta Strategy |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` | Marketing Astro Index (`Marketing-Website/src/pages/index.astro`) | `apps/web/src/pages/index.astro` | SSG (Static) | `ProfileTeaser.tsx`, `AuthModal.tsx` | `client:visible` / `client:idle` | Public | Primary `<h1>`, Medical Matrimonial Schema.org JSON-LD |
| 2 | `/login` | React SPA Auth Modal (`Web App/.../WelcomeScreen.tsx`) | `apps/web/src/pages/login.astro` | SSR (Hybrid) | `AuthModal.tsx` | `client:load` | Guest Only | `noindex, nofollow`, Canonical |
| 3 | `/register` | React SPA Signup Wizard (`Web App/.../AuthModal.tsx`) | `apps/web/src/pages/register.astro` | SSR (Hybrid) | `AuthModal.tsx` (mode=signup) | `client:load` | Guest Only | `noindex, nofollow`, Canonical |
| 4 | `/forgot-password` | React SPA Password Reset (`PasswordResetModal.tsx`) | `apps/web/src/pages/forgot-password.astro` | SSR (Hybrid) | `PasswordResetModal.tsx` | `client:load` | Guest Only | `noindex, nofollow` |
| 5 | `/dashboard` | React SPA Dashboard View (`App.tsx`) | `apps/web/src/pages/dashboard.astro` | SSR (Auth) | `DashboardWidget.tsx`, `RightSidebar.tsx` | `client:load` | Member (Verified) | `noindex, nofollow` (Private Area) |
| 6 | `/discover` | React SPA Discovery View (`DiscoveryView.tsx`) | `apps/web/src/pages/discover.astro` | SSR (Auth) | `DiscoveryView.tsx`, `MatchIntelligenceModal.tsx` | `client:load` | Member | `noindex, nofollow`, Dynamic Doctor Profiles |
| 7 | `/proposals` | React SPA Proposals View (`App.tsx` + `ProposalModal.tsx`) | `apps/web/src/pages/proposals.astro` | SSR (Auth) | `ProposalsList.tsx`, `DeclineModal.tsx` | `client:load` | Member | `noindex, nofollow` |
| 8 | `/profile` | React SPA Profile View (`ProfileDetailWidget.tsx`) | `apps/web/src/pages/profile.astro` | SSR (Auth) | `ProfileDetailWidget.tsx`, `BiodataPDFTemplate.tsx` | `client:load` | Member | `noindex, nofollow` |
| 9 | `/profile/edit` | React SPA 6-Step Editor (`ProfileEditView.tsx`) | `apps/web/src/pages/profile/edit.astro` | SSR (Auth) | `ProfileEditView.tsx` | `client:load` | Member | `noindex, nofollow` |
| 10 | `/messages` | React SPA Messages View (`MessagesView.tsx`) | `apps/web/src/pages/messages.astro` | SSR (Auth) | `MessagesView.tsx`, `CallModal.tsx` | `client:load` | Member (Premium Quota) | `noindex, nofollow` |
| 11 | `/progression` | React SPA Progression View (`ProgressionView.tsx`) | `apps/web/src/pages/progression.astro` | SSR (Auth) | `ProgressionView.tsx` | `client:load` | Member | `noindex, nofollow` |
| 12 | `/family` | React SPA Family Portal (`FamilyPortalView.tsx`) | `apps/web/src/pages/family.astro` | SSR (Auth) | `FamilyPortalView.tsx` | `client:load` | Member | `noindex, nofollow` |
| 13 | `/community` | React SPA Community View (`CommunityView.tsx`) | `apps/web/src/pages/community.astro` | SSR (Auth) | `CommunityView.tsx` | `client:load` | Member | `noindex, nofollow` |
| 14 | `/wallet` | React SPA Wallet View (`WalletView.tsx`) | `apps/web/src/pages/wallet.astro` | SSR (Auth) | `WalletView.tsx`, `PaymentModal.tsx` | `client:load` | Member | `noindex, nofollow` |
| 15 | `/referrals` | React SPA Referral View (`ReferralView.tsx`) | `apps/web/src/pages/referrals.astro` | SSR (Auth) | `ReferralView.tsx` | `client:load` | Member | `noindex, nofollow` |
| 16 | `/notifications` | React SPA Notification Center (`NotificationsView.tsx`)| `apps/web/src/pages/notifications.astro` | SSR (Auth) | `NotificationsView.tsx`, `NotificationDetailModal.tsx` | `client:load` | Member | `noindex, nofollow` |
| 17 | `/settings` | React SPA Settings View (`SettingsView.tsx`) | `apps/web/src/pages/settings.astro` | SSR (Auth) | `SettingsView.tsx`, `TwoFactorSetupModal.tsx` | `client:load` | Member | `noindex, nofollow` |
| 18 | `/packages` | React SPA Subscription View (`SubscriptionModal.tsx`) | `apps/web/src/pages/packages.astro` | SSG + Island | `PackagePricingCards.tsx`, `PaymentModal.tsx` | `client:visible` | Public / Member | Package Pricing Table JSON-LD Schema |
| 19 | `/doctors` | Marketing Dynamic Doctors Index | `apps/web/src/pages/doctors/index.astro` | SSG (Static) | `DoctorFilterBar.tsx` | `client:idle` | Public | AggregateRating & MedicalSpecialty Schema |
| 20 | `/doctors/[specialty]`| Marketing Specialty Category Pages | `apps/web/src/pages/doctors/[specialty].astro` | SSG (Static) | `DoctorSpecialtyList.tsx` | `client:idle` | Public | SEO Keyword Meta: e.g. "Cardiologist Matrimonial" |
| 21 | `/doctors/location/[city]`| Marketing City Geo Landing Pages | `apps/web/src/pages/doctors/location/[city].astro`| SSG (Static)| `DoctorGeoList.tsx` | `client:idle` | Public | LocalBusiness & Place Schema: e.g. "Doctors in Lahore" |
| 22 | `/blog` | Marketing Blog Index (36 Articles) | `apps/web/src/pages/blog/index.astro` | SSG (Static) | Pure Astro (0 KB JS) | None | Public | BlogPosting Schema, RSS Feed |
| 23 | `/blog/[slug]` | Marketing Blog Detail Pages | `apps/web/src/pages/blog/[slug].astro` | SSG (Static) | Pure Astro (0 KB JS) | None | Public | Article Schema, Breadcrumbs, OpenGraph tags |
| 24 | `/about-us` | Marketing About Page | `apps/web/src/pages/about-us.astro` | SSG (Static) | Pure Astro (0 KB JS) | None | Public | Organization Schema, ContactPoint |
| 25 | `/contact-us` | Marketing Contact Page | `apps/web/src/pages/contact-us.astro` | SSG + Island | `ContactForm.tsx`, `FloatingContactButton.tsx`| `client:visible`| Public | ContactPage Schema |
| 26 | `/privacy-policy`| Static Legal Document | `apps/web/src/pages/privacy-policy.astro` | SSG (Static) | Pure Astro (0 KB JS) | None | Public | Standard Legal Meta |
| 27 | `/terms-and-conditions`| Static Legal Document | `apps/web/src/pages/terms-and-conditions.astro` | SSG (Static) | Pure Astro (0 KB JS) | None | Public | Standard Legal Meta |

---

## 2. Layout Hierarchy

```text
                                [ apps/web/src/layouts/ ]
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
          [ PublicLayout.astro ]                         [ AppLayout.astro ]
      (SEO, Header, Nav, Footer,                     (Auth Gated, Sidebar,
       Marketing Schema, Analytics)                   Top Bar, WebSocket Init,
                    │                                 Notifications, Error Boundary)
                    ▼                                             │
      Pages: /, /blog/*, /doctors/*,                              ▼
             /about-us, /packages                   Pages: /dashboard, /discover,
                                                           /profile/*, /messages,
                                                           /progression, /settings
```

---

## 3. Hydration Strategy Guidelines

1. **Zero-JS by Default:** All marketing, landing, blog, and legal pages render pure static HTML/CSS via Astro with 0 KB client JavaScript.
2. **Interactive Islands (`client:load`):** Auth modals, real-time messaging, and profile editor forms hydrate immediately when route is mounted.
3. **Deferred Islands (`client:visible` / `client:idle`):** Pricing tables, filter dropdowns, and photo carousels hydrate only when scrolled into viewport.
4. **View Transitions:** Enabled via Astro 5 `<ClientRouter />` for smooth SPA-like instant page switches without full browser reloading.
