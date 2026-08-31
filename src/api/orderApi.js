import api from './axiosInstance';

export const ORDER_ROUTES = {
  ACTIVE_ORDERS: '/backend/kot/tuck_shop_orders',
  ORDER_HISTORY: '/backend/kot/tuck_shop_orders_history',
  TODAY_TUCK_SHOP_MENU: '/backend/kot/today_tuck_shop_menu',
  CATEGORIES: '/backend/kot/categories',
};

export const getTuckShopCategories = async ({ token }) => {
  const response = await api.get(ORDER_ROUTES.CATEGORIES, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || 'Unable to fetch categories');
  }

  return data;
};

export const getTodayTuckShopMenu = async ({ token }) => {
  const response = await api.get(ORDER_ROUTES.TODAY_TUCK_SHOP_MENU, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || "Unable to fetch today's tuck shop menu");
  }

  return data;
};

export const updateTuckShopMenuItemAvailability = async ({
  token,
  dailyMenuItemId,
  isAvailable,
}) => {
  const response = await api.patch(
    `/backend/kot/tuck_shop_menu_item/${dailyMenuItemId}/availability`,
    { isAvailable },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || 'Unable to update menu item availability');
  }

  return data;
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

export const getOrderHistory = async ({
  token,
  fromDate,
  toDate,
  start = 0,
  end = 20,
}) => {
  const response = await api.get(ORDER_ROUTES.ORDER_HISTORY, {
    params: {
      from_date: fromDate,
      to_date: toDate,
      start,
      end,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || 'Unable to fetch order history');
  }

  return data;
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
|   status: 'ready'
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
