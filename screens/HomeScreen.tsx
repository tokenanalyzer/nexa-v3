import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Platform, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import { VAULT_STORAGE_KEY, VaultItem } from '../constants/vault';

const DAILY_TIPS = [
  { tip: 'Post Reels between 6–9 PM on weekdays — the algorithm rewards peak-hour uploads with 3× more reach.', icon: '📱' },
  { tip: 'Use exactly 3–5 hashtags on LinkedIn. More hurts reach. Precision > volume on professional platforms.', icon: '💼' },
  { tip: 'A hook in the first 3 seconds of a video retains 65% more viewers. Lead with the payoff, not the setup.', icon: '🎣' },
  { tip: 'Carousels get 3× more saves than single images. Use a cliffhanger on slide 1 to force swipes.', icon: '🎠' },
  { tip: 'Repurpose your top-performing content every 90 days. Most of your audience hasn\'t seen it yet.', icon: '♻️' },
  { tip: 'Twitter/X threads posted Tuesday–Thursday at 8 AM EST get 40% more engagement than weekend posts.', icon: '🐦' },
  { tip: 'End every post with a question. Comments signal the algorithm that your content sparks conversation.', icon: '💬' },
];

const GREETINGS = ['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night'];
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return GREETINGS[0];
  if (h >= 12 && h < 17) return GREETINGS[1];
  if (h >= 17 && h < 21) return GREETINGS[2];
  return GREETINGS[3];
};

const formatDate = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const glow = (color: string, radius = 16) =>
  Platform.OS === 'web'
    ? ({ boxShadow: `0 0 ${radius}px ${color}88` } as object)
    : { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: radius / 2, elevation: 6 };

const glassSurface = (accentHex: string) =>
  Platform.OS === 'web'
    ? ({
        background: `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
        backdropFilter: 'blur(12px)',
        borderColor: `${accentHex}25`,
      } as object)
    : { borderColor: `${accentHex}25` };

export default function HomeScreen({
  theme,
  setTheme,
  setTab,
}: {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  setTab?: (t: string) => void;
}) {
  const T = THEMES[theme];

  // ── Animated values ──────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const dotAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── State ────────────────────────────────────────────────────
  const [pulse, setPulse]           = useState([40, 70, 45, 90, 65, 100, 50, 80, 60, 85]);
  const [time, setTime]             = useState(new Date());
  const [vaultCount, setVaultCount] = useState(0);
  const [recentItems, setRecentItems] = useState<VaultItem[]>([]);
  const [typedGreeting, setTypedGreeting] = useState('');
  const [displayCount, setDisplayCount] = useState(0);

  const tipIndex = new Date().getDay();
  const tip = DAILY_TIPS[tipIndex];

  // ── Boot animations ──────────────────────────────────────────
  useEffect(() => {
    // Fade + slide in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();

    // Pulsing status dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(dotAnim, { toValue: 0.2, duration: 900, useNativeDriver: false }),
      ])
    ).start();

    // Neural pulse bars
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // ── Typing effect for greeting ───────────────────────────────
  useEffect(() => {
    const greeting = getGreeting() + ', Creator';
    let idx = 0;
    setTypedGreeting('');
    const iv = setInterval(() => {
      idx++;
      setTypedGreeting(greeting.slice(0, idx));
      if (idx >= greeting.length) clearInterval(iv);
    }, 48);
    return () => clearInterval(iv);
  }, []);

  // ── Live clock + pulse bars ──────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setTime(new Date());
      setPulse(Array.from({ length: 10 }, () => Math.floor(Math.random() * 70) + 20));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // ── Load vault data ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
        const items: VaultItem[] = raw ? JSON.parse(raw) : [];
        setVaultCount(items.length);
        setRecentItems(items.slice(0, 3));
        // Count-up animation for vault count
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
  }, []);

  // ── Premium bg style ─────────────────────────────────────────
  const bgStyle: object = Platform.OS === 'web'
    ? {
        background: theme === 'arctic'
          ? 'linear-gradient(160deg, #e8edf4 0%, #f5f7fa 50%, #eaeff5 100%)'
          : theme === 'cyber'
            ? 'linear-gradient(160deg, #020209 0%, #060618 40%, #020209 100%)'
            : theme === 'ocean'
              ? 'linear-gradient(160deg, #010a14 0%, #021828 40%, #010a14 100%)'
              : theme === 'inferno'
                ? 'linear-gradient(160deg, #0a0100 0%, #160500 40%, #0a0100 100%)'
                : 'linear-gradient(160deg, #060012 0%, #100028 40%, #060012 100%)',
      }
    : { backgroundColor: T.bg };

  const dotOpacity = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  return (
    <Animated.ScrollView
      style={[{ flex: 1 }, bgStyle as object]}
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <View>
            <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 3, marginBottom: 4 }}>
              NEURAL CORE v2.5
            </Text>
            <Text style={{ color: T.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
              NEXA <Text style={{ color: T.accent }}>AI</Text>
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {/* Live status badge */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: T.accent + '15', borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 5,
              borderWidth: 1, borderColor: T.accent + '40',
            }}>
              <Animated.View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: T.accent, opacity: dotOpacity,
              }} />
              <Text style={{ color: T.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>GEMINI LIVE</Text>
            </View>
            {/* System clock */}
            <Text style={{ color: T.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Greeting + date */}
        <View style={{ marginBottom: 22 }}>
          <Text style={{ color: T.text, fontSize: 18, fontWeight: '700', marginBottom: 3, letterSpacing: -0.3 }}>
            {typedGreeting}
            <Text style={{ color: T.accent }}>█</Text>
          </Text>
          <Text style={{ color: T.muted, fontSize: 10, letterSpacing: 1 }}>{formatDate()}</Text>
        </View>

        {/* ── Theme Switcher ──────────────────────────────────── */}
        <View style={{ marginBottom: 22 }}>
          <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 10 }}>
            THEME ENGINE
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(Object.keys(THEMES) as ThemeKey[]).map(k => (
                <TouchableOpacity
                  key={k}
                  onPress={() => setTheme(k)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    borderWidth: theme === k ? 1.5 : 1,
                    borderColor: theme === k ? THEMES[k].accent : THEMES[k].muted + '60',
                    backgroundColor: theme === k ? THEMES[k].accent + '18' : THEMES[k].surface,
                    ...(theme === k ? glow(THEMES[k].accent, 10) : {}),
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: theme === k ? THEMES[k].accent : T.muted, fontSize: 11, fontWeight: '900' }}>
                    {THEMES[k].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── Neural Pulse ───────────────────────────────────── */}
        <View style={[{
          borderRadius: 20, padding: 18, marginBottom: 18,
          borderWidth: 1, overflow: 'hidden',
        }, glassSurface(T.accent), Platform.OS !== 'web' && { backgroundColor: T.surface }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ color: T.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2 }}>⚡ NEURAL PULSE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Animated.View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: T.accent, opacity: dotOpacity }} />
              <Text style={{ color: T.muted, fontSize: 8 }}>LIVE</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 56, gap: 4 }}>
            {pulse.map((h, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: (h / 100) * 56,
                  borderRadius: 4,
                  backgroundColor: T.accent,
                  opacity: 0.3 + (i / pulse.length) * 0.7,
                }}
              />
            ))}
          </View>
        </View>

        {/* ── Stats Grid ─────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'VAULT ITEMS', value: displayCount.toString(), icon: '🗄️', color: T.accent },
            { label: 'AI MODEL', value: '2.5F', icon: '🧠', color: '#9D4DFF' },
            { label: 'PLATFORMS', value: '6', icon: '🌐', color: '#1DA1F2' },
          ].map(s => (
            <View
              key={s.label}
              style={[{
                flex: 1, borderRadius: 16, padding: 14,
                borderWidth: 1, alignItems: 'center', gap: 4,
              }, glassSurface(s.color), Platform.OS !== 'web' && { backgroundColor: T.surface }]}
            >
              <Text style={{ fontSize: 18 }}>{s.icon}</Text>
              <Text style={{ color: s.color, fontSize: 20, fontWeight: '900' }}>{s.value}</Text>
              <Text style={{ color: T.muted, fontSize: 6, fontWeight: '900', letterSpacing: 1, textAlign: 'center' }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── System Status Badges ────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'GEMINI 2.5 ONLINE', color: '#00FF9D' },
            { label: 'VAULT ACTIVE', color: T.accent },
            { label: 'ALL SYSTEMS GO', color: '#1DA1F2' },
          ].map(b => (
            <View key={b.label} style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: b.color + '12', borderRadius: 20,
              paddingHorizontal: 8, paddingVertical: 5,
              borderWidth: 1, borderColor: b.color + '30',
            }}>
              <Animated.View style={{
                width: 5, height: 5, borderRadius: 2.5,
                backgroundColor: b.color, opacity: dotOpacity,
              }} />
              <Text style={{ color: b.color, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 }}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Daily AI Marketing Tip ──────────────────────────── */}
        <View style={[{
          borderRadius: 20, padding: 18, marginBottom: 18,
          borderWidth: 1, borderLeftWidth: 3, borderLeftColor: T.accent,
        }, glassSurface(T.accent), Platform.OS !== 'web' && { backgroundColor: T.surface }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 18 }}>{tip.icon}</Text>
            <View>
              <Text style={{ color: T.accent, fontSize: 8, fontWeight: '900', letterSpacing: 2 }}>
                AI TIP OF THE DAY
              </Text>
              <Text style={{ color: T.muted, fontSize: 7, marginTop: 1 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} INSIGHT
              </Text>
            </View>
          </View>
          <Text style={{ color: T.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>
            "{tip.tip}"
          </Text>
        </View>

        {/* ── Recent Generations ──────────────────────────────── */}
        {recentItems.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 2 }}>
                RECENT GENERATIONS
              </Text>
              <TouchableOpacity onPress={() => setTab?.('vault')}>
                <Text style={{ color: T.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>
                  VIEW ALL ▸
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8 }}>
              {recentItems.map((item, i) => (
                <View
                  key={item.id}
                  style={[{
                    borderRadius: 14, padding: 14,
                    borderWidth: 1, flexDirection: 'row', gap: 12, alignItems: 'center',
                  }, glassSurface(T.accent), Platform.OS !== 'web' && { backgroundColor: T.surface }]}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: T.accent + '20', alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: T.accent + '40',
                  }}>
                    <Text style={{ color: T.accent, fontSize: 11, fontWeight: '900' }}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontSize: 12, fontWeight: '700', marginBottom: 3 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Text style={{ color: T.muted, fontSize: 9 }}>{item.platform}</Text>
                      <Text style={{ color: T.muted, fontSize: 9 }}>·</Text>
                      <Text style={{ color: T.muted, fontSize: 9 }}>{item.date}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Quick Actions ───────────────────────────────────── */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 12 }}>
            QUICK ACTIONS
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { icon: '🔥', label: 'FORGE\nCONTENT', tab: 'forge', color: T.accent },
              { icon: '🧠', label: 'ASK\nINTEL', tab: 'intel', color: '#9D4DFF' },
              { icon: '🗄️', label: 'OPEN\nVAULT', tab: 'vault', color: '#1DA1F2' },
            ].map(a => (
              <TouchableOpacity
                key={a.tab}
                onPress={() => setTab?.(a.tab)}
                style={[{
                  flex: 1, borderRadius: 16, paddingVertical: 16,
                  alignItems: 'center', borderWidth: 1, gap: 8,
                  ...(setTab ? glow(a.color, 8) : {}),
                }, glassSurface(a.color), Platform.OS !== 'web' && { backgroundColor: T.surface }]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                <Text style={{ color: a.color, fontSize: 8, fontWeight: '900', letterSpacing: 1, textAlign: 'center' }}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </Animated.View>
    </Animated.ScrollView>
  );
}
