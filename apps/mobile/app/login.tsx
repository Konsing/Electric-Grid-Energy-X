import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { login, devLogin } from '../src/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Electric Grid Energy X</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.devSection}>
        <Text style={styles.devTitle}>Dev Quick Login</Text>
        <View style={styles.devButtons}>
          {[
            { email: 'admin@egx.dev', label: 'Admin' },
            { email: 'tech@egx.dev', label: 'Tech' },
            { email: 'customer@egx.dev', label: 'Customer' },
          ].map((u) => (
            <TouchableOpacity
              key={u.email}
              style={styles.devButton}
              onPress={() => handleDevLogin(u.email)}
              disabled={loading}
            >
              <Text style={styles.devButtonText}>{u.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2563eb', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    padding: 14, fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  devSection: {
    marginTop: 32, backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: 12, padding: 16,
  },
  devTitle: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 12 },
  devButtons: { flexDirection: 'row', gap: 8 },
  devButton: {
    flex: 1, borderWidth: 1, borderColor: '#fde68a', borderRadius: 8, padding: 10, alignItems: 'center',
  },
  devButtonText: { fontSize: 12, fontWeight: '500', color: '#92400e' },
});
