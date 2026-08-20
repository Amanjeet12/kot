import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSelector } from 'react-redux';

import { updateTuckShopOrderStatus } from '../../api/orderApi';

import { ACTIVE_ORDERS_QUERY_KEY } from '../queries/useActiveOrders';

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  const token = useSelector(state => state.auth.token);

  return useMutation({
    mutationFn: ({ tuckShopOrderId, status }) =>
      updateTuckShopOrderStatus({
        token,
        tuckShopOrderId,
        status,
      }),

    onSuccess: async result => {
      const updatedOrder = result?.data;

      console.log('Updated order:', updatedOrder);

      console.log('New status:', updatedOrder?.status);

      /*
       * Refetch active orders.
       *
       * Important because backend also
       * returns updated:
       *
       * - summary
       * - pagination
       * - order list
       *
       * If delivered/cancelled, the
       * order should disappear from
       * status=active automatically.
       */

      await queryClient.invalidateQueries({
        queryKey: ACTIVE_ORDERS_QUERY_KEY,
      });
    },

    onError: error => {
      console.log(
        'Order status update failed:',
        error?.response?.data || error?.message,
      );
    },
  });
};
