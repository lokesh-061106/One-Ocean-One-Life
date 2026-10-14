import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/constants";
import {
  DEFAULT_HEADER_MENU,
  toHeaderMenuConfig,
  toHeaderMenuPayload,
  type HeaderMenuConfig,
} from "@/admin/config";

export const HEADER_MENU_QUERY_KEY = ["header-menu"] as const;

/**
 * Storefront: which header menu style is live.
 * Falls back to DEFAULT_HEADER_MENU while loading or if the API is down.
 */
export function useHeaderMenuConfig(): HeaderMenuConfig {
  const { data } = useQuery({
    queryKey: HEADER_MENU_QUERY_KEY,
    queryFn: async () => {
      const raw = await apiClient.get<Record<string, unknown>>(ENDPOINTS.CMS.HEADER_MENU);
      return toHeaderMenuConfig(raw);
    },
    placeholderData: DEFAULT_HEADER_MENU,
    staleTime: 60 * 1000,
    retry: 1,
  });

  return data ?? DEFAULT_HEADER_MENU;
}

/** Admin module: persist the config and update the live header instantly. */
export function useSaveHeaderMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: HeaderMenuConfig) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("o3l_access_token") ?? undefined
          : undefined;
      const raw = await apiClient.put<Record<string, unknown>>(
        ENDPOINTS.CMS.HEADER_MENU,
        toHeaderMenuPayload(config),
        token
      );
      return toHeaderMenuConfig(raw);
    },
    onSuccess: (config) => {
      queryClient.setQueryData(HEADER_MENU_QUERY_KEY, config);
    },
  });
}
