import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { getAccount } from '../../src/lib/api';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [account, setAccount] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user?.account?.id || !token) return;
    getAccount(user.account.id, token)
      .then((res) => setAccount(res.data))
      .catch(() => {});
  }, [user, token]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <Field label="Name" value={account ? `${account.firstName} ${account.lastName}` : '--'} />
        <Field label="Account #" value={account?.accountNumber || '--'} />
        <Field label="Email" value={user?.email || '--'} />
        <Field label="Phone" value={account?.phone || 'Not set'} />
        <Field label="Service Address" value={account?.serviceAddress || '--'} />
        <Field label="Role" value={user?.role || '--'} />
        <Field label="Status" value={account?.status || '--'} />
      </View>

      {account?.meters && account.meters.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Meters</Text>
          {account.meters.map((m: any) => (
            <View key={m.id} style={styles.meterItem}>
              <Text style={styles.meterSerial}>{m.serialNumber}</Text>
              <Text style={styles.meterDetail}>{m.model} — {m.location}</Text>
              <Text style={[styles.meterStatus, m.status === 'ACTIVE' ? styles.active : styles.inactive]}>
                {m.status}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  fieldValue: { fontSize: 15, color: '#111827' },
  meterItem: {
    backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8,
  },
  meterSerial: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace', color: '#111827' },
  meterDetail: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  meterStatus: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  active: { color: '#16a34a' },
  inactive: { color: '#6b7280' },
  logoutBtn: {
    backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 40,
  },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 16 },
});
