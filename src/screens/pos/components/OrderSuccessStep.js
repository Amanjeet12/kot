import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

const OrderSuccessStep = ({ orderNumber, onNewOrder, onCollapse }) => (
  <View style={styles.container}>
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
    <View style={styles.iconCircle}>
      <Ionicons name="checkmark" size={34} color={theme.colors.white} />
    </View>
    <Text style={styles.title}>Order placed</Text>
    <Text style={styles.message}>The order was created successfully.</Text>
    <View style={styles.orderNumberCard}>
      <Text style={styles.label}>ORDER NUMBER</Text>
      <Text style={styles.orderNumber}>{orderNumber}</Text>
    </View>
    <TouchableOpacity onPress={onNewOrder} style={styles.button}>
      <Text style={styles.buttonText}>Start new order</Text>
      <Ionicons
        name="arrow-forward"
        size={18}
        color={theme.colors.textPrimary}
      />
    </TouchableOpacity>
  </View>
);

export default OrderSuccessStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  collapseButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  iconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: theme.colors.success,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: theme.spacing.lg,
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  orderNumberCard: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderNumber: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: theme.spacing.xs,
  },
  button: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.xl,
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
});
