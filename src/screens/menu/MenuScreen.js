import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

import { theme } from '../../constant';

const MenuScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
    </View>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    padding: theme.spacing.xxl,

    backgroundColor: theme.colors.background,
  },

  title: {
    color: theme.colors.textPrimary,

    fontSize: theme.typography.fontSize.heading,

    fontWeight: theme.typography.fontWeight.bold,
  },
});
