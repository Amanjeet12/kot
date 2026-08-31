import {Buffer} from 'buffer';

jest.mock('../src/services/printer/transports/NetworkTransport', () => ({
  __esModule: true,
  default: {send: jest.fn(), test: jest.fn()},
}));

jest.mock('../src/services/printer/transports/BluetoothTransport', () => ({
  __esModule: true,
  default: {send: jest.fn(), test: jest.fn()},
}));

jest.mock('../src/services/printer/transports/UsbTransport', () => ({
  __esModule: true,
  default: {send: jest.fn(), test: jest.fn()},
}));

jest.mock('../src/services/printer/printerStorage', () => ({
  getPrinterConfig: jest.fn(),
  removePrinterConfig: jest.fn(),
  savePrinterConfig: jest.fn(),
}));

jest.mock('../src/services/printer/receipt/receiptBuilder', () => ({
  buildReceipt: jest.fn(() => require('buffer').Buffer.from('order receipt')),
  buildTestReceipt: jest.fn(() =>
    require('buffer').Buffer.from('test receipt'),
  ),
}));

import PrinterManager from '../src/services/printer/PrinterManager';
import NetworkTransport from '../src/services/printer/transports/NetworkTransport';
import BluetoothTransport from '../src/services/printer/transports/BluetoothTransport';
import UsbTransport from '../src/services/printer/transports/UsbTransport';
import {
  buildReceipt,
  buildTestReceipt,
} from '../src/services/printer/receipt/receiptBuilder';
import {
  getPrinterConfig,
  savePrinterConfig,
} from '../src/services/printer/printerStorage';
import {
  BLUETOOTH_TYPES,
  CONNECTION_TYPES,
  DEFAULT_PRINTER_CONFIG,
  USB_TYPES,
} from '../src/services/printer/printerTypes';

const networkConfig = {
  connectionType: CONNECTION_TYPES.NETWORK,
  protocol: 'escpos',
  host: '192.168.1.12',
  port: 9100,
  paperWidth: 80,
};

const bluetoothConfig = {
  connectionType: CONNECTION_TYPES.BLUETOOTH,
  protocol: 'escpos',
  bluetoothType: BLUETOOTH_TYPES.CLASSIC,
  deviceName: 'POS-80',
  deviceAddress: '00:11:22:33:44:55',
  paperWidth: 80,
};

const usbConfig = {
  connectionType: CONNECTION_TYPES.USB,
  protocol: 'escpos',
  usbType: USB_TYPES.PRINTER_CLASS,
  vendorId: 1234,
  productId: 5678,
  serialNumber: 'WF-001',
  manufacturerName: 'Workfood Hardware',
  productName: 'POS-80',
  interfaceClass: 7,
  deviceName: '/dev/bus/usb/001/002',
  paperWidth: 80,
};

describe('PrinterManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NetworkTransport.send.mockResolvedValue({success: true});
    NetworkTransport.test.mockResolvedValue({success: true});
    BluetoothTransport.send.mockResolvedValue({success: true});
    BluetoothTransport.test.mockResolvedValue({success: true});
    UsbTransport.send.mockResolvedValue({success: true});
    UsbTransport.test.mockResolvedValue({success: true});
    savePrinterConfig.mockResolvedValue(true);
  });

  it('exposes Bluetooth as a supported connection type', () => {
    expect(CONNECTION_TYPES.BLUETOOTH).toBe('bluetooth');
  });

  it('adds USB while keeping Network as the default connection type', () => {
    expect(CONNECTION_TYPES.USB).toBe('usb');
    expect(DEFAULT_PRINTER_CONFIG.connectionType).toBe(CONNECTION_TYPES.NETWORK);
  });

  it('keeps valid network configuration and validation working', () => {
    expect(PrinterManager.validateConfig(networkConfig)).toBe(true);
    expect(PrinterManager.normalizeConfig(networkConfig)).toMatchObject({
      host: networkConfig.host,
      port: networkConfig.port,
    });
  });

  it('validates Bluetooth with an address and without host or port', () => {
    expect(PrinterManager.validateConfig(bluetoothConfig)).toBe(true);
    expect(bluetoothConfig).not.toHaveProperty('host');
    expect(bluetoothConfig).not.toHaveProperty('port');
  });

  it('detects configured printers by connection type', async () => {
    getPrinterConfig
      .mockResolvedValueOnce(bluetoothConfig)
      .mockResolvedValueOnce({...bluetoothConfig, deviceAddress: ''});

    await expect(PrinterManager.isConfigured()).resolves.toBe(true);
    await expect(PrinterManager.isConfigured()).resolves.toBe(false);
  });

  it('rejects Bluetooth configuration without a device address', () => {
    expect(() =>
      PrinterManager.validateConfig({...bluetoothConfig, deviceAddress: ''}),
    ).toThrow('Select a Bluetooth printer');
  });

  it('validates USB without network or Bluetooth fields', () => {
    expect(PrinterManager.validateConfig(usbConfig)).toBe(true);
    expect(usbConfig).not.toHaveProperty('host');
    expect(usbConfig).not.toHaveProperty('port');
    expect(usbConfig).not.toHaveProperty('deviceAddress');
  });

  it('rejects incomplete USB identity and unsupported USB serial', () => {
    expect(() =>
      PrinterManager.validateConfig({...usbConfig, vendorId: Number.NaN}),
    ).toThrow('identity is incomplete');
    expect(() =>
      PrinterManager.validateConfig({
        ...usbConfig,
        usbType: USB_TYPES.SERIAL,
        interfaceClass: 10,
      }),
    ).toThrow('supported serial driver');
  });

  it('strips stale Bluetooth fields from normalized network config', () => {
    const normalized = PrinterManager.normalizeConfig({
      ...networkConfig,
      bluetoothType: BLUETOOTH_TYPES.CLASSIC,
      deviceName: 'Old Printer',
      deviceAddress: 'AA:BB:CC:DD:EE:FF',
    });

    expect(normalized).not.toHaveProperty('bluetoothType');
    expect(normalized).not.toHaveProperty('deviceName');
    expect(normalized).not.toHaveProperty('deviceAddress');
  });

  it('strips stale network fields from normalized Bluetooth config', () => {
    const normalized = PrinterManager.normalizeConfig({
      ...bluetoothConfig,
      host: '192.168.1.99',
      port: 9100,
    });

    expect(normalized).not.toHaveProperty('host');
    expect(normalized).not.toHaveProperty('port');
  });

  it('strips stale network and Bluetooth fields from normalized USB config', () => {
    const normalized = PrinterManager.normalizeConfig({
      ...usbConfig,
      host: '192.168.1.99',
      port: 9100,
      bluetoothType: BLUETOOTH_TYPES.CLASSIC,
      deviceAddress: 'AA:BB:CC:DD:EE:FF',
    });

    expect(normalized).toMatchObject({
      connectionType: CONNECTION_TYPES.USB,
      serialNumber: usbConfig.serialNumber,
      vendorId: usbConfig.vendorId,
      productId: usbConfig.productId,
    });
    expect(normalized).not.toHaveProperty('host');
    expect(normalized).not.toHaveProperty('port');
    expect(normalized).not.toHaveProperty('bluetoothType');
    expect(normalized).not.toHaveProperty('deviceAddress');
  });

  it('strips stale USB fields from normalized Network and Bluetooth configs', () => {
    const staleUsb = {
      usbType: USB_TYPES.PRINTER_CLASS,
      vendorId: 1234,
      productId: 5678,
      serialNumber: 'OLD',
      interfaceClass: 7,
    };

    expect(
      PrinterManager.normalizeConfig({...networkConfig, ...staleUsb}),
    ).not.toHaveProperty('usbType');
    expect(
      PrinterManager.normalizeConfig({...bluetoothConfig, ...staleUsb}),
    ).not.toHaveProperty('usbType');
  });

  it('resolves the matching transport and rejects unknown types', () => {
    expect(PrinterManager.getTransport(networkConfig)).toBe(NetworkTransport);
    expect(PrinterManager.getTransport(bluetoothConfig)).toBe(
      BluetoothTransport,
    );
    expect(PrinterManager.getTransport(usbConfig)).toBe(UsbTransport);
    expect(() =>
      PrinterManager.getTransport({connectionType: 'unknown'}),
    ).toThrow('Unsupported printer connection type');
  });

  it('routes a network order receipt to NetworkTransport', async () => {
    getPrinterConfig.mockResolvedValue(networkConfig);

    await PrinterManager.printReceipt({id: 101});

    expect(buildReceipt).toHaveBeenCalledTimes(1);
    expect(NetworkTransport.send).toHaveBeenCalledTimes(1);
    expect(BluetoothTransport.send).not.toHaveBeenCalled();
  });

  it('routes a Bluetooth order receipt to BluetoothTransport', async () => {
    getPrinterConfig.mockResolvedValue(bluetoothConfig);

    await PrinterManager.printReceipt({id: 102});

    expect(buildReceipt).toHaveBeenCalledTimes(1);
    expect(BluetoothTransport.send).toHaveBeenCalledTimes(1);
    expect(NetworkTransport.send).not.toHaveBeenCalled();
  });

  it('routes a USB order receipt and shared receipt buffer to UsbTransport', async () => {
    getPrinterConfig.mockResolvedValue(usbConfig);

    await PrinterManager.printReceipt({id: 104});

    expect(buildReceipt).toHaveBeenCalledWith(
      {id: 104},
      expect.objectContaining({connectionType: CONNECTION_TYPES.USB}),
    );
    expect(UsbTransport.send).toHaveBeenCalledWith(
      expect.objectContaining({vendorId: usbConfig.vendorId}),
      Buffer.from('order receipt'),
    );
    expect(NetworkTransport.send).not.toHaveBeenCalled();
    expect(BluetoothTransport.send).not.toHaveBeenCalled();
  });

  it('uses the shared test receipt builder for Bluetooth', async () => {
    await PrinterManager.printTestPage(bluetoothConfig);

    expect(buildTestReceipt).toHaveBeenCalledTimes(1);
    expect(BluetoothTransport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionType: CONNECTION_TYPES.BLUETOOTH,
        deviceAddress: bluetoothConfig.deviceAddress,
      }),
      Buffer.from('test receipt'),
    );
  });

  it('uses the shared test receipt builder for USB', async () => {
    await PrinterManager.printTestPage(usbConfig);

    expect(buildTestReceipt).toHaveBeenCalledWith(
      expect.objectContaining({connectionType: CONNECTION_TYPES.USB}),
    );
    expect(UsbTransport.send).toHaveBeenCalledWith(
      expect.objectContaining({serialNumber: usbConfig.serialNumber}),
      Buffer.from('test receipt'),
    );
  });

  it('routes connection tests through the selected transport', async () => {
    await PrinterManager.testConnection(networkConfig);
    await PrinterManager.testConnection(bluetoothConfig);
    await PrinterManager.testConnection(usbConfig, {requestPermission: true});

    expect(NetworkTransport.test).toHaveBeenCalledTimes(1);
    expect(BluetoothTransport.test).toHaveBeenCalledTimes(1);
    expect(UsbTransport.test).toHaveBeenCalledWith(
      expect.objectContaining({connectionType: CONNECTION_TYPES.USB}),
      {requestPermission: true},
    );
  });

  it.each([
    ['Network', networkConfig, NetworkTransport],
    ['Bluetooth', bluetoothConfig, BluetoothTransport],
    ['USB', usbConfig, UsbTransport],
  ])(
    '%s connection test completes before an immediate test page sends once',
    async (name, config, transport) => {
      await PrinterManager.testConnection(config, {requestPermission: true});

      expect(transport.test).toHaveBeenCalledTimes(1);
      expect(transport.send).not.toHaveBeenCalled();

      await PrinterManager.printTestPage(config);

      expect(transport.send).toHaveBeenCalledTimes(1);
      expect(buildTestReceipt).toHaveBeenCalledTimes(1);
      expect(transport.test.mock.invocationCallOrder[0]).toBeLessThan(
        transport.send.mock.invocationCallOrder[0],
      );
    },
  );

  it('saves only a normalized serializable Bluetooth configuration', async () => {
    await PrinterManager.savePrinter({
      ...bluetoothConfig,
      host: '192.168.1.99',
      port: 9100,
      write: jest.fn(),
    });

    const saved = savePrinterConfig.mock.calls[0][0];

    expect(saved).toMatchObject({
      deviceAddress: bluetoothConfig.deviceAddress,
      deviceName: bluetoothConfig.deviceName,
    });
    expect(saved).not.toHaveProperty('host');
    expect(saved).not.toHaveProperty('port');
    expect(saved).not.toHaveProperty('write');
  });

  it('does not connect when the saved printer is disabled', async () => {
    getPrinterConfig.mockResolvedValue({...bluetoothConfig, enabled: false});

    await expect(PrinterManager.printReceipt({id: 103})).rejects.toThrow(
      'disabled',
    );
    expect(BluetoothTransport.send).not.toHaveBeenCalled();
  });
});
