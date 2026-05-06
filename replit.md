# NEXA PRO

An autonomous social media content strategy app powered by Gemini 2.5 Flash with Copilot Auto-Pilot, real-time streaming chat, multi-language + tone support, persistent Vault, and a cyberpunk aesthetic.

## Run & Operate

- **Dev server:** `npx expo start --web --port 5000`
- **Build (web):** `npx expo export --platform web` → outputs to `dist/`
- **Required env vars:** `EXPO_PUBLIC_GEMINI_API_KEY` — set in Replit Secrets

## Stack

- Expo SDK 54 (React Native 0.81, React 19)
- React Native Web for browser rendering
- Gemini 2.5 Flash (`@google/generative-ai`) — chat + streaming + autopilot
- AsyncStorage (`@react-native-async-storage/async-storage`)
- TypeScript 5.9

## Where things live

- `App.tsx` — root with 5-tab navigation and theme state
- `screens/` — HomeScreen, IntelScreen, ForgeScreen, VaultScreen, AboutScreen
- `constants/themes.ts` — 5 color themes (cyber, ocean, inferno, phantom, arctic)
- `constants/gemini.ts` — sendMessage, streamMessage, sendAutopilotMessage, PLATFORMS
- `constants/vault.ts` — shared VaultItem type + VAULT_STORAGE_KEY constant
- `assets/` — app icons and splash images

## Architecture decisions

- Gemini API key read from `process.env.EXPO_PUBLIC_GEMINI_API_KEY` (Replit Secret)
- INTEL uses `sendMessageStream` (async iterable) for word-by-word rendering with live cursor
- Autopilot instructs Gemini to return pure JSON; strips markdown fences before JSON.parse
- Tone is injected into both manual and autopilot prompts as a style directive
- Vault persisted via AsyncStorage; shared key constant in `constants/vault.ts`
- Theme passed as prop from root App state (no context)

## Product

- **HOME:** Live neural pulse visualization, theme switcher, system clock
- **INTEL:** Full-memory AI chat — real-time streaming word-by-word with blinking cursor indicator
- **FORGE:** Multi-platform content generator with:
  - Copilot Auto-Pilot toggle (3-day calendar + viral score + per-platform cards)
  - Content Tone Matrix: Professional (CORP.EXE), Gen-Z (VIBE.SYS), Sarcastic (SARCASM.DLL), Inspirational (INSPIRE.BAT)
  - Multi-Language Matrix: English, Hindi, Spanish, Hinglish
  - Save to Vault button
- **VAULT:** Persistent content storage (AsyncStorage), search, share, delete
- **ABOUT:** Creator Dossier — system architecture, language matrix, neural stack, GitHub Vault

## Gotchas

- AsyncStorage v3.0.2 is ahead of Expo 54 expected (2.2.0) — works fine in practice
- EAS CLI builds (`eas build`) are NOT supported on Replit — use Expo Launch (Publish button) for iOS App Store submission
- Autopilot strips markdown fences from Gemini JSON response before parsing
- Streaming uses `sendMessageStream` async iterator — no polling, no timeout risk
