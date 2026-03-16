import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="scelta-sede" />
        <Stack.Screen name="scelta-servizio" />
        <Stack.Screen name="scelta-data" />
        <Stack.Screen name="miei-appuntamenti" />
        <Stack.Screen name="listino-servizi" />
        <Stack.Screen name="sedi-info" />
        <Stack.Screen name="messaggi" />
        <Stack.Screen name="admin-dashboard" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
