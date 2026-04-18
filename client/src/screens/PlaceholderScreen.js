import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function PlaceholderScreen({ route }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>{route.name}</Text>
        <Text style={styles.sub}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.lightBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: SIZES.xl, color: COLORS.navy, ...FONTS.bold, marginBottom: 8 },
  sub: { fontSize: SIZES.md, color: COLORS.gray },
});
