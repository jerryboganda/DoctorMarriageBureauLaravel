# DMB Mobile App

React Native/Expo mobile client for Doctor Marriage Bureau.

## Boundary

- Source: `DMB Mobile App/`
- Bundle identifier: `com.doctorsmarriagebureau.app`
- API: the Laravel API at the `/api` path of the production panel host
- Native release: EAS/Expo, independent of the Production VPS (`185.252.233.186`).
- The mobile app is deployed independently via EAS.

The checked-in package uses Expo SDK. Older
documents referring to Expo 54 or a “production-ready” release are historical.

## Prerequisites

- Node.js 18–20 (Node 24 is known to break Metro on Windows)
- npm
- Expo tooling or Expo Go for device development
- EAS CLI for cloud builds

## Setup and development

```powershell
cd "D:\Projects\Doctor Marriage Bureau\DMB Mobile App"
npm ci
npm start
```

Configure the ignored local API environment with a local or approved
production API URL. Do not commit API tokens, OAuth credentials, or
environment files.

## Quality and builds

```powershell
npm run lint
npm run format:check
npm run typecheck
npm run build:web
npm run ci

# EAS Android preview
npx eas build --platform android --profile preview --no-wait
```

The app uses Expo Router screens under `app/`, reusable UI under
`components/`, Zustand stores under `stores/`, and Axios/API utilities under
`utils/`. Main feature surfaces include authentication, onboarding, discovery,
profiles, proposals/interests, chat, notifications, Family Portal, community,
progression, wallet, support, referrals, payments, and account security.

## API compatibility

The app shares the Laravel contract documented in
[`../AUTH_PRODUCTION_READY.md`](../AUTH_PRODUCTION_READY.md). Check
`routes/api.php` before changing endpoint names or response mappings. Keep web
and mobile changes synchronized when an API resource changes.
