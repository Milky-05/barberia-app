import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['it'] = {
  monthNames: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  monthNamesShort: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
  dayNames: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
  dayNamesShort: ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
  today: 'Oggi'
};
LocaleConfig.defaultLocale = 'it';

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";
const { height: SH } = Dimensions.get('window');
const SHEET_H = SH * 0.82;

export default function AdminDashboard() {
  const [token, setToken] = useState('');
  const [utente, setUtente] = useState<any>(null);
  const [sedi, setSedi] = useState<any[]>([]);
  const [sedeCorrente, setSedeCorrente] = useState(0);
  const [dataCorrente, setDataCorrente] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [servizi, setServizi] = useState<any[]>([]);
  const [filtroBarbiere, setFiltroBarbiere] = useState<number|null>(null);
  const [showFiltri, setShowFiltri] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCalendario, setShowCalendario] = useState(false);
  const [showAggiungi, setShowAggiungi] = useState(false);
  const [newCliente, setNewCliente] = useState('');
  const [newBarbiere, setNewBarbiere] = useState(0);
  const [newServizio, setNewServizio] = useState(0);
  const [newOra, setNewOra] = useState('');
  const [orariNuovo, setOrariNuovo] = useState<string[]>([]);
  const [loadingOrari, setLoadingOrari] = useState(false);
  const [showAssenza, setShowAssenza] = useState(false);
  const [assenzaBarbiere, setAssenzaBarbiere] = useState(0);
  const [assenzaMotivo, setAssenzaMotivo] = useState('');
  const [showProfilo, setShowProfilo] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [vecchiaPw, setVecchiaPw] = useState('');
  const [nuovaPw, setNuovaPw] = useState('');
  const [showCambiaPw, setShowCambiaPw] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SHEET_H)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const auth = (t?: string) => ({ 'Authorization': `Bearer ${t || token}`, 'Content-Type': 'application/json' });
  const msg = (m: string) => { Platform.OS === 'web' ? window.alert(m) : Alert.alert("Info", m); };

  useEffect(() => { Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }).start(); caricaDati(); }, []);
  const caricaDati = async () => {
    try { const t = await AsyncStorage.getItem('token'); const u = JSON.parse(await AsyncStorage.getItem('utente') || '{}'); if (!t) { router.replace('/'); return; } setToken(t); setUtente(u); setEditNome(u.nome || '');
      const resSedi = await fetch(`${BACKEND_URL}/api/sedi`); const ds = await resSedi.json(); setSedi(ds); if (ds.length > 0) setSedeCorrente(ds[0].id);
      setFiltroBarbiere(u.id); // Default: i propri appuntamenti
      const resServ = await fetch(`${BACKEND_URL}/api/servizi`); setServizi(await resServ.json()); setLoading(false);
    } catch (err) { router.replace('/'); }
  };
  useEffect(() => { if (sedeCorrente && token) { caricaBarbieri(); caricaPrenotazioni(); } }, [sedeCorrente, dataCorrente, filtroBarbiere]);
  const caricaBarbieri = async () => { try { const res = await fetch(`${BACKEND_URL}/api/admin/barbieri?sede_id=${sedeCorrente}`, { headers: auth() }); setBarbieri(await res.json()); } catch (err) {} };
  const caricaPrenotazioni = async () => { let url = `${BACKEND_URL}/api/admin/prenotazioni?sede_id=${sedeCorrente}&data=${dataCorrente}`; if (filtroBarbiere) url += `&barbiere_id=${filtroBarbiere}`; try { const res = await fetch(url, { headers: auth() }); if (res.status === 401) { logout(); return; } setPrenotazioni(await res.json()); } catch (err) {} };
  const cancella = async (id: number) => { if (Platform.OS === 'web') { if (!window.confirm("Cancellare questo appuntamento?")) return; } try { await fetch(`${BACKEND_URL}/api/admin/prenotazioni/${id}`, { method: 'DELETE', headers: auth() }); caricaPrenotazioni(); } catch (err) { msg("Errore"); } };
  const caricaOrariNuovo = async (barbId: number, servId: number) => { setLoadingOrari(true); setNewOra(''); try { const res = await fetch(`${BACKEND_URL}/api/orari-disponibili?barbiere_id=${barbId}&data=${dataCorrente}&servizio_id=${servId}`); const data = await res.json(); setOrariNuovo(Array.isArray(data) ? data : []); } catch (err) { setOrariNuovo([]); } setLoadingOrari(false); };
  const apriModalAggiungi = () => { const p = barbieri.find(b => !b.assente); const ps = servizi[0]; setNewBarbiere(p?.id || 0); setNewServizio(ps?.id || 0); setNewCliente(''); setNewOra(''); setShowAggiungi(true); if (p && ps) caricaOrariNuovo(p.id, ps.id); };
  const salvaAggiungi = async () => { if (!newCliente) { msg("Inserisci il nome del cliente"); return; } if (!newOra) { msg("Seleziona un orario"); return; } try { const res = await fetch(`${BACKEND_URL}/api/admin/prenotazioni`, { method: 'POST', headers: auth(), body: JSON.stringify({ sede_id: sedeCorrente, barbiere_id: newBarbiere, cliente_nome: newCliente, data: dataCorrente, ora: newOra, servizio_id: newServizio }) }); const data = await res.json(); if (data.success) { setShowAggiungi(false); setNewCliente(''); caricaPrenotazioni(); } else msg(data.error); } catch (err) { msg("Errore"); } };
  const segnaAssente = async () => { if (!assenzaBarbiere) { msg("Seleziona un barbiere"); return; } const bN = barbieri.find(b => b.id === assenzaBarbiere)?.nome || ''; if (Platform.OS === 'web') { if (!window.confirm(`Cancellare tutti gli appuntamenti di ${bN}?`)) return; } try { const res = await fetch(`${BACKEND_URL}/api/admin/barbiere-assente`, { method: 'POST', headers: auth(), body: JSON.stringify({ barbiere_id: assenzaBarbiere, motivo: assenzaMotivo || 'Assente' }) }); const data = await res.json(); if (data.success) { msg(data.messaggio); setShowAssenza(false); setAssenzaMotivo(''); caricaBarbieri(); caricaPrenotazioni(); } else msg(data.error); } catch (err) { msg("Errore"); } };
  const riattiva = async (id: number) => { try { const res = await fetch(`${BACKEND_URL}/api/admin/barbiere-presente`, { method: 'POST', headers: auth(), body: JSON.stringify({ barbiere_id: id }) }); const data = await res.json(); if (data.success) { msg("Barbiere riattivato!"); caricaBarbieri(); caricaPrenotazioni(); } else msg(data.error); } catch (err) { msg("Errore"); } };
  const apriProfilo = () => { setShowProfilo(true); Animated.parallel([ Animated.spring(sheetAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }), Animated.timing(overlayOp, { toValue: 1, duration: 300, useNativeDriver: true }), ]).start(); };
  const chiudiProfilo = () => { setEditMode(false); setShowCambiaPw(false); Animated.parallel([ Animated.timing(sheetAnim, { toValue: SHEET_H, duration: 300, useNativeDriver: true }), Animated.timing(overlayOp, { toValue: 0, duration: 300, useNativeDriver: true }), ]).start(() => setShowProfilo(false)); };
  const salvaProfilo = async () => { try { const res = await fetch(`${BACKEND_URL}/api/auth/profilo`, { method: 'PATCH', headers: auth(), body: JSON.stringify({ nome: editNome }) }); if ((await res.json()).success) { const nu = { ...utente, nome: editNome }; await AsyncStorage.setItem('utente', JSON.stringify(nu)); setUtente(nu); setEditMode(false); msg("Aggiornato!"); } } catch (err) { msg("Errore"); } };
  const cambiaPw = async () => { if (!vecchiaPw || !nuovaPw) return; if (nuovaPw.length < 6) { msg("Minimo 6 caratteri"); return; } try { const res = await fetch(`${BACKEND_URL}/api/auth/cambia-password`, { method: 'PATCH', headers: auth(), body: JSON.stringify({ vecchia_password: vecchiaPw, nuova_password: nuovaPw }) }); const data = await res.json(); if (data.success) { setShowCambiaPw(false); setVecchiaPw(''); setNuovaPw(''); msg("Password cambiata!"); } else msg(data.error); } catch (err) { msg("Errore"); } };
  const logout = async () => { if (Platform.OS === 'web') { if (!window.confirm("Sei sicuro di voler uscire?")) return; } await AsyncStorage.removeItem('token'); await AsyncStorage.removeItem('utente'); router.replace('/'); };
  const fmtDataLunga = (d: string) => { const dt = new Date(d); const g = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato']; const m = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']; return `${g[dt.getDay()]} ${dt.getDate()} ${m[dt.getMonth()]}`; };

  if (loading) return <View style={[st.container,{justifyContent:'center',alignItems:'center'}]}><ActivityIndicator color="#D4AF37" size="large" /></View>;
  const attivi = prenotazioni.filter(p => p.stato === 'attivo');
  const prenotazioniPerBarbiere = barbieri.filter(b => !b.assente).map(b => ({ ...b, appuntamenti: attivi.filter(p => p.barbiere_id === b.id).sort((a: any, bb: any) => a.ora.localeCompare(bb.ora)) }));

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Animated.View style={[st.header, { opacity: headerOp }]}>
          <View><Text style={st.headerLabel}>AMMINISTRATORE</Text><Text style={st.headerBrand}>BULLDOG BARBER SHOP</Text><Text style={st.headerUser}>💈 {utente?.nome}</Text></View>
          <View style={{flexDirection:'row',gap:8}}><Pressable style={st.headerBtn} onPress={apriProfilo}><Text style={{fontSize:18}}>👤</Text></Pressable><Pressable style={st.headerBtnOut} onPress={logout}><Text style={{color:'#888',fontSize:13}}>Esci</Text></Pressable></View>
        </Animated.View>

        <View style={st.sedeRow}>{sedi.map(sede => (<Pressable key={sede.id} style={[st.sedeTab, sedeCorrente===sede.id && st.sedeTabA]} onPress={() => { setSedeCorrente(sede.id); setFiltroBarbiere(utente?.id); setShowFiltri(false); }}><Text style={[st.sedeTabText, sedeCorrente===sede.id && st.sedeTabTextA]}>{sede.nome}</Text></Pressable>))}</View>

        <View style={st.statRow}><View style={st.statCard}><Text style={st.statVal}>{attivi.length}</Text><Text style={st.statLbl}>Appuntamenti</Text></View></View>

        <Text style={st.secTitle}>— Data</Text>
        <Pressable style={st.dataBtn} onPress={() => setShowCalendario(!showCalendario)}><Text style={st.dataBtnText}>📅  {fmtDataLunga(dataCorrente)}</Text><Text style={{color:'#D4AF37',fontSize:14}}>{showCalendario ? '▲' : '▼'}</Text></Pressable>
        {showCalendario && (<View style={st.calBox}><Calendar firstDay={1} current={dataCorrente} onDayPress={(day: any) => { setDataCorrente(day.dateString); setShowCalendario(false); }} markedDates={{ [dataCorrente]: { selected: true, selectedColor: '#D4AF37' } }} theme={{ backgroundColor:'#0A0A0A', calendarBackground:'#141414', textSectionTitleColor:'#D4AF37', selectedDayBackgroundColor:'#D4AF37', selectedDayTextColor:'#0A0A0A', todayTextColor:'#D4AF37', dayTextColor:'#FFF', textDisabledColor:'#333', monthTextColor:'#D4AF37', arrowColor:'#D4AF37', textMonthFontWeight:'bold' }} /></View>)}

        <Text style={st.secTitle}>— Barbieri</Text>
        <Pressable style={st.dataBtn} onPress={() => setShowFiltri(!showFiltri)}>
          <Text style={st.dataBtnText}>💈  {filtroBarbiere === utente?.id ? 'I Miei Appuntamenti' : filtroBarbiere === null ? 'Tutti i Barbieri' : barbieri.find(b=>b.id===filtroBarbiere)?.nome || 'Barbiere'}</Text>
          <Text style={{color:'#D4AF37',fontSize:14}}>{showFiltri ? '▲' : '▼'}</Text>
        </Pressable>
        {showFiltri && (
          <View style={st.filtriDrop}>
            <Pressable style={[st.filtroItem, filtroBarbiere === utente?.id && st.filtroItemA]} onPress={() => { setFiltroBarbiere(utente?.id); setShowFiltri(false); }}>
              <Text style={[st.filtroItemText, filtroBarbiere === utente?.id && st.filtroItemTextA]}>📋 I Miei Appuntamenti</Text>
            </Pressable>
            <View style={{height:1,backgroundColor:'#1A1A1A',marginVertical:4}} />
            <Pressable style={[st.filtroItem, filtroBarbiere === null && st.filtroItemA]} onPress={() => { setFiltroBarbiere(null); setShowFiltri(false); }}>
              <Text style={[st.filtroItemText, filtroBarbiere === null && st.filtroItemTextA]}>👥 Tutti i Barbieri</Text>
            </Pressable>
            {barbieri.filter(b => !b.assente && b.id !== utente?.id).map(b => (
              <Pressable key={b.id} style={[st.filtroItem, filtroBarbiere===b.id && st.filtroItemA]} onPress={() => { setFiltroBarbiere(b.id); setShowFiltri(false); }}>
                <Text style={[st.filtroItemText, filtroBarbiere===b.id && st.filtroItemTextA]}>💈 {b.nome}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={st.actRow}><Pressable style={st.actGold} onPress={apriModalAggiungi}><Text style={st.actGoldText}>+ Nuovo Appuntamento</Text></Pressable><Pressable style={st.actRed} onPress={() => { setAssenzaBarbiere(barbieri.find(b=>!b.assente)?.id||0); setShowAssenza(true); }}><Text style={st.actRedText}>🔴 Assente</Text></Pressable></View>

        {barbieri.filter(b=>b.assente).map(b => (<View key={b.id} style={st.absCard}><Text style={st.absText}>🔴 {b.nome} è assente</Text><Pressable style={st.absBtn} onPress={() => riattiva(b.id)}><Text style={st.absBtnText}>Riattiva</Text></Pressable></View>))}

        <Text style={st.secTitle}>— Appuntamenti</Text>
        {attivi.length === 0 ? (<View style={st.emptyBox}><Text style={{fontSize:40,marginBottom:12}}>📋</Text><Text style={st.emptyText}>Nessun appuntamento</Text></View>
        ) : !filtroBarbiere ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header barbieri */}
              <View style={st.tblHeaderRow}>
                <View style={st.tblOraCol}><Text style={st.tblOraHeader}>ORA</Text></View>
                {prenotazioniPerBarbiere.map(b => (
                  <View key={b.id} style={st.tblBarbCol}><Text style={st.tblBarbName}>💈 {b.nome}</Text></View>
                ))}
              </View>
              {/* Righe orari - genera tutti gli slot unici ordinati */}
              {(() => {
                // Raccogli tutti gli orari unici dagli appuntamenti
                const tuttiOrari = new Set<string>();
                attivi.forEach((p: any) => tuttiOrari.add(p.ora?.slice(0,5)));
                const orariOrdinati = Array.from(tuttiOrari).sort();

                return orariOrdinati.map(ora => (
                  <View key={ora} style={st.tblRow}>
                    <View style={st.tblOraCol}><Text style={st.tblOraText}>{ora}</Text></View>
                    {prenotazioniPerBarbiere.map(b => {
                      const app = b.appuntamenti.find((p: any) => p.ora?.slice(0,5) === ora);
                      return (
                        <View key={b.id} style={st.tblCell}>
                          {app ? (
                            <View style={st.tblAppCard}>
                              <Text style={st.tblAppCliente}>{app.cliente_nome}</Text>
                              <Text style={st.tblAppServizio}>{app.servizio_nome}</Text>
                              <Text style={st.tblAppDurata}>{app.durata_minuti || 40} min</Text>
                              <Pressable style={st.tblAppDel} onPress={() => cancella(app.id)}><Text style={st.tblAppDelText}>✕</Text></Pressable>
                            </View>
                          ) : (
                            <View style={st.tblEmpty}><Text style={st.tblEmptyText}>—</Text></View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ));
              })()}
            </View>
          </ScrollView>
        ) : (
          <View style={st.listCont}>{attivi.sort((a: any, b: any) => a.ora.localeCompare(b.ora)).map(p => (
            <View key={p.id} style={st.listCard}><View style={st.listOraBox}><Text style={st.listOra}>{p.ora?.slice(0,5)}</Text></View>
              <View style={{flex:1}}><Text style={st.listCli}>{p.cliente_nome}</Text><Text style={st.listInfo}>✂️ {p.servizio_nome}  •  💈 {p.barbiere_nome}</Text></View>
              <Pressable style={st.listDel} onPress={() => cancella(p.id)}><Text style={st.listDelText}>✕</Text></Pressable>
            </View>))}</View>
        )}
        <View style={{height:40}} />
      </ScrollView>

      {showAggiungi && (<View style={st.modalOv}><View style={st.modal}><ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Text style={st.mTitle}>Nuovo Appuntamento</Text><Text style={st.mDate}>📅 {fmtDataLunga(dataCorrente)}</Text>
        <Text style={st.mLabel}>NOME CLIENTE</Text><TextInput style={st.mInput} value={newCliente} onChangeText={setNewCliente} placeholder="Nome e cognome" placeholderTextColor="#333" />
        <Text style={st.mLabel}>BARBIERE</Text><View style={st.mGrid}>{barbieri.filter(b=>!b.assente).map(b => (<Pressable key={b.id} style={[st.mChip, newBarbiere===b.id && st.mChipA]} onPress={() => { setNewBarbiere(b.id); caricaOrariNuovo(b.id, newServizio); }}><Text style={[st.mChipText, newBarbiere===b.id && st.mChipTextA]}>{b.nome}</Text></Pressable>))}</View>
        <Text style={st.mLabel}>SERVIZIO</Text><View style={st.mGrid}>{servizi.map(sv => (<Pressable key={sv.id} style={[st.mChip, newServizio===sv.id && st.mChipA]} onPress={() => { setNewServizio(sv.id); caricaOrariNuovo(newBarbiere, sv.id); }}><Text style={[st.mChipText, newServizio===sv.id && st.mChipTextA]}>{sv.nome}</Text></Pressable>))}</View>
        <Text style={st.mLabel}>ORARIO DISPONIBILE</Text>
        {loadingOrari ? <ActivityIndicator color="#D4AF37" size="small" style={{marginVertical:16}} /> : orariNuovo.length===0 ? <Text style={st.mNoSlot}>Nessun orario disponibile</Text> : (<View style={st.oGrid}>{orariNuovo.map(o => (<Pressable key={o} style={[st.oBtn, newOra===o && st.oBtnA]} onPress={() => setNewOra(o)}><Text style={[st.oText, newOra===o && st.oTextA]}>{o}</Text></Pressable>))}</View>)}
        <View style={st.mBtns}><Pressable style={st.mCancel} onPress={() => setShowAggiungi(false)}><Text style={{color:'#666',fontWeight:'700',fontSize:14}}>Annulla</Text></Pressable><Pressable style={st.mConfirm} onPress={salvaAggiungi}><Text style={{color:'#0A0A0A',fontWeight:'800',fontSize:14}}>Salva</Text></Pressable></View>
      </ScrollView></View></View>)}

      {showAssenza && (<View style={st.modalOv}><View style={st.modal}>
        <Text style={st.mTitle}>🔴 Segna Assente</Text><Text style={{color:'#F44336',fontSize:13,marginBottom:16,lineHeight:18}}>Tutti gli appuntamenti verranno cancellati e i clienti notificati.</Text>
        <Text style={st.mLabel}>BARBIERE</Text><View style={st.mGrid}>{barbieri.filter(b=>!b.assente).map(b => (<Pressable key={b.id} style={[st.mChip, assenzaBarbiere===b.id && st.mChipA]} onPress={() => setAssenzaBarbiere(b.id)}><Text style={[st.mChipText, assenzaBarbiere===b.id && st.mChipTextA]}>{b.nome}</Text></Pressable>))}</View>
        <Text style={st.mLabel}>MOTIVO</Text><TextInput style={st.mInput} value={assenzaMotivo} onChangeText={setAssenzaMotivo} placeholder="Es: Malato..." placeholderTextColor="#333" />
        <View style={st.mBtns}><Pressable style={st.mCancel} onPress={() => setShowAssenza(false)}><Text style={{color:'#666',fontWeight:'700',fontSize:14}}>Annulla</Text></Pressable><Pressable style={[st.mConfirm,{backgroundColor:'#F44336'}]} onPress={segnaAssente}><Text style={{color:'#FFF',fontWeight:'800',fontSize:14}}>Conferma</Text></Pressable></View>
      </View></View>)}

      {showProfilo && (<Animated.View style={[st.overlay, { opacity: overlayOp }]} pointerEvents="auto"><Pressable style={{flex:1}} onPress={chiudiProfilo} /></Animated.View>)}
      {showProfilo && (<Animated.View style={[st.sheet, { transform: [{ translateY: sheetAnim }] }]}><View style={st.handle} />
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={st.sHead}><View style={st.sAvatar}><Text style={st.sAvatarText}>{utente?.nome?.[0]?.toUpperCase()||'?'}</Text></View><Text style={st.sName}>{utente?.nome}</Text><Text style={st.sEmail}>{utente?.email}</Text></View>
          <View style={st.sActions}><Pressable style={st.sActBtn} onPress={() => { setEditMode(true); setShowCambiaPw(false); }}><View style={st.sActIcon}><Text style={{fontSize:18}}>✏️</Text></View><Text style={st.sActText}>Modifica</Text></Pressable><Pressable style={st.sActBtn} onPress={() => { setShowCambiaPw(true); setEditMode(false); }}><View style={st.sActIcon}><Text style={{fontSize:18}}>🔒</Text></View><Text style={st.sActText}>Password</Text></Pressable><Pressable style={st.sActBtn} onPress={logout}><View style={[st.sActIcon,{borderColor:'rgba(244,67,54,0.2)',backgroundColor:'rgba(244,67,54,0.05)'}]}><Text style={{fontSize:18}}>🚪</Text></View><Text style={[st.sActText,{color:'#F44336'}]}>Esci</Text></Pressable></View>
          {editMode && (<View style={st.sSec}><Text style={st.sSecLabel}>MODIFICA NOME</Text><TextInput style={st.sInput} value={editNome} onChangeText={setEditNome} placeholderTextColor="#333" /><View style={st.sBtnRow}><Pressable style={st.sBtnCancel} onPress={() => setEditMode(false)}><Text style={{color:'#666',fontWeight:'700'}}>Annulla</Text></Pressable><Pressable style={st.sBtnSave} onPress={salvaProfilo}><Text style={{color:'#0A0A0A',fontWeight:'800'}}>Salva</Text></Pressable></View></View>)}
          {showCambiaPw && (<View style={st.sSec}><Text style={st.sSecLabel}>CAMBIA PASSWORD</Text><TextInput style={st.sInput} value={vecchiaPw} onChangeText={setVecchiaPw} placeholder="Password attuale" placeholderTextColor="#333" secureTextEntry /><TextInput style={[st.sInput,{marginTop:8}]} value={nuovaPw} onChangeText={setNuovaPw} placeholder="Nuova (min 6)" placeholderTextColor="#333" secureTextEntry /><View style={st.sBtnRow}><Pressable style={st.sBtnCancel} onPress={() => { setShowCambiaPw(false); setVecchiaPw(''); setNuovaPw(''); }}><Text style={{color:'#666',fontWeight:'700'}}>Annulla</Text></Pressable><Pressable style={st.sBtnSave} onPress={cambiaPw}><Text style={{color:'#0A0A0A',fontWeight:'800'}}>Cambia</Text></Pressable></View></View>)}
        </ScrollView>
      </Animated.View>)}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10, marginBottom: 16 },
  headerLabel: { fontSize: 10, fontWeight: '700', color: '#555', letterSpacing: 3 },
  headerBrand: { fontSize: 18, fontWeight: '900', color: '#D4AF37', letterSpacing: 2, marginTop: 2 },
  headerUser: { color: '#666', fontSize: 13, marginTop: 6 },
  headerBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any },
  headerBtnOut: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#222', cursor: 'pointer' as any },
  sedeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sedeTab: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', alignItems: 'center', cursor: 'pointer' as any },
  sedeTabA: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.08)' },
  sedeTabText: { color: '#555', fontWeight: '700', fontSize: 14 },
  sedeTabTextA: { color: '#D4AF37' },
  statRow: { flexDirection: 'row', marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#141414', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E' },
  statVal: { fontSize: 28, fontWeight: '900', color: '#D4AF37' },
  statLbl: { fontSize: 11, color: '#555', fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, marginTop: 20 },
  dataBtn: { backgroundColor: '#141414', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E', cursor: 'pointer' as any },
  dataBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  calBox: { backgroundColor: '#141414', borderRadius: 14, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: '#1E1E1E' },
  filtriWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', cursor: 'pointer' as any },
  chipA: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.08)' },
  chipText: { color: '#555', fontSize: 13, fontWeight: '600' },
  chipTextA: { color: '#D4AF37' },
  filtriDrop: { backgroundColor: '#141414', borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: '#1E1E1E', overflow: 'hidden' },
  filtroItem: { padding: 14, cursor: 'pointer' as any },
  filtroItemA: { backgroundColor: 'rgba(212,175,55,0.06)' },
  filtroItemText: { color: '#888', fontSize: 14, fontWeight: '600' },
  filtroItemTextA: { color: '#D4AF37' },
  actRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actGold: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#D4AF37', alignItems: 'center', cursor: 'pointer' as any },
  actGoldText: { color: '#0A0A0A', fontWeight: '800', fontSize: 14 },
  actRed: { padding: 14, borderRadius: 12, backgroundColor: 'rgba(244,67,54,0.06)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.2)', cursor: 'pointer' as any },
  actRedText: { color: '#F44336', fontWeight: '700', fontSize: 13 },
  absCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(244,67,54,0.04)', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(244,67,54,0.15)' },
  absText: { color: '#F44336', fontSize: 14, fontWeight: '600' },
  absBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: 'rgba(76,175,80,0.08)', borderWidth: 1, borderColor: 'rgba(76,175,80,0.2)', cursor: 'pointer' as any },
  absBtnText: { color: '#4CAF50', fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#444', fontSize: 16 },
  colCont: { flexDirection: 'row', gap: 12, paddingBottom: 10 },
  col: { width: 200, backgroundColor: '#141414', borderRadius: 16, borderWidth: 1, borderColor: '#1E1E1E', overflow: 'hidden' },
  colHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: 'rgba(212,175,55,0.05)', borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  colHeadText: { color: '#D4AF37', fontSize: 14, fontWeight: '700' },
  colNum: { color: '#555', fontSize: 12, fontWeight: '700', backgroundColor: '#0A0A0A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  colNone: { color: '#333', fontSize: 13, padding: 14, textAlign: 'center' },
  colItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  colOra: { color: '#D4AF37', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  colCli: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  colServ: { color: '#666', fontSize: 12, marginBottom: 8 },
  colDel: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6, backgroundColor: 'rgba(244,67,54,0.06)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.2)', cursor: 'pointer' as any },
  colDelText: { color: '#F44336', fontSize: 11, fontWeight: '700' },
  // Tabella
  tblHeaderRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#1E1E1E', paddingBottom: 10, marginBottom: 4 },
  tblOraCol: { width: 60, justifyContent: 'center', alignItems: 'center' },
  tblOraHeader: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  tblBarbCol: { width: 140, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tblBarbName: { color: '#D4AF37', fontSize: 13, fontWeight: '700' },
  tblRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1A1A1A', minHeight: 70 },
  tblOraText: { color: '#D4AF37', fontSize: 14, fontWeight: '800' },
  tblCell: { width: 140, paddingHorizontal: 4, paddingVertical: 6, justifyContent: 'center' },
  tblAppCard: { backgroundColor: '#1A1A1A', borderRadius: 10, padding: 8, borderLeftWidth: 3, borderLeftColor: '#D4AF37', position: 'relative' },
  tblAppCliente: { color: '#FFF', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  tblAppServizio: { color: '#888', fontSize: 11 },
  tblAppDurata: { color: '#555', fontSize: 10, marginTop: 2 },
  tblAppDel: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(244,67,54,0.1)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any },
  tblAppDelText: { color: '#F44336', fontSize: 10, fontWeight: '700' },
  tblEmpty: { alignItems: 'center', justifyContent: 'center', height: 50 },
  tblEmptyText: { color: '#222', fontSize: 16 },
  listCont: { gap: 8 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1E1E1E', gap: 12 },
  listOraBox: { width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.08)', alignItems: 'center', justifyContent: 'center' },
  listOra: { color: '#D4AF37', fontSize: 16, fontWeight: '800' },
  listCli: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  listInfo: { color: '#666', fontSize: 12 },
  listDel: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(244,67,54,0.06)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.2)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any },
  listDelText: { color: '#F44336', fontSize: 14, fontWeight: '700' },
  modalOv: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 100 },
  modal: { backgroundColor: '#111', borderRadius: 24, padding: 24, width: '100%', maxWidth: 440, maxHeight: '90%', borderWidth: 1, borderColor: '#1A1A1A' },
  mTitle: { fontSize: 22, fontWeight: '800', color: '#D4AF37', marginBottom: 4 },
  mDate: { color: '#666', fontSize: 13, marginBottom: 20 },
  mLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  mInput: { backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 15 },
  mGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1A1A1A', cursor: 'pointer' as any },
  mChipA: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.08)' },
  mChipText: { color: '#555', fontSize: 13, fontWeight: '600' },
  mChipTextA: { color: '#D4AF37' },
  mNoSlot: { color: '#444', fontSize: 14, textAlign: 'center', marginVertical: 16 },
  oGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  oBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1A1A1A', cursor: 'pointer' as any },
  oBtnA: { borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)' },
  oText: { color: '#555', fontSize: 15, fontWeight: '700' },
  oTextA: { color: '#D4AF37' },
  mBtns: { flexDirection: 'row', gap: 10, marginTop: 24 },
  mCancel: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', cursor: 'pointer' as any },
  mConfirm: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#D4AF37', alignItems: 'center', cursor: 'pointer' as any },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 50 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H, backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, zIndex: 60, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: '#1E1E1E' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  sHead: { alignItems: 'center', marginBottom: 24 },
  sAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 2, borderColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  sAvatarText: { color: '#D4AF37', fontSize: 28, fontWeight: '800' },
  sName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  sEmail: { color: '#555', fontSize: 13, marginTop: 4 },
  sActions: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 24 },
  sActBtn: { alignItems: 'center', gap: 6, cursor: 'pointer' as any },
  sActIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222', alignItems: 'center', justifyContent: 'center' },
  sActText: { color: '#888', fontSize: 12, fontWeight: '600' },
  sSec: { backgroundColor: '#0A0A0A', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  sSecLabel: { color: '#D4AF37', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  sInput: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 12, padding: 13, color: '#FFF', fontSize: 15 },
  sBtnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  sBtnCancel: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', cursor: 'pointer' as any },
  sBtnSave: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: '#D4AF37', alignItems: 'center', cursor: 'pointer' as any },
});
