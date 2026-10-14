"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ticket, Loader2, CalendarDays, MapPin, Users, ShieldCheck, AlertCircle,
  CreditCard, XCircle, ChevronDown, Anchor,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/components/eco/shared";
import { useRevealAll } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";
import type { EcoBooking, SplitLine } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  refunded: "bg-slate-100 text-slate-600 border-slate-200",
};

function LedgerRow({ line }: { line: SplitLine }) {
  const amount = Number(line.amount);
  const pct = Number(line.percentage);
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
      <span className="font-medium text-ocean-navy">{line.label}</span>
      <span className="tabular-nums">
        <b>{formatINR(amount)}</b>
        <span className="ml-1.5 text-xs text-ocean-muted">{pct}%</span>
        {line.status === "settled" && (
          <span className="ml-1.5 text-[10px] font-bold text-emerald-600">SETTLED</span>
        )}
      </span>
    </div>
  );
}

export default function EcoBookingsPage() {
  const router = useRouter();
  const rootRef = useRevealAll<HTMLDivElement>();

  const [bookings, setBookings] = useState<EcoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ledger, setLedger] = useState<Record<string, { lines?: SplitLine[]; payouts?: SplitLine[] | null; preview: boolean }>>({});
  const [ledgerLoading, setLedgerLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("o3l_access_token") || ""}`,
  });

  const load = useCallback(async () => {
    const token = localStorage.getItem("o3l_access_token");
    if (!token) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/ecotourism/my-bookings/`, { headers: authHeaders() });
      if (res.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => null);
      setBookings(data?.results || (Array.isArray(data) ? data : []));
    } catch {
      setError("Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so no setState runs synchronously in the effect.
    const t = setTimeout(() => {
      load().catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const toggleLedger = async (b: EcoBooking) => {
    if (expanded === b.id) {
      setExpanded(null);
      return;
    }
    setExpanded(b.id);
    if (ledger[b.id]) return;
    setLedgerLoading(b.id);
    try {
      const res = await fetch(`${API_BASE}/ecotourism/bookings/${b.id}/ledger/`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setLedger((prev) => ({
          ...prev,
          [b.id]: {
            lines: data.lines || undefined,
            payouts: data.payouts,
            preview: data.preview,
          },
        }));
      }
    } finally {
      setLedgerLoading(null);
    }
  };

  const cancel = async (b: EcoBooking) => {
    if (!window.confirm(`Cancel booking ${b.booking_ref}?`)) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ecotourism/bookings/${b.id}/cancel/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason: "Cancelled by traveller" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBookings((prev) => prev.map((x) => (x.id === b.id ? (data as EcoBooking) : x)));
      } else {
        setError(data?.error || "Could not cancel this booking.");
      }
    } catch {
      setError("Network error.");
    }
  };

  /* ---------- states ---------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-ocean-blue" />
          <p className="mt-4 text-ocean-text-secondary">Loading your bookings…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-24 text-center">
          <AlertCircle className="mx-auto h-14 w-14 text-ocean-coral" />
          <h1 className="mt-4 text-2xl font-bold text-ocean-navy">Sign in to see your bookings</h1>
          <p className="mt-2 text-ocean-text-secondary">
            Your booking history and transparent money ledger live behind your O3L account.
          </p>
          <Button className="mt-6" onClick={() => router.push("/login?next=/ecotourism/bookings")}>
            Sign in
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="min-h-screen bg-ocean-foam">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="reveal visible mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ocean-blue">
              <Ticket className="mr-1 inline h-3.5 w-3.5" /> Ecotourism
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-ocean-navy">My bookings</h1>
            <p className="mt-1 text-ocean-text-secondary">
              Every rupee of every booking — preview before you pay, settled ledger after.
            </p>
          </div>
          <Link href="/ecotourism">
            <Button variant="outline">Browse experiences</Button>
          </Link>
        </div>

        {error && (
          <div className="reveal visible mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="reveal visible rounded-2xl border border-dashed border-ocean-border bg-white py-20 text-center">
            <Anchor className="mx-auto h-14 w-14 text-ocean-muted" />
            <h2 className="mt-4 text-xl font-bold text-ocean-navy">No bookings yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ocean-text-secondary">
              Pick a fisher-led boat trip, a mangrove tour or a village homestay — the
              transparent split shows before you pay.
            </p>
            <Link href="/ecotourism" className="mt-6 inline-block">
              <Button className="bg-ocean-green hover:bg-ocean-green/90">Find experiences</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((b, i) => {
              const isExpanded = expanded === b.id;
              const led = ledger[b.id];
              const lines = (led?.payouts && led.payouts.length ? led.payouts : led?.lines) || [];
              const canPay = b.payment_status === "unpaid" && b.status !== "cancelled";
              const canCancel = b.status === "pending" || b.status === "confirmed";

              return (
                <div
                  key={b.id}
                  className="reveal visible overflow-hidden rounded-2xl border border-ocean-border bg-white shadow-sm transition-shadow hover:shadow-ocean"
                  style={{ transitionDelay: `${Math.min(i, 6) * 70}ms` }}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", STATUS_TONE[b.status] || STATUS_TONE.pending)}>
                            {b.status}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase",
                              b.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : b.payment_status === "refunded" ? "bg-slate-100 text-slate-600" : "bg-sky-100 text-sky-700"
                            )}
                          >
                            {b.payment_status}
                          </span>
                          {b.is_lean_season && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                              🌱 Lean season
                            </span>
                          )}
                        </div>

                        <h2 className="mt-2 truncate text-lg font-bold text-ocean-navy">
                          {b.experience_name || b.package_title || "Ecotourism booking"}
                        </h2>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ocean-text-secondary">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(b.experience_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" /> {b.participants}
                          </span>
                          {b.village_name && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-ocean-green" /> {b.village_name}
                            </span>
                          )}
                          <span className="font-mono text-xs text-ocean-muted">{b.booking_ref}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-ocean-navy">
                          {formatINR(Number(b.total_amount))}
                        </p>
                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                          {canPay && (
                            <Link href={`/ecotourism/checkout/${b.booking_ref}`}>
                              <Button size="sm" className="bg-ocean-green hover:bg-ocean-green/90">
                                <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Pay now
                              </Button>
                            </Link>
                          )}
                          {canCancel && (
                            <Button size="sm" variant="outline" onClick={() => cancel(b)}>
                              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleLedger(b)}
                      className="mt-4 flex w-full items-center justify-between rounded-xl bg-ocean-foam px-4 py-2.5 text-left text-sm font-semibold text-ocean-navy transition hover:bg-ocean-light"
                      aria-expanded={isExpanded}
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-ocean-green" />
                        {b.payment_status === "paid" ? "Payout ledger" : "Split preview"}
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 rounded-xl border border-ocean-border bg-ocean-foam p-3">
                        {ledgerLoading === b.id ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-sm text-ocean-text-secondary">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading ledger…
                          </div>
                        ) : lines.length ? (
                          <>
                            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-ocean-muted">
                              {led?.preview ? "Will be split as" : "Split as paid"}
                            </p>
                            {lines.map((line) => (
                              <LedgerRow key={line.recipient_type} line={line} />
                            ))}
                          </>
                        ) : (
                          <p className="py-3 text-center text-sm text-ocean-text-secondary">
                            Ledger unavailable for this booking.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
