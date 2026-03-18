import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['it'] = {
  monthNames: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  monthNamesShort: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
  dayNames: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
  dayNamesShort: ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
  today: 'Oggi'
};
LocaleConfig.defaultLocale = 'it';

// ⚠️ METTI QUI IL TUO BACKEND URL ⚠️
const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

export default function SceltaData() {
  const { sede_id, nome_sede, servizio_id, servizio_nome } = useLocalSearchParams();
  
  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [barbiereSelezionato, setBarbiereSelezionato] = useState<any>(null);
  const [dataSelezionata, setDataSelezionata] = useState<string>('');
  const [oraSelezionata, setOraSelezionata] = useState<string>('');
  const [orariDisponibili, setOrariDisponibili] = useState<string[]>([]);
  const [loadingOrari, setLoadingOrari] = useState(false);
  const [loadingBarbieri, setLoadingBarbieri] = useState(false);
  const [invioInCorso, setInvioInCorso] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step3Opacity = useRef(new Animated.Value(0)).current;
  const riepilogoOpacity = useRef(new Animated.Value(0)).current;

  const oggi = new Date();
  const dataOggiString = oggi.toISOString().split('T')[0];
  const treSettimane = new Date();
  treSettimane.setDate(oggi.getDate() + 21);
  const dataMassimaString = treSettimane.toISOString().split('T')[0];

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Carica barbieri quando si sceglie il giorno
  useEffect(() => {
    if (!dataSelezionata) return;
    setLoadingBarbieri(true);
    setBarbiereSelezionato(null);
    setOraSelezionata('');
    setOrariDisponibili([]);

    fetch(`${BACKEND_URL}/api/barbieri-disponibili?sede_id=${sede_id}&data=${dataSelezionata}`)
      .then(res => res.json())
      .then(data => {
        if (data.messaggio) {
          setBarbieri([]);
          Platform.OS === 'web' ? window.alert(data.messaggio) : Alert.alert("Chiuso", data.messaggio);
        } else {
          setBarbieri(data);
          Animated.timing(step2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
        setLoadingBarbieri(false);
      })
      .catch(err => { console.log(err); setLoadingBarbieri(false); });
  }, [dataSelezionata]);

  // Carica orari quando si sceglie il barbiere
  useEffect(() => {
    if (!barbiereSelezionato || !dataSelezionata) return;
    setLoadingOrari(true);
    setOraSelezionata('');

    fetch(`${BACKEND_URL}/api/orari-disponibili?barbiere_id=${barbiereSelezionato.id}&data=${dataSelezionata}&servizio_id=${servizio_id}`)
      .then(res => res.json())
      .then(data => {
        setOrariDisponibili(data);
        Animated.timing(step3Opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        setLoadingOrari(false);
      })
      .catch(err => { console.log(err); setLoadingOrari(false); });
  }, [barbiereSelezionato, dataSelezionata]);

  // Anima riepilogo
  useEffect(() => {
    if (oraSelezionata) {
      Animated.timing(riepilogoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [oraSelezionata]);

  const confermaPrenotazione = async () => {
    if (!dataSelezionata || !oraSelezionata || !barbiereSelezionato) {
      const msg = "Scegli una data, un barbiere e un orario.";
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Attenzione", msg);
      return;
    }
    setInvioInCorso(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/prenotazioni`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sede_id: Number(sede_id), barbiere_id: barbiereSelezionato.id,
          data: dataSelezionata, ora: oraSelezionata, servizio_id: Number(servizio_id)
        })
      });
      const result = await response.json();
      if (result.success) {
        await AsyncStorage.removeItem('appuntamenti_visti');
        const msg = `${servizio_nome} con ${barbiereSelezionato.nome}\n${dataSelezionata} alle ${oraSelezionata}`;
        if (Platform.OS === 'web') {
          window.alert("Confermato! 🎉\n\n" + msg);
          router.push({ pathname: '/home', params: { sede_id: String(sede_id), nome_sede: String(nome_sede) } });
        } else {
          Alert.alert("Confermato! 🎉", msg, [{ text: "OK", onPress: () => 
            router.push({ pathname: '/home', params: { sede_id: String(sede_id), nome_sede: String(nome_sede) } })
          }]);
        }
      } else {
        const err = result.error || "Impossibile salvare.";
        Platform.OS === 'web' ? window.alert("Errore: " + err) : Alert.alert("Errore", err);
      }
    } catch (error) {
      const msg = "Impossibile collegarsi al server.";
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Errore", msg);
    } finally { setInvioInCorso(false); }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    // Genera date per i prossimi 80 giorni, disabilita Lun (1) e Dom (0)
    for (let i = 0; i < 80; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const giorno = d.getDay();
      if (giorno === 0 || giorno === 1) {
        const anno = d.getFullYear();
        const mese = String(d.getMonth() + 1).padStart(2, '0');
        const gg = String(d.getDate()).padStart(2, '0');
        const key = `${anno}-${mese}-${gg}`;
        marked[key] = { disabled: true, disableTouchEvent: true };
      }
    }
    if (dataSelezionata) marked[dataSelezionata] = { ...marked[dataSelezionata], selected: true, selectedColor: '#D4AF37' };
    return marked;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Indietro</Text>
          </Pressable>
          <Text style={styles.title}>Prenota Appuntamento</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}><Text style={styles.chipText}>📍 {nome_sede}</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>✂️ {servizio_nome}</Text></View>
          </View>
        </Animated.View>

        {/* Step 1: Calendario */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepTitle}>Scegli il Giorno</Text>
          </View>
          <View style={styles.calendarContainer}>
            <Calendar
              firstDay={1}
              minDate={dataOggiString} maxDate={dataMassimaString}
              onDayPress={(day: any) => setDataSelezionata(day.dateString)}
              markedDates={getMarkedDates()}
              theme={{
                backgroundColor: '#0A0A0A', calendarBackground: '#141414',
                textSectionTitleColor: '#D4AF37', selectedDayBackgroundColor: '#D4AF37',
                selectedDayTextColor: '#0A0A0A', todayTextColor: '#D4AF37',
                dayTextColor: '#FFF', textDisabledColor: '#333',
                monthTextColor: '#D4AF37', arrowColor: '#D4AF37', textMonthFontWeight: 'bold',
              }}
            />
          </View>
        </View>

        {/* Step 2: Barbiere */}
        {dataSelezionata ? (
          <Animated.View style={[styles.stepContainer, { opacity: step2Opacity }]}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepTitle}>Scegli il Barbiere</Text>
            </View>
            {loadingBarbieri ? (
              <ActivityIndicator color="#D4AF37" size="small" style={{ marginVertical: 20 }} />
            ) : barbieri.length === 0 ? (
              <Text style={styles.emptyText}>Nessun barbiere disponibile</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {barbieri.map((b) => (
                  <Pressable key={b.id}
                    style={[styles.barberCard, barbiereSelezionato?.id === b.id && styles.barberCardSelected]}
                    onPress={() => setBarbiereSelezionato(b)}
                  >
                    <View style={[styles.barberAvatar, barbiereSelezionato?.id === b.id && styles.barberAvatarSelected]}>
                      <Text style={styles.barberAvatarText}>💈</Text>
                    </View>
                    <Text style={[styles.barberName, barbiereSelezionato?.id === b.id && styles.barberNameSelected]}>{b.nome}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        ) : null}

        {/* Step 3: Orario */}
        {barbiereSelezionato ? (
          <Animated.View style={[styles.stepContainer, { opacity: step3Opacity }]}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepTitle}>Scegli l'Orario</Text>
            </View>
            {loadingOrari ? (
              <ActivityIndicator color="#D4AF37" size="small" style={{ marginVertical: 20 }} />
            ) : orariDisponibili.length === 0 ? (
              <Text style={styles.emptyText}>Nessun orario disponibile</Text>
            ) : (
              <View style={styles.timeGrid}>
                {orariDisponibili.map((ora) => (
                  <Pressable key={ora}
                    style={[styles.timeBtn, oraSelezionata === ora && styles.timeBtnSelected]}
                    onPress={() => setOraSelezionata(ora)}
                  >
                    <Text style={[styles.timeText, oraSelezionata === ora && styles.timeTextSelected]}>{ora}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>
        ) : null}

        {/* Riepilogo */}
        {oraSelezionata ? (
          <Animated.View style={[styles.riepilogo, { opacity: riepilogoOpacity }]}>
            <Text style={styles.riepilogoTitle}>Riepilogo</Text>
            <View style={styles.riepilogoRow}><Text style={styles.riepilogoLabel}>Sede</Text><Text style={styles.riepilogoValue}>{nome_sede}</Text></View>
            <View style={styles.riepilogoRow}><Text style={styles.riepilogoLabel}>Servizio</Text><Text style={styles.riepilogoValue}>{servizio_nome}</Text></View>
            <View style={styles.riepilogoRow}><Text style={styles.riepilogoLabel}>Barbiere</Text><Text style={styles.riepilogoValue}>{barbiereSelezionato?.nome}</Text></View>
            <View style={styles.riepilogoRow}><Text style={styles.riepilogoLabel}>Data</Text><Text style={styles.riepilogoValue}>{dataSelezionata}</Text></View>
            <View style={styles.riepilogoRow}><Text style={styles.riepilogoLabel}>Ora</Text><Text style={styles.riepilogoValue}>{oraSelezionata}</Text></View>
            
            <Pressable 
              style={[styles.confirmBtn, invioInCorso && styles.confirmBtnDisabled]}
              onPress={confermaPrenotazione} disabled={invioInCorso}
            >
              <Text style={styles.confirmBtnText}>{invioInCorso ? "Invio..." : "Conferma Appuntamento"}</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  header: { marginTop: 20, marginBottom: 10 },
  backButton: { marginBottom: 20, cursor: 'pointer' as any },
  backButtonText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: 'rgba(212,175,55,0.1)', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16 },
  chipText: { color: '#D4AF37', fontSize: 12, fontWeight: '600' },
  stepContainer: { marginTop: 24 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  stepNumber: { 
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { color: '#0A0A0A', fontSize: 14, fontWeight: '800' },
  stepTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  calendarContainer: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1E1E1E' },
  horizontalScroll: { flexDirection: 'row' },
  barberCard: { 
    alignItems: 'center', padding: 14, borderRadius: 14, marginRight: 12,
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', minWidth: 90,
    cursor: 'pointer' as any,
  },
  barberCardSelected: { borderColor: '#D4AF37', backgroundColor: '#141208' },
  barberAvatar: { 
    width: 50, height: 50, borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  barberAvatarSelected: { backgroundColor: 'rgba(212,175,55,0.15)' },
  barberAvatarText: { fontSize: 22 },
  barberName: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  barberNameSelected: { color: '#D4AF37' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeBtn: { 
    backgroundColor: '#141414', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12,
    borderWidth: 1, borderColor: '#1E1E1E', width: '30%', alignItems: 'center',
    cursor: 'pointer' as any,
  },
  timeBtnSelected: { borderColor: '#D4AF37', backgroundColor: '#141208' },
  timeText: { color: '#AAA', fontSize: 15, fontWeight: '600' },
  timeTextSelected: { color: '#D4AF37' },
  emptyText: { color: '#444', fontSize: 14, textAlign: 'center', marginVertical: 20 },
  riepilogo: { 
    backgroundColor: '#141414', borderRadius: 18, padding: 22, marginTop: 28,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  riepilogoTitle: { color: '#D4AF37', fontSize: 20, fontWeight: '800', marginBottom: 18, textAlign: 'center' },
  riepilogoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  riepilogoLabel: { color: '#666', fontSize: 14 },
  riepilogoValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  confirmBtn: { 
    backgroundColor: '#D4AF37', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 16,
    cursor: 'pointer' as any,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#0A0A0A', fontSize: 18, fontWeight: '800' },
});
