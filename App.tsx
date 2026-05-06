import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, SafeAreaView,
  Linking, Platform,
} from 'react-native';
import { THEMES, ThemeKey } from './constants/themes';
import HomeScreen from './screens/HomeScreen';
import IntelScreen from './screens/IntelScreen';
import ForgeScreen from './screens/ForgeScreen';
import VaultScreen from './screens/VaultScreen';
import AboutScreen from './screens/AboutScreen';

const TABS = [
  { id: 'home',  icon: '⚡', label: 'HOME' },
  { id: 'intel', icon: '🧠', label: 'INTEL' },
  { id: 'forge', icon: '🔥', label: 'FORGE' },
  { id: 'vault', icon: '🗄️', label: 'VAULT' },
  { id: 'about', icon: '◈',  label: 'ABOUT' },
];

const API_KEY_PRESENT = !!process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const glowStyle = (color: string) =>
  Platform.OS === 'web'
    ? { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20 }
    : {};

function APIKeyWarningScreen() {
  const [blink, setBlink] = useState(true);
  React.useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* Glowing warning icon */}
      <View style={{
        width: 80, height: 80, borderRadius: 20, marginBottom: 24,
        backgroundColor: '#FF000015', borderWidth: 2, borderColor: '#FF0000',
        alignItems: 'center', justifyContent: 'center',
        ...(blink ? glowStyle('#FF0000') : {}),
      }}>
        <Text style={{ fontSize: 36 }}>⚠️</Text>
      </View>

      {/* Terminal-style header */}
      <View style={{ marginBottom: 6, alignItems: 'center' }}>
        <Text style={{ color: '#FF4444', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 4 }}>
          SYSTEM ALERT — AUTHORIZATION FAILURE
        </Text>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 }}>
          API KEY <Text style={{ color: '#FF4444' }}>NOT FOUND</Text>
        </Text>
      </View>

      {/* Blinking cursor row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
        <Text style={{ color: '#FF4444', fontSize: 11, fontFamily: 'monospace' }}>
          {'> EXPO_PUBLIC_GEMINI_API_KEY '}
        </Text>
        <Text style={{ color: blink ? '#FF4444' : 'transparent', fontSize: 11, fontFamily: 'monospace' }}>
          ▌
        </Text>
      </View>

      {/* Info card */}
      <View style={{
        backgroundColor: '#0d0d0d', borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: '#FF444430', width: '100%', marginBottom: 24,
      }}>
        <Text style={{ color: '#FF6666', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 12 }}>
          ▸ HOW TO FIX THIS
        </Text>
        {[
          '1. Open Replit Secrets (🔒 icon in sidebar)',
          '2. Click "New Secret"',
          '3. Key: EXPO_PUBLIC_GEMINI_API_KEY',
          '4. Value: your Gemini API key',
          '5. Restart the application',
        ].map((line, i) => (
          <Text key={i} style={{ color: '#ccc', fontSize: 12, lineHeight: 22, fontFamily: 'monospace' }}>
            {line}
          </Text>
        ))}
      </View>

      {/* Get API key button */}
      <TouchableOpacity
        onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
        style={{
          backgroundColor: '#FF444420', borderRadius: 14, paddingVertical: 14,
          paddingHorizontal: 28, borderWidth: 1.5, borderColor: '#FF4444',
          flexDirection: 'row', alignItems: 'center', gap: 10,
          ...glowStyle('#FF4444'),
        }}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 16 }}>🔑</Text>
        <Text style={{ color: '#FF4444', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>
          GET FREE GEMINI API KEY ↗
        </Text>
      </TouchableOpacity>

      <Text style={{ color: '#333', fontSize: 9, marginTop: 20, letterSpacing: 2 }}>
        NEXA PRO — NEURAL CORE OFFLINE
      </Text>
    </SafeAreaView>
  );
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [theme, setTheme] = useState<ThemeKey>('cyber');
  const T = THEMES[theme];

  if (!API_KEY_PRESENT) return <APIKeyWarningScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={{ flex: 1 }}>
        {tab === 'home'  && <HomeScreen  theme={theme} setTheme={setTheme} />}
        {tab === 'intel' && <IntelScreen theme={theme} />}
        {tab === 'forge' && <ForgeScreen theme={theme} />}
        {tab === 'vault' && <VaultScreen theme={theme} />}
        {tab === 'about' && <AboutScreen theme={theme} />}
      </View>
      <View style={{
        flexDirection: 'row', backgroundColor: T.surface,
        borderTopWidth: 1, borderTopColor: T.card, paddingBottom: 8,
      }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id} onPress={() => setTab(t.id)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 }}
          >
            <Text style={{ fontSize: 18, opacity: tab === t.id ? 1 : 0.3 }}>{t.icon}</Text>
            <Text style={{
              fontSize: 7, fontWeight: '900', letterSpacing: 1,
              color: tab === t.id ? T.accent : T.muted,
            }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
