import UsbDeviceService from '../usb/UsbDeviceService';

class UsbTransport {
  async test(config, options = {}) {
    const device = await UsbDeviceService.resolveSavedDevice(config, {
      requestPermission: options.requestPermission === true,
    });

    return UsbDeviceService.testDevice(device);
  }

  async send(config, data) {
    if (!data) {
      throw new Error('Printer data is empty.');
    }

    const device = await UsbDeviceService.resolveSavedDevice(config, {
      requestPermission: true,
    });

    return UsbDeviceService.writeDevice(device, data);
  }
}

export default new UsbTransport();
