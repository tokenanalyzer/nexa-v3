import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
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

export default function App() {
  const [tab, setTab] = useState('home');
  const [theme, setTheme] = useState<ThemeKey>('cyber');
  const T = THEMES[theme];

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
        flexDirection: 'row',
        backgroundColor: T.surface,
        borderTopWidth: 1, borderTopColor: T.card,
        paddingBottom: 8,
      }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
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
