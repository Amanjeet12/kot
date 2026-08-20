import React from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

import {
  useResponsive,
} from '../../../contexts/ResponsiveContext';

const OrderHistoryFilterBar = ({
  selectedStatus,

  onStatusChange,

  search,

  onSearchChange,

  counts,
}) => {
  const {
    isTablet,
  } = useResponsive();

  const filters = [
    {
      key: 'all',
      label: 'All',
      count: counts?.all || 0,
    },

    {
      key: 'completed',
      label: 'Completed',
      count: counts?.completed || 0,
    },

    {
      key: 'cancelled',
      label: 'Cancelled',
      count: counts?.cancelled || 0,
    },
  ];

  return (
    <View
      style={[
        styles.container,

        !isTablet &&
          styles.mobileContainer,
      ]}
    >
      {/* FILTER */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map(filter => {
          const active =
            selectedStatus === filter.key;

          return (
            <TouchableOpacity
              key={filter.key}
              activeOpacity={0.75}
              onPress={() =>
                onStatusChange(filter.key)
              }
              style={[
                styles.filterButton,

                active &&
                  styles.filterButtonActive,
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.filterText,

                  active &&
                    styles.filterTextActive,
                ]}
              >
                {filter.label} · {filter.count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SEARCH */}

      <View
        style={[
          styles.searchBox,

          !isTablet &&
            styles.mobileSearchBox,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={15}
          color={theme.colors.textSecondary}
        />

        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search order or customer"
          placeholderTextColor={
            theme.colors.textSecondary
          }
          style={styles.searchInput}
        />
      </View>
    </View>
  );
};

export default OrderHistoryFilterBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'space-between',

    gap: theme.spacing.sm,

    marginBottom: theme.spacing.md,

    padding: theme.spacing.sm,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  mobileContainer: {
    alignItems: 'stretch',

    flexDirection: 'column',
  },

  filters: {
    alignItems: 'center',

    gap: theme.spacing.xs,
  },

  filterButton: {
    minHeight: 40,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: theme.spacing.md,

    borderRadius: theme.radius.xl,
  },

  filterButtonActive: {
    backgroundColor: theme.colors.black,
  },

  filterText: {
    color: theme.colors.textSecondary,

    fontSize: 11,

    fontWeight: '700',
  },

  filterTextActive: {
    color: theme.colors.surface,
  },

  searchBox: {
    width: 270,

    height: 44,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: theme.spacing.md,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surface,
  },

  mobileSearchBox: {
    width: '100%',
  },

  searchInput: {
    flex: 1,

    height: '100%',

    paddingVertical: 0,

    marginLeft: theme.spacing.sm,

    color: theme.colors.textPrimary,

    fontSize: 11,
  },
});
