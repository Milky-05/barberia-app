import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

export default function MieiAppuntamenti() {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    init();
  }, []);

  const init = async () => {
    const t = await AsyncStorage.getItem('token');
    setToken(t || '');
    carica(t || '');
  };

  const carica = async (t?: string) => {
    setLoading(true);
    const tkn = t || token;
    try {
      const res = await fetch(`${BACKEND_URL}/api/prenotazioni/miei`, { headers: { 'Authorization': `Bearer ${tkn}` } });
      const data = await res.json();
      setPrenotazioni(Array.isArray(data) ? data : []);
    } catch (err) {}
    setLoading(false);
  };

  const cancella = async (id: number) => {
    if (Platform.OS === 'web') { if (!window.confirm("Cancellare questo appuntamento?")) return; }
    try {
      await fetch(`${BACKEND_URL}/api/prenotazioni/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      carica();
    } catch (err) {}
  };

  const fmtData = (d: string) => {
    const dt = new Date(d);
    const g = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
    const m = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    return { giorno: g[dt.getDay()], numero: dt.getDate(), mese: m[dt.getMonth()] };
  };

  return (
    <SafeAreaView style={st.container}>
      <Animated.View style={[st.header, { opacity: headerOp }]}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Indietro</Text>
        </Pressable>
        <Text style={st.title}>I Miei Appuntamenti</Text>
      </Animated.View>

      {loading ? <ActivityIndicator color="#D4AF37" size="large" style={{marginTop:50}} />
      : prenotazioni.length === 0 ? (
        <View style={st.emptyBox}>
          <Text style={{fontSize:50,marginBottom:16}}>📋</Text>
          <Text style={st.emptyTitle}>Nessun appuntamento</Text>
          <Text style={st.emptySub}>Prenota il tuo primo taglio!</Text>
          <Pressable style={st.ctaBtn} onPress={() => router.push('/scelta-sede' as any)}>
            <Text style={st.ctaText}>Prenota Ora</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList data={prenotazioni} keyExtractor={i => i.id.toString()} showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const d = fmtData(item.data);
            return (
              <View style={st.card}>
                <View style={st.cardRow}>
                  <View style={st.dateBox}>
                    <Text style={st.dateDay}>{d.giorno}</Text>
                    <Text style={st.dateNum}>{d.numero}</Text>
                    <Text style={st.dateMon}>{d.mese}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={st.cardServ}>{item.servizio_nome}</Text>
                    <Text style={st.cardDet}>🕐 {item.ora?.slice(0,5)}  💈 {item.barbiere_nome}</Text>
                    <Text style={st.sedeTag}>📍 {item.sede_nome}</Text>
                  </View>
                  <Text style={st.cardPrice}>€{item.servizio_prezzo}</Text>
                </View>
                <View style={st.cardFoot}>
                  <View style={st.statoChip}><Text style={st.statoText}>● Confermato</Text></View>
                  <Pressable style={st.cancelBtn} onPress={() => cancella(item.id)}>
                    <Text style={st.cancelText}>Cancella</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  header: { marginTop: 20, marginBottom: 20 },
  backBtn: { marginBottom: 20, cursor: 'pointer' as any },
  backText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  card: { backgroundColor: '#141414', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1E1E1E' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dateBox: { width: 60, height: 70, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  dateDay: { color: '#D4AF37', fontSize: 11, fontWeight: '600' },
  dateNum: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  dateMon: { color: '#666', fontSize: 11, fontWeight: '600' },
  cardServ: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  cardDet: { color: '#666', fontSize: 13, marginBottom: 4 },
  sedeTag: { color: '#D4AF37', fontSize: 11, fontWeight: '600' },
  cardPrice: { color: '#D4AF37', fontSize: 22, fontWeight: '800' },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1E1E1E', paddingTop: 12 },
  statoChip: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(76,175,80,0.1)' },
  statoText: { fontSize: 12, fontWeight: '700', color: '#4CAF50' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10, backgroundColor: 'rgba(244,67,54,0.08)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)', cursor: 'pointer' as any },
  cancelText: { color: '#F44336', fontWeight: '700', fontSize: 13 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyTitle: { color: '#555', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: '#444', fontSize: 14, marginBottom: 24 },
  ctaBtn: { backgroundColor: '#D4AF37', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, cursor: 'pointer' as any },
  ctaText: { color: '#0A0A0A', fontSize: 16, fontWeight: '800' },
});
