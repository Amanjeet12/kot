import BluetoothDeviceService, {
  getBluetoothDeviceAddress,
} from '../bluetooth/BluetoothDeviceService';

const BINARY_CONNECTION_OPTIONS = {
  connectionType: 'binary',
  secureSocket: true,
};

const INSECURE_BINARY_CONNECTION_OPTIONS = {
  ...BINARY_CONNECTION_OPTIONS,
  secureSocket: false,
};

// react-native-bluetooth-classic resolves write() after OutputStream.write(),
// but its Android implementation exposes no flush/drain primitive. Keep the
// RFCOMM stream open briefly so queued bytes can leave the Bluetooth stack
// before disconnect closes the output stream.
export const BLUETOOTH_POST_WRITE_SETTLE_MS = 200;

class BluetoothTransport {
  waitForPostWriteSettle() {
    return new Promise(resolve => {
      setTimeout(resolve, BLUETOOTH_POST_WRITE_SETTLE_MS);
    });
  }

  async safeDisconnect(device) {
    try {
      if (device && (await device.isConnected())) {
        console.log('[BluetoothPrinter] Disconnect started:', Date.now());
        await device.disconnect();
        console.log('[BluetoothPrinter] Disconnect completed:', Date.now());
      }
    } catch (error) {
      console.log('[BluetoothPrinter] Disconnect cleanup:', error);
    }
  }

  async findPairedDevice(config) {
    const address = String(config?.deviceAddress || '').trim();

    if (!address) {
      throw new Error('Select a Bluetooth printer first.');
    }

    const devices = await BluetoothDeviceService.getPairedDevices({
      requestEnable: false,
      requestPermissions: false,
    });

    const device = devices.find(
      current =>
        String(getBluetoothDeviceAddress(current) || '').toUpperCase() ===
        address.toUpperCase(),
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

      console.log('[BluetoothPrinter] Connected:', Date.now());

      return true;
    } catch (secureError) {
      await this.safeDisconnect(device);

      try {
        const connected = await device.connect(
          INSECURE_BINARY_CONNECTION_OPTIONS,
        );

        if (!connected) {
          throw new Error('Unable to open a Bluetooth printer connection.');
        }

        console.log('[BluetoothPrinter] Connected insecurely:', Date.now());

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

  async test(config) {
    const device = await this.findPairedDevice(config);

    try {
      await this.connect(device);

      return {
        success: true,
        message: 'Bluetooth printer connection successful.',
      };
    } finally {
      await this.safeDisconnect(device);
    }
  }

  async send(config, data) {
    if (!data) {
      throw new Error('Printer data is empty.');
    }

    const device = await this.findPairedDevice(config);

    try {
      await this.connect(device);

      console.log('[BluetoothPrinter] Write started:', Date.now());
      const written = await device.write(data);
      console.log('[BluetoothPrinter] Write completed:', Date.now());

      if (!written) {
        const error = new Error(
          'The Bluetooth socket did not confirm the receipt write.',
        );

        error.code = 'BLUETOOTH_WRITE_UNCONFIRMED';

        throw error;
      }

      await this.waitForPostWriteSettle();
      console.log('[BluetoothPrinter] Post-write settle completed:', Date.now());

      return {
        success: true,
        message: 'Receipt sent to printer.',
      };
    } finally {
      await this.safeDisconnect(device);
    }
  }
}

export default new BluetoothTransport();
