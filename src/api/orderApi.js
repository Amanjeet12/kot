import api from './axiosInstance';

export const ORDER_ROUTES = {
  TUCK_SHOP_ORDERS: '/backend/kot/tuck_shop_orders',
};

export const getActiveOrders = async ({ token, start = 0, end = 20 }) => {
  const response = await api.get(ORDER_ROUTES.TUCK_SHOP_ORDERS, {
    params: {
      status: 'active',
      start,
      end,
    },

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
