import {
  ORDER_STATUS,
  canChangeOrderStatus,
  normalizeOrderStatus,
} from '../src/constant/orderStatus';

describe('order status flow', () => {
  it('moves confirmed orders directly to ready', () => {
    expect(canChangeOrderStatus('confirmed', 'ready')).toBe(true);
    expect(canChangeOrderStatus('confirmed', 'preparing')).toBe(false);
  });

  it('keeps ready to delivered as the next transition', () => {
    expect(canChangeOrderStatus('ready', 'delivered')).toBe(true);
  });

  it('treats orders in the retired intermediate state as ready', () => {
    expect(normalizeOrderStatus('preparing')).toBe(ORDER_STATUS.READY);
  });
});
