import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

const STATUS_DIALOG_CONFIG = {
  cancelled: {
    icon: 'alert-circle-outline',

    title: 'Cancel this order?',

    description:
      'This removes the order from the preparation queue. Use this only when the tuck shop cannot fulfil it.',

    confirmText: 'Yes, cancel order',

    slideText: 'Slide to cancel order',

    iconColor: theme.colors.error,

    iconBackground: '#FDE8E8',

    confirmBackground: theme.colors.surface,

    confirmColor: theme.colors.error,

    dangerous: true,
  },

  ready: {
    icon: 'checkmark-circle-outline',

    title: 'Mark order as ready?',

    description:
      'Use this when all items have been prepared and the order is ready for customer collection.',

    confirmText: 'Yes, mark ready',

    slideText: 'Slide to mark ready',

    iconColor: theme.colors.success,

    iconBackground: '#E7F7F0',

    confirmBackground: theme.colors.primary,

    confirmColor: theme.colors.textPrimary,

    dangerous: false,
  },

  delivered: {
    icon: 'bag-check-outline',

    title: 'Mark order as delivered?',

    description:
      'Confirm that the customer has collected this order. This will complete the order.',

    confirmText: 'Yes, mark delivered',

    slideText: 'Slide to mark delivered',

    iconColor: theme.colors.success,

    iconBackground: '#E7F7F0',

    confirmBackground: theme.colors.primary,

    confirmColor: theme.colors.textPrimary,

    dangerous: false,
  },
};

const OrderStatusConfirmModal = ({
  visible,
  order,
  nextStatus,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const dragStart = useRef(0);
  const loadingRef = useRef(loading);
  const onConfirmRef = useRef(onConfirm);

  const thumbSize = 48;
  const trackPadding = 4;
  const maxDrag = Math.max(0, trackWidth - thumbSize - trackPadding * 2);
  const maxDragRef = useRef(maxDrag);

  loadingRef.current = loading;
  onConfirmRef.current = onConfirm;
  maxDragRef.current = maxDrag;

  useEffect(() => {
    translateX.setValue(0);
  }, [visible, nextStatus, translateX]);

  const resetSlider = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      speed: 22,
      bounciness: 5,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !loadingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !loadingRef.current && Math.abs(gestureState.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        translateX.stopAnimation(value => {
          dragStart.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const dragLimit = maxDragRef.current;
        const nextPosition = Math.min(
          Math.max(0, dragStart.current + gestureState.dx),
          dragLimit,
        );
        translateX.setValue(nextPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dragLimit = maxDragRef.current;
        const finalPosition = Math.min(
          Math.max(0, dragStart.current + gestureState.dx),
          dragLimit,
        );

        if (
          dragLimit > 0 &&
          finalPosition >= dragLimit * 0.78 &&
          !loadingRef.current
        ) {
          Animated.timing(translateX, {
            toValue: dragLimit,
            duration: 120,
            useNativeDriver: false,
          }).start(() => onConfirmRef.current());
          return;
        }

        resetSlider();
      },
      onPanResponderTerminate: resetSlider,
    }),
  ).current;

  if (!visible || !order || !nextStatus) {
    return null;
  }

  const config = STATUS_DIALOG_CONFIG[nextStatus];

  if (!config) {
    return null;
  }

  const itemCount = order?.items?.length || 0;

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
          {/* ICON */}

          <View
            style={[
              styles.iconContainer,

              {
                backgroundColor: config.iconBackground,
              },
            ]}
          >
            <Ionicons name={config.icon} size={30} color={config.iconColor} />
          </View>

          {/* TITLE */}

          <Text allowFontScaling={false} style={styles.title}>
            {config.title}
          </Text>

          {/* DESCRIPTION */}

          <Text allowFontScaling={false} style={styles.description}>
            {config.description}
          </Text>

          {/* ORDER SUMMARY */}

          <View style={styles.orderSummary}>
            <View style={styles.orderSummaryLeft}>
              <Text allowFontScaling={false} style={styles.orderNumber}>
                Order #{order.orderNumber || order.id}
                {' · '}
                KOT #{order.kotId || order.id}
              </Text>

              <Text allowFontScaling={false} style={styles.orderInfo}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                {' · '}
                {order.customerName || 'Customer'}
              </Text>
            </View>

            <Text allowFontScaling={false} style={styles.amount}>
              ₹{order.totalAmount || 0}
            </Text>
          </View>

          {/* SLIDE TO CONFIRM */}

          <View
            {...(!loading ? panResponder.panHandlers : {})}
            accessibilityLabel={config.slideText}
            accessibilityRole="adjustable"
            accessibilityHint="Drag the handle all the way to the right to confirm"
            style={[
              styles.sliderTrack,
              config.dangerous && styles.dangerSliderTrack,
            ]}
            onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.sliderText,
                config.dangerous && styles.dangerSliderText,
              ]}
            >
              {loading ? 'Updating order...' : config.slideText}
            </Text>

            <Animated.View
              style={[
                styles.sliderThumb,
                config.dangerous && styles.dangerSliderThumb,
                { transform: [{ translateX }] },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={config.confirmColor} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={config.confirmColor}
                />
              )}
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default OrderStatusConfirmModal;

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

    borderRadius: theme.radius.xl,

    marginBottom: theme.spacing.lg,
  },

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

  orderSummary: {
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

  orderSummaryLeft: {
    flex: 1,

    paddingRight: theme.spacing.md,
  },

  orderNumber: {
    color: theme.colors.textPrimary,

    fontSize: 14,

    fontWeight: '800',
  },

  orderInfo: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 11,
  },

  amount: {
    color: theme.colors.textPrimary,

    fontSize: 16,

    fontWeight: '800',
  },

  sliderTrack: {
    height: 56,
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
    overflow: 'hidden',
  },

  dangerSliderTrack: {
    borderWidth: 1,
    borderColor: '#F3A6A6',
    backgroundColor: '#FDE8E8',
  },

  sliderText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  dangerSliderText: {
    color: theme.colors.error,
  },

  sliderThumb: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },

  dangerSliderThumb: {
    backgroundColor: theme.colors.surface,
  },
});
