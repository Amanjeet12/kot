import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';

import {
  clearAuthError,
  resendPhoneOtp,
  verifyPhoneOtp,
} from '../../store/slices/authSlice';

import { theme } from '../../constant';

const OTP_LENGTH = 6;

const RESEND_TIME = 30;

const OtpScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();

  const phone = route?.params?.phone || '';

  const { verifyOtpLoading, resendOtpLoading, error } = useSelector(
    state => state.auth,
  );

  const inputRefs = useRef([]);

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));

  const [resendTimer, setResendTimer] = useState(RESEND_TIME);

  /*
  |--------------------------------------------------------------------------
  | RESEND TIMER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setResendTimer(previous => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [resendTimer]);

  /*
  |--------------------------------------------------------------------------
  | OTP CHANGE
  |--------------------------------------------------------------------------
  */

  const handleOtpChange = (value, index) => {
    const cleaned = value.replace(/[^0-9]/g, '');

    const updatedOtp = [...otp];

    if (!cleaned) {
      updatedOtp[index] = '';

      setOtp(updatedOtp);

      dispatch(clearAuthError());

      return;
    }

    updatedOtp[index] = cleaned.slice(-1);

    setOtp(updatedOtp);

    dispatch(clearAuthError());

    /*
     * Automatically move
     * to next box.
     */

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BACKSPACE
  |--------------------------------------------------------------------------
  */

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFY OTP
  |--------------------------------------------------------------------------
  */

  const handleVerifyOtp = async () => {
    const finalOtp = otp.join('');

    if (finalOtp.length !== OTP_LENGTH) {
      return;
    }

    try {
      const response = await dispatch(
        verifyPhoneOtp({
          phone,
          otp: finalOtp,
        }),
      ).unwrap();

      console.log('OTP verified:', response);

      /*
       * DO NOT navigate manually.
       *
       * verifyPhoneOtp fulfilled:
       *
       * isAuthenticated = true
       *
       * RootNavigator will automatically
       * switch:
       *
       * AuthNavigator
       *       ↓
       * AppNavigator
       */
    } catch (error) {
      console.log('Verify OTP failed:', error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESEND OTP
  |--------------------------------------------------------------------------
  */

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendOtpLoading) {
      return;
    }

    try {
      const response = await dispatch(
        resendPhoneOtp({
          phone,
        }),
      ).unwrap();

      console.log('OTP resent:', response);

      /*
       * Clear previous OTP
       */

      setOtp(Array(OTP_LENGTH).fill(''));

      /*
       * Restart timer
       */

      setResendTimer(RESEND_TIME);

      /*
       * Focus first box
       */

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      console.log('Resend OTP failed:', error);
    }
  };

  const isOtpComplete = otp.every(item => item !== '');

  const verifyDisabled = !isOtpComplete || verifyOtpLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* BRAND */}

        <View style={styles.brandIcon}>
          <Text style={styles.brandIconText}>M</Text>
        </View>

        {/* TITLE */}

        <Text style={styles.title}>Verify your number</Text>

        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{' '}
          {phone || 'your mobile number'}.
        </Text>

        {/* CHANGE NUMBER */}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.changeNumber}>Change mobile number</Text>
        </TouchableOpacity>

        {/* OTP BOXES */}

        <View style={styles.codeRow}>
          {otp.map((value, index) => (
            <TextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeBox,

                value && styles.codeBoxFilled,

                error && styles.codeBoxError,
              ]}
              value={value}
              onChangeText={text => handleOtpChange(text, index)}
              onKeyPress={event => handleKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* ERROR */}

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* VERIFY */}

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={verifyDisabled}
          onPress={handleVerifyOtp}
          style={[styles.verifyButton, verifyDisabled && styles.disabledButton]}
        >
          {verifyOtpLoading ? (
            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        {/* RESEND */}

        <View style={styles.resendContainer}>
          <Text style={styles.resendLabel}>Didn't receive the code?</Text>

          {resendTimer > 0 ? (
            <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendOtpLoading}
            >
              <Text style={styles.resendText}>
                {resendOtpLoading ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent: 'center',

    padding: theme.spacing.xl,

    backgroundColor: theme.colors.background,
  },

  card: {
    width: '100%',

    maxWidth: 440,

    alignSelf: 'center',

    padding: theme.spacing.huge,

    backgroundColor: theme.colors.surface,

    borderRadius: theme.radius.card,

    ...theme.shadows.card,
  },

  brandIcon: {
    width: 52,

    height: 52,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: theme.spacing.xl,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.black,
  },

  brandIconText: {
    color: theme.colors.primary,

    fontSize: theme.typography.fontSize.xxl,

    fontWeight: theme.typography.fontWeight.extraBold,
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

    marginBottom: theme.spacing.sm,
  },

  changeNumber: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.base,

    fontWeight: theme.typography.fontWeight.semiBold,

    textDecorationLine: 'underline',

    marginBottom: theme.spacing.xxxl,
  },

  codeRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    gap: theme.spacing.sm,
  },

  codeBox: {
    flex: 1,

    maxWidth: 54,

    height: 56,

    padding: 0,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.lg,

    backgroundColor: theme.colors.surface,

    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.xxl,

    fontWeight: theme.typography.fontWeight.bold,
  },

  codeBoxFilled: {
    borderWidth: 2,

    borderColor: theme.colors.primary,

    backgroundColor: theme.colors.primaryLight,
  },

  codeBoxError: {
    borderColor: theme.colors.error,
  },

  errorText: {
    color: theme.colors.error,

    marginTop: theme.spacing.sm,

    fontSize: theme.typography.fontSize.sm,
  },

  verifyButton: {
    height: 56,

    marginTop: theme.spacing.xxxl,

    justifyContent: 'center',

    alignItems: 'center',

    borderRadius: theme.radius.lg,

    backgroundColor: theme.colors.primary,
  },

  disabledButton: {
    opacity: 0.45,
  },

  verifyButtonText: {
    color: theme.colors.textOnPrimary,

    fontSize: theme.typography.fontSize.md,

    fontWeight: theme.typography.fontWeight.bold,
  },

  resendContainer: {
    marginTop: theme.spacing.xxl,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    gap: theme.spacing.xs,
  },

  resendLabel: {
    color: theme.colors.textSecondary,

    fontSize: theme.typography.fontSize.base,
  },

  timerText: {
    color: theme.colors.textMuted,

    fontSize: theme.typography.fontSize.base,
  },

  resendText: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.base,

    fontWeight: theme.typography.fontWeight.bold,

    textDecorationLine: 'underline',
  },
});
