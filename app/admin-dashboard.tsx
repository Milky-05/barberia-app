import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

// IMPORTIAMO GLI STILI E LA COSTANTE
import { SHEET_H, st } from "../styles/adminDashboardStyles";
import { supabase } from "../lib/supabase";

LocaleConfig.locales["it"] = {
  monthNames: [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ],
  monthNamesShort: [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
  today: "Oggi",
};
LocaleConfig.defaultLocale = "it";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

const MESI_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI_IT = ["Lu","Ma","Me","Gi","Ve","Sa","Do"];

function CalendarioInline({ value, onChange, min, marginBottom = 14 }: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  marginBottom?: number;
}) {
  const oggi = new Date();
  const oggiStr = `${oggi.getFullYear()}-${String(oggi.getMonth()+1).padStart(2,"0")}-${String(oggi.getDate()).padStart(2,"0")}`;
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [measuredH, setMeasuredH] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split("-")[0]) : oggi.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split("-")[1]) - 1 : oggi.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayMon = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayMon; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const rows: (number | null)[][] = [];
  for (let r = 0; r < Math.ceil(cells.length / 7); r++) rows.push(cells.slice(r*7, r*7+7));

  // fallback height se non ancora misurato: header(52) + intestazione giorni(30) + righe(30px cad) + padding(28)
  const estimatedH = measuredH > 0 ? measuredH : 110 + rows.length * 30;

  const fmtDisplay = (v: string) => { const [y,m,d] = v.split("-"); return `${d}/${m}/${y}`; };

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1);

  const openCal = () => {
    setVisible(true);
    setOpen(true);
    Animated.parallel([
      Animated.timing(animVal,   { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: estimatedH, duration: 260, useNativeDriver: false }),
    ]).start();
  };

  const closeCal = () => {
    setOpen(false);
    Animated.parallel([
      Animated.timing(animVal,   { toValue: 0, duration: 260, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: 0, duration: 260, useNativeDriver: false }),
    ]).start(() => setVisible(false));
  };

  const selectDay = (day: number) => {
    const ds = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    if (min && ds < min) return;
    onChange(ds);
    closeCal();
  };

  return (
    <View style={{ marginBottom }}>
      <Pressable
        onPress={() => open ? closeCal() : openCal()}
        style={{ backgroundColor: "#0A0A0A", borderWidth: 1.5, borderColor: open ? "#D4AF37" : "#1A1A1A", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <Text style={{ color: value ? "#FFF" : "#444", fontSize: 15 }}>{value ? fmtDisplay(value) : "GG / MM / AAAA"}</Text>
        <Text style={{ color: open ? "#D4AF37" : "#444", fontSize: 11 }}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      {/* wrapper che anima l'altezza — impedisce al layout di collassare di scatto */}
      {visible && (
        <Animated.View style={{ height: heightAnim, overflow: "hidden", marginTop: 6 }}>
          <Animated.View
            onLayout={(e) => { const h = e.nativeEvent.layout.height; if (h > 0) setMeasuredH(h); }}
            style={{ opacity: animVal, backgroundColor: "#0D0D0D", borderRadius: 14, borderWidth: 1, borderColor: "#1E1E1E", padding: 14 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Pressable onPress={prevMonth} style={{ padding: 10 }}>
                <Text style={{ color: "#666", fontSize: 18, lineHeight: 18 }}>‹</Text>
              </Pressable>
              <Text style={{ flex: 1, textAlign: "center", color: "#DDD", fontWeight: "700", fontSize: 13, letterSpacing: 1 }}>
                {MESI_IT[viewMonth].toUpperCase()} {viewYear}
              </Text>
              <Pressable onPress={nextMonth} style={{ padding: 10 }}>
                <Text style={{ color: "#666", fontSize: 18, lineHeight: 18 }}>›</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              {GIORNI_IT.map(g => (
                <View key={g} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: "#444", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>{g}</Text>
                </View>
              ))}
            </View>

            {rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: "row" }}>
                {Array.from({ length: 7 }, (_, ci) => {
                  const day = row[ci] ?? null;
                  if (!day) return <View key={ci} style={{ flex: 1, paddingVertical: 8 }} />;
                  const ds = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const isSelected = ds === value;
                  const isOggi = ds === oggiStr;
                  const isDisabled = !!(min && ds < min);
                  return (
                    <Pressable
                      key={ci}
                      onPress={() => !isDisabled && selectDay(day)}
                      style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8, backgroundColor: isSelected ? "#D4AF37" : "transparent", opacity: isDisabled ? 0.2 : 1 }}
                    >
                      <Text style={{ color: isSelected ? "#000" : isOggi ? "#D4AF37" : "#AAA", fontSize: 13, fontWeight: isSelected || isOggi ? "700" : "400" }}>
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [utente, setUtente] = useState<any>(null);
  const [sedi, setSedi] = useState<any[]>([]);
  const [sedeCorrente, setSedeCorrente] = useState(0);
  const [dataCorrente, setDataCorrente] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [tuttiBarbieri, setTuttiBarbieri] = useState<any[]>([]);
  const [barbieriAssenti, setBarbieriAssenti] = useState<any[]>([]);
  const [barbieriProgrammati, setBarbieriProgrammati] = useState<any[]>([]);
  const [servizi, setServizi] = useState<any[]>([]);
  const [filtroBarbiere, setFiltroBarbiere] = useState<number | null>(null);
  const [showFiltri, setShowFiltri] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCalendario, setShowCalendario] = useState(false);
  const [showAggiungi, setShowAggiungi] = useState(false);
  const [newCliente, setNewCliente] = useState("");
  const [newTelefono, setNewTelefono] = useState("");
  const [newBarbiere, setNewBarbiere] = useState(0);
  const [newServizio, setNewServizio] = useState(0);
  const [newOra, setNewOra] = useState("");
  const [orariNuovo, setOrariNuovo] = useState<string[]>([]);
  const [showServiziDrop, setShowServiziDrop] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState<"form" | "riepilogo">("form");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [loadingOrari, setLoadingOrari] = useState(false);
  const [showAssenza, setShowAssenza] = useState(false);
  const [showPermesso, setShowPermesso] = useState(false);
  const [permessoMinuti, setPermessoMinuti] = useState(60);
  const [assenzaData, setAssenzaData] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; });
  const [assenzaGiorni, setAssenzaGiorni] = useState<number | null>(1);
  const [assenzaFine, setAssenzaFine] = useState("");
  const [assenzaStep, setAssenzaStep] = useState<"form" | "riepilogo">("form");
  const [showAssenzaBanner, setShowAssenzaBanner] = useState(false);
  const [permessoData, setPermessoData] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; });
  const [permessoOraInizio, setPermessoOraInizio] = useState(() => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; });
  const [showModifica, setShowModifica] = useState(false);
  const [modificaApp, setModificaApp] = useState<any>(null);
  const [modNome, setModNome] = useState("");
  const [modServizio, setModServizio] = useState(0);
  const [modOra, setModOra] = useState("");
  const [modOrariDisp, setModOrariDisp] = useState<string[]>([]);
  const [modLoadingOrari, setModLoadingOrari] = useState(false);
  const [assenzaBarbiere, setAssenzaBarbiere] = useState(0);
  const [assenzaMotivo, setAssenzaMotivo] = useState("");
  const [showProfilo, setShowProfilo] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [vecchiaPw, setVecchiaPw] = useState("");
  const [nuovaPw, setNuovaPw] = useState("");
  const [showCambiaPw, setShowCambiaPw] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nonLetteAdmin, setNonLetteAdmin] = useState(0);
  const [activeTab, setActiveTab] = useState<"home" | "agenda">("home");
  const [appDetail, setAppDetail] = useState<any>(null);
  const sheetAnim = useRef(new Animated.Value(SHEET_H)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const auth = (t?: string) => ({
    Authorization: `Bearer ${t || token}`,
    "Content-Type": "application/json",
  });

  // Helper: fa fetch con token corrente; se 401 (token scaduto) lo rinnova e riprova
  const fetchAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let res = await fetch(url, { ...options, headers: { ...auth(), ...(options.headers as any) } });
    if (res.status === 401) {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session?.access_token) {
        setToken(session.access_token);
        res = await fetch(url, { ...options, headers: { ...auth(session.access_token), ...(options.headers as any) } });
      }
    }
    return res;
  };

  const msg = (m: string) => {
    Platform.OS === "web" ? window.alert(m) : Alert.alert("Info", m);
  };

  useEffect(() => {
    Animated.timing(headerOp, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    caricaDati();
  }, []);
  const caricaDati = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      });
      if (!meRes.ok) { setLoading(false); router.replace("/"); return; }
      const meData = await meRes.json();
      const u = { ...meData.utente, email: session.user.email };
      setToken(session.access_token);
      setUtente(u);
      setEditNome(u.nome || "");
      const resSedi = await fetch(`${BACKEND_URL}/api/sedi`);
      const tutteSedi = await resSedi.json();
      setSedi(tutteSedi);
      if (tutteSedi.length > 0) setSedeCorrente(tutteSedi[0].id);
      setFiltroBarbiere(u.barbiere_id || null);
      const resServ = await fetch(`${BACKEND_URL}/api/servizi`);
      setServizi(await resServ.json());
      setLoading(false);
    } catch (err) {
      setLoading(false);
      router.replace("/");
    }
  };
  useEffect(() => {
    if (sedeCorrente && token) {
      caricaBarbieri();
      caricaPrenotazioni();
    }
  }, [sedeCorrente, dataCorrente, filtroBarbiere]);
  const caricaBarbieri = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/barbieri-disponibili?sede_id=${sedeCorrente}&data=${dataCorrente}`,
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setBarbieri(data);
      } else if (data.barbieri) {
        setBarbieri(data.barbieri);
      } else {
        setBarbieri([]);
      }
      const resAll = await fetchAuth(
        `${BACKEND_URL}/api/admin/barbieri?sede_id=${sedeCorrente}`,
      );
      const allBarb = await resAll.json();
      if (Array.isArray(allBarb)) {
        setTuttiBarbieri(allBarb);
        setBarbieriAssenti(allBarb.filter((b: any) => b.assente));
        setBarbieriProgrammati(allBarb.filter((b: any) => {
          if (b.assente || !b.motivo_assenza?.startsWith("{")) return false;
          try { return JSON.parse(b.motivo_assenza).stato === "programmato"; }
          catch { return false; }
        }));
      }
    } catch (err) {
      setBarbieri([]);
    }
  };
  const caricaPrenotazioni = async () => {
    // Carica SEMPRE tutti gli appuntamenti (filtro per barbiere solo client-side)
    const url = `${BACKEND_URL}/api/admin/prenotazioni?sede_id=${sedeCorrente}&data=${dataCorrente}`;
    try {
      const res = await fetchAuth(url);
      if (!res.ok) return;
      setPrenotazioni(await res.json());
    } catch (err) {}
  };
  const cancella = async (id: number) => {
    if (Platform.OS === "web") {
      if (!window.confirm("Cancellare questo appuntamento?")) return;
    }
    try {
      await fetchAuth(`${BACKEND_URL}/api/admin/prenotazioni/${id}`, {
        method: "DELETE",
      });
      caricaPrenotazioni();
    } catch (err) {
      msg("Errore");
    }
  };
  const caricaOrariNuovo = async (barbId: number, servId: number) => {
    setLoadingOrari(true);
    setNewOra("");
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/orari-disponibili?barbiere_id=${barbId}&data=${dataCorrente}&servizio_id=${servId}`,
      );
      const data = await res.json();
      setOrariNuovo(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrariNuovo([]);
    }
    setLoadingOrari(false);
  };
  const apriModalAggiungi = () => {
    const p = barbieri.find((b) => !b.assente);
    const ps = servizi[0];
    setNewBarbiere(p?.id || 0);
    setNewServizio(ps?.id || 0);
    setNewCliente("");
    setNewTelefono("");
    setNewOra("");
    setShowServiziDrop(false);
    setModalStep("form");
    setShowAggiungi(true);
    if (p && ps) caricaOrariNuovo(p.id, ps.id);
  };
  const salvaAggiungi = async () => {
    if (!newCliente) {
      msg("Inserisci il nome del cliente");
      return;
    }
    if (!newOra) {
      msg("Seleziona un orario");
      return;
    }
    try {
      const res = await fetchAuth(`${BACKEND_URL}/api/admin/prenotazioni`, {
        method: "POST",
        body: JSON.stringify({
          sede_id: sedeCorrente,
          barbiere_id: newBarbiere,
          cliente_nome: newCliente,
          cliente_telefono: newTelefono || undefined,
          data: dataCorrente,
          ora: newOra,
          servizio_id: newServizio,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAggiungi(false);
        setModalStep("form");
        setNewCliente("");
        setNewTelefono("");
        caricaPrenotazioni();
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 3000);
      } else msg(data.error);
    } catch (err) {
      msg("Errore");
    }
  };
  const salvaModifica = async () => {
    if (!modificaApp) return;
    try {
      const body: any = {};
      if (modNome && modNome !== modificaApp.cliente_nome)
        body.cliente_nome = modNome;
      if (modOra && modOra !== modificaApp.ora?.slice(0, 5)) body.ora = modOra;
      const res = await fetchAuth(
        `${BACKEND_URL}/api/admin/prenotazioni/${modificaApp.id}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      const data = await res.json();
      if (data.success) {
        setShowModifica(false);
        setModificaApp(null);
        caricaPrenotazioni();
        msg("Appuntamento modificato!");
      } else msg(data.error || "Errore");
    } catch (err) {
      msg("Errore");
    }
  };
  const caricaOrariModifica = async (barbId: number, servId: number) => {
    setModLoadingOrari(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/orari-disponibili?barbiere_id=${barbId}&data=${dataCorrente}&servizio_id=${servId}`,
      );
      const data = await res.json();
      setModOrariDisp(Array.isArray(data) ? data : []);
    } catch (err) {
      setModOrariDisp([]);
    }
    setModLoadingOrari(false);
  };
  const apriModifica = (app: any) => {
    setModificaApp(app);
    setModNome(app.cliente_nome);
    setModServizio(app.servizio_id || servizi[0]?.id || 0);
    setModOra(app.ora?.slice(0, 5));
    setShowModifica(true);
    caricaOrariModifica(
      app.barbiere_id,
      app.servizio_id || servizi[0]?.id || 0,
    );
  };
  const segnaAssente = async () => {
    if (!assenzaBarbiere) { msg("Seleziona un barbiere"); return; }
    const giorni = Math.round((new Date(assenzaFine).getTime() - new Date(assenzaData).getTime()) / 86400000) + 1;
    try {
      const res = await fetchAuth(`${BACKEND_URL}/api/admin/barbiere-assente`, {
        method: "POST",
        body: JSON.stringify({
          barbiere_id: assenzaBarbiere,
          motivo: assenzaMotivo || "Assente",
          data_inizio: assenzaData,
          giorni,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAssenza(false);
        setAssenzaStep("form");
        setAssenzaMotivo("");
        setAssenzaFine("");
        caricaBarbieri();
        caricaPrenotazioni();
        setShowAssenzaBanner(true);
        setTimeout(() => setShowAssenzaBanner(false), 3500);
      } else msg(data.error);
    } catch (err) { msg("Errore"); }
  };
  const segnaPermesso = async () => {
    if (!assenzaBarbiere) { msg("Seleziona un barbiere"); return; }
    try {
      const res = await fetchAuth(`${BACKEND_URL}/api/admin/barbiere-permesso`, {
        method: "POST",
        body: JSON.stringify({
          barbiere_id: assenzaBarbiere,
          data_inizio: permessoData,
          ora_inizio: permessoOraInizio,
          minuti: permessoMinuti,
        }),
      });
      const data = await res.json();
      if (data.success) {
        msg(data.messaggio);
        setShowPermesso(false);
        caricaBarbieri();
      } else msg(data.error);
    } catch (err) { msg("Errore"); }
  };

  const riattiva = async (id: number) => {
    try {
      const res = await fetchAuth(`${BACKEND_URL}/api/admin/barbiere-presente`, {
        method: "POST",
        body: JSON.stringify({ barbiere_id: id }),
      });
      const data = await res.json();
      if (data.success) {
        msg("Barbiere riattivato!");
        caricaBarbieri();
        caricaPrenotazioni();
      } else msg(data.error);
    } catch (err) {
      msg("Errore");
    }
  };
  const apriProfilo = () => {
    setShowProfilo(true);
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOp, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const chiudiProfilo = () => {
    setEditMode(false);
    setShowCambiaPw(false);
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: SHEET_H,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOp, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowProfilo(false));
  };
  const salvaProfilo = async () => {
    try {
      const res = await fetchAuth(`${BACKEND_URL}/api/auth/profilo`, {
        method: "PATCH",
        body: JSON.stringify({ nome: editNome }),
      });
      if ((await res.json()).success) {
        const nu = { ...utente, nome: editNome };
        setUtente(nu);
        setEditMode(false);
        msg("Aggiornato!");
      }
    } catch (err) {
      msg("Errore");
    }
  };
  const cambiaPw = async () => {
    if (!vecchiaPw || !nuovaPw) return;
    if (nuovaPw.length < 6) {
      msg("Minimo 6 caratteri");
      return;
    }
    try {
      const res = await fetchAuth(`${BACKEND_URL}/api/auth/cambia-password`, {
        method: "PATCH",
        body: JSON.stringify({
          vecchia_password: vecchiaPw,
          nuova_password: nuovaPw,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCambiaPw(false);
        setVecchiaPw("");
        setNuovaPw("");
        msg("Password cambiata!");
      } else msg(data.error);
    } catch (err) {
      msg("Errore");
    }
  };
  const logout = async () => {
    if (Platform.OS === "web") {
      if (!window.confirm("Sei sicuro di voler uscire?")) return;
    }
    await supabase.auth.signOut();
    router.replace("/");
  };
  const BARB_COLORS = ["#D4AF37", "#4A8FD4", "#E5734A", "#50C878", "#9B59B6"];
  const getBarbColor = (barbId: number) => {
    const idx = barbieri.findIndex((b) => b.id === barbId);
    return BARB_COLORS[Math.max(0, idx) % BARB_COLORS.length];
  };

  const DAY_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  })();
  const domaniStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  })();

  const getWeekDays = () => {
    const [y, m, d] = dataCorrente.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return { dateStr: `${yy}-${mm}-${dd}`, dt };
    });
  };

  const shiftWeek = (n: number) => {
    const [y, m, d] = dataCorrente.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n * 7);
    setDataCorrente(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`);
  };

  const shiftDay = (n: number) => {
    const [y, m, d] = dataCorrente.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    setDataCorrente(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`);
  };

  const goToday = () => setDataCorrente(todayStr);

  const weekDays = getWeekDays();
  const wFirst = weekDays[0].dt;
  const wLast = weekDays[6].dt;
  const weekLabel = wFirst.getMonth() === wLast.getMonth()
    ? `${MONTHS[wFirst.getMonth()]} ${wFirst.getFullYear()}`
    : `${MONTHS[wFirst.getMonth()].slice(0,3)} — ${MONTHS[wLast.getMonth()].slice(0,3)} ${wFirst.getFullYear()}`;

  const fmtDataLunga = (d: string) => {
    const dt = new Date(d);
    const g = [
      "Domenica",
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ];
    const m = [
      "Gennaio",
      "Febbraio",
      "Marzo",
      "Aprile",
      "Maggio",
      "Giugno",
      "Luglio",
      "Agosto",
      "Settembre",
      "Ottobre",
      "Novembre",
      "Dicembre",
    ];
    return `${g[dt.getDay()]} ${dt.getDate()} ${m[dt.getMonth()]}`;
  };
  const fmtDurata = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };
  const fmtDataShort = (s: string) => {
    try {
      const d = new Date(s + "T12:00:00Z");
      return d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
    } catch { return s; }
  };
  const isPermessoBarbiere = (b: any) => {
    if (!b.motivo_assenza) return false;
    if (b.motivo_assenza.startsWith("permesso:")) return true;
    if (b.motivo_assenza.startsWith("{")) {
      try { return JSON.parse(b.motivo_assenza).tipo === "permesso"; }
      catch { return false; }
    }
    return false;
  };

  if (loading)
    return (
      <View
        style={[
          st.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  const attivi = prenotazioni.filter((p) => p.stato === "attivo");

  const barbieriTabella = filtroBarbiere
    ? barbieri.filter((b) => b.id === filtroBarbiere)
    : barbieri;

  const prenotazioniPerBarbiere = barbieriTabella.map((b) => ({
    ...b,
    appuntamenti: attivi
      .filter((p) => p.barbiere_id === b.id)
      .sort((a: any, bb: any) => a.ora.localeCompare(bb.ora)),
  }));

  const getOrariGiornata = () => {
    const dt = new Date(dataCorrente);
    const giorno = dt.getDay();
    if (giorno === 0 || giorno === 1) return [];
    const fasce =
      giorno === 4
        ? [[720, 1320]] // Giovedì 12:00-22:00
        : [
            [540, 720],
            [900, 1140],
          ]; // Altri 9:00-12:00, 15:00-19:00
    const orari: string[] = [];
    for (const fascia of fasce) {
      let t = fascia[0];
      while (t < fascia[1]) {
        const h = Math.floor(t / 60)
          .toString()
          .padStart(2, "0");
        const m = (t % 60).toString().padStart(2, "0");
        orari.push(`${h}:${m}`);
        t += 20;
      }
    }
    return orari;
  };
  const orariGiornata = getOrariGiornata();

  const getSlotStato = (barbiereId: number, ora: string) => {
    const appBarb = attivi.filter((p) => p.barbiere_id === barbiereId);
    const appInizio = appBarb.find((p: any) => p.ora?.slice(0, 5) === ora);
    if (appInizio) return { tipo: "inizio", app: appInizio };
    const [h, m] = ora.split(":").map(Number);
    const oraMin = h * 60 + m;
    const appContinua = appBarb.find((p: any) => {
      const [ah, am] = (p.ora || "").split(":").map(Number);
      const appInizio = ah * 60 + am;
      const appFine = appInizio + (p.durata_minuti || 40);
      return oraMin > appInizio && oraMin < appFine;
    });
    if (appContinua) return { tipo: "continua", app: appContinua };
    return { tipo: "libero", app: null };
  };

  return (
    <SafeAreaView style={st.container}>
      {/* HEADER */}
      <Animated.View style={[st.header, { opacity: headerOp }]}>
        <View>
          <Text style={st.headerLabel}>AMMINISTRATORE</Text>
          <Text style={st.headerBrand}>BULLDOG BARBER SHOP</Text>
          <Text style={st.headerUser}>💈 {utente?.nome}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable style={st.headerBtnNotif} onPress={() => {}}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {nonLetteAdmin > 0 && (
              <View style={st.headerBadge}>
                <Text style={st.headerBadgeText}>{nonLetteAdmin}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={st.headerBtn} onPress={apriProfilo}>
            <Text style={{ fontSize: 18 }}>👤</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* SEDE TABS — sempre visibili */}
      <View style={st.sedeRow}>
        {sedi.map((sede) => (
          <Pressable
            key={sede.id}
            style={[st.sedeTab, sedeCorrente === sede.id && st.sedeTabA]}
            onPress={() => { setSedeCorrente(sede.id); setFiltroBarbiere(utente?.barbiere_id); setShowFiltri(false); }}
          >
            <Text style={[st.sedeTabText, sedeCorrente === sede.id && st.sedeTabTextA]}>
              {sede.nome}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ══════════ HOME TAB ══════════ */}
        {activeTab === "home" && (
          <>
            {/* Riquadro appuntamenti con navigazione giorni ai lati */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", paddingHorizontal: 4 }}>
              <Pressable onPress={() => shiftDay(-1)} style={{ paddingHorizontal: 12, paddingVertical: 24 }}>
                <Text style={{ color: "#D4AF37", fontSize: 28 }}>‹</Text>
              </Pressable>
              <View style={[st.statCard, { flex: 1, alignItems: "center" }]}>
                {orariGiornata.length === 0 ? (
                  <>
                    <Text style={{ fontSize: 32, marginBottom: 6 }}>🔒</Text>
                    <Text style={[st.statLbl, { fontSize: 13, textAlign: "center" }]}>Giorno di chiusura</Text>
                    <Text style={[st.statLbl, { color: "#444", fontSize: 11, marginTop: 2, textAlign: "center" }]}>{fmtDataLunga(dataCorrente)}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[st.statVal, { textAlign: "center" }]}>{attivi.length}</Text>
                    <Text style={[st.statLbl, { textAlign: "center" }]}>Appuntamenti — {fmtDataLunga(dataCorrente)}</Text>
                  </>
                )}
              </View>
              <Pressable onPress={() => shiftDay(1)} style={{ paddingHorizontal: 12, paddingVertical: 24 }}>
                <Text style={{ color: "#D4AF37", fontSize: 28 }}>›</Text>
              </Pressable>
            </View>
            {dataCorrente !== todayStr && (
              <Pressable onPress={goToday} style={{ alignSelf: "center", marginTop: 10, marginBottom: 2, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)" }}>
                <Text style={{ color: "#D4AF37", fontSize: 12 }}>← Torna ad oggi</Text>
              </Pressable>
            )}

            {/* Pulsanti Assente / Permesso */}
            <View style={[st.actRow, { marginTop: 16 }]}>
              <Pressable style={st.actRed} onPress={() => {
                setAssenzaBarbiere(barbieri.find((b) => !b.assente)?.id || 0);
                setAssenzaData(todayStr);
                setAssenzaGiorni(1);
                setShowAssenza(true);
              }}>
                <Text style={st.actRedText}>🔴 Assente</Text>
              </Pressable>
              <Pressable style={st.actOrange} onPress={() => {
                setAssenzaBarbiere(barbieri.find((b) => !b.assente)?.id || 0);
                const now = new Date();
                setPermessoOraInizio(`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`);
                setPermessoData(todayStr);
                setPermessoMinuti(60);
                setShowPermesso(true);
              }}>
                <Text style={st.actOrangeText}>🕐 Permesso</Text>
              </Pressable>
            </View>

            {/* Card per barbiere — solo su giorni aperti, solo i barbieri di turno quel giorno */}
            {(barbieriAssenti.length > 0 || barbieriProgrammati.length > 0) && (
              <View style={{ marginTop: 16, paddingHorizontal: 16, gap: 8 }}>
                {barbieriAssenti.map((b) => (
                  <View key={b.id} style={[st.absCard, { marginBottom: 0 }]}>
                    <Text style={st.absText}>{isPermessoBarbiere(b) ? "🟡" : "🔴"} {b.nome} {isPermessoBarbiere(b) ? "è in permesso" : "è assente"}</Text>
                    <Pressable style={st.absBtn} onPress={() => riattiva(b.id)}>
                      <Text style={st.absBtnText}>Riattiva</Text>
                    </Pressable>
                  </View>
                ))}
                {barbieriProgrammati.map((b) => {
                  const info = JSON.parse(b.motivo_assenza);
                  const isP = info.tipo === "permesso";
                  const inizio = isP ? new Date(info.inizio).toISOString().split("T")[0] : info.inizio;
                  const fine = info.fine;
                  const giorni = info.giorni;
                  const durataStr = fine
                    ? `dal ${fmtDataShort(inizio)} al ${fmtDataShort(fine)}${giorni ? ` (${giorni} ${giorni === 1 ? "giorno" : "giorni"})` : ""}`
                    : `dal ${fmtDataShort(inizio)} (durata indeterminata)`;
                  return (
                    <View key={b.id} style={[st.absCard, { borderColor: "rgba(212,175,55,0.2)", backgroundColor: "rgba(212,175,55,0.03)", marginBottom: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[st.absText, { color: "#888" }]}>🕓 {b.nome} — {isP ? "permesso" : "assenza"} programmata</Text>
                        <Text style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{durataStr}</Text>
                      </View>
                      <Pressable style={st.absBtn} onPress={() => riattiva(b.id)}>
                        <Text style={st.absBtnText}>Annulla</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {orariGiornata.length > 0 && (
              <View style={{ marginTop: 16, paddingHorizontal: 16, paddingBottom: 16 }}>
                {(() => {
                  const [y, m, d] = dataCorrente.split("-").map(Number);
                  const dow = new Date(y, m - 1, d).getDay();
                  const barbieriDelGiorno = tuttiBarbieri.filter(
                    (b) => Array.isArray(b.giorni_lavoro) && b.giorni_lavoro.includes(dow)
                  );
                  return barbieriDelGiorno.map((b) => {
                    const appBarb = attivi.filter((p: any) => p.barbiere_id === b.id);
                    const slotsOccupati = appBarb.reduce(
                      (sum: number, app: any) => sum + Math.ceil((app.durata_minuti || 20) / 20),
                      0
                    );
                    const slotsTotal = orariGiornata.length;
                    const pct = slotsTotal > 0 ? Math.min(100, (slotsOccupati / slotsTotal) * 100) : 0;
                    const color = getBarbColor(b.id);
                    const isAssente = b.assente;
                    const isPermesso = isPermessoBarbiere(b);
                    return (
                      <View
                        key={b.id}
                        style={{
                          backgroundColor: "#141414",
                          borderRadius: 10,
                          padding: 14,
                          marginBottom: 10,
                          borderWidth: 1,
                          borderColor: "#1E1E1E",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
                            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>{b.nome}</Text>
                            {isAssente && (
                              <Text style={{ color: isPermesso ? "#FFA500" : "#F44336", fontSize: 11, fontWeight: "600" }}>
                                {isPermesso ? "in permesso" : "assente"}
                              </Text>
                            )}
                          </View>
                          <Text style={{ color: "#D4AF37", fontWeight: "800", fontSize: 15 }}>
                            {slotsOccupati}/{slotsTotal}
                          </Text>
                        </View>
                        <View style={{ height: 6, backgroundColor: "#252525", borderRadius: 3 }}>
                          <View style={{ height: 6, backgroundColor: isAssente ? "#444" : color, borderRadius: 3, width: `${pct}%` as any }} />
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
            )}
          </>
        )}

        {/* ══════════ AGENDA TAB ══════════ */}
        {activeTab === "agenda" && (
          <>
            {/* Navigazione settimana */}
            <View style={st.weekHeader}>
              <Pressable style={st.weekArrow} onPress={() => shiftWeek(-1)}>
                <Text style={{ color: "#D4AF37", fontSize: 20 }}>‹</Text>
              </Pressable>
              <Text style={st.weekMonthLabel}>{weekLabel}</Text>
              <Pressable style={st.weekArrow} onPress={() => shiftWeek(1)}>
                <Text style={{ color: "#D4AF37", fontSize: 20 }}>›</Text>
              </Pressable>
            </View>

            <View style={st.weekDaysRow}>
              {weekDays.map(({ dateStr, dt }) => {
                const isSel = dateStr === dataCorrente;
                const isToday = dateStr === todayStr;
                return (
                  <Pressable
                    key={dateStr}
                    style={[st.weekDayBtn, isSel && st.weekDayBtnA, !isSel && isToday && st.weekDayBtnToday]}
                    onPress={() => setDataCorrente(dateStr)}
                  >
                    <Text style={[st.weekDayName, isSel && st.weekDayNameA]}>{DAY_SHORT[dt.getDay()]}</Text>
                    <Text style={[st.weekDayNum, isSel && st.weekDayNumA]}>{dt.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>

            {dataCorrente !== todayStr && (
              <Pressable style={st.weekTodayBtn} onPress={goToday}>
                <Text style={st.weekTodayText}>Oggi</Text>
              </Pressable>
            )}

            {/* Filtro barbiere */}
            <Pressable style={st.dataBtn} onPress={() => setShowFiltri(!showFiltri)}>
              <Text style={st.dataBtnText}>
                💈{" "}
                {filtroBarbiere === utente?.barbiere_id ? "I Miei Appuntamenti"
                  : filtroBarbiere === null ? "Tutti i Barbieri"
                  : barbieri.find((b) => b.id === filtroBarbiere)?.nome || "Barbiere"}
              </Text>
              <Text style={{ color: "#D4AF37", fontSize: 14 }}>{showFiltri ? "▲" : "▼"}</Text>
            </Pressable>
            {showFiltri && (
              <View style={st.filtriDrop}>
                <Pressable style={[st.filtroItem, filtroBarbiere === utente?.barbiere_id && st.filtroItemA]} onPress={() => { setFiltroBarbiere(utente?.barbiere_id); setShowFiltri(false); }}>
                  <Text style={[st.filtroItemText, filtroBarbiere === utente?.barbiere_id && st.filtroItemTextA]}>📋 I Miei Appuntamenti</Text>
                </Pressable>
                <View style={{ height: 1, backgroundColor: "#1A1A1A", marginVertical: 4 }} />
                <Pressable style={[st.filtroItem, filtroBarbiere === null && st.filtroItemA]} onPress={() => { setFiltroBarbiere(null); setShowFiltri(false); }}>
                  <Text style={[st.filtroItemText, filtroBarbiere === null && st.filtroItemTextA]}>👥 Tutti i Barbieri</Text>
                </Pressable>
                {barbieri.filter((b) => !b.assente && b.id !== utente?.barbiere_id).map((b) => (
                  <Pressable key={b.id} style={[st.filtroItem, filtroBarbiere === b.id && st.filtroItemA]} onPress={() => { setFiltroBarbiere(b.id); setShowFiltri(false); }}>
                    <Text style={[st.filtroItemText, filtroBarbiere === b.id && st.filtroItemTextA]}>💈 {b.nome}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={[st.actRow, { marginTop: 12 }]}>
              <Pressable style={st.actGold} onPress={apriModalAggiungi}>
                <Text style={st.actGoldText}>+ Nuovo Appuntamento</Text>
              </Pressable>
            </View>

            {barbieriAssenti.map((b) => (
              <View key={b.id} style={st.absCard}>
                <Text style={st.absText}>{isPermessoBarbiere(b) ? "🟡" : "🔴"} {b.nome} {isPermessoBarbiere(b) ? "è in permesso" : "è assente"}</Text>
                <Pressable style={st.absBtn} onPress={() => riattiva(b.id)}>
                  <Text style={st.absBtnText}>Riattiva</Text>
                </Pressable>
              </View>
            ))}
            {barbieriProgrammati.map((b) => {
              const info = JSON.parse(b.motivo_assenza);
              const dataInizio = info.tipo === "permesso"
                ? new Date(info.inizio).toISOString().split("T")[0]
                : info.inizio;
              return (
                <View key={b.id} style={[st.absCard, { borderColor: "rgba(212,175,55,0.2)", backgroundColor: "rgba(212,175,55,0.03)" }]}>
                  <Text style={[st.absText, { color: "#888" }]}>🕓 {b.nome} — {info.tipo === "permesso" ? "permesso" : "assenza"} prog. il {fmtDataShort(dataInizio)}</Text>
                  <Pressable style={st.absBtn} onPress={() => riattiva(b.id)}>
                    <Text style={st.absBtnText}>Annulla</Text>
                  </Pressable>
                </View>
              );
            })}
            {orariGiornata.length === 0 ? (
              <View style={st.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
                <Text style={st.emptyText}>Giorno di chiusura</Text>
              </View>
            ) : prenotazioniPerBarbiere.length === 1 ? (() => {
              const screenW = Dimensions.get("window").width;
              const isDesktop = screenW > 700;
              const SLOT_H = isDesktop ? 80 : 64;
              const ORA_W = isDesktop ? 64 : 52;
              const FONT_ORA = isDesktop ? 14 : 12;
              const FONT_NOME = isDesktop ? 13 : 11;
              const FONT_SERV = isDesktop ? 12 : 10;
              const FONT_DUR = isDesktop ? 11 : 10;
              const totalH = orariGiornata.length * SLOT_H;
              const barbId = prenotazioniPerBarbiere[0].id;
              const color = getBarbColor(barbId);
              const appsBarb = attivi.filter((p: any) => p.barbiere_id === barbId);

              return (
                <View style={{ width: "100%" }}>
                  <View style={{ flexDirection: "row", width: "100%", height: totalH }}>
                    {/* Colonna ORA */}
                    <View style={{ width: ORA_W, height: totalH }}>
                      {orariGiornata.map((ora, idx) => {
                        const haApp = appsBarb.some((p: any) => (p.ora || "").slice(0, 5) === ora);
                        return (
                          <View key={ora} style={{ position: "absolute", top: idx * SLOT_H, left: 0, right: 0, height: SLOT_H, borderTopWidth: 1, borderTopColor: "#1A1A1A", justifyContent: "flex-start", alignItems: "center", paddingTop: 6 }}>
                            <Text style={{ color: haApp ? "#D4AF37" : "#282828", fontSize: FONT_ORA, fontWeight: "800" }}>{ora}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Colonna appuntamenti */}
                    <View style={{ flex: 1, height: totalH, borderLeftWidth: 1, borderLeftColor: "#1E1E1E" }}>
                      {orariGiornata.map((ora, idx) => (
                        <View key={ora} style={{ position: "absolute", top: idx * SLOT_H, left: 0, right: 0, height: 1, backgroundColor: "#1A1A1A" }} />
                      ))}
                      {appsBarb.map((app: any) => {
                        const startStr = (app.ora || "").slice(0, 5);
                        const startIdx = orariGiornata.indexOf(startStr);
                        if (startIdx === -1) return null;
                        const numSlots = Math.max(1, Math.ceil((app.durata_minuti || 20) / 20));
                        const cardTop = startIdx * SLOT_H + 3;
                        const cardH = numSlots * SLOT_H - 6;
                        return (
                          <Pressable
                            key={app.id}
                            onPress={() => setAppDetail(app)}
                            style={{ position: "absolute", top: cardTop, left: 3, right: 3, height: cardH, backgroundColor: "#1C1C1C", borderRadius: 8, borderLeftWidth: 3, borderLeftColor: color, padding: 8, justifyContent: "center", overflow: "hidden" }}
                          >
                            <Text style={{ color: "#FFF", fontSize: FONT_NOME, fontWeight: "700" }} numberOfLines={1}>{app.cliente_nome}</Text>
                            <Text style={{ color: "#888", fontSize: FONT_SERV }} numberOfLines={1}>{app.servizio_nome}</Text>
                            <Text style={{ color: "#555", fontSize: FONT_DUR }}>{app.durata_minuti || 20} min</Text>
                            <View style={{ position: "absolute", top: 6, right: 6, flexDirection: "row", gap: 8 }}>
                              <Pressable onPress={() => apriModifica(app)}>
                                <Text style={{ fontSize: isDesktop ? 15 : 13 }}>✏️</Text>
                              </Pressable>
                              <Pressable onPress={() => cancella(app.id)}>
                                <Text style={{ fontSize: isDesktop ? 15 : 13 }}>🗑️</Text>
                              </Pressable>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })()
            : (() => {
              /* Griglia con posizionamento assoluto: ogni slot = SLOT_H px.
                 Le card si estendono in altezza in base alla durata (20min=1 slot, 40min=2 slot…)
                 attraversando i separatori senza spezzarsi. */
              const screenW = Dimensions.get("window").width;
              const isDesktop = screenW > 700;
              const SLOT_H = isDesktop ? 80 : 64;
              const ORA_W = isDesktop ? 64 : 52;
              const FONT_ORA = isDesktop ? 14 : 12;
              const FONT_NOME = isDesktop ? 13 : 11;
              const FONT_SERV = isDesktop ? 12 : 10;
              const FONT_DUR = isDesktop ? 11 : 10;
              const nBarb = prenotazioniPerBarbiere.length;
              const totalH = orariGiornata.length * SLOT_H;

              return (
                <View style={{ width: "100%" }}>
                  {/* Header nomi barbieri */}
                  <View style={{ flexDirection: "row", width: "100%", borderBottomWidth: 1, borderBottomColor: "#2A2A2A", paddingVertical: 10 }}>
                    <View style={{ width: ORA_W }} />
                    {prenotazioniPerBarbiere.map((b) => (
                      <View key={b.id} style={{ flex: 1, alignItems: "center" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getBarbColor(b.id) }} />
                          <Text style={{ color: "#D4AF37", fontSize: isDesktop ? 14 : 12, fontWeight: "700" }} numberOfLines={1}>{b.nome}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Corpo griglia a posizionamento assoluto */}
                  <View style={{ flexDirection: "row", width: "100%", height: totalH }}>
                    {/* Colonna ORA + linee guida orizzontali */}
                    <View style={{ width: ORA_W, height: totalH }}>
                      {orariGiornata.map((ora, idx) => {
                        const haApp = prenotazioniPerBarbiere.some((b) => {
                          const s = getSlotStato(b.id, ora);
                          return s.tipo === "inizio";
                        });
                        return (
                          <View
                            key={ora}
                            style={{ position: "absolute", top: idx * SLOT_H, left: 0, right: 0, height: SLOT_H, borderTopWidth: 1, borderTopColor: "#1A1A1A", justifyContent: "flex-start", alignItems: "center", paddingTop: 6 }}
                          >
                            <Text style={{ color: haApp ? "#D4AF37" : "#282828", fontSize: FONT_ORA, fontWeight: "800" }}>{ora}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Colonne barbieri */}
                    {prenotazioniPerBarbiere.map((b) => {
                      const color = getBarbColor(b.id);
                      const appsBarb = attivi.filter((p: any) => p.barbiere_id === b.id);
                      return (
                        <View key={b.id} style={{ flex: 1, height: totalH, borderLeftWidth: 1, borderLeftColor: "#1E1E1E" }}>
                          {/* Linee guida slot */}
                          {orariGiornata.map((ora, idx) => (
                            <View key={ora} style={{ position: "absolute", top: idx * SLOT_H, left: 0, right: 0, height: 1, backgroundColor: "#1A1A1A" }} />
                          ))}
                          {/* Card appuntamenti */}
                          {appsBarb.map((app: any) => {
                            const startStr = (app.ora || "").slice(0, 5);
                            const startIdx = orariGiornata.indexOf(startStr);
                            if (startIdx === -1) return null;
                            const numSlots = Math.max(1, Math.ceil((app.durata_minuti || 20) / 20));
                            const cardTop = startIdx * SLOT_H + 3;
                            const cardH = numSlots * SLOT_H - 6;
                            return (
                              <Pressable
                                key={app.id}
                                onPress={() => setAppDetail(app)}
                                style={{
                                  position: "absolute",
                                  top: cardTop,
                                  left: 3,
                                  right: 3,
                                  height: cardH,
                                  backgroundColor: "#1C1C1C",
                                  borderRadius: 8,
                                  borderLeftWidth: 3,
                                  borderLeftColor: color,
                                  padding: 6,
                                  justifyContent: "center",
                                  overflow: "hidden",
                                }}
                              >
                                <Text style={{ color: "#FFF", fontSize: FONT_NOME, fontWeight: "700" }} numberOfLines={1}>{app.cliente_nome}</Text>
                                <Text style={{ color: "#888", fontSize: FONT_SERV }} numberOfLines={1}>{app.servizio_nome}</Text>
                                <Text style={{ color: "#555", fontSize: FONT_DUR }}>{app.durata_minuti || 20} min</Text>
                                <Pressable onPress={() => cancella(app.id)} style={{ position: "absolute", top: 4, right: 4 }}>
                                  <Text style={{ color: "#555", fontSize: 12 }}>✕</Text>
                                </Pressable>
                              </Pressable>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })()}
            <View style={{ height: 90 }} />
          </>
        )}
      </ScrollView>

      {/* BOTTOM TAB BAR */}
      <View style={[st.bottomBar, { marginHorizontal: -20 }]}>
        <Pressable style={st.bottomTab} onPress={() => setActiveTab("home")}>
          <Text style={{ fontSize: 22 }}>🏠</Text>
          <Text style={[st.bottomTabLabel, activeTab === "home" && st.bottomTabLabelA]}>Home</Text>
        </Pressable>
        <Pressable style={st.bottomTab} onPress={() => setActiveTab("agenda")}>
          <Text style={{ fontSize: 22 }}>📅</Text>
          <Text style={[st.bottomTabLabel, activeTab === "agenda" && st.bottomTabLabelA]}>Agenda</Text>
        </Pressable>
      </View>

      {/* MODAL AGGIUNGI — STEP 1: FORM */}
      {showAggiungi && modalStep === "form" && (
        <View style={st.modalOv}>
          <View style={st.modal}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={st.mTitle}>Nuovo Appuntamento</Text>
                  <Text style={st.mDate}>📅 {fmtDataLunga(dataCorrente)}</Text>
                </View>
                <Pressable onPress={() => setShowAggiungi(false)} style={{ padding: 4, marginTop: 2 }}>
                  <Text style={{ color: "#444", fontSize: 22, lineHeight: 22 }}>×</Text>
                </Pressable>
              </View>

              {/* Nome */}
              <Text style={st.mLabel}>NOME CLIENTE</Text>
              <TextInput
                style={[st.mInput, { marginBottom: 12 }, focusedInput === "nome" && st.mInputFocus]}
                value={newCliente}
                onChangeText={setNewCliente}
                placeholder="Nome e cognome"
                placeholderTextColor="#333"
                selectionColor="#D4AF37"
                onFocus={() => setFocusedInput("nome")}
                onBlur={() => setFocusedInput(null)}
              />

              {/* Telefono */}
              <Text style={st.mLabel}>TELEFONO <Text style={{ color: "#555", fontWeight: "400" }}>(opzionale)</Text></Text>
              <TextInput
                style={[st.mInput, { marginBottom: 16 }, focusedInput === "telefono" && st.mInputFocus]}
                value={newTelefono}
                onChangeText={setNewTelefono}
                placeholder="Es: 333 1234567"
                placeholderTextColor="#333"
                keyboardType="phone-pad"
                selectionColor="#D4AF37"
                onFocus={() => setFocusedInput("telefono")}
                onBlur={() => setFocusedInput(null)}
              />

              {/* Barbiere */}
              <Text style={st.mLabel}>BARBIERE</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {barbieri.filter((b) => !b.assente).map((b) => (
                  <Pressable
                    key={b.id}
                    style={[st.mChip, { flex: 1, alignItems: "center" }, newBarbiere === b.id && st.mChipA]}
                    onPress={() => { setNewBarbiere(b.id); caricaOrariNuovo(b.id, newServizio); }}
                  >
                    <Text style={[st.mChipText, newBarbiere === b.id && st.mChipTextA]}>{b.nome}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Servizio — dropdown custom */}
              <Text style={st.mLabel}>SERVIZIO</Text>
              <Pressable
                onPress={() => setShowServiziDrop(!showServiziDrop)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0A0A0A", borderWidth: 1, borderColor: showServiziDrop ? "#D4AF37" : "#2A2A2A", borderRadius: 10, borderBottomLeftRadius: showServiziDrop ? 0 : 10, borderBottomRightRadius: showServiziDrop ? 0 : 10, paddingVertical: 13, paddingHorizontal: 14 }}
              >
                <Text style={{ color: "#CCC", fontSize: 14 }}>
                  {servizi.find((sv) => sv.id === newServizio)?.nome || "Seleziona servizio"}
                </Text>
                <Text style={{ color: "#D4AF37", fontSize: 11 }}>{showServiziDrop ? "▲" : "▼"}</Text>
              </Pressable>
              {showServiziDrop && (
                <ScrollView
                  style={{ maxHeight: 210, backgroundColor: "#0A0A0A", borderWidth: 1, borderTopWidth: 0, borderColor: "#D4AF37", borderBottomLeftRadius: 10, borderBottomRightRadius: 10, marginBottom: 16 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {servizi.map((sv, idx) => (
                    <Pressable
                      key={sv.id}
                      onPress={() => { setNewServizio(sv.id); caricaOrariNuovo(newBarbiere, sv.id); setShowServiziDrop(false); }}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: "#1A1A1A", backgroundColor: newServizio === sv.id ? "rgba(212,175,55,0.08)" : "transparent" }}
                    >
                      <Text style={{ color: newServizio === sv.id ? "#D4AF37" : "#888", fontSize: 14, fontWeight: newServizio === sv.id ? "700" : "400" }}>{sv.nome}</Text>
                      <Text style={{ color: newServizio === sv.id ? "rgba(212,175,55,0.6)" : "#444", fontSize: 12 }}>{sv.durata_minuti} min</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {!showServiziDrop && <View style={{ marginBottom: 16 }} />}

              {/* Orario */}
              <Text style={st.mLabel}>ORARIO DISPONIBILE</Text>
              {loadingOrari ? (
                <ActivityIndicator color="#D4AF37" size="small" style={{ marginVertical: 12 }} />
              ) : orariNuovo.length === 0 ? (
                <Text style={st.mNoSlot}>Nessun orario disponibile</Text>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                  {orariNuovo.map((o) => (
                    <Pressable
                      key={o}
                      onPress={() => setNewOra(o)}
                      style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: newOra === o ? "#D4AF37" : "#1E1E1E", backgroundColor: newOra === o ? "rgba(212,175,55,0.1)" : "#0A0A0A" }}
                    >
                      <Text style={{ color: newOra === o ? "#D4AF37" : "#555", fontSize: 13, fontWeight: "700" }}>{o}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={st.mBtns}>
                <Pressable style={st.mCancel} onPress={() => setShowAggiungi(false)}>
                  <Text style={{ color: "#666", fontWeight: "700", fontSize: 14 }}>Annulla</Text>
                </Pressable>
                <Pressable
                  style={[st.mConfirm, (!newCliente || !newOra) && { opacity: 0.4 }]}
                  onPress={() => {
                    if (!newCliente) { msg("Inserisci il nome del cliente"); return; }
                    if (!newOra) { msg("Seleziona un orario"); return; }
                    setModalStep("riepilogo");
                  }}
                >
                  <Text style={{ color: "#0A0A0A", fontWeight: "800", fontSize: 14 }}>Avanti →</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* MODAL AGGIUNGI — STEP 2: RIEPILOGO */}
      {showAggiungi && modalStep === "riepilogo" && (() => {
        const barbNome = barbieri.find((b) => b.id === newBarbiere)?.nome || "";
        const servObj = servizi.find((sv) => sv.id === newServizio);
        const righe = [
          { label: "Cliente", value: newCliente },
          ...(newTelefono ? [{ label: "Telefono", value: newTelefono }] : []),
          { label: "Data", value: fmtDataLunga(dataCorrente) },
          { label: "Orario", value: newOra },
          { label: "Barbiere", value: barbNome },
          { label: "Servizio", value: servObj ? `${servObj.nome} • ${servObj.durata_minuti} min` : "" },
        ];
        return (
          <View style={st.modalOv}>
            <View style={st.modal}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={st.mTitle}>Riepilogo</Text>
                  <Text style={st.mDate}>📅 {fmtDataLunga(dataCorrente)}</Text>
                </View>
                <Pressable onPress={() => setShowAggiungi(false)} style={{ padding: 4, marginTop: 2 }}>
                  <Text style={{ color: "#444", fontSize: 22, lineHeight: 22 }}>×</Text>
                </Pressable>
              </View>
              <View style={{ backgroundColor: "#0A0A0A", borderRadius: 14, borderWidth: 1, borderColor: "#1A1A1A", overflow: "hidden", marginBottom: 24 }}>
                {righe.map((r, i) => (
                  <View key={r.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: "#141414" }}>
                    <Text style={{ color: "#555", fontSize: 11, width: 68, textTransform: "uppercase", letterSpacing: 0.5 }}>{r.label}</Text>
                    <Text style={{ color: "#DDD", fontSize: 14, fontWeight: "600", flex: 1 }}>{r.value}</Text>
                  </View>
                ))}
              </View>
              <View style={st.mBtns}>
                <Pressable style={st.mCancel} onPress={() => setModalStep("form")}>
                  <Text style={{ color: "#666", fontWeight: "700", fontSize: 14 }}>← Indietro</Text>
                </Pressable>
                <Pressable style={st.mConfirm} onPress={salvaAggiungi}>
                  <Text style={{ color: "#0A0A0A", fontWeight: "800", fontSize: 14 }}>Salva</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })()}

      {/* BANNER SUCCESSO */}
      {showSuccessBanner && (
        <View style={{ position: "absolute", bottom: 90, left: 20, right: 20, backgroundColor: "#1A2A1A", borderRadius: 14, borderWidth: 1, borderColor: "rgba(80,200,80,0.3)", paddingVertical: 14, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 200 }}>
          <Text style={{ fontSize: 20 }}>✅</Text>
          <Text style={{ color: "#7FD67F", fontSize: 14, fontWeight: "700", flex: 1 }}>Appuntamento salvato con successo</Text>
        </View>
      )}

      {/* MODAL ASSENZA — STEP 1: FORM */}
      {showAssenza && assenzaStep === "form" && (
        <View style={st.modalOv}>
          <View style={st.modal}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[st.mTitle, { color: "#F44336" }]}>🔴 Segna Assente</Text>
                </View>
                <Pressable onPress={() => setShowAssenza(false)} style={{ padding: 4, marginTop: 2 }}>
                  <Text style={{ color: "#444", fontSize: 22, lineHeight: 22 }}>×</Text>
                </Pressable>
              </View>

              <Text style={st.mLabel}>DATA INIZIO</Text>
              <CalendarioInline value={assenzaData} onChange={setAssenzaData} min={todayStr} marginBottom={14} />

              <Text style={st.mLabel}>DATA FINE</Text>
              <CalendarioInline value={assenzaFine} onChange={setAssenzaFine} min={assenzaData || todayStr} marginBottom={16} />

              {barbieri.filter((b) => !b.assente).length > 1 && (
                <>
                  <Text style={st.mLabel}>BARBIERE</Text>
                  <View style={[st.mGrid, { marginBottom: 16 }]}>
                    {barbieri.filter((b) => !b.assente).map((b) => (
                      <Pressable key={b.id} style={[st.mChip, { flex: 1, alignItems: "center" }, assenzaBarbiere === b.id && st.mChipA]} onPress={() => setAssenzaBarbiere(b.id)}>
                        <Text style={[st.mChipText, assenzaBarbiere === b.id && st.mChipTextA]}>{b.nome}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              <Text style={st.mLabel}>MOTIVO</Text>
              <TextInput
                style={[st.mInput, { marginBottom: 20 }]}
                value={assenzaMotivo}
                onChangeText={setAssenzaMotivo}
                placeholder="Es: Malato..."
                placeholderTextColor="#333"
                selectionColor="#D4AF37"
              />

              <View style={st.mBtns}>
                <Pressable style={st.mCancel} onPress={() => setShowAssenza(false)}>
                  <Text style={{ color: "#666", fontWeight: "700", fontSize: 14 }}>Annulla</Text>
                </Pressable>
                <Pressable
                  style={[st.mConfirm, { backgroundColor: "#C0392B" }, !assenzaBarbiere && { opacity: 0.4 }]}
                  onPress={() => {
                    if (!assenzaBarbiere) { msg("Seleziona un barbiere"); return; }
                    if (!assenzaData) { msg("Inserisci la data di inizio"); return; }
                    if (!assenzaFine) { msg("Inserisci la data di fine"); return; }
                    if (assenzaFine < assenzaData) { msg("La data di fine non può essere prima dell'inizio"); return; }
                    setAssenzaStep("riepilogo");
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>Avanti →</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* MODAL ASSENZA — STEP 2: RIEPILOGO */}
      {showAssenza && assenzaStep === "riepilogo" && (() => {
        const barbNome = barbieri.find((b) => b.id === assenzaBarbiere)?.nome || "";
        const giorni = Math.round((new Date(assenzaFine).getTime() - new Date(assenzaData).getTime()) / 86400000) + 1;
        const righe = [
          { label: "Barbiere", value: barbNome },
          { label: "Inizio", value: fmtDataLunga(assenzaData) },
          { label: "Fine", value: fmtDataLunga(assenzaFine) },
          { label: "Giorni", value: `${giorni} ${giorni === 1 ? "giorno" : "giorni"}` },
          { label: "Motivo", value: assenzaMotivo || "Assente" },
        ];
        return (
          <View style={st.modalOv}>
            <View style={st.modal}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[st.mTitle, { color: "#F44336" }]}>Riepilogo Assenza</Text>
                </View>
                <Pressable onPress={() => setShowAssenza(false)} style={{ padding: 4, marginTop: 2 }}>
                  <Text style={{ color: "#444", fontSize: 22, lineHeight: 22 }}>×</Text>
                </Pressable>
              </View>
              <View style={{ backgroundColor: "#0A0A0A", borderRadius: 14, borderWidth: 1, borderColor: "#1A1A1A", overflow: "hidden", marginBottom: 16 }}>
                {righe.map((r, i) => (
                  <View key={r.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: "#141414" }}>
                    <Text style={{ color: "#555", fontSize: 11, width: 68, textTransform: "uppercase", letterSpacing: 0.5 }}>{r.label}</Text>
                    <Text style={{ color: "#DDD", fontSize: 14, fontWeight: "600", flex: 1 }}>{r.value}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ color: "#F44336", fontSize: 12, marginBottom: 20, lineHeight: 17 }}>
                Gli appuntamenti esistenti verranno cancellati e i clienti notificati.
              </Text>
              <View style={st.mBtns}>
                <Pressable style={st.mCancel} onPress={() => setAssenzaStep("form")}>
                  <Text style={{ color: "#666", fontWeight: "700", fontSize: 14 }}>← Indietro</Text>
                </Pressable>
                <Pressable style={[st.mConfirm, { backgroundColor: "#C0392B" }]} onPress={segnaAssente}>
                  <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>Conferma</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })()}

      {/* BANNER ASSENZA */}
      {showAssenzaBanner && (
        <View style={{ position: "absolute", bottom: 90, left: 20, right: 20, backgroundColor: "#1A0A0A", borderRadius: 14, borderWidth: 1, borderColor: "rgba(244,67,54,0.3)", paddingVertical: 14, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 200 }}>
          <Text style={{ fontSize: 20 }}>🔴</Text>
          <Text style={{ color: "#F44336", fontSize: 14, fontWeight: "700", flex: 1 }}>
            {barbieri.find((b) => b.id === assenzaBarbiere)?.nome || "Il barbiere"} è ora assente — i clienti sono stati notificati
          </Text>
        </View>
      )}

      {/* MODAL PERMESSO */}
      {showPermesso && (
        <View style={st.modalOv}>
          <View style={st.modal}>
            <Text style={st.mTitle}>🕐 Permesso Temporaneo</Text>
            <Text style={{ color: "#888", fontSize: 12, marginBottom: 16, textAlign: "center" }}>
              Gli appuntamenti esistenti non vengono cancellati.
            </Text>

            <Text style={st.mLabel}>DATA</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {[{ label: "Oggi", val: todayStr }, { label: "Domani", val: domaniStr }].map(({ label, val }) => (
                <Pressable
                  key={label}
                  style={[st.oreBtn, permessoData === val && st.oreBtnA, { flex: 1 }]}
                  onPress={() => setPermessoData(val)}
                >
                  <Text style={[st.oreBtnText, permessoData === val && st.oreBtnTextA]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {Platform.OS === "web" ? (
              // @ts-ignore
              <input
                type="date"
                value={permessoData}
                onChange={(e: any) => setPermessoData(e.target.value)}
                min={todayStr}
                style={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 14, width: "100%", marginBottom: 14, colorScheme: "dark", boxSizing: "border-box" }}
              />
            ) : (
              <TextInput
                style={[st.mInput, { marginBottom: 14 }]}
                value={permessoData}
                onChangeText={setPermessoData}
                placeholder="AAAA-MM-GG"
                placeholderTextColor="#333"
                keyboardType="numbers-and-punctuation"
              />
            )}

            <Text style={st.mLabel}>ORARIO INIZIO</Text>
            {Platform.OS === "web" ? (
              // @ts-ignore
              <input
                type="time"
                value={permessoOraInizio}
                onChange={(e: any) => setPermessoOraInizio(e.target.value)}
                style={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 10, padding: "10px 14px", color: "#FFF", fontSize: 14, width: "100%", marginBottom: 16, colorScheme: "dark", boxSizing: "border-box" }}
              />
            ) : (
              <TextInput
                style={[st.mInput, { marginBottom: 16 }]}
                value={permessoOraInizio}
                onChangeText={setPermessoOraInizio}
                placeholder="HH:MM"
                placeholderTextColor="#333"
                keyboardType="numbers-and-punctuation"
              />
            )}

            <Text style={st.mLabel}>DURATA</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 20 }}>
              <Pressable
                style={[st.oreBtn, { width: 48, height: 48, alignItems: "center", justifyContent: "center" }]}
                onPress={() => setPermessoMinuti((p) => Math.max(30, p - 30))}
              >
                <Text style={[st.oreBtnText, { fontSize: 22, fontWeight: "800" }]}>−</Text>
              </Pressable>
              <Text style={{ color: "#FFF", fontSize: 22, fontWeight: "800", minWidth: 110, textAlign: "center" }}>
                {fmtDurata(permessoMinuti)}
              </Text>
              <Pressable
                style={[st.oreBtn, { width: 48, height: 48, alignItems: "center", justifyContent: "center" }]}
                onPress={() => setPermessoMinuti((p) => Math.min(480, p + 30))}
              >
                <Text style={[st.oreBtnText, { fontSize: 22, fontWeight: "800" }]}>+</Text>
              </Pressable>
            </View>

            {barbieri.length > 1 && (
              <>
                <Text style={[st.mLabel, { marginBottom: 8 }]}>BARBIERE</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {barbieri.filter((b) => !b.assente).map((b) => (
                    <Pressable
                      key={b.id}
                      style={[st.filtroItem, assenzaBarbiere === b.id && st.filtroItemA, { borderRadius: 10, borderWidth: 1, borderColor: "#222", paddingHorizontal: 14, paddingVertical: 8 }]}
                      onPress={() => setAssenzaBarbiere(b.id)}
                    >
                      <Text style={[st.filtroItemText, assenzaBarbiere === b.id && st.filtroItemTextA]}>{b.nome}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {permessoData > todayStr && (
              <Text style={{ color: "#D4AF37", fontSize: 12, marginBottom: 12, lineHeight: 17 }}>
                {`Il permesso verrà attivato automaticamente il ${fmtDataShort(permessoData)} alle ${permessoOraInizio}.`}
              </Text>
            )}

            <View style={st.mBtns}>
              <Pressable style={st.mCancel} onPress={() => setShowPermesso(false)}>
                <Text style={{ color: "#666", fontWeight: "700", fontSize: 14 }}>Annulla</Text>
              </Pressable>
              <Pressable style={[st.mConfirm, { backgroundColor: "#E5734A" }]} onPress={segnaPermesso}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>Conferma</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* MODAL MODIFICA */}
      {showModifica && modificaApp && (
        <View style={st.modalOv}>
          <View style={st.modal}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={st.mTitle}>✏️ Modifica Appuntamento</Text>
              <Text style={st.mDate}>
                📅 {fmtDataLunga(dataCorrente)} • 💈 {modificaApp.barbiere_nome}
              </Text>

              <Text style={st.mLabel}>NOME CLIENTE</Text>
              <TextInput
                style={st.mInput}
                value={modNome}
                onChangeText={setModNome}
                placeholder="Nome cliente"
                placeholderTextColor="#333"
              />

              <Text style={st.mLabel}>SERVIZIO</Text>
              <View style={st.mGrid}>
                {servizi.map((sv) => (
                  <Pressable
                    key={sv.id}
                    style={[st.mChip, modServizio === sv.id && st.mChipA]}
                    onPress={() => {
                      setModServizio(sv.id);
                      caricaOrariModifica(modificaApp.barbiere_id, sv.id);
                    }}
                  >
                    <Text
                      style={[
                        st.mChipText,
                        modServizio === sv.id && st.mChipTextA,
                      ]}
                    >
                      {sv.nome}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={st.mLabel}>ORARIO</Text>
              {modLoadingOrari ? (
                <ActivityIndicator
                  color="#D4AF37"
                  size="small"
                  style={{ marginVertical: 16 }}
                />
              ) : (
                <View style={st.oGrid}>
                  {[...new Set([modificaApp.ora?.slice(0, 5), ...modOrariDisp])]
                    .sort()
                    .map((o) => (
                      <Pressable
                        key={o}
                        style={[st.oBtn, modOra === o && st.oBtnA]}
                        onPress={() => setModOra(o)}
                      >
                        <Text style={[st.oText, modOra === o && st.oTextA]}>
                          {o}
                        </Text>
                      </Pressable>
                    ))}
                </View>
              )}

              <View style={st.mBtns}>
                <Pressable
                  style={st.mCancel}
                  onPress={() => {
                    setShowModifica(false);
                    setModificaApp(null);
                  }}
                >
                  <Text
                    style={{ color: "#666", fontWeight: "700", fontSize: 14 }}
                  >
                    Annulla
                  </Text>
                </Pressable>
                <Pressable style={st.mConfirm} onPress={salvaModifica}>
                  <Text
                    style={{
                      color: "#0A0A0A",
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    Salva
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* PROFILO */}
      {showProfilo && (
        <Animated.View
          style={[st.overlay, { opacity: overlayOp }]}
          pointerEvents="auto"
        >
          <Pressable style={{ flex: 1 }} onPress={chiudiProfilo} />
        </Animated.View>
      )}
      {showProfilo && (
        <Animated.View
          style={[
            st.sheet,
            { height: SHEET_H, transform: [{ translateY: sheetAnim }] },
          ]}
        >
          <View style={st.handle} />
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={st.sHead}>
              <View style={st.sAvatar}>
                <Text style={st.sAvatarText}>
                  {utente?.nome?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
              <Text style={st.sName}>{utente?.nome}</Text>
              <Text style={st.sEmail}>{utente?.email}</Text>
            </View>
            <View style={st.sActions}>
              <Pressable
                style={st.sActBtn}
                onPress={() => {
                  setEditMode(true);
                  setShowCambiaPw(false);
                }}
              >
                <View style={st.sActIcon}>
                  <Text style={{ fontSize: 18 }}>✏️</Text>
                </View>
                <Text style={st.sActText}>Modifica</Text>
              </Pressable>
              <Pressable
                style={st.sActBtn}
                onPress={() => {
                  setShowCambiaPw(true);
                  setEditMode(false);
                }}
              >
                <View style={st.sActIcon}>
                  <Text style={{ fontSize: 18 }}>🔒</Text>
                </View>
                <Text style={st.sActText}>Password</Text>
              </Pressable>
              <Pressable style={st.sActBtn} onPress={logout}>
                <View
                  style={[
                    st.sActIcon,
                    {
                      borderColor: "rgba(244,67,54,0.2)",
                      backgroundColor: "rgba(244,67,54,0.05)",
                    },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>🚪</Text>
                </View>
                <Text style={[st.sActText, { color: "#F44336" }]}>Esci</Text>
              </Pressable>
            </View>
            {editMode && (
              <View style={st.sSec}>
                <Text style={st.sSecLabel}>MODIFICA NOME</Text>
                <TextInput
                  style={st.sInput}
                  value={editNome}
                  onChangeText={setEditNome}
                  placeholderTextColor="#333"
                />
                <View style={st.sBtnRow}>
                  <Pressable
                    style={st.sBtnCancel}
                    onPress={() => setEditMode(false)}
                  >
                    <Text style={{ color: "#666", fontWeight: "700" }}>
                      Annulla
                    </Text>
                  </Pressable>
                  <Pressable style={st.sBtnSave} onPress={salvaProfilo}>
                    <Text style={{ color: "#0A0A0A", fontWeight: "800" }}>
                      Salva
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
            {showCambiaPw && (
              <View style={st.sSec}>
                <Text style={st.sSecLabel}>CAMBIA PASSWORD</Text>
                <TextInput
                  style={st.sInput}
                  value={vecchiaPw}
                  onChangeText={setVecchiaPw}
                  placeholder="Password attuale"
                  placeholderTextColor="#333"
                  secureTextEntry
                />
                <TextInput
                  style={[st.sInput, { marginTop: 8 }]}
                  value={nuovaPw}
                  onChangeText={setNuovaPw}
                  placeholder="Nuova (min 6)"
                  placeholderTextColor="#333"
                  secureTextEntry
                />
                <View style={st.sBtnRow}>
                  <Pressable
                    style={st.sBtnCancel}
                    onPress={() => {
                      setShowCambiaPw(false);
                      setVecchiaPw("");
                      setNuovaPw("");
                    }}
                  >
                    <Text style={{ color: "#666", fontWeight: "700" }}>
                      Annulla
                    </Text>
                  </Pressable>
                  <Pressable style={st.sBtnSave} onPress={cambiaPw}>
                    <Text style={{ color: "#0A0A0A", fontWeight: "800" }}>
                      Cambia
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
      {/* MODAL DETTAGLIO APPUNTAMENTO */}
      {appDetail && (
        <View style={st.modalOv}>
          <View style={st.modal}>
            <Text style={st.mTitle}>📋 Dettaglio</Text>
            <View style={st.detailInfo}>
              <View style={st.detailRow}>
                <View style={st.detailIconBox}><Text style={{ fontSize: 18 }}>👤</Text></View>
                <View>
                  <Text style={st.detailLabel}>CLIENTE</Text>
                  <Text style={st.detailValue}>{appDetail.cliente_nome}</Text>
                </View>
              </View>
              <View style={st.detailRow}>
                <View style={st.detailIconBox}><Text style={{ fontSize: 18 }}>✂️</Text></View>
                <View>
                  <Text style={st.detailLabel}>SERVIZIO</Text>
                  <Text style={st.detailValue}>{appDetail.servizio_nome} • {appDetail.durata_minuti || 40} min</Text>
                </View>
              </View>
              <View style={st.detailRow}>
                <View style={st.detailIconBox}><Text style={{ fontSize: 18 }}>💈</Text></View>
                <View>
                  <Text style={st.detailLabel}>BARBIERE</Text>
                  <Text style={st.detailValue}>{appDetail.barbiere_nome}</Text>
                </View>
              </View>
              <View style={st.detailRow}>
                <View style={st.detailIconBox}><Text style={{ fontSize: 18 }}>🕐</Text></View>
                <View>
                  <Text style={st.detailLabel}>ORARIO</Text>
                  <Text style={st.detailValue}>{fmtDataLunga(dataCorrente)} • {appDetail.ora?.slice(0, 5)}</Text>
                </View>
              </View>
              {appDetail.cliente_telefono && (
                <View style={st.detailRow}>
                  <View style={st.detailIconBox}><Text style={{ fontSize: 18 }}>📞</Text></View>
                  <View>
                    <Text style={st.detailLabel}>TELEFONO</Text>
                    <Text style={st.detailValue}>{appDetail.cliente_telefono}</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={st.detailBtns}>
              <Pressable
                style={st.detailEditBtn}
                onPress={() => {
                  const app = appDetail;
                  setAppDetail(null);
                  apriModifica(app);
                }}
              >
                <Text style={st.detailEditText}>✏️ Modifica</Text>
              </Pressable>
              <Pressable
                style={st.detailDelBtn}
                onPress={() => {
                  cancella(appDetail.id);
                  setAppDetail(null);
                }}
              >
                <Text style={st.detailDelText}>🗑️ Elimina</Text>
              </Pressable>
            </View>
            <Pressable style={[st.mCancel, { marginTop: 12 }]} onPress={() => setAppDetail(null)}>
              <Text style={{ color: "#666", fontWeight: "700", fontSize: 14, textAlign: "center" }}>Chiudi</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
