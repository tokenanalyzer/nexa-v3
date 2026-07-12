import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Platform, Easing, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import { VAULT_STORAGE_KEY, VaultItem } from '../constants/vault';
import { getActiveAgents, AgentId } from '../constants/agents';

const DAILY_TIPS = [
  { tip: 'Post Reels between 6–9 PM on weekdays — the algorithm rewards peak-hour uploads with 3× more reach.', icon: '📱' },
  { tip: 'Use exactly 3–5 hashtags on LinkedIn. More hurts reach. Precision beats volume on professional platforms.', icon: '💼' },
  { tip: 'A hook in the first 3 seconds of a video retains 65% more viewers. Lead with the payoff, not the setup.', icon: '🎣' },
  { tip: 'Carousels get 3× more saves than single images. Use a cliffhanger on slide 1 to force swipes.', icon: '🎠' },
  { tip: 'Repurpose your top-performing content every 90 days. Most of your audience hasn\'t seen it yet.', icon: '♻️' },
  { tip: 'Twitter/X threads posted Tuesday–Thursday at 8 AM EST get 40% more engagement than weekend posts.', icon: '🐦' },
  { tip: 'End every post with a question. Comments signal the algorithm that your content sparks conversation.', icon: '💬' },
];

const AGENT_CARDS: { id: AgentId; label: string; role: string; color: string; badge: string }[] = [
  { id: 'gemini', label: 'Gemini',    role: 'Content Architect', color: '#5E5CE6', badge: '✦' },
  { id: 'groq',   label: 'Groq',      role: 'Viral Scout',       color: '#F43F5E', badge: '⚡' },
  { id: 'samba',  label: 'SambaNova', role: 'Growth Strategist', color: '#0EA5E9', badge: '◆' },
];

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

  const cardBg     = isDark ? T.surface : '#FFFFFF';
  const cardBorder = isDark ? T.card    : '#E5E5EA';
  const textSub    = isDark ? T.muted   : '#6E6E73';
  const ACCENT     = T.accent;

  const shadow = (color?: string): object =>
    Platform.OS !== 'web' ? {} :
    isDark && color
      ? { boxShadow: `0 0 20px ${color}35` } as object
      : { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } as object;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const dotAnim   = useRef(new Animated.Value(0)).current;

  const [pulse, setPulse]         = useState([40, 70, 45, 90, 65, 100, 50, 80, 60, 85]);
  const [time, setTime]           = useState(new Date());
  const [vaultCount, setVaultCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [recentItems, setRecentItems]   = useState<VaultItem[]>([]);
  const [typedGreeting, setTypedGreeting] = useState('');
  const [activeAgents, setActiveAgents]   = useState<AgentId[]>([]);

  const tip = DAILY_TIPS[new Date().getDay()];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: false }),
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
    }, 40);
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
    AsyncStorage.getItem(VAULT_STORAGE_KEY).then(raw => {
      const items: VaultItem[] = raw ? JSON.parse(raw) : [];
      setVaultCount(items.length); setRecentItems(items.slice(0, 3));
      let n = 0;
      if (!items.length) return;
      const step = Math.max(1, Math.ceil(items.length / 20));
      const iv = setInterval(() => {
        n = Math.min(n + step, items.length);
        setDisplayCount(n);
        if (n >= items.length) clearInterval(iv);
      }, 50);
    }).catch(() => {});
    getActiveAgents().then(setActiveAgents);
  }, []);

  const dotOpacity = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  const bgStyle: object = Platform.OS === 'web'
    ? ({
        background: !isDark
          ? 'linear-gradient(160deg,#F5F5F7 0%,#EEF0FF 60%,#F5F0FF 100%)'
          : theme === 'cyber'    ? 'linear-gradient(160deg,#020209 0%,#060618 100%)'
          : theme === 'ocean'   ? 'linear-gradient(160deg,#010a14 0%,#021828 100%)'
          : theme === 'inferno' ? 'linear-gradient(160deg,#0a0100 0%,#160500 100%)'
          :                       'linear-gradient(160deg,#060012 0%,#100028 100%)',
      } as object)
    : { backgroundColor: T.bg };

  return (
    <Animated.ScrollView style={[{ flex: 1 }, bgStyle]} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <View>
            <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 6 }}>NEURAL CORE v3.0</Text>
            <Image
              source={require('../assets/nexa-logo.png')}
              resizeMode="contain"
              style={{ width: 160, height: 56, marginTop: -4 }}
            />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: ACCENT + '14', borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 6,
              borderWidth: 1, borderColor: ACCENT + '30',
            }}>
              <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT, opacity: dotOpacity }} />
              <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '600' }}>LIVE</Text>
            </View>
            <Text style={{ color: textSub, fontSize: 12, fontWeight: '500' }}>
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={{ marginBottom: 26 }}>
          <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', letterSpacing: -0.3, marginBottom: 3 }}>
            {typedGreeting}<Text style={{ color: ACCENT }}>█</Text>
          </Text>
          <Text style={{ color: textSub, fontSize: 12 }}>{formatDate()}</Text>
        </View>

        {/* ── Agent Swarm Status ───────────────────────────────── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: cardBorder, ...shadow(ACCENT) }}>
          <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 14 }}>🤖  AGENT SWARM</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {AGENT_CARDS.map(a => {
              const isActive = activeAgents.includes(a.id);
              return (
                <View key={a.id} style={{
                  flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 5,
                  backgroundColor: isActive ? a.color + (isDark ? '18' : '10') : (isDark ? T.card : '#F5F5F7'),
                  borderWidth: 1.5,
                  borderColor: isActive ? a.color + '45' : cardBorder,
                }}>
                  <Text style={{ fontSize: 16, color: isActive ? a.color : textSub, fontWeight: '700' }}>{a.badge}</Text>
                  <Text style={{ color: isActive ? a.color : textSub, fontSize: 10, fontWeight: '600', textAlign: 'center' }}>{a.label}</Text>
                  <Text style={{ color: isActive ? a.color : textSub, fontSize: 9, textAlign: 'center', opacity: 0.8 }}>{a.role}</Text>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: isActive ? a.color + '18' : 'transparent' }}>
                    <Text style={{ color: isActive ? a.color : textSub, fontSize: 9, fontWeight: '600' }}>
                      {isActive ? 'Ready' : 'No Key'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          {activeAgents.length < 3 && (
            <Text style={{ color: textSub, fontSize: 11, marginTop: 12, textAlign: 'center' }}>
              Add Groq & SambaNova keys in the Keys tab to unlock full swarm
            </Text>
          )}
        </View>


        {/* ── Stats Row ────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Vault', value: displayCount.toString(), icon: '🗄️', color: ACCENT },
            { label: 'AI Model', value: '2.5F', icon: '🧠', color: '#F43F5E' },
            { label: 'Platforms', value: '6', icon: '🎯', color: '#0EA5E9' },
          ].map(s => (
            <View key={s.label} style={{
              flex: 1, borderRadius: 16, padding: 14,
              borderWidth: 1, alignItems: 'center', gap: 4,
              backgroundColor: cardBg, borderColor: cardBorder,
              ...shadow(s.color),
            }}>
              <Text style={{ fontSize: 20 }}>{s.icon}</Text>
              <Text style={{ color: s.color, fontSize: 22, fontWeight: '700' }}>{s.value}</Text>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Neural Pulse ─────────────────────────────────────── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: cardBorder, ...shadow(ACCENT) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600' }}>⚡  Neural Pulse</Text>
            <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Animated.View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#30D158', opacity: dotOpacity }} />
              <Text style={{ color: '#30D158', fontSize: 10, fontWeight: '600' }}>Live</Text>
            </Animated.View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 48, gap: 4 }}>
            {pulse.map((h, i) => (
              <View key={i} style={{
                flex: 1, height: (h / 100) * 48, borderRadius: 4,
                backgroundColor: ACCENT,
                opacity: 0.2 + (i / pulse.length) * 0.8,
              }} />
            ))}
          </View>
        </View>

        {/* ── AI Tip ───────────────────────────────────────────── */}
        <View style={{
          backgroundColor: cardBg, borderRadius: 18, padding: 18, marginBottom: 18,
          borderWidth: 1, borderColor: cardBorder,
          borderLeftWidth: 4, borderLeftColor: ACCENT,
          ...shadow(ACCENT),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Text style={{ fontSize: 20 }}>{tip.icon}</Text>
            <View>
              <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600' }}>AI Tip of the Day</Text>
              <Text style={{ color: textSub, fontSize: 10, marginTop: 1 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </Text>
            </View>
          </View>
          <Text style={{ color: T.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>"{tip.tip}"</Text>
        </View>

        {/* ── Recent Generations ──────────────────────────────── */}
        {recentItems.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: textSub, fontSize: 11, fontWeight: '600' }}>RECENT</Text>
              <TouchableOpacity onPress={() => setTab?.('vault')}>
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600' }}>View all →</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8 }}>
              {recentItems.map((item, i) => (
                <View key={item.id} style={{
                  backgroundColor: cardBg, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: cardBorder,
                  flexDirection: 'row', gap: 12, alignItems: 'center',
                  ...shadow(),
                }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: ACCENT + '14', alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: ACCENT + '25',
                  }}>
                    <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700' }}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontSize: 13, fontWeight: '600', marginBottom: 3 }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: textSub, fontSize: 11 }}>{item.platform} · {item.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Quick Actions ────────────────────────────────────── */}
        <View>
          <Text style={{ color: textSub, fontSize: 11, fontWeight: '600', marginBottom: 12 }}>QUICK ACTIONS</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { icon: '🔥', label: 'Forge',  tab: 'forge', color: '#F43F5E' },
              { icon: '🧠', label: 'Intel',  tab: 'intel', color: ACCENT     },
              { icon: '🗄️', label: 'Vault',  tab: 'vault', color: '#0EA5E9' },
            ].map(a => (
              <TouchableOpacity key={a.tab} onPress={() => setTab?.(a.tab)}
                style={{
                  flex: 1, borderRadius: 16, paddingVertical: 18,
                  alignItems: 'center', borderWidth: 1.5, gap: 8,
                  backgroundColor: cardBg, borderColor: a.color + '35',
                  ...shadow(a.color),
                }} activeOpacity={0.8}>
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                <Text style={{ color: a.color, fontSize: 12, fontWeight: '600' }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </Animated.View>
    </Animated.ScrollView>
  );
}
