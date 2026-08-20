import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = {
  bg: '#F7F6F2',
  card: '#FFFFFF',
  border: '#E4E0D8',
  text: '#111111',
  subText: '#6F6B63',
  muted: '#8A857C',
  black: '#0E0E0E',
  green: '#0FA15D',
  greenBg: '#E8F7EF',
  red: '#D84E4E',
  redBg: '#FCECEC',
  yellow: '#D99A00',
  inputBg: '#FBFAF8',
};

const MOCK_ORDERS = [
  {
    id: 4,
    kot: 'KOT #5',
    time: '9:07 PM',
    items: ['Chicken Burger'],
    itemCount: 1,
    customer: 'Amanjeet',
    outlet: 'Main Cafeteria',
    amount: 40,
    status: 'completed',
  },
  {
    id: 3,
    kot: 'KOT #4',
    time: '2:06 PM',
    items: ['Corn Cup', 'Muffin', 'Chicken Burger'],
    itemCount: 3,
    customer: 'Amanjeet',
    outlet: 'Main Cafeteria',
    amount: 135,
    status: 'completed',
  },
  {
    id: 2,
    kot: 'KOT #4',
    time: '1:11 PM',
    items: ['2× Corn Cup'],
    itemCount: 2,
    customer: 'Amanjeet',
    outlet: 'Main Cafeteria',
    amount: 100,
    status: 'cancelled',
  },
  {
    id: 1,
    kot: 'KOT #3',
    time: '12:48 PM',
    items: ['Muffin', 'Fresh Lime Soda'],
    itemCount: 2,
    customer: 'Neha S.',
    outlet: 'Main Cafeteria',
    amount: 80,
    status: 'completed',
  },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const formatCurrency = value => `₹${value.toLocaleString('en-IN')}`;

const formatStatus = status => status.charAt(0).toUpperCase() + status.slice(1);

const OrderHistoryScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const summary = useMemo(() => {
    const totalOrders = MOCK_ORDERS.length;
    const completed = MOCK_ORDERS.filter(
      item => item.status === 'completed',
    ).length;
    const cancelled = MOCK_ORDERS.filter(
      item => item.status === 'cancelled',
    ).length;
    const totalValue = MOCK_ORDERS.filter(
      item => item.status !== 'cancelled',
    ).reduce((sum, item) => sum + item.amount, 0);

    return {
      totalOrders,
      completed,
      cancelled,
      totalValue,
    };
  }, []);

  const filteredOrders = useMemo(() => {
    let data = [...MOCK_ORDERS];

    if (selectedFilter !== 'all') {
      data = data.filter(item => item.status === selectedFilter);
    }

    if (search.trim()) {
      const keyword = search.toLowerCase();
      data = data.filter(item => {
        const itemsText = item.items.join(', ').toLowerCase();
        return (
          item.customer.toLowerCase().includes(keyword) ||
          item.kot.toLowerCase().includes(keyword) ||
          String(item.id).includes(keyword) ||
          itemsText.includes(keyword)
        );
      });
    }

    return data;
  }, [selectedFilter, search]);

  const renderSummaryCard = (title, value, valueStyle) => (
    <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet]}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={[styles.summaryValue, valueStyle]}>{value}</Text>
    </View>
  );

  const renderFilterTabs = () => {
    const countMap = {
      all: summary.totalOrders,
      completed: summary.completed,
      cancelled: summary.cancelled,
    };

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map(filter => {
          const active = selectedFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  active && styles.filterPillTextActive,
                ]}
              >
                {filter.label} · {countMap[filter.key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderTableHeader = () => {
    if (!isTablet) return null;

    return (
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>ORDER</Text>
        <Text style={[styles.tableHeaderText, { flex: 2.4 }]}>ITEMS</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.8 }]}>CUSTOMER</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>AMOUNT</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
      </View>
    );
  };

  const renderStatusBadge = status => {
    const isCompleted = status === 'completed';

    return (
      <View
        style={[
          styles.badge,
          isCompleted ? styles.badgeCompleted : styles.badgeCancelled,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            isCompleted ? styles.badgeCompletedText : styles.badgeCancelledText,
          ]}
        >
          {formatStatus(status)}
        </Text>
      </View>
    );
  };

  const renderTabletRow = ({ item }) => {
    return (
      <View style={styles.tableRow}>
        <View style={{ flex: 1.2 }}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <Text style={styles.orderMeta}>
            {item.kot} · {item.time}
          </Text>
        </View>

        <View style={{ flex: 2.4 }}>
          <Text style={styles.primaryText}>{item.items.join(', ')}</Text>
          <Text style={styles.secondaryText}>
            {item.itemCount} item{item.itemCount > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={{ flex: 1.8 }}>
          <Text style={styles.primaryText}>{item.customer}</Text>
          <Text style={styles.secondaryText}>{item.outlet}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
        </View>

        <View style={{ flex: 1 }}>{renderStatusBadge(item.status)}</View>
      </View>
    );
  };

  const renderMobileCard = ({ item }) => {
    return (
      <View style={styles.mobileCard}>
        <View style={styles.mobileTopRow}>
          <View>
            <Text style={styles.orderId}>#{item.id}</Text>
            <Text style={styles.orderMeta}>
              {item.kot} · {item.time}
            </Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.mobileSection}>
          <Text style={styles.mobileLabel}>Items</Text>
          <Text style={styles.primaryText}>{item.items.join(', ')}</Text>
          <Text style={styles.secondaryText}>
            {item.itemCount} item{item.itemCount > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.mobileBottomRow}>
          <View>
            <Text style={styles.mobileLabel}>Customer</Text>
            <Text style={styles.primaryText}>{item.customer}</Text>
            <Text style={styles.secondaryText}>{item.outlet}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.mobileLabel}>Amount</Text>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Order history</Text>
            <Text style={styles.subtitle}>
              Daily order records for Main Cafeteria.
            </Text>
          </View>

          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.black} />
            <Text style={styles.datePillText}>16 August 2026</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={[styles.summaryRow, !isTablet && styles.summaryColumn]}>
          {renderSummaryCard('TOTAL ORDERS', summary.totalOrders)}
          {renderSummaryCard('COMPLETED', summary.completed, {
            color: COLORS.green,
          })}
          {renderSummaryCard('CANCELLED', summary.cancelled, {
            color: COLORS.red,
          })}
          {renderSummaryCard('ORDER VALUE', formatCurrency(summary.totalValue))}
        </View>

        {/* Filter + Search */}
        <View style={styles.toolbar}>
          <View style={{ flex: 1 }}>{renderFilterTabs()}</View>

          <View style={[styles.searchBox, !isTablet && styles.searchBoxMobile]}>
            <Ionicons name="search-outline" size={18} color={COLORS.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search order or customer"
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* List container */}
        <View style={styles.listCard}>
          {renderTableHeader()}

          <FlatList
            data={filteredOrders}
            keyExtractor={item => String(item.id)}
            renderItem={isTablet ? renderTabletRow : renderMobileCard}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No orders found</Text>
                <Text style={styles.emptySubTitle}>
                  Try changing the filter or search value.
                </Text>
              </View>
            }
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Showing 1–{filteredOrders.length} of {summary.totalOrders} orders
            </Text>

            <TouchableOpacity activeOpacity={0.8}>
              <Text style={styles.nextPageText}>Next page →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default OrderHistoryScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 28,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: COLORS.subText,
  },
  datePill: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePillText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryColumn: {
    flexDirection: 'column',
  },
  summaryCard: {
    flex: 1,
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
  },
  summaryCardTablet: {
    minWidth: 180,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#6A6356',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },

  toolbar: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    padding: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  filtersRow: {
    gap: 10,
    paddingRight: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: COLORS.black,
  },
  filterPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5F584B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  searchBox: {
    minWidth: 250,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchBoxMobile: {
    width: '100%',
    minWidth: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },

  listCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#665F53',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#EEEAE1',
  },

  orderId: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  orderMeta: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.subText,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  secondaryText: {
    marginTop: 5,
    fontSize: 13,
    color: COLORS.subText,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  badgeCompleted: {
    backgroundColor: COLORS.greenBg,
  },
  badgeCancelled: {
    backgroundColor: COLORS.redBg,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  badgeCompletedText: {
    color: COLORS.green,
  },
  badgeCancelledText: {
    color: COLORS.red,
  },

  mobileCard: {
    padding: 16,
  },
  mobileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  mobileSection: {
    marginTop: 14,
  },
  mobileBottomRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  mobileLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#7B7569',
    marginBottom: 6,
  },

  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexWrap: 'wrap',
    gap: 10,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.subText,
  },
  nextPageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B5E3A',
  },

  emptyWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubTitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.subText,
  },
});
