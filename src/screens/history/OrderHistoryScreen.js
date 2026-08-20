import React, { useMemo, useState } from 'react';

import { ScrollView, StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsive } from '../../contexts/ResponsiveContext';
import { theme } from '../../constant';

import OrderHistoryHeader from './components/OrderHistoryHeader';
import OrderHistoryStats from './components/OrderHistoryStats';
import OrderHistoryFilterBar from './components/OrderHistoryFilterBar';
import OrderHistoryTable from './components/OrderHistoryTable';

import { MOCK_ORDER_HISTORY } from './mockOrderHistory';

const OrderHistoryScreen = () => {
  const { isTablet, isLargeTablet } = useResponsive();

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(() => {
    const completed = MOCK_ORDER_HISTORY.filter(
      order => order.status === 'completed',
    ).length;

    const cancelled = MOCK_ORDER_HISTORY.filter(
      order => order.status === 'cancelled',
    ).length;

    const orderValue = MOCK_ORDER_HISTORY.filter(
      order => order.status !== 'cancelled',
    ).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      totalOrders: MOCK_ORDER_HISTORY.length,
      completed,
      cancelled,
      orderValue,
    };
  }, []);

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

    return MOCK_ORDER_HISTORY.filter(order => {
      const statusMatches =
        selectedStatus === 'all' || order.status === selectedStatus;

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
  }, [selectedStatus, search]);

  /*
  |--------------------------------------------------------------------------
  | HEADER SECTION
  |--------------------------------------------------------------------------
  */

  const HeaderSection = () => {
    return (
      <View style={styles.headerSection}>
        <OrderHistoryHeader />

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
          {/* FIXED TOP SECTION */}

          <View
            style={[
              styles.fixedHeader,
              isLargeTablet && styles.fixedHeaderLarge,
            ]}
          >
            <HeaderSection />
          </View>

          {/* TABLE FILLS REMAINING SCREEN */}

          <View
            style={[
              styles.tabletContent,
              isLargeTablet && styles.tabletContentLarge,
            ]}
          >
            <OrderHistoryTable
              orders={filteredOrders}
              totalOrders={summary.totalOrders}
            />
          </View>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mobileContent}
      >
        <HeaderSection />

        <View style={styles.mobileTable}>
          <OrderHistoryTable
            orders={filteredOrders}
            totalOrders={summary.totalOrders}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderHistoryScreen;

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  /*
  |--------------------------------------------------------------------------
  | ROOT
  |--------------------------------------------------------------------------
  */

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
  | FIXED TABLET HEADER
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
  | TABLET CONTENT
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
});
