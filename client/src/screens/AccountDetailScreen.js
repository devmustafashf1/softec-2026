import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
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
  const [sendModal, setSendModal]             = useState(null);
  const [emailEnabled, setEmailEnabled]       = useState(false);
  const [sending, setSending]                 = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      api.getPaymentProofs(account.id)
        .then(({ proofs: data }) => setProofs(data || []))
        .catch(() => {});
    }, [loadMessages, account.id])
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
    setEmailEnabled(!!account.email);
    setSendModal(msg);
  };

  const confirmSend = async () => {
    if (!sendModal) return;
    setSending(true);
    try {
      const { emailWarning } = await api.sendMessage(account.id, sendModal.id, { sendEmail: emailEnabled });
      setMessages((prev) =>
        prev.map((m) => m.id === sendModal.id ? { ...m, is_sent: true } : m)
      );
      setSendModal(null);
      const successMsg = emailEnabled && account.email
        ? 'Message sent to client portal and email.'
        : 'Message delivered to the client portal.';
      Alert.alert('Sent', emailWarning || successMsg);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
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

  const pendingProofs  = proofs.filter((p) => p.status === 'PENDING').length;
  const verifiedProofs = proofs.filter((p) => p.status === 'VERIFIED').length;

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

        {/* ── Payment Proofs Summary ── */}
        {proofs.length > 0 && (
          <View style={styles.proofSummaryCard}>
            <Text style={styles.proofSummaryTitle}>PAYMENT PROOFS</Text>
            <View style={styles.proofSummaryRow}>
              {pendingProofs > 0 && (
                <View style={styles.proofSummaryChip}>
                  <View style={styles.proofSummaryDot} />
                  <Text style={styles.proofSummaryText}>
                    {pendingProofs} in review
                  </Text>
                </View>
              )}
              {verifiedProofs > 0 && (
                <View style={[styles.proofSummaryChip, styles.proofSummaryChipGreen]}>
                  <Text style={styles.proofSummaryTextGreen}>
                    ✔ {verifiedProofs} verified
                  </Text>
                </View>
              )}
              <Text style={styles.proofSummaryHint}>
                See Payments tab for details
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Send Modal ── */}
      <Modal
        visible={!!sendModal}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!sending) setSendModal(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sendModal}>
            <Text style={styles.sendModalTitle}>Send Follow-up</Text>

            {/* Message preview */}
            <View style={styles.sendPreview}>
              <Text style={styles.sendPreviewText} numberOfLines={4}>
                {sendModal?.content}
              </Text>
            </View>

            {/* Channel toggles */}
            <View style={styles.channelRow}>
              <View style={styles.channelInfo}>
                <Text style={styles.channelLabel}>In-App Notification</Text>
                <Text style={styles.channelSub}>Always delivered to client portal</Text>
              </View>
              <Switch
                value={true}
                disabled
                trackColor={{ true: COLORS.navy }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.channelRow}>
              <View style={styles.channelInfo}>
                <Text style={styles.channelLabel}>Email</Text>
                <Text style={styles.channelSub}>
                  {account.email ? account.email : 'No email on record'}
                </Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                disabled={!account.email}
                trackColor={{ false: COLORS.border, true: COLORS.navy }}
                thumbColor={COLORS.white}
              />
            </View>

            {/* Actions */}
            <View style={styles.sendModalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setSendModal(null)}
                disabled={sending}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSendBtn, sending && styles.actionDisabled]}
                onPress={confirmSend}
                disabled={sending}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.confirmSendText}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  proofSummaryCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 14,
    elevation: 1,
  },
  proofSummaryTitle: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  proofSummaryRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  proofSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  proofSummaryChipGreen: { backgroundColor: '#EAFAF1' },
  proofSummaryDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2980B9' },
  proofSummaryText: { fontSize: SIZES.xs, color: '#2980B9', ...FONTS.bold },
  proofSummaryTextGreen: { fontSize: SIZES.xs, color: '#27AE60', ...FONTS.bold },
  proofSummaryHint: { fontSize: SIZES.xs, color: COLORS.grayLight, ...FONTS.regular },

  /* Send Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sendModal: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    width: '100%',
  },
  sendModalTitle: {
    fontSize: SIZES.lg,
    color: COLORS.navy,
    ...FONTS.extraBold,
    marginBottom: 14,
  },
  sendPreview: {
    backgroundColor: COLORS.lightBg,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    marginBottom: 16,
  },
  sendPreviewText: {
    fontSize: SIZES.sm,
    color: COLORS.navy,
    lineHeight: 20,
    ...FONTS.regular,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  channelInfo: { flex: 1, marginRight: 12 },
  channelLabel: { fontSize: SIZES.md, color: COLORS.navy, ...FONTS.semiBold },
  channelSub: { fontSize: SIZES.xs, color: COLORS.gray, marginTop: 2 },
  sendModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: { fontSize: SIZES.md, color: COLORS.gray, ...FONTS.semiBold },
  confirmSendBtn: {
    flex: 1,
    height: 46,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSendText: { fontSize: SIZES.md, color: COLORS.white, ...FONTS.bold },
});
