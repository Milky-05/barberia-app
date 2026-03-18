import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

const SEDI_INFO = [
  {
    id: 1, nome: 'Colonna',
    indirizzo: 'Via Roma 1, Colonna (RM)',
    telefono: '06 1234567',
  },
  {
    id: 2, nome: 'Frascati',
    indirizzo: 'Corso Italia 15, Frascati (RM)',
    telefono: '06 7654321',
  },
];

export default function SediInfo() {
  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sedeAperta, setSedeAperta] = useState<number|null>(null);
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    caricaBarbieri();
  }, []);

  const caricaBarbieri = async () => {
    try {
      // Carica barbieri per entrambe le sedi
      const res1 = await fetch(`${BACKEND_URL}/api/barbieri/1`);
      const res2 = await fetch(`${BACKEND_URL}/api/barbieri/2`);
      const b1 = await res1.json();
      const b2 = await res2.json();
      setBarbieri([{ sede_id: 1, barbieri: b1 }, { sede_id: 2, barbieri: b2 }]);
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const getBarbieri = (sedeId: number) => {
    const sede = barbieri.find(b => b.sede_id === sedeId);
    return sede?.barbieri || [];
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[st.header, { opacity: headerOp }]}>
          <Pressable onPress={() => router.back()} style={st.backBtn}><Text style={st.backText}>← Indietro</Text></Pressable>
          <Text style={st.title}>Le Nostre Sedi</Text>
          <Text style={st.subtitle}>Scopri dove trovarci</Text>
        </Animated.View>

        {loading ? <ActivityIndicator color="#D4AF37" size="large" style={{marginTop:50}} /> : (
          <View style={st.sediList}>
            {SEDI_INFO.map((sede, index) => (
              <SedeCard key={sede.id} sede={sede} index={index} barbieri={getBarbieri(sede.id)} aperta={sedeAperta === sede.id} onToggle={() => setSedeAperta(sedeAperta === sede.id ? null : sede.id)} />
            ))}
          </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SedeCard({ sede, index, barbieri, aperta, onToggle }: any) {
  const op = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(y, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 200 + index * 150);
  }, []);

  return (
    <Animated.View style={[st.sedeCard, { opacity: op, transform: [{ translateY: y }] }]}>
      {/* Header cliccabile */}
      <Pressable style={st.sedeHeader} onPress={onToggle}>
        <View style={st.sedeIconBox}><Text style={{fontSize:28}}>📍</Text></View>
        <View style={{flex:1}}>
          <Text style={st.sedeName}>{sede.nome}</Text>
          <Text style={st.sedeAddr}>{sede.indirizzo}</Text>
        </View>
        <Text style={st.sedeChevron}>{aperta ? '▲' : '▼'}</Text>
      </Pressable>

      {/* Dettagli espandibili */}
      {aperta && (
        <View style={st.sedeDetails}>
          <View style={st.divider} />

          {/* Telefono */}
          <View style={st.detailRow}>
            <Text style={st.detailIcon}>📞</Text>
            <View>
              <Text style={st.detailLabel}>Telefono</Text>
              <Text style={st.detailValue}>{sede.telefono}</Text>
            </View>
          </View>

          {/* Indirizzo */}
          <View style={st.detailRow}>
            <Text style={st.detailIcon}>🏠</Text>
            <View>
              <Text style={st.detailLabel}>Indirizzo</Text>
              <Text style={st.detailValue}>{sede.indirizzo}</Text>
            </View>
          </View>

          {/* Orari */}
          <View style={st.detailRow}>
            <Text style={st.detailIcon}>🕐</Text>
            <View>
              <Text style={st.detailLabel}>Orari di apertura</Text>
              <Text style={st.detailClosed}>Lunedì: Chiuso</Text>
              <Text style={st.detailValue}>Martedì: 9:00 - 19:00</Text>
              <Text style={st.detailValue}>Mercoledì: 9:00 - 19:00</Text>
              <Text style={st.detailValue}>Giovedì: 12:00 - 22:00</Text>
              <Text style={st.detailValue}>Venerdì: 9:00 - 19:00</Text>
              <Text style={st.detailValue}>Sabato: 9:00 - 19:00</Text>
              <Text style={st.detailClosed}>Domenica: Chiuso</Text>
            </View>
          </View>

          <View style={st.divider} />

          {/* Barbieri */}
          <Text style={st.barbieriTitle}>💈 I nostri barbieri</Text>
          <View style={st.barbieriGrid}>
            {barbieri.map((b: any) => (
              <View key={b.id} style={st.barbiereChip}>
                <View style={st.barbiereAvatar}><Text style={{fontSize:18}}>💈</Text></View>
                <Text style={st.barbiereName}>{b.nome}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  header: { marginTop: 20, marginBottom: 24 },
  backBtn: { marginBottom: 20, cursor: 'pointer' as any },
  backText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#555' },
  sediList: { gap: 16 },
  sedeCard: { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1E1E1E', overflow: 'hidden' },
  sedeHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, cursor: 'pointer' as any },
  sedeIconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  sedeName: { color: '#D4AF37', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  sedeAddr: { color: '#666', fontSize: 13 },
  sedeChevron: { color: '#D4AF37', fontSize: 14 },
  sedeDetails: { paddingHorizontal: 18, paddingBottom: 18 },
  divider: { height: 1, backgroundColor: '#1E1E1E', marginVertical: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  detailIcon: { fontSize: 20, marginTop: 2 },
  detailLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  detailValue: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  detailClosed: { color: '#F44336', fontSize: 14, marginTop: 2 },
  barbieriTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  barbieriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  barbiereChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1E1E1E', gap: 10 },
  barbiereAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212,175,55,0.12)', alignItems: 'center', justifyContent: 'center' },
  barbiereName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
