import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

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

import mockPrinterManager from '../src/services/printer/PrinterManager';

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
    latestContext = null;
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
    expect(mockPrinterManager.testConnection).toHaveBeenCalledWith(savedPrinter);

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

  it('uses the existing network interval and a longer Bluetooth interval', () => {
    expect(getPrinterHealthCheckInterval('network')).toBe(30000);
    expect(getPrinterHealthCheckInterval('bluetooth')).toBe(90000);
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
