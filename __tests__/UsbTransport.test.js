import { Buffer } from 'buffer';

jest.mock('../src/services/printer/usb/UsbDeviceService', () => ({
  __esModule: true,
  default: {
    resolveSavedDevice: jest.fn(),
    testDevice: jest.fn(),
    writeDevice: jest.fn(),
  },
}));

import UsbTransport from '../src/services/printer/transports/UsbTransport';
import UsbDeviceService from '../src/services/printer/usb/UsbDeviceService';

const config = {
  connectionType: 'usb',
  interfaceClass: 7,
  productId: 5678,
  usbType: 'printer_class',
  vendorId: 1234,
};
const device = { deviceName: '/dev/bus/usb/001/002' };

describe('UsbTransport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    UsbDeviceService.resolveSavedDevice.mockResolvedValue(device);
    UsbDeviceService.testDevice.mockResolvedValue({ success: true });
    UsbDeviceService.writeDevice.mockResolvedValue({ success: true });
  });

  it('finds and tests the current device without sending receipt bytes', async () => {
    await expect(UsbTransport.test(config)).resolves.toEqual({ success: true });

    expect(UsbDeviceService.resolveSavedDevice).toHaveBeenCalledWith(config, {
      requestPermission: false,
    });
    expect(UsbDeviceService.testDevice).toHaveBeenCalledWith(device);
    expect(UsbDeviceService.writeDevice).not.toHaveBeenCalled();
  });

  it('can request permission for an explicit connection test', async () => {
    await UsbTransport.test(config, { requestPermission: true });

    expect(UsbDeviceService.resolveSavedDevice).toHaveBeenCalledWith(config, {
      requestPermission: true,
    });
  });

  it('sends the supplied shared receipt buffer once', async () => {
    const data = Buffer.from('shared receipt');

    await expect(UsbTransport.send(config, data)).resolves.toEqual({
      success: true,
    });
    expect(UsbDeviceService.resolveSavedDevice).toHaveBeenCalledTimes(1);
    expect(UsbDeviceService.writeDevice).toHaveBeenCalledTimes(1);
    expect(UsbDeviceService.writeDevice).toHaveBeenCalledWith(device, data);
  });

  it('does not retry a failed or partially transferred receipt', async () => {
    UsbDeviceService.writeDevice.mockRejectedValue(
      Object.assign(new Error('failed after 64 bytes'), {
        code: 'USB_WRITE_FAILED',
      }),
    );

    await expect(UsbTransport.send(config, Buffer.from('receipt'))).rejects.toMatchObject({
      code: 'USB_WRITE_FAILED',
    });
    expect(UsbDeviceService.resolveSavedDevice).toHaveBeenCalledTimes(1);
    expect(UsbDeviceService.writeDevice).toHaveBeenCalledTimes(1);
  });

  it('resolves fresh USB access for every print request', async () => {
    await UsbTransport.send(config, Buffer.from('first'));
    await UsbTransport.send(config, Buffer.from('second'));

    expect(UsbDeviceService.resolveSavedDevice).toHaveBeenCalledTimes(2);
    expect(UsbDeviceService.writeDevice).toHaveBeenCalledTimes(2);
  });

  it('completes the connection test before the first print opens and writes once', async () => {
    const lifecycle = [];
    UsbDeviceService.testDevice.mockImplementationOnce(async () => {
      lifecycle.push('test-open-claim');
      lifecycle.push('test-release-close');
      return {success: true};
    });
    UsbDeviceService.writeDevice.mockImplementationOnce(async () => {
      lifecycle.push('print-open-claim-write-release-close');
      return {success: true};
    });

    await UsbTransport.test(config, {requestPermission: true});
    await UsbTransport.send(config, Buffer.from('test receipt'));

    expect(lifecycle).toEqual([
      'test-open-claim',
      'test-release-close',
      'print-open-claim-write-release-close',
    ]);
    expect(UsbDeviceService.testDevice).toHaveBeenCalledTimes(1);
    expect(UsbDeviceService.writeDevice).toHaveBeenCalledTimes(1);
  });
});
