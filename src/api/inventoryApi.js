import api from './axiosInstance';

export const INVENTORY_ROUTES = {
  INVENTORY: '/backend/kot/inventory',
  COUNTS: '/backend/kot/inventory/counts',
  UPDATE_STOCK: '/backend/kot/inventory/update_stock',
};

const throwForUnsuccessfulResponse = (data, fallbackMessage) => {
  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || fallbackMessage);
  }
};

export const getInventory = async ({ token, start = 0, end = 20 }) => {
  const response = await api.get(INVENTORY_ROUTES.INVENTORY, {
    params: { start, end },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = response.data;

  throwForUnsuccessfulResponse(data, 'Unable to fetch inventory');

  return data;
};

export const getInventoryCounts = async ({ token }) => {
  const response = await api.get(INVENTORY_ROUTES.COUNTS, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = response.data;

  throwForUnsuccessfulResponse(data, 'Unable to fetch inventory counts');

  return data;
};

export const updateInventoryStock = async ({ token, entries }) => {
  const response = await api.post(
    INVENTORY_ROUTES.UPDATE_STOCK,
    { entries },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = response.data;

  throwForUnsuccessfulResponse(data, 'Unable to update inventory stock');

  return data?.data || data;
};
