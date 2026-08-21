import { useQuery } from '@tanstack/react-query';

import { useSelector } from 'react-redux';

import { getTodayTuckShopMenu } from '../../api/orderApi';

export const TODAY_TUCK_SHOP_MENU_QUERY_KEY = [
  'tuck-shop-menu',
  'today',
];

export const useTodayTuckShopMenu = () => {
  const token = useSelector(state => state.auth.token);

  return useQuery({
    queryKey: TODAY_TUCK_SHOP_MENU_QUERY_KEY,
    queryFn: () => getTodayTuckShopMenu({ token }),
    enabled: Boolean(token),
    staleTime: 10 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });
};
