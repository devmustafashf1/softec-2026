import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';

const TREND_BARS = [0.4, 0.55, 0.35, 0.6, 0.5, 0.45, 0.7, 0.65, 0.8, 0.75, 0.9, 1.0];

function TrendBar({ value }) {
  return (
    <View style={[trendStyles.barContainer]}>
      <View style={[trendStyles.bar, { height: value * 80 }]} />
    </View>
  );
}

const trendStyles = StyleSheet.create({
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    backgroundColor: COLORS.navy,
    borderRadius: 3,
    minHeight: 6,
  },
});

export default function DashboardScreen({ navigation }) {

  return (
    <SafeAreaView style={styles.safe}>
      <TopNavBar navigation={navigation} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Portfolio Status */}
        <View style={styles.portfolioSection}>
          <Text style={styles.portfolioLabel}>THE SOVEREIGN LEDGER | PORTFOLIO STATUS</Text>
          <Text style={styles.portfolioAmount}>$2,482,901.42</Text>
          <Text style={styles.portfolioDesc}>
            Total Current Overdue across 4,210 active accounts. Your recovery velocity is up 12.4% this week.
          </Text>

          <TouchableOpacity style={styles.followUpButton} activeOpacity={0.85}>
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

          {/* Total Accounts */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL ACCOUNTS</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>12,842</Text>
              <Text style={styles.statBadgeGreen}>+2.4%</Text>
            </View>
            <View style={styles.statDivider} />
          </View>

          {/* Collected this month */}
          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statLabel}>COLLECTED THIS MONTH</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>$412.8k</Text>
              <Text style={styles.statBadgeGreen}>+8%</Text>
            </View>
            <View style={styles.miniBarRow}>
              {[0.3, 0.5, 0.4, 0.6, 0.7, 0.85, 1.0].map((v, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniBar,
                    { height: v * 28, backgroundColor: i === 6 ? COLORS.navy : COLORS.inputBg },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Recovery Rate */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RECOVERY RATE</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>64.2%</Text>
              <Text style={styles.optimalBadge}>Optimal</Text>
            </View>
            <Text style={styles.statSubtext}>↗  Ahead of Q3 Targets</Text>
          </View>

          {/* Due Today */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>DUE TODAY</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>128</Text>
              <Text style={styles.urgentBadge}>High Priority</Text>
            </View>
            <View style={styles.avatarGroup}>
              {['#E74C3C', '#F39C12', '#3498DB'].map((c, i) => (
                <View key={i} style={[styles.miniAvatar, { backgroundColor: c, marginLeft: i > 0 ? -6 : 0 }]} />
              ))}
            </View>
          </View>

        </View>

        {/* Priority Case Alerts */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Priority Case Alerts</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>VIEW ALL INTELLIGENCE</Text>
          </TouchableOpacity>
        </View>

        {/* Case 1 — Critical Overdue */}
        <View style={styles.caseCard}>
          <View style={styles.caseTopRow}>
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalBadgeText}>CRITICAL OVERDUE</Text>
            </View>
            <Text style={styles.caseId}>#AC-B928</Text>
          </View>
          <Text style={styles.caseName}>Apex Logistics Corp</Text>
          <Text style={styles.caseAmount}>$42,500.00 — 90+ Days</Text>
          <View style={styles.caseActionRow}>
            <Text style={styles.caseActionIcon}>📞</Text>
            <Text style={styles.caseActionText}>SCHEDULED FOR 10:00 AM</Text>
          </View>
        </View>

        {/* Case 2 — Large Payment Pending */}
        <View style={styles.caseCard}>
          <View style={styles.caseTopRow}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>LARGE PAYMENT PENDING</Text>
            </View>
            <Text style={styles.caseId}>#AC-1042</Text>
          </View>
          <Text style={styles.caseName}>Global Reach Partners</Text>
          <Text style={styles.caseAmount}>$18,200.00 — AI Predicted: 94%</Text>
          <View style={styles.caseActionRow}>
            <Text style={styles.caseActionIcon}>↺</Text>
            <Text style={[styles.caseActionText, { color: COLORS.blue }]}>AUTO-REMIND ACTIVE</Text>
          </View>
        </View>

        {/* 30-Day Trend */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.sectionTitle}>30-Day Collection Trend</Text>
            <View style={styles.legendDot} />
          </View>
          <Text style={styles.trendSubLabel}>Daily recovery volume (USD)</Text>
          <View style={styles.trendChart}>
            {TREND_BARS.map((v, i) => (
              <TrendBar key={i} value={v} />
            ))}
          </View>
          <View style={styles.trendDatesRow}>
            <Text style={styles.trendDateLabel}>SEP 01</Text>
            <Text style={styles.trendDateLabel}>SEP 15</Text>
            <Text style={styles.trendDateLabel}>TODAY</Text>
          </View>
        </View>

        {/* AI Assistant */}
        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>Agent AI Assistant</Text>
          <Text style={styles.aiDesc}>
            I've analyzed your portfolio. 4 accounts are likely to settle if contacted before noon today.
          </Text>
          <TouchableOpacity style={styles.aiButton} activeOpacity={0.85}>
            <Text style={styles.aiButtonText}>REVIEW STRATEGY</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, styles.recentTitle]}>RECENT ACTIVITY</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: COLORS.green }]} />
            <View>
              <Text style={styles.activityAmount}>$1,240.00 Collected</Text>
              <Text style={styles.activityMeta}>SMITH WRIESMAN ASSOC. • 2M AGO</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: COLORS.gray }]} />
            <View>
              <Text style={styles.activityAmount}>Promise to Pay</Text>
              <Text style={styles.activityMeta}>VERITAS RIO • 14M AGO</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: COLORS.red }]} />
            <View>
              <Text style={styles.activityAmount}>Failed Payment</Text>
              <Text style={styles.activityMeta}>URBAN RETAIL GROUP • 9H AGO</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
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
    flex: 1,
  },
  portfolioSection: {
    padding: 20,
    paddingBottom: 16,
  },
  portfolioLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 0.8,
    ...FONTS.semiBold,
    marginBottom: 8,
  },
  portfolioAmount: {
    fontSize: 32,
    color: COLORS.navy,
    ...FONTS.extraBold,
    letterSpacing: -1,
    marginBottom: 8,
  },
  portfolioDesc: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  followUpButton: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  followUpIcon: {
    color: COLORS.white,
    fontSize: SIZES.md,
  },
  followUpText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    ...FONTS.bold,
  },
  authenticatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenLight,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  authenticatedIcon: {
    color: COLORS.green,
    fontSize: 16,
    ...FONTS.bold,
  },
  authenticatedText: {
    color: COLORS.green,
    fontSize: SIZES.sm,
    ...FONTS.bold,
    letterSpacing: 0.8,
  },
  statsGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardFull: {},
  statLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1,
    ...FONTS.semiBold,
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statValue: {
    fontSize: SIZES.xxl,
    color: COLORS.navy,
    ...FONTS.extraBold,
    letterSpacing: -0.5,
  },
  statBadgeGreen: {
    backgroundColor: COLORS.greenLight,
    color: COLORS.green,
    fontSize: SIZES.xs,
    ...FONTS.bold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statDivider: {
    marginTop: 12,
    height: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 12,
    height: 32,
  },
  miniBar: {
    flex: 1,
    borderRadius: 3,
    minHeight: 4,
  },
  optimalBadge: {
    color: COLORS.green,
    fontSize: SIZES.sm,
    ...FONTS.bold,
  },
  statSubtext: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: 6,
  },
  urgentBadge: {
    color: COLORS.red,
    fontSize: SIZES.sm,
    ...FONTS.bold,
  },
  avatarGroup: {
    flexDirection: 'row',
    marginTop: 8,
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: SIZES.base,
    color: COLORS.navy,
    ...FONTS.bold,
  },
  viewAllText: {
    fontSize: SIZES.xs,
    color: COLORS.navy,
    ...FONTS.bold,
    letterSpacing: 0.8,
  },
  caseCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  caseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  criticalBadge: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  criticalBadgeText: {
    color: COLORS.red,
    fontSize: SIZES.xs,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  pendingBadge: {
    backgroundColor: '#FEF9EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: COLORS.orange,
    fontSize: SIZES.xs,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  caseId: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    ...FONTS.semiBold,
  },
  caseName: {
    fontSize: SIZES.base,
    color: COLORS.navy,
    ...FONTS.bold,
    marginBottom: 4,
  },
  caseAmount: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: 10,
  },
  caseActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseActionIcon: {
    fontSize: 14,
    color: COLORS.gray,
  },
  caseActionText: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.semiBold,
    letterSpacing: 0.8,
  },
  trendCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.navy,
  },
  trendSubLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    marginBottom: 16,
  },
  trendChart: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  trendDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendDateLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
  },
  aiCard: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radius,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
  },
  aiTitle: {
    fontSize: SIZES.base,
    color: COLORS.white,
    ...FONTS.bold,
    marginBottom: 8,
  },
  aiDesc: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
    marginBottom: 16,
  },
  aiButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: SIZES.radiusSm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  aiButtonText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    ...FONTS.bold,
    letterSpacing: 1,
  },
  recentTitle: {
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  activityList: {
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityAmount: {
    fontSize: SIZES.md,
    color: COLORS.navy,
    ...FONTS.semiBold,
  },
  activityMeta: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
