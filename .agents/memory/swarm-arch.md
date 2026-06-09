---
name: Agent Swarm Architecture
description: How the 3-agent swarm works in swarmForge() in constants/gemini.ts
---

**Rule:** All 3 agents run in parallel via Promise.allSettled. Gemini is the only required agent — if Groq or SambaNova keys are missing, their sections are omitted gracefully.

**Agents and roles:**
- Gemini (Architect): full post body, CTA, image prompt, viral score — uses getGenerativeModel()
- Groq (Scout): hooks A+B, 10 hashtags, best posting time — uses groqChat() REST helper
- SambaNova (Strategist): SEO angle, engagement psychology, alternative content angle — uses sambaChat() REST helper

**How to apply:** When adding new swarm features, each agent should return a JSON array with one object per platform. The orchestrator merges results by platform name matching.

**Why:** Parallel execution means the whole swarm completes in ~max(agent_time) not sum. Groq is fastest (~1s), Gemini ~3-5s, SambaNova ~3-6s.
