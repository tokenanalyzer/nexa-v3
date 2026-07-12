import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Platform, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const ACCENT  = '#7C6EF8';
const ACCENT2 = '#A78BFA';
const BG      = '#07071A';

const SLIDES = [
  {
    icon: '⚡',
    iconBg: '#7C6EF820',
    iconBorder: '#7C6EF840',
    iconGlow: '#7C6EF8',
    title: 'Welcome to\nNEXA AI',
    sub: 'Your autonomous AI content army — 3 agents, 6 platforms, infinite viral potential.',
    tag: 'NEURAL CORE v1.0',
    visual: [
      { label: 'Gemini 2.5 Flash', role: 'Content Architect', color: '#7C6EF8' },
      { label: 'Groq Llama 3.3',   role: 'Viral Scout',       color: '#F43F5E' },
      { label: 'SambaNova Llama',  role: 'Growth Strategist', color: '#0EA5E9' },
    ],
  },
  {
    icon: '🔥',
    iconBg: '#F43F5E20',
    iconBorder: '#F43F5E40',
    iconGlow: '#F43F5E',
    title: 'FORGE\nContent Engine',
    sub: 'Generate viral posts, hashtags, hooks, threads & 3-day calendars for any platform instantly.',
    tag: 'AUTOPILOT · SWARM · MANUAL',
    visual: [
      { label: 'Instagram',  role: 'Reels · Stories · Carousels', color: '#E1306C' },
      { label: 'YouTube',    role: 'Shorts · Community · Hooks',  color: '#FF0000' },
      { label: 'LinkedIn',   role: 'Posts · Thought Leadership',  color: '#0A66C2' },
      { label: 'TikTok',     role: 'Viral Scripts · Trends',      color: '#69C9D0' },
      { label: 'Twitter/X',  role: '10-Tweet Threads · Hooks',    color: '#1D9BF0' },
      { label: 'WhatsApp',   role: 'Broadcast Messages',          color: '#25D366' },
    ],
  },
  {
    icon: '🧠',
    iconBg: '#0EA5E920',
    iconBorder: '#0EA5E940',
    iconGlow: '#0EA5E9',
    title: 'INTEL\nAI Chat',
    sub: 'Real-time streaming AI chat with full memory. Ask anything about content, trends, or growth strategy.',
    tag: 'LIVE STREAMING · PERSISTENT MEMORY',
    visual: [
      { label: '💬 Trend Analysis',     role: 'What\'s viral in your niche?',      color: '#0EA5E9' },
      { label: '📈 Growth Strategy',    role: 'Platform algorithm secrets',         color: '#7C6EF8' },
      { label: '✍️ Copywriting Help',   role: 'Hook, body, CTA formulas',          color: '#F43F5E' },
      { label: '🎯 Content Calendar',   role: 'AI-planned posting schedule',        color: '#10B981' },
    ],
  },
  {
    icon: '🗄️',
    iconBg: '#10B98120',
    iconBorder: '#10B98140',
    iconGlow: '#10B981',
    title: 'VAULT\nContent Library',
    sub: 'Save your best AI content, schedule posts with AI timing, and share instantly across platforms.',
    tag: 'SAVE · SCHEDULE · SHARE',
    visual: [
      { label: '📅 AI Scheduler',      role: 'Optimal post timing powered by AI',  color: '#10B981' },
      { label: '🔍 Smart Search',      role: 'Find any saved content instantly',    color: '#7C6EF8' },
      { label: '📤 One-tap Share',     role: 'Share to any app directly',           color: '#F43F5E' },
      { label: '🗂️ Full History',      role: 'Swarm sessions + intel logs',         color: '#0EA5E9' },
    ],
  },
  {
    icon: '🚀',
    iconBg: '#7C6EF820',
    iconBorder: '#7C6EF840',
    iconGlow: '#7C6EF8',
    title: 'Ready to\nDominate?',
    sub: 'Add your free AI API keys and start generating award-winning content in seconds.',
    tag: 'FREE TO USE · NO SUBSCRIPTION',
    visual: [
      { label: '1. Google Gemini',    role: 'aistudio.google.com → Get free key',  color: '#7C6EF8' },
      { label: '2. Groq (optional)',  role: 'console.groq.com → Free tier',        color: '#F43F5E' },
      { label: '3. SambaNova (opt.)', role: 'cloud.sambanova.ai → Free API',       color: '#0EA5E9' },
    ],
    isFinal: true,
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const scrollRef  = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);
  const dotAnims   = useRef(SLIDES.map(() => new Animated.Value(0))).current;
  const fadeAnim   = useRef(new Animated.Value(1)).current;

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
    setCurrent(idx);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== current) setCurrent(idx);
  };

  const finish = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 360, useNativeDriver: false }).start(onDone);
  };

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const glow = (color: string) =>
    Platform.OS === 'web' ? { boxShadow: `0 0 24px ${color}60` } as object : {};

  return (
    <Animated.View style={{ flex: 1, backgroundColor: BG, opacity: fadeAnim }}>

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity
          onPress={finish}
          style={{
            position: 'absolute', top: 52, right: 20, zIndex: 10,
            paddingHorizontal: 14, paddingVertical: 8,
            backgroundColor: '#FFFFFF10', borderRadius: 20,
            borderWidth: 1, borderColor: '#FFFFFF15',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#8080A0', fontSize: 12, fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, si) => (
          <View key={si} style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>

            {/* Top decoration */}
            <View style={{
              position: 'absolute', width: 320, height: 320, borderRadius: 160,
              top: -80, alignSelf: 'center',
              ...(Platform.OS === 'web'
                ? { background: `radial-gradient(circle, ${s.iconGlow}10 0%, transparent 70%)` } as object
                : { backgroundColor: s.iconGlow + '06' }),
            }} />

            {/* Icon badge */}
            <View style={{
              width: 88, height: 88, borderRadius: 26,
              backgroundColor: s.iconBg,
              borderWidth: 1.5, borderColor: s.iconBorder,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 28,
              ...glow(s.iconGlow),
            }}>
              <Text style={{ fontSize: 38 }}>{s.icon}</Text>
            </View>

            {/* Tag */}
            <View style={{
              backgroundColor: s.iconBg, borderRadius: 20,
              paddingHorizontal: 12, paddingVertical: 4,
              borderWidth: 1, borderColor: s.iconBorder,
              marginBottom: 16,
            }}>
              <Text style={{ color: s.iconGlow, fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>{s.tag}</Text>
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 34, fontWeight: '900', color: '#FFFFFF',
              letterSpacing: -1.2, textAlign: 'center', lineHeight: 40, marginBottom: 14,
              ...(Platform.OS === 'web' ? { textShadow: `0 0 40px ${s.iconGlow}60` } as object : {}),
            }}>{s.title}</Text>

            {/* Subtitle */}
            <Text style={{
              fontSize: 14, color: '#8080A0', textAlign: 'center',
              lineHeight: 22, marginBottom: 28, paddingHorizontal: 4,
            }}>{s.sub}</Text>

            {/* Visual cards */}
            <View style={{ width: '100%', gap: 8 }}>
              {s.visual.map((v, vi) => (
                <View key={vi} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: '#0E0E2A', borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 11,
                  borderWidth: 1, borderColor: '#1A1A3A',
                }}>
                  <View style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: v.color,
                    ...(Platform.OS === 'web' ? { boxShadow: `0 0 6px ${v.color}` } as object : {}),
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{v.label}</Text>
                    <Text style={{ color: '#5A5A7A', fontSize: 10, marginTop: 1 }}>{v.role}</Text>
                  </View>
                </View>
              ))}
            </View>

          </View>
        ))}
      </ScrollView>

      {/* Bottom — dots + button */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 48, paddingTop: 20, alignItems: 'center', gap: 20 }}>

        {/* Dot indicators */}
        <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
              <View style={{
                height: 6, borderRadius: 3,
                backgroundColor: i === current ? ACCENT : '#1E1E3A',
                width: i === current ? 22 : 6,
                ...(i === current && Platform.OS === 'web'
                  ? { boxShadow: `0 0 8px ${ACCENT}` } as object : {}),
              }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={isLast ? finish : () => goTo(current + 1)}
          activeOpacity={0.85}
          style={{
            width: '100%', paddingVertical: 16, borderRadius: 16,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: ACCENT,
            ...(Platform.OS === 'web'
              ? { boxShadow: `0 4px 32px ${ACCENT}70, 0 0 0 1px ${ACCENT2}40` } as object : {}),
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>
            {isLast ? '🚀  Get Started' : 'Continue  →'}
          </Text>
        </TouchableOpacity>

        {/* Slide counter */}
        <Text style={{ color: '#3A3A5C', fontSize: 10, fontWeight: '500', letterSpacing: 1 }}>
          {current + 1} / {SLIDES.length}
        </Text>

      </View>

    </Animated.View>
  );
}
