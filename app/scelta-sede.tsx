import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function SceltaSede() {
  const headerOp = useRef(new Animated.Value(0)).current;
  const btn1Op = useRef(new Animated.Value(0)).current;
  const btn1Y = useRef(new Animated.Value(30)).current;
  const btn2Op = useRef(new Animated.Value(0)).current;
  const btn2Y = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(btn1Op, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(btn1Y, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 200);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(btn2Op, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(btn2Y, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 350);
  }, []);

  const scegliSede = (id: number, nome: string) => {
    router.push({ pathname: '/scelta-servizio' as any, params: { sede_id: id, nome_sede: nome } });
  };

  return (
    <SafeAreaView style={st.container}>
      <Animated.View style={[st.header, { opacity: headerOp }]}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Indietro</Text>
        </Pressable>
        <Text style={st.title}>Dove vuoi prenotare?</Text>
        <Text style={st.subtitle}>Scegli la sede</Text>
      </Animated.View>

      <View style={st.sediList}>
        <Animated.View style={{ opacity: btn1Op, transform: [{ translateY: btn1Y }] }}>
          <Pressable style={({ pressed }) => [st.sedeCard, pressed && st.sedeCardPressed]} onPress={() => scegliSede(1, 'Colonna')}>
            <View style={st.sedeIconBox}><Text style={{ fontSize: 28 }}>📍</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={st.sedeName}>Colonna</Text>
              <Text style={st.sedeAddr}>Via Roma 1, Colonna (RM)</Text>
            </View>
            <Text style={st.sedeArrow}>›</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={{ opacity: btn2Op, transform: [{ translateY: btn2Y }] }}>
          <Pressable style={({ pressed }) => [st.sedeCard, pressed && st.sedeCardPressed]} onPress={() => scegliSede(2, 'Frascati')}>
            <View style={st.sedeIconBox}><Text style={{ fontSize: 28 }}>📍</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={st.sedeName}>Frascati</Text>
              <Text style={st.sedeAddr}>Corso Italia 15, Frascati (RM)</Text>
            </View>
            <Text style={st.sedeArrow}>›</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  header: { marginTop: 20, marginBottom: 30 },
  backBtn: { marginBottom: 20, cursor: 'pointer' as any },
  backText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#555' },
  sediList: { gap: 14 },
  sedeCard: {
    backgroundColor: '#141414', padding: 20, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#1E1E1E',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sedeCardPressed: { borderColor: '#D4AF37', backgroundColor: '#1A1A0A', transform: [{ scale: 0.98 }] },
  sedeIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  sedeName: { color: '#D4AF37', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  sedeAddr: { color: '#666', fontSize: 13 },
  sedeArrow: { color: '#D4AF37', fontSize: 28, fontWeight: '300' },
});
