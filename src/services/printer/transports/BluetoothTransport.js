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

class BluetoothTransport {
  async safeDisconnect(device) {
    try {
      if (device && (await device.isConnected())) {
        await device.disconnect();
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

      const written = await device.write(data);

      if (!written) {
        const error = new Error(
          'The Bluetooth socket did not confirm the receipt write.',
        );

        error.code = 'BLUETOOTH_WRITE_UNCONFIRMED';

        throw error;
      }

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
