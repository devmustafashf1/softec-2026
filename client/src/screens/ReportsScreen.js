import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 32;

/* ─────────────────────────────────────────
   Data
───────────────────────────────────────── */
const PERIODS = ['Last 30 Days', 'Quarterly', 'Yearly'];

// Recovery rate data per period [WK1, WK2, WK3, WK4]
const RECOVERY_DATA = {
  'Last 30 Days': { values: [74.1, 78.8, 81.3, 84.2], target: 80, change: '+3.1%', main: '84.2%' },
  'Quarterly':    { values: [68.0, 72.5, 78.0, 81.6], target: 78, change: '+2.4%', main: '81.6%' },
  'Yearly':       { values: [61.0, 67.4, 73.8, 80.1], target: 75, change: '+5.2%', main: '80.1%' },
};

const CAPITAL_DATA = {
  'Last 30 Days': { total: '$4.2M', collected: '$2.8M', outstanding: '$1.4M', fraction: 0.667 },
  'Quarterly':    { total: '$11.6M', collected: '$7.4M', outstanding: '$4.2M', fraction: 0.638 },
  'Yearly':       { total: '$41.2M', collected: '$28.9M', outstanding: '$12.3M', fraction: 0.701 },
};

const CASE_DATA = [
  { label: 'SETTLED',       value: 1240, color: COLORS.green },
  { label: 'NEGOTIATING',   value: 842,  color: COLORS.navy  },
  { label: 'PENDING LEGAL', value: 315,  color: '#74B3E8'    },
  { label: 'DISPUTED',      value: 120,  color: COLORS.red   },
];

const AGENTS = [
  { initials: 'JD', name: 'Julianne Davies', role: 'SENIOR AGENT',  cases: 182, rate: 92, value: '$412,000', rateColor: '#D1FAE5', rateText: COLORS.green },
  { initials: 'MK', name: 'Marcus Kaine',    role: 'COLLECTOR II',  cases: 156, rate: 88, value: '$358,400', rateColor: '#DBEAFE', rateText: COLORS.blue  },
  { initials: 'SL', name: 'Sarah Lopez',     role: 'COLLECTOR I',   cases: 141, rate: 81, value: '$294,200', rateColor: '#E0E7FF', rateText: '#6366F1'    },
];

/* ─────────────────────────────────────────
   Mini Line Chart (SVG)
───────────────────────────────────────── */
function LineChartSvg({ values, target, width = CARD_WIDTH - 36, height = 140 }) {
  const padL = 4, padR = 4, padT = 12, padB = 32;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const minV = Math.min(...values, target) - 4;
  const maxV = Math.max(...values, target) + 4;

  const toX = (i) => padL + (i / (values.length - 1)) * chartW;
  const toY = (v) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH;

  // Build smooth path
  const pts = values.map((v, i) => ({ x: toX(i), y: toY(v) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cp1x} ${pts[i - 1].y}, ${cp1x} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }

  // Target line Y
  const targetY = toY(target);
  const labels = ['WK 01', 'WK 02', 'WK 03', 'WK 04'];

  return (
    <Svg width={width} height={height}>
      {/* Target dashed line */}
      <Line
        x1={padL} y1={targetY} x2={padL + chartW} y2={targetY}
        stroke={COLORS.grayLight} strokeWidth={1}
        strokeDasharray="5,4"
      />

      {/* Area fill */}
      <Path
        d={`${d} L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`}
        fill={`${COLORS.navy}12`}
      />

      {/* Main line */}
      <Path d={d} fill="none" stroke={COLORS.navy} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={COLORS.white} stroke={COLORS.navy} strokeWidth={2} />
      ))}

      {/* X labels */}
      {labels.map((lbl, i) => (
        <SvgText
          key={i}
          x={toX(i)} y={height - 4}
          textAnchor="middle"
          fontSize={9} fill={COLORS.gray}
          fontWeight="600"
        >
          {lbl}
        </SvgText>
      ))}
    </Svg>
  );
}

/* ─────────────────────────────────────────
   Donut Chart (SVG)
───────────────────────────────────────── */
function DonutChart({ fraction, total, size = 180 }) {
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const navyDash = fraction * circumference;
  const grayDash = circumference - navyDash;

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${cx}, ${cy}`}>
        {/* Background ring (outstanding) */}
        <Circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
        />
        {/* Collected arc (navy) */}
        <Circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={COLORS.navy}
          strokeWidth={strokeWidth}
          strokeDasharray={`${navyDash} ${grayDash}`}
          strokeLinecap="butt"
        />
      </G>
      {/* Center label */}
      <SvgText
        x={cx} y={cy - 6}
        textAnchor="middle"
        fontSize={22} fontWeight="800"
        fill={COLORS.navy}
      >
        {total}
      </SvgText>
      <SvgText
        x={cx} y={cy + 14}
        textAnchor="middle"
        fontSize={9} fontWeight="600"
        fill={COLORS.gray}
        letterSpacing={1}
      >
        TOTAL VALUE
      </SvgText>
    </Svg>
  );
}

/* ─────────────────────────────────────────
   Main Screen
───────────────────────────────────────── */
export default function ReportsScreen({ navigation }) {
  const [period, setPeriod] = useState('Last 30 Days');
  const recovery = RECOVERY_DATA[period];
  const capital  = CAPITAL_DATA[period];
  const maxCase  = CASE_DATA[0].value;

  return (
    <SafeAreaView style={styles.safe}>
      <TopNavBar navigation={navigation} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Page Header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>PERFORMANCE ANALYSIS</Text>
          <View style={styles.pageHeaderRow}>
            <Text style={styles.pageTitle}>Reports &{'\n'}Analytics</Text>
            <TouchableOpacity style={styles.exportBtn} activeOpacity={0.85}>
              <Text style={styles.exportIcon}>⬆ </Text>
              <Text style={styles.exportText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Period Tabs ── */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recovery Rate ── */}
        <View style={styles.card}>
          <View style={styles.recoveryHeader}>
            <Text style={styles.cardSectionLabel}>RECOVERY RATE</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.navy }]} />
                <Text style={styles.legendText}>ACTUAL</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.grayLight }]} />
                <Text style={styles.legendText}>TARGET</Text>
              </View>
            </View>
          </View>

          <View style={styles.recoveryValueRow}>
            <Text style={styles.recoveryBig}>{recovery.main}</Text>
            <View style={styles.recoveryChangePill}>
              <Text style={styles.recoveryChangeText}>↗ {recovery.change}</Text>
            </View>
          </View>

          <View style={styles.chartWrapper}>
            <LineChartSvg values={recovery.values} target={recovery.target} />
          </View>
        </View>

        {/* ── Capital Allocation ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>CAPITAL ALLOCATION</Text>

          <View style={styles.donutWrapper}>
            <DonutChart fraction={capital.fraction} total={capital.total} />
          </View>

          <View style={styles.capitalLegend}>
            <View style={styles.capitalLegendRow}>
              <View style={styles.capitalLegendLeft}>
                <View style={[styles.capitalDot, { backgroundColor: COLORS.navy }]} />
                <Text style={styles.capitalLegendLabel}>Collected</Text>
              </View>
              <Text style={styles.capitalLegendValue}>{capital.collected}</Text>
            </View>
            <View style={styles.capitalDivider} />
            <View style={styles.capitalLegendRow}>
              <View style={styles.capitalLegendLeft}>
                <View style={[styles.capitalDot, { backgroundColor: COLORS.border }]} />
                <Text style={styles.capitalLegendLabel}>Outstanding</Text>
              </View>
              <Text style={styles.capitalLegendValue}>{capital.outstanding}</Text>
            </View>
          </View>
        </View>

        {/* ── Case Status Volume ── */}
        <View style={styles.card}>
          <Text style={[styles.cardSectionLabel, { marginBottom: 20 }]}>CASE STATUS VOLUME</Text>
          {CASE_DATA.map((item) => (
            <View key={item.label} style={styles.caseRow}>
              <Text style={styles.caseLabel}>{item.label}</Text>
              <View style={styles.caseBarTrack}>
                <View
                  style={[
                    styles.caseBarFill,
                    { width: `${(item.value / maxCase) * 100}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={styles.caseValue}>{item.value.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* ── Agent Efficiency Rankings ── */}
        <View style={styles.card}>
          <View style={styles.agentHeader}>
            <Text style={styles.cardSectionLabel}>AGENT EFFICIENCY RANKINGS</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {/* Table header */}
          <View style={styles.agentTableHeader}>
            <Text style={[styles.agentColHead, { flex: 2.2 }]}>AGENT</Text>
            <Text style={[styles.agentColHead, styles.agentColCenter]}>CLOSED{'\n'}CASES</Text>
            <Text style={[styles.agentColHead, styles.agentColCenter]}>RECOVERY{'\n'}RATE</Text>
            <Text style={[styles.agentColHead, styles.agentColRight]}>VALUE{'\n'}COLLECTED</Text>
          </View>

          {AGENTS.map((agent, index) => (
            <View key={agent.initials}>
              {index > 0 && <View style={styles.agentDivider} />}
              <View style={styles.agentRow}>
                {/* Avatar + name */}
                <View style={styles.agentInfo}>
                  <View style={[styles.agentAvatar, { backgroundColor: COLORS.navy + '22' }]}>
                    <Text style={styles.agentInitials}>{agent.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentRole}>{agent.role}</Text>
                  </View>
                </View>
                {/* Cases */}
                <Text style={[styles.agentCell, styles.agentColCenter]}>{agent.cases}</Text>
                {/* Rate badge */}
                <View style={[styles.rateBadge, { backgroundColor: agent.rateColor, alignSelf: 'center' }]}>
                  <Text style={[styles.rateBadgeText, { color: agent.rateText }]}>{agent.rate}%</Text>
                </View>
                {/* Value */}
                <Text style={[styles.agentCell, styles.agentColRight, { color: COLORS.navy }]}>{agent.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.lightBg },
  scroll: { paddingBottom: 16 },

  /* ── Header ── */
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  pageLabel: {
    fontSize: SIZES.xs, color: COLORS.gray,
    ...FONTS.semiBold, letterSpacing: 1.2, marginBottom: 6,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageTitle: {
    fontSize: 28, color: COLORS.navy,
    ...FONTS.extraBold, lineHeight: 34, letterSpacing: -0.5,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusSm,
    gap: 4,
    marginTop: 4,
  },
  exportIcon: { color: COLORS.white, fontSize: 12 },
  exportText: {
    color: COLORS.white, fontSize: SIZES.xs,
    ...FONTS.bold, letterSpacing: 0.6,
  },

  /* ── Period Tabs ── */
  periodRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodTabActive: {
    backgroundColor: COLORS.navy,
  },
  periodTabText: {
    fontSize: SIZES.xs, color: COLORS.gray,
    ...FONTS.semiBold,
  },
  periodTabTextActive: {
    color: COLORS.white, ...FONTS.bold,
  },

  /* ── Cards ── */
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
  cardSectionLabel: {
    fontSize: SIZES.xs, color: COLORS.gray,
    ...FONTS.bold, letterSpacing: 1.2,
  },

  /* ── Recovery Rate ── */
  recoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendRow: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold,
  },
  recoveryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  recoveryBig: {
    fontSize: 40, color: COLORS.navy,
    ...FONTS.extraBold, letterSpacing: -1,
  },
  recoveryChangePill: {
    backgroundColor: '#EAFAF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  recoveryChangeText: {
    fontSize: SIZES.xs, color: COLORS.green, ...FONTS.bold,
  },
  chartWrapper: {
    marginTop: 4,
    alignItems: 'center',
  },

  /* ── Capital Allocation ── */
  donutWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  capitalLegend: {
    marginTop: 4,
  },
  capitalLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  capitalLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  capitalDot: { width: 10, height: 10, borderRadius: 5 },
  capitalLegendLabel: {
    fontSize: SIZES.md, color: COLORS.navy, ...FONTS.medium,
  },
  capitalLegendValue: {
    fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold,
  },
  capitalDivider: { height: 1, backgroundColor: COLORS.border },

  /* ── Case Status ── */
  caseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  caseLabel: {
    width: 96,
    fontSize: 9,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  caseBarTrack: {
    flex: 1,
    height: 7,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  caseBarFill: {
    height: 7,
    borderRadius: 4,
  },
  caseValue: {
    width: 38,
    textAlign: 'right',
    fontSize: SIZES.xs,
    color: COLORS.navy,
    ...FONTS.bold,
  },

  /* ── Agent Rankings ── */
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: SIZES.xs, color: COLORS.navy, ...FONTS.bold,
  },
  agentTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 4,
  },
  agentColHead: {
    flex: 1,
    fontSize: 8,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 0.6,
    lineHeight: 13,
  },
  agentColCenter: { textAlign: 'center' },
  agentColRight: { textAlign: 'right' },
  agentDivider: { height: 1, backgroundColor: COLORS.border },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  agentInfo: {
    flex: 2.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  agentInitials: {
    fontSize: SIZES.xs, color: COLORS.navy, ...FONTS.bold,
  },
  agentName: {
    fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold,
  },
  agentRole: {
    fontSize: 9, color: COLORS.gray, ...FONTS.semiBold, marginTop: 1,
  },
  agentCell: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.gray,
    ...FONTS.semiBold,
  },
  rateBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  rateBadgeText: { fontSize: SIZES.xs, ...FONTS.bold },
});
