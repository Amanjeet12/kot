import React, { useEffect, useState } from 'react';

import { Image, StyleSheet, Switch, Text, View } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

const MenuItemCard = ({ item, onToggle, lowStockLimit = 4 }) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.image]);

  const stock = Number(item.stock || 0);

  const isOutOfStock = stock <= 0;

  const isLowStock =
    item.isLowStock ?? (stock > 0 && stock <= lowStockLimit);

  /*
  |--------------------------------------------------------------------------
  | STOCK LABEL
  |--------------------------------------------------------------------------
  */

  const getStockText = () => {
    if (isOutOfStock) {
      return 'Out of stock';
    }

    if (isLowStock) {
      return `${stock} units · Low stock`;
    }

    return `${stock} units in stock`;
  };

  /*
  |--------------------------------------------------------------------------
  | STOCK COLOR
  |--------------------------------------------------------------------------
  */

  const getStockColor = () => {
    if (isOutOfStock) {
      return theme.colors.error;
    }

    if (isLowStock) {
      return theme.colors.warning;
    }

    return theme.colors.textSecondary;
  };

  return (
    <View style={styles.card}>
      {/* LEFT */}

      <View style={styles.leftSection}>
        {/* ICON */}

        <View style={styles.iconContainer}>
          {item.image && !imageFailed ? (
            <Image
              source={{ uri: item.image }}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
              style={styles.itemImage}
            />
          ) : (
            <Ionicons
              name={item.icon || 'fast-food-outline'}
              size={23}
              color={theme.colors.textSecondary}
            />
          )}
        </View>

        {/* DETAILS */}

        <View style={styles.details}>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.name}>
            {item.name}
          </Text>

          <Text allowFontScaling={false} numberOfLines={1} style={styles.meta}>
            {item.foodType} · {item.category}
          </Text>

          <Text allowFontScaling={false} style={styles.price}>
            ₹{item.price}
          </Text>
        </View>
      </View>

      {/* RIGHT */}

      <View style={styles.rightSection}>
        <Switch
          value={item.enabled}
          onValueChange={onToggle}
          trackColor={{
            false: theme.colors.borderDark,
            true: theme.colors.success,
          }}
          thumbColor={theme.colors.white}
          ios_backgroundColor={theme.colors.borderDark}
          style={styles.switch}
        />

        <View style={styles.statusArea}>
          <Text
            allowFontScaling={false}
            style={[
              styles.status,

              {
                color: item.enabled
                  ? theme.colors.textPrimary
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {item.enabled ? 'Enabled' : 'Disabled'}
          </Text>

          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[
              styles.stock,

              {
                color: getStockColor(),
              },
            ]}
          >
            {getStockText()}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default MenuItemCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',

    minHeight: 132,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: theme.spacing.md,

    paddingVertical: theme.spacing.lg,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.xxl,

    backgroundColor: theme.colors.surface,
  },

  leftSection: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',

    alignItems: 'center',

    paddingRight: theme.spacing.sm,
  },

  iconContainer: {
    width: 52,

    height: 52,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surfaceSecondary,

    overflow: 'hidden',
  },

  itemImage: {
    width: '100%',
    height: '100%',
  },

  details: {
    flex: 1,

    minWidth: 0,

    marginLeft: theme.spacing.md,
  },

  name: {
    color: theme.colors.textPrimary,

    fontSize: 16,

    lineHeight: 21,

    fontWeight: '700',
  },

  meta: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 11,

    lineHeight: 15,
  },

  price: {
    marginTop: 5,

    color: theme.colors.textPrimary,

    fontSize: 14,

    lineHeight: 18,

    fontWeight: '800',
  },

  rightSection: {
    minWidth: 120,

    alignItems: 'flex-end',

    justifyContent: 'center',
  },

  switch: {
    transform: [
      {
        scaleX: 0.92,
      },

      {
        scaleY: 0.92,
      },
    ],
  },

  statusArea: {
    marginTop: theme.spacing.xs,

    alignItems: 'flex-end',
  },

  status: {
    fontSize: 11,

    lineHeight: 15,

    fontWeight: '700',
  },

  stock: {
    marginTop: 2,

    fontSize: 9,

    lineHeight: 13,
  },
});
