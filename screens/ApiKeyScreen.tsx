import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Linking, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AGENTS, AgentId, testGeminiKey, testGroqKey, testSambaKey } from '../constants/agents';

const BG     = '#F5F5F7';
const CARD   = '#FFFFFF';
const LABEL  = '#1D1D1F';
const MUTED  = '#6E6E73';
const BORDER = '#D2D2D7';
const SUCCESS = '#30D158';
const DANGER  = '#FF3B30';

const shadow = (): object =>
  Platform.OS === 'web'
    ? { boxShadow: '0 2px 10px rgba(0,0,0,0.07)' } as object
    : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 };

const testFns: Record<AgentId, (k: string) => Promise<boolean>> = {
  gemini: testGeminiKey,
  groq:   testGroqKey,
  samba:  testSambaKey,
};

interface SlotState { value: string; visible: boolean; status: 'idle' | 'ok' | 'fail'; testing: boolean; }
const initSlot = (): SlotState => ({ value: '', visible: false, status: 'idle', testing: false });

export default function ApiKeyScreen({
  onSaved, inline = false,
}: { onSaved: () => void; inline?: boolean }) {
  const [slots, setSlots] = useState<Record<AgentId, SlotState>>({
    gemini: initSlot(), groq: initSlot(), samba: initSlot(),
  });
  const [saving, setSaving] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(inline ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(inline ? 0 : 24)).current;

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
      {!inline && (
        <View style={{ alignItems: 'center', paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 22, marginBottom: 18,
            alignItems: 'center', justifyContent: 'center', backgroundColor: '#5E5CE6',
            ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px #5E5CE635' } as object : { shadowColor: '#5E5CE6', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 }),
          }}>
            <Text style={{ fontSize: 32 }}>🤖</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '700', color: LABEL, letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' }}>
            Connect AI Agents
          </Text>
          <Text style={{ fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
            Add your API keys to power all three AI agents. Only Gemini is required.
          </Text>
        </View>
      )}
      {inline && (
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: LABEL }}>AI Agent Keys</Text>
          <Text style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>Manage your API keys for all three agents</Text>
        </View>
      )}

      {/* Agent slots */}
      <View style={{ paddingHorizontal: 20, gap: 14, marginBottom: 20 }}>
        {AGENTS.map(agent => {
          const slot = slots[agent.id];
          const borderColor = slot.status === 'ok' ? SUCCESS : slot.status === 'fail' ? DANGER : BORDER;
          const isRequired = agent.id === 'gemini';
          return (
            <View key={agent.id} style={{
              backgroundColor: CARD, borderRadius: 18, padding: 16,
              borderWidth: 1.5, borderColor,
              ...shadow(),
            }}>
              {/* Agent header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: agent.color + '14',
                  borderWidth: 1.5, borderColor: agent.color + '35',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: agent.color }}>{agent.badge}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: LABEL }}>{agent.name}</Text>
                    {isRequired && (
                      <View style={{ backgroundColor: agent.color + '14', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: agent.color + '30' }}>
                        <Text style={{ color: agent.color, fontSize: 9, fontWeight: '600' }}>Required</Text>
                      </View>
                    )}
                    <View style={{ backgroundColor: '#F5F5F7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: MUTED, fontSize: 9, fontWeight: '600' }}>{agent.speed}</Text>
                    </View>
                  </View>
                  <Text style={{ color: MUTED, fontSize: 11, marginTop: 2, lineHeight: 15 }}>{agent.role} · {agent.specialty.split(',')[0]}</Text>
                </View>
                {slot.status === 'ok'   && <Text style={{ fontSize: 18 }}>✅</Text>}
                {slot.status === 'fail' && <Text style={{ fontSize: 18 }}>❌</Text>}
              </View>

              {/* Input */}
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
                  autoCapitalize="none" autoCorrect={false}
                  style={{
                    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
                    fontSize: 14, color: LABEL,
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  }}
                />
                <TouchableOpacity onPress={() => updateSlot(agent.id, { visible: !slot.visible })}
                  style={{ paddingHorizontal: 12 }} activeOpacity={0.6}>
                  <Text style={{ fontSize: 16 }}>{slot.visible ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
                {Platform.OS === 'web' && (
                  <TouchableOpacity onPress={() => pasteFor(agent.id)}
                    style={{ paddingHorizontal: 12, paddingVertical: 13, borderLeftWidth: 1, borderLeftColor: BORDER }}
                    activeOpacity={0.6}>
                    <Text style={{ color: agent.color, fontSize: 12, fontWeight: '600' }}>Paste</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Test + Get Key */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleTest(agent.id)} disabled={slot.testing || !slot.value.trim()}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: slot.status === 'ok' ? SUCCESS : slot.status === 'fail' ? DANGER : agent.color + '45',
                    backgroundColor: slot.status === 'ok' ? SUCCESS + '10' : slot.status === 'fail' ? DANGER + '10' : agent.color + '08',
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }} activeOpacity={0.7}>
                  {slot.testing
                    ? <ActivityIndicator size="small" color={agent.color} />
                    : <Text style={{ fontSize: 12 }}>{slot.status === 'ok' ? '✓' : slot.status === 'fail' ? '✗' : '🔗'}</Text>}
                  <Text style={{
                    fontSize: 12, fontWeight: '600',
                    color: slot.status === 'ok' ? SUCCESS : slot.status === 'fail' ? DANGER : slot.testing ? MUTED : agent.color,
                  }}>
                    {slot.testing ? 'Testing…' : slot.status === 'ok' ? 'Verified' : slot.status === 'fail' ? 'Failed' : 'Test'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(agent.getKeyUrl)}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD }}
                  activeOpacity={0.7}>
                  <Text style={{ color: MUTED, fontSize: 12, fontWeight: '600' }}>Get Key ↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Save button */}
      <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
        <TouchableOpacity onPress={handleSave} disabled={saving || !geminiVal}
          style={{
            backgroundColor: geminiVal ? '#5E5CE6' : BORDER,
            borderRadius: 14, paddingVertical: 16,
            alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
            ...(geminiVal && Platform.OS === 'web' ? { boxShadow: '0 4px 20px #5E5CE640' } as object
              : geminiVal ? { shadowColor: '#5E5CE6', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 } : {}),
          }} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ fontSize: 17, fontWeight: '700', color: geminiVal ? '#fff' : MUTED }}>
              {inline ? 'Save Keys' : 'Save & Launch Nexa'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 36 }}>
        <Text style={{ color: MUTED, fontSize: 11, textAlign: 'center', lineHeight: 17 }}>
          Keys are stored only on this device.{'\n'}Never sent to any server other than the respective AI provider.
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
