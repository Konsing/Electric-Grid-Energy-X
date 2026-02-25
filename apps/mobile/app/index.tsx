import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/(tabs)/dashboard' : '/login');
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>EGX</Text>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  logo: { fontSize: 48, fontWeight: 'bold', color: '#2563eb', marginBottom: 20 },
});
