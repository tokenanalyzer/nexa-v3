import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const logoScale   = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;
  const screenFade  = useRef(new Animated.Value(1)).current;
  const pulse       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 7, tension: 80, useNativeDriver: false }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, useNativeDriver: false }),
      ]),
      Animated.timing(tagOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(barWidth,   { toValue: 1, duration: 900, useNativeDriver: false }),
    ]).start(() => {
      Animated.sequence([
        Animated.timing(pulse,      { toValue: 1.05, duration: 160, useNativeDriver: false }),
        Animated.timing(pulse,      { toValue: 1,    duration: 160, useNativeDriver: false }),
        Animated.delay(100),
        Animated.timing(screenFade, { toValue: 0,    duration: 360, useNativeDriver: false }),
      ]).start(onDone);
    });
  }, []);

  const barWidthInterp = barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const barColor = barWidth.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#5E5CE6', '#A78BFA', '#5E5CE6'],
  });

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', opacity: screenFade }}>

      {/* Subtle background circles */}
      <View style={{
        position: 'absolute', width: 340, height: 340, borderRadius: 170,
        backgroundColor: '#5E5CE608', top: '15%', alignSelf: 'center',
      }} />
      <View style={{
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#5E5CE610', alignSelf: 'center',
      }} />

      {/* Logo + title */}
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: logoScale }], opacity: logoOpacity }}>

        {/* Logo frame */}
        <Animated.View style={{
          width: 120, height: 120, borderRadius: 32,
          backgroundColor: '#FFFFFF',
          borderWidth: 1.5, borderColor: '#E5E5EA',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          transform: [{ scale: pulse }],
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 8px 40px rgba(94,92,230,0.18), 0 2px 12px rgba(0,0,0,0.08)' } as object
            : {}),
        }}>
          <Image
            source={require('../assets/icon.png')}
            style={{ width: 90, height: 90 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name */}
        <Text style={{ fontSize: 36, fontWeight: '800', letterSpacing: -1, color: '#1D1D1F' }}>
          NEXA <Text style={{ color: '#5E5CE6' }}>PRO</Text>
        </Text>

        {/* Tagline */}
        <Animated.Text style={{
          fontSize: 11, fontWeight: '600', letterSpacing: 3,
          color: '#6E6E73', marginTop: 7, opacity: tagOpacity,
        }}>
          AI CONTENT STRATEGY
        </Animated.Text>
      </Animated.View>

      {/* Loading bar */}
      <View style={{
        position: 'absolute', bottom: 90,
        width: width * 0.5, height: 3,
        backgroundColor: '#F0F0F5', borderRadius: 3, overflow: 'hidden',
      }}>
        <Animated.View style={{
          height: 3, borderRadius: 3,
          width: barWidthInterp,
          backgroundColor: barColor,
          ...(Platform.OS === 'web' ? { boxShadow: '0 0 8px #5E5CE680' } as object : {}),
        }} />
      </View>

      {/* Version */}
      <Animated.Text style={{
        position: 'absolute', bottom: 66,
        fontSize: 9, fontWeight: '500', letterSpacing: 1.5,
        color: '#AEAEB2', opacity: tagOpacity,
      }}>
        v3.0 · NEURAL CORE
      </Animated.Text>

    </Animated.View>
  );
}
