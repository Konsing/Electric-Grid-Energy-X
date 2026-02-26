import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { getAccount } from '../../src/lib/api';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colors } = useTheme();
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>

        <Field label="Name" value={account ? `${account.firstName} ${account.lastName}` : '--'} colors={colors} />
        <Field label="Account #" value={account?.accountNumber || '--'} colors={colors} />
        <Field label="Email" value={user?.email || '--'} colors={colors} />
        <Field label="Phone" value={account?.phone || 'Not set'} colors={colors} />
        <Field label="Service Address" value={account?.serviceAddress || '--'} colors={colors} />
        <Field label="Role" value={user?.role || '--'} colors={colors} />
        <Field label="Status" value={account?.status || '--'} colors={colors} />
      </View>

      {account?.meters && account.meters.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meters</Text>
          {account.meters.map((m: any) => (
            <View key={m.id} style={[styles.meterItem, { backgroundColor: colors.meterItemBg }]}>
              <Text style={[styles.meterSerial, { color: colors.text }]}>{m.serialNumber}</Text>
              <Text style={[styles.meterDetail, { color: colors.textSecondary }]}>{m.model} — {m.location}</Text>
              <Text style={[styles.meterStatus, m.status === 'ACTIVE' ? { color: colors.success } : { color: colors.textSecondary }]}>
                {m.status}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.logoutBg }]} onPress={handleLogout}>
        <Text style={[styles.logoutText, { color: colors.logoutText }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, marginBottom: 2 },
  fieldValue: { fontSize: 15 },
  meterItem: {
    borderRadius: 8, padding: 12, marginBottom: 8,
  },
  meterSerial: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  meterDetail: { fontSize: 12, marginTop: 4 },
  meterStatus: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  logoutBtn: {
    borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 40,
  },
  logoutText: { fontWeight: '600', fontSize: 16 },
});
