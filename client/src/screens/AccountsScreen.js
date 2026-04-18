import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';
import { api } from '../services/api';

const FILTERS = ['ALL', 'CURRENT', 'OVERDUE', 'PENDING'];

const STATUS_CONFIG = {
  CURRENT: { bg: '#EAFAF1', text: '#27AE60', label: 'CURRENT' },
  OVERDUE: { bg: '#FDECEA', text: '#E74C3C', label: 'OVERDUE' },
  PENDING: { bg: '#EBF5FB', text: '#2980B9', label: 'PENDING' },
  PAID:    { bg: '#EAFAF1', text: '#27AE60', label: 'PAID'    },
};

const DOT_COLOR = {
  CURRENT: '#27AE60',
  OVERDUE: '#E74C3C',
  PENDING: '#F39C12',
  PAID:    '#27AE60',
};

function fmt(amount) {
  if (amount == null) return '$0.00';
  return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AccountCard({ item, onPress }) {
  const status    = item.account_status || 'CURRENT';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.CURRENT;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.cardRow}>

        {/* Left side */}
        <View style={styles.cardLeft}>
          <View style={styles.nameRow}>
            <View style={[styles.dot, { backgroundColor: DOT_COLOR[status] || '#27AE60' }]} />
            <Text style={styles.cardName} numberOfLines={1}>{item.full_name}</Text>
          </View>

          {item.company_name ? (
            <Text style={styles.companyName} numberOfLines={1}>{item.company_name}</Text>
          ) : null}

          <Text style={styles.amountLabel}>PAYMENT AMOUNT</Text>
          <Text style={styles.amount}>{fmt(item.total_balance)}</Text>
        </View>

        {/* Right side */}
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>

          <Text style={styles.secondaryLabel}>INTERVAL</Text>
          <Text style={styles.secondaryValue}>
            {item.next_review || '—'}
          </Text>
        </View>

      </View>
    </TouchableOpacity>
  );
}

export default function AccountsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch]             = useState('');
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);

      api.listUsers()
        .then(({ users: data }) => { if (active) setUsers(data || []); })
        .catch((err) => { if (active) setError(err.message); })
        .finally(() => { if (active) setLoading(false); });

      return () => { active = false; };
    }, [])
  );

  const filtered = users.filter((u) => {
    const status       = u.account_status || 'CURRENT';
    const matchFilter  = activeFilter === 'ALL' || status === activeFilter;
    const matchSearch  = (u.full_name || '').toLowerCase().includes(search.toLowerCase())
                      || (u.username  || '').toLowerCase().includes(search.toLowerCase())
                      || (u.company_name || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>

      <TopNavBar navigation={navigation} />

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients, usernames, or companies..."
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
              {f === 'ALL' ? 'ALL ACCOUNTS' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderLeft}>CLIENT LEDGER</Text>
        <Text style={styles.listCount}>{filtered.length} CLIENT{filtered.length !== 1 ? 'S' : ''}</Text>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => {
            setLoading(true);
            api.listUsers()
              .then(({ users: data }) => setUsers(data || []))
              .catch((e) => setError(e.message))
              .finally(() => setLoading(false));
          }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
              <Text style={styles.emptyText}>No clients found.</Text>
            </View>
          }
        />
      )}

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
  searchIcon: { fontSize: 15, marginRight: 8, color: COLORS.gray },
  searchInput: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.navy,
    height: '100%',
  },
  filterScroll: { marginVertical: 12, flexGrow: 0 },
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
  filterTabActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterTabText: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    ...FONTS.bold,
    letterSpacing: 0.8,
  },
  filterTabTextActive: { color: COLORS.white },
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
  listCount: {
    fontSize: SIZES.xs,
    color: COLORS.navy,
    ...FONTS.bold,
    letterSpacing: 0.8,
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
  cardLeft: { flex: 1, marginRight: 12 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
    flexShrink: 0,
  },
  cardName: {
    fontSize: SIZES.md,
    color: COLORS.navy,
    ...FONTS.bold,
    flexShrink: 1,
  },
  companyName: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    ...FONTS.medium,
    marginLeft: 16,
    marginBottom: 6,
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
  cardRight: { alignItems: 'flex-end', minWidth: 80 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusText: { fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.5 },
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
    textAlign: 'right',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#E74C3C', fontSize: SIZES.md, marginBottom: 12, textAlign: 'center' },
  retryText: { color: COLORS.navy, fontSize: SIZES.md, ...FONTS.bold },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.gray, fontSize: SIZES.md },
});
