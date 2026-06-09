---
name: ForgeScreen Mode State
description: How the 3 generation modes work in ForgeScreen
---

**Rule:** `mode` state is `'manual' | 'autopilot' | 'swarm'` — NOT a boolean `autopilot` flag (old pattern was boolean, now tristate).

**Mode behaviors:**
- manual: calls sendMessage() for free-form text response
- autopilot: calls sendAutopilotMessage() → JSON → AutopilotResult (viral score + 3-day calendar)
- swarm: calls swarmForge() → all 3 agents in parallel → SwarmPlatformCard[] per platform

**Live swarm UI:** `swarmStatus` is Record<AgentId, 'idle'|'working'|'done'|'error'> — updated via onStatus callback during generation. Shows live progress bars per agent.

**Why:** Users need to know which agents are working. The onStatus callback lets the UI update in real-time as each agent completes independently.
