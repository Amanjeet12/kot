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
import BluetoothTransport, {
  BLUETOOTH_POST_WRITE_SETTLE_MS,
} from '../src/services/printer/transports/BluetoothTransport';

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

const flushMicrotasks = async () => {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
};

describe('BluetoothTransport', () => {
  let consoleSpy;
  let settleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    settleSpy = jest
      .spyOn(BluetoothTransport, 'waitForPostWriteSettle')
      .mockResolvedValue();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    settleSpy.mockRestore();
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
    expect(settleSpy).toHaveBeenCalledTimes(1);
    expect(device.disconnect).toHaveBeenCalledTimes(1);
  });

  it('keeps the connection open until the bounded post-write settle completes', async () => {
    let finishSettle;
    settleSpy.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishSettle = resolve;
        }),
    );
    const device = createDevice();
    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    const sendPromise = BluetoothTransport.send(
      config,
      Buffer.from('receipt'),
    );
    await flushMicrotasks();

    expect(device.write).toHaveBeenCalledTimes(1);
    expect(device.disconnect).not.toHaveBeenCalled();
    expect(BLUETOOTH_POST_WRITE_SETTLE_MS).toBe(200);

    finishSettle();
    await expect(sendPromise).resolves.toMatchObject({success: true});
    expect(device.disconnect).toHaveBeenCalledTimes(1);
  });

  it('fully disconnects a connection test before the first print reconnects', async () => {
    let finishTestDisconnect;
    const device = createDevice();
    device.disconnect
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            finishTestDisconnect = resolve;
          }),
      )
      .mockResolvedValueOnce(true);
    BluetoothDeviceService.getPairedDevices.mockResolvedValue([device]);

    const testPromise = BluetoothTransport.test(config);
    await flushMicrotasks();

    expect(device.write).not.toHaveBeenCalled();
    expect(device.connect).toHaveBeenCalledTimes(1);

    finishTestDisconnect(true);
    await testPromise;
    await BluetoothTransport.send(config, Buffer.from('test receipt'));

    expect(device.connect).toHaveBeenCalledTimes(2);
    expect(device.disconnect).toHaveBeenCalledTimes(2);
    expect(device.write).toHaveBeenCalledTimes(1);
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
