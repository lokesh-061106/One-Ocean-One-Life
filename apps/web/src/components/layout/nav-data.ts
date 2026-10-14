import {
  BookOpen,
  GraduationCap,
  MapPin,
  Mic,
  Camera,
  Users,
  Calendar,
  Trophy,
  Package,
  Waves,
  Recycle,
  AlertTriangle,
  Compass,
  Award,
  Fish,
  Telescope,
  Trash2,
} from "lucide-react";

/* Shared navigation data for the header, its mobile menu and every
   header-menu style (option1-option4). */

export interface NavItem {
  href: string;
  label: string;
  icon: typeof BookOpen;
  description: string;
}

export interface NavGroup {
  label: string;
  triggerIcon: typeof Compass;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Explore",
    triggerIcon: Compass,
    items: [
      { href: "/guides", label: "Guides", icon: BookOpen, description: "Marine species & habitats" },
      { href: "/education", label: "Education", icon: GraduationCap, description: "Learn about ocean conservation" },
      { href: "/map", label: "Ocean Map", icon: MapPin, description: "Interactive coastal mapping" },
      { href: "/sounds", label: "Ocean Sounds", icon: Mic, description: "Citizen-science recordings" },
      { href: "/sightings", label: "Sightings", icon: Camera, description: "Marine mammal observations" },
      { href: "/catches", label: "Fish Catch", icon: Fish, description: "Verified catch records" },
      { href: "/observations", label: "Observations", icon: Telescope, description: "Wildlife & pollution sightings" },
    ],
  },
  {
    label: "Community",
    triggerIcon: Users,
    items: [
      { href: "/community/members", label: "Community", icon: Users, description: "Connect with members" },
      { href: "/events", label: "Events", icon: Calendar, description: "Coastal events & meetups" },
      { href: "/cleanups", label: "Clean-ups", icon: Trash2, description: "Community beach clean-ups" },
      { href: "/contributions", label: "Contributions", icon: Award, description: "Community observations & guides" },
      { href: "/recognition", label: "Recognition", icon: Trophy, description: "Top contributors" },
    ],
  },
  {
    label: "Marketplace",
    triggerIcon: Package,
    items: [
      { href: "/marketplace", label: "Browse Products", icon: Package, description: "Ocean-friendly products" },
      { href: "/ecotourism", label: "Ecotourism", icon: Waves, description: "Sustainable coastal tourism" },
      { href: "/economy", label: "Circular Economy", icon: Recycle, description: "Sustainable livelihoods" },
      { href: "/economy/shg", label: "Fisherwomen SHGs", icon: Waves, description: "Waste to wealth programme" },
      { href: "/marketplace?category=recycled_products", label: "Recycled Products", icon: Package, description: "Eco-friendly recycled goods" },
    ],
  },
];

export const emergencyNavItem = {
  href: "/emergency",
  label: "Emergency",
  icon: AlertTriangle,
};

/** Flat tab list used by the tabbed style (option3) and the mobile menu. */
export const flatNavLinks: NavItem[] = navGroups.flatMap((group) => group.items);
