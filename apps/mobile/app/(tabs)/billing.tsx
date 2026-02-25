import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { getAccountBilling } from '../../src/lib/api';
import { formatCurrency } from '@egx/shared';

export default function BillingScreen() {
  const { user, token } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const accountId = user?.account?.id;

  const loadBills = async () => {
    if (!accountId || !token) return;
    const res = await getAccountBilling(accountId, token).catch(() => null);
    setBills(res?.data || []);
  };

  useEffect(() => { loadBills(); }, [accountId, token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBills();
    setRefreshing(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'PAID': return '#16a34a';
      case 'ISSUED': return '#2563eb';
      case 'OVERDUE': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {bills.map((bill: any) => (
        <View key={bill.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.amount}>{formatCurrency(bill.amountDue)}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor(bill.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: statusColor(bill.status) }]}>
                {bill.status}
              </Text>
            </View>
          </View>
          <Text style={styles.period}>
            {new Date(bill.startDate).toLocaleDateString()} – {new Date(bill.endDate).toLocaleDateString()}
          </Text>
          <Text style={styles.usage}>{bill.totalKwh.toFixed(1)} kWh</Text>
          <Text style={styles.due}>Due: {new Date(bill.dueDate).toLocaleDateString()}</Text>
        </View>
      ))}
      {bills.length === 0 && (
        <Text style={styles.empty}>No billing records</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  period: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  usage: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  due: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 16 },
});
