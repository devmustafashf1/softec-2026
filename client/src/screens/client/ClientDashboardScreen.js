import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

// Mock data — replace with real API later
const ACCOUNT = {
  clientInitials: 'JD',
  totalBalance: 12450.0,
  amountPaid: 4900.0,
  percentCollected: 62,
  nextReview: 'Oct 24',
  status: 'OVERDUE',
};


export default function ClientDashboardScreen({ navigation }) {
  const remaining = ACCOUNT.totalBalance - ACCOUNT.amountPaid;

  const handleAvatarPress = () => {
    Alert.alert('Account', 'What would you like to do?', [
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => navigation.replace('ClientLogin'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sovereign Ledger</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress} activeOpacity={0.8}>
            <Text style={styles.avatarText}>{ACCOUNT.clientInitials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE DUE</Text>
          <Text style={styles.balanceAmount}>
            ${ACCOUNT.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.overdueTag}>
              <Text style={styles.overdueText}>{ACCOUNT.status}</Text>
            </View>
            <Text style={styles.nextReview}>Next scheduled review: {ACCOUNT.nextReview}</Text>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressLabel}>PROGRESS</Text>
                <Text style={styles.progressValue}>{ACCOUNT.percentCollected}% Collected</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.progressLabel}>REMAINING</Text>
                <Text style={styles.progressValueAlt}>
                  ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${ACCOUNT.percentCollected}%` }]} />
            </View>
          </View>

          {/* Mini stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>AMOUNT PAID</Text>
              <Text style={styles.statValue}>
                ${ACCOUNT.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.statCard, styles.statCardRight]}>
              <Text style={styles.statLabel}>OBLIGATION</Text>
              <Text style={styles.statValue}>
                ${ACCOUNT.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.paidButton}
            onPress={() => navigation.navigate('ClientPaymentProof')}
            activeOpacity={0.85}
          >
            <Text style={styles.paidButtonIcon}>📋</Text>
            <Text style={styles.paidButtonText}>I've Paid This</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming follow-up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPCOMING FOLLOW-UP</Text>
          <View style={styles.eventCard}>
            <View style={styles.eventLeft}>
              <View style={styles.eventAvatar}>
                <Text style={styles.eventAvatarText}>👤</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>Call with Senior Adjuster</Text>
                <Text style={styles.eventDesc}>
                  Reviewing hardship documentation and payment plan adjustment.
                </Text>
                <View style={styles.eventMeta}>
                  <Text style={styles.eventMetaText}>📅 Oct 28, 2023</Text>
                  <Text style={styles.eventMetaSep}>  ·  </Text>
                  <Text style={styles.eventMetaText}>🕙 10:30 AM EST</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.calButton}>
              <Text style={styles.calButtonText}>ADD TO CALENDAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.lightBg },

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
  bellBtn: { padding: 4 },
  bellIcon: { fontSize: 18 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: SIZES.sm, color: COLORS.white, ...FONTS.bold },

  scroll: { flex: 1 },

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
  balanceLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.2,
    ...FONTS.semiBold,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 34,
    color: COLORS.navy,
    ...FONTS.extraBold,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  overdueTag: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  overdueText: { fontSize: SIZES.xs, color: COLORS.red, ...FONTS.bold, letterSpacing: 0.5 },
  nextReview: { fontSize: SIZES.sm, color: COLORS.gray },

  progressSection: { marginBottom: 16 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1,
    ...FONTS.semiBold,
    marginBottom: 2,
  },
  progressValue: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },
  progressValueAlt: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.lightBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.navy,
    borderRadius: 4,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    borderRadius: SIZES.radiusSm,
    padding: 14,
  },
  statCardRight: {},
  statLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1,
    ...FONTS.semiBold,
    marginBottom: 4,
  },
  statValue: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },

  paidButton: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paidButtonIcon: { fontSize: 16 },
  paidButtonText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },

  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.2,
    ...FONTS.semiBold,
    marginBottom: 16,
  },
  viewAll: { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.semiBold },

  eventCard: {},
  eventLeft: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  eventAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventAvatarText: { fontSize: 18 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: SIZES.md, color: COLORS.navy, ...FONTS.bold, marginBottom: 4 },
  eventDesc: { fontSize: SIZES.sm, color: COLORS.gray, lineHeight: 18, marginBottom: 8 },
  eventMeta: { flexDirection: 'row', alignItems: 'center' },
  eventMetaText: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.medium },
  eventMetaSep: { color: COLORS.grayLight },
  calButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calButtonText: {
    fontSize: SIZES.xs,
    color: COLORS.navy,
    letterSpacing: 1,
    ...FONTS.bold,
  },

  ledgerItem: { paddingBottom: 16 },
  ledgerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  ledgerIconText: { fontSize: 14, ...FONTS.bold },
  ledgerBody: { paddingLeft: 48 },
  ledgerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ledgerTitle: { fontSize: SIZES.md, color: COLORS.navy, ...FONTS.bold, flex: 1 },
  ledgerTime: { fontSize: SIZES.xs, color: COLORS.grayLight, marginLeft: 8 },
  ledgerSubtitle: { fontSize: SIZES.sm, color: COLORS.gray, lineHeight: 18 },
  ledgerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 14,
    marginBottom: 2,
    marginLeft: 48,
  },
});
