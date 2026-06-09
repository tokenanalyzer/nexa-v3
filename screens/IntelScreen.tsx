import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';
import { streamMessage } from '../constants/gemini';
import { getAgentKey } from '../constants/agents';

interface Msg { role: 'user' | 'model'; text: string; agent?: 'groq' | 'gemini'; }

const QUICK = [
  { text: 'Viral Instagram Reel idea for 2026', icon: '📸' },
  { text: 'YouTube title that gets 1M views',   icon: '▶️'  },
  { text: 'LinkedIn post that gets 10K impressions', icon: '💼' },
  { text: 'Twitter/X thread topic this week',   icon: '🐦'  },
];

const AGENT_META = {
  groq:   { label: 'Groq · Llama 3.3',   color: '#F43F5E', badge: '⚡' },
  gemini: { label: 'Gemini 2.5 Flash',   color: '#6C47FF', badge: '✦' },
};

export default function IntelScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const isDark = T.isDark;
  const [msgs, setMsgs]           = useState<Msg[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [streaming, setStreaming] = useState('');
  const [activeAgent, setActiveAgent] = useState<'groq' | 'gemini'>('gemini');
  const [groqReady, setGroqReady] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const dotAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getAgentKey('groq').then(k => setGroqReady(!!k));
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(dotAnim, { toValue: 0.2, duration: 700, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const agentColor = AGENT_META[activeAgent].color;

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput(''); setStreaming('');
    const newMsgs: Msg[] = [...msgs, { role: 'user', text: q }];
    setMsgs(newMsgs);
    setLoading(true);

    try {
      const history = newMsgs.slice(0, -1).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      let accumulated = '';
      let detectedAgent: 'groq' | 'gemini' = 'gemini';
      await streamMessage(q, history, chunk => {
        accumulated += chunk;
        setStreaming(accumulated);
        scrollRef.current?.scrollToEnd({ animated: false });
      }, agent => { detectedAgent = agent; setActiveAgent(agent); });
      setMsgs(prev => [...prev, { role: 'model', text: accumulated, agent: detectedAgent }]);
      setStreaming('');
    } catch (e: unknown) {
      setMsgs(prev => [...prev, { role: 'model', text: 'Error: ' + (e instanceof Error ? e.message : String(e)) }]);
      setStreaming('');
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const dotOpacity = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  const bgStyle: object = Platform.OS === 'web'
    ? ({
        background: isDark
          ? `linear-gradient(160deg, ${T.bg} 0%, ${T.grad} 100%)`
          : 'linear-gradient(160deg, #F8FAFC 0%, #F1F5FF 100%)',
      } as object)
    : { backgroundColor: T.bg };

  const userBubbleBg = isDark ? T.accent : '#6C47FF';
  const botBubbleBg  = isDark ? T.surface : '#FFFFFF';
  const botBubbleBorder = isDark ? T.card : '#E2E8F0';

  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, bgStyle]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Header */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: isDark ? T.card : '#E2E8F0',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: isDark ? 'transparent' : '#FFFFFF',
      }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.text, letterSpacing: -0.5 }}>
            Intel <Text style={{ color: '#6C47FF' }}>Chat</Text>
          </Text>
          <Text style={{ color: T.muted, fontSize: 10, marginTop: 2, letterSpacing: 1 }}>
            MULTI-AGENT · FULL MEMORY
          </Text>
        </View>
        {/* Live agent badge */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: agentColor + '14', borderRadius: 20,
          paddingHorizontal: 10, paddingVertical: 6,
          borderWidth: 1, borderColor: agentColor + '35',
        }}>
          <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: agentColor, opacity: loading ? dotOpacity : 0.4 }} />
          <Text style={{ color: agentColor, fontSize: 10, fontWeight: '700' }}>
            {loading ? `${AGENT_META[activeAgent].badge} ${AGENT_META[activeAgent].label}` : groqReady ? '⚡ Groq Ready' : '✦ Gemini'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      >
        {msgs.length === 0 && !loading && (
          <View style={{ paddingTop: 32 }}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 18, marginBottom: 14,
                backgroundColor: '#6C47FF14', borderWidth: 1.5, borderColor: '#6C47FF30',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 28 }}>🧠</Text>
              </View>
              <Text style={{ color: T.text, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Ask anything</Text>
              <Text style={{ color: T.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                {groqReady ? '⚡ Groq agent active — ultra-fast responses' : 'Powered by Gemini 2.5 Flash'}
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {QUICK.map(q => (
                <TouchableOpacity
                  key={q.text} onPress={() => send(q.text)}
                  style={{
                    backgroundColor: isDark ? T.surface : '#FFFFFF',
                    borderRadius: 14, padding: 14,
                    borderWidth: 1, borderColor: isDark ? T.card : '#E2E8F0',
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } as object : {}),
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 18 }}>{q.icon}</Text>
                  <Text style={{ color: T.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{q.text}</Text>
                  <Text style={{ color: T.muted, fontSize: 16 }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {msgs.map((m, i) => (
          <View key={i} style={{ marginBottom: 14, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'model' && m.agent && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4, marginLeft: 4 }}>
                <Text style={{ color: AGENT_META[m.agent].color, fontSize: 10, fontWeight: '700' }}>
                  {AGENT_META[m.agent].badge} {AGENT_META[m.agent].label}
                </Text>
              </View>
            )}
            <View style={{
              maxWidth: '85%', padding: 14,
              borderRadius: m.role === 'user' ? 18 : 16,
              borderBottomRightRadius: m.role === 'user' ? 4 : 16,
              borderBottomLeftRadius:  m.role === 'model' ? 4 : 16,
              backgroundColor: m.role === 'user' ? userBubbleBg : botBubbleBg,
              borderWidth: m.role === 'model' ? 1 : 0,
              borderColor: botBubbleBorder,
              ...(Platform.OS === 'web' && m.role === 'model' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as object : {}),
            }}>
              <Text style={{
                color: m.role === 'user' ? '#fff' : T.text,
                fontSize: 14, lineHeight: 21,
                fontWeight: m.role === 'user' ? '600' : '400',
              }}>
                {m.text}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={{ marginBottom: 14, alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4, marginLeft: 4 }}>
              <Text style={{ color: agentColor, fontSize: 10, fontWeight: '700' }}>
                {AGENT_META[activeAgent].badge} {AGENT_META[activeAgent].label}
              </Text>
            </View>
            <View style={{
              maxWidth: '85%', padding: 14, borderRadius: 16, borderBottomLeftRadius: 4,
              backgroundColor: botBubbleBg, borderWidth: 1.5, borderColor: agentColor + '40',
              ...(Platform.OS === 'web' ? { boxShadow: `0 0 12px ${agentColor}22` } as object : {}),
            }}>
              {streaming ? (
                <Text style={{ color: T.text, fontSize: 14, lineHeight: 21 }}>
                  {streaming}<Text style={{ color: agentColor, fontWeight: '900' }}>▌</Text>
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 2 }}>
                  {[1, 0.5, 0.2].map((op, i) => (
                    <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: agentColor, opacity: dotOpacity }} />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={{
        paddingHorizontal: 14, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: isDark ? T.card : '#E2E8F0',
        flexDirection: 'row', gap: 10, alignItems: 'flex-end',
        backgroundColor: isDark ? 'transparent' : '#FFFFFF',
      }}>
        <View style={{
          flex: 1, borderRadius: 18,
          borderWidth: 1.5, borderColor: isDark ? T.card : '#E2E8F0',
          paddingHorizontal: 16, paddingVertical: 10,
          backgroundColor: isDark ? T.surface : '#F8FAFC',
        }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about content strategy…"
            placeholderTextColor={T.muted}
            style={{ color: T.text, fontSize: 14, maxHeight: 100 }}
            multiline
            editable={!loading}
            onSubmitEditing={() => send()}
          />
        </View>
        <TouchableOpacity
          onPress={() => send()}
          disabled={loading || !input.trim()}
          style={{
            width: 46, height: 46, borderRadius: 14,
            backgroundColor: input.trim() && !loading ? '#6C47FF' : (isDark ? T.surface : '#F1F5F9'),
            alignItems: 'center', justifyContent: 'center',
            ...(input.trim() && !loading && Platform.OS === 'web' ? { boxShadow: '0 4px 14px #6C47FF45' } as object : {}),
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>{loading ? '⏳' : '↑'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
