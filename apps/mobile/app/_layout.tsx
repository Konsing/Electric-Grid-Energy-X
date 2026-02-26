import { Stack } from 'expo-router';
import { AuthProvider } from '../src/lib/auth-context';
import { ThemeProvider } from '../src/lib/theme-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/lib/theme-context';

function InnerLayout() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InnerLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
