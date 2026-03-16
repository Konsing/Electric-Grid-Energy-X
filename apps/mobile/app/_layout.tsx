import { Stack } from 'expo-router';
import { AuthProvider } from '../src/lib/auth-context';
import { ThemeProvider } from '../src/lib/theme-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
