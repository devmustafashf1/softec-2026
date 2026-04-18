import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { api } from '../../services/api';

export default function ClientLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.clientLogin({ username: username.trim(), password });
      navigation.replace('ClientMain', { user: data.user });
    } catch (err) {
      Alert.alert('Access Denied', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🛡</Text>
          </View>
          <Text style={styles.logoText}>Aegis Ledger</Text>
        </View>

        {/* Hero */}
        <Text style={styles.heroTitle}>Secure Access</Text>
        <Text style={styles.heroSubtitle}>
          Enter your sovereign credentials to manage your ledger.
        </Text>

        {/* Form card */}
        <View style={styles.card}>
          {/* Username */}
          <Text style={styles.label}>USERNAME</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Your username"
              placeholderTextColor={COLORS.grayLight}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>PASSWORD</Text>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔑</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={COLORS.grayLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Secure Login  →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Support */}
        <Text style={styles.supportText}>
          Need assistance?{' '}
          <Text style={styles.supportLink}>
            Contact Support if you can't access your portal
          </Text>
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 AEGIS LEDGER SYSTEMS</Text>
          <Text style={styles.footerDot}>·</Text>
          <Text style={styles.footerText}>PRIVACY PROTOCOL</Text>
        </View>

        {/* Back to admin */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Admin Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.navy,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoIconText: { fontSize: 18 },
  logoText: {
    fontSize: SIZES.lg,
    color: COLORS.navy,
    ...FONTS.extraBold,
  },

  heroTitle: {
    fontSize: 36,
    color: COLORS.navy,
    ...FONTS.extraBold,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: SIZES.base,
    color: COLORS.gray,
    lineHeight: 22,
    marginBottom: 32,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 28,
  },

  label: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.2,
    ...FONTS.semiBold,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: SIZES.sm,
    color: COLORS.navy,
    ...FONTS.semiBold,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
  },
  inputIcon: { fontSize: 16, marginRight: 10, color: COLORS.gray },
  input: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.navy,
    height: '100%',
  },
  eyeIcon: { fontSize: 16, color: COLORS.gray, paddingLeft: 8 },

  button: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },

  supportText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  supportLink: { color: COLORS.navy, ...FONTS.bold },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  footerText: {
    fontSize: SIZES.xs,
    color: COLORS.grayLight,
    letterSpacing: 0.5,
    ...FONTS.semiBold,
  },
  footerDot: { color: COLORS.grayLight, fontSize: SIZES.sm },

  backButton: { alignItems: 'center', paddingVertical: 8 },
  backText: { fontSize: SIZES.sm, color: COLORS.gray, ...FONTS.medium },
});
