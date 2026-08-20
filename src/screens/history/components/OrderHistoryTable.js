import React from 'react';

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../../constant';
import { useResponsive } from '../../../contexts/ResponsiveContext';

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getItemsText = items => {
  return (items || [])
    .map(item => {
      const quantity = Number(item?.quantity || 0);

      if (quantity > 1) {
        return `${quantity}× ${item.name}`;
      }

      return item.name;
    })
    .join(', ');
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toLowerCase()?.trim();

  const isCompleted = normalizedStatus === 'completed';

  const isCancelled = normalizedStatus === 'cancelled';

  return (
    <View
      style={[
        styles.statusBadge,

        isCompleted && styles.completedBadge,

        isCancelled && styles.cancelledBadge,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.statusText,

          isCompleted && styles.completedText,

          isCancelled && styles.cancelledText,
        ]}
      >
        {isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : status}
      </Text>
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| TABLE HEADER
|--------------------------------------------------------------------------
*/

const TableHeader = () => {
  return (
    <View style={styles.tableHeader}>
      <Text
        allowFontScaling={false}
        style={[styles.headerText, styles.orderColumn]}
      >
        ORDER
      </Text>

      <Text
        allowFontScaling={false}
        style={[styles.headerText, styles.itemsColumn]}
      >
        ITEMS
      </Text>

      <Text
        allowFontScaling={false}
        style={[styles.headerText, styles.customerColumn]}
      >
        CUSTOMER
      </Text>

      <Text
        allowFontScaling={false}
        style={[styles.headerText, styles.amountColumn]}
      >
        AMOUNT
      </Text>

      <Text
        allowFontScaling={false}
        style={[styles.headerText, styles.statusColumn]}
      >
        STATUS
      </Text>
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| TABLE ROW
|--------------------------------------------------------------------------
*/

const TableRow = ({ order }) => {
  return (
    <View style={styles.row}>
      {/* ORDER */}

      <View style={styles.orderColumn}>
        <Text allowFontScaling={false} style={styles.orderId}>
          #{order.id}
        </Text>

        <Text allowFontScaling={false} style={styles.meta}>
          KOT #{order.kotNumber} · {order.orderTime}
        </Text>
      </View>

      {/* ITEMS */}

      <View style={styles.itemsColumn}>
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={styles.primaryText}
        >
          {getItemsText(order.items)}
        </Text>

        <Text allowFontScaling={false} style={styles.meta}>
          {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* CUSTOMER */}

      <View style={styles.customerColumn}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={styles.primaryText}
        >
          {order.customerName}
        </Text>

        <Text allowFontScaling={false} style={styles.meta}>
          {order.outletName}
        </Text>
      </View>

      {/* AMOUNT */}

      <View style={styles.amountColumn}>
        <Text allowFontScaling={false} style={styles.amount}>
          ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
        </Text>
      </View>

      {/* STATUS */}

      <View style={styles.statusColumn}>
        <StatusBadge status={order.status} />
      </View>
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| MOBILE CARD
|--------------------------------------------------------------------------
*/

const MobileOrderCard = ({ order }) => {
  return (
    <View style={styles.mobileCard}>
      <View style={styles.mobileTop}>
        <View>
          <Text allowFontScaling={false} style={styles.mobileOrderId}>
            #{order.id}
          </Text>

          <Text allowFontScaling={false} style={styles.meta}>
            KOT #{order.kotNumber} · {order.orderTime}
          </Text>
        </View>

        <StatusBadge status={order.status} />
      </View>

      <View style={styles.mobileSection}>
        <Text allowFontScaling={false} style={styles.mobileLabel}>
          ITEMS
        </Text>

        <Text allowFontScaling={false} style={styles.primaryText}>
          {getItemsText(order.items)}
        </Text>

        <Text allowFontScaling={false} style={styles.meta}>
          {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View style={styles.mobileBottom}>
        <View style={styles.mobileCustomer}>
          <Text allowFontScaling={false} style={styles.mobileLabel}>
            CUSTOMER
          </Text>

          <Text allowFontScaling={false} style={styles.primaryText}>
            {order.customerName}
          </Text>

          <Text allowFontScaling={false} style={styles.meta}>
            {order.outletName}
          </Text>
        </View>

        <View style={styles.mobileAmount}>
          <Text allowFontScaling={false} style={styles.mobileLabel}>
            AMOUNT
          </Text>

          <Text allowFontScaling={false} style={styles.amount}>
            ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

const EmptyOrders = () => {
  return (
    <View style={styles.empty}>
      <Text allowFontScaling={false} style={styles.emptyTitle}>
        No orders found
      </Text>

      <Text allowFontScaling={false} style={styles.emptyText}>
        Try changing the selected filter or search.
      </Text>
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

const OrderHistoryTable = ({ orders = [], totalOrders = 0 }) => {
  const { isTablet } = useResponsive();

  /*
  |--------------------------------------------------------------------------
  | MOBILE
  |--------------------------------------------------------------------------
  */

  if (!isTablet) {
    return (
      <View style={styles.mobileList}>
        {orders.length > 0 ? (
          orders.map(order => <MobileOrderCard key={order.id} order={order} />)
        ) : (
          <EmptyOrders />
        )}
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TABLET
  |--------------------------------------------------------------------------
  */

  return (
    <View style={styles.table}>
      {/* FIXED TABLE HEADER */}

      <TableHeader />

      {/* SCROLLABLE ROW AREA */}

      <ScrollView
        style={styles.tableBody}
        contentContainerStyle={[
          styles.tableBodyContent,

          orders.length === 0 && styles.tableBodyContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {orders.length > 0 ? (
          orders.map(order => <TableRow key={order.id} order={order} />)
        ) : (
          <EmptyOrders />
        )}
      </ScrollView>

      {/* FIXED FOOTER */}

      <View style={styles.footer}>
        <Text allowFontScaling={false} style={styles.footerText}>
          Showing {orders.length > 0 ? 1 : 0}–{orders.length} of {totalOrders}{' '}
          orders
        </Text>

        <Text allowFontScaling={false} style={styles.nextText}>
          Next page →
        </Text>
      </View>
    </View>
  );
};

export default OrderHistoryTable;

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  /*
  |--------------------------------------------------------------------------
  | TABLE WRAPPER
  |--------------------------------------------------------------------------
  */

  table: {
    flex: 1,

    width: '100%',

    overflow: 'hidden',

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.card,

    backgroundColor: theme.colors.surface,
  },

  /*
  |--------------------------------------------------------------------------
  | TABLE HEADER
  |--------------------------------------------------------------------------
  */

  tableHeader: {
    height: 38,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: theme.spacing.md,

    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,

    backgroundColor: theme.colors.surfaceSecondary,
  },

  headerText: {
    color: theme.colors.textSecondary,

    fontSize: 7,

    fontWeight: '800',

    letterSpacing: 0.4,
  },

  /*
  |--------------------------------------------------------------------------
  | COLUMNS
  |--------------------------------------------------------------------------
  */

  orderColumn: {
    flex: 1.2,
  },

  itemsColumn: {
    flex: 3.6,

    paddingRight: theme.spacing.sm,
  },

  customerColumn: {
    flex: 2.4,

    paddingRight: theme.spacing.sm,
  },

  amountColumn: {
    flex: 1.1,
  },

  statusColumn: {
    flex: 1.25,
  },

  /*
  |--------------------------------------------------------------------------
  | SCROLLABLE BODY
  |--------------------------------------------------------------------------
  */

  tableBody: {
    flex: 1,

    backgroundColor: theme.colors.surface,
  },

  tableBodyContent: {
    flexGrow: 1,
  },

  tableBodyContentEmpty: {
    justifyContent: 'center',
  },

  /*
  |--------------------------------------------------------------------------
  | ROW
  |--------------------------------------------------------------------------
  */

  row: {
    minHeight: 72,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,

    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,

    backgroundColor: theme.colors.surface,
  },

  orderId: {
    color: theme.colors.textPrimary,

    fontSize: 17,

    fontWeight: '800',
  },

  primaryText: {
    color: theme.colors.textPrimary,

    fontSize: 10,

    fontWeight: '700',
  },

  meta: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 7,

    lineHeight: 10,
  },

  amount: {
    color: theme.colors.textPrimary,

    fontSize: 12,

    fontWeight: '800',
  },

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  statusBadge: {
    alignSelf: 'flex-start',

    minHeight: 25,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 10,

    borderRadius: 999,
  },

  completedBadge: {
    backgroundColor: '#E7F7F0',
  },

  cancelledBadge: {
    backgroundColor: '#FDEAEA',
  },

  statusText: {
    color: theme.colors.textSecondary,

    fontSize: 8,

    fontWeight: '700',
  },

  completedText: {
    color: theme.colors.success,
  },

  cancelledText: {
    color: theme.colors.error,
  },

  /*
  |--------------------------------------------------------------------------
  | FOOTER
  |--------------------------------------------------------------------------
  */

  footer: {
    height: 45,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: theme.spacing.md,

    borderTopWidth: 1,
    borderTopColor: theme.colors.border,

    backgroundColor: theme.colors.surface,
  },

  footerText: {
    color: theme.colors.textSecondary,

    fontSize: 8,
  },

  nextText: {
    color: '#655A44',

    fontSize: 8,

    fontWeight: '700',
  },

  /*
  |--------------------------------------------------------------------------
  | EMPTY
  |--------------------------------------------------------------------------
  */

  empty: {
    flex: 1,

    minHeight: 140,

    alignItems: 'center',
    justifyContent: 'center',

    padding: theme.spacing.lg,
  },

  emptyTitle: {
    color: theme.colors.textPrimary,

    fontSize: 12,

    fontWeight: '700',
  },

  emptyText: {
    marginTop: 4,

    color: theme.colors.textSecondary,

    fontSize: 9,

    textAlign: 'center',
  },

  /*
  |--------------------------------------------------------------------------
  | MOBILE
  |--------------------------------------------------------------------------
  */

  mobileList: {
    gap: theme.spacing.md,
  },

  mobileCard: {
    padding: theme.spacing.md,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.card,

    backgroundColor: theme.colors.surface,
  },

  mobileTop: {
    flexDirection: 'row',

    alignItems: 'flex-start',
    justifyContent: 'space-between',

    gap: theme.spacing.md,
  },

  mobileOrderId: {
    color: theme.colors.textPrimary,

    fontSize: 18,

    fontWeight: '800',
  },

  mobileSection: {
    marginTop: theme.spacing.md,
  },

  mobileBottom: {
    marginTop: theme.spacing.lg,

    flexDirection: 'row',

    alignItems: 'flex-start',
    justifyContent: 'space-between',

    gap: theme.spacing.md,
  },

  mobileCustomer: {
    flex: 1,
  },

  mobileAmount: {
    alignItems: 'flex-end',
  },

  mobileLabel: {
    marginBottom: 4,

    color: theme.colors.textSecondary,

    fontSize: 7,

    fontWeight: '800',

    letterSpacing: 0.4,
  },
});
