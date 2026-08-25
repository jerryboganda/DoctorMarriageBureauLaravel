# Doctor Marriage Bureau — Complete API Endpoint Matrix & Migration Contract

> **HISTORICAL.** Live API is the Go service (`Modernized-Platform/services/api`). Laravel routes listed here are **legacy** reference only.

**Legacy source (historical):** Laravel 11 API (`Web App/routes/api.php` & `routes/admin_api.php`)  
**Live backend:** Go modular monolith (`services/api/`)  
**Base URL:** `/api/v1/`  
**Standard Response Envelope:**  
- Success: `{"success": true, "data": { ... }, "message": "..."}`  
- Error: `{"success": false, "error": {"code": "ERROR_CODE", "message": "...", "details": { ... }}}`  

---

## 1. Authentication, Account Security & 2FA Domain (`internal/auth/`)

| Legacy Route | Target Go Route | Method | Go Handler | Auth Guard | Rate Limit | Request Schema / Params | Response Envelope | Tables Mutated |
|---|---|---|---|---|---|---|---|---|
| `/api/signup` | `/api/v1/auth/signup` | `POST` | `auth.HandleSignup` | Public | 10/min | `first_name, last_name, email, password, gender, on_behalf, referral_code` | `201 Created` + Bearer Token | `users, members, referral_audit_logs` |
| `/api/signin` | `/api/v1/auth/signin` | `POST` | `auth.HandleSignin` | Public | 10/min | `email_or_phone, password` | `200 OK` (token OR 2FA challenge) | `users (last_login)` |
| `/api/auth/2fa/challenge` | `/api/v1/auth/2fa/challenge` | `POST` | `auth.Handle2FAChallenge` | Public | 6/min | `temp_token, code, is_recovery_code` | `200 OK` + Bearer Token | `user_two_factor_settings` |
| `/api/forgot/password` | `/api/v1/auth/forgot-password` | `POST` | `auth.HandleForgotPassword`| Public | 6/min | `email_or_phone` | `200 OK` + `code_sent: true` | `password_resets, verification_codes` |
| `/api/reset/password` | `/api/v1/auth/reset-password` | `POST` | `auth.HandleResetPassword` | Public | 6/min | `token, email, password, password_confirmation` | `200 OK` + Password Updated | `users (password rehash)` |
| `/api/send-email-verification` | `/api/v1/auth/verify-email/send` | `POST` | `auth.HandleSendEmailOTP` | `auth:sanctum` | 6/min | None (uses token user) | `200 OK` + OTP Dispatched | `verification_codes` |
| `/api/verify-email-code` | `/api/v1/auth/verify-email/confirm` | `POST` | `auth.HandleVerifyEmailOTP`| `auth:sanctum` | 6/min | `code` (6-digit) | `200 OK` + `email_verified_at` | `users, verification_codes` |
| `/api/user-by-token` | `/api/v1/auth/me` | `GET` | `auth.HandleGetMe` | `auth:sanctum` | 1000/min | None | `200 OK` + User & Profile Summary | `users, members` (read) |
| `/api/logout` | `/api/v1/auth/logout` | `POST` | `auth.HandleLogout` | `auth:sanctum` | 1000/min | None | `200 OK` + Token Revoked | `personal_access_tokens` |
| `/api/member/account/2fa/setup` | `/api/v1/auth/2fa/setup` | `POST` | `auth.Handle2FASetup` | `auth:sanctum` | 6/min | None | `200 OK` + Secret QR SVG + Recovery Codes | `user_two_factor_settings` |
| `/api/member/account/2fa/verify` | `/api/v1/auth/2fa/enable` | `POST` | `auth.Handle2FAEnable` | `auth:sanctum` | 6/min | `code` | `200 OK` + 2FA Activated | `user_two_factor_settings, users` |
| `/api/member/account/step-up/initiate`| `/api/v1/auth/step-up/initiate` | `POST` | `auth.HandleStepUpInitiate` | `auth:sanctum` | 6/min | `action_type` | `200 OK` + StepUp Session ID | `step_up_auth_tokens` |

---

## 2. Profile Center & Biodata Management (`internal/profiles/`)

| Legacy Route | Target Go Route | Method | Go Handler | Auth Guard | Rate Limit | Request Schema / Params | Response Envelope | Tables Mutated |
|---|---|---|---|---|---|---|---|---|
| `/api/member/profile/full` | `/api/v1/profiles/full` | `GET` | `profiles.HandleGetFullProfile` | `auth:sanctum` | 1000/min | None | `200 OK` + Aggregated Profile JSON | 9 1-to-1 Profile Tables (read) |
| `/api/member/profile/section/{section}` | `/api/v1/profiles/section/{section}` | `POST` | `profiles.HandleUpdateSection` | `auth:sanctum` | 120/min | Dynamic by section | `200 OK` + Section Payload | `members, physical_attributes, etc.` |
| `/api/member/profile/quality-score` | `/api/v1/profiles/quality-score` | `GET` | `profiles.HandleQualityScore` | `auth:sanctum` | 1000/min | None | `200 OK` + Score & Category Breakdown | None (computed in memory) |
| `/api/member/profile/visibility` | `/api/v1/profiles/visibility` | `GET` | `profiles.HandleGetVisibility` | `auth:sanctum` | 1000/min | None | `200 OK` + Granular Settings | `field_visibility_settings` (read) |
| `/api/member/profile/visibility` | `/api/v1/profiles/visibility` | `POST` | `profiles.HandleUpdateVisibility`| `auth:sanctum` | 60/min | Key-value privacy flags | `200 OK` + Updated Settings | `field_visibility_settings` |
| `/api/profile/download-biodata` | `/api/v1/profiles/download-biodata` | `GET` | `profiles.HandleDownloadBiodata`| `auth:sanctum` | 30/min | `member_id` (optional) | `200 OK` + `application/pdf` Stream | `profile_viewers` (audit log) |
| `/api/member/maritial-status` | `/api/v1/taxonomy/marital-statuses` | `GET` | `profiles.HandleListMarital` | Public | 1000/min | None | `200 OK` + Array | `marital_statuses` (cached) |
| `/api/member/countries` | `/api/v1/taxonomy/countries` | `GET` | `profiles.HandleListCountries` | Public | 1000/min | None | `200 OK` + Array | `countries` (cached) |
| `/api/member/states/{id}` | `/api/v1/taxonomy/states/{id}` | `GET` | `profiles.HandleListStates` | Public | 1000/min | `country_id` in path | `200 OK` + Array | `states` (cached) |
| `/api/member/cities/{id}` | `/api/v1/taxonomy/cities/{id}` | `GET` | `profiles.HandleListCities` | Public | 1000/min | `state_id` in path | `200 OK` + Array | `cities` (cached) |
| `/api/member/religions` | `/api/v1/taxonomy/religions` | `GET` | `profiles.HandleListReligions` | Public | 1000/min | None | `200 OK` + Array | `religions` (cached) |
| `/api/member/sects` | `/api/v1/taxonomy/sects` | `GET` | `profiles.HandleListSects` | Public | 1000/min | None | `200 OK` + Array | `sects` (cached) |
| `/api/member/casts/{id?}` | `/api/v1/taxonomy/castes/{id?}` | `GET` | `profiles.HandleListCastes` | Public | 1000/min | `religion_id` (optional) | `200 OK` + Array | `castes` (cached) |

---

## 3. Discovery, Search & Match Intelligence (`internal/discovery/`)

| Legacy Route | Target Go Route | Method | Go Handler | Auth Guard | Rate Limit | Request Schema / Params | Response Envelope | Tables Mutated |
|---|---|---|---|---|---|---|---|---|
| `/api/discovery` | `/api/v1/discovery` | `GET` | `discovery.HandleFeed` | `auth:sanctum` | 300/min | `feed, cursor, limit` | `200 OK` + Paginated Doctor Cards | `ignored_users, shortlists` (filters) |
| `/api/discovery/search` | `/api/v1/discovery/search` | `GET` | `discovery.HandleSearch` | `auth:sanctum` | 300/min | `min_age, max_age, city_id, religion_id, speciality, degree` | `200 OK` + Paginated Doctor Cards | None (read query) |
| `/api/match-intelligence/{id}`| `/api/v1/discovery/match-intelligence/{id}`| `GET` | `discovery.HandleMatchIntel` | `auth:sanctum` | 120/min | `candidate_id` in path | `200 OK` + 6-Factor Compatibility Breakdown | `profile_viewers` |
| `/api/match-tuner/tune` | `/api/v1/discovery/match-tuner` | `POST` | `discovery.HandleMatchTuner` | `auth:sanctum` | 60/min | `importance_weights` object | `200 OK` + Updated Tuner Profile | `partner_preference_priorities` |
| `/api/member/discovery/toggle-anonymous`| `/api/v1/discovery/toggle-anonymous`| `POST`| `discovery.HandleToggleIncognito`| `auth:sanctum`| 60/min | None | `200 OK` + Incognito Flag | `field_visibility_settings` |
| `/api/member/discovery/travel-mode/enable`| `/api/v1/discovery/travel-mode/enable`| `POST`| `discovery.HandleEnableTravelMode`| `auth:sanctum`| 30/min | `city_id, country_id, duration_days` | `200 OK` + Active Travel Mode | `member_travel_modes` |

---

## 4. Proposals, Shortlists & Matching (`internal/matching/`)

| Legacy Route | Target Go Route | Method | Go Handler | Auth Guard | Rate Limit | Request Schema / Params | Response Envelope | Tables Mutated |
|---|---|---|---|---|---|---|---|---|
| `/api/member/express-interest` | `/api/v1/interests/express` | `POST` | `matching.HandleExpressInterest` | `auth:sanctum` | 60/min | `user_id, message` | `200 OK` + Interest Record | `express_interests, notifications` |
| `/api/member/interest-requests` | `/api/v1/interests/requests` | `GET` | `matching.HandleListRequests` | `auth:sanctum` | 300/min | `type=received/sent` | `200 OK` + Array of Proposals | `express_interests` (read) |
| `/api/member/interest-accept` | `/api/v1/interests/{id}/accept` | `POST` | `matching.HandleAcceptInterest` | `auth:sanctum` | 60/min | `interest_id` in path | `200 OK` + `chat_thread_id` | `express_interests, chat_threads` |
| `/api/member/interest-reject` | `/api/v1/interests/{id}/reject` | `POST` | `matching.HandleRejectInterest` | `auth:sanctum` | 60/min | `reason` (optional) | `200 OK` + Status Rejected | `express_interests` |
| `/api/member/interest-withdraw`| `/api/v1/interests/{id}/withdraw`| `POST`| `matching.HandleWithdrawInterest`| `auth:sanctum`| 60/min | `interest_id` in path | `200 OK` + Status Withdrawn | `express_interests` |
| `/api/member/my-shortlists` | `/api/v1/shortlists` | `GET` | `matching.HandleListShortlists` | `auth:sanctum` | 300/min | None | `200 OK` + Bookmarked Candidates | `shortlists` (read) |
| `/api/member/add-to-shortlist` | `/api/v1/shortlists` | `POST` | `matching.HandleAddShortlist` | `auth:sanctum` | 60/min | `user_id` | `200 OK` + Bookmarked | `shortlists` |
| `/api/member/remove-from-shortlist`| `/api/v1/shortlists/{user_id}`| `DELETE`| `matching.HandleRemoveShortlist`| `auth:sanctum`| 60/min | `user_id` in path | `200 OK` + Bookmark Removed | `shortlists` |

---

## 5. Real-time Messaging, WebSockets & Presence (`internal/chat/`)

| Legacy Route | Target Go Route | Method | Go Handler | Auth Guard | Rate Limit | Request Schema / Params | Response Envelope | Tables Mutated |
|---|---|---|---|---|---|---|---|---|
| `/api/member/chat-list` | `/api/v1/chat/threads` | `GET` | `chat.HandleListThreads` | `auth:sanctum` | 300/min | None | `200 OK` + Active Threads & Unread Counts | `chat_threads, chats` (read) |
| `/api/member/chat-view/{id}` | `/api/v1/chat/threads/{id}/messages`| `GET` | `chat.HandleGetMessages` | `auth:sanctum` | 300/min | `cursor, limit` | `200 OK` + Paginated Chat Messages | `chats` (read + mark read) |
| `/api/member/chat-reply` | `/api/v1/chat/threads/{id}/messages`| `POST`| `chat.HandleSendMessage` | `auth:sanctum` | 120/min | `message, attachment_key, is_biodata_share` | `201 Created` + Chat Message Record | `chats, chat_threads` |
| `/api/member/chat/share-biodata`| `/api/v1/chat/threads/{id}/share-biodata`| `POST`| `chat.HandleShareBiodata` | `auth:sanctum`| 30/min | `thread_id` | `200 OK` + System Chat Message | `chats, profile_viewers` |
| `/api/member/heartbeat` | `/api/v1/chat/presence/heartbeat` | `POST` | `chat.HandleHeartbeat` | `auth:sanctum` | 30/min | None | `200 OK` + Online Status Ping | Redis `presence:user:{id}` |
| N/A (Soketi Protocol) | `/api/v1/chat/ws` | `GET` (WS) | `chat.HandleWebSocket` | Token Query | WS Connection | Handshake Bearer Token | Bidirectional JSON Frames | Redis Pub/Sub channels |

---

## 6. Courtship Progression Engine (`internal/progression/`)

| Legacy Route | Target Go Route | Method | Go Handler | Auth Guard | Rate Limit | Request Schema / Params | Response Envelope | Tables Mutated |
|---|---|---|---|---|---|---|---|---|
| `/api/member/progression/stages`| `/api/v1/progression/stages` | `GET` | `progression.HandleGetStages` | `auth:sanctum` | 1000/min | None | `200 OK` + 5 Progression Stages | `progression_stages` (cached) |
| `/api/member/progression/active`| `/api/v1/progression/active` | `GET` | `progression.HandleGetActive` | `auth:sanctum` | 300/min | None | `200 OK` + Active Courtships | `member_progressions` |
| `/api/member/progression/start` | `/api/v1/progression/start` | `POST` | `progression.HandleStart` | `auth:sanctum` | 30/min | `partner_id` | `201 Created` + Progression Record | `member_progressions` |
| `/api/member/progression/{id}/update-stage`| `/api/v1/progression/{id}/stage`| `PATCH`| `progression.HandleUpdateStage`| `auth:sanctum`| 60/min | `stage_id, notes` | `200 OK` + Stage Transition | `member_progressions, progression_events` |
| `/api/member/progression/{id}/items`| `/api/v1/progression/{id}/items`| `POST`| `progression.HandleCreateItem`| `auth:sanctum`| 120/min | `item_type, title, amount, status`| `201 Created` + Item | `progression_checklist_items` |

---

## 7. Media Management & Privacy Access (`internal/media/`)

| Legacy Route | Target Go Route | Method | Go Handler | Auth Guard | Rate Limit | Request Schema / Params | Response Envelope | Tables Mutated |
|---|---|---|---|---|---|---|---|---|
| `/api/upload-profile-picture` | `/api/v1/media/upload-url` | `POST` | `media.HandleGetPresignedURL` | `auth:sanctum` | 60/min | `file_name, content_type, category` | `200 OK` + Presigned S3/R2 Upload URL | None (ephemeral) |
| N/A | `/api/v1/media/confirm` | `POST` | `media.HandleConfirmUpload` | `auth:sanctum` | 60/min | `media_id, key` | `200 OK` + Registered Media + Variants | `uploads, gallery_images` |
| `/api/member/gallery-image-view-request`| `/api/v1/media/access-requests`| `POST`| `media.HandleRequestAccess` | `auth:sanctum` | 30/min | `target_user_id, media_type` | `200 OK` + Access Request Sent | `view_gallery_images, notifications` |
| `/api/member/gallery-image-view-request/accept`| `/api/v1/media/access-requests/{id}/accept`| `POST`| `media.HandleAcceptAccess`| `auth:sanctum`| 30/min | `request_id` in path | `200 OK` + Access Granted | `view_gallery_images` |

---

## 8. Subscriptions, Payments & Checkout (`internal/payments/`)

| Legacy Route | Target Go Route | Method | Go Handler | Auth Guard | Rate Limit | Request Schema / Params | Response Envelope | Tables Mutated |
|---|---|---|---|---|---|---|---|---|
| `/api/packages` | `/api/v1/packages` | `GET` | `payments.HandleListPackages` | Public | 1000/min | None | `200 OK` + Package List & Pricing | `packages` (cached) |
| `/api/stripe/create-checkout-session`| `/api/v1/payments/checkout/stripe`| `POST`| `payments.HandleStripeCheckout`| `auth:sanctum`| 30/min | `package_id, coupon_code` | `200 OK` + Stripe Checkout URL | `package_payments (pending)` |
| `/api/stripe/payment/callback`| `/api/v1/payments/webhooks/stripe`| `POST`| `payments.HandleStripeWebhook` | Public (Signed)| None | Stripe Signed Webhook Event Payload | `200 OK` + Entitlements Provisioned | `package_payments, members, wallets` |
| `/api/member/package-purchase`| `/api/v1/payments/manual/submit` | `POST` | `payments.HandleManualPayment` | `auth:sanctum` | 20/min | `package_id, method, transaction_id, proof_key` | `200 OK` + Payment Under Review | `package_payments (due)` |
| `/api/member/coupons/validate` | `/api/v1/coupons/validate` | `POST` | `payments.HandleValidateCoupon`| `auth:sanctum` | 60/min | `code, package_id` | `200 OK` + Discount Calculation | `coupons` (read) |
| `/api/member/wallet` | `/api/v1/wallet` | `GET` | `payments.HandleGetWallet` | `auth:sanctum` | 300/min | None | `200 OK` + Balance & Ledger History | `wallets, transactions` (read) |
