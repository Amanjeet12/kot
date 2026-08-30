import {Buffer} from 'buffer';

jest.mock(
  '../src/services/printer/bluetooth/BluetoothDeviceService',
  () => ({
    __esModule: true,
    default: {
      getPairedDevices: jest.fn(),
    },
    getBluetoothDeviceAddress: device => device?.address || device?.id,
  }),
);

import BluetoothDeviceService from '../src/services/printer/bluetooth/BluetoothDeviceService';
import BluetoothTransport from '../src/services/printer/transports/BluetoothTransport';

const config = {deviceAddress: '00:11:22:33:44:55'};

const createDevice = (overrides = {}) => ({
  address: config.deviceAddress,
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  isConnected: jest.fn().mockResolvedValue(true),
  name: 'POS-80',
  write: jest.fn().mockResolvedValue(true),
  ...overrides,
});

describe('BluetoothTransport', () => {
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('finds a paired printer by its stable address', async () => {
    const device = createDevice();

    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    await expect(
      BluetoothTransport.findPairedDevice({
        deviceAddress: config.deviceAddress.toLowerCase(),
      }),
    ).resolves.toBe(device);
    expect(BluetoothDeviceService.getPairedDevices).toHaveBeenCalledWith({
      requestEnable: false,
      requestPermissions: false,
    });
  });

  it('rejects when the saved printer is no longer paired', async () => {
    BluetoothDeviceService.getPairedDevices.mockResolvedValue([]);

    await expect(BluetoothTransport.findPairedDevice(config)).rejects.toThrow(
      'no longer paired',
    );
  });

  it('uses a secure binary RFCOMM connection when available', async () => {
    const device = createDevice();

    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    await BluetoothTransport.test(config);

    expect(device.connect).toHaveBeenCalledWith({
      connectionType: 'binary',
      secureSocket: true,
    });
  });

  it('falls back to insecure RFCOMM only before writing', async () => {
    const device = createDevice();

    device.connect
      .mockRejectedValueOnce(new Error('Secure RFCOMM failed'))
      .mockResolvedValueOnce(true);
    device.isConnected.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    await BluetoothTransport.send(config, Buffer.from('receipt'));

    expect(device.connect).toHaveBeenNthCalledWith(1, {
      connectionType: 'binary',
      secureSocket: true,
    });
    expect(device.connect).toHaveBeenNthCalledWith(2, {
      connectionType: 'binary',
      secureSocket: false,
    });
    expect(device.write).toHaveBeenCalledTimes(1);
  });

  it('tests a fresh connection, never writes, and disconnects', async () => {
    const device = createDevice();

    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    await expect(BluetoothTransport.test(config)).resolves.toMatchObject({
      success: true,
    });
    expect(device.write).not.toHaveBeenCalled();
    expect(device.disconnect).toHaveBeenCalledTimes(1);
  });

  it('sends the supplied Buffer exactly once and disconnects', async () => {
    const device = createDevice();
    const data = Buffer.from('receipt');

    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    await expect(BluetoothTransport.send(config, data)).resolves.toMatchObject({
      success: true,
    });
    expect(device.write).toHaveBeenCalledTimes(1);
    expect(device.write).toHaveBeenCalledWith(data);
    expect(device.disconnect).toHaveBeenCalledTimes(1);
  });

  it('rejects an unconfirmed write without retrying and disconnects', async () => {
    const device = createDevice();

    device.write.mockResolvedValue(false);
    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    await expect(
      BluetoothTransport.send(config, Buffer.from('receipt')),
    ).rejects.toThrow('did not confirm');
    expect(device.write).toHaveBeenCalledTimes(1);
    expect(device.disconnect).toHaveBeenCalledTimes(1);
  });

  it('does not retry a rejected write and disconnects after failure', async () => {
    const device = createDevice();

    device.write.mockRejectedValue(new Error('Write failed'));
    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    await expect(
      BluetoothTransport.send(config, Buffer.from('receipt')),
    ).rejects.toThrow('Write failed');
    expect(device.write).toHaveBeenCalledTimes(1);
    expect(device.disconnect).toHaveBeenCalledTimes(1);
  });

  it('opens a new connection for every send operation', async () => {
    const device = createDevice();

    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    await BluetoothTransport.send(config, Buffer.from('first'));
    await BluetoothTransport.send(config, Buffer.from('second'));

    expect(BluetoothDeviceService.getPairedDevices).toHaveBeenCalledTimes(2);
    expect(device.connect).toHaveBeenCalledTimes(2);
    expect(device.disconnect).toHaveBeenCalledTimes(2);
    expect(device.write).toHaveBeenCalledTimes(2);
  });
});
