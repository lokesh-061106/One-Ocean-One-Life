import { toHeaderMenuConfig, type HeaderMenuConfig } from "@/admin/config";
import { toMenuItem, type MenuItem } from "@/admin/menu";

/* ============================================================ */
/*  Server-side seed for the storefront menu config             */
/* ============================================================ *
 *  Called from the root layout (server component) so the
 *  prerendered HTML already contains the live header style and
 *  menu items. The values are handed to <Providers />, which
 *  pre-populates the React Query cache — removing the flash of
 *  the placeholder menu (Option 2) before the client fetch
 *  returns the real value (e.g. Option 5).
 *
 *  API_URL is the server-reachable base (Docker: http://api:8000).
 *  NEXT_PUBLIC_API_URL serves the browser and local dev.
 * ============================================================ */

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export interface InitialMenuConfig {
  headerMenu: HeaderMenuConfig | null;
  menuItems: MenuItem[] | null;
}

async function fetchJson(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    /* API unreachable during build/SSR: fall back to the client-side defaults */
    return null;
  }
}

export async function getInitialMenuConfig(): Promise<InitialMenuConfig> {
  const [headerRaw, itemsRaw] = await Promise.all([
    fetchJson("/cms/header-menu/"),
    fetchJson("/cms/menu-items/"),
  ]);

  const headerMenu =
    headerRaw && !Array.isArray(headerRaw)
      ? toHeaderMenuConfig(headerRaw as Record<string, unknown>)
      : null;

  const menuItems =
    Array.isArray(itemsRaw) && itemsRaw.length > 0
      ? itemsRaw.map((row) => toMenuItem(row as Record<string, unknown>))
      : null;

  return { headerMenu, menuItems };
}
