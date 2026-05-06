import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

export const hasApiKey = () => !!process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const SYSTEM_PROMPT = `You are NEXA AI — an expert social media content strategist. You create viral content for Instagram, YouTube, Twitter/X, LinkedIn, TikTok and WhatsApp. Always be specific, creative and platform-optimized.`;

export const AUTOPILOT_SYSTEM_PROMPT = `You are NEXA AUTOPILOT — an elite autonomous viral marketing agency AI. You ONLY respond with valid JSON. No markdown fences, no explanation, no text outside of the JSON object. Your JSON must be parseable by JSON.parse().`;

export const sendMessage = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_PROMPT });
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(prompt);
  return result.response.text();
};

export const streamMessage = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[],
  onChunk: (chunk: string) => void
): Promise<void> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_PROMPT });
  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(prompt);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) onChunk(text);
  }
};

export const sendAutopilotMessage = async (
  topic: string,
  platforms: string[],
  language: string,
  tone: string
): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: AUTOPILOT_SYSTEM_PROMPT });
  const prompt = `Generate a 3-day viral content strategy for topic: "${topic}" targeting platforms: ${platforms.join(', ')}.
All post content must be written in ${language} with a ${tone} tone and style throughout.
Return ONLY this JSON (no markdown, no extra text):
{
  "viral_probability": <integer 0-100>,
  "platform_content": [
    {
      "platform": "<platform name>",
      "hook": "<psychological viral hook in ${tone} tone>",
      "post": "<complete optimized post body in ${language} with ${tone} tone>",
      "hashtags": "<12 trending hashtags separated by spaces, each starting with #>",
      "cta": "<one powerful call to action in ${tone} tone>",
      "image_prompt": "<ultra-detailed Midjourney/DALL-E prompt including style, lighting, composition, color palette, mood, camera angle; 2-3 sentences>"
    }
  ],
  "content_calendar": [
    { "day": "Day 1", "theme": "<angle/theme>", "action": "<exact posting action>" },
    { "day": "Day 2", "theme": "<angle/theme>", "action": "<exact posting action>" },
    { "day": "Day 3", "theme": "<angle/theme>", "action": "<exact posting action>" }
  ]
}`;
  const chat = model.startChat({ history: [] });
  const result = await chat.sendMessage(prompt);
  return result.response.text();
};

export const getOptimalPostingTime = async (platform: string, topic: string): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a social media analytics expert. Give concise, data-driven posting time recommendations in 2-3 sentences.',
  });
  const result = await model.generateContent(
    `Best day and time (with timezone) to post about "${topic}" on ${platform} for maximum viral reach in 2026. Be specific.`
  );
  return result.response.text();
};

export interface ABHooks {
  hookA: string;
  angleA: string;
  hookB: string;
  angleB: string;
}

export const generateABHooks = async (
  topic: string,
  platform: string,
  tone: string
): Promise<ABHooks> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a viral hook copywriter. Respond ONLY with valid JSON. No markdown, no extra text.',
  });
  const prompt = `Generate 2 competing viral hook variants for a ${platform} post about "${topic}" in a ${tone} tone. Each hook MUST use a different psychological trigger. Return ONLY this JSON:
{
  "hookA": "<hook variant A — complete, scroll-stopping>",
  "angleA": "<psychological trigger — 2-3 words e.g. Curiosity Gap>",
  "hookB": "<hook variant B — completely different approach>",
  "angleB": "<psychological trigger — 2-3 words e.g. Social Proof>"
}`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(raw) as ABHooks;
};

export interface ThreadTweet {
  number: number;
  tweet: string;
  type: 'hook' | 'body' | 'cta';
}

export const generateViralThread = async (
  topic: string,
  tone: string,
  language: string
): Promise<ThreadTweet[]> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are an elite Twitter/X thread writer. Respond ONLY with a valid JSON array. No markdown, no extra text.',
  });
  const prompt = `Write a 10-tweet viral Twitter/X thread about "${topic}" in ${language} with a ${tone} tone. Each tweet must be under 280 characters. Tweet 1 = irresistible hook. Tweets 2-9 = value/insights. Tweet 10 = powerful CTA + follow ask. Return ONLY this JSON array:
[
  { "number": 1, "tweet": "<tweet text>", "type": "hook" },
  { "number": 2, "tweet": "<tweet text>", "type": "body" },
  { "number": 3, "tweet": "<tweet text>", "type": "body" },
  { "number": 4, "tweet": "<tweet text>", "type": "body" },
  { "number": 5, "tweet": "<tweet text>", "type": "body" },
  { "number": 6, "tweet": "<tweet text>", "type": "body" },
  { "number": 7, "tweet": "<tweet text>", "type": "body" },
  { "number": 8, "tweet": "<tweet text>", "type": "body" },
  { "number": 9, "tweet": "<tweet text>", "type": "body" },
  { "number": 10, "tweet": "<tweet text>", "type": "cta" }
]`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(raw) as ThreadTweet[];
};

export interface TrendingTopic {
  topic: string;
  reason: string;
  best_platform: string;
  trend_score: number;
  angle: string;
}

export const getTrendingTopics = async (niche: string): Promise<TrendingTopic[]> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a viral trend intelligence analyst. Respond ONLY with a valid JSON array. No markdown, no extra text.',
  });
  const prompt = `Generate exactly 5 ultra-viral, hyper-specific content topic ideas for the "${niche}" niche in 2026. Return ONLY this JSON array:
[
  {
    "topic": "<compelling, specific scroll-stopping post topic>",
    "reason": "<exactly why this will go viral — 1 sharp sentence>",
    "best_platform": "<single best platform: Instagram/YouTube/Twitter/LinkedIn/TikTok/WhatsApp>",
    "trend_score": <integer between 72 and 99>,
    "angle": "<one of: Hot Take/Tutorial/Expose/Story/Controversy/Listicle/Challenge/Behind The Scenes>"
  }
]`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(raw) as TrendingTopic[];
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
  if (score >= 90) return { views: '500K–2M', likes: '50K–200K', shares: '20K–80K', comments: '5K–20K' };
  if (score >= 80) return { views: '100K–500K', likes: '10K–50K', shares: '5K–20K', comments: '1K–5K' };
  if (score >= 70) return { views: '30K–100K', likes: '3K–10K', shares: '1K–5K', comments: '300–1K' };
  if (score >= 60) return { views: '10K–30K', likes: '1K–3K', shares: '300–1K', comments: '50–300' };
  return { views: '1K–10K', likes: '100–1K', shares: '30–300', comments: '10–100' };
};
