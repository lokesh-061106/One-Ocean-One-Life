import * as React from "react";
import { Check, ChevronRight, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  BenefitList — green/coloured check bullets with a pill heading     */
/* ------------------------------------------------------------------ */

export function BenefitList({
  title = "Benefits",
  items,
  tone = "forest",
  className,
  compact,
}: {
  title?: string;
  items: string[];
  tone?: "forest" | "sky" | "orange" | "royal" | "purple" | "magenta" | "turquoise";
  className?: string;
  compact?: boolean;
}) {
  const tones: Record<string, { pill: string; check: string }> = {
    forest: { pill: "bg-shg-forest text-white", check: "bg-shg-forest" },
    sky: { pill: "bg-shg-sky text-white", check: "bg-shg-sky" },
    orange: { pill: "bg-shg-orange text-white", check: "bg-shg-orange" },
    royal: { pill: "bg-shg-royal text-white", check: "bg-shg-royal" },
    purple: { pill: "bg-shg-purple text-white", check: "bg-shg-purple" },
    magenta: { pill: "bg-shg-magenta text-white", check: "bg-shg-magenta" },
    turquoise: { pill: "bg-shg-turquoise text-white", check: "bg-shg-turquoise" },
  };
  const t = tones[tone];

  return (
    <div className={cn("rounded-xl border border-ocean-border/70 bg-white p-3 sm:p-4", className)}>
      <span
        className={cn(
          "mb-2.5 inline-block rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide sm:text-sm",
          t.pill
        )}
      >
        {title}
      </span>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[13px] leading-snug text-ocean-text sm:text-sm">
            <span
              className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", t.check)}
              aria-hidden="true"
            >
              <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
            </span>
            <span className={compact ? "text-[13px]" : ""}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FlowRow — "A → B → C" process chain                                */
/* ------------------------------------------------------------------ */

export function FlowRow({
  steps,
  tone = "forest",
  label,
  className,
  vertical,
}: {
  steps: { label: string; sub?: string }[];
  tone?: "forest" | "sky" | "orange" | "royal" | "purple" | "magenta" | "turquoise" | "ink";
  label?: string;
  className?: string;
  vertical?: boolean;
}) {
  const tones: Record<string, string> = {
    forest: "bg-shg-forest text-white",
    sky: "bg-shg-sky text-white",
    orange: "bg-shg-orange text-white",
    royal: "bg-shg-royal text-white",
    purple: "bg-shg-purple text-white",
    magenta: "bg-shg-magenta text-white",
    turquoise: "bg-shg-turquoise text-white",
    ink: "bg-ocean-navy text-white",
  };

  return (
    <div className={cn("rounded-xl border border-ocean-border/70 bg-ocean-foam p-3", className)}>
      {label && (
        <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-ocean-muted">
          {label}
        </div>
      )}
      <ol
        className={cn(
          "flex items-stretch gap-1.5",
          vertical ? "flex-col" : "flex-col sm:flex-row sm:items-center"
        )}
      >
        {steps.map((step, i) => (
          <li key={`${step.label}-${i}`} className="flex flex-1 items-center gap-1.5">
            <div
              className={cn(
                "flex-1 rounded-lg px-2 py-2 text-center text-[12px] font-bold leading-tight shadow-sm sm:text-[13px]",
                tones[tone]
              )}
            >
              {step.label}
              {step.sub && <div className="mt-0.5 text-[10px] font-medium opacity-85">{step.sub}</div>}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight
                className="h-4 w-4 shrink-0 -rotate-90 text-ocean-muted sm:rotate-0"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PriceChip — ₹ price label                                          */
/* ------------------------------------------------------------------ */

export function PriceChip({
  value,
  unit,
  tone = "ink",
  className,
}: {
  value: string;
  unit?: string;
  tone?: "ink" | "forest" | "orange" | "sky" | "purple" | "magenta";
  className?: string;
}) {
  const tones: Record<string, string> = {
    ink: "bg-ocean-navy text-white",
    forest: "bg-shg-forest text-white",
    orange: "bg-shg-orange text-white",
    sky: "bg-shg-sky text-white",
    purple: "bg-shg-purple text-white",
    magenta: "bg-shg-magenta text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-bold shadow-sm",
        tones[tone],
        className
      )}
    >
      <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="tabular-nums">{value}</span>
      {unit && <span className="text-[11px] font-semibold opacity-90">{unit}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  CheckGrid — plain check list without a heading                     */
/* ------------------------------------------------------------------ */

export function CheckGrid({
  items,
  tone = "forest",
  columns = 1,
  className,
}: {
  items: string[];
  tone?: "forest" | "sky" | "orange" | "royal" | "purple" | "magenta" | "turquoise" | "red";
  columns?: 1 | 2;
  className?: string;
}) {
  const dots: Record<string, string> = {
    forest: "bg-shg-forest",
    sky: "bg-shg-sky",
    orange: "bg-shg-orange",
    royal: "bg-shg-royal",
    purple: "bg-shg-purple",
    magenta: "bg-shg-magenta",
    turquoise: "bg-shg-turquoise",
    red: "bg-shg-magenta",
  };
  return (
    <ul
      className={cn(
        "grid gap-x-4 gap-y-1.5",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-[13px] leading-snug text-ocean-text sm:text-sm">
          <span
            className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white", dots[tone])}
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
