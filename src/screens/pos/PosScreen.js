import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
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
import { MOCK_MENU_ITEMS } from '../menu/mockMenuItems';
import OrdersHeader from '../orders/components/OrdersHeader';

const categories = ['All', ...new Set(MOCK_MENU_ITEMS.map(item => item.category))];

const PosScreen = () => {
  const { isMobile, isPortrait, isLargeTablet } = useResponsive();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const shouldStack = isMobile || isPortrait;

  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    return MOCK_MENU_ITEMS.filter(item =>
      item.enabled && item.stock > 0 &&
      (category === 'All' || item.category === category) &&
      (!term || item.name.toLowerCase().includes(term)),
    );
  }, [category, search]);

  const cartItems = useMemo(
    () => MOCK_MENU_ITEMS.filter(item => cart[item.id]).map(item => ({ ...item, quantity: cart[item.id] })),
    [cart],
  );
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
      <TouchableOpacity style={styles.productCard} activeOpacity={0.75} onPress={() => changeQuantity(item, 1)}>
        <View style={styles.productIcon}>
          <Ionicons name={item.icon} size={25} color={theme.colors.textPrimary} />
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
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.container, isMobile && styles.containerMobile, isLargeTablet && styles.containerLarge]}>
        <OrdersHeader
          title="POS"
          subtitle="Create a walk-in order. Select items and collect payment."
          onRefresh={() => {
            setSearch('');
            setCategory('All');
          }}
        />

        <View style={[styles.content, shouldStack && styles.contentStacked]}>
          <View style={styles.catalogue}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search menu"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map(item => (
                <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}>
                  <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <FlatList
              data={products}
              key={shouldStack ? 'two-columns' : 'three-columns'}
              numColumns={shouldStack ? 2 : 3}
              keyExtractor={item => String(item.id)}
              renderItem={renderProduct}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No available items found.</Text>}
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
  catalogue: { flex: 1.65, minHeight: 250 },
  searchBox: { height: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.md },
  searchInput: { flex: 1, color: theme.colors.textPrimary, fontSize: 14, marginLeft: theme.spacing.sm, paddingVertical: 0 },
  categoryRow: { gap: theme.spacing.sm, paddingVertical: theme.spacing.md },
  category: { height: 36, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.round, backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.lg },
  categoryActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  categoryText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: theme.colors.textPrimary, fontWeight: '700' },
  productList: { paddingBottom: theme.spacing.xl },
  productRow: { gap: theme.spacing.md, marginBottom: theme.spacing.md },
  productCard: { flex: 1, minWidth: 0, minHeight: 154, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xxl, backgroundColor: theme.colors.surface, padding: theme.spacing.md },
  productIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.xl, backgroundColor: theme.colors.primaryLight },
  productName: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 10 },
  productMeta: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 },
  price: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  addButton: { minWidth: 32, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: 7 },
  addButtonActive: { backgroundColor: theme.colors.primary },
  addQuantity: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '800', marginLeft: 3 },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 40 },
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
