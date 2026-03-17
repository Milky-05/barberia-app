import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

// ⚠️ METTI QUI IL TUO BACKEND URL ⚠️
const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

const getIcona = (nome: string) => {
  const n = nome.toLowerCase();
  if (n.includes('bimbo') || n.includes('under')) return '👦';
  if (n.includes('taglio') && n.includes('modellatura')) return '💇‍♂️';
  if (n.includes('taglio') && n.includes('rifinitura')) return '✂️';
  if (n.includes('taglio')) return '💈';
  if (n.includes('modellatura') && n.includes('rasatura')) return '🧖‍♂️';
  if (n.includes('modellatura')) return '🪒';
  if (n.includes('rasatura')) return '🧔';
  if (n.includes('rifinitura')) return '✨';
  if (n.includes('trattamento')) return '💆‍♂️';
  return '💈';
};

export default function ListinoServizi() {
  const { sede_id, nome_sede } = useLocalSearchParams();
  const [servizi, setServizi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    
    fetch(`${BACKEND_URL}/api/servizi`)
      .then(res => res.json())
      .then(data => { setServizi(data); setLoading(false); })
      .catch(err => { console.log("Errore:", err); setLoading(false); });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Indietro</Text>
          </Pressable>
          <Text style={styles.title}>I Nostri Servizi</Text>
          <Text style={styles.subtitle}>Listino prezzi</Text>
          <View style={styles.divider} />
        </Animated.View>

        {loading ? (
          <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.cardsContainer}>
            {servizi.map((item, index) => (
              <ServiceCard key={item.id} item={item} index={index} />
            ))}


          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceCard({ item, index }: { item: any; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(translate, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 100 + index * 120);
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY: translate }] }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardIconContainer}>
          <Text style={styles.cardIcon}>{getIcona(item.nome)}</Text>
        </View>
        <View style={styles.cardPriceContainer}>
          <Text style={styles.cardPriceSymbol}>€</Text>
          <Text style={styles.cardPrice}>{Number(item.prezzo).toFixed(0)}</Text>
        </View>
      </View>
      <Text style={styles.cardNome}>{item.nome}</Text>
      {item.descrizione && <Text style={styles.cardDescrizione}>{item.descrizione}</Text>}
      <View style={styles.cardFooter}>
        <View style={styles.durationChip}>
          <Text style={styles.durationText}>⏳ {item.durata_minuti} min</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  header: { marginTop: 20, marginBottom: 25 },
  backButton: { marginBottom: 20, cursor: 'pointer' as any },
  backButtonText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#555', marginBottom: 20 },
  divider: { height: 2, backgroundColor: '#1E1E1E', borderRadius: 1 },
  cardsContainer: { gap: 14 },
  card: { 
    backgroundColor: '#141414', borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardIconContainer: { 
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardIcon: { fontSize: 26 },
  cardPriceContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  cardPriceSymbol: { color: '#D4AF37', fontSize: 16, fontWeight: '600', marginTop: 4, marginRight: 2 },
  cardPrice: { color: '#D4AF37', fontSize: 36, fontWeight: '800' },
  cardNome: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  cardDescrizione: { color: '#555', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  cardFooter: { flexDirection: 'row' },
  durationChip: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 10 
  },
  durationText: { color: '#666', fontSize: 13 },

});
