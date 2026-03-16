import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// ⚠️ METTI QUI IL TUO BACKEND URL ⚠️
const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

const icone: Record<string, string> = {
  'taglio': '✂️',
  'barba': '🪒',
  'taglio + barba': '💇‍♂️',
  'trattamento': '💆‍♂️',
};

const getIcona = (nome: string) => {
  const n = nome.toLowerCase();
  for (const key of Object.keys(icone)) {
    if (n.includes(key)) return icone[key];
  }
  return '💈';
};

export default function SceltaServizio() {
  const { sede_id, nome_sede } = useLocalSearchParams();
  const [servizi, setServizi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerTranslate, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/servizi`)
      .then(res => res.json())
      .then(data => {
        setServizi(data);
        setLoading(false);
      })
      .catch(err => {
        console.log("Errore:", err);
        setLoading(false);
        if (Platform.OS === 'web') {
          window.alert("Impossibile caricare i servizi. Controlla il server!");
        }
      });
  }, []);

  const selezionaServizio = (servizio: any) => {
    router.push({
      pathname: '/scelta-data',
      params: {
        sede_id: String(sede_id),
        nome_sede: String(nome_sede),
        servizio_id: servizio.id,
        servizio_nome: servizio.nome
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Indietro</Text>
        </Pressable>
        <Text style={styles.title}>Cosa facciamo oggi?</Text>
        <View style={styles.sedeChip}>
          <Text style={styles.sedeChipText}>📍 {nome_sede}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#D4AF37" size="large" />
          <Text style={styles.loadingText}>Caricamento servizi...</Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {servizi.map((item, index) => (
            <AnimatedCard key={item.id} item={item} index={index} onPress={selezionaServizio} />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function AnimatedCard({ item, index, onPress }: { item: any; index: number; onPress: (s: any) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(translate, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
      ]).start();
    }, 200 + index * 100);
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>
      <Pressable 
        style={({ pressed }) => [styles.serviceCard, pressed && styles.serviceCardPressed]}
        onPress={() => onPress(item)}
      >
        <View style={styles.serviceIconContainer}>
          <Text style={styles.serviceIcon}>{getIcona(item.nome)}</Text>
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.nome}</Text>
          {item.descrizione && <Text style={styles.serviceDesc}>{item.descrizione}</Text>}
          <View style={styles.serviceMeta}>
            <Text style={styles.serviceDuration}>⏳ {item.durata_minuti} min</Text>
          </View>
        </View>
        <View style={styles.servicePriceContainer}>
          <Text style={styles.servicePriceSymbol}>€</Text>
          <Text style={styles.servicePrice}>{Number(item.prezzo).toFixed(0)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  header: { marginTop: 20, marginBottom: 30 },
  backButton: { marginBottom: 20, cursor: 'pointer' as any },
  backButtonText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  sedeChip: { 
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.1)', 
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
  },
  sedeChipText: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#555', marginTop: 15, fontSize: 14 },
  cardsContainer: { gap: 12 },
  serviceCard: { 
    backgroundColor: '#141414', padding: 18, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#1E1E1E',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  serviceCardPressed: { 
    borderColor: '#D4AF37', backgroundColor: '#1A1A0A',
    transform: [{ scale: 0.98 }],
  },
  serviceIconContainer: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  serviceIcon: { fontSize: 26 },
  serviceInfo: { flex: 1 },
  serviceName: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  serviceDesc: { color: '#555', fontSize: 12, marginBottom: 6, lineHeight: 16 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center' },
  serviceDuration: { color: '#444', fontSize: 12 },
  servicePriceContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  servicePriceSymbol: { color: '#D4AF37', fontSize: 14, fontWeight: '600', marginTop: 2, marginRight: 1 },
  servicePrice: { color: '#D4AF37', fontSize: 28, fontWeight: '800' },
});
