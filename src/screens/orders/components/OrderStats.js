import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { useResponsive } from '../../../contexts/ResponsiveContext';

import { theme } from '../../../constant';

const StatCard = ({ label, value, icon, type = 'yellow', isTablet }) => {
  const getIconBackground = () => {
    switch (type) {
      case 'success':
        return styles.successIcon;

      case 'blue':
        return styles.blueIcon;

      default:
        return styles.yellowIcon;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.success;

      case 'blue':
        return theme.colors.info;

      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          width: isTablet ? '24%' : '48%',
        },
      ]}
    >
      <View style={[styles.iconBox, getIconBackground()]}>
        <Ionicons name={icon} size={20} color={getIconColor()} />
      </View>

      <View style={styles.content}>
        <Text allowFontScaling={false} style={styles.label}>
          {label}
        </Text>

        <Text allowFontScaling={false} style={styles.value}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const OrderStats = ({ orders = [] }) => {
  const { isTablet } = useResponsive();

  /*
  |--------------------------------------------------------------------------
  | USE ACTUAL ORDERS RETURNED FROM ACTIVE ROUTE
  |--------------------------------------------------------------------------
  */

  const activeCount = orders.length;

  const waitingCount = orders.filter(
    order => order.status === 'confirmed',
  ).length;

  const preparingCount = orders.filter(
    order => order.status === 'preparing',
  ).length;

  const readyCount = orders.filter(order => order.status === 'ready').length;

  return (
    <View style={styles.container}>
      <StatCard
        label="ACTIVE"
        value={activeCount}
        icon="reader-outline"
        isTablet={isTablet}
      />

      <StatCard
        label="WAITING"
        value={waitingCount}
        icon="time-outline"
        isTablet={isTablet}
      />

      <StatCard
        label="IN PREPARATION"
        value={preparingCount}
        icon="restaurant-outline"
        type="blue"
        isTablet={isTablet}
      />

      <StatCard
        label="READY"
        value={readyCount}
        icon="checkmark-circle-outline"
        type="success"
        isTablet={isTablet}
      />
    </View>
  );
};

export default OrderStats;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

    gap: theme.spacing.sm,

    marginBottom: theme.spacing.md,
  },

  card: {
    minHeight: 78,

    flexDirection: 'row',

    alignItems: 'center',

    padding: theme.spacing.md,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  iconBox: {
    width: 44,

    height: 44,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: theme.spacing.md,

    borderRadius: theme.radius.xl,
  },

  yellowIcon: {
    backgroundColor: theme.colors.primaryLight,
  },

  blueIcon: {
    backgroundColor: '#E8EFFC',
  },

  successIcon: {
    backgroundColor: '#E7F7F0',
  },

  content: {
    flex: 1,
  },

  label: {
    color: theme.colors.textSecondary,

    fontSize: 9,

    fontWeight: '700',

    letterSpacing: 0.4,
  },

  value: {
    marginTop: 2,

    color: theme.colors.textPrimary,

    fontSize: 20,

    fontWeight: '800',
  },
});
