import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

const OrderHistoryHeader = ({ date = '16 August 2026', onDatePress }) => {
  return (
    <View style={styles.container}>
      {/* LEFT */}

      <View style={styles.left}>
        <Text allowFontScaling={false} style={styles.title}>
          Order history
        </Text>

        <Text allowFontScaling={false} style={styles.subtitle}>
          Daily order records for Main Cafeteria.
        </Text>
      </View>

      {/* DATE */}

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onDatePress}
        style={styles.dateButton}
      >
        <Ionicons
          name="calendar-outline"
          size={15}
          color={theme.colors.textPrimary}
        />

        <Text allowFontScaling={false} style={styles.dateText}>
          {date}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrderHistoryHeader;

const styles = StyleSheet.create({
  container: {
    width: '100%',

    minHeight: 52,

    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    marginBottom: theme.spacing.lg,
  },

  left: {
    flex: 1,

    paddingRight: theme.spacing.md,
  },

  /*
   * IMPORTANT:
   * Kept compact to match Active Orders.
   *
   * Old history screen visually looked ~28px.
   * This should be around the Active Orders title.
   */

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

  dateButton: {
    height: 42,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    paddingHorizontal: theme.spacing.md,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  dateText: {
    color: theme.colors.textPrimary,

    fontSize: 11,

    fontWeight: '700',
  },
});
