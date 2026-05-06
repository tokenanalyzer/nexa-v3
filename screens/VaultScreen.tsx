import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Share, Alert } from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';

interface VaultItem { id: number; title: string; content: string; date: string; platform: string; }

export default function VaultScreen({ theme }: { theme: ThemeKey }) {
  const T = THEMES[theme];
  const [items, setItems] = useState<VaultItem[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number|null>(null);

  useEffect(() => {
    try {
      const saved = require('@react-native-async-storage/async-storage');
    } catch {}
  }, []);

  const filtered = items.filter(i =>
    i.content.toLowerCase().includes(search.toLowerCase()) ||
    i.platform.toLowerCase().includes(search.toLowerCase())
  );

  const deleteItem = (id: number) => {
    Alert.alert('Delete?', 'Remove this from vault?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setItems(prev => prev.filter(i => i.id !== id)) }
    ]);
  };

  return (
    <View style={{flex:1, backgroundColor:T.bg}}>
      <View style={{padding:20, paddingBottom:10, borderBottomWidth:1, borderBottomColor:T.card}}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <View>
            <Text style={{color:T.text, fontSize:18, fontWeight:'900'}}>VAULT <Text style={{color:T.accent}}>({items.length})</Text></Text>
            <Text style={{color:T.muted, fontSize:9, letterSpacing:2, marginTop:2}}>SAVED CONTENT</Text>
          </View>
          {items.length > 0 && (
            <TouchableOpacity onPress={() => Alert.alert('Clear Vault?','Delete all saved content?',[
              {text:'Cancel',style:'cancel'},
              {text:'Clear All',style:'destructive',onPress:()=>setItems([])}
            ])} style={{padding:8, backgroundColor:T.surface, borderRadius:10, borderWidth:1, borderColor:T.card}}>
              <Text style={{color:'#FF3D00', fontSize:11, fontWeight:'900'}}>CLEAR</Text>
            </TouchableOpacity>
          )}
        </View>
        {items.length > 0 && (
          <View style={{backgroundColor:T.surface, borderRadius:12, paddingHorizontal:14, paddingVertical:10, flexDirection:'row', gap:10, alignItems:'center', borderWidth:1, borderColor:T.card}}>
            <Text style={{fontSize:14}}>🔍</Text>
            <TextInput value={search} onChangeText={setSearch} placeholder="Search vault..." placeholderTextColor={T.muted} style={{flex:1, color:T.text, fontSize:13}}/>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{padding:16, paddingBottom:100}}>
        {items.length === 0 ? (
          <View style={{alignItems:'center', paddingTop:80}}>
            <Text style={{fontSize:48, marginBottom:16}}>🗄️</Text>
            <Text style={{color:T.muted, fontSize:11, fontWeight:'900', letterSpacing:2}}>VAULT EMPTY</Text>
            <Text style={{color:T.card, fontSize:10, marginTop:8}}>Save content from Intel or Forge</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{alignItems:'center', paddingTop:60}}>
            <Text style={{color:T.muted, fontSize:11, fontWeight:'900', letterSpacing:2}}>NO RESULTS</Text>
          </View>
        ) : (
          filtered.map(item => (
            <View key={item.id} style={{marginBottom:10}}>
              <TouchableOpacity onPress={() => setExpanded(expanded === item.id ? null : item.id)}
                style={{backgroundColor:T.surface, borderRadius:14, padding:14, borderWidth:1, borderColor: expanded===item.id ? T.accent : T.card}}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <View style={{flex:1}}>
                    <Text style={{color:T.accent, fontSize:10, fontWeight:'900', marginBottom:4}}>{item.platform} • {item.date}</Text>
                    <Text style={{color:T.text, fontSize:12, lineHeight:18}} numberOfLines={2}>{item.content}</Text>
                  </View>
                  <Text style={{color:T.muted, fontSize:16, marginLeft:10}}>{expanded===item.id ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>
              {expanded === item.id && (
                <View style={{backgroundColor:T.bg, borderRadius:14, padding:14, borderWidth:1, borderColor:T.accent, borderTopWidth:0, borderTopLeftRadius:0, borderTopRightRadius:0, marginTop:-4}}>
                  <Text style={{color:T.text, fontSize:12, lineHeight:20, marginBottom:14}}>{item.content}</Text>
                  <View style={{flexDirection:'row', gap:8}}>
                    <TouchableOpacity onPress={() => Share.share({message:item.content})}
                      style={{flex:1, padding:10, backgroundColor:T.surface, borderRadius:10, alignItems:'center', borderWidth:1, borderColor:T.card}}>
                      <Text style={{color:T.accent, fontSize:11, fontWeight:'900'}}>📤 SHARE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteItem(item.id)}
                      style={{padding:10, backgroundColor:'#110000', borderRadius:10, alignItems:'center', borderWidth:1, borderColor:'#330000', paddingHorizontal:16}}>
                      <Text style={{color:'#FF3D00', fontSize:11, fontWeight:'900'}}>🗑️ DEL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
