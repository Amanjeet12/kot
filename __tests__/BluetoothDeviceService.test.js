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

import BluetoothDeviceService from '../src/services/printer/bluetooth/BluetoothDeviceService';

const mockBluetooth = require('react-native-bluetooth-classic').default;
const {requireBluetoothPermissions} = require('../src/services/printer/bluetooth/bluetoothPermissions');

const printer = {
  address: '00:11:22:33:44:55',
  bonded: true,
  name: 'POS-80',
  type: 'CLASSIC',
};

describe('BluetoothDeviceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(BluetoothDeviceService, 'assertAndroid').mockImplementation();
    mockBluetooth.isBluetoothAvailable.mockResolvedValue(true);
    mockBluetooth.isBluetoothEnabled.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns paired Classic devices and excludes BLE-only devices', async () => {
    const bleDevice = {
      address: 'AA:BB:CC:DD:EE:FF',
      name: 'BLE Sensor',
      type: 'LOW_ENERGY',
    };

    mockBluetooth.getBondedDevices.mockResolvedValue([bleDevice, printer]);

    await expect(BluetoothDeviceService.getPairedDevices()).resolves.toEqual([
      printer,
    ]);
    expect(requireBluetoothPermissions).toHaveBeenCalledWith(
      {discovery: false},
      {request: true},
    );
  });

  it('scans only for Classic-compatible devices with discovery permission', async () => {
    mockBluetooth.startDiscovery.mockResolvedValue([
      {...printer, name: 'Zebra'},
      {address: 'AA:BB', name: 'BLE Sensor', type: 'LOW_ENERGY'},
    ]);

    await expect(BluetoothDeviceService.scanDevices()).resolves.toEqual([
      {...printer, name: 'Zebra'},
    ]);
    expect(requireBluetoothPermissions).toHaveBeenCalledWith(
      {discovery: true},
      {request: true},
    );
  });

  it('uses the Android pairing flow for an unpaired device', async () => {
    const unpaired = {...printer, bonded: false};
    const paired = {...printer, bonded: true};

    mockBluetooth.pairDevice.mockResolvedValue(paired);

    await expect(BluetoothDeviceService.pairDevice(unpaired)).resolves.toEqual(
      paired,
    );
    expect(mockBluetooth.pairDevice).toHaveBeenCalledWith(printer.address);
  });

  it('does not pair a device already marked as bonded', async () => {
    await expect(BluetoothDeviceService.pairDevice(printer)).resolves.toBe(
      printer,
    );
    expect(mockBluetooth.pairDevice).not.toHaveBeenCalled();
  });

  it('requests Bluetooth enablement during interactive setup', async () => {
    mockBluetooth.isBluetoothEnabled.mockResolvedValue(false);
    mockBluetooth.requestBluetoothEnabled.mockResolvedValue(true);

    await expect(BluetoothDeviceService.prepare()).resolves.toBe(true);
    expect(mockBluetooth.requestBluetoothEnabled).toHaveBeenCalledTimes(1);
  });
});
