import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Share, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeKey } from '../constants/themes';
import { VAULT_STORAGE_KEY, VaultItem } from '../constants/vault';

export default function VaultScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const [items, setItems] = useState<VaultItem[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadVault = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as VaultItem[];
        setItems(parsed);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  const persistItems = async (updated: VaultItem[]) => {
    setItems(updated);
    try {
      await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      Alert.alert('Storage Error', 'Could not save vault changes.');
    }
  };

  const deleteItem = (id: number) => {
    Alert.alert('Delete?', 'Remove this from vault?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          persistItems(items.filter(i => i.id !== id));
          if (expanded === id) setExpanded(null);
        }
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
        }
      },
    ]);
  };

  const filtered = items.filter(i =>
    i.content.toLowerCase().includes(search.toLowerCase()) ||
    i.platform.toLowerCase().includes(search.toLowerCase()) ||
    i.title.toLowerCase().includes(search.toLowerCase())
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
              SAVED CONTENT — ASYNC STORAGE
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
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
              <TouchableOpacity
                onPress={() => setExpanded(expanded === item.id ? null : item.id)}
                style={{
                  backgroundColor: T.surface, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: expanded === item.id ? T.accent : T.card,
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.accent, fontSize: 10, fontWeight: '900', marginBottom: 4 }}>
                      {item.platform} • {item.date}
                    </Text>
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

              {expanded === item.id && (
                <View style={{
                  backgroundColor: T.bg, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: T.accent,
                  borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0,
                  marginTop: -4,
                }}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    <Text style={{ color: T.text, fontSize: 12, lineHeight: 20, marginBottom: 14 }}>
                      {item.content}
                    </Text>
                  </ScrollView>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => Share.share({ message: item.content })}
                      style={{
                        flex: 1, padding: 10, backgroundColor: T.surface,
                        borderRadius: 10, alignItems: 'center',
                        borderWidth: 1, borderColor: T.card,
                      }}
                    >
                      <Text style={{ color: T.accent, fontSize: 11, fontWeight: '900' }}>📤 SHARE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteItem(item.id)}
                      style={{
                        padding: 10, backgroundColor: '#110000', borderRadius: 10,
                        alignItems: 'center', borderWidth: 1, borderColor: '#330000', paddingHorizontal: 16,
                      }}
                    >
                      <Text style={{ color: '#FF3D00', fontSize: 11, fontWeight: '900' }}>🗑️ DEL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
