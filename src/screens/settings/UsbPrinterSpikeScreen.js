import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../constant';
import UsbPrinterSpike, {
  classifyUsbDevice,
  findWritableUsbPath,
  getUsbDeviceIdentity,
} from '../../services/printer/usb/UsbPrinterSpike';

const valueText = value =>
  value === null || value === undefined || value === '' ? 'Unavailable' : String(value);

const Detail = ({ label, value }) => (
  <Text style={styles.detail}>
    <Text style={styles.detailLabel}>{label}: </Text>
    {valueText(value)}
  </Text>
);

const EndpointDetails = ({ endpoint }) => (
  <View style={styles.endpointCard}>
    <Text style={styles.endpointTitle}>Endpoint {endpoint.index}</Text>
    <Detail label="Direction" value={endpoint.direction} />
    <Detail label="Type" value={endpoint.type} />
    <Detail label="Address" value={endpoint.address} />
    <Detail label="Endpoint number" value={endpoint.endpointNumber} />
    <Detail label="Max packet size" value={endpoint.maxPacketSize} />
  </View>
);

const InterfaceDetails = ({ usbInterface }) => (
  <View style={styles.interfaceCard}>
    <Text style={styles.interfaceTitle}>Interface {usbInterface.index}</Text>
    <Detail label="ID" value={usbInterface.id} />
    <Detail label="Class" value={usbInterface.class} />
    <Detail label="Subclass" value={usbInterface.subclass} />
    <Detail label="Protocol" value={usbInterface.protocol} />
    <Detail label="Alternate setting" value={usbInterface.alternateSetting} />
    {(usbInterface.endpoints || []).map(endpoint => (
      <EndpointDetails
        endpoint={endpoint}
        key={`${usbInterface.index}-${endpoint.index}`}
      />
    ))}
  </View>
);

const DeviceDetails = ({ device, selected, onSelect }) => (
  <View style={[styles.deviceCard, selected && styles.deviceCardSelected]}>
    <Text style={styles.deviceTitle}>
      {device.productName || device.deviceName || 'USB Device'}
    </Text>
    <Detail label="Device name" value={device.deviceName} />
    <Detail label="Vendor ID" value={device.vendorId} />
    <Detail label="Product ID" value={device.productId} />
    <Detail label="Device class" value={device.deviceClass} />
    <Detail label="Manufacturer" value={device.manufacturerName} />
    <Detail label="Product" value={device.productName} />
    <Detail label="Classification" value={classifyUsbDevice(device)} />
    <Detail label="Permission" value={device.hasPermission ? 'Granted' : 'Not granted'} />
    {(device.interfaces || []).map(usbInterface => (
      <InterfaceDetails
        key={`${device.deviceName}-${usbInterface.index}`}
        usbInterface={usbInterface}
      />
    ))}
    <TouchableOpacity style={styles.selectButton} onPress={() => onSelect(device)}>
      <Text style={styles.selectButtonText}>{selected ? 'Selected' : 'Select'}</Text>
    </TouchableOpacity>
  </View>
);

const UsbPrinterSpikeScreen = ({ navigation }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [hostSupported, setHostSupported] = useState(null);
  const [busy, setBusy] = useState('refresh');
  const [result, setResult] = useState(null);

  const refresh = useCallback(async () => {
    setBusy('refresh');
    setResult(null);

    try {
      const [supported, connectedDevices] = await Promise.all([
        UsbPrinterSpike.isUsbHostSupported(),
        UsbPrinterSpike.listDevices(),
      ]);

      setHostSupported(supported);
      setDevices(connectedDevices);
      setSelectedDevice(previous =>
        previous
          ? connectedDevices.find(
              device =>
                getUsbDeviceIdentity(device) === getUsbDeviceIdentity(previous),
            ) || null
          : null,
      );
    } catch (error) {
      setResult({ error: true, message: error?.message || String(error) });
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const writablePath = useMemo(
    () => (selectedDevice ? findWritableUsbPath(selectedDevice) : null),
    [selectedDevice],
  );

  const run = async (action, operation) => {
    setBusy(action);
    setResult(null);

    try {
      const operationResult = await operation(selectedDevice);
      await refresh();
      setResult({
        ...operationResult,
        error: false,
        message: operationResult?.message || 'USB operation successful.',
      });
    } catch (error) {
      setResult({
        error: true,
        code: error?.code,
        message: error?.message || String(error),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>USB Printer Proof</Text>
          <Text style={styles.subtitle}>Development-only Android USB host diagnostics</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <Detail label="Platform" value={Platform.OS} />
          <Detail
            label="Android USB Host"
            value={hostSupported === null ? 'Checking' : hostSupported ? 'Supported' : 'Not supported'}
          />
          <Text style={styles.noticeText}>
            Permission is requested only when you test the explicitly selected device.
          </Text>
        </View>

        <TouchableOpacity
          disabled={Boolean(busy)}
          onPress={refresh}
          style={styles.primaryButton}
        >
          {busy === 'refresh' ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Refresh USB Devices</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Connected USB Devices ({devices.length})</Text>
        {!devices.length && busy !== 'refresh' && (
          <Text style={styles.emptyText}>No connected USB devices detected.</Text>
        )}
        {devices.map(device => (
          <DeviceDetails
            device={device}
            key={getUsbDeviceIdentity(device)}
            onSelect={selected => {
              setSelectedDevice(selected);
              setResult(null);
            }}
            selected={getUsbDeviceIdentity(device) === getUsbDeviceIdentity(selectedDevice)}
          />
        ))}

        {selectedDevice && (
          <View style={styles.selectedCard}>
            <Text style={styles.sectionTitle}>Selected Device</Text>
            <Detail
              label="Name"
              value={selectedDevice.productName || selectedDevice.deviceName}
            />
            <Detail label="Vendor ID" value={selectedDevice.vendorId} />
            <Detail label="Product ID" value={selectedDevice.productId} />
            <Detail label="Classification" value={classifyUsbDevice(selectedDevice)} />
            <Detail
              label="Writable path"
              value={
                writablePath
                  ? `Interface ${writablePath.interface.index}, ${writablePath.endpoint.type} OUT, address ${writablePath.endpoint.address}, packet ${writablePath.endpoint.maxPacketSize}`
                  : 'Not available without a device-specific driver'
              }
            />

            <TouchableOpacity
              disabled={Boolean(busy)}
              onPress={() => run('connection', device => UsbPrinterSpike.testConnection(device))}
              style={styles.secondaryButton}
            >
              {busy === 'connection' ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.secondaryButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={Boolean(busy)}
              onPress={() => run('print', device => UsbPrinterSpike.printTest(device))}
              style={styles.secondaryButton}
            >
              {busy === 'print' ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.secondaryButtonText}>Print WORKFOOD USB Test</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {result && (
          <View style={[styles.result, result.error ? styles.resultError : styles.resultSuccess]}>
            <Text style={styles.resultTitle}>{result.error ? 'FAILED' : 'SUCCESS'}</Text>
            <Text style={styles.resultText}>{result.message}</Text>
            {result.code && <Detail label="Code" value={result.code} />}
            {result.interfaceIndex !== undefined && (
              <Detail label="Interface" value={result.interfaceIndex} />
            )}
            {result.endpointAddress !== undefined && (
              <Detail label="OUT endpoint" value={result.endpointAddress} />
            )}
            {result.endpointType && <Detail label="Endpoint type" value={result.endpointType} />}
            {result.bytesWritten > 0 && <Detail label="Bytes written" value={result.bytesWritten} />}
            {result.transferCount > 0 && (
              <Detail label="Transport chunks" value={result.transferCount} />
            )}
            {result.cleanedUp && <Detail label="Cleanup" value="Released and closed" />}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default UsbPrinterSpikeScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    minWidth: 64,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
  },
  backButtonText: { color: theme.colors.textPrimary, fontWeight: '700' },
  title: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800' },
  subtitle: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 11 },
  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  notice: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  noticeText: { marginTop: 8, color: theme.colors.textSecondary, fontSize: 11 },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: { color: theme.colors.textOnPrimary, fontWeight: '800' },
  sectionTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: { color: theme.colors.textSecondary, fontSize: 13 },
  deviceCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  deviceCardSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
  deviceTitle: { marginBottom: 8, color: theme.colors.textPrimary, fontSize: 15, fontWeight: '800' },
  detail: { marginTop: 3, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  detailLabel: { color: theme.colors.textPrimary, fontWeight: '700' },
  interfaceCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  interfaceTitle: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '800' },
  endpointCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  endpointTitle: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '800' },
  selectButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
  },
  selectButtonText: { color: theme.colors.textOnPrimary, fontWeight: '800' },
  selectedCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.radius.xl,
  },
  secondaryButtonText: { color: theme.colors.textPrimary, fontWeight: '800' },
  result: { marginTop: theme.spacing.lg, padding: theme.spacing.md, borderRadius: theme.radius.xl },
  resultError: { backgroundColor: '#FCE8E6' },
  resultSuccess: { backgroundColor: '#E6F5EC' },
  resultTitle: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '900' },
  resultText: { marginTop: 5, color: theme.colors.textPrimary, fontSize: 12 },
});
