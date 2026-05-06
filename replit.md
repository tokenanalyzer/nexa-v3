# NEXA PRO

An autonomous social media content strategy app powered by Gemini 2.5 Flash with Copilot Auto-Pilot, real-time streaming chat, multi-language + tone support, persistent Vault with AI scheduling, and a cyberpunk aesthetic.

## Run & Operate

- **Dev server:** `npx expo start --web --port 5000`
- **Build (web):** `npx expo export --platform web` → outputs to `dist/`
- **Required env vars:** `EXPO_PUBLIC_GEMINI_API_KEY` — set in Replit Secrets
- **Missing API key:** App shows a styled hacker warning screen with setup instructions + link to Google AI Studio

## Stack

- Expo SDK 54 (React Native 0.81, React 19)
- React Native Web for browser rendering
- Gemini 2.5 Flash (`@google/generative-ai`) — all AI features
- AsyncStorage (`@react-native-async-storage/async-storage`)
- TypeScript 5.9

## Where things live

- `App.tsx` — root with 5-tab nav, theme state, API key guard screen
- `screens/` — HomeScreen, IntelScreen, ForgeScreen, VaultScreen, AboutScreen
- `constants/themes.ts` — 5 color themes (cyber, ocean, inferno, phantom, arctic)
- `constants/gemini.ts` — all Gemini functions + PLATFORMS + getEngagementEstimate
- `constants/vault.ts` — VaultItem type (with scheduledDate/scheduledTime) + VAULT_STORAGE_KEY
- `assets/` — app icons and splash images

## Architecture decisions

- Gemini API key read from `process.env.EXPO_PUBLIC_GEMINI_API_KEY`; `hasApiKey()` helper exported
- App.tsx guards render — shows `APIKeyWarningScreen` if key is absent (no crash)
- INTEL uses `streamMessage` async iterable for word-by-word rendering with live cursor
- Autopilot instructs Gemini to return pure JSON; strips markdown fences before JSON.parse
- Tone injected into both manual and autopilot prompts as a style directive
- Vault persisted via AsyncStorage; shared key constant in `constants/vault.ts`
- Theme passed as prop from root App state (no context)
- Per-card A/B hooks and best-time state keyed by platform name (Record<string, ...>)

## Product

- **HOME:** Live neural pulse visualization, theme switcher, system clock
- **INTEL:** Full-memory AI chat — real-time streaming word-by-word with blinking cursor
- **FORGE:** Multi-platform content generator with:
  - Copilot Auto-Pilot (3-day calendar + viral score + per-platform cards)
  - Content Tone Matrix: Professional / Gen-Z / Sarcastic / Inspirational
  - Multi-Language Matrix: English, Hindi, Spanish, Hinglish
  - 🔥 Trend Scout: 10 niches, 5 AI trending topics per scan, tap-to-use
  - 📊 Engagement Estimator: projected views/likes/shares/comments per viral score
  - 🌡️ Hashtag Heatmap: glowing pills with heat gradient, tap to copy individual tags
  - ⚗️ A/B Hook Tester: 2 competing hooks with psychological angle labels per card
  - 📅 Best Time Predictor: AI-powered optimal posting window per platform
  - 🎨 Visual Prompt: Midjourney/DALL-E image prompt per platform card
  - 🧵 Viral Thread Builder: complete 10-tweet thread with char count bars + per-tweet copy
  - Save to Vault button
- **VAULT:** Persistent content storage, search, share, delete, AI schedule (date/time + Gemini timing)
- **ABOUT:** Creator Dossier + Adil Hussain developer card with clickable email & Twitter

## Gotchas

- AsyncStorage v3.0.2 ahead of Expo 54 expected (2.2.0) — works fine in practice
- EAS CLI (`eas build`) NOT supported on Replit — use local terminal after `eas login`
- Autopilot strips markdown fences from Gemini JSON response before parsing
- Streaming uses async iterator — no polling, no timeout risk
- Per-card state (abHooks, bestTimes) reset on every new forge() call via resetCardState()
