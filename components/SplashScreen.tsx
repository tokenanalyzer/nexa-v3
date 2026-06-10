import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const logoScale   = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;
  const screenFade  = useRef(new Animated.Value(1)).current;
  const pulse       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1 — logo pop in
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 7, tension: 80, useNativeDriver: false }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, useNativeDriver: false }),
      ]),
      // 2 — glow + tagline
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 1, duration: 380, useNativeDriver: false }),
        Animated.timing(tagOpacity,  { toValue: 1, duration: 500, useNativeDriver: false }),
      ]),
      // 3 — loading bar fills
      Animated.timing(barWidth, { toValue: 1, duration: 900, useNativeDriver: false }),
    ]).start(() => {
      // 4 — pulse once, then fade out
      Animated.sequence([
        Animated.timing(pulse,       { toValue: 1.06, duration: 180, useNativeDriver: false }),
        Animated.timing(pulse,       { toValue: 1,    duration: 180, useNativeDriver: false }),
        Animated.delay(120),
        Animated.timing(screenFade,  { toValue: 0, duration: 380, useNativeDriver: false }),
      ]).start(onDone);
    });
  }, []);

  const barWidthInterp = barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const barColor = barWidth.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#5E5CE6', '#A78BFA', '#30D158'],
  });

  const bgStyle: object = Platform.OS === 'web'
    ? ({ background: 'linear-gradient(160deg, #020209 0%, #080820 50%, #040412 100%)' } as object)
    : { backgroundColor: '#020209' };

  return (
    <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, bgStyle, { opacity: screenFade }]}>

      {/* Background grid lines */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', opacity: 0.06 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h${i}`} style={{
            position: 'absolute', left: 0, right: 0,
            top: `${i * 10}%`, height: 1, backgroundColor: '#5E5CE6',
          }} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v${i}`} style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${i * 10}%`, width: 1, backgroundColor: '#5E5CE6',
          }} />
        ))}
      </View>

      {/* Glow orb behind logo */}
      <Animated.View style={{
        position: 'absolute',
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: '#5E5CE6',
        opacity: glowOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
        ...(Platform.OS === 'web'
          ? { filter: 'blur(60px)' } as object
          : {}),
      }} />

      {/* Logo + title block */}
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: logoScale }], opacity: logoOpacity }}>

        {/* Hexagonal logo frame */}
        <Animated.View style={{
          width: 100, height: 100, borderRadius: 28,
          backgroundColor: '#0D0D1A',
          borderWidth: 1.5, borderColor: '#5E5CE640',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 22,
          transform: [{ scale: pulse }],
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 40px #5E5CE655, 0 0 80px #5E5CE620' } as object
            : {}),
        }}>
          <Image
            source={require('../assets/nexa-logo.png')}
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name */}
        <Text style={{
          fontSize: 34, fontWeight: '800', letterSpacing: -1,
          color: '#FFFFFF',
        }}>
          NEXA{' '}
          <Text style={{ color: '#5E5CE6' }}>PRO</Text>
        </Text>

        {/* Tagline */}
        <Animated.Text style={{
          fontSize: 11, fontWeight: '600', letterSpacing: 3.5,
          color: '#6E6E8A', marginTop: 6, opacity: tagOpacity,
        }}>
          AI CONTENT STRATEGY
        </Animated.Text>
      </Animated.View>

      {/* Loading bar */}
      <View style={{
        position: 'absolute', bottom: 80,
        width: width * 0.55, height: 2,
        backgroundColor: '#1A1A2E', borderRadius: 2, overflow: 'hidden',
      }}>
        <Animated.View style={{
          height: 2, borderRadius: 2,
          width: barWidthInterp,
          backgroundColor: barColor,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 8px #5E5CE6' } as object
            : {}),
        }} />
      </View>

      {/* Version tag */}
      <Animated.Text style={{
        position: 'absolute', bottom: 58,
        fontSize: 9, fontWeight: '500', letterSpacing: 1.5,
        color: '#3A3A5A', opacity: tagOpacity,
      }}>
        v3.0 · NEURAL CORE
      </Animated.Text>

    </Animated.View>
  );
}
