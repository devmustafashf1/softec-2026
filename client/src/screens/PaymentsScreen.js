import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
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

const FILTERS = ['ALL', 'PENDING', 'VERIFIED'];
// REJECTED proofs are hidden from admin view — they remain in DB so clients can see the rejection state

const PROOF_STATUS = {
  PENDING:  { bg: '#EBF5FB', text: '#2980B9', label: 'In Review' },
  VERIFIED: { bg: '#EAFAF1', text: '#27AE60', label: 'Verified'  },
  REJECTED: { bg: '#FDECEA', text: '#E74C3C', label: 'Rejected'  },
};

function useShimmer() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return anim;
}

function SkeletonBox({ width, height, style }) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[{ width, height, borderRadius: 6, backgroundColor: '#E2E8F0', opacity }, style]}
    />
  );
}

function PaymentCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {/* Thumbnail placeholder */}
        <SkeletonBox width={88} height={88} style={{ borderRadius: 10, flexShrink: 0 }} />

        {/* Info column */}
        <View style={[styles.info, { gap: 6 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBox width={110} height={13} />
            <SkeletonBox width={60} height={22} style={{ borderRadius: 5 }} />
          </View>
          <SkeletonBox width={70} height={10} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <SkeletonBox width={26} height={10} />
            <SkeletonBox width={100} height={10} />
          </View>
          <SkeletonBox width={130} height={10} style={{ marginTop: 2 }} />
          <SkeletonBox width={50}  height={9}  style={{ marginTop: 2 }} />
        </View>
      </View>

      {/* Action buttons placeholder */}
      <View style={[styles.actions, { paddingTop: 8 }]}>
        <SkeletonBox width="48%" height={36} style={{ borderRadius: 8 }} />
        <SkeletonBox width="48%" height={36} style={{ borderRadius: 8 }} />
      </View>
    </View>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PaymentsScreen({ navigation, route }) {
  const routeProfileId   = route.params?.profileId   ?? null;
  const routeProfileName = route.params?.profileName  ?? null;
  const routeInitFilter  = route.params?.initialFilter ?? 'ALL';

  const [proofs, setProofs]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [profileFilter, setProfileFilter] = useState(null); // { id, name }
  const [actionId, setActionId]         = useState(null);
  const [previewUri, setPreviewUri]     = useState(null);

  useFocusEffect(
    useCallback(() => {
      // Apply route params every time this tab comes into focus from a navigation push
      if (routeProfileId) {
        setProfileFilter({ id: routeProfileId, name: routeProfileName });
        setActiveFilter(routeInitFilter);
      } else {
        setProfileFilter(null);
        setActiveFilter('ALL');
      }

      let active = true;
      setLoading(true);
      api.getAllPaymentProofs()
        .then(({ proofs: data }) => {
          if (active) setProofs((data || []).filter((p) => p.status !== 'REJECTED'));
        })
        .catch((err) => { if (active) Alert.alert('Error', err.message); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [routeProfileId, routeProfileName, routeInitFilter])
  );

  const handleVerify = (proof) => {
    Alert.alert('Verify Payment', 'Approve this payment? The client status will be set to PAID.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setActionId(proof.id);
          try {
            await api.updateProofStatus(proof.profile_id, proof.id, 'VERIFIED');
            setProofs((prev) =>
              prev.map((p) => p.id === proof.id ? { ...p, status: 'VERIFIED' } : p)
            );
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not verify proof.');
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const handleReject = (proof) => {
    Alert.alert('Reject Proof', 'Reject this payment proof? The client will be notified to resubmit.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionId(proof.id);
          try {
            await api.updateProofStatus(proof.profile_id, proof.id, 'REJECTED');
            // Remove from admin view — client can still see the REJECTED state on their portal
            setProofs((prev) => prev.filter((p) => p.id !== proof.id));
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not reject proof.');
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const visibleProofs = profileFilter
    ? proofs.filter((p) => p.profile_id === profileFilter.id)
    : proofs;

  const filtered = activeFilter === 'ALL'
    ? visibleProofs
    : visibleProofs.filter((p) => p.status === activeFilter);

  const pendingCount = proofs.filter((p) => p.status === 'PENDING').length;

  const renderProof = ({ item }) => {
    const cfg        = PROOF_STATUS[item.status] || PROOF_STATUS.PENDING;
    const isBusy     = actionId === item.id;
    const clientName = item.profiles?.full_name || 'Unknown Client';
    const username   = item.profiles?.username   || '';

    return (
      <View style={styles.card}>
        {/* Thumbnail + info row */}
        <View style={styles.cardRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setPreviewUri(item.image_url)}
            style={styles.thumbWrap}
          >
            <Image source={{ uri: item.image_url }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.zoomBadge}>
              <Text style={styles.zoomIcon}>⤢</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.info}>
            <View style={styles.infoTop}>
              <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
              </View>
            </View>
            {username ? <Text style={styles.clientUsername}>@{username}</Text> : null}

            <View style={styles.refRow}>
              <Text style={styles.refLabel}>REF</Text>
              <Text style={styles.refValue} numberOfLines={1}>{item.reference_number}</Text>
            </View>
            {item.note ? <Text style={styles.note} numberOfLines={2}>{item.note}</Text> : null}

            <Text style={styles.timeAgo}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>

        {/* Action buttons */}
        {item.status === 'PENDING' && (
          <View style={styles.actions}>
            {isBusy ? (
              <ActivityIndicator color={COLORS.navy} style={{ paddingVertical: 6 }} />
            ) : (
              <>
                <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerify(item)} activeOpacity={0.8}>
                  <Text style={styles.verifyBtnText}>✔  Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)} activeOpacity={0.8}>
                  <Text style={styles.rejectBtnText}>✕  Reject</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {item.status === 'VERIFIED' && (
          <View style={styles.verifiedBar}>
            <Text style={styles.verifiedBarText}>✔  Payment approved — client marked PAID</Text>
          </View>
        )}
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

      {/* Active user filter banner */}
      {profileFilter && (
        <View style={styles.profileBanner}>
          <View style={styles.profileBannerLeft}>
            <Text style={styles.profileBannerIcon}>👤</Text>
            <Text style={styles.profileBannerName} numberOfLines={1}>{profileFilter.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setProfileFilter(null); setActiveFilter('ALL'); }}
            style={styles.profileBannerClear}
            activeOpacity={0.7}
          >
            <Text style={styles.profileBannerClearText}>✕ Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>PAYMENT PROOFS</Text>
        <Text style={styles.listCount}>{filtered.length} SUBMISSION{filtered.length !== 1 ? 'S' : ''}</Text>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={[styles.listContent, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 4 }).map((_, i) => <PaymentCardSkeleton key={i} />)}
        </ScrollView>
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

  filterScroll: { flexGrow: 0, marginTop: 14, marginBottom: 10 },
  filterRow: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterTab: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
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

  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  profileBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  profileBannerIcon: { fontSize: 14 },
  profileBannerName: { color: COLORS.white, fontSize: SIZES.sm, ...FONTS.bold, flex: 1 },
  profileBannerClear: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  profileBannerClearText: { color: COLORS.white, fontSize: SIZES.xs, ...FONTS.semiBold },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listTitle: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.bold, letterSpacing: 1.2 },
  listCount: { fontSize: SIZES.xs, color: COLORS.navy, ...FONTS.bold },

  listContent: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },

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

  /* Compact horizontal layout */
  cardRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumb: { width: '100%', height: '100%' },
  zoomBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  zoomIcon: { color: '#fff', fontSize: 11 },

  info: { flex: 1, gap: 2 },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  clientName: { flex: 1, fontSize: SIZES.sm, color: COLORS.navy, ...FONTS.bold },
  clientUsername: { fontSize: SIZES.xs, color: COLORS.gray, ...FONTS.medium, marginBottom: 4 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, flexShrink: 0 },
  statusText: { fontSize: 10, ...FONTS.bold, letterSpacing: 0.3 },

  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  refLabel: { fontSize: 10, color: COLORS.gray, ...FONTS.bold, letterSpacing: 0.8 },
  refValue: { flex: 1, fontSize: SIZES.xs, color: COLORS.navy, ...FONTS.semiBold },

  note: { fontSize: SIZES.xs, color: COLORS.gray, lineHeight: 16, marginTop: 2 },
  timeAgo: { fontSize: 10, color: COLORS.grayLight, ...FONTS.regular, marginTop: 4 },

  /* Action row */
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
  },
  verifyBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EAFAF1',
    borderWidth: 1,
    borderColor: '#A9DFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: { color: '#27AE60', fontSize: SIZES.xs, ...FONTS.bold },
  rejectBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C6C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { color: '#E74C3C', fontSize: SIZES.xs, ...FONTS.bold },

  verifiedBar: {
    backgroundColor: '#F0FFF4',
    borderTopWidth: 1,
    borderTopColor: '#C6F6D5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  verifiedBarText: { fontSize: SIZES.xs, color: '#16A34A', ...FONTS.semiBold },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.gray, fontSize: SIZES.md },

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
