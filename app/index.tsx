import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { s } from "../styles/indexStyles";

type LoginStep = "email" | "magic_sent" | "password";
type Modo = "accedi" | "registrati";

export default function Login() {
  const [modo, setModo] = useState<Modo>("accedi");
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errore, setErrore] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const redirecting = useRef(false);

  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOp = useRef(new Animated.Value(0)).current;
  const lineW = useRef(new Animated.Value(0)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const formOp = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await redirectByRole(session.user.id);
        return;
      }
      setChecking(false);
      anima();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await redirectByRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const anima = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOp, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineW, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.timing(titleOp, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOp, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(formY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const redirectByRole = async (userId: string) => {
    if (redirecting.current) return;
    redirecting.current = true;
    try {
      const { data } = await supabase
        .from("profili")
        .select("ruolo")
        .eq("id", userId)
        .single();
      if (data?.ruolo === "admin" || data?.ruolo === "super_admin") {
        router.replace("/admin-dashboard" as any);
      } else {
        router.replace("/home" as any);
      }
    } catch {
      redirecting.current = false;
    }
  };

  // Cambia tab e resetta lo stato del form
  const cambiaModo = (nuovoModo: Modo) => {
    setModo(nuovoModo);
    setStep("email");
    setErrore("");
    setPassword("");
  };

  // Tab Accedi — step 1: controlla l'email via RPC
  const controllaEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setErrore("Inserisci la tua email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrore("Email non valida");
      return;
    }
    setErrore("");
    setLoading(true);

    const { data: role, error } = await supabase.rpc("check_user_role", {
      user_email: trimmedEmail,
    });

    if (error) {
      setErrore("Errore di connessione. Riprova.");
      setLoading(false);
      return;
    }

    if (role === "not_found") {
      // Email non trovata → passa alla tab Registrati mantenendo l'email
      setModo("registrati");
      setStep("email");
      setErrore("Email non trovata. Compila i dati per registrarti.");
    } else if (role === "cliente") {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { emailRedirectTo: origin },
      });
      setStep("magic_sent");
    } else {
      // admin o super_admin → mostra campo password
      setStep("password");
    }

    setLoading(false);
  };

  // Tab Accedi — step 2 (admin/super_admin): accesso con password
  const eseguiLogin = async () => {
    if (!password) { setErrore("Inserisci la password"); return; }
    setErrore("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setErrore("Password errata o account non trovato");
      setLoading(false);
      return;
    }

    await redirectByRole(data.user.id);
    setLoading(false);
  };

  // Tab Registrati: crea account cliente e invia magic link
  const eseguiRegistrazione = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setErrore("Inserisci la tua email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrore("Email non valida");
      return;
    }
    if (!nome.trim()) { setErrore("Il nome è obbligatorio"); return; }
    setErrore("");
    setLoading(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: origin,
        data: {
          nome: nome.trim(),
          cognome: cognome.trim(),
          telefono: telefono.trim(),
        },
      },
    });

    if (error) {
      setErrore("Errore durante la registrazione. Riprova.");
      setLoading(false);
      return;
    }

    setStep("magic_sent");
    setLoading(false);
  };

  const rinviaLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: origin },
    });
    setErrore("Link inviato di nuovo!");
  };

  const tornaAllaEmail = () => {
    setStep("email");
    setPassword("");
    setErrore("");
  };

  if (checking) {
    return (
      <View style={s.loaderContainer}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <KeyboardAvoidingView
        style={s.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          <Animated.View
            style={[s.logoBox, { opacity: logoOp, transform: [{ scale: logoScale }] }]}
          >
            <View style={s.logoGlow} />
            <View style={s.logoWrap}>
              <Image
                source={require("../assets/images/logo.png")}
                style={s.logoImg}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <Animated.View
            style={[s.goldLine, { width: lineW.interpolate({ inputRange: [0, 1], outputRange: ["0%", "40%"] }) }]}
          />

          <Animated.View
            style={[s.titleBox, { opacity: titleOp, transform: [{ translateY: titleY }] }]}
          >
            <Text style={s.brand}>BULLDOG</Text>
            <Text style={s.brandSub}>BARBER SHOP</Text>
          </Animated.View>

          <Animated.View
            style={[s.formCard, { opacity: formOp, transform: [{ translateY: formY }] }]}
          >
            {/* Tabs visibili solo quando non si è ancora inviato il link o inserita la password */}
            {step === "email" && (
              <View style={s.tabRow}>
                <Pressable
                  style={[s.tab, modo === "accedi" && s.tabActive]}
                  onPress={() => cambiaModo("accedi")}
                >
                  <Text style={[s.tabText, modo === "accedi" && s.tabTextActive]}>
                    Accedi
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.tab, modo === "registrati" && s.tabActive]}
                  onPress={() => cambiaModo("registrati")}
                >
                  <Text style={[s.tabText, modo === "registrati" && s.tabTextActive]}>
                    Registrati
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── TAB ACCEDI ── */}
            {modo === "accedi" && step === "email" && (
              <>
                <Text style={s.label}>Email</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="La tua email"
                  placeholderTextColor="#333"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onSubmitEditing={controllaEmail}
                  returnKeyType="next"
                />
                {errore ? <Text style={s.errore}>{errore}</Text> : null}
                <Pressable
                  style={[s.btn, loading && { opacity: 0.6 }]}
                  onPress={controllaEmail}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#0A0A0A" size="small" />
                    : <Text style={s.btnText}>Continua</Text>}
                </Pressable>
              </>
            )}

            {/* ── TAB REGISTRATI ── */}
            {modo === "registrati" && step === "email" && (
              <>
                <Text style={s.label}>Email *</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="La tua email"
                  placeholderTextColor="#333"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <View style={s.row}>
                  <View style={s.halfField}>
                    <Text style={s.label}>Nome *</Text>
                    <TextInput
                      style={s.input}
                      value={nome}
                      onChangeText={setNome}
                      placeholder="Nome"
                      placeholderTextColor="#333"
                    />
                  </View>
                  <View style={s.halfField}>
                    <Text style={s.label}>Cognome</Text>
                    <TextInput
                      style={s.input}
                      value={cognome}
                      onChangeText={setCognome}
                      placeholder="Cognome"
                      placeholderTextColor="#333"
                    />
                  </View>
                </View>
                <Text style={s.label}>Telefono</Text>
                <TextInput
                  style={s.input}
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="Il tuo numero"
                  placeholderTextColor="#333"
                  keyboardType="phone-pad"
                />
                {errore ? <Text style={s.errore}>{errore}</Text> : null}
                <Pressable
                  style={[s.btn, loading && { opacity: 0.6 }]}
                  onPress={eseguiRegistrazione}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#0A0A0A" size="small" />
                    : <Text style={s.btnText}>Crea Account</Text>}
                </Pressable>
              </>
            )}

            {/* ── STEP PASSWORD (solo admin/super_admin) ── */}
            {step === "password" && (
              <>
                <Text style={s.stepTitle}>Accedi</Text>
                <Text style={s.emailDisplay}>{email}</Text>
                <Text style={s.label}>Password</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="La tua password"
                  placeholderTextColor="#333"
                  secureTextEntry
                  onSubmitEditing={eseguiLogin}
                  returnKeyType="done"
                  autoFocus
                />
                {errore ? <Text style={s.errore}>{errore}</Text> : null}
                <Pressable
                  style={[s.btn, loading && { opacity: 0.6 }]}
                  onPress={eseguiLogin}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#0A0A0A" size="small" />
                    : <Text style={s.btnText}>Accedi</Text>}
                </Pressable>
                <Pressable style={s.linkBtn} onPress={tornaAllaEmail}>
                  <Text style={s.linkBtnText}>← Torna</Text>
                </Pressable>
              </>
            )}

            {/* ── STEP MAGIC LINK INVIATO ── */}
            {step === "magic_sent" && (
              <>
                <Text style={s.stepTitle}>Controlla la tua email</Text>
                <Text style={s.stepDesc}>
                  Ti abbiamo inviato un link di accesso a{"\n"}
                  <Text style={{ color: "#D4AF37" }}>{email}</Text>
                </Text>
                <Text style={s.stepDesc}>
                  Clicca il link nell'email per accedere.
                </Text>

                <View style={s.rinviaBox}>
                  <Text style={s.rinviaLabel}>Non hai ricevuto l'email?</Text>
                  <Pressable
                    style={({ pressed }) => [
                      s.btnSecondary,
                      pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={rinviaLink}
                  >
                    <Text style={s.btnSecondaryText}>Rinvia e-mail</Text>
                  </Pressable>
                </View>

                <Pressable style={s.linkBtn} onPress={tornaAllaEmail}>
                  <Text style={s.linkBtnText}>← Usa un'altra email</Text>
                </Pressable>
              </>
            )}

          </Animated.View>

          <Text style={s.footer}>PRENOTA IL TUO STILE</Text>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
