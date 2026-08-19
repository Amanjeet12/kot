import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { theme } from '../../constant/index';

import { useResponsive } from '../../contexts/ResponsiveContext';

// Later uncomment:
// import {sendOtp} from '../../api/services/auth.service';

const LoginScreen = ({ navigation }) => {
  const { isTablet } = useResponsive();

  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const handlePhoneChange = value => {
    const cleanedValue = value.replace(/[^0-9]/g, '');

    setPhone(cleanedValue);
    setError('');
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setError('Mobile number is required');

      return;
    }

    if (phone.length !== 10) {
      setError('Enter a valid 10 digit mobile number');

      return;
    }

    try {
      setLoading(true);
      setError('');

      /*
      const response =
        await sendOtp(phone);

      if (!response?.success) {
        throw new Error(
          response?.msg ||
            'Unable to send OTP',
        );
      }
      */

      console.log('Sending OTP:', phone);

      navigation.navigate('Otp', {
        phone,
      });
    } catch (err) {
      console.log('Send OTP error:', err);

      setError(
        err?.response?.data?.msg ||
          err?.message ||
          'Unable to send OTP. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = phone.length !== 10 || loading;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.page, isTablet && styles.tabletPage]}>
          {/* TABLET LEFT PANEL */}

          {isTablet && (
            <View style={styles.leftSection}>
              <View style={styles.brandIcon}>
                <Text style={styles.brandIconText}>M</Text>
              </View>

              <Text style={styles.brandName}>My App</Text>

              <Text style={styles.welcomeTitle}>Welcome Back</Text>

              <Text style={styles.welcomeDescription}>
                Login securely using your registered mobile number and manage
                your daily work from one place.
              </Text>
            </View>
          )}

          {/* RIGHT / MOBILE CONTENT */}

          <View
            style={[styles.rightSection, !isTablet && styles.mobileSection]}
          >
            <View style={[styles.card, isTablet && styles.tabletCard]}>
              {!isTablet && (
                <View style={styles.mobileBrand}>
                  <View style={styles.brandIcon}>
                    <Text style={styles.brandIconText}>M</Text>
                  </View>

                  <Text style={styles.mobileBrandText}>My App</Text>
                </View>
              )}

              <Text style={styles.title}>Login</Text>

              <Text style={styles.subtitle}>
                Enter your mobile number to continue
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mobile Number</Text>

                <View
                  style={[styles.phoneContainer, error && styles.errorBorder]}
                >
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>

                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    placeholder="Enter mobile number"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoCorrect={false}
                  />
                </View>

                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isDisabled}
                onPress={handleSendOtp}
                style={[styles.button, isDisabled && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.textPrimary}
                  />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By continuing, you agree to our Terms & Conditions and Privacy
                Policy.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scrollContainer: {
    flexGrow: 1,
  },

  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  tabletPage: {
    flexDirection: 'row',
  },

  leftSection: {
    flex: 1,

    backgroundColor: theme.colors.primary,

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.giant,

    paddingVertical: theme.spacing.massive,
  },

  brandIcon: {
    width: 52,
    height: 52,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.black,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: theme.spacing.md,
  },

  brandIconText: {
    color: theme.colors.primary,

    fontSize: theme.typography.fontSize.xxl,

    fontWeight: theme.typography.fontWeight.extraBold,
  },

  brandName: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.xxl,

    fontWeight: theme.typography.fontWeight.bold,

    marginBottom: theme.spacing.massive,
  },

  welcomeTitle: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.hero,

    fontWeight: theme.typography.fontWeight.extraBold,

    lineHeight: 50,

    marginBottom: theme.spacing.lg,
  },

  welcomeDescription: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.lg,

    lineHeight: theme.typography.lineHeight.lg,

    maxWidth: 440,

    opacity: 0.8,
  },

  rightSection: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    padding: theme.spacing.xxxl,

    backgroundColor: theme.colors.background,
  },

  mobileSection: {
    paddingHorizontal: theme.spacing.xl,
  },

  card: {
    width: '100%',
    maxWidth: 440,
  },

  tabletCard: {
    backgroundColor: theme.colors.surface,

    padding: theme.spacing.huge,

    borderRadius: theme.radius.card,

    ...theme.shadows.card,
  },

  mobileBrand: {
    alignItems: 'center',

    marginBottom: theme.spacing.massive,
  },

  mobileBrandText: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.xxl,

    fontWeight: theme.typography.fontWeight.bold,
  },

  title: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.heading,

    fontWeight: theme.typography.fontWeight.bold,

    marginBottom: theme.spacing.sm,
  },

  subtitle: {
    color: theme.colors.textSecondary,

    fontSize: theme.typography.fontSize.md,

    lineHeight: theme.typography.lineHeight.md,

    marginBottom: theme.spacing.xxxl,
  },

  formGroup: {
    marginBottom: theme.spacing.xxl,
  },

  label: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.base,

    fontWeight: theme.typography.fontWeight.semiBold,

    marginBottom: theme.spacing.sm,
  },

  phoneContainer: {
    height: 56,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: theme.colors.surface,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.lg,

    overflow: 'hidden',
  },

  errorBorder: {
    borderColor: theme.colors.error,
  },

  countryCodeContainer: {
    height: '100%',

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.lg,

    borderRightWidth: 1,

    borderRightColor: theme.colors.border,
  },

  countryCode: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.md,

    fontWeight: theme.typography.fontWeight.semiBold,
  },

  phoneInput: {
    flex: 1,

    height: '100%',

    paddingHorizontal: theme.spacing.lg,

    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.md,
  },

  errorText: {
    color: theme.colors.error,

    fontSize: theme.typography.fontSize.sm,

    marginTop: theme.spacing.sm,
  },

  button: {
    height: 56,

    backgroundColor: theme.colors.primary,

    borderRadius: theme.radius.lg,

    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonText: {
    color: theme.colors.textOnPrimary,

    fontSize: theme.typography.fontSize.md,

    fontWeight: theme.typography.fontWeight.bold,
  },

  termsText: {
    color: theme.colors.textMuted,

    fontSize: theme.typography.fontSize.sm,

    lineHeight: theme.typography.lineHeight.sm,

    textAlign: 'center',

    marginTop: theme.spacing.xl,
  },
});
