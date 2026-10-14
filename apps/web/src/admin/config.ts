/* ============================================================ */
/*  One Ocean One Life - Admin Header Menu Configuration        */
/* ============================================================ */

/**
 * Single source of truth for the storefront header menu styles.
 *
 * - The admin module (/dashboard/header-menu) edits these values via the API.
 * - The storefront Header reads them through useHeaderMenuConfig().
 * - DEFAULT_HEADER_MENU is the fallback used before the API responds
 *   (or when it is unreachable), so the site always renders a menu.
 *
 * Backend: GET/PUT /api/v1/cms/header-menu/  (cms.SiteHeaderConfig)
 */

export type MenuOption = "option1" | "option2" | "option3" | "option4" | "option5";

export interface HeaderMenuConfig {
  selectedMenuOption: MenuOption;
  showOption1: boolean;
  showOption2: boolean;
  showOption3: boolean;
  showOption4: boolean;
  showOption5: boolean;
  updatedAt?: string;
}

export interface MenuOptionMeta {
  key: MenuOption;
  label: string;
  tagline: string;
  description: string;
}

/** Matches what the storefront rendered before this became configurable. */
export const DEFAULT_HEADER_MENU: HeaderMenuConfig = {
  selectedMenuOption: "option2",
  showOption1: true,
  showOption2: true,
  showOption3: true,
  showOption4: true,
  showOption5: true,
};

export const MENU_OPTIONS: MenuOptionMeta[] = [
  {
    key: "option1",
    label: "Split Navigation",
    tagline: "Logo | centred links | inline search",
    description:
      "Dropdown groups centred in the header with a search field built into the navigation bar.",
  },
  {
    key: "option2",
    label: "Mega Dropdown",
    tagline: "Wide panels with descriptions",
    description:
      "Explore / Community / Marketplace open into wide icon panels - the default O3L navigation.",
  },
  {
    key: "option3",
    label: "Tabbed Navigation",
    tagline: "Flat tabs with an active underline",
    description:
      "Top-level sections shown as tabs, with an underline marking the current page.",
  },
  {
    key: "option4",
    label: "Sidebar + Header",
    tagline: "Fixed left rail on desktop",
    description:
      "A persistent sidebar carries the main links while the header keeps only brand and actions.",
  },
  {
    key: "option5",
    label: "Document Header",
    tagline: "Branded two-tier header with link row",
    description:
      "A dark brand panel holds the logo and name, with a top action row and a full section link row underneath.",
  },
];

export const DEFAULT_ACTIVE_MENU: MenuOption = DEFAULT_HEADER_MENU.selectedMenuOption;

/** Backend payload <-> UI config. */
export function toHeaderMenuConfig(payload: Record<string, unknown>): HeaderMenuConfig {
  const pick = (key: string, fallback: boolean) => {
    const value = payload[key];
    return typeof value === "boolean" ? value : fallback;
  };
  const option = payload.selected_menu_option;
  return {
    selectedMenuOption: (["option1", "option2", "option3", "option4", "option5"] as const).includes(
      option as MenuOption
    )
      ? (option as MenuOption)
      : DEFAULT_HEADER_MENU.selectedMenuOption,
    showOption1: pick("show_option1", DEFAULT_HEADER_MENU.showOption1),
    showOption2: pick("show_option2", DEFAULT_HEADER_MENU.showOption2),
    showOption3: pick("show_option3", DEFAULT_HEADER_MENU.showOption3),
    showOption4: pick("show_option4", DEFAULT_HEADER_MENU.showOption4),
    showOption5: pick("show_option5", DEFAULT_HEADER_MENU.showOption5),
    updatedAt: typeof payload.updated_at === "string" ? (payload.updated_at as string) : undefined,
  };
}

/** API payload (snake_case, as returned/accepted by Django). */
export function toHeaderMenuPayload(config: HeaderMenuConfig): Record<string, unknown> {
  return {
    selected_menu_option: config.selectedMenuOption,
    show_option1: config.showOption1,
    show_option2: config.showOption2,
    show_option3: config.showOption3,
    show_option4: config.showOption4,
    show_option5: config.showOption5,
  };
}

export const FLAG_BY_OPTION: Record<MenuOption, keyof HeaderMenuConfig> = {
  option1: "showOption1",
  option2: "showOption2",
  option3: "showOption3",
  option4: "showOption4",
  option5: "showOption5",
};

/**
 * Menu actually rendered: the selected option when it is enabled,
 * otherwise the first enabled option, otherwise the default look.
 */
export function resolveActiveMenu(config: HeaderMenuConfig): MenuOption {
  const enabled = (option: MenuOption) => config[FLAG_BY_OPTION[option]] !== false;

  if (enabled(config.selectedMenuOption)) return config.selectedMenuOption;
  for (const option of ["option2", "option1", "option3", "option5", "option4"] as MenuOption[]) {
    if (enabled(option)) return option;
  }
  return DEFAULT_ACTIVE_MENU;
}

/** Keeps the old `adminConfig` name available for any legacy import. */
export const adminConfig = DEFAULT_HEADER_MENU;

/* ============================================================ */
/*  End of Configuration                                         */
/* ============================================================ */
