import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSelector } from 'react-redux';

import { updateTuckShopMenuItemAvailability } from '../../api/orderApi';
import { TODAY_TUCK_SHOP_MENU_QUERY_KEY } from '../queries/useTodayTuckShopMenu';

export const useUpdateMenuItemAvailability = () => {
  const queryClient = useQueryClient();
  const token = useSelector(state => state.auth.token);

  return useMutation({
    mutationFn: ({ dailyMenuItemId, isAvailable }) =>
      updateTuckShopMenuItemAvailability({
        token,
        dailyMenuItemId,
        isAvailable,
      }),

    onMutate: async ({ dailyMenuItemId, isAvailable }) => {
      const cancelQueriesPromise = queryClient.cancelQueries({
        queryKey: TODAY_TUCK_SHOP_MENU_QUERY_KEY,
      });

      const previousMenu = queryClient.getQueryData(
        TODAY_TUCK_SHOP_MENU_QUERY_KEY,
      );

      queryClient.setQueryData(TODAY_TUCK_SHOP_MENU_QUERY_KEY, previous => {
        if (!previous?.data?.items) {
          return previous;
        }

        return {
          ...previous,
          data: {
            ...previous.data,
            items: previous.data.items.map(item =>
              item.daily_menu_item_id === dailyMenuItemId
                ? { ...item, isAvailable }
                : item,
            ),
          },
        };
      });

      await cancelQueriesPromise;

      return { previousMenu };
    },

    onError: (error, _variables, context) => {
      if (context?.previousMenu) {
        queryClient.setQueryData(
          TODAY_TUCK_SHOP_MENU_QUERY_KEY,
          context.previousMenu,
        );
      }

      console.log(
        'Menu availability update failed:',
        error?.response?.data || error?.message,
      );
    },

    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: TODAY_TUCK_SHOP_MENU_QUERY_KEY,
      }),
  });
};
