import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { useTheme } from '../src/lib/theme-context';
import { login } from '../src/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [demoPassword, setDemoPassword] = useState('');
  const { setAuth } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(email, password);
      await setAuth(res.data.token, res.data.user);
      const isStaff = res.data.user.role === 'ADMIN' || res.data.user.role === 'TECHNICIAN';
      router.replace(isStaff ? '/(tabs)/outages' : '/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    if (!demoPassword) {
      Alert.alert('Error', 'Please enter the demo password');
      return;
    }
    setLoading(true);
    try {
      const res = await login(demoEmail, demoPassword);
      await setAuth(res.data.token, res.data.user);
      const isStaff = res.data.user.role === 'ADMIN' || res.data.user.role === 'TECHNICIAN';
      router.replace(isStaff ? '/(tabs)/outages' : '/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/background.png')} style={styles.bgImage} resizeMode="cover">
      <LinearGradient colors={['rgba(9,9,11,0.6)', 'rgba(9,9,11,0.95)']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]} onPress={handleLogin} disabled={loading}>
              <Text style={[styles.buttonText, { color: colors.background }]}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.devSection, { backgroundColor: colors.devSectionBg, borderColor: colors.devSectionBorder }]}>
            <Text style={[styles.devTitle, { color: colors.devTitle }]}>Demo Accounts</Text>
            <View style={styles.devButtons}>
              {[
                { email: 'admin@egx.dev', label: 'Admin' },
                { email: 'tech@egx.dev', label: 'Tech' },
                { email: 'customer@egx.dev', label: 'Customer' },
              ].map((u) => (
                <TouchableOpacity
                  key={u.email}
                  style={[
                    styles.devButton,
                    { borderColor: selectedDemo === u.email ? colors.brand : colors.devButtonBorder },
                    selectedDemo === u.email && { backgroundColor: colors.brand + '15' },
                  ]}
                  onPress={() => { setSelectedDemo(u.email); setDemoPassword(''); }}
                  disabled={loading}
                >
                  <Text style={[styles.devButtonText, { color: selectedDemo === u.email ? colors.brand : colors.devButtonText }]}>{u.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedDemo && (
              <View style={styles.demoPasswordRow}>
                <TextInput
                  style={[styles.demoPasswordInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textTertiary}
                  value={demoPassword}
                  onChangeText={setDemoPassword}
                  secureTextEntry
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.demoGoButton, { backgroundColor: colors.text, opacity: loading || !demoPassword ? 0.5 : 1 }]}
                  onPress={() => handleDemoLogin(selectedDemo)}
                  disabled={loading || !demoPassword}
                >
                  <Text style={[styles.demoGoText, { color: colors.background }]}>Go</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
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
  buttonText: { fontSize: 16, fontWeight: '600' },
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
  demoPasswordRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  demoPasswordInput: {
    flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14,
  },
  demoGoButton: {
    borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center',
  },
  demoGoText: { fontSize: 14, fontWeight: '600' },
});
