import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../../constant';
import { useResponsive } from '../../../contexts/ResponsiveContext';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'enabled', label: 'Enabled' },
  { key: 'disabled', label: 'Disabled' },
  { key: 'lowStock', label: 'Low stock' },
];

const MenuFilterBar = ({ selectedFilter, onFilterChange, counts, categories, selectedCategory, onCategoryChange, search, onSearchChange }) => {
  const { isTablet } = useResponsive();
  const [modalVisible, setModalVisible] = useState(false);
  const selectedName = categories.find(category => String(category.id) === String(selectedCategory))?.name;
  const hasSelection = selectedCategory !== 'all';
  const selectCategory = id => {
    onCategoryChange(id);
    setModalVisible(false);
  };

  return (
    <>
      <View style={[styles.container, !isTablet && styles.mobileContainer]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map(filter => {
            const active = selectedFilter === filter.key;
            return (
              <TouchableOpacity key={filter.key} activeOpacity={0.8} onPress={() => onFilterChange(filter.key)} style={[styles.filterButton, active && styles.activeFilterButton]}>
                <Text allowFontScaling={false} style={[styles.filterText, active && styles.activeFilterText]}>
                  {filter.label} · {counts?.[filter.key] || 0}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)} style={[styles.categoryTrigger, !isTablet && styles.mobileControl, hasSelection && styles.categoryTriggerActive]}>
          <Ionicons name="menu-outline" size={20} color={theme.colors.textPrimary} />
          <Text allowFontScaling={false} numberOfLines={1} style={styles.categoryTriggerText}>{selectedName || 'Categories'}</Text>
          {hasSelection ? (
            <View style={styles.selectedBadge}><Ionicons name="checkmark" size={11} color={theme.colors.black} /></View>
          ) : (
            <Ionicons name="chevron-down" size={13} color={theme.colors.textSecondary} />
          )}
        </TouchableOpacity>

        <View style={[styles.searchContainer, !isTablet && styles.mobileControl]}>
          <Ionicons name="search-outline" size={19} color={theme.colors.textMuted} />
          <TextInput allowFontScaling={false} value={search} onChangeText={onSearchChange} placeholder="Search menu item" placeholderTextColor={theme.colors.textMuted} style={styles.searchInput} returnKeyType="search" />
          {Boolean(search) && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => onSearchChange('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.categoryModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <Text allowFontScaling={false} style={styles.modalTitle}>Select category</Text>
                <Text allowFontScaling={false} style={styles.modalSubtitle}>Show items from one category.</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {[{ id: 'all', name: 'All categories' }, ...categories].map(category => {
                const active = String(selectedCategory) === String(category.id);
                return (
                  <TouchableOpacity key={String(category.id)} activeOpacity={0.75} onPress={() => selectCategory(category.id)} style={[styles.categoryOption, active && styles.categoryOptionActive]}>
                    <Text allowFontScaling={false} style={[styles.categoryOptionText, active && styles.categoryOptionTextActive]}>{category.name}</Text>
                    <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default MenuFilterBar;

const styles = StyleSheet.create({
  container: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm, marginBottom: theme.spacing.md, padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xxl, backgroundColor: theme.colors.surface },
  mobileContainer: { alignItems: 'stretch', flexDirection: 'column' },
  filtersScroll: { flex: 1 },
  filtersContent: { alignItems: 'center', gap: theme.spacing.xs },
  filterButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.xl },
  activeFilterButton: { backgroundColor: theme.colors.black },
  filterText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
  activeFilterText: { color: theme.colors.white },
  categoryTrigger: { width: 150, height: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface },
  categoryTriggerActive: { borderColor: theme.colors.primaryDark, backgroundColor: theme.colors.primaryLight },
  categoryTriggerText: { flex: 1, color: theme.colors.textPrimary, fontSize: 11, fontWeight: '700' },
  selectedBadge: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.round, backgroundColor: theme.colors.primary },
  searchContainer: { width: 270, height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface },
  mobileControl: { width: '100%' },
  searchInput: { flex: 1, height: '100%', marginLeft: theme.spacing.sm, paddingVertical: 0, color: theme.colors.textPrimary, fontSize: 12 },
  clearButton: { alignItems: 'center', justifyContent: 'center', marginLeft: theme.spacing.xs },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg, backgroundColor: 'rgba(0,0,0,0.48)' },
  categoryModal: { width: '100%', maxWidth: 440, maxHeight: '72%', padding: theme.spacing.xl, borderRadius: 24, backgroundColor: theme.colors.surface },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: theme.spacing.lg },
  modalHeading: { flex: 1, paddingRight: theme.spacing.md },
  modalTitle: { color: theme.colors.textPrimary, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  modalSubtitle: { marginTop: theme.spacing.xs, color: theme.colors.textSecondary, fontSize: 12 },
  modalClose: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl },
  categoryList: { flexGrow: 0 },
  categoryOption: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl },
  categoryOptionActive: { borderColor: theme.colors.primaryDark, backgroundColor: theme.colors.primaryLight },
  categoryOptionText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  categoryOptionTextActive: { color: theme.colors.textPrimary, fontWeight: '800' },
  radio: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: theme.radius.round },
  radioActive: { borderColor: theme.colors.primaryDark },
  radioDot: { width: 10, height: 10, borderRadius: theme.radius.round, backgroundColor: theme.colors.primaryDark },
});
