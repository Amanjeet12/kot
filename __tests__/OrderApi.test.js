const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockPost = jest.fn();

jest.mock('../src/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    patch: (...args) => mockPatch(...args),
    post: (...args) => mockPost(...args),
  },
}));

import {
  findCustomerByPhone,
  getUnprintedReceipts,
  markReceiptPrinted,
  ORDER_ROUTES,
  placeTuckShopOrderCash,
} from '../src/api/orderApi';

describe('receipt recovery order API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets unprinted receipts with the existing bearer-token style', async () => {
    const payload = { success: 1, count: 0, data: [] };
    mockGet.mockResolvedValueOnce({ data: payload });

    await expect(getUnprintedReceipts({ token: 'abc' })).resolves.toBe(payload);
    expect(mockGet).toHaveBeenCalledWith(
      ORDER_ROUTES.UNPRINTED_RECEIPTS,
      { headers: { Authorization: 'Bearer abc' } },
    );
  });

  it('marks a receipt printed through the provided PATCH route', async () => {
    const payload = { success: 1 };
    mockPatch.mockResolvedValueOnce({ data: payload });

    await expect(
      markReceiptPrinted({ token: 'abc', tuckShopOrderId: 150 }),
    ).resolves.toBe(payload);
    expect(mockPatch).toHaveBeenCalledWith(
      '/backend/kot/tuck_shop_order/150/receipt/printed',
      {},
      { headers: { Authorization: 'Bearer abc' } },
    );
  });

  it.each([
    ['GET', getUnprintedReceipts, 'Unable to fetch receipts'],
    [
      'PATCH',
      () => markReceiptPrinted({ token: 'abc', tuckShopOrderId: 150 }),
      'Unable to mark receipt',
    ],
  ])(
    'uses existing success-zero error handling for %s',
    async (method, call, message) => {
      const request = method === 'GET' ? mockGet : mockPatch;
      request.mockResolvedValueOnce({
        data: { success: 0, msg: message },
      });

      const operation = method === 'GET' ? call({ token: 'abc' }) : call();

      await expect(operation).rejects.toThrow(message);
    },
  );
});

describe('cash POS order API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('looks up a customer using the international phone number', async () => {
    const result = { exists: false, customer: null };
    mockPost.mockResolvedValueOnce({
      data: { success: 1, msg: 'Customer not found', data: result },
    });

    await expect(
      findCustomerByPhone({ token: 'abc', phone: '+919546938484' }),
    ).resolves.toBe(result);
    expect(mockPost).toHaveBeenCalledWith(
      ORDER_ROUTES.FIND_CUSTOMER_BY_PHONE,
      { phone: '+919546938484' },
      { headers: { Authorization: 'Bearer abc' } },
    );
  });

  it('places a cash order with only the fields accepted by the route', async () => {
    const order = {
      phone: '+916367630600',
      name: 'Amanjeet',
      order_date: '2026-09-03',
      items: [{ daily_menu_item_id: 162, qty: 1 }],
    };
    const createdOrder = {
      order: { tuck_shop_order_id: 501, total_price: 110 },
      payment: { method: 'cash', amount: 110, status: 'completed' },
    };
    mockPost.mockResolvedValueOnce({
      data: { success: 1, data: createdOrder },
    });

    await expect(
      placeTuckShopOrderCash({ token: 'abc', order }),
    ).resolves.toBe(createdOrder);
    expect(mockPost).toHaveBeenCalledWith(
      ORDER_ROUTES.PLACE_TUCK_SHOP_ORDER_CASH,
      order,
      { headers: { Authorization: 'Bearer abc' } },
    );
  });

  it.each([
    [
      'customer lookup',
      () => findCustomerByPhone({ token: 'abc', phone: '+919546938484' }),
    ],
    [
      'cash order',
      () => placeTuckShopOrderCash({ token: 'abc', order: {} }),
    ],
  ])('surfaces an API error for %s', async (_operation, call) => {
    mockPost.mockResolvedValueOnce({
      data: { success: 0, msg: 'Request rejected' },
    });

    await expect(call()).rejects.toThrow('Request rejected');
  });
});
