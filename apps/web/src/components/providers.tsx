"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth-context";
import { CartProvider } from "@/components/cart-context";
import { ProfileProvider } from "@/components/profile-context";
import { HEADER_MENU_QUERY_KEY } from "@/hooks/use-header-menu";
import { MENU_ITEM_QUERY_KEY, type MenuItem } from "@/admin/menu";
import type { HeaderMenuConfig } from "@/admin/config";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function Providers({
  children,
  initialHeaderMenu,
  initialMenuItems,
}: {
  children: React.ReactNode;
  initialHeaderMenu?: HeaderMenuConfig | null;
  initialMenuItems?: MenuItem[] | null;
}) {
  const queryClient = getQueryClient();

  /* Seed the cache from the root layout's server fetch so both the
     SSR HTML and the client's first render show the live values.
     Seed-if-absent keeps in-page edits (admin saves) intact and
     makes the operation idempotent across re-renders. */
  if (initialHeaderMenu) {
    queryClient.setQueryData<HeaderMenuConfig>(HEADER_MENU_QUERY_KEY, (prev) => prev ?? initialHeaderMenu);
  }
  if (initialMenuItems && initialMenuItems.length > 0) {
    queryClient.setQueryData<MenuItem[]>(MENU_ITEM_QUERY_KEY, (prev) => prev ?? initialMenuItems);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <CartProvider>{children}</CartProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
