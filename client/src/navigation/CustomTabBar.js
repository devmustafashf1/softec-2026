import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const TABS = [
  { key: 'Dashboard', label: 'DASHBOARD',  icon: '⊞' },
  { key: 'Accounts',  label: 'ACCOUNTS',   icon: '🗂' },
  { key: 'Messages',  label: 'MESSAGES',   icon: '💬' },
  { key: 'Payments',  label: 'PAYMENTS',   icon: '💳' },
  { key: 'Reports',   label: 'REPORTS',    icon: '📊' },
];

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.key);
        if (!route) return null;
        const isFocused = state.routes[state.index].name === tab.key;

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
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
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
});
