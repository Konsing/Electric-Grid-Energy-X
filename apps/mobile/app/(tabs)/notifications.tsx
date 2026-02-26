import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { getNotifications, markAllRead } from '../../src/lib/api';

export default function NotificationsScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {unreadCount > 0 && (
        <TouchableOpacity style={[styles.markAllBtn, { backgroundColor: colors.markAllBtn }]} onPress={handleMarkAllRead}>
          <Text style={[styles.markAllText, { color: colors.markAllText }]}>Mark all read ({unreadCount})</Text>
        </TouchableOpacity>
      )}

      {notifications.map((n: any) => (
        <View key={n.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, !n.readAt && styles.unread]}>
          <View style={[styles.typeBadge, { backgroundColor: colors.typeBadgeBg }]}>
            <Text style={[styles.typeText, { color: colors.typeBadgeText }]}>{n.type}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{n.title}</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>{n.message}</Text>
          <Text style={[styles.date, { color: colors.textTertiary }]}>{new Date(n.createdAt).toLocaleString()}</Text>
        </View>
      ))}
      {notifications.length === 0 && (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>No notifications</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  markAllBtn: { borderRadius: 8, padding: 12, marginBottom: 16, alignItems: 'center' },
  markAllText: { fontWeight: '500', fontSize: 14 },
  card: {
    borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1,
  },
  unread: { borderLeftWidth: 4, borderLeftColor: '#2563eb' },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  message: { fontSize: 13, marginTop: 4 },
  date: { fontSize: 11, marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});
