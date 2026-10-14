"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Anchor, CalendarDays, Loader2, CheckCircle2, XCircle, Wallet,
  AlertCircle, Ticket, Waves,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR, MODEL_META } from "@/components/eco/shared";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ProviderRow {
  id: string;
  booking_ref: string;
  title?: string;
  date: string;
  participants: number;
  total_amount: string | number;
  status: string;
  payment_status: string;
  customer_name: string;
}

interface ProviderData {
  experiences: number;
  total_bookings: number;
  pending_confirmations: number;
  upcoming: ProviderRow[];
  earnings: Record<string, string | number>;
}

const EARNING_LABELS: Record<string, { label: string; color: string; bar: string }> = {
  provider: { label: "Your family share", color: "text-ocean-blue", bar: "bg-ocean-blue" },
  village: { label: "Village fund", color: "text-ocean-green", bar: "bg-ocean-green" },
  platform: { label: "O3L platform", color: "text-slate-500", bar: "bg-slate-500" },
  conservation: { label: "Conservation reserve", color: "text-ocean-coral", bar: "bg-ocean-coral" },
};

export default function ProviderToursDashboard() {
  const [data, setData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("o3l_access_token");
    if (!token) {
      setError("Sign in to open your provider dashboard.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/ecotourism/provider/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setError("Session expired — please sign in again.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error();
      setData((await res.json()) as ProviderData);
    } catch {
      setError("Could not load your dashboard.");
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

  const act = async (id: string, action: "confirm" | "complete" | "cancel") => {
    const token = localStorage.getItem("o3l_access_token");
    if (!token) return;
    setActing(id + action);
    try {
      const res = await fetch(`${API_BASE}/ecotourism/provider/bookings/${id}/action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await load();
    } finally {
      setActing(null);
    }
  };

  const earningsTotal: number = data
    ? Object.values(data.earnings || {}).reduce<number>((sum, v) => sum + Number(v || 0), 0)
    : 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ocean-navy">Ecotourism Provider</h1>
        <p className="text-sm text-ocean-text-secondary">
          Your experiences, bookings and transparent earnings
        </p>
      </div>
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-ocean-blue" />
          <p className="mt-4 text-ocean-text-secondary">Loading provider dashboard…</p>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-lg py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-ocean-coral" />
          <p className="mt-4 font-semibold text-ocean-navy">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: <Waves className="h-5 w-5" />, label: "Active experiences", value: data.experiences, tone: "text-ocean-blue" },
              { icon: <Ticket className="h-5 w-5" />, label: "Total bookings", value: data.total_bookings, tone: "text-ocean-navy" },
              { icon: <CalendarDays className="h-5 w-5" />, label: "Needs confirmation", value: data.pending_confirmations, tone: "text-amber-600" },
              { icon: <Wallet className="h-5 w-5" />, label: "Earnings (all lines)", value: formatINR(earningsTotal), tone: "text-ocean-green" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-foam", s.tone)}>
                    {s.icon}
                  </div>
                  <p className="text-2xl font-extrabold tabular-nums text-ocean-navy">{s.value}</p>
                  <p className="mt-0.5 text-xs text-ocean-text-secondary">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* upcoming bookings */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-ocean-navy">
                  <CalendarDays className="h-4 w-4 text-ocean-blue" /> Upcoming bookings
                </h2>

                {data.upcoming.length === 0 ? (
                  <div className="py-10 text-center">
                    <Anchor className="mx-auto h-10 w-10 text-ocean-muted" />
                    <p className="mt-3 text-sm font-semibold text-ocean-navy">No upcoming bookings</p>
                    <p className="mt-1 text-xs text-ocean-text-secondary">
                      Confirmed reservations will show here with one-tap actions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.upcoming.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-xl border border-ocean-border bg-ocean-foam p-4 transition hover:border-ocean-blue/40"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] text-ocean-muted">{row.booking_ref}</span>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                  row.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : row.status === "cancelled"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-amber-100 text-amber-700"
                                )}
                              >
                                {row.status}
                              </span>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                  row.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                                )}
                              >
                                {row.payment_status}
                              </span>
                            </div>
                            <p className="mt-1.5 truncate font-semibold text-ocean-navy">
                              {row.title || "Booking"}
                            </p>
                            <p className="mt-0.5 text-xs text-ocean-text-secondary">
                              {row.customer_name} · {new Date(row.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              · {row.participants} pax · <b className="text-ocean-navy">{formatINR(Number(row.total_amount))}</b>
                            </p>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            {row.status === "pending" && (
                              <Button
                                size="sm"
                                className="bg-ocean-green hover:bg-ocean-green/90"
                                disabled={acting === row.id + "confirm"}
                                onClick={() => act(row.id, "confirm")}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
                              </Button>
                            )}
                            {row.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={acting === row.id + "complete"}
                                onClick={() => act(row.id, "complete")}
                              >
                                Complete
                              </Button>
                            )}
                            {(row.status === "pending" || row.status === "confirmed") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                disabled={acting === row.id + "cancel"}
                                onClick={() => act(row.id, "cancel")}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Decline
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* earnings breakdown */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-ocean-navy">
                  <Wallet className="h-4 w-4 text-ocean-green" /> Earnings ledger
                </h2>

                <div className="mb-4 rounded-xl bg-gradient-to-br from-ocean-deep to-ocean-green p-4 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Lifetime payouts
                  </p>
                  <p className="text-3xl font-extrabold">{formatINR(earningsTotal)}</p>
                </div>

                <div className="space-y-3">
                  {(["provider", "village", "platform", "conservation"] as const).map((key) => {
                    const meta = EARNING_LABELS[key];
                    const amount = Number(data.earnings?.[key] || 0);
                    const pct = earningsTotal ? Math.round((amount / earningsTotal) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-ocean-navy">{meta.label}</span>
                          <span className={cn("tabular-nums font-bold", meta.color)}>
                            {formatINR(amount)}
                            <span className="ml-1 text-[10px] text-ocean-muted">{pct}%</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-ocean-light">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", meta.bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 rounded-lg bg-ocean-foam p-3 text-[11px] leading-relaxed text-ocean-text-secondary">
                  These four lines come from the same <b>SplitRule</b> rows shown to travellers
                  before they pay — nothing is hidden or recalculated later.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* model guide */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 font-bold text-ocean-navy">Your five earning models</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {(["fisher_coastal", "nature_tours", "homestay_food", "ocean_learning", "festival_market"] as const).map((key) => {
                  const meta = MODEL_META[key];
                  return (
                    <div key={key} className={cn("rounded-xl bg-gradient-to-br p-4 text-white", meta.gradient)}>
                      <span className="text-2xl">{meta.icon}</span>
                      <p className="mt-2 text-sm font-bold leading-snug">{meta.short}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      </div>
    </DashboardLayout>
  );
}
