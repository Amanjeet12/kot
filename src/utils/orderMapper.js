const formatOrderTime = value => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',

    day: '2-digit',

    month: 'short',

    hour: '2-digit',

    minute: '2-digit',

    hour12: true,
  });
};

export const mapTuckShopOrder = (order, rank = null) => {
  const mappedItems = (order?.items || []).map(item => ({
    id: item.tuck_shop_item_id,

    quantity: Number(item.qty || 0),

    name: item.itemName || '',

    description: item.description || '',

    category: item.category || '',

    type: item.type,

    categoryId: item.category_id,

    inventoryId: item.inventory_id,

    dailyMenuItemId: item.daily_menu_item_id,

    tuckShopItemId: item.tuck_shop_item_id,

    /*
     * Unit price
     */
    unitPrice: Number(item.price || 0),

    /*
     * Line total.
     *
     * Use this for UI price.
     *
     * qty 2 × ₹50
     * shows ₹100.
     */
    price: Number(item.total_price ?? item.price ?? 0),

    totalPrice: Number(item.total_price || 0),

    images: item.image || [],
  }));

  const totalQuantity = mappedItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

  return {
    /*
     * IMPORTANT:
     *
     * tuck_shop_order_id
     * is the actual order id.
     *
     * kot_id is kitchen/KOT id.
     */

    id: order.tuck_shop_order_id,

    orderNumber: order.tuck_shop_order_id,

    tuckShopOrderId: order.tuck_shop_order_id,

    kotId: order.kot_id,

    customerId: order.customer_id,

    locationId: order.location_id,

    rank,

    status: order.status,

    customerName: order.customer?.name || 'Customer',

    customer: order.customer,

    collectionPoint: order.location?.locationName || '',

    locationName: order.location?.locationName || '',

    location: order.location,

    totalAmount: Number(order.total_price || 0),

    totalQuantity,

    paymentMethod: order.payment_method,

    paymentType:
      order.payment_method === 'wallet'
        ? 'Wallet paid'
        : order.payment_method || '',

    transactionReference: order.transaction_id,

    orderDate: order.order_date,

    createdAt: order.createdAt,

    updatedAt: order.updatedAt,

    orderTime: formatOrderTime(order.createdAt),
    items: mappedItems,
  };
};
