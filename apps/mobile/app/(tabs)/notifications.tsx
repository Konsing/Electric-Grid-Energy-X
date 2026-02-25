import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { getNotifications, markAllRead } from '../../src/lib/api';

export default function NotificationsScreen() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const accountId = user?.account?.id;

  const load = async () => {
    if (!accountId || !token) return;
    const res = await getNotifications(accountId, token).catch(() => null);
    setNotifications(res?.data || []);
    setUnreadCount(res?.unreadCount || 0);
  };

  useEffect(() => { load(); }, [accountId, token]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleMarkAllRead = async () => {
    if (!accountId || !token) return;
    await markAllRead(accountId, token);
    load();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read ({unreadCount})</Text>
        </TouchableOpacity>
      )}

      {notifications.map((n: any) => (
        <View key={n.id} style={[styles.card, !n.readAt && styles.unread]}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{n.type}</Text>
          </View>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.message}>{n.message}</Text>
          <Text style={styles.date}>{new Date(n.createdAt).toLocaleString()}</Text>
        </View>
      ))}
      {notifications.length === 0 && (
        <Text style={styles.empty}>No notifications</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  markAllBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 16, alignItems: 'center' },
  markAllText: { color: '#374151', fontWeight: '500', fontSize: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  unread: { borderLeftWidth: 4, borderLeftColor: '#2563eb' },
  typeBadge: { backgroundColor: '#f3f4f6', alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: '600', color: '#6b7280' },
  title: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 8 },
  message: { fontSize: 13, color: '#4b5563', marginTop: 4 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 16 },
});
