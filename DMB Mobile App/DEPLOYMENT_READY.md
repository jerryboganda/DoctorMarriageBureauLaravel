# DMB Mobile App — Historical Release Record

> **Reviewed:** 2026-07-30
> **Status:** Historical feature/build record; not a current production
> approval.

This file records the February 2026 mobile hardening work. The checked-in app
now uses Expo SDK 55 preview packages; validate the current dependency graph
before an EAS release.

> Hostinger currently lacks the Laravel production `.env`, so
> `https://panel.doctormarriagebureau.com.pk/api/health` returns HTTP 500.
> Resolve that backend blocker and complete current device/EAS QA before
> publishing a mobile release.

## App identity

| Property | Value |
|---|---|
| Name | Doctor Marriage Bureau |
| Bundle ID | `com.doctorsmarriagebureau.app` |
| Version in `app.json` | `1.0.0` |
| Native build boundary | Expo/EAS; independent of Hostinger |

## Historical scope

The recorded work covered:

- branded logo and app-name updates;
- floating-label/input overlap fixes;
- email/phone signup, sign-in, verification, and password reset flows;
- Sanctum token handling, 2FA and social-login integration points;
- discovery, profiles, proposals/interests, chat, notifications, wallet,
  support, Family Portal, communities, progression, referrals, payments, and
  account security screens.

These are implementation notes, not claims that the current production API,
mail/SMS providers, or release stores are healthy.

## Current build commands

Use Node.js 18–20:

```powershell
cd "D:\Projects\Doctor Marriage Bureau\DMB Mobile App"
npm ci
npm run lint
npm run format:check
npm run typecheck
npm run build:web
npm run ci

# EAS preview build
npx eas build --platform android --profile preview --no-wait
```

## Release checklist

- [ ] Hostinger `.env` is securely provisioned.
- [ ] `GET /api/health` returns HTTP 200.
- [ ] API URL and allowed origins are verified for the build.
- [ ] Signup, verification, sign-in, password reset, and logout pass with a
      disposable test account.
- [ ] Device testing covers Wi-Fi, mobile data, offline/error states, and
      Android/iOS target builds as applicable.
- [ ] No credentials, tokens, OTPs, logs, or production data are included in
      the release or documentation.

For API paths and production boundaries, use the repository
[`AUTH_PRODUCTION_READY.md`](../AUTH_PRODUCTION_READY.md) and
[`HOSTINGER_DEPLOY_GUIDE.md`](../HOSTINGER_DEPLOY_GUIDE.md).
