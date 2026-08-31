import React from 'react';
import {AppState} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';

let mockUsbListener;
const mockUsbSubscriptionRemove = jest.fn();

jest.mock('../src/services/printer/PrinterManager', () => ({
  __esModule: true,
  default: {
    getPrinter: jest.fn(),
    printReceipt: jest.fn(),
    printTestPage: jest.fn(),
    removePrinter: jest.fn(),
    savePrinter: jest.fn(),
    testConnection: jest.fn(),
  },
}));

jest.mock('../src/services/printer/usb/UsbDeviceService', () => ({
  __esModule: true,
  default: {
    addConnectionListener: jest.fn(listener => {
      mockUsbListener = listener;

      return {remove: mockUsbSubscriptionRemove};
    }),
  },
}));

import mockPrinterManager from '../src/services/printer/PrinterManager';
import mockUsbDeviceService from '../src/services/printer/usb/UsbDeviceService';

import {
  getPrinterHealthCheckInterval,
  PRINTER_STATUS,
  PrinterProvider,
  usePrinter,
} from '../src/contexts/PrinterContext';

const savedPrinter = {host: '192.168.1.12', port: 9100, name: 'Kitchen'};
const savedBluetoothPrinter = {
  connectionType: 'bluetooth',
  deviceAddress: '00:11:22:33:44:55',
  deviceName: 'POS-80',
  name: 'Kitchen',
};
const savedUsbPrinter = {
  connectionType: 'usb',
  interfaceClass: 7,
  name: 'Kitchen',
  productId: 5678,
  serialNumber: 'WF-001',
  usbType: 'printer_class',
  vendorId: 1234,
};

let latestContext;

const ContextProbe = () => {
  latestContext = usePrinter();

  return null;
};

const renderProvider = async () => {
  let renderer;

  await act(async () => {
    renderer = ReactTestRenderer.create(
      <PrinterProvider>
        <ContextProbe />
      </PrinterProvider>,
    );

    await Promise.resolve();
    await Promise.resolve();
  });

  return renderer;
};

const unmountProvider = async renderer => {
  await act(async () => {
    renderer.unmount();
  });
};

describe('PrinterProvider', () => {
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    AppState.addEventListener.mockImplementation(() => ({remove: jest.fn()}));
    latestContext = null;
    mockUsbListener = null;
    mockPrinterManager.getPrinter.mockResolvedValue(savedPrinter);
    mockPrinterManager.testConnection.mockResolvedValue({success: true});
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  it('loads and connects a saved printer on startup', async () => {
    const renderer = await renderProvider();

    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenCalledWith(savedPrinter, {
      requestPermission: false,
    });

    await unmountProvider(renderer);
  });

  it('sets disconnected when the initial connection fails', async () => {
    mockPrinterManager.testConnection.mockRejectedValue(
      new Error('Printer offline'),
    );

    const renderer = await renderProvider();

    expect(latestContext.status).toBe(PRINTER_STATUS.DISCONNECTED);

    await unmountProvider(renderer);
  });

  it('loads and connects a saved Bluetooth printer on startup', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedBluetoothPrinter);

    const renderer = await renderProvider();

    expect(latestContext.printer).toEqual(savedBluetoothPrinter);
    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenCalledWith(
      savedBluetoothPrinter,
      {requestPermission: false},
    );

    await unmountProvider(renderer);
  });

  it('sets disconnected when saved Bluetooth startup connection fails', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedBluetoothPrinter);
    mockPrinterManager.testConnection.mockRejectedValue(
      new Error('Bluetooth printer offline'),
    );

    const renderer = await renderProvider();

    expect(latestContext.printer).toEqual(savedBluetoothPrinter);
    expect(latestContext.status).toBe(PRINTER_STATUS.DISCONNECTED);

    await unmountProvider(renderer);
  });

  it('sets not configured when no printer is saved', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(null);

    const renderer = await renderProvider();

    expect(latestContext.status).toBe(PRINTER_STATUS.NOT_CONFIGURED);
    expect(mockPrinterManager.testConnection).not.toHaveBeenCalled();

    await unmountProvider(renderer);
  });

  it('retries a disconnected printer', async () => {
    mockPrinterManager.testConnection
      .mockRejectedValueOnce(new Error('Printer offline'))
      .mockResolvedValueOnce({success: true});

    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.retryConnection();
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenLastCalledWith(
      savedPrinter,
      {requestPermission: true},
    );

    await unmountProvider(renderer);
  });

  it('manually retries a disconnected Bluetooth printer', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedBluetoothPrinter);
    mockPrinterManager.testConnection
      .mockRejectedValueOnce(new Error('Bluetooth printer offline'))
      .mockResolvedValueOnce({success: true});

    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.retryConnection();
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenLastCalledWith(
      savedBluetoothPrinter,
      {requestPermission: true},
    );

    await unmountProvider(renderer);
  });

  it('sets connected after a successful fresh print', async () => {
    mockPrinterManager.testConnection.mockRejectedValue(
      new Error('Printer offline'),
    );
    mockPrinterManager.printReceipt.mockResolvedValue({success: true});

    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.printReceipt({id: 42});
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);

    await unmountProvider(renderer);
  });

  it('sets disconnected after a failed print', async () => {
    mockPrinterManager.printReceipt.mockRejectedValue(
      new Error('Write failed'),
    );

    const renderer = await renderProvider();

    await act(async () => {
      await expect(latestContext.printReceipt({id: 42})).rejects.toThrow(
        'Write failed',
      );
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.DISCONNECTED);

    await unmountProvider(renderer);
  });

  it('removes a printer and resets global status', async () => {
    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.removePrinter();
    });

    expect(mockPrinterManager.removePrinter).toHaveBeenCalledTimes(1);
    expect(latestContext.status).toBe(PRINTER_STATUS.NOT_CONFIGURED);
    expect(latestContext.printer).toBeNull();

    await unmountProvider(renderer);
  });

  it('updates global status after a successful test print', async () => {
    mockPrinterManager.testConnection.mockRejectedValue(
      new Error('Printer offline'),
    );
    mockPrinterManager.printTestPage.mockResolvedValue({success: true});

    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.printTestPage(savedPrinter);
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);

    await unmountProvider(renderer);
  });

  it('persists one Bluetooth printer and refreshes its global status', async () => {
    mockPrinterManager.savePrinter.mockResolvedValue(savedBluetoothPrinter);

    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.savePrinter(savedBluetoothPrinter);
    });

    expect(mockPrinterManager.savePrinter).toHaveBeenCalledWith(
      savedBluetoothPrinter,
    );
    expect(latestContext.printer).toEqual(savedBluetoothPrinter);
    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);

    await unmountProvider(renderer);
  });

  it('persists one USB printer through the existing context and checks it interactively', async () => {
    mockPrinterManager.savePrinter.mockResolvedValue(savedUsbPrinter);

    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.savePrinter(savedUsbPrinter);
    });

    expect(mockPrinterManager.savePrinter).toHaveBeenCalledWith(savedUsbPrinter);
    expect(latestContext.printer).toEqual(savedUsbPrinter);
    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenLastCalledWith(
      savedUsbPrinter,
      {requestPermission: true},
    );

    await unmountProvider(renderer);
  });

  it('updates USB global status after test and normal print outcomes', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
    mockPrinterManager.printTestPage.mockResolvedValue({success: true});
    mockPrinterManager.printReceipt.mockRejectedValueOnce(
      new Error('USB write failed'),
    );

    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.printTestPage(savedUsbPrinter);
    });
    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);

    await act(async () => {
      await expect(latestContext.printReceipt({id: 99})).rejects.toThrow(
        'USB write failed',
      );
    });
    expect(latestContext.status).toBe(PRINTER_STATUS.DISCONNECTED);

    mockPrinterManager.printReceipt.mockResolvedValueOnce({success: true});
    await act(async () => {
      await latestContext.printReceipt({id: 100});
    });
    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);

    await unmountProvider(renderer);
  });

  it('loads a saved USB printer passively and becomes connected', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);

    const renderer = await renderProvider();

    expect(latestContext.printer).toEqual(savedUsbPrinter);
    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenCalledWith(
      savedUsbPrinter,
      {requestPermission: false},
    );
    expect(mockUsbDeviceService.addConnectionListener).toHaveBeenCalledTimes(1);

    await unmountProvider(renderer);
  });

  it('loads a disconnected USB printer without opening a permission dialog', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
    mockPrinterManager.testConnection.mockRejectedValue(
      Object.assign(new Error('USB permission required'), {
        code: 'USB_PERMISSION_REQUIRED',
      }),
    );

    const renderer = await renderProvider();

    expect(latestContext.status).toBe(PRINTER_STATUS.DISCONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenCalledWith(
      savedUsbPrinter,
      {requestPermission: false},
    );

    await unmountProvider(renderer);
  });

  it('manually retries USB with interactive permission enabled', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
    mockPrinterManager.testConnection
      .mockRejectedValueOnce(new Error('USB offline'))
      .mockResolvedValueOnce({success: true});

    const renderer = await renderProvider();

    await act(async () => {
      await latestContext.retryConnection();
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenLastCalledWith(
      savedUsbPrinter,
      {requestPermission: true},
    );

    await unmountProvider(renderer);
  });

  it('shows checking while a manual USB retry is pending and then connects', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
    const renderer = await renderProvider();
    let resolveRetry;
    const pendingRetry = new Promise(resolve => {
      resolveRetry = resolve;
    });
    mockPrinterManager.testConnection.mockReturnValueOnce(pendingRetry);

    let retryPromise;
    act(() => {
      retryPromise = latestContext.retryConnection();
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.CHECKING);
    expect(latestContext.isChecking).toBe(true);

    await act(async () => {
      resolveRetry({success: true});
      await retryPromise;
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(latestContext.isChecking).toBe(false);

    await unmountProvider(renderer);
  });

  it.each([
    ['USB_PERMISSION_DENIED', 'USB permission denied'],
    ['USB_PERMISSION_TIMEOUT', 'USB permission timed out'],
    ['USB_DEVICE_NOT_FOUND', 'USB printer missing'],
  ])(
    'ends loading and exposes %s after an interactive USB retry failure',
    async (code, message) => {
      const retryError = Object.assign(new Error(message), {code});
      mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
      mockPrinterManager.testConnection.mockRejectedValue(retryError);
      const renderer = await renderProvider();

      await act(async () => {
        await expect(
          latestContext.retryConnection({throwOnError: true}),
        ).rejects.toBe(retryError);
      });

      expect(latestContext.status).toBe(PRINTER_STATUS.DISCONNECTED);
      expect(latestContext.isChecking).toBe(false);
      expect(latestContext.error).toBe(retryError);
      expect(mockPrinterManager.testConnection).toHaveBeenLastCalledWith(
        savedUsbPrinter,
        {requestPermission: true},
      );

      await unmountProvider(renderer);
    },
  );

  it('allows a second USB retry after the first interactive retry fails', async () => {
    const retryError = Object.assign(new Error('USB permission denied'), {
      code: 'USB_PERMISSION_DENIED',
    });
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
    mockPrinterManager.testConnection
      .mockRejectedValueOnce(new Error('USB unavailable on startup'))
      .mockRejectedValueOnce(retryError)
      .mockResolvedValueOnce({success: true});
    const renderer = await renderProvider();

    await act(async () => {
      await expect(
        latestContext.retryConnection({throwOnError: true}),
      ).rejects.toBe(retryError);
    });
    expect(latestContext.isChecking).toBe(false);

    await act(async () => {
      await expect(latestContext.retryConnection()).resolves.toBe(true);
    });

    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenCalledTimes(3);

    await unmountProvider(renderer);
  });

  it('prints directly from cached disconnected USB status and reconnects it', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
    mockPrinterManager.testConnection.mockRejectedValue(
      new Error('USB unavailable on startup'),
    );
    mockPrinterManager.printReceipt.mockResolvedValue({success: true});
    const renderer = await renderProvider();

    expect(latestContext.status).toBe(PRINTER_STATUS.DISCONNECTED);
    mockPrinterManager.testConnection.mockClear();

    await act(async () => {
      await latestContext.printReceipt({id: 101});
    });

    expect(mockPrinterManager.testConnection).not.toHaveBeenCalled();
    expect(mockPrinterManager.printReceipt).toHaveBeenCalledWith({id: 101});
    expect(latestContext.status).toBe(PRINTER_STATUS.CONNECTED);

    await unmountProvider(renderer);
  });

  it('rechecks the existing global USB status on attach or detach', async () => {
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);

    const renderer = await renderProvider();

    await act(async () => {
      await Promise.resolve();
    });
    mockPrinterManager.testConnection.mockRejectedValueOnce(
      new Error('USB detached'),
    );

    await act(async () => {
      await mockUsbListener({type: 'detached'});
    });

    expect(mockPrinterManager.testConnection).toHaveBeenCalledTimes(2);
    expect(latestContext.status).toBe(PRINTER_STATUS.DISCONNECTED);
    expect(mockPrinterManager.testConnection).toHaveBeenLastCalledWith(
      savedUsbPrinter,
      {requestPermission: false},
    );

    await unmountProvider(renderer);
    expect(mockUsbSubscriptionRemove).toHaveBeenCalled();
  });

  it('keeps a foreground USB health check passive', async () => {
    let appStateListener;
    const appStateSubscriptionRemove = jest.fn();
    const appStateSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((event, listener) => {
        appStateListener = listener;
        return {remove: appStateSubscriptionRemove};
      });
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
    const renderer = await renderProvider();
    mockPrinterManager.testConnection.mockClear();

    await act(async () => {
      appStateListener('background');
      appStateListener('active');
      await Promise.resolve();
    });

    expect(mockPrinterManager.testConnection).toHaveBeenCalledWith(
      savedUsbPrinter,
      {requestPermission: false},
    );

    await unmountProvider(renderer);
    expect(appStateSubscriptionRemove).toHaveBeenCalled();
    appStateSpy.mockRestore();
  });

  it('keeps the periodic USB health check passive', async () => {
    jest.useFakeTimers();
    let appStateListener;
    const appStateSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((event, listener) => {
        appStateListener = listener;
        return {remove: jest.fn()};
      });
    mockPrinterManager.getPrinter.mockResolvedValue(savedUsbPrinter);
    const renderer = await renderProvider();

    await act(async () => {
      appStateListener('background');
      appStateListener('active');
      await Promise.resolve();
    });
    mockPrinterManager.testConnection.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(300000);
      await Promise.resolve();
    });

    expect(mockPrinterManager.testConnection).toHaveBeenCalledTimes(1);
    expect(mockPrinterManager.testConnection).toHaveBeenCalledWith(
      savedUsbPrinter,
      {requestPermission: false},
    );

    await unmountProvider(renderer);
    appStateSpy.mockRestore();
  });

  it('uses network Bluetooth and infrequent USB health intervals', () => {
    expect(getPrinterHealthCheckInterval('network')).toBe(30000);
    expect(getPrinterHealthCheckInterval('bluetooth')).toBe(90000);
    expect(getPrinterHealthCheckInterval('usb')).toBe(300000);
  });

  it('schedules only one Bluetooth health check per interval', async () => {
    jest.useFakeTimers();
    const intervalSpy = jest.spyOn(global, 'setInterval');
    mockPrinterManager.getPrinter.mockResolvedValue(savedBluetoothPrinter);

    const renderer = await renderProvider();

    expect(intervalSpy).toHaveBeenCalledTimes(1);
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 90000);

    await unmountProvider(renderer);

    intervalSpy.mockRestore();
  });
});
