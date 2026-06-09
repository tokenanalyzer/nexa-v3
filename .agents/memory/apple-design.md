---
name: Apple Design System (Light Theme)
description: How the Apple-like design is implemented across all screens
---

**Rule:** All screens check `T.isDark` from the theme. Light theme gets Apple aesthetic, dark themes keep neon glow aesthetic.

**Light theme tokens:** bg=#F5F5F7, surface=#FFFFFF (cardBg), card=#E5E5EA (cardBorder), accent=#5E5CE6, text=#1D1D1F, muted=#6E6E73 (textSub).

**Shadow pattern:** All screens define a local `shadow()` helper — on light/web: `boxShadow: '0 2px 12px rgba(0,0,0,0.07)'`, on dark/web: `boxShadow: \`0 0 18px ${color}35\``.

**Typography:** Max fontWeight '700' for headers, '600' for subheadings, '400-500' for body. No fontWeight '900' on light theme.

**Why:** The glow aesthetic works for cyberpunk dark themes but looks "funky" on white backgrounds. Apple-like means restraint — let whitespace and subtle shadows do the work.
