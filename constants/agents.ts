import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Storage keys ───────────────────────────────────────────────
export const GEMINI_KEY_STORAGE  = 'nexa_api_key';
export const GROQ_KEY_STORAGE    = 'nexa_groq_key';
export const SAMBA_KEY_STORAGE   = 'nexa_samba_key';

// ── Agent definitions ──────────────────────────────────────────
export type AgentId = 'gemini' | 'groq' | 'samba';

export interface AgentInfo {
  id: AgentId;
  name: string;
  model: string;
  badge: string;
  color: string;
  role: string;
  specialty: string;
  speed: 'Fast' | 'Faster' | 'Fastest';
  storageKey: string;
  getKeyUrl: string;
}

export const AGENTS: AgentInfo[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    model: 'gemini-2.5-flash',
    badge: '✦',
    color: '#5E5CE6',
    role: 'Content Architect',
    specialty: 'Full post body, visual prompts, brand DNA, autopilot',
    speed: 'Fast',
    storageKey: GEMINI_KEY_STORAGE,
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'groq',
    name: 'Groq',
    model: 'llama-3.3-70b-versatile',
    badge: '⚡',
    color: '#F43F5E',
    role: 'Viral Scout',
    specialty: 'Ultra-fast hooks, hashtags, trends, real-time chat',
    speed: 'Fastest',
    storageKey: GROQ_KEY_STORAGE,
    getKeyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'samba',
    name: 'SambaNova',
    model: 'Meta-Llama-3.3-70B-Instruct',
    badge: '◆',
    color: '#0EA5E9',
    role: 'Growth Strategist',
    specialty: 'SEO angles, engagement psychology, thread builder',
    speed: 'Faster',
    storageKey: SAMBA_KEY_STORAGE,
    getKeyUrl: 'https://cloud.sambanova.ai/apis',
  },
];

// ── Key helpers ────────────────────────────────────────────────
export const getAgentKey = async (id: AgentId): Promise<string> => {
  const agent = AGENTS.find(a => a.id === id)!;
  try {
    const stored = await AsyncStorage.getItem(agent.storageKey);
    if (stored?.trim()) return stored.trim();
  } catch {}
  if (id === 'gemini') return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  return '';
};

export const hasAnyKey = async (): Promise<boolean> => {
  const gemini = await getAgentKey('gemini');
  return !!gemini;
};

export const getActiveAgents = async (): Promise<AgentId[]> => {
  const results = await Promise.all(AGENTS.map(a => getAgentKey(a.id)));
  return AGENTS.filter((_, i) => !!results[i]).map(a => a.id);
};

// ── Groq REST helper ───────────────────────────────────────────
export const groqChat = async (
  key: string,
  messages: { role: string; content: string }[],
  model = 'llama-3.3-70b-versatile'
): Promise<string> => {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
};

export const groqStream = async (
  key: string,
  messages: { role: string; content: string }[],
  onChunk: (t: string) => void,
  model = 'llama-3.3-70b-versatile'
): Promise<void> => {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 4096, stream: true }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No stream body');
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const l = line.replace(/^data: /, '').trim();
      if (!l || l === '[DONE]') continue;
      try {
        const j = JSON.parse(l);
        const t = j.choices?.[0]?.delta?.content;
        if (t) onChunk(t);
      } catch {}
    }
  }
};

// ── SambaNova REST helper ──────────────────────────────────────
export const sambaChat = async (
  key: string,
  messages: { role: string; content: string }[],
  model = 'Meta-Llama-3.3-70B-Instruct'
): Promise<string> => {
  const res = await fetch('https://api.sambanova.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`SambaNova ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
};

// ── Test helpers ───────────────────────────────────────────────
export const testGeminiKey = async (key: string): Promise<boolean> => {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const g = new GoogleGenerativeAI(key);
    const m = g.getGenerativeModel({ model: 'gemini-2.5-flash' });
    await m.generateContent('Reply: ok');
    return true;
  } catch { return false; }
};

export const testGroqKey = async (key: string): Promise<boolean> => {
  try {
    await groqChat(key, [{ role: 'user', content: 'Reply with the single word: ok' }]);
    return true;
  } catch { return false; }
};

export const testSambaKey = async (key: string): Promise<boolean> => {
  try {
    await sambaChat(key, [{ role: 'user', content: 'Reply with the single word: ok' }]);
    return true;
  } catch { return false; }
};
