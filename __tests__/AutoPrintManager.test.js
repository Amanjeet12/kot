import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

let mockSocket;
const mockPrintReceipt = jest.fn();

jest.mock('../src/contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket }),
}));

jest.mock('../src/contexts/PrinterContext', () => ({
  usePrinter: () => ({
    isConnected: false,
    printReceipt: mockPrintReceipt,
  }),
}));

import AutoPrintManager, {
  AUTO_PRINT_EVENT,
  getPrintableSocketOrder,
} from '../src/services/printer/AutoPrintManager';

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

const rawOrder = (id, status = 'confirmed') => ({
  tuck_shop_order_id: id,
  kot_id: `K-${id}`,
  status,
  total_price: 50,
  createdAt: '2026-09-02T10:00:00.000Z',
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

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('AutoPrintManager', () => {
  let renderer;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSocket = createSocket();
    mockPrintReceipt.mockResolvedValue({ success: true });

    await act(async () => {
      renderer = ReactTestRenderer.create(<AutoPrintManager />);
      await flush();
    });
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
    }
  });

  it('prints one confirmed socket order using the existing mapped shape', async () => {
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
  });

  it('deduplicates the same order ID before asynchronous printing', async () => {
    await act(async () => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
  });

  it('prints different orders sequentially in FIFO order', async () => {
    let finishFirst;
    let activePrints = 0;
    let maximumActivePrints = 0;
    const starts = [];
    const firstPrint = new Promise(resolve => {
      finishFirst = resolve;
    });

    mockPrintReceipt.mockImplementation(order => {
      starts.push(order.id);
      activePrints += 1;
      maximumActivePrints = Math.max(maximumActivePrints, activePrints);

      const operation = order.id === 101 ? firstPrint : Promise.resolve();

      return operation.finally(() => {
        activePrints -= 1;
      });
    });

    act(() => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(102));
    });

    expect(starts).toEqual([101]);

    await act(async () => {
      finishFirst();
      await flush();
    });

    expect(starts).toEqual([101, 102]);
    expect(maximumActivePrints).toBe(1);
  });

  it('does not retry a failed order and continues with the next order', async () => {
    mockPrintReceipt
      .mockRejectedValueOnce(new Error('Printer offline'))
      .mockResolvedValueOnce({ success: true });

    await act(async () => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101));
      mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(102));
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(2);
    expect(mockPrintReceipt.mock.calls.map(([order]) => order.id)).toEqual([
      101, 102,
    ]);
  });

  it.each(['pending', 'cancelled', 'failed', 'delivered', 'preparing'])(
    'does not print a %s order',
    async status => {
      await act(async () => {
        mockSocket.emitEvent(AUTO_PRINT_EVENT, rawOrder(101, status));
        await flush();
      });

      expect(mockPrintReceipt).not.toHaveBeenCalled();
    },
  );

  it('does not require cached connected status before printing', async () => {
    await act(async () => {
      mockSocket.emitEvent(AUTO_PRINT_EVENT, { order: rawOrder(101) });
      await flush();
    });

    expect(mockPrintReceipt).toHaveBeenCalledTimes(1);
  });

  it('removes its exact listener on unmount', async () => {
    const handler = mockSocket.getHandler(AUTO_PRINT_EVENT);

    await act(async () => renderer.unmount());
    renderer = null;

    expect(mockSocket.off).toHaveBeenCalledWith(AUTO_PRINT_EVENT, handler);
  });

  it('moves one listener from an old socket to a replacement socket', async () => {
    const oldSocket = mockSocket;
    const oldHandler = oldSocket.getHandler(AUTO_PRINT_EVENT);
    const replacementSocket = createSocket();
    mockSocket = replacementSocket;

    await act(async () => {
      renderer.update(<AutoPrintManager />);
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

  it('does not print on mount or socket replacement without an event', async () => {
    mockSocket = createSocket();

    await act(async () => {
      renderer.update(<AutoPrintManager />);
      await flush();
    });

    expect(mockPrintReceipt).not.toHaveBeenCalled();
  });

  it('rejects an ID-only payload because no detail endpoint exists', () => {
    expect(
      getPrintableSocketOrder({ tuck_shop_order_id: 101, status: 'confirmed' }),
    ).toBeNull();
  });
});
