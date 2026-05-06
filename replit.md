# NEXA PRO

An autonomous social media content strategy app powered by Gemini 2.5 Flash with Copilot Auto-Pilot, multi-language support, persistent Vault, and a cyberpunk aesthetic.

## Run & Operate

- **Dev server:** `npx expo start --web --port 5000`
- **Build (web):** `npx expo export --platform web` → outputs to `dist/`
- **Required env vars:** `EXPO_PUBLIC_GEMINI_API_KEY` — add to Replit Secrets

## Stack

- Expo SDK 54 (React Native 0.81, React 19)
- React Native Web for browser rendering
- Gemini 2.5 Flash (`@google/generative-ai`)
- AsyncStorage (`@react-native-async-storage/async-storage`)
- TypeScript 5.9

## Where things live

- `App.tsx` — root with 5-tab navigation and theme state
- `screens/` — HomeScreen, IntelScreen, ForgeScreen, VaultScreen, AboutScreen
- `constants/themes.ts` — 5 color themes (cyber, ocean, inferno, phantom, arctic)
- `constants/gemini.ts` — Gemini client, standard + autopilot system prompts, PLATFORMS list
- `constants/vault.ts` — shared VaultItem type + VAULT_STORAGE_KEY constant
- `assets/` — app icons and splash images

## Architecture decisions

- Single-file screens with inline styles (no StyleSheet abstraction)
- Theme passed as prop from root App state rather than context
- Gemini API key read from `process.env.EXPO_PUBLIC_GEMINI_API_KEY` (Replit Secret)
- Vault persisted via AsyncStorage; shared key constant in `constants/vault.ts`
- Autopilot mode instructs Gemini to return pure JSON; client-side JSON.parse with fallback

## Product

- **HOME:** Live neural pulse visualization, theme switcher, system clock
- **INTEL:** Full-memory AI chat with Gemini for social strategy Q&A
- **FORGE:** Multi-platform content generator with:
  - Copilot Auto-Pilot toggle (autonomous 3-day calendar + viral score + platform cards)
  - Multi-Language Matrix: English, Hindi, Spanish, Hinglish
  - Styled Platform Cards (per-platform color, hook, post, hashtags, CTA)
  - Viral Probability Score with progress bar
  - Save to Vault button
- **VAULT:** Persistent content storage (AsyncStorage), search, share, delete
- **ABOUT:** Creator Dossier — system architecture, language matrix, neural stack, GitHub Vault

## Gotchas

- AsyncStorage v3.0.2 is newer than Expo 54 expects (2.2.0) — works fine in practice
- `react-native-safe-area-context` and `react-native-screens` are also ahead of expected versions
- EAS CLI builds are NOT supported on Replit — use Expo Launch (Publish button) for iOS
- Autopilot strips markdown fences from Gemini JSON response before parsing
