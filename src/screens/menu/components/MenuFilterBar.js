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

import { theme } from '../../../constant';

import { useResponsive } from '../../../contexts/ResponsiveContext';

const FILTERS = [
  {
    key: 'all',
    label: 'All',
  },

  {
    key: 'enabled',
    label: 'Enabled',
  },

  {
    key: 'disabled',
    label: 'Disabled',
  },

  {
    key: 'lowStock',
    label: 'Low stock',
  },
];

const MenuFilterBar = ({
  selectedFilter,
  onFilterChange,
  counts,
  search,
  onSearchChange,
}) => {
  const { isTablet } = useResponsive();

  return (
    <View style={[styles.container, !isTablet && styles.mobileContainer]}>
      {/* FILTERS */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map(filter => {
          const active = selectedFilter === filter.key;

          return (
            <TouchableOpacity
              key={filter.key}
              activeOpacity={0.8}
              onPress={() => onFilterChange(filter.key)}
              style={[styles.filterButton, active && styles.activeFilterButton]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.filterText, active && styles.activeFilterText]}
              >
                {filter.label} · {counts?.[filter.key] || 0}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SEARCH */}

      <View
        style={[
          styles.searchContainer,

          !isTablet && styles.mobileSearchContainer,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={19}
          color={theme.colors.textMuted}
        />

        <TextInput
          allowFontScaling={false}
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search menu item"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />

        {Boolean(search) && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onSearchChange('')}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default MenuFilterBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',

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

    padding: theme.spacing.sm,
  },

  filtersScroll: {
    flexGrow: 0,
  },

  filtersContent: {
    alignItems: 'center',

    gap: theme.spacing.xs,
  },

  filterButton: {
    minHeight: 40,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: theme.spacing.md,

    borderRadius: theme.radius.xl,

    backgroundColor: 'transparent',
  },

  activeFilterButton: {
    backgroundColor: theme.colors.black,
  },

  filterText: {
    color: theme.colors.textSecondary,

    fontSize: 11,

    fontWeight: '700',
  },

  activeFilterText: {
    color: theme.colors.white,
  },

  searchContainer: {
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

  mobileSearchContainer: {
    width: '100%',
  },

  searchInput: {
    flex: 1,

    height: '100%',

    marginLeft: theme.spacing.sm,

    paddingVertical: 0,

    color: theme.colors.textPrimary,

    fontSize: 12,
  },

  clearButton: {
    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: theme.spacing.xs,
  },
});
