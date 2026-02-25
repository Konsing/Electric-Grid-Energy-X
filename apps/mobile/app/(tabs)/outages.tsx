import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { getActiveOutages } from '../../src/lib/api';

export default function OutagesScreen() {
  const { token } = useAuth();
  const [outages, setOutages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!token) return;
    const res = await getActiveOutages(token).catch(() => null);
    setOutages(res?.data || []);
  };

  useEffect(() => { load(); }, [token]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const severityColor = (s: string) => {
    switch (s) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {outages.map((o: any) => (
        <View key={o.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{o.title}</Text>
            <View style={[styles.badge, { backgroundColor: severityColor(o.severity) + '20' }]}>
              <Text style={[styles.badgeText, { color: severityColor(o.severity) }]}>
                {o.severity}
              </Text>
            </View>
          </View>
          <Text style={styles.area}>{o.affectedArea}</Text>
          <Text style={styles.desc}>{o.description}</Text>
          <Text style={styles.time}>Started: {new Date(o.startedAt).toLocaleString()}</Text>
          {o.estimatedResolution && (
            <Text style={styles.time}>Est. Resolution: {new Date(o.estimatedResolution).toLocaleString()}</Text>
          )}
        </View>
      ))}
      {outages.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{'✅'}</Text>
          <Text style={styles.emptyText}>No active outages</Text>
        </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  area: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  desc: { fontSize: 13, color: '#4b5563', marginTop: 8 },
  time: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#16a34a', fontWeight: '500' },
});
