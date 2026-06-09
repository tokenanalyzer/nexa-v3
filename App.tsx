import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, SafeAreaView,
  Platform, Animated, Modal, ScrollView,
} from 'react-native';
import { THEMES, ThemeKey } from './constants/themes';
import { hasApiKey } from './constants/gemini';
import { getActiveAgents, AgentId } from './constants/agents';
import HomeScreen   from './screens/HomeScreen';
import IntelScreen  from './screens/IntelScreen';
import ForgeScreen  from './screens/ForgeScreen';
import VaultScreen  from './screens/VaultScreen';
import AboutScreen  from './screens/AboutScreen';
import ApiKeyScreen from './screens/ApiKeyScreen';

const TABS = [
  { id: 'home',  icon: '⚡', label: 'HOME'  },
  { id: 'intel', icon: '🧠', label: 'INTEL' },
  { id: 'forge', icon: '🔥', label: 'FORGE' },
  { id: 'vault', icon: '🗄️', label: 'VAULT' },
  { id: 'about', icon: '◈',  label: 'ABOUT' },
];

export default function App() {
  const [ready, setReady]       = useState(false);
  const [hasKey, setHasKey]     = useState(false);
  const [tab, setTab]           = useState('home');
  const [theme, setTheme]       = useState<ThemeKey>('light');
  const [keyModal, setKeyModal] = useState(false);
  const [activeAgents, setActiveAgents] = useState<AgentId[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const boot = async () => {
      const ok = await hasApiKey();
      setHasKey(ok);
      if (ok) getActiveAgents().then(setActiveAgents);
      setReady(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    };
    boot();
  }, []);

  const T = THEMES[theme];
  const isDark = T.isDark;

  const refreshAgents = async () => {
    const ok = await hasApiKey();
    setHasKey(ok);
    const agents = await getActiveAgents();
    setActiveAgents(agents);
  };

  // Loading splash
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <Text style={{ color: '#6C47FF', fontSize: 30, fontWeight: '800', letterSpacing: -1 }}>
          Nexa <Text style={{ color: '#0F172A' }}>AI</Text>
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 10, letterSpacing: 3 }}>LOADING...</Text>
      </View>
    );
  }

  // First-run: no key
  if (!hasKey) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <ApiKeyScreen
          onSaved={async () => {
            await refreshAgents();
          }}
        />
      </SafeAreaView>
    );
  }

  const tabBarBg: object = Platform.OS === 'web'
    ? ({
        background: isDark
          ? `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)`
          : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
      } as object)
    : { backgroundColor: isDark ? T.surface : '#FFFFFF' };

  const activeColor = '#6C47FF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? T.bg : '#F8FAFC' }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? T.bg : '#F8FAFC'}
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* API Keys modal */}
        <Modal visible={keyModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setKeyModal(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingVertical: 14,
              borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
            }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F172A' }}>AI Agent Keys</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  {activeAgents.length}/3 agents active
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setKeyModal(false)}
                style={{ backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} keyboardShouldPersistTaps="handled">
              <ApiKeyScreen
                inline
                onSaved={async () => {
                  await refreshAgents();
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

        {/* Tab bar */}
        <View style={[{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: isDark ? T.card : '#E2E8F0',
          paddingBottom: 6, paddingTop: 2,
        }, tabBarBg]}>
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
                    position: 'absolute', top: 0, left: '20%', right: '20%',
                    height: 2.5, borderRadius: 2, backgroundColor: activeColor,
                    ...(Platform.OS === 'web' ? { boxShadow: `0 0 8px ${activeColor}80` } as object : {}),
                  }} />
                )}
                <Text style={{ fontSize: 18, opacity: active ? 1 : 0.3 }}>{t.icon}</Text>
                <Text style={{
                  fontSize: 8, fontWeight: '700', letterSpacing: 0.5,
                  color: active ? activeColor : (isDark ? T.muted : '#94A3B8'),
                }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Key management button */}
          <TouchableOpacity
            onPress={() => setKeyModal(true)}
            style={{ width: 52, alignItems: 'center', paddingVertical: 8, gap: 3 }}
            activeOpacity={0.7}
          >
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 18, opacity: 0.4 }}>🔑</Text>
              {activeAgents.length > 1 && (
                <View style={{
                  position: 'absolute', top: -3, right: -4,
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1.5, borderColor: isDark ? T.bg : '#F8FAFC',
                }}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>{activeAgents.length}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 7, fontWeight: '700', letterSpacing: 0.5, color: isDark ? T.muted : '#94A3B8' }}>
              KEYS
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}
