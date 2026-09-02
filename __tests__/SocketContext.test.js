import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

const mockInvalidateQueries = jest.fn();
const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
}));

jest.mock('../src/socket/socket', () => ({
  disconnectSocket: jest.fn(),
  initializeSocket: jest.fn(),
}));

jest.mock('../src/hooks/queries/useActiveOrders', () => ({
  ACTIVE_ORDERS_QUERY_KEY: ['tuck-shop-orders', 'active'],
}));

import { ACTIVE_ORDERS_QUERY_KEY } from '../src/hooks/queries/useActiveOrders';
import { SocketProvider } from '../src/contexts/SocketContext';
import { initializeSocket as mockInitializeSocket } from '../src/socket/socket';

const createSocket = () => {
  const listeners = new Map();

  return {
    id: 'socket-1',
    emit: jest.fn(),
    on: jest.fn((event, handler) => listeners.set(event, handler)),
    off: jest.fn((event, handler) => {
      if (listeners.get(event) === handler) {
        listeners.delete(event);
      }
    }),
    emitEvent: (event, payload) => listeners.get(event)?.(payload),
  };
};

describe('SocketProvider order invalidation', () => {
  it('keeps invalidating Active Orders for tuck_shop_order_created', async () => {
    const socket = createSocket();
    mockInitializeSocket.mockReturnValue(socket);
    let renderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SocketProvider token="token" user={{ id: 7 }} isAuthenticated={true}>
          {null}
        </SocketProvider>,
      );
      await Promise.resolve();
    });

    act(() => {
      socket.emitEvent('tuck_shop_order_created', {
        tuck_shop_order_id: 101,
      });
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ACTIVE_ORDERS_QUERY_KEY,
    });

    await act(async () => renderer.unmount());
  });
});
