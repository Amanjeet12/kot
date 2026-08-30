import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../constant';
import UsbDeviceService from '../../services/printer/usb/UsbDeviceService';
import { USB_TYPES } from '../../services/printer/printerTypes';

const usbTypeLabel = usbType => {
  switch (usbType) {
    case USB_TYPES.PRINTER_CLASS:
      return 'USB Printer Class';
    case USB_TYPES.VENDOR_SPECIFIC:
      return 'Vendor-specific USB printer';
    case USB_TYPES.SERIAL:
      return 'USB Serial — driver required';
    default:
      return 'Not a supported USB printer';
  }
};

const DeviceRow = ({ busy, device, onSelect }) => (
  <View style={styles.deviceRow}>
    <View style={styles.deviceCopy}>
      <Text style={styles.deviceName} numberOfLines={1}>
        {device.productName || device.manufacturerName || 'USB Device'}
      </Text>
      <Text style={styles.deviceIdentity}>
        Vendor {device.vendorId} · Product {device.productId}
      </Text>
      <Text style={[styles.deviceType, !device.supported && styles.unsupportedText]}>
        {usbTypeLabel(device.usbType)}
      </Text>
    </View>
    <TouchableOpacity
      disabled={busy || !device.supported}
      onPress={() => onSelect(device)}
      style={[
        styles.selectButton,
        (busy || !device.supported) && styles.buttonDisabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text style={styles.selectButtonText}>
          {device.supported ? 'Select' : 'Unsupported'}
        </Text>
      )}
    </TouchableOpacity>
  </View>
);

const UsbPrinterPickerModal = ({ visible, onClose, onSelect }) => {
  const [devices, setDevices] = useState([]);
  const [action, setAction] = useState(null);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      setAction('refresh');
      setError(null);
      setDevices(await UsbDeviceService.getPrinterCandidates());
    } catch (refreshError) {
      setError(refreshError);
    } finally {
      setAction(null);
    }
  };

  useEffect(() => {
    if (visible) {
      refresh();
    }
  }, [visible]);

  const handleSelect = async device => {
    try {
      setAction(device.deviceName);
      setError(null);

      const selection = await UsbDeviceService.authorizeSelection(device);

      onSelect(selection);
    } catch (selectionError) {
      setError(selectionError);
    } finally {
      setAction(null);
    }
  };

  const supportedDevices = devices.filter(device => device.supported);
  const unsupportedDevices = devices.filter(device => !device.supported);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>USB Printer</Text>
            <Text style={styles.headerSubtitle}>
              Connect through USB/OTG and make sure the printer is powered on.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {error && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={theme.colors.error}
              />
              <Text style={styles.errorText}>
                {error.message || 'USB printer setup failed.'}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>CONNECTED PRINTERS</Text>
                <Text style={styles.sectionSubtitle}>
                  Printer Class and proven vendor BULK printers are supported.
                </Text>
              </View>
              {action === 'refresh' && <ActivityIndicator size="small" />}
            </View>

            {!supportedDevices.length && action !== 'refresh' && (
              <Text style={styles.emptyText}>
                No USB printers detected. Connect the printer using USB/OTG and
                make sure it is powered on.
              </Text>
            )}

            {supportedDevices.map(device => (
              <DeviceRow
                busy={action === device.deviceName}
                device={device}
                key={device.deviceName}
                onSelect={handleSelect}
              />
            ))}

            <TouchableOpacity
              disabled={Boolean(action)}
              onPress={refresh}
              style={[styles.refreshButton, action && styles.buttonDisabled]}
            >
              <Ionicons name="refresh" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.refreshButtonText}>Refresh USB Devices</Text>
            </TouchableOpacity>
          </View>

          {unsupportedDevices.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>UNSUPPORTED USB DEVICES</Text>
              <Text style={styles.sectionSubtitle}>
                These devices cannot be selected for printing.
              </Text>
              {unsupportedDevices.map(device => (
                <DeviceRow
                  busy={false}
                  device={device}
                  key={device.deviceName}
                  onSelect={handleSelect}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default UsbPrinterPickerModal;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  headerCopy: { flex: 1, paddingRight: theme.spacing.md },
  headerTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800' },
  headerSubtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 11 },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  errorBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: '#FCE8E6',
  },
  errorText: { flex: 1, color: theme.colors.error, fontSize: 12, lineHeight: 18 },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '900' },
  sectionSubtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 11 },
  emptyText: { marginTop: theme.spacing.lg, color: theme.colors.textSecondary, fontSize: 12 },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  deviceCopy: { flex: 1, paddingRight: theme.spacing.md },
  deviceName: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  deviceIdentity: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 11 },
  deviceType: { marginTop: 4, color: theme.colors.success, fontSize: 10, fontWeight: '700' },
  unsupportedText: { color: theme.colors.error },
  selectButton: {
    minWidth: 90,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
  },
  selectButtonText: { color: theme.colors.textOnPrimary, fontSize: 11, fontWeight: '800' },
  refreshButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
  },
  refreshButtonText: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '800' },
  buttonDisabled: { opacity: 0.45 },
});
