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
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { api } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and access token.');
      return;
    }
    setLoading(true);
    try {
      await api.login({ email, password });
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Access Denied', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Brand header */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandName}>Sovereign Ledger</Text>
          <View style={styles.brandUnderline} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Access Secure{'\n'}Terminal</Text>
          <Text style={styles.cardSubtitle}>
            Enter your credentials to continue to the ledger.
          </Text>

          {/* Email field */}
          <Text style={styles.label}>CORPORATE EMAIL</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="agent.name@sovereign.io"
              placeholderTextColor={COLORS.grayLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password field */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>ACCESS TOKEN</Text>
            <TouchableOpacity>
              <Text style={styles.forgotText}>FORGOT?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
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
              <Text style={styles.buttonText}>INITIALIZE SESSION</Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New operative? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Request Access Portal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🛡</Text>
            <Text style={styles.badgeText}>AES-256{'\n'}ENCRYPTED</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🛡</Text>
            <Text style={styles.badgeText}>MFA{'\n'}ACTIVE</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🌐</Text>
            <Text style={styles.badgeText}>GLOBAL{'\n'}NODES</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  brandContainer: {
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  brandName: {
    fontSize: SIZES.xxl,
    color: COLORS.navy,
    ...FONTS.extraBold,
    letterSpacing: -0.5,
  },
  brandUnderline: {
    marginTop: 6,
    width: 48,
    height: 3,
    backgroundColor: COLORS.navy,
    borderRadius: 2,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: SIZES.xxl,
    color: COLORS.navy,
    ...FONTS.extraBold,
    lineHeight: 36,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    lineHeight: 20,
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
    fontSize: SIZES.xs,
    color: COLORS.navy,
    ...FONTS.bold,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 14,
    marginBottom: 20,
    height: 52,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    color: COLORS.gray,
  },
  input: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.navy,
    height: '100%',
  },
  eyeIcon: {
    fontSize: 16,
    color: COLORS.gray,
    paddingLeft: 8,
  },
  button: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    ...FONTS.bold,
    letterSpacing: 1.5,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  registerLink: {
    fontSize: SIZES.md,
    color: COLORS.navy,
    ...FONTS.bold,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  badge: {
    alignItems: 'center',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 18,
    color: COLORS.gray,
  },
  badgeText: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    textAlign: 'center',
    letterSpacing: 0.5,
    ...FONTS.semiBold,
  },
});
