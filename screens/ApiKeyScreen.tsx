import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Linking, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AGENTS, AgentId, testGeminiKey, testGroqKey, testSambaKey } from '../constants/agents';

const BG     = '#F8FAFC';
const CARD   = '#FFFFFF';
const LABEL  = '#0F172A';
const MUTED  = '#94A3B8';
const BORDER = '#E2E8F0';
const SUCCESS = '#10B981';
const DANGER  = '#F43F5E';

const shadow = (color = '#000', size = 8): object =>
  Platform.OS === 'web'
    ? { boxShadow: `0 2px ${size}px ${color}18` } as object
    : { shadowColor: color, shadowOpacity: 0.08, shadowRadius: size / 2, shadowOffset: { width: 0, height: 2 }, elevation: 2 };

const testFns: Record<AgentId, (k: string) => Promise<boolean>> = {
  gemini: testGeminiKey,
  groq:   testGroqKey,
  samba:  testSambaKey,
};

interface SlotState {
  value: string;
  visible: boolean;
  status: 'idle' | 'ok' | 'fail';
  testing: boolean;
}

const initSlot = (): SlotState => ({ value: '', visible: false, status: 'idle', testing: false });

export default function ApiKeyScreen({
  onSaved,
  inline = false,
}: {
  onSaved: () => void;
  inline?: boolean;
}) {
  const [slots, setSlots] = useState<Record<AgentId, SlotState>>({
    gemini: initSlot(), groq: initSlot(), samba: initSlot(),
  });
  const [saving, setSaving] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(inline ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(inline ? 0 : 28)).current;

  // Load existing keys
  useEffect(() => {
    const load = async () => {
      const updated = { ...slots };
      for (const agent of AGENTS) {
        try {
          const stored = await AsyncStorage.getItem(agent.storageKey);
          if (stored?.trim()) updated[agent.id] = { ...initSlot(), value: stored.trim() };
        } catch {}
      }
      setSlots(updated);
    };
    load();
    if (!inline) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: false }),
      ]).start();
    }
  }, []);

  const updateSlot = (id: AgentId, patch: Partial<SlotState>) =>
    setSlots(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleTest = async (id: AgentId) => {
    const val = slots[id].value.trim();
    if (!val) return;
    updateSlot(id, { testing: true, status: 'idle' });
    const ok = await testFns[id](val).catch(() => false);
    updateSlot(id, { testing: false, status: ok ? 'ok' : 'fail' });
  };

  const handleSave = async () => {
    const geminiVal = slots.gemini.value.trim();
    if (!geminiVal) return;
    setSaving(true);
    for (const agent of AGENTS) {
      const val = slots[agent.id].value.trim();
      if (val) await AsyncStorage.setItem(agent.storageKey, val).catch(() => {});
      else await AsyncStorage.removeItem(agent.storageKey).catch(() => {});
    }
    await new Promise(r => setTimeout(r, 300));
    onSaved();
  };

  const pasteFor = async (id: AgentId) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const t = await navigator.clipboard.readText();
        if (t?.trim()) updateSlot(id, { value: t.trim(), status: 'idle' });
      }
    } catch {}
  };

  const geminiVal = slots.gemini.value.trim();

  const content = (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

      {/* Header */}
      <View style={{ alignItems: 'center', paddingTop: inline ? 4 : 52, paddingBottom: 28, paddingHorizontal: 24 }}>
        {!inline && (
          <>
            <View style={{
              width: 72, height: 72, borderRadius: 20, marginBottom: 18,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#6C47FF',
              ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px #6C47FF40' } as object : { shadowColor: '#6C47FF', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 }),
            }}>
              <Text style={{ fontSize: 32 }}>🤖</Text>
            </View>
            <Text style={{ fontSize: 26, fontWeight: '700', color: LABEL, letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' }}>
              Connect Your AI Agents
            </Text>
            <Text style={{ fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
              Add your API keys to unlock all 3 AI agents. Only Gemini is required.
            </Text>
          </>
        )}
        {inline && (
          <Text style={{ fontSize: 17, fontWeight: '700', color: LABEL, marginBottom: 4 }}>AI Agent Keys</Text>
        )}
      </View>

      {/* Agent slots */}
      <View style={{ paddingHorizontal: 20, gap: 16, marginBottom: 20 }}>
        {AGENTS.map(agent => {
          const slot = slots[agent.id];
          const borderColor = slot.status === 'ok' ? SUCCESS : slot.status === 'fail' ? DANGER : BORDER;
          const isRequired = agent.id === 'gemini';
          return (
            <View key={agent.id} style={{
              backgroundColor: CARD, borderRadius: 18, padding: 16,
              borderWidth: 1.5, borderColor,
              ...shadow(agent.color, 12),
            }}>
              {/* Agent header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: agent.color + '15',
                  borderWidth: 1.5, borderColor: agent.color + '40',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: agent.color }}>{agent.badge}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: LABEL }}>{agent.name}</Text>
                    {isRequired && (
                      <View style={{ backgroundColor: agent.color + '18', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: agent.color + '35' }}>
                        <Text style={{ color: agent.color, fontSize: 9, fontWeight: '700' }}>REQUIRED</Text>
                      </View>
                    )}
                    <View style={{ backgroundColor: '#F1F5F9', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: MUTED, fontSize: 9, fontWeight: '600' }}>{agent.speed}</Text>
                    </View>
                  </View>
                  <Text style={{ color: MUTED, fontSize: 11, marginTop: 2, lineHeight: 15 }}>{agent.specialty}</Text>
                </View>
                {slot.status === 'ok' && <Text style={{ fontSize: 18 }}>✅</Text>}
                {slot.status === 'fail' && <Text style={{ fontSize: 18 }}>❌</Text>}
              </View>

              {/* Input row */}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: BG, borderRadius: 12,
                borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginBottom: 10,
              }}>
                <TextInput
                  value={slot.value}
                  onChangeText={v => updateSlot(agent.id, { value: v, status: 'idle' })}
                  secureTextEntry={!slot.visible}
                  placeholder={agent.id === 'gemini' ? 'AIza...' : agent.id === 'groq' ? 'gsk_...' : 'sn-...'}
                  placeholderTextColor={BORDER}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
                    fontSize: 14, color: LABEL,
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  }}
                />
                <TouchableOpacity onPress={() => updateSlot(agent.id, { visible: !slot.visible })} style={{ paddingHorizontal: 12 }} activeOpacity={0.6}>
                  <Text style={{ fontSize: 16 }}>{slot.visible ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
                {Platform.OS === 'web' && (
                  <TouchableOpacity onPress={() => pasteFor(agent.id)} style={{ paddingHorizontal: 12, paddingVertical: 13, borderLeftWidth: 1, borderLeftColor: BORDER }} activeOpacity={0.6}>
                    <Text style={{ color: agent.color, fontSize: 12, fontWeight: '700' }}>Paste</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Test + Get Key row */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleTest(agent.id)}
                  disabled={slot.testing || !slot.value.trim()}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: slot.status === 'ok' ? SUCCESS : slot.status === 'fail' ? DANGER : agent.color + '50',
                    backgroundColor: slot.status === 'ok' ? SUCCESS + '10' : slot.status === 'fail' ? DANGER + '10' : agent.color + '08',
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  activeOpacity={0.7}
                >
                  {slot.testing
                    ? <ActivityIndicator size="small" color={agent.color} />
                    : <Text style={{ fontSize: 13 }}>{slot.status === 'ok' ? '✓' : slot.status === 'fail' ? '✗' : '🔗'}</Text>
                  }
                  <Text style={{
                    fontSize: 12, fontWeight: '600',
                    color: slot.status === 'ok' ? SUCCESS : slot.status === 'fail' ? DANGER : slot.testing ? MUTED : agent.color,
                  }}>
                    {slot.testing ? 'Testing…' : slot.status === 'ok' ? 'Verified' : slot.status === 'fail' ? 'Failed' : 'Test'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Linking.openURL(agent.getKeyUrl)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                    borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: MUTED, fontSize: 12, fontWeight: '600' }}>Get Key ↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Save button */}
      <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !geminiVal}
          style={{
            backgroundColor: geminiVal ? '#6C47FF' : BORDER,
            borderRadius: 14, paddingVertical: 16,
            alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
            ...(geminiVal && Platform.OS === 'web'
              ? { boxShadow: '0 4px 20px #6C47FF45' } as object
              : geminiVal ? { shadowColor: '#6C47FF', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 } : {}),
          }}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 }}>
                {inline ? 'Save Keys' : 'Save & Launch NEXA'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* Footer note */}
      <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 36 }}>
        <Text style={{ color: MUTED, fontSize: 11, textAlign: 'center', lineHeight: 17 }}>
          Keys are stored only on this device.{'\n'}They are never sent to any server other than the respective AI provider.
        </Text>
      </View>
    </Animated.View>
  );

  if (inline) return content;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
