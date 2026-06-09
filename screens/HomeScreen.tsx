import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Platform, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import { VAULT_STORAGE_KEY, VaultItem } from '../constants/vault';
import { getActiveAgents, AgentId } from '../constants/agents';

const DAILY_TIPS = [
  { tip: 'Post Reels between 6–9 PM on weekdays — the algorithm rewards peak-hour uploads with 3× more reach.', icon: '📱' },
  { tip: 'Use exactly 3–5 hashtags on LinkedIn. More hurts reach. Precision > volume on professional platforms.', icon: '💼' },
  { tip: 'A hook in the first 3 seconds of a video retains 65% more viewers. Lead with the payoff, not the setup.', icon: '🎣' },
  { tip: 'Carousels get 3× more saves than single images. Use a cliffhanger on slide 1 to force swipes.', icon: '🎠' },
  { tip: 'Repurpose your top-performing content every 90 days. Most of your audience hasn\'t seen it yet.', icon: '♻️' },
  { tip: 'Twitter/X threads posted Tuesday–Thursday at 8 AM EST get 40% more engagement than weekend posts.', icon: '🐦' },
  { tip: 'End every post with a question. Comments signal the algorithm that your content sparks conversation.', icon: '💬' },
];

const AGENT_META: Record<AgentId, { label: string; color: string; badge: string; speed: string }> = {
  gemini: { label: 'Gemini 2.5',  color: '#6C47FF', badge: '✦', speed: 'Fast'    },
  groq:   { label: 'Groq Llama', color: '#F43F5E', badge: '⚡', speed: 'Fastest' },
  samba:  { label: 'SambaNova',  color: '#0EA5E9', badge: '◆', speed: 'Faster'  },
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Night';
};
const formatDate = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function HomeScreen({
  theme, setTheme, setTab,
}: {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  setTab?: (t: string) => void;
}) {
  const T = THEMES[theme];
  const isDark = T.isDark;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const dotAnim   = useRef(new Animated.Value(0)).current;

  const [pulse, setPulse]         = useState([40, 70, 45, 90, 65, 100, 50, 80, 60, 85]);
  const [time, setTime]           = useState(new Date());
  const [vaultCount, setVaultCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [recentItems, setRecentItems]   = useState<VaultItem[]>([]);
  const [typedGreeting, setTypedGreeting] = useState('');
  const [activeAgents, setActiveAgents]   = useState<AgentId[]>([]);

  const tipIndex = new Date().getDay();
  const tip = DAILY_TIPS[tipIndex];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(dotAnim, { toValue: 0.2, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const greeting = getGreeting() + ', Creator';
    let idx = 0;
    setTypedGreeting('');
    const iv = setInterval(() => {
      idx++;
      setTypedGreeting(greeting.slice(0, idx));
      if (idx >= greeting.length) clearInterval(iv);
    }, 45);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTime(new Date());
      setPulse(Array.from({ length: 10 }, () => Math.floor(Math.random() * 70) + 20));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
        const items: VaultItem[] = raw ? JSON.parse(raw) : [];
        setVaultCount(items.length);
        setRecentItems(items.slice(0, 3));
        let n = 0;
        const target = items.length;
        if (target === 0) return;
        const step = Math.max(1, Math.ceil(target / 20));
        const iv = setInterval(() => {
          n = Math.min(n + step, target);
          setDisplayCount(n);
          if (n >= target) clearInterval(iv);
        }, 50);
      } catch {}
    };
    load();
    getActiveAgents().then(setActiveAgents);
  }, []);

  const dotOpacity = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  // Background
  const bgStyle: object = Platform.OS === 'web'
    ? ({
        background: isDark
          ? theme === 'cyber'    ? 'linear-gradient(160deg,#020209 0%,#060618 100%)'
          : theme === 'ocean'   ? 'linear-gradient(160deg,#010a14 0%,#021828 100%)'
          : theme === 'inferno' ? 'linear-gradient(160deg,#0a0100 0%,#160500 100%)'
          :                       'linear-gradient(160deg,#060012 0%,#100028 100%)'
          : 'linear-gradient(160deg,#F8FAFC 0%,#F0F4FF 60%,#FAF5FF 100%)',
      } as object)
    : { backgroundColor: T.bg };

  const cardBg  = isDark ? T.surface : '#FFFFFF';
  const cardBorder = isDark ? T.card : '#E2E8F0';
  const textSub = isDark ? T.muted : '#94A3B8';

  const shadow = (color: string): object =>
    Platform.OS === 'web'
      ? { boxShadow: `0 4px 16px ${color}22` } as object
      : { shadowColor: color, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 };

  return (
    <Animated.ScrollView
      style={[{ flex: 1 }, bgStyle]}
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <View>
            <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 4 }}>
              NEURAL CORE v3.0
            </Text>
            <Text style={{ color: T.text, fontSize: 28, fontWeight: '800', letterSpacing: -1 }}>
              Nexa <Text style={{ color: '#6C47FF' }}>AI</Text>
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#6C47FF14', borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 6,
              borderWidth: 1, borderColor: '#6C47FF30',
            }}>
              <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#6C47FF', opacity: dotOpacity }} />
              <Text style={{ color: '#6C47FF', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>LIVE</Text>
            </View>
            <Text style={{ color: textSub, fontSize: 11, fontWeight: '600' }}>
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: T.text, fontSize: 19, fontWeight: '700', marginBottom: 3, letterSpacing: -0.3 }}>
            {typedGreeting}
            <Text style={{ color: '#6C47FF' }}>█</Text>
          </Text>
          <Text style={{ color: textSub, fontSize: 11, letterSpacing: 0.5 }}>{formatDate()}</Text>
        </View>

        {/* ── Active Agents Bar ───────────────────────────────── */}
        <View style={{
          backgroundColor: cardBg, borderRadius: 16, padding: 14, marginBottom: 18,
          borderWidth: 1, borderColor: cardBorder,
          ...shadow('#6C47FF'),
        }}>
          <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>
            🤖 ACTIVE AI AGENTS
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['gemini', 'groq', 'samba'] as AgentId[]).map(id => {
              const meta = AGENT_META[id];
              const isActive = activeAgents.includes(id);
              return (
                <View key={id} style={{
                  flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4,
                  backgroundColor: isActive ? meta.color + '12' : (isDark ? T.card : '#F8FAFC'),
                  borderWidth: 1.5,
                  borderColor: isActive ? meta.color + '40' : cardBorder,
                }}>
                  <Text style={{ fontSize: 14, color: isActive ? meta.color : textSub, fontWeight: '800' }}>
                    {meta.badge}
                  </Text>
                  <Text style={{ color: isActive ? meta.color : textSub, fontSize: 9, fontWeight: '700', textAlign: 'center' }}>
                    {meta.label}
                  </Text>
                  <View style={{
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
                    backgroundColor: isActive ? meta.color + '18' : 'transparent',
                  }}>
                    <Text style={{ color: isActive ? meta.color : textSub, fontSize: 8, fontWeight: '700' }}>
                      {isActive ? meta.speed : 'No Key'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Theme Switcher ──────────────────────────────────── */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>
            THEME
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(Object.keys(THEMES) as ThemeKey[]).map(k => {
                const active = theme === k;
                const themeAccent = THEMES[k].accent;
                return (
                  <TouchableOpacity
                    key={k} onPress={() => setTheme(k)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? themeAccent : cardBorder,
                      backgroundColor: active ? themeAccent + '18' : cardBg,
                      ...(active && Platform.OS === 'web' ? { boxShadow: `0 0 10px ${themeAccent}40` } as object : {}),
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: active ? themeAccent : textSub, fontSize: 11, fontWeight: '700' }}>
                      {THEMES[k].name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── Stats Grid ─────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'VAULT', value: displayCount.toString(), icon: '🗄️', color: '#6C47FF' },
            { label: 'MODEL',  value: '2.5F',                 icon: '🧠', color: '#F43F5E' },
            { label: 'TARGETS', value: '6',                   icon: '🎯', color: '#0EA5E9' },
          ].map(s => (
            <View key={s.label} style={{
              flex: 1, borderRadius: 16, padding: 14,
              borderWidth: 1, alignItems: 'center', gap: 4,
              backgroundColor: cardBg, borderColor: cardBorder,
              ...shadow(s.color),
            }}>
              <Text style={{ fontSize: 20 }}>{s.icon}</Text>
              <Text style={{ color: s.color, fontSize: 22, fontWeight: '800' }}>{s.value}</Text>
              <Text style={{ color: textSub, fontSize: 7, fontWeight: '700', letterSpacing: 1 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Neural Pulse ───────────────────────────────────── */}
        <View style={{
          backgroundColor: cardBg, borderRadius: 18, padding: 16, marginBottom: 18,
          borderWidth: 1, borderColor: cardBorder, ...shadow('#6C47FF'),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: '#6C47FF', fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>⚡ NEURAL PULSE</Text>
            <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Animated.View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981', opacity: dotOpacity }} />
              <Text style={{ color: '#10B981', fontSize: 8, fontWeight: '700' }}>LIVE</Text>
            </Animated.View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 50, gap: 4 }}>
            {pulse.map((h, i) => (
              <View key={i} style={{
                flex: 1, height: (h / 100) * 50, borderRadius: 4,
                backgroundColor: '#6C47FF',
                opacity: 0.25 + (i / pulse.length) * 0.75,
              }} />
            ))}
          </View>
        </View>

        {/* ── Daily AI Tip ────────────────────────────────────── */}
        <View style={{
          backgroundColor: cardBg, borderRadius: 18, padding: 18, marginBottom: 18,
          borderWidth: 1, borderColor: cardBorder,
          borderLeftWidth: 4, borderLeftColor: '#6C47FF',
          ...shadow('#6C47FF'),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 20 }}>{tip.icon}</Text>
            <View>
              <Text style={{ color: '#6C47FF', fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>AI TIP OF THE DAY</Text>
              <Text style={{ color: textSub, fontSize: 8, marginTop: 1 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={{ color: T.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>
            "{tip.tip}"
          </Text>
        </View>

        {/* ── Recent Generations ──────────────────────────────── */}
        {recentItems.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>RECENT GENERATIONS</Text>
              <TouchableOpacity onPress={() => setTab?.('vault')}>
                <Text style={{ color: '#6C47FF', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>VIEW ALL →</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8 }}>
              {recentItems.map((item, i) => (
                <View key={item.id} style={{
                  backgroundColor: cardBg, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: cardBorder,
                  flexDirection: 'row', gap: 12, alignItems: 'center',
                  ...shadow('#6C47FF'),
                }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: '#6C47FF14', alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: '#6C47FF25',
                  }}>
                    <Text style={{ color: '#6C47FF', fontSize: 12, fontWeight: '800' }}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontSize: 13, fontWeight: '700', marginBottom: 3 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={{ color: textSub, fontSize: 10 }}>
                      {item.platform} · {item.date}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Quick Actions ───────────────────────────────────── */}
        <View>
          <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>
            QUICK ACTIONS
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { icon: '🔥', label: 'FORGE',  tab: 'forge', color: '#F43F5E' },
              { icon: '🧠', label: 'INTEL',  tab: 'intel', color: '#6C47FF' },
              { icon: '🗄️', label: 'VAULT',  tab: 'vault', color: '#0EA5E9' },
            ].map(a => (
              <TouchableOpacity
                key={a.tab} onPress={() => setTab?.(a.tab)}
                style={{
                  flex: 1, borderRadius: 16, paddingVertical: 18,
                  alignItems: 'center', borderWidth: 1.5, gap: 8,
                  backgroundColor: cardBg, borderColor: a.color + '35',
                  ...shadow(a.color),
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                <Text style={{ color: a.color, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </Animated.View>
    </Animated.ScrollView>
  );
}
