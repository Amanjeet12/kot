import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../constant';

import { useResponsive } from '../../contexts/ResponsiveContext';

import MenuHeader from './components/MenuHeader';
import MenuStats from './components/MenuStats';
import MenuFilterBar from './components/MenuFilterBar';
import MenuItemCard from './components/MenuItemCard';

import { useTodayTuckShopMenu } from '../../hooks/queries/useTodayTuckShopMenu';

const LOW_STOCK_LIMIT = 4;

const MenuScreen = () => {
  const { isTablet, isLargeTablet } = useResponsive();

  /*
  |--------------------------------------------------------------------------
  | MENU DATA
  |--------------------------------------------------------------------------
  |
  | For now using mock data for UI.
  | Later we can replace this with API data without changing the components.
  |
  */

  const [availabilityOverrides, setAvailabilityOverrides] = useState({});

  const {
    data: menuResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTodayTuckShopMenu();

  const menuItems = useMemo(() => {
    const items = menuResponse?.data?.items || [];

    return items.map(item => {
      const id = item.daily_menu_item_id;
      const apiAvailability = Boolean(item.isAvailable);

      return {
        id,
        dailyMenuItemId: id,
        tuckShopItemId: item.tuck_shop_item_id,
        name: item.itemName,
        foodType: item.type,
        category: item.category,
        description: item.description,
        price: Number(item.price || 0),
        stock: Number(
          item.availableQuantity ?? item.inventory?.availableQuantity ?? 0,
        ),
        enabled:
          availabilityOverrides[id] === undefined
            ? apiAvailability
            : availabilityOverrides[id],
        isLowStock: Boolean(item.inventory?.isLowStock),
        image: Array.isArray(item.image) ? item.image[0] : item.image,
        icon: item.type === 'non-veg' ? 'fast-food-outline' : 'restaurant-outline',
      };
    });
  }, [availabilityOverrides, menuResponse]);

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  const [selectedFilter, setSelectedFilter] = useState('all');

  const [search, setSearch] = useState('');

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(() => {
    const enabled = menuItems.filter(item => item.enabled).length;

    const disabled = menuItems.filter(item => !item.enabled).length;

    const lowStock = menuItems.filter(item => item.isLowStock).length;

    return {
      total: menuItems.length,
      enabled,
      disabled,
      lowStock,
    };
  }, [menuItems]);

  /*
  |--------------------------------------------------------------------------
  | FILTER COUNTS
  |--------------------------------------------------------------------------
  */

  const counts = useMemo(
    () => ({
      all: summary.total,
      enabled: summary.enabled,
      disabled: summary.disabled,
      lowStock: summary.lowStock,
    }),
    [summary],
  );

  /*
  |--------------------------------------------------------------------------
  | FILTERED ITEMS
  |--------------------------------------------------------------------------
  */

  const filteredMenuItems = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return menuItems.filter(item => {
      let filterMatches = true;

      if (selectedFilter === 'enabled') {
        filterMatches = item.enabled;
      }

      if (selectedFilter === 'disabled') {
        filterMatches = !item.enabled;
      }

      if (selectedFilter === 'lowStock') {
        filterMatches = item.isLowStock;
      }

      const searchMatches =
        !searchValue ||
        item.name?.toLowerCase().includes(searchValue) ||
        item.category?.toLowerCase().includes(searchValue) ||
        item.foodType?.toLowerCase().includes(searchValue);

      return filterMatches && searchMatches;
    });
  }, [menuItems, selectedFilter, search]);

  /*
  |--------------------------------------------------------------------------
  | TOGGLE MENU ITEM
  |--------------------------------------------------------------------------
  */

  const handleToggleItem = useCallback(itemId => {
    setAvailabilityOverrides(previous => ({
      ...previous,
      [itemId]: !menuItems.find(item => item.id === itemId)?.enabled,
    }));
  }, [menuItems]);

  /*
  |--------------------------------------------------------------------------
  | INVENTORY
  |--------------------------------------------------------------------------
  */

  const handleManageInventory = () => {
    /*
     * Later:
     *
     * navigation.navigate('Inventory');
     */
  };

  const handleRefresh = () => {
    setAvailabilityOverrides({});
    refetch();
  };

  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  const HeaderSection = () => (
    <View style={styles.headerSection}>
      <MenuHeader
        onManageInventory={handleManageInventory}
        onRefresh={handleRefresh}
        isRefreshing={isFetching && !isLoading}
      />

      <MenuStats summary={summary} />

      <MenuFilterBar
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        counts={counts}
        search={search}
        onSearchChange={setSearch}
      />
    </View>
  );

  /*
  |--------------------------------------------------------------------------
  | EMPTY STATE
  |--------------------------------------------------------------------------
  */

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text allowFontScaling={false} style={styles.emptyTitle}>
        No menu items found
      </Text>

      <Text allowFontScaling={false} style={styles.emptySubtitle}>
        Try changing the filter or search term.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text allowFontScaling={false} style={styles.messageText}>
            Loading today's menu...
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
            Unable to load today's menu
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.page}>
        <View
          style={[
            styles.fixedHeader,
            !isTablet && styles.mobileFixedHeader,
            isLargeTablet && styles.fixedHeaderLarge,
          ]}
        >
          <HeaderSection />
        </View>

        <FlatList
          key={isTablet ? 'tablet-menu-grid' : 'mobile-menu-list'}
          data={filteredMenuItems}
          numColumns={isTablet ? 2 : 1}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={EmptyState}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
          style={styles.itemsList}
          contentContainerStyle={[
            styles.itemsContent,
            !isTablet && styles.mobileItemsContent,
            isLargeTablet && styles.itemsContentLarge,
            filteredMenuItems.length === 0 && styles.emptyContent,
          ]}
          renderItem={({ item }) => (
            <View
              style={[styles.itemWrapper, isTablet && styles.tabletItemWrapper]}
            >
              <MenuItemCard
                item={item}
                lowStockLimit={LOW_STOCK_LIMIT}
                onToggle={() => handleToggleItem(item.id)}
              />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );

};

export default MenuScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: theme.colors.background,
  },

  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  fixedHeader: {
    flexShrink: 0,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },

  mobileFixedHeader: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },

  fixedHeaderLarge: {
    paddingHorizontal: theme.spacing.xxl,
  },

  itemsList: {
    flex: 1,
  },

  itemsContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },

  mobileItemsContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },

  itemsContentLarge: {
    paddingHorizontal: theme.spacing.xxl,
  },

  headerSection: {
    width: '100%',
  },

  columnWrapper: {
    gap: theme.spacing.md,
  },

  itemWrapper: {
    flex: 1,

    marginBottom: theme.spacing.md,
  },

  tabletItemWrapper: {
    flex: 0.5,
  },

  emptyContent: {
    flexGrow: 1,
  },

  emptyContainer: {
    minHeight: 220,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.xxl,
  },

  emptyTitle: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.lg,

    fontWeight: theme.typography.fontWeight.bold,
  },

  emptySubtitle: {
    marginTop: theme.spacing.xs,

    color: theme.colors.textSecondary,

    fontSize: theme.typography.fontSize.sm,

    textAlign: 'center',
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
