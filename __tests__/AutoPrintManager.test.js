import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

let mockSocket;
let mockIsSocketConnected;
const mockPrintReceipt = jest.fn();
const mockGetUnprintedReceipts = jest.fn();
const mockMarkReceiptPrinted = jest.fn();

jest.mock('../src/contexts/SocketContext', () => ({
  useSocket: () => ({
    socket: mockSocket,
    isSocketConnected: mockIsSocketConnected,
  }),
}));

jest.mock('../src/contexts/PrinterContext', () => ({
  usePrinter: () => ({
    isConnected: false,
    printReceipt: mockPrintReceipt,
  }),
}));

jest.mock('../src/api/orderApi', () => ({
  getUnprintedReceipts: (...args) => mockGetUnprintedReceipts(...args),
  markReceiptPrinted: (...args) => mockMarkReceiptPrinted(...args),
}));

import AutoPrintManager, {
  AUTO_PRINT_EVENT,
  getPrintableRecoveryOrder,
  getPrintableSocketOrder,
} from '../src/services/printer/AutoPrintManager';

const TOKEN = 'test-token';

const createSocket = () => {
  const listeners = new Map();

  return {
    on: jest.fn((event, handler) => listeners.set(event, handler)),
    off: jest.fn((event, handler) => {
      if (listeners.get(event) === handler) {
        listeners.delete(event);
      }
    }),
    emitEvent: (event, payload) => listeners.get(event)?.(payload),
    getHandler: event => listeners.get(event),
  };
};

const rawOrder = (id, status = 'confirmed', receiptPrinted = false) => ({
  tuck_shop_order_id: id,
  kot_id: `K-${id}`,
  status,
  receipt_printed: receiptPrinted,
  total_price: 50,
  createdAt: `2026-09-02T10:${String(id).padStart(2, '0')}:00.000Z`,
  customer: { name: 'Test Customer' },
  location: { locationName: 'Counter' },
  payment_method: 'wallet',
  items: [
    {
      tuck_shop_item_id: 1,
      itemName: 'Sandwich',
      qty: 1,
      price: 50,
      total_price: 50,
    },
  ],
});

const recoveryResponse = orders => ({
  success: 1,
  count: orders.length,
  data: orders,
});

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

const flush = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
};

describe('AutoPrintManager', () => {
  let renderer;
  let appStateHandler;
  let warnSpy;

  const mountManager = async () => {
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AutoPrintManager token={TOKEN} isAuthenticated />,
      );
      await flush();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = createSocket();
    mockIsSocketConnected = false;
    mockPrintReceipt.mockResolvedValue({ success: true });
    mockGetUnprintedReceipts.mockResolvedValue(recoveryResponse([]));
    mockMarkReceiptPrinted.mockResolvedValue({ success: 1 });
    appStateHandler = null;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (event, handler) => {
        if (event === 'change') {
          appStateHandler = handler;
        }

        return { remove: jest.fn() };
      },
    );
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
      renderer = null;
    }

    warnSpy.mockRestore();
    AppState.addEventListener.mockRestore();
  });

  it('prints a confirmed socket order and marks it printed exactly once', async () => {
    await mountManager();

    await act(async () => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
    expect(mockPrintReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 101,
        orderNumber: 101,
        status: 'confirmed',
        items: [expect.objectContaining({ name: 'Sandwich', quantity: 1 })],
      }),
    );
    expect(mockMarkReceiptPrinted).toHaveBeenCalledTimes(1);
    expect(mockMarkReceiptPrinted).toHaveBeenCalledWith({
      token: TOKEN,
      tuckShopOrderId: 101,
    });
  });

  it('does not mark a failed socket print as printed', async () => {
    mockPrintReceipt.mockRejectedValueOnce(new Error('Printer offline'));
    await mountManager();

    await act(async () => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
    expect(mockMarkReceiptPrinted).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('PRINT_FAILED order 101'),
    );
  });

  it('queues three recovered receipts sequentially in backend FIFO order', async () => {
    const firstPrint = deferred();
    const starts = [];
    let activePrints = 0;
    let maximumActivePrints = 0;

    mockGetUnprintedReceipts.mockResolvedValueOnce(
      recoveryResponse([rawOrder(101), rawOrder(102), rawOrder(103)]),
    );
    mockPrintReceipt.mockImplementation(order => {
      starts.push(order.id);
      activePrints += 1;
      maximumActivePrints = Math.max(maximumActivePrints, activePrints);
      const operation = order.id === 101 ? firstPrint.promise : Promise.resolve();

      return operation.finally(() => {
        activePrints -= 1;
      });
    });

    await mountManager();
    expect(starts).toEqual([101]);

    await act(async () => {
      firstPrint.resolve();
      await flush();
    });

    expect(starts).toEqual([101, 102, 103]);
    expect(maximumActivePrints).toBe(1);
    expect(mockMarkReceiptPrinted).toHaveBeenCalledTimes(3);
  });

  it.each(['delivered', 'confirmed'])(
    'prints and marks a recovered %s order',
    async status => {
      mockGetUnprintedReceipts.mockResolvedValueOnce(
        recoveryResponse([rawOrder(101, status)]),
      );

      await mountManager();

      expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
      expect(mockPrintReceipt.mock.calls[0][0].status).toBe(status);
      expect(mockMarkReceiptPrinted).toHaveBeenCalledTimes(1);
    },
  );

  it('defensively skips a printed order unexpectedly returned by recovery', async () => {
    mockGetUnprintedReceipts.mockResolvedValueOnce(
      recoveryResponse([rawOrder(101, 'delivered', true)]),
    );

    await mountManager();

    expect(mockPrintReceipt).not.toHaveBeenCalled();
    expect(mockMarkReceiptPrinted).not.toHaveBeenCalled();
  });

  it('does not resend a physical receipt when marking printed fails', async () => {
    mockMarkReceiptPrinted.mockRejectedValueOnce(new Error('API unavailable'));
    await mountManager();

    await act(async () => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
    expect(mockMarkReceiptPrinted).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('MARK_PRINTED_FAILED order 101'),
    );
  });

  it('deduplicates the same order arriving from recovery and the socket', async () => {
    const recovery = deferred();
    mockGetUnprintedReceipts.mockReturnValueOnce(recovery.promise);
    await mountManager();

    act(() => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
    });

    await act(async () => {
      recovery.resolve(recoveryResponse([rawOrder(101, 'delivered')]));
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
    expect(mockMarkReceiptPrinted).toHaveBeenCalledTimes(1);
  });

  it('allows only one recovery GET in flight across simultaneous triggers', async () => {
    const recovery = deferred();
    mockGetUnprintedReceipts.mockReturnValueOnce(recovery.promise);
    await mountManager();

    mockIsSocketConnected = true;
    await act(async () => {
      renderer.update(<AutoPrintManager token={TOKEN} isAuthenticated />);
      appStateHandler('active');
      await flush();
    });

    expect(mockGetUnprintedReceipts).toHaveBeenCalledTimes(1);

    await act(async () => {
      recovery.resolve(recoveryResponse([]));
      await flush();
    });
  });

  it('continues recovered FIFO processing after the first print fails', async () => {
    mockGetUnprintedReceipts.mockResolvedValueOnce(
      recoveryResponse([rawOrder(101), rawOrder(102), rawOrder(103)]),
    );
    mockPrintReceipt
      .mockRejectedValueOnce(new Error('Printer offline'))
      .mockResolvedValue({ success: true });

    await mountManager();

    expect(mockPrintReceipt.mock.calls.map(([order]) => order.id)).toEqual([
      101, 102, 103,
    ]);
    expect(
      mockMarkReceiptPrinted.mock.calls.map(
        ([args]) => args.tuckShopOrderId,
      ),
    ).toEqual([102, 103]);
  });

  it('keeps socket FIFO behavior and one active printer operation', async () => {
    const firstPrint = deferred();
    const starts = [];
    let activePrints = 0;
    let maximumActivePrints = 0;

    mockPrintReceipt.mockImplementation(order => {
      starts.push(order.id);
      activePrints += 1;
      maximumActivePrints = Math.max(maximumActivePrints, activePrints);
      const operation = order.id === 101 ? firstPrint.promise : Promise.resolve();

      return operation.finally(() => {
        activePrints -= 1;
      });
    });
    await mountManager();

    act(() => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(102));
    });

    expect(starts).toEqual([101]);

    await act(async () => {
      firstPrint.resolve();
      await flush();
    });

    expect(starts).toEqual([101, 102]);
    expect(maximumActivePrints).toBe(1);
  });

  it.each(['pending', 'cancelled', 'failed', 'delivered', 'preparing'])(
    'does not live-print a %s socket order',
    async status => {
      await mountManager();

      await act(async () => {
        mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101, status));
        await flush();
      });

      expect(mockPrintReceipt).not.toHaveBeenCalled();
      expect(mockMarkReceiptPrinted).not.toHaveBeenCalled();
    },
  );

  it('does not require cached connected status before printing', async () => {
    await mountManager();

    await act(async () => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, { order: rawOrder(101) });
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
  });

  it('removes its exact listener on unmount', async () => {
    await mountManager();
    const handler = mockSocket.getHandler(AUTO_PRINT_EVENT);

    await act(async () => renderer.unmount());
    renderer = null;

    expect(mockSocket.off).toHaveBeenCalledWith(AUTO_PRINT_EVENT, handler);
  });

  it('moves one listener from an old socket to a replacement socket', async () => {
    await mountManager();
    const oldSocket = mockSocket;
    const oldHandler = oldSocket.getHandler(AUTO_PRINT_EVENT);
    const replacementSocket = createSocket();
    mockSocket = replacementSocket;

    await act(async () => {
      renderer.update(<AutoPrintManager token={TOKEN} isAuthenticated />);
      await flush();
    });

    expect(oldSocket.off).toHaveBeenCalledWith(AUTO_PRINT_EVENT, oldHandler);
    expect(replacementSocket.on).toHaveBeenCalledTimes(1);

    await act(async () => {
      oldSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      replacementSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(102));
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
    expect(mockPrintReceipt.mock.calls[0][0].id).toBe(102);
  });

  it('rejects an ID-only socket payload', () => {
    expect(
      getPrintableSocketOrder({ tuck_shop_order_id: 101, status: 'confirmed' }),
    ).toBeNull();
  });

  it('uses the existing mapper for recovery without confirmed-status gating', () => {
    expect(getPrintableRecoveryOrder(rawOrder(101, 'ready'))).toEqual(
      expect.objectContaining({
        id: 101,
        status: 'ready',
        items: [expect.objectContaining({ name: 'Sandwich' })],
      }),
    );
  });
});
