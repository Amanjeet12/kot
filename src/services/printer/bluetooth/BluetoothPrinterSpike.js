import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

import EscPosProtocol from '../protocols/EscPosProtocol';
import { requireBluetoothPermissions } from './bluetoothPermissions';

const BINARY_CONNECTION_OPTIONS = {
  connectionType: 'binary',
  secureSocket: true,
};

const INSECURE_BINARY_CONNECTION_OPTIONS = {
  ...BINARY_CONNECTION_OPTIONS,
  secureSocket: false,
};

const getAddress = deviceOrAddress =>
  typeof deviceOrAddress === 'string'
    ? deviceOrAddress
    : deviceOrAddress?.address || deviceOrAddress?.id;

const sortDevices = devices =>
  [...devices].sort((left, right) =>
    String(left?.name || left?.address || '').localeCompare(
      String(right?.name || right?.address || ''),
    ),
  );

const isClassicDevice = device =>
  !device?.type || ['CLASSIC', 'DUAL', 'UNKNOWN'].includes(device.type);

const safeDisconnect = async device => {
  try {
    if (device && (await device.isConnected())) {
      await device.disconnect();
    }
  } catch (error) {
    console.log('[BluetoothSpike] Disconnect cleanup:', error);
  }
};

const buildRawTestReceipt = device =>
  Buffer.concat([
    EscPosProtocol.initialize(),
    EscPosProtocol.alignCenter(),
    EscPosProtocol.bold(true),
    EscPosProtocol.doubleSize(),
    EscPosProtocol.text('WORKFOOD\n'),
    EscPosProtocol.normalSize(),
    EscPosProtocol.text('BLUETOOTH TEST\n'),
    EscPosProtocol.bold(false),
    EscPosProtocol.text('================================\n'),
    EscPosProtocol.alignLeft(),
    EscPosProtocol.text(`Printer: ${device?.name || 'Bluetooth Printer'}\n`),
    EscPosProtocol.text(`Address: ${device?.address || '-'}\n`),
    EscPosProtocol.text('Connection: Bluetooth Classic\n'),
    EscPosProtocol.text('Protocol: ESC/POS\n'),
    EscPosProtocol.text('================================\n'),
    EscPosProtocol.alignCenter(),
    EscPosProtocol.bold(true),
    EscPosProtocol.text('TEST SUCCESSFUL\n'),
    EscPosProtocol.bold(false),
    EscPosProtocol.feed(3),
  ]);

class BluetoothPrinterSpike {
  assertAndroid() {
    if (Platform.OS !== 'android') {
      throw new Error('Bluetooth Classic printer setup is Android-only.');
    }
  }

  async prepare({ discovery = false } = {}) {
    this.assertAndroid();

    await requireBluetoothPermissions(
      { discovery },
      {
        request: true,
      },
    );

    const available = await RNBluetoothClassic.isBluetoothAvailable();

    if (!available) {
      throw new Error('Bluetooth is not available on this device.');
    }

    let enabled = await RNBluetoothClassic.isBluetoothEnabled();

    if (!enabled) {
      enabled = await RNBluetoothClassic.requestBluetoothEnabled();
    }

    if (!enabled) {
      throw new Error('Bluetooth must be enabled to continue.');
    }

    return true;
  }

  async getPairedDevices() {
    await this.prepare();

    const devices = await RNBluetoothClassic.getBondedDevices();

    return sortDevices(devices.filter(isClassicDevice));
  }

  async scanDevices() {
    await this.prepare({ discovery: true });

    const devices = await RNBluetoothClassic.startDiscovery();

    return sortDevices(devices.filter(isClassicDevice));
  }

  async pairDevice(device) {
    const address = getAddress(device);

    if (!address) {
      throw new Error('Bluetooth device address is missing.');
    }

    await this.prepare({ discovery: true });

    if (device?.bonded) {
      return device;
    }

    return RNBluetoothClassic.pairDevice(address);
  }

  async findPairedDevice(deviceOrAddress) {
    const address = getAddress(deviceOrAddress);

    if (!address) {
      throw new Error('Select a Bluetooth printer first.');
    }

    const devices = await this.getPairedDevices();

    const device = devices.find(
      current =>
        String(current.address || current.id).toUpperCase() ===
        String(address).toUpperCase(),
    );

    if (!device) {
      throw new Error(
        'The selected printer is no longer paired. Pair it in Android and try again.',
      );
    }

    return device;
  }

  async connect(device) {
    try {
      const connected = await device.connect(BINARY_CONNECTION_OPTIONS);

      if (!connected) {
        throw new Error('Unable to open a Bluetooth printer connection.');
      }

      return true;
    } catch (secureError) {
      await safeDisconnect(device);

      try {
        const connected = await device.connect(
          INSECURE_BINARY_CONNECTION_OPTIONS,
        );

        if (!connected) {
          throw new Error('Unable to open a Bluetooth printer connection.');
        }

        return true;
      } catch (insecureError) {
        throw new Error(
          insecureError?.message ||
            secureError?.message ||
            'Unable to connect to the Bluetooth printer.',
        );
      }
    }
  }

  async test(deviceOrAddress) {
    const device = await this.findPairedDevice(deviceOrAddress);

    try {
      await this.connect(device);

      return {
        success: true,
        message: 'Bluetooth printer connection successful.',
      };
    } finally {
      await safeDisconnect(device);
    }
  }

  async printRawTest(deviceOrAddress) {
    const device = await this.findPairedDevice(deviceOrAddress);

    try {
      await this.connect(device);

      const written = await device.write(buildRawTestReceipt(device));

      if (!written) {
        const error = new Error(
          'The Bluetooth socket did not confirm the test receipt write.',
        );

        error.code = 'BLUETOOTH_WRITE_UNCONFIRMED';

        throw error;
      }

      return {
        success: true,
        message: 'Raw Bluetooth test receipt sent.',
      };
    } finally {
      await safeDisconnect(device);
    }
  }
}

export default new BluetoothPrinterSpike();

