import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAgentKey, groqChat, groqStream, sambaChat, AgentId } from './agents';

export { GEMINI_KEY_STORAGE } from './agents';
export { testGeminiKey as testApiKey } from './agents';

export const hasApiKey = async (): Promise<boolean> => {
  const key = await getAgentKey('gemini');
  return !!key;
};

const SYSTEM = `You are NEXA AI — an expert social media content strategist. You create viral, platform-optimized content for Instagram, YouTube, Twitter/X, LinkedIn, TikTok and WhatsApp. Be specific, creative, and data-driven.`;
const AUTOPILOT_SYSTEM = `You are NEXA AUTOPILOT — an elite autonomous viral marketing AI. Respond ONLY with valid JSON. No markdown fences. No explanation. No text outside the JSON object.`;
const JSON_ONLY = 'Respond ONLY with valid JSON. No markdown. No explanation. No text outside the JSON.';

const getGemini = async () => {
  const key = await getAgentKey('gemini');
  return new GoogleGenerativeAI(key);
};

const cleanJSON = (raw: string) => raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

// ── INTEL Chat — Groq streaming → Gemini fallback ─────────────
export const sendMessage = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  const groqKey = await getAgentKey('groq');
  if (groqKey) {
    const messages = [
      { role: 'system', content: SYSTEM },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.parts[0].text })),
      { role: 'user', content: prompt },
    ];
    return groqChat(groqKey, messages);
  }
  const genAI = await getGemini();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM });
  const chat = model.startChat({ history });
  return (await chat.sendMessage(prompt)).response.text();
};

export const streamMessage = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[],
  onChunk: (chunk: string) => void,
  onAgentChange?: (agent: 'groq' | 'gemini') => void
): Promise<void> => {
  const groqKey = await getAgentKey('groq');
  if (groqKey) {
    try {
      onAgentChange?.('groq');
      const messages = [
        { role: 'system', content: SYSTEM },
        ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.parts[0].text })),
        { role: 'user', content: prompt },
      ];
      await groqStream(groqKey, messages, onChunk);
      return;
    } catch {
      // Groq failed — fall through to Gemini
    }
  }
  // Gemini streaming with non-streaming fallback for native APK
  onAgentChange?.('gemini');
  const genAI = await getGemini();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM });
  const chat = model.startChat({ history });
  try {
    const result = await chat.sendMessageStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) onChunk(text);
    }
  } catch {
    // Fallback: non-streaming for native environments where async iterator may fail
    const fallback = await chat.sendMessage(prompt);
    onChunk(fallback.response.text());
  }
};

// ── Autopilot — Gemini ─────────────────────────────────────────
export const sendAutopilotMessage = async (
  topic: string, platforms: string[], language: string, tone: string
): Promise<string> => {
  const genAI = await getGemini();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: AUTOPILOT_SYSTEM });
  const CHAR_LIMITS: Record<string, number> = { LinkedIn: 1000, Instagram: 2000, 'Twitter/X': 260, TikTok: 1400, YouTube: 500, WhatsApp: 800 };
  const prompt = `Generate a 3-day viral content strategy for: "${topic}". Platforms: ${platforms.join(', ')}. Language: ${language}. Tone: ${tone}.

CRITICAL RULE for "post" field: It must be a COMPLETE, READY-TO-PASTE post. No labels, no sections, no explanations. Write it exactly as it will appear on the platform.
Format: [Strong hook line that stops the scroll]\\n\\n[2-3 punchy paragraphs in conversational ${tone} human tone — NOT a report, NOT a strategy doc]\\n\\n[1 CTA line]\\n\\n[12-15 hashtags starting with #]

Platform char limits: ${JSON.stringify(CHAR_LIMITS)}. STRICTLY respect the character limit for each platform.

Return ONLY this JSON:
{"viral_probability":<0-100>,"platform_content":[{"platform":"<name>","hook":"<one-line viral hook only>","post":"<COMPLETE READY-TO-PASTE POST as described above — hook + body + CTA + hashtags — within char limit>","hashtags":"<12 hashtags space-separated>","cta":"<standalone CTA line>","image_prompt":"<detailed Midjourney/DALL-E prompt>"}],"content_calendar":[{"day":"Day 1","theme":"<angle>","action":"<posting action>"},{"day":"Day 2","theme":"<angle>","action":"<posting action>"},{"day":"Day 3","theme":"<angle>","action":"<posting action>"}]}`;
  const chat = model.startChat({ history: [] });
  return (await chat.sendMessage(prompt)).response.text();
};

// ── ═══════════════════════════════════════════════════════════ ──
// ── AGENT SWARM — All 3 agents collaborate in parallel         ──
// ── ═══════════════════════════════════════════════════════════ ──

export interface SwarmPlatformCard {
  platform: string;
  // Scout (Groq) — viral intelligence
  hook: string;
  hookB: string;
  hashtags: string;
  bestTime: string;
  // Architect (Gemini) — creative content
  post: string;
  cta: string;
  imagePrompt: string;
  viralScore: number;
  // Strategist (SambaNova) — growth analysis
  seoAngle: string;
  engagementTip: string;
  altAngle: string;
  // metadata
  agentsContributed: AgentId[];
}

export interface SwarmResult {
  cards: SwarmPlatformCard[];
  timing: Partial<Record<AgentId, number>>;
  agentsUsed: AgentId[];
}

// Groq Scout — generates hooks + hashtags + best time
const groqScout = async (
  key: string, topic: string, platforms: string[], language: string, tone: string, dnaCtx: string
): Promise<Record<string, { hook: string; hookB: string; hashtags: string; bestTime: string }>> => {
  const raw = await groqChat(key, [
    { role: 'system', content: `You are the Viral Intelligence Scout. ${JSON_ONLY}` },
    { role: 'user', content: `Topic: "${topic + dnaCtx}". Language: ${language}. Tone: ${tone}. Platforms: ${platforms.join(', ')}.
Generate viral hook intelligence for each platform. Return ONLY this JSON array (one object per platform):
[{"platform":"<name>","hook":"<irresistible first-line hook in ${language}>","hookB":"<alternative psychological hook — different trigger>","hashtags":"<exactly 10 trending hashtags each starting with #, space-separated>","bestTime":"<specific day + time + timezone for max reach>"}]` },
  ]);
  const arr = JSON.parse(cleanJSON(raw)) as { platform: string; hook: string; hookB: string; hashtags: string; bestTime: string }[];
  return Object.fromEntries(arr.map(a => [a.platform, a]));
};

// Gemini Architect — generates full post + CTA + image prompt + viral score
const geminiArchitect = async (
  topic: string, platforms: string[], language: string, tone: string, dnaCtx: string
): Promise<{ viralScore: number; content: Record<string, { post: string; cta: string; imagePrompt: string }> }> => {
  const genAI = await getGemini();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: `You are the Content Architect. ${JSON_ONLY}` });
  const CHAR_LIMITS: Record<string, number> = { LinkedIn: 1000, Instagram: 2000, 'Twitter/X': 260, TikTok: 1400, YouTube: 500, WhatsApp: 800 };
  const prompt = `Topic: "${topic + dnaCtx}". Language: ${language}. Tone: ${tone}. Platforms: ${platforms.join(', ')}.

CRITICAL RULE for "post" field: Write a COMPLETE READY-TO-PASTE post exactly as it will appear on the platform. No labels. No sections. No explanations.
Format: [Strong hook line]\\n\\n[2-3 punchy paragraphs in conversational ${tone} human tone]\\n\\n[1 CTA line]\\n\\n[12-15 hashtags starting with #]
Platform char limits — STRICTLY respect: ${JSON.stringify(CHAR_LIMITS)}

Return ONLY this JSON:
{"viralScore":<overall 0-100>,"content":[{"platform":"<name>","post":"<COMPLETE READY-TO-PASTE POST — hook + body paragraphs + CTA + hashtags — within char limit, human tone, NOT a report>","cta":"<standalone CTA>","imagePrompt":"<ultra-detailed Midjourney/DALL-E prompt: style, lighting, composition, mood, colors, camera angle — 2-3 sentences>"}]}`;
  const raw = (await model.generateContent(prompt)).response.text();
  const parsed = JSON.parse(cleanJSON(raw)) as { viralScore: number; content: { platform: string; post: string; cta: string; imagePrompt: string }[] };
  return {
    viralScore: parsed.viralScore,
    content: Object.fromEntries(parsed.content.map(c => [c.platform, c])),
  };
};

// SambaNova Strategist — generates SEO angle + engagement tip + alt angle
const sambaStrategist = async (
  key: string, topic: string, platforms: string[], language: string, tone: string
): Promise<Record<string, { seoAngle: string; engagementTip: string; altAngle: string }>> => {
  const raw = await sambaChat(key, [
    { role: 'system', content: `You are the Growth Strategist. ${JSON_ONLY}` },
    { role: 'user', content: `Topic: "${topic}". Language: ${language}. Tone: ${tone}. Platforms: ${platforms.join(', ')}.
As the growth strategist, provide deep growth intelligence for each platform. Return ONLY this JSON array:
[{"platform":"<name>","seoAngle":"<SEO keyword strategy and discoverability angle in 1-2 sentences>","engagementTip":"<psychological insight on why people share/comment — data-driven, 1-2 sentences>","altAngle":"<completely different content angle for the same topic that could perform even better>"}]` },
  ]);
  const arr = JSON.parse(cleanJSON(raw)) as { platform: string; seoAngle: string; engagementTip: string; altAngle: string }[];
  return Object.fromEntries(arr.map(a => [a.platform, a]));
};

export const swarmForge = async (
  topic: string,
  platforms: string[],
  language: string,
  tone: string,
  dnaContext: string,
  onStatus: (agent: AgentId, status: 'working' | 'done' | 'error') => void
): Promise<SwarmResult> => {
  const [groqKey, sambaKey] = await Promise.all([getAgentKey('groq'), getAgentKey('samba')]);

  const timing: Partial<Record<AgentId, number>> = {};
  const agentsUsed: AgentId[] = ['gemini'];
  if (groqKey)  agentsUsed.push('groq');
  if (sambaKey) agentsUsed.push('samba');

  // Fire all three in parallel
  onStatus('gemini', 'working');
  if (groqKey)  onStatus('groq', 'working');
  if (sambaKey) onStatus('samba', 'working');

  const t0 = Date.now();

  const [groqResult, geminiResult, sambaResult] = await Promise.allSettled([
    groqKey
      ? groqScout(groqKey, topic, platforms, language, tone, dnaContext).then(r => { timing.groq = Date.now() - t0; onStatus('groq', 'done'); return r; }).catch(e => { onStatus('groq', 'error'); throw e; })
      : Promise.resolve(null),
    geminiArchitect(topic, platforms, language, tone, dnaContext).then(r => { timing.gemini = Date.now() - t0; onStatus('gemini', 'done'); return r; }).catch(e => { onStatus('gemini', 'error'); throw e; }),
    sambaKey
      ? sambaStrategist(sambaKey, topic, platforms, language, tone).then(r => { timing.samba = Date.now() - t0; onStatus('samba', 'done'); return r; }).catch(e => { onStatus('samba', 'error'); throw e; })
      : Promise.resolve(null),
  ]);

  const scout     = groqResult.status  === 'fulfilled' ? groqResult.value  : null;
  const architect = geminiResult.status === 'fulfilled' ? geminiResult.value : null;
  const strategist = sambaResult.status === 'fulfilled' ? sambaResult.value : null;

  if (!architect) throw new Error('Gemini (Architect) failed — check your API key.');

  const cards: SwarmPlatformCard[] = platforms.map(platform => {
    const s  = scout?.[platform];
    const a  = architect.content[platform];
    const st = strategist?.[platform];
    const contributed: AgentId[] = ['gemini'];
    if (s)  contributed.push('groq');
    if (st) contributed.push('samba');

    return {
      platform,
      hook:          s?.hook      ?? a?.post?.split('\n')[0] ?? '',
      hookB:         s?.hookB     ?? '',
      hashtags:      s?.hashtags  ?? '',
      bestTime:      s?.bestTime  ?? '',
      post:          a?.post      ?? '',
      cta:           a?.cta       ?? '',
      imagePrompt:   a?.imagePrompt ?? '',
      viralScore:    architect.viralScore,
      seoAngle:      st?.seoAngle      ?? '',
      engagementTip: st?.engagementTip ?? '',
      altAngle:      st?.altAngle      ?? '',
      agentsContributed: contributed,
    };
  });

  return { cards, timing, agentsUsed };
};

// ── Other AI features ──────────────────────────────────────────
export const getOptimalPostingTime = async (platform: string, topic: string): Promise<string> => {
  const groqKey = await getAgentKey('groq');
  if (groqKey) {
    return groqChat(groqKey, [
      { role: 'system', content: 'You are a social media analytics expert. Give concise, specific posting time recommendations in 2-3 sentences.' },
      { role: 'user', content: `Best time to post about "${topic}" on ${platform} for maximum viral reach in 2026. Include day, time, and timezone.` },
    ]);
  }
  const genAI = await getGemini();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: 'You are a social media analytics expert. Give concise, specific recommendations in 2-3 sentences.' });
  return (await model.generateContent(`Best time to post about "${topic}" on ${platform} for maximum reach in 2026.`)).response.text();
};

export interface ABHooks { hookA: string; angleA: string; hookB: string; angleB: string; }
export const generateABHooks = async (topic: string, platform: string, tone: string): Promise<ABHooks> => {
  const prompt = `Two competing viral hooks for a ${platform} post about "${topic}" in ${tone} tone. Different psychological triggers. Return ONLY: {"hookA":"<hook>","angleA":"<trigger 2-3 words>","hookB":"<hook>","angleB":"<trigger 2-3 words>"}`;
  const groqKey = await getAgentKey('groq');
  let raw: string;
  if (groqKey) {
    raw = await groqChat(groqKey, [{ role: 'system', content: `Viral hook copywriter. ${JSON_ONLY}` }, { role: 'user', content: prompt }]);
  } else {
    const genAI = await getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: `Viral hook copywriter. ${JSON_ONLY}` });
    raw = (await model.generateContent(prompt)).response.text();
  }
  return JSON.parse(cleanJSON(raw)) as ABHooks;
};

export interface ThreadTweet { number: number; tweet: string; type: 'hook' | 'body' | 'cta'; }
export const generateViralThread = async (topic: string, tone: string, language: string): Promise<ThreadTweet[]> => {
  const prompt = `10-tweet viral Twitter/X thread about "${topic}" in ${language} with ${tone} tone. Each tweet under 280 chars. Tweet 1=hook, 2-9=value, 10=CTA+follow. Return ONLY JSON array: [{"number":1,"tweet":"...","type":"hook"},...]`;
  const sambaKey = await getAgentKey('samba');
  let raw: string;
  if (sambaKey) {
    raw = await sambaChat(sambaKey, [{ role: 'system', content: `Elite Twitter/X thread writer. ${JSON_ONLY}` }, { role: 'user', content: prompt }]);
  } else {
    const genAI = await getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: `Elite Twitter/X thread writer. ${JSON_ONLY}` });
    raw = (await model.generateContent(prompt)).response.text();
  }
  return JSON.parse(cleanJSON(raw)) as ThreadTweet[];
};

export interface TrendingTopic { topic: string; reason: string; best_platform: string; trend_score: number; angle: string; }
export const getTrendingTopics = async (niche: string): Promise<TrendingTopic[]> => {
  const prompt = `5 ultra-viral content ideas for "${niche}" niche in 2026. Return ONLY JSON array: [{"topic":"<topic>","reason":"<why viral, 1 sentence>","best_platform":"<platform>","trend_score":<72-99>,"angle":"<Hot Take/Tutorial/Expose/Story/Challenge/Listicle>"}]`;
  const groqKey = await getAgentKey('groq');
  let raw: string;
  if (groqKey) {
    raw = await groqChat(groqKey, [{ role: 'system', content: `Viral trend analyst. ${JSON_ONLY}` }, { role: 'user', content: prompt }]);
  } else {
    const genAI = await getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: `Viral trend analyst. ${JSON_ONLY}` });
    raw = (await model.generateContent(prompt)).response.text();
  }
  return JSON.parse(cleanJSON(raw)) as TrendingTopic[];
};

export const BRAND_VOICE_KEY = 'nexa_brand_voice_dna';
export interface BrandVoiceProfile {
  name: string; tone_fingerprint: string; vocabulary_style: string;
  sentence_rhythm: string; power_words: string[]; humor_level: string;
  cta_style: string; avoid_words: string[]; dna_summary: string;
}
export const analyzeBrandVoice = async (posts: string): Promise<BrandVoiceProfile> => {
  const genAI = await getGemini();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: `Brand voice linguist. ${JSON_ONLY}` });
  const raw = (await model.generateContent(
    `Analyze these posts and extract brand voice DNA. Return ONLY: {"name":"<profile name>","tone_fingerprint":"<core tone 3-5 words>","vocabulary_style":"<description>","sentence_rhythm":"<description>","power_words":["w1","w2","w3","w4","w5"],"humor_level":"<None/Subtle/Moderate/Heavy>","cta_style":"<description>","avoid_words":["w1","w2","w3"],"dna_summary":"<2 sentences>"}\n\nPosts:\n${posts}`
  )).response.text();
  return JSON.parse(cleanJSON(raw)) as BrandVoiceProfile;
};

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C' },
  { id: 'youtube',   name: 'YouTube',   icon: '▶️',  color: '#FF0000' },
  { id: 'twitter',   name: 'Twitter/X', icon: '🐦',  color: '#1DA1F2' },
  { id: 'linkedin',  name: 'LinkedIn',  icon: '💼',  color: '#0077B5' },
  { id: 'tiktok',    name: 'TikTok',    icon: '🎵',  color: '#FF0050' },
  { id: 'whatsapp',  name: 'WhatsApp',  icon: '💬',  color: '#25D366' },
];

export const getEngagementEstimate = (score: number) => {
  if (score >= 90) return { views: '500K–2M',   likes: '50K–200K', shares: '20K–80K', comments: '5K–20K' };
  if (score >= 80) return { views: '100K–500K', likes: '10K–50K',  shares: '5K–20K',  comments: '1K–5K'  };
  if (score >= 70) return { views: '30K–100K',  likes: '3K–10K',   shares: '1K–5K',   comments: '300–1K' };
  if (score >= 60) return { views: '10K–30K',   likes: '1K–3K',    shares: '300–1K',  comments: '50–300' };
  return               { views: '1K–10K',    likes: '100–1K',   shares: '30–300',  comments: '10–100' };
};
