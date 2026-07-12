import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, SafeAreaView,
  Platform, Animated, Modal, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from './constants/themes';
import { hasApiKey } from './constants/gemini';
import { getActiveAgents, AgentId } from './constants/agents';
import HomeScreen        from './screens/HomeScreen';
import IntelScreen       from './screens/IntelScreen';
import ForgeScreen       from './screens/ForgeScreen';
import VaultScreen       from './screens/VaultScreen';
import AboutScreen       from './screens/AboutScreen';
import ApiKeyScreen      from './screens/ApiKeyScreen';
import SplashScreen      from './components/SplashScreen';
import OnboardingScreen  from './screens/OnboardingScreen';
import WhatsNewModal, { CURRENT_VERSION } from './components/WhatsNewModal';

const ONBOARDING_KEY  = 'nexa_onboarding_done';
const VERSION_KEY     = 'nexa_app_version';

const TABS = [
  { id: 'home',  icon: '⚡', label: 'Home'  },
  { id: 'intel', icon: '🧠', label: 'Intel' },
  { id: 'forge', icon: '🔥', label: 'Forge' },
  { id: 'vault', icon: '🗄️', label: 'Vault' },
  { id: 'about', icon: '◈',  label: 'About' },
];

export default function App() {
  const [ready, setReady]                   = useState(false);
  const [splashDone, setSplashDone]         = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [whatsNew, setWhatsNew]             = useState(false);
  const [hasKey, setHasKey]                 = useState(false);
  const [tab, setTab]                       = useState('home');
  const [theme, setTheme]                   = useState<ThemeKey>('light');
  const [keyModal, setKeyModal]             = useState(false);
  const [activeAgents, setActiveAgents]     = useState<AgentId[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const boot = async () => {
      const [ok, seen, savedVer] = await Promise.all([
        hasApiKey(),
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(VERSION_KEY),
      ]);
      setHasKey(ok);
      setOnboardingDone(!!seen);
      if (ok) getActiveAgents().then(setActiveAgents);
      // Show What's New if version changed and onboarding already done
      if (seen && savedVer && savedVer !== CURRENT_VERSION) {
        setWhatsNew(true);
      }
      if (savedVer !== CURRENT_VERSION) {
        await AsyncStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      }
      setReady(true);
    };
    boot();
  }, []);

  const handleSplashDone = () => {
    setSplashDone(true);
    if (onboardingDone) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    }
  };

  const handleOnboardingDone = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
  };

  const T = THEMES[theme];
  const isDark = T.isDark;

  const refreshAgents = async () => {
    const ok = await hasApiKey();
    setHasKey(ok);
    const agents = await getActiveAgents();
    setActiveAgents(agents);
  };

  // Splash screen
  if (!splashDone) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#07071A" />
        <SplashScreen onDone={handleSplashDone} />
      </>
    );
  }

  // First-launch onboarding
  if (!onboardingDone) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#07071A" />
        <OnboardingScreen onDone={handleOnboardingDone} />
      </>
    );
  }

  // First-run: no key
  if (!hasKey) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />
        <ApiKeyScreen onSaved={async () => { await refreshAgents(); }} />
      </SafeAreaView>
    );
  }

  const lightBg  = '#F5F5F7';
  const lightSurf = '#FFFFFF';
  const lightBord = '#E5E5EA';
  const lightMuted = '#6E6E73';

  const screenBg  = isDark ? T.bg      : lightBg;
  const surfaceBg = isDark ? T.surface : lightSurf;
  const borderCol = isDark ? T.card    : lightBord;

  const tabBarBg: object = Platform.OS === 'web'
    ? ({
        background: isDark
          ? `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)`
          : 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)',
      } as object)
    : { backgroundColor: surfaceBg };

  const activeColor = T.accent;

  const shadow: object = Platform.OS === 'web'
    ? ({ boxShadow: isDark ? `0 -1px 0 ${borderCol}` : '0 -1px 0 #E5E5EA' } as object)
    : {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBg }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={screenBg}
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* What's New modal */}
        <WhatsNewModal visible={whatsNew} onClose={() => setWhatsNew(false)} />

        {/* Keys modal */}
        <Modal visible={keyModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setKeyModal(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: lightBg }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingVertical: 14,
              borderBottomWidth: 1, borderBottomColor: lightBord,
              backgroundColor: lightSurf,
            }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#1D1D1F' }}>AI Agent Keys</Text>
                <Text style={{ fontSize: 11, color: lightMuted, marginTop: 2 }}>
                  {activeAgents.length}/3 agents active
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setKeyModal(false)}
                style={{ backgroundColor: '#F5F5F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: lightBord }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#1D1D1F', fontSize: 14, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, backgroundColor: lightBg }} keyboardShouldPersistTaps="handled">
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
          borderTopWidth: 1, borderTopColor: borderCol,
          paddingBottom: 6, paddingTop: 2,
        }, tabBarBg, shadow]}>
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
                    ...(Platform.OS === 'web' ? { boxShadow: `0 0 8px ${activeColor}60` } as object : {}),
                  }} />
                )}
                <Text style={{ fontSize: 18, opacity: active ? 1 : 0.35 }}>{t.icon}</Text>
                <Text style={{
                  fontSize: 9, fontWeight: '600', letterSpacing: 0.3,
                  color: active ? activeColor : (isDark ? T.muted : lightMuted),
                }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Keys button */}
          <TouchableOpacity
            onPress={() => setKeyModal(true)}
            style={{ width: 52, alignItems: 'center', paddingVertical: 8, gap: 3 }}
            activeOpacity={0.7}
          >
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 18, opacity: 0.45 }}>🔑</Text>
              {activeAgents.length > 1 && (
                <View style={{
                  position: 'absolute', top: -3, right: -5,
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: '#30D158', alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1.5, borderColor: surfaceBg,
                }}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>{activeAgents.length}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 8, fontWeight: '600', letterSpacing: 0.3, color: isDark ? T.muted : lightMuted }}>
              Keys
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}
