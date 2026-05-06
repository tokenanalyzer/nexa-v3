# NEXA AI

A social media content strategy app powered by Gemini AI with a cyberpunk aesthetic and multi-theme support.

## Run & Operate

- **Dev server:** `npx expo start --web --port 5000`
- **Build (web):** `npx expo export --platform web` → outputs to `dist/`
- **Required env vars:** None (Gemini API key hardcoded in `constants/gemini.ts`)

## Stack

- Expo SDK 54 (React Native 0.81, React 19)
- React Native Web for browser rendering
- Gemini 2.5 Flash (`@google/generative-ai`)
- TypeScript 5.9

## Where things live

- `App.tsx` — root component with tab navigation and theme state
- `screens/` — HomeScreen, IntelScreen (AI chat), ForgeScreen (content generator), VaultScreen (saved content)
- `constants/themes.ts` — 5 color themes (cyber, ocean, inferno, phantom, arctic)
- `constants/gemini.ts` — Gemini client, system prompt, platform list
- `assets/` — app icons and splash images

## Architecture decisions

- Single-file screens with inline styles (no StyleSheet abstraction layer)
- Theme passed as prop from root App state rather than context
- Gemini API key embedded directly in source (not an env var)
- Vault uses in-memory state only (no AsyncStorage persistence)

## Product

- **HOME:** Live neural pulse visualization, theme switcher, system clock
- **INTEL:** Full-memory AI chat with Gemini for social strategy Q&A
- **FORGE:** Multi-platform content generator (Instagram, YouTube, Twitter/X, LinkedIn, TikTok, WhatsApp)
- **VAULT:** Save and search previously generated content

## Gotchas

- `react-native-safe-area-context` and `react-native-screens` are newer than Expo 54 expects — app still works
- Vault screen has a stale `require('@react-native-async-storage/async-storage')` in a try/catch that never runs
- Web insets (67px top, 34px bottom) are not implemented — content may clip on web
