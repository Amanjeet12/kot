import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../constant';
import { useResponsive } from '../../contexts/ResponsiveContext';
import { useTodayTuckShopMenu } from '../../hooks/queries/useTodayTuckShopMenu';
import { useTuckShopCategories } from '../../hooks/queries/useTuckShopCategories';
import OrdersHeader from '../orders/components/OrdersHeader';

const PosScreen = () => {
  const { isMobile, isPortrait, isLargeTablet } = useResponsive();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [categoryScroll, setCategoryScroll] = useState({
    contentWidth: 0,
    viewportWidth: 0,
    x: 0,
  });
  const categoryListRef = useRef(null);
  const shouldStack = isMobile || isPortrait;
  const productColumns = isMobile ? 2 : 3;

  const {
    data: menuResponse,
    isLoading: isLoadingMenu,
    isFetching: isFetchingMenu,
    error: menuError,
    refetch: refetchMenu,
  } = useTodayTuckShopMenu();
  const {
    data: categoriesResponse,
    isFetching: isFetchingCategories,
    refetch: refetchCategories,
  } = useTuckShopCategories();

  const menuItems = useMemo(() => {
    const items = menuResponse?.data?.items || [];

    return items.map(item => ({
      id: item.daily_menu_item_id,
      dailyMenuItemId: item.daily_menu_item_id,
      tuckShopItemId: item.tuck_shop_item_id,
      categoryId: item.category_id,
      name: item.itemName,
      foodType: item.type,
      category: item.category,
      price: Number(item.price || 0),
      stock: Number(
        item.availableQuantity ?? item.inventory?.availableQuantity ?? 0,
      ),
      enabled: Boolean(item.isAvailable),
      image: Array.isArray(item.image) ? item.image[0] : item.image,
      icon:
        String(item.type).toLowerCase() === 'non-veg'
          ? 'fast-food-outline'
          : 'restaurant-outline',
    }));
  }, [menuResponse]);

  const categories = useMemo(() => {
    const responseData = categoriesResponse?.data;
    const rawCategories = Array.isArray(responseData)
      ? responseData
      : responseData?.categories || categoriesResponse?.categories || [];

    return [
      'All',
      ...new Set(rawCategories
        .map(item =>
          item.categoryName ??
          item.category_name ??
          item.name ??
          item.category,
        )
        .filter(Boolean)),
    ];
  }, [categoriesResponse]);

  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    return menuItems.filter(item =>
      item.enabled && item.stock > 0 &&
      (category === 'All' || item.category === category) &&
      (!term || item.name.toLowerCase().includes(term)),
    );
  }, [category, menuItems, search]);

  const cartItems = useMemo(
    () => menuItems.filter(item => cart[item.id]).map(item => ({ ...item, quantity: cart[item.id] })),
    [cart, menuItems],
  );
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const canScrollCategoriesLeft = categoryScroll.x > 4;
  const canScrollCategoriesRight =
    categoryScroll.contentWidth > categoryScroll.viewportWidth &&
    categoryScroll.x <
      categoryScroll.contentWidth - categoryScroll.viewportWidth - 4;

  const scrollCategories = direction => {
    const maximumX = Math.max(
      0,
      categoryScroll.contentWidth - categoryScroll.viewportWidth,
    );
    const nextX = Math.max(
      0,
      Math.min(maximumX, categoryScroll.x + direction * 180),
    );

    categoryListRef.current?.scrollTo({ x: nextX, animated: true });
  };

  const handleCategoryListLayout = event => {
    const viewportWidth = event.nativeEvent?.layout?.width || 0;

    setCategoryScroll(current => ({ ...current, viewportWidth }));
  };

  const handleCategoryScroll = event => {
    const x = event.nativeEvent?.contentOffset?.x || 0;

    setCategoryScroll(current => ({ ...current, x }));
  };

  const changeQuantity = (item, change) => {
    setCart(current => {
      const nextQuantity = Math.max(0, Math.min(item.stock, (current[item.id] || 0) + change));
      const next = { ...current };
      if (nextQuantity === 0) delete next[item.id];
      else next[item.id] = nextQuantity;
      return next;
    });
  };

  const handleCheckout = () => {
    Alert.alert('Order ready', `Collect ₹${subtotal} and confirm the order.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm order', onPress: () => setCart({}) },
    ]);
  };

  const renderProduct = ({ item }) => {
    const quantity = cart[item.id] || 0;
    return (
      <View
        style={[
          styles.productWrapper,
          productColumns === 2
            ? styles.productWrapperTwoColumns
            : styles.productWrapperThreeColumns,
        ]}
      >
      <TouchableOpacity style={styles.productCard} activeOpacity={0.75} onPress={() => changeQuantity(item, 1)}>
        <View style={styles.productIcon}>
          {item.image && !failedImages[item.id] ? (
            <Image
              source={{ uri: item.image }}
              resizeMode="cover"
              onError={() =>
                setFailedImages(current => ({ ...current, [item.id]: true }))
              }
              style={styles.productImage}
            />
          ) : (
            <Ionicons
              name={item.icon}
              size={25}
              color={theme.colors.textPrimary}
            />
          )}
        </View>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productMeta}>{item.category} · {item.stock} left</Text>
        <View style={styles.productFooter}>
          <Text style={styles.price}>₹{item.price}</Text>
          <View style={[styles.addButton, quantity > 0 && styles.addButtonActive]}>
            <Ionicons name={quantity ? 'checkmark' : 'add'} size={18} color={theme.colors.textPrimary} />
            {quantity > 0 && <Text style={styles.addQuantity}>{quantity}</Text>}
          </View>
        </View>
      </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.container, isMobile && styles.containerMobile, isLargeTablet && styles.containerLarge]}>
        <OrdersHeader
          title="POS"
          subtitle="Create a walk-in order. Select items and collect payment."
          isRefreshing={isFetchingMenu || isFetchingCategories}
          onRefresh={() => {
            setSearch('');
            setCategory('All');
            refetchMenu();
            refetchCategories();
          }}
        />

        <View style={[styles.content, shouldStack && styles.contentStacked]}>
          <View style={styles.catalogueCard}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search menu"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
              />
              {search.length > 0 && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                  onPress={() => setSearch('')}
                  style={styles.clearSearchButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.categoryScroller}>
              <ScrollView
                ref={categoryListRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryList}
                contentContainerStyle={styles.categoryRow}
                onLayout={handleCategoryListLayout}
                onContentSizeChange={contentWidth =>
                  setCategoryScroll(current => ({
                    ...current,
                    contentWidth,
                  }))
                }
                onScroll={handleCategoryScroll}
                scrollEventThrottle={16}
              >
                {categories.map(item => (
                  <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}>
                    <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {canScrollCategoriesLeft && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Show previous categories"
                  activeOpacity={0.8}
                  hitSlop={6}
                  onPress={() => scrollCategories(-1)}
                  style={[styles.categoryArrow, styles.categoryArrowLeft]}
                >
                  <Ionicons name="chevron-back" size={16} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              )}
              {canScrollCategoriesRight && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Show more categories"
                  activeOpacity={0.8}
                  hitSlop={6}
                  onPress={() => scrollCategories(1)}
                  style={[styles.categoryArrow, styles.categoryArrowRight]}
                >
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={products}
              key={`${productColumns}-column-products`}
              numColumns={productColumns}
              keyExtractor={item => String(item.id)}
              renderItem={renderProduct}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                isLoadingMenu ? (
                  <View style={styles.feedbackState}>
                    <ActivityIndicator size="large" color={theme.colors.primaryDark} />
                    <Text style={styles.emptyText}>Loading today's menu...</Text>
                  </View>
                ) : menuError ? (
                  <View style={styles.feedbackState}>
                    <Ionicons name="cloud-offline-outline" size={30} color={theme.colors.textMuted} />
                    <Text style={styles.emptyText}>Unable to load the menu.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetchMenu()}>
                      <Text style={styles.retryText}>Try again</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No available items found.</Text>
                )
              }
            />
          </View>

          <View style={[styles.cartCard, shouldStack && styles.cartCardStacked]}>
            <View style={styles.cartHeader}>
              <View>
                <Text style={styles.cartTitle}>Current order</Text>
                <Text style={styles.cartSubtitle}>{itemCount ? `${itemCount} items selected` : 'Add items from the menu'}</Text>
              </View>
              {itemCount > 0 && <TouchableOpacity onPress={() => setCart({})}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>}
            </View>
            <ScrollView style={styles.cartList} contentContainerStyle={!cartItems.length && styles.emptyCart}>
              {!cartItems.length ? (
                <><View style={styles.emptyCartIcon}><Ionicons name="basket-outline" size={30} color={theme.colors.textMuted} /></View><Text style={styles.emptyCartText}>Your order is empty</Text></>
              ) : cartItems.map(item => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.cartItemCopy}><Text style={styles.cartItemName}>{item.name}</Text><Text style={styles.cartItemPrice}>₹{item.price * item.quantity}</Text></View>
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepButton} onPress={() => changeQuantity(item, -1)}><Ionicons name="remove" size={17} color={theme.colors.textPrimary} /></TouchableOpacity>
                    <Text style={styles.stepQuantity}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.stepButton} onPress={() => changeQuantity(item, 1)}><Ionicons name="add" size={17} color={theme.colors.textPrimary} /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>₹{subtotal}</Text></View>
            <TouchableOpacity disabled={!itemCount} onPress={handleCheckout} style={[styles.checkoutButton, !itemCount && styles.checkoutButtonDisabled]}>
              <Text style={[styles.checkoutText, !itemCount && styles.checkoutTextDisabled]}>Place order</Text>
              <Ionicons name="arrow-forward" size={19} color={itemCount ? theme.colors.textPrimary : theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PosScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, paddingTop: theme.spacing.lg, paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xl },
  containerMobile: { paddingTop: theme.spacing.md, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md },
  containerLarge: { paddingHorizontal: theme.spacing.xxl },
  content: { flex: 1, flexDirection: 'row', gap: theme.spacing.lg },
  contentStacked: { flexDirection: 'column' },
  catalogueCard: { flex: 1.65, minHeight: 250, borderWidth: 1, borderColor: '#DADDD6', borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: theme.spacing.lg, overflow: 'hidden' },
  searchBox: { height: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.md },
  searchInput: { flex: 1, color: theme.colors.textPrimary, fontSize: 14, marginLeft: theme.spacing.sm, paddingVertical: 0 },
  clearSearchButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  categoryScroller: { position: 'relative', marginBottom: theme.spacing.md },
  categoryList: { flexGrow: 0, flexShrink: 0 },
  categoryRow: { gap: theme.spacing.sm, paddingTop: theme.spacing.md },
  categoryArrow: { position: 'absolute', top: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.round, backgroundColor: theme.colors.surface, zIndex: 2, ...theme.shadows.small },
  categoryArrowLeft: { left: 4 },
  categoryArrowRight: { right: 4 },
  category: { height: 40, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: theme.spacing.lg },
  categoryActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  categoryText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: theme.colors.textPrimary, fontWeight: '700' },
  productList: { flexGrow: 1, paddingBottom: theme.spacing.sm },
  productRow: { gap: theme.spacing.md, marginBottom: theme.spacing.md },
  productWrapper: { minWidth: 0 },
  productWrapperTwoColumns: { flex: 0.5 },
  productWrapperThreeColumns: { flex: 0.333333 },
  productCard: { width: '100%', minHeight: 154, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xxl, backgroundColor: theme.colors.surface, padding: theme.spacing.md },
  productIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.xl, backgroundColor: theme.colors.primaryLight, overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  productName: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 10 },
  productMeta: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 },
  price: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  addButton: { minWidth: 32, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: 7 },
  addButtonActive: { backgroundColor: theme.colors.primary },
  addQuantity: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '800', marginLeft: 3 },
  feedbackState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md },
  retryButton: { marginTop: theme.spacing.md, borderRadius: theme.radius.lg, backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
  retryText: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '700' },
  cartCard: { flex: 1, borderWidth: 1, borderColor: '#DADDD6', borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  cartCardStacked: { flex: 1, minHeight: 280 },
  cartHeader: { minHeight: 72, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg },
  cartTitle: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: '700' },
  cartSubtitle: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4 },
  clearText: { color: theme.colors.error, fontSize: 12, fontWeight: '700' },
  cartList: { flex: 1 },
  emptyCart: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  emptyCartIcon: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 31, backgroundColor: theme.colors.surfaceSecondary },
  emptyCartText: { color: theme.colors.textSecondary, fontSize: 12, marginTop: theme.spacing.md },
  cartItem: { minHeight: 68, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
  cartItemCopy: { flex: 1, paddingRight: theme.spacing.sm },
  cartItemName: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
  cartItemPrice: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: theme.colors.surfaceSecondary },
  stepQuantity: { minWidth: 28, color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  totalLabel: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
  totalValue: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '800' },
  checkoutButton: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, borderRadius: theme.radius.xl, backgroundColor: theme.colors.primary, margin: theme.spacing.lg },
  checkoutButtonDisabled: { backgroundColor: theme.colors.surfaceSecondary },
  checkoutText: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  checkoutTextDisabled: { color: theme.colors.textMuted },
});
