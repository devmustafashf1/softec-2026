import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';
import { api } from '../services/api';

const STATUS_CYCLE  = ['CURRENT', 'PENDING', 'OVERDUE', 'PAID'];

const STATUS_CONFIG = {
  CURRENT: { bg: '#EAFAF1', text: '#27AE60' },
  PENDING: { bg: '#EBF5FB', text: '#2980B9' },
  OVERDUE: { bg: '#FDECEA', text: '#E74C3C' },
  PAID:    { bg: '#F0FFF4', text: '#16A34A' },
};

const STATUS_BADGE_FALLBACK = { bg: '#F2F2F2', text: '#888' };

function fmt(amount) {
  if (amount == null) return '$0.00';
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AccountDetailScreen({ route, navigation }) {
  const { account: initialAccount } = route.params;

  const [account, setAccount]         = useState(initialAccount);
  const [messages, setMessages]       = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [statusChanging, setStatusChanging]   = useState(false);
  const [generating, setGenerating]           = useState(false);
  const [deletingId, setDeletingId]           = useState(null);
  const [proofs, setProofs]                   = useState([]);
  const [proofsLoading, setProofsLoading]     = useState(true);
  const [updatingProofId, setUpdatingProofId] = useState(null);

  const status    = account.account_status || account.status || 'CURRENT';
  const statusCfg = STATUS_CONFIG[status] || STATUS_BADGE_FALLBACK;

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      const { messages: data } = await api.getAccountMessages(account.id);
      setMessages(data || []);
    } catch {
      // non-critical — silently fail
    } finally {
      setMessagesLoading(false);
    }
  }, [account.id]);

  const loadProofs = useCallback(async () => {
    setProofsLoading(true);
    try {
      const { proofs: data } = await api.getPaymentProofs(account.id);
      setProofs(data || []);
    } catch {
      // non-critical — silently fail
    } finally {
      setProofsLoading(false);
    }
  }, [account.id]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      loadProofs();
    }, [loadMessages, loadProofs])
  );

  const handleChangeStatus = async () => {
    const currentIdx = STATUS_CYCLE.indexOf(status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    Alert.alert(
      'Change Status',
      `Change status from ${status} → ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setStatusChanging(true);
            try {
              const { account_status } = await api.changeAccountStatus(account.id, nextStatus);
              setAccount((prev) => ({ ...prev, account_status }));
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not update status.');
            } finally {
              setStatusChanging(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteMessage = (msg) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(msg.id);
            try {
              await api.deleteMessage(account.id, msg.id);
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete message.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = (msg) => {
    Alert.alert(
      'Send Follow-up',
      'Send this message to the client portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await api.sendMessage(account.id, msg.id);
              setMessages((prev) =>
                prev.map((m) => m.id === msg.id ? { ...m, is_sent: true } : m)
              );
              Alert.alert('Sent', 'Message delivered to the client portal.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not send message.');
            }
          },
        },
      ]
    );
  };

  const handleGenerateMessage = async () => {
    setGenerating(true);
    try {
      const { message } = await api.generateMessage(account.id);
      setMessages((prev) => [message, ...prev]);
    } catch (err) {
      Alert.alert('Error', err.message || 'AI generation failed. Check your API key.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateProofStatus = (proof, newStatus) => {
    Alert.alert(
      'Update Proof Status',
      `Mark this proof as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdatingProofId(proof.id);
            try {
              await api.updateProofStatus(account.id, proof.id, newStatus);
              setProofs((prev) => prev.map((p) => p.id === proof.id ? { ...p, status: newStatus } : p));
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not update proof status.');
            } finally {
              setUpdatingProofId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopNavBar navigation={navigation} showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.headerSection}>
          <View style={styles.accountMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.text }]}>{status}</Text>
            </View>
            {account.company_name ? (
              <Text style={styles.accountTypeLabel}>{account.company_name}</Text>
            ) : null}
          </View>

          <Text style={styles.accountName}>{account.full_name || account.name}</Text>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>👤</Text>
            <Text style={styles.contactText}>@{account.username}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>PAYMENT AMOUNT</Text>
              <Text style={styles.metaValue}>{fmt(account.total_balance)}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>INTERVAL</Text>
              <Text style={styles.metaValue}>{account.next_review || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionPrimary, generating && styles.actionDisabled]}
            onPress={handleGenerateMessage}
            disabled={generating}
            activeOpacity={0.85}
          >
            {generating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionPrimaryText}>✦  Generate AI Message</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionSecondary, styles.actionTertiary, statusChanging && styles.actionDisabled]}
            onPress={handleChangeStatus}
            disabled={statusChanging}
            activeOpacity={0.85}
          >
            {statusChanging ? (
              <ActivityIndicator color={COLORS.navy} />
            ) : (
              <Text style={styles.actionSecondaryText}>
                ⇄  Change Status  ({status} → {STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length]})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── AI Messages ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI FOLLOW-UP MESSAGES</Text>
          <Text style={styles.sectionCount}>{messages.length} total</Text>
        </View>

        {messagesLoading ? (
          <View style={styles.messagesLoading}>
            <ActivityIndicator color={COLORS.navy} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyMsg}>No messages yet. Tap "Generate AI Message" to create one.</Text>
          </View>
        ) : (
          messages.map((msg) => {
            const s   = msg.status_at_time || 'CURRENT';
            const cfg = STATUS_CONFIG[s] || STATUS_BADGE_FALLBACK;

            let contextChip = null;
            if (s === 'PAID') {
              contextChip = <Text style={styles.paidChip}>✓ Payment received</Text>;
            } else if (s === 'OVERDUE' && msg.days_late > 0) {
              contextChip = <Text style={styles.daysLateText}>{msg.days_late}d overdue</Text>;
            } else if (s === 'OVERDUE') {
              contextChip = <Text style={styles.daysLateText}>Overdue</Text>;
            } else if (s === 'PENDING') {
              contextChip = <Text style={styles.pendingChip}>Payment pending</Text>;
            }

            const isDeleting = deletingId === msg.id;

            return (
              <View key={msg.id} style={styles.messageCard}>
                {/* Message header: status badge + time */}
                <View style={styles.messageCardHeader}>
                  <View style={styles.messageMetaRow}>
                    <View style={[styles.msgStatusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.msgStatusText, { color: cfg.text }]}>{s}</Text>
                    </View>
                    {contextChip}
                    {msg.is_sent ? (
                      <View style={styles.sentChip}>
                        <Text style={styles.sentChipText}>✓ Sent</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.messageTime}>{timeAgo(msg.created_at)}</Text>
                </View>

                {/* Message body */}
                <Text style={styles.messageContent}>{msg.content}</Text>

                {/* Divider */}
                <View style={styles.messageDivider} />

                {/* Action buttons — right-aligned */}
                <View style={styles.messageActions}>
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={() => handleSendMessage(msg)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sendBtnText}>Send</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteBtn, isDeleting && styles.actionDisabled]}
                    onPress={() => handleDeleteMessage(msg)}
                    disabled={isDeleting}
                    activeOpacity={0.8}
                  >
                    {isDeleting ? (
                      <ActivityIndicator color="#E74C3C" size="small" />
                    ) : (
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* ── Payment Proofs ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PAYMENT PROOFS</Text>
          <Text style={styles.sectionCount}>{proofs.length} submitted</Text>
        </View>

        {proofsLoading ? (
          <View style={styles.messagesLoading}>
            <ActivityIndicator color={COLORS.navy} />
          </View>
        ) : proofs.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyMsg}>No payment proofs submitted yet.</Text>
          </View>
        ) : (
          proofs.map((proof) => {
            const PROOF_STATUS = {
              PENDING:  { bg: '#EBF5FB', text: '#2980B9' },
              VERIFIED: { bg: '#EAFAF1', text: '#27AE60' },
              REJECTED: { bg: '#FDECEA', text: '#E74C3C' },
            };
            const cfg        = PROOF_STATUS[proof.status] || PROOF_STATUS.PENDING;
            const isUpdating = updatingProofId === proof.id;

            return (
              <View key={proof.id} style={styles.proofCard}>
                <Image source={{ uri: proof.image_url }} style={styles.proofImage} resizeMode="cover" />
                <View style={styles.proofBody}>
                  <View style={styles.proofHeaderRow}>
                    <View style={[styles.proofStatusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.proofStatusText, { color: cfg.text }]}>{proof.status}</Text>
                    </View>
                    <Text style={styles.messageTime}>{timeAgo(proof.created_at)}</Text>
                  </View>
                  <Text style={styles.proofRef}>Ref: {proof.reference_number}</Text>
                  {proof.note ? <Text style={styles.proofNote}>{proof.note}</Text> : null}

                  {isUpdating ? (
                    <ActivityIndicator color={COLORS.navy} style={{ marginTop: 10 }} />
                  ) : (
                    <View style={styles.proofActions}>
                      {proof.status !== 'VERIFIED' && (
                        <TouchableOpacity
                          style={styles.verifyBtn}
                          onPress={() => handleUpdateProofStatus(proof, 'VERIFIED')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.verifyBtnText}>Verify</Text>
                        </TouchableOpacity>
                      )}
                      {proof.status !== 'REJECTED' && (
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleUpdateProofStatus(proof, 'REJECTED')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.lightBg },
  scroll: { paddingBottom: 16 },

  /* Header */
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    marginBottom: 12,
  },
  accountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.5 },
  accountTypeLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.semiBold,
    letterSpacing: 0.6,
  },
  accountName: {
    fontSize: SIZES.xxxl,
    color: COLORS.navy,
    ...FONTS.extraBold,
    lineHeight: 42,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  contactIcon: { fontSize: 13 },
  contactText: { fontSize: SIZES.sm, color: COLORS.gray, ...FONTS.medium },

  metaRow: { flexDirection: 'row', gap: 10 },
  metaBox: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    borderRadius: SIZES.radiusSm,
    padding: 12,
  },
  metaLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.semiBold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: { fontSize: SIZES.md, color: COLORS.navy, ...FONTS.bold },

  /* Actions */
  actionsSection: { marginHorizontal: 16, marginBottom: 12, gap: 10 },
  actionPrimary: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimaryText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    ...FONTS.bold,
    letterSpacing: 0.8,
  },
  actionSecondary: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 1,
  },
  actionTertiary: { borderColor: COLORS.navy },
  actionSecondaryText: { color: COLORS.navy, fontSize: SIZES.sm, ...FONTS.bold, letterSpacing: 0.5 },
  actionDisabled: { opacity: 0.6 },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 1.2,
  },
  sectionCount: { fontSize: SIZES.xs, color: COLORS.navy, ...FONTS.bold },

  /* Messages */
  messagesLoading: { alignItems: 'center', paddingVertical: 24 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 2,
  },
  emptyMsg: { color: COLORS.gray, fontSize: SIZES.sm, textAlign: 'center', lineHeight: 20 },

  messageCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  messageDivider: {
    height: 1,
    backgroundColor: COLORS.border || '#EFEFEF',
    marginTop: 12,
    marginBottom: 10,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.navy,
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: SIZES.xs,
    ...FONTS.bold,
    letterSpacing: 0.4,
  },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C6C0',
  },
  deleteBtnText: {
    color: '#E74C3C',
    fontSize: SIZES.xs,
    ...FONTS.bold,
    letterSpacing: 0.4,
  },
  messageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  messageMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgStatusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  msgStatusText:  { fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.4 },
  daysLateText:  { fontSize: SIZES.xs, color: '#E74C3C', ...FONTS.semiBold },
  sentChip:      { backgroundColor: '#EAFAF1', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  sentChipText:  { fontSize: SIZES.xs, color: '#27AE60', ...FONTS.bold },
  paidChip:      { fontSize: SIZES.xs, color: '#16A34A', ...FONTS.semiBold },
  pendingChip:   { fontSize: SIZES.xs, color: '#2980B9', ...FONTS.semiBold },
  messageTime:    { fontSize: SIZES.xs, color: COLORS.grayLight, ...FONTS.regular },
  messageContent: {
    fontSize: SIZES.sm,
    color: COLORS.navy,
    lineHeight: 21,
    ...FONTS.regular,
  },

  /* Payment Proofs */
  proofCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  proofImage: { width: '100%', height: 180 },
  proofBody:  { padding: 14 },
  proofHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proofStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  proofStatusText:  { fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.4 },
  proofRef:   { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.semiBold, marginBottom: 4 },
  proofNote:  { fontSize: SIZES.sm, color: COLORS.gray, lineHeight: 18, marginBottom: 8 },
  proofActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  verifyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EAFAF1',
    borderWidth: 1,
    borderColor: '#A9DFBF',
  },
  verifyBtnText: { color: '#27AE60', fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.4 },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C6C0',
  },
  rejectBtnText: { color: '#E74C3C', fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.4 },
});
