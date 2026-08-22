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
import PrinterStatusButton from '../../../components/printer/PrinterStatusButton';

const OrderHistoryHeader = ({
  dateLabel,
  onDatePress,
  onRefresh,
  isRefreshing = false,
}) => {
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

      {/* DATE BUTTON */}

      <View style={styles.actions}>
        <PrinterStatusButton />

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onDatePress}
          style={styles.dateButton}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={theme.colors.textPrimary}
          />

          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={styles.dateText}
          >
            {dateLabel}
          </Text>

          <Ionicons
            name="chevron-down"
            size={11}
            color={theme.colors.textSecondary}
          />
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

export default OrderHistoryHeader;

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

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

  dateButton: {
    minWidth: 125,

    height: 42,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

    paddingHorizontal: theme.spacing.md,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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

  dateText: {
    maxWidth: 190,

    color: theme.colors.textPrimary,

    fontSize: 11,

    fontWeight: '700',
  },
});
