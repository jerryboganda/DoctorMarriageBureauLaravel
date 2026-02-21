# DMB Mobile App

**Doctors Marriage Bureau - Ultra-Premium React Native Mobile Application**

A sophisticated, production-grade mobile application built with Expo SDK 54, leveraging the 2026 Performance Stack for optimal native performance.

## Tech Stack

- **Framework**: Expo SDK 54 with Expo Router
- **UI**: NativeWind v4 (Tailwind CSS for React Native)
- **Animations**: Moti + React Native Reanimated
- **Lists**: @shopify/flash-list for 60fps scrolling
- **State**: Zustand with expo-secure-store
- **API**: Axios with token interceptor

## Prerequisites

- **Node.js 18-20** (Required - Node 24 has ESM compatibility issues)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your device (iOS/Android)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure API endpoint:**
   Edit `.env.local` and set your backend URL:
   ```
   API_BASE_URL=http://your-backend-url/api
   ```

3. **Start the development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on device:**
   - Scan the QR code with Expo Go (Android)
   - Scan with Camera app (iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## Project Structure

```
app/                    # Expo Router screens
├── (tabs)/            # Tab navigation screens
│   ├── index.tsx      # Proposals tab
│   ├── discovery.tsx  # Profile discovery
│   ├── messages.tsx   # Chat/messaging
│   ├── profile.tsx    # Profile editor
│   └── settings.tsx   # App settings
├── login.tsx          # Login screen
├── register/          # Registration flow
└── forgot-password.tsx

components/            # Reusable UI components
├── Button.tsx        # Animated button
├── Input.tsx         # Floating label input
├── Background.tsx    # Gradient background
└── Icons.tsx         # Lucide icon wrappers

stores/               # Zustand state stores
└── authStore.ts      # Authentication state

utils/                # Utilities
├── api.ts           # Axios instance
└── cn.ts            # Class name merger

types/                # TypeScript definitions
└── index.ts         # Shared interfaces
```

## Features

- 🔐 **Secure Authentication** - JWT with expo-secure-store
- 📱 **Native Performance** - 60fps animations with Reanimated
- 💫 **Beautiful UI** - Premium design with NativeWind
- 🔍 **Profile Discovery** - Search and filter matches
- 💬 **Real-time Chat** - Messaging with chat threads
- 👤 **Profile Management** - Photo upload, details editing
- 🔔 **Push Notifications** - Firebase Cloud Messaging ready

## Backend Integration

This app connects to the Laravel backend via REST API endpoints:
- `/login`, `/register`, `/logout`
- `/member/interest-requests`
- `/discovery`, `/discovery/search`
- `/member/chat-list`, `/member/chat-view/{id}`, `/member/chat-reply`
- `/full-profile`, `/full-profile/update`
- `/upload-profile-picture`

## Troubleshooting

### Metro bundler issues on Windows with Node 24
This project requires Node.js 18-20. If you're using Node 24, you'll encounter ESM URL scheme errors. Use nvm to switch:
```bash
nvm install 20
nvm use 20
```

### NativeWind className not working
Ensure the following files exist:
- `metro.config.js` with `withNativeWind`
- `global.css` with Tailwind directives
- `nativewind-env.d.ts` for TypeScript support
