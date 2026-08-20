import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useSelector } from 'react-redux';

import { getOrderHistory } from '../../api/orderApi';

export const ORDER_HISTORY_QUERY_KEY = ['tuck-shop-orders', 'history'];

export const useOrderHistory = ({
  fromDate,
  toDate,
  start = 0,
  end = 20,
}) => {
  const token = useSelector(state => state.auth.token);

  return useQuery({
    queryKey: [
      ...ORDER_HISTORY_QUERY_KEY,
      fromDate,
      toDate,
      start,
      end,
    ],
    queryFn: () =>
      getOrderHistory({
        token,
        fromDate,
        toDate,
        start,
        end,
      }),
    enabled: Boolean(token && fromDate && toDate),
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });
};
