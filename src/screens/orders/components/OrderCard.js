import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

import { useResponsive } from '../../../contexts/ResponsiveContext';

const MAX_PREVIEW_ITEMS = 3;

const formatDuration = seconds => {
  const minutes = Math.floor((seconds || 0) / 60);

  const remainingSeconds = (seconds || 0) % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
};

const OrderItem = ({ item }) => {
  return (
    <View style={styles.orderItem}>
      <View style={styles.quantityBox}>
        <Text allowFontScaling={false} style={styles.quantity}>
          {item.quantity}×
        </Text>
      </View>

      <View style={styles.itemContent}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={styles.itemName}
        >
          {item.name}
        </Text>

        {!!item.description && (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={styles.itemDescription}
          >
            {item.description}
          </Text>
        )}
      </View>

      <Text allowFontScaling={false} style={styles.itemPrice}>
        ₹{item.price}
      </Text>
    </View>
  );
};

const OrderCard = ({
  order,
  isNext,
  onStartPreparation,
  onCancel,
  onViewDetails,
}) => {
  const { isTablet, isLargeTablet } = useResponsive();

  const isPreparing = order.status === 'preparing';

  const items = order?.items || [];

  const previewItems = items.slice(0, MAX_PREVIEW_ITEMS);

  const remainingItems = Math.max(items.length - MAX_PREVIEW_ITEMS, 0);

  /*
   * Keep every card same height.
   * Bottom buttons remain visible.
   */
  const cardHeight = isLargeTablet ? 420 : isTablet ? 415 : 435;

  return (
    <View
      style={[
        styles.card,
        {
          height: cardHeight,
        },
      ]}
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.rankBadge}>
            <Text allowFontScaling={false} style={styles.rankText}>
              #{order.rank}
              {isNext ? ' NEXT' : ''}
            </Text>
          </View>

          <Text allowFontScaling={false} style={styles.orderTitle}>
            KOT #{order.id}
          </Text>

          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={styles.orderMeta}
          >
            Order #{order.orderNumber}
            {' · '}
            {order.orderTime}
          </Text>
        </View>

        {/* TIMER + STATUS */}

        <View style={styles.timerContainer}>
          {/* STATUS MOVED HERE */}

          <View
            style={[
              styles.topStatusBadge,

              isPreparing && styles.preparingBadge,
            ]}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.topStatusText,

                isPreparing && styles.preparingText,
              ]}
            >
              {isPreparing ? 'Preparing' : 'Confirmed'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ================================================= */}
      {/* CUSTOMER */}
      {/* ================================================= */}

      <View style={styles.customerBox}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={styles.customerName}
        >
          {order.customerName}
        </Text>

        <Text allowFontScaling={false} numberOfLines={1} style={styles.payment}>
          {order.paymentType}
          {' · '}₹{order.totalAmount}
        </Text>
      </View>

      {/* ================================================= */}
      {/* ITEMS PREVIEW */}
      {/* ================================================= */}

      <View style={styles.itemsSection}>
        {previewItems.map((item, index) => (
          <OrderItem key={item.id ?? `${order.id}-${index}`} item={item} />
        ))}

        {remainingItems > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onViewDetails}
            style={styles.moreItemsRow}
          >
            <Text allowFontScaling={false} style={styles.moreItemsText}>
              + {remainingItems} more {remainingItems === 1 ? 'item' : 'items'}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={14}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ================================================= */}
      {/* BOTTOM */}
      {/* ================================================= */}

      <View style={styles.bottomSection}>
        {/* ITEM COUNT + VIEW DETAILS */}

        <View style={styles.detailsRow}>
          <Text allowFontScaling={false} style={styles.itemCount}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onViewDetails}
            style={styles.detailsButton}
          >
            <Text allowFontScaling={false} style={styles.detailsText}>
              View details
            </Text>

            <Ionicons
              name="chevron-forward"
              size={15}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* ACTIONS */}

        <View style={styles.actions}>
          {isPreparing ? (
            <View style={styles.lockedButton}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={styles.lockedText}
              >
                Preparation in progress
                {' · '}Actions locked
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.primaryButton}
                onPress={onStartPreparation}
              >
                <Text allowFontScaling={false} style={styles.primaryButtonText}>
                  Start preparation
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text allowFontScaling={false} style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',

    overflow: 'hidden',

    backgroundColor: theme.colors.surface,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.card,
  },

  /* HEADER */

  header: {
    minHeight: 86,

    flexDirection: 'row',

    justifyContent: 'space-between',

    paddingHorizontal: theme.spacing.md,

    paddingTop: theme.spacing.sm,

    paddingBottom: theme.spacing.sm,
  },

  headerLeft: {
    flex: 1,

    paddingRight: theme.spacing.sm,
  },

  rankBadge: {
    alignSelf: 'flex-start',

    minHeight: 22,

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.sm,

    marginBottom: 2,

    borderRadius: theme.radius.sm,

    backgroundColor: theme.colors.black,
  },

  rankText: {
    color: theme.colors.primary,

    fontSize: 8,

    fontWeight: '800',
  },

  orderTitle: {
    color: theme.colors.textPrimary,

    fontSize: 19,

    lineHeight: 22,

    fontWeight: '800',
  },

  orderMeta: {
    marginTop: 2,

    color: theme.colors.textSecondary,

    fontSize: 7,
  },

  /* TIMER */

  timerContainer: {
    alignItems: 'flex-end',

    paddingTop: 5,
  },

  timer: {
    color: theme.colors.textPrimary,

    fontSize: 16,

    fontWeight: '800',
  },

  timerLabel: {
    marginTop: 1,

    color: theme.colors.textSecondary,

    fontSize: 7,
  },

  /* STATUS AT TOP */

  topStatusBadge: {
    marginTop: 5,

    minHeight: 20,

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.sm,

    borderRadius: theme.radius.sm,

    backgroundColor: theme.colors.primaryLight,
  },

  preparingBadge: {
    backgroundColor: '#E8EFFC',
  },

  topStatusBadge: {
    marginTop: 5,

    minHeight: 26,

    justifyContent: 'center',

    alignItems: 'center',

    paddingHorizontal: theme.spacing.sm + 2,

    paddingVertical: 3,

    borderRadius: theme.radius.md,

    backgroundColor: theme.colors.primaryLight,
  },

  topStatusText: {
    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '800',
  },

  preparingText: {
    color: theme.colors.info,
  },

  divider: {
    height: 1,

    backgroundColor: theme.colors.border,
  },

  /* CUSTOMER */

  customerBox: {
    height: 40,

    marginHorizontal: theme.spacing.sm,

    marginTop: theme.spacing.sm,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: theme.spacing.md,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surfaceSecondary,
  },

  customerName: {
    flex: 1,

    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '700',
  },

  payment: {
    maxWidth: '48%',

    marginLeft: theme.spacing.sm,

    color: theme.colors.textSecondary,

    fontSize: 7,

    textAlign: 'right',
  },

  /* ITEMS */

  itemsSection: {
    paddingHorizontal: theme.spacing.sm,

    paddingTop: theme.spacing.xs,
  },

  orderItem: {
    height: 45,

    flexDirection: 'row',

    alignItems: 'center',

    borderBottomWidth: 1,

    borderBottomColor: theme.colors.border,
  },

  quantityBox: {
    width: 32,
    height: 32,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: theme.spacing.sm,

    borderRadius: theme.radius.lg,

    backgroundColor: theme.colors.primaryLight,
  },

  quantity: {
    color: theme.colors.textPrimary,

    fontSize: 12,

    fontWeight: '800',
  },

  itemContent: {
    flex: 1,

    marginRight: theme.spacing.sm,
  },

  itemName: {
    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '700',
  },

  itemDescription: {
    marginTop: 1,

    color: theme.colors.textSecondary,

    fontSize: 7,
  },

  itemPrice: {
    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '800',
  },

  moreItemsRow: {
    height: 27,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    gap: 2,
  },

  moreItemsText: {
    color: theme.colors.textSecondary,

    fontSize: 8,

    fontWeight: '700',
  },

  /* BOTTOM */

  bottomSection: {
    marginTop: 'auto',
  },

  /*
   * Replaces old status footer.
   */

  detailsRow: {
    height: 35,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: theme.spacing.sm,

    borderTopWidth: 1,

    borderTopColor: theme.colors.border,
  },

  itemCount: {
    color: theme.colors.textSecondary,

    fontSize: 8,

    fontWeight: '700',
  },

  detailsButton: {
    height: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 2,
  },

  detailsText: {
    color: theme.colors.textPrimary,

    fontSize: 9,

    fontWeight: '700',
  },

  /* ACTION */

  actions: {
    height: 58,

    flexDirection: 'row',

    alignItems: 'center',

    gap: theme.spacing.sm,

    padding: theme.spacing.sm,

    borderTopWidth: 1,

    borderTopColor: theme.colors.border,
  },

  primaryButton: {
    flex: 1,

    height: 42,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.primary,
  },

  primaryButtonText: {
    color: theme.colors.textOnPrimary,

    fontSize: 9,

    fontWeight: '800',
  },

  cancelButton: {
    minWidth: 74,

    height: 42,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#F3A6A6',

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surface,
  },

  cancelButtonText: {
    color: theme.colors.error,

    fontSize: 8,

    fontWeight: '700',
  },

  lockedButton: {
    flex: 1,

    height: 42,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.md,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surfaceSecondary,
  },

  lockedText: {
    color: theme.colors.textSecondary,

    fontSize: 8,

    fontWeight: '700',

    textAlign: 'center',
  },
});
