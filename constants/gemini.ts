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

export const sendAutopilotMessage = async (
  topic: string,
  platforms: string[],
  language: string
): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: AUTOPILOT_SYSTEM_PROMPT,
  });
  const prompt = `Generate a 3-day viral content strategy for topic: "${topic}" targeting platforms: ${platforms.join(', ')}. All post content must be written in ${language}.
Return ONLY this JSON structure (no markdown, no extra text):
{
  "viral_probability": <integer 0-100 reflecting true virality potential>,
  "platform_content": [
    {
      "platform": "<platform name>",
      "hook": "<psychological viral hook — curiosity gap, social proof, or shock value>",
      "post": "<complete optimized post body in ${language}>",
      "hashtags": "<12 trending hashtags>",
      "cta": "<one powerful call to action>"
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

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0077B5' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#FF0050' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
];
