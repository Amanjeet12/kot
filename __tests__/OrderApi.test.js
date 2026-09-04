const mockGet = jest.fn();
const mockPatch = jest.fn();

jest.mock('../src/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    patch: (...args) => mockPatch(...args),
  },
}));

import {
  getUnprintedReceipts,
  markReceiptPrinted,
  ORDER_ROUTES,
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
