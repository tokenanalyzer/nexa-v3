import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Share, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import { sendMessage, sendAutopilotMessage, PLATFORMS } from '../constants/gemini';
import { VAULT_STORAGE_KEY, VaultItem } from '../constants/vault';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'Hinglish'] as const;
type Language = typeof LANGUAGES[number];

interface PlatformContent {
  platform: string;
  hook: string;
  post: string;
  hashtags: string;
  cta: string;
}

interface CalendarDay {
  day: string;
  theme: string;
  action: string;
}

interface AutopilotResult {
  viral_probability: number;
  platform_content: PlatformContent[];
  content_calendar: CalendarDay[];
}

const getPlatformColor = (name: string): string => {
  const p = PLATFORMS.find(
    pl => pl.name.toLowerCase() === name.toLowerCase() || pl.id === name.toLowerCase()
  );
  return p?.color ?? '#666666';
};

const getPlatformIcon = (name: string): string => {
  const p = PLATFORMS.find(
    pl => pl.name.toLowerCase() === name.toLowerCase() || pl.id === name.toLowerCase()
  );
  return p?.icon ?? '📱';
};

const cleanJSON = (raw: string): string => {
  return raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
};

const glowStyle = (color: string) =>
  Platform.OS === 'web'
    ? { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12 }
    : { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 8 };

export default function ForgeScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const [topic, setTopic] = useState('');
  const [selected, setSelected] = useState<string[]>(['instagram']);
  const [language, setLanguage] = useState<Language>('English');
  const [autopilot, setAutopilot] = useState(false);
  const [result, setResult] = useState('');
  const [autopilotResult, setAutopilotResult] = useState<AutopilotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePlatform = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const forge = async () => {
    if (!topic.trim() || !selected.length || loading) return;
    setLoading(true);
    setResult('');
    setAutopilotResult(null);
    setSaved(false);

    if (autopilot) {
      const platformNames = selected.map(s => PLATFORMS.find(p => p.id === s)?.name ?? s);
      try {
        const raw = await sendAutopilotMessage(topic, platformNames, language);
        const cleaned = cleanJSON(raw);
        const parsed = JSON.parse(cleaned) as AutopilotResult;
        setAutopilotResult(parsed);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setResult('Parse error — raw response:\n\n' + msg);
      } finally {
        setLoading(false);
      }
    } else {
      const names = selected.map(s => PLATFORMS.find(p => p.id === s)?.name).join(', ');
      const prompt = `Create viral social media content in ${language} for: "${topic}" on platforms: ${names}. For each platform give: complete post, hashtags, viral hook, CTA. Make it trendy for 2026 audience.`;
      try {
        const reply = await sendMessage(prompt, []);
        setResult(reply);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setResult('Error: ' + msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const getContentString = (): string => {
    if (autopilotResult) {
      const lines: string[] = [
        `VIRAL PROBABILITY: ${autopilotResult.viral_probability}%`,
        '',
        '--- PLATFORM CONTENT ---',
      ];
      autopilotResult.platform_content.forEach(pc => {
        lines.push(`\n[${pc.platform}]`);
        lines.push(`HOOK: ${pc.hook}`);
        lines.push(`POST: ${pc.post}`);
        lines.push(`HASHTAGS: ${pc.hashtags}`);
        lines.push(`CTA: ${pc.cta}`);
      });
      lines.push('', '--- 3-DAY CALENDAR ---');
      autopilotResult.content_calendar.forEach(d => {
        lines.push(`${d.day} | ${d.theme}: ${d.action}`);
      });
      return lines.join('\n');
    }
    return result;
  };

  const hasOutput = !!result || !!autopilotResult;

  const copy = async () => {
    const text = getContentString();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const share = async () => {
    try {
      await Share.share({ message: getContentString() });
    } catch {}
  };

  const saveToVault = async () => {
    try {
      const existing = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      const items: VaultItem[] = existing ? JSON.parse(existing) : [];
      const platformLabel = selected
        .map(s => PLATFORMS.find(p => p.id === s)?.name ?? s)
        .join(', ');
      const newItem: VaultItem = {
        id: Date.now(),
        title: topic.slice(0, 60),
        content: getContentString(),
        date: new Date().toLocaleDateString(),
        platform: platformLabel,
      };
      const updated = [newItem, ...items];
      await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      Alert.alert('Vault Error', 'Could not save to vault.');
    }
  };

  const viralColor = (score: number): string => {
    if (score >= 80) return '#00FF9D';
    if (score >= 60) return '#FFD700';
    return '#FF4500';
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* Header */}
        <Text style={{ color: T.text, fontSize: 18, fontWeight: '900', marginBottom: 2 }}>
          FORGE <Text style={{ color: T.accent }}>CONTENT</Text>
        </Text>
        <Text style={{ color: T.muted, fontSize: 9, letterSpacing: 2, marginBottom: 20 }}>
          MULTI-PLATFORM AI GENERATOR
        </Text>

        {/* Copilot Auto-Pilot Toggle */}
        <TouchableOpacity
          onPress={() => setAutopilot(a => !a)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: autopilot ? T.accent + '18' : T.surface,
            borderRadius: 14, padding: 14, marginBottom: 16,
            borderWidth: 1.5, borderColor: autopilot ? T.accent : T.card,
            ...(autopilot ? glowStyle(T.accent) : {}),
          }}
          activeOpacity={0.8}
        >
          <View style={{
            width: 48, height: 26, borderRadius: 13,
            backgroundColor: autopilot ? T.accent : T.card,
            justifyContent: 'center', paddingHorizontal: 3,
          }}>
            <View style={{
              width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
              alignSelf: autopilot ? 'flex-end' : 'flex-start',
            }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: autopilot ? T.accent : T.text,
              fontWeight: '900', fontSize: 12, letterSpacing: 1,
            }}>
              ⚡ COPILOT AUTO-PILOT
            </Text>
            <Text style={{ color: T.muted, fontSize: 9, marginTop: 2 }}>
              {autopilot
                ? 'AUTONOMOUS — 3-Day Calendar + Viral Score + Platform Cards'
                : 'MANUAL MODE — Standard content generation'}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
            backgroundColor: autopilot ? T.accent : T.card,
          }}>
            <Text style={{ color: autopilot ? '#000' : T.muted, fontSize: 9, fontWeight: '900' }}>
              {autopilot ? 'ON' : 'OFF'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Language Selector */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 10 }}>
            🌐 LANGUAGE MATRIX
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
                    borderWidth: language === lang ? 1.5 : 1,
                    borderColor: language === lang ? T.accent : T.card,
                    backgroundColor: language === lang ? T.accent + '20' : T.surface,
                    ...(language === lang ? glowStyle(T.accent) : {}),
                  }}
                >
                  <Text style={{
                    color: language === lang ? T.accent : T.muted,
                    fontSize: 11, fontWeight: '900',
                  }}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Platform Selector */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 10 }}>
            🎯 TARGET PLATFORMS
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PLATFORMS.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => togglePlatform(p.id)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                  borderWidth: selected.includes(p.id) ? 1.5 : 1,
                  borderColor: selected.includes(p.id) ? p.color : T.card,
                  backgroundColor: selected.includes(p.id) ? p.color + '20' : T.surface,
                }}
              >
                <Text style={{
                  color: selected.includes(p.id) ? p.color : T.muted,
                  fontSize: 12, fontWeight: '700',
                }}>
                  {p.icon} {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Topic Input */}
        <View style={{
          backgroundColor: T.surface, borderRadius: 16, padding: 16,
          borderWidth: 1, borderColor: T.card, marginBottom: 14,
        }}>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder={autopilot ? 'Enter your topic for autonomous strategy...' : 'Enter your topic or idea...'}
            placeholderTextColor={T.muted}
            style={{ color: T.text, fontSize: 15, minHeight: 60 }}
            multiline
          />
        </View>

        {/* Forge Button */}
        <TouchableOpacity
          onPress={forge}
          disabled={loading || !topic.trim() || !selected.length}
          style={{
            backgroundColor: loading ? T.surface : T.accent,
            borderRadius: 14, height: 54,
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'row', gap: 10, marginBottom: 16,
            borderWidth: 1, borderColor: loading ? T.card : 'transparent',
            ...(!loading && topic.trim() ? glowStyle(T.accent) : {}),
          }}
          activeOpacity={0.85}
        >
          {loading && <ActivityIndicator color={T.accent} />}
          <Text style={{ color: loading ? T.muted : '#000', fontWeight: '900', fontSize: 14 }}>
            {loading
              ? (autopilot ? 'AUTOPILOT GENERATING...' : 'FORGING...')
              : autopilot
                ? `🤖 LAUNCH AUTOPILOT (${selected.length} PLATFORM${selected.length > 1 ? 'S' : ''})`
                : `⚡ FORGE FOR ${selected.length} PLATFORM${selected.length > 1 ? 'S' : ''}`}
          </Text>
        </TouchableOpacity>

        {/* ── AUTOPILOT OUTPUT ── */}
        {autopilotResult && (
          <>
            {/* Viral Score */}
            <View style={{
              backgroundColor: T.surface, borderRadius: 16, padding: 18, marginBottom: 16,
              borderWidth: 1.5, borderColor: viralColor(autopilotResult.viral_probability) + '80',
              ...glowStyle(viralColor(autopilotResult.viral_probability)),
            }}>
              <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 10 }}>
                ⚡ VIRAL PROBABILITY SCORE
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Text style={{
                  color: viralColor(autopilotResult.viral_probability),
                  fontSize: 48, fontWeight: '900',
                }}>
                  {autopilotResult.viral_probability}
                  <Text style={{ fontSize: 20 }}>%</Text>
                </Text>
                <View style={{ flex: 1 }}>
                  <View style={{
                    height: 8, backgroundColor: T.card, borderRadius: 4, overflow: 'hidden',
                  }}>
                    <View style={{
                      height: 8,
                      width: `${autopilotResult.viral_probability}%` as unknown as number,
                      backgroundColor: viralColor(autopilotResult.viral_probability),
                      borderRadius: 4,
                    }} />
                  </View>
                  <Text style={{ color: T.muted, fontSize: 9, marginTop: 6 }}>
                    {autopilotResult.viral_probability >= 80 ? '🔥 HIGH VIRALITY POTENTIAL' :
                      autopilotResult.viral_probability >= 60 ? '⚡ MODERATE VIRAL REACH' :
                        '📊 BUILDING MOMENTUM'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Platform Cards */}
            <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 12 }}>
              ▸ PLATFORM CONTENT CARDS
            </Text>
            {autopilotResult.platform_content.map((pc, i) => {
              const color = getPlatformColor(pc.platform);
              const icon = getPlatformIcon(pc.platform);
              return (
                <View key={i} style={{
                  backgroundColor: T.surface, borderRadius: 16, marginBottom: 14,
                  borderWidth: 1, borderColor: T.card,
                  borderLeftWidth: 3, borderLeftColor: color,
                  overflow: 'hidden',
                }}>
                  {/* Card Header */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    padding: 14, paddingBottom: 10,
                    backgroundColor: color + '12',
                    borderBottomWidth: 1, borderBottomColor: T.card,
                  }}>
                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                    <Text style={{ color: color, fontSize: 13, fontWeight: '900', flex: 1 }}>
                      {pc.platform.toUpperCase()}
                    </Text>
                    <View style={{
                      backgroundColor: color + '20', borderRadius: 6,
                      paddingHorizontal: 8, paddingVertical: 3,
                      borderWidth: 1, borderColor: color + '40',
                    }}>
                      <Text style={{ color, fontSize: 8, fontWeight: '900' }}>OPTIMIZED</Text>
                    </View>
                  </View>

                  <View style={{ padding: 14, gap: 12 }}>
                    {/* Hook */}
                    <View style={{
                      backgroundColor: T.accent + '10', borderRadius: 10, padding: 10,
                      borderWidth: 1, borderColor: T.accent + '30',
                    }}>
                      <Text style={{ color: T.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>
                        🎣 VIRAL HOOK
                      </Text>
                      <Text style={{ color: T.text, fontSize: 12, fontStyle: 'italic', lineHeight: 18 }}>
                        "{pc.hook}"
                      </Text>
                    </View>

                    {/* Post */}
                    <View>
                      <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }}>
                        📝 POST CONTENT
                      </Text>
                      <Text style={{ color: T.text, fontSize: 12, lineHeight: 20 }}>{pc.post}</Text>
                    </View>

                    {/* Hashtags */}
                    <View>
                      <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }}>
                        # HASHTAGS
                      </Text>
                      <Text style={{ color: color, fontSize: 11, lineHeight: 18 }}>{pc.hashtags}</Text>
                    </View>

                    {/* CTA */}
                    <View style={{
                      backgroundColor: color + '15', borderRadius: 8, padding: 10,
                      borderWidth: 1, borderColor: color + '30',
                    }}>
                      <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>
                        🚀 CALL TO ACTION
                      </Text>
                      <Text style={{ color: T.text, fontSize: 12, fontWeight: '700' }}>{pc.cta}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* 3-Day Content Calendar */}
            <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 12 }}>
              ▸ 3-DAY CONTENT CALENDAR
            </Text>
            <View style={{ gap: 10, marginBottom: 16 }}>
              {autopilotResult.content_calendar.map((d, i) => (
                <View key={i} style={{
                  backgroundColor: T.surface, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: T.card, flexDirection: 'row', gap: 12, alignItems: 'flex-start',
                }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 10,
                    backgroundColor: T.accent + '20', borderWidth: 1, borderColor: T.accent + '40',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: T.accent, fontSize: 9, fontWeight: '900' }}>{d.day.replace('Day ', 'D')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.accent, fontSize: 11, fontWeight: '900', marginBottom: 4 }}>
                      {d.theme}
                    </Text>
                    <Text style={{ color: T.muted, fontSize: 11, lineHeight: 16 }}>{d.action}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── NORMAL OUTPUT ── */}
        {result ? (
          <View style={{
            backgroundColor: T.surface, borderRadius: 16, padding: 16,
            borderWidth: 1, borderLeftWidth: 3, borderColor: T.card, borderLeftColor: T.accent,
            marginBottom: 16,
          }}>
            <Text style={{ color: T.text, fontSize: 13, lineHeight: 22 }}>{result}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        {hasOutput && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={copy}
              style={{
                flex: 1, padding: 12, backgroundColor: T.surface,
                borderRadius: 10, alignItems: 'center',
                borderWidth: 1, borderColor: T.card,
              }}
            >
              <Text style={{ color: T.accent, fontSize: 12, fontWeight: '900' }}>
                {copied ? '✅ COPIED!' : '📋 COPY'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={share}
              style={{
                flex: 1, padding: 12, backgroundColor: T.surface,
                borderRadius: 10, alignItems: 'center',
                borderWidth: 1, borderColor: T.card,
              }}
            >
              <Text style={{ color: T.accent, fontSize: 12, fontWeight: '900' }}>📤 SHARE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveToVault}
              style={{
                flex: 1, padding: 12,
                backgroundColor: saved ? T.accent + '20' : T.surface,
                borderRadius: 10, alignItems: 'center',
                borderWidth: 1, borderColor: saved ? T.accent : T.card,
              }}
            >
              <Text style={{ color: saved ? T.accent : T.muted, fontSize: 12, fontWeight: '900' }}>
                {saved ? '✅ SAVED!' : '🗄️ VAULT'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
