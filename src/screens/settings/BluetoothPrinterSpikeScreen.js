import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { theme } from '../../constant';
import BluetoothPrinterSpike from '../../services/printer/bluetooth/BluetoothPrinterSpike';

const DeviceRow = ({ device, selected, disabled, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.75}
    disabled={disabled}
    onPress={onPress}
    style={[styles.deviceRow, selected && styles.deviceRowSelected]}
  >
    <View style={styles.deviceCopy}>
      <Text style={styles.deviceName}>
        {device.name || 'Unnamed Bluetooth device'}
      </Text>
      <Text style={styles.deviceAddress}>{device.address || device.id}</Text>
      <Text style={styles.deviceMeta}>
        {device.bonded ? 'Paired' : 'Not paired'} / {device.type || 'Unknown'}
      </Text>
    </View>

    <Ionicons
      name={selected ? 'checkmark-circle' : 'chevron-forward'}
      size={22}
      color={selected ? theme.colors.success : theme.colors.textSecondary}
    />
  </TouchableOpacity>
);

const BluetoothPrinterSpikeScreen = ({ navigation }) => {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [action, setAction] = useState('loading');
  const [status, setStatus] = useState('Preparing Bluetooth...');

  const showError = useCallback((title, error) => {
    console.log(`[BluetoothSpike] ${title}:`, error);
    setStatus(error?.message || title);
    Alert.alert(title, error?.message || 'Bluetooth operation failed.');
  }, []);

  const loadPairedDevices = useCallback(async () => {
    setAction('loading');
    setStatus('Checking permissions and paired devices...');

    try {
      const devices = await BluetoothPrinterSpike.getPairedDevices();

      setPairedDevices(devices);
      setStatus(
        devices.length
          ? `Found ${devices.length} paired Classic Bluetooth device${
              devices.length === 1 ? '' : 's'
            }.`
          : 'No paired Classic Bluetooth devices found.',
      );
    } catch (error) {
      showError('Unable to load paired devices', error);
    } finally {
      setAction(null);
    }
  }, [showError]);

  useEffect(() => {
    loadPairedDevices();
  }, [loadPairedDevices]);

  const handleScan = async () => {
    setAction('scan');
    setStatus('Scanning for nearby Classic Bluetooth devices...');

    try {
      const devices = await BluetoothPrinterSpike.scanDevices();

      setNearbyDevices(devices);
      setStatus(
        devices.length
          ? `Found ${devices.length} nearby device${
              devices.length === 1 ? '' : 's'
            }.`
          : 'No nearby Classic Bluetooth devices found.',
      );
    } catch (error) {
      showError('Bluetooth scan failed', error);
    } finally {
      setAction(null);
    }
  };

  const handleSelect = async device => {
    if (device.bonded) {
      setSelectedDevice(device);
      setStatus(`${device.name || device.address} selected.`);

      return;
    }

    setAction('pair');
    setStatus(`Pairing with ${device.name || device.address}...`);

    try {
      const paired = await BluetoothPrinterSpike.pairDevice(device);

      setSelectedDevice(paired);
      await loadPairedDevices();
      setStatus(`${paired.name || paired.address} paired and selected.`);
    } catch (error) {
      showError('Bluetooth pairing failed', error);
    } finally {
      setAction(null);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedDevice) {
      Alert.alert('Select printer', 'Select a paired Bluetooth printer first.');

      return;
    }

    setAction('connection');
    setStatus('Opening a fresh RFCOMM connection...');

    try {
      await BluetoothPrinterSpike.test(selectedDevice);
      setStatus('Connection successful. The socket was closed.');
      Alert.alert(
        'Connection successful',
        'A real Bluetooth socket was opened and then disconnected.',
      );
    } catch (error) {
      showError('Connection failed', error);
    } finally {
      setAction(null);
    }
  };

  const handleRawPrint = async () => {
    if (!selectedDevice) {
      Alert.alert('Select printer', 'Select a paired Bluetooth printer first.');

      return;
    }

    setAction('print');
    setStatus('Sending one raw ESC/POS test receipt...');

    try {
      await BluetoothPrinterSpike.printRawTest(selectedDevice);
      setStatus('Test receipt sent once. The socket was closed.');
      Alert.alert(
        'Test sent',
        'Confirm that the printer produced "WORKFOOD BLUETOOTH TEST".',
      );
    } catch (error) {
      showError('Raw Bluetooth test failed', error);
    } finally {
      setAction(null);
    }
  };

  const busy = Boolean(action);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Bluetooth Printer Proof</Text>
          <Text style={styles.headerSubtitle}>
            Development milestone / no printer is saved
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningBox}>
          <Ionicons
            name="flask-outline"
            size={21}
            color={theme.colors.warning}
          />
          <Text style={styles.warningText}>
            This isolated test does not change the Wi-Fi/LAN printer, saved
            configuration, PrinterManager, or global printer status.
          </Text>
        </View>

        <View style={styles.statusBox}>
          {busy && <ActivityIndicator size="small" />}
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Paired devices</Text>
              <Text style={styles.sectionSubtitle}>
                Select the thermal printer if it is listed.
              </Text>
            </View>

            <TouchableOpacity disabled={busy} onPress={loadPairedDevices}>
              <Ionicons
                name="refresh"
                size={21}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {pairedDevices.length ? (
            pairedDevices.map(device => (
              <DeviceRow
                key={device.address || device.id}
                device={device}
                selected={
                  selectedDevice?.address === device.address ||
                  selectedDevice?.id === device.id
                }
                disabled={busy}
                onPress={() => handleSelect(device)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No paired devices.</Text>
          )}

          <TouchableOpacity
            disabled={busy}
            onPress={handleScan}
            style={styles.secondaryButton}
          >
            {action === 'scan' ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <Ionicons
                  name="search"
                  size={18}
                  color={theme.colors.textPrimary}
                />
                <Text style={styles.secondaryButtonText}>
                  Scan Nearby Devices
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {nearbyDevices.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Nearby devices</Text>
            <Text style={styles.sectionSubtitle}>
              Selecting an unpaired device opens Android pairing.
            </Text>

            {nearbyDevices.map(device => (
              <DeviceRow
                key={device.address || device.id}
                device={device}
                selected={
                  selectedDevice?.address === device.address ||
                  selectedDevice?.id === device.id
                }
                disabled={busy}
                onPress={() => handleSelect(device)}
              />
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Low-level proof</Text>
          <Text style={styles.sectionSubtitle}>
            Every action opens a fresh socket and disconnects afterward.
          </Text>

          <TouchableOpacity
            disabled={busy || !selectedDevice}
            onPress={handleTestConnection}
            style={[
              styles.secondaryButton,
              (busy || !selectedDevice) && styles.buttonDisabled,
            ]}
          >
            {action === 'connection' ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.secondaryButtonText}>Test Connection</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={busy || !selectedDevice}
            onPress={handleRawPrint}
            style={[
              styles.primaryButton,
              (busy || !selectedDevice) && styles.buttonDisabled,
            ]}
          >
            {action === 'print' ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Print WORKFOOD Bluetooth Test
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BluetoothPrinterSpikeScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },
  headerCopy: { flex: 1 },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: '#FFF7E6',
  },
  warningText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  statusBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  statusText: { flex: 1, color: theme.colors.textPrimary, fontSize: 12 },
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
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 3,
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  deviceRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  deviceRowSelected: {
    borderColor: theme.colors.success,
    backgroundColor: '#EAF8F2',
  },
  deviceCopy: { flex: 1 },
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
  deviceMeta: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  secondaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
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
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonDisabled: { opacity: 0.45 },
});

