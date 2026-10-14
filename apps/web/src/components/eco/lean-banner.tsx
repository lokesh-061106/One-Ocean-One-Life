"use client";

import { useState } from "react";
import { Sprout, ChevronDown, AlertTriangle, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeanSeasonData } from "@/types";

export function LeanSeasonBanner({
  data,
  onExplore,
  className,
}: {
  data: LeanSeasonData | null;
  onExplore?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!data) return null;

  const active = data.active;
  const win = data.windows?.[0];

  return (
    <div
      className={cn(
        "reveal visible overflow-hidden rounded-2xl border transition-shadow",
        active
          ? "border-emerald-400/50 bg-gradient-to-r from-emerald-50 via-green-50 to-ocean-light shadow-glow"
          : "border-ocean-border bg-white shadow-sm",
        className
      )}
    >
      {/* Collapsed banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
              active ? "bg-emerald-500 animate-pulse-glow" : "bg-ocean-muted"
            )}
          >
            <Sprout className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-emerald-700">
              🌱 Lean Season Opportunities
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  active ? "bg-emerald-500 text-white" : "bg-ocean-light text-ocean-text-secondary"
                )}
              >
                {active ? "ACTIVE NOW" : "CHECKED DAILY"}
              </span>
            </p>
            <p className="mt-1 text-sm text-ocean-text-secondary">
              {active && data.message
                ? data.message
                : "Fishing restrictions are not active today — all experiences are open for booking."}
            </p>
            {active && win && (
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                📅 {win.region_label || win.state}: {win.typical_period}
                {win.start_month ? ` (${win.start_month}/${win.start_day || 1} – ${win.end_month}/${win.end_day || "…"})` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onExplore && active && (
            <button
              onClick={onExplore}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Explore alternatives →
            </button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle lean season details"
            className="rounded-lg border border-emerald-300 bg-white/70 p-2 text-emerald-700 transition-colors hover:bg-white"
          >
            <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="animate-fade-in-up border-t border-emerald-200/70 bg-white/60 px-4 py-4 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.windows.map((w) => (
              <div key={w.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ocean-navy">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {w.state}
                  {w.district ? ` · ${w.district}` : ""}
                </p>
                <p className="text-xs font-semibold text-emerald-700">{w.typical_period}</p>
                {w.main_reason && (
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ocean-text-secondary">
                    {w.main_reason}
                  </p>
                )}
              </div>
            ))}
          </div>

          {data.profile && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.profile.ban_relief_text && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-ocean-text-secondary">
                  <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    <b className="text-ocean-navy">Ban relief:</b> {data.profile.ban_relief_text}
                  </span>
                </div>
              )}
              {data.profile.lean_allowance_text && (
                <div className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs text-ocean-text-secondary">
                  <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <span>
                    <b className="text-ocean-navy">Lean allowance:</b> {data.profile.lean_allowance_text}
                  </span>
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-ocean-text-secondary">
            Instead of <b className="text-ocean-navy">income → ₹0</b> during a ban, O3L offers{" "}
            <b className="text-ocean-navy">boat tourism · homestay · food · nature guiding · fishing demos ·
            ocean education · local products · community events</b> — a full livelihood ecosystem for the
            fishing family. <i>Reference data from state fisheries departments.</i>
          </p>
        </div>
      )}
    </div>
  );
}
