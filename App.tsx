import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, SafeAreaView,
  Platform, Animated, Modal, ScrollView,
} from 'react-native';
import { THEMES, ThemeKey } from './constants/themes';
import { hasApiKey } from './constants/gemini';
import HomeScreen  from './screens/HomeScreen';
import IntelScreen from './screens/IntelScreen';
import ForgeScreen from './screens/ForgeScreen';
import VaultScreen from './screens/VaultScreen';
import AboutScreen from './screens/AboutScreen';
import ApiKeyScreen from './screens/ApiKeyScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GEMINI_KEY_STORAGE } from './constants/gemini';

const TABS = [
  { id: 'home',  icon: '⚡', label: 'HOME'  },
  { id: 'intel', icon: '🧠', label: 'INTEL' },
  { id: 'forge', icon: '🔥', label: 'FORGE' },
  { id: 'vault', icon: '🗄️', label: 'VAULT' },
  { id: 'about', icon: '◈',  label: 'ABOUT' },
];

export default function App() {
  const [ready, setReady]         = useState(false);
  const [hasKey, setHasKey]       = useState(false);
  const [tab, setTab]             = useState('home');
  const [theme, setTheme]         = useState<ThemeKey>('cyber');
  const [keyModal, setKeyModal]   = useState(false);
  const [savedKey, setSavedKey]   = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check for API key on mount
  useEffect(() => {
    const boot = async () => {
      const ok = await hasApiKey();
      if (ok) {
        const stored = await AsyncStorage.getItem(GEMINI_KEY_STORAGE).catch(() => '');
        setSavedKey(stored || '');
      }
      setHasKey(ok);
      setReady(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: false }).start();
    };
    boot();
  }, []);

  const T = THEMES[theme];

  const tabBg: object = Platform.OS === 'web'
    ? ({
        background: theme === 'arctic'
          ? 'linear-gradient(180deg,#edf1f6 0%,#f5f7fa 100%)'
          : `linear-gradient(180deg,${T.surface} 0%,${T.bg} 100%)`,
      } as object)
    : { backgroundColor: T.surface };

  // ── Loading splash ───────────────────────────────────────────
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020209', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#020209" />
        <Text style={{ color: '#00FF9D', fontSize: 28, fontWeight: '900', letterSpacing: 1 }}>
          NEXA <Text style={{ color: '#fff' }}>AI</Text>
        </Text>
        <Text style={{ color: '#333', fontSize: 11, marginTop: 10, letterSpacing: 3 }}>INITIALIZING...</Text>
      </View>
    );
  }

  // ── First-run: no API key → show onboarding ──────────────────
  if (!hasKey) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
        <ApiKeyScreen
          onSaved={async () => {
            const ok = await hasApiKey();
            const stored = await AsyncStorage.getItem(GEMINI_KEY_STORAGE).catch(() => '');
            setSavedKey(stored || '');
            setHasKey(ok);
          }}
        />
      </SafeAreaView>
    );
  }

  // ── Main app ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* Key settings modal */}
        <Modal visible={keyModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setKeyModal(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
            {/* Modal header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingVertical: 14,
              borderBottomWidth: 1, borderBottomColor: '#E5E5EA', backgroundColor: '#F2F2F7',
            }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>API Key Settings</Text>
              <TouchableOpacity
                onPress={() => setKeyModal(false)}
                style={{ backgroundColor: '#E5E5EA', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#1C1C1E', fontSize: 14, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, backgroundColor: '#F2F2F7' }} keyboardShouldPersistTaps="handled">
              <ApiKeyScreen
                inline
                existingKey={savedKey}
                onSaved={async () => {
                  const stored = await AsyncStorage.getItem(GEMINI_KEY_STORAGE).catch(() => '');
                  setSavedKey(stored || '');
                  setKeyModal(false);
                }}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Screen content */}
        <View style={{ flex: 1 }}>
          {tab === 'home'  && <HomeScreen  theme={theme} setTheme={setTheme} setTab={setTab} />}
          {tab === 'intel' && <IntelScreen theme={theme} />}
          {tab === 'forge' && <ForgeScreen theme={theme} />}
          {tab === 'vault' && <VaultScreen theme={theme} />}
          {tab === 'about' && <AboutScreen theme={theme} />}
        </View>

        {/* Premium tab bar */}
        <View style={[{
          flexDirection: 'row', borderTopWidth: 1,
          borderTopColor: T.card, paddingBottom: 8, paddingTop: 2,
        }, tabBg]}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 8, gap: 3 }}
                activeOpacity={0.7}
              >
                {active && (
                  <View style={{
                    position: 'absolute', top: 0, left: '15%', right: '15%',
                    height: 2, borderRadius: 2, backgroundColor: T.accent,
                    ...(Platform.OS === 'web' ? { boxShadow: `0 0 8px ${T.accent}` } as object : {}),
                  }} />
                )}
                <Text style={{ fontSize: 18, opacity: active ? 1 : 0.28 }}>{t.icon}</Text>
                <Text style={{ fontSize: 7, fontWeight: '900', letterSpacing: 1, color: active ? T.accent : T.muted }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* API Key settings button — always visible */}
          <TouchableOpacity
            onPress={() => setKeyModal(true)}
            style={{ width: 50, alignItems: 'center', paddingVertical: 8, gap: 3 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, opacity: 0.5 }}>🔑</Text>
            <Text style={{ fontSize: 7, fontWeight: '900', letterSpacing: 1, color: T.muted }}>KEY</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}
