import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";
const { height: SH, width: SW } = Dimensions.get('window');
const SHEET_H = SH * 0.85;

export default function Home() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [utente, setUtente] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editCognome, setEditCognome] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [vecchiaPw, setVecchiaPw] = useState('');
  const [nuovaPw, setNuovaPw] = useState('');
  const [nonLette, setNonLette] = useState(0);
  const [numAppuntamenti, setNumAppuntamenti] = useState(0);

  const sheetAnim = useRef(new Animated.Value(SHEET_H)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const mainCardOp = useRef(new Animated.Value(0)).current;
  const mainCardY = useRef(new Animated.Value(30)).current;
  const gridOp = useRef(new Animated.Value(0)).current;
  const gridY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    caricaUtente(); contaNotifiche(); contaAppuntamenti();
    Animated.timing(headerOp, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(mainCardOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(mainCardY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 300);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(gridOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(gridY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 550);
  }, []);

  const caricaUtente = async () => {
    const u = JSON.parse(await AsyncStorage.getItem('utente') || '{}');
    setUtente(u); setEditNome(u.nome || ''); setEditCognome(u.cognome || ''); setEditTelefono(u.telefono || '');
  };

  const contaNotifiche = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/notifiche`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setNonLette(data.filter((n: any) => !n.letta).length);
    } catch (err) {}
  };

  const contaAppuntamenti = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/prenotazioni/miei`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setNumAppuntamenti(data.length);
    } catch (err) {}
  };

  // ===== BOTTOM SHEET =====
  const apriSheet = () => {
    setSheetVisible(true);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.timing(overlayOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const chiudiSheet = () => {
    setEditMode(false); setShowPw(false);
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: SHEET_H, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayOp, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSheetVisible(false));
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token'); await AsyncStorage.removeItem('utente');
    router.replace('/');
  };

  const salvaProfilo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/auth/profilo`, {
        method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editNome, cognome: editCognome, telefono: editTelefono })
      });
      if ((await res.json()).success) {
        const nu = { ...utente, nome: editNome, cognome: editCognome };
        await AsyncStorage.setItem('utente', JSON.stringify(nu)); setUtente(nu); setEditMode(false);
        Platform.OS === 'web' ? window.alert("Profilo aggiornato!") : null;
      }
    } catch (err) {}
  };

  const cambiaPw = async () => {
    if (!vecchiaPw || !nuovaPw) return;
    if (nuovaPw.length < 6) { Platform.OS === 'web' ? window.alert("Minimo 6 caratteri") : null; return; }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/auth/cambia-password`, {
        method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vecchia_password: vecchiaPw, nuova_password: nuovaPw })
      });
      const data = await res.json();
      if (data.success) { setShowPw(false); setVecchiaPw(''); setNuovaPw(''); Platform.OS === 'web' ? window.alert("Password cambiata!") : null; }
      else { Platform.OS === 'web' ? window.alert(data.error) : null; }
    } catch (err) {}
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} bounces={false}>

        {/* HEADER */}
        <Animated.View style={[s.header, { opacity: headerOp }]}>
          <View>
            <View style={s.logoRow}>
              <View style={s.logo}><Image source={require('../assets/images/logo.png')} style={s.logoImg} resizeMode="contain" /></View>
              <Text style={s.brandText}>BULLDOG BARBER SHOP</Text>
            </View>
            <Text style={s.greeting}>Bentornato,</Text>
            <Text style={s.greetingName}>{utente?.nome || ''}!</Text>
          </View>
          <Pressable style={s.profileBtn} onPress={apriSheet}><Text style={s.profileIcon}>👤</Text></Pressable>
        </Animated.View>

        {/* SEZIONE PRENOTA */}
        <Text style={s.sectionTitle}>— Prenota</Text>
        <Animated.View style={{ opacity: mainCardOp, transform: [{ translateY: mainCardY }] }}>
          <Pressable style={({ pressed }) => [s.mainCard, pressed && s.mainCardPressed]}
            onPress={() => router.push('/scelta-sede' as any)}>
            <View style={s.mainInner}>
              <View style={s.mainIcon}><Text style={{fontSize:26}}>📅</Text></View>
              <View style={{flex:1}}>
                <Text style={s.mainTitle}>Nuova Prenotazione</Text>
                <Text style={s.mainSub}>Scegli sede, servizio e orario</Text>
              </View>
              <Text style={s.mainArrow}>›</Text>
            </View>
            <View style={s.mainBar} />
          </Pressable>
        </Animated.View>

        {/* SEZIONE ESPLORA */}
        <Text style={s.sectionTitle}>— Esplora</Text>
        <Animated.View style={[s.grid, { opacity: gridOp, transform: [{ translateY: gridY }] }]}>
          <Pressable style={({ pressed }) => [s.gridCard, pressed && s.gridCardPressed]}
            onPress={() => router.push('/miei-appuntamenti' as any)}>
            <View style={s.iconRow}>
              <Text style={s.gridIcon}>🕒</Text>
              {numAppuntamenti > 0 && <View style={s.badge}><Text style={s.badgeText}>{numAppuntamenti}</Text></View>}
            </View>
            <Text style={s.gridTitle}>Appuntamenti</Text>
            <Text style={s.gridSub}>Visualizza e gestisci</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [s.gridCard, pressed && s.gridCardPressed]}
            onPress={() => router.push('/listino-servizi' as any)}>
            <Text style={s.gridIcon}>✂️</Text>
            <Text style={s.gridTitle}>Servizi</Text>
            <Text style={s.gridSub}>Listino prezzi</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [s.gridCard, pressed && s.gridCardPressed]}
            onPress={() => router.push('/sedi-info' as any)}>
            <Text style={s.gridIcon}>📍</Text>
            <Text style={s.gridTitle}>Le Nostre Sedi</Text>
            <Text style={s.gridSub}>Info e barbieri</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [s.gridCardMsg, pressed && s.gridCardPressed]}
            onPress={() => router.push('/messaggi' as any)}>
            <View style={s.iconRow}>
              <Text style={s.gridIcon}>💬</Text>
              {nonLette > 0 && <View style={s.badge}><Text style={s.badgeText}>{nonLette}</Text></View>}
            </View>
            <Text style={s.gridTitleGold}>Messaggi</Text>
            <Text style={s.gridSub}>Comunicazioni dallo staff</Text>
          </Pressable>
        </Animated.View>

        <View style={s.footerBox}><View style={s.footerLine} /><Text style={s.footerText}>PRENOTA IL TUO STILE</Text></View>
      </ScrollView>

      {/* ===== OVERLAY ===== */}
      {sheetVisible && (
        <Animated.View style={[s.overlay, { opacity: overlayOp }]} pointerEvents="auto">
          <Pressable style={{flex:1}} onPress={chiudiSheet} />
        </Animated.View>
      )}

      {/* ===== BOTTOM SHEET PROFILO ===== */}
      {sheetVisible && (
        <Animated.View style={[s.sheet, { transform: [{ translateY: sheetAnim }] }]}>
          {/* Handle bar */}
          <View style={s.handleBar} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{paddingBottom: 40}}>
            {/* Avatar + Info */}
            <View style={s.sheetHeader}>
              <View style={s.avatarLarge}>
                <Text style={s.avatarLargeText}>{utente?.nome?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <Text style={s.sheetName}>{utente?.nome} {utente?.cognome || ''}</Text>
              <Text style={s.sheetEmail}>{utente?.email}</Text>
              {utente?.telefono ? <Text style={s.sheetPhone}>📞 {utente.telefono}</Text> : null}
            </View>

            {/* Quick Actions */}
            <View style={s.quickActions}>
              <Pressable style={s.quickBtn} onPress={() => { setEditMode(true); }}>
                <View style={s.quickIcon}><Text style={{fontSize:18}}>✏️</Text></View>
                <Text style={s.quickText}>Modifica</Text>
              </Pressable>
              <Pressable style={s.quickBtn} onPress={() => setShowPw(!showPw)}>
                <View style={s.quickIcon}><Text style={{fontSize:18}}>🔒</Text></View>
                <Text style={s.quickText}>Password</Text>
              </Pressable>
              <Pressable style={[s.quickBtn]} onPress={logout}>
                <View style={[s.quickIcon, s.quickIconDanger]}><Text style={{fontSize:18}}>🚪</Text></View>
                <Text style={[s.quickText, {color:'#F44336'}]}>Esci</Text>
              </Pressable>
            </View>

            {/* Edit Mode */}
            {editMode && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>MODIFICA PROFILO</Text>
                <View style={s.fieldRow}>
                  <View style={{flex:1}}>
                    <Text style={s.fieldLabel}>Nome</Text>
                    <TextInput style={s.fieldInput} value={editNome} onChangeText={setEditNome} placeholderTextColor="#333" />
                  </View>
                  <View style={{flex:1}}>
                    <Text style={s.fieldLabel}>Cognome</Text>
                    <TextInput style={s.fieldInput} value={editCognome} onChangeText={setEditCognome} placeholderTextColor="#333" />
                  </View>
                </View>
                <Text style={s.fieldLabel}>Telefono</Text>
                <TextInput style={s.fieldInput} value={editTelefono} onChangeText={setEditTelefono} placeholderTextColor="#333" keyboardType="phone-pad" />
                <View style={s.btnRow}>
                  <Pressable style={s.btnCancel} onPress={() => setEditMode(false)}>
                    <Text style={s.btnCancelText}>Annulla</Text>
                  </Pressable>
                  <Pressable style={s.btnSave} onPress={salvaProfilo}>
                    <Text style={s.btnSaveText}>Salva</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Change Password */}
            {showPw && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>CAMBIA PASSWORD</Text>
                <Text style={s.fieldLabel}>Password attuale</Text>
                <TextInput style={s.fieldInput} value={vecchiaPw} onChangeText={setVecchiaPw} placeholder="••••••" placeholderTextColor="#333" secureTextEntry />
                <Text style={s.fieldLabel}>Nuova password</Text>
                <TextInput style={s.fieldInput} value={nuovaPw} onChangeText={setNuovaPw} placeholder="Minimo 6 caratteri" placeholderTextColor="#333" secureTextEntry />
                <View style={s.btnRow}>
                  <Pressable style={s.btnCancel} onPress={() => { setShowPw(false); setVecchiaPw(''); setNuovaPw(''); }}>
                    <Text style={s.btnCancelText}>Annulla</Text>
                  </Pressable>
                  <Pressable style={s.btnSave} onPress={cambiaPw}>
                    <Text style={s.btnSaveText}>Cambia</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Info */}
            <View style={s.infoSection}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Appuntamenti attivi</Text>
                <Text style={s.infoValue}>{numAppuntamenti}</Text>
              </View>
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Messaggi non letti</Text>
                <Text style={s.infoValue}>{nonLette}</Text>
              </View>
            </View>

          </ScrollView>
        </Animated.View>
      )}

      <StatusBar style="light" />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { padding: 24, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 50, marginBottom: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  logo: { width: 48, height: 48, borderRadius: 16, borderWidth: 2, borderColor: '#D4AF37', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 50, height: 50 },
  brandText: { fontSize: 11, fontWeight: '800', color: '#D4AF37', letterSpacing: 4 },
  greeting: { fontSize: 28, fontWeight: '900', color: '#FFF', lineHeight: 34 },
  greetingName: { fontSize: 28, fontWeight: '900', color: '#D4AF37', lineHeight: 34 },
  profileBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any },
  profileIcon: { fontSize: 18 },

  // Sections
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, marginTop: 24 },

  // Main card
  mainCard: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 20, overflow: 'hidden', ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  mainCardPressed: { borderColor: 'rgba(212,175,55,0.4)', transform: [{ scale: 0.98 }] },
  mainInner: { padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16 },
  mainIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(212,175,55,0.12)', alignItems: 'center', justifyContent: 'center' },
  mainTitle: { fontSize: 17, fontWeight: '800', color: '#D4AF37' },
  mainSub: { fontSize: 12, color: '#666', marginTop: 2 },
  mainArrow: { fontSize: 24, color: '#D4AF37', fontWeight: '300' },
  mainBar: { height: 3, backgroundColor: '#D4AF37', opacity: 0.6 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '48%' as any, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 18, padding: 20, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  gridCardMsg: { width: '48%' as any, backgroundColor: '#141208', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', borderRadius: 18, padding: 20, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  gridCardPressed: { borderColor: 'rgba(212,175,55,0.4)', transform: [{ scale: 0.97 }] },
  gridIcon: { fontSize: 24, marginBottom: 10 },
  gridTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  gridTitleGold: { fontSize: 14, fontWeight: '700', color: '#D4AF37' },
  gridSub: { fontSize: 11, color: '#555', marginTop: 4 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: '#D4AF37', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#0A0A0A', fontSize: 11, fontWeight: '900' },

  // Footer
  footerBox: { alignItems: 'center', paddingTop: 28 },
  footerLine: { width: 40, height: 2, backgroundColor: '#1E1E1E', marginBottom: 12 },
  footerText: { color: '#2A2A2A', fontSize: 10, letterSpacing: 4 },

  // Overlay
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 50 },

  // Bottom Sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: '#111',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    zIndex: 60,
    paddingHorizontal: 24,
    borderTopWidth: 1, borderTopColor: '#1E1E1E',
  },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginTop: 12, marginBottom: 20 },

  // Sheet Header
  sheetHeader: { alignItems: 'center', marginBottom: 24 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 2, borderColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarLargeText: { color: '#D4AF37', fontSize: 32, fontWeight: '800' },
  sheetName: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  sheetEmail: { color: '#555', fontSize: 14, marginTop: 4 },
  sheetPhone: { color: '#666', fontSize: 13, marginTop: 4 },

  // Quick Actions
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 24 },
  quickBtn: { alignItems: 'center', gap: 6, cursor: 'pointer' as any },
  quickIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222', alignItems: 'center', justifyContent: 'center' },
  quickIconDanger: { borderColor: 'rgba(244,67,54,0.2)', backgroundColor: 'rgba(244,67,54,0.05)' },
  quickText: { color: '#888', fontSize: 12, fontWeight: '600' },

  // Sections
  section: { backgroundColor: '#0A0A0A', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  sectionLabel: { color: '#D4AF37', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 14 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: { color: '#555', fontSize: 11, fontWeight: '700', marginBottom: 4, marginTop: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldInput: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 12, padding: 13, color: '#FFF', fontSize: 15 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnCancel: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', cursor: 'pointer' as any },
  btnCancelText: { color: '#666', fontWeight: '700', fontSize: 14 },
  btnSave: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: '#D4AF37', alignItems: 'center', cursor: 'pointer' as any },
  btnSaveText: { color: '#0A0A0A', fontWeight: '800', fontSize: 14 },

  // Info
  infoSection: { backgroundColor: '#0A0A0A', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#1A1A1A' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { color: '#555', fontSize: 14 },
  infoValue: { color: '#D4AF37', fontSize: 16, fontWeight: '800' },
  infoDivider: { height: 1, backgroundColor: '#1A1A1A', marginVertical: 8 },
});
