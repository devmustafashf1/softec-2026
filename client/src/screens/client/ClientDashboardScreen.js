import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { api } from '../../services/api';

const NOTIF_SEEN_KEY = '@notif_last_seen';

const STATUS_CONFIG = {
  CURRENT: { bg: '#EAFAF1', text: '#27AE60' },
  PENDING: { bg: '#EBF5FB', text: '#2980B9' },
  OVERDUE: { bg: '#FDECEA', text: '#E74C3C' },
  PAID:    { bg: '#F0FFF4', text: '#16A34A' },
};
const STATUS_FALLBACK = { bg: '#F2F2F2', text: '#888' };

function fmt(amount) {
  if (amount == null) return '$0.00';
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// Animated tick circle shown when proof is submitted
function SuccessTick({ visible }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.tickCircle, { transform: [{ scale }], opacity }]}>
      <Text style={styles.tickIcon}>✓</Text>
    </Animated.View>
  );
}

export default function ClientDashboardScreen({ route, navigation }) {
  const routeUser = route?.params?.user;
  const [account, setAccount]           = useState(null);
  const [followups, setFollowups]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [lastSeenTime, setLastSeenTime] = useState(null);
  const [latestProof, setLatestProof]   = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_SEEN_KEY).then((val) => {
      if (val) setLastSeenTime(new Date(val));
    });
  }, []);

  const unseenCount = followups.filter((m) => {
    const t = new Date(m.sent_at || m.created_at);
    return !lastSeenTime || t > lastSeenTime;
  }).length;

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { account: acc, followups: msgs } = await api.getClientFollowups();
      setAccount(acc);
      setFollowups(msgs || []);

      if (acc?.id) {
        try {
          const { proofs } = await api.getPaymentProofs(acc.id);
          const sorted = [...(proofs || [])].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          );
          const pending  = sorted.find((p) => p.status === 'PENDING');
          const rejected = sorted.find((p) => p.status === 'REJECTED');
          setLatestProof(pending || rejected || sorted[0] || null);
        } catch {
          // non-critical
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load account data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Track screen focus so the polling interval only runs while on this screen
  const isFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      loadData();
      return () => { isFocused.current = false; };
    }, [loadData])
  );

  // Poll every 5 s so admin-approved proofs show up without any user action
  useEffect(() => {
    const interval = setInterval(() => {
      if (isFocused.current) loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleBellPress   = () => setNotifVisible(true);
  const handleCloseNotif  = async () => {
    setNotifVisible(false);
    const now = new Date().toISOString();
    setLastSeenTime(new Date(now));
    await AsyncStorage.setItem(NOTIF_SEEN_KEY, now);
    try { await api.markFollowupsSeen(); } catch { /* non-critical */ }
  };

  const handleAvatarPress = () => {
    Alert.alert('Account', 'What would you like to do?', [
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(NOTIF_SEEN_KEY);
          navigation.replace('ClientLogin');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const goToPayment = () =>
    navigation.navigate('ClientPaymentProof', { profileId: routeUser?.id || account?.id });

  const totalBalance = Number(account?.total_balance || 0);
  const amountPaid   = Number(account?.amount_paid   || 0);
  const remaining    = totalBalance - amountPaid;
  const percent      = totalBalance > 0 ? Math.min(100, Math.round((amountPaid / totalBalance) * 100)) : 0;
  const status       = account?.account_status || 'CURRENT';
  const statusCfg    = STATUS_CONFIG[status] || STATUS_FALLBACK;

  const isPaid         = status === 'PAID';
  const proofPending   = !isPaid && latestProof?.status === 'PENDING';
  const proofRejected  = !isPaid && latestProof?.status === 'REJECTED';
  const showBalanceCard = !isPaid && !proofPending;

  // ── Main card rendering ───────────────────────────────────────
  const renderMainCard = () => {
    // State 1: Admin verified payment → No payment due
    if (isPaid) {
      return (
        <View style={styles.stateCard}>
          <View style={[styles.stateIconCircle, { backgroundColor: '#EAFAF1' }]}>
            <Text style={styles.stateIconText}>✓</Text>
          </View>
          <Text style={styles.stateTitle}>No Payment Due</Text>
          <Text style={styles.stateSub}>
            Your payment has been verified by your account manager. You are all caught up.
          </Text>
          <View style={styles.statePillRow}>
            <View style={[styles.statePill, { backgroundColor: '#EAFAF1' }]}>
              <Text style={[styles.statePillText, { color: '#27AE60' }]}>PAID</Text>
            </View>
            {account?.next_review ? (
              <View style={styles.statePill}>
                <Text style={styles.statePillText}>Next: {account.next_review}</Text>
              </View>
            ) : null}
          </View>
        </View>
      );
    }

    // State 2: Proof submitted, waiting for admin
    if (proofPending) {
      return (
        <View style={styles.stateCard}>
          <SuccessTick visible />
          <Text style={styles.stateTitle}>Proof Sent to Admin</Text>
          <Text style={styles.stateSub}>
            Your payment proof has been submitted and is awaiting verification. We'll update your status once reviewed.
          </Text>
          <View style={styles.proofDetailBox}>
            <Text style={styles.proofDetailLabel}>REF</Text>
            <Text style={styles.proofDetailValue}>{latestProof.reference_number}</Text>
          </View>
          <View style={styles.proofDetailBox}>
            <Text style={styles.proofDetailLabel}>SUBMITTED</Text>
            <Text style={styles.proofDetailValue}>{timeAgo(latestProof.created_at)}</Text>
          </View>
          <Text style={styles.stateHint}>Pull down to refresh and check for updates.</Text>
        </View>
      );
    }

    // State 3: Proof rejected by admin
    if (proofRejected) {
      return (
        <View style={[styles.stateCard, styles.stateCardRejected]}>
          <View style={[styles.stateIconCircle, { backgroundColor: '#FDECEA' }]}>
            <Text style={[styles.stateIconText, { color: '#E74C3C' }]}>✕</Text>
          </View>
          <Text style={[styles.stateTitle, { color: '#C0392B' }]}>Proof Rejected</Text>
          <Text style={styles.stateSub}>
            Your admin has rejected the submitted proof. Please verify your payment details and resubmit with a valid receipt.
          </Text>
          <View style={styles.stateMeta}>
            <Text style={styles.stateMetaLabel}>AMOUNT DUE</Text>
            <Text style={[styles.stateMetaValue, { color: '#E74C3C' }]}>{fmt(totalBalance)}</Text>
          </View>
          <TouchableOpacity style={styles.resubmitButton} onPress={goToPayment} activeOpacity={0.85}>
            <Text style={styles.resubmitButtonText}>📋  Pay Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // State 4: Default — show balance card with pay button
    return (
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>TOTAL BALANCE DUE</Text>
        <Text style={styles.balanceAmount}>{fmt(totalBalance)}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusTag, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{status}</Text>
          </View>
          {account?.next_review ? (
            <Text style={styles.nextReview}>Next review: {account.next_review}</Text>
          ) : null}
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>PROGRESS</Text>
              <Text style={styles.progressValue}>{percent}% Collected</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.progressLabel}>REMAINING</Text>
              <Text style={styles.progressValueAlt}>{fmt(remaining)}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AMOUNT PAID</Text>
            <Text style={styles.statValue}>{fmt(amountPaid)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>OBLIGATION</Text>
            <Text style={styles.statValue}>{fmt(totalBalance)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.paidButton} onPress={goToPayment} activeOpacity={0.85}>
          <Text style={styles.paidButtonIcon}>📋</Text>
          <Text style={styles.paidButtonText}>I've Paid This</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DueAssist</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} onPress={handleBellPress} activeOpacity={0.7}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unseenCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unseenCount > 9 ? '9+' : unseenCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress} activeOpacity={0.8}>
            <Text style={styles.avatarText}>{initials(account?.full_name)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification modal */}
      <Modal visible={notifVisible} animationType="slide" transparent onRequestClose={handleCloseNotif}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>NOTIFICATIONS</Text>
              <TouchableOpacity onPress={handleCloseNotif} activeOpacity={0.7}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {followups.length === 0 ? (
                <Text style={styles.emptyMsg}>No messages from your account manager yet.</Text>
              ) : (
                followups.map((msg) => {
                  const s   = msg.status_at_time || 'CURRENT';
                  const cfg = STATUS_CONFIG[s] || STATUS_FALLBACK;
                  return (
                    <View key={msg.id} style={styles.notifCard}>
                      <View style={styles.notifCardHeader}>
                        <View style={[styles.msgStatusBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.msgStatusText, { color: cfg.text }]}>{s}</Text>
                        </View>
                        <Text style={styles.notifTime}>{timeAgo(msg.sent_at || msg.created_at)}</Text>
                      </View>
                      <View style={styles.paymentDueRow}>
                        <Text style={styles.paymentDueLabel}>AMOUNT DUE</Text>
                        <Text style={styles.paymentDueValue}>{fmt(totalBalance)}</Text>
                        {msg.days_late > 0 && (
                          <View style={styles.daysLateChip}>
                            <Text style={styles.daysLateText}>{msg.days_late}d overdue</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.notifContent}>{msg.content}</Text>
                    </View>
                  );
                })
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.navy]} tintColor={COLORS.navy} />
          }
        >
          {renderMainCard()}

          {/* Followups section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>FOLLOWUPS</Text>
              <Text style={styles.sectionCount}>{followups.length} message{followups.length !== 1 ? 's' : ''}</Text>
            </View>

            {followups.length === 0 ? (
              <Text style={styles.emptyMsg}>No follow-up messages yet.</Text>
            ) : (
              followups.map((msg) => {
                const s   = msg.status_at_time || 'CURRENT';
                const cfg = STATUS_CONFIG[s] || STATUS_FALLBACK;
                return (
                  <View key={msg.id} style={styles.followupCard}>
                    <View style={styles.followupHeader}>
                      <View style={[styles.msgStatusBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.msgStatusText, { color: cfg.text }]}>{s}</Text>
                      </View>
                      <Text style={styles.followupTime}>{timeAgo(msg.sent_at || msg.created_at)}</Text>
                    </View>
                    <View style={styles.paymentDueRow}>
                      <Text style={styles.paymentDueLabel}>AMOUNT DUE</Text>
                      <Text style={styles.paymentDueValue}>{fmt(totalBalance)}</Text>
                      {msg.days_late > 0 && (
                        <View style={styles.daysLateChip}>
                          <Text style={styles.daysLateText}>{msg.days_late}d overdue</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.followupContent}>{msg.content}</Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLORS.lightBg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn:     { padding: 4, position: 'relative' },
  bellIcon:    { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: -2, right: -4,
    minWidth: 18, height: 18,
    borderRadius: 9,
    backgroundColor: '#E74C3C',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, color: COLORS.white, ...FONTS.bold },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: SIZES.sm, color: COLORS.white, ...FONTS.bold },

  /* Notification modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold, letterSpacing: 1.2 },
  modalClose:  { fontSize: 18, color: COLORS.gray, paddingHorizontal: 4 },
  notifCard: { backgroundColor: COLORS.lightBg, borderRadius: SIZES.radiusSm, padding: 14, marginBottom: 10 },
  notifCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  notifTime:    { fontSize: SIZES.xs, color: COLORS.grayLight, ...FONTS.regular },
  notifContent: { fontSize: SIZES.sm, color: COLORS.navy, lineHeight: 20, ...FONTS.regular },

  scroll: { flex: 1 },

  /* ── State cards (pending / paid / rejected) ── */
  stateCard: {
    margin: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stateCardRejected: {
    borderWidth: 1,
    borderColor: '#F5C6C0',
  },

  /* Animated tick */
  tickCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EAFAF1',
    borderWidth: 3, borderColor: '#A9DFBF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  tickIcon: { fontSize: 36, color: '#27AE60' },

  /* State icon (static, for paid / rejected) */
  stateIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  stateIconText: { fontSize: 36, color: '#27AE60' },

  stateTitle: { fontSize: SIZES.xl, color: COLORS.navy, ...FONTS.extraBold, textAlign: 'center', marginBottom: 10 },
  stateSub:   { fontSize: SIZES.sm, color: COLORS.gray, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  stateHint:  { fontSize: SIZES.xs, color: COLORS.grayLight, textAlign: 'center', marginTop: 16 },

  statePillRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statePill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.lightBg,
  },
  statePillText: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.bold, letterSpacing: 0.6 },

  proofDetailBox: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  proofDetailLabel: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold, letterSpacing: 0.8 },
  proofDetailValue: { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold },

  stateMeta: { alignItems: 'center', marginBottom: 20 },
  stateMetaLabel: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold, letterSpacing: 1, marginBottom: 4 },
  stateMetaValue: { fontSize: 28, ...FONTS.extraBold },

  resubmitButton: {
    width: '100%',
    backgroundColor: '#E74C3C',
    borderRadius: SIZES.radiusSm,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resubmitButtonText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },

  /* ── Default balance card ── */
  balanceCard: {
    margin: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel:  { fontSize: SIZES.xs, color: COLORS.gray, letterSpacing: 1.2, ...FONTS.semiBold, marginBottom: 4 },
  balanceAmount: { fontSize: 34, color: '#E74C3C', ...FONTS.extraBold, marginBottom: 8 },
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  statusTag:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  statusText:    { fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.5 },
  nextReview:    { fontSize: SIZES.sm, color: COLORS.gray },

  progressSection:  { marginBottom: 16 },
  progressHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel:    { fontSize: SIZES.xs, color: COLORS.gray, letterSpacing: 1, ...FONTS.semiBold, marginBottom: 2 },
  progressValue:    { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },
  progressValueAlt: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },
  progressTrack:    { height: 8, backgroundColor: COLORS.lightBg, borderRadius: 4, overflow: 'hidden' },
  progressFill:     { height: '100%', backgroundColor: COLORS.navy, borderRadius: 4 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: COLORS.lightBg, borderRadius: SIZES.radiusSm, padding: 14 },
  statLabel: { fontSize: SIZES.xs, color: COLORS.gray, letterSpacing: 1, ...FONTS.semiBold, marginBottom: 4 },
  statValue: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },

  paidButton: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  paidButtonIcon: { fontSize: 16 },
  paidButtonText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },

  /* Followups section */
  section: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle:     { fontSize: SIZES.xs, color: COLORS.gray, letterSpacing: 1.2, ...FONTS.bold },
  sectionCount:     { fontSize: SIZES.xs, color: COLORS.navy, ...FONTS.bold },
  emptyMsg:         { fontSize: SIZES.sm, color: COLORS.gray, textAlign: 'center', paddingVertical: 12 },

  followupCard: {
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.lightBg,
    padding: 14, marginBottom: 10,
  },
  followupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  msgStatusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  msgStatusText:  { fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.4 },
  followupTime:   { fontSize: SIZES.xs, color: COLORS.grayLight, ...FONTS.regular },

  paymentDueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border || '#EFEFEF',
  },
  paymentDueLabel: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold, letterSpacing: 0.8 },
  paymentDueValue: { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold },
  daysLateChip:    { backgroundColor: '#FDECEA', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  daysLateText:    { fontSize: SIZES.xs, color: '#E74C3C', ...FONTS.bold },
  followupContent: { fontSize: SIZES.sm, color: COLORS.navy, lineHeight: 20, ...FONTS.regular },
});
