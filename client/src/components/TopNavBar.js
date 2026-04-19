import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { api } from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);

const MENU_ITEMS = [
  { key: 'Dashboard', label: 'Dashboard',        icon: '⊞', desc: 'Portfolio overview',   isTab: true  },
  { key: 'Accounts',  label: 'Accounts',         icon: '🗂', desc: 'Manage accounts',     isTab: true  },
  { key: 'AI',        label: 'AI Assistant',     icon: '✦', desc: 'Collection AI agent',  isTab: true  },
  { key: 'Payments',  label: 'Payments',         icon: '💳', desc: 'Payment records',     isTab: true  },
  { key: 'Reports',   label: 'Reports',          icon: '📊', desc: 'Analytics & data',    isTab: true  },
  { key: 'Users',     label: 'Users',            icon: '👥', desc: 'Manage client users', isTab: false },
];

export default function TopNavBar({ navigation, showBack = false }) {
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.me().then((data) => setAdminUser(data.user || data)).catch(() => {});
  }, []);

  /* ── Drawer ── */
  const openDrawer = () => {
    setDrawerVisible(true);
    drawerAnim.setValue(-DRAWER_WIDTH);
    Animated.parallel([
      Animated.spring(drawerAnim, {
        toValue: 0, tension: 70, friction: 12, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (cb) => {
    Animated.parallel([
      Animated.timing(drawerAnim, {
        toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
      cb && cb();
    });
  };

  const navigateTo = (item) => {
    closeDrawer(() => {
      if (!item.isTab) {
        // Stack screen — navigate from root navigator
        const rootNav = navigation.getParent() ?? navigation;
        rootNav.navigate(item.key);
        return;
      }
      const state = navigation.getState?.();
      if (state?.type === 'tab') {
        navigation.navigate(item.key);
      } else {
        navigation.navigate('Main', { screen: item.key });
      }
    });
  };

  /* ── Logout ── */
  const handleLogout = () => {
    setProfileVisible(false);
    setDrawerVisible(false);
    const rootNav = navigation.getParent() ?? navigation;
    rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <>
      {/* ── Nav Bar ── */}
      <View style={styles.nav}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={openDrawer} style={styles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View style={styles.hamburger}>
              <View style={styles.hLine} />
              <View style={[styles.hLine, { width: 14 }]} />
              <View style={styles.hLine} />
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.navBrand}>SOVEREIGN LEDGER</Text>

        <TouchableOpacity onPress={() => setProfileVisible(true)} style={styles.avatar} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.avatarText}>
            {adminUser?.full_name?.[0]?.toUpperCase() || adminUser?.email?.[0]?.toUpperCase() || 'A'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Drawer Modal ── */}
      <Modal transparent visible={drawerVisible} animationType="none" statusBarTranslucent onRequestClose={() => closeDrawer()}>
        {/* Dim overlay */}
        <Animated.View style={[styles.drawerOverlay, { opacity: fadeAnim }]} />
        <TouchableWithoutFeedback onPress={() => closeDrawer()}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Drawer panel */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }], paddingTop: insets.top + 8 }]}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerLogoBox}>
              <Text style={styles.drawerLogoText}>SL</Text>
            </View>
            <View>
              <Text style={styles.drawerBrand}>SOVEREIGN</Text>
              <Text style={styles.drawerBrand}>LEDGER</Text>
              <Text style={styles.drawerSub}>Debt Recovery Platform</Text>
            </View>
          </View>

          <View style={styles.drawerDivider} />

          {/* Nav items */}
          <View style={styles.drawerItems}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.drawerItem}
                onPress={() => navigateTo(item)}
                activeOpacity={0.7}
              >
                <View style={styles.drawerItemIcon}>
                  <Text style={styles.drawerItemEmoji}>{item.icon}</Text>
                </View>
                <View>
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                  <Text style={styles.drawerItemDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign out */}
          <View style={styles.drawerFooter}>
            <View style={styles.drawerDivider} />
            <TouchableOpacity style={styles.drawerSignOut} onPress={handleLogout} activeOpacity={0.7}>
              <View style={[styles.drawerItemIcon, { backgroundColor: 'rgba(231,76,60,0.15)' }]}>
                <Text style={styles.drawerItemEmoji}>⎋</Text>
              </View>
              <Text style={styles.drawerSignOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {/* ── Profile Popup Modal ── */}
      <Modal transparent visible={profileVisible} animationType="fade" onRequestClose={() => setProfileVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setProfileVisible(false)}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <View style={[styles.profileCard, { top: insets.top + 58 }]}>
          {/* User info */}
          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {adminUser?.full_name?.[0]?.toUpperCase() || adminUser?.email?.[0]?.toUpperCase() || 'A'}
              </Text>
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.profileName}>{adminUser?.full_name || 'Admin'}</Text>
              <Text style={styles.profileEmail}>{adminUser?.email || ''}</Text>
            </View>
          </View>

          <View style={styles.profileDivider} />

          {/* Logout button */}
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutIcon}>⎋</Text>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  /* ── Nav Bar ── */
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.lightBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navBtn: { padding: 4 },
  hamburger: { gap: 4 },
  hLine: {
    width: 20, height: 2, backgroundColor: COLORS.navy,
    borderRadius: 1,
  },
  backArrow: { fontSize: 22, color: COLORS.navy, ...FONTS.bold },
  navBrand: {
    fontSize: SIZES.sm, color: COLORS.navy,
    ...FONTS.bold, letterSpacing: 1.5,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: SIZES.sm, ...FONTS.bold },

  /* ── Drawer ── */
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  drawer: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.navy,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
  },
  drawerLogoBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerLogoText: {
    color: COLORS.white, fontSize: SIZES.base, ...FONTS.extraBold,
  },
  drawerBrand: {
    color: COLORS.white, fontSize: SIZES.sm,
    ...FONTS.extraBold, letterSpacing: 1.5, lineHeight: 17,
  },
  drawerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: SIZES.xs, marginTop: 3,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 20,
  },
  drawerItems: {
    paddingTop: 12,
    paddingHorizontal: 12,
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  drawerItemIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerItemEmoji: { fontSize: 17 },
  drawerItemLabel: {
    color: COLORS.white, fontSize: SIZES.base, ...FONTS.semiBold,
  },
  drawerItemDesc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: SIZES.xs, marginTop: 1,
  },
  drawerFooter: {
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  drawerSignOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  drawerSignOutText: {
    color: '#E74C3C', fontSize: SIZES.base, ...FONTS.semiBold,
  },

  /* ── Profile Card ── */
  profileCard: {
    position: 'absolute',
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    width: 230,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  profileAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarText: {
    color: COLORS.white, fontSize: SIZES.base, ...FONTS.bold,
  },
  profileTextCol: { flex: 1 },
  profileName: {
    fontSize: SIZES.md, color: COLORS.navy, ...FONTS.bold,
  },
  profileEmail: {
    fontSize: SIZES.xs, color: COLORS.gray, marginTop: 2,
  },
  profileDivider: {
    height: 1, backgroundColor: COLORS.border,
    marginBottom: 4,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoutIcon: { fontSize: 16, color: COLORS.red },
  logoutText: {
    fontSize: SIZES.md, color: COLORS.red, ...FONTS.semiBold,
  },
});
