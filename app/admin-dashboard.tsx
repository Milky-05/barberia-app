import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";
const ORARI = ["09:00","09:40","10:20","11:00","11:40","15:00","15:40","16:20","17:00","17:40","18:20"];

export default function AdminDashboard() {
  const [token, setToken] = useState('');
  const [utente, setUtente] = useState<any>(null);
  const [sedi, setSedi] = useState<any[]>([]);
  const [sedeCorrente, setSedeCorrente] = useState(0);
  const [dataCorrente, setDataCorrente] = useState(new Date().toISOString().split('T')[0]);
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [servizi, setServizi] = useState<any[]>([]);
  const [filtroBarbiere, setFiltroBarbiere] = useState<number|null>(null);
  const [loading, setLoading] = useState(true);
  const [showAggiungi, setShowAggiungi] = useState(false);
  const [newCliente, setNewCliente] = useState('');
  const [newBarbiere, setNewBarbiere] = useState(0);
  const [newServizio, setNewServizio] = useState(0);
  const [newOra, setNewOra] = useState('09:00');
  const [showAssenza, setShowAssenza] = useState(false);
  const [assenzaBarbiere, setAssenzaBarbiere] = useState(0);
  const [assenzaMotivo, setAssenzaMotivo] = useState('');
  const [showProfilo, setShowProfilo] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [vecchiaPassword, setVecchiaPassword] = useState('');
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [showCambiaPassword, setShowCambiaPassword] = useState(false);
  const headerOp = useRef(new Animated.Value(0)).current;

  const auth = (t?: string) => ({ 'Authorization': `Bearer ${t || token}`, 'Content-Type': 'application/json' });
  const msg = (m: string) => { Platform.OS === 'web' ? window.alert(m) : Alert.alert("Info", m); };

  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    caricaDati();
  }, []);

  const caricaDati = async () => {
    try {
      const t = await AsyncStorage.getItem('token');
      const u = JSON.parse(await AsyncStorage.getItem('utente') || '{}');
      if (!t) { router.replace('/'); return; }
      setToken(t); setUtente(u); setEditNome(u.nome || '');
      const resSedi = await fetch(`${BACKEND_URL}/api/sedi`);
      const ds = await resSedi.json(); setSedi(ds);
      if (ds.length > 0) setSedeCorrente(ds[0].id);
      const resServ = await fetch(`${BACKEND_URL}/api/servizi`);
      setServizi(await resServ.json());
      setLoading(false);
    } catch (err) { router.replace('/'); }
  };

  useEffect(() => { if (sedeCorrente && token) { caricaBarbieri(); caricaPrenotazioni(); } }, [sedeCorrente, dataCorrente, filtroBarbiere]);

  const caricaBarbieri = async () => {
    try { const res = await fetch(`${BACKEND_URL}/api/admin/barbieri?sede_id=${sedeCorrente}`, { headers: auth() }); setBarbieri(await res.json()); } catch (err) {}
  };

  const caricaPrenotazioni = async () => {
    let url = `${BACKEND_URL}/api/admin/prenotazioni?sede_id=${sedeCorrente}&data=${dataCorrente}`;
    if (filtroBarbiere) url += `&barbiere_id=${filtroBarbiere}`;
    try {
      const res = await fetch(url, { headers: auth() });
      if (res.status === 401) { logout(); return; }
      setPrenotazioni(await res.json());
    } catch (err) {}
  };

  const cancella = async (id: number) => {
    if (Platform.OS === 'web') { if (!window.confirm("Cancellare?")) return; }
    try { await fetch(`${BACKEND_URL}/api/admin/prenotazioni/${id}`, { method: 'DELETE', headers: auth() }); caricaPrenotazioni(); } catch (err) { msg("Errore"); }
  };

  const salvaAggiungi = async () => {
    if (!newCliente) { msg("Inserisci il nome del cliente"); return; }
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/prenotazioni`, {
        method: 'POST', headers: auth(),
        body: JSON.stringify({ sede_id: sedeCorrente, barbiere_id: newBarbiere || barbieri.find(b=>!b.assente)?.id, cliente_nome: newCliente, data: dataCorrente, ora: newOra, servizio_id: newServizio || servizi[0]?.id })
      });
      const data = await res.json();
      if (data.success) { setShowAggiungi(false); setNewCliente(''); caricaPrenotazioni(); } else msg(data.error);
    } catch (err) { msg("Errore"); }
  };

  const segnaAssente = async () => {
    if (!assenzaBarbiere) { msg("Seleziona un barbiere"); return; }
    const bNome = barbieri.find(b => b.id === assenzaBarbiere)?.nome || '';
    if (Platform.OS === 'web') { if (!window.confirm(`Cancellare tutti gli appuntamenti di ${bNome}?`)) return; }
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/barbiere-assente`, {
        method: 'POST', headers: auth(),
        body: JSON.stringify({ barbiere_id: assenzaBarbiere, motivo: assenzaMotivo || 'Assente' })
      });
      const data = await res.json();
      if (data.success) { msg(data.messaggio); setShowAssenza(false); setAssenzaMotivo(''); caricaBarbieri(); caricaPrenotazioni(); } else msg(data.error);
    } catch (err) { msg("Errore"); }
  };

  const riattiva = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/barbiere-presente`, {
        method: 'POST',
        headers: auth(),
        body: JSON.stringify({ barbiere_id: id })
      });
      const data = await res.json();
      if (data.success) {
        msg("Barbiere riattivato!");
        caricaBarbieri();
        caricaPrenotazioni();
      } else {
        msg(data.error || "Errore nella riattivazione");
      }
    } catch (err) {
      msg("Errore di connessione");
    }
  };

  const salvaProfilo = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profilo`, { method: 'PATCH', headers: auth(), body: JSON.stringify({ nome: editNome }) });
      if ((await res.json()).success) {
        const nu = { ...utente, nome: editNome }; await AsyncStorage.setItem('utente', JSON.stringify(nu)); setUtente(nu); msg("Aggiornato!");
      }
    } catch (err) { msg("Errore"); }
  };

  const cambiaPassword = async () => {
    if (!vecchiaPassword || !nuovaPassword) return;
    if (nuovaPassword.length < 6) { msg("Minimo 6 caratteri"); return; }
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/cambia-password`, { method: 'PATCH', headers: auth(), body: JSON.stringify({ vecchia_password: vecchiaPassword, nuova_password: nuovaPassword }) });
      const data = await res.json();
      if (data.success) { setShowCambiaPassword(false); setVecchiaPassword(''); setNuovaPassword(''); msg("Password cambiata!"); } else msg(data.error);
    } catch (err) { msg("Errore"); }
  };

  const logout = async () => { await AsyncStorage.removeItem('token'); await AsyncStorage.removeItem('utente'); router.replace('/'); };
  const cambiaData = (o: number) => { const d = new Date(dataCorrente); d.setDate(d.getDate()+o); setDataCorrente(d.toISOString().split('T')[0]); };
  const fmtData = (d: string) => { const dt = new Date(d); const g = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']; const m = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']; return `${g[dt.getDay()]} ${dt.getDate()} ${m[dt.getMonth()]}`; };

  if (loading) return <View style={[st.container,{justifyContent:'center',alignItems:'center'}]}><ActivityIndicator color="#D4AF37" size="large" /></View>;
  const attivi = prenotazioni.filter(p => p.stato === 'attivo');
  const incasso = attivi.reduce((s, p) => s + Number(p.servizio_prezzo || 0), 0);

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[st.header, { opacity: headerOp }]}>
          <View style={st.headerRow}>
            <View>
              <Text style={st.headerTitle}>AMMINISTRATORE</Text>
              <Text style={st.headerBrand}>BULLDOG BARBER SHOP</Text>
              <Text style={st.headerUser}>💈 {utente?.nome}</Text>
            </View>
            <View style={{flexDirection:'row',gap:8}}>
              <Pressable style={st.profBtn} onPress={() => setShowProfilo(!showProfilo)}><Text style={{fontSize:18}}>👤</Text></Pressable>
              <Pressable style={st.logoutBtn} onPress={logout}><Text style={{color:'#888',fontSize:13}}>Esci</Text></Pressable>
            </View>
          </View>
        </Animated.View>

        {showProfilo && (
          <View style={st.profiloBox}>
            <Text style={st.profiloTitle}>Il Mio Profilo</Text>
            <Text style={st.label}>Nome</Text>
            <TextInput style={st.input} value={editNome} onChangeText={setEditNome} placeholderTextColor="#444" />
            <Pressable style={st.saveBtn} onPress={salvaProfilo}><Text style={st.saveBtnText}>Salva</Text></Pressable>
            <Pressable style={st.menuItem} onPress={() => setShowCambiaPassword(!showCambiaPassword)}><Text style={{color:'#FFF',fontSize:15,fontWeight:'600'}}>🔒  Cambia Password</Text></Pressable>
            {showCambiaPassword && (
              <View style={{paddingLeft:10}}>
                <TextInput style={st.input} value={vecchiaPassword} onChangeText={setVecchiaPassword} placeholder="Password attuale" placeholderTextColor="#444" secureTextEntry />
                <TextInput style={[st.input,{marginTop:8}]} value={nuovaPassword} onChangeText={setNuovaPassword} placeholder="Nuova (min 6)" placeholderTextColor="#444" secureTextEntry />
                <Pressable style={[st.saveBtn,{marginTop:8}]} onPress={cambiaPassword}><Text style={st.saveBtnText}>Cambia</Text></Pressable>
              </View>
            )}
            <View style={st.divider} />
            <Text style={{color:'#666',fontSize:13}}>Email: {utente?.email}</Text>
            <Text style={{color:'#666',fontSize:13,marginTop:4}}>Tipo: {utente?.tipo === 'rotante' ? 'Rotante' : 'Fisso'}</Text>
          </View>
        )}

        <View style={st.sedeRow}>{sedi.map(sede => (
          <Pressable key={sede.id} style={[st.sedeBtn, sedeCorrente===sede.id && st.sedeBtnActive]} onPress={() => setSedeCorrente(sede.id)}>
            <Text style={[st.sedeBtnText, sedeCorrente===sede.id && st.sedeBtnTextActive]}>{sede.nome}</Text>
          </Pressable>
        ))}</View>

        <View style={st.statsRow}>
          <View style={st.stat}><Text style={st.statVal}>{prenotazioni.length}</Text><Text style={st.statLbl}>Totali</Text></View>
          <View style={st.stat}><Text style={st.statVal}>{attivi.length}</Text><Text style={st.statLbl}>Attivi</Text></View>
          <View style={st.stat}><Text style={[st.statVal,{color:'#D4AF37'}]}>€{incasso}</Text><Text style={st.statLbl}>Incasso</Text></View>
        </View>

        <View style={st.ctrlRow}>
          <Pressable style={st.navBtn} onPress={() => cambiaData(-1)}><Text style={st.navBtnText}>‹</Text></Pressable>
          <Text style={st.dataLbl}>{fmtData(dataCorrente)}</Text>
          <Pressable style={st.navBtn} onPress={() => cambiaData(1)}><Text style={st.navBtnText}>›</Text></Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.filtriRow}>
          <Pressable style={[st.filtro, !filtroBarbiere && st.filtroActive]} onPress={() => setFiltroBarbiere(null)}><Text style={[st.filtroText, !filtroBarbiere && st.filtroTextActive]}>Tutti</Text></Pressable>
          {barbieri.map(b => (
            <Pressable key={b.id} style={[st.filtro, filtroBarbiere===b.id && st.filtroActive, b.assente && {opacity:0.4}]} onPress={() => setFiltroBarbiere(b.id)}>
              <Text style={[st.filtroText, filtroBarbiere===b.id && st.filtroTextActive]}>{b.nome}{b.assente?' 🔴':''}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={st.actRow}>
          <Pressable style={st.addBtn} onPress={() => { setNewBarbiere(barbieri.find(b=>!b.assente)?.id||0); setNewServizio(servizi[0]?.id||0); setShowAggiungi(true); }}><Text style={st.addBtnText}>+ Nuovo</Text></Pressable>
          <Pressable style={st.absBtn} onPress={() => { setAssenzaBarbiere(barbieri.find(b=>!b.assente)?.id||0); setShowAssenza(true); }}><Text style={st.absBtnText}>🔴 Assente</Text></Pressable>
        </View>

        {barbieri.filter(b=>b.assente).map(b => (
          <View key={b.id} style={st.absentCard}>
            <Text style={{color:'#F44336',fontSize:14,fontWeight:'600'}}>🔴 {b.nome} è assente</Text>
            <Pressable style={st.reactBtn} onPress={() => riattiva(b.id)}><Text style={{color:'#4CAF50',fontSize:12,fontWeight:'700'}}>Riattiva</Text></Pressable>
          </View>
        ))}

        {prenotazioni.length===0 ? (
          <View style={{padding:50,alignItems:'center'}}><Text style={{color:'#444',fontSize:16}}>📋 Nessun appuntamento</Text></View>
        ) : prenotazioni.map(p => (
          <View key={p.id} style={st.card}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <Text style={{color:'#FFF',fontSize:20,fontWeight:'800'}}>{p.ora?.slice(0,5)}</Text>
              <View style={{paddingVertical:3,paddingHorizontal:10,borderRadius:6,backgroundColor:p.stato==='attivo'?'rgba(76,175,80,0.1)':'rgba(244,67,54,0.1)'}}>
                <Text style={{fontSize:11,fontWeight:'700',color:p.stato==='attivo'?'#4CAF50':'#F44336'}}>{p.stato}</Text>
              </View>
            </View>
            <Text style={{color:'#FFF',fontSize:16,fontWeight:'600',marginBottom:8}}>{p.cliente_nome}</Text>
            <View style={{flexDirection:'row',gap:12,alignItems:'center'}}>
              <Text style={{color:'#666',fontSize:13}}>✂️ {p.servizio_nome}</Text>
              <Text style={{color:'#666',fontSize:13}}>💈 {p.barbiere_nome}</Text>
              <Text style={{color:'#D4AF37',fontSize:15,fontWeight:'800',marginLeft:'auto' as any}}>€{p.servizio_prezzo}</Text>
            </View>
            {p.stato==='attivo' && (
              <View style={{flexDirection:'row',justifyContent:'flex-end',marginTop:12,borderTopWidth:1,borderTopColor:'#1E1E1E',paddingTop:10}}>
                <Pressable style={{paddingVertical:6,paddingHorizontal:16,borderRadius:8,backgroundColor:'rgba(244,67,54,0.08)',borderWidth:1,borderColor:'rgba(244,67,54,0.3)',cursor:'pointer' as any}} onPress={() => cancella(p.id)}>
                  <Text style={{color:'#F44336',fontSize:12,fontWeight:'700'}}>Cancella</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
        <View style={{height:40}} />
      </ScrollView>

      {showAggiungi && (
        <View style={st.modalOv}><View style={st.modal}>
          <Text style={st.modalTitle}>Nuovo Appuntamento</Text>
          <Text style={st.label}>Cliente</Text>
          <TextInput style={st.input} value={newCliente} onChangeText={setNewCliente} placeholder="Nome" placeholderTextColor="#444" />
          <Text style={st.label}>Barbiere</Text>
          <ScrollView horizontal style={st.selRow}>{barbieri.filter(b=>!b.assente).map(b => (
            <Pressable key={b.id} style={[st.selBtn, newBarbiere===b.id && st.selBtnA]} onPress={() => setNewBarbiere(b.id)}><Text style={[st.selText, newBarbiere===b.id && st.selTextA]}>{b.nome}</Text></Pressable>
          ))}</ScrollView>
          <Text style={st.label}>Servizio</Text>
          <ScrollView horizontal style={st.selRow}>{servizi.map(sv => (
            <Pressable key={sv.id} style={[st.selBtn, newServizio===sv.id && st.selBtnA]} onPress={() => setNewServizio(sv.id)}><Text style={[st.selText, newServizio===sv.id && st.selTextA]}>{sv.nome}</Text></Pressable>
          ))}</ScrollView>
          <Text style={st.label}>Ora</Text>
          <ScrollView horizontal style={st.selRow}>{ORARI.map(o => (
            <Pressable key={o} style={[st.selBtn, newOra===o && st.selBtnA]} onPress={() => setNewOra(o)}><Text style={[st.selText, newOra===o && st.selTextA]}>{o}</Text></Pressable>
          ))}</ScrollView>
          <View style={st.modBtns}>
            <Pressable style={st.modCancel} onPress={() => setShowAggiungi(false)}><Text style={{color:'#888',fontWeight:'700'}}>Annulla</Text></Pressable>
            <Pressable style={st.modConfirm} onPress={salvaAggiungi}><Text style={{color:'#0A0A0A',fontWeight:'800'}}>Salva</Text></Pressable>
          </View>
        </View></View>
      )}

      {showAssenza && (
        <View style={st.modalOv}><View style={st.modal}>
          <Text style={st.modalTitle}>🔴 Segna Assente</Text>
          <Text style={{color:'#F44336',fontSize:13,marginBottom:16}}>Appuntamenti cancellati e clienti notificati.</Text>
          <Text style={st.label}>Barbiere</Text>
          <ScrollView horizontal style={st.selRow}>{barbieri.filter(b=>!b.assente).map(b => (
            <Pressable key={b.id} style={[st.selBtn, assenzaBarbiere===b.id && st.selBtnA]} onPress={() => setAssenzaBarbiere(b.id)}><Text style={[st.selText, assenzaBarbiere===b.id && st.selTextA]}>{b.nome}</Text></Pressable>
          ))}</ScrollView>
          <Text style={st.label}>Motivo</Text>
          <TextInput style={st.input} value={assenzaMotivo} onChangeText={setAssenzaMotivo} placeholder="Es: Malato..." placeholderTextColor="#444" />
          <View style={st.modBtns}>
            <Pressable style={st.modCancel} onPress={() => setShowAssenza(false)}><Text style={{color:'#888',fontWeight:'700'}}>Annulla</Text></Pressable>
            <Pressable style={[st.modConfirm,{backgroundColor:'#F44336'}]} onPress={segnaAssente}><Text style={{color:'#FFF',fontWeight:'800'}}>Conferma</Text></Pressable>
          </View>
        </View></View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 20 },
  header: { marginTop: 10, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 13, fontWeight: '800', color: '#888', letterSpacing: 3 },
  headerBrand: { fontSize: 20, fontWeight: '900', color: '#D4AF37', letterSpacing: 2, marginTop: 2 },
  headerUser: { color: '#666', fontSize: 14, marginTop: 6 },
  profBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#333', cursor: 'pointer' as any },
  profiloBox: { backgroundColor: '#141414', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E' },
  profiloTitle: { fontSize: 18, fontWeight: '800', color: '#D4AF37', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#1E1E1E', marginVertical: 12 },
  menuItem: { paddingVertical: 12, cursor: 'pointer' as any },
  sedeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sedeBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', alignItems: 'center', cursor: 'pointer' as any },
  sedeBtnActive: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)' },
  sedeBtnText: { color: '#555', fontWeight: '600', fontSize: 14 },
  sedeBtnTextActive: { color: '#D4AF37' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#141414', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E' },
  statVal: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  statLbl: { fontSize: 11, color: '#555', fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  ctrlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 14 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1E1E1E', cursor: 'pointer' as any },
  navBtnText: { color: '#D4AF37', fontSize: 22, fontWeight: '300' },
  dataLbl: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  filtriRow: { flexDirection: 'row', marginBottom: 14 },
  filtro: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', marginRight: 8, cursor: 'pointer' as any },
  filtroActive: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)' },
  filtroText: { color: '#555', fontSize: 13, fontWeight: '600' },
  filtroTextActive: { color: '#D4AF37' },
  actRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  addBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#D4AF37', alignItems: 'center', cursor: 'pointer' as any },
  addBtnText: { color: '#0A0A0A', fontWeight: '800', fontSize: 14 },
  absBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: 'rgba(244,67,54,0.08)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)', alignItems: 'center', cursor: 'pointer' as any },
  absBtnText: { color: '#F44336', fontWeight: '700', fontSize: 13 },
  absentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(244,67,54,0.05)', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(244,67,54,0.2)' },
  reactBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)', cursor: 'pointer' as any },
  card: { backgroundColor: '#141414', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1E1E1E' },
  label: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 10, padding: 12, color: '#FFF', fontSize: 14 },
  saveBtn: { padding: 10, borderRadius: 10, backgroundColor: '#D4AF37', alignItems: 'center', marginTop: 10, cursor: 'pointer' as any },
  saveBtnText: { color: '#0A0A0A', fontWeight: '800', fontSize: 14 },
  modalOv: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 100 },
  modal: { backgroundColor: '#141414', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: '#1E1E1E' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#D4AF37', marginBottom: 16 },
  selRow: { flexDirection: 'row', maxHeight: 45 },
  selBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1E1E1E', marginRight: 6 },
  selBtnA: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)' },
  selText: { color: '#555', fontSize: 13, fontWeight: '600' },
  selTextA: { color: '#D4AF37' },
  modBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modCancel: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#1E1E1E', alignItems: 'center', cursor: 'pointer' as any },
  modConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#D4AF37', alignItems: 'center', cursor: 'pointer' as any },
});
