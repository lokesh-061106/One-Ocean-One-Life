import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/constants";
import {
  DEFAULT_MENU_ITEMS,
  MENU_ITEM_QUERY_KEY,
  toMenuItem,
  toMenuItemBulkPayload,
  type MenuItem,
} from "@/admin/menu";

/**
 * Storefront: which navigation items are visible and in what order.
 * Falls back to DEFAULT_MENU_ITEMS while loading or if the API is down.
 */
export function useMenuItems(): MenuItem[] {
  const { data } = useQuery({
    queryKey: MENU_ITEM_QUERY_KEY,
    queryFn: async () => {
      const raw = await apiClient.get<Record<string, unknown>[]>(ENDPOINTS.CMS.MENU_ITEMS);
      const items = raw.map(toMenuItem);
      return items.length > 0 ? items : DEFAULT_MENU_ITEMS;
    },
    placeholderData: DEFAULT_MENU_ITEMS,
    staleTime: 60 * 1000,
    retry: 1,
  });

  return data ?? DEFAULT_MENU_ITEMS;
}

/** Admin module: persist visibility + ordering in a single request. */
export function useSaveMenuItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: MenuItem[]) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("o3l_access_token") ?? undefined
          : undefined;
      const raw = await apiClient.put<Record<string, unknown>[]>(
        ENDPOINTS.CMS.MENU_ITEMS_BULK,
        toMenuItemBulkPayload(items.filter((item) => item.id != null)),
        token
      );
      return raw.map(toMenuItem);
    },
    onSuccess: (items) => {
      if (items.length > 0) {
        queryClient.setQueryData(MENU_ITEM_QUERY_KEY, items);
      } else {
        queryClient.invalidateQueries({ queryKey: MENU_ITEM_QUERY_KEY });
      }
    },
  });
}
