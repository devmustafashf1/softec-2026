import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';

const ACCOUNTS = [
  {
    id: '1',
    name: 'Arlington Logistics Group',
    status: 'OVERDUE',
    amountLabel: 'TOTAL EXPOSURE',
    amount: '$42,980.50',
    secondaryLabel: 'AGING',
    secondaryValue: '45 Days',
    dot: 'red',
  },
  {
    id: '2',
    name: 'Global Tech Solutions',
    status: 'PENDING',
    amountLabel: 'CURRENT BALANCE',
    amount: '$12,400.00',
    secondaryLabel: 'DUE IN',
    secondaryValue: '08 Days',
    dot: 'yellow',
  },
  {
    id: '3',
    name: 'North Star Construction',
    status: 'PAID',
    amountLabel: '',
    amount: '$8,200.00',
    secondaryLabel: 'Ref:',
    secondaryValue: '#9928-AX',
    dot: 'green',
    hasIcon: true,
  },
  {
    id: '4',
    name: 'Apex Retail Partners',
    status: 'OVERDUE',
    amountLabel: 'CRITICAL AMOUNT',
    amount: '$128,500.00',
    secondaryLabel: 'AGING',
    secondaryValue: '92 Days',
    dot: 'red',
  },
  {
    id: '5',
    name: 'Zenith Media Group',
    status: 'OVERDUE',
    amountLabel: 'EXPOSURE',
    amount: '$3,450.00',
    secondaryLabel: 'AGING',
    secondaryValue: '12 Days',
    dot: 'red',
  },
  {
    id: '6',
    name: 'Pacific Ridge Ventures',
    status: 'PENDING',
    amountLabel: 'CURRENT BALANCE',
    amount: '$67,200.00',
    secondaryLabel: 'DUE IN',
    secondaryValue: '03 Days',
    dot: 'yellow',
  },
  {
    id: '7',
    name: 'Summit Financial Corp',
    status: 'PAID',
    amountLabel: '',
    amount: '$22,000.00',
    secondaryLabel: 'Ref:',
    secondaryValue: '#4471-BZ',
    dot: 'green',
    hasIcon: true,
  },
];

const FILTERS = ['ALL ACCOUNTS', 'OVERDUE', 'PENDING', 'PAID'];

const STATUS_CONFIG = {
  OVERDUE: { bg: '#FDECEA', text: '#E74C3C', label: 'OVERDUE' },
  PENDING: { bg: '#EBF5FB', text: '#2980B9', label: 'PENDING' },
  PAID:    { bg: '#EAFAF1', text: '#27AE60', label: 'PAID' },
};

const DOT_COLORS = {
  red: '#E74C3C',
  yellow: '#F39C12',
  green: '#27AE60',
};

function AccountCard({ item, onPress }) {
  const statusCfg = STATUS_CONFIG[item.status];
  const isOverdue = item.status === 'OVERDUE';
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.cardRow}>

        {/* Left side */}
        <View style={styles.cardLeft}>
          <View style={styles.nameRow}>
            <View style={[styles.dot, { backgroundColor: DOT_COLORS[item.dot] }]} />
            {item.hasIcon && (
              <View style={styles.companyIconBox}>
                <Text style={styles.companyIconText}>🏢</Text>
              </View>
            )}
            <Text style={styles.cardName}>{item.name}</Text>
          </View>

          {item.amountLabel ? (
            <Text style={styles.amountLabel}>{item.amountLabel}</Text>
          ) : null}

          <Text style={styles.amount}>{item.amount}</Text>
        </View>

        {/* Right side */}
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>

          <Text style={styles.secondaryLabel}>{item.secondaryLabel}</Text>
          <Text style={[styles.secondaryValue, isOverdue && styles.secondaryValueRed]}>
            {item.secondaryValue}
          </Text>
        </View>

      </View>
    </TouchableOpacity>
  );
}

export default function AccountsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('ALL ACCOUNTS');
  const [search, setSearch] = useState('');

  const filtered = ACCOUNTS.filter((a) => {
    const matchesFilter = activeFilter === 'ALL ACCOUNTS' || a.status === activeFilter;
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>

      <TopNavBar navigation={navigation} />

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search accounts, names, or IDs..."
          placeholderTextColor={COLORS.grayLight}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderLeft}>ACCOUNT LEDGER</Text>
        <TouchableOpacity style={styles.sortRow}>
          <Text style={styles.sortText}>SORT BY: DAYS OVERDUE</Text>
          <Text style={styles.sortChevron}> ↓</Text>
        </TouchableOpacity>
      </View>

      {/* Accounts list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <AccountCard
              item={item}
              onPress={() => navigation.navigate('AccountDetail', { account: item })}
            />
          )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No accounts found.</Text>
          </View>
        }
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
    color: COLORS.gray,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.navy,
    height: '100%',
  },
  filterScroll: {
    marginVertical: 12,
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  filterTabText: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 0.8,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  listHeaderLeft: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 1.2,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: SIZES.xs,
    color: COLORS.navy,
    ...FONTS.bold,
    letterSpacing: 0.8,
  },
  sortChevron: {
    fontSize: SIZES.xs,
    color: COLORS.navy,
    ...FONTS.bold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
    flexShrink: 0,
  },
  companyIconBox: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  companyIconText: {
    fontSize: 15,
  },
  cardName: {
    fontSize: SIZES.md,
    color: COLORS.navy,
    ...FONTS.bold,
    flexShrink: 1,
  },
  amountLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 0.8,
    ...FONTS.semiBold,
    marginBottom: 3,
    marginLeft: 16,
  },
  amount: {
    fontSize: SIZES.xxl,
    color: COLORS.navy,
    ...FONTS.extraBold,
    letterSpacing: -0.5,
    marginLeft: 16,
  },
  cardRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusText: {
    fontSize: SIZES.xs,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  secondaryLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.semiBold,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  secondaryValue: {
    fontSize: SIZES.base,
    color: COLORS.navy,
    ...FONTS.bold,
  },
  secondaryValueRed: {
    color: '#E74C3C',
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: SIZES.md,
  },
});
