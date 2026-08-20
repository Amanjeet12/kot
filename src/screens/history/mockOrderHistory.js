export const MOCK_ORDER_HISTORY = [
  {
    id: 4,
    kotNumber: 5,
    orderTime: '9:07 PM',

    customerName: 'Amanjeet',
    outletName: 'Main Cafeteria',

    items: [
      {
        id: 1,
        name: 'Chicken Burger',
        quantity: 1,
      },
    ],

    totalItems: 1,
    totalAmount: 40,
    status: 'completed',
  },

  {
    id: 3,
    kotNumber: 4,
    orderTime: '2:06 PM',

    customerName: 'Amanjeet',
    outletName: 'Main Cafeteria',

    items: [
      {
        id: 1,
        name: 'Corn Cup',
        quantity: 1,
      },
      {
        id: 2,
        name: 'Muffin',
        quantity: 1,
      },
      {
        id: 3,
        name: 'Chicken Burger',
        quantity: 1,
      },
    ],

    totalItems: 3,
    totalAmount: 135,
    status: 'completed',
  },

  {
    id: 2,
    kotNumber: 4,
    orderTime: '1:11 PM',

    customerName: 'Amanjeet',
    outletName: 'Main Cafeteria',

    items: [
      {
        id: 1,
        name: 'Corn Cup',
        quantity: 2,
      },
    ],

    totalItems: 2,
    totalAmount: 100,
    status: 'cancelled',
  },

  {
    id: 1,
    kotNumber: 3,
    orderTime: '12:48 PM',

    customerName: 'Neha S.',
    outletName: 'Main Cafeteria',

    items: [
      {
        id: 1,
        name: 'Muffin',
        quantity: 1,
      },
      {
        id: 2,
        name: 'Fresh Lime Soda',
        quantity: 1,
      },
    ],

    totalItems: 2,
    totalAmount: 80,
    status: 'completed',
  },
];
