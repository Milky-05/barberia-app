import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";
const { width: SW } = Dimensions.get('window');
const DW = Math.min(320, SW * 0.8);

export default function Home() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [utente, setUtente] = useState<any>(null);
  const [editNome, setEditNome] = useState('');
  const [editCognome, setEditCognome] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [vecchiaPw, setVecchiaPw] = useState('');
  const [nuovaPw, setNuovaPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [nonLette, setNonLette] = useState(0);

  const drawerAnim = useRef(new Animated.Value(DW)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const mainCardOp = useRef(new Animated.Value(0)).current;
  const mainCardY = useRef(new Animated.Value(30)).current;
  const gridOp = useRef(new Animated.Value(0)).current;
  const gridY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    caricaUtente();
    contaNotifiche();
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
      if (Array.isArray(data)) {
        setNonLette(data.filter((n: any) => !n.letta).length);
      }
    } catch (err) {}
  };

  const apriDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const chiudiDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: DW, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayOp, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setDrawerVisible(false));
  };

  const logout = async () => { await AsyncStorage.removeItem('token'); await AsyncStorage.removeItem('utente'); router.replace('/'); };

  const salvaProfilo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/auth/profilo`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: editNome, cognome: editCognome, telefono: editTelefono }) });
      if ((await res.json()).success) {
        const nu = { ...utente, nome: editNome, cognome: editCognome }; await AsyncStorage.setItem('utente', JSON.stringify(nu)); setUtente(nu); setEditMode(false);
        Platform.OS === 'web' ? window.alert("Profilo aggiornato!") : null;
      }
    } catch (err) {}
  };

  const cambiaPw = async () => {
    if (!vecchiaPw || !nuovaPw) return;
    if (nuovaPw.length < 6) { Platform.OS === 'web' ? window.alert("Minimo 6 caratteri") : null; return; }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/auth/cambia-password`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ vecchia_password: vecchiaPw, nuova_password: nuovaPw }) });
      const data = await res.json();
      if (data.success) { setShowPw(false); setVecchiaPw(''); setNuovaPw(''); Platform.OS === 'web' ? window.alert("Password cambiata!") : null; }
      else { Platform.OS === 'web' ? window.alert(data.error) : null; }
    } catch (err) {}
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

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
          <Pressable style={s.profileBtn} onPress={apriDrawer}><Text style={s.profileIcon}>👤</Text></Pressable>
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
            <Text style={s.gridIcon}>🕒</Text>
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
            <View style={s.msgIconRow}>
              <Text style={s.gridIcon}>💬</Text>
              {nonLette > 0 && (
                <View style={s.badge}><Text style={s.badgeText}>{nonLette}</Text></View>
              )}
            </View>
            <Text style={s.gridTitleGold}>Messaggi</Text>
            <Text style={s.gridSub}>Comunicazioni dallo staff</Text>
          </Pressable>
        </Animated.View>

        {/* FOOTER */}
        <View style={s.footerBox}>
          <View style={s.footerLine} />
          <Text style={s.footerText}>PRENOTA IL TUO STILE</Text>
        </View>
      </ScrollView>

      {/* OVERLAY */}
      {drawerVisible && (
        <Animated.View style={[s.overlay, { opacity: overlayOp }]} pointerEvents="auto">
          <Pressable style={{ flex: 1 }} onPress={chiudiDrawer} />
        </Animated.View>
      )}

      {/* DRAWER PROFILO */}
      {drawerVisible && (
        <Animated.View style={[s.drawer, { transform: [{ translateX: drawerAnim }] }]}>
          <Pressable style={s.closeBtn} onPress={chiudiDrawer}><Text style={{color:'#888',fontSize:20}}>✕</Text></Pressable>
          <View style={s.drawerHead}>
            <View style={s.avatar}><Text style={s.avatarText}>{utente?.nome?.[0] || '?'}</Text></View>
            <Text style={s.drawerName}>{utente?.nome} {utente?.cognome || ''}</Text>
            <Text style={s.drawerEmail}>{utente?.email}</Text>
          </View>
          <View style={s.divider} />
          {editMode ? (
            <View>
              <Text style={s.label}>Nome</Text><TextInput style={s.input} value={editNome} onChangeText={setEditNome} placeholderTextColor="#444" />
              <Text style={s.label}>Cognome</Text><TextInput style={s.input} value={editCognome} onChangeText={setEditCognome} placeholderTextColor="#444" />
              <Text style={s.label}>Telefono</Text><TextInput style={s.input} value={editTelefono} onChangeText={setEditTelefono} placeholderTextColor="#444" />
              <View style={{flexDirection:'row',gap:10,marginTop:14}}>
                <Pressable style={s.cancelBtn} onPress={() => setEditMode(false)}><Text style={{color:'#888',fontWeight:'700'}}>Annulla</Text></Pressable>
                <Pressable style={s.saveBtn} onPress={salvaProfilo}><Text style={{color:'#0A0A0A',fontWeight:'800'}}>Salva</Text></Pressable>
              </View>
            </View>
          ) : (
            <View>
              <Pressable style={s.menuItem} onPress={() => setEditMode(true)}><Text style={s.menuText}>✏️  Modifica Profilo</Text></Pressable>
              <Pressable style={s.menuItem} onPress={() => setShowPw(!showPw)}><Text style={s.menuText}>🔒  Cambia Password</Text></Pressable>
              {showPw && (
                <View style={{paddingLeft:30}}>
                  <TextInput style={s.input} value={vecchiaPw} onChangeText={setVecchiaPw} placeholder="Password attuale" placeholderTextColor="#444" secureTextEntry />
                  <TextInput style={[s.input,{marginTop:8}]} value={nuovaPw} onChangeText={setNuovaPw} placeholder="Nuova (min 6)" placeholderTextColor="#444" secureTextEntry />
                  <Pressable style={[s.saveBtn,{marginTop:10}]} onPress={cambiaPw}><Text style={{color:'#0A0A0A',fontWeight:'800'}}>Cambia</Text></Pressable>
                </View>
              )}
            </View>
          )}
          <View style={s.divider} />
          <Pressable style={s.menuItem} onPress={logout}><Text style={{color:'#F44336',fontSize:15,fontWeight:'600'}}>🚪  Esci dall'account</Text></Pressable>
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

  // Grid 2x2
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '48%' as any, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 18, padding: 20, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  gridCardMsg: { width: '48%' as any, backgroundColor: '#141208', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', borderRadius: 18, padding: 20, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  gridCardPressed: { borderColor: 'rgba(212,175,55,0.4)', transform: [{ scale: 0.97 }] },
  gridIcon: { fontSize: 24, marginBottom: 10 },
  gridTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  gridTitleGold: { fontSize: 14, fontWeight: '700', color: '#D4AF37' },
  gridSub: { fontSize: 11, color: '#555', marginTop: 4 },
  msgIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: '#D4AF37', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#0A0A0A', fontSize: 11, fontWeight: '900' },

  // Footer
  footerBox: { alignItems: 'center', paddingTop: 28 },
  footerLine: { width: 40, height: 2, backgroundColor: '#1E1E1E', marginBottom: 12 },
  footerText: { color: '#2A2A2A', fontSize: 10, letterSpacing: 4 },

  // Drawer
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 50 },
  drawer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: DW, backgroundColor: '#0F0F0F', borderLeftWidth: 1, borderLeftColor: '#1E1E1E', zIndex: 60, padding: 24, paddingTop: 50 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer' as any },
  drawerHead: { alignItems: 'center', marginTop: 10, marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(212,175,55,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#D4AF37', fontSize: 24, fontWeight: '800' },
  drawerName: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  drawerEmail: { color: '#555', fontSize: 13, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#1E1E1E', marginVertical: 16 },
  label: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 10, padding: 12, color: '#FFF', fontSize: 14 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#1E1E1E', alignItems: 'center', cursor: 'pointer' as any },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#D4AF37', alignItems: 'center', cursor: 'pointer' as any },
  menuItem: { paddingVertical: 14, cursor: 'pointer' as any },
  menuText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
