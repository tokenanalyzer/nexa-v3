import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView, Platform, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import { VAULT_STORAGE_KEY, VaultItem } from '../constants/vault';

interface Stats {
  total: number;
  streak: number;
  peakDay: string;
  platformBreakdown: { platform: string; count: number; color: string }[];
  topTopics: string[];
  postsThisWeek: number;
  postsThisMonth: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E1306C', LinkedIn: '#0077B5', 'Twitter/X': '#1DA1F2',
  TikTok: '#FF0050', YouTube: '#FF0000', WhatsApp: '#25D366',
};
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STOP_WORDS = new Set(['a','an','the','and','or','but','for','to','of','in','on','with','is','are','was','were','my','i','you','your','we','it','this','that','about','how','what','why','when','can','will','do','be','at','by','from','have','has','not','more','make']);

function computeStats(items: VaultItem[]): Stats {
  const now = new Date();

  // Streak: consecutive days ending today
  const daySet = new Set(items.map(i => new Date(i.date).toDateString()));
  let streak = 0;
  const d = new Date(now);
  while (daySet.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  // Platform breakdown
  const pCount: Record<string, number> = {};
  items.forEach(i => { pCount[i.platform] = (pCount[i.platform] || 0) + 1; });
  const platformBreakdown = Object.entries(pCount)
    .sort((a, b) => b[1] - a[1])
    .map(([platform, count]) => ({ platform, count, color: PLATFORM_COLORS[platform] ?? '#7C6EF8' }));

  // Peak day
  const dayCount: Record<string, number> = {};
  items.forEach(i => {
    const day = DAYS[new Date(i.date).getDay()];
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  const peakDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  // Top topics (from titles)
  const wordCount: Record<string, number> = {};
  items.forEach(i => {
    (i.title ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
      .forEach(w => { wordCount[w] = (wordCount[w] || 0) + 1; });
  });
  const topTopics = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  // Posts this week / month
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
  const postsThisWeek  = items.filter(i => new Date(i.date) >= weekAgo).length;
  const postsThisMonth = items.filter(i => new Date(i.date) >= monthAgo).length;

  return { total: items.length, streak, peakDay, platformBreakdown, topTopics, postsThisWeek, postsThisMonth };
}

export default function StatsModal({ visible, onClose, theme }: { visible: boolean; onClose: () => void; theme: ThemeKey }) {
  const T = THEMES[theme];
  const isDark = T.isDark;
  const ACCENT = T.accent;
  const cardBg     = isDark ? T.surface : '#FFFFFF';
  const cardBorder = isDark ? T.card    : '#E5E5EA';
  const textSub    = isDark ? T.muted   : '#6E6E73';

  const [stats, setStats] = useState<Stats | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const shadow = (color?: string): object =>
    Platform.OS !== 'web' ? {} :
    color ? { boxShadow: `0 0 16px ${color}30` } as object
           : { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' } as object;

  useEffect(() => {
    if (!visible) return;
    AsyncStorage.getItem(VAULT_STORAGE_KEY).then(raw => {
      const items: VaultItem[] = raw ? JSON.parse(raw) : [];
      setStats(computeStats(items));
    }).catch(() => setStats(computeStats([])));
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: false }).start();
  }, [visible]);

  const bgStyle: object = Platform.OS === 'web'
    ? { background: isDark ? 'linear-gradient(160deg,#020209 0%,#060618 100%)' : 'linear-gradient(160deg,#F5F5F7 0%,#EEF0FF 100%)' } as object
    : { backgroundColor: T.bg };

  const maxPlatformCount = Math.max(1, ...(stats?.platformBreakdown.map(p => p.count) ?? [1]));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[{ flex: 1 }, bgStyle]}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: Platform.OS === 'ios' ? 12 : 4 }}>
            <View>
              <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', letterSpacing: 2 }}>YOUR CREATOR PROFILE</Text>
              <Text style={{ color: T.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 }}>
                Creator <Text style={{ color: ACCENT }}>Stats</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}
              style={{ backgroundColor: isDark ? T.card : '#F5F5F7', borderRadius: 12, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: cardBorder }}>
              <Text style={{ color: textSub, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {!stats ? (
            <Text style={{ color: textSub, textAlign: 'center', marginTop: 60 }}>Loading stats…</Text>
          ) : stats.total === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
              <Text style={{ fontSize: 48 }}>📊</Text>
              <Text style={{ color: T.text, fontSize: 18, fontWeight: '700' }}>No posts yet</Text>
              <Text style={{ color: textSub, fontSize: 13, textAlign: 'center' }}>Start creating content in Forge to see your stats here.</Text>
            </View>
          ) : (
            <>
              {/* Hero Stats Row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total Posts', value: stats.total.toString(), icon: '📝', color: ACCENT },
                  { label: 'Day Streak', value: stats.streak > 0 ? `${stats.streak}🔥` : '0', icon: '⚡', color: '#FF9F0A' },
                  { label: 'This Week', value: stats.postsThisWeek.toString(), icon: '📅', color: '#30D158' },
                ].map(s => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: cardBg, borderRadius: 18, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: cardBorder, ...shadow(s.color) }}>
                    <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                    <Text style={{ color: s.color, fontSize: 22, fontWeight: '800' }}>{s.value}</Text>
                    <Text style={{ color: textSub, fontSize: 10, fontWeight: '500', textAlign: 'center' }}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* More stats */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'This Month', value: stats.postsThisMonth.toString(), icon: '🗓️', color: '#0EA5E9' },
                  { label: 'Peak Day', value: stats.peakDay.slice(0, 3), icon: '📈', color: '#FF6B35' },
                  { label: 'Platforms', value: stats.platformBreakdown.length.toString(), icon: '🎯', color: '#BF5AF2' },
                ].map(s => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: cardBg, borderRadius: 18, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: cardBorder, ...shadow(s.color) }}>
                    <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                    <Text style={{ color: s.color, fontSize: 22, fontWeight: '800' }}>{s.value}</Text>
                    <Text style={{ color: textSub, fontSize: 10, fontWeight: '500', textAlign: 'center' }}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Platform Breakdown Bar Chart */}
              {stats.platformBreakdown.length > 0 && (
                <View style={{ backgroundColor: cardBg, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: cardBorder, ...shadow(ACCENT) }}>
                  <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 16 }}>📊  PLATFORM BREAKDOWN</Text>
                  <View style={{ gap: 12 }}>
                    {stats.platformBreakdown.map(p => (
                      <View key={p.platform}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>{p.platform}</Text>
                          <Text style={{ color: p.color, fontSize: 13, fontWeight: '700' }}>{p.count} post{p.count > 1 ? 's' : ''}</Text>
                        </View>
                        <View style={{ height: 8, backgroundColor: isDark ? T.card : '#F0F0F5', borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{
                            height: 8, borderRadius: 4,
                            width: `${(p.count / maxPlatformCount) * 100}%` as any,
                            backgroundColor: p.color,
                            ...(Platform.OS === 'web' ? { boxShadow: `0 0 8px ${p.color}60` } as object : {}),
                          }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Streak Motivator */}
              <View style={{
                backgroundColor: stats.streak > 0 ? '#FF9F0A12' : cardBg,
                borderRadius: 18, padding: 18, marginBottom: 16,
                borderWidth: 1.5, borderColor: stats.streak > 0 ? '#FF9F0A40' : cardBorder,
                ...shadow(stats.streak > 0 ? '#FF9F0A' : undefined),
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 36 }}>{stats.streak >= 7 ? '🏆' : stats.streak >= 3 ? '🔥' : stats.streak > 0 ? '✨' : '💤'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: stats.streak > 0 ? '#FF9F0A' : textSub, fontSize: 15, fontWeight: '700' }}>
                      {stats.streak >= 7 ? `${stats.streak}-Day Streak! You're on fire!` :
                       stats.streak >= 3 ? `${stats.streak}-Day Streak! Keep going!` :
                       stats.streak > 0 ? `${stats.streak}-Day Streak — don't break the chain!` :
                       'Start your streak today!'}
                    </Text>
                    <Text style={{ color: textSub, fontSize: 12, marginTop: 4 }}>
                      {stats.streak > 0 ? `You've posted ${stats.streak} day${stats.streak > 1 ? 's' : ''} in a row` : 'Create a post today to start your streak'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Top Topics Word Cloud */}
              {stats.topTopics.length > 0 && (
                <View style={{ backgroundColor: cardBg, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: cardBorder, ...shadow() }}>
                  <Text style={{ color: textSub, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 14 }}>🏷️  YOUR TOP TOPICS</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {stats.topTopics.map((word, i) => {
                      const size = Math.max(11, 16 - i * 0.5);
                      const opacity = Math.max(0.5, 1 - i * 0.06);
                      return (
                        <View key={word} style={{
                          backgroundColor: ACCENT + (isDark ? '18' : '12'),
                          borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                          borderWidth: 1, borderColor: ACCENT + (isDark ? '35' : '25'),
                        }}>
                          <Text style={{ color: ACCENT, fontSize: size, fontWeight: '600', opacity }}>{word}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
