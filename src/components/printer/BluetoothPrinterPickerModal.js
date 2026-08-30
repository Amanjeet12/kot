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
import BluetoothDeviceService, {
  getBluetoothDeviceAddress,
} from '../../services/printer/bluetooth/BluetoothDeviceService';

const DeviceRow = ({ device, disabled, onSelect }) => {
  const address = getBluetoothDeviceAddress(device);

  return (
    <View style={styles.deviceRow}>
      <View style={styles.deviceCopy}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {device?.name || 'Bluetooth Printer'}
        </Text>
        <Text style={styles.deviceAddress}>{address || 'Unknown address'}</Text>
      </View>
      <TouchableOpacity
        disabled={disabled || !address}
        onPress={() => onSelect(device)}
        style={[styles.selectButton, disabled && styles.buttonDisabled]}
      >
        <Text style={styles.selectButtonText}>Select</Text>
      </TouchableOpacity>
    </View>
  );
};

const BluetoothPrinterPickerModal = ({ visible, onClose, onSelect }) => {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [action, setAction] = useState(null);
  const [error, setError] = useState(null);

  const loadPairedDevices = async () => {
    try {
      setAction('paired');
      setError(null);

      setPairedDevices(await BluetoothDeviceService.getPairedDevices());
    } catch (loadError) {
      setError(loadError);
    } finally {
      setAction(null);
    }
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    setNearbyDevices([]);
    loadPairedDevices();
  }, [visible]);

  const handleScan = async () => {
    try {
      setAction('scan');
      setError(null);

      setNearbyDevices(await BluetoothDeviceService.scanDevices());
    } catch (scanError) {
      setError(scanError);
    } finally {
      setAction(null);
    }
  };

  const finishSelection = device => {
    const deviceAddress = getBluetoothDeviceAddress(device);

    if (!deviceAddress) {
      setError(new Error('Bluetooth device address is missing.'));

      return;
    }

    onSelect({
      deviceAddress,
      deviceName: device?.name || 'Bluetooth Printer',
    });
  };

  const handleNearbySelection = async device => {
    try {
      setAction(getBluetoothDeviceAddress(device));
      setError(null);

      const pairedDevice = await BluetoothDeviceService.pairDevice(device);

      finishSelection(
        pairedDevice && typeof pairedDevice === 'object'
          ? pairedDevice
          : device,
      );
    } catch (pairError) {
      setError(pairError);
    } finally {
      setAction(null);
    }
  };

  const busy = Boolean(action);

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
            <Text style={styles.headerTitle}>Bluetooth Printer</Text>
            <Text style={styles.headerSubtitle}>
              Select by address so identical printer names remain distinct.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons
              name="close"
              size={22}
              color={theme.colors.textPrimary}
            />
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
                {error?.message || 'Bluetooth setup failed.'}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>PAIRED DEVICES</Text>
                <Text style={styles.sectionSubtitle}>
                  Previously paired Classic devices are listed first.
                </Text>
              </View>
              {action === 'paired' && <ActivityIndicator size="small" />}
            </View>

            {!pairedDevices.length && action !== 'paired' && (
              <Text style={styles.emptyText}>No paired printers found.</Text>
            )}

            {pairedDevices.map(device => (
              <DeviceRow
                key={getBluetoothDeviceAddress(device)}
                device={device}
                disabled={busy}
                onSelect={finishSelection}
              />
            ))}

            <TouchableOpacity
              disabled={busy}
              onPress={loadPairedDevices}
              style={[styles.secondaryButton, busy && styles.buttonDisabled]}
            >
              <Ionicons
                name="refresh"
                size={18}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.secondaryButtonText}>Refresh Paired</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>NEARBY DEVICES</Text>
            <Text style={styles.sectionSubtitle}>
              Scan only when the printer is not already paired. Android handles
              any required pairing code.
            </Text>

            <TouchableOpacity
              disabled={busy}
              onPress={handleScan}
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
            >
              {action === 'scan' ? (
                <ActivityIndicator size="small" />
              ) : (
                <>
                  <Ionicons
                    name="search"
                    size={18}
                    color={theme.colors.textOnPrimary}
                  />
                  <Text style={styles.primaryButtonText}>
                    Scan Nearby Devices
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {nearbyDevices.map(device => (
              <DeviceRow
                key={getBluetoothDeviceAddress(device)}
                device={device}
                disabled={busy}
                onSelect={handleNearbySelection}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default BluetoothPrinterPickerModal;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  headerCopy: { flex: 1, paddingRight: theme.spacing.md },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
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
  content: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    marginTop: 4,
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  deviceRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  deviceCopy: { flex: 1, paddingRight: theme.spacing.md },
  deviceName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  deviceAddress: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  selectButton: {
    minWidth: 76,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },
  selectButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyText: {
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  errorBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: '#FDEAEA',
  },
  errorText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 11,
    lineHeight: 17,
  },
  secondaryButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  buttonDisabled: { opacity: 0.45 },
});
