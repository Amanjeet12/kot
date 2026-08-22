import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../constant';

import { PRINTER_STATUS, usePrinter } from '../../contexts/PrinterContext';

const PrinterStatusButton = () => {
  const navigation = useNavigation();

  const { status, retryConnection, isChecking } = usePrinter();

  const handlePress = async () => {
    /*
     * No saved printer:
     * open configuration.
     */
    if (status === PRINTER_STATUS.NOT_CONFIGURED) {
      navigation.navigate('Profile', {
        screen: 'PrinterSettingsScreen',
      });

      return;
    }

    /*
     * Don't trigger duplicate requests.
     */
    if (isChecking) {
      return;
    }

    /*
     * Manual fresh health check.
     */
    await retryConnection();
  };

  let text = 'Printer';

  let statusColor = theme.colors.textSecondary;

  let icon = 'print-outline';

  switch (status) {
    case PRINTER_STATUS.CONNECTED:
      text = 'Printer Connected';

      statusColor = '#159B72';

      icon = 'print-outline';

      break;

    case PRINTER_STATUS.DISCONNECTED:
      text = 'Printer Disconnected';

      statusColor = theme.colors.error;

      icon = 'alert-circle-outline';

      break;

    case PRINTER_STATUS.CHECKING:
      text = 'Checking Printer';

      statusColor = theme.colors.info;

      break;

    case PRINTER_STATUS.NOT_CONFIGURED:
    default:
      text = 'Setup Printer';

      statusColor = theme.colors.textSecondary;

      break;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={isChecking}
      style={styles.container}
    >
      {isChecking ? (
        <ActivityIndicator size="small" color={statusColor} />
      ) : (
        <Ionicons name={icon} size={17} color={statusColor} />
      )}

      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: statusColor,
          },
        ]}
      >
        {text}
      </Text>

      {!isChecking && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: statusColor,
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

export default PrinterStatusButton;

const styles = StyleSheet.create({
  container: {
    minHeight: 38,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 7,

    paddingHorizontal: 12,

    borderWidth: 1,

    borderColor: theme.colors.border,

    borderRadius: theme.radius.round,

    backgroundColor: theme.colors.surface,
  },

  text: {
    fontSize: 11,

    fontWeight: '800',
  },

  dot: {
    width: 7,

    height: 7,

    borderRadius: 4,
  },
});
