import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { getAccountBilling } from '../../src/lib/api';
import { formatCurrency } from '@egx/shared';

export default function BillingScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
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
      case 'PAID': return colors.success;
      case 'ISSUED': return colors.brand;
      case 'OVERDUE': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {bills.map((bill: any) => (
        <View key={bill.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.amount, { color: colors.text }]}>{formatCurrency(bill.amountDue)}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor(bill.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: statusColor(bill.status) }]}>
                {bill.status}
              </Text>
            </View>
          </View>
          <Text style={[styles.period, { color: colors.textSecondary }]}>
            {new Date(bill.startDate).toLocaleDateString()} – {new Date(bill.endDate).toLocaleDateString()}
          </Text>
          <Text style={[styles.usage, { color: colors.textSecondary }]}>{bill.totalKwh.toFixed(1)} kWh</Text>
          <Text style={[styles.due, { color: colors.textTertiary }]}>Due: {new Date(bill.dueDate).toLocaleDateString()}</Text>
        </View>
      ))}
      {bills.length === 0 && (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>No billing records</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 20, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  period: { fontSize: 13, marginTop: 8 },
  usage: { fontSize: 13, marginTop: 4 },
  due: { fontSize: 12, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});
