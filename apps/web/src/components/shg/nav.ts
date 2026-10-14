import {
  Recycle,
  Sprout,
  Coins,
  Landmark,
  UtensilsCrossed,
  Fish,
  RefreshCw,
  Home,
  type LucideIcon,
} from "lucide-react";

export interface ShgSection {
  key: string;
  num: string;
  label: string;
  short: string;
  href: string;
  icon: LucideIcon;
  /** Tailwind classes — kept literal here so Tailwind can scan them */
  chip: string;
  bar: string;
  band: string;
  ink: string;
}

export const SHG_SECTIONS: ShgSection[] = [
  {
    key: "circular",
    num: "01",
    label: "Circular Economy",
    short: "Circular Economy",
    href: "/economy/shg/circular-economy",
    icon: Recycle,
    chip: "bg-shg-forest/10 text-shg-forest",
    bar: "bg-shg-forest",
    band: "from-shg-forest to-emerald-900",
    ink: "text-shg-forest",
  },
  {
    key: "strategies",
    num: "02",
    label: "Deepening the Model",
    short: "Strategies",
    href: "/economy/shg/strategies",
    icon: Sprout,
    chip: "bg-shg-royal/10 text-shg-royal",
    bar: "bg-shg-royal",
    band: "from-shg-royal to-ocean-deep",
    ink: "text-shg-royal",
  },
  {
    key: "revenue",
    num: "03",
    label: "Revenue Opportunities",
    short: "Revenue",
    href: "/economy/shg/revenue",
    icon: Coins,
    chip: "bg-shg-orange/10 text-shg-orange",
    bar: "bg-shg-orange",
    band: "from-shg-orange to-amber-600",
    ink: "text-shg-orange",
  },
  {
    key: "loans",
    num: "04",
    label: "Loans & Financial Support",
    short: "Financial Support",
    href: "/economy/shg/loans",
    icon: Landmark,
    chip: "bg-shg-purple/10 text-shg-purple",
    bar: "bg-shg-purple",
    band: "from-shg-purple to-indigo-800",
    ink: "text-shg-purple",
  },
  {
    key: "recipes",
    num: "05",
    label: "Recipes & Food Marketing",
    short: "Recipes",
    href: "/economy/shg/recipes",
    icon: UtensilsCrossed,
    chip: "bg-shg-magenta/10 text-shg-magenta",
    bar: "bg-shg-magenta",
    band: "from-shg-magenta to-rose-700",
    ink: "text-shg-magenta",
  },
  {
    key: "fresh-fish",
    num: "06",
    label: "Fresh Fish Marketing",
    short: "Fresh Fish",
    href: "/economy/shg/fresh-fish",
    icon: Fish,
    chip: "bg-shg-sky/10 text-shg-sky",
    bar: "bg-shg-sky",
    band: "from-shg-sky to-ocean-blue",
    ink: "text-shg-sky",
  },
  {
    key: "sea-to-plate",
    num: "07",
    label: "From Sea to Plate to Prosperity",
    short: "Sea to Plate",
    href: "/economy/shg/sea-to-plate",
    icon: RefreshCw,
    chip: "bg-shg-turquoise/10 text-shg-turquoise",
    bar: "bg-shg-turquoise",
    band: "from-shg-turquoise to-emerald-600",
    ink: "text-shg-turquoise",
  },
];

export const SHG_HOME: ShgSection = {
  key: "home",
  num: "00",
  label: "Home",
  short: "Home",
  href: "/economy/shg",
  icon: Home,
  chip: "bg-ocean-light text-ocean-blue",
  bar: "bg-ocean-blue",
  band: "from-shg-forest to-shg-royal",
  ink: "text-ocean-blue",
};

export const SHG_TOTAL = SHG_SECTIONS.length;

/** Find the active section for a pathname (returns null on the landing page). */
export function findSection(pathname: string): ShgSection | null {
  if (!pathname.startsWith("/economy/shg")) return null;
  return SHG_SECTIONS.find((s) => pathname === s.href) ?? null;
}

export function sectionIndex(pathname: string): number {
  const section = findSection(pathname);
  if (!section) return -1;
  return SHG_SECTIONS.findIndex((s) => s.key === section.key);
}
