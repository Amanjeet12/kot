import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';
import CustomPhoneKeypad from './CustomPhoneKeypad';

const formatPhone = phone => {
  if (!phone) return 'Enter 10-digit number';
  const first = phone.slice(0, 5);
  const second = phone.slice(5);
  return `+91 ${first}${second ? ` ${second}` : ''}`;
};

const CustomerDetailsStep = ({
  phone,
  customerName,
  resolvedCustomer,
  lookupStatus,
  lookupError,
  canContinue,
  onDigit,
  onBackspace,
  onClearPhone,
  onNameChange,
  onRetryLookup,
  onBack,
  onContinue,
  onCollapse,
}) => {
  const isExisting = lookupStatus === 'existing';
  const isNew = lookupStatus === 'new';
  const needsName = lookupStatus === 'needs-name';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to current order"
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Customer details</Text>
          <Text style={styles.subtitle}>
            Enter the customer's mobile number.
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Collapse current order"
          onPress={onCollapse}
          style={styles.collapseButton}
        >
          <Ionicons
            name="chevron-forward"
            size={19}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>PHONE NUMBER</Text>
        <View
          accessibilityRole="text"
          accessibilityLabel={`Phone number ${phone || 'empty'}`}
          style={[
            styles.phoneDisplay,
            phone.length === 10 && styles.phoneDisplayValid,
          ]}
        >
          <Ionicons
            name="call-outline"
            size={19}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.phoneText, !phone && styles.phonePlaceholder]}>
            {formatPhone(phone)}
          </Text>
          <Text style={styles.digitCount}>{phone.length}/10</Text>
        </View>

        {lookupStatus === 'loading' && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={theme.colors.primaryDark} />
            <Text style={styles.statusText}>Searching for customer...</Text>
          </View>
        )}

        {isExisting && (
          <View style={[styles.customerStatus, styles.existingStatus]}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.success}
            />
            <View style={styles.statusCopy}>
              <Text style={styles.customerStatusTitle}>Existing customer</Text>
              <Text style={styles.customerName}>{resolvedCustomer?.name}</Text>
              <Text style={styles.customerPhone}>+91 {phone}</Text>
            </View>
          </View>
        )}

        {(isNew || needsName) && (
          <View style={styles.newCustomerSection}>
            <View style={styles.newStatusRow}>
              <Ionicons
                name="person-add-outline"
                size={18}
                color={theme.colors.info}
              />
              <Text style={styles.newStatusText}>
                {needsName ? 'Customer name required' : 'New customer'}
              </Text>
            </View>
            <Text style={styles.label}>CUSTOMER NAME</Text>
            <TextInput
              value={customerName}
              onChangeText={onNameChange}
              placeholder="Enter customer name"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="words"
              maxLength={80}
              style={styles.nameInput}
            />
          </View>
        )}

        {lookupStatus === 'error' && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={theme.colors.error}
            />
            <View style={styles.statusCopy}>
              <Text style={styles.errorTitle}>Customer lookup failed</Text>
              <Text style={styles.errorText}>{lookupError}</Text>
              <TouchableOpacity
                onPress={onRetryLookup}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <CustomPhoneKeypad
          onDigit={onDigit}
          onBackspace={onBackspace}
          onClear={onClearPhone}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={!canContinue}
          onPress={onContinue}
          style={[styles.continueButton, !canContinue && styles.buttonDisabled]}
        >
          <Text
            style={[styles.continueText, !canContinue && styles.textDisabled]}
          >
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={
              canContinue ? theme.colors.textPrimary : theme.colors.textMuted
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomerDetailsStep;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceSecondary,
    marginRight: theme.spacing.sm,
  },
  headerCopy: { flex: 1 },
  collapseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  title: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: '700' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 3 },
  body: { flex: 1 },
  bodyContent: { padding: theme.spacing.lg, gap: theme.spacing.md },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phoneDisplay: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: theme.spacing.md,
  },
  phoneDisplayValid: { borderColor: theme.colors.success },
  phoneText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginLeft: theme.spacing.sm,
  },
  phonePlaceholder: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  digitCount: { color: theme.colors.textMuted, fontSize: 10 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusText: { color: theme.colors.textSecondary, fontSize: 11 },
  customerStatus: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  existingStatus: { borderColor: '#BBE4C8', backgroundColor: '#F0FDF4' },
  statusCopy: { flex: 1, marginLeft: theme.spacing.sm },
  customerStatusTitle: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  customerName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  customerPhone: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  newCustomerSection: { gap: theme.spacing.sm },
  newStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  newStatusText: { color: theme.colors.info, fontSize: 11, fontWeight: '800' },
  nameInput: {
    minHeight: 48,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F0C5C0',
    borderRadius: theme.radius.xl,
    backgroundColor: '#FEF2F2',
    padding: theme.spacing.md,
  },
  errorTitle: { color: theme.colors.error, fontSize: 11, fontWeight: '800' },
  errorText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  retryButton: { alignSelf: 'flex-start', marginTop: theme.spacing.sm },
  retryText: { color: theme.colors.error, fontSize: 12, fontWeight: '800' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  continueButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
  },
  buttonDisabled: { backgroundColor: theme.colors.surfaceSecondary },
  continueText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  textDisabled: { color: theme.colors.textMuted },
});
