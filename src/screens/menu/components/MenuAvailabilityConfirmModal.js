import React from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

const MenuAvailabilityConfirmModal = ({
  visible,
  item,
  isAvailable,
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!visible || !item || isAvailable === null) {
    return null;
  }

  const enabling = isAvailable;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!loading) {
              onClose();
            }
          }}
        />

        <View style={styles.modal}>
          <View
            style={[
              styles.iconContainer,
              enabling ? styles.enabledIcon : styles.disabledIcon,
            ]}
          >
            <Ionicons
              name={enabling ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={30}
              color={enabling ? theme.colors.success : theme.colors.error}
            />
          </View>

          <Text allowFontScaling={false} style={styles.title}>
            {enabling ? 'Make this item available?' : 'Disable this item?'}
          </Text>

          <Text allowFontScaling={false} style={styles.description}>
            {enabling
              ? 'Customers will be able to order this item from today’s tuck shop menu.'
              : 'Customers will no longer be able to order this item until you make it available again.'}
          </Text>

          <View style={styles.itemSummary}>
            <View style={styles.itemSummaryLeft}>
              <Text allowFontScaling={false} style={styles.itemName}>
                {item.name}
              </Text>
              <Text allowFontScaling={false} style={styles.itemInfo}>
                {item.category || 'Menu item'} · {item.stock} in stock
              </Text>
            </View>

            <Text allowFontScaling={false} style={styles.price}>
              ₹{item.price || 0}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              disabled={loading}
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text allowFontScaling={false} style={styles.cancelText}>
                Keep as is
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
              activeOpacity={0.8}
              onPress={onConfirm}
              style={[
                styles.confirmButton,
                enabling ? styles.enableButton : styles.disableButton,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={enabling ? theme.colors.textPrimary : theme.colors.error}
                />
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.confirmText,
                    !enabling && styles.disableText,
                  ]}
                >
                  {enabling ? 'Yes, make available' : 'Yes, disable item'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default MenuAvailabilityConfirmModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    padding: theme.spacing.xxl,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
  },
  iconContainer: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.xl,
  },
  enabledIcon: { backgroundColor: '#E7F7F0' },
  disabledIcon: { backgroundColor: '#FDE8E8' },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  itemSummary: {
    minHeight: 68,
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  itemSummaryLeft: { flex: 1, paddingRight: theme.spacing.md },
  itemName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  itemInfo: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  price: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.xl,
    backgroundColor: '#0D0F0E',
  },
  cancelText: { color: theme.colors.white, fontSize: 12, fontWeight: '800' },
  confirmButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.xl,
  },
  enableButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  disableButton: {
    borderColor: '#F3A6A6',
    backgroundColor: theme.colors.surface,
  },
  confirmText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  disableText: { color: theme.colors.error },
});
