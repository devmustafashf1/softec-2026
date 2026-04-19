import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Animated, ActivityIndicator, Alert, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';
import { api } from '../services/api';

const TREND_BARS = [0.4, 0.55, 0.35, 0.6, 0.5, 0.45, 0.7, 0.65, 0.8, 0.75, 0.9, 1.0];
const STATUS_OPTIONS = ['OVERDUE', 'PENDING', 'CURRENT'];
const STATUS_COLORS  = { OVERDUE: COLORS.red, PENDING: COLORS.orange, CURRENT: COLORS.green, PAID: COLORS.blue };

function fmt(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function TrendBar({ value }) {
  return (
    <View style={trendStyles.barContainer}>
      <View style={[trendStyles.bar, { height: value * 80 }]} />
    </View>
  );
}
const trendStyles = StyleSheet.create({
  barContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginHorizontal: 2 },
  bar: { width: '80%', backgroundColor: COLORS.navy, borderRadius: 3, minHeight: 6 },
});

export default function DashboardScreen({ navigation }) {
  const [stats, setStats]             = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // followup modal
  const [modalVisible, setModalVisible]         = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(['OVERDUE', 'PENDING']));
  const [clients, setClients]                   = useState([]);
  const [loadingClients, setLoadingClients]     = useState(false);
  const [phase, setPhase]                       = useState('select'); // select|confirm|processing|done
  const [results, setResults]                   = useState([]);
  const [doneCount, setDoneCount]               = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => { if (g.dy > 0) sheetTranslateY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80) {
        Animated.timing(sheetTranslateY, { toValue: 600, duration: 220, useNativeDriver: true }).start(() => {
          sheetTranslateY.setValue(0);
          closeModal();
        });
      } else {
        Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  async function loadStats() {
    try {
      setLoadingStats(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.warn('Dashboard stats:', e.message);
    } finally {
      setLoadingStats(false);
    }
  }

  function openFollowup() {
    setSelectedStatuses(new Set(['OVERDUE', 'PENDING']));
    setClients([]);
    setResults([]);
    setDoneCount(0);
    setPhase('select');
    progressAnim.setValue(0);
    setModalVisible(true);
  }

  function toggleStatus(s) {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(s)) { if (next.size > 1) next.delete(s); }
      else next.add(s);
      return next;
    });
  }

  async function loadClients() {
    setLoadingClients(true);
    try {
      const { clients: list } = await api.getClientsByStatus([...selectedStatuses]);
      setClients(list);
      setPhase('confirm');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingClients(false);
    }
  }

  async function startProcessing() {
    if (!clients.length) return;
    setPhase('processing');
    setResults(clients.map(c => ({ id: c.id, name: c.full_name || c.username, email: c.email, status: 'pending' })));
    setDoneCount(0);
    progressAnim.setValue(0);

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      try {
        const { message } = await api.generateMessage(client.id);
        await api.sendMessage(client.id, message.id, { sendEmail: !!client.email });
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'success' } : r));
      } catch (e) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', note: e.message } : r));
      }
      const progress = (i + 1) / clients.length;
      Animated.timing(progressAnim, { toValue: progress, duration: 350, useNativeDriver: false }).start();
      setDoneCount(i + 1);
    }
    setPhase('done');
    setTimeout(() => closeModal(), 2000);
  }

  function closeModal() {
    setModalVisible(false);
    setPhase('select');
    loadStats(); // refresh numbers after bulk send
  }

  const recoveryRate = stats && stats.totalAccounts > 0
    ? ((stats.clientsWithPayments / stats.totalAccounts) * 100).toFixed(1)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <TopNavBar navigation={navigation} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Portfolio Header */}
        <View style={styles.portfolioSection}>
          <Text style={styles.portfolioLabel}>THE SOVEREIGN LEDGER | PORTFOLIO STATUS</Text>
          {loadingStats
            ? <ActivityIndicator color={COLORS.navy} style={{ marginVertical: 14 }} />
            : <Text style={styles.portfolioAmount}>{fmt(stats?.totalBalance ?? 0)}</Text>}
          <Text style={styles.portfolioDesc}>
            {stats
              ? `Total outstanding across ${stats.totalAccounts} active accounts. ${stats.byStatus.OVERDUE} overdue · ${stats.byStatus.PENDING} pending.`
              : 'Loading portfolio data…'}
          </Text>

          <TouchableOpacity style={styles.followUpButton} activeOpacity={0.85} onPress={openFollowup}>
            <Text style={styles.followUpIcon}>▶  </Text>
            <Text style={styles.followUpText}>Start Today's Follow-ups</Text>
          </TouchableOpacity>

          <View style={styles.authenticatedBadge}>
            <Text style={styles.authenticatedIcon}>✓</Text>
            <Text style={styles.authenticatedText}>LEDGER AUTHENTICATED</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL ACCOUNTS</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{stats ? stats.totalAccounts.toLocaleString() : '—'}</Text>
              {stats && <Text style={styles.statBadgeGreen}>{stats.byStatus.CURRENT} current</Text>}
            </View>
            <View style={styles.statDivider} />
          </View>

          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statLabel}>TOTAL COLLECTED</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{stats ? fmt(stats.totalPaid) : '—'}</Text>
              {recoveryRate && <Text style={styles.statBadgeGreen}>{recoveryRate}%</Text>}
            </View>
            <View style={styles.miniBarRow}>
              {[0.3, 0.5, 0.4, 0.6, 0.7, 0.85, 1.0].map((v, i) => (
                <View key={i} style={[styles.miniBar, { height: v * 28, backgroundColor: i === 6 ? COLORS.navy : COLORS.inputBg }]} />
              ))}
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RECOVERY RATE</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{recoveryRate ? `${recoveryRate}%` : '—'}</Text>
              <Text style={styles.optimalBadge}>{recoveryRate && Number(recoveryRate) >= 50 ? 'Optimal' : 'Building'}</Text>
            </View>
            <Text style={styles.statSubtext}>↗  Clients with any payment made</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>OVERDUE ACCOUNTS</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{stats ? stats.byStatus.OVERDUE : '—'}</Text>
              {stats?.byStatus.OVERDUE > 0 && <Text style={styles.urgentBadge}>Attention</Text>}
            </View>
            <View style={styles.avatarGroup}>
              {['#E74C3C', '#F39C12', '#3498DB'].map((c, i) => (
                <View key={i} style={[styles.miniAvatar, { backgroundColor: c, marginLeft: i > 0 ? -6 : 0 }]} />
              ))}
            </View>
          </View>
        </View>

        {/* Status Breakdown */}
        {stats && (
          <View style={styles.trendCard}>
            <Text style={styles.sectionTitle}>Account Status Breakdown</Text>
            <View style={{ marginTop: 14, gap: 10 }}>
              {Object.entries(stats.byStatus).map(([status, count]) => {
                const pct = stats.totalAccounts > 0 ? (count / stats.totalAccounts) * 100 : 0;
                const color = STATUS_COLORS[status] || COLORS.gray;
                return (
                  <View key={status}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, ...FONTS.semiBold }}>{status}</Text>
                      <Text style={{ fontSize: SIZES.sm, color, ...FONTS.bold }}>{count}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: 3 }}>
                      <View style={{ height: 6, width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Priority Case Alerts */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Priority Case Alerts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {loadingStats ? (
          <ActivityIndicator color={COLORS.navy} style={{ marginVertical: 16 }} />
        ) : stats?.overdueClients?.length > 0 ? (
          stats.overdueClients.map((c, i) => (
            <View key={c.id} style={styles.caseCard}>
              <View style={styles.caseTopRow}>
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalBadgeText}>OVERDUE</Text>
                </View>
                <Text style={styles.caseId}>{c.username ? `@${c.username}` : `#${i + 1}`}</Text>
              </View>
              <Text style={styles.caseName}>{c.name || c.company || 'Unknown Client'}</Text>
              <Text style={styles.caseAmount}>{fmt(c.balance)} outstanding</Text>
              <View style={styles.caseActionRow}>
                <Text style={styles.caseActionIcon}>⚠</Text>
                <Text style={styles.caseActionText}>REQUIRES IMMEDIATE FOLLOW-UP</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.caseCard, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ color: COLORS.green, ...FONTS.bold, fontSize: SIZES.base }}>✓ No overdue accounts</Text>
          </View>
        )}

        {/* 30-Day Trend */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.sectionTitle}>30-Day Collection Trend</Text>
            <View style={styles.legendDot} />
          </View>
          <Text style={styles.trendSubLabel}>Daily recovery volume (USD)</Text>
          <View style={styles.trendChart}>
            {TREND_BARS.map((v, i) => <TrendBar key={i} value={v} />)}
          </View>
          <View style={styles.trendDatesRow}>
            <Text style={styles.trendDateLabel}>MAR 01</Text>
            <Text style={styles.trendDateLabel}>MAR 15</Text>
            <Text style={styles.trendDateLabel}>TODAY</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Bulk Follow-up Modal ───────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => { if (phase !== 'processing') closeModal(); }}>
        <View style={styles.modalOverlay}>
          {/* Tap dark area to dismiss */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => { if (phase !== 'processing') closeModal(); }} />
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: sheetTranslateY }] }]}>
            {/* Drag handle */}
            <View {...(phase !== 'processing' ? panResponder.panHandlers : {})} style={styles.dragHandleArea}>
              <View style={styles.dragHandle} />
            </View>

            {/* SELECT PHASE */}
            {phase === 'select' && (
              <>
                <Text style={styles.modalTitle}>Start Follow-ups</Text>
                <Text style={styles.modalSub}>Select which account statuses to target:</Text>
                <View style={styles.chipRow}>
                  {STATUS_OPTIONS.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => toggleStatus(s)}
                      style={[styles.chip, selectedStatuses.has(s) && { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, selectedStatuses.has(s) && { color: COLORS.white }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={loadClients} disabled={loadingClients} activeOpacity={0.85}>
                    {loadingClients
                      ? <ActivityIndicator color={COLORS.white} size="small" />
                      : <Text style={styles.primaryBtnText}>Load Clients →</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* CONFIRM PHASE */}
            {phase === 'confirm' && (
              <>
                <Text style={styles.modalTitle}>Ready to Send</Text>
                <Text style={styles.modalSub}>
                  {clients.length} client{clients.length !== 1 ? 's' : ''} will receive a personalized AI follow-up via in-app{clients.some(c => c.email) ? ' + email' : ''}.
                </Text>
                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                  {clients.length === 0
                    ? <Text style={{ color: COLORS.gray, textAlign: 'center', marginVertical: 24 }}>No clients match selected statuses.</Text>
                    : clients.map(c => (
                      <View key={c.id} style={styles.clientRow}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[c.account_status] || COLORS.gray }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.clientName}>{c.full_name || c.username}</Text>
                          <Text style={styles.clientMeta}>{c.account_status} · {c.email ? `✉ ${c.email}` : 'in-app only'}</Text>
                        </View>
                        <Text style={styles.clientBalance}>{fmt(c.total_balance)}</Text>
                      </View>
                    ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setPhase('select')}>
                    <Text style={styles.cancelBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, !clients.length && { opacity: 0.4 }]}
                    onPress={startProcessing}
                    disabled={!clients.length}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryBtnText}>Send All ▶</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* PROCESSING PHASE */}
            {phase === 'processing' && (
              <>
                <Text style={styles.modalTitle}>Sending Follow-ups…</Text>
                <Text style={styles.modalSub}>{doneCount} of {clients.length} processed</Text>

                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, {
                    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }]} />
                </View>

                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  {results.map((r, i) => (
                    <View key={r.id} style={styles.resultRow}>
                      {r.status === 'pending' && i === doneCount
                        ? <ActivityIndicator size="small" color={COLORS.navy} style={{ width: 24 }} />
                        : <Text style={[styles.resultIcon, r.status === 'error' && { color: COLORS.red }]}>
                            {r.status === 'success' ? '✓' : r.status === 'error' ? '✗' : '·'}
                          </Text>}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.clientName, r.status === 'success' && { color: COLORS.green }]}>{r.name}</Text>
                        {r.status === 'error' && <Text style={{ fontSize: SIZES.xs, color: COLORS.red }}>{r.note}</Text>}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {/* DONE PHASE */}
            {phase === 'done' && (
              <>
                <Text style={styles.modalTitle}>All Done!</Text>
                <View style={styles.doneSummary}>
                  <Text style={styles.doneNum}>{results.filter(r => r.status === 'success').length}</Text>
                  <Text style={styles.doneLabel}>Messages Sent Successfully</Text>
                </View>
                {results.filter(r => r.status === 'error').length > 0 && (
                  <Text style={{ color: COLORS.red, textAlign: 'center', fontSize: SIZES.sm, marginBottom: 8 }}>
                    {results.filter(r => r.status === 'error').length} failed to send
                  </Text>
                )}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '100%' }]} />
                </View>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {results.map(r => (
                    <View key={r.id} style={styles.resultRow}>
                      <Text style={[styles.resultIcon, { color: r.status === 'success' ? COLORS.green : COLORS.red }]}>
                        {r.status === 'success' ? '✓' : '✗'}
                      </Text>
                      <Text style={styles.clientName}>{r.name}</Text>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={closeModal}>
                  <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.lightBg },
  scroll: { flex: 1 },

  portfolioSection: { padding: 20, paddingBottom: 16 },
  portfolioLabel:   { fontSize: SIZES.xs, color: COLORS.gray, letterSpacing: 0.8, ...FONTS.semiBold, marginBottom: 8 },
  portfolioAmount:  { fontSize: 32, color: COLORS.navy, ...FONTS.extraBold, letterSpacing: -1, marginBottom: 8 },
  portfolioDesc:    { fontSize: SIZES.sm, color: COLORS.gray, lineHeight: 20, marginBottom: 16 },

  followUpButton: {
    backgroundColor: COLORS.navy, borderRadius: SIZES.radiusSm,
    height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  followUpIcon: { color: COLORS.white, fontSize: SIZES.md },
  followUpText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },

  authenticatedBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.greenLight,
    borderRadius: SIZES.radiusSm, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  authenticatedIcon: { color: COLORS.green, fontSize: 16, ...FONTS.bold },
  authenticatedText: { color: COLORS.green, fontSize: SIZES.sm, ...FONTS.bold, letterSpacing: 0.8 },

  statsGrid: { paddingHorizontal: 20, gap: 12, marginBottom: 8 },
  statCard:  {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statCardFull: {},
  statLabel:    { fontSize: SIZES.xs, color: COLORS.gray, letterSpacing: 1, ...FONTS.semiBold, marginBottom: 8 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statValue:    { fontSize: SIZES.xxl, color: COLORS.navy, ...FONTS.extraBold, letterSpacing: -0.5 },
  statBadgeGreen: {
    backgroundColor: COLORS.greenLight, color: COLORS.green,
    fontSize: SIZES.xs, ...FONTS.bold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  statDivider: { marginTop: 12, height: 2, backgroundColor: COLORS.border, borderRadius: 1 },
  miniBarRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 12, height: 32 },
  miniBar:     { flex: 1, borderRadius: 3, minHeight: 4 },
  optimalBadge: { color: COLORS.green, fontSize: SIZES.sm, ...FONTS.bold },
  statSubtext:  { fontSize: SIZES.sm, color: COLORS.gray, marginTop: 6 },
  urgentBadge:  { color: COLORS.red, fontSize: SIZES.sm, ...FONTS.bold },
  avatarGroup:  { flexDirection: 'row', marginTop: 8 },
  miniAvatar:   { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.white },

  sectionTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },
  viewAllText:  { fontSize: SIZES.xs, color: COLORS.navy, ...FONTS.bold, letterSpacing: 0.8 },

  caseCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    marginHorizontal: 20, marginBottom: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  caseTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  criticalBadge: { backgroundColor: '#FDECEA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  criticalBadgeText: { color: COLORS.red, fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.5 },
  caseId:         { fontSize: SIZES.sm, color: COLORS.gray, ...FONTS.semiBold },
  caseName:       { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold, marginBottom: 4 },
  caseAmount:     { fontSize: SIZES.sm, color: COLORS.gray, marginBottom: 10 },
  caseActionRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caseActionIcon: { fontSize: 14, color: COLORS.gray },
  caseActionText: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold, letterSpacing: 0.8 },

  trendCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    marginHorizontal: 20, marginTop: 8, marginBottom: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  trendHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  legendDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.navy },
  trendSubLabel:  { fontSize: SIZES.xs, color: COLORS.gray, marginBottom: 16 },
  trendChart:     { flexDirection: 'row', height: 80, alignItems: 'flex-end', marginBottom: 8 },
  trendDatesRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  trendDateLabel: { fontSize: SIZES.xs, color: COLORS.gray },

  // ── Modal ────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36, maxHeight: '85%',
  },
  dragHandleArea: { alignItems: 'center', paddingVertical: 10, marginTop: -8 },
  dragHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  modalTitle: { fontSize: SIZES.lg, color: COLORS.navy, ...FONTS.extraBold, marginBottom: 6 },
  modalSub:   { fontSize: SIZES.sm, color: COLORS.gray, marginBottom: 20, lineHeight: 18 },

  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  chip:     {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: SIZES.radiusSm, borderWidth: 1.5, borderColor: COLORS.border,
  },
  chipText: { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold },

  modalActions:   { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn:      { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText:  { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.semiBold },
  primaryBtn:     { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: SIZES.radiusSm, backgroundColor: COLORS.navy },
  primaryBtnText: { color: COLORS.white, fontSize: SIZES.sm, ...FONTS.bold },

  clientRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  statusDot:    { width: 10, height: 10, borderRadius: 5 },
  clientName:   { fontSize: SIZES.md, color: COLORS.navy, ...FONTS.semiBold },
  clientMeta:   { fontSize: SIZES.xs, color: COLORS.gray, marginTop: 2 },
  clientBalance: { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold },

  progressTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  progressFill:  { height: 8, backgroundColor: COLORS.navy, borderRadius: 4 },

  resultRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  resultIcon: { fontSize: 18, color: COLORS.green, width: 24, textAlign: 'center', ...FONTS.bold },

  doneSummary: { alignItems: 'center', paddingVertical: 20 },
  doneNum:     { fontSize: 52, color: COLORS.navy, ...FONTS.extraBold },
  doneLabel:   { fontSize: SIZES.sm, color: COLORS.gray, ...FONTS.semiBold, marginTop: 4 },
});
