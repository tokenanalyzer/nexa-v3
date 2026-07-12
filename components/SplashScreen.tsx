import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Platform, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');
const ACCENT = '#7C6EF8';
const ACCENT2 = '#A78BFA';
const BG = '#07071A';

function Particle({ delay, x, size, dur }: { delay: number; x: number; size: number; dur: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -28] });
  const op = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.7, 0.2] });
  return (
    <Animated.View style={{
      position: 'absolute',
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: ACCENT2,
      left: x, bottom: height * 0.35,
      opacity: op,
      transform: [{ translateY: ty }],
      ...(Platform.OS === 'web' ? { boxShadow: `0 0 ${size * 2}px ${ACCENT}` } as object : {}),
    }} />
  );
}

const PARTICLES = [
  { delay: 0,    x: width * 0.12, size: 4,  dur: 2200 },
  { delay: 400,  x: width * 0.25, size: 3,  dur: 2600 },
  { delay: 200,  x: width * 0.38, size: 5,  dur: 1900 },
  { delay: 700,  x: width * 0.55, size: 3,  dur: 2400 },
  { delay: 100,  x: width * 0.68, size: 6,  dur: 2100 },
  { delay: 500,  x: width * 0.80, size: 4,  dur: 2700 },
  { delay: 300,  x: width * 0.90, size: 3,  dur: 2000 },
];

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const screenFade  = useRef(new Animated.Value(1)).current;

  const ring1Scale  = useRef(new Animated.Value(0.5)).current;
  const ring1Opac   = useRef(new Animated.Value(0)).current;
  const ring2Scale  = useRef(new Animated.Value(0.5)).current;
  const ring2Opac   = useRef(new Animated.Value(0)).current;

  const logoScale   = useRef(new Animated.Value(0)).current;
  const logoOpac    = useRef(new Animated.Value(0)).current;
  const logoRotY    = useRef(new Animated.Value(-30)).current;

  const glowOpac    = useRef(new Animated.Value(0)).current;
  const glowPulse   = useRef(new Animated.Value(1)).current;

  const textOpac    = useRef(new Animated.Value(0)).current;
  const textSlide   = useRef(new Animated.Value(16)).current;

  const tagOpac     = useRef(new Animated.Value(0)).current;

  const barWidth    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(ring1Scale, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(ring1Opac,  { toValue: 0.6, duration: 500, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(ring2Opac,  { toValue: 0.4, duration: 500, useNativeDriver: false }),
        Animated.spring(logoScale,  { toValue: 1, friction: 6, tension: 90, useNativeDriver: false }),
        Animated.timing(logoOpac,   { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(logoRotY,   { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.4)), useNativeDriver: false }),
        Animated.timing(glowOpac,   { toValue: 1, duration: 600, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(textOpac,   { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(textSlide,  { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(tagOpac,    { toValue: 1, duration: 500, useNativeDriver: false }),
      ]),
      Animated.timing(barWidth,     { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1.12, duration: 200, useNativeDriver: false }),
          Animated.timing(glowPulse, { toValue: 1,    duration: 200, useNativeDriver: false }),
        ])
      ).start();
      setTimeout(() => {
        Animated.timing(screenFade, { toValue: 0, duration: 420, useNativeDriver: false }).start(onDone);
      }, 320);
    });
  }, []);

  const barW = barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const barCol = barWidth.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: ['#5E5CE6', '#A78BFA', '#7C6EF8', '#5E5CE6'],
  });

  const perspective3D = Platform.OS === 'web'
    ? { perspective: 800 } as object
    : {};

  const skewX = logoRotY.interpolate({ inputRange: [-30, 0], outputRange: ['-8deg', '0deg'] });

  return (
    <Animated.View style={{
      flex: 1, backgroundColor: BG,
      alignItems: 'center', justifyContent: 'center',
      opacity: screenFade,
    }}>

      {/* Deep bg glow */}
      <View style={{
        position: 'absolute', width: 440, height: 440, borderRadius: 220,
        top: '15%', alignSelf: 'center',
        ...(Platform.OS === 'web'
          ? { background: 'radial-gradient(circle, rgba(94,92,230,0.13) 0%, transparent 70%)' } as object
          : { backgroundColor: ACCENT + '08' }),
      }} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* Outer ring */}
      <Animated.View style={{
        position: 'absolute',
        width: 260, height: 260, borderRadius: 130,
        borderWidth: 1, borderColor: ACCENT + '30',
        transform: [{ scale: ring1Scale }],
        opacity: ring1Opac,
      }} />

      {/* Inner ring */}
      <Animated.View style={{
        position: 'absolute',
        width: 186, height: 186, borderRadius: 93,
        borderWidth: 1.5, borderColor: ACCENT + '50',
        transform: [{ scale: ring2Scale }],
        opacity: ring2Opac,
      }} />

      {/* Glow circle */}
      <Animated.View style={{
        position: 'absolute',
        width: 130, height: 130, borderRadius: 65,
        opacity: glowOpac,
        transform: [{ scale: glowPulse }],
        ...(Platform.OS === 'web'
          ? { boxShadow: `0 0 80px 20px ${ACCENT}55` } as object
          : { backgroundColor: ACCENT + '15' }),
      }} />

      {/* Logo box — 3D flip effect */}
      <Animated.View style={{
        width: 114, height: 114, borderRadius: 30,
        backgroundColor: '#0E0E2A',
        borderWidth: 1.5, borderColor: ACCENT + '60',
        alignItems: 'center', justifyContent: 'center',
        opacity: logoOpac,
        transform: [
          { scale: logoScale },
          { skewX: skewX },
        ],
        ...(Platform.OS === 'web'
          ? {
            boxShadow: `0 0 40px ${ACCENT}60, 0 0 80px ${ACCENT}25, inset 0 1px 0 rgba(255,255,255,0.1)`,
            ...perspective3D,
          } as object
          : {}),
      }}>
        {/* Inner glow line top */}
        <View style={{
          position: 'absolute', top: 0, left: 16, right: 16, height: 1,
          backgroundColor: ACCENT + '80', borderRadius: 1,
        }} />

        {/* NEXA AI text as the logo mark */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 28, fontWeight: '900', letterSpacing: -1,
            color: '#FFFFFF',
            ...(Platform.OS === 'web' ? { textShadow: `0 0 20px ${ACCENT}` } as object : {}),
          }}>N<Text style={{ color: ACCENT2 }}>X</Text></Text>
          <View style={{
            width: 44, height: 2, borderRadius: 1,
            backgroundColor: ACCENT, marginTop: 2,
            ...(Platform.OS === 'web' ? { boxShadow: `0 0 8px ${ACCENT}` } as object : {}),
          }} />
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.View style={{
        marginTop: 28, alignItems: 'center',
        opacity: textOpac,
        transform: [{ translateY: textSlide }],
      }}>
        <Text style={{
          fontSize: 38, fontWeight: '900',
          letterSpacing: -1.5, color: '#FFFFFF',
          ...(Platform.OS === 'web' ? { textShadow: '0 2px 24px rgba(124,110,248,0.5)' } as object : {}),
        }}>
          NEXA <Text style={{ color: ACCENT2 }}>AI</Text>
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={{
        fontSize: 10, fontWeight: '600', letterSpacing: 3.5,
        color: '#8080A0', marginTop: 8, opacity: tagOpac,
      }}>
        CONTENT · STRATEGY · AI
      </Animated.Text>

      {/* Loading bar */}
      <View style={{
        position: 'absolute', bottom: 88,
        width: width * 0.48, height: 2,
        backgroundColor: '#1A1A3A', borderRadius: 2, overflow: 'hidden',
      }}>
        <Animated.View style={{
          height: 2, borderRadius: 2,
          width: barW, backgroundColor: barCol,
          ...(Platform.OS === 'web' ? { boxShadow: '0 0 10px #7C6EF8CC' } as object : {}),
        }} />
      </View>

      {/* Version */}
      <Animated.Text style={{
        position: 'absolute', bottom: 62,
        fontSize: 9, fontWeight: '500', letterSpacing: 2,
        color: '#3A3A5C', opacity: tagOpac,
      }}>
        v1.0 · NEURAL CORE
      </Animated.Text>

    </Animated.View>
  );
}
