import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Share, Clipboard } from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';
import { sendMessage, PLATFORMS } from '../constants/gemini';

export default function ForgeScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const [topic, setTopic] = useState('');
  const [selected, setSelected] = useState<string[]>(['instagram']);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const togglePlatform = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(p=>p!==id) : [...prev, id]);
  };

  const forge = async () => {
    if (!topic.trim() || !selected.length || loading) return;
    setLoading(true); setResult('');
    const names = selected.map(s => PLATFORMS.find(p=>p.id===s)?.name).join(', ');
    const prompt = `Create viral social media content for: "${topic}" on platforms: ${names}. For each platform give: complete post, hashtags, viral hook, CTA. Make it trendy for 2026 audience.`;
    try {
      const reply = await sendMessage(prompt, []);
      setResult(reply);
    } catch(e:any) {
      setResult('Error: ' + e.message);
    } finally { setLoading(false); }
  };

  const copy = () => {
    Clipboard.setString(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <KeyboardAvoidingView style={{flex:1, backgroundColor:T.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
      <ScrollView contentContainerStyle={{padding:20, paddingBottom:120}}>
        <Text style={{color:T.text, fontSize:18, fontWeight:'900', marginBottom:4}}>FORGE <Text style={{color:T.accent}}>CONTENT</Text></Text>
        <Text style={{color:T.muted, fontSize:9, letterSpacing:2, marginBottom:20}}>MULTI-PLATFORM AI GENERATOR</Text>
        <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:20}}>
          {PLATFORMS.map(p => (
            <TouchableOpacity key={p.id} onPress={() => togglePlatform(p.id)}
              style={{paddingHorizontal:12, paddingVertical:8, borderRadius:20,
                borderWidth:selected.includes(p.id)?1.5:1,
                borderColor:selected.includes(p.id)?p.color:'#222',
                backgroundColor:selected.includes(p.id)?p.color+'20':T.surface}}>
              <Text style={{color:selected.includes(p.id)?p.color:T.muted, fontSize:12, fontWeight:'700'}}>{p.icon} {p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{backgroundColor:T.surface, borderRadius:16, padding:16, borderWidth:1, borderColor:T.card, marginBottom:14}}>
          <TextInput value={topic} onChangeText={setTopic} placeholder="Enter your topic or idea..." placeholderTextColor={T.muted}
            style={{color:T.text, fontSize:15, minHeight:60}} multiline/>
        </View>
        <TouchableOpacity onPress={forge} disabled={loading || !topic.trim() || !selected.length}
          style={{backgroundColor:loading?T.surface:T.accent, borderRadius:14, height:54,
            alignItems:'center', justifyContent:'center', flexDirection:'row', gap:10, marginBottom:14,
            borderWidth:1, borderColor:loading?T.card:'transparent'}}>
          {loading && <ActivityIndicator color={T.accent}/>}
          <Text style={{color:loading?T.muted:'#000', fontWeight:'900', fontSize:14}}>
            {loading ? 'FORGING...' : `⚡ FORGE FOR ${selected.length} PLATFORM${selected.length>1?'S':''}`}
          </Text>
        </TouchableOpacity>
        {result ? (
          <>
            <View style={{flexDirection:'row', gap:8, marginBottom:12}}>
              <TouchableOpacity onPress={copy} style={{flex:1, padding:12, backgroundColor:T.surface, borderRadius:10, alignItems:'center', borderWidth:1, borderColor:T.card}}>
                <Text style={{color:T.accent, fontSize:12, fontWeight:'900'}}>{copied?'✅ COPIED!':'📋 COPY'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Share.share({message:result})} style={{flex:1, padding:12, backgroundColor:T.surface, borderRadius:10, alignItems:'center', borderWidth:1, borderColor:T.card}}>
                <Text style={{color:T.accent, fontSize:12, fontWeight:'900'}}>📤 SHARE</Text>
              </TouchableOpacity>
            </View>
            <View style={{backgroundColor:T.surface, borderRadius:16, padding:16, borderWidth:1, borderLeftWidth:3, borderColor:T.card, borderLeftColor:T.accent}}>
              <Text style={{color:T.text, fontSize:13, lineHeight:22}}>{result}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
