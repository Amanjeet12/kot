import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../../constant';

const MenuStats = ({ summary }) => {
  const stats = [
    {
      key: 'total',
      label: 'MENU ITEMS',
      value: summary.total,
      color: theme.colors.textPrimary,
    },

    {
      key: 'enabled',
      label: 'ENABLED',
      value: summary.enabled,
      color: theme.colors.success,
    },

    {
      key: 'disabled',
      label: 'DISABLED',
      value: summary.disabled,
      color: theme.colors.error,
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map(stat => (
        <View key={stat.key} style={styles.card}>
          <Text allowFontScaling={false} style={styles.label}>
            {stat.label}
          </Text>

          <Text
            allowFontScaling={false}
            style={[
              styles.value,

              {
                color: stat.color,
              },
            ]}
          >
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default MenuStats;

const styles = StyleSheet.create({
  container: {
    width: '100%',

    flexDirection: 'row',

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

  label: {
    marginBottom: 4,

    color: theme.colors.textSecondary,

    fontSize: 9,

    fontWeight: '700',

    letterSpacing: 0.4,
  },

  value: {
    fontSize: 20,

    lineHeight: 24,

    fontWeight: '800',
  },
});
