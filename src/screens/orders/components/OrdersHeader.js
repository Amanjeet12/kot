import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { useResponsive } from '../../../contexts/ResponsiveContext';

import { theme } from '../../../constant';
import PrinterStatusButton from '../../../components/printer/PrinterStatusButton';

const OrdersHeader = ({ onRefresh, isRefreshing = false }) => {
  const { isTablet } = useResponsive();

  return (
    <View style={[styles.container, isTablet && styles.tabletContainer]}>
      {/* LEFT */}

      <View style={styles.titleArea}>
        <Text allowFontScaling={false} style={styles.title}>
          Active orders
        </Text>

        <Text allowFontScaling={false} style={styles.subtitle}>
          Prepare in queue order. Oldest confirmed order is ranked first.
        </Text>
      </View>

      {/* RIGHT */}

      <View style={styles.rightContainer}>
        {/* LIVE */}

        <PrinterStatusButton />

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />

          <Text allowFontScaling={false} style={styles.liveText}>
            Live · Updated just now
          </Text>
        </View>

        {/* REFRESH */}

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

export default OrdersHeader;

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,

    marginBottom: theme.spacing.lg,
  },

  tabletContainer: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',
  },

  titleArea: {
    flex: 1,
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
  },

  /* RIGHT */

  rightContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: theme.spacing.sm,
  },

  /* LIVE */

  liveBadge: {
    minHeight: 42,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: theme.spacing.lg,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  liveDot: {
    width: 9,

    height: 9,

    marginRight: theme.spacing.sm,

    borderRadius: theme.radius.round,

    backgroundColor: theme.colors.success,
  },

  liveText: {
    color: theme.colors.textPrimary,

    fontSize: 11,

    fontWeight: '700',
  },

  /* REFRESH */

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
