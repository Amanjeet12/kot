import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { updateInventoryStock } from '../../api/inventoryApi';
import { TODAY_TUCK_SHOP_MENU_QUERY_KEY } from '../queries/useTodayTuckShopMenu';
import { INVENTORY_QUERY_KEY } from '../queries/useInventory';
import { INVENTORY_COUNTS_QUERY_KEY } from '../queries/useInventoryCounts';

export const useUpdateInventoryStock = () => {
  const queryClient = useQueryClient();
  const token = useSelector(state => state.auth.token);

  return useMutation({
    mutationFn: entries => updateInventoryStock({ token, entries }),
    onSuccess: data => {
      const updatedById = new Map(
        (data?.inventories || []).map(inventory => [
          inventory.inventory_id,
          inventory,
        ]),
      );

      if (updatedById.size) {
        queryClient.setQueryData(INVENTORY_QUERY_KEY, previous => {
          if (!previous?.pages) return previous;

          return {
            ...previous,
            pages: previous.pages.map(page => ({
              ...page,
              data: (page.data || []).map(
                inventory =>
                  updatedById.get(inventory.inventory_id) || inventory,
              ),
            })),
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INVENTORY_COUNTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: TODAY_TUCK_SHOP_MENU_QUERY_KEY,
      });
    },
  });
};
