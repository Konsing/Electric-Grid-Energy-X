import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { listAccounts, getAccountMeters, createMeter, updateMeter } from '../../src/lib/api';

const METER_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;

export default function ManageMetersScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [meters, setMeters] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!token || (user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN')) return;
    listAccounts(token).then((res) => setAccounts(res?.data || [])).catch(() => {});
  }, [token, user?.role]);

  const loadMeters = async () => {
    if (!token || !accountId.trim()) return;
    const res = await getAccountMeters(accountId.trim(), token).catch(() => null);
    setMeters(res?.data || []);
    setLoaded(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeters();
    setRefreshing(false);
  };

  const handleStatusChange = async (meterId: string, status: string) => {
    if (!token) return;
    await updateMeter(meterId, { status }, token).catch(() => {});
    loadMeters();
  };

  const handleAddMeter = async () => {
    if (!token || !accountId.trim() || !serialNumber.trim() || !model.trim() || !location.trim()) return;
    await createMeter(accountId.trim(), { serialNumber, model, location }, token).catch(() => {});
    setSerialNumber('');
    setModel('');
    setLocation('');
    setShowAddForm(false);
    loadMeters();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return colors.success;
      case 'INACTIVE': return colors.textSecondary;
      case 'MAINTENANCE': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.textTertiary }]}>Admin or Technician access required</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Account</Text>
        {accounts.length > 0 ? (
          <View style={styles.accountList}>
            {accounts.map((acct: any) => (
              <TouchableOpacity
                key={acct.id}
                style={[
                  styles.accountItem,
                  { borderColor: accountId === acct.id ? colors.brand : colors.inputBorder },
                  accountId === acct.id && { backgroundColor: colors.brand + '15' },
                ]}
                onPress={() => setAccountId(acct.id)}
              >
                <Text style={[styles.accountNumber, { color: colors.text }]}>{acct.accountNumber}</Text>
                <Text style={[styles.accountName, { color: colors.textSecondary }]}>{acct.firstName} {acct.lastName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Account ID"
              placeholderTextColor={colors.textTertiary}
              value={accountId}
              onChangeText={setAccountId}
            />
          </View>
        )}
        <TouchableOpacity
          style={[styles.loadBtn, { backgroundColor: colors.brand, opacity: accountId ? 1 : 0.5 }]}
          onPress={loadMeters}
          disabled={!accountId}
        >
          <Text style={styles.loadBtnText}>Load Meters</Text>
        </TouchableOpacity>
      </View>

      {loaded && (
        <>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.brand }]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text style={styles.addBtnText}>{showAddForm ? 'Cancel' : 'Add New Meter'}</Text>
          </TouchableOpacity>

          {showAddForm && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>New Meter</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Serial Number"
                placeholderTextColor={colors.textTertiary}
                value={serialNumber}
                onChangeText={setSerialNumber}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Model"
                placeholderTextColor={colors.textTertiary}
                value={model}
                onChangeText={setModel}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Location"
                placeholderTextColor={colors.textTertiary}
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.brand }]} onPress={handleAddMeter}>
                <Text style={styles.submitBtnText}>Add Meter</Text>
              </TouchableOpacity>
            </View>
          )}

          {meters.map((m: any) => (
            <View key={m.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.meterSerial, { color: colors.text }]}>{m.serialNumber}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor(m.status) + '20' }]}>
                  <Text style={[styles.badgeText, { color: statusColor(m.status) }]}>{m.status}</Text>
                </View>
              </View>
              <Text style={[styles.meterDetail, { color: colors.textSecondary }]}>{m.model} -- {m.location}</Text>

              <View style={styles.statusActions}>
                {METER_STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusBtn,
                      { borderColor: m.status === s ? statusColor(s) : colors.inputBorder },
                      m.status === s && { backgroundColor: statusColor(s) + '20' },
                    ]}
                    onPress={() => handleStatusChange(m.id, s)}
                    disabled={m.status === s}
                  >
                    <Text style={[styles.statusBtnText, { color: m.status === s ? statusColor(s) : colors.textSecondary }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          {meters.length === 0 && (
            <Text style={[styles.empty, { color: colors.textTertiary }]}>No meters found for this account</Text>
          )}
        </>
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
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  accountList: { gap: 8, marginBottom: 12 },
  accountItem: {
    borderRadius: 8, borderWidth: 1, padding: 12,
  },
  accountNumber: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  accountName: { fontSize: 12, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, marginBottom: 0 },
  input: {
    borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 14, marginBottom: 12,
  },
  loadBtn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  loadBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  addBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  submitBtn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meterSerial: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  meterDetail: { fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  statusActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statusBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  statusBtnText: { fontSize: 11, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});
