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

const INDUSTRIES = [
  'Financial Services',
  'Banking',
  'Insurance',
  'Real Estate',
  'Legal',
  'Healthcare',
  'Retail',
  'Technology',
  'Other',
];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    companyName: '',
    industry: 'Financial Services',
    contactPerson: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    if (!form.companyName || !form.contactPerson || !form.email || !form.password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await api.register(form);
      Alert.alert('Access Granted', 'Your account has been created. You may now sign in.', [
        { text: 'Sign In', onPress: () => navigation.replace('Login') },
      ]);
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerBrand}>Sovereign Ledger</Text>
        </View>

        {/* Hero */}
        <Text style={styles.protocol}>ESTABLISH PROTOCOL</Text>
        <Text style={styles.heroTitle}>Aegis Ledger{'\n'}Onboarding.</Text>
        <Text style={styles.heroSubtitle}>
          Join the sovereign financial infrastructure. Aegis Ledger provides
          institutional-grade debt collection and ledger reconciliation with
          unparalleled precision.
        </Text>

        {/* Feature highlights */}
        <View style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Text style={styles.featureIconText}>🛡</Text>
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Sovereign Encryption</Text>
              <Text style={styles.featureDesc}>Military-grade protocols protecting every ledger entry.</Text>
            </View>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Text style={styles.featureIconText}>⚡</Text>
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Real-time Velocity</Text>
              <Text style={styles.featureDesc}>Instant transaction verification across all accounts.</Text>
            </View>
          </View>
        </View>

        {/* Section 01 — Corporate Identity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNum}>01</Text>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>CORPORATE IDENTITY</Text>
        </View>

        <Text style={styles.fieldLabel}>COMPANY NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sterling Capital"
          placeholderTextColor={COLORS.grayLight}
          value={form.companyName}
          onChangeText={(v) => update('companyName', v)}
        />

        <Text style={styles.fieldLabel}>INDUSTRY</Text>
        <TouchableOpacity
          style={styles.pickerWrapper}
          onPress={() => setShowIndustryPicker(!showIndustryPicker)}
          activeOpacity={0.8}
        >
          <Text style={styles.pickerText}>{form.industry}</Text>
          <Text style={styles.pickerChevron}>▾</Text>
        </TouchableOpacity>
        {showIndustryPicker && (
          <View style={styles.dropdown}>
            {INDUSTRIES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.dropdownItem, form.industry === item && styles.dropdownItemActive]}
                onPress={() => {
                  update('industry', item);
                  setShowIndustryPicker(false);
                }}
              >
                <Text style={[styles.dropdownText, form.industry === item && styles.dropdownTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Section 02 — Authorized Contact */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNum}>02</Text>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>AUTHORIZED CONTACT</Text>
        </View>

        <Text style={styles.fieldLabel}>CONTACT PERSON</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Legal Name"
          placeholderTextColor={COLORS.grayLight}
          value={form.contactPerson}
          onChangeText={(v) => update('contactPerson', v)}
        />

        <Text style={styles.fieldLabel}>INSTITUTIONAL EMAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="name@company.com"
          placeholderTextColor={COLORS.grayLight}
          value={form.email}
          onChangeText={(v) => update('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Section 03 — Security Verification */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNum}>03</Text>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>SECURITY VERIFICATION</Text>
        </View>

        <Text style={styles.fieldLabel}>CREATE PASSWORD</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••••••"
            placeholderTextColor={COLORS.grayLight}
            value={form.password}
            onChangeText={(v) => update('password', v)}
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
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account  →</Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          By registering, you agree to the{' '}
          <Text style={styles.termsLink}>Sovereign Terms of Protocol</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Charter</Text>.
        </Text>

        {/* Sign in link */}
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInText}>Already an agent?  </Text>
          <Text style={styles.signInLink}>Sign In</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <View style={styles.statusDot} />
            <View>
              <Text style={styles.footerLabel}>SYSTEM STATUS</Text>
              <Text style={styles.footerValue}>Operational</Text>
            </View>
          </View>
          <View style={styles.footerItem}>
            <View>
              <Text style={styles.footerLabel}>ENCRYPTED</Text>
              <Text style={styles.footerValue}>AES-256 Enabled</Text>
            </View>
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
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBrand: {
    fontSize: SIZES.base,
    color: COLORS.navy,
    ...FONTS.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  protocol: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.5,
    ...FONTS.semiBold,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    color: COLORS.navy,
    ...FONTS.extraBold,
    lineHeight: 42,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    lineHeight: 22,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIconText: {
    fontSize: 18,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: SIZES.md,
    color: COLORS.navy,
    ...FONTS.bold,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    lineHeight: 18,
  },
  featureDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  sectionNum: {
    fontSize: SIZES.xxl,
    color: COLORS.navy,
    ...FONTS.extraBold,
    marginRight: 12,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    marginRight: 12,
  },
  sectionLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.2,
    ...FONTS.semiBold,
  },
  fieldLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.2,
    ...FONTS.semiBold,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radiusSm,
    height: 52,
    paddingHorizontal: 16,
    fontSize: SIZES.md,
    color: COLORS.navy,
    marginBottom: 20,
  },
  pickerWrapper: {
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radiusSm,
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickerText: {
    fontSize: SIZES.md,
    color: COLORS.navy,
  },
  pickerChevron: {
    fontSize: 16,
    color: COLORS.gray,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownText: {
    fontSize: SIZES.md,
    color: COLORS.navy,
  },
  dropdownTextActive: {
    ...FONTS.bold,
  },
  passwordWrapper: {
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radiusSm,
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  passwordInput: {
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
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  terms: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  termsLink: {
    color: COLORS.navy,
    ...FONTS.semiBold,
  },
  signInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    height: 50,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  signInText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  signInLink: {
    fontSize: SIZES.md,
    color: COLORS.navy,
    ...FONTS.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  footerLabel: {
    fontSize: SIZES.xs,
    color: COLORS.grayLight,
    letterSpacing: 0.8,
    ...FONTS.semiBold,
  },
  footerValue: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    ...FONTS.medium,
  },
});
