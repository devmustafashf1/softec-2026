import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import TopNavBar from '../components/TopNavBar';
import { api } from '../services/api';

const FILTERS = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED'];

const PROOF_STATUS = {
  PENDING:  { bg: '#EBF5FB', text: '#2980B9' },
  VERIFIED: { bg: '#EAFAF1', text: '#27AE60' },
  REJECTED: { bg: '#FDECEA', text: '#E74C3C' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PaymentsScreen({ navigation }) {
  const [proofs, setProofs]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [updatingId, setUpdatingId]     = useState(null);
  const [previewUri, setPreviewUri]     = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      api.getAllPaymentProofs()
        .then(({ proofs: data }) => { if (active) setProofs(data || []); })
        .catch((err) => { if (active) Alert.alert('Error', err.message); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const handleUpdateStatus = (proof, newStatus) => {
    Alert.alert(
      'Update Status',
      `Mark this proof as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdatingId(proof.id);
            try {
              await api.updateProofStatus(proof.profile_id, proof.id, newStatus);
              setProofs((prev) =>
                prev.map((p) => p.id === proof.id ? { ...p, status: newStatus } : p)
              );
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not update status.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const filtered = activeFilter === 'ALL'
    ? proofs
    : proofs.filter((p) => p.status === activeFilter);

  const pendingCount = proofs.filter((p) => p.status === 'PENDING').length;

  const renderProof = ({ item }) => {
    const cfg        = PROOF_STATUS[item.status] || PROOF_STATUS.PENDING;
    const isUpdating = updatingId === item.id;
    const clientName = item.profiles?.full_name || 'Unknown Client';
    const username   = item.profiles?.username   || '';

    return (
      <View style={styles.card}>
        {/* Client info */}
        <View style={styles.cardHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{clientName}</Text>
            {username ? <Text style={styles.clientUsername}>@{username}</Text> : null}
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.text }]}>{item.status}</Text>
            </View>
            <Text style={styles.timeAgo}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>

        {/* Receipt image — tap to preview */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewUri(item.image_url)}>
          <Image source={{ uri: item.image_url }} style={styles.proofImage} resizeMode="cover" />
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>🔍  Tap to view full image</Text>
          </View>
        </TouchableOpacity>

        {/* Details */}
        <View style={styles.cardBody}>
          <Text style={styles.refLabel}>REF</Text>
          <Text style={styles.refValue}>{item.reference_number}</Text>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}

          {isUpdating ? (
            <ActivityIndicator color={COLORS.navy} style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.actions}>
              {item.status !== 'VERIFIED' && (
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={() => handleUpdateStatus(item, 'VERIFIED')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifyBtnText}>✔  Verify</Text>
                </TouchableOpacity>
              )}
              {item.status !== 'REJECTED' && (
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleUpdateStatus(item, 'REJECTED')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rejectBtnText}>✕  Reject</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopNavBar navigation={navigation} />

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
            {f === 'PENDING' && pendingCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>PAYMENT PROOFS</Text>
        <Text style={styles.listCount}>{filtered.length} SUBMISSION{filtered.length !== 1 ? 'S' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderProof}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {activeFilter === 'ALL'
                  ? 'No payment proofs submitted yet.'
                  : `No ${activeFilter.toLowerCase()} proofs.`}
              </Text>
            </View>
          }
        />
      )}
      {/* Full-screen image preview modal */}
      <Modal
        visible={!!previewUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewUri(null)} activeOpacity={0.8}>
            <Text style={styles.previewCloseText}>✕</Text>
          </TouchableOpacity>
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.lightBg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  filterScroll: { flexGrow: 0, marginTop: 14, marginBottom: 10 },
  filterRow: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterTab: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  filterTabActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterTabText: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.bold, letterSpacing: 0.8 },
  filterTabTextActive: { color: COLORS.white },
  filterBadge: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, color: COLORS.white, ...FONTS.bold },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  listTitle: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.bold, letterSpacing: 1.2 },
  listCount: { fontSize: SIZES.xs, color: COLORS.navy, ...FONTS.bold },

  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    paddingBottom: 10,
  },
  clientInfo: { flex: 1, marginRight: 12 },
  clientName: { fontSize: SIZES.md, color: COLORS.navy, ...FONTS.bold },
  clientUsername: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.medium, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  statusText: { fontSize: SIZES.xs, ...FONTS.bold, letterSpacing: 0.4 },
  timeAgo: { fontSize: SIZES.xs, color: COLORS.grayLight, ...FONTS.regular },

  proofImage: { width: '100%', height: 200 },

  cardBody: { padding: 14 },
  refLabel: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.semiBold, letterSpacing: 1, marginBottom: 2 },
  refValue: { fontSize: SIZES.md, color: COLORS.navy, ...FONTS.bold, marginBottom: 6 },
  note: { fontSize: SIZES.sm, color: COLORS.gray, lineHeight: 18, marginBottom: 4 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  verifyBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EAFAF1',
    borderWidth: 1,
    borderColor: '#A9DFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: { color: '#27AE60', fontSize: SIZES.sm, ...FONTS.bold },
  rejectBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C6C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { color: '#E74C3C', fontSize: SIZES.sm, ...FONTS.bold },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.gray, fontSize: SIZES.md },

  tapHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  tapHintText: { color: '#fff', fontSize: SIZES.xs, ...FONTS.medium },

  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  previewCloseText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  previewImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.82,
  },
});
