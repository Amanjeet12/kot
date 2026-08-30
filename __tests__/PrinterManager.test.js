import {Buffer} from 'buffer';

jest.mock('../src/services/printer/transports/NetworkTransport', () => ({
  __esModule: true,
  default: {send: jest.fn(), test: jest.fn()},
}));

jest.mock('../src/services/printer/transports/BluetoothTransport', () => ({
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

describe('PrinterManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NetworkTransport.send.mockResolvedValue({success: true});
    NetworkTransport.test.mockResolvedValue({success: true});
    BluetoothTransport.send.mockResolvedValue({success: true});
    BluetoothTransport.test.mockResolvedValue({success: true});
    savePrinterConfig.mockResolvedValue(true);
  });

  it('exposes Bluetooth as a supported connection type', () => {
    expect(CONNECTION_TYPES.BLUETOOTH).toBe('bluetooth');
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

  it('resolves the matching transport and rejects unknown types', () => {
    expect(PrinterManager.getTransport(networkConfig)).toBe(NetworkTransport);
    expect(PrinterManager.getTransport(bluetoothConfig)).toBe(
      BluetoothTransport,
    );
    expect(() =>
      PrinterManager.getTransport({connectionType: 'usb'}),
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

  it('routes connection tests through the selected transport', async () => {
    await PrinterManager.testConnection(networkConfig);
    await PrinterManager.testConnection(bluetoothConfig);

    expect(NetworkTransport.test).toHaveBeenCalledTimes(1);
    expect(BluetoothTransport.test).toHaveBeenCalledTimes(1);
  });

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
