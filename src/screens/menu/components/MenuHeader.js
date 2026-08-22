import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

import { useResponsive } from '../../../contexts/ResponsiveContext';
import PrinterStatusButton from '../../../components/printer/PrinterStatusButton';

const MenuHeader = ({
  onManageInventory,
  onRefresh,
  isRefreshing = false,
}) => {
  const { isTablet } = useResponsive();

  return (
    <View style={[styles.container, isTablet && styles.tabletContainer]}>
      {/* LEFT */}

      <View style={styles.titleArea}>
        <Text allowFontScaling={false} style={styles.title}>
          Menu
        </Text>

        <Text allowFontScaling={false} style={styles.subtitle}>
          Control what employees can order from the tuck shop.
        </Text>
      </View>

      {/* RIGHT */}

      <View style={styles.actions}>
        <PrinterStatusButton />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onManageInventory}
          style={styles.inventoryButton}
        >
          <Ionicons
            name="file-tray-stacked-outline"
            size={18}
            color={theme.colors.primary}
          />

          <Text allowFontScaling={false} style={styles.inventoryText}>
            Manage inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isRefreshing}
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
          ) : (
            <Ionicons
              name="refresh-outline"
              size={20}
              color={theme.colors.textPrimary}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MenuHeader;

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,

    marginBottom: theme.spacing.lg,
  },

  tabletContainer: {
    minHeight: 52,

    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',
  },

  titleArea: {
    flex: 1,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  title: {
    color: theme.colors.textPrimary,

    fontSize: 30,

    lineHeight: 36,

    fontWeight: '800',
  },

  subtitle: {
    marginTop: theme.spacing.xs,

    color: theme.colors.textSecondary,

    fontSize: 13,

    lineHeight: 18,

    fontWeight: '400',
  },

  inventoryButton: {
    minWidth: 185,

    height: 42,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: theme.spacing.sm,

    paddingHorizontal: theme.spacing.lg,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  inventoryText: {
    color: theme.colors.textPrimary,

    fontSize: 12,

    fontWeight: '700',
  },

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
});
