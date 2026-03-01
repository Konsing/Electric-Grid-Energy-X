import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { listAccounts, updateAccountStatus, deleteAccount } from '../../src/lib/api';

export default function AdminAccountsScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!token) return;
    const res = await listAccounts(token).catch(() => null);
    setAccounts(res?.data || []);
  };

  useEffect(() => { load(); }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleStatusChange = async (accountId: string, status: string) => {
    if (!token) return;
    await updateAccountStatus(accountId, status, token).catch(() => {});
    load();
  };

  const handleDelete = (accountId: string, name: string) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            await deleteAccount(accountId, token).catch(() => {});
            load();
          },
        },
      ],
    );
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return colors.success;
      case 'SUSPENDED': return colors.warning;
      case 'CLOSED': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.textTertiary }]}>Admin access required</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {accounts.map((acc: any) => (
        <View key={acc.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.name, { color: colors.text }]}>{acc.firstName} {acc.lastName}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor(acc.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: statusColor(acc.status) }]}>{acc.status}</Text>
            </View>
          </View>
          <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>#{acc.accountNumber}</Text>
          <Text style={[styles.detail, { color: colors.textSecondary }]}>{acc.user?.email || '--'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.typeBadgeBg }]}>
            <Text style={[styles.roleText, { color: colors.typeBadgeText }]}>{acc.user?.role || '--'}</Text>
          </View>

          <View style={styles.actions}>
            {acc.status === 'ACTIVE' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.warning + '20' }]}
                onPress={() => handleStatusChange(acc.id, 'SUSPENDED')}
              >
                <Text style={[styles.actionText, { color: colors.warning }]}>Suspend</Text>
              </TouchableOpacity>
            )}
            {acc.status === 'SUSPENDED' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success + '20' }]}
                onPress={() => handleStatusChange(acc.id, 'ACTIVE')}
              >
                <Text style={[styles.actionText, { color: colors.success }]}>Activate</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.danger + '20' }]}
              onPress={() => handleDelete(acc.id, `${acc.firstName} ${acc.lastName}`)}
            >
              <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {accounts.length === 0 && (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>No accounts found</Text>
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
  name: { fontSize: 16, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  accountNumber: { fontSize: 13, fontFamily: 'monospace', marginTop: 4 },
  detail: { fontSize: 13, marginTop: 4 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 8 },
  roleText: { fontSize: 10, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  actionText: { fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});
