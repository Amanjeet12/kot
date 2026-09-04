import { useInfiniteQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { getInventory } from '../../api/inventoryApi';

export const INVENTORY_QUERY_KEY = ['inventory'];
export const INVENTORY_PAGE_SIZE = 20;

export const useInventory = () => {
  const token = useSelector(state => state.auth.token);

  return useInfiniteQuery({
    queryKey: INVENTORY_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      getInventory({
        token,
        start: pageParam,
        end: pageParam + INVENTORY_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      const pagination = lastPage?.pagination;

      if (!pagination?.hasNextPage) return undefined;

      return Number(pagination.end ?? 0);
    },
    enabled: Boolean(token),
    staleTime: 10 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });
};
