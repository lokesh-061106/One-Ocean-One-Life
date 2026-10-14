"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Users, Anchor, Loader2, AlertCircle, LogIn, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EcoBadge, formatINR } from "./shared";
import type { EcoBooking } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Booking form for one experience OR one package.
 * Creates the booking, then sends the traveller to /ecotourism/checkout/[ref]
 * where the Razorpay payment + transparent ledger live.
 */
export function BookingWidget({
  kind,
  id,
  slug,
  unitPrice,
  priceUnit = "person",
  maxParticipants,
  blockedReason,
  title,
}: {
  kind: "experience" | "package";
  id: string;
  slug?: string;
  unitPrice: number | string | null;
  priceUnit?: string;
  maxParticipants?: number | null;
  blockedReason?: string | null;
  title: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unit = typeof unitPrice === "string" ? parseFloat(unitPrice) : unitPrice;
  const perUnit = priceUnit === "person" || priceUnit === "student";
  const total = useMemo(() => {
    if (!unit) return null;
    return perUnit ? unit * participants : unit;
  }, [unit, participants, perUnit]);

  const min = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const submit = async () => {
    setError(null);
    if (!date) return setError("Pick an experience date.");
    if (!name.trim()) return setError("Contact name is required.");
    if (!phone.trim()) return setError("Contact phone is required.");

    const token = localStorage.getItem("o3l_access_token");
    if (!token) {
      router.push(`/login?next=/ecotourism/${kind === "package" ? "packages/" + id : (slug || id)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ecotourism/bookings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [kind]: id,
          experience_date: date,
          participants,
          contact_name: name.trim(),
          contact_phone: phone.trim(),
          contact_email: email.trim(),
          special_requests: requests.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.experience_date?.[0] ||
          data?.participants?.[0] ||
          data?.experience?.[0] ||
          data?.package?.[0] ||
          data?.error ||
          (typeof data === "string" ? data : null) ||
          "Could not create the booking. Please try again.";
        setError(msg);
        return;
      }
      const booking = data as EcoBooking;
      router.push(`/ecotourism/checkout/${booking.booking_ref}`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (blockedReason) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold text-amber-800">Temporarily unavailable</p>
            <p className="mt-1 text-sm text-amber-700">{blockedReason}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="rounded-2xl border border-ocean-border bg-ocean-foam p-5 text-sm text-ocean-text-secondary">
        <Info className="mb-2 h-5 w-5 text-ocean-blue" />
        This listing has no price set yet — message the family to request a quote.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ocean-border bg-white p-6 shadow-ocean">
      <p className="mb-4 line-clamp-2 text-sm font-semibold text-ocean-blue">{title}</p>
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-ocean-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ocean-muted">Price</p>
          <p className="text-3xl font-extrabold text-ocean-navy">
            {formatINR(unit)}
            <span className="text-sm font-semibold text-ocean-text-secondary">
              /{priceUnit === "student" ? "student" : priceUnit === "night" ? "night" : priceUnit === "boat" ? "boat" : priceUnit === "group" ? "group" : "person"}
            </span>
          </p>
        </div>
        {total !== null && (
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-ocean-muted">Estimate</p>
            <p className="text-xl font-extrabold text-ocean-green">{formatINR(total)}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="eco-date">Date</Label>
            <Input
              id="eco-date"
              type="date"
              min={min}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="eco-people">
              {perUnit ? "Participants" : "Group size (info only)"}
            </Label>
            <div className="mt-1 flex items-center rounded-lg border border-ocean-border">
              <button
                type="button"
                aria-label="Decrease participants"
                className="px-3 py-2 text-ocean-text-secondary hover:text-ocean-blue"
                onClick={() => setParticipants((p) => Math.max(1, p - 1))}
              >
                −
              </button>
              <input
                id="eco-people"
                type="number"
                min={1}
                max={maxParticipants || 100}
                value={participants}
                onChange={(e) =>
                  setParticipants(Math.max(1, Math.min(Number(e.target.value) || 1, maxParticipants || 100)))
                }
                className="w-full bg-transparent py-2 text-center text-sm outline-none"
              />
              <button
                type="button"
                aria-label="Increase participants"
                className="px-3 py-2 text-ocean-text-secondary hover:text-ocean-blue"
                onClick={() => setParticipants((p) => Math.min(maxParticipants || 100, p + 1))}
              >
                +
              </button>
            </div>
            {maxParticipants ? (
              <p className="mt-1 text-[11px] text-ocean-muted">Max {maxParticipants}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="eco-name">Contact name *</Label>
            <Input
              id="eco-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="eco-phone">Phone *</Label>
            <Input
              id="eco-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="eco-email">Email (optional)</Label>
          <Input
            id="eco-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="eco-requests">Special requests</Label>
          <Textarea
            id="eco-requests"
            value={requests}
            onChange={(e) => setRequests(e.target.value)}
            placeholder="Dietary needs, accessibility, celebration…"
            rows={2}
            className="mt-1"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          size="lg"
          className="w-full bg-ocean-green hover:bg-ocean-green/90"
          onClick={submit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reserving…
            </>
          ) : (
            <>
              <Anchor className="mr-2 h-4 w-4" />
              Reserve &amp; pay — {total !== null ? formatINR(total) : "view price"}
            </>
          )}
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-ocean-muted">
          <LogIn className="mr-1 inline h-3 w-3" />
          You&apos;ll review the transparent money split on the next step before paying.
          {perUnit ? " Per-person pricing × participants." : " Flat pricing per booking."}
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          <EcoBadge tone="green">🔒 Secure payment</EcoBadge>
          <EcoBadge tone="amber">🌱 Cancel before 24h</EcoBadge>
          <EcoBadge tone="blue">✔ Family-run</EcoBadge>
        </div>
      </div>
    </div>
  );
}
