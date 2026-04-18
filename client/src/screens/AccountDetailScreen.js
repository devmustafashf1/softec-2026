import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';

const DETAIL_DATA = {
  '1': {
    accountType: 'ENTERPRISE ACCOUNT',
    accountId: '4521-AR',
    email: 'contact@arlington.com',
    phone: '+1 (555) 847-2391',
    location: 'Arlington, TX',
    recoveryIndex: '-3.45%',
    recoveryDesc:
      'Recovery risk elevated due to prolonged aging and inconsistent payment history across tier-2 brackets.',
    interactions: [
      {
        id: 'i1', date: 'OCT 24, 2023 • 09:17 AM', dot: 'orange',
        title: 'Notice of Intent Delivered',
        desc: 'Formal communication dispatched via registered courier. Receipt confirmed at corporate headquarters. Response pending verification.',
      },
      {
        id: 'i2', date: 'OCT 18, 2023 • 03:45 PM', dot: 'green',
        title: 'Automated Balance Inquiry',
        desc: 'Client accessed sovereign portal to view outstanding liabilities and payment schedules. No action taken.',
      },
      {
        id: 'i3', date: 'SEP 12, 2023 • 11:30 AM', dot: 'blue',
        title: 'Partial Payment Received',
        desc: 'Credit of $5,000.00 processed via wire transfer. Applied to oldest outstanding ledger entry.',
      },
    ],
    notes: [
      {
        id: 'n1', author: 'COLLECTOR NOTE • J. DOE', time: '2d ago',
        content: '"Arlington indicated a portfolio rebalancing is in progress. Expect full settlement by end of fiscal Q4. Flagged for monitor."',
      },
      {
        id: 'n2', author: 'SYSTEM ALERT', time: '1hr ago',
        content: 'Risk level decreased by 5% following asset verification in Texas jurisdiction.',
      },
    ],
    settlements: [
      { id: 's1', type: 'Wire Transfer #4291', date: 'AUG 14, 2023', amount: '$5,000.00' },
      { id: 's2', type: 'Escrow Drawdown', date: 'JUL 02, 2023', amount: '$12,400.00' },
      { id: 's3', type: 'Direct Deposit', date: 'MAY 25, 2023', amount: '$8,900.00' },
    ],
  },
  '2': {
    accountType: 'PREMIUM ACCOUNT',
    accountId: '8821-GT',
    email: 'billing@globaltech.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    recoveryIndex: '+2.10%',
    recoveryDesc:
      'High likelihood of recovery based on asset liquidity and historical payment consistency in tier-1 brackets.',
    interactions: [
      {
        id: 'i1', date: 'NOV 01, 2023 • 10:00 AM', dot: 'blue',
        title: 'Payment Reminder Sent',
        desc: 'Automated reminder dispatched via email for upcoming balance due in 8 days.',
      },
      {
        id: 'i2', date: 'OCT 25, 2023 • 02:15 PM', dot: 'green',
        title: 'Invoice Confirmed',
        desc: 'Client confirmed receipt of invoice #GT-2023-098. EFT processing underway.',
      },
    ],
    notes: [
      {
        id: 'n1', author: 'ACCOUNT NOTE • M. CHEN', time: '3d ago',
        content: '"Global Tech is expanding Q4 operations. Budget approval expected within the week. Payment likely ahead of schedule."',
      },
    ],
    settlements: [
      { id: 's1', type: 'Wire Transfer #8821', date: 'SEP 30, 2023', amount: '$15,000.00' },
      { id: 's2', type: 'Direct Deposit', date: 'AUG 15, 2023', amount: '$9,400.00' },
    ],
  },
  '3': {
    accountType: 'STANDARD ACCOUNT',
    accountId: '3301-NS',
    email: 'accounts@northstar.com',
    phone: '+1 (555) 765-4321',
    location: 'Denver, CO',
    recoveryIndex: '+5.00%',
    recoveryDesc:
      'Account in good standing. Full payment received. Eligible for priority service tier upgrade.',
    interactions: [
      {
        id: 'i1', date: 'OCT 30, 2023 • 08:45 AM', dot: 'green',
        title: 'Full Payment Confirmed',
        desc: 'Final balance of $8,200.00 cleared. Account marked as settled. Reference #9928-AX generated.',
      },
      {
        id: 'i2', date: 'OCT 15, 2023 • 01:30 PM', dot: 'blue',
        title: 'Final Invoice Issued',
        desc: 'Closing invoice dispatched. Payment terms acknowledged by client representative.',
      },
    ],
    notes: [
      {
        id: 'n1', author: 'SYSTEM NOTE', time: '5d ago',
        content: 'Account settled in full. All ledger entries reconciled. Eligible for loyalty program enrollment.',
      },
    ],
    settlements: [
      { id: 's1', type: 'Wire Transfer #9928', date: 'OCT 30, 2023', amount: '$8,200.00' },
    ],
  },
  '4': {
    accountType: 'ENTERPRISE ACCOUNT',
    accountId: '9910-AP',
    email: 'finance@apexretail.com',
    phone: '+1 (555) 321-9876',
    location: 'New York, NY',
    recoveryIndex: '-8.90%',
    recoveryDesc:
      'Critical risk level. Prolonged aging of 92 days with no active payment intent. Immediate escalation recommended.',
    interactions: [
      {
        id: 'i1', date: 'OCT 20, 2023 • 11:00 AM', dot: 'orange',
        title: 'Escalation Notice Filed',
        desc: 'Account escalated to senior collections team. Legal review initiated for potential litigation path.',
      },
      {
        id: 'i2', date: 'SEP 28, 2023 • 09:30 AM', dot: 'orange',
        title: 'Final Demand Letter Sent',
        desc: 'Third and final demand letter sent via certified mail and email. No response received to date.',
      },
      {
        id: 'i3', date: 'SEP 01, 2023 • 02:00 PM', dot: 'blue',
        title: 'Account Review Conducted',
        desc: 'Internal risk assessment updated. Exposure classification raised to critical threshold.',
      },
    ],
    notes: [
      {
        id: 'n1', author: 'LEGAL NOTE • R. PATEL', time: '1d ago',
        content: '"Apex legal team unresponsive. Recommending external counsel engagement. Possible asset seizure review required."',
      },
      {
        id: 'n2', author: 'SYSTEM ALERT', time: '3d ago',
        content: 'Account flagged for immediate escalation. Risk score exceeded critical threshold.',
      },
    ],
    settlements: [
      { id: 's1', type: 'Partial Wire #7751', date: 'JUL 12, 2023', amount: '$25,000.00' },
      { id: 's2', type: 'Check Payment', date: 'MAY 30, 2023', amount: '$18,500.00' },
    ],
  },
  '5': {
    accountType: 'STANDARD ACCOUNT',
    accountId: '5521-ZM',
    email: 'billing@zenithmedia.com',
    phone: '+1 (555) 456-7890',
    location: 'Los Angeles, CA',
    recoveryIndex: '-1.20%',
    recoveryDesc:
      'Minor aging detected. Early intervention recommended to prevent further escalation to tier-2.',
    interactions: [
      {
        id: 'i1', date: 'NOV 02, 2023 • 10:30 AM', dot: 'orange',
        title: 'Initial Overdue Notice',
        desc: 'Automated overdue notification sent via email and SMS. Client portal accessed same day.',
      },
    ],
    notes: [
      {
        id: 'n1', author: 'ACCOUNT NOTE • T. JAMES', time: '1d ago',
        content: '"Zenith facing post-production budget delays. Promised payment within 14 days. Monitoring closely."',
      },
    ],
    settlements: [
      { id: 's1', type: 'Direct Deposit', date: 'SEP 15, 2023', amount: '$3,450.00' },
    ],
  },
  '6': {
    accountType: 'PREMIUM ACCOUNT',
    accountId: '6602-PR',
    email: 'accounts@pacificridge.com',
    phone: '+1 (555) 567-8901',
    location: 'Seattle, WA',
    recoveryIndex: '+1.80%',
    recoveryDesc:
      'Strong financial indicators. Minor delay flagged due to end-of-quarter processing cycles.',
    interactions: [
      {
        id: 'i1', date: 'OCT 29, 2023 • 09:00 AM', dot: 'blue',
        title: 'Payment Reminder Issued',
        desc: 'Courtesy reminder sent for balance due in 3 days. Client confirmed receipt via portal.',
      },
      {
        id: 'i2', date: 'OCT 20, 2023 • 11:45 AM', dot: 'green',
        title: 'Invoice Acknowledged',
        desc: 'Pacific Ridge CFO acknowledged invoice #PR-2023-112 via email. EFT processing initiated.',
      },
    ],
    notes: [
      {
        id: 'n1', author: 'ACCOUNT NOTE • S. PARK', time: '4d ago',
        content: '"Client undergoing fiscal year-end closing. Payment release scheduled for Nov 1. No risk flagged."',
      },
    ],
    settlements: [
      { id: 's1', type: 'Wire Transfer #6602', date: 'SEP 28, 2023', amount: '$45,000.00' },
      { id: 's2', type: 'Escrow Drawdown', date: 'AUG 10, 2023', amount: '$22,200.00' },
    ],
  },
  '7': {
    accountType: 'ENTERPRISE ACCOUNT',
    accountId: '7712-SF',
    email: 'finance@summitfinancial.com',
    phone: '+1 (555) 678-9012',
    location: 'Chicago, IL',
    recoveryIndex: '+4.25%',
    recoveryDesc:
      'Account fully reconciled. Consistent payment history. Eligible for extended credit facilities.',
    interactions: [
      {
        id: 'i1', date: 'OCT 28, 2023 • 08:00 AM', dot: 'green',
        title: 'Full Settlement Processed',
        desc: 'Final payment of $22,000.00 received and applied. Account balance cleared. Reference #4471-BZ issued.',
      },
      {
        id: 'i2', date: 'OCT 10, 2023 • 03:00 PM', dot: 'blue',
        title: 'Payment Plan Finalized',
        desc: 'Summit Financial agreed to expedited settlement terms. Signed confirmation received.',
      },
    ],
    notes: [
      {
        id: 'n1', author: 'SYSTEM NOTE', time: '2d ago',
        content: 'Account settled. All obligations fulfilled. VIP status review recommended for Q1 2024.',
      },
    ],
    settlements: [
      { id: 's1', type: 'Wire Transfer #4471', date: 'OCT 28, 2023', amount: '$22,000.00' },
      { id: 's2', type: 'ACH Transfer', date: 'SEP 01, 2023', amount: '$15,000.00' },
    ],
  },
};

const INTERACTION_DOT_COLORS = {
  orange: COLORS.orange,
  green:  COLORS.green,
  blue:   COLORS.blue,
  red:    COLORS.red,
};

const STATUS_CONFIG = {
  OVERDUE: { bg: '#FDECEA', text: '#E74C3C' },
  PENDING: { bg: '#EBF5FB', text: '#2980B9' },
  PAID:    { bg: '#EAFAF1', text: '#27AE60' },
};

export default function AccountDetailScreen({ route, navigation }) {
  const { account } = route.params;
  const detail = DETAIL_DATA[account.id] || DETAIL_DATA['1'];
  const statusCfg = STATUS_CONFIG[account.status];
  const isNegative = detail.recoveryIndex.startsWith('-');

  return (
    <SafeAreaView style={styles.safe}>

      <TopNavBar navigation={navigation} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── Account Header ── */}
        <View style={styles.headerSection}>
          <View style={styles.accountMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.text }]}>
                {account.status}
              </Text>
            </View>
            <Text style={styles.accountTypeLabel}>
              {detail.accountType} • ID: {detail.accountId}
            </Text>
          </View>

          <Text style={styles.accountName}>{account.name}</Text>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>✉</Text>
            <Text style={styles.contactText}>{detail.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>{detail.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>📍</Text>
              <Text style={styles.contactText}>{detail.location}</Text>
            </View>
          </View>
        </View>

        {/* ── Priority Recovery Index ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PRIORITY RECOVERY INDEX</Text>
          <Text style={[
            styles.recoveryValue,
            { color: isNegative ? COLORS.red : COLORS.green },
          ]}>
            {detail.recoveryIndex}
          </Text>
          <Text style={styles.recoveryDesc}>{detail.recoveryDesc}</Text>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionPrimary} activeOpacity={0.85}>
            <Text style={styles.actionPrimaryText}>✦  Generate AI Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionSecondary} activeOpacity={0.85}>
            <Text style={styles.actionSecondaryText}>📅  Schedule Follow-up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionSecondary, styles.actionTertiary]} activeOpacity={0.85}>
            <Text style={styles.actionSecondaryText}>⇄  Change Status</Text>
          </TouchableOpacity>
        </View>

        {/* ── Interaction History ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>INTERACTION HISTORY</Text>
        </View>
        <View style={styles.card}>
          {detail.interactions.map((item, index) => (
            <View key={item.id} style={styles.interactionRow}>
              {/* Timeline */}
              <View style={styles.timelineCol}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: INTERACTION_DOT_COLORS[item.dot] ?? COLORS.gray },
                ]} />
                {index < detail.interactions.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              {/* Content */}
              <View style={styles.interactionContent}>
                <Text style={styles.interactionDate}>{item.date}</Text>
                <Text style={styles.interactionTitle}>{item.title}</Text>
                <Text style={styles.interactionDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Confidential Notes ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CONFIDENTIAL NOTES</Text>
          <TouchableOpacity>
            <Text style={styles.editAllText}>Edit All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {detail.notes.map((note, index) => (
            <View key={note.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.noteItem}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteAuthor}>{note.author}</Text>
                  <Text style={styles.noteTime}>{note.time}</Text>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Settlement Records ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SETTLEMENT RECORDS</Text>
        </View>
        <View style={styles.card}>
          {detail.settlements.map((s, index) => (
            <View key={s.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.settlementItem}>
                <View>
                  <Text style={styles.settlementType}>{s.type}</Text>
                  <Text style={styles.settlementDate}>{s.date}</Text>
                </View>
                <Text style={styles.settlementAmount}>{s.amount}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* View Full Ledger */}
        <TouchableOpacity style={styles.ledgerBtn} activeOpacity={0.8}>
          <Text style={styles.ledgerBtnText}>VIEW FULL LEDGER</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },

  scroll: {
    paddingBottom: 16,
  },

  /* ── Header Section ── */
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
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
  statusText: {
    fontSize: SIZES.xs,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
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
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  contactIcon: {
    fontSize: 13,
  },
  contactText: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    ...FONTS.medium,
  },

  /* ── Cards ── */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  recoveryValue: {
    fontSize: 42,
    ...FONTS.extraBold,
    letterSpacing: -1,
    marginBottom: 8,
  },
  recoveryDesc: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    lineHeight: 18,
    ...FONTS.regular,
  },

  /* ── Action Buttons ── */
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionTertiary: {
    borderColor: COLORS.navy,
  },
  actionSecondaryText: {
    color: COLORS.navy,
    fontSize: SIZES.sm,
    ...FONTS.bold,
    letterSpacing: 0.8,
  },

  /* ── Section Headers ── */
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
  editAllText: {
    fontSize: SIZES.sm,
    color: COLORS.navy,
    ...FONTS.bold,
  },

  /* ── Interaction History ── */
  interactionRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    marginBottom: 0,
    minHeight: 24,
  },
  interactionContent: {
    flex: 1,
    paddingBottom: 20,
  },
  interactionDate: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.semiBold,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  interactionTitle: {
    fontSize: SIZES.md,
    color: COLORS.navy,
    ...FONTS.bold,
    marginBottom: 4,
  },
  interactionDesc: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    lineHeight: 18,
    ...FONTS.regular,
  },

  /* ── Notes ── */
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  noteItem: {},
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteAuthor: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 0.6,
  },
  noteTime: {
    fontSize: SIZES.xs,
    color: COLORS.grayLight,
    ...FONTS.regular,
  },
  noteContent: {
    fontSize: SIZES.sm,
    color: COLORS.navy,
    lineHeight: 19,
    ...FONTS.regular,
  },

  /* ── Settlements ── */
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settlementType: {
    fontSize: SIZES.md,
    color: COLORS.navy,
    ...FONTS.semiBold,
    marginBottom: 2,
  },
  settlementDate: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.regular,
  },
  settlementAmount: {
    fontSize: SIZES.base,
    color: COLORS.navy,
    ...FONTS.bold,
  },

  /* ── View Full Ledger ── */
  ledgerBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    height: 50,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerBtnText: {
    fontSize: SIZES.sm,
    color: COLORS.navy,
    ...FONTS.bold,
    letterSpacing: 1.2,
  },
});
