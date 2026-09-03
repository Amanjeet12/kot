const MOCK_DELAY_MS = 350;

const customersByPhone = new Map([
  [
    '9546938484',
    {
      customer_id: 1001,
      name: 'Amanjeet Singh',
      phone: '9546938484',
    },
  ],
]);

const ordersByRequestKey = new Map();
let nextCustomerId = 1002;
let nextOrderId = 5001;

const wait = () => new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));

export const lookupMockCustomer = async phone => {
  await wait();

  return customersByPhone.get(phone) || null;
};

export const createMockCustomer = async ({ phone, name }) => {
  await wait();

  const existingCustomer = customersByPhone.get(phone);
  if (existingCustomer) return existingCustomer;

  const customer = {
    customer_id: nextCustomerId++,
    name: name.trim(),
    phone,
  };
  customersByPhone.set(phone, customer);

  return customer;
};

export const createMockPosOrder = async ({ requestKey, payload }) => {
  await wait();

  const existingOrder = ordersByRequestKey.get(requestKey);
  if (existingOrder) return existingOrder;

  const order = {
    ...payload,
    tuck_shop_order_id: nextOrderId,
    kot_id: nextOrderId++,
    status: 'confirmed',
  };
  ordersByRequestKey.set(requestKey, order);

  return order;
};
