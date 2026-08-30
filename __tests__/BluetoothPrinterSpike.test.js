import { Buffer } from 'buffer';

jest.mock('react-native-bluetooth-classic', () => ({
  __esModule: true,
  default: {
    getBondedDevices: jest.fn(),
    isBluetoothAvailable: jest.fn(),
    isBluetoothEnabled: jest.fn(),
    pairDevice: jest.fn(),
    requestBluetoothEnabled: jest.fn(),
    startDiscovery: jest.fn(),
  },
}));

jest.mock(
  '../src/services/printer/bluetooth/bluetoothPermissions',
  () => ({
    requireBluetoothPermissions: jest.fn().mockResolvedValue(true),
  }),
);

import BluetoothPrinterSpike from '../src/services/printer/bluetooth/BluetoothPrinterSpike';

const mockBluetooth = require('react-native-bluetooth-classic').default;

const createDevice = (overrides = {}) => ({
  address: '00:11:22:33:44:55',
  bonded: true,
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  id: '00:11:22:33:44:55',
  isConnected: jest.fn().mockResolvedValue(true),
  name: 'POS-80',
  type: 'CLASSIC',
  write: jest.fn().mockResolvedValue(true),
  ...overrides,
});

describe('BluetoothPrinterSpike', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(BluetoothPrinterSpike, 'assertAndroid').mockImplementation();
    mockBluetooth.isBluetoothAvailable.mockResolvedValue(true);
    mockBluetooth.isBluetoothEnabled.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns paired Classic devices and excludes BLE-only devices', async () => {
    const printer = createDevice();
    const bleDevice = createDevice({
      address: 'AA:BB:CC:DD:EE:FF',
      id: 'AA:BB:CC:DD:EE:FF',
      name: 'BLE Sensor',
      type: 'LOW_ENERGY',
    });

    mockBluetooth.getBondedDevices.mockResolvedValue([bleDevice, printer]);

    await expect(BluetoothPrinterSpike.getPairedDevices()).resolves.toEqual([
      printer,
    ]);
  });

  it('tests a real socket and disconnects without writing', async () => {
    const printer = createDevice();

    mockBluetooth.getBondedDevices.mockResolvedValue([printer]);

    await expect(BluetoothPrinterSpike.test(printer)).resolves.toMatchObject({
      success: true,
    });

    expect(printer.connect).toHaveBeenCalledWith({
      connectionType: 'binary',
      secureSocket: true,
    });
    expect(printer.write).not.toHaveBeenCalled();
    expect(printer.disconnect).toHaveBeenCalledTimes(1);
  });

  it('falls back to an insecure socket before any write', async () => {
    const printer = createDevice();

    printer.connect
      .mockRejectedValueOnce(new Error('Secure RFCOMM failed'))
      .mockResolvedValueOnce(true);
    printer.isConnected.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockBluetooth.getBondedDevices.mockResolvedValue([printer]);

    await BluetoothPrinterSpike.printRawTest(printer);

    expect(printer.connect).toHaveBeenNthCalledWith(1, {
      connectionType: 'binary',
      secureSocket: true,
    });
    expect(printer.connect).toHaveBeenNthCalledWith(2, {
      connectionType: 'binary',
      secureSocket: false,
    });
    expect(printer.write).toHaveBeenCalledTimes(1);
  });

  it('writes one ESC/POS buffer and always disconnects', async () => {
    const printer = createDevice();

    mockBluetooth.getBondedDevices.mockResolvedValue([printer]);

    await expect(
      BluetoothPrinterSpike.printRawTest(printer),
    ).resolves.toMatchObject({ success: true });

    expect(printer.write).toHaveBeenCalledTimes(1);
    expect(Buffer.isBuffer(printer.write.mock.calls[0][0])).toBe(true);
    expect(printer.write.mock.calls[0][0].toString('utf8')).toContain(
      'WORKFOOD\n',
    );
    expect(printer.write.mock.calls[0][0].toString('utf8')).toContain(
      'BLUETOOTH TEST\n',
    );
    expect(printer.disconnect).toHaveBeenCalledTimes(1);
  });

  it('does not retry an unconfirmed receipt write', async () => {
    const printer = createDevice();

    printer.write.mockResolvedValue(false);
    mockBluetooth.getBondedDevices.mockResolvedValue([printer]);

    await expect(
      BluetoothPrinterSpike.printRawTest(printer),
    ).rejects.toThrow('did not confirm');

    expect(printer.write).toHaveBeenCalledTimes(1);
    expect(printer.disconnect).toHaveBeenCalledTimes(1);
  });
});
