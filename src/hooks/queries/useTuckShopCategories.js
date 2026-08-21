import { useQuery } from '@tanstack/react-query';

import { useSelector } from 'react-redux';

import { getTuckShopCategories } from '../../api/orderApi';

export const TUCK_SHOP_CATEGORIES_QUERY_KEY = ['tuck-shop-categories'];

export const useTuckShopCategories = () => {
  const token = useSelector(state => state.auth.token);

  return useQuery({
    queryKey: TUCK_SHOP_CATEGORIES_QUERY_KEY,
    queryFn: () => getTuckShopCategories({ token }),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });
};
