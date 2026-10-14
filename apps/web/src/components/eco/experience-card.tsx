"use client";

import Link from "next/link";
import { Clock, Users, MapPin, Anchor, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EcoBadge, MODEL_META, formatINR, priceOf, typeMeta } from "./shared";
import type { EcoPackage, TourismOpportunity } from "@/types";

/* ------------------------------------------------------------------ */
/* Experience card                                                     */
/* ------------------------------------------------------------------ */

export function ExperienceCard({
  item,
  index = 0,
  className,
}: {
  item: TourismOpportunity;
  index?: number;
  className?: string;
}) {
  const meta = MODEL_META[item.model_category] || MODEL_META.fisher_coastal;
  const t = typeMeta(item.opportunity_type);
  const img = item.image || (item.images && item.images[0]) || null;

  return (
    <Link
      href={`/ecotourism/${item.slug || item.id}`}
      className={cn(
        "group block reveal visible rounded-xl border border-ocean-border bg-white shadow-sm",
        "transition-all duration-300 hover:-translate-y-1.5 hover:shadow-ocean-lg sheen overflow-hidden",
        className
      )}
      style={{ transitionDelay: `${Math.min(index, 7) * 70}ms` }}
    >
      {/* Visual header */}
      <div className={cn("relative h-44 overflow-hidden bg-gradient-to-br", meta.gradient)}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl opacity-90 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
              {t.icon}
            </span>
            <span className="absolute -bottom-6 -right-4 text-[110px] leading-none opacity-10 select-none">
              {meta.icon}
            </span>
          </div>
        )}

        {/* Category chip */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {meta.icon} {meta.short}
        </span>

        {/* Price flag */}
        <span className="absolute -bottom-3.5 right-3 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-ocean-navy shadow-md transition-transform duration-300 group-hover:-translate-y-1">
          {priceOf(item)}
          <span className="text-[10px] font-medium text-ocean-text-secondary">
            {item.price_unit === "person" ? "/person" : item.price_unit === "boat" ? "/boat" : item.price_unit === "night" ? "/night" : item.price_unit === "student" ? "/student" : "/group"}
          </span>
        </span>

        {item.blocked_reason && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-bold text-white">
            ⛔ Ban window
          </span>
        )}
      </div>

      <div className="p-5 pt-6">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-ocean-navy transition-colors group-hover:text-ocean-blue">
            {item.name}
          </h3>
          {!!item.rating && (
            <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
              ★ {Number(item.rating).toFixed(1)}
            </span>
          )}
        </div>

        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ocean-blue">
          {t.icon} {t.label}
        </p>

        {item.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-ocean-text-secondary">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ocean-text-secondary">
          {(item.village_name || item.district_name) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-ocean-green" />
              {item.village_name || item.district_name}
            </span>
          )}
          {item.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {item.duration}
            </span>
          )}
          {item.max_participants && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              ≤{item.max_participants}
            </span>
          )}
          {item.family_name && (
            <span className="inline-flex items-center gap-1 font-medium text-ocean-coral">
              <Anchor className="h-3.5 w-3.5" />
              {item.family_name}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.is_sustainable && <EcoBadge tone="green">♻️ Sustainable</EcoBadge>}
          {item.lean_season_friendly !== false && !item.is_offshore && (
            <EcoBadge tone="amber">🌱 Lean-season ready</EcoBadge>
          )}
          {!!item.total_bookings && (
            <EcoBadge tone="blue">{item.total_bookings} booked</EcoBadge>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Package card                                                        */
/* ------------------------------------------------------------------ */

export function PackageCard({ pkg, index = 0 }: { pkg: EcoPackage; index?: number }) {
  const meta = MODEL_META[pkg.model_category] || MODEL_META.homestay_food;
  const price = typeof pkg.price === "string" ? parseFloat(pkg.price) : pkg.price;
  const original = pkg.original_price
    ? typeof pkg.original_price === "string"
      ? parseFloat(pkg.original_price)
      : pkg.original_price
    : null;
  const off = original && original > price ? Math.round(((original - price) / original) * 100) : null;

  return (
    <Link
      href={`/ecotourism/packages/${pkg.id}`}
      className={cn(
        "group relative block reveal visible overflow-hidden rounded-xl border-2 border-ocean-green/30 bg-white",
        "shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-ocean-lg sheen"
      )}
      style={{ transitionDelay: `${Math.min(index, 5) * 80}ms` }}
    >
      {off && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-ocean-coral px-2.5 py-1 text-[11px] font-bold text-white shadow">
          {off}% OFF
        </span>
      )}

      <div className={cn("relative h-36 overflow-hidden bg-gradient-to-br", meta.gradient)}>
        {pkg.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pkg.image} alt={pkg.title} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <span className="text-6xl animate-bob">🛶</span>
            <span className="text-6xl opacity-80">🏠</span>
            <span className="text-6xl animate-wave">🌅</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute bottom-2.5 left-3 text-xs font-semibold text-white/95">
          {meta.icon} {meta.short} · {pkg.duration_text}
        </span>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-ocean-green" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-ocean-green">
            O3L Package
          </span>
        </div>

        <h3 className="mb-2 line-clamp-2 font-semibold text-ocean-navy transition-colors group-hover:text-ocean-blue">
          {pkg.title}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-ocean-text-secondary">{pkg.description}</p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {(pkg.inclusions || []).slice(0, 4).map((inc) => (
            <span
              key={inc}
              className="rounded-md bg-ocean-light px-2 py-0.5 text-[11px] font-medium text-ocean-deep"
            >
              ✓ {inc}
            </span>
          ))}
          {(pkg.inclusions || []).length > 4 && (
            <span className="rounded-md bg-ocean-light px-2 py-0.5 text-[11px] font-medium text-ocean-deep">
              +{(pkg.inclusions || []).length - 4} more
            </span>
          )}
        </div>

        <div className="flex items-end justify-between border-t border-ocean-border pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-ocean-navy">{formatINR(price)}</span>
              {original && <span className="text-sm text-ocean-muted line-through">{formatINR(original)}</span>}
            </div>
            <span className="text-[11px] text-ocean-text-secondary">per person</span>
          </div>
          <div className="text-right text-[11px] text-ocean-text-secondary">
            {pkg.family_count !== undefined && (
              <div className="font-semibold text-ocean-coral">👨‍👩‍👧 {pkg.family_count} families share</div>
            )}
            {!!pkg.rating && <div>★ {Number(pkg.rating).toFixed(1)}</div>}
          </div>
        </div>
      </div>
    </Link>
  );
}
