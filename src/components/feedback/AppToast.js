import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../constant';

const SuccessToast = ({ text1, text2, hide, props }) => {
  const isTablet = Boolean(props?.isTablet);

  return (
    <View style={[styles.row, isTablet && styles.rowTablet]}>
      <View style={[styles.card, isTablet && styles.cardTablet]}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark" size={20} color={theme.colors.white} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {text1}
          </Text>
          {Boolean(text2) && (
            <Text style={styles.message} numberOfLines={2}>
              {text2}
            </Text>
          )}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          activeOpacity={0.65}
          onPress={hide}
          style={styles.closeButton}
        >
          <Ionicons
            name="close"
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const toastConfig = {
  success: toastProps => <SuccessToast {...toastProps} />,
};

const AppToast = () => <Toast config={toastConfig} />;

export default AppToast;

const styles = StyleSheet.create({
  row: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rowTablet: {
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  card: {
    width: '92%',
    maxWidth: 380,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#CDEADF',
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    shadowColor: '#102A21',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  cardTablet: {
    width: 380,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#159B72',
  },
  copy: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  message: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSecondary,
  },
});
