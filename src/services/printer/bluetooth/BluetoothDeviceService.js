import { Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

import { requireBluetoothPermissions } from './bluetoothPermissions';

export const getBluetoothDeviceAddress = deviceOrAddress =>
  typeof deviceOrAddress === 'string'
    ? deviceOrAddress
    : deviceOrAddress?.address || deviceOrAddress?.id;

export const isClassicBluetoothDevice = device =>
  !device?.type || ['CLASSIC', 'DUAL', 'UNKNOWN'].includes(device.type);

const sortDevices = devices =>
  [...devices].sort((left, right) =>
    String(left?.name || getBluetoothDeviceAddress(left) || '').localeCompare(
      String(right?.name || getBluetoothDeviceAddress(right) || ''),
    ),
  );

class BluetoothDeviceService {
  assertAndroid() {
    if (Platform.OS !== 'android') {
      throw new Error('Bluetooth Classic printer setup is Android-only.');
    }
  }

  async isAvailable() {
    this.assertAndroid();

    return RNBluetoothClassic.isBluetoothAvailable();
  }

  async isEnabled() {
    this.assertAndroid();

    return RNBluetoothClassic.isBluetoothEnabled();
  }

  async requestEnable() {
    this.assertAndroid();

    return RNBluetoothClassic.requestBluetoothEnabled();
  }

  async prepare({
    discovery = false,
    requestEnable = true,
    requestPermissions = true,
  } = {}) {
    this.assertAndroid();

    await requireBluetoothPermissions(
      { discovery },
      { request: requestPermissions },
    );

    if (!(await this.isAvailable())) {
      throw new Error('Bluetooth is not available on this device.');
    }

    let enabled = await this.isEnabled();

    if (!enabled && requestEnable) {
      enabled = await this.requestEnable();
    }

    if (!enabled) {
      throw new Error('Bluetooth must be enabled to use the printer.');
    }

    return true;
  }

  async getPairedDevices(options = {}) {
    await this.prepare(options);

    const devices = await RNBluetoothClassic.getBondedDevices();

    return sortDevices(devices.filter(isClassicBluetoothDevice));
  }

  async scanDevices() {
    await this.prepare({ discovery: true });

    const devices = await RNBluetoothClassic.startDiscovery();

    return sortDevices(devices.filter(isClassicBluetoothDevice));
  }

  async pairDevice(deviceOrAddress) {
    const address = getBluetoothDeviceAddress(deviceOrAddress);

    if (!address) {
      throw new Error('Bluetooth device address is missing.');
    }

    await this.prepare({ discovery: true });

    if (deviceOrAddress?.bonded) {
      return deviceOrAddress;
    }

    return RNBluetoothClassic.pairDevice(address);
  }
}

export default new BluetoothDeviceService();
