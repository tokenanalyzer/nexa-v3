import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Share, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import { VAULT_STORAGE_KEY, VaultItem } from '../constants/vault';
import { getOptimalPostingTime } from '../constants/gemini';

const glow = (color: string) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.75,
  shadowRadius: 10,
});

export default function VaultScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const [items, setItems] = useState<VaultItem[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);
  const [timeTip, setTimeTip] = useState('');

  const loadVault = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      setItems(raw ? (JSON.parse(raw) as VaultItem[]) : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadVault(); }, [loadVault]);

  const persistItems = async (updated: VaultItem[]) => {
    setItems(updated);
    try {
      await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
    } catch { Alert.alert('Storage Error', 'Could not save vault changes.'); }
  };

  const deleteItem = (id: number) => {
    Alert.alert('Delete?', 'Remove this from vault?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          persistItems(items.filter(i => i.id !== id));
          if (expanded === id) setExpanded(null);
          if (schedulingId === id) setSchedulingId(null);
        },
      },
    ]);
  };

  const clearAll = () => {
    Alert.alert('Clear Vault?', 'Delete all saved content?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive', onPress: () => {
          persistItems([]);
          setExpanded(null);
          setSchedulingId(null);
        },
      },
    ]);
  };

  const openSchedule = (item: VaultItem) => {
    if (schedulingId === item.id) {
      setSchedulingId(null);
    } else {
      setSchedulingId(item.id);
      setScheduleDate(item.scheduledDate ?? '');
      setScheduleTime(item.scheduledTime ?? '');
      setTimeTip('');
    }
  };

  const saveSchedule = (id: number) => {
    if (!scheduleDate.trim() || !scheduleTime.trim()) {
      Alert.alert('Missing Info', 'Please enter both a date and a time.');
      return;
    }
    const updated = items.map(i =>
      i.id === id ? { ...i, scheduledDate: scheduleDate.trim(), scheduledTime: scheduleTime.trim() } : i
    );
    persistItems(updated);
    setSchedulingId(null);
    setTimeTip('');
  };

  const removeSchedule = (id: number) => {
    const updated = items.map(i =>
      i.id === id ? { ...i, scheduledDate: undefined, scheduledTime: undefined } : i
    );
    persistItems(updated);
    setSchedulingId(null);
  };

  const fetchTimingTip = async (item: VaultItem) => {
    setLoadingTip(true);
    setTimeTip('');
    try {
      const tip = await getOptimalPostingTime(item.platform, item.title || item.content.slice(0, 60));
      setTimeTip(tip);
    } catch {
      setTimeTip('Could not fetch AI recommendation. Check your API key.');
    } finally {
      setLoadingTip(false);
    }
  };

  const filtered = items.filter(i =>
    i.content.toLowerCase().includes(search.toLowerCase()) ||
    i.platform.toLowerCase().includes(search.toLowerCase()) ||
    (i.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={{ color: T.muted, fontSize: 10, marginTop: 12, letterSpacing: 2 }}>LOADING VAULT...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>

      {/* Header */}
      <View style={{ padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: T.card }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={{ color: T.text, fontSize: 18, fontWeight: '900' }}>
              VAULT <Text style={{ color: T.accent }}>({items.length})</Text>
            </Text>
            <Text style={{ color: T.muted, fontSize: 9, letterSpacing: 2, marginTop: 2 }}>
              SAVED CONTENT — AI SCHEDULE ENABLED
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={loadVault}
              style={{ padding: 8, backgroundColor: T.surface, borderRadius: 10, borderWidth: 1, borderColor: T.card }}
            >
              <Text style={{ color: T.accent, fontSize: 11, fontWeight: '900' }}>↻</Text>
            </TouchableOpacity>
            {items.length > 0 && (
              <TouchableOpacity
                onPress={clearAll}
                style={{ padding: 8, backgroundColor: T.surface, borderRadius: 10, borderWidth: 1, borderColor: T.card }}
              >
                <Text style={{ color: '#FF3D00', fontSize: 11, fontWeight: '900' }}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {items.length > 0 && (
          <View style={{
            backgroundColor: T.surface, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10,
            flexDirection: 'row', gap: 10, alignItems: 'center',
            borderWidth: 1, borderColor: T.card,
          }}>
            <Text style={{ fontSize: 14 }}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search vault..."
              placeholderTextColor={T.muted}
              style={{ flex: 1, color: T.text, fontSize: 13 }}
            />
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🗄️</Text>
            <Text style={{ color: T.muted, fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>VAULT EMPTY</Text>
            <Text style={{ color: T.card, fontSize: 10, marginTop: 8 }}>
              Generate content in Forge and tap VAULT to save
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: T.muted, fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>NO RESULTS</Text>
          </View>
        ) : (
          filtered.map(item => (
            <View key={item.id} style={{ marginBottom: 10 }}>

              {/* Card header row */}
              <TouchableOpacity
                onPress={() => {
                  const next = expanded === item.id ? null : item.id;
                  setExpanded(next);
                  if (!next) setSchedulingId(null);
                }}
                style={{
                  backgroundColor: T.surface, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: expanded === item.id ? T.accent : T.card,
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <Text style={{ color: T.accent, fontSize: 10, fontWeight: '900' }}>
                        {item.platform} • {item.date}
                      </Text>
                      {item.scheduledDate && (
                        <View style={{
                          backgroundColor: '#1a3a1a', borderRadius: 6,
                          paddingHorizontal: 6, paddingVertical: 2,
                          borderWidth: 1, borderColor: '#00FF9D40',
                        }}>
                          <Text style={{ color: '#00FF9D', fontSize: 8, fontWeight: '900' }}>
                            🗓️ {item.scheduledDate} {item.scheduledTime}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: T.text, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                      {item.title || 'Untitled'}
                    </Text>
                    <Text style={{ color: T.muted, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
                      {item.content}
                    </Text>
                  </View>
                  <Text style={{ color: T.muted, fontSize: 16, marginLeft: 10 }}>
                    {expanded === item.id ? '▲' : '▼'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Expanded panel */}
              {expanded === item.id && (
                <View style={{
                  backgroundColor: T.bg, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: T.accent,
                  borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0,
                  marginTop: -4,
                }}>
                  {/* Content preview */}
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                    <Text style={{ color: T.text, fontSize: 12, lineHeight: 20, marginBottom: 14 }}>
                      {item.content}
                    </Text>
                  </ScrollView>

                  {/* Action buttons */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <TouchableOpacity
                      onPress={() => Share.share({ message: item.content }).catch(() => {})}
                      style={{ flex: 1, padding: 10, backgroundColor: T.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: T.card }}
                    >
                      <Text style={{ color: T.accent, fontSize: 11, fontWeight: '900' }}>📤 SHARE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openSchedule(item)}
                      style={{
                        flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1,
                        backgroundColor: schedulingId === item.id ? T.accent + '20' : T.surface,
                        borderColor: schedulingId === item.id ? T.accent : T.card,
                        ...(schedulingId === item.id ? glow(T.accent) : {}),
                      }}
                    >
                      <Text style={{ color: schedulingId === item.id ? T.accent : T.muted, fontSize: 11, fontWeight: '900' }}>
                        🗓️ SCHEDULE
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteItem(item.id)}
                      style={{ padding: 10, backgroundColor: '#110000', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#330000', paddingHorizontal: 16 }}
                    >
                      <Text style={{ color: '#FF3D00', fontSize: 11, fontWeight: '900' }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ── Schedule Panel ── */}
                  {schedulingId === item.id && (
                    <View style={{
                      backgroundColor: T.surface, borderRadius: 14, padding: 14,
                      borderWidth: 1.5, borderColor: T.accent + '60',
                      ...glow(T.accent),
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <Text style={{ color: T.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>
                          🗓️ SCHEDULE POST
                        </Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: T.card }} />
                      </View>

                      {/* AI Timing Button */}
                      <TouchableOpacity
                        onPress={() => fetchTimingTip(item)}
                        disabled={loadingTip}
                        style={{
                          backgroundColor: T.accent + '15', borderRadius: 10, padding: 11,
                          borderWidth: 1, borderColor: T.accent + '40',
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                          marginBottom: 12,
                        }}
                        activeOpacity={0.8}
                      >
                        {loadingTip ? (
                          <ActivityIndicator size="small" color={T.accent} />
                        ) : (
                          <Text style={{ fontSize: 14 }}>🤖</Text>
                        )}
                        <Text style={{ color: T.accent, fontSize: 11, fontWeight: '900' }}>
                          {loadingTip ? 'FETCHING AI TIMING...' : 'GET AI OPTIMAL TIME ▸'}
                        </Text>
                      </TouchableOpacity>

                      {/* AI Tip */}
                      {timeTip !== '' && (
                        <View style={{
                          backgroundColor: T.accent + '0C', borderRadius: 10, padding: 12,
                          borderWidth: 1, borderColor: T.accent + '30', marginBottom: 12,
                        }}>
                          <Text style={{ color: T.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }}>
                            ⚡ GEMINI RECOMMENDATION
                          </Text>
                          <Text style={{ color: T.text, fontSize: 12, lineHeight: 18 }}>{timeTip}</Text>
                        </View>
                      )}

                      {/* Date & Time Inputs */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <View style={{ flex: 1, backgroundColor: T.bg, borderRadius: 10, borderWidth: 1, borderColor: T.card, paddingHorizontal: 12, paddingVertical: 10 }}>
                          <Text style={{ color: T.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>DATE</Text>
                          <TextInput
                            value={scheduleDate}
                            onChangeText={setScheduleDate}
                            placeholder="MM/DD/YYYY"
                            placeholderTextColor={T.muted}
                            style={{ color: T.text, fontSize: 13, fontWeight: '700' }}
                          />
                        </View>
                        <View style={{ flex: 1, backgroundColor: T.bg, borderRadius: 10, borderWidth: 1, borderColor: T.card, paddingHorizontal: 12, paddingVertical: 10 }}>
                          <Text style={{ color: T.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>TIME</Text>
                          <TextInput
                            value={scheduleTime}
                            onChangeText={setScheduleTime}
                            placeholder="HH:MM AM/PM"
                            placeholderTextColor={T.muted}
                            style={{ color: T.text, fontSize: 13, fontWeight: '700' }}
                          />
                        </View>
                      </View>

                      {/* Save / Remove Schedule buttons */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => saveSchedule(item.id)}
                          style={{
                            flex: 1, padding: 11, backgroundColor: T.accent,
                            borderRadius: 10, alignItems: 'center',
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={{ color: '#000', fontSize: 12, fontWeight: '900' }}>✓ SAVE SCHEDULE</Text>
                        </TouchableOpacity>
                        {item.scheduledDate && (
                          <TouchableOpacity
                            onPress={() => removeSchedule(item.id)}
                            style={{ padding: 11, backgroundColor: '#110000', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#330000', paddingHorizontal: 14 }}
                          >
                            <Text style={{ color: '#FF3D00', fontSize: 11, fontWeight: '900' }}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
