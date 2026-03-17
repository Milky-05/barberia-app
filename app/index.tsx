import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

export default function Login() {
  const [modo, setModo] = useState<'login'|'registrazione'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOp = useRef(new Animated.Value(0)).current;
  const lineW = useRef(new Animated.Value(0)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const formOp = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(30)).current;

  useEffect(() => { autoLogin(); }, []);

  const anima = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOp, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(lineW, { toValue: 1, duration: 350, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(titleOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(formY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const autoLogin = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.utente.ruolo === 'barbiere') router.replace('/admin-dashboard' as any);
          else router.replace('/home' as any);
          return;
        }
        await AsyncStorage.removeItem('token'); await AsyncStorage.removeItem('utente');
      }
    } catch (err) {}
    setChecking(false); anima();
  };

  const eseguiLogin = async () => {
    if (!email || !password) { setErrore("Inserisci email e password"); return; }
    setErrore(''); setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('utente', JSON.stringify(data.utente));
        if (data.utente.ruolo === 'barbiere') router.replace('/admin-dashboard' as any);
        else router.replace('/home' as any);
      } else setErrore(data.error);
    } catch (err) { setErrore("Impossibile collegarsi al server"); }
    setLoading(false);
  };

  const eseguiRegistrazione = async () => {
    if (!nome || !email || !password) { setErrore("Nome, email e password sono obbligatori"); return; }
    if (password.length < 6) { setErrore("La password deve avere almeno 6 caratteri"); return; }
    setErrore(''); setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/registrazione`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cognome, email: email.trim().toLowerCase(), telefono, password })
      });
      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('utente', JSON.stringify(data.utente));
        router.replace('/home' as any);
      } else setErrore(data.error);
    } catch (err) { setErrore("Impossibile collegarsi al server"); }
    setLoading(false);
  };

  if (checking) return (
    <View style={s.loaderContainer}>
      <ActivityIndicator color="#D4AF37" size="large" />
    </View>
  );

  return (
    <View style={s.container}>
      <KeyboardAvoidingView 
        style={s.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          contentContainerStyle={s.scroll} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          {/* Logo */}
          <Animated.View style={[s.logoBox, { opacity: logoOp, transform: [{ scale: logoScale }] }]}>
            <View style={s.logoGlow} />
            <View style={s.logoWrap}>
              <Image source={require('../assets/images/logo.png')} style={s.logoImg} resizeMode="cover" />
            </View>
          </Animated.View>

          {/* Linea dorata */}
          <Animated.View style={[s.goldLine, { 
            width: lineW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '40%'] }) 
          }]} />

          {/* Titolo */}
          <Animated.View style={[s.titleBox, { opacity: titleOp, transform: [{ translateY: titleY }] }]}>
            <Text style={s.brand}>BULLDOG</Text>
            <Text style={s.brandSub}>BARBER SHOP</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[s.formCard, { opacity: formOp, transform: [{ translateY: formY }] }]}>
            <View style={s.tabRow}>
              <Pressable style={[s.tab, modo === 'login' && s.tabActive]} onPress={() => { setModo('login'); setErrore(''); }}>
                <Text style={[s.tabText, modo === 'login' && s.tabTextActive]}>Accedi</Text>
              </Pressable>
              <Pressable style={[s.tab, modo === 'registrazione' && s.tabActive]} onPress={() => { setModo('registrazione'); setErrore(''); }}>
                <Text style={[s.tabText, modo === 'registrazione' && s.tabTextActive]}>Registrati</Text>
              </Pressable>
            </View>

            {modo === 'registrazione' && (
              <>
                <View style={s.row}>
                  <View style={s.halfField}>
                    <Text style={s.label}>Nome *</Text>
                    <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Nome" placeholderTextColor="#333" />
                  </View>
                  <View style={s.halfField}>
                    <Text style={s.label}>Cognome</Text>
                    <TextInput style={s.input} value={cognome} onChangeText={setCognome} placeholder="Cognome" placeholderTextColor="#333" />
                  </View>
                </View>
                <Text style={s.label}>Telefono</Text>
                <TextInput style={s.input} value={telefono} onChangeText={setTelefono} placeholder="Il tuo numero" placeholderTextColor="#333" keyboardType="phone-pad" />
              </>
            )}

            <Text style={s.label}>Email *</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="La tua email" placeholderTextColor="#333" keyboardType="email-address" autoCapitalize="none" />

            <Text style={s.label}>Password *</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="La tua password" placeholderTextColor="#333" secureTextEntry />

            {errore ? <Text style={s.errore}>{errore}</Text> : null}

            <Pressable style={[s.btn, loading && { opacity: 0.6 }]} onPress={modo === 'login' ? eseguiLogin : eseguiRegistrazione} disabled={loading}>
              {loading ? <ActivityIndicator color="#0A0A0A" size="small" /> : (
                <Text style={s.btnText}>{modo === 'login' ? 'Accedi' : 'Crea Account'}</Text>
              )}
            </Pressable>
          </Animated.View>

          <Text style={s.footer}>PRENOTA IL TUO STILE</Text>
          
          {/* Spazio extra per quando la tastiera è aperta */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0A0A',
  },
  loaderContainer: {
    flex: 1, 
    backgroundColor: '#0A0A0A', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scroll: { 
    flexGrow: 1,
    padding: 28, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  
  // Logo
  logoBox: { alignItems: 'center', marginBottom: 16 },
  logoGlow: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#D4AF37', opacity: 0.07 },
  logoWrap: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#D4AF37', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 112, height: 112 },
  
  // Line & Title
  goldLine: { height: 2, backgroundColor: '#D4AF37', marginBottom: 14, borderRadius: 1 },
  titleBox: { alignItems: 'center', marginBottom: 28 },
  brand: { fontSize: 26, fontWeight: '900', color: '#D4AF37', letterSpacing: 8 },
  brandSub: { fontSize: 11, fontWeight: '700', color: '#D4AF37', letterSpacing: 5, opacity: 0.6, marginTop: 2 },
  
  // Form card
  formCard: { width: '100%', maxWidth: 400, backgroundColor: '#111', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1A1A1A' },
  tabRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#0A0A0A', borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 10, cursor: 'pointer' as any },
  tabActive: { backgroundColor: 'rgba(212,175,55,0.12)' },
  tabText: { color: '#444', fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#D4AF37' },
  
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  label: { color: '#666', fontSize: 11, fontWeight: '700', marginBottom: 5, marginTop: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 16 },
  
  errore: { color: '#F44336', fontSize: 12, marginTop: 12, textAlign: 'center' },
  btn: { backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, cursor: 'pointer' as any },
  btnText: { color: '#0A0A0A', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  footer: { color: '#1A1A1A', fontSize: 10, letterSpacing: 4, marginTop: 30 },
});
