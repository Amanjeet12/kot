import React, { useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsive } from '../../contexts/ResponsiveContext';

import { theme } from '../../constant';

import OrdersHeader from './components/OrdersHeader';

import OrderStats from './components/OrderStats';

import OrderFilterBar from './components/OrderFilterBar';

import OrderCard from './components/OrderCard';

import { useActiveOrders } from '../../hooks/queries/useActiveOrders';

import { mapTuckShopOrder } from '../../utils/orderMapper';

import { canChangeOrderStatus } from '../../constant/orderStatus';

import { useUpdateOrderStatus } from '../../hooks/mutations/useUpdateOrderStatus';

const PAGE_SIZE = 20;

const OrdersScreen = ({ navigation }) => {
  const { width, isTablet, isLargeTablet } = useResponsive();

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const [end, setEnd] = useState(PAGE_SIZE);

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  const [selectedStatus, setSelectedStatus] = useState('all');

  const [search, setSearch] = useState('');

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | QUERY
  |--------------------------------------------------------------------------
  */

  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useActiveOrders({
    start: 0,
    end,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const handleRequestStatusChange = async (order, nextStatus) => {
    if (!canChangeOrderStatus(order.status, nextStatus)) {
      console.warn(
        `Invalid status transition: ${order.status} -> ${nextStatus}`,
      );

      return;
    }

    setUpdatingOrderId(order.id);
    try {
      await updateStatusMutation.mutateAsync({
        tuckShopOrderId: order.tuckShopOrderId || order.id,

        status: nextStatus,
      });
    } catch (error) {
      console.log(
        'Status update error:',
        error?.response?.data || error?.message,
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | COLUMNS
  |--------------------------------------------------------------------------
  */

  const columns = width >= 1180 ? 3 : width >= 768 ? 2 : 1;

  /*
  |--------------------------------------------------------------------------
  | MAP BACKEND DATA
  |--------------------------------------------------------------------------
  */

  const orders = useMemo(() => {
    const rawOrders = ordersResponse?.data || [];

    /*
     * Confirmed queue:
     *
     * Oldest confirmed order
     * gets Queue #1.
     */

    const confirmedOrders = rawOrders
      .filter(order => order.status === 'confirmed')
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    const rankMap = new Map();

    confirmedOrders.forEach((order, index) => {
      rankMap.set(
        order.tuck_shop_order_id,

        index + 1,
      );
    });

    return rawOrders.map(order =>
      mapTuckShopOrder(
        order,

        rankMap.get(order.tuck_shop_order_id) || null,
      ),
    );
  }, [ordersResponse]);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const counts = useMemo(() => {
    return {
      all: orders.length,

      confirmed: orders.filter(order => order.status === 'confirmed').length,

      ready: orders.filter(order => order.status === 'ready').length,
    };
  }, [orders]);

  /*
  |--------------------------------------------------------------------------
  | LOCAL FILTERING
  |--------------------------------------------------------------------------
  */

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter(order => {
      const statusMatches =
        selectedStatus === 'all' || order.status === selectedStatus;

      const searchMatches =
        !searchValue ||
        String(order.id).includes(searchValue) ||
        String(order.orderNumber).includes(searchValue) ||
        order.customerName?.toLowerCase().includes(searchValue) ||
        order.locationName?.toLowerCase().includes(searchValue) ||
        order.items?.some(item =>
          item.name?.toLowerCase().includes(searchValue),
        );

      return statusMatches && searchMatches;
    });
  }, [orders, search, selectedStatus]);

  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  const HeaderSection = () => {
    return (
      <View style={styles.headerSection}>
        <OrdersHeader
          onRefresh={() => refetch()}
          isRefreshing={isFetching && !isLoading}
        />

        <OrderStats orders={orders} />

        <OrderFilterBar
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          search={search}
          onSearchChange={setSearch}
          counts={counts}
        />
      </View>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | ORDER CARD
  |--------------------------------------------------------------------------
  */

  const renderOrder = ({ item }) => {
    const isSelected = selectedOrderId === item.id;

    return (
      <View
        style={[
          styles.cardWrapper,

          {
            width: columns === 1 ? '100%' : columns === 2 ? '49%' : '32.3%',
          },
        ]}
      >
        <Pressable
          onPress={() => setSelectedOrderId(item.id)}
          style={[styles.selectableCard, isSelected && styles.selectedCard]}
        >
          <OrderCard
            order={item}
            isNext={item.rank === 1 && item.status === 'confirmed'}
            statusUpdating={updatingOrderId === item.id}
            onChangeStatus={nextStatus =>
              handleRequestStatusChange(item, nextStatus)
            }
            onViewDetails={() =>
              navigation.navigate('OrderDetails', {
                orderId: item.id,

                order: item,
              })
            }
          />
        </Pressable>
      </View>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD MORE
  |--------------------------------------------------------------------------
  */

  const handleLoadMore = () => {
    const pagination = ordersResponse?.pagination;

    if (!pagination?.hasNextPage || isFetching) {
      return;
    }

    setEnd(previous => previous + PAGE_SIZE);
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />

          <Text allowFontScaling={false} style={styles.messageText}>
            Loading active orders...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text allowFontScaling={false} style={styles.errorTitle}>
            Unable to load orders
          </Text>

          <Text allowFontScaling={false} style={styles.messageText}>
            {error?.response?.data?.msg ||
              error?.message ||
              'Something went wrong'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text allowFontScaling={false} style={styles.retryText}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EMPTY
  |--------------------------------------------------------------------------
  */

  const EmptyOrders = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text allowFontScaling={false} style={styles.emptyTitle}>
          No active orders
        </Text>

        <Text allowFontScaling={false} style={styles.messageText}>
          New orders will appear here.
        </Text>
      </View>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | TABLET
  |--------------------------------------------------------------------------
  */

  if (isTablet) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.tabletPage}>
          {/* FIXED HEADER */}

          <View
            style={[
              styles.fixedHeader,

              isLargeTablet && styles.fixedHeaderLarge,
            ]}
          >
            <HeaderSection />
          </View>

          {/* ONLY ORDERS SCROLL */}

          <FlatList
            key={`tablet-orders-${columns}`}
            data={filteredOrders}
            keyExtractor={item => String(item.id)}
            numColumns={columns}
            renderItem={renderOrder}
            style={styles.ordersList}
            contentContainerStyle={[
              styles.ordersContent,

              isLargeTablet && styles.ordersContentLarge,

              filteredOrders.length === 0 && styles.emptyListContent,
            ]}
            columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
            ListEmptyComponent={EmptyOrders}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>

      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MOBILE
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        key="mobile-orders"
        data={filteredOrders}
        keyExtractor={item => String(item.id)}
        numColumns={1}
        renderItem={renderOrder}
        ListHeaderComponent={<HeaderSection />}
        ListEmptyComponent={EmptyOrders}
        contentContainerStyle={[
          styles.mobileContent,

          filteredOrders.length === 0 && styles.emptyListContent,
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

    </SafeAreaView>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: theme.colors.background,
  },

  tabletPage: {
    flex: 1,

    backgroundColor: theme.colors.background,
  },

  /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

  fixedHeader: {
    flexShrink: 0,

    backgroundColor: theme.colors.background,

    paddingTop: theme.spacing.lg,

    paddingHorizontal: theme.spacing.xl,

    paddingBottom: theme.spacing.sm,

    zIndex: 10,
  },

  fixedHeaderLarge: {
    paddingHorizontal: theme.spacing.xxl,
  },

  headerSection: {
    width: '100%',
  },

  refreshingRow: {
    height: 22,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: theme.spacing.xs,
  },

  refreshingText: {
    color: theme.colors.textMuted,

    fontSize: theme.typography.fontSize.xs,
  },

  /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

  ordersList: {
    flex: 1,
  },

  ordersContent: {
    paddingHorizontal: theme.spacing.xl,

    paddingTop: theme.spacing.sm,

    paddingBottom: theme.spacing.xxxl,
  },

  ordersContentLarge: {
    paddingHorizontal: theme.spacing.xxl,
  },

  columnWrapper: {
    justifyContent: 'flex-start',

    gap: theme.spacing.md,
  },

  mobileContent: {
    paddingHorizontal: theme.spacing.md,

    paddingTop: theme.spacing.md,

    paddingBottom: theme.spacing.xxxl,
  },

  /*
    |--------------------------------------------------------------------------
    | CARD
    |--------------------------------------------------------------------------
    */

  cardWrapper: {
    marginBottom: theme.spacing.md,
  },

  selectableCard: {
    width: '100%',

    borderWidth: 2,

    borderColor: 'transparent',

    borderRadius: theme.radius.card,
  },

  selectedCard: {
    borderColor: theme.colors.primary,
  },

  /*
    |--------------------------------------------------------------------------
    | LOADING / ERROR
    |--------------------------------------------------------------------------
    */

  centerContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    padding: theme.spacing.xxl,
  },

  messageText: {
    marginTop: theme.spacing.sm,

    color: theme.colors.textSecondary,

    fontSize: theme.typography.fontSize.base,

    textAlign: 'center',
  },

  errorTitle: {
    color: theme.colors.error,

    fontSize: theme.typography.fontSize.lg,

    fontWeight: theme.typography.fontWeight.bold,
  },

  retryButton: {
    minWidth: 100,

    height: 44,

    marginTop: theme.spacing.lg,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.primary,
  },

  retryText: {
    color: theme.colors.textOnPrimary,

    fontSize: theme.typography.fontSize.base,

    fontWeight: theme.typography.fontWeight.bold,
  },

  /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

  emptyListContent: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,

    minHeight: 200,

    alignItems: 'center',

    justifyContent: 'center',
  },

  emptyTitle: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.lg,

    fontWeight: theme.typography.fontWeight.bold,
  },
});
