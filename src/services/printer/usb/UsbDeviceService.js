import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import { USB_TYPES } from '../printerTypes';

export { USB_TYPES } from '../printerTypes';

export const SUPPORTED_USB_TYPES = [
  USB_TYPES.PRINTER_CLASS,
  USB_TYPES.VENDOR_SPECIFIC,
];

export const USB_DEVICE_EVENTS = {
  ATTACHED: 'UsbPrinterDeviceAttached',
  DETACHED: 'UsbPrinterDeviceDetached',
};

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

export const createUsbError = (code, message) => {
  const error = new Error(message);

  error.code = code;

  return error;
};

const normalizedText = value => String(value || '').trim().toLowerCase();

const validUsbId = value => {
  const number = Number(value);

  return Number.isInteger(number) && number >= 0 && number <= 0xffff;
};

export const getUsbDeviceRuntimeIdentity = device =>
  [
    device?.deviceName || '',
    Number(device?.deviceId ?? -1),
    Number(device?.vendorId ?? -1),
    Number(device?.productId ?? -1),
  ].join(':');

export const classifyUsbDevice = device => {
  const interfaces = Array.isArray(device?.interfaces)
    ? device.interfaces
    : [];
  const interfaceClasses = interfaces.map(item => Number(item?.class));

  if (interfaceClasses.includes(USB_CLASS_PRINTER)) {
    return USB_TYPES.PRINTER_CLASS;
  }

  if (
    COMMON_SERIAL_VENDOR_IDS.has(Number(device?.vendorId)) ||
    interfaceClasses.includes(USB_CLASS_COMM) ||
    interfaceClasses.includes(USB_CLASS_CDC_DATA)
  ) {
    return USB_TYPES.SERIAL;
  }

  if (interfaceClasses.includes(USB_CLASS_VENDOR_SPECIFIC)) {
    return USB_TYPES.VENDOR_SPECIFIC;
  }

  return USB_TYPES.UNSUPPORTED;
};

export const findWritableUsbPath = device => {
  const usbType = classifyUsbDevice(device);
  const allowedClass =
    usbType === USB_TYPES.PRINTER_CLASS
      ? USB_CLASS_PRINTER
      : usbType === USB_TYPES.VENDOR_SPECIFIC
        ? USB_CLASS_VENDOR_SPECIFIC
        : null;

  if (allowedClass === null) {
    return null;
  }

  for (const usbInterface of device?.interfaces || []) {
    if (Number(usbInterface?.class) !== allowedClass) {
      continue;
    }

    const endpoint = (usbInterface.endpoints || []).find(
      item => item?.direction === 'OUT' && item?.type === 'BULK',
    );

    if (endpoint) {
      return { endpoint, interface: usbInterface, usbType };
    }
  }

  return null;
};

export const isSupportedUsbPrinter = device => Boolean(findWritableUsbPath(device));

export const getStableUsbIdentity = device => {
  const path = findWritableUsbPath(device);

  if (!path) {
    const usbType = classifyUsbDevice(device);

    if (usbType === USB_TYPES.SERIAL) {
      throw createUsbError(
        'USB_SERIAL_DRIVER_REQUIRED',
        'USB serial printers require a supported serial driver.',
      );
    }

    throw createUsbError(
      'USB_WRITABLE_ENDPOINT_NOT_FOUND',
      'The selected USB device does not expose a supported BULK OUT printer path.',
    );
  }

  return {
    usbType: path.usbType,
    vendorId: Number(device.vendorId),
    productId: Number(device.productId),
    serialNumber: String(device.serialNumber || '').trim(),
    manufacturerName: String(device.manufacturerName || '').trim(),
    productName: String(device.productName || '').trim(),
    interfaceClass: Number(path.interface.class),
    deviceName: String(device.deviceName || '').trim(),
  };
};

const descriptorMatches = (config, device) => {
  const manufacturer = normalizedText(config?.manufacturerName);
  const product = normalizedText(config?.productName);

  if (
    manufacturer &&
    manufacturer !== normalizedText(device?.manufacturerName)
  ) {
    return false;
  }

  if (product && product !== normalizedText(device?.productName)) {
    return false;
  }

  return true;
};

const resolveUniqueMatch = candidates => {
  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    throw createUsbError(
      'MULTIPLE_USB_PRINTERS_MATCH',
      'Multiple identical USB printers match the saved configuration. Select the intended printer again.',
    );
  }

  throw createUsbError(
    'USB_DEVICE_NOT_FOUND',
    'The saved USB printer is not connected.',
  );
};

export const matchSavedUsbDevice = (config, devices) => {
  if (!validUsbId(config?.vendorId) || !validUsbId(config?.productId)) {
    throw createUsbError(
      'USB_IDENTITY_REQUIRED',
      'The saved USB printer identity is incomplete.',
    );
  }

  const supportedMatches = (Array.isArray(devices) ? devices : []).filter(
    device =>
      isSupportedUsbPrinter(device) &&
      Number(device.vendorId) === Number(config.vendorId) &&
      Number(device.productId) === Number(config.productId),
  );

  if (!supportedMatches.length) {
    throw createUsbError(
      'USB_DEVICE_NOT_FOUND',
      'The saved USB printer is not connected.',
    );
  }

  const savedSerial = normalizedText(config.serialNumber);

  if (savedSerial) {
    const exactSerialMatches = supportedMatches.filter(
      device => normalizedText(device.serialNumber) === savedSerial,
    );

    if (exactSerialMatches.length) {
      return resolveUniqueMatch(exactSerialMatches);
    }

    const serialReadable = supportedMatches.some(device =>
      normalizedText(device.serialNumber),
    );

    if (serialReadable) {
      throw createUsbError(
        'USB_DEVICE_NOT_FOUND',
        'The connected USB printer does not match the saved serial number.',
      );
    }
  }

  const descriptorMatchesList = supportedMatches.filter(device =>
    descriptorMatches(config, device),
  );

  return resolveUniqueMatch(descriptorMatchesList);
};

export class UsbDeviceService {
  constructor({
    eventEmitter = null,
    nativeModule = NativeModules.UsbPrinter,
    platform = Platform.OS,
  } = {}) {
    this.nativeModule = nativeModule;
    this.platform = platform;
    this.eventEmitter = eventEmitter;
  }

  assertAvailable() {
    if (this.platform !== 'android') {
      throw createUsbError(
        'USB_ANDROID_ONLY',
        'USB thermal printing is Android-only.',
      );
    }

    if (!this.nativeModule) {
      throw createUsbError(
        'USB_MODULE_UNAVAILABLE',
        'The Android USB printer module is unavailable in this build.',
      );
    }
  }

  async isUsbHostSupported() {
    this.assertAvailable();

    return this.nativeModule.isUsbHostSupported();
  }

  async getConnectedDevices() {
    this.assertAvailable();

    const devices = await this.nativeModule.getConnectedDevices();

    return (Array.isArray(devices) ? devices : []).sort((left, right) =>
      String(left?.productName || left?.deviceName || '').localeCompare(
        String(right?.productName || right?.deviceName || ''),
      ),
    );
  }

  async getPrinterCandidates() {
    const devices = await this.getConnectedDevices();

    return devices.map(device => ({
      ...device,
      usbType: classifyUsbDevice(device),
      supported: isSupportedUsbPrinter(device),
    }));
  }

  async hasPermission(device) {
    this.assertAvailable();

    if (!device?.deviceName) {
      throw createUsbError('USB_DEVICE_REQUIRED', 'Select a USB printer first.');
    }

    return this.nativeModule.hasPermission(device.deviceName);
  }

  async ensurePermission(device, { request = false } = {}) {
    if (await this.hasPermission(device)) {
      return device;
    }

    if (!request) {
      throw createUsbError(
        'USB_PERMISSION_REQUIRED',
        'USB permission is required for the saved printer.',
      );
    }

    const granted = await this.nativeModule.requestPermission(device.deviceName);

    if (!granted) {
      throw createUsbError(
        'USB_PERMISSION_DENIED',
        'USB permission is required to use this printer.',
      );
    }

    const refreshedDevices = await this.getConnectedDevices();
    const refreshed = refreshedDevices.find(
      current => current.deviceName === device.deviceName,
    );

    if (!refreshed) {
      throw createUsbError(
        'USB_DEVICE_NOT_FOUND',
        'The selected USB printer was disconnected during permission setup.',
      );
    }

    return refreshed;
  }

  async authorizeSelection(device) {
    if (!isSupportedUsbPrinter(device)) {
      getStableUsbIdentity(device);
    }

    const permittedDevice = await this.ensurePermission(device, {
      request: true,
    });

    return {
      device: permittedDevice,
      identity: getStableUsbIdentity(permittedDevice),
    };
  }

  async resolveSavedDevice(config, { requestPermission = false } = {}) {
    const devices = await this.getConnectedDevices();
    let matched = matchSavedUsbDevice(config, devices);

    matched = await this.ensurePermission(matched, {
      request: requestPermission,
    });

    if (config?.serialNumber) {
      const refreshedDevices = await this.getConnectedDevices();

      matched = matchSavedUsbDevice(config, refreshedDevices);
    }

    const stableIdentity = getStableUsbIdentity(matched);

    if (
      config?.usbType &&
      config.usbType !== stableIdentity.usbType
    ) {
      throw createUsbError(
        'USB_DEVICE_TYPE_CHANGED',
        'The connected USB device no longer exposes the saved printer interface type.',
      );
    }

    return matched;
  }

  async testDevice(device) {
    this.assertAvailable();

    return this.nativeModule.testConnection(device.deviceName);
  }

  async writeDevice(device, data) {
    this.assertAvailable();

    if (!data) {
      throw createUsbError('USB_DATA_EMPTY', 'Printer data is empty.');
    }

    // One native invocation is one logical receipt attempt. The native layer
    // may chunk sequentially, but neither layer reopens or restarts the buffer.
    return this.nativeModule.writeBase64(
      device.deviceName,
      data.toString('base64'),
    );
  }

  addConnectionListener(listener) {
    this.assertAvailable();

    if (!this.eventEmitter) {
      this.eventEmitter = new NativeEventEmitter(this.nativeModule);
    }

    const attached = this.eventEmitter.addListener(
      USB_DEVICE_EVENTS.ATTACHED,
      device => listener({ device, type: 'attached' }),
    );
    const detached = this.eventEmitter.addListener(
      USB_DEVICE_EVENTS.DETACHED,
      device => listener({ device, type: 'detached' }),
    );

    return {
      remove: () => {
        attached.remove();
        detached.remove();
      },
    };
  }
}

export default new UsbDeviceService();
