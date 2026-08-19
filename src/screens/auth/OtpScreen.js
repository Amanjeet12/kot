import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {theme} from '../../constant';

const OtpScreen = ({route}) => {
  const phone = route?.params?.phone || '';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandIconText}>M</Text>
        </View>

        <Text style={styles.title}>Verify your number</Text>

        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {phone ? `+91 ${phone}` : 'your mobile number'}.
        </Text>

        <View style={styles.codeRow}>
          {Array.from({length: 6}, (_, index) => (
            <View key={index} style={styles.codeBox} />
          ))}
        </View>

        <Text style={styles.resendText}>Did not receive the code? Resend</Text>
      </View>
    </View>
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
    marginBottom: theme.spacing.xxxl,
  },

  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xxl,
  },

  codeBox: {
    width: 42,
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },

  resendText: {
    color: theme.colors.info,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    textAlign: 'center',
  },
});