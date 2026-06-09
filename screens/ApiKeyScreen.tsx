import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Animated, Easing, ActivityIndicator, Linking, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GEMINI_KEY_STORAGE, testApiKey } from '../constants/gemini';

const BLUE = '#007AFF';
const BG   = '#F2F2F7';
const CARD = '#FFFFFF';
const LABEL = '#3C3C43';
const MUTED = '#8E8E93';
const BORDER = '#C6C6C8';
const SUCCESS = '#34C759';
const DANGER  = '#FF3B30';

export default function ApiKeyScreen({
  onSaved,
  existingKey = '',
  inline = false,
}: {
  onSaved: () => void;
  existingKey?: string;
  inline?: boolean;
}) {
  const [key, setKey]             = useState(existingKey);
  const [visible, setVisible]     = useState(false);
  const [testing, setTesting]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg]     = useState('');

  const fadeAnim  = useRef(new Animated.Value(inline ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(inline ? 0 : 32)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (inline) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: false }),
    ]).start();
  }, []);

  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: false }),
    ]).start();
  };

  const pasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text?.trim()) { setKey(text.trim()); setTestStatus('idle'); }
      }
    } catch {}
  };

  const handleTest = async () => {
    const trimmed = key.trim();
    if (!trimmed) { shake(); return; }
    setTesting(true); setTestStatus('idle'); setTestMsg('');
    try {
      const ok = await testApiKey(trimmed);
      setTestStatus(ok ? 'ok' : 'fail');
      setTestMsg(ok ? 'Connected successfully — Gemini 2.5 is responding.' : 'Invalid key or quota exceeded. Check your Google AI Studio.');
    } catch {
      setTestStatus('fail');
      setTestMsg('Could not reach Gemini. Check your network.');
    }
    setTesting(false);
  };

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed) { shake(); return; }
    setSaving(true);
    try {
      await AsyncStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
      await new Promise(r => setTimeout(r, 400));
      onSaved();
    } catch { setSaving(false); }
  };

  const handleClear = async () => {
    await AsyncStorage.removeItem(GEMINI_KEY_STORAGE);
    setKey(''); setTestStatus('idle'); setTestMsg('');
  };

  const statusColor = testStatus === 'ok' ? SUCCESS : testStatus === 'fail' ? DANGER : MUTED;

  const content = (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

      {/* Icon + header */}
      <View style={{ alignItems: 'center', paddingTop: inline ? 8 : 60, paddingBottom: 32, paddingHorizontal: 24 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 22, backgroundColor: BLUE,
          alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          ...(Platform.OS === 'web' ? { boxShadow: `0 8px 24px ${BLUE}40` } as object : { shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 }),
        }}>
          <Text style={{ fontSize: 36 }}>🔑</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' }}>
          {inline ? 'Update API Key' : 'Connect Your AI'}
        </Text>
        <Text style={{ fontSize: 15, color: MUTED, textAlign: 'center', lineHeight: 22, maxWidth: 300 }}>
          Enter your Gemini API key to power all AI features in NEXA PRO. Your key is stored only on this device.
        </Text>
      </View>

      {/* Key input card */}
      <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: LABEL, marginBottom: 8, marginLeft: 4 }}>
          GEMINI API KEY
        </Text>
        <Animated.View style={{
          backgroundColor: CARD, borderRadius: 14,
          borderWidth: 1.5,
          borderColor: testStatus === 'ok' ? SUCCESS : testStatus === 'fail' ? DANGER : BORDER,
          flexDirection: 'row', alignItems: 'center',
          overflow: 'hidden',
          transform: [{ translateX: shakeAnim }],
          ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as object : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }),
        }}>
          <TextInput
            value={key}
            onChangeText={t => { setKey(t); setTestStatus('idle'); setTestMsg(''); }}
            secureTextEntry={!visible}
            placeholder="AIza..."
            placeholderTextColor={BORDER}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1, paddingHorizontal: 16, paddingVertical: 16,
              fontSize: 15, color: '#1C1C1E',
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            }}
          />
          {/* Show/hide toggle */}
          <TouchableOpacity
            onPress={() => setVisible(v => !v)}
            style={{ paddingHorizontal: 14, paddingVertical: 16 }}
            activeOpacity={0.6}
          >
            <Text style={{ fontSize: 18 }}>{visible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
          {/* Paste */}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={pasteFromClipboard}
              style={{ paddingHorizontal: 14, paddingVertical: 16, borderLeftWidth: 1, borderLeftColor: BG }}
              activeOpacity={0.6}
            >
              <Text style={{ color: BLUE, fontSize: 13, fontWeight: '600' }}>Paste</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Status message */}
        {testMsg !== '' && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, marginLeft: 4 }}>
            <Text style={{ color: statusColor, fontSize: 13, flex: 1, lineHeight: 18 }}>
              {testStatus === 'ok' ? '✓ ' : '✗ '}{testMsg}
            </Text>
          </View>
        )}
      </View>

      {/* Test Connection */}
      <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
        <TouchableOpacity
          onPress={handleTest}
          disabled={testing || !key.trim()}
          style={{
            backgroundColor: CARD, borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', borderWidth: 1.5,
            borderColor: testStatus === 'ok' ? SUCCESS : testStatus === 'fail' ? DANGER : BORDER,
            flexDirection: 'row', justifyContent: 'center', gap: 8,
            ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as object : { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 }),
          }}
          activeOpacity={0.7}
        >
          {testing
            ? <ActivityIndicator size="small" color={BLUE} />
            : <Text style={{ fontSize: 16 }}>
                {testStatus === 'ok' ? '✅' : testStatus === 'fail' ? '❌' : '🔗'}
              </Text>
          }
          <Text style={{
            fontSize: 15, fontWeight: '600',
            color: testStatus === 'ok' ? SUCCESS : testStatus === 'fail' ? DANGER : testing ? MUTED : LABEL,
          }}>
            {testing ? 'Testing connection…' : testStatus === 'ok' ? 'Connection verified' : testStatus === 'fail' ? 'Connection failed' : 'Test Connection'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Save CTA */}
      <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !key.trim()}
          style={{
            backgroundColor: key.trim() ? BLUE : BORDER,
            borderRadius: 14, paddingVertical: 16,
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'row', gap: 8,
            ...(key.trim() && Platform.OS === 'web'
              ? { boxShadow: `0 4px 16px ${BLUE}50` } as object
              : key.trim() ? { shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 } : {}),
          }}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 }}>
                Save &amp; Continue
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* Clear key (only if editing) */}
      {inline && existingKey !== '' && (
        <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
          <TouchableOpacity
            onPress={handleClear}
            style={{
              backgroundColor: CARD, borderRadius: 14, paddingVertical: 15,
              alignItems: 'center', borderWidth: 1, borderColor: BORDER,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: DANGER }}>Remove Saved Key</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer link */}
      <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 }}>
        <Text style={{ color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 10 }}>
          Don't have a key? Get one free from Google AI Studio.
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
          activeOpacity={0.7}
        >
          <Text style={{ color: BLUE, fontSize: 14, fontWeight: '600' }}>
            Open Google AI Studio ↗
          </Text>
        </TouchableOpacity>

        <Text style={{ color: BORDER, fontSize: 11, marginTop: 24, textAlign: 'center', lineHeight: 16 }}>
          Your API key is stored locally using encrypted device storage.{'\n'}It is never sent to any server other than Google.
        </Text>
      </View>

    </Animated.View>
  );

  if (inline) return content;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
