import React from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { useResponsive } from '../../../contexts/ResponsiveContext';

import { theme } from '../../../constant';

const FILTERS = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
  },
  {
    key: 'ready',
    label: 'Ready',
  },
];

const OrderFilterBar = ({
  selectedStatus,
  onStatusChange,
  search,
  onSearchChange,
  counts,
}) => {
  const { isTablet } = useResponsive();

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map(filter => {
          const active = selectedStatus === filter.key;

          const count = counts?.[filter.key] || 0;

          return (
            <TouchableOpacity
              key={filter.key}
              activeOpacity={0.8}
              onPress={() => onStatusChange(filter.key)}
              style={[styles.filterButton, active && styles.filterButtonActive]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {filter.label}
                {' · '}
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.searchContainer, isTablet && styles.searchTablet]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.textMuted}
        />

        <TextInput
          value={search}
          onChangeText={onSearchChange}
          allowFontScaling={false}
          maxFontSizeMultiplier={1}
          placeholder="Search order or customer"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
        />
      </View>
    </View>
  );
};

export default OrderFilterBar;

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,

    marginBottom: theme.spacing.md,

    padding: theme.spacing.sm,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  containerTablet: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  filters: {
    gap: theme.spacing.xs,
  },

  filterButton: {
    minHeight: 40,

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
    color: theme.colors.white,
  },

  searchContainer: {
    height: 44,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: theme.spacing.md,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.xl,
  },

  searchTablet: {
    width: 270,
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
