import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const TABS = [
  { key: 'Dashboard', label: 'DASHBOARD', icon: '⊞' },
  { key: 'Accounts',  label: 'ACCOUNTS',  icon: '🗂' },
  { key: 'AI',        label: 'AI',        icon: null, isCenter: true },
  { key: 'Payments',  label: 'PAYMENTS',  icon: '💳' },
  { key: 'Reports',   label: 'REPORTS',   icon: '📊' },
];

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.key);
        if (!route) return null;
        const isFocused = state.routes[state.index].name === tab.key;

        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.centerTabWrapper}
              onPress={() => navigation.navigate(tab.key)}
              activeOpacity={0.85}
            >
              <View style={[styles.centerBtn, isFocused && styles.centerBtnActive]}>
                <Text style={styles.centerBtnText}>✦</Text>
                <Text style={styles.centerBtnLabel}>AI</Text>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
              <Text style={[styles.icon, isFocused && styles.iconActive]}>{tab.icon}</Text>
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },

  /* Regular tabs */
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 3,
  },
  iconWrapperActive: {
    backgroundColor: '#EEF2FF',
  },
  icon: {
    fontSize: 17,
    color: COLORS.grayLight,
  },
  iconActive: {
    color: COLORS.navy,
  },
  label: {
    fontSize: 8,
    color: COLORS.grayLight,
    ...FONTS.semiBold,
    letterSpacing: 0.4,
  },
  labelActive: {
    color: COLORS.navy,
    ...FONTS.bold,
  },

  /* Center AI tab */
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -18,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    gap: 1,
  },
  centerBtnActive: {
    backgroundColor: '#1A2F5A',
    shadowOpacity: 0.5,
  },
  centerBtnText: {
    color: COLORS.white,
    fontSize: 16,
  },
  centerBtnLabel: {
    color: COLORS.white,
    fontSize: 8,
    ...FONTS.extraBold,
    letterSpacing: 1,
  },
});
