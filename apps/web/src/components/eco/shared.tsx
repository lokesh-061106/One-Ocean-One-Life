"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EcoModelCategory, TourismType } from "@/types";

/* ------------------------------------------------------------------ */
/* Category metadata — the 5 O3L models                                */
/* ------------------------------------------------------------------ */

export const MODEL_META: Record<
  EcoModelCategory,
  { label: string; short: string; icon: string; emoji: string; gradient: string; chip: string }
> = {
  fisher_coastal: {
    label: "Fisher-led Coastal Experience",
    short: "Fisher-led",
    icon: "🎣",
    emoji: "🎣",
    gradient: "from-ocean-blue via-ocean-deep to-ocean-green",
    chip: "bg-ocean-blue/10 text-ocean-blue border-ocean-blue/20",
  },
  nature_tours: {
    label: "Mangrove, Lagoon & Marine Nature Tours",
    short: "Nature Tours",
    icon: "🌿",
    emoji: "🌿",
    gradient: "from-ocean-green via-emerald-600 to-teal-700",
    chip: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  homestay_food: {
    label: "Fisher Village Homestay & Local Food",
    short: "Homestay & Food",
    icon: "🏠",
    emoji: "🏠",
    gradient: "from-orange-500 via-amber-500 to-ocean-coral",
    chip: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  ocean_learning: {
    label: "Ocean Learning & Blue Experiences",
    short: "Ocean Learning",
    icon: "🎧",
    emoji: "🎧",
    gradient: "from-ocean-deep via-ocean-blue to-sky-400",
    chip: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  },
  festival_market: {
    label: "Weekend Coastal Community Festival & Marketplace",
    short: "Festival & Market",
    icon: "🎉",
    emoji: "🎉",
    gradient: "from-ocean-coral via-rose-500 to-fuchsia-500",
    chip: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
};

export const MODEL_ORDER: EcoModelCategory[] = [
  "fisher_coastal",
  "nature_tours",
  "homestay_food",
  "ocean_learning",
  "festival_market",
];

export const TYPE_META: Record<string, { icon: string; label: string }> = {
  whale_watching: { icon: "🐋", label: "Whale Watching" },
  snorkeling: { icon: "🤿", label: "Snorkeling" },
  diving: { icon: "🤿", label: "Diving" },
  boat_tour: { icon: "🛶", label: "Boat Tour" },
  fishing_trip: { icon: "🎣", label: "Fishing Trip" },
  bird_watching: { icon: "🐦", label: "Bird Watching" },
  mangrove_tour: { icon: "🌿", label: "Mangrove Tour" },
  kayak_tour: { icon: "🛶", label: "Mangrove Kayaking" },
  beach_tour: { icon: "🏖", label: "Beach Tour" },
  village_tour: { icon: "🏘", label: "Village Tour" },
  cultural_tour: { icon: "🏛", label: "Cultural Tour" },
  sunset_trip: { icon: "🌅", label: "Sunrise / Sunset Trip" },
  traditional_fishing_demo: { icon: "🎣", label: "Fishing Demonstration" },
  turtle_watching: { icon: "🐢", label: "Turtle Observation" },
  dolphin_watching: { icon: "🐬", label: "Dolphin Observation" },
  estuary_tour: { icon: "🏞", label: "Estuary Tour" },
  coastal_photography: { icon: "📷", label: "Photography Walk" },
  nature_walk: { icon: "🌱", label: "Nature Walk" },
  homestay_stay: { icon: "🏠", label: "Homestay" },
  cooking_experience: { icon: "🍳", label: "Cooking Experience" },
  seafood_meal: { icon: "🍤", label: "Seafood Meal" },
  net_making_demo: { icon: "🧶", label: "Net Making" },
  boat_building_demo: { icon: "🚤", label: "Boat Building" },
  village_walk: { icon: "👣", label: "Village Walk" },
  handicraft: { icon: "🧺", label: "Handicrafts" },
  marine_education: { icon: "🐟", label: "Marine Life" },
  underwater_sounds: { icon: "🎧", label: "Ocean Sounds" },
  school_program: { icon: "🎓", label: "School Program" },
  citizen_science: { icon: "🔬", label: "Citizen Science" },
  festival: { icon: "🎉", label: "Village Festival" },
  craft_market: { icon: "🧺", label: "Craft Market" },
  cultural_performance: { icon: "🎵", label: "Music & Stories" },
};

export function typeMeta(type?: string) {
  return TYPE_META[type || ""] || { icon: "🌊", label: (type || "Experience").replace(/_/g, " ") };
}

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

export function formatINR(amount?: number | string | null): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function priceOf(item: {
  price_min?: number | string | null;
  price_max?: number | string | null;
  price_range?: string;
}): string {
  const min = item.price_min !== undefined && item.price_min !== null ? item.price_min : null;
  const max = item.price_max !== undefined && item.price_max !== null ? item.price_max : null;
  if (min !== null && max !== null && String(min) !== String(max)) {
    return `${formatINR(min)} – ${formatINR(max)}`;
  }
  if (min !== null) return formatINR(min);
  return item.price_range || "On request";
}

/* ------------------------------------------------------------------ */
/* Animated counter                                                    */
/* ------------------------------------------------------------------ */

export function AnimatedNumber({
  value,
  duration = 1400,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    const finish = () => setDisplay(value);
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(finish);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) {
              finish();
              return;
            }
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - t, 3);
              setDisplay(value * eased);
              if (t < 1) requestAnimationFrame(tick);
              else finish();
            };
            requestAnimationFrame(tick);
            timer = window.setTimeout(finish, duration + 500);
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {Math.round(display).toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Rating stars                                                        */
/* ------------------------------------------------------------------ */

export function Stars({
  rating = 0,
  count,
  size = "sm",
  className,
}: {
  rating?: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const starCls = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            starCls,
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
                ? "fill-amber-400/60 text-amber-400"
                : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-ocean-navy">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-ocean-text-secondary">({count})</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export function EcoBadge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "amber" | "coral" | "blue" | "dark";
  className?: string;
}) {
  const tones = {
    default: "bg-ocean-light text-ocean-deep border-ocean-blue/20",
    green: "bg-emerald-50 text-emerald-700 border-emerald-500/25",
    amber: "bg-amber-50 text-amber-700 border-amber-500/25",
    coral: "bg-orange-50 text-orange-600 border-orange-500/25",
    blue: "bg-sky-50 text-sky-700 border-sky-500/25",
    dark: "bg-ocean-deep text-white border-white/15",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
