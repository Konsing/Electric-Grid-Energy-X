import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { getUsageSummary, getActiveOutages } from '../../src/lib/api';
import { formatKwh } from '@egx/shared';

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.greeting, { color: colors.text }]}>Welcome, {user?.account?.firstName}!</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Month</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {usage?.currentMonth ? formatKwh(usage.currentMonth) : '--'}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monthly Avg</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {usage?.averageMonthly ? formatKwh(usage.averageMonthly) : '--'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total (12 mo)</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {usage?.totalKwh ? formatKwh(usage.totalKwh) : '--'}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Outages</Text>
          <Text style={[styles.statValue, { color: outages.length > 0 ? colors.danger : colors.text }]}>
            {outages.length}
          </Text>
        </View>
      </View>

      {outages.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Outages</Text>
          {outages.map((o: any) => (
            <View key={o.id} style={[styles.outageCard, { backgroundColor: colors.outageCardBg, borderColor: colors.outageCardBorder }]}>
              <Text style={[styles.outageTitle, { color: colors.outageTitle }]}>{o.title}</Text>
              <Text style={[styles.outageArea, { color: colors.outageArea }]}>{o.affectedArea}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  greeting: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 16,
    borderWidth: 1,
  },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  outageCard: {
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1,
  },
  outageTitle: { fontSize: 14, fontWeight: '600' },
  outageArea: { fontSize: 12, marginTop: 4 },
});
