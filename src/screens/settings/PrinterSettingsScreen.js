import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { theme } from '../../constant';
import BluetoothPrinterPickerModal from '../../components/printer/BluetoothPrinterPickerModal';
import UsbPrinterPickerModal from '../../components/printer/UsbPrinterPickerModal';
import { useResponsive } from '../../contexts/ResponsiveContext';
import { usePrinter } from '../../contexts/PrinterContext';

import PrinterManager from '../../services/printer/PrinterManager';

import {
  BLUETOOTH_TYPES,
  CONNECTION_TYPES,
  DEFAULT_PRINTER_CONFIG,
  PAPER_WIDTHS,
  USB_TYPES,
} from '../../services/printer/printerTypes';

const usbTypeLabel = usbType =>
  usbType === USB_TYPES.PRINTER_CLASS
    ? 'USB Printer Class'
    : 'Vendor-specific USB printer';

const PrinterSettingsScreen = ({ navigation }) => {
  const { isTablet } = useResponsive();

  const {
    checkConnection,
    printTestPage,
    savePrinter,
    removePrinter: removeSavedPrinter,
  } = usePrinter();
  const { height } = useWindowDimensions();

  const successToastOffset = isTablet ? 20 : Math.max((height - 64) / 2, 20);

  const [config, setConfig] = useState({
    ...DEFAULT_PRINTER_CONFIG,
  });

  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState('not_tested');

  const [hasSavedPrinter, setHasSavedPrinter] = useState(false);

  const [showBluetoothPicker, setShowBluetoothPicker] = useState(false);

  const [showUsbPicker, setShowUsbPicker] = useState(false);

  useEffect(() => {
    loadPrinter();
  }, []);

  const loadPrinter = async () => {
    try {
      setLoading(true);

      const saved = await PrinterManager.getPrinter();

      if (saved) {
        setConfig(PrinterManager.normalizeConfig(saved));

        setHasSavedPrinter(true);
      }
    } catch (error) {
      console.log('Load printer:', error);

      Alert.alert(
        'Unable to load printer',
        error?.message || 'The saved printer configuration could not be read.',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key, value) => {
    setConfig(previous => ({
      ...previous,
      [key]: value,
    }));

    setConnectionStatus('not_tested');
  };

  const changeConnectionType = connectionType => {
    if (connectionType === config.connectionType) {
      return;
    }

    setConfig(previous => {
      const shared = {
        id: previous.id || DEFAULT_PRINTER_CONFIG.id,
        name: previous.name,
        connectionType,
        protocol: previous.protocol || DEFAULT_PRINTER_CONFIG.protocol,
        paperWidth: previous.paperWidth,
        charactersPerLine: previous.charactersPerLine,
        autoCut: previous.autoCut,
        enabled: previous.enabled,
      };

      if (connectionType === CONNECTION_TYPES.BLUETOOTH) {
        return {
          ...shared,
          bluetoothType: BLUETOOTH_TYPES.CLASSIC,
          deviceName: '',
          deviceAddress: '',
        };
      }

      if (connectionType === CONNECTION_TYPES.USB) {
        return {
          ...shared,
          usbType: '',
          vendorId: null,
          productId: null,
          serialNumber: '',
          manufacturerName: '',
          productName: '',
          interfaceClass: null,
          deviceName: '',
        };
      }

      return {
        ...shared,
        host: '',
        port: DEFAULT_PRINTER_CONFIG.port,
      };
    });

    setConnectionStatus('not_tested');
  };

  const handleBluetoothDeviceSelected = device => {
    setConfig(previous => ({
      ...previous,
      bluetoothType: BLUETOOTH_TYPES.CLASSIC,
      deviceName: device.deviceName,
      deviceAddress: device.deviceAddress,
    }));
    setConnectionStatus('not_tested');
    setShowBluetoothPicker(false);
  };

  const handleUsbDeviceSelected = selection => {
    setConfig(previous => ({
      ...previous,
      ...selection.identity,
    }));
    setConnectionStatus('not_tested');
    setShowUsbPicker(false);
  };

  const getCurrentConfig = () => PrinterManager.normalizeConfig(config);

  const handleTestConnection = async () => {
    try {
      setAction('connection');

      setConnectionStatus('testing');

      const current = getCurrentConfig();

      await checkConnection(current, {
        throwOnError: true,
        requestPermission: true,
      });

      setConnectionStatus('connected');

      Toast.show({
        type: 'success',
        text1: 'Printer connected',
        text2: 'The selected printer connection is ready.',
        position: 'top',
        topOffset: successToastOffset,
        props: { isTablet },
      });
    } catch (error) {
      console.log('Printer test:', error);

      setConnectionStatus('failed');

      Alert.alert(
        'Connection failed',
        error?.message || 'Unable to connect to printer.',
      );
    } finally {
      setAction(null);
    }
  };

  const handleTestPrint = async () => {
    try {
      setAction('print');

      const current = getCurrentConfig();

      await printTestPage(current);

      setConnectionStatus('connected');

      Toast.show({
        type: 'success',
        text1: 'Test sent',
        text2: 'The test receipt was sent to the printer.',
        position: 'top',
        topOffset: successToastOffset,
        props: { isTablet },
      });
    } catch (error) {
      console.log('Test print:', error);

      setConnectionStatus('failed');

      Alert.alert(
        'Test print failed',
        error?.message || 'Unable to print the test page.',
      );
    } finally {
      setAction(null);
    }
  };

  const handleSave = async () => {
    try {
      setAction('save');

      const current = getCurrentConfig();

      const saved = await savePrinter(current);
      setConfig(saved);

      setHasSavedPrinter(true);

      Toast.show({
        type: 'success',
        text1: 'Printer saved',
        text2: 'This printer will now be used for receipts.',
        position: 'top',
        topOffset: successToastOffset,
        props: { isTablet },
      });
    } catch (error) {
      Alert.alert(
        'Unable to save',
        error?.message || 'Printer configuration is invalid.',
      );
    } finally {
      setAction(null);
    }
  };

  const removePrinter = async () => {
    try {
      setAction('remove');

      await removeSavedPrinter();

      setConfig({
        ...DEFAULT_PRINTER_CONFIG,
      });

      setHasSavedPrinter(false);

      setConnectionStatus('not_tested');

      Toast.show({
        type: 'success',
        text1: 'Printer removed',
        text2: 'The saved printer has been removed.',
        position: 'top',
        topOffset: successToastOffset,
        props: { isTablet },
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to remove printer.');
    } finally {
      setAction(null);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove printer',
      'Are you sure you want to remove this printer?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: removePrinter,
        },
      ],
    );
  };

  const renderStatus = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Text style={styles.statusTesting}>Checking...</Text>;

      case 'connected':
        return <Text style={styles.statusConnected}>● Connected</Text>;

      case 'failed':
        return <Text style={styles.statusFailed}>● Offline</Text>;

      default:
        return <Text style={styles.statusUnknown}>Not tested</Text>;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

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

        <View>
          <Text style={styles.headerTitle}>Printer Settings</Text>

          <Text style={styles.headerSubtitle}>ESC/POS printer</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>CONNECTION TYPE</Text>

          <View style={styles.connectionTypeRow}>
            <TouchableOpacity
              disabled={Boolean(action)}
              onPress={() => changeConnectionType(CONNECTION_TYPES.NETWORK)}
              style={[
                styles.connectionTypeButton,
                config.connectionType === CONNECTION_TYPES.NETWORK &&
                  styles.connectionTypeButtonActive,
              ]}
            >
              <Ionicons
                name="wifi-outline"
                size={18}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.connectionTypeText}>Wi-Fi / LAN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={Boolean(action)}
              onPress={() => changeConnectionType(CONNECTION_TYPES.BLUETOOTH)}
              style={[
                styles.connectionTypeButton,
                config.connectionType === CONNECTION_TYPES.BLUETOOTH &&
                  styles.connectionTypeButtonActive,
              ]}
            >
              <Ionicons
                name="bluetooth-outline"
                size={18}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.connectionTypeText}>Bluetooth</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={Boolean(action)}
              onPress={() => changeConnectionType(CONNECTION_TYPES.USB)}
              style={[
                styles.connectionTypeButton,
                config.connectionType === CONNECTION_TYPES.USB &&
                  styles.connectionTypeButtonActive,
              ]}
            >
              <Ionicons
                name="hardware-chip-outline"
                size={18}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.connectionTypeText}>USB</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                {config.connectionType === CONNECTION_TYPES.BLUETOOTH
                  ? 'Bluetooth Printer'
                  : config.connectionType === CONNECTION_TYPES.USB
                    ? 'USB Printer'
                    : 'Network Printer'}
              </Text>

              <Text style={styles.cardSubtitle}>
                {config.connectionType === CONNECTION_TYPES.BLUETOOTH
                  ? 'Bluetooth Classic'
                  : config.connectionType === CONNECTION_TYPES.USB
                    ? 'Android USB Host / OTG'
                    : 'Wi-Fi or Ethernet'}
              </Text>
            </View>

            {renderStatus()}
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>PRINTER NAME</Text>

          <TextInput
            value={config.name}
            onChangeText={value => updateConfig('name', value)}
            placeholder="Kitchen Printer"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />

          {config.connectionType === CONNECTION_TYPES.NETWORK ? (
            <>
              <Text style={styles.label}>IP ADDRESS</Text>

              <TextInput
                value={config.host || ''}
                onChangeText={value => updateConfig('host', value)}
                placeholder="192.168.1.105"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <Text style={styles.label}>PORT</Text>

              <TextInput
                value={String(config.port ?? '')}
                onChangeText={value =>
                  updateConfig('port', value.replace(/\D/g, ''))
                }
                placeholder="9100"
                keyboardType="number-pad"
                style={styles.input}
              />
            </>
          ) : config.connectionType === CONNECTION_TYPES.BLUETOOTH ? (
            <>
              <Text style={styles.label}>SELECTED BLUETOOTH DEVICE</Text>

              {config.deviceAddress ? (
                <View style={styles.selectedDeviceCard}>
                  <View style={styles.selectedDeviceCopy}>
                    <Text style={styles.selectedDeviceName} numberOfLines={1}>
                      {config.deviceName || 'Bluetooth Printer'}
                    </Text>
                    <Text style={styles.selectedDeviceAddress}>
                      {config.deviceAddress}
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={Boolean(action)}
                    onPress={() => setShowBluetoothPicker(true)}
                    style={styles.changeDeviceButton}
                  >
                    <Text style={styles.changeDeviceText}>Change Printer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  disabled={Boolean(action)}
                  onPress={() => setShowBluetoothPicker(true)}
                  style={styles.chooseDeviceButton}
                >
                  <Ionicons
                    name="bluetooth-outline"
                    size={19}
                    color={theme.colors.textPrimary}
                  />
                  <Text style={styles.secondaryButtonText}>
                    Choose Bluetooth Printer
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.label}>SELECTED USB PRINTER</Text>

              {config.usbType ? (
                <View style={styles.selectedDeviceCard}>
                  <View style={styles.selectedDeviceCopy}>
                    <Text style={styles.selectedDeviceName} numberOfLines={1}>
                      {config.productName ||
                        config.manufacturerName ||
                        'USB Printer'}
                    </Text>
                    <Text style={styles.selectedDeviceAddress}>
                      Vendor {config.vendorId} · Product {config.productId}
                    </Text>
                    <Text style={styles.selectedDeviceAddress}>
                      {usbTypeLabel(config.usbType)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={Boolean(action)}
                    onPress={() => setShowUsbPicker(true)}
                    style={styles.changeDeviceButton}
                  >
                    <Text style={styles.changeDeviceText}>Change Printer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  disabled={Boolean(action)}
                  onPress={() => setShowUsbPicker(true)}
                  style={styles.chooseDeviceButton}
                >
                  <Ionicons
                    name="hardware-chip-outline"
                    size={19}
                    color={theme.colors.textPrimary}
                  />
                  <Text style={styles.secondaryButtonText}>
                    Choose USB Printer
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <Text style={styles.label}>PAPER WIDTH</Text>

          <View style={styles.paperRow}>
            <TouchableOpacity
              onPress={() => updateConfig('paperWidth', PAPER_WIDTHS.MM_58)}
              style={[
                styles.paperButton,

                Number(config.paperWidth) === 58 && styles.paperButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.paperButtonText,

                  Number(config.paperWidth) === 58 &&
                    styles.paperButtonTextActive,
                ]}
              >
                58mm
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateConfig('paperWidth', PAPER_WIDTHS.MM_80)}
              style={[
                styles.paperButton,

                Number(config.paperWidth) === 80 && styles.paperButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.paperButtonText,

                  Number(config.paperWidth) === 80 &&
                    styles.paperButtonTextActive,
                ]}
              >
                80mm
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>Auto cutter</Text>

              <Text style={styles.optionDescription}>
                Cut paper after printing
              </Text>
            </View>

            <Switch
              value={config.autoCut}
              onValueChange={value => updateConfig('autoCut', value)}
            />
          </View>

          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>Printer enabled</Text>

              <Text style={styles.optionDescription}>
                Allow receipts to be sent to this printer
              </Text>
            </View>

            <Switch
              value={config.enabled !== false}
              onValueChange={value => updateConfig('enabled', value)}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.textSecondary}
            />

            <Text style={styles.infoText}>
              {config.connectionType === CONNECTION_TYPES.BLUETOOTH
                ? 'The printer must remain paired in Android. Workfood saves only its name and Bluetooth address and reconnects for each print.'
                : config.connectionType === CONNECTION_TYPES.USB
                  ? 'Connect the powered printer through USB/OTG. Workfood finds the saved hardware and opens a fresh USB connection for every print.'
                  : 'The tablet and printer must be reachable on the same local network. Enter the IP shown on the printer network configuration page.'}
            </Text>
          </View>

          <TouchableOpacity
            disabled={Boolean(action)}
            onPress={handleTestConnection}
            style={styles.secondaryButton}
          >
            {action === 'connection' ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <Ionicons
                  name={
                    config.connectionType === CONNECTION_TYPES.BLUETOOTH
                      ? 'bluetooth-outline'
                      : config.connectionType === CONNECTION_TYPES.USB
                        ? 'hardware-chip-outline'
                        : 'wifi-outline'
                  }
                  size={18}
                  color={theme.colors.textPrimary}
                />

                <Text style={styles.secondaryButtonText}>Test Connection</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={Boolean(action)}
            onPress={handleTestPrint}
            style={styles.secondaryButton}
          >
            {action === 'print' ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <Ionicons
                  name="print-outline"
                  size={18}
                  color={theme.colors.textPrimary}
                />

                <Text style={styles.secondaryButtonText}>Print Test Page</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={Boolean(action)}
            onPress={handleSave}
            style={styles.saveButton}
          >
            {action === 'save' ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Printer</Text>
            )}
          </TouchableOpacity>

          {hasSavedPrinter && (
            <TouchableOpacity
              disabled={Boolean(action)}
              onPress={handleRemove}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove Printer</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <BluetoothPrinterPickerModal
        visible={showBluetoothPicker}
        onClose={() => setShowBluetoothPicker(false)}
        onSelect={handleBluetoothDeviceSelected}
      />

      <UsbPrinterPickerModal
        visible={showUsbPicker}
        onClose={() => setShowUsbPicker(false)}
        onSelect={handleUsbDeviceSelected}
      />
    </SafeAreaView>
  );
};

export default PrinterSettingsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    height: 72,
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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },

  card: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },

  cardSubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  divider: {
    height: 1,
    marginVertical: theme.spacing.lg,
    backgroundColor: theme.colors.border,
  },

  connectionTypeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  connectionTypeButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  connectionTypeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },

  connectionTypeText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },

  label: {
    marginBottom: 7,
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  input: {
    height: 52,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    color: theme.colors.textPrimary,
    fontSize: 14,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  selectedDeviceCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  selectedDeviceCopy: { flex: 1, paddingRight: theme.spacing.md },

  selectedDeviceName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  selectedDeviceAddress: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  changeDeviceButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },

  changeDeviceText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },

  chooseDeviceButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  paperRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },

  paperButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  paperButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },

  paperButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  paperButtonTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },

  optionRow: {
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },

  optionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  optionDescription: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 10,
  },

  infoBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  infoText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  secondaryButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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

  saveButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
  },

  saveButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '800',
  },

  removeButton: {
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },

  removeButtonText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: '800',
  },

  statusConnected: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '800',
  },

  statusFailed: {
    color: theme.colors.error,
    fontSize: 11,
    fontWeight: '800',
  },

  statusTesting: {
    color: theme.colors.info,
    fontSize: 11,
    fontWeight: '800',
  },

  statusUnknown: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
