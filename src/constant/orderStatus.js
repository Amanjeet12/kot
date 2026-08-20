export const ORDER_STATUS = {
  PENDING: 'pending',

  CONFIRMED: 'confirmed',

  PREPARING: 'preparing',

  READY: 'ready',

  DELIVERED: 'delivered',

  CANCELLED: 'cancelled',

  FAILED: 'failed',
};

/*
|--------------------------------------------------------------------------
| ALLOWED STATUS TRANSITIONS
|--------------------------------------------------------------------------
*/

export const ORDER_STATUS_TRANSITIONS = {
  pending: [],

  confirmed: ['preparing', 'cancelled'],

  preparing: ['ready'],

  ready: ['delivered'],

  delivered: [],

  cancelled: [],

  failed: [],
};

export const canChangeOrderStatus = (currentStatus, nextStatus) => {
  return (ORDER_STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
};
