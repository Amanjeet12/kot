import api from './axiosInstance';

export const ORDER_ROUTES = {
  ACTIVE_ORDERS: '/backend/kot/tuck_shop_orders',
};

export const getActiveOrders = async ({ token, start = 0, end = 20 }) => {
  const response = await api.get(ORDER_ROUTES.ACTIVE_ORDERS, {
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

/*
|--------------------------------------------------------------------------
| UPDATE ORDER STATUS
|--------------------------------------------------------------------------
|
| PATCH
| /backend/kot/tuck_shop_order/:id/status
|
| {
|   status: 'preparing'
| }
|
*/

export const updateTuckShopOrderStatus = async ({
  token,
  tuckShopOrderId,
  status,
}) => {
  const response = await api.patch(
    `/backend/kot/tuck_shop_order/${tuckShopOrderId}/status`,

    {
      status,
    },

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || 'Unable to update order status');
  }

  return data;
};
