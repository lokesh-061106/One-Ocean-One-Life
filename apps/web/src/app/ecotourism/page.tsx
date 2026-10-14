"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Search, Leaf, Anchor, Waves, Headphones, CalendarHeart,
  Sparkles, MapPin, Ticket, Loader2, SlidersHorizontal,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { fetchCms, fetchCmsList } from "@/lib/api-helpers";
import { cn } from "@/lib/utils";
import { useRevealAll } from "@/hooks/use-reveal";
import {
  MODEL_META, MODEL_ORDER, AnimatedNumber, EcoBadge, formatINR, typeMeta,
} from "@/components/eco/shared";
import { ExperienceCard, PackageCard } from "@/components/eco/experience-card";
import { SplitVisualizer } from "@/components/eco/split-visualizer";
import { LeanSeasonBanner } from "@/components/eco/lean-banner";
import { ExperienceMap } from "@/components/eco/experience-map";
import type {
  EcoModel, EcoPackage, EcoReview, LeanSeasonData, MapPoint,
  SplitRule, TourismOpportunity,
} from "@/types";

const SORTS = [
  { key: "rating", label: "Top rated" },
  { key: "price_min", label: "Price: low" },
  { key: "-price_min", label: "Price: high" },
  { key: "created_at", label: "Newest" },
] as const;

const HEARABLES = [
  { icon: "🐬", title: "Dolphin clicks", detail: "Burst pulses used for echolocation — the ocean's sonar." },
  { icon: "🐋", title: "Whale songs", detail: "Long, patterned calls that travel for kilometres." },
  { icon: "🦐", title: "Shrimp snaps", detail: "Tiny cavitation bubbles — the loudest crackle on the reef." },
  { icon: "⛵", title: "Boat noise", detail: "Propeller hum that masks marine communication." },
  { icon: "🌊", title: "Waves & rain", detail: "The broadband backdrop of a healthy coast." },
  { icon: "🏘", title: "Harbour sounds", detail: "Engines, gulls and hawsers — life at the landing centre." },
];

const FESTIVAL_SCHEDULE = [
  { time: "Morning", icon: "🎣", items: ["Traditional fishing demonstration", "Boat experience", "Fish identification"] },
  { time: "Afternoon", icon: "🍤", items: ["Local seafood stalls", "Coconut coastal food", "Fisherwomen's products", "Local crafts"] },
  { time: "Evening", icon: "🌅", items: ["Traditional music", "Sea stories by elders", "Sunset viewing", "Beach-cleaning activity"] },
];

export default function EcotourismPage() {
  const rootRef = useRevealAll<HTMLDivElement>();

  const [models, setModels] = useState<EcoModel[]>([]);
  const [experiences, setExperiences] = useState<TourismOpportunity[]>([]);
  const [packages, setPackages] = useState<EcoPackage[]>([]);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [reviews, setReviews] = useState<EcoReview[]>([]);
  const [lean, setLean] = useState<LeanSeasonData | null>(null);
  const [rules, setRules] = useState<SplitRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [showMap, setShowMap] = useState(false);
  const marketplaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const [m, e, p, mp, rv, ln, sr] = await Promise.all([
        fetchCmsList<EcoModel>("/ecotourism/models/"),
        fetchCmsList<TourismOpportunity>("/ecotourism/experiences/?ordering=-rating"),
        fetchCmsList<EcoPackage>("/ecotourism/packages/"),
        fetchCms<{ count: number; points: MapPoint[] }>("/ecotourism/map-points/"),
        fetchCmsList<EcoReview>("/ecotourism/reviews/"),
        fetchCms<LeanSeasonData>("/ecotourism/lean-season/"),
        fetchCmsList<SplitRule>("/ecotourism/split-rules/"),
      ]);
      setModels(m);
      setExperiences(e);
      setPackages(p);
      setPoints(mp?.points || []);
      setReviews(rv);
      setLean(ln);
      setRules(sr);
      setLoading(false);
    })();
  }, []);

  const splitPcts = useMemo(() => {
    const def = rules.find((r) => r.is_default) || rules[0];
    if (!def) return undefined;
    return {
      provider: Number(def.provider_pct),
      village: Number(def.village_pct),
      platform: Number(def.platform_pct),
      conservation: Number(def.conservation_pct),
    };
  }, [rules]);

  const filtered = useMemo(() => {
    let list = experiences;
    if (activeCat) list = list.filter((x) => x.model_category === activeCat);
    if (lean?.active) list = list.filter((x) => x.blocked_reason == null);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          (x.description || "").toLowerCase().includes(q) ||
          (x.village_name || "").toLowerCase().includes(q) ||
          typeMeta(x.opportunity_type).label.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "price_min") return Number(a.price_min || 0) - Number(b.price_min || 0);
      if (sortBy === "-price_min") return Number(b.price_min || 0) - Number(a.price_min || 0);
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
    return sorted;
  }, [experiences, activeCat, query, sortBy, lean]);

  const scrollToMarketplace = (cat?: string | null) => {
    setActiveCat(cat ?? null);
    setTimeout(() => {
      marketplaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const stats = [
    { value: experiences.length, suffix: "+", label: "Experiences across 4 states" },
    { value: 5, suffix: "", label: "Income models for fishing families" },
    { value: 80, suffix: "%", label: "Of every booking to families" },
    { value: points.length, suffix: "", label: "Coastal experience points" },
  ];

  return (
    <div ref={rootRef} className="min-h-screen bg-ocean-foam">
      <Header />

      <main>
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ocean-deep via-ocean-blue to-ocean-green gradient-shift">
          {/* floating decorations */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float" />
            <div className="absolute -right-16 top-40 h-64 w-64 rounded-full bg-ocean-coral/25 blur-3xl animate-float" style={{ animationDelay: "1.4s" }} />
            <div className="absolute left-1/3 bottom-6 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl animate-float" style={{ animationDelay: "2.6s" }} />
            {/* bubbles */}
            {[12, 30, 52, 68, 84].map((left, i) => (
              <span
                key={left}
                className="absolute bottom-0 h-3 w-3 rounded-full border border-white/40 bg-white/20 animate-bubble"
                style={{ left: `${left}%`, animationDelay: `${i * 1.3}s` }}
              />
            ))}
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
            <span className="animate-fade-in-down inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              <Leaf className="h-3.5 w-3.5" /> Tourism for the fishing community
            </span>

            <h1
              className="animate-fade-in-up mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "90ms" }}
            >
              Ecotourism that keeps{" "}
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent animate-gradient-shift">
                the ocean&apos;s wealth
              </span>{" "}
              in the village
            </h1>

            <p className="animate-fade-in-up mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-ocean-sand" style={{ animationDelay: "170ms" }}>
              Book fisher-led boat trips, mangrove tours, village homestays, ocean-learning
              programs and weekend festivals — designed so{" "}
              <b className="text-white">one tourist feeds several households</b>, especially
              during the fishing-ban and lean seasons.
            </p>

            <div className="animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "250ms" }}>
              <Button
                size="lg"
                className="bg-white text-ocean-deep shadow-float hover:bg-ocean-sand hover:-translate-y-0.5 transition-all"
                onClick={() => scrollToMarketplace(null)}
              >
                <Search className="mr-2 h-4 w-4" /> Explore experiences
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                onClick={() => document.getElementById("revenue-split")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Anchor className="mr-2 h-4 w-4" /> See where the money goes
              </Button>
              <Link href="/map">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/15">
                  <MapPin className="mr-2 h-4 w-4" /> Village map
                </Button>
              </Link>
            </div>

            {/* stats */}
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="animate-fade-in-up rounded-xl border border-white/15 bg-white/10 px-3 py-4 backdrop-blur-sm"
                  style={{ animationDelay: `${330 + i * 80}ms` }}
                >
                  <p className="text-2xl font-extrabold text-white sm:text-3xl">
                    <AnimatedNumber value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-ocean-sand">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="animate-fade-in-up mt-10" style={{ animationDelay: "700ms" }}>
              <span className="inline-flex flex-col items-center gap-1 text-white/70">
                <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
                <span className="h-6 w-4 rounded-full border-2 border-white/50 p-0.5">
                  <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-white animate-scroll-cue" />
                </span>
              </span>
            </div>
          </div>

          {/* wave divider */}
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-16 w-full" aria-hidden>
            <path
              d="M0,50 C240,95 480,5 720,45 C960,85 1200,15 1440,55 L1440,90 L0,90 Z"
              fill="#F8FCFC"
            />
          </svg>
        </section>

        {/* ================= LEAN SEASON ================= */}
        <section className="mx-auto -mt-2 max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <LeanSeasonBanner data={lean} onExplore={() => scrollToMarketplace("fisher_coastal")} />
        </section>

        {/* ================= 5 MODELS ================= */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="reveal visible mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-ocean-light px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ocean-blue">
              <Sparkles className="h-3.5 w-3.5" /> The O3L 5-model concept
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ocean-navy sm:text-4xl">
              Five ways a fishing family earns
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ocean-text-secondary">
              Not one income stream but an ecosystem — boat experiences, nature tours, homestays,
              ocean education and village festivals, packaged so everyone participates.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODEL_ORDER.map((key, i) => {
              const meta = MODEL_META[key];
              const live = models.find((m) => m.key === key);
              return (
                <button
                  key={key}
                  onClick={() => scrollToMarketplace(key)}
                  className={cn(
                    "reveal reveal-scale visible group relative overflow-hidden rounded-2xl p-6 text-left text-white shadow-ocean transition-all duration-300 hover:-translate-y-2 hover:shadow-ocean-lg sheen",
                    "bg-gradient-to-br",
                    meta.gradient,
                    i === 4 && "sm:col-span-2 lg:col-span-1"
                  )}
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <span className="absolute -right-5 -top-5 text-[110px] leading-none opacity-15 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                    {meta.icon}
                  </span>

                  <div className="relative">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
                      {meta.icon}
                    </span>
                    <h3 className="mt-4 text-lg font-bold leading-snug">{meta.label}</h3>
                    <p className="mt-2 min-h-[60px] text-sm leading-relaxed text-white/85">{live?.blurb}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-white/25 pt-3">
                      <span className="text-xs font-semibold text-white/90">
                        {(live?.experience_count || 0)} experiences
                        {(live?.package_count || 0) > 0 ? ` · ${live!.package_count} packages` : ""}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold">
                        {live?.min_price ? `from ${formatINR(live.min_price)}` : "view"}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* ecosystem explainer tile */}
            <div className="reveal visible rounded-2xl border-2 border-dashed border-ocean-green/40 bg-white p-6 sm:col-span-2 lg:col-span-1" style={{ transitionDelay: "450ms" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-ocean-green">One tourist, many households</p>
              <div className="mt-4 space-y-2.5 text-sm">
                {[
                  ["🚤", "Fisherman", "Boat guide"],
                  ["🍤", "Fisherwoman", "Food & homestay"],
                  ["📖", "Elder", "Sea storyteller"],
                  ["📷", "Young adult", "Digital guide / photographer"],
                  ["🎓", "Student", "Marine education assistant"],
                  ["🧺", "Craft-skilled member", "Souvenirs"],
                ].map(([emoji, who, role], idx) => (
                  <div
                    key={who}
                    className="reveal visible flex items-center gap-3 rounded-lg bg-ocean-foam px-3 py-2"
                    style={{ transitionDelay: `${idx * 60}ms` }}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="font-semibold text-ocean-navy">{who}</span>
                    <span className="ml-auto text-xs text-ocean-text-secondary">{role}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs italic text-ocean-text-secondary">
                During fishing-ban months, instead of ₹0 income, the whole family has work.
              </p>
            </div>
          </div>
        </section>

        {/* ================= MARKETPLACE ================= */}
        <section ref={marketplaceRef} className="border-y border-ocean-border bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="reveal visible mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ocean-coral">
                  <Ticket className="h-3.5 w-3.5" /> Bookable now
                </span>
                <h2 className="mt-2 text-3xl font-extrabold text-ocean-navy">Experiences marketplace</h2>
                <p className="mt-1.5 text-ocean-text-secondary">
                  {filtered.length} of {experiences.length} listings — every price is illustrative; final
                  pricing is set by the family.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-lg border border-ocean-border bg-ocean-foam px-3 py-2 focus-within:border-ocean-blue">
                  <Search className="mr-2 h-4 w-4 text-ocean-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search boats, food, sounds…"
                    className="w-48 bg-transparent text-sm outline-none placeholder:text-ocean-muted"
                    aria-label="Search experiences"
                  />
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-ocean-border px-3 py-2">
                  <SlidersHorizontal className="h-4 w-4 text-ocean-muted" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-sm outline-none"
                    aria-label="Sort experiences"
                  >
                    {SORTS.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* category chips */}
            <div className="reveal visible mb-8 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCat(null)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                  !activeCat
                    ? "border-ocean-deep bg-ocean-deep text-white shadow"
                    : "border-ocean-border bg-white text-ocean-text-secondary hover:border-ocean-blue hover:text-ocean-blue"
                )}
              >
                🌊 All models
              </button>
              {MODEL_ORDER.map((key) => {
                const meta = MODEL_META[key];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCat(key)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                      activeCat === key
                        ? "border-ocean-blue bg-ocean-blue text-white shadow-glow"
                        : "border-ocean-border bg-white text-ocean-text-secondary hover:border-ocean-blue hover:text-ocean-blue"
                    )}
                  >
                    {meta.icon} {meta.short}
                  </button>
                );
              })}
            </div>

            {/* grid */}
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-ocean-border bg-white p-0 overflow-hidden">
                    <div className="skeleton h-44 rounded-none" />
                    <div className="p-5 space-y-3">
                      <div className="skeleton h-5 w-3/4" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-3 w-full" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item, i) => (
                  <ExperienceCard key={item.id} item={item} index={i} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Waves className="mx-auto h-12 w-12 text-ocean-muted" />
                <p className="mt-4 font-semibold text-ocean-navy">No experiences match your filters</p>
                <p className="mt-1 text-sm text-ocean-text-secondary">Try another model or clear the search.</p>
                <Button className="mt-5" variant="outline" onClick={() => { setActiveCat(null); setQuery(""); }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ================= PACKAGES ================= */}
        {packages.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="reveal visible mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-ocean-coral/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ocean-coral">
                📦 Bundled by O3L
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-ocean-navy">
                Packages that split one payment across many families
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-ocean-text-secondary">
                Homestay + boat + food + demo + stories — automatically divided among the
                participating households when you pay.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {packages.map((p, i) => (
                <PackageCard key={p.id} pkg={p} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ================= MAP ================= */}
        <section className="border-y border-ocean-border bg-ocean-light/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="reveal visible mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ocean-green">
                  <MapPin className="h-3.5 w-3.5" /> Coastal experience points
                </span>
                <h2 className="mt-2 text-3xl font-extrabold text-ocean-navy">Every village on the map</h2>
                <p className="mt-1.5 text-ocean-text-secondary">
                  Tap a marker for price, rating and village — then open the listing.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowMap((s) => !s)} className="bg-white">
                {showMap ? "Hide map" : `Show map (${points.length} points)`}
              </Button>
            </div>

            <div className={cn("reveal visible transition-all duration-500", showMap ? "block" : "hidden")}>
              {showMap && points.length > 0 && <ExperienceMap points={points} />}
            </div>

            {!showMap && (
              <div className="reveal visible grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {["🛶 Boat experiences", "🌿 Nature tours", "🏠 Homestays & food", "🎧 Ocean learning"].map((label) => (
                  <div key={label} className="rounded-xl border border-ocean-border bg-white px-4 py-3 text-sm font-semibold text-ocean-navy shadow-sm">
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================= REVENUE SPLIT ================= */}
        <section id="revenue-split" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="reveal visible mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-ocean-deep/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ocean-deep">
              <Anchor className="h-3.5 w-3.5" /> Radical transparency
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ocean-navy sm:text-4xl">
              Tourism <span className="text-ocean-green">for</span> the fishing community —
              not tourism instead of it
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ocean-text-secondary">
              Move the slider. Every booking shows this exact breakdown in-app:
              tourist payment → provider → village fund → O3L → conservation reserve.
            </p>
          </div>

          <div className="reveal visible mx-auto max-w-3xl">
            <SplitVisualizer pcts={splitPcts} />
          </div>

          <div className="reveal visible mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["🧾", "Shown on every booking", "The ledger appears before and after payment."],
              ["⚙️", "Configurable, not hardcoded", "Percentages live in editable SplitRules."],
              ["⚖️", "Documented policy", "Aligned with O3L payments decisions in DECISIONS.md."],
            ].map(([icon, title, detail]) => (
              <div key={title} className="rounded-xl border border-ocean-border bg-white p-4 text-center shadow-sm">
                <span className="text-2xl">{icon}</span>
                <p className="mt-2 text-sm font-bold text-ocean-navy">{title}</p>
                <p className="mt-1 text-xs text-ocean-text-secondary">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= LISTEN TO THE OCEAN ================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ocean-navy via-ocean-deep to-ocean-blue py-16 text-white">
          <div className="pointer-events-none absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-ocean-blue/30 blur-3xl animate-float" />
          <div className="pointer-events-none absolute -right-10 bottom-10 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="reveal visible text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur">
                <Headphones className="h-3.5 w-3.5" /> Ocean Learning &amp; Blue Experiences
              </span>
              <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Listen to the Ocean</h2>
              <p className="mx-auto mt-3 max-w-2xl text-ocean-sand">
                Put on headphones and hear the sea the way O3L&apos;s marine bioacoustics work does —
                then find out <i>what am I hearing?</i>
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HEARABLES.map((h, i) => (
                <div
                  key={h.title}
                  className="reveal visible glass-dark rounded-xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl animate-wave">
                      {h.icon}
                    </span>
                    <p className="font-bold">{h.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ocean-sand">{h.detail}</p>
                </div>
              ))}
            </div>

            <div className="reveal visible mt-8 text-center">
              <Link href="/sounds">
                <Button size="lg" className="bg-white text-ocean-deep hover:bg-ocean-sand hover:-translate-y-0.5 transition-all">
                  <Headphones className="mr-2 h-4 w-4" /> Open the sound library
                </Button>
              </Link>
              <p className="mt-3 text-xs text-ocean-sand/70">
                School programs from ₹300/student · sound demos ₹1,000–2,000/group · citizen science ₹500–1,000
              </p>
            </div>
          </div>
        </section>

        {/* ================= FESTIVAL ================= */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="reveal visible mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-rose-600">
              <CalendarHeart className="h-3.5 w-3.5" /> Weekend Coastal Community Festival
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-ocean-navy">Saturday — Life of the Fishing Village</h2>
            <p className="mx-auto mt-3 max-w-2xl text-ocean-text-secondary">
              A weekly event that involves the whole village: 300 visitors × ₹300 average spend =
              <b className="text-ocean-navy"> ₹90,000</b> in one day, shared across stalls, boats,
              workshops and crafts.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {FESTIVAL_SCHEDULE.map((block, i) => (
              <div
                key={block.time}
                className="reveal visible rounded-2xl border border-ocean-border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-ocean"
                style={{ transitionDelay: `${i * 110}ms` }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-coral/15 to-amber-400/15 text-2xl">
                    {block.icon}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-ocean-coral">{block.time}</p>
                    <p className="text-sm font-semibold text-ocean-navy">Village festival</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-ocean-text-secondary">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ocean-green" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="reveal visible mt-6 text-center">
            <Button variant="outline" onClick={() => scrollToMarketplace("festival_market")}>
              See festival &amp; marketplace listings →
            </Button>
          </div>
        </section>

        {/* ================= REVIEWS ================= */}
        {reviews.length > 0 && (
          <section className="border-y border-ocean-border bg-white py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="reveal visible mb-8 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-ocean-blue">Verified stays</span>
                <h2 className="mt-2 text-3xl font-extrabold text-ocean-navy">What travellers say</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.slice(0, 6).map((r, i) => (
                  <figure
                    key={r.id}
                    className="reveal visible rounded-2xl border border-ocean-border bg-ocean-foam p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-ocean"
                    style={{ transitionDelay: `${i * 80}ms` }}
                  >
                    <div className="mb-3 flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <span key={s} className={s < r.rating ? "" : "text-ocean-border"}>★</span>
                      ))}
                    </div>
                    {r.title && <figcaption className="font-bold text-ocean-navy">{r.title}</figcaption>}
                    <blockquote className="mt-2 text-sm leading-relaxed text-ocean-text-secondary">
                      &ldquo;{r.comment}&rdquo;
                    </blockquote>
                    <p className="mt-4 flex items-center gap-2 text-xs text-ocean-muted">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ocean-blue/15 font-bold text-ocean-blue">
                        {(r.user_name || "T")[0]}
                      </span>
                      {r.user_name || "Traveller"}
                      {r.is_verified_stay && <EcoBadge tone="green">✓ Verified booking</EcoBadge>}
                    </p>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= FINAL CTA ================= */}
        <section className="relative overflow-hidden bg-gradient-to-r from-ocean-deep to-ocean-green py-20 text-center text-white">
          <div className="pointer-events-none absolute inset-0 ocean-pattern opacity-30" />
          <div className="relative mx-auto max-w-3xl px-4">
            <h2 className="reveal visible text-3xl font-extrabold sm:text-4xl">
              Become an O3L Coastal Experience Point
            </h2>
            <p className="reveal visible mt-4 text-lg text-ocean-sand">
              List your family&apos;s boat, room, kitchen or craft. Confirm bookings in your
              provider dashboard and watch the transparent ledger grow — through the ban season and beyond.
            </p>
            <div className="reveal visible mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-white text-ocean-deep hover:bg-ocean-sand hover:-translate-y-0.5 transition-all">
                  <Anchor className="mr-2 h-4 w-4" /> Register your family
                </Button>
              </Link>
              <Link href="/ecotourism/bookings">
                <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  My bookings &amp; ledger
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
