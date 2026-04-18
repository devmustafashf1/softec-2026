import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

export default function ClientPaymentProofScreen({ navigation }) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [note, setNote] = useState('');
  const [imageSelected, setImageSelected] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = () => {
    // TODO: wire to expo-image-picker
    Alert.alert('Upload Receipt', 'Image picker will be connected to the backend.', [
      { text: 'Simulate Upload', onPress: () => setImageSelected(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = () => {
    if (!imageSelected) {
      Alert.alert('Receipt Required', 'Please upload your payment receipt before submitting.');
      return;
    }
    if (!referenceNumber.trim()) {
      Alert.alert('Reference Required', 'Please enter your payment reference number.');
      return;
    }
    setSubmitting(true);
    // TODO: wire to backend
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Submitted',
        'Your payment proof has been submitted for verification. You will be notified once reviewed.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sovereign Ledger</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Submit Payment Proof</Text>
          <Text style={styles.subtitle}>
            Provide evidence of your bank transfer or check deposit to reconcile your account status.
          </Text>

          {/* Receipt upload */}
          <Text style={styles.fieldLabel}>RECEIPT IMAGE</Text>
          <TouchableOpacity
            style={[styles.uploadArea, imageSelected && styles.uploadAreaSelected]}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {imageSelected ? (
              <>
                <View style={styles.uploadIconCircleSelected}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
                <Text style={styles.uploadTextSelected}>Receipt Uploaded</Text>
                <Text style={styles.uploadHint}>Tap to change</Text>
              </>
            ) : (
              <>
                <View style={styles.uploadIconCircle}>
                  <Text style={styles.uploadArrow}>⬆</Text>
                </View>
                <Text style={styles.uploadText}>Upload Receipt</Text>
                <Text style={styles.uploadHint}>PNG, JPG or PDF up to 10MB</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Reference number */}
          <Text style={styles.fieldLabel}>REFERENCE NUMBER</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. TRN-882910"
            placeholderTextColor={COLORS.grayLight}
            value={referenceNumber}
            onChangeText={setReferenceNumber}
            autoCapitalize="characters"
          />

          {/* Note */}
          <Text style={styles.fieldLabel}>
            NOTE <Text style={styles.optional}>(OPTIONAL)</Text>
          </Text>
          <TextInput
            style={styles.textarea}
            placeholder="Additional details about this payment..."
            placeholderTextColor={COLORS.grayLight}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Privacy notice */}
          <View style={styles.privacyCard}>
            <Text style={styles.privacyIcon}>🛡</Text>
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Privacy Notice{'\n'}</Text>
              We do not collect card details here. This form is exclusively for verifying manual bank transfers and physical checks.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitIcon}>✔</Text>
                <Text style={styles.submitText}>Submit Proof for Verification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.base, color: COLORS.navy, ...FONTS.bold },
  backBtn: { padding: 4 },
  backIcon: { fontSize: SIZES.lg, color: COLORS.navy },

  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },

  title: {
    fontSize: SIZES.xxl,
    color: COLORS.navy,
    ...FONTS.extraBold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 28,
  },

  fieldLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 1.2,
    ...FONTS.semiBold,
    marginBottom: 10,
  },
  optional: { color: COLORS.grayLight, letterSpacing: 0.5 },

  uploadArea: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginBottom: 24,
  },
  uploadAreaSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenLight,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadIconCircleSelected: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadArrow: { fontSize: 22, color: COLORS.white },
  checkIcon: { fontSize: 22, color: COLORS.white, ...FONTS.bold },
  uploadText: { fontSize: SIZES.md, color: COLORS.navy, ...FONTS.bold, marginBottom: 4 },
  uploadTextSelected: { fontSize: SIZES.md, color: COLORS.green, ...FONTS.bold, marginBottom: 4 },
  uploadHint: { fontSize: SIZES.sm, color: COLORS.gray },

  input: {
    backgroundColor: COLORS.lightBg,
    borderRadius: SIZES.radiusSm,
    height: 52,
    paddingHorizontal: 16,
    fontSize: SIZES.md,
    color: COLORS.navy,
    marginBottom: 24,
  },
  textarea: {
    backgroundColor: COLORS.lightBg,
    borderRadius: SIZES.radiusSm,
    minHeight: 100,
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: SIZES.md,
    color: COLORS.navy,
    marginBottom: 24,
    lineHeight: 22,
  },

  privacyCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: SIZES.radiusSm,
    padding: 16,
    marginBottom: 28,
    gap: 12,
    alignItems: 'flex-start',
  },
  privacyIcon: { fontSize: 20, marginTop: 2 },
  privacyText: { flex: 1, fontSize: SIZES.sm, color: COLORS.gray, lineHeight: 18 },
  privacyBold: { ...FONTS.bold, color: COLORS.navy },

  submitButton: {
    backgroundColor: COLORS.navy,
    borderRadius: SIZES.radiusSm,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitDisabled: { opacity: 0.7 },
  submitIcon: { fontSize: 16, color: COLORS.white },
  submitText: { color: COLORS.white, fontSize: SIZES.md, ...FONTS.bold },
});
