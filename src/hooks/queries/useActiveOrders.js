import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useSelector } from 'react-redux';

import { getActiveOrders } from '../../api/orderApi';

export const ACTIVE_ORDERS_QUERY_KEY = ['tuck-shop-orders', 'active'];

export const useActiveOrders = ({ start = 0, end = 20 } = {}) => {
  const token = useSelector(state => state.auth.token);

  return useQuery({
    queryKey: [...ACTIVE_ORDERS_QUERY_KEY, start, end],

    queryFn: () =>
      getActiveOrders({
        token,
        start,
        end,
      }),

    enabled: Boolean(token),

    placeholderData: keepPreviousData,

    staleTime: 10 * 1000,

    refetchOnMount: true,

    refetchOnReconnect: true,

    retry: 1,
  });
};
