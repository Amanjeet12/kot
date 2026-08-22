import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

jest.mock('../src/services/printer/PrinterManager', () => ({
  __esModule: true,
  default: {
    getPrinter: jest.fn(),
    printReceipt: jest.fn(),
    removePrinter: jest.fn(),
    savePrinter: jest.fn(),
    testConnection: jest.fn(),
  },
}));

import mockPrinterManager from '../src/services/printer/PrinterManager';

import {
  PRINTER_STATUS,
  PrinterProvider,
  usePrinter,
} from '../src/contexts/PrinterContext';

const savedPrinter = {host: '192.168.1.12', port: 9100, name: 'Kitchen'};

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
});
