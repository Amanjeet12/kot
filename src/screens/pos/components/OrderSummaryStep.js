import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

const OrderSummaryStep = ({
  customer,
  isExistingCustomer,
  items,
  totalQuantity,
  totalAmount,
  isPlacingOrder,
  orderError,
  onBack,
  onPlaceOrder,
  onCollapse,
}) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityLabel="Back to customer details"
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
        <Text style={styles.title}>Order summary</Text>
        <Text style={styles.subtitle}>Review before placing the order.</Text>
      </View>
      <TouchableOpacity
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

    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      <View style={styles.customerCard}>
        <View style={styles.customerTopRow}>
          <Text style={styles.customerName}>{customer?.name}</Text>
          <Text style={styles.customerStatus}>
            {isExistingCustomer ? 'Existing customer' : 'New customer'}
          </Text>
        </View>
        <Text style={styles.customerPhone}>+91 {customer?.phone}</Text>
      </View>

      <Text style={styles.sectionTitle}>ITEMS</Text>
      {items.map(item => (
        <View key={item.id} style={styles.itemRow}>
          <View style={styles.itemCopy}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCalculation}>
              {item.quantity} × ₹{item.price}
            </Text>
          </View>
          <Text style={styles.lineTotal}>₹{item.price * item.quantity}</Text>
        </View>
      ))}

      {orderError ? (
        <View style={styles.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={19}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{orderError}</Text>
        </View>
      ) : null}
    </ScrollView>

    <View style={styles.footer}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{totalQuantity} items</Text>
        <Text style={styles.totalAmount}>₹{totalAmount}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          disabled={isPlacingOrder}
          onPress={onBack}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isPlacingOrder}
          onPress={onPlaceOrder}
          style={[styles.placeButton, isPlacingOrder && styles.buttonDisabled]}
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
          ) : (
            <>
              <Text style={styles.placeText}>
                {orderError ? 'Retry order' : 'Place order'}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={theme.colors.textPrimary}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default OrderSummaryStep;

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
  bodyContent: { padding: theme.spacing.lg },
  customerCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  customerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  customerName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  customerStatus: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  customerPhone: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  itemRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  itemCopy: { flex: 1, paddingRight: theme.spacing.sm },
  itemName: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  itemCalculation: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  lineTotal: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#F0C5C0',
    borderRadius: theme.radius.xl,
    backgroundColor: '#FEF2F2',
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  errorText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  totalLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  totalAmount: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  actionRow: { flexDirection: 'row', gap: theme.spacing.sm },
  secondaryButton: {
    height: 48,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
  },
  secondaryText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  placeButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
  },
  placeText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonDisabled: { opacity: 0.65 },
});
