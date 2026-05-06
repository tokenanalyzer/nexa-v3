import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyASfcpHM2rRplCR_59oI8cZC7uQeBa-N6U';
const genAI = new GoogleGenerativeAI(API_KEY);

export const SYSTEM_PROMPT = `You are NEXA AI — an expert social media content strategist. You create viral content for Instagram, YouTube, Twitter/X, LinkedIn, TikTok and WhatsApp. Always be specific, creative and platform-optimized.`;

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

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0077B5' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#FF0050' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
];
