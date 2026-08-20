import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { theme } from '../../../constant';

import {
  useResponsive,
} from '../../../contexts/ResponsiveContext';

const StatCard = ({
  label,
  value,
  valueColor,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <Text
        allowFontScaling={false}
        style={styles.label}
      >
        {label}
      </Text>

      <Text
        allowFontScaling={false}
        style={[
          styles.value,

          valueColor && {
            color: valueColor,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

const OrderHistoryStats = ({
  summary,
}) => {
  const {
    isTablet,
  } = useResponsive();

  return (
    <View style={styles.container}>
      <StatCard
        label="TOTAL ORDERS"
        value={summary?.totalOrders || 0}
        style={
          !isTablet &&
          styles.mobileCard
        }
      />

      <StatCard
        label="COMPLETED"
        value={summary?.completed || 0}
        valueColor={theme.colors.success}
        style={
          !isTablet &&
          styles.mobileCard
        }
      />

      <StatCard
        label="CANCELLED"
        value={summary?.cancelled || 0}
        valueColor={theme.colors.error}
        style={
          !isTablet &&
          styles.mobileCard
        }
      />

      <StatCard
        label="ORDER VALUE"
        value={`₹${Number(
          summary?.orderValue || 0,
        ).toLocaleString('en-IN')}`}
        style={
          !isTablet &&
          styles.mobileCard
        }
      />
    </View>
  );
};

export default OrderHistoryStats;

const styles = StyleSheet.create({
  container: {
    width: '100%',

    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: theme.spacing.md,

    marginBottom: theme.spacing.md,
  },

  card: {
    flex: 1,

    minHeight: 78,

    justifyContent: 'center',

    padding: theme.spacing.md,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  mobileCard: {
    flexBasis: '47%',
  },

  label: {
    marginBottom: 4,

    color: theme.colors.textSecondary,

    fontSize: 9,

    fontWeight: '700',

    letterSpacing: 0.4,
  },

  value: {
    color: theme.colors.textPrimary,

    fontSize: 20,
    lineHeight: 24,

    fontWeight: '800',
  },
});
