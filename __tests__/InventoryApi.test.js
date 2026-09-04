const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('../src/api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

import {
  getInventory,
  getInventoryCounts,
  INVENTORY_ROUTES,
  updateInventoryStock,
} from '../src/api/inventoryApi';

describe('inventory API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a requested inventory page', async () => {
    const payload = {
      success: 1,
      pagination: { total: 29, start: 0, end: 20, hasNextPage: true },
      data: [],
    };
    mockGet.mockResolvedValueOnce({ data: payload });

    await expect(
      getInventory({ token: 'abc', start: 0, end: 20 }),
    ).resolves.toBe(payload);
    expect(mockGet).toHaveBeenCalledWith(INVENTORY_ROUTES.INVENTORY, {
      params: { start: 0, end: 20 },
      headers: { Authorization: 'Bearer abc' },
    });
  });

  it('fetches inventory status counts', async () => {
    const payload = {
      success: 1,
      data: { total: 29, available: 23, low_stock: 6 },
    };
    mockGet.mockResolvedValueOnce({ data: payload });

    await expect(getInventoryCounts({ token: 'abc' })).resolves.toBe(payload);
    expect(mockGet).toHaveBeenCalledWith(INVENTORY_ROUTES.COUNTS, {
      headers: { Authorization: 'Bearer abc' },
    });
  });

  it('posts stock changes in the entries wrapper', async () => {
    const entries = [
      { inventory_id: 58, quantity: 20, transactionType: 'stock_in' },
    ];
    const result = {
      count: 1,
      inventories: [{ inventory_id: 58, currentQuantity: 21 }],
    };
    mockPost.mockResolvedValueOnce({ data: { success: 1, data: result } });

    await expect(
      updateInventoryStock({ token: 'abc', entries }),
    ).resolves.toBe(result);
    expect(mockPost).toHaveBeenCalledWith(
      INVENTORY_ROUTES.UPDATE_STOCK,
      { entries },
      { headers: { Authorization: 'Bearer abc' } },
    );
  });

  it.each([
    ['inventory', () => getInventory({ token: 'abc' }), mockGet],
    ['counts', () => getInventoryCounts({ token: 'abc' }), mockGet],
    [
      'stock update',
      () => updateInventoryStock({ token: 'abc', entries: [] }),
      mockPost,
    ],
  ])('surfaces a failed %s response', async (_name, call, request) => {
    request.mockResolvedValueOnce({
      data: { success: 0, msg: 'Inventory request failed' },
    });

    await expect(call()).rejects.toThrow('Inventory request failed');
  });
});
