import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';
import { api } from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

const STATUS_CONFIG = {
  CURRENT: { color: '#27AE60', label: 'Current' },
  PENDING: { color: '#2980B9', label: 'Pending' },
  OVERDUE: { color: '#E74C3C', label: 'Overdue' },
  PAID:    { color: '#16A34A', label: 'Paid'    },
};

function fmt(n) {
  if (n == null) return '$0';
  const v = Number(n);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function PieChart({ slices, size = 180 }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.54;
  let angle = -Math.PI / 2;
  const arcs = [];
  slices.forEach((sl) => {
    if (sl.value <= 0) return;
    const sweep = (sl.value / total) * 2 * Math.PI;
    const end = angle + sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const ox1 = cx + outerR * Math.cos(angle), oy1 = cy + outerR * Math.sin(angle);
    const ox2 = cx + outerR * Math.cos(end),   oy2 = cy + outerR * Math.sin(end);
    const ix1 = cx + innerR * Math.cos(end),   iy1 = cy + innerR * Math.sin(end);
    const ix2 = cx + innerR * Math.cos(angle), iy2 = cy + innerR * Math.sin(angle);
    arcs.push({
      color: sl.color,
      d: `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`,
    });
    angle = end;
  });
  return (
    <Svg width={size} height={size}>
      {arcs.map((arc, i) => <Path key={i} d={arc.d} fill={arc.color} />)}
    </Svg>
  );
}

function escapeCSV(val) {
  if (val == null) return '';
  const s = String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export default function ReportsScreen({ navigation }) {
  const [stats,     setStats]     = useState(null);
  const [proofs,    setProofs]    = useState([]);
  const [clients,   setClients]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([api.getDashboardStats(), api.getAllPaymentProofs(), api.listUsers()])
        .then(([statsData, proofsData, usersData]) => {
          if (!active) return;
          setStats(statsData);
          setProofs(proofsData.proofs || []);
          setClients(usersData.users || []);
        })
        .catch((err) => { if (active) Alert.alert('Error', err.message); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const handleExportCSV = async () => {
    if (clients.length === 0) {
      Alert.alert('No Data', 'No client records to export.');
      return;
    }

    setExporting(true);
    try {
      const rows = [
        ['Client Name', 'Username', 'Amount Due', 'Amount Paid', 'Status', 'Payment Schedule'],
        ...clients.map((c) => [
          escapeCSV(c.full_name),
          escapeCSV(c.username ? `@${c.username}` : ''),
          escapeCSV(c.total_balance != null ? Number(c.total_balance).toFixed(2) : '0.00'),
          escapeCSV(c.amount_paid  != null ? Number(c.amount_paid).toFixed(2)  : '0.00'),
          escapeCSV(c.account_status || 'CURRENT'),
          escapeCSV(c.next_review || '—'),
        ]),
      ];

      const csv = rows.map((r) => r.join(',')).join('\r\n');
      const timestamp = new Date().toISOString().slice(0, 10);
      const path = `${FileSystem.cacheDirectory}sovereign_ledger_${timestamp}.csv`;

      await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing unavailable', 'File sharing is not supported on this device.');
        return;
      }

      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Client Data',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (err) {
      Alert.alert('Export Failed', err.message || 'Could not generate CSV.');
    } finally {
      setExporting(false);
    }
  };

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopNavBar navigation={navigation} />
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.navy} /></View>
      </SafeAreaView>
    );
  }

  const { totalAccounts, totalBalance, totalPaid, byStatus, overdueClients } = stats;

  // ── Recovery Rate ──────────────────────────────────────────────
  const totalObligated = (Number(totalPaid) || 0) + (Number(totalBalance) || 0);

  // Headline: % of clients who have made at least one payment (always non-zero when any payment exists)
  const clientsWithPayments      = clients.filter((c) => Number(c.amount_paid) > 0).length;
  const paymentParticipationRate = totalAccounts > 0 ? (clientsWithPayments / totalAccounts) * 100 : 0;

  // Monetary recovery for sub-metric
  const monetaryRecoveryRate = totalObligated > 0
    ? ((Number(totalPaid) || 0) / totalObligated) * 100
    : 0;

  // Good-standing rate: clients who are CURRENT or PAID / total clients
  const goodStanding    = (byStatus.CURRENT || 0) + (byStatus.PAID || 0);
  const clientHealthPct = totalAccounts > 0 ? (goodStanding / totalAccounts) * 100 : 0;

  // Overdue exposure
  const overdueCount = byStatus.OVERDUE || 0;
  const overduePct   = totalAccounts > 0 ? (overdueCount / totalAccounts) * 100 : 0;

  // ── Client status pie — count of clients per status ──
  const pieSlices = ['CURRENT', 'PENDING', 'OVERDUE', 'PAID']
    .map((s) => ({ value: byStatus[s] || 0, color: STATUS_CONFIG[s].color, label: STATUS_CONFIG[s].label, status: s }))
    .filter((sl) => sl.value > 0);

  // ── Proof counts ───────────────────────────────────────────────
  const pendingProofs  = proofs.filter((p) => p.status === 'PENDING').length;
  const verifiedProofs = proofs.filter((p) => p.status === 'VERIFIED').length;

  const statusEntries = ['CURRENT', 'PENDING', 'OVERDUE', 'PAID']
    .map((s) => [s, byStatus[s] || 0]);
  const maxCount = Math.max(...statusEntries.map(([, v]) => v), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <TopNavBar navigation={navigation} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Page Header ── */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageLabel}>OVERVIEW</Text>
            <Text style={styles.pageTitle}>Reports &{'\n'}Analytics</Text>
          </View>
          <TouchableOpacity
            style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
            onPress={handleExportCSV}
            disabled={exporting}
            activeOpacity={0.85}
          >
            {exporting
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.exportText}>⬇  Export CSV</Text>}
          </TouchableOpacity>
        </View>

        {/* ── Summary Row ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totalAccounts}</Text>
            <Text style={styles.summaryLabel}>CLIENTS</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{fmt(totalPaid)}</Text>
            <Text style={styles.summaryLabel}>COLLECTED</Text>
          </View>
          <View style={[styles.summaryBox, { borderRightWidth: 0 }]}>
            <Text style={[styles.summaryValue, { color: '#E74C3C' }]}>{fmt(totalBalance)}</Text>
            <Text style={styles.summaryLabel}>OUTSTANDING</Text>
          </View>
        </View>

        {/* ── Recovery Rate ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>RECOVERY RATE</Text>
          <Text style={styles.cardSub}>Clients with active payments · monetary collection below</Text>

          <View style={styles.recoveryRow}>
            <Text style={styles.recoveryBig}>{paymentParticipationRate.toFixed(1)}%</Text>
            <View style={[
              styles.rateChip,
              { backgroundColor: paymentParticipationRate >= 50 ? '#EAFAF1' : '#FDECEA' },
            ]}>
              <Text style={[
                styles.rateChipText,
                { color: paymentParticipationRate >= 50 ? '#27AE60' : '#E74C3C' },
              ]}>
                {paymentParticipationRate >= 75 ? '↗ Strong' : paymentParticipationRate >= 50 ? '→ Moderate' : '↘ Low'}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(paymentParticipationRate, 100)}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelLeft}>{clientsWithPayments} of {totalAccounts} clients paying</Text>
            <Text style={styles.progressLabelRight}>{fmt(totalPaid)} collected</Text>
          </View>

          {/* Sub-metrics */}
          <View style={styles.subMetricRow}>
            <View style={styles.subMetric}>
              <Text style={styles.subMetricValue}>{monetaryRecoveryRate.toFixed(2)}%</Text>
              <Text style={styles.subMetricLabel}>MONETARY{'\n'}RECOVERY</Text>
            </View>
            <View style={styles.subMetricDivider} />
            <View style={styles.subMetric}>
              <Text style={[styles.subMetricValue, { color: overduePct > 20 ? '#E74C3C' : COLORS.navy }]}>
                {overduePct.toFixed(0)}%
              </Text>
              <Text style={styles.subMetricLabel}>CLIENTS{'\n'}OVERDUE</Text>
            </View>
            <View style={styles.subMetricDivider} />
            <View style={styles.subMetric}>
              <Text style={styles.subMetricValue}>{clientHealthPct.toFixed(0)}%</Text>
              <Text style={styles.subMetricLabel}>IN GOOD{'\n'}STANDING</Text>
            </View>
          </View>
        </View>

        {/* ── Client Status Breakdown ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CLIENT STATUS BREAKDOWN</Text>
          <Text style={styles.cardSub}>Number of clients by payment status</Text>

          {pieSlices.length === 0 ? (
            <View style={styles.noDataBox}>
              <Text style={styles.noDataText}>No client data available</Text>
            </View>
          ) : (
            <>
              <View style={styles.donutWrap}>
                <PieChart slices={pieSlices} size={180} />
                <View style={styles.donutCenter}>
                  <Text style={styles.donutPct}>{totalAccounts}</Text>
                  <Text style={styles.donutSub}>CLIENTS</Text>
                </View>
              </View>

              <View style={styles.capitalLegend}>
                {pieSlices.map((sl, idx) => (
                  <View key={sl.status}>
                    {idx > 0 && <View style={styles.capitalDivider} />}
                    <View style={styles.capitalRow}>
                      <View style={styles.capitalLeft}>
                        <View style={[styles.capitalDot, { backgroundColor: sl.color }]} />
                        <Text style={styles.capitalLabel}>{sl.label}</Text>
                      </View>
                      <View style={styles.capitalRight}>
                        <Text style={[styles.capitalValue, { color: sl.color }]}>{sl.value} client{sl.value !== 1 ? 's' : ''}</Text>
                        <Text style={styles.capitalPct}>
                          {totalAccounts > 0 ? `${Math.round((sl.value / totalAccounts) * 100)}%` : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ── Account Status Distribution ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ACCOUNT STATUS DISTRIBUTION</Text>
          <Text style={[styles.cardSub, { marginBottom: 16 }]}>Active clients by payment status</Text>
          {statusEntries.map(([status, count]) => {
            const cfg = STATUS_CONFIG[status] || { color: COLORS.navy, label: status };
            return (
              <View key={status} style={styles.statusRow}>
                <View style={styles.statusLabelWrap}>
                  <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                  <Text style={styles.statusLabel}>{cfg.label}</Text>
                </View>
                <View style={styles.statusBarTrack}>
                  <View style={[
                    styles.statusBarFill,
                    { width: `${(count / maxCount) * 100}%`, backgroundColor: cfg.color },
                  ]} />
                </View>
                <Text style={[styles.statusCount, { color: cfg.color }]}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Payment Proofs ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PAYMENT PROOF SUBMISSIONS</Text>
          <Text style={[styles.cardSub, { marginBottom: 14 }]}>Client-submitted payment evidence</Text>
          <View style={styles.proofRow}>
            <View style={[styles.proofBox, { backgroundColor: '#EBF5FB' }]}>
              <Text style={[styles.proofNum, { color: '#2980B9' }]}>{pendingProofs}</Text>
              <Text style={[styles.proofLabel, { color: '#2980B9' }]}>IN REVIEW</Text>
            </View>
            <View style={[styles.proofBox, { backgroundColor: '#EAFAF1' }]}>
              <Text style={[styles.proofNum, { color: '#27AE60' }]}>{verifiedProofs}</Text>
              <Text style={[styles.proofLabel, { color: '#27AE60' }]}>VERIFIED</Text>
            </View>
            <View style={[styles.proofBox, { backgroundColor: COLORS.lightBg }]}>
              <Text style={[styles.proofNum, { color: COLORS.navy }]}>{proofs.length}</Text>
              <Text style={[styles.proofLabel, { color: COLORS.gray }]}>TOTAL</Text>
            </View>
          </View>
        </View>

        {/* ── Overdue Accounts ── */}
        {overdueClients?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>OVERDUE ACCOUNTS</Text>
            <Text style={[styles.cardSub, { marginBottom: 14 }]}>Highest priority for follow-up</Text>
            {overdueClients.map((client, idx) => (
              <View key={client.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.overdueRow}>
                  <View style={styles.overdueAvatar}>
                    <Text style={styles.overdueInitial}>
                      {(client.name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.overdueInfo}>
                    <Text style={styles.overdueName}>{client.name}</Text>
                    {client.company
                      ? <Text style={styles.overdueCompany}>{client.company}</Text>
                      : null}
                  </View>
                  <Text style={styles.overdueAmount}>{fmt(client.balance)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.lightBg },
  scroll:  { paddingBottom: 16 },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  pageHeader: {
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 4,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  pageLabel:  { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold, letterSpacing: 1.2, marginBottom: 4 },
  pageTitle:  { fontSize: 28, color: COLORS.navy, ...FONTS.extraBold, lineHeight: 34, letterSpacing: -0.5 },
  exportBtn:  {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusSm,
    marginTop: 6,
    minWidth: 110,
    alignItems: 'center',
  },
  exportBtnDisabled: { opacity: 0.65 },
  exportText: { color: COLORS.white, fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.5 },

  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 14,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  summaryValue: { fontSize: SIZES.lg, color: COLORS.navy, ...FONTS.extraBold },
  summaryLabel: { fontSize: 9, color: COLORS.gray, ...FONTS.bold, letterSpacing: 0.8, marginTop: 3 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardLabel: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.bold, letterSpacing: 1.2 },
  cardSub:   { fontSize: SIZES.xs, color: COLORS.grayLight, ...FONTS.regular, marginTop: 2, marginBottom: 14 },

  /* Recovery Rate */
  recoveryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  recoveryBig: { fontSize: 44, color: COLORS.navy, ...FONTS.extraBold, letterSpacing: -1 },
  rateChip:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  rateChipText:{ fontSize: SIZES.xs, ...FONTS.bold },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: 8, backgroundColor: COLORS.navy, borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  progressLabelLeft:  { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.medium },
  progressLabelRight: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.medium },
  subMetricRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  subMetric: { flex: 1, alignItems: 'center' },
  subMetricDivider: { width: 1, backgroundColor: COLORS.border },
  subMetricValue: { fontSize: SIZES.lg, color: COLORS.navy, ...FONTS.extraBold, marginBottom: 4 },
  subMetricLabel: { fontSize: 9, color: COLORS.gray, ...FONTS.bold, letterSpacing: 0.6, textAlign: 'center', lineHeight: 13 },

  /* Capital Allocation */
  donutWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutPct: { fontSize: 28, color: COLORS.navy, ...FONTS.extraBold },
  donutSub: { fontSize: 9, color: COLORS.gray, ...FONTS.bold, letterSpacing: 1 },
  capitalLegend: { marginTop: 8 },
  capitalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  capitalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  capitalDot:  { width: 10, height: 10, borderRadius: 5 },
  capitalLabel:{ fontSize: SIZES.md, color: COLORS.navy, ...FONTS.medium },
  capitalValue:{ fontSize: SIZES.md, ...FONTS.bold },
  capitalRight:{ alignItems: 'flex-end' },
  capitalPct:  { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.medium, marginTop: 1 },
  capitalDivider: { height: 1, backgroundColor: COLORS.border },

  noDataBox:  { paddingVertical: 28, alignItems: 'center' },
  noDataText: { fontSize: SIZES.sm, color: COLORS.grayLight, ...FONTS.medium },

  /* Status Distribution */
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statusLabelWrap: { flexDirection: 'row', alignItems: 'center', width: 80, gap: 7 },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusLabel:{ fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold },
  statusBarTrack: {
    flex: 1,
    height: 7,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  statusBarFill: { height: 7, borderRadius: 4 },
  statusCount: { width: 28, textAlign: 'right', fontSize: SIZES.xs, ...FONTS.bold },

  /* Proof Submissions */
  proofRow: { flexDirection: 'row', gap: 10 },
  proofBox: { flex: 1, borderRadius: SIZES.radiusSm, padding: 14, alignItems: 'center' },
  proofNum:  { fontSize: 28, ...FONTS.extraBold, marginBottom: 4 },
  proofLabel:{ fontSize: 9, ...FONTS.bold, letterSpacing: 0.8 },

  /* Overdue */
  divider: { height: 1, backgroundColor: COLORS.border },
  overdueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  overdueAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FDECEA',
    alignItems: 'center', justifyContent: 'center',
  },
  overdueInitial: { fontSize: SIZES.md, color: '#E74C3C', ...FONTS.bold },
  overdueInfo:    { flex: 1 },
  overdueName:    { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold },
  overdueCompany: { fontSize: SIZES.xs, color: COLORS.gray, marginTop: 1 },
  overdueAmount:  { fontSize: SIZES.md, color: '#E74C3C', ...FONTS.bold },
});
