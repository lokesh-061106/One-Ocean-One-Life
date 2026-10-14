"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard, Loader2, ShieldCheck, CheckCircle2, XCircle, ArrowRight,
  CalendarDays, Users, MapPin, AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/components/eco/shared";
import { useRevealAll } from "@/hooks/use-reveal";
import type { EcoBooking, SplitLine } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface LedgerResponse {
  booking: EcoBooking;
  preview: boolean;
  lines?: SplitLine[];
  payouts?: SplitLine[] | null;
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("o3l_access_token") || ""}`,
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function EcoCheckoutPage() {
  const params = useParams<{ ref: string }>();
  const router = useRouter();
  const rootRef = useRevealAll<HTMLDivElement>();

  const [booking, setBooking] = useState<EcoBooking | null>(null);
  const [lines, setLines] = useState<SplitLine[]>([]);
  const [isPreview, setIsPreview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const bookingRef = String(params.ref || "");

  const load = useCallback(async () => {
    const token = localStorage.getItem("o3l_access_token");
    if (!token) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    // Find the booking by ref in "my bookings"
    let found: EcoBooking | null = null;
    try {
      const res = await fetch(`${API_BASE}/ecotourism/my-bookings/`, { headers: authHeaders() });
      if (res.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => null);
      const list: EcoBooking[] = data?.results || (Array.isArray(data) ? data : []);
      found = list.find((b) => b.booking_ref === bookingRef || b.id === bookingRef) || null;
    } catch {
      /* fall through */
    }

    if (!found) {
      setLoading(false);
      return;
    }

    setBooking(found);
    setPaid(found.payment_status === "paid");

    // money flow ledger (preview until paid)
    try {
      const led = await fetch(`${API_BASE}/ecotourism/bookings/${found.id}/ledger/`, {
        headers: authHeaders(),
      });
      if (led.ok) {
        const ledData = (await led.json()) as LedgerResponse;
        setIsPreview(ledData.preview);
        if (ledData.payouts && ledData.payouts.length) setLines(ledData.payouts);
        else if (ledData.lines) setLines(ledData.lines);
      }
    } catch {
      /* ledger is optional */
    }

    setLoading(false);
  }, [bookingRef]);

  useEffect(() => {
    // Deferred to a microtask so no setState runs synchronously in the effect.
    const t = setTimeout(() => {
      load().catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const payNow = async () => {
    if (!booking) return;
    setError(null);
    setPaying(true);
    try {
      const payRes = await fetch(`${API_BASE}/ecotourism/bookings/${booking.id}/pay/`, {
        method: "POST",
        headers: authHeaders(),
      });
      const order = await payRes.json().catch(() => ({}));
      if (!payRes.ok) {
        setError(order?.error || "Could not start the payment. Please try again.");
        setPaying(false);
        return;
      }

      const verify = async (paymentId: string, orderId: string, signature: string) => {
        const vRes = await fetch(`${API_BASE}/ecotourism/bookings/${booking.id}/verify/`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature,
          }),
        });
        const vData = await vRes.json().catch(() => ({}));
        if (!vRes.ok) {
          setError(vData?.error || "Payment verification failed.");
          setPaying(false);
          return;
        }
        setPaid(true);
        setPaying(false);
        await load();
      };

      if (order.mode === "live") {
        const ok = await loadRazorpayScript();
        if (!ok || !window.Razorpay) {
          setError("Could not load the payment gateway. Please check your connection.");
          setPaying(false);
          return;
        }
        const rzp = new window.Razorpay({
          key: order.key_id,
          order_id: order.order_id,
          amount: Math.round(Number(order.amount) * 100),
          currency: order.currency || "INR",
          name: "One Ocean • One Life",
          description: `Booking ${order.booking_ref}`,
          prefill: {},
          theme: { color: "#087EA4" },
          handler: (response: Record<string, string>) =>
            verify(
              response.razorpay_payment_id || "",
              response.razorpay_order_id || order.order_id,
              response.razorpay_signature || ""
            ),
          modal: { ondismiss: () => setPaying(false) },
        });
        rzp.open();
      } else {
        // Demo mode (no gateway keys configured) — simulate a successful payment
        await verify(
          `pay_demo_${Math.random().toString(36).slice(2, 14)}`,
          order.order_id,
          "demo_signature"
        );
      }
    } catch {
      setError("Network error — please try again.");
      setPaying(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm("Cancel this booking?")) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ecotourism/bookings/${booking.id}/cancel/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason: "Cancelled by traveller" }),
      });
      if (res.ok) {
        const data = (await res.json()) as EcoBooking;
        setBooking(data);
        setPaid(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Could not cancel this booking.");
      }
    } catch {
      setError("Network error.");
    }
  };

  /* ---------------- states ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-ocean-blue" />
          <p className="mt-4 text-ocean-text-secondary">Loading your booking…</p>
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
          <h1 className="mt-4 text-2xl font-bold text-ocean-navy">Sign in to continue</h1>
          <p className="mt-2 text-ocean-text-secondary">
            Bookings and payments need an O3L account.
          </p>
          <Button className="mt-6" onClick={() => router.push(`/login?next=/ecotourism/checkout/${bookingRef}`)}>
            Sign in
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-24 text-center">
          <XCircle className="mx-auto h-14 w-14 text-ocean-muted" />
          <h1 className="mt-4 text-2xl font-bold text-ocean-navy">Booking not found</h1>
          <p className="mt-2 text-ocean-text-secondary">
            Reference <b className="text-ocean-navy">{bookingRef}</b> is not in your bookings.
          </p>
          <Button className="mt-6" onClick={() => router.push("/ecotourism/bookings")}>
            My bookings
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const total = Number(booking.total_amount);
  const title = booking.experience_name || booking.package_title || "Ecotourism booking";

  return (
    <div ref={rootRef} className="min-h-screen bg-ocean-foam">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* header */}
        <div className="reveal visible mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-ocean-blue">
            Secure checkout · Ref {booking.booking_ref}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-ocean-navy">
            {paid ? "Booking confirmed 🎉" : "Review & pay"}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* left: summary */}
          <div className="space-y-6 lg:col-span-3">
            {/* booking summary */}
            <div className="reveal visible rounded-2xl border border-ocean-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-ocean-navy">
                <CalendarDays className="h-4 w-4 text-ocean-blue" /> Booking details
              </h2>

              <p className="text-lg font-bold text-ocean-navy">{title}</p>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ocean-muted">Date</p>
                  <p className="mt-1 font-semibold text-ocean-navy">
                    {new Date(booking.experience_date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ocean-muted">Participants</p>
                  <p className="mt-1 flex items-center gap-1 font-semibold text-ocean-navy">
                    <Users className="h-3.5 w-3.5" /> {booking.participants}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ocean-muted">Village</p>
                  <p className="mt-1 flex items-center gap-1 font-semibold text-ocean-navy">
                    <MapPin className="h-3.5 w-3.5 text-ocean-green" /> {booking.village_name || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-ocean-border pt-4">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                    booking.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-700"
                      : booking.status === "cancelled"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  Status: {booking.status}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                    booking.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-sky-50 text-sky-700"
                  }`}
                >
                  Payment: {booking.payment_status}
                </span>
                {booking.is_lean_season && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    🌱 Lean-season booking — supports a ban-season household
                  </span>
                )}
              </div>
            </div>

            {/* transparent ledger */}
            <div className="reveal visible rounded-2xl border border-ocean-green/30 bg-gradient-to-br from-emerald-50 via-white to-white p-6">
              <h2 className="mb-1 flex items-center gap-2 font-bold text-ocean-navy">
                <ShieldCheck className="h-4 w-4 text-ocean-green" /> {isPreview && !paid ? "Where your money will go" : "Where your money went"}
              </h2>
              <p className="mb-5 text-xs text-ocean-text-secondary">
                {isPreview && !paid
                  ? "Live preview — this exact split is created the moment payment succeeds."
                  : "Settled payout ledger for this booking — auditable by the village fund."}
              </p>

              <div className="mb-5 rounded-xl bg-white p-4 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ocean-muted">You pay</p>
                <p className="text-4xl font-extrabold text-ocean-navy">{formatINR(total)}</p>
              </div>

              <div className="space-y-4">
                {lines.map((line, i) => {
                  const amount = Number(line.amount);
                  const pct = Number(line.percentage);
                  const colors = [
                    "from-ocean-blue to-ocean-deep",
                    "from-emerald-500 to-ocean-green",
                    "from-slate-500 to-slate-700",
                    "from-ocean-coral to-rose-500",
                  ];
                  return (
                    <div key={line.recipient_type} className="reveal visible" style={{ transitionDelay: `${i * 90}ms` }}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold text-ocean-navy">{line.label}</span>
                        <span className="tabular-nums">
                          <b className="text-ocean-navy">{formatINR(amount)}</b>
                          <span className="ml-1.5 text-xs text-ocean-muted">{pct}%</span>
                          {line.status === "settled" && (
                            <span className="ml-1.5 text-[10px] font-bold text-emerald-600">SETTLED</span>
                          )}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-ocean-light">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]} transition-all duration-1000`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {!lines.length && (
                  <p className="text-sm text-ocean-text-secondary">Split preview unavailable.</p>
                )}
              </div>

              <div className="mt-5 rounded-xl bg-white/80 p-3 text-center text-[11px] leading-relaxed text-ocean-text-secondary shadow-sm">
                💡 {formatINR(total)} × recipients above always adds up to exactly what you pay —
                rounding stays with conservation.
              </div>
            </div>
          </div>

          {/* right: payment panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="reveal visible rounded-2xl border border-ocean-border bg-white p-6 shadow-ocean">
                {paid ? (
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-ocean-green" />
                    <h2 className="mt-4 text-xl font-extrabold text-ocean-navy">Payment successful</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ocean-text-secondary">
                      The village ledger has been updated. The family will confirm your slot shortly —
                      you&apos;ll get a call on the contact number you provided.
                    </p>
                    <div className="mt-6 space-y-3">
                      <Link href="/ecotourism/bookings" className="block">
                        <Button className="w-full bg-ocean-green hover:bg-ocean-green/90">
                          View my bookings &amp; ledger <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/ecotourism" className="block">
                        <Button variant="outline" className="w-full">Explore more experiences</Button>
                      </Link>
                    </div>
                  </div>
                ) : booking.status === "cancelled" ? (
                  <div className="text-center">
                    <XCircle className="mx-auto h-14 w-14 text-red-400" />
                    <h2 className="mt-4 text-lg font-bold text-ocean-navy">Booking cancelled</h2>
                    <p className="mt-2 text-sm text-ocean-text-secondary">
                      Any captured payment will be refunded and payouts reversed.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-ocean-navy">Amount due</span>
                      <span className="text-3xl font-extrabold text-ocean-navy">{formatINR(total)}</span>
                    </div>

                    {error && (
                      <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      size="lg"
                      className="w-full bg-ocean-green hover:bg-ocean-green/90"
                      onClick={payNow}
                      disabled={paying}
                    >
                      {paying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" /> Pay {formatINR(total)}
                        </>
                      )}
                    </Button>

                    <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-ocean-muted">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Razorpay · UPI, cards &amp; netbanking · 256-bit encrypted
                    </p>

                    <button
                      onClick={cancelBooking}
                      className="mt-4 w-full text-center text-xs font-semibold text-ocean-muted underline-offset-4 hover:text-red-500 hover:underline"
                    >
                      Cancel this booking
                    </button>
                  </>
                )}
              </div>

              <div className="reveal visible rounded-2xl border border-ocean-border bg-ocean-light/60 p-5 text-xs leading-relaxed text-ocean-text-secondary">
                <p className="mb-1.5 font-bold text-ocean-navy">🤝 The O3L promise</p>
                80% of your payment reaches the family &amp; village fund before O3L&apos;s platform
                and conservation shares — the split above is generated by the same code that
                creates the bank payout instructions.
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
