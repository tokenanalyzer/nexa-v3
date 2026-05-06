import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';

const ARCH_STATS = [
  { label: 'RUNTIME',   value: 'Expo 54',      icon: '⚡' },
  { label: 'AI ENGINE', value: 'Gemini 2.5',   icon: '🧠' },
  { label: 'PLATFORMS', value: '6 Targets',    icon: '🎯' },
  { label: 'VAULT',     value: 'AsyncStorage', icon: '🗄️' },
];

const LANGUAGES = [
  { code: 'EN', name: 'English',  desc: 'Global Reach — Default mode for worldwide audience targeting' },
  { code: 'HI', name: 'Hindi',    desc: 'भारत Market — 600M+ Hindi-speaking internet users' },
  { code: 'ES', name: 'Spanish',  desc: 'Mercado Latino — 500M+ Spanish speakers across 20 countries' },
  { code: 'HG', name: 'Hinglish', desc: "Gen-Z Blend — Urban India's viral language of choice" },
];

const STACK = [
  { name: 'React Native 0.81', role: 'Cross-platform UI core' },
  { name: 'TypeScript 5.9',    role: 'Type-safe architecture' },
  { name: 'Gemini 2.5 Flash',  role: 'Neural content engine' },
  { name: 'AsyncStorage',      role: 'Local vault persistence' },
  { name: 'React Native Web',  role: 'Browser rendering layer' },
];

export default function AboutScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const [githubGlow, setGithubGlow] = useState(false);

  const glowStyle = Platform.OS === 'web'
    ? { shadowColor: T.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 16 }
    : { elevation: 12, shadowColor: T.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 16 };

  const softGlow = Platform.OS === 'web'
    ? { shadowColor: T.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8 }
    : {};

  const openLink = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

      {/* ── Developer Profile Card ── */}
      <View style={{
        backgroundColor: T.surface, borderRadius: 20, padding: 20, marginBottom: 28,
        borderWidth: 1.5, borderColor: T.accent + '60',
        ...glowStyle,
      }}>
        {/* Top row: avatar + name */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          {/* Avatar */}
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: T.accent + '20',
            borderWidth: 2, borderColor: T.accent,
            alignItems: 'center', justifyContent: 'center',
            ...glowStyle,
          }}>
            <Text style={{ color: T.accent, fontSize: 22, fontWeight: '900' }}>AH</Text>
          </View>
          {/* Name + role */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: T.text, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>
              Adil Hussain
            </Text>
            <View style={{
              marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: T.accent + '15', borderRadius: 6,
              paddingHorizontal: 8, paddingVertical: 3,
              borderWidth: 1, borderColor: T.accent + '40', alignSelf: 'flex-start',
            }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.accent }} />
              <Text style={{ color: T.accent, fontSize: 8, fontWeight: '900', letterSpacing: 2 }}>
                CREATOR & DEVELOPER
              </Text>
            </View>
            <Text style={{ color: T.muted, fontSize: 9, marginTop: 6, letterSpacing: 1 }}>
              NEXA PRO — AUTONOMOUS MARKETING AI
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: T.card, marginBottom: 16 }} />

        {/* Contact links */}
        <View style={{ gap: 10 }}>
          {/* Email */}
          <TouchableOpacity
            onPress={() => openLink('mailto:adilhusain3176@gmail.com')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: T.bg, borderRadius: 12, padding: 12,
              borderWidth: 1, borderColor: T.card,
            }}
            activeOpacity={0.75}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: '#EA4335' + '20',
              borderWidth: 1, borderColor: '#EA4335' + '40',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 16 }}>📧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>EMAIL</Text>
              <Text style={{ color: T.text, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                adilhusain3176@gmail.com
              </Text>
            </View>
            <Text style={{ color: T.muted, fontSize: 14 }}>↗</Text>
          </TouchableOpacity>

          {/* Twitter/X */}
          <TouchableOpacity
            onPress={() => openLink('https://twitter.com/Husain3413')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: T.bg, borderRadius: 12, padding: 12,
              borderWidth: 1, borderColor: T.card,
            }}
            activeOpacity={0.75}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: '#1DA1F2' + '20',
              borderWidth: 1, borderColor: '#1DA1F2' + '40',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 16 }}>🐦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>X (TWITTER)</Text>
              <Text style={{ color: '#1DA1F2', fontSize: 12, fontWeight: '700', marginTop: 2 }}>@Husain3413</Text>
            </View>
            <Text style={{ color: T.muted, fontSize: 14 }}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Header ── */}
      <View style={{ marginBottom: 28 }}>
        <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 3, marginBottom: 6 }}>
          ◈ CREATOR DOSSIER
        </Text>
        <Text style={{ color: T.text, fontSize: 26, fontWeight: '900', letterSpacing: 1 }}>
          NEXA <Text style={{ color: T.accent }}>PRO</Text>
        </Text>
        <View style={{
          marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: T.accent + '15', borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 6,
          borderWidth: 1, borderColor: T.accent + '40', alignSelf: 'flex-start',
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.accent }} />
          <Text style={{ color: T.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2 }}>
            AUTONOMOUS MARKETING SYSTEM v3.0
          </Text>
        </View>
      </View>

      {/* ── System Architecture ── */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 3, marginBottom: 14 }}>
          ▸ SYSTEM ARCHITECTURE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {ARCH_STATS.map(s => (
            <View key={s.label} style={{
              flex: 1, minWidth: '44%',
              backgroundColor: T.surface, borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: T.card, alignItems: 'center',
              ...softGlow,
            }}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</Text>
              <Text style={{ color: T.accent, fontSize: 13, fontWeight: '900' }}>{s.value}</Text>
              <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', marginTop: 4, letterSpacing: 1 }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Multi-Language Matrix ── */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 3, marginBottom: 14 }}>
          ▸ MULTI-LANGUAGE MATRIX
        </Text>
        <View style={{ gap: 10 }}>
          {LANGUAGES.map(lang => (
            <View key={lang.code} style={{
              backgroundColor: T.surface, borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: T.card, flexDirection: 'row', gap: 14, alignItems: 'center',
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: T.accent + '20', alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: T.accent + '50',
              }}>
                <Text style={{ color: T.accent, fontSize: 11, fontWeight: '900' }}>{lang.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.text, fontSize: 13, fontWeight: '900', marginBottom: 3 }}>{lang.name}</Text>
                <Text style={{ color: T.muted, fontSize: 10, lineHeight: 15 }}>{lang.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Neural Stack ── */}
      <View style={{ marginBottom: 28 }}>
        <Text style={{ color: T.muted, fontSize: 9, fontWeight: '900', letterSpacing: 3, marginBottom: 14 }}>
          ▸ NEURAL STACK
        </Text>
        <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.card, overflow: 'hidden' }}>
          {STACK.map((item, i) => (
            <View key={item.name} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 14,
              borderBottomWidth: i < STACK.length - 1 ? 1 : 0,
              borderBottomColor: T.card,
            }}>
              <Text style={{ color: T.text, fontSize: 12, fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: T.muted, fontSize: 10 }}>{item.role}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── GitHub Vault ── */}
      <TouchableOpacity
        onPress={() => openLink('https://github.com')}
        onPressIn={() => setGithubGlow(true)}
        onPressOut={() => setGithubGlow(false)}
        style={{
          borderRadius: 16, padding: 18, backgroundColor: T.surface,
          borderWidth: 1.5, borderColor: T.accent,
          alignItems: 'center', marginBottom: 28,
          ...(githubGlow ? glowStyle : softGlow),
        }}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 28, marginBottom: 8 }}>🔗</Text>
        <Text style={{ color: T.accent, fontSize: 14, fontWeight: '900', letterSpacing: 2 }}>GITHUB VAULT</Text>
        <Text style={{ color: T.muted, fontSize: 10, marginTop: 4 }}>
          View source · Star repository · Fork & extend
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{ color: T.muted, fontSize: 9, letterSpacing: 2 }}>NEXA PRO — BUILD 3.0.0</Text>
        <Text style={{ color: T.muted, fontSize: 9, letterSpacing: 1 }}>by Adil Hussain • @Husain3413</Text>
        <Text style={{ color: T.card, fontSize: 9, letterSpacing: 1, marginTop: 2 }}>POWERED BY GEMINI 2.5 FLASH</Text>
      </View>

    </ScrollView>
  );
}
