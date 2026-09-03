import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../../constant';

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'backspace'],
];

const CustomPhoneKeypad = ({ onDigit, onBackspace, onClear }) => (
  <View style={styles.container}>
    {keys.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.row}>
        {row.map(key => {
          const isDigit = /^\d$/.test(key);
          const label =
            key === 'clear'
              ? 'Clear phone number'
              : key === 'backspace'
              ? 'Delete last digit'
              : `Enter ${key}`;

          return (
            <TouchableOpacity
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              activeOpacity={0.72}
              onPress={() => {
                if (isDigit) onDigit(key);
                else if (key === 'clear') onClear();
                else onBackspace();
              }}
              style={styles.key}
            >
              {isDigit ? (
                <Text style={styles.digit}>{key}</Text>
              ) : key === 'clear' ? (
                <Text style={styles.clearText}>Clear</Text>
              ) : (
                <Ionicons
                  name="backspace-outline"
                  size={23}
                  color={theme.colors.textPrimary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    ))}
  </View>
);

export default CustomPhoneKeypad;

const styles = StyleSheet.create({
  container: { gap: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  key: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  digit: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
  },
  clearText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
});
