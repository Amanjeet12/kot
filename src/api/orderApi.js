import api from './axiosInstance';

export const ORDER_ROUTES = {
  ACTIVE_ORDERS: '/backend/kot/tuck_shop_orders',
  UNPRINTED_RECEIPTS: '/backend/kot/tuck_shop_orders/unprinted_receipts',
  ORDER_HISTORY: '/backend/kot/tuck_shop_orders_history',
  TODAY_TUCK_SHOP_MENU: '/backend/kot/today_tuck_shop_menu',
  CATEGORIES: '/backend/kot/categories',
  FIND_CUSTOMER_BY_PHONE: '/backend/kot/find_customer_by_phone',
  PLACE_TUCK_SHOP_ORDER_CASH: '/backend/kot/place_tuck_shop_order_cash',
};

export const findCustomerByPhone = async ({ token, phone }) => {
  const response = await api.post(
    ORDER_ROUTES.FIND_CUSTOMER_BY_PHONE,
    { phone },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || 'Unable to look up customer');
  }

  return data?.data || { exists: false, customer: null };
};

export const placeTuckShopOrderCash = async ({ token, order }) => {
  const response = await api.post(
    ORDER_ROUTES.PLACE_TUCK_SHOP_ORDER_CASH,
    order,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || 'Unable to place order');
  }

  return data?.data || data;
};

export const getUnprintedReceipts = async ({ token }) => {
  const response = await api.get(ORDER_ROUTES.UNPRINTED_RECEIPTS, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || 'Unable to fetch unprinted receipts');
  }

  return data;
};

export const markReceiptPrinted = async ({ token, tuckShopOrderId }) => {
  const response = await api.patch(
    `/backend/kot/tuck_shop_order/${tuckShopOrderId}/receipt/printed`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = response.data;

  if (data?.success === 0 || data?.success === '0') {
    throw new Error(data?.msg || 'Unable to mark receipt as printed');
  }

  return data;
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
