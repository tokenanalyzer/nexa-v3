import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';
import { streamMessage } from '../constants/gemini';

interface Message { role: 'user' | 'model'; parts: { text: string }[]; }
type AgentLabel = 'groq' | 'gemini';

const SUGGESTIONS = [
  'What are the top 3 content trends dominating 2026?',
  "Explain why short-form video still wins despite audience fatigue",
  'Write a 5-step LinkedIn growth strategy for a SaaS founder',
  'What psychological triggers make people share content?',
  'How do the top 1% of creators repurpose one idea into 10 pieces?',
];

export default function IntelScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const isDark = T.isDark;
  const cardBg     = isDark ? T.surface : '#FFFFFF';
  const cardBorder = isDark ? T.card    : '#E5E5EA';
  const textSub    = isDark ? T.muted   : '#6E6E73';
  const inputBg    = isDark ? T.bg      : '#F5F5F7';
  const ACCENT     = T.accent;

  const shadow = (): object =>
    Platform.OS === 'web'
      ? isDark
        ? { boxShadow: '0 0 14px rgba(0,0,0,0.4)' } as object
        : { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' } as object
      : {};

  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState('');
  const [streaming, setStreaming]        = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentLabel>('gemini');
  const [streamText, setStreamText]     = useState('');
  const [cursorOn, setCursorOn]         = useState(true);
  const [copiedIdx, setCopiedIdx]       = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const dotAnim   = useRef(new Animated.Value(0)).current;

  const AGENT_META: Record<AgentLabel, { label: string; badge: string; color: string; model: string }> = {
    groq:   { label: 'Groq',   badge: '⚡', color: '#F43F5E', model: 'Llama 3.3 70B' },
    gemini: { label: 'Gemini', badge: '✦', color: ACCENT,    model: '2.5 Flash'      },
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(dotAnim, { toValue: 0.2, duration: 700, useNativeDriver: false }),
      ])
    ).start();
    const iv = setInterval(() => setCursorOn(c => !c), 530);
    return () => clearInterval(iv);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setStreaming(true);
    setStreamText('');
    const userMsg: Message = { role: 'user', parts: [{ text }] };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    const history = messages.map(m => ({ role: m.role, parts: m.parts }));
    let accumulated = '';
    try {
      await streamMessage(
        text, history,
        chunk => { accumulated += chunk; setStreamText(accumulated); scrollRef.current?.scrollToEnd({ animated: false }); },
        agent => setCurrentAgent(agent as AgentLabel)
      );
    } catch (e: unknown) {
      accumulated = 'Error: ' + (e instanceof Error ? e.message : String(e));
      setStreamText(accumulated);
    }
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: accumulated }] }]);
    setStreamText(''); setStreaming(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const clearChat = () => { setMessages([]); setStreamText(''); setCopiedIdx(null); };

  const copyMsg = async (text: string, idx: number) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard)
        await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {}
  };

  const bgStyle: object = Platform.OS === 'web'
    ? ({
        background: !isDark
          ? 'linear-gradient(160deg,#F5F5F7 0%,#EEF0FF 100%)'
          : `linear-gradient(160deg, ${T.bg} 0%, ${T.grad} 100%)`,
      } as object)
    : { backgroundColor: T.bg };

  const agentMeta = AGENT_META[currentAgent];

  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, bgStyle]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: cardBorder,
        backgroundColor: isDark ? 'transparent' : '#FFFFFF',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: T.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
              Intel <Text style={{ color: ACCENT }}>Chat</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: agentMeta.color + '14', borderRadius: 10,
                paddingHorizontal: 9, paddingVertical: 4,
                borderWidth: 1, borderColor: agentMeta.color + '30',
              }}>
                <Animated.View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: agentMeta.color, opacity: dotAnim }} />
                <Text style={{ color: agentMeta.color, fontSize: 10, fontWeight: '600' }}>
                  {agentMeta.badge} {agentMeta.label} · {agentMeta.model}
                </Text>
              </View>
              {streaming && (
                <View style={{ backgroundColor: '#30D15814', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: '#30D158', fontSize: 10, fontWeight: '600' }}>Streaming…</Text>
                </View>
              )}
            </View>
          </View>
          {messages.length > 0 && !streaming && (
            <TouchableOpacity onPress={clearChat}
              style={{ padding: 9, backgroundColor: isDark ? T.card : '#F5F5F7', borderRadius: 10, borderWidth: 1, borderColor: cardBorder }}
              activeOpacity={0.7}>
              <Text style={{ color: textSub, fontSize: 12, fontWeight: '600' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages.length === 0 && !streaming && (
          <View style={{ paddingTop: 16 }}>
            <View style={{
              backgroundColor: cardBg, borderRadius: 20, padding: 20,
              borderWidth: 1, borderColor: ACCENT + '30', marginBottom: 20, ...shadow(),
            }}>
              <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 10 }}>🧠</Text>
              <Text style={{ color: T.text, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                Full-Memory AI Intel
              </Text>
              <Text style={{ color: textSub, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                Chat with Groq Llama 3.3 (fastest) or Gemini 2.5 Flash.{'\n'}Full conversation memory.
              </Text>
            </View>
            <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 12 }}>TRY ASKING</Text>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => setInput(s)}
                style={{ backgroundColor: cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: cardBorder, marginBottom: 8, ...shadow() }}
                activeOpacity={0.75}>
                <Text style={{ color: T.text, fontSize: 13, lineHeight: 19, marginBottom: 5 }}>{s}</Text>
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600' }}>Tap to use →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isCopied = copiedIdx === idx;
          return (
            <View key={idx} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '88%', marginBottom: 12 }}>
              {!isUser && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{
                      width: 20, height: 20, borderRadius: 6, backgroundColor: agentMeta.color + '18',
                      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: agentMeta.color + '30',
                    }}>
                      <Text style={{ fontSize: 9, color: agentMeta.color, fontWeight: '700' }}>{agentMeta.badge}</Text>
                    </View>
                    <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>{agentMeta.label}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => copyMsg(msg.parts[0].text, idx)}
                    style={{
                      marginLeft: 10,
                      backgroundColor: isCopied ? agentMeta.color + '18' : (isDark ? T.card : '#F5F5F7'),
                      borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
                      borderWidth: 1, borderColor: isCopied ? agentMeta.color + '40' : cardBorder,
                    }}
                    activeOpacity={0.7}>
                    <Text style={{ color: isCopied ? agentMeta.color : textSub, fontSize: 10, fontWeight: '600' }}>
                      {isCopied ? '✓ Copied' : '📋 Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{
                borderRadius: 18,
                borderBottomRightRadius: isUser ? 4 : 18,
                borderBottomLeftRadius: isUser ? 18 : 4,
                padding: 14,
                backgroundColor: isUser ? ACCENT : cardBg,
                borderWidth: isUser ? 0 : 1, borderColor: cardBorder,
                ...(!isUser ? shadow() : {}),
              }}>
                <Text style={{ color: isUser ? '#fff' : T.text, fontSize: 14, lineHeight: 22 }}>{msg.parts[0].text}</Text>
              </View>
            </View>
          );
        })}

        {streaming && streamText !== '' && (
          <View style={{ alignSelf: 'flex-start', maxWidth: '88%', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: agentMeta.color + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: agentMeta.color + '30' }}>
                <Text style={{ fontSize: 9, color: agentMeta.color, fontWeight: '700' }}>{agentMeta.badge}</Text>
              </View>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600' }}>{agentMeta.label}</Text>
            </View>
            <View style={{ backgroundColor: cardBg, borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: cardBorder, ...shadow() }}>
              <Text style={{ color: T.text, fontSize: 14, lineHeight: 22 }}>
                {streamText}<Text style={{ color: agentMeta.color, opacity: cursorOn ? 1 : 0 }}>▌</Text>
              </Text>
            </View>
          </View>
        )}

        {streaming && streamText === '' && (
          <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
            <View style={{ backgroundColor: cardBg, borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: cardBorder, flexDirection: 'row', gap: 8, alignItems: 'center', ...shadow() }}>
              <ActivityIndicator size="small" color={agentMeta.color} />
              <Text style={{ color: textSub, fontSize: 12 }}>{agentMeta.label} is thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: cardBorder, backgroundColor: isDark ? T.bg : '#FFFFFF' }}>
        {messages.length > 0 && (
          <Text style={{ color: textSub, fontSize: 10, textAlign: 'center', marginBottom: 10 }}>
            {messages.filter(m => m.role === 'user').length} messages · Full memory
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
          <View style={{
            flex: 1, backgroundColor: inputBg, borderRadius: 16,
            borderWidth: 1.5, borderColor: input.trim() ? ACCENT + '60' : cardBorder,
            paddingHorizontal: 14, paddingVertical: 11,
          }}>
            <TextInput value={input} onChangeText={setInput}
              placeholder="Ask anything about content strategy…"
              placeholderTextColor={textSub} multiline
              style={{ color: T.text, fontSize: 14, maxHeight: 100 }}
              onSubmitEditing={send} returnKeyType="send" blurOnSubmit={false} />
          </View>
          <TouchableOpacity onPress={send} disabled={streaming || !input.trim()}
            style={{
              width: 46, height: 46, borderRadius: 14,
              backgroundColor: streaming || !input.trim() ? (isDark ? T.card : '#E5E5EA') : ACCENT,
              alignItems: 'center', justifyContent: 'center',
              ...(input.trim() && !streaming && Platform.OS === 'web' ? { boxShadow: `0 4px 16px ${ACCENT}45` } as object : {}),
            }} activeOpacity={0.8}>
            {streaming
              ? <ActivityIndicator size="small" color={isDark ? ACCENT : '#8E8E93'} />
              : <Text style={{ color: input.trim() ? '#fff' : textSub, fontSize: 18, fontWeight: '700' }}>↑</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
