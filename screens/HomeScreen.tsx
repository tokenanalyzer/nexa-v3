import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';

const { width } = Dimensions.get('window');

export default function HomeScreen({ theme, setTheme }: { theme: ThemeKey; setTheme: (t: ThemeKey) => void }) {
  const T = THEMES[theme];
  const [pulse, setPulse] = useState([40,70,45,90,65,100,50,80,60,85]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => {
      setPulse(Array.from({length:10}, () => Math.floor(Math.random()*70)+20));
      setTime(new Date());
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const stats = [
    { label: 'PLATFORMS', value: '6' },
    { label: 'AI MODEL', value: '2.5' },
    { label: 'MODE', value: 'LIVE' },
  ];

  return (
    <ScrollView style={{flex:1, background:T.bg}} contentContainerStyle={{padding:20, paddingBottom:100}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <View>
          <Text style={{color:T.muted, fontSize:10, fontWeight:'900', letterSpacing:2}}>NEURAL CORE</Text>
          <Text style={{color:T.text, fontSize:22, fontWeight:'900', marginTop:2}}>NEXA <Text style={{color:T.accent}}>AI</Text></Text>
        </View>
        <View style={{width:10, height:10, borderRadius:5, backgroundColor:T.accent}}/>
      </View>

      {/* Theme switcher */}
      <View style={{marginBottom:20}}>
        <Text style={{color:T.muted, fontSize:9, fontWeight:'900', letterSpacing:2, marginBottom:10}}>THEME</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection:'row', gap:8}}>
            {(Object.keys(THEMES) as ThemeKey[]).map(k => (
              <TouchableOpacity key={k} onPress={() => setTheme(k)}
                style={{paddingHorizontal:14, paddingVertical:8, borderRadius:20,
                  borderWidth: theme===k ? 1.5 : 1,
                  borderColor: theme===k ? THEMES[k].accent : '#222',
                  backgroundColor: theme===k ? THEMES[k].accent+'20' : THEMES[k].bg}}>
                <Text style={{color: theme===k ? THEMES[k].accent : '#555', fontSize:11, fontWeight:'900'}}>{THEMES[k].name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Stats row */}
      <View style={{flexDirection:'row', gap:10, marginBottom:20}}>
        {stats.map(s => (
          <View key={s.label} style={{flex:1, backgroundColor:T.surface, borderRadius:14, padding:14, borderWidth:1, borderColor:T.card, alignItems:'center'}}>
            <Text style={{color:T.accent, fontSize:16, fontWeight:'900'}}>{s.value}</Text>
            <Text style={{color:T.muted, fontSize:7, fontWeight:'900', marginTop:4, letterSpacing:1}}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Pulse */}
      <View style={{backgroundColor:T.surface, borderRadius:20, padding:20, marginBottom:16, borderWidth:1, borderColor:T.card}}>
        <Text style={{color:T.accent, fontSize:9, fontWeight:'900', letterSpacing:2, marginBottom:14}}>⚡ NEURAL PULSE</Text>
        <View style={{flexDirection:'row', alignItems:'flex-end', height:60, gap:4}}>
          {pulse.map((h,i) => (
            <View key={i} style={{flex:1, height:(h/100)*60, backgroundColor:T.accent, borderRadius:4, opacity:0.4+(i/10)*0.6}}/>
          ))}
        </View>
      </View>

      {/* Time */}
      <View style={{backgroundColor:T.surface, borderRadius:16, padding:16, borderWidth:1, borderColor:T.card, alignItems:'center'}}>
        <Text style={{color:T.accent, fontSize:28, fontWeight:'900', letterSpacing:4}}>
          {time.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}
        </Text>
        <Text style={{color:T.muted, fontSize:9, fontWeight:'900', letterSpacing:2, marginTop:4}}>SYSTEM ACTIVE</Text>
      </View>
    </ScrollView>
  );
}
