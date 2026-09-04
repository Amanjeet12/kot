import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../constant';
import { useResponsive } from '../../contexts/ResponsiveContext';
import { useInventory } from '../../hooks/queries/useInventory';
import { useInventoryCounts } from '../../hooks/queries/useInventoryCounts';
import { useUpdateInventoryStock } from '../../hooks/mutations/useUpdateInventoryStock';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'lowStock', label: 'Low stock' },
  { key: 'unavailable', label: 'Unavailable' },
  { key: 'outOfStock', label: 'Out of stock' },
];

const getStatus = item => {
  if (Number(item.availableQuantity) <= 0) return 'outOfStock';
  if (item.isLowStock) return 'lowStock';
  if (!item.isAvailable) return 'unavailable';
  return 'available';
};

const STATUS_LABELS = {
  available: 'Available',
  lowStock: 'Low stock',
  unavailable: 'Unavailable',
  outOfStock: 'Out of stock',
};

const InventoryRow = ({ item, onAdjust, isUpdating, mobile = false }) => {
  const status = getStatus(item);
  const productName = item.item?.itemName || 'Inventory item';
  const canRemove =
    Number(item.currentQuantity) > Number(item.reservedQuantity || 0);
  const product = (
    <View style={styles.productCell}>
      <View style={[styles.productIcon, styles[`${status}Icon`]]}>
        <Ionicons name={status === 'available' ? 'checkmark-circle-outline' : status === 'lowStock' ? 'alert-circle-outline' : 'close-circle-outline'} size={24} color={status === 'available' ? theme.colors.success : status === 'lowStock' ? theme.colors.warning : theme.colors.error} />
      </View>
      <View style={styles.productText}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.productName}>{productName}</Text>
        <Text allowFontScaling={false} style={styles.meta}>{item.item?.type || 'Item'} · Inventory ID {item.inventory_id}</Text>
      </View>
    </View>
  );
  const actions = (
    <View style={styles.actions}>
      {isUpdating ? (
        <View style={styles.actionsLoading}>
          <ActivityIndicator size="small" color={theme.colors.primaryDark} />
        </View>
      ) : (
        <>
          <TouchableOpacity
            accessibilityLabel={`Remove one ${productName}`}
            activeOpacity={0.75}
            disabled={!canRemove}
            onPress={() => onAdjust(item.inventory_id, -1)}
            style={[
              styles.stockButton,
              !canRemove && styles.stockButtonDisabled,
            ]}
          >
            <Ionicons name="remove" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`Add one ${productName}`}
            activeOpacity={0.75}
            onPress={() => onAdjust(item.inventory_id, 1)}
            style={[styles.stockButton, styles.addButton]}
          >
            <Ionicons name="add" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  if (mobile) {
    return (
      <View style={styles.mobileCard}>
        <View style={styles.mobileTop}>{product}<Text allowFontScaling={false} style={[styles.status, styles[`${status}Text`]]}>{STATUS_LABELS[status]}</Text></View>
        <View style={styles.mobileDetails}>
          <View><Text allowFontScaling={false} style={styles.mobileLabel}>STOCK</Text><Text allowFontScaling={false} style={styles.stockValue}>{item.currentQuantity}</Text><Text allowFontScaling={false} style={styles.meta}>{item.unit}</Text></View>
          <View><Text allowFontScaling={false} style={styles.mobileLabel}>RESERVED</Text><Text allowFontScaling={false} style={styles.stockValue}>{item.reservedQuantity}</Text><Text allowFontScaling={false} style={styles.meta}>{item.availableQuantity} available</Text></View>
          {actions}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.productColumn}>{product}</View>
      <View style={styles.stockColumn}><Text allowFontScaling={false} style={styles.stockValue}>{item.currentQuantity}</Text><Text allowFontScaling={false} style={styles.meta}>{item.unit}</Text></View>
      <View style={styles.reservedColumn}><Text allowFontScaling={false} style={styles.stockValue}>{item.reservedQuantity}</Text><Text allowFontScaling={false} style={styles.meta}>{item.availableQuantity} available</Text></View>
      <View style={styles.statusColumn}><Text allowFontScaling={false} style={[styles.status, styles[`${status}Text`]]}>{STATUS_LABELS[status]}</Text></View>
      <View style={styles.actionColumn}>{actions}</View>
    </View>
  );
};

const ManageInventoryScreen = ({ navigation }) => {
  const { isTablet, isLargeTablet, isMobile, isPortrait } = useResponsive();
  const useCompactStats = isMobile || isPortrait;
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingInventoryId, setUpdatingInventoryId] = useState(null);
  const [stockError, setStockError] = useState('');
  const {
    data: inventoryResponse,
    isLoading,
    error: inventoryError,
    refetch: refetchInventory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInventory();
  const {
    data: countsResponse,
    refetch: refetchCounts,
  } = useInventoryCounts();
  const updateStock = useUpdateInventoryStock();

  const items = useMemo(() => {
    const inventoryById = new Map();

    (inventoryResponse?.pages || []).forEach(page => {
      (page?.data || []).forEach(item => {
        inventoryById.set(item.inventory_id, item);
      });
    });

    return [...inventoryById.values()];
  }, [inventoryResponse]);

  const counts = useMemo(() => {
    const serverCounts = countsResponse?.data || {};
    const countStatus = status =>
      items.filter(item => getStatus(item) === status).length;

    return {
      all: Number(serverCounts.total ?? items.length),
      available: Number(serverCounts.available ?? countStatus('available')),
      lowStock: Number(serverCounts.low_stock ?? countStatus('lowStock')),
      unavailable: Number(
        serverCounts.unavailable ?? countStatus('unavailable'),
      ),
      outOfStock: Number(
        serverCounts.out_of_stock ?? countStatus('outOfStock'),
      ),
    };
  }, [countsResponse, items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item => (filter === 'all' || getStatus(item) === filter) && (!term || item.item?.itemName?.toLowerCase().includes(term) || item.item?.category?.name?.toLowerCase().includes(term)));
  }, [filter, items, search]);

  const adjustStock = async (inventoryId, amount) => {
    if (updateStock.isPending) return;

    setUpdatingInventoryId(inventoryId);
    setStockError('');

    try {
      await updateStock.mutateAsync([
        {
          inventory_id: inventoryId,
          quantity: Math.abs(amount),
          transactionType: amount > 0 ? 'stock_in' : 'wastage',
        },
      ]);
    } catch (error) {
      setStockError(
        error?.response?.data?.msg ||
          error?.message ||
          'Unable to update inventory stock.',
      );
    } finally {
      setUpdatingInventoryId(null);
    }
  };

  const retryInventory = () => {
    refetchInventory();
    refetchCounts();
  };

  const paginationTotal = Number(
    inventoryResponse?.pages?.[0]?.pagination?.total ?? counts.all,
  );

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topHeader}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} /></TouchableOpacity>
        <Text allowFontScaling={false} style={styles.backText}>Back to menu</Text>
      </View>

      <View style={[styles.page, isTablet && styles.tabletPage, isLargeTablet && styles.largeTabletPage]}>
        <Text allowFontScaling={false} style={styles.title}>Manage inventory</Text>

        <View style={styles.stats}>
          {[
            ['AVAILABLE', counts.available, theme.colors.success],
            ['LOW STOCK', counts.lowStock, theme.colors.warning],
            ['UNAVAILABLE', counts.unavailable, theme.colors.error],
            ['OUT OF STOCK', counts.outOfStock, theme.colors.error],
          ].map(([label, value, color]) => (
            <View
              key={label}
              style={[
                styles.statCard,
                useCompactStats && styles.compactStatCard,
                useCompactStats && label === 'OUT OF STOCK' && styles.fullWidthStatCard,
              ]}
            >
              <Text allowFontScaling={false} style={styles.statLabel}>{label}</Text>
              <Text allowFontScaling={false} style={[styles.statValue, { color }]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.filterBar, !isTablet && styles.mobileFilterBar]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTERS.map(option => <TouchableOpacity key={option.key} activeOpacity={0.8} onPress={() => setFilter(option.key)} style={[styles.filterButton, filter === option.key && styles.activeFilter]}><Text allowFontScaling={false} style={[styles.filterText, filter === option.key && styles.activeFilterText]}>{option.label} · {counts[option.key]}</Text></TouchableOpacity>)}
          </ScrollView>
          <View style={[styles.searchBox, !isTablet && styles.mobileSearch]}><Ionicons name="search-outline" size={20} color={theme.colors.textMuted} /><TextInput allowFontScaling={false} value={search} onChangeText={setSearch} placeholder="Search inventory" placeholderTextColor={theme.colors.textMuted} style={styles.searchInput} /></View>
        </View>

        {stockError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
            <Text style={styles.errorText}>{stockError}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.feedbackState}>
            <ActivityIndicator size="large" color={theme.colors.primaryDark} />
            <Text style={styles.feedbackText}>Loading inventory...</Text>
          </View>
        ) : inventoryError ? (
          <View style={styles.feedbackState}>
            <Ionicons name="alert-circle-outline" size={34} color={theme.colors.error} />
            <Text style={styles.feedbackText}>{inventoryError?.response?.data?.msg || inventoryError?.message || 'Unable to load inventory.'}</Text>
            <TouchableOpacity onPress={retryInventory} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : isTablet ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}><Text style={[styles.headerText, styles.productColumn]}>PRODUCT</Text><Text style={[styles.headerText, styles.stockColumn]}>STOCK</Text><Text style={[styles.headerText, styles.reservedColumn]}>RESERVED</Text><Text style={[styles.headerText, styles.statusColumn]}>STATUS</Text><Text style={[styles.headerText, styles.actionColumn]}>ACTIONS</Text></View>
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>{filteredItems.map(item => <InventoryRow key={item.inventory_id} item={item} onAdjust={adjustStock} isUpdating={updatingInventoryId === item.inventory_id} />)}</ScrollView>
            <View style={styles.footer}>
              <Text allowFontScaling={false} style={styles.footerText}>Loaded {items.length} of {paginationTotal} · Showing {filteredItems.length}</Text>
              {hasNextPage && <TouchableOpacity disabled={isFetchingNextPage} onPress={loadMore} style={styles.loadMoreButton}>{isFetchingNextPage ? <ActivityIndicator size="small" color={theme.colors.textPrimary} /> : <Text style={styles.loadMoreText}>Load more</Text>}</TouchableOpacity>}
            </View>
          </View>
        ) : (
          <ScrollView style={styles.mobileList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileListContent}>
            {filteredItems.map(item => <InventoryRow key={item.inventory_id} item={item} onAdjust={adjustStock} isUpdating={updatingInventoryId === item.inventory_id} mobile />)}
            {hasNextPage && <TouchableOpacity disabled={isFetchingNextPage} onPress={loadMore} style={styles.mobileLoadMoreButton}>{isFetchingNextPage ? <ActivityIndicator size="small" color={theme.colors.textPrimary} /> : <Text style={styles.loadMoreText}>Load more inventory</Text>}</TouchableOpacity>}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ManageInventoryScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  topHeader: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg },
  backButton: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface },
  backText: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  page: { flex: 1, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.lg },
  tabletPage: { paddingHorizontal: theme.spacing.xl },
  largeTabletPage: { paddingHorizontal: theme.spacing.xxl },
  title: { color: theme.colors.textPrimary, fontSize: 30, lineHeight: 36, fontWeight: '800', marginBottom: theme.spacing.md },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  statCard: { flex: 1, minWidth: 130, minHeight: 58, justifyContent: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface },
  compactStatCard: { minWidth: 0, flexBasis: '30%' },
  fullWidthStatCard: { flexBasis: '100%', width: '100%' },
  statLabel: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  statValue: { marginTop: 4, fontSize: 17, fontWeight: '800' },
  filterBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm, marginBottom: theme.spacing.md, padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xxl, backgroundColor: theme.colors.surface },
  mobileFilterBar: { alignItems: 'stretch', flexDirection: 'column' },
  filters: { alignItems: 'center', gap: theme.spacing.xs },
  filterButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.xl },
  activeFilter: { backgroundColor: theme.colors.black },
  filterText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
  activeFilterText: { color: theme.colors.white },
  searchBox: { width: 270, height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl },
  mobileSearch: { width: '100%' },
  searchInput: { flex: 1, marginLeft: theme.spacing.sm, color: theme.colors.textPrimary, fontSize: 11 },
  table: { flex: 1, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface },
  tableHeader: { height: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surfaceSecondary },
  headerText: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  tableBody: { flex: 1 },
  row: { minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  productColumn: { flex: 3 }, stockColumn: { flex: 1 }, reservedColumn: { flex: 1.2 }, statusColumn: { flex: 1.3 }, actionColumn: { flex: 1.1 },
  productCell: { flexDirection: 'row', alignItems: 'center' },
  productIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md, borderRadius: theme.radius.xl },
  availableIcon: { backgroundColor: '#E7F7F0' }, lowStockIcon: { backgroundColor: '#FFF4D6' }, unavailableIcon: { backgroundColor: '#FDE8E8' }, outOfStockIcon: { backgroundColor: '#FDE8E8' },
  productText: { flex: 1, minWidth: 0 }, productName: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '800' }, meta: { marginTop: 3, color: theme.colors.textSecondary, fontSize: 8 }, stockValue: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '800' },
  status: { fontSize: 10, fontWeight: '800' }, availableText: { color: theme.colors.success }, lowStockText: { color: theme.colors.warning }, unavailableText: { color: theme.colors.error }, outOfStockText: { color: theme.colors.error },
  actions: { minWidth: 84, flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.sm },
  actionsLoading: { height: 38, alignItems: 'center', justifyContent: 'center' },
  stockButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface },
  stockButtonDisabled: { opacity: 0.35 },
  addButton: { borderColor: theme.colors.primaryDark, backgroundColor: theme.colors.primary },
  footer: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border }, footerText: { color: theme.colors.textSecondary, fontSize: 8 },
  loadMoreButton: { minWidth: 88, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.lg, backgroundColor: theme.colors.primary },
  loadMoreText: { color: theme.colors.textPrimary, fontSize: 10, fontWeight: '800' },
  mobileList: { flex: 1 }, mobileListContent: { paddingBottom: theme.spacing.xxl, gap: theme.spacing.md },
  mobileLoadMoreButton: { height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.xl, backgroundColor: theme.colors.primary },
  mobileCard: { padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface },
  mobileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  mobileDetails: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: theme.spacing.lg }, mobileLabel: { color: theme.colors.textSecondary, fontSize: 8, fontWeight: '800' },
  feedbackState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  feedbackText: { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: theme.spacing.md },
  retryButton: { marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.lg, backgroundColor: theme.colors.primary },
  retryText: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '800' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md, padding: theme.spacing.md, borderWidth: 1, borderColor: '#F0C5C0', borderRadius: theme.radius.xl, backgroundColor: '#FEF2F2' },
  errorText: { flex: 1, color: theme.colors.error, fontSize: 11 },
});
