import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Share, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import {
  sendMessage, sendAutopilotMessage, getTrendingTopics,
  generateABHooks, generateViralThread, getOptimalPostingTime,
  getEngagementEstimate, analyzeBrandVoice, swarmForge,
  PLATFORMS, BRAND_VOICE_KEY,
  TrendingTopic, ABHooks, ThreadTweet, BrandVoiceProfile, SwarmPlatformCard,
} from '../constants/gemini';
import { AgentId } from '../constants/agents';
import { VAULT_STORAGE_KEY, VaultItem, FORGE_STATE_KEY } from '../constants/vault';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'Hinglish'] as const;
type Language = typeof LANGUAGES[number];

const TONES = [
  { id: 'Professional',  icon: '💼', desc: 'Clean, credible, boardroom-ready'  },
  { id: 'Gen-Z',         icon: '🔥', desc: 'Chaotic, real, internet-native'     },
  { id: 'Sarcastic',     icon: '😏', desc: 'Dry wit, irony, cultural jabs'      },
  { id: 'Inspirational', icon: '✨', desc: 'Uplifting, motivational, shareable' },
] as const;
type Tone = typeof TONES[number]['id'];

const NICHES = [
  { id: 'Tech & AI', icon: '🤖' }, { id: 'Business', icon: '💼' },
  { id: 'Health & Fitness', icon: '💪' }, { id: 'Lifestyle', icon: '✨' },
  { id: 'Finance & Crypto', icon: '📈' }, { id: 'Gaming', icon: '🎮' },
  { id: 'Fashion', icon: '👗' }, { id: 'Food & Travel', icon: '🌍' },
  { id: 'Education', icon: '📚' }, { id: 'Entertainment', icon: '🎬' },
];

interface PlatformContent { platform: string; hook: string; post: string; hashtags: string; cta: string; image_prompt?: string; }
interface CalendarDay { day: string; theme: string; action: string; }
interface AutopilotResult { viral_probability: number; platform_content: PlatformContent[]; content_calendar: CalendarDay[]; }

type SwarmAgentStatus = 'idle' | 'working' | 'done' | 'error';

const AGENT_META: Record<AgentId, { label: string; role: string; color: string; badge: string }> = {
  gemini: { label: 'Gemini',     role: 'Content Architect',  color: '#5E5CE6', badge: '✦' },
  groq:   { label: 'Groq',       role: 'Viral Scout',        color: '#F43F5E', badge: '⚡' },
  samba:  { label: 'SambaNova',  role: 'Growth Strategist',  color: '#0EA5E9', badge: '◆' },
};

const getPlatformColor = (name: string) =>
  PLATFORMS.find(p => p.name.toLowerCase() === name.toLowerCase() || p.id === name.toLowerCase())?.color ?? '#666';
const getPlatformIcon = (name: string) =>
  PLATFORMS.find(p => p.name.toLowerCase() === name.toLowerCase() || p.id === name.toLowerCase())?.icon ?? '📱';
const cleanJSON = (raw: string) => raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
const viralColor = (s: number) => s >= 80 ? '#30D158' : s >= 60 ? '#FF9F0A' : '#FF3B30';
const trendScoreColor = (s: number) => s >= 90 ? '#30D158' : s >= 80 ? '#FF9F0A' : '#FF6B35';

const ANGLE_COLORS: Record<string, string> = {
  'Hot Take': '#FF4500', 'Controversy': '#FF0050', 'Expose': '#FF3D00',
  'Challenge': '#E1306C', 'Tutorial': '#0077B5', 'Listicle': '#1DA1F2',
  'Story': '#9B59B6', 'Behind The Scenes': '#25D366',
};
const TWEET_TYPE_COLOR: Record<string, string> = { hook: '#FF6B35', body: '#1DA1F2', cta: '#30D158' };

export default function ForgeScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const isDark = T.isDark;

  // Design helpers
  const cardBg     = isDark ? T.surface : '#FFFFFF';
  const cardBorder = isDark ? T.card    : '#E5E5EA';
  const textSub    = isDark ? T.muted   : '#6E6E73';
  const inputBg    = isDark ? T.bg      : '#F5F5F7';
  const ACCENT     = T.accent;

  const shadow = (color?: string): object =>
    Platform.OS !== 'web' ? {} :
    isDark && color
      ? { boxShadow: `0 0 20px ${color}40` } as object
      : { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' } as object;

  const accentGlow = (color: string): object =>
    isDark
      ? Platform.OS === 'web'
        ? { boxShadow: `0 0 16px ${color}55` } as object
        : { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8 }
      : Platform.OS === 'web'
        ? { boxShadow: `0 4px 16px ${color}22` } as object
        : {};

  const bgStyle: object = Platform.OS === 'web'
    ? ({
        background: !isDark
          ? 'linear-gradient(160deg,#F5F5F7 0%,#EEF0FF 100%)'
          : theme === 'cyber'    ? 'linear-gradient(160deg,#020209 0%,#060618 100%)'
          : theme === 'ocean'   ? 'linear-gradient(160deg,#010a14 0%,#021828 100%)'
          : theme === 'inferno' ? 'linear-gradient(160deg,#0a0100 0%,#160500 100%)'
          :                       'linear-gradient(160deg,#060012 0%,#100028 100%)',
      } as object)
    : {};

  // ── Core state ─────────────────────────────────────────────────
  const [topic, setTopic]     = useState('');
  const [selected, setSelected] = useState<string[]>(['instagram']);
  const [language, setLanguage] = useState<Language>('English');
  const [tone, setTone]         = useState<Tone>('Professional');

  // Mode: 'manual' | 'autopilot' | 'swarm'
  const [mode, setMode] = useState<'manual' | 'autopilot' | 'swarm'>('manual');

  const [result, setResult]               = useState('');
  const [autopilotResult, setAutopilotResult] = useState<AutopilotResult | null>(null);
  const [loading, setLoading]             = useState(false);
  const [copied, setCopied]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [copiedPrompt, setCopiedPrompt]   = useState<string | null>(null);

  // Swarm state
  const [swarmCards, setSwarmCards]       = useState<SwarmPlatformCard[]>([]);
  const [swarmStatus, setSwarmStatus]     = useState<Record<AgentId, SwarmAgentStatus>>({ gemini: 'idle', groq: 'idle', samba: 'idle' });
  const [swarmTiming, setSwarmTiming]     = useState<Partial<Record<AgentId, number>>>({});

  // Brand Voice DNA
  const [dnaOpen, setDnaOpen]       = useState(false);
  const [dnaInput, setDnaInput]     = useState('');
  const [dnaProfile, setDnaProfile] = useState<BrandVoiceProfile | null>(null);
  const [dnaLoading, setDnaLoading] = useState(false);
  const [dnaAnalyzed, setDnaAnalyzed] = useState(false);

  // Trend Scout
  const [scoutOpen, setScoutOpen]       = useState(false);
  const [trendNiche, setTrendNiche]     = useState('Tech & AI');
  const [trends, setTrends]             = useState<TrendingTopic[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendError, setTrendError]     = useState('');

  // Per-card state
  const [abHooks, setAbHooks]             = useState<Record<string, ABHooks | null>>({});
  const [loadingAB, setLoadingAB]         = useState<Record<string, boolean>>({});
  const [bestTimes, setBestTimes]         = useState<Record<string, string | null>>({});
  const [loadingBestTime, setLoadingBestTime] = useState<Record<string, boolean>>({});
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null);

  // Thread Builder
  const [threadOpen, setThreadOpen]         = useState(false);
  const [thread, setThread]                 = useState<ThreadTweet[]>([]);
  const [loadingThread, setLoadingThread]   = useState(false);
  const [copiedTweet, setCopiedTweet]       = useState<number | null>(null);
  const [copiedField, setCopiedField]       = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(BRAND_VOICE_KEY).then(raw => {
      if (raw) { setDnaProfile(JSON.parse(raw)); setDnaAnalyzed(true); }
    }).catch(() => {});
  }, []);

  // Load persisted Forge state on mount
  useEffect(() => {
    AsyncStorage.getItem(FORGE_STATE_KEY).then(raw => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw);
        if (s.topic)           setTopic(s.topic);
        if (s.mode)            setMode(s.mode);
        if (s.selected?.length) setSelected(s.selected);
        if (s.language)        setLanguage(s.language);
        if (s.tone)            setTone(s.tone);
        if (s.result)          setResult(s.result);
        if (s.autopilotResult) setAutopilotResult(s.autopilotResult);
        if (s.swarmCards?.length) setSwarmCards(s.swarmCards);
      } catch {}
    }).catch(() => {});
  }, []);

  // Save Forge state whenever content or settings change
  useEffect(() => {
    if (!result && !autopilotResult && !swarmCards.length) return;
    AsyncStorage.setItem(FORGE_STATE_KEY, JSON.stringify({
      topic, mode, selected, language, tone,
      result, autopilotResult, swarmCards,
    })).catch(() => {});
  }, [result, autopilotResult, swarmCards, topic, mode, selected, language, tone]);

  const togglePlatform = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const resetCardState = () => {
    setAbHooks({}); setLoadingAB({});
    setBestTimes({}); setLoadingBestTime({});
    setThread([]); setThreadOpen(false);
    setSaved(false); setSwarmCards([]);
    setSwarmStatus({ gemini: 'idle', groq: 'idle', samba: 'idle' });
    setSwarmTiming({});
  };

  const dnaContext = dnaProfile
    ? `\n\n[BRAND VOICE — Apply this voice: ${dnaProfile.name}. Tone: ${dnaProfile.tone_fingerprint}. Power words: ${dnaProfile.power_words.join(', ')}. Avoid: ${dnaProfile.avoid_words.join(', ')}]`
    : '';

  // ── Forge (all modes) ──────────────────────────────────────────
  const forge = async () => {
    if (!topic.trim() || !selected.length || loading) return;
    setLoading(true); setResult(''); setAutopilotResult(null); resetCardState();
    const platformNames = selected.map(s => PLATFORMS.find(p => p.id === s)?.name ?? s);

    try {
      if (mode === 'swarm') {
        setSwarmStatus({ gemini: 'idle', groq: 'idle', samba: 'idle' });
        const result = await swarmForge(
          topic, platformNames, language, tone, dnaContext,
          (agent, status) => setSwarmStatus(prev => ({ ...prev, [agent]: status }))
        );
        setSwarmCards(result.cards);
        setSwarmTiming(result.timing);
        saveSwarmHistory(result.cards, result.timing);
      } else if (mode === 'autopilot') {
        const raw = await sendAutopilotMessage(topic + dnaContext, platformNames, language, tone);
        setAutopilotResult(JSON.parse(cleanJSON(raw)) as AutopilotResult);
      } else {
        const names = platformNames.join(', ');
        const reply = await sendMessage(
          `Create viral social media content in ${language} with a ${tone} tone for: "${topic}" on platforms: ${names}. For each platform: complete post, hashtags, viral hook, CTA, and a detailed Midjourney/DALL-E image prompt. Make it trendy for 2026.${dnaContext}`,
          []
        );
        setResult(reply);
      }
    } catch (e: unknown) {
      setResult('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const getContentString = () => {
    if (swarmCards.length > 0) {
      return swarmCards.map(c =>
        `[${c.platform}]\nHook: ${c.hook}\nPost: ${c.post}\nHashtags: ${c.hashtags}\nCTA: ${c.cta}\nBest Time: ${c.bestTime}\nSEO Angle: ${c.seoAngle}\nEngagement Tip: ${c.engagementTip}`
      ).join('\n\n---\n\n');
    }
    if (autopilotResult) {
      return [`VIRAL: ${autopilotResult.viral_probability}%`, ...autopilotResult.platform_content.map(pc =>
        `[${pc.platform}]\nHook: ${pc.hook}\nPost: ${pc.post}\nHashtags: ${pc.hashtags}\nCTA: ${pc.cta}`
      )].join('\n\n');
    }
    return result;
  };

  const copy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(getContentString());
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const copyImagePrompt = async (prompt: string, key: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(key); setTimeout(() => setCopiedPrompt(null), 2500);
    } catch {}
  };
  const copyHashtag = async (tag: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(tag);
      setCopiedHashtag(tag); setTimeout(() => setCopiedHashtag(null), 1800);
    } catch {}
  };
  const copyTweet = async (tweet: string, num: number) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(tweet);
      setCopiedTweet(num); setTimeout(() => setCopiedTweet(null), 2000);
    } catch {}
  };
  const copyField = async (text: string, key: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(text);
      setCopiedField(key); setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };
  const saveToVault = async () => {
    try {
      const existing = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      const items: VaultItem[] = existing ? JSON.parse(existing) : [];
      const platformLabel = selected.map(s => PLATFORMS.find(p => p.id === s)?.name ?? s).join(', ');
      const newItem: VaultItem = {
        id: Date.now(), title: topic.slice(0, 60), content: getContentString(),
        date: new Date().toLocaleDateString(), platform: platformLabel,
      };
      await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify([newItem, ...items]));
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { Alert.alert('Vault Error', 'Could not save.'); }
  };

  const saveSwarmHistory = async (cards: SwarmPlatformCard[], timing: Partial<Record<AgentId, number>>) => {
    try {
      const existing = await AsyncStorage.getItem('nexa_swarm_history');
      const history = existing ? JSON.parse(existing) : [];
      const entry = {
        id: Date.now(), topic: topic.slice(0, 60),
        platforms: cards.map(c => c.platform),
        viralScore: cards[0]?.viralScore ?? 0,
        timing: Object.fromEntries(Object.entries(timing).filter(([, v]) => v != null)),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        agentCount: Object.keys(timing).length,
      };
      await AsyncStorage.setItem('nexa_swarm_history', JSON.stringify([entry, ...history.slice(0, 19)]));
    } catch {}
  };

  // Brand DNA
  const handleAnalyzeDNA = async () => {
    if (!dnaInput.trim()) { Alert.alert('Paste Posts', 'Add at least 3 of your best posts to train your brand DNA.'); return; }
    setDnaLoading(true);
    try {
      const profile = await analyzeBrandVoice(dnaInput);
      setDnaProfile(profile); setDnaAnalyzed(true);
      await AsyncStorage.setItem(BRAND_VOICE_KEY, JSON.stringify(profile));
    } catch { Alert.alert('DNA Error', 'Could not analyze. Check your Gemini API key.'); }
    finally { setDnaLoading(false); }
  };
  const clearDNA = async () => {
    setDnaProfile(null); setDnaAnalyzed(false); setDnaInput('');
    await AsyncStorage.removeItem(BRAND_VOICE_KEY);
  };

  // Per-card
  const fetchABHooks = async (platform: string) => {
    setLoadingAB(prev => ({ ...prev, [platform]: true }));
    try {
      const hooks = await generateABHooks(topic, platform, tone);
      setAbHooks(prev => ({ ...prev, [platform]: hooks }));
    } catch {
      setAbHooks(prev => ({ ...prev, [platform]: { hookA: 'Error.', angleA: '—', hookB: 'Try again.', angleB: '—' } }));
    } finally { setLoadingAB(prev => ({ ...prev, [platform]: false })); }
  };
  const fetchBestTime = async (platform: string) => {
    setLoadingBestTime(prev => ({ ...prev, [platform]: true }));
    try {
      const time = await getOptimalPostingTime(platform, topic);
      setBestTimes(prev => ({ ...prev, [platform]: time }));
    } catch {
      setBestTimes(prev => ({ ...prev, [platform]: 'Could not fetch timing.' }));
    } finally { setLoadingBestTime(prev => ({ ...prev, [platform]: false })); }
  };
  const buildThread = async () => {
    setLoadingThread(true); setThread([]);
    try { setThread(await generateViralThread(topic, tone, language)); }
    catch { Alert.alert('Thread Error', 'Could not generate thread.'); }
    finally { setLoadingThread(false); }
  };
  const scanTrends = async () => {
    setLoadingTrends(true); setTrends([]); setTrendError('');
    try { setTrends(await getTrendingTopics(trendNiche)); }
    catch { setTrendError('Could not fetch trends. Check your API key.'); }
    finally { setLoadingTrends(false); }
  };

  // ── Hashtag Heatmap ──────────────────────────────────────────
  const HashtagHeatmap = ({ hashtags, color }: { hashtags: string; color: string }) => {
    const tags = hashtags.split(/\s+/).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`);
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((tag, i) => {
          const heat = Math.max(0.3, 1 - i * 0.07);
          return (
            <TouchableOpacity key={`${tag}-${i}`} onPress={() => copyHashtag(tag)}
              style={{
                backgroundColor: color + Math.round(heat * 22).toString(16).padStart(2, '0'),
                borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
                borderWidth: 1, borderColor: color + Math.round(heat * 80).toString(16).padStart(2, '0'),
              }} activeOpacity={0.7}>
              <Text style={{ color: copiedHashtag === tag ? '#30D158' : color, fontSize: 11, fontWeight: '600' }}>
                {copiedHashtag === tag ? '✓' : tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const hasOutput = !!result || !!autopilotResult || swarmCards.length > 0;

  // ── Label component ───────────────────────────────────────────
  const SectionLabel = ({ children, icon }: { children: string; icon?: string }) => (
    <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 }}>
      {icon ? `${icon}  ` : ''}{children}
    </Text>
  );

  // ── Mode pill button ──────────────────────────────────────────
  const ModePill = ({ id, icon, label, desc, color }: { id: 'manual' | 'autopilot' | 'swarm'; icon: string; label: string; desc: string; color: string }) => {
    const active = mode === id;
    return (
      <TouchableOpacity onPress={() => setMode(id)}
        style={{
          flex: 1, borderRadius: 14, padding: 12,
          backgroundColor: active ? color + (isDark ? '20' : '12') : cardBg,
          borderWidth: active ? 1.5 : 1,
          borderColor: active ? color + (isDark ? 'AA' : '60') : cardBorder,
          alignItems: 'center', gap: 4,
          ...shadow(active ? color : undefined),
        }} activeOpacity={0.8}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <Text style={{ color: active ? color : T.text, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
        <Text style={{ color: textSub, fontSize: 9, textAlign: 'center', lineHeight: 13 }}>{desc}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView style={[{ flex: 1, backgroundColor: T.bg }, bgStyle]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <Text style={{ color: T.text, fontSize: 22, fontWeight: '700', marginBottom: 2, letterSpacing: -0.5 }}>
          Forge <Text style={{ color: ACCENT }}>Content</Text>
        </Text>
        <Text style={{ color: textSub, fontSize: 12, marginBottom: 22 }}>Multi-platform AI content generator</Text>

        {/* ── Brand Voice DNA ──────────────────────────────────── */}
        <TouchableOpacity onPress={() => setDnaOpen(o => !o)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: dnaProfile ? (isDark ? '#00FF9D12' : '#F0FDF4') : cardBg,
            borderRadius: 16, padding: 14, marginBottom: 12,
            borderWidth: 1.5,
            borderColor: dnaProfile ? '#30D15880' : dnaOpen ? ACCENT + '80' : cardBorder,
            ...shadow(dnaProfile ? '#30D158' : dnaOpen ? ACCENT : undefined),
          }} activeOpacity={0.8}>
          <Text style={{ fontSize: 22 }}>🧬</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: dnaProfile ? '#30D158' : dnaOpen ? ACCENT : T.text, fontSize: 13, fontWeight: '600' }}>
                Brand Voice DNA
              </Text>
              {dnaProfile && (
                <View style={{ backgroundColor: '#30D15820', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ color: '#30D158', fontSize: 9, fontWeight: '700' }}>ACTIVE</Text>
                </View>
              )}
            </View>
            <Text style={{ color: textSub, fontSize: 11, marginTop: 2 }}>
              {dnaProfile ? `"${dnaProfile.name}" — ${dnaProfile.tone_fingerprint}` : 'Train AI on your writing style'}
            </Text>
          </View>
          <Text style={{ color: textSub, fontSize: 13 }}>{dnaOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {dnaOpen && (
          <View style={{
            backgroundColor: cardBg, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: ACCENT + '40', marginBottom: 12, marginTop: -6,
            ...shadow(ACCENT),
          }}>
            {dnaProfile && dnaAnalyzed && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700', marginBottom: 12 }}>Your Voice Fingerprint</Text>
                <View style={{ gap: 8 }}>
                  {[
                    { label: 'Tone', value: dnaProfile.tone_fingerprint },
                    { label: 'Vocabulary', value: dnaProfile.vocabulary_style },
                    { label: 'Rhythm', value: dnaProfile.sentence_rhythm },
                    { label: 'Humor', value: dnaProfile.humor_level },
                    { label: 'CTA Style', value: dnaProfile.cta_style },
                  ].map(row => (
                    <View key={row.label} style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600', width: 80 }}>{row.label}</Text>
                      <Text style={{ color: T.text, fontSize: 11, flex: 1, lineHeight: 16 }}>{row.value}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {dnaProfile.power_words.map(w => (
                      <View key={w} style={{ backgroundColor: ACCENT + '15', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: ACCENT + '35' }}>
                        <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600' }}>{w}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity onPress={clearDNA}
                  style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: '#FF3B3012', borderWidth: 1, borderColor: '#FF3B3030', alignItems: 'center' }}>
                  <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '600' }}>Remove DNA Profile</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 8 }}>
              {dnaProfile ? 'Retrain — paste new posts' : 'Paste 3–5 of your best posts'}
            </Text>
            <View style={{ backgroundColor: inputBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: cardBorder, marginBottom: 10, minHeight: 100 }}>
              <TextInput value={dnaInput} onChangeText={setDnaInput} multiline
                placeholder="Post 1: [your content]&#10;&#10;Post 2: [your content]&#10;&#10;Post 3: [your content]"
                placeholderTextColor={textSub}
                style={{ color: T.text, fontSize: 13, lineHeight: 20, minHeight: 90 }} />
            </View>
            <TouchableOpacity onPress={handleAnalyzeDNA} disabled={dnaLoading || !dnaInput.trim()}
              style={{
                backgroundColor: dnaLoading || !dnaInput.trim() ? (isDark ? T.card : '#E5E5EA') : ACCENT,
                borderRadius: 12, padding: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              }} activeOpacity={0.85}>
              {dnaLoading && <ActivityIndicator size="small" color={isDark ? ACCENT : '#fff'} />}
              <Text style={{ color: dnaLoading || !dnaInput.trim() ? textSub : '#fff', fontSize: 13, fontWeight: '600' }}>
                {dnaLoading ? 'Analyzing…' : '🧬 Analyze Brand Voice'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Mode Selector ────────────────────────────────────── */}
        <View style={{ marginBottom: 16 }}>
          <SectionLabel>GENERATION MODE</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ModePill id="manual"    icon="⚡" label="Manual"    desc="Quick single generation" color={ACCENT} />
            <ModePill id="autopilot" icon="🤖" label="Autopilot" desc="3-day calendar plan"     color="#FF9F0A" />
            <ModePill id="swarm"     icon="🐝" label="Swarm"     desc="All 3 agents together"   color="#30D158" />
          </View>
        </View>

        {/* ── Tone Matrix ──────────────────────────────────────── */}
        <View style={{ marginBottom: 16 }}>
          <SectionLabel icon="🎭">CONTENT TONE</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TONES.map(t => {
              const active = tone === t.id;
              return (
                <TouchableOpacity key={t.id} onPress={() => setTone(t.id)}
                  style={{
                    width: '48%', backgroundColor: active ? ACCENT + (isDark ? '20' : '12') : cardBg,
                    borderRadius: 14, padding: 12,
                    borderWidth: active ? 1.5 : 1, borderColor: active ? ACCENT + '70' : cardBorder,
                    ...shadow(active ? ACCENT : undefined),
                  }} activeOpacity={0.8}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                    <Text style={{ color: active ? ACCENT : T.text, fontSize: 12, fontWeight: '600' }}>{t.id}</Text>
                  </View>
                  <Text style={{ color: textSub, fontSize: 10, lineHeight: 14 }}>{t.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Language ─────────────────────────────────────────── */}
        <View style={{ marginBottom: 16 }}>
          <SectionLabel icon="🌐">LANGUAGE</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity key={lang} onPress={() => setLanguage(lang)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
                    borderWidth: language === lang ? 1.5 : 1,
                    borderColor: language === lang ? ACCENT + '70' : cardBorder,
                    backgroundColor: language === lang ? ACCENT + (isDark ? '20' : '12') : cardBg,
                  }}>
                  <Text style={{ color: language === lang ? ACCENT : textSub, fontSize: 13, fontWeight: '600' }}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── Platforms ────────────────────────────────────────── */}
        <View style={{ marginBottom: 16 }}>
          <SectionLabel icon="🎯">PLATFORMS</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PLATFORMS.map(p => (
              <TouchableOpacity key={p.id} onPress={() => togglePlatform(p.id)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                  borderWidth: selected.includes(p.id) ? 1.5 : 1,
                  borderColor: selected.includes(p.id) ? p.color : cardBorder,
                  backgroundColor: selected.includes(p.id) ? p.color + '15' : cardBg,
                }}>
                <Text style={{ color: selected.includes(p.id) ? p.color : textSub, fontSize: 13, fontWeight: '600' }}>
                  {p.icon} {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Trend Scout ──────────────────────────────────────── */}
        <TouchableOpacity onPress={() => { setScoutOpen(o => !o); if (!scoutOpen) setTrends([]); }}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: scoutOpen ? '#FF9F0A12' : cardBg,
            borderRadius: 16, padding: 14, marginBottom: 12,
            borderWidth: scoutOpen ? 1.5 : 1, borderColor: scoutOpen ? '#FF9F0A60' : cardBorder,
            ...shadow(scoutOpen ? '#FF9F0A' : undefined),
          }} activeOpacity={0.8}>
          <Text style={{ fontSize: 20 }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: scoutOpen ? '#FF9F0A' : T.text, fontSize: 13, fontWeight: '600' }}>Trend Scout</Text>
            <Text style={{ color: textSub, fontSize: 11, marginTop: 2 }}>{scoutOpen ? 'Tap any result to use it' : "Discover what's about to explode"}</Text>
          </View>
          <Text style={{ color: textSub, fontSize: 13 }}>{scoutOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {scoutOpen && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#FF9F0A40', marginBottom: 12, marginTop: -6, ...shadow('#FF9F0A') }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {NICHES.map(n => {
                  const active = trendNiche === n.id;
                  return (
                    <TouchableOpacity key={n.id} onPress={() => { setTrendNiche(n.id); setTrends([]); setTrendError(''); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: active ? 1.5 : 1, borderColor: active ? '#FF9F0A70' : cardBorder, backgroundColor: active ? '#FF9F0A12' : cardBg }}>
                      <Text style={{ fontSize: 12 }}>{n.icon}</Text>
                      <Text style={{ color: active ? '#FF9F0A' : textSub, fontSize: 12, fontWeight: '600' }}>{n.id}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={scanTrends} disabled={loadingTrends}
              style={{ backgroundColor: loadingTrends ? (isDark ? T.card : '#E5E5EA') : '#FF9F0A', borderRadius: 12, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {loadingTrends ? <ActivityIndicator color="#FF9F0A" size="small" /> : <Text>📡</Text>}
              <Text style={{ color: loadingTrends ? textSub : '#fff', fontSize: 13, fontWeight: '600' }}>
                {loadingTrends ? `Scanning ${trendNiche}…` : `Scan ${trendNiche}`}
              </Text>
            </TouchableOpacity>
            {trendError !== '' && (
              <View style={{ backgroundColor: '#FF3B3012', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#FF3B3030' }}>
                <Text style={{ color: '#FF3B30', fontSize: 12 }}>{trendError}</Text>
              </View>
            )}
            {trends.map((t, i) => {
              const scoreColor = trendScoreColor(t.trend_score);
              const angleColor = ANGLE_COLORS[t.angle] ?? '#888';
              return (
                <TouchableOpacity key={i} onPress={() => { setTopic(t.topic); setScoutOpen(false); }}
                  style={{ backgroundColor: cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: cardBorder, borderLeftWidth: 3, borderLeftColor: scoreColor, marginBottom: 8 }}
                  activeOpacity={0.8}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: scoreColor + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: scoreColor + '40' }}>
                      <Text style={{ color: scoreColor, fontSize: 12, fontWeight: '700' }}>{t.trend_score} 🔥</Text>
                    </View>
                    <View style={{ backgroundColor: angleColor + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: angleColor + '40' }}>
                      <Text style={{ color: angleColor, fontSize: 10, fontWeight: '600' }}>{t.angle}</Text>
                    </View>
                    <Text style={{ color: textSub, fontSize: 10, marginLeft: 'auto' }}>Tap to use →</Text>
                  </View>
                  <Text style={{ color: T.text, fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 6 }}>{t.topic}</Text>
                  <Text style={{ color: textSub, fontSize: 11, lineHeight: 16 }}>💡 {t.reason}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Topic Input ──────────────────────────────────────── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder, marginBottom: 14, ...shadow() }}>
          {dnaProfile && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#30D158' }} />
              <Text style={{ color: '#30D158', fontSize: 10, fontWeight: '600' }}>Brand DNA Active — "{dnaProfile.name}"</Text>
            </View>
          )}
          <TextInput value={topic} onChangeText={setTopic} multiline
            placeholder={mode === 'swarm' ? 'Enter your topic — all 3 agents will collaborate…' : 'Enter your topic, or pick one from Trend Scout above…'}
            placeholderTextColor={textSub}
            style={{ color: T.text, fontSize: 15, minHeight: 60 }} />
        </View>

        {/* ── Forge Button ─────────────────────────────────────── */}
        {(() => {
          const modeColor = mode === 'swarm' ? '#30D158' : mode === 'autopilot' ? '#FF9F0A' : ACCENT;
          const modeIcon  = mode === 'swarm' ? '🐝' : mode === 'autopilot' ? '🤖' : '⚡';
          const modeLabel = loading
            ? (mode === 'swarm' ? 'Swarm Working…' : mode === 'autopilot' ? 'Autopilot Running…' : 'Generating…')
            : mode === 'swarm' ? `${modeIcon} Launch Agent Swarm  (${selected.length} platform${selected.length > 1 ? 's' : ''})`
            : mode === 'autopilot' ? `${modeIcon} Launch Autopilot  (${selected.length} platform${selected.length > 1 ? 's' : ''})`
            : `${modeIcon} Forge  (${selected.length} platform${selected.length > 1 ? 's' : ''})`;
          return (
            <TouchableOpacity onPress={forge} disabled={loading || !topic.trim() || !selected.length}
              style={{
                backgroundColor: loading || !topic.trim() ? (isDark ? T.surface : '#E5E5EA') : modeColor,
                borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 10, marginBottom: 20,
                ...(!loading && topic.trim() ? accentGlow(modeColor) : {}),
              }} activeOpacity={0.85}>
              {loading && <ActivityIndicator color={isDark ? modeColor : '#fff'} />}
              <Text style={{ color: loading || !topic.trim() ? textSub : '#fff', fontWeight: '700', fontSize: 15, letterSpacing: -0.2 }}>
                {modeLabel}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 🐝 AGENT SWARM RESULTS                                  */}
        {/* ════════════════════════════════════════════════════════ */}

        {/* Swarm Status Panel */}
        {mode === 'swarm' && loading && (
          <View style={{ backgroundColor: cardBg, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: '#30D15840', ...shadow('#30D158') }}>
            <Text style={{ color: '#30D158', fontSize: 13, fontWeight: '700', marginBottom: 14 }}>🐝 Agent Swarm Active</Text>
            {(['gemini', 'groq', 'samba'] as AgentId[]).map(id => {
              const meta = AGENT_META[id];
              const status = swarmStatus[id];
              const t = swarmTiming[id];
              return (
                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: meta.color + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: meta.color + '40' }}>
                    <Text style={{ color: meta.color, fontSize: 13, fontWeight: '700' }}>{meta.badge}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontSize: 12, fontWeight: '600' }}>{meta.label} · {meta.role}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ flex: 1, height: 3, backgroundColor: isDark ? T.card : '#E5E5EA', borderRadius: 2 }}>
                        <View style={{ height: 3, borderRadius: 2, backgroundColor: status === 'done' ? '#30D158' : status === 'error' ? '#FF3B30' : meta.color, width: status === 'done' ? '100%' : status === 'working' ? '60%' : '0%' }} />
                      </View>
                      <Text style={{ color: status === 'done' ? '#30D158' : status === 'error' ? '#FF3B30' : textSub, fontSize: 10, fontWeight: '600', width: 60 }}>
                        {status === 'done' ? `✓ ${t ? (t / 1000).toFixed(1) + 's' : 'done'}` : status === 'error' ? '✗ error' : status === 'working' ? 'working…' : 'waiting'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Swarm Cards */}
        {swarmCards.length > 0 && (() => {
          const viralScore = swarmCards[0]?.viralScore ?? 0;
          const vColor = viralColor(viralScore);
          const eng = getEngagementEstimate(viralScore);
          return (
            <>
              {/* Swarm header + viral score */}
              <View style={{ backgroundColor: cardBg, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: '#30D15840', ...shadow('#30D158') }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Text style={{ color: '#30D158', fontSize: 13, fontWeight: '700' }}>🐝 Swarm Complete</Text>
                  <View style={{ flex: 1 }} />
                  {(['gemini', 'groq', 'samba'] as AgentId[]).map(id => {
                    const t = swarmTiming[id];
                    return t ? (
                      <View key={id} style={{ backgroundColor: AGENT_META[id].color + '15', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: AGENT_META[id].color + '35' }}>
                        <Text style={{ color: AGENT_META[id].color, fontSize: 9, fontWeight: '700' }}>{AGENT_META[id].badge} {(t / 1000).toFixed(1)}s</Text>
                      </View>
                    ) : null;
                  })}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Text style={{ color: vColor, fontSize: 48, fontWeight: '800', letterSpacing: -2 }}>{viralScore}<Text style={{ fontSize: 20 }}>%</Text></Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ height: 6, backgroundColor: isDark ? T.card : '#E5E5EA', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                      <View style={{ height: 6, borderRadius: 3, width: `${viralScore}%` as unknown as number, backgroundColor: vColor }} />
                    </View>
                    <Text style={{ color: textSub, fontSize: 11 }}>
                      {viralScore >= 80 ? '🔥 High viral potential' : viralScore >= 60 ? '⚡ Good reach expected' : '📈 Building momentum'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  {[{ icon: '👁️', label: 'Views', v: eng.views }, { icon: '❤️', label: 'Likes', v: eng.likes }, { icon: '🔁', label: 'Shares', v: eng.shares }, { icon: '💬', label: 'Comments', v: eng.comments }].map(s => (
                    <View key={s.label} style={{ flex: 1, backgroundColor: vColor + '10', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: vColor + '25', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</Text>
                      <Text style={{ color: vColor, fontSize: 11, fontWeight: '700' }}>{s.v}</Text>
                      <Text style={{ color: textSub, fontSize: 9, marginTop: 2 }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Platform cards */}
              <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 12 }}>PLATFORM RESULTS</Text>
              {swarmCards.map((card, i) => {
                const color = getPlatformColor(card.platform);
                const icon  = getPlatformIcon(card.platform);
                return (
                  <View key={i} style={{ backgroundColor: cardBg, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden', ...shadow(color) }}>
                    {/* Card header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: color + '10', borderBottomWidth: 1, borderBottomColor: cardBorder }}>
                      <Text style={{ fontSize: 20 }}>{icon}</Text>
                      <Text style={{ color, fontSize: 14, fontWeight: '700', flex: 1 }}>{card.platform}</Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {card.agentsContributed.map(id => (
                          <View key={id} style={{ backgroundColor: AGENT_META[id].color + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: AGENT_META[id].color + '40' }}>
                            <Text style={{ color: AGENT_META[id].color, fontSize: 9, fontWeight: '700' }}>{AGENT_META[id].badge}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={{ padding: 14, gap: 14 }}>
                      {/* Scout section */}
                      {(card.hook || card.hashtags) && (
                        <View style={{ backgroundColor: '#F43F5E0A', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F43F5E20' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Text style={{ color: '#F43F5E', fontSize: 10, fontWeight: '700' }}>⚡ VIRAL SCOUT  ·  Groq</Text>
                          </View>
                          {card.hook && (
                            <View style={{ marginBottom: 10 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>Hook A</Text>
                                <TouchableOpacity onPress={() => copyField(card.hook!, `sw-hookA-${i}`)} style={{ backgroundColor: '#F43F5E12', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#F43F5E25' }}>
                                  <Text style={{ color: '#F43F5E', fontSize: 9, fontWeight: '600' }}>{copiedField === `sw-hookA-${i}` ? '✓ Copied' : 'Copy'}</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={{ color: T.text, fontSize: 13, fontStyle: 'italic', lineHeight: 19 }}>"{card.hook}"</Text>
                            </View>
                          )}
                          {card.hookB && (
                            <View style={{ marginBottom: 10 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>Hook B</Text>
                                <TouchableOpacity onPress={() => copyField(card.hookB!, `sw-hookB-${i}`)} style={{ backgroundColor: '#F43F5E12', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#F43F5E25' }}>
                                  <Text style={{ color: '#F43F5E', fontSize: 9, fontWeight: '600' }}>{copiedField === `sw-hookB-${i}` ? '✓ Copied' : 'Copy'}</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={{ color: T.text, fontSize: 13, fontStyle: 'italic', lineHeight: 19 }}>"{card.hookB}"</Text>
                            </View>
                          )}
                          {card.hashtags && (
                            <View style={{ marginBottom: 6 }}>
                              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginBottom: 8 }}>Hashtag Heatmap  ·  tap to copy</Text>
                              <HashtagHeatmap hashtags={card.hashtags} color="#F43F5E" />
                            </View>
                          )}
                          {card.bestTime && (
                            <View style={{ backgroundColor: '#30D15812', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#30D15830', marginTop: 6 }}>
                              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginBottom: 3 }}>📅 Best Time</Text>
                              <Text style={{ color: '#30D158', fontSize: 12, fontWeight: '600' }}>{card.bestTime}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Architect section */}
                      {card.post && (
                        <View style={{ backgroundColor: '#5E5CE60A', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#5E5CE620' }}>
                          <Text style={{ color: '#5E5CE6', fontSize: 10, fontWeight: '700', marginBottom: 10 }}>✦ CONTENT ARCHITECT  ·  Gemini</Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>Full Post</Text>
                            <TouchableOpacity onPress={() => copyField(card.post!, `sw-post-${i}`)} style={{ backgroundColor: '#5E5CE612', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#5E5CE625' }}>
                              <Text style={{ color: '#5E5CE6', fontSize: 9, fontWeight: '600' }}>{copiedField === `sw-post-${i}` ? '✓ Copied' : 'Copy'}</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={{ color: T.text, fontSize: 13, lineHeight: 21, marginBottom: 12 }}>{card.post}</Text>
                          {card.cta && (
                            <View style={{ backgroundColor: color + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: color + '25', marginBottom: 12 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>Call to Action</Text>
                                <TouchableOpacity onPress={() => copyField(card.cta!, `sw-cta-${i}`)} style={{ backgroundColor: color + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: color + '35' }}>
                                  <Text style={{ color, fontSize: 9, fontWeight: '600' }}>{copiedField === `sw-cta-${i}` ? '✓ Copied' : 'Copy'}</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>{card.cta}</Text>
                            </View>
                          )}
                          {card.imagePrompt && (
                            <View style={{ backgroundColor: isDark ? '#0a0a1a' : '#F8F5FF', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#7B2FFF50' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: '#9B59B6', fontSize: 10, fontWeight: '700' }}>🎨 Visual Prompt  ·  Midjourney / DALL-E</Text>
                                <TouchableOpacity onPress={() => copyImagePrompt(card.imagePrompt, `sw-${card.platform}-${i}`)}
                                  style={{ backgroundColor: '#7B2FFF18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#7B2FFF40' }}>
                                  <Text style={{ color: '#9B59B6', fontSize: 10, fontWeight: '600' }}>
                                    {copiedPrompt === `sw-${card.platform}-${i}` ? '✓ Copied' : 'Copy'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={{ color: isDark ? '#c0a0ff' : '#6B46C1', fontSize: 12, lineHeight: 18 }}>{card.imagePrompt}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Strategist section */}
                      {(card.seoAngle || card.engagementTip || card.altAngle) && (
                        <View style={{ backgroundColor: '#0EA5E90A', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#0EA5E920' }}>
                          <Text style={{ color: '#0EA5E9', fontSize: 10, fontWeight: '700', marginBottom: 10 }}>◆ GROWTH STRATEGIST  ·  SambaNova</Text>
                          {card.seoAngle && (
                            <View style={{ marginBottom: 10 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>SEO & Discovery Angle</Text>
                                <TouchableOpacity onPress={() => copyField(card.seoAngle!, `sw-seo-${i}`)} style={{ backgroundColor: '#0EA5E912', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#0EA5E925' }}>
                                  <Text style={{ color: '#0EA5E9', fontSize: 9, fontWeight: '600' }}>{copiedField === `sw-seo-${i}` ? '✓ Copied' : 'Copy'}</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={{ color: T.text, fontSize: 12, lineHeight: 18 }}>{card.seoAngle}</Text>
                            </View>
                          )}
                          {card.engagementTip && (
                            <View style={{ marginBottom: 10 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>Engagement Psychology</Text>
                                <TouchableOpacity onPress={() => copyField(card.engagementTip!, `sw-eng-${i}`)} style={{ backgroundColor: '#0EA5E912', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#0EA5E925' }}>
                                  <Text style={{ color: '#0EA5E9', fontSize: 9, fontWeight: '600' }}>{copiedField === `sw-eng-${i}` ? '✓ Copied' : 'Copy'}</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={{ color: T.text, fontSize: 12, lineHeight: 18 }}>{card.engagementTip}</Text>
                            </View>
                          )}
                          {card.altAngle && (
                            <View style={{ backgroundColor: '#0EA5E912', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#0EA5E930' }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>Alternative Angle</Text>
                                <TouchableOpacity onPress={() => copyField(card.altAngle!, `sw-alt-${i}`)} style={{ backgroundColor: '#0EA5E912', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#0EA5E925' }}>
                                  <Text style={{ color: '#0EA5E9', fontSize: 9, fontWeight: '600' }}>{copiedField === `sw-alt-${i}` ? '✓ Copied' : 'Copy'}</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={{ color: '#0EA5E9', fontSize: 12, lineHeight: 18, fontStyle: 'italic' }}>"{card.altAngle}"</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          );
        })()}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 🤖 AUTOPILOT RESULTS                                    */}
        {/* ════════════════════════════════════════════════════════ */}
        {autopilotResult && (() => {
          const eng = getEngagementEstimate(autopilotResult.viral_probability);
          const vColor = viralColor(autopilotResult.viral_probability);
          return (
            <>
              {/* Viral Score */}
              <View style={{ backgroundColor: cardBg, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: vColor + '50', ...shadow(vColor) }}>
                <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 10 }}>VIRAL PROBABILITY</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                  <Text style={{ color: vColor, fontSize: 48, fontWeight: '800', letterSpacing: -2 }}>
                    {autopilotResult.viral_probability}<Text style={{ fontSize: 20 }}>%</Text>
                  </Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ height: 6, backgroundColor: isDark ? T.card : '#E5E5EA', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                      <View style={{ height: 6, borderRadius: 3, width: `${autopilotResult.viral_probability}%` as unknown as number, backgroundColor: vColor }} />
                    </View>
                    <Text style={{ color: textSub, fontSize: 11 }}>
                      {autopilotResult.viral_probability >= 80 ? '🔥 High viral potential' : autopilotResult.viral_probability >= 60 ? '⚡ Good reach expected' : '📈 Building momentum'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[{ icon: '👁️', label: 'Views', v: eng.views }, { icon: '❤️', label: 'Likes', v: eng.likes }, { icon: '🔁', label: 'Shares', v: eng.shares }, { icon: '💬', label: 'Comments', v: eng.comments }].map(s => (
                    <View key={s.label} style={{ flex: 1, backgroundColor: vColor + '10', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: vColor + '25', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</Text>
                      <Text style={{ color: vColor, fontSize: 11, fontWeight: '700' }}>{s.v}</Text>
                      <Text style={{ color: textSub, fontSize: 9, marginTop: 2 }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Platform Cards */}
              <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 12 }}>PLATFORM CONTENT</Text>
              {autopilotResult.platform_content.map((pc, i) => {
                const color = getPlatformColor(pc.platform);
                const icon  = getPlatformIcon(pc.platform);
                const promptKey = `ap-${pc.platform}-${i}`;
                const isLoadingAB = loadingAB[pc.platform] ?? false;
                const cardABHooks = abHooks[pc.platform] ?? null;
                const isLoadingTime = loadingBestTime[pc.platform] ?? false;
                const bestTime = bestTimes[pc.platform] ?? null;
                return (
                  <View key={i} style={{ backgroundColor: cardBg, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden', borderLeftWidth: 3, borderLeftColor: color, ...shadow(color) }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: color + '10', borderBottomWidth: 1, borderBottomColor: cardBorder }}>
                      <Text style={{ fontSize: 20 }}>{icon}</Text>
                      <Text style={{ color, fontSize: 14, fontWeight: '700', flex: 1 }}>{pc.platform}</Text>
                      <View style={{ backgroundColor: color + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: color + '35' }}>
                        <Text style={{ color, fontSize: 10, fontWeight: '600' }}>{tone}</Text>
                      </View>
                    </View>
                    <View style={{ padding: 14, gap: 12 }}>
                      <View style={{ backgroundColor: ACCENT + '0C', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: ACCENT + '25' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>🎣 Viral Hook</Text>
                          <TouchableOpacity onPress={() => copyField(pc.hook, `ap-hook-${i}`)} style={{ backgroundColor: ACCENT + '15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: ACCENT + '30' }}>
                            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '600' }}>{copiedField === `ap-hook-${i}` ? '✓ Copied' : 'Copy'}</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={{ color: T.text, fontSize: 13, fontStyle: 'italic', lineHeight: 19 }}>"{pc.hook}"</Text>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>Post Content</Text>
                          <TouchableOpacity onPress={() => copyField(pc.post, `ap-post-${i}`)} style={{ backgroundColor: ACCENT + '15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: ACCENT + '30' }}>
                            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '600' }}>{copiedField === `ap-post-${i}` ? '✓ Copied' : 'Copy'}</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={{ color: T.text, fontSize: 13, lineHeight: 21 }}>{pc.post}</Text>
                      </View>
                      <View>
                        <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginBottom: 8 }}>Hashtag Heatmap  ·  tap to copy</Text>
                        <HashtagHeatmap hashtags={pc.hashtags} color={color} />
                      </View>
                      <View style={{ backgroundColor: color + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: color + '25' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>Call to Action</Text>
                          <TouchableOpacity onPress={() => copyField(pc.cta, `ap-cta-${i}`)} style={{ backgroundColor: color + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: color + '30' }}>
                            <Text style={{ color, fontSize: 9, fontWeight: '600' }}>{copiedField === `ap-cta-${i}` ? '✓ Copied' : 'Copy'}</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>{pc.cta}</Text>
                      </View>
                      {pc.image_prompt && (
                        <View style={{ backgroundColor: isDark ? '#0a0a1a' : '#F8F5FF', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#7B2FFF50' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: '#9B59B6', fontSize: 10, fontWeight: '700' }}>🎨 Visual Prompt</Text>
                            <TouchableOpacity onPress={() => copyImagePrompt(pc.image_prompt ?? '', promptKey)}
                              style={{ backgroundColor: '#7B2FFF18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#7B2FFF40' }}>
                              <Text style={{ color: '#9B59B6', fontSize: 10, fontWeight: '600' }}>
                                {copiedPrompt === promptKey ? '✓ Copied' : 'Copy'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={{ color: isDark ? '#c0a0ff' : '#6B46C1', fontSize: 12, lineHeight: 18 }}>{pc.image_prompt}</Text>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => fetchABHooks(pc.platform)} disabled={isLoadingAB}
                          style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: cardABHooks ? ACCENT + '12' : cardBg, borderWidth: 1, borderColor: cardABHooks ? ACCENT + '50' : cardBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {isLoadingAB ? <ActivityIndicator size="small" color={ACCENT} /> : <Text style={{ fontSize: 12 }}>⚗️</Text>}
                          <Text style={{ color: cardABHooks ? ACCENT : textSub, fontSize: 11, fontWeight: '600' }}>{isLoadingAB ? 'Testing…' : 'A/B Hooks'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => fetchBestTime(pc.platform)} disabled={isLoadingTime}
                          style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: bestTime ? '#30D15812' : cardBg, borderWidth: 1, borderColor: bestTime ? '#30D15840' : cardBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {isLoadingTime ? <ActivityIndicator size="small" color="#30D158" /> : <Text style={{ fontSize: 12 }}>📅</Text>}
                          <Text style={{ color: bestTime ? '#30D158' : textSub, fontSize: 11, fontWeight: '600' }}>{isLoadingTime ? 'Analyzing…' : 'Best Time'}</Text>
                        </TouchableOpacity>
                      </View>
                      {cardABHooks && (
                        <View style={{ gap: 8 }}>
                          {[{ label: 'A', hook: cardABHooks.hookA, angle: cardABHooks.angleA, color: '#E1306C' }, { label: 'B', hook: cardABHooks.hookB, angle: cardABHooks.angleB, color: '#1DA1F2' }].map(v => (
                            <View key={v.label} style={{ backgroundColor: v.color + '0C', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: v.color + '35' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: v.color + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: v.color + '50' }}>
                                  <Text style={{ color: v.color, fontSize: 10, fontWeight: '700' }}>{v.label}</Text>
                                </View>
                                <View style={{ backgroundColor: v.color + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: v.color + '35' }}>
                                  <Text style={{ color: v.color, fontSize: 10, fontWeight: '600' }}>{v.angle}</Text>
                                </View>
                              </View>
                              <Text style={{ color: T.text, fontSize: 13, lineHeight: 19, fontStyle: 'italic' }}>"{v.hook}"</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {bestTime && (
                        <View style={{ backgroundColor: '#30D15810', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#30D15830' }}>
                          <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginBottom: 6 }}>📅 Optimal Window — {pc.platform}</Text>
                          <Text style={{ color: '#30D158', fontSize: 13, lineHeight: 19 }}>{bestTime}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* 3-Day Calendar */}
              <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 12 }}>3-DAY CONTENT CALENDAR</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {autopilotResult.content_calendar.map((d, i) => (
                  <View key={i} style={{ backgroundColor: cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: cardBorder, flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: ACCENT + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ACCENT + '30' }}>
                      <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700' }}>{d.day.replace('Day ', 'D')}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>{d.theme}</Text>
                      <Text style={{ color: textSub, fontSize: 12, lineHeight: 17 }}>{d.action}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          );
        })()}

        {/* Manual output */}
        {result ? (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderLeftWidth: 3, borderColor: cardBorder, borderLeftColor: ACCENT, ...shadow() }}>
            <Text style={{ color: T.text, fontSize: 13, lineHeight: 22 }}>{result}</Text>
          </View>
        ) : null}

        {/* Action buttons */}
        {hasOutput && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            <TouchableOpacity onPress={copy} style={{ flex: 1, padding: 12, backgroundColor: cardBg, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: cardBorder }}>
              <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>{copied ? '✓ Copied' : '📋 Copy'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Share.share({ message: getContentString() }).catch(() => {})} style={{ flex: 1, padding: 12, backgroundColor: cardBg, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: cardBorder }}>
              <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>📤 Share</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveToVault} style={{ flex: 1, padding: 12, backgroundColor: saved ? ACCENT + '15' : cardBg, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: saved ? ACCENT + '50' : cardBorder }}>
              <Text style={{ color: saved ? ACCENT : textSub, fontSize: 13, fontWeight: '600' }}>{saved ? '✓ Saved' : '🗄️ Vault'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Viral Thread Builder ────────────────────────────── */}
        {topic.trim() !== '' && (
          <>
            <TouchableOpacity onPress={() => setThreadOpen(o => !o)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: threadOpen ? '#1DA1F212' : cardBg,
                borderRadius: 16, padding: 14, marginBottom: 12,
                borderWidth: threadOpen ? 1.5 : 1, borderColor: threadOpen ? '#1DA1F260' : cardBorder,
                ...shadow(threadOpen ? '#1DA1F2' : undefined),
              }} activeOpacity={0.8}>
              <Text style={{ fontSize: 20 }}>🧵</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: threadOpen ? '#1DA1F2' : T.text, fontSize: 13, fontWeight: '600' }}>Viral Thread Builder</Text>
                  <View style={{ backgroundColor: '#1DA1F218', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ color: '#1DA1F2', fontSize: 9, fontWeight: '700' }}>SambaNova</Text>
                  </View>
                </View>
                <Text style={{ color: textSub, fontSize: 11, marginTop: 2 }}>Generate a complete 10-tweet viral thread</Text>
              </View>
              <Text style={{ color: textSub, fontSize: 13 }}>{threadOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {threadOpen && (
              <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1DA1F240', marginBottom: 16, marginTop: -6, ...shadow('#1DA1F2') }}>
                <TouchableOpacity onPress={buildThread} disabled={loadingThread}
                  style={{ backgroundColor: loadingThread ? (isDark ? T.card : '#E5E5EA') : '#1DA1F2', borderRadius: 12, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {loadingThread ? <ActivityIndicator size="small" color="#1DA1F2" /> : <Text>🧵</Text>}
                  <Text style={{ color: loadingThread ? textSub : '#fff', fontSize: 13, fontWeight: '600' }}>
                    {loadingThread ? 'Building thread…' : 'Generate 10-Tweet Thread'}
                  </Text>
                </TouchableOpacity>
                {thread.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>{thread.length} tweets ready</Text>
                    {thread.map(t => {
                      const typeColor = TWEET_TYPE_COLOR[t.type] ?? '#888';
                      const charCount = t.tweet.length;
                      const charOk = charCount <= 280;
                      return (
                        <View key={t.number} style={{ backgroundColor: isDark ? T.bg : '#F5F5F7', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: typeColor + '35', borderLeftWidth: 3, borderLeftColor: typeColor }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: typeColor + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: typeColor + '45' }}>
                                <Text style={{ color: typeColor, fontSize: 11, fontWeight: '700' }}>{t.number}</Text>
                              </View>
                              <View style={{ backgroundColor: typeColor + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                                <Text style={{ color: typeColor, fontSize: 10, fontWeight: '600' }}>{t.type}</Text>
                              </View>
                            </View>
                            <TouchableOpacity onPress={() => copyTweet(t.tweet, t.number)}
                              style={{ backgroundColor: '#1DA1F218', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#1DA1F235' }}>
                              <Text style={{ color: '#1DA1F2', fontSize: 10, fontWeight: '600' }}>{copiedTweet === t.number ? '✓ Copied' : 'Copy'}</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={{ color: T.text, fontSize: 13, lineHeight: 20, marginBottom: 10 }}>{t.tweet}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ flex: 1, height: 3, backgroundColor: isDark ? T.card : '#E5E5EA', borderRadius: 2, overflow: 'hidden' }}>
                              <View style={{ height: 3, borderRadius: 2, width: `${Math.min(100, Math.round((charCount / 280) * 100))}%` as unknown as number, backgroundColor: charOk ? '#1DA1F2' : '#FF3B30' }} />
                            </View>
                            <Text style={{ color: charOk ? textSub : '#FF3B30', fontSize: 10, fontWeight: '600' }}>{charCount}/280</Text>
                          </View>
                        </View>
                      );
                    })}
                    <TouchableOpacity
                      onPress={async () => {
                        const full = thread.map(t => `${t.number}/${thread.length} ${t.tweet}`).join('\n\n');
                        try { if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(full); } catch {}
                        Share.share({ message: full }).catch(() => {});
                      }}
                      style={{ marginTop: 4, padding: 12, backgroundColor: '#1DA1F218', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1DA1F235' }}>
                      <Text style={{ color: '#1DA1F2', fontSize: 13, fontWeight: '600' }}>📤 Copy & Share Full Thread</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
