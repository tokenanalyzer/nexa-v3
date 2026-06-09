import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Share, Alert, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import { VAULT_STORAGE_KEY, VaultItem } from '../constants/vault';
import { getOptimalPostingTime } from '../constants/gemini';

export default function VaultScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const isDark = T.isDark;

  const cardBg     = isDark ? T.surface : '#FFFFFF';
  const cardBorder = isDark ? T.card    : '#E5E5EA';
  const textSub    = isDark ? T.muted   : '#6E6E73';
  const inputBg    = isDark ? T.bg      : '#F5F5F7';
  const ACCENT     = T.accent;

  const shadow = (color?: string): object =>
    Platform.OS !== 'web' ? {} :
    isDark && color
      ? { boxShadow: `0 0 18px ${color}35` } as object
      : { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' } as object;

  const [items, setItems]     = useState<VaultItem[]>([]);
  const [search, setSearch]   = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loadingTip, setLoadingTip]     = useState(false);
  const [timeTip, setTimeTip]           = useState('');

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
    try { await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated)); }
    catch { Alert.alert('Storage Error', 'Could not save vault changes.'); }
  };

  const deleteItem = (id: number) => {
    Alert.alert('Delete?', 'Remove this item from vault?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        persistItems(items.filter(i => i.id !== id));
        if (expanded === id) setExpanded(null);
        if (schedulingId === id) setSchedulingId(null);
      }},
    ]);
  };

  const clearAll = () => {
    Alert.alert('Clear Vault?', 'Delete all saved content?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => {
        persistItems([]); setExpanded(null); setSchedulingId(null);
      }},
    ]);
  };

  const openSchedule = (item: VaultItem) => {
    if (schedulingId === item.id) { setSchedulingId(null); return; }
    setSchedulingId(item.id);
    setScheduleDate(item.scheduledDate ?? '');
    setScheduleTime(item.scheduledTime ?? '');
    setTimeTip('');
  };

  const saveSchedule = (id: number) => {
    if (!scheduleDate.trim() || !scheduleTime.trim()) {
      Alert.alert('Missing Info', 'Enter both a date and a time.'); return;
    }
    persistItems(items.map(i => i.id === id ? { ...i, scheduledDate: scheduleDate.trim(), scheduledTime: scheduleTime.trim() } : i));
    setSchedulingId(null); setTimeTip('');
  };

  const removeSchedule = (id: number) => {
    persistItems(items.map(i => i.id === id ? { ...i, scheduledDate: undefined, scheduledTime: undefined } : i));
    setSchedulingId(null);
  };

  const fetchTimingTip = async (item: VaultItem) => {
    setLoadingTip(true); setTimeTip('');
    try { setTimeTip(await getOptimalPostingTime(item.platform, item.title || item.content.slice(0, 60))); }
    catch { setTimeTip('Could not fetch recommendation. Check your API key.'); }
    finally { setLoadingTip(false); }
  };

  const filtered = items.filter(i =>
    i.content.toLowerCase().includes(search.toLowerCase()) ||
    i.platform.toLowerCase().includes(search.toLowerCase()) ||
    (i.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const bgStyle: object = Platform.OS === 'web'
    ? ({
        background: isDark
          ? `linear-gradient(160deg, ${T.bg} 0%, ${T.grad} 100%)`
          : 'linear-gradient(160deg, #F5F5F7 0%, #EEF0FF 100%)',
      } as object)
    : { backgroundColor: T.bg };

  if (loading) {
    return (
      <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, bgStyle]}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={{ color: textSub, fontSize: 12, marginTop: 12 }}>Loading vault…</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, bgStyle]}>
      {/* Header */}
      <View style={{
        padding: 20, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: cardBorder,
        backgroundColor: isDark ? 'transparent' : '#FFFFFF',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View>
            <Text style={{ color: T.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
              Vault <Text style={{ color: ACCENT }}>({items.length})</Text>
            </Text>
            <Text style={{ color: textSub, fontSize: 11, marginTop: 2 }}>Saved content · AI scheduling</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={loadVault}
              style={{ padding: 8, backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: cardBorder }}>
              <Text style={{ color: ACCENT, fontSize: 16 }}>↻</Text>
            </TouchableOpacity>
            {items.length > 0 && (
              <TouchableOpacity onPress={clearAll}
                style={{ padding: 8, backgroundColor: '#FF3B3012', borderRadius: 10, borderWidth: 1, borderColor: '#FF3B3030' }}>
                <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {items.length > 0 && (
          <View style={{
            backgroundColor: isDark ? T.surface : '#F5F5F7', borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 11,
            flexDirection: 'row', gap: 10, alignItems: 'center',
            borderWidth: 1, borderColor: cardBorder,
          }}>
            <Text style={{ fontSize: 14 }}>🔍</Text>
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Search vault…" placeholderTextColor={textSub}
              style={{ flex: 1, color: T.text, fontSize: 14 }} />
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🗄️</Text>
            <Text style={{ color: T.text, fontSize: 16, fontWeight: '600', marginBottom: 6 }}>Vault is empty</Text>
            <Text style={{ color: textSub, fontSize: 13, textAlign: 'center' }}>Generate content in Forge and tap "Vault" to save</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: textSub, fontSize: 14 }}>No results found</Text>
          </View>
        ) : (
          filtered.map(item => (
            <View key={item.id} style={{ marginBottom: 10 }}>
              {/* Card */}
              <TouchableOpacity
                onPress={() => {
                  const next = expanded === item.id ? null : item.id;
                  setExpanded(next);
                  if (!next) setSchedulingId(null);
                }}
                style={{
                  backgroundColor: cardBg, borderRadius: 16, padding: 14,
                  borderWidth: 1, borderColor: expanded === item.id ? ACCENT + '60' : cardBorder,
                  ...shadow(expanded === item.id ? ACCENT : undefined),
                }} activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600' }}>
                        {item.platform} · {item.date}
                      </Text>
                      {item.scheduledDate && (
                        <View style={{ backgroundColor: '#30D15818', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#30D15840' }}>
                          <Text style={{ color: '#30D158', fontSize: 10, fontWeight: '600' }}>
                            🗓 {item.scheduledDate}  {item.scheduledTime}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: T.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                      {item.title || 'Untitled'}
                    </Text>
                    <Text style={{ color: textSub, fontSize: 12, lineHeight: 17 }} numberOfLines={2}>
                      {item.content}
                    </Text>
                  </View>
                  <Text style={{ color: textSub, fontSize: 14, marginLeft: 10 }}>{expanded === item.id ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {/* Expanded */}
              {expanded === item.id && (
                <View style={{
                  backgroundColor: isDark ? T.bg : '#F5F5F7', borderRadius: 16, padding: 14,
                  borderWidth: 1, borderColor: ACCENT + '40',
                  borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: -4,
                }}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                    <Text style={{ color: T.text, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>{item.content}</Text>
                  </ScrollView>

                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                    <TouchableOpacity onPress={() => Share.share({ message: item.content }).catch(() => {})}
                      style={{ flex: 1, padding: 10, backgroundColor: cardBg, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: cardBorder }}>
                      <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>📤 Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openSchedule(item)}
                      style={{
                        flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1,
                        backgroundColor: schedulingId === item.id ? ACCENT + '12' : cardBg,
                        borderColor: schedulingId === item.id ? ACCENT + '60' : cardBorder,
                      }}>
                      <Text style={{ color: schedulingId === item.id ? ACCENT : textSub, fontSize: 12, fontWeight: '600' }}>
                        🗓 Schedule
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteItem(item.id)}
                      style={{ padding: 10, backgroundColor: '#FF3B3010', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B3030', paddingHorizontal: 16 }}>
                      <Text style={{ color: '#FF3B30', fontSize: 14 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>

                  {schedulingId === item.id && (
                    <View style={{ backgroundColor: cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: ACCENT + '40', ...shadow(ACCENT) }}>
                      <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', marginBottom: 14 }}>Schedule Post</Text>

                      <TouchableOpacity onPress={() => fetchTimingTip(item)} disabled={loadingTip}
                        style={{
                          backgroundColor: ACCENT + (isDark ? '18' : '10'), borderRadius: 10, padding: 11,
                          borderWidth: 1, borderColor: ACCENT + '35',
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12,
                        }} activeOpacity={0.8}>
                        {loadingTip ? <ActivityIndicator size="small" color={ACCENT} /> : <Text>🤖</Text>}
                        <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>
                          {loadingTip ? 'Fetching AI recommendation…' : 'Get AI Optimal Time'}
                        </Text>
                      </TouchableOpacity>

                      {timeTip !== '' && (
                        <View style={{ backgroundColor: ACCENT + '0A', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: ACCENT + '25', marginBottom: 12 }}>
                          <Text style={{ color: textSub, fontSize: 10, fontWeight: '600', marginBottom: 6 }}>AI Recommendation</Text>
                          <Text style={{ color: T.text, fontSize: 13, lineHeight: 19 }}>{timeTip}</Text>
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        {[
                          { label: 'Date', value: scheduleDate, set: setScheduleDate, ph: 'MM/DD/YYYY' },
                          { label: 'Time', value: scheduleTime, set: setScheduleTime, ph: 'HH:MM AM/PM' },
                        ].map(f => (
                          <View key={f.label} style={{ flex: 1, backgroundColor: inputBg, borderRadius: 10, borderWidth: 1, borderColor: cardBorder, paddingHorizontal: 12, paddingVertical: 10 }}>
                            <Text style={{ color: textSub, fontSize: 9, fontWeight: '600', marginBottom: 4, letterSpacing: 0.5 }}>{f.label.toUpperCase()}</Text>
                            <TextInput value={f.value} onChangeText={f.set} placeholder={f.ph} placeholderTextColor={textSub}
                              style={{ color: T.text, fontSize: 14, fontWeight: '600' }} />
                          </View>
                        ))}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => saveSchedule(item.id)}
                          style={{ flex: 1, padding: 11, backgroundColor: ACCENT, borderRadius: 10, alignItems: 'center' }} activeOpacity={0.85}>
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Save Schedule</Text>
                        </TouchableOpacity>
                        {item.scheduledDate && (
                          <TouchableOpacity onPress={() => removeSchedule(item.id)}
                            style={{ padding: 11, backgroundColor: '#FF3B3010', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B3030', paddingHorizontal: 16 }}>
                            <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '600' }}>Remove</Text>
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
