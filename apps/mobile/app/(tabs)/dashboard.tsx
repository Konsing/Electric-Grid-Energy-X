import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { getUsageSummary, getActiveOutages } from '../../src/lib/api';
import { formatKwh } from '@egx/shared';

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const [usage, setUsage] = useState<any>(null);
  const [outages, setOutages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const accountId = user?.account?.id;

  const loadData = async () => {
    if (!accountId || !token) return;
    const [u, o] = await Promise.all([
      getUsageSummary(accountId, token).catch(() => null),
      getActiveOutages(token).catch(() => null),
    ]);
    setUsage(u?.data);
    setOutages(o?.data || []);
  };

  useEffect(() => { loadData(); }, [accountId, token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>Welcome, {user?.account?.firstName}!</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Month</Text>
          <Text style={styles.statValue}>
            {usage?.currentMonth ? formatKwh(usage.currentMonth) : '--'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Monthly Avg</Text>
          <Text style={styles.statValue}>
            {usage?.averageMonthly ? formatKwh(usage.averageMonthly) : '--'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total (12 mo)</Text>
          <Text style={styles.statValue}>
            {usage?.totalKwh ? formatKwh(usage.totalKwh) : '--'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Outages</Text>
          <Text style={[styles.statValue, outages.length > 0 && { color: '#dc2626' }]}>
            {outages.length}
          </Text>
        </View>
      </View>

      {outages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Outages</Text>
          {outages.map((o: any) => (
            <View key={o.id} style={styles.outageCard}>
              <Text style={styles.outageTitle}>{o.title}</Text>
              <Text style={styles.outageArea}>{o.affectedArea}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  outageCard: {
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#fecaca',
  },
  outageTitle: { fontSize: 14, fontWeight: '600', color: '#991b1b' },
  outageArea: { fontSize: 12, color: '#b91c1c', marginTop: 4 },
});
