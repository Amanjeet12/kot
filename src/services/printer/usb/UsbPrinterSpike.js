import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';

import EscPosProtocol from '../protocols/EscPosProtocol';

const USB_CLASS_COMM = 2;
const USB_CLASS_PRINTER = 7;
const USB_CLASS_CDC_DATA = 10;
const USB_CLASS_VENDOR_SPECIFIC = 255;

const COMMON_SERIAL_VENDOR_IDS = new Set([
  0x0403, // FTDI
  0x067b, // Prolific PL2303
  0x10c4, // Silicon Labs CP210x
  0x1a86, // QinHeng CH340/CH341
]);

const createUsbError = (code, message) => {
  const error = new Error(message);

  error.code = code;

  return error;
};

export const getUsbDeviceIdentity = device =>
  [
    device?.deviceName || '',
    Number(device?.deviceId ?? -1),
    Number(device?.vendorId ?? -1),
    Number(device?.productId ?? -1),
  ].join(':');

export const isSameUsbDevice = (left, right) =>
  Boolean(left && right) &&
  getUsbDeviceIdentity(left) === getUsbDeviceIdentity(right);

export const classifyUsbDevice = device => {
  const interfaces = Array.isArray(device?.interfaces)
    ? device.interfaces
    : [];
  const interfaceClasses = interfaces.map(item => Number(item?.class));

  if (interfaceClasses.includes(USB_CLASS_PRINTER)) {
    return 'printer_class';
  }

  if (
    COMMON_SERIAL_VENDOR_IDS.has(Number(device?.vendorId)) ||
    interfaceClasses.includes(USB_CLASS_COMM) ||
    interfaceClasses.includes(USB_CLASS_CDC_DATA)
  ) {
    return 'usb_serial';
  }

  if (interfaceClasses.includes(USB_CLASS_VENDOR_SPECIFIC)) {
    return 'vendor_specific';
  }

  return 'unsupported';
};

export const findWritableUsbPath = device => {
  const classification = classifyUsbDevice(device);
  const allowedClass =
    classification === 'printer_class'
      ? USB_CLASS_PRINTER
      : classification === 'vendor_specific'
        ? USB_CLASS_VENDOR_SPECIFIC
        : null;

  if (allowedClass === null) {
    return null;
  }

  for (const usbInterface of device.interfaces || []) {
    if (Number(usbInterface?.class) !== allowedClass) {
      continue;
    }

    const endpoint = (usbInterface.endpoints || []).find(
      item => item?.direction === 'OUT' && item?.type === 'BULK',
    );

    if (endpoint) {
      return { classification, endpoint, interface: usbInterface };
    }
  }

  return null;
};

export const buildUsbTestReceipt = () =>
  Buffer.concat([
    EscPosProtocol.initialize(),
    EscPosProtocol.alignCenter(),
    EscPosProtocol.bold(true),
    EscPosProtocol.doubleSize(),
    EscPosProtocol.text('WORKFOOD\n'),
    EscPosProtocol.normalSize(),
    EscPosProtocol.text('USB PRINTER TEST\n\n'),
    EscPosProtocol.bold(false),
    EscPosProtocol.alignLeft(),
    EscPosProtocol.text('Connection: USB\n'),
    EscPosProtocol.text('Protocol: ESC/POS\n\n'),
    EscPosProtocol.alignCenter(),
    EscPosProtocol.bold(true),
    EscPosProtocol.text('TEST SUCCESSFUL\n'),
    EscPosProtocol.bold(false),
    EscPosProtocol.feed(5),
  ]);

export class UsbPrinterSpikeService {
  constructor(
    nativeModule = NativeModules.UsbPrinterSpike,
    platform = Platform.OS,
  ) {
    this.nativeModule = nativeModule;
    this.platform = platform;
  }

  assertAvailable() {
    if (this.platform !== 'android') {
      throw createUsbError(
        'USB_ANDROID_ONLY',
        'The USB printer proof is Android-only.',
      );
    }

    if (!this.nativeModule) {
      throw createUsbError(
        'USB_SPIKE_UNAVAILABLE',
        'The development USB printer module is unavailable in this build.',
      );
    }
  }

  assertDevice(device) {
    if (!device?.deviceName) {
      throw createUsbError(
        'USB_DEVICE_REQUIRED',
        'Select a connected USB device first.',
      );
    }
  }

  assertSupported(device) {
    const classification = classifyUsbDevice(device);

    if (classification === 'usb_serial') {
      throw createUsbError(
        'USB_SERIAL_DRIVER_REQUIRED',
        'This appears to be USB serial. Identify the chipset before choosing and configuring a serial driver.',
      );
    }

    if (!findWritableUsbPath(device)) {
      throw createUsbError(
        'USB_WRITABLE_ENDPOINT_NOT_FOUND',
        'No supported Printer Class or vendor-specific BULK OUT endpoint was found.',
      );
    }
  }

  async isUsbHostSupported() {
    this.assertAvailable();

    return this.nativeModule.isUsbHostSupported();
  }

  async listDevices() {
    this.assertAvailable();

    const devices = await this.nativeModule.getConnectedDevices();

    return (Array.isArray(devices) ? devices : []).sort((left, right) =>
      String(left?.productName || left?.deviceName || '').localeCompare(
        String(right?.productName || right?.deviceName || ''),
      ),
    );
  }

  async ensurePermission(device) {
    this.assertAvailable();
    this.assertDevice(device);

    if (await this.nativeModule.hasPermission(device.deviceName)) {
      return true;
    }

    const granted = await this.nativeModule.requestPermission(
      device.deviceName,
    );

    if (!granted) {
      throw createUsbError(
        'USB_PERMISSION_DENIED',
        'USB permission was not granted for the selected device.',
      );
    }

    return true;
  }

  async testConnection(device) {
    this.assertAvailable();
    this.assertDevice(device);
    this.assertSupported(device);
    await this.ensurePermission(device);

    return this.nativeModule.testConnection(device.deviceName);
  }

  async printTest(device) {
    this.assertAvailable();
    this.assertDevice(device);
    this.assertSupported(device);
    await this.ensurePermission(device);

    const receipt = buildUsbTestReceipt();

    // Exactly one native logical send. Native code may sequentially chunk this
    // payload, but this method never retries the complete receipt.
    return this.nativeModule.printBase64(
      device.deviceName,
      receipt.toString('base64'),
    );
  }
}

export default new UsbPrinterSpikeService();
