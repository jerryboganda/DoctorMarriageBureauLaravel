# Admin Panel: Blade-to-React Migration Plan

## Doctor Marriage Bureau — Complete Admin Panel Conversion

**Document Version:** 1.0  
**Created:** 2026-02-27  
**Project:** Doctor Marriage Bureau (DMB)  
**Scope:** Convert the entire Laravel Blade-based admin panel to a React.js SPA, mirroring the architecture of the existing user-facing React frontend at `New User Panel Frontend/`.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Phase 0 — Foundation & Infrastructure](#4-phase-0--foundation--infrastructure)
5. [Phase 1 — Admin API Layer (Laravel Backend)](#5-phase-1--admin-api-layer-laravel-backend)
6. [Phase 2 — React Admin Shell (Layout, Auth, Routing)](#6-phase-2--react-admin-shell-layout-auth-routing)
7. [Phase 3 — Dashboard Module](#7-phase-3--dashboard-module)
8. [Phase 4 — Member Management Module](#8-phase-4--member-management-module)
9. [Phase 5 — Premium Packages & Payments Module](#9-phase-5--premium-packages--payments-module)
10. [Phase 6 — Wallet Module](#10-phase-6--wallet-module)
11. [Phase 7 — Happy Stories Module](#11-phase-7--happy-stories-module)
12. [Phase 8 — Blog System Module](#12-phase-8--blog-system-module)
13. [Phase 9 — Marketing Module](#13-phase-9--marketing-module)
14. [Phase 10 — Contact Us Module](#14-phase-10--contact-us-module)
15. [Phase 11 — Referral System Module](#15-phase-11--referral-system-module)
16. [Phase 12 — Support Ticket Module](#16-phase-12--support-ticket-module)
17. [Phase 13 — Offline Payment System Module](#17-phase-13--offline-payment-system-module)
18. [Phase 14 — Uploaded Files Module](#18-phase-14--uploaded-files-module)
19. [Phase 15 — Website Setup Module](#19-phase-15--website-setup-module)
20. [Phase 16 — Settings Module](#20-phase-16--settings-module)
21. [Phase 17 — Staff & Roles Module](#21-phase-17--staff--roles-module)
22. [Phase 18 — Addon Manager Module](#22-phase-18--addon-manager-module)
23. [Phase 19 — OTP System Module (Addon)](#23-phase-19--otp-system-module-addon)
24. [Phase 20 — Testing, QA & Deployment](#24-phase-20--testing-qa--deployment)
25. [Complete File Inventory](#25-complete-file-inventory)
26. [API Endpoint Master List](#26-api-endpoint-master-list)
27. [Permission/Authorization Matrix](#27-permissionauthorization-matrix)
28. [Risk Register & Mitigation](#28-risk-register--mitigation)

---

## 1. Executive Summary

### What We Are Doing
Converting 100+ Blade view files, 3 layout templates, and the entire server-rendered admin panel into a standalone React.js SPA that communicates with the Laravel backend exclusively through JSON APIs.

### Why
- Unified tech stack with the existing user frontend (React + TypeScript + Tailwind + Vite)
- Better UX: instant navigation, no full-page reloads
- Separation of concerns: backend = pure API, frontend = pure SPA
- Easier maintenance and feature development going forward

### Existing User Frontend Reference Architecture
The user-facing panel at `New User Panel Frontend/` uses:
- **React 18.3** + **TypeScript**
- **Vite** for bundling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Axios** for API calls with Bearer token auth (Laravel Sanctum)
- **Framer Motion** for animations
- **Lucide React** for icons
- **react-i18next** for internationalization
- **Laravel Echo + Pusher** for real-time features
- State-based navigation (no react-router, uses `currentView` state)

The admin panel will follow this same stack but add **React Router v6** for proper URL-based routing (admins need bookmarkable URLs).

---

## 2. Current Architecture Analysis

### 2.1 Admin Layout Structure
```
resources/views/admin/
├── layouts/
│   ├── app.blade.php          # Main layout: sidebar + header + content + footer
│   └── blank.blade.php        # Blank layout (login page)
├── inc/
│   ├── sidenav.blade.php      # Sidebar navigation (789 lines, permission-gated)
│   ├── header.blade.php       # Top header bar
│   └── footer.blade.php       # Footer
```

**Layout uses:** AIZ framework CSS/JS, Poppins font, Bootstrap, Chart.js, jQuery, custom `AIZ.plugins` system.

### 2.2 Admin Sidebar Navigation Structure (Permission-Gated)

| Menu Item | Sub-Items | Permission(s) Required |
|-----------|-----------|----------------------|
| Dashboard | — | `admin_dashboard` |
| Members | Free Members, Premium Members, Approved, Pending, Bulk Add, Deactivated, Blocked, Deleted, Reported, Unapproved Pictures, Profile Attributes (17 sub-items), Profile Sections, Verification Form, Verification Requests | `show_members`, `approved_member_show`, `pending_member_show`, `bulk_member_add`, `deactvated_member_show`, `blocked_member_show`, `deleted_member_show`, `view_reported_profile`, `show_unapproved_profile_picrures`, `create_member`, `manage_profile_sections`, `manage_member_verification_form`, `approve_member` |
| Members > Profile Attributes | Religions, Sects, Castes, Sub-Castes, Member Language, Country, State, City, On Behalf, Family Values, Family Status, Marital Statuses, Annual Salary Ranges, Job Titles, Specialities, Lifestyle & Profile Options, Additional Profile Attributes | `show_religions`, `show_sects`, `show_castes`, `show_sub_castes`, `show_member_languages`, `show_countries`, `show_states`, `show_cities`, `show_on_behalves`, `show_family_values`, `show_family_status`, `show_marital_status`, `show_annual_salary_ranges`, `show_job_titles`, `show_specialities`, `show_profile_option_values`, `show_additional_profile_attributes` |
| Premium Packages | — | `show_packages` |
| Package Payments | — | `show_package_payments` |
| Wallet | Transaction History, Manual Recharge Requests | `wallet_transaction_history`, `offline_wallet_recharge_requests` |
| Happy Stories | — | `show_happy_stories` |
| Blog System | All Posts, Categories | `show_blogs`, `show_blog_categories` |
| Marketing | Send Notification, Profile Reminders | `newsletter` |
| Contact Us Queries | — | `show_contact_us_queries` |
| Referral System | Dashboard, Settings, Rules, Referrals, Rewards, Audit Logs | `view_referral_dashboard`, `manage_referral_settings`, `manage_referral_rules`, `view_referral_audit_logs`, `reverse_referral_reward` |
| Support Ticket | Active, My Tickets, Solved, Settings (Category, Default Agent) | `show_active_tickets`, `show_my_tickets`, `show_solved_tickets`, `show_support_categories`, `default_ticket_assigned_agent` |
| OTP System | SMS Templates, OTP Credentials, Send SMS | `manage_sms_templates`, `manage_otp_credentials`, `send_sms` |
| Offline Payment | Manual Payment Methods | — |
| Uploaded Files | — | `show_uploaded_files` |
| Website Setup | Header, Footer, Pages, Appearance | `header`, `footer`, `show_all_pages`, `appearances` |
| Settings | General, Language, Currency, Payment Methods, SMTP, Email Templates, Third Party, Social Media Login, Firebase Push | `general_settings`, `show_languages`, `show_currencies`, `payment_methods`, `smtp_settings`, `email_templates`, `third_party_settings`, `social_media_login_settings`, `firebase_push_notification` |
| Staffs | All Staffs, Staff Roles | `show_staffs`, `show_staff_roles` |
| Addon Manager | — | `addon_manager` |

### 2.3 Complete Blade View Inventory (100+ files)

```
admin/dashboard.blade.php
admin/test.blade.php
admin/notifications.blade.php
admin/layouts/app.blade.php
admin/layouts/blank.blade.php
admin/inc/sidenav.blade.php
admin/inc/header.blade.php
admin/inc/footer.blade.php
admin/members/index.blade.php
admin/members/create.blade.php
admin/members/view.blade.php
admin/members/member_types.blade.php
admin/members/deleted_members.blade.php
admin/members/verification_requests.blade.php
admin/members/verification_info.blade.php
admin/members/member_verification_form.blade.php
admin/members/unapproved_member_profile_pictures.blade.php
admin/members/reported_members.blade.php
admin/members/package_modal.blade.php
admin/members/get_package.blade.php
admin/members/wallet_balance_modal.blade.php
admin/members/edit/index.blade.php
admin/members/edit/basic_information.blade.php
admin/members/edit/introduction.blade.php
admin/members/edit/education.blade.php
admin/members/edit/career.blade.php
admin/members/edit/physical_attributes.blade.php
admin/members/edit/language.blade.php
admin/members/edit/hobbies_interest.blade.php
admin/members/edit/attitudes_behavior.blade.php
admin/members/edit/lifestyle.blade.php
admin/members/edit/spiritual_backgrounds.blade.php
admin/members/edit/astronomic_information.blade.php
admin/members/edit/family_information.blade.php
admin/members/edit/present_address.blade.php
admin/members/edit/permanent_address.blade.php
admin/members/edit/residency_information.blade.php
admin/members/edit/partner_expectation.blade.php
admin/members/edit/additional_attributes.blade.php
admin/member_profile_attributes/religions/index.blade.php (and edit)
admin/member_profile_attributes/sects/index.blade.php (and edit)
admin/member_profile_attributes/sub_castes/index.blade.php (and edit)
admin/member_profile_attributes/states/index.blade.php (and edit)
admin/member_profile_attributes/specialities/index.blade.php (and edit)
admin/member_profile_attributes/on_behalfs/index.blade.php (and edit)
admin/member_profile_attributes/family_values/index.blade.php (and edit)
admin/member_profile_attributes/profile_option_values/index.blade.php (and edit)
admin/member_profile_attributes/additioal_attributes/index.blade.php
admin/premium_packages/index.blade.php
admin/premium_packages/create.blade.php
admin/premium_packages/edit.blade.php
admin/package_payments/index.blade.php
admin/package_payments/payment_details.blade.php
admin/package_payments/payment_invoice.blade.php
admin/wallet/transaction_history.blade.php
admin/wallet/manual_recharge_requests.blade.php
admin/wallet/wallet_payment_details.blade.php
admin/settings/general_settings.blade.php
admin/settings/smtp_settings.blade.php
admin/settings/payment_method_settings.blade.php
admin/settings/third_party_settings.blade.php
admin/settings/social_media_login.blade.php
admin/settings/social_media_comment_settings/index.blade.php
admin/settings/languages/index.blade.php
admin/settings/languages/edit.blade.php
admin/settings/languages/translate.blade.php
admin/settings/currencies/index.blade.php
admin/settings/currencies/create.blade.php
admin/settings/currencies/edit.blade.php
admin/settings/email_templates/index.blade.php
admin/settings/google_configurations/fcm.blade.php
admin/website_settings/header.blade.php
admin/website_settings/footer.blade.php
admin/website_settings/appearances.blade.php
admin/website_settings/pages/index.blade.php
admin/website_settings/pages/create.blade.php
admin/website_settings/pages/edit.blade.php
admin/website_settings/pages/home_page_edit.blade.php
admin/staff/staffs/index.blade.php
admin/staff/staffs/create.blade.php
admin/staff/staffs/edit.blade.php
admin/staff/roles/index.blade.php
admin/staff/roles/create.blade.php
admin/staff/roles/edit.blade.php
admin/uploaded_files/index.blade.php
admin/uploaded_files/create.blade.php
admin/uploaded_files/info.blade.php
admin/manual_payment_methods/index.blade.php
admin/manual_payment_methods/create.blade.php
admin/manual_payment_methods/edit.blade.php
admin/referral/dashboard.blade.php
admin/referral/settings.blade.php
admin/referral/rules.blade.php
admin/referral/referrals.blade.php
admin/referral/rewards.blade.php
admin/referral/audit_logs.blade.php
admin/referral/referral/dashboard.blade.php (duplicate nested)
admin/referral/referral/settings.blade.php
admin/referral/referral/rules.blade.php
admin/referral/referral/referrals.blade.php
admin/referral/referral/rewards.blade.php
admin/referral/referral/audit_logs.blade.php
admin/marketing/bulk_notifications.blade.php
admin/profile_completion_reminders/index.blade.php
admin/contact_us/index.blade.php
admin/contact_us/view.blade.php
```

### 2.4 Admin Controllers (used in admin.php routes)

All controllers in `app/Http/Controllers/` that serve admin routes:

| Controller | Key Admin Methods |
|------------|------------------|
| `HomeController` | `admin_login()`, `admin_dashboard()`, `admin_profile_update()`, `clearCache()` |
| `MemberController` | `index()`, `create()`, `store()`, `show()`, `edit()`, `update()`, `destroy()`, `block()`, `blocking_reason()`, `toggleActivation()`, `setMemberPassword()`, `login()`, `deleted_members()`, `restore_deleted_member()`, `member_permanemtly_delete()`, `verification_requests()`, `unapproved_profile_pictures()`, `approve_profile_image()`, `show_verification_info()`, `approve_verification()`, `reject_verification()`, `package_info()`, `get_package()`, `package_do_update()`, `member_wallet_balance_update()`, `sendNotification()`, `filterbyStatus()` |
| `ProfileController` | `index()`, `edit()`, `update()` (admin profile) |
| `PackageController` | `index()`, `create()`, `store()`, `edit()`, `update()`, `destroy()`, `update_status()` |
| `PackagePaymentController` | `index()`, `manual_payment_accept()`, `package_payment_invoice_admin()` |
| `WalletController` | `wallet_transaction_history_admin()`, `manual_wallet_recharge_requests()`, `show()`, `wallet_manual_payment_accept()` |
| `HappyStoryController` | `index()`, `show()`, `edit()`, `update()`, `destroy()`, `approval_status()` |
| `BlogController` | `index()`, `create()`, `store()`, `edit()`, `update()`, `destroy()`, `change_status()` |
| `BlogCategoryController` | Full CRUD |
| `ReligionController` | Full CRUD + `religion_bulk_delete()` |
| `SectController` | Full CRUD + `bulk_destroy()` |
| `CasteController` | Full CRUD + `caste_bulk_delete()` |
| `SubCasteController` | Full CRUD + `sub_caste_bulk_delete()` |
| `MemberLanguageController` | Full CRUD |
| `CountryController` | Full CRUD + `updateStatus()` |
| `StateController` | Full CRUD |
| `CityController` | Full CRUD |
| `FamilyStatusController` | Full CRUD |
| `FamilyValueController` | Full CRUD |
| `OnBehalfController` | Full CRUD |
| `MaritalStatusController` | Full CRUD |
| `AnnualSalaryRangeyController` | Full CRUD |
| `ProfileOptionValueController` | Full CRUD + `bulk_delete()`, `toggle_active()` |
| `JobTitleController` | Full CRUD + `bulk_delete()` |
| `SpecialityController` | Full CRUD + `bulk_delete()` |
| `LanguageController` | Full CRUD + `update_rtl_status()`, `key_value_store()` |
| `CurrencyController` | Full CRUD + `update_currency_activation_status()` |
| `SettingController` | `general_settings()`, `update()`, `updateActivationSettings()`, `fcm_settings()`, `fcm_settings_update()`, `smtp_settings()`, `payment_method_settings()`, `payment_method_update()`, `third_party_settings()`, `third_party_settings_update()`, `social_media_login_settings()`, `member_profile_sections_configuration()`, `env_key_update()`, `member_verification_form()`, `member_verification_form_update()`, `website_header_settings()`, `website_footer_settings()`, `website_appearances()`, `testSmtp()` |
| `EmailTemplateController` | `index()`, `update()` |
| `ContactUsController` | `index()`, `show()`, `destroy()` |
| `ReportedUserController` | `reported_members()`, `destroy()` |
| `MemberBulkAddController` | `index()`, `pdf_download_on_behalf()`, `pdf_download_package()`, `bulk_upload()` |
| `StaffController` | Full CRUD |
| `RoleController` | Full CRUD + `add_permission()` |
| `NotificationController` | `index()` (admin notifications) |
| `AddonController` | `index()`, `create()`, `store()`, `activation()` |
| `AizUploadController` | File management CRUD + `file_info()`, `bulk_uploaded_files_delete()` |
| `ManualPaymentMethodController` | Full CRUD |
| `PageController` | Full CRUD (custom pages) |
| `AdditionalAttributeController` | `index()`, `update()` |
| `ReferralController` | `dashboard()`, `settings()`, `updateSettings()`, `rules()`, `storeRule()`, `updateRule()`, `destroyRule()`, `referrals()`, `invalidateReferral()`, `rewards()`, `reverseReward()`, `auditLogs()`, `backfillCodes()` |
| `BulkNotificationController` | `index()`, `send()`, `previewCount()`, `getStates()`, `getCities()` |
| `ProfileCompletionReminderController` | `index()`, `update()`, `sendNow()`, `clearLogs()` |
| `UpdateController` | `step0()`, `step1()`, `step2()`, `step3()`, `purchase_code()` |

### 2.5 Authentication & Middleware

- **Admin middleware (`IsAdmin`):** Checks `Auth::user()->user_type == 'admin' || 'staff'`
- **Current auth:** Session-based (web guard) — admin uses standard Laravel login
- **Target auth:** Sanctum token-based (same as user panel) for the React SPA
- **Permissions:** Spatie `laravel-permission` — 60+ individual permissions gated with `@can()` in Blade
- **Kernel.php aliases:** `admin` => `IsAdmin`, `can` => `Authorize` (Spatie)

---

## 3. Target Architecture

### 3.1 Project Structure

```
Admin Panel Frontend/              # NEW standalone React SPA
├── index.html
├── index.tsx                      # React DOM entry
├── App.tsx                        # Root component with React Router
├── vite.config.ts
├── tailwind.config.cjs
├── postcss.config.cjs
├── tsconfig.json
├── package.json
├── .env
├── .env.local
├── src/
│   ├── api/
│   │   ├── axios.ts               # Axios instance (Sanctum auth)
│   │   ├── admin.ts               # Admin-specific API functions
│   │   ├── members.ts             # Member API functions
│   │   ├── packages.ts            # Package API functions
│   │   ├── payments.ts            # Payment API functions
│   │   ├── wallet.ts              # Wallet API functions
│   │   ├── blog.ts                # Blog API functions
│   │   ├── settings.ts            # Settings API functions
│   │   ├── referral.ts            # Referral API functions
│   │   ├── staff.ts               # Staff/roles API functions
│   │   ├── uploads.ts             # File upload API functions
│   │   └── website.ts             # Website settings API functions
│   ├── stores/
│   │   ├── authStore.ts           # Zustand auth state (admin)
│   │   ├── sidebarStore.ts        # Sidebar open/close state
│   │   └── notificationStore.ts   # Toast notifications
│   ├── hooks/
│   │   ├── usePermission.ts       # Permission checking hook
│   │   ├── usePagination.ts       # Server-side pagination hook
│   │   ├── useDebounce.ts         # Search debounce
│   │   └── useConfirm.ts          # Confirmation dialog hook
│   ├── layouts/
│   │   ├── AdminLayout.tsx        # Main layout: sidebar + header + content
│   │   ├── BlankLayout.tsx        # Login page layout
│   │   ├── Sidebar.tsx            # Sidebar navigation (permission-gated)
│   │   └── Header.tsx             # Top header bar
│   ├── components/
│   │   ├── common/
│   │   │   ├── DataTable.tsx      # Reusable paginated table
│   │   │   ├── SearchInput.tsx    # Debounced search
│   │   │   ├── Modal.tsx          # Reusable modal
│   │   │   ├── ConfirmDialog.tsx  # Delete confirmation
│   │   │   ├── Badge.tsx          # Status badges
│   │   │   ├── Pagination.tsx     # Pagination controls
│   │   │   ├── FileUploader.tsx   # AIZ-style file uploader
│   │   │   ├── ImagePreview.tsx   # Image preview component
│   │   │   ├── StatCard.tsx       # Dashboard stat card
│   │   │   ├── Chart.tsx          # Chart wrapper (Chart.js)
│   │   │   ├── FormInput.tsx      # Form input wrapper
│   │   │   ├── FormSelect.tsx     # Form select wrapper
│   │   │   ├── LoadingSpinner.tsx # Loading states
│   │   │   ├── Toast.tsx          # Toast notifications
│   │   │   ├── PermissionGate.tsx # Permission wrapper component
│   │   │   └── BulkActions.tsx    # Bulk select + actions
│   │   └── forms/
│   │       ├── MemberForm.tsx     # Member create/edit form
│   │       ├── PackageForm.tsx    # Package create/edit form
│   │       ├── BlogForm.tsx       # Blog create/edit form
│   │       ├── StaffForm.tsx      # Staff create/edit form
│   │       └── RoleForm.tsx       # Role create/edit form
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── members/
│   │   │   ├── MemberListPage.tsx
│   │   │   ├── MemberCreatePage.tsx
│   │   │   ├── MemberViewPage.tsx
│   │   │   ├── MemberEditPage.tsx
│   │   │   ├── DeletedMembersPage.tsx
│   │   │   ├── VerificationRequestsPage.tsx
│   │   │   ├── VerificationInfoPage.tsx
│   │   │   ├── UnapprovedPicturesPage.tsx
│   │   │   ├── ReportedMembersPage.tsx
│   │   │   ├── BulkMemberAddPage.tsx
│   │   │   ├── VerificationFormPage.tsx
│   │   │   ├── ProfileSectionsPage.tsx
│   │   │   └── attributes/
│   │   │       ├── ReligionsPage.tsx
│   │   │       ├── SectsPage.tsx
│   │   │       ├── CastesPage.tsx
│   │   │       ├── SubCastesPage.tsx
│   │   │       ├── MemberLanguagesPage.tsx
│   │   │       ├── CountriesPage.tsx
│   │   │       ├── StatesPage.tsx
│   │   │       ├── CitiesPage.tsx
│   │   │       ├── OnBehalfPage.tsx
│   │   │       ├── FamilyValuesPage.tsx
│   │   │       ├── FamilyStatusPage.tsx
│   │   │       ├── MaritalStatusesPage.tsx
│   │   │       ├── AnnualSalariesPage.tsx
│   │   │       ├── JobTitlesPage.tsx
│   │   │       ├── SpecialitiesPage.tsx
│   │   │       ├── ProfileOptionValuesPage.tsx
│   │   │       └── AdditionalAttributesPage.tsx
│   │   ├── packages/
│   │   │   ├── PackageListPage.tsx
│   │   │   ├── PackageCreatePage.tsx
│   │   │   └── PackageEditPage.tsx
│   │   ├── payments/
│   │   │   ├── PaymentListPage.tsx
│   │   │   ├── PaymentDetailPage.tsx
│   │   │   └── PaymentInvoicePage.tsx
│   │   ├── wallet/
│   │   │   ├── TransactionHistoryPage.tsx
│   │   │   ├── ManualRechargeRequestsPage.tsx
│   │   │   └── WalletPaymentDetailPage.tsx
│   │   ├── happy-stories/
│   │   │   └── HappyStoriesPage.tsx
│   │   ├── blog/
│   │   │   ├── BlogListPage.tsx
│   │   │   ├── BlogCreatePage.tsx
│   │   │   ├── BlogEditPage.tsx
│   │   │   └── BlogCategoriesPage.tsx
│   │   ├── marketing/
│   │   │   ├── BulkNotificationsPage.tsx
│   │   │   └── ProfileRemindersPage.tsx
│   │   ├── contact-us/
│   │   │   ├── ContactUsListPage.tsx
│   │   │   └── ContactUsViewPage.tsx
│   │   ├── referral/
│   │   │   ├── ReferralDashboardPage.tsx
│   │   │   ├── ReferralSettingsPage.tsx
│   │   │   ├── ReferralRulesPage.tsx
│   │   │   ├── ReferralsListPage.tsx
│   │   │   ├── ReferralRewardsPage.tsx
│   │   │   └── ReferralAuditLogsPage.tsx
│   │   ├── support/
│   │   │   ├── ActiveTicketsPage.tsx
│   │   │   ├── MyTicketsPage.tsx
│   │   │   ├── SolvedTicketsPage.tsx
│   │   │   └── SupportSettingsPage.tsx
│   │   ├── offline-payment/
│   │   │   ├── ManualPaymentMethodsPage.tsx
│   │   │   ├── CreateManualPaymentPage.tsx
│   │   │   └── EditManualPaymentPage.tsx
│   │   ├── uploads/
│   │   │   └── UploadedFilesPage.tsx
│   │   ├── website/
│   │   │   ├── HeaderSettingsPage.tsx
│   │   │   ├── FooterSettingsPage.tsx
│   │   │   ├── AppearancesPage.tsx
│   │   │   ├── PagesListPage.tsx
│   │   │   ├── CreatePagePage.tsx
│   │   │   └── EditPagePage.tsx
│   │   ├── settings/
│   │   │   ├── GeneralSettingsPage.tsx
│   │   │   ├── SmtpSettingsPage.tsx
│   │   │   ├── PaymentMethodsPage.tsx
│   │   │   ├── ThirdPartySettingsPage.tsx
│   │   │   ├── SocialMediaLoginPage.tsx
│   │   │   ├── LanguagesPage.tsx
│   │   │   ├── LanguageTranslatePage.tsx
│   │   │   ├── CurrenciesPage.tsx
│   │   │   ├── EmailTemplatesPage.tsx
│   │   │   └── FcmSettingsPage.tsx
│   │   ├── staff/
│   │   │   ├── StaffListPage.tsx
│   │   │   ├── StaffCreatePage.tsx
│   │   │   ├── StaffEditPage.tsx
│   │   │   ├── RolesListPage.tsx
│   │   │   ├── RoleCreatePage.tsx
│   │   │   └── RoleEditPage.tsx
│   │   ├── addons/
│   │   │   └── AddonManagerPage.tsx
│   │   ├── otp/
│   │   │   ├── SmsTemplatesPage.tsx
│   │   │   ├── OtpCredentialsPage.tsx
│   │   │   └── BulkSmsPage.tsx
│   │   └── notifications/
│   │       └── NotificationsPage.tsx
│   ├── types/
│   │   ├── index.ts               # All TypeScript interfaces
│   │   ├── member.ts
│   │   ├── package.ts
│   │   ├── payment.ts
│   │   └── settings.ts
│   └── utils/
│       ├── permissions.ts         # Permission constants & helpers
│       ├── formatters.ts          # Date, price, etc. formatters
│       ├── validators.ts          # Form validation helpers
│       └── constants.ts           # App constants
├── locales/
│   ├── en.json
│   └── ur.json
└── public/
    └── logo.png
```

### 3.2 Technology Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Routing | **React Router v6** | Admins need bookmarkable URLs (`/admin/members/123/edit`) |
| State | **Zustand** | Same as user panel; lightweight |
| API | **Axios + Sanctum** | Same as user panel; Bearer token auth |
| Tables | **Custom DataTable component** | Server-side pagination, sort, search |
| Forms | **React Hook Form + Zod** | Type-safe validation |
| Charts | **Chart.js + react-chartjs-2** | Dashboard charts (line, doughnut) |
| Icons | **Lucide React** | Same as user panel |
| Styling | **Tailwind CSS** | Same as user panel |
| i18n | **react-i18next** | Same as user panel |
| File Upload | **Custom FileUploader** | Replace AIZ uploader |
| Rich Text | **TipTap or React Quill** | Blog post editor |
| Notifications | **react-hot-toast** | Flash message replacement |
| Animations | **Framer Motion** | Same as user panel |

---

## 4. Phase 0 — Foundation & Infrastructure

### 4.1 Create Project Scaffolding
```bash
mkdir "Admin Panel Frontend"
cd "Admin Panel Frontend"
npm create vite@latest . -- --template react-ts
```

### 4.2 Install Dependencies
```bash
# Core
npm install react react-dom react-router-dom

# State & API
npm install zustand axios

# UI & Styling
npm install tailwindcss @tailwindcss/forms postcss autoprefixer
npm install lucide-react framer-motion

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Charts
npm install chart.js react-chartjs-2

# Tables & Data
npm install @tanstack/react-table

# i18n
npm install i18next react-i18next i18next-browser-languagedetector

# Rich Text Editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image

# Notifications
npm install react-hot-toast

# Date utilities
npm install date-fns

# File upload
npm install react-dropzone

# Real-time (optional for admin)
npm install laravel-echo pusher-js

# Dev
npm install -D @types/react @types/react-dom typescript
```

### 4.3 Configure Vite
Mirror the user panel's `vite.config.ts` with admin-specific settings. Build output goes to `public/admin-panel/` for Laravel to serve.

### 4.4 Configure Tailwind
Extend user panel's `tailwind.config.cjs` with admin-specific colors (darker sidebar, etc.).

### 4.5 Environment Variables
```env
VITE_API_BASE_URL=https://api.doctormarriagebureau.com.pk/api/admin
VITE_APP_NAME=DMB Admin
VITE_GOOGLE_CLIENT_ID=...
```

### 4.6 Laravel: Admin API Route Prefix
Add new route file `routes/admin_api.php` with prefix `/api/admin` using Sanctum auth + admin middleware.

**Estimated effort:** 1-2 days

---

## 5. Phase 1 — Admin API Layer (Laravel Backend)

### 5.1 New Admin API Controller Base

Create `app/Http/Controllers/Api/Admin/` namespace with all admin API controllers.

### 5.2 Admin API Route File

Create `routes/admin_api.php`:
```php
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard/stats', 'DashboardController@stats');
    Route::get('/dashboard/earnings-chart', 'DashboardController@earningsChart');
    Route::get('/dashboard/happy-stories-chart', 'DashboardController@happyStoriesChart');
    
    // Auth
    Route::post('/login', 'AuthController@login')->withoutMiddleware(['auth:sanctum', 'admin']);
    Route::post('/logout', 'AuthController@logout');
    Route::get('/me', 'AuthController@me'); // Current admin user + permissions
    
    // Members (full CRUD + special actions)
    Route::apiResource('members', 'MemberController');
    Route::post('/members/{id}/block', 'MemberController@block');
    Route::post('/members/{id}/toggle-activation', 'MemberController@toggleActivation');
    Route::post('/members/{id}/set-password', 'MemberController@setPassword');
    Route::post('/members/{id}/login-as', 'MemberController@loginAs');
    Route::get('/members/deleted', 'MemberController@deleted');
    Route::post('/members/{id}/restore', 'MemberController@restore');
    Route::delete('/members/{id}/permanent', 'MemberController@permanentDelete');
    Route::get('/members/verification-requests', 'MemberController@verificationRequests');
    Route::post('/members/{id}/approve-verification', 'MemberController@approveVerification');
    Route::post('/members/{id}/reject-verification', 'MemberController@rejectVerification');
    Route::get('/members/unapproved-pictures', 'MemberController@unapprovedPictures');
    Route::post('/members/{id}/approve-picture', 'MemberController@approvePicture');
    Route::post('/members/{id}/update-package', 'MemberController@updatePackage');
    Route::post('/members/{id}/update-wallet', 'MemberController@updateWallet');
    Route::post('/members/{id}/send-notification', 'MemberController@sendNotification');
    Route::get('/members/filter/{status}', 'MemberController@filterByStatus');
    Route::post('/members/bulk-upload', 'MemberController@bulkUpload');
    
    // Profile Attributes (all follow same CRUD pattern)
    Route::apiResource('religions', 'ReligionController');
    Route::post('/religions/bulk-delete', 'ReligionController@bulkDelete');
    Route::apiResource('sects', 'SectController');
    Route::post('/sects/bulk-delete', 'SectController@bulkDelete');
    Route::apiResource('castes', 'CasteController');
    Route::post('/castes/bulk-delete', 'CasteController@bulkDelete');
    Route::apiResource('sub-castes', 'SubCasteController');
    Route::post('/sub-castes/bulk-delete', 'SubCasteController@bulkDelete');
    Route::apiResource('member-languages', 'MemberLanguageController');
    Route::apiResource('countries', 'CountryController');
    Route::post('/countries/{id}/toggle-status', 'CountryController@toggleStatus');
    Route::apiResource('states', 'StateController');
    Route::apiResource('cities', 'CityController');
    Route::apiResource('family-status', 'FamilyStatusController');
    Route::apiResource('family-values', 'FamilyValueController');
    Route::apiResource('on-behalf', 'OnBehalfController');
    Route::apiResource('marital-statuses', 'MaritalStatusController');
    Route::apiResource('annual-salaries', 'AnnualSalaryController');
    Route::apiResource('job-titles', 'JobTitleController');
    Route::post('/job-titles/bulk-delete', 'JobTitleController@bulkDelete');
    Route::apiResource('specialities', 'SpecialityController');
    Route::post('/specialities/bulk-delete', 'SpecialityController@bulkDelete');
    Route::apiResource('profile-option-values', 'ProfileOptionValueController');
    Route::post('/profile-option-values/bulk-delete', 'ProfileOptionValueController@bulkDelete');
    Route::post('/profile-option-values/{id}/toggle-active', 'ProfileOptionValueController@toggleActive');
    Route::apiResource('additional-attributes', 'AdditionalAttributeController');
    
    // Premium Packages
    Route::apiResource('packages', 'PackageController');
    Route::post('/packages/{id}/toggle-status', 'PackageController@toggleStatus');
    
    // Package Payments
    Route::apiResource('package-payments', 'PackagePaymentController');
    Route::post('/package-payments/{id}/accept-manual', 'PackagePaymentController@acceptManual');
    Route::get('/package-payments/{id}/invoice', 'PackagePaymentController@invoice');
    
    // Wallet
    Route::get('/wallet/transactions', 'WalletController@transactions');
    Route::get('/wallet/manual-requests', 'WalletController@manualRequests');
    Route::get('/wallet/payment/{id}', 'WalletController@paymentDetail');
    Route::post('/wallet/manual-accept/{id}', 'WalletController@acceptManual');
    
    // Happy Stories
    Route::apiResource('happy-stories', 'HappyStoryController');
    Route::post('/happy-stories/{id}/toggle-approval', 'HappyStoryController@toggleApproval');
    
    // Blog
    Route::apiResource('blogs', 'BlogController');
    Route::post('/blogs/{id}/toggle-status', 'BlogController@toggleStatus');
    Route::apiResource('blog-categories', 'BlogCategoryController');
    
    // Marketing
    Route::get('/bulk-notifications', 'BulkNotificationController@index');
    Route::post('/bulk-notifications/send', 'BulkNotificationController@send');
    Route::post('/bulk-notifications/preview-count', 'BulkNotificationController@previewCount');
    Route::get('/bulk-notifications/states', 'BulkNotificationController@getStates');
    Route::get('/bulk-notifications/cities', 'BulkNotificationController@getCities');
    Route::get('/profile-reminders', 'ProfileReminderController@index');
    Route::post('/profile-reminders/update', 'ProfileReminderController@update');
    Route::post('/profile-reminders/send-now', 'ProfileReminderController@sendNow');
    Route::post('/profile-reminders/clear-logs', 'ProfileReminderController@clearLogs');
    
    // Contact Us
    Route::apiResource('contact-us', 'ContactUsController');
    
    // Referral
    Route::prefix('referral')->group(function () {
        Route::get('/dashboard', 'ReferralController@dashboard');
        Route::get('/settings', 'ReferralController@settings');
        Route::post('/settings', 'ReferralController@updateSettings');
        Route::apiResource('rules', 'ReferralRuleController');
        Route::get('/referrals', 'ReferralController@referrals');
        Route::post('/referrals/{id}/invalidate', 'ReferralController@invalidate');
        Route::get('/rewards', 'ReferralController@rewards');
        Route::post('/rewards/{id}/reverse', 'ReferralController@reverseReward');
        Route::get('/audit-logs', 'ReferralController@auditLogs');
        Route::post('/backfill-codes', 'ReferralController@backfillCodes');
    });
    
    // Support Tickets
    Route::apiResource('support-tickets', 'SupportTicketController');
    Route::get('/support-tickets/active', 'SupportTicketController@active');
    Route::get('/support-tickets/solved', 'SupportTicketController@solved');
    Route::post('/support-tickets/{id}/reply', 'SupportTicketController@reply');
    
    // Manual Payment Methods
    Route::apiResource('manual-payment-methods', 'ManualPaymentMethodController');
    
    // Uploaded Files
    Route::get('/uploaded-files', 'UploadedFileController@index');
    Route::post('/uploaded-files', 'UploadedFileController@store');
    Route::get('/uploaded-files/{id}/info', 'UploadedFileController@info');
    Route::delete('/uploaded-files/{id}', 'UploadedFileController@destroy');
    Route::post('/uploaded-files/bulk-delete', 'UploadedFileController@bulkDelete');
    
    // Website Setup
    Route::get('/website/header', 'WebsiteController@headerSettings');
    Route::post('/website/header', 'WebsiteController@updateHeader');
    Route::get('/website/footer', 'WebsiteController@footerSettings');
    Route::post('/website/footer', 'WebsiteController@updateFooter');
    Route::get('/website/appearances', 'WebsiteController@appearances');
    Route::post('/website/appearances', 'WebsiteController@updateAppearances');
    Route::apiResource('custom-pages', 'CustomPageController');
    
    // Settings
    Route::get('/settings/general', 'SettingsController@general');
    Route::post('/settings/general', 'SettingsController@updateGeneral');
    Route::get('/settings/smtp', 'SettingsController@smtp');
    Route::post('/settings/smtp', 'SettingsController@updateSmtp');
    Route::post('/settings/smtp/test', 'SettingsController@testSmtp');
    Route::get('/settings/payment-methods', 'SettingsController@paymentMethods');
    Route::post('/settings/payment-methods', 'SettingsController@updatePaymentMethods');
    Route::get('/settings/third-party', 'SettingsController@thirdParty');
    Route::post('/settings/third-party', 'SettingsController@updateThirdParty');
    Route::get('/settings/social-login', 'SettingsController@socialLogin');
    Route::post('/settings/social-login', 'SettingsController@updateSocialLogin');
    Route::get('/settings/fcm', 'SettingsController@fcm');
    Route::post('/settings/fcm', 'SettingsController@updateFcm');
    Route::get('/settings/verification-form', 'SettingsController@verificationForm');
    Route::post('/settings/verification-form', 'SettingsController@updateVerificationForm');
    Route::get('/settings/profile-sections', 'SettingsController@profileSections');
    Route::post('/settings/profile-sections', 'SettingsController@updateProfileSections');
    Route::post('/settings/env-update', 'SettingsController@envUpdate');
    Route::post('/settings/activation', 'SettingsController@updateActivation');
    
    // Languages
    Route::apiResource('languages', 'LanguageController');
    Route::post('/languages/{id}/toggle-rtl', 'LanguageController@toggleRtl');
    Route::get('/languages/{id}/translations', 'LanguageController@getTranslations');
    Route::post('/languages/{id}/translations', 'LanguageController@updateTranslations');
    
    // Currencies
    Route::apiResource('currencies', 'CurrencyController');
    Route::post('/currencies/{id}/toggle-status', 'CurrencyController@toggleStatus');
    
    // Email Templates
    Route::get('/email-templates', 'EmailTemplateController@index');
    Route::post('/email-templates', 'EmailTemplateController@update');
    
    // Staff & Roles
    Route::apiResource('staffs', 'StaffController');
    Route::apiResource('roles', 'RoleController');
    Route::post('/roles/{id}/permissions', 'RoleController@updatePermissions');
    
    // Notifications
    Route::get('/notifications', 'NotificationController@index');
    
    // Addons
    Route::get('/addons', 'AddonController@index');
    Route::post('/addons', 'AddonController@store');
    Route::post('/addons/{id}/toggle', 'AddonController@toggle');
    
    // Cache
    Route::post('/cache/clear', 'SystemController@clearCache');
});
```

### 5.3 Register in RouteServiceProvider

Add `mapAdminApiRoutes()` method:
```php
protected function mapAdminApiRoutes()
{
    Route::prefix('api')
        ->middleware('api')
        ->namespace($this->namespace . '\Api\Admin')
        ->group(base_path('routes/admin_api.php'));
}
```

### 5.4 Admin API Controllers to Create

Create **30 new API controllers** under `app/Http/Controllers/Api/Admin/`:

1. `AuthController` — login, logout, me (with permissions)
2. `DashboardController` — stats, charts data
3. `MemberController` — all member operations
4. `ReligionController`, `SectController`, `CasteController`, `SubCasteController`
5. `MemberLanguageController`, `CountryController`, `StateController`, `CityController`
6. `FamilyStatusController`, `FamilyValueController`, `OnBehalfController`
7. `MaritalStatusController`, `AnnualSalaryController`
8. `JobTitleController`, `SpecialityController`
9. `ProfileOptionValueController`, `AdditionalAttributeController`
10. `PackageController`, `PackagePaymentController`
11. `WalletController`, `HappyStoryController`
12. `BlogController`, `BlogCategoryController`
13. `BulkNotificationController`, `ProfileReminderController`
14. `ContactUsController`, `ReferralController`
15. `SupportTicketController`
16. `ManualPaymentMethodController`
17. `UploadedFileController`
18. `WebsiteController`, `CustomPageController`
19. `SettingsController`, `LanguageController`, `CurrencyController`
20. `EmailTemplateController`
21. `StaffController`, `RoleController`
22. `NotificationController`, `AddonController`, `SystemController`

Each controller returns JSON responses. Reuse existing business logic from web controllers — extract shared logic into Service classes where appropriate.

### 5.5 Admin Auth API

The `/api/admin/login` endpoint:
- Accepts email/password
- Validates `user_type` is `admin` or `staff`
- Returns Sanctum token + user data + **permissions array**
- The `/api/admin/me` endpoint returns current user info + all Spatie permissions

**Estimated effort:** 8-12 days

---

## 6. Phase 2 — React Admin Shell (Layout, Auth, Routing)

### 6.1 Auth Flow
1. Admin visits `/admin` → React SPA loads
2. If no token → show `LoginPage` 
3. On login → call `POST /api/admin/login` → store token in localStorage
4. Call `GET /api/admin/me` → get user info + permissions → store in Zustand
5. Render `AdminLayout` with permission-gated sidebar

### 6.2 React Router Setup (`App.tsx`)
```tsx
<Routes>
  <Route path="/admin/login" element={<BlankLayout><LoginPage /></BlankLayout>} />
  <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
    <Route index element={<Navigate to="dashboard" />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="members" element={<MemberListPage />} />
    <Route path="members/create" element={<MemberCreatePage />} />
    <Route path="members/:id" element={<MemberViewPage />} />
    <Route path="members/:id/edit" element={<MemberEditPage />} />
    {/* ... 70+ more routes ... */}
  </Route>
</Routes>
```

### 6.3 Permission-Gated Sidebar
Replicate the exact sidebar structure from `admin/inc/sidenav.blade.php` (789 lines). Each menu item wrapped in `<PermissionGate permission="...">`.

### 6.4 Header Bar
- Admin name + avatar
- Language switcher
- Notification bell
- Cache clear button
- Logout

**Estimated effort:** 3-4 days

---

## 7. Phase 3 — Dashboard Module

### React Components
- `DashboardPage.tsx` — 4 stat cards (Total, Premium, Free, Blocked members) + earnings line chart + earnings summary cards + happy stories carousel + happy stories doughnut chart

### API Endpoints Needed
- `GET /api/admin/dashboard/stats` → member counts, earnings totals
- `GET /api/admin/dashboard/earnings-chart` → monthly earnings for current year
- `GET /api/admin/dashboard/happy-stories-chart` → total/approved/pending counts
- `GET /api/admin/dashboard/happy-stories` → latest 8 approved stories

**Estimated effort:** 2 days

---

## 8. Phase 4 — Member Management Module

**This is the largest module — 18+ Blade views.**

### Pages (13 pages)
| Page | Blade Source | Key Features |
|------|-------------|--------------|
| `MemberListPage` | `members/index.blade.php` (467 lines) | Paginated table, search by name/email/phone/code, filter by status (free/premium/approved/pending/deactivated/blocked), block/unblock toggle, login-as, delete, edit, view, package assignment modal, wallet balance modal, send notification |
| `MemberCreatePage` | `members/create.blade.php` | Full member creation form |
| `MemberViewPage` | `members/view.blade.php` | Full member profile view (all sections) |
| `MemberEditPage` | `members/edit/` (15 sub-views) | Tabbed edit form with sections: basic info, introduction, education, career, physical attributes, language, hobbies, attitudes, lifestyle, spiritual background, astrology, family, present address, permanent address, residency, partner expectations, additional attributes |
| `DeletedMembersPage` | `members/deleted_members.blade.php` | Soft-deleted members list, restore, permanent delete |
| `VerificationRequestsPage` | `members/verification_requests.blade.php` | Pending verification requests table |
| `VerificationInfoPage` | `members/verification_info.blade.php` | Individual verification detail + approve/reject |
| `UnapprovedPicturesPage` | `members/unapproved_member_profile_pictures.blade.php` | Photo grid with approve/reject |
| `ReportedMembersPage` | `members/reported_members.blade.php` | Reported users list + delete report |
| `BulkMemberAddPage` | Member bulk add via Excel upload |
| `VerificationFormPage` | `members/member_verification_form.blade.php` | Configure what fields appear on verification form |
| `ProfileSectionsPage` | Profile section visibility configuration |

### Member Edit Tabs (15 tabs)
Each corresponds to a Blade partial in `members/edit/`:
1. Basic Information
2. Introduction
3. Education (CRUD sub-items)
4. Career (CRUD sub-items)
5. Physical Attributes
6. Language
7. Hobbies & Interests
8. Attitudes & Behavior
9. Lifestyle
10. Spiritual Background
11. Astronomic Information
12. Family Information
13. Present Address
14. Permanent Address
15. Residency Information
16. Partner Expectation
17. Additional Attributes

### Profile Attribute Sub-Pages (17 CRUD pages)
All follow the same pattern: list table + create/edit modal + delete confirmation + bulk delete.

| Attribute | Model | Has Bulk Delete |
|-----------|-------|----------------|
| Religions | `Religion` | Yes |
| Sects | `Sect` | Yes |
| Castes | `Caste` | Yes (parent: religion) |
| Sub-Castes | `SubCaste` | Yes (parent: caste) |
| Member Languages | `MemberLanguage` | No |
| Countries | `Country` | No (has toggle active) |
| States | `State` | No (parent: country) |
| Cities | `City` | No (parent: state) |
| On Behalf | `OnBehalf` | No |
| Family Values | `FamilyValue` | No |
| Family Status | `FamilyStatus` | No |
| Marital Statuses | `MaritalStatus` | No |
| Annual Salary Ranges | `AnnualSalaryRange` | No |
| Job Titles | `JobTitle` | Yes |
| Specialities | `Speciality` | Yes |
| Profile Option Values | `ProfileOptionValue` | Yes (has toggle active) |
| Additional Attributes | `AdditionalAttribute` | No |

**Estimated effort:** 12-15 days

---

## 9. Phase 5 — Premium Packages & Payments Module

### Pages
- `PackageListPage` — List all packages, toggle active/inactive, delete
- `PackageCreatePage` — Form: name, price, validity, features (remaining interests, contacts, photo gallery, profile viewers, etc.)
- `PackageEditPage` — Same form prefilled
- `PaymentListPage` — All package payments table with status, search, pagination
- `PaymentDetailPage` — Individual payment detail (for manual payments: accept button)
- `PaymentInvoicePage` — Printable invoice view

**Estimated effort:** 4-5 days

---

## 10. Phase 6 — Wallet Module

### Pages
- `TransactionHistoryPage` — All wallet transactions table
- `ManualRechargeRequestsPage` — Pending manual recharge requests, accept button
- `WalletPaymentDetailPage` — Individual recharge detail

**Estimated effort:** 2 days

---

## 11. Phase 7 — Happy Stories Module

### Pages
- `HappyStoriesPage` — List all stories, approve/reject toggle, view, delete

**Estimated effort:** 1-2 days

---

## 12. Phase 8 — Blog System Module

### Pages
- `BlogListPage` — All posts table, toggle published/draft, delete
- `BlogCreatePage` — Form with rich text editor (TipTap), image upload, category select, SEO fields
- `BlogEditPage` — Same form prefilled
- `BlogCategoriesPage` — Categories list with inline create/edit/delete

**Estimated effort:** 3-4 days

---

## 13. Phase 9 — Marketing Module

### Pages
- `BulkNotificationsPage` — Filter by gender/package/country/state/city, preview count, compose & send push notification
- `ProfileRemindersPage` — Configure reminder settings, view logs, send now, clear logs

**Estimated effort:** 2-3 days

---

## 14. Phase 10 — Contact Us Module

### Pages
- `ContactUsListPage` — All submissions table
- `ContactUsViewPage` — Individual submission detail

**Estimated effort:** 1 day

---

## 15. Phase 11 — Referral System Module

### Pages (6 pages)
- `ReferralDashboardPage` — Stats, charts, recent referrals
- `ReferralSettingsPage` — Enable/disable, configure rewards, popup settings
- `ReferralRulesPage` — CRUD referral rules
- `ReferralsListPage` — All referrals table, invalidate
- `ReferralRewardsPage` — All rewards table, reverse reward
- `ReferralAuditLogsPage` — Audit log table

**Estimated effort:** 3-4 days

---

## 16. Phase 12 — Support Ticket Module

### Pages
- `ActiveTicketsPage` — Active tickets table
- `MyTicketsPage` — Admin's own tickets
- `SolvedTicketsPage` — Resolved tickets
- `SupportSettingsPage` — Categories, default assigned agent

**Estimated effort:** 2-3 days

---

## 17. Phase 13 — Offline Payment System Module

### Pages
- `ManualPaymentMethodsPage` — List, create, edit, delete manual payment methods

**Estimated effort:** 1-2 days

---

## 18. Phase 14 — Uploaded Files Module

### Pages
- `UploadedFilesPage` — File grid/list view, upload, preview, info modal, delete, bulk delete

**Estimated effort:** 2-3 days

---

## 19. Phase 15 — Website Setup Module

### Pages
- `HeaderSettingsPage` — Logo, header style, navigation configuration
- `FooterSettingsPage` — Footer content, links, social links
- `AppearancesPage` — Color scheme, homepage sections visibility
- `PagesListPage` — Custom pages list
- `CreatePagePage` / `EditPagePage` — Rich text page editor

**Estimated effort:** 3-4 days

---

## 20. Phase 16 — Settings Module

### Pages (10 pages)
- `GeneralSettingsPage` — Site name, motto, timezone, member verification toggle, etc.
- `SmtpSettingsPage` — SMTP host, port, username, password + test button
- `PaymentMethodsPage` — Toggle payment gateways, enter API keys
- `ThirdPartySettingsPage` — Google reCAPTCHA, analytics, etc.
- `SocialMediaLoginPage` — Google, Facebook, Apple login credentials
- `LanguagesPage` — Languages list, add, toggle RTL
- `LanguageTranslatePage` — Key-value translation editor
- `CurrenciesPage` — Currencies list, add, toggle active
- `EmailTemplatesPage` — Email template list, edit content
- `FcmSettingsPage` — Firebase push notification configuration

**Estimated effort:** 5-7 days

---

## 21. Phase 17 — Staff & Roles Module

### Pages
- `StaffListPage` — All staff members, create, edit, delete
- `StaffCreatePage` / `StaffEditPage` — Name, email, phone, role assignment, password
- `RolesListPage` — All roles
- `RoleCreatePage` / `RoleEditPage` — Role name + permission checkbox matrix (60+ permissions)

**Estimated effort:** 3-4 days

---

## 22. Phase 18 — Addon Manager Module

### Pages
- `AddonManagerPage` — List installed addons, upload new addon zip, toggle activation

**Estimated effort:** 1-2 days

---

## 23. Phase 19 — OTP System Module (Addon)

### Pages (conditional on addon activation)
- `SmsTemplatesPage` — SMS template CRUD
- `OtpCredentialsPage` — Twilio/nexmo credentials
- `BulkSmsPage` — Compose and send bulk SMS

**Estimated effort:** 2 days

---

## 24. Phase 20 — Testing, QA & Deployment

### 24.1 Testing Checklist
- [ ] All 70+ routes render correctly
- [ ] All CRUD operations work for every module
- [ ] Permission gating works (staff with limited permissions sees restricted UI)
- [ ] Pagination, search, sort work on all tables
- [ ] File upload works (images, Excel for bulk members, addon zips)
- [ ] All charts render with real data
- [ ] Login/logout flow works
- [ ] Token expiry handling (auto-redirect to login)
- [ ] RTL support (if needed)
- [ ] Mobile responsiveness
- [ ] All modals (delete confirmation, package assignment, wallet balance)
- [ ] Toast notifications for all actions
- [ ] Error handling (API failures, validation errors)
- [ ] Invoice print/PDF generation

### 24.2 Deployment Strategy
1. Build React admin SPA: `npm run build`
2. Copy `dist/` contents to `public/admin-panel/`
3. Add Laravel catch-all route for `/admin/*` to serve `admin-panel/index.html`
4. Keep old Blade admin as fallback at `/admin-legacy/` during transition
5. Redirect `/admin` to new React SPA

### 24.3 Laravel Route for SPA

```php
// In routes/web.php — add BEFORE the blade admin routes
Route::get('/admin/{any?}', function () {
    return file_get_contents(public_path('admin-panel/index.html'));
})->where('any', '.*')
  ->middleware('web')
  ->name('admin.spa');
```

**Estimated effort:** 5-7 days

---

## 25. Complete File Inventory

### Total New Files to Create

| Category | Count |
|----------|-------|
| React Pages | ~75 |
| React Components (common) | ~20 |
| React Form Components | ~5 |
| React Layout Components | ~4 |
| API Service Files | ~12 |
| Zustand Stores | ~3 |
| Custom Hooks | ~4 |
| Type Definition Files | ~5 |
| Utility Files | ~4 |
| Laravel Admin API Controllers | ~30 |
| Laravel Admin API Route File | 1 |
| Config/Build Files | ~6 |
| **TOTAL** | **~169 files** |

### Total Blade Files Being Replaced
**100+ Blade view files** will be replaced by the React SPA.

---

## 26. API Endpoint Master List

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | `/api/admin/login` | Admin login |
| 2 | POST | `/api/admin/logout` | Admin logout |
| 3 | GET | `/api/admin/me` | Current admin + permissions |
| 4 | GET | `/api/admin/dashboard/stats` | Dashboard statistics |
| 5 | GET | `/api/admin/dashboard/earnings-chart` | Monthly earnings data |
| 6 | GET | `/api/admin/dashboard/happy-stories-chart` | Happy stories pie data |
| 7-20 | CRUD | `/api/admin/members` | Member management (14 endpoints) |
| 21-22 | CRUD | `/api/admin/religions` | Religions CRUD + bulk delete |
| 23-24 | CRUD | `/api/admin/sects` | Sects CRUD + bulk delete |
| 25-26 | CRUD | `/api/admin/castes` | Castes CRUD + bulk delete |
| 27-28 | CRUD | `/api/admin/sub-castes` | Sub-castes CRUD + bulk delete |
| 29 | CRUD | `/api/admin/member-languages` | Member languages CRUD |
| 30-31 | CRUD | `/api/admin/countries` | Countries CRUD + toggle status |
| 32 | CRUD | `/api/admin/states` | States CRUD |
| 33 | CRUD | `/api/admin/cities` | Cities CRUD |
| 34-43 | CRUD | `/api/admin/family-status` through `specialities` | Attribute CRUDs |
| 44-46 | CRUD | `/api/admin/packages` | Packages CRUD + toggle |
| 47-49 | CRUD | `/api/admin/package-payments` | Payments + accept manual + invoice |
| 50-53 | GET/POST | `/api/admin/wallet/*` | Wallet endpoints |
| 54-55 | CRUD | `/api/admin/happy-stories` | Happy stories + toggle approval |
| 56-59 | CRUD | `/api/admin/blogs` | Blogs CRUD + toggle |
| 60 | CRUD | `/api/admin/blog-categories` | Blog categories |
| 61-65 | GET/POST | `/api/admin/bulk-notifications/*` | Marketing |
| 66-69 | GET/POST | `/api/admin/profile-reminders/*` | Profile reminders |
| 70-71 | CRUD | `/api/admin/contact-us` | Contact queries |
| 72-82 | Various | `/api/admin/referral/*` | Referral system (11 endpoints) |
| 83-86 | CRUD | `/api/admin/support-tickets/*` | Support tickets |
| 87 | CRUD | `/api/admin/manual-payment-methods` | Payment methods |
| 88-92 | CRUD | `/api/admin/uploaded-files` | File management |
| 93-98 | GET/POST | `/api/admin/website/*` | Website settings |
| 99 | CRUD | `/api/admin/custom-pages` | Custom pages |
| 100-112 | GET/POST | `/api/admin/settings/*` | All settings (13 endpoints) |
| 113-116 | CRUD | `/api/admin/languages` | Languages + translations |
| 117-118 | CRUD | `/api/admin/currencies` | Currencies + toggle |
| 119-120 | GET/POST | `/api/admin/email-templates` | Email templates |
| 121 | CRUD | `/api/admin/staffs` | Staff CRUD |
| 122-123 | CRUD | `/api/admin/roles` | Roles + permissions update |
| 124 | GET | `/api/admin/notifications` | Admin notifications |
| 125-127 | Various | `/api/admin/addons/*` | Addon management |
| 128 | POST | `/api/admin/cache/clear` | Clear cache |

**Total: ~128 API endpoints**

---

## 27. Permission/Authorization Matrix

The admin panel uses **60+ Spatie permissions**. The `GET /api/admin/me` endpoint must return the full permissions array for the authenticated admin/staff user.

### Permission Groups

| Group | Permissions |
|-------|------------|
| Dashboard | `admin_dashboard` |
| Members | `show_members`, `create_member`, `edit_member`, `delete_member`, `approved_member_show`, `pending_member_show`, `deactvated_member_show`, `blocked_member_show`, `deleted_member_show`, `view_reported_profile`, `show_unapproved_profile_picrures`, `approve_member`, `bulk_member_add`, `manage_profile_sections`, `manage_member_verification_form` |
| Profile Attributes | `show_religions`, `show_sects`, `show_castes`, `show_sub_castes`, `show_member_languages`, `show_countries`, `show_states`, `show_cities`, `show_on_behalves`, `show_family_values`, `show_family_status`, `show_marital_status`, `show_annual_salary_ranges`, `show_job_titles`, `show_specialities`, `show_profile_option_values`, `show_additional_profile_attributes` |
| Packages | `show_packages` |
| Payments | `show_package_payments` |
| Wallet | `wallet_transaction_history`, `offline_wallet_recharge_requests` |
| Happy Stories | `show_happy_stories` |
| Blog | `show_blogs`, `show_blog_categories` |
| Marketing | `newsletter` |
| Contact Us | `show_contact_us_queries` |
| Referral | `view_referral_dashboard`, `manage_referral_settings`, `manage_referral_rules`, `view_referral_audit_logs`, `reverse_referral_reward` |
| Support | `show_active_tickets`, `show_my_tickets`, `show_solved_tickets`, `show_support_categories`, `default_ticket_assigned_agent` |
| OTP | `manage_sms_templates`, `manage_otp_credentials`, `send_sms` |
| Files | `show_uploaded_files` |
| Website | `header`, `footer`, `show_all_pages`, `appearances` |
| Settings | `general_settings`, `show_languages`, `show_currencies`, `payment_methods`, `smtp_settings`, `email_templates`, `third_party_settings`, `social_media_login_settings`, `firebase_push_notification` |
| Staff | `show_staffs`, `show_staff_roles` |
| Addons | `addon_manager` |

### React Permission Hook
```typescript
// usePermission.ts
export function usePermission() {
  const permissions = useAuthStore(s => s.permissions);
  const can = (permission: string) => permissions.includes(permission);
  const canAny = (perms: string[]) => perms.some(p => permissions.includes(p));
  return { can, canAny };
}
```

### React Permission Gate Component
```tsx
// PermissionGate.tsx
export function PermissionGate({ permission, children }: Props) {
  const { can } = usePermission();
  if (!can(permission)) return null;
  return <>{children}</>;
}
```

---

## 28. Risk Register & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AIZ uploader dependency (jQuery-based file picker used everywhere) | High | Build React FileUploader component that calls same backend upload API |
| Chart.js integration differences | Medium | Use `react-chartjs-2` wrapper, replicate exact chart configs |
| Blade views with inline PHP logic (e.g., dashboard queries) | High | Move all business logic to API controllers, return pure JSON |
| `translate()` helper used in 100+ views | Medium | Export all translation keys to JSON, use `react-i18next` |
| `uploaded_asset()` / `static_asset()` helpers | Medium | API endpoints return full URLs; create `resolveAssetUrl()` utility |
| `get_setting()` used extensively | Medium | Create `/api/admin/settings/all` endpoint or pass settings with initial auth |
| Spatie `@can()` used on every sidebar item | High | Return permissions array from `/api/admin/me`, build `PermissionGate` component |
| Complex member edit form (15 tabbed sections) | High | Build incrementally, one tab at a time |
| Rich text editor for blog/pages | Medium | Use TipTap (modern, extensible) |
| Excel bulk upload | Low | Use `react-dropzone`, POST to existing `bulk_upload` endpoint |
| Parallel development with existing Blade panel | Medium | Keep Blade panel at `/admin-legacy/` during migration; feature flag |

---

## Timeline Summary

| Phase | Description | Estimated Days |
|-------|-------------|---------------|
| 0 | Foundation & Infrastructure | 1-2 |
| 1 | Admin API Layer (30 controllers, 128 endpoints) | 8-12 |
| 2 | React Shell (Layout, Auth, Routing, Sidebar) | 3-4 |
| 3 | Dashboard Module | 2 |
| 4 | Member Management (largest module) | 12-15 |
| 5 | Premium Packages & Payments | 4-5 |
| 6 | Wallet | 2 |
| 7 | Happy Stories | 1-2 |
| 8 | Blog System | 3-4 |
| 9 | Marketing | 2-3 |
| 10 | Contact Us | 1 |
| 11 | Referral System | 3-4 |
| 12 | Support Tickets | 2-3 |
| 13 | Offline Payment | 1-2 |
| 14 | Uploaded Files | 2-3 |
| 15 | Website Setup | 3-4 |
| 16 | Settings | 5-7 |
| 17 | Staff & Roles | 3-4 |
| 18 | Addon Manager | 1-2 |
| 19 | OTP System | 2 |
| 20 | Testing, QA & Deployment | 5-7 |
| **TOTAL** | | **65-90 days** |

---

## Implementation Order (Recommended)

1. **Phase 0 + 1** — Build the foundation and all API endpoints first
2. **Phase 2** — Get the React shell working (login, layout, sidebar)
3. **Phase 3** — Dashboard (quick win, demonstrates architecture)
4. **Phase 4** — Members (largest, most complex — tackle early)
5. **Phases 5-19** — Remaining modules in any order (each is independent)
6. **Phase 20** — Testing & deployment last

---

## Notes for Implementer

1. **DO NOT delete Blade files** until the React replacement is fully tested. Keep them as reference.
2. **Reuse existing controller logic** — the admin API controllers should call the same service methods/models. Don't rewrite business logic.
3. **Match the existing UX** — the React admin panel should have the same information architecture (sidebar structure, page layouts, table columns) as the Blade version.
4. **The user frontend at `New User Panel Frontend/` is your architecture reference** — follow its patterns for axios setup, Zustand stores, component structure, and Tailwind styling.
5. **Test with a staff user (limited permissions)** to verify permission gating works correctly.
6. **RTL support** — the Blade panel supports RTL languages. Ensure Tailwind's RTL utilities are configured.
