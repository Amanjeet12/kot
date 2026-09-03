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
import Toast from 'react-native-toast-message';

import { theme } from '../../constant';

import { PRINTER_STATUS, usePrinter } from '../../contexts/PrinterContext';

const USB_RETRY_MESSAGES = {
  MULTIPLE_USB_PRINTERS_MATCH:
    'Multiple matching USB printers were found. Select the printer again in Printer Settings.',
  USB_CLAIM_FAILED: 'Unable to connect to the USB printer.',
  USB_DEVICE_NOT_FOUND: 'USB printer is not connected.',
  USB_OPEN_FAILED: 'Unable to connect to the USB printer.',
  USB_PERMISSION_DENIED:
    'USB permission is required to connect the printer.',
  USB_PERMISSION_REQUIRED: 'USB printer permission is required.',
  USB_PERMISSION_TIMEOUT: 'USB permission request timed out. Try again.',
};

export const getPrinterRetryErrorMessage = retryError => {
  return (
    USB_RETRY_MESSAGES[retryError?.code] ||
    retryError?.userMessage ||
    'Unable to connect to the printer. Check the connection and try again.'
  );
};

const PrinterStatusButton = () => {
  const navigation = useNavigation();

  const { status, retryConnection, isChecking } = usePrinter();

  const handlePress = async () => {
    /*
     * No saved printer:
     * open configuration.
     */
    if (status === PRINTER_STATUS.NOT_CONFIGURED) {
      const sectionNavigator = navigation.getParent?.();
      const sectionState = sectionNavigator?.getState?.();
      const returnRoute = sectionState?.routes?.[sectionState.index]?.name;
      const settingsOptions = { screen: 'PrinterSettingsScreen' };

      if (returnRoute && returnRoute !== 'Profile') {
        settingsOptions.params = { returnRoute };
      }

      navigation.navigate('Profile', settingsOptions);

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
    try {
      const connected = await retryConnection({ throwOnError: true });

      if (!connected) {
        Toast.show({
          type: 'error',
          text1: 'Printer connection failed',
          text2: getPrinterRetryErrorMessage(),
          position: 'top',
        });
      }
    } catch (retryError) {
      Toast.show({
        type: 'error',
        text1: 'Printer connection failed',
        text2: getPrinterRetryErrorMessage(retryError),
        position: 'top',
      });
    }
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
