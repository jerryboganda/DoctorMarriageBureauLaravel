# Laravel Authentication and API Notes

> **Reviewed:** 2026-07-30
> **Canonical API base:** `https://panel.doctormarriagebureau.com.pk/api`

This document describes the API contract used by the React member panel and
the Expo mobile app. It is not a production-readiness approval: Hostinger
currently lacks the production `.env`, and `/api/health` returns HTTP 500.
See [`HOSTINGER_DEPLOY_GUIDE.md`](HOSTINGER_DEPLOY_GUIDE.md).

## Authentication endpoints

All paths below are relative to the canonical API base.

| Method | Path | Purpose |
|---|---|---|
| POST | `/signup` | Create a member account |
| POST | `/signin` | Login with `email_or_phone` and password |
| POST | `/logout` | Revoke the current Sanctum token |
| POST | `/forgot/password` | Start reset; detects email or phone |
| POST | `/verify/password/reset` | Verify a reset code |
| POST | `/reset/password` | Complete password reset |
| POST | `/send-email-verification` | Send an email verification code |
| POST | `/verify-email-code` | Verify an email code |
| POST | `/send-phone-verification` | Send a phone verification code |
| POST | `/verify-phone-code` | Verify a phone code |
| POST | `/social-login` | Google/Facebook social login |
| GET | `/user-by-token` | Resolve the current user |
| POST | `/auth/2fa/challenge` | Complete a 2FA challenge |

The exact route implementation is in `routes/api.php`; check it before
changing either frontend. Phone input is normalized to the project’s
international format. Password reset codes expire according to backend
configuration.

## Member API areas

The API also exposes authenticated routes for:

- onboarding and full profile management;
- education, career, gallery, voice/video media, and privacy;
- discovery, search, match intelligence, proposals/interests, and shortlists;
- chat, notifications, communities, progression, and Family Portal;
- packages, add-ons, coupons, payment methods, wallet, and purchase history;
- support tickets, referrals, happy stories, reporting/blocking, and device
  tokens.

Useful public routes include:

```text
GET  /health
GET  /home
GET  /home/packages
GET  /packages
GET  /addons
GET  /blogs
GET  /happy-stories
GET  /public/proposals
```

## Client integration

### React member panel

Source: `New User Panel Frontend/`. Configure its ignored local environment
with the canonical API base for production or a local Laravel URL for
development. The panel uses Sanctum bearer tokens, normalizes profile/resource
fields, and includes Google/Facebook login UI.

### Mobile app

Source: `DMB Mobile App/`. It uses Axios and secure token storage. Use Node
18–20 for Metro and set the API URL in the ignored local/mobile environment.
Native EAS builds are independent of Hostinger.

## Verification and operational behavior

- SMS delivery may be unavailable when no provider is configured; do not
  publish verification codes or test credentials.
- Email verification depends on the server-side SMTP configuration.
- OTP and authentication diagnostics belong in protected server logs only.
- Rate limits are defined by API middleware and must remain enabled in
  production.
- Never use a production token, password, OTP, database dump, OAuth secret,
  payment credential, or SMTP credential in docs, commits, screenshots, or
  CI output.

## Validation checklist

Before calling authentication ready after the Hostinger blocker is resolved:

- [ ] `GET /api/health` returns HTTP 200.
- [ ] Signup and email/phone verification work with a disposable test account.
- [ ] Sign-in accepts the documented identifier format.
- [ ] Forgot/reset password works through the configured mail/SMS path.
- [ ] Logout revokes the token.
- [ ] OAuth callbacks and allowed origins are verified.
- [ ] Rate limits and production error handling are enabled.
- [ ] React and mobile clients pass their configured CI checks.
