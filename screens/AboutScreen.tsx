import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';

const AGENTS = [
  { badge: '✦', name: 'Gemini 2.5 Flash', role: 'Autopilot · Brand DNA · Visual prompts', color: '#6C47FF', speed: 'Fast' },
  { badge: '⚡', name: 'Groq Llama 3.3',  role: 'Intel chat · Trend Scout · A/B Hooks',  color: '#F43F5E', speed: 'Fastest' },
  { badge: '◆', name: 'SambaNova Llama', role: 'Thread Builder · Long-form content',      color: '#0EA5E9', speed: 'Faster' },
];

const STACK = [
  { name: 'Expo SDK 54',          role: 'Cross-platform runtime'    },
  { name: 'React Native 0.81',   role: 'Mobile UI core'            },
  { name: 'TypeScript 5.9',      role: 'Type-safe architecture'    },
  { name: 'Gemini 2.5 Flash',    role: 'Autopilot + Brand DNA'     },
  { name: 'Groq Llama 3.3 70B', role: 'Ultra-fast streaming chat' },
  { name: 'SambaNova Llama',     role: 'Long-form thread builder'  },
  { name: 'AsyncStorage',        role: 'Local vault persistence'   },
];

const LANGUAGES = [
  { code: 'EN', name: 'English',  desc: 'Global reach — default worldwide targeting' },
  { code: 'HI', name: 'Hindi',    desc: 'भारत Market — 600M+ Hindi-speaking users' },
  { code: 'ES', name: 'Spanish',  desc: 'Mercado Latino — 500M+ across 20 countries' },
  { code: 'HG', name: 'Hinglish', desc: "Gen-Z Blend — Urban India's viral language" },
];

export default function AboutScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const isDark = T.isDark;

  const cardBg     = isDark ? T.surface : '#FFFFFF';
  const cardBorder = isDark ? T.card    : '#E2E8F0';
  const textSub    = isDark ? T.muted   : '#94A3B8';
  const ACCENT     = '#6C47FF';

  const shadow = (color = '#6C47FF'): object =>
    Platform.OS === 'web'
      ? { boxShadow: `0 4px 16px ${color}18` } as object
      : { shadowColor: color, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 };

  const bgStyle: object = Platform.OS === 'web'
    ? ({
        background: isDark
          ? `linear-gradient(160deg, ${T.bg} 0%, ${T.grad} 100%)`
          : 'linear-gradient(160deg, #F8FAFC 0%, #F0F4FF 100%)',
      } as object)
    : { backgroundColor: T.bg };

  return (
    <ScrollView style={[{ flex: 1 }, bgStyle]} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 6 }}>◈ ABOUT</Text>
        <Text style={{ color: T.text, fontSize: 28, fontWeight: '800', letterSpacing: -1 }}>
          Nexa <Text style={{ color: ACCENT }}>Pro</Text>
        </Text>
        <View style={{
          marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: ACCENT + '14', borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1, borderColor: ACCENT + '30', alignSelf: 'flex-start',
        }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ACCENT }} />
          <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>
            MULTI-AGENT MARKETING AI v3.0
          </Text>
        </View>
      </View>

      {/* Developer card */}
      <View style={{
        backgroundColor: cardBg, borderRadius: 20, padding: 18, marginBottom: 20,
        borderWidth: 1.5, borderColor: ACCENT + '35', ...shadow(ACCENT),
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: ACCENT + '18', borderWidth: 2, borderColor: ACCENT + '40',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: ACCENT, fontSize: 18, fontWeight: '800' }}>AH</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: T.text, fontSize: 17, fontWeight: '800' }}>Adil Hussain</Text>
            <View style={{
              marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: ACCENT + '14', borderRadius: 6,
              paddingHorizontal: 8, paddingVertical: 3,
              borderWidth: 1, borderColor: ACCENT + '30', alignSelf: 'flex-start',
            }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACCENT }} />
              <Text style={{ color: ACCENT, fontSize: 8, fontWeight: '700', letterSpacing: 1.5 }}>CREATOR & DEVELOPER</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: cardBorder, marginBottom: 14 }} />
        <View style={{ gap: 8 }}>
          {[
            { icon: '📧', label: 'EMAIL', value: 'adilhusain3176@gmail.com', url: 'mailto:adilhusain3176@gmail.com', color: '#EA4335' },
            { icon: '🐦', label: 'X (TWITTER)', value: '@Husain3413', url: 'https://twitter.com/Husain3413', color: '#1DA1F2' },
          ].map(link => (
            <TouchableOpacity
              key={link.label}
              onPress={() => Linking.openURL(link.url).catch(() => {})}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: isDark ? T.bg : '#F8FAFC', borderRadius: 12, padding: 12,
                borderWidth: 1, borderColor: cardBorder,
              }}
              activeOpacity={0.75}
            >
              <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: link.color + '18', borderWidth: 1, borderColor: link.color + '35',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 15 }}>{link.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textSub, fontSize: 8, fontWeight: '700', letterSpacing: 1 }}>{link.label}</Text>
                <Text style={{ color: link.color, fontSize: 13, fontWeight: '700', marginTop: 2 }}>{link.value}</Text>
              </View>
              <Text style={{ color: textSub, fontSize: 16 }}>↗</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Multi-Agent System */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 14 }}>
          🤖 MULTI-AGENT SYSTEM
        </Text>
        <View style={{ gap: 10 }}>
          {AGENTS.map(a => (
            <View key={a.name} style={{
              backgroundColor: cardBg, borderRadius: 16, padding: 14,
              borderWidth: 1.5, borderColor: a.color + '35',
              flexDirection: 'row', gap: 12, alignItems: 'center',
              ...shadow(a.color),
            }}>
              <View style={{
                width: 42, height: 42, borderRadius: 12,
                backgroundColor: a.color + '14', alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: a.color + '35',
              }}>
                <Text style={{ color: a.color, fontSize: 16, fontWeight: '900' }}>{a.badge}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <Text style={{ color: T.text, fontSize: 13, fontWeight: '700' }}>{a.name}</Text>
                  <View style={{ backgroundColor: a.color + '18', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: a.color + '30' }}>
                    <Text style={{ color: a.color, fontSize: 8, fontWeight: '700' }}>{a.speed}</Text>
                  </View>
                </View>
                <Text style={{ color: textSub, fontSize: 11, lineHeight: 16 }}>{a.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Tech Stack */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 14 }}>
          ▸ NEURAL STACK
        </Text>
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden', ...shadow() }}>
          {STACK.map((item, i) => (
            <View key={item.name} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 14, borderBottomWidth: i < STACK.length - 1 ? 1 : 0, borderBottomColor: cardBorder,
            }}>
              <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: textSub, fontSize: 11 }}>{item.role}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Languages */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: textSub, fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 14 }}>
          ▸ LANGUAGE MATRIX
        </Text>
        <View style={{ gap: 8 }}>
          {LANGUAGES.map(lang => (
            <View key={lang.code} style={{
              backgroundColor: cardBg, borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: cardBorder, flexDirection: 'row', gap: 12, alignItems: 'center',
            }}>
              <View style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: ACCENT + '14', alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: ACCENT + '30',
              }}>
                <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '800' }}>{lang.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.text, fontSize: 13, fontWeight: '700', marginBottom: 3 }}>{lang.name}</Text>
                <Text style={{ color: textSub, fontSize: 11, lineHeight: 15 }}>{lang.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{ color: textSub, fontSize: 10, letterSpacing: 2 }}>NEXA PRO — BUILD 3.0.0</Text>
        <Text style={{ color: textSub, fontSize: 10 }}>by Adil Hussain · @Husain3413</Text>
        <Text style={{ color: cardBorder, fontSize: 9, marginTop: 4 }}>
          Gemini · Groq · SambaNova
        </Text>
      </View>

    </ScrollView>
  );
}
