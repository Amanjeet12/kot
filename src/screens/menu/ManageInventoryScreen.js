import React, { useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../constant';
import { useResponsive } from '../../contexts/ResponsiveContext';
import { useTodayTuckShopMenu } from '../../hooks/queries/useTodayTuckShopMenu';

const InventoryCard = ({ item }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const inventory = item.inventory || {};
  const image = Array.isArray(item.image) ? item.image[0] : item.image;
  const current = Number(item.currentQuantity ?? inventory.currentQuantity ?? 0);
  const reserved = Number(
    item.reservedQuantity ?? inventory.reservedQuantity ?? 0,
  );
  const available = Number(
    item.availableQuantity ?? inventory.availableQuantity ?? 0,
  );
  const reorderLevel = Number(inventory.reorderLevel || 0);
  const isLowStock = Boolean(inventory.isLowStock);
  const isOutOfStock = available <= 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.imageBox}>
          {image && !imageFailed ? (
            <Image
              source={{ uri: image }}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
              style={styles.image}
            />
          ) : (
            <Ionicons
              name="cube-outline"
              size={25}
              color={theme.colors.textSecondary}
            />
          )}
        </View>

        <View style={styles.cardTitleArea}>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.itemName}>
            {item.itemName}
          </Text>
          <Text allowFontScaling={false} style={styles.itemMeta}>
            {item.category || 'Menu item'} · {inventory.unit || 'piece'}
          </Text>
        </View>

        <View
          style={[
            styles.stockPill,
            isLowStock && styles.lowStockPill,
            isOutOfStock && styles.outOfStockPill,
          ]}
        >
          <Text
            allowFontScaling={false}
            style={[
              styles.stockPillText,
              isLowStock && styles.lowStockText,
              isOutOfStock && styles.outOfStockText,
            ]}
          >
            {isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'In stock'}
          </Text>
        </View>
      </View>

      <View style={styles.quantityRow}>
        <View style={styles.quantityBox}>
          <Text allowFontScaling={false} style={styles.quantityLabel}>CURRENT</Text>
          <Text allowFontScaling={false} style={styles.quantityValue}>{current}</Text>
        </View>
        <View style={styles.quantityBox}>
          <Text allowFontScaling={false} style={styles.quantityLabel}>RESERVED</Text>
          <Text allowFontScaling={false} style={styles.quantityValue}>{reserved}</Text>
        </View>
        <View style={styles.quantityBox}>
          <Text allowFontScaling={false} style={styles.quantityLabel}>AVAILABLE</Text>
          <Text
            allowFontScaling={false}
            style={[styles.quantityValue, isOutOfStock && styles.outOfStockText]}
          >
            {available}
          </Text>
        </View>
        <View style={styles.quantityBox}>
          <Text allowFontScaling={false} style={styles.quantityLabel}>REORDER AT</Text>
          <Text allowFontScaling={false} style={styles.quantityValue}>{reorderLevel}</Text>
        </View>
      </View>
    </View>
  );
};

const ManageInventoryScreen = ({ navigation }) => {
  const { width, isTablet, isLargeTablet } = useResponsive();
  const { data, isLoading, isFetching, error, refetch } =
    useTodayTuckShopMenu();
  const items = useMemo(() => data?.data?.items || [], [data]);
  const columns = isTablet && width >= 1000 ? 2 : 1;

  const summary = useMemo(() => ({
    total: items.length,
    inStock: items.filter(item => Number(item.availableQuantity || 0) > 0).length,
    lowStock: items.filter(item => item.inventory?.isLowStock).length,
    outOfStock: items.filter(item => Number(item.availableQuantity || 0) <= 0).length,
  }), [items]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text allowFontScaling={false} style={styles.message}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.backText}>Back to menu</Text>
      </View>

      <View
        style={[
          styles.heading,
          isTablet && styles.tabletPadding,
          isLargeTablet && styles.largeTabletPadding,
        ]}
      >
        <View style={styles.headingText}>
          <Text allowFontScaling={false} style={styles.title}>Manage inventory</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Track today’s tuck shop stock and reorder levels.
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isFetching}
          onPress={() => refetch()}
          style={styles.refreshButton}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={theme.colors.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      {!error && (
        <View
          style={[
            styles.stats,
            isTablet && styles.tabletPadding,
            isLargeTablet && styles.largeTabletPadding,
          ]}
        >
          {[
            ['TOTAL ITEMS', summary.total, theme.colors.textPrimary],
            ['IN STOCK', summary.inStock, theme.colors.success],
            ['LOW STOCK', summary.lowStock, theme.colors.warning],
            ['OUT OF STOCK', summary.outOfStock, theme.colors.error],
          ].map(([label, value, color]) => (
            <View key={label} style={styles.statCard}>
              <Text allowFontScaling={false} style={styles.statLabel}>{label}</Text>
              <Text allowFontScaling={false} style={[styles.statValue, { color }]}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      {error ? (
        <View style={styles.center}>
          <Text allowFontScaling={false} style={styles.errorTitle}>Unable to load inventory</Text>
          <Text allowFontScaling={false} style={styles.message}>
            {error?.response?.data?.msg || error?.message || 'Something went wrong'}
          </Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => refetch()} style={styles.retryButton}>
            <Text allowFontScaling={false} style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={`inventory-${columns}`}
          data={items}
          numColumns={columns}
          keyExtractor={item => String(item.daily_menu_item_id)}
          renderItem={({ item }) => (
            <View style={[styles.cardWrapper, columns > 1 && styles.twoColumnCard]}>
              <InventoryCard item={item} />
            </View>
          )}
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          contentContainerStyle={[
            styles.listContent,
            isTablet && styles.tabletPadding,
            isLargeTablet && styles.largeTabletPadding,
            items.length === 0 && styles.emptyContent,
          ]}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text allowFontScaling={false} style={styles.emptyTitle}>No inventory items</Text>
              <Text allowFontScaling={false} style={styles.message}>Today’s menu has no items yet.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ManageInventoryScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  topHeader: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },
  backText: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  headingText: { flex: 1, paddingRight: theme.spacing.md },
  title: { color: theme.colors.textPrimary, fontSize: 30, lineHeight: 36, fontWeight: '800' },
  subtitle: { marginTop: theme.spacing.xs, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18 },
  refreshButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  tabletPadding: { paddingHorizontal: theme.spacing.xl },
  largeTabletPadding: { paddingHorizontal: theme.spacing.xxl },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 130,
    minHeight: 78,
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xxl,
    backgroundColor: theme.colors.surface,
  },
  statLabel: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  statValue: { marginTop: 4, fontSize: 20, lineHeight: 24, fontWeight: '800' },
  listContent: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xxxl },
  columnWrapper: { gap: theme.spacing.md },
  cardWrapper: { flex: 1, marginBottom: theme.spacing.md },
  twoColumnCard: { flex: 0.5 },
  card: {
    width: '100%',
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  imageBox: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  image: { width: '100%', height: '100%' },
  cardTitleArea: { flex: 1, minWidth: 0, marginLeft: theme.spacing.md },
  itemName: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '800' },
  itemMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 10 },
  stockPill: { paddingHorizontal: theme.spacing.sm, paddingVertical: 6, borderRadius: theme.radius.round, backgroundColor: '#E7F7F0' },
  lowStockPill: { backgroundColor: '#FFF4D6' },
  outOfStockPill: { backgroundColor: '#FDE8E8' },
  stockPillText: { color: theme.colors.success, fontSize: 9, fontWeight: '800' },
  lowStockText: { color: theme.colors.warning },
  outOfStockText: { color: theme.colors.error },
  quantityRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  quantityBox: { flex: 1, minWidth: 0, padding: theme.spacing.sm, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surfaceSecondary },
  quantityLabel: { color: theme.colors.textSecondary, fontSize: 8, fontWeight: '700' },
  quantityValue: { marginTop: 4, color: theme.colors.textPrimary, fontSize: 17, fontWeight: '800' },
  center: { flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xxl },
  message: { marginTop: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.base, textAlign: 'center' },
  errorTitle: { color: theme.colors.error, fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold },
  retryButton: { minWidth: 100, height: 44, marginTop: theme.spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.xl, backgroundColor: theme.colors.primary },
  retryText: { color: theme.colors.textOnPrimary, fontSize: theme.typography.fontSize.base, fontWeight: theme.typography.fontWeight.bold },
  emptyContent: { flexGrow: 1 },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold },
});
