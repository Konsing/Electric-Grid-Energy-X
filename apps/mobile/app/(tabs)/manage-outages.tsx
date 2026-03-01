import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/lib/theme-context';
import { getOutages, createOutage, resolveOutage } from '../../src/lib/api';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export default function ManageOutagesScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const [outages, setOutages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [affectedArea, setAffectedArea] = useState('');
  const [severity, setSeverity] = useState<string>('MEDIUM');

  const load = async () => {
    if (!token) return;
    const res = await getOutages(token).catch(() => null);
    setOutages(res?.data || []);
  };

  useEffect(() => { load(); }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!token || !title.trim() || !affectedArea.trim()) return;
    await createOutage({ title, description, affectedArea, severity }, token).catch(() => {});
    setTitle('');
    setDescription('');
    setAffectedArea('');
    setSeverity('MEDIUM');
    setShowForm(false);
    load();
  };

  const handleResolve = async (id: string) => {
    if (!token) return;
    await resolveOutage(id, token).catch(() => {});
    load();
  };

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
      case 'ACTIVE': return colors.danger;
      case 'RESOLVED': return colors.success;
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
      <TouchableOpacity
        style={[styles.reportBtn, { backgroundColor: colors.brand }]}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.reportBtnText}>{showForm ? 'Cancel' : 'Report Outage'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>New Outage Report</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Title"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Description"
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Affected Area"
            placeholderTextColor={colors.textTertiary}
            value={affectedArea}
            onChangeText={setAffectedArea}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Severity</Text>
          <View style={styles.severityRow}>
            {SEVERITIES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.severityOption,
                  { borderColor: severity === s ? severityColor(s) : colors.inputBorder },
                  severity === s && { backgroundColor: severityColor(s) + '20' },
                ]}
                onPress={() => setSeverity(s)}
              >
                <View style={[styles.radio, { borderColor: severity === s ? severityColor(s) : colors.textTertiary }]}>
                  {severity === s && <View style={[styles.radioInner, { backgroundColor: severityColor(s) }]} />}
                </View>
                <Text style={[styles.severityText, { color: severity === s ? severityColor(s) : colors.textSecondary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.brand }]} onPress={handleCreate}>
            <Text style={styles.submitBtnText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {outages.map((o: any) => (
        <View key={o.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, { color: colors.text }]}>{o.title}</Text>
            <View style={[styles.badge, { backgroundColor: severityColor(o.severity) + '20' }]}>
              <Text style={[styles.badgeText, { color: severityColor(o.severity) }]}>{o.severity}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(o.status) + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor(o.status) }]}>{o.status}</Text>
            </View>
          </View>
          <Text style={[styles.area, { color: colors.textSecondary }]}>{o.affectedArea}</Text>
          <Text style={[styles.desc, { color: colors.textMuted }]}>{o.description}</Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>Started: {new Date(o.startedAt).toLocaleString()}</Text>
          {o.resolvedAt && (
            <Text style={[styles.time, { color: colors.textTertiary }]}>Resolved: {new Date(o.resolvedAt).toLocaleString()}</Text>
          )}

          {o.status !== 'RESOLVED' && (
            <TouchableOpacity
              style={[styles.resolveBtn, { backgroundColor: colors.success + '20' }]}
              onPress={() => handleResolve(o.id)}
            >
              <Text style={[styles.resolveBtnText, { color: colors.success }]}>Resolve</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      {outages.length === 0 && (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>No outages found</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  reportBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  reportBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: {
    borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1,
  },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  input: {
    borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 14, marginBottom: 12,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 12, marginBottom: 8 },
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  severityOption: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 8,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  severityText: { fontSize: 12, fontWeight: '600' },
  submitBtn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  statusRow: { marginTop: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  area: { fontSize: 13, marginTop: 6 },
  desc: { fontSize: 13, marginTop: 8 },
  time: { fontSize: 11, marginTop: 6 },
  resolveBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 12 },
  resolveBtnText: { fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});
