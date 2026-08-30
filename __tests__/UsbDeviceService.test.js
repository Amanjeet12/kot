import {
  UsbDeviceService,
  classifyUsbDevice,
  findWritableUsbPath,
  getStableUsbIdentity,
  getUsbDeviceRuntimeIdentity,
  isSupportedUsbPrinter,
  matchSavedUsbDevice,
} from '../src/services/printer/usb/UsbDeviceService';
import { USB_TYPES } from '../src/services/printer/printerTypes';

const bulkOut = {
  address: 1,
  direction: 'OUT',
  index: 0,
  maxPacketSize: 64,
  type: 'BULK',
};

const printerDevice = {
  deviceId: 12,
  deviceName: '/dev/bus/usb/001/002',
  hasPermission: true,
  interfaces: [
    {
      class: 7,
      endpoints: [bulkOut],
      index: 0,
      protocol: 2,
      subclass: 1,
    },
  ],
  manufacturerName: 'Workfood Hardware',
  productId: 5678,
  productName: 'POS-80',
  serialNumber: 'WF-001',
  vendorId: 1234,
};

const savedConfig = {
  ...getStableUsbIdentity(printerDevice),
  connectionType: 'usb',
};

const createNativeModule = () => ({
  addListener: jest.fn(),
  getConnectedDevices: jest.fn().mockResolvedValue([]),
  hasPermission: jest.fn().mockResolvedValue(true),
  isUsbHostSupported: jest.fn().mockResolvedValue(true),
  removeListeners: jest.fn(),
  requestPermission: jest.fn().mockResolvedValue(true),
  testConnection: jest.fn().mockResolvedValue({ success: true }),
  writeBase64: jest.fn().mockResolvedValue({ success: true }),
});

describe('UsbDeviceService', () => {
  it('handles no connected USB devices', async () => {
    const service = new UsbDeviceService({
      nativeModule: createNativeModule(),
      platform: 'android',
    });

    await expect(service.getConnectedDevices()).resolves.toEqual([]);
  });

  it('returns one supported printer and preserves multiple enumerated devices', async () => {
    const nativeModule = createNativeModule();
    const unsupported = {
      ...printerDevice,
      deviceId: 13,
      deviceName: '/dev/bus/usb/001/003',
      interfaces: [{ class: 3, endpoints: [bulkOut], index: 0 }],
      productName: 'Keyboard',
    };
    nativeModule.getConnectedDevices.mockResolvedValue([
      printerDevice,
      unsupported,
    ]);
    const service = new UsbDeviceService({ nativeModule, platform: 'android' });

    const candidates = await service.getPrinterCandidates();

    expect(candidates).toHaveLength(2);
    expect(candidates.find(item => item.productName === 'POS-80')).toMatchObject({
      supported: true,
      usbType: USB_TYPES.PRINTER_CLASS,
    });
    expect(candidates.find(item => item.productName === 'Keyboard')).toMatchObject({
      supported: false,
      usbType: USB_TYPES.UNSUPPORTED,
    });
  });

  it('classifies Printer Class and selects its BULK OUT path', () => {
    expect(classifyUsbDevice(printerDevice)).toBe(USB_TYPES.PRINTER_CLASS);
    expect(findWritableUsbPath(printerDevice)).toMatchObject({
      endpoint: bulkOut,
      interface: printerDevice.interfaces[0],
      usbType: USB_TYPES.PRINTER_CLASS,
    });
    expect(isSupportedUsbPrinter(printerDevice)).toBe(true);
  });

  it('supports a vendor-specific BULK OUT printer path', () => {
    const vendorDevice = {
      ...printerDevice,
      interfaces: [{ class: 255, endpoints: [bulkOut], index: 2 }],
    };

    expect(classifyUsbDevice(vendorDevice)).toBe(USB_TYPES.VENDOR_SPECIFIC);
    expect(findWritableUsbPath(vendorDevice)?.interface.index).toBe(2);
  });

  it('rejects USB serial and unrelated USB classes', () => {
    const serialDevice = {
      ...printerDevice,
      interfaces: [{ class: 10, endpoints: [bulkOut], index: 1 }],
    };
    const unsupported = {
      ...printerDevice,
      interfaces: [{ class: 3, endpoints: [bulkOut], index: 0 }],
    };

    expect(classifyUsbDevice(serialDevice)).toBe(USB_TYPES.SERIAL);
    expect(findWritableUsbPath(serialDevice)).toBeNull();
    expect(() => getStableUsbIdentity(serialDevice)).toThrow(
      'supported serial driver',
    );
    expect(classifyUsbDevice(unsupported)).toBe(USB_TYPES.UNSUPPORTED);
    expect(findWritableUsbPath(unsupported)).toBeNull();
  });

  it('matches by stable serial when the temporary device path changes', () => {
    const reconnected = {
      ...printerDevice,
      deviceId: 41,
      deviceName: '/dev/bus/usb/001/009',
    };

    expect(getUsbDeviceRuntimeIdentity(reconnected)).not.toBe(
      getUsbDeviceRuntimeIdentity(printerDevice),
    );
    expect(matchSavedUsbDevice(savedConfig, [reconnected])).toBe(reconnected);
  });

  it('matches by VID PID and manufacturer product when serial is unavailable', () => {
    const withoutSerial = { ...printerDevice, serialNumber: '' };
    const config = { ...savedConfig, serialNumber: '' };

    expect(matchSavedUsbDevice(config, [withoutSerial])).toBe(withoutSerial);
  });

  it('rejects multiple identical matching devices instead of choosing randomly', () => {
    const config = { ...savedConfig, serialNumber: '' };
    const first = { ...printerDevice, serialNumber: '' };
    const second = {
      ...first,
      deviceId: 13,
      deviceName: '/dev/bus/usb/001/003',
    };

    expect(() => matchSavedUsbDevice(config, [first, second])).toThrow(
      expect.objectContaining({ code: 'MULTIPLE_USB_PRINTERS_MATCH' }),
    );
  });

  it('reports a disconnected saved device', () => {
    expect(() => matchSavedUsbDevice(savedConfig, [])).toThrow(
      expect.objectContaining({ code: 'USB_DEVICE_NOT_FOUND' }),
    );
  });

  it('does not request permission during passive resolution', async () => {
    const nativeModule = createNativeModule();
    nativeModule.getConnectedDevices.mockResolvedValue([printerDevice]);
    nativeModule.hasPermission.mockResolvedValue(false);
    const service = new UsbDeviceService({ nativeModule, platform: 'android' });

    await expect(service.resolveSavedDevice(savedConfig)).rejects.toMatchObject({
      code: 'USB_PERMISSION_REQUIRED',
    });
    expect(nativeModule.requestPermission).not.toHaveBeenCalled();
  });

  it('requests permission only for an explicit selection and refreshes descriptors', async () => {
    const nativeModule = createNativeModule();
    const beforePermission = { ...printerDevice, serialNumber: '' };
    nativeModule.hasPermission.mockResolvedValue(false);
    nativeModule.getConnectedDevices.mockResolvedValue([printerDevice]);
    const service = new UsbDeviceService({ nativeModule, platform: 'android' });

    await expect(service.authorizeSelection(beforePermission)).resolves.toMatchObject({
      identity: expect.objectContaining({ serialNumber: 'WF-001' }),
    });
    expect(nativeModule.requestPermission).toHaveBeenCalledWith(
      beforePermission.deviceName,
    );
    expect(nativeModule.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('returns a clear permission-denied error', async () => {
    const nativeModule = createNativeModule();
    nativeModule.hasPermission.mockResolvedValue(false);
    nativeModule.requestPermission.mockResolvedValue(false);
    const service = new UsbDeviceService({ nativeModule, platform: 'android' });

    await expect(
      service.ensurePermission(printerDevice, { request: true }),
    ).rejects.toMatchObject({ code: 'USB_PERMISSION_DENIED' });
  });
});
