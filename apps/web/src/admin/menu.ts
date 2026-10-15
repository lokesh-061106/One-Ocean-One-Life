/* ============================================================ */
/*  One Ocean One Life - Storefront Frontend Menu Items         */
/* ============================================================ */

/**
 * Single source of truth for the storefront navigation *items*.
 *
 * - The admin module (/dashboard/frontend-menu) toggles visibility and
 *   reorders these rows via the API.
 * - The storefront (header styles 1-5, mobile drawer, footer) reads them
 *   through useMenuItems() and filters with buildNavData().
 * - DEFAULT_MENU_ITEMS matches what the storefront rendered before this
 *   became configurable, so the first paint (and an unreachable API)
 *   still renders the full menu.
 *
 * Backend: GET/PUT /api/v1/cms/menu-items/  (cms.MenuItem)
 */

export type MenuItemGroup = "explore" | "community" | "marketplace" | "general";

export interface MenuItem {
  id?: number;
  key: string;
  label: string;
  href: string;
  group: MenuItemGroup;
  description: string;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
  isAccent: boolean;
  updatedAt?: string;
}

/** Matches the pre-configurable storefront menu (17 items, in order). */
export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { key: "overview", label: "Overview", href: "/", group: "general", description: "Platform overview", icon: "Home", sortOrder: 1, isVisible: true, isAccent: false },
  { key: "guides", label: "Guides", href: "/guides", group: "explore", description: "Marine species & habitats", icon: "BookOpen", sortOrder: 2, isVisible: true, isAccent: false },
  { key: "education", label: "Education", href: "/education", group: "explore", description: "Learn about ocean conservation", icon: "GraduationCap", sortOrder: 3, isVisible: true, isAccent: false },
  { key: "ocean-map", label: "Ocean Map", href: "/map", group: "explore", description: "Interactive coastal mapping", icon: "MapPin", sortOrder: 4, isVisible: true, isAccent: false },
  { key: "ocean-sounds", label: "Ocean Sounds", href: "/sounds", group: "explore", description: "Citizen-science recordings", icon: "Mic", sortOrder: 5, isVisible: true, isAccent: false },
  { key: "sightings", label: "Sightings", href: "/sightings", group: "explore", description: "Marine mammal observations", icon: "Camera", sortOrder: 6, isVisible: true, isAccent: false },
  { key: "fish-catch", label: "Fish Catch", href: "/catches", group: "explore", description: "Verified catch records", icon: "Fish", sortOrder: 7, isVisible: true, isAccent: false },
  { key: "observations", label: "Observations", href: "/observations", group: "explore", description: "Wildlife & pollution sightings", icon: "Telescope", sortOrder: 8, isVisible: true, isAccent: false },
  { key: "contributions", label: "Contributions", href: "/contributions", group: "community", description: "Community observations & guides", icon: "Award", sortOrder: 9, isVisible: true, isAccent: false },
  { key: "community", label: "Community", href: "/community/members", group: "community", description: "Connect with members", icon: "Users", sortOrder: 10, isVisible: true, isAccent: false },
  { key: "events", label: "Events", href: "/events", group: "community", description: "Coastal events & meetups", icon: "Calendar", sortOrder: 11, isVisible: true, isAccent: false },
  { key: "clean-ups", label: "Clean-ups", href: "/cleanups", group: "community", description: "Community beach clean-ups", icon: "Trash2", sortOrder: 12, isVisible: true, isAccent: false },
  { key: "marketplace", label: "Marketplace", href: "/marketplace", group: "marketplace", description: "Ocean-friendly products", icon: "Package", sortOrder: 13, isVisible: true, isAccent: false },
  { key: "ecotourism", label: "Ecotourism", href: "/ecotourism", group: "marketplace", description: "Sustainable coastal tourism", icon: "Waves", sortOrder: 14, isVisible: true, isAccent: false },
  { key: "economy", label: "Economy", href: "/economy", group: "marketplace", description: "Sustainable livelihoods", icon: "Recycle", sortOrder: 15, isVisible: true, isAccent: false },
  { key: "recognition", label: "Recognition", href: "/recognition", group: "community", description: "Top contributors", icon: "Trophy", sortOrder: 16, isVisible: true, isAccent: false },
  { key: "emergency", label: "Emergency", href: "/emergency", group: "general", description: "Emergency contacts & alerts", icon: "AlertTriangle", sortOrder: 17, isVisible: true, isAccent: true },
];

export const MENU_ITEM_QUERY_KEY = ["menu-items"] as const;

/** Backend payload (snake_case) -> UI model. */
export function toMenuItem(payload: Record<string, unknown>): MenuItem {
  const str = (key: string, fallback = "") =>
    typeof payload[key] === "string" ? (payload[key] as string) : fallback;
  const num = (key: string, fallback = 0) =>
    typeof payload[key] === "number" ? (payload[key] as number) : fallback;
  const bool = (key: string, fallback = false) =>
    typeof payload[key] === "boolean" ? (payload[key] as boolean) : fallback;

  return {
    id: num("id") || undefined,
    key: str("key"),
    label: str("label"),
    href: str("href"),
    group: (["explore", "community", "marketplace", "general"] as const).includes(
      str("group", "general") as MenuItemGroup
    )
      ? (str("group", "general") as MenuItemGroup)
      : "general",
    description: str("description"),
    icon: str("icon"),
    sortOrder: num("sort_order"),
    isVisible: bool("is_visible", true),
    isAccent: bool("is_accent"),
    updatedAt: str("updated_at") || undefined,
  };
}

/** UI model -> API payload (snake_case). */
export function toMenuItemPayload(item: MenuItem): Record<string, unknown> {
  return {
    id: item.id,
    key: item.key,
    label: item.label,
    href: item.href,
    group: item.group,
    description: item.description,
    icon: item.icon,
    sort_order: item.sortOrder,
    is_visible: item.isVisible,
    is_accent: item.isAccent,
  };
}

/** Bulk save payload: only the fields the admin module edits. */
export function toMenuItemBulkPayload(items: MenuItem[]): Record<string, unknown>[] {
  return items.map((item) => ({
    id: item.id,
    is_visible: item.isVisible,
    sort_order: item.sortOrder,
  }));
}
