"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, MapPin, Users, Anchor, Check, X, Calendar,
  ShieldCheck, Loader2, Waves,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { fetchCms, fetchCmsList, mediaUrl } from "@/lib/api-helpers";
import { useRevealAll } from "@/hooks/use-reveal";
import {
  MODEL_META, EcoBadge, Stars, formatINR, priceOf, typeMeta,
} from "@/components/eco/shared";
import { ExperienceCard } from "@/components/eco/experience-card";
import { BookingWidget } from "@/components/eco/booking-widget";
import type { EcoReview, TourismOpportunity } from "@/types";

export default function ExperienceDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const rootRef = useRevealAll<HTMLDivElement>();

  const [item, setItem] = useState<TourismOpportunity | null>(null);
  const [reviews, setReviews] = useState<EcoReview[]>([]);
  const [related, setRelated] = useState<TourismOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!params.slug) return;
    (async () => {
      setLoading(true);
      const data = await fetchCms<TourismOpportunity>(`/ecotourism/experiences/${params.slug}/`);
      setItem(data);
      if (data) {
        const [rv, rel] = await Promise.all([
          fetchCmsList<EcoReview>(`/ecotourism/reviews/?experience=${data.id}`),
          fetchCmsList<TourismOpportunity>(
            `/ecotourism/experiences/?model_category=${data.model_category}&exclude=${data.id}`
          ),
        ]);
        setReviews(rv);
        setRelated(rel.filter((r) => r.id !== data.id).slice(0, 3));
      }
      setLoading(false);
    })();
  }, [params.slug]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightbox]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-20 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-ocean-blue" />
          <p className="mt-4 text-ocean-text-secondary">Loading experience…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-24 text-center">
          <Waves className="mx-auto h-16 w-16 text-ocean-muted" />
          <h1 className="mt-4 text-2xl font-bold text-ocean-navy">Experience not found</h1>
          <p className="mt-2 text-ocean-text-secondary">It may have been removed or renamed.</p>
          <Button className="mt-6" onClick={() => router.push("/ecotourism")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to ecotourism
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const meta = MODEL_META[item.model_category] || MODEL_META.fisher_coastal;
  const t = typeMeta(item.opportunity_type);
  const gallery = (item.images && item.images.length ? item.images : [item.image || ""]).filter(
    Boolean
  ) as string[];
  const hero = gallery[imgIdx] || null;
  const splitLines = item.split_preview || [];
  const familyObj = (item as unknown as { family?: { name?: string; rating?: number } | null }).family;

  return (
    <div ref={rootRef} className="min-h-screen bg-ocean-foam">
      <Header />

      <main>
        {/* breadcrumb bar */}
        <div className="border-b border-ocean-border bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 text-sm font-medium text-ocean-text-secondary hover:text-ocean-blue"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span className="text-ocean-muted">/</span>
            <Link href="/ecotourism" className="text-sm font-medium text-ocean-text-secondary hover:text-ocean-blue">
              Ecotourism
            </Link>
            <span className="text-ocean-muted">/</span>
            <span className="truncate text-sm font-semibold text-ocean-navy">{item.name}</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* ------- left: gallery + content ------- */}
            <div className="lg:col-span-2">
              {/* gallery */}
              <div className="reveal visible overflow-hidden rounded-2xl border border-ocean-border shadow-ocean">
                <div className={`relative h-72 bg-gradient-to-br ${meta.gradient} sm:h-96`}>
                  {hero ? (
                    <button
                      type="button"
                      className="group h-full w-full"
                      onClick={() => setLightbox(true)}
                      aria-label="Open image"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaUrl(hero)}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </button>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-9xl opacity-90">{t.icon}</span>
                      <span className="absolute -bottom-10 -right-6 text-[160px] leading-none opacity-10">
                        {meta.icon}
                      </span>
                    </div>
                  )}

                  <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                    {meta.icon} {meta.label}
                  </span>

                  {item.blocked_reason && (
                    <span className="absolute right-4 top-4 rounded-full bg-amber-500/95 px-3 py-1.5 text-xs font-bold text-white">
                      ⛔ Ban window
                    </span>
                  )}
                </div>

                {gallery.filter(Boolean).length > 1 && (
                  <div className="flex gap-2 overflow-x-auto bg-white p-3">
                    {gallery.filter(Boolean).map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        onClick={() => setImgIdx(i)}
                        className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                          i === imgIdx ? "border-ocean-blue" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* title block */}
              <div className="reveal visible mt-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <EcoBadge tone="blue">{t.icon} {t.label}</EcoBadge>
                  {item.is_sustainable && <EcoBadge tone="green">♻️ Sustainable</EcoBadge>}
                  {item.is_offshore ? (
                    <EcoBadge tone="coral">🚤 Offshore</EcoBadge>
                  ) : (
                    <EcoBadge tone="green">🌱 Shore-based</EcoBadge>
                  )}
                  {item.lean_season_friendly !== false && (
                    <EcoBadge tone="amber">Lean-season ready</EcoBadge>
                  )}
                </div>

                <h1 className="text-3xl font-extrabold text-ocean-navy sm:text-4xl">{item.name}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  {!!item.rating && <Stars rating={Number(item.rating)} count={item.total_reviews} />}
                  {(item.village_name || item.district_name) && (
                    <span className="inline-flex items-center gap-1 text-ocean-text-secondary">
                      <MapPin className="h-4 w-4 text-ocean-green" />
                      {[item.village_name, item.district_name, item.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {!!item.total_bookings && (
                    <span className="inline-flex items-center gap-1 text-ocean-text-secondary">
                      <Users className="h-4 w-4" /> {item.total_bookings} booked
                    </span>
                  )}
                </div>
              </div>

              {/* quick facts */}
              <div className="reveal visible mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: <Clock className="h-4 w-4" />, label: "Duration", value: item.duration || (item.duration_minutes ? `${item.duration_minutes} min` : "—") },
                  { icon: <Users className="h-4 w-4" />, label: "Group", value: item.max_participants ? `≤ ${item.max_participants}` : "Open" },
                  { icon: <Calendar className="h-4 w-4" />, label: "Weekday", value: item.weekday || "Daily" },
                  { icon: <Anchor className="h-4 w-4" />, label: "Run by", value: familyObj?.name || item.family_name || "O3L family" },
                ].map((f, i) => (
                  <div
                    key={f.label}
                    className="reveal visible rounded-xl border border-ocean-border bg-white p-4"
                    style={{ transitionDelay: `${i * 70}ms` }}
                  >
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ocean-muted">
                      {f.icon} {f.label}
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-ocean-navy">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* description */}
              {item.description && (
                <div className="reveal visible mt-6 rounded-2xl border border-ocean-border bg-white p-6">
                  <h2 className="mb-3 text-lg font-bold text-ocean-navy">About this experience</h2>
                  <p className="whitespace-pre-line leading-relaxed text-ocean-text-secondary">
                    {item.description}
                  </p>
                </div>
              )}

              {/* highlights + inclusions */}
              {((item.highlights?.length || 0) + (item.inclusions?.length || 0)) > 0 && (
                <div className="reveal visible mt-6 grid gap-5 sm:grid-cols-2">
                  {!!item.highlights?.length && (
                    <div className="rounded-2xl border border-ocean-border bg-white p-6">
                      <h3 className="mb-3 flex items-center gap-2 font-bold text-ocean-navy">
                        <SparklesIcon /> Highlights
                      </h3>
                      <ul className="space-y-2.5">
                        {item.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2 text-sm text-ocean-text-secondary">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ocean-green/15 text-[10px] text-ocean-green">✓</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!!item.inclusions?.length && (
                    <div className="rounded-2xl border border-ocean-border bg-white p-6">
                      <h3 className="mb-3 flex items-center gap-2 font-bold text-ocean-navy">
                        <Check className="h-4 w-4 text-ocean-green" /> What&apos;s included
                      </h3>
                      <ul className="space-y-2.5">
                        {item.inclusions.map((h) => (
                          <li key={h} className="flex items-start gap-2 text-sm text-ocean-text-secondary">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ocean-green" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* meeting point */}
              {item.meeting_point && (
                <div className="reveal visible mt-6 rounded-2xl border border-ocean-border bg-white p-6">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-ocean-navy">
                    <MapPin className="h-4 w-4 text-ocean-coral" /> Meeting point
                  </h3>
                  <p className="text-sm text-ocean-text-secondary">{item.meeting_point}</p>
                </div>
              )}

              {/* transparent split */}
              {splitLines.length > 0 && (
                <div className="reveal visible mt-6 overflow-hidden rounded-2xl border border-ocean-green/30 bg-gradient-to-br from-emerald-50 to-white p-6">
                  <h3 className="mb-1 flex items-center gap-2 font-bold text-ocean-navy">
                    <ShieldCheck className="h-4 w-4 text-ocean-green" /> Where your money goes
                  </h3>
                  <p className="mb-4 text-xs text-ocean-text-secondary">
                    On the {priceOf(item)} price below, every rupee is tracked:
                  </p>
                  <div className="space-y-2.5">
                    {splitLines.map((line) => (
                      <div key={line.recipient_type}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-semibold text-ocean-navy">{line.label}</span>
                          <span className="tabular-nums font-bold text-ocean-navy">
                            {formatINR(Number(line.amount))}{" "}
                            <span className="text-xs font-medium text-ocean-muted">({Number(line.percentage)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-ocean-light">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-ocean-green to-ocean-blue transition-all duration-700"
                            style={{ width: `${Math.min(100, Number(line.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* reviews */}
              <div className="reveal visible mt-6 rounded-2xl border border-ocean-border bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-ocean-navy">Reviews</h3>
                  {!!item.rating && <Stars rating={Number(item.rating)} count={item.total_reviews} size="md" />}
                </div>
                {reviews.length ? (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="border-b border-ocean-border pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-blue/15 text-sm font-bold text-ocean-blue">
                            {(r.user_name || "T")[0]}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ocean-navy">{r.user_name || "Traveller"}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400">{"★".repeat(r.rating)}<span className="text-ocean-border">{"★".repeat(5 - r.rating)}</span></span>
                              {r.is_verified_stay && <EcoBadge tone="green">✓ Verified</EcoBadge>}
                            </div>
                          </div>
                        </div>
                        {r.title && <p className="mt-2 text-sm font-semibold text-ocean-navy">{r.title}</p>}
                        {r.comment && <p className="mt-1 text-sm text-ocean-text-secondary">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ocean-text-secondary">
                    No reviews yet — be the first to book and share your story.
                  </p>
                )}
              </div>

              {/* related */}
              {related.length > 0 && (
                <div className="mt-10">
                  <h3 className="reveal visible mb-4 text-xl font-extrabold text-ocean-navy">
                    More {meta.short.toLowerCase()} experiences
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {related.map((r, i) => (
                      <ExperienceCard key={r.id} item={r} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ------- right: sticky booking ------- */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <BookingWidget
                  kind="experience"
                  id={item.id}
                  slug={item.slug}
                  unitPrice={item.booking_price ?? item.price_min ?? null}
                  priceUnit={item.price_unit || "person"}
                  maxParticipants={item.max_participants}
                  blockedReason={item.blocked_reason}
                  title={item.name}
                />

                {(item.village_name || item.meeting_point) && (
                  <div className="rounded-2xl border border-ocean-border bg-white p-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ocean-muted">Where</p>
                    <p className="flex items-start gap-2 text-sm font-semibold text-ocean-navy">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ocean-green" />
                      {[item.meeting_point, item.village_name, item.district_name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-ocean-border bg-ocean-light/60 p-5 text-xs leading-relaxed text-ocean-text-secondary">
                  <p className="mb-1.5 font-bold text-ocean-navy">♻️ Why this matters</p>
                  Booking directly funds the fishing family and the village fund — no middlemen.
                  During fishing-ban months your visit becomes their alternative income.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* lightbox */}
      {lightbox && hero && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(hero)}
            alt={item.name}
            className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}

function SparklesIcon() {
  return (
    <span className="flex h-4 w-4 items-center justify-center text-xs text-ocean-green">✦</span>
  );
}
