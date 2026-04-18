import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';
import { api } from '../services/api';

function UserCard({ user, onToggle }) {
  const initials = user.full_name
    ? user.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <View style={styles.userCard}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={[styles.userAvatar, !user.is_active && styles.userAvatarInactive]}>
            <Text style={styles.userAvatarText}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.userName}>{user.full_name}</Text>
            <Text style={styles.userMeta}>@{user.username}</Text>
            {user.email ? (
              <Text style={styles.userEmail}>{user.email}</Text>
            ) : null}
            {user.company_name ? (
              <Text style={styles.userMeta}>{user.company_name}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>PAYMENT</Text>
          <Text style={styles.cardStatValue}>
            ${(user.total_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>INTERVAL</Text>
          <Text style={styles.cardStatValue}>{user.next_review || '—'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.activeLabel}>{user.is_active ? 'ACTIVE' : 'INACTIVE'}</Text>
        <Switch
          value={user.is_active}
          onValueChange={(val) => onToggle(user.id, val)}
          trackColor={{ false: COLORS.border, true: COLORS.green }}
          thumbColor={COLORS.white}
        />
      </View>
    </View>
  );
}

export default function UsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminCompany, setAdminCompany] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [intervalPreset, setIntervalPreset] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [customUnit, setCustomUnit] = useState('weeks');
  const [showPassword, setShowPassword] = useState(false);

  const resolvedInterval = () => {
    if (intervalPreset === 'custom') {
      if (!customNumber.trim()) return '';
      return `Every ${customNumber.trim()} ${customUnit}`;
    }
    return intervalPreset;
  };

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [usersData, meData] = await Promise.all([api.listUsers(), api.me()]);
      setUsers(usersData.users ?? []);
      setAdminCompany(meData.user?.company_name ?? '');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(true);
  };

  const handleToggle = async (id, is_active) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active } : u)));
    try {
      await api.toggleUserStatus(id, is_active);
    } catch (err) {
      // Revert on error
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: !is_active } : u)));
      Alert.alert('Error', err.message || 'Failed to update status.');
    }
  };

  const resetForm = () => {
    setFullName(''); setUsername(''); setEmail(''); setPassword('');
    setPaymentAmount(''); setIntervalPreset(''); setCustomNumber(''); setCustomUnit('weeks'); setShowPassword(false);
  };

  const handleCreate = async () => {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Full name, username and password are required.');
      return;
    }
    setSaving(true);
    try {
      await api.createUser({
        fullName:      fullName.trim(),
        username:      username.trim(),
        email:         email.trim() || undefined,
        password,
        companyName:   adminCompany || undefined,
        totalBalance:  paymentAmount ? parseFloat(paymentAmount) : 0,
        amountPaid:    0,
        nextReview:    resolvedInterval() || undefined,
        accountStatus: 'CURRENT',
      });
      setModalVisible(false);
      resetForm();
      fetchUsers(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopNavBar navigation={navigation} />

      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>User Management</Text>
          <Text style={styles.pageSubtitle}>{users.length} client{users.length !== 1 ? 's' : ''} registered</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+ NEW USER</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.navy} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.navy} />}
        >
          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No clients yet</Text>
              <Text style={styles.emptyDesc}>Tap "+ NEW USER" to create a client account.</Text>
            </View>
          ) : (
            users.map((user) => (
              <UserCard key={user.id} user={user} onToggle={handleToggle} />
            ))
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Create User Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Client User</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>

              <Text style={styles.sectionHeading}>ACCOUNT CREDENTIALS</Text>

              <Text style={styles.fieldLabel}>FULL NAME *</Text>
              <TextInput style={styles.input} placeholder="Jane Doe" placeholderTextColor={COLORS.grayLight} value={fullName} onChangeText={setFullName} />

              <Text style={styles.fieldLabel}>USERNAME *</Text>
              <TextInput style={styles.input} placeholder="janedoe" placeholderTextColor={COLORS.grayLight} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />

              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput style={styles.input} placeholder="jane@example.com" placeholderTextColor={COLORS.grayLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

              <Text style={styles.fieldLabel}>PASSWORD *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={COLORS.grayLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />

              <Text style={styles.sectionHeading}>PAYMENT DETAILS</Text>

              <Text style={styles.fieldLabel}>COMPANY</Text>
              <View style={styles.lockedField}>
                <Text style={styles.lockedFieldText}>{adminCompany || '—'}</Text>
                <Text style={styles.lockedIcon}>🔒</Text>
              </View>

              <Text style={styles.fieldLabel}>PAYMENT AMOUNT ($)</Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.grayLight} value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" />

              <Text style={styles.fieldLabel}>PAYMENT INTERVAL</Text>
              <View style={styles.intervalRow}>
                {['1 Week', '1 Month', '6 Months', 'Custom'].map((opt) => {
                  const key = opt === 'Custom' ? 'custom' : opt;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.intervalChip, intervalPreset === key && styles.intervalChipActive]}
                      onPress={() => setIntervalPreset(key)}
                    >
                      <Text style={[styles.intervalChipText, intervalPreset === key && styles.intervalChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {intervalPreset === 'custom' && (
                <View style={styles.customRow}>
                  <Text style={styles.customEvery}>Every</Text>
                  <TextInput
                    style={styles.customNumInput}
                    placeholder="3"
                    placeholderTextColor={COLORS.grayLight}
                    value={customNumber}
                    onChangeText={(t) => setCustomNumber(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <View style={styles.unitRow}>
                    {['days', 'weeks', 'months'].map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitChip, customUnit === u && styles.unitChipActive]}
                        onPress={() => setCustomUnit(u)}
                      >
                        <Text style={[styles.unitChipText, customUnit === u && styles.unitChipTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.createBtn, saving && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.createBtnText}>CREATE CLIENT ACCOUNT</Text>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.lightBg },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageTitle: { fontSize: SIZES.lg, color: COLORS.navy, ...FONTS.extraBold },
  pageSubtitle: { fontSize: SIZES.sm, color: COLORS.gray, marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addBtnText: { color: COLORS.white, fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.8 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1, paddingTop: 12 },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: SIZES.lg, color: COLORS.navy, ...FONTS.bold, marginBottom: 8 },
  emptyDesc: { fontSize: SIZES.md, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },

  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarInactive: { backgroundColor: COLORS.grayLight },
  userAvatarText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },
  cardInfo: { flex: 1 },
  userName: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold, marginBottom: 2 },
  userMeta: { fontSize: SIZES.sm, color: COLORS.gray },
  userEmail: { fontSize: SIZES.sm, color: COLORS.navy, opacity: 0.6, ...FONTS.medium },
  cardRight: { marginLeft: 8 },

  cardStats: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  cardStat: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    borderRadius: SIZES.radiusSm,
    padding: 10,
  },
  cardStatLabel: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold, letterSpacing: 0.8, marginBottom: 3 },
  cardStatValue: { fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  activeLabel: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.bold, letterSpacing: 1 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: SIZES.lg, color: COLORS.navy, ...FONTS.extraBold },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: SIZES.base, color: COLORS.gray },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 48 },

  sectionHeading: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.4,
    ...FONTS.bold,
    marginBottom: 14,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.2,
    ...FONTS.semiBold,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.lightBg,
    borderRadius: SIZES.radiusSm,
    height: 50,
    paddingHorizontal: 14,
    fontSize: SIZES.md,
    color: COLORS.navy,
    marginBottom: 16,
  },
  lockedField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radiusSm,
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lockedFieldText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    ...FONTS.medium,
  },
  lockedIcon: { fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 18 },

  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  intervalChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
  },
  intervalChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  intervalChipText: { fontSize: SIZES.sm, color: COLORS.gray, ...FONTS.semiBold },
  intervalChipTextActive: { color: COLORS.white },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  customEvery: { fontSize: SIZES.md, color: COLORS.gray, ...FONTS.medium },
  customNumInput: {
    backgroundColor: COLORS.lightBg, borderRadius: SIZES.radiusSm,
    height: 44, width: 64, paddingHorizontal: 12,
    fontSize: SIZES.md, color: COLORS.navy, textAlign: 'center',
  },
  unitRow: { flexDirection: 'row', gap: 6 },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border,
  },
  unitChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  unitChipText: { fontSize: SIZES.sm, color: COLORS.gray, ...FONTS.semiBold },
  unitChipTextActive: { color: COLORS.white },

  createBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createBtnDisabled: { opacity: 0.7 },
  createBtnText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold, letterSpacing: 0.5 },
});
