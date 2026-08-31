export const ORDER_STATUS = {
  PENDING: 'pending',

  CONFIRMED: 'confirmed',

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

  confirmed: ['ready', 'cancelled'],

  ready: ['delivered'],

  delivered: [],

  cancelled: [],

  failed: [],
};

export const canChangeOrderStatus = (currentStatus, nextStatus) => {
  return (ORDER_STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
};

export const normalizeOrderStatus = status => {
  const normalizedStatus = String(status || '').toLowerCase().trim();

  // Orders left in the retired intermediate state behave as ready orders.
  return normalizedStatus === 'preparing'
    ? ORDER_STATUS.READY
    : normalizedStatus;
};
