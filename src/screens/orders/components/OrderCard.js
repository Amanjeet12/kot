import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

import { useResponsive } from '../../../contexts/ResponsiveContext';

const MAX_PREVIEW_ITEMS = 3;

/*
|--------------------------------------------------------------------------
| ORDER ITEM
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| ORDER CARD
|--------------------------------------------------------------------------
*/

const OrderCard = ({ order, isNext, onChangeStatus, onViewDetails }) => {
  const { isTablet, isLargeTablet } = useResponsive();

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const status = order?.status?.toLowerCase()?.trim();

  const isConfirmed = status === 'confirmed';

  const isPreparing = status === 'preparing';

  const isReady = status === 'ready';

  /*
  |--------------------------------------------------------------------------
  | ITEMS
  |--------------------------------------------------------------------------
  */

  const items = order?.items || [];

  const previewItems = items.slice(0, MAX_PREVIEW_ITEMS);

  const remainingItems = Math.max(items.length - MAX_PREVIEW_ITEMS, 0);

  /*
  |--------------------------------------------------------------------------
  | SAME CARD HEIGHT FOR ALL STATUS
  |--------------------------------------------------------------------------
  */

  const cardHeight = isLargeTablet ? 420 : isTablet ? 415 : 435;

  /*
  |--------------------------------------------------------------------------
  | STATUS CONFIG
  |--------------------------------------------------------------------------
  */

  const statusConfig = (() => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          background: '#F3F4F6',
          color: theme.colors.textSecondary,
        };

      case 'confirmed':
        return {
          label: 'Confirmed',
          background: theme.colors.primaryLight,
          color: '#8A6A00',
        };

      case 'preparing':
        return {
          label: 'Preparing',
          background: '#E8EFFC',
          color: theme.colors.info,
        };

      case 'ready':
        return {
          label: 'Ready',
          background: '#E7F7F0',
          color: theme.colors.success,
        };

      case 'delivered':
        return {
          label: 'Delivered',
          background: '#E7F7F0',
          color: theme.colors.success,
        };

      case 'cancelled':
        return {
          label: 'Cancelled',
          background: '#FDEAEA',
          color: theme.colors.error,
        };

      case 'failed':
        return {
          label: 'Failed',
          background: '#FDEAEA',
          color: theme.colors.error,
        };

      default:
        return {
          label: status || 'Unknown',

          background: theme.colors.surfaceSecondary,

          color: theme.colors.textSecondary,
        };
    }
  })();

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
        {/* TOP ROW */}
        {/* This row always has same height */}

        <View style={styles.headerTopRow}>
          {/* RANK */}

          <View style={styles.rankArea}>
            {isConfirmed && order?.rank && (
              <View style={styles.rankBadge}>
                <Text allowFontScaling={false} style={styles.rankText}>
                  #{order.rank}
                  {isNext ? ' NEXT' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* STATUS */}

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusConfig.background,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusConfig.color,
                },
              ]}
            />

            <Text
              allowFontScaling={false}
              style={[
                styles.statusText,
                {
                  color: statusConfig.color,
                },
              ]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* ORDER TITLE */}

        <Text allowFontScaling={false} style={styles.orderTitle}>
          KOT #{order.id}
        </Text>

        {/* ORDER META */}

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
      {/* ITEM PREVIEW */}
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
        {/* ITEM COUNT + DETAILS */}

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

        {/* ================================================= */}
        {/* CONFIRMED */}
        {/* ================================================= */}

        {isConfirmed && (
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.primaryButton}
              onPress={() => onChangeStatus?.('preparing')}
            >
              <Text allowFontScaling={false} style={styles.primaryButtonText}>
                Start preparation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.cancelButton}
              onPress={() => onChangeStatus?.('cancelled')}
            >
              <Text allowFontScaling={false} style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================= */}
        {/* PREPARING */}
        {/* ================================================= */}

        {isPreparing && (
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.primaryButton}
              onPress={() => onChangeStatus?.('ready')}
            >
              <Ionicons
                name="checkmark-outline"
                size={15}
                color={theme.colors.textPrimary}
              />

              <Text
                allowFontScaling={false}
                style={[styles.primaryButtonText, styles.buttonTextWithIcon]}
              >
                Mark as ready
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================= */}
        {/* READY */}
        {/* ================================================= */}

        {isReady && (
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.deliveredButton}
              onPress={() => onChangeStatus?.('delivered')}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={theme.colors.textPrimary}
              />

              <Text allowFontScaling={false} style={styles.deliveredButtonText}>
                Mark as delivered
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/*
          No actions for:

          pending
          delivered
          cancelled
          failed
        */}
      </View>
    </View>
  );
};

export default OrderCard;

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  /*
  |--------------------------------------------------------------------------
  | CARD
  |--------------------------------------------------------------------------
  */

  card: {
    width: '100%',

    overflow: 'hidden',

    backgroundColor: theme.colors.surface,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.card,
  },

  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  header: {
    height: 78,

    paddingHorizontal: theme.spacing.md,

    paddingTop: theme.spacing.sm,

    paddingBottom: theme.spacing.sm,
  },

  /*
  |--------------------------------------------------------------------------
  | FIXED TOP HEADER ROW
  |--------------------------------------------------------------------------
  |
  | Confirmed:
  |
  | #1 NEXT                 Confirmed
  |
  | Ready:
  |
  |                         Ready
  |
  | Because this has a fixed height,
  | KOT title always begins at the
  | exact same vertical position.
  |
  */

  headerTopRow: {
    height: 25,

    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',
  },

  /*
  |--------------------------------------------------------------------------
  | RANK AREA
  |--------------------------------------------------------------------------
  */

  rankArea: {
    flex: 1,

    height: 22,

    justifyContent: 'flex-start',

    alignItems: 'flex-start',
  },

  rankBadge: {
    minHeight: 20,

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.sm,

    borderRadius: 4,

    backgroundColor: theme.colors.black,
  },

  rankText: {
    color: theme.colors.primary,

    fontSize: 8,

    fontWeight: '800',
  },

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  statusBadge: {
    minHeight: 22,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 6,
  },

  statusDot: {
    width: 5,

    height: 5,

    marginRight: 5,

    borderRadius: 3,
  },

  statusText: {
    fontSize: 8,

    lineHeight: 11,

    fontWeight: '700',
  },

  /*
  |--------------------------------------------------------------------------
  | ORDER TITLE
  |--------------------------------------------------------------------------
  */

  orderTitle: {
    color: theme.colors.textPrimary,

    fontSize: 19,

    lineHeight: 21,

    fontWeight: '800',
  },

  orderMeta: {
    marginTop: 1,

    color: theme.colors.textSecondary,

    fontSize: 7,
  },

  /*
  |--------------------------------------------------------------------------
  | DIVIDER
  |--------------------------------------------------------------------------
  */

  divider: {
    height: 1,

    backgroundColor: theme.colors.border,
  },

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | ITEMS
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | MORE ITEMS
  |--------------------------------------------------------------------------
  */

  moreItemsRow: {
    height: 27,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 2,
  },

  moreItemsText: {
    color: theme.colors.textSecondary,

    fontSize: 8,

    fontWeight: '700',
  },

  /*
  |--------------------------------------------------------------------------
  | BOTTOM
  |--------------------------------------------------------------------------
  */

  bottomSection: {
    marginTop: 'auto',
  },

  /*
  |--------------------------------------------------------------------------
  | DETAILS
  |--------------------------------------------------------------------------
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

  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  actions: {
    height: 58,

    flexDirection: 'row',

    alignItems: 'center',

    gap: theme.spacing.sm,

    padding: theme.spacing.sm,

    borderTopWidth: 1,

    borderTopColor: theme.colors.border,
  },

  /*
  |--------------------------------------------------------------------------
  | PRIMARY BUTTON
  |--------------------------------------------------------------------------
  */

  primaryButton: {
    flex: 1,

    height: 42,

    flexDirection: 'row',

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

  buttonTextWithIcon: {
    marginLeft: 4,
  },

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | DELIVERED BUTTON
  |--------------------------------------------------------------------------
  */

  deliveredButton: {
    flex: 1,

    height: 42,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 5,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.primary,
  },

  deliveredButtonText: {
    color: theme.colors.textPrimary,

    fontSize: 9,

    fontWeight: '800',
  },
});
