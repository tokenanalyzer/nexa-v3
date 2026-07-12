import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  ScrollView, Animated, Platform, Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');
const ACCENT  = '#7C6EF8';
const ACCENT2 = '#A78BFA';

export const CURRENT_VERSION = '1.0.0';

const CHANGES = [
  {
    icon: '🎬',
    color: '#7C6EF8',
    title: 'Cinematic Splash Screen',
    desc: 'All-new dark 3D animated intro with floating particles and glow rings.',
  },
  {
    icon: '🚀',
    color: '#F43F5E',
    title: 'Guided Onboarding',
    desc: '5-slide intro tour on first launch — covers all features and API key setup.',
  },
  {
    icon: '🔒',
    color: '#10B981',
    title: 'Play Store Ready',
    desc: 'Privacy Policy, Data Deletion, Terms — app is fully compliant for publishing.',
  },
  {
    icon: '⚡',
    color: '#F59E0B',
    title: 'Intel Fallback Fixed',
    desc: 'Groq → Gemini automatic fallback. Chat always works, even if Groq is down.',
  },
  {
    icon: '🎨',
    color: '#0EA5E9',
    title: 'New Logo & Header',
    desc: 'Clean NEXA AI text logo replaces old dark image. Looks sharp on all themes.',
  },
  {
    icon: '📋',
    color: '#A78BFA',
    title: 'Native Clipboard',
    desc: 'expo-clipboard for real copy support on Android APK — no more web-only copy.',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function WhatsNewModal({ visible, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 80, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 220, useNativeDriver: false }),
        Animated.timing(slideAnim, { toValue: height, duration: 260, useNativeDriver: false }),
      ]).start();
    }
  }, [visible]);

  const glow = (color: string) =>
    Platform.OS === 'web' ? { boxShadow: `0 0 16px ${color}50` } as object : {};

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={{
        flex: 1, backgroundColor: '#000000',
        opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      }} />

      {/* Sheet */}
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        transform: [{ translateY: slideAnim }],
        backgroundColor: '#0A0A1E',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderTopWidth: 1, borderColor: '#1E1E3A',
        maxHeight: height * 0.88,
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 -8px 60px rgba(124,110,248,0.2)' } as object : {}),
      }}>

        {/* Handle bar */}
        <View style={{
          width: 36, height: 4, borderRadius: 2,
          backgroundColor: '#2A2A4A', alignSelf: 'center', marginTop: 10, marginBottom: 4,
        }} />

        {/* Header */}
        <View style={{
          paddingHorizontal: 24, paddingTop: 16, paddingBottom: 18,
          borderBottomWidth: 1, borderBottomColor: '#1A1A3A',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <View style={{
                backgroundColor: ACCENT + '20', borderRadius: 8,
                paddingHorizontal: 8, paddingVertical: 3,
                borderWidth: 1, borderColor: ACCENT + '40',
              }}>
                <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }}>
                  v{CURRENT_VERSION}
                </Text>
              </View>
              <Text style={{ color: '#5A5A7A', fontSize: 10, fontWeight: '500' }}>Latest Update</Text>
            </View>
            <Text style={{
              color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.5,
            }}>
              What's New in{' '}
              <Text style={{ color: ACCENT2 }}>NEXA AI</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: '#1A1A3A', alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#2A2A4A',
            }}
          >
            <Text style={{ color: '#8080A0', fontSize: 16, lineHeight: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Change list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {CHANGES.map((item, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 14,
              backgroundColor: '#0E0E2A',
              borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: '#1A1A3A',
            }}>
              <View style={{
                width: 42, height: 42, borderRadius: 13,
                backgroundColor: item.color + '15',
                borderWidth: 1, borderColor: item.color + '30',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                ...glow(item.color),
              }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 4,
                }}>{item.title}</Text>
                <Text style={{
                  color: '#6A6A8A', fontSize: 11, lineHeight: 17,
                }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* CTA */}
        <View style={{ padding: 20, paddingBottom: 34 }}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={{
              backgroundColor: ACCENT, borderRadius: 16,
              paddingVertical: 15, alignItems: 'center',
              ...(Platform.OS === 'web'
                ? { boxShadow: `0 4px 28px ${ACCENT}60` } as object : {}),
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>
              🎉  Let's Go!
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </Modal>
  );
}
