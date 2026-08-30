import {
  UsbPrinterSpikeService,
  buildUsbTestReceipt,
  classifyUsbDevice,
  findWritableUsbPath,
  getUsbDeviceIdentity,
  isSameUsbDevice,
} from '../src/services/printer/usb/UsbPrinterSpike';

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
  interfaces: [
    {
      class: 7,
      endpoints: [bulkOut],
      index: 0,
      protocol: 2,
      subclass: 1,
    },
  ],
  productId: 5678,
  productName: 'POS-80',
  vendorId: 1234,
};

const createNativeModule = () => ({
  getConnectedDevices: jest.fn().mockResolvedValue([]),
  hasPermission: jest.fn().mockResolvedValue(true),
  isUsbHostSupported: jest.fn().mockResolvedValue(true),
  printBase64: jest.fn().mockResolvedValue({ success: true }),
  requestPermission: jest.fn().mockResolvedValue(true),
  testConnection: jest.fn().mockResolvedValue({ success: true }),
});

describe('UsbPrinterSpike', () => {
  it('handles no connected USB devices', async () => {
    const nativeModule = createNativeModule();
    const service = new UsbPrinterSpikeService(nativeModule, 'android');

    await expect(service.listDevices()).resolves.toEqual([]);
  });

  it('returns multiple devices in stable display-name order', async () => {
    const nativeModule = createNativeModule();
    nativeModule.getConnectedDevices.mockResolvedValue([
      { ...printerDevice, deviceId: 13, productName: 'Z Printer' },
      { ...printerDevice, deviceId: 14, productName: 'A Printer' },
    ]);
    const service = new UsbPrinterSpikeService(nativeModule, 'android');

    const devices = await service.listDevices();

    expect(devices.map(device => device.productName)).toEqual([
      'A Printer',
      'Z Printer',
    ]);
  });

  it('tracks a selected device by its complete enumerated identity', () => {
    const reEnumerated = { ...printerDevice };
    const differentProduct = { ...printerDevice, productId: 9999 };

    expect(getUsbDeviceIdentity(printerDevice)).toContain(printerDevice.deviceName);
    expect(isSameUsbDevice(printerDevice, reEnumerated)).toBe(true);
    expect(isSameUsbDevice(printerDevice, differentProduct)).toBe(false);
  });

  it('reports denied permission only for the selected device', async () => {
    const nativeModule = createNativeModule();
    nativeModule.hasPermission.mockResolvedValue(false);
    nativeModule.requestPermission.mockResolvedValue(false);
    const service = new UsbPrinterSpikeService(nativeModule, 'android');

    await expect(service.ensurePermission(printerDevice)).rejects.toMatchObject({
      code: 'USB_PERMISSION_DENIED',
    });
    expect(nativeModule.requestPermission).toHaveBeenCalledWith(
      printerDevice.deviceName,
    );
    expect(nativeModule.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('continues after permission is granted', async () => {
    const nativeModule = createNativeModule();
    nativeModule.hasPermission.mockResolvedValue(false);
    nativeModule.requestPermission.mockResolvedValue(true);
    const service = new UsbPrinterSpikeService(nativeModule, 'android');

    await expect(service.testConnection(printerDevice)).resolves.toEqual({
      success: true,
    });
    expect(nativeModule.testConnection).toHaveBeenCalledWith(
      printerDevice.deviceName,
    );
  });

  it('selects a Printer Class BULK OUT interface and endpoint', () => {
    expect(classifyUsbDevice(printerDevice)).toBe('printer_class');
    expect(findWritableUsbPath(printerDevice)).toEqual({
      classification: 'printer_class',
      endpoint: bulkOut,
      interface: printerDevice.interfaces[0],
    });
  });

  it('supports a vendor-specific BULK OUT path for descriptor testing', () => {
    const vendorDevice = {
      ...printerDevice,
      interfaces: [{ class: 255, endpoints: [bulkOut], index: 2 }],
    };

    expect(classifyUsbDevice(vendorDevice)).toBe('vendor_specific');
    expect(findWritableUsbPath(vendorDevice)?.interface.index).toBe(2);
  });

  it('rejects USB serial until a chipset-specific driver is selected', async () => {
    const serialDevice = {
      ...printerDevice,
      interfaces: [{ class: 10, endpoints: [bulkOut], index: 1 }],
    };
    const nativeModule = createNativeModule();
    const service = new UsbPrinterSpikeService(nativeModule, 'android');

    expect(classifyUsbDevice(serialDevice)).toBe('usb_serial');
    expect(findWritableUsbPath(serialDevice)).toBeNull();
    await expect(service.testConnection(serialDevice)).rejects.toMatchObject({
      code: 'USB_SERIAL_DRIVER_REQUIRED',
    });
    expect(nativeModule.testConnection).not.toHaveBeenCalled();
  });

  it('rejects unsupported interfaces without opening the USB device', async () => {
    const unsupported = {
      ...printerDevice,
      interfaces: [{ class: 3, endpoints: [bulkOut], index: 0 }],
    };
    const nativeModule = createNativeModule();
    const service = new UsbPrinterSpikeService(nativeModule, 'android');

    await expect(service.testConnection(unsupported)).rejects.toMatchObject({
      code: 'USB_WRITABLE_ENDPOINT_NOT_FOUND',
    });
    expect(nativeModule.testConnection).not.toHaveBeenCalled();
  });

  it('builds the tiny proof using the shared ESC POS protocol', () => {
    const receipt = buildUsbTestReceipt();
    const text = receipt.toString('utf8');

    expect([...receipt.subarray(0, 2)]).toEqual([0x1b, 0x40]);
    expect(text).toContain('WORKFOOD\n');
    expect(text).toContain('USB PRINTER TEST');
    expect(text).toContain('TEST SUCCESSFUL');
  });

  it('makes exactly one logical native receipt send and never retries it', async () => {
    const nativeModule = createNativeModule();
    nativeModule.printBase64.mockRejectedValue(
      Object.assign(new Error('partial transfer'), { code: 'USB_WRITE_FAILED' }),
    );
    const service = new UsbPrinterSpikeService(nativeModule, 'android');

    await expect(service.printTest(printerDevice)).rejects.toMatchObject({
      code: 'USB_WRITE_FAILED',
    });
    expect(nativeModule.printBase64).toHaveBeenCalledTimes(1);
    expect(nativeModule.printBase64).toHaveBeenCalledWith(
      printerDevice.deviceName,
      expect.any(String),
    );
  });
});
