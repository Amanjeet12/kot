import React, { useMemo, useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { format, parseISO } from 'date-fns';

import { useResponsive } from '../../contexts/ResponsiveContext';

import { theme } from '../../constant';

import OrderHistoryHeader from './components/OrderHistoryHeader';
import OrderHistoryStats from './components/OrderHistoryStats';
import OrderHistoryFilterBar from './components/OrderHistoryFilterBar';
import OrderHistoryTable from './components/OrderHistoryTable';
import OrderHistoryDatePicker from './components/OrderHistoryDatePicker';

import { useOrderHistory } from '../../hooks/queries/useOrderHistory';
import { mapTuckShopOrder } from '../../utils/orderMapper';

const PAGE_SIZE = 20;

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

const getTodayDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

/*
|--------------------------------------------------------------------------
| DATE BUTTON LABEL
|--------------------------------------------------------------------------
*/

const getDateLabel = (startDate, endDate) => {
  if (!startDate) {
    return 'Select date';
  }

  const start = parseISO(startDate);

  /*
  |--------------------------------------------------------------------------
  | SINGLE DATE
  |--------------------------------------------------------------------------
  */

  if (!endDate) {
    return format(start, 'dd MMMM yyyy');
  }

  const end = parseISO(endDate);

  /*
  |--------------------------------------------------------------------------
  | SAME DATE
  |--------------------------------------------------------------------------
  */

  if (startDate === endDate) {
    return format(start, 'dd MMMM yyyy');
  }

  /*
  |--------------------------------------------------------------------------
  | SAME MONTH + SAME YEAR
  |--------------------------------------------------------------------------
  |
  | 16 - 20 August 2026
  |
  */

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${format(start, 'dd')} - ${format(end, 'dd MMMM yyyy')}`;
  }

  /*
  |--------------------------------------------------------------------------
  | SAME YEAR
  |--------------------------------------------------------------------------
  |
  | 28 Aug - 03 Sep 2026
  |
  */

  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')}`;
  }

  /*
  |--------------------------------------------------------------------------
  | DIFFERENT YEAR
  |--------------------------------------------------------------------------
  */

  return `${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`;
};

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

const OrderHistoryScreen = ({ navigation }) => {
  const { isTablet, isLargeTablet } = useResponsive();

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const [selectedStatus, setSelectedStatus] = useState('all');

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState('');

  /*
  |--------------------------------------------------------------------------
  | DATE FILTER
  |--------------------------------------------------------------------------
  |
  | Default = today
  |
  */

  const [startDate, setStartDate] = useState(() => getTodayDate());

  const [endDate, setEndDate] = useState(null);

  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [end, setEnd] = useState(PAGE_SIZE);

  const {
    data: historyResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useOrderHistory({
    fromDate: startDate,
    toDate: endDate || startDate,
    start: 0,
    end,
  });

  /*
  |--------------------------------------------------------------------------
  | DATE LABEL
  |--------------------------------------------------------------------------
  */

  const dateLabel = useMemo(
    () => getDateLabel(startDate, endDate),
    [startDate, endDate],
  );

  /*
  |--------------------------------------------------------------------------
  | DATE APPLY
  |--------------------------------------------------------------------------
  */

  const handleDateApply = ({
    startDate: newStartDate,
    endDate: newEndDate,
  }) => {
    setStartDate(newStartDate);

    setEndDate(newEndDate || null);
    setEnd(PAGE_SIZE);
  };

  const orders = useMemo(() => {
    return (historyResponse?.data || []).map(rawOrder => {
      const order = mapTuckShopOrder(rawOrder);

      return {
        ...order,
        kotNumber: rawOrder.kot_id,
        totalItems: order.totalQuantity,
        outletName: order.locationName,
      };
    });
  }, [historyResponse]);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(() => {
    const apiSummary = historyResponse?.summary;
    const statusCounts = apiSummary?.status_counts || {};

    return {
      totalOrders: Number(apiSummary?.total_orders || 0),
      completed: Number(statusCounts.delivered || statusCounts.completed || 0),
      cancelled: Number(statusCounts.cancelled || 0),
      orderValue: Number(apiSummary?.order_value || 0),
    };
  }, [historyResponse]);

  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const counts = useMemo(
    () => ({
      all: summary.totalOrders,

      completed: summary.completed,

      cancelled: summary.cancelled,
    }),
    [summary],
  );

  /*
  |--------------------------------------------------------------------------
  | FILTER ORDERS
  |--------------------------------------------------------------------------
  */

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter(order => {
      /*
          |--------------------------------------------------------------------------
          | STATUS
          |--------------------------------------------------------------------------
          */

      const statusMatches =
        selectedStatus === 'all' ||
        order.status === selectedStatus ||
        (selectedStatus === 'completed' && order.status === 'delivered');

      /*
          |--------------------------------------------------------------------------
          | SEARCH
          |--------------------------------------------------------------------------
          */

      const searchMatches =
        !searchValue ||
        String(order.id).includes(searchValue) ||
        String(order.kotNumber).includes(searchValue) ||
        order.customerName?.toLowerCase().includes(searchValue) ||
        order.items?.some(item =>
          item.name?.toLowerCase().includes(searchValue),
        );

      return statusMatches && searchMatches;
    });
  }, [orders, selectedStatus, search]);

  const handleLoadMore = () => {
    if (!historyResponse?.pagination?.hasNextPage || isFetching) {
      return;
    }

    setEnd(previous => previous + PAGE_SIZE);
  };

  /*
  |--------------------------------------------------------------------------
  | HEADER SECTION
  |--------------------------------------------------------------------------
  */

  const HeaderSection = () => (
    <View style={styles.headerSection}>
      <OrderHistoryHeader
        dateLabel={dateLabel}
        onDatePress={() => setDatePickerVisible(true)}
        onRefresh={() => refetch()}
        isRefreshing={isFetching && !isLoading}
      />

      <OrderHistoryStats summary={summary} />

      <OrderHistoryFilterBar
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        search={search}
        onSearchChange={setSearch}
        counts={counts}
      />
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | DATE PICKER
  |--------------------------------------------------------------------------
  */

  const DatePicker = () => (
    <OrderHistoryDatePicker
      visible={datePickerVisible}
      startDate={startDate}
      endDate={endDate}
      onClose={() => setDatePickerVisible(false)}
      onApply={handleDateApply}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text allowFontScaling={false} style={styles.messageText}>
            Loading order history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text allowFontScaling={false} style={styles.errorTitle}>
            Unable to load order history
          </Text>
          <Text allowFontScaling={false} style={styles.messageText}>
            {error?.response?.data?.msg || error?.message || 'Something went wrong'}
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
  | TABLET
  |--------------------------------------------------------------------------
  */

  if (isTablet) {
    return (
      <>
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

            {/* TABLE */}

            <View
              style={[
                styles.tabletContent,

                isLargeTablet && styles.tabletContentLarge,
              ]}
            >
              <OrderHistoryTable
                orders={filteredOrders}
                totalOrders={summary.totalOrders}
                hasNextPage={historyResponse?.pagination?.hasNextPage}
                isFetching={isFetching}
                onLoadMore={handleLoadMore}
                onOrderPress={order => navigation.navigate('HistoryOrderDetails', { order, isHistory: true })}
              />
            </View>
          </View>
        </SafeAreaView>

        <DatePicker />
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MOBILE
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mobileContent}
        >
          <HeaderSection />

          <View style={styles.mobileTable}>
            <OrderHistoryTable
              orders={filteredOrders}
              totalOrders={summary.totalOrders}
              hasNextPage={historyResponse?.pagination?.hasNextPage}
              isFetching={isFetching}
              onLoadMore={handleLoadMore}
              onOrderPress={order => navigation.navigate('HistoryOrderDetails', { order, isHistory: true })}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <DatePicker />
    </>
  );
};

export default OrderHistoryScreen;

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

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

  /*
    |--------------------------------------------------------------------------
    | TABLET
    |--------------------------------------------------------------------------
    */

  tabletContent: {
    flex: 1,

    paddingHorizontal: theme.spacing.xl,

    paddingTop: theme.spacing.sm,

    paddingBottom: theme.spacing.lg,
  },

  tabletContentLarge: {
    paddingHorizontal: theme.spacing.xxl,
  },

  /*
    |--------------------------------------------------------------------------
    | MOBILE
    |--------------------------------------------------------------------------
    */

  mobileContent: {
    paddingHorizontal: theme.spacing.md,

    paddingTop: theme.spacing.md,

    paddingBottom: theme.spacing.xxxl,
  },

  mobileTable: {
    marginTop: theme.spacing.sm,
  },

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
});
