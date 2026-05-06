import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

export const SYSTEM_PROMPT = `You are NEXA AI — an expert social media content strategist. You create viral content for Instagram, YouTube, Twitter/X, LinkedIn, TikTok and WhatsApp. Always be specific, creative and platform-optimized.`;

export const AUTOPILOT_SYSTEM_PROMPT = `You are NEXA AUTOPILOT — an elite autonomous viral marketing agency AI. You ONLY respond with valid JSON. No markdown fences, no explanation, no text outside of the JSON object. Your JSON must be parseable by JSON.parse().`;

export const sendMessage = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(prompt);
  return result.response.text();
};

export const streamMessage = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[],
  onChunk: (chunk: string) => void
): Promise<void> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });
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
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: AUTOPILOT_SYSTEM_PROMPT,
  });
  const prompt = `Generate a 3-day viral content strategy for topic: "${topic}" targeting platforms: ${platforms.join(', ')}.
All post content must be written in ${language} with a ${tone} tone and style throughout.
Return ONLY this JSON structure (no markdown, no extra text):
{
  "viral_probability": <integer 0-100 reflecting true virality potential>,
  "platform_content": [
    {
      "platform": "<platform name>",
      "hook": "<psychological viral hook — curiosity gap, social proof, or shock value, in ${tone} tone>",
      "post": "<complete optimized post body in ${language} with ${tone} tone>",
      "hashtags": "<12 trending hashtags>",
      "cta": "<one powerful call to action in ${tone} tone>",
      "image_prompt": "<ultra-detailed, copy-pasteable Midjourney/DALL-E image prompt for the post visual — include style, lighting, composition, color palette, mood, camera angle, and art direction; 2-3 sentences>"
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

export const getOptimalPostingTime = async (
  platform: string,
  topic: string
): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a social media analytics expert. Give concise, data-driven posting time recommendations in 2-3 sentences.',
  });
  const prompt = `What is the single best day of week and time (with timezone) to post about "${topic}" on ${platform} for maximum viral reach and engagement in 2026? Be specific and actionable.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
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
    systemInstruction: 'You are a viral trend intelligence analyst. Respond ONLY with a valid JSON array. No markdown fences, no explanation, no text outside the JSON array.',
  });
  const prompt = `Generate exactly 5 ultra-viral, hyper-specific content topic ideas for the "${niche}" niche that would explode on social media in 2026. Make them timely, controversial, or deeply useful — not generic. Return ONLY this JSON array:
[
  {
    "topic": "<compelling, specific post topic — make it punchy and scroll-stopping>",
    "reason": "<exactly why this will go viral right now — 1 sharp sentence>",
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
