import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { getOutages } from '../../src/lib/api';

export default function OutagesScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [outages, setOutages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!token) return;
    const res = await getOutages(token).catch(() => null);
    setOutages(res?.data || []);
  };

  useEffect(() => { load(); }, [token]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const severityColor = (s: string) => {
    switch (s) {
      case 'CRITICAL': return colors.danger;
      case 'HIGH': return colors.orange;
      case 'MEDIUM': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'RESOLVED': return colors.success;
      case 'IN_PROGRESS': return colors.brand;
      default: return colors.warning;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {outages.map((o: any) => (
        <View key={o.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{o.title}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: severityColor(o.severity) + '20' }]}>
                <Text style={[styles.badgeText, { color: severityColor(o.severity) }]}>
                  {o.severity}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusColor(o.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: statusColor(o.status) }]}>
                  {o.status}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.area, { color: colors.textSecondary }]}>{o.affectedArea}</Text>
          <Text style={[styles.desc, { color: colors.textMuted }]}>{o.description}</Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>Started: {new Date(o.startedAt).toLocaleString()}</Text>
          {o.estimatedResolution && (
            <Text style={[styles.time, { color: colors.textTertiary }]}>Est. Resolution: {new Date(o.estimatedResolution).toLocaleString()}</Text>
          )}
          {o.resolvedAt && (
            <Text style={[styles.time, { color: colors.success }]}>Resolved: {new Date(o.resolvedAt).toLocaleString()}</Text>
          )}
        </View>
      ))}
      {outages.length === 0 && (
        <View style={styles.emptyContainer}>
          <Feather name="check-circle" size={40} color={colors.success} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyText, { color: colors.success }]}>No outages reported</Text>
        </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', flex: 1 },
  badges: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  area: { fontSize: 13, marginTop: 6 },
  desc: { fontSize: 13, marginTop: 8 },
  time: { fontSize: 11, marginTop: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '500' },
});
