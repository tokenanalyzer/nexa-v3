import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';
import { sendMessage } from '../constants/gemini';

interface Msg { role: 'user'|'model'; text: string; }

export default function IntelScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    const newMsgs: Msg[] = [...msgs, { role: 'user', text: q }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const history = newMsgs.slice(0,-1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const reply = await sendMessage(q, history);
      setMsgs(prev => [...prev, { role: 'model', text: reply }]);
    } catch(e:any) {
      setMsgs(prev => [...prev, { role: 'model', text: 'Error: ' + e.message }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const QUICK = ['Viral Instagram reel idea','YouTube title ideas','Twitter thread topic','LinkedIn post idea'];

  return (
    <KeyboardAvoidingView style={{flex:1, backgroundColor:T.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={{padding:20, paddingBottom:10, borderBottomWidth:1, borderBottomColor:T.card}}>
        <Text style={{color:T.text, fontSize:18, fontWeight:'900'}}>INTEL <Text style={{color:T.accent}}>CHAT</Text></Text>
        <Text style={{color:T.muted, fontSize:9, letterSpacing:2, marginTop:2}}>FULL MEMORY • GEMINI 2.0</Text>
      </View>
      <ScrollView ref={scrollRef} style={{flex:1, padding:16}} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
        {msgs.length === 0 && (
          <View style={{alignItems:'center', paddingTop:40}}>
            <Text style={{fontSize:32, marginBottom:12}}>🧠</Text>
            <Text style={{color:T.muted, fontSize:11, letterSpacing:2, fontWeight:'900', marginBottom:24}}>NEURAL CORE READY</Text>
            <View style={{width:'100%', gap:8}}>
              {QUICK.map(q => (
                <TouchableOpacity key={q} onPress={() => send(q)}
                  style={{backgroundColor:T.surface, borderRadius:12, padding:14, borderWidth:1, borderColor:T.card}}>
                  <Text style={{color:T.accent, fontSize:12, fontWeight:'700'}}>⚡ {q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {msgs.map((m, i) => (
          <View key={i} style={{marginBottom:12, alignItems:m.role==='user'?'flex-end':'flex-start'}}>
            <View style={{maxWidth:'85%', padding:12, borderRadius:m.role==='user'?18:14,
              backgroundColor:m.role==='user'?T.accent:T.surface,
              borderWidth:m.role==='model'?1:0, borderColor:T.card}}>
              <Text style={{color:m.role==='user'?'#000':T.text, fontSize:13, lineHeight:20, fontWeight:m.role==='user'?'900':'400'}}>{m.text}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={{alignItems:'flex-start', marginBottom:12}}>
            <View style={{padding:14, borderRadius:14, backgroundColor:T.surface, borderWidth:1, borderColor:T.card, flexDirection:'row', gap:8, alignItems:'center'}}>
              <ActivityIndicator size="small" color={T.accent}/>
              <Text style={{color:T.muted, fontSize:11}}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={{padding:12, borderTopWidth:1, borderTopColor:T.card, flexDirection:'row', gap:10, alignItems:'flex-end'}}>
        <View style={{flex:1, backgroundColor:T.surface, borderRadius:16, borderWidth:1, borderColor:T.card, paddingHorizontal:14, paddingVertical:10}}>
          <TextInput value={input} onChangeText={setInput} placeholder="Ask anything..." placeholderTextColor={T.muted}
            style={{color:T.text, fontSize:14, maxHeight:100}} multiline/>
        </View>
        <TouchableOpacity onPress={() => send()} disabled={loading || !input.trim()}
          style={{width:48, height:48, borderRadius:14, backgroundColor:input.trim()?T.accent:T.surface, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:T.card}}>
          <Text style={{fontSize:20}}>{loading ? '⏳' : '➤'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
