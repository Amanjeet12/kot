import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../constant';
import { useResponsive } from '../../contexts/ResponsiveContext';
import { MOCK_INVENTORY_ITEMS } from './mockInventoryItems';

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

const InventoryRow = ({ item, onAdjust, mobile = false }) => {
  const status = getStatus(item);
  const product = (
    <View style={styles.productCell}>
      <View style={[styles.productIcon, styles[`${status}Icon`]]}>
        <Ionicons name={status === 'available' ? 'checkmark-circle-outline' : status === 'lowStock' ? 'alert-circle-outline' : 'close-circle-outline'} size={24} color={status === 'available' ? theme.colors.success : status === 'lowStock' ? theme.colors.warning : theme.colors.error} />
      </View>
      <View style={styles.productText}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.productName}>{item.item.itemName}</Text>
        <Text allowFontScaling={false} style={styles.meta}>{item.item.type} · Inventory ID {item.inventory_id}</Text>
      </View>
    </View>
  );
  const actions = (
    <View style={styles.actions}>
      <TouchableOpacity activeOpacity={0.75} onPress={() => onAdjust(item.inventory_id, -1)} style={styles.stockButton}>
        <Ionicons name="remove" size={18} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.75} onPress={() => onAdjust(item.inventory_id, 1)} style={[styles.stockButton, styles.addButton]}>
        <Ionicons name="add" size={18} color={theme.colors.textPrimary} />
      </TouchableOpacity>
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
  const [items, setItems] = useState(MOCK_INVENTORY_ITEMS);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => ({
    all: items.length,
    available: items.filter(item => getStatus(item) === 'available').length,
    lowStock: items.filter(item => getStatus(item) === 'lowStock').length,
    unavailable: items.filter(item => getStatus(item) === 'unavailable').length,
    outOfStock: items.filter(item => getStatus(item) === 'outOfStock').length,
  }), [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item => (filter === 'all' || getStatus(item) === filter) && (!term || item.item.itemName.toLowerCase().includes(term) || item.item.category.name.toLowerCase().includes(term)));
  }, [filter, items, search]);

  const adjustStock = (id, amount) => setItems(previous => previous.map(item => {
    if (item.inventory_id !== id) return item;
    const currentQuantity = Math.max(
      item.reservedQuantity,
      item.currentQuantity + amount,
    );
    const availableQuantity = Math.max(0, currentQuantity - item.reservedQuantity);
    return { ...item, currentQuantity, availableQuantity, isLowStock: availableQuantity > 0 && availableQuantity <= item.reorderLevel };
  }));

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

        {isTablet ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}><Text style={[styles.headerText, styles.productColumn]}>PRODUCT</Text><Text style={[styles.headerText, styles.stockColumn]}>STOCK</Text><Text style={[styles.headerText, styles.reservedColumn]}>RESERVED</Text><Text style={[styles.headerText, styles.statusColumn]}>STATUS</Text><Text style={[styles.headerText, styles.actionColumn]}>ACTIONS</Text></View>
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>{filteredItems.map(item => <InventoryRow key={item.inventory_id} item={item} onAdjust={adjustStock} />)}</ScrollView>
            <View style={styles.footer}><Text allowFontScaling={false} style={styles.footerText}>Showing {filteredItems.length} of {items.length} inventory records</Text></View>
          </View>
        ) : (
          <ScrollView style={styles.mobileList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileListContent}>{filteredItems.map(item => <InventoryRow key={item.inventory_id} item={item} onAdjust={adjustStock} mobile />)}</ScrollView>
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
  actions: { flexDirection: 'row', gap: theme.spacing.sm },
  stockButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface },
  addButton: { borderColor: theme.colors.primaryDark, backgroundColor: theme.colors.primary },
  footer: { height: 45, justifyContent: 'center', paddingHorizontal: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border }, footerText: { color: theme.colors.textSecondary, fontSize: 8 },
  mobileList: { flex: 1 }, mobileListContent: { paddingBottom: theme.spacing.xxl, gap: theme.spacing.md },
  mobileCard: { padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface },
  mobileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  mobileDetails: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: theme.spacing.lg }, mobileLabel: { color: theme.colors.textSecondary, fontSize: 8, fontWeight: '800' },
});
