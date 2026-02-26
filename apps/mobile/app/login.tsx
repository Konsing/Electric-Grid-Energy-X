import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../src/lib/auth-context';
import { useTheme } from '../src/lib/theme-context';
import { login, devLogin } from '../src/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(email, password);
      await setAuth(res.data.token, res.data.user);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (devEmail: string) => {
    setLoading(true);
    try {
      const res = await devLogin(devEmail);
      await setAuth(res.data.token, res.data.user);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
        <Feather name={isDark ? 'sun' : 'moon'} size={22} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.brand }]}>Electric Grid Energy X</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Email"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Password"
          placeholderTextColor={colors.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.brand }]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.devSection, { backgroundColor: colors.devSectionBg, borderColor: colors.devSectionBorder }]}>
        <Text style={[styles.devTitle, { color: colors.devTitle }]}>Dev Quick Login</Text>
        <View style={styles.devButtons}>
          {[
            { email: 'admin@egx.dev', label: 'Admin' },
            { email: 'tech@egx.dev', label: 'Tech' },
            { email: 'customer@egx.dev', label: 'Customer' },
          ].map((u) => (
            <TouchableOpacity
              key={u.email}
              style={[styles.devButton, { borderColor: colors.devButtonBorder }]}
              onPress={() => handleDevLogin(u.email)}
              disabled={loading}
            >
              <Text style={[styles.devButtonText, { color: colors.devButtonText }]}>{u.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  themeToggle: { position: 'absolute', top: 56, right: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  form: { gap: 12 },
  input: {
    borderWidth: 1, borderRadius: 12,
    padding: 14, fontSize: 16,
  },
  button: {
    borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  devSection: {
    marginTop: 32, borderWidth: 1,
    borderRadius: 12, padding: 16,
  },
  devTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  devButtons: { flexDirection: 'row', gap: 8 },
  devButton: {
    flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center',
  },
  devButtonText: { fontSize: 12, fontWeight: '500' },
});
