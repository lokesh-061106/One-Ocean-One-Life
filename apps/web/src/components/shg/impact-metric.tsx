"use client";

import * as React from "react";
import {
  Banknote,
  Building2,
  ChevronDown,
  Coins,
  Fish,
  Fuel,
  HandCoins,
  HeartPulse,
  Leaf,
  PackageOpen,
  Recycle,
  Sparkles,
  Target,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/eco/shared";

/** Icon registry — metric icons are passed as string keys so that server
 *  components never hand function references across the RSC boundary. */
export const SHG_METRIC_ICONS: Record<string, LucideIcon> = {
  banknote: Banknote,
  building: Building2,
  coins: Coins,
  fish: Fish,
  fuel: Fuel,
  "hand-coins": HandCoins,
  heart: HeartPulse,
  leaf: Leaf,
  package: PackageOpen,
  recycle: Recycle,
  sparkles: Sparkles,
  target: Target,
  waves: Waves,
};

/* ------------------------------------------------------------------ */
/*  ImpactMetric — animated counter tile                              */
/* ------------------------------------------------------------------ */

interface ImpactMetricProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  caption?: string;
  icon?: string;
  tone?: "forest" | "sky" | "orange" | "purple" | "magenta" | "turquoise" | "royal";
  className?: string;
}

const TONES: Record<string, { bg: string; icon: string }> = {
  forest: { bg: "from-shg-forest to-emerald-700", icon: "bg-white/20" },
  sky: { bg: "from-shg-sky to-ocean-blue", icon: "bg-white/20" },
  orange: { bg: "from-shg-orange to-amber-600", icon: "bg-white/20" },
  purple: { bg: "from-shg-purple to-indigo-800", icon: "bg-white/20" },
  magenta: { bg: "from-shg-magenta to-rose-700", icon: "bg-white/20" },
  turquoise: { bg: "from-shg-turquoise to-emerald-600", icon: "bg-white/20" },
  royal: { bg: "from-shg-royal to-ocean-deep", icon: "bg-white/20" },
};

export function ImpactMetric({
  value,
  prefix,
  suffix,
  label,
  caption,
  icon,
  tone = "forest",
  className,
}: ImpactMetricProps) {
  const t = TONES[tone];
  const Icon = icon ? SHG_METRIC_ICONS[icon] : undefined;
  return (
    <div
      className={cn(
        "shg-card shg-card-hover relative overflow-hidden bg-gradient-to-br p-4 text-white sm:p-5",
        t.bg,
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="shg-display text-2xl leading-none tabular-nums sm:text-3xl">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          </div>
          <div className="mt-1.5 text-[13px] font-bold uppercase tracking-wide">{label}</div>
          {caption && <div className="mt-0.5 text-[11px] text-white">{caption}</div>}
        </div>
        {Icon && (
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.icon)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  InfoPanel — expandable information card                            */
/* ------------------------------------------------------------------ */

export function InfoPanel({
  title,
  summary,
  children,
  defaultOpen = false,
  tone = "forest",
  className,
  icon: Icon,
}: {
  title: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tone?: "forest" | "sky" | "orange" | "royal" | "purple" | "magenta" | "turquoise";
  className?: string;
  icon?: LucideIcon;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();

  const tones: Record<string, string> = {
    forest: "bg-shg-forest",
    sky: "bg-shg-sky",
    orange: "bg-shg-orange",
    royal: "bg-shg-royal",
    purple: "bg-shg-purple",
    magenta: "bg-shg-magenta",
    turquoise: "bg-shg-turquoise",
  };

  return (
    <div className={cn("shg-card overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-navy",
          tones[tone]
        )}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
        <span className="min-w-0 flex-1">
          <span className="shg-display block text-[15px] leading-tight sm:text-base">{title}</span>
          {summary && <span className="block text-[12px] text-white/85">{summary}</span>}
        </span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 transition-transform duration-300", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        id={id}
        role="region"
        aria-label={title}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
