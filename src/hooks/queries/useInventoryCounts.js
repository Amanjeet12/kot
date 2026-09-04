import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { getInventoryCounts } from '../../api/inventoryApi';

export const INVENTORY_COUNTS_QUERY_KEY = ['inventory', 'counts'];

export const useInventoryCounts = () => {
  const token = useSelector(state => state.auth.token);

  return useQuery({
    queryKey: INVENTORY_COUNTS_QUERY_KEY,
    queryFn: () => getInventoryCounts({ token }),
    enabled: Boolean(token),
    staleTime: 10 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });
};
