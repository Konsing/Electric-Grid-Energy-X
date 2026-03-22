import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { getUsageSummary, getUsageAnalytics, getAccountBilling, getActiveOutages } from '../../src/lib/api';
import { formatKwh } from '@egx/shared';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const [usage, setUsage] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [outages, setOutages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const accountId = user?.account?.id;

  const loadData = async () => {
    if (!accountId || !token) return;
    const [u, a, b, o] = await Promise.all([
      getUsageSummary(accountId, token).catch(() => null),
      getUsageAnalytics(accountId, token).catch(() => null),
      getAccountBilling(accountId, token).catch(() => null),
      getActiveOutages(token).catch(() => null),
    ]);
    setUsage(u?.data);
    setAnalytics(a?.data);
    setBills(b?.data || []);
    setOutages(o?.data || []);
  };

  useEffect(() => { loadData(); }, [accountId, token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const trend = usage?.trend;
  const trendLabel = trend != null
    ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}% vs last month`
    : null;

  // Chart data
  const months = analytics?.months || [];
  const usageLabels = months.map((m: any) =>
    m.month ? new Date(m.month).toLocaleString('default', { month: 'short' }) : ''
  );
  const usageValues = months.map((m: any) => Math.round(m.kwh || 0));

  const billingReversed = [...bills].reverse();
  const costLabels = billingReversed.map((b: any) =>
    new Date(b.startDate).toLocaleString('default', { month: 'short' })
  );
  const costValues = billingReversed.map((b: any) => b.amountDue || 0);

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalCount: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => colors.textTertiary,
    propsForBackgroundLines: {
      stroke: colors.surfaceBorder,
      strokeDasharray: '3 3',
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: '#3b82f6',
    },
  };

  const costChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
  };

  const chartWidth = screenWidth - 48;

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
          {trendLabel && (
            <Text style={[styles.trendText, { color: trend > 0 ? colors.danger : colors.success }]}>{trendLabel}</Text>
          )}
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

      {/* Usage Line Chart */}
      {usageValues.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Energy Usage</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <LineChart
              data={{
                labels: usageLabels.length > 6 ? usageLabels.filter((_: any, i: number) => i % 2 === 0) : usageLabels,
                datasets: [{ data: usageValues.length > 0 ? usageValues : [0] }],
              }}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines={false}
              yAxisSuffix=""
              yAxisLabel=""
            />
          </View>
        </View>
      )}

      {/* Cost Bar Chart */}
      {costValues.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Cost</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <BarChart
              data={{
                labels: costLabels,
                datasets: [{ data: costValues.length > 0 ? costValues : [0] }],
              }}
              width={chartWidth}
              height={200}
              chartConfig={costChartConfig}
              style={styles.chart}
              withInnerLines
              yAxisSuffix=""
              yAxisLabel="$"
            />
          </View>
        </View>
      )}

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
  trendText: { fontSize: 11, marginTop: 4 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  chartCard: {
    borderRadius: 12, borderWidth: 1, paddingVertical: 12, overflow: 'hidden',
  },
  chart: { borderRadius: 12 },
  outageCard: {
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1,
  },
  outageTitle: { fontSize: 14, fontWeight: '600' },
  outageArea: { fontSize: 12, marginTop: 4 },
});
