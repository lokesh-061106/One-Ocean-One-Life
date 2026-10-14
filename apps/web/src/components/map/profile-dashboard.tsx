"use client";

import { useMemo } from "react";
import { Anchor, BarChart3, Building2, CalendarDays, Map, Trees } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStateProfiles, type StateProfile as ApiStateProfile } from "@/hooks/use-api";
import type { MarineGeoData } from "@/hooks/use-marine-geo";
import {
  QUALITY_LEVELS,
  STATE_COLORS,
  STATE_PROFILES,
  getProfile,
  type ProfileView,
  type StateSlug,
} from "@/data/marine";

interface ProfileDashboardProps {
  selected: StateSlug;
  onSelect: (slug: StateSlug) => void;
  view: ProfileView;
  onViewChange: (view: ProfileView) => void;
  geo?: MarineGeoData;
  className?: string;
}

const VIEW_TABS: { id: ProfileView; label: string; icon: React.ReactNode }[] = [
  { id: "data", label: "Data", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "districts", label: "Districts", icon: <Map className="h-3.5 w-3.5" /> },
  { id: "villages", label: "Villages", icon: <Trees className="h-3.5 w-3.5" /> },
  { id: "harbours", label: "Harbours", icon: <Anchor className="h-3.5 w-3.5" /> },
  { id: "seasons", label: "Seasons", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { id: "agencies", label: "Agencies", icon: <Building2 className="h-3.5 w-3.5" /> },
];

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className="text-sm font-bold text-ocean-navy leading-snug mt-0.5">{value}</div>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const meta = QUALITY_LEVELS.find((q) => q.level === level);
  if (!meta) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: meta.color }}>
      {meta.icon} {meta.label}
    </span>
  );
}

export default function ProfileDashboard({
  selected,
  onSelect,
  view,
  onViewChange,
  geo,
  className = "",
}: ProfileDashboardProps) {
  const profile = getProfile(selected);
  const color = STATE_COLORS[selected];
  const { data: apiProfiles } = useStateProfiles();
  const apiProfile: ApiStateProfile | undefined = useMemo(
    () => apiProfiles?.results?.find((p) => p.slug === selected),
    [apiProfiles, selected]
  );

  const districts = geo?.districtsByState[profile.state] ?? [];
  const locations = geo?.locationsByState[profile.state] ?? [];
  const villages = locations.filter((f) => f.properties?.kind === "village");
  const harbours = locations.filter((f) => f.properties?.kind !== "village");

  const craftRows = [
    { label: "Mechanised", value: profile.crafts.mechanized, color: "#087EA4" },
    { label: "Motorised", value: profile.crafts.motorized, color: "#38BDF8" },
    { label: "Non-motorised", value: profile.crafts.nonMotorized, color: "#94A3B8" },
  ];
  const maxCraft = Math.max(...craftRows.map((r) => r.value));

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden ${className}`}>
      {/* state tabs */}
      <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50">
        {STATE_PROFILES.map((p) => {
          const on = p.slug === selected;
          return (
            <button
              key={p.slug}
              onClick={() => onSelect(p.slug)}
              className={`py-2.5 text-xs font-bold transition-colors border-b-2 ${
                on ? "text-ocean-navy" : "text-slate-400 hover:text-slate-600"
              }`}
              style={{ borderColor: on ? STATE_COLORS[p.slug] : "transparent" }}
            >
              {p.short}
            </button>
          );
        })}
      </div>

      {/* title */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
        <div className="min-w-0">
          <h3 className="font-bold text-ocean-navy text-sm leading-tight truncate">{profile.state}</h3>
          <p className="text-[11px] text-slate-400">
            {profile.coastalLengthKm} km coast · {profile.coastalDistricts} coastal districts
          </p>
        </div>
      </div>

      {/* view tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {VIEW_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onViewChange(t.id)}
            className={`flex-1 min-w-fit flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-semibold transition-colors border-b-2 ${
              view === t.id ? "text-ocean-blue border-ocean-blue bg-ocean-blue/5" : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-4 max-h-[560px]">
        {view === "data" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Coastal length" value={`${profile.coastalLengthKm} km`} />
              <Metric label="EEZ" value={profile.eez} />
              <Metric label="Continental shelf" value={`${profile.shelf} km²`} />
              <Metric label="Fishing villages" value={profile.fishingVillages} />
              <Metric label="Fisherfolk" value={profile.fisherfolk} />
              <Metric label="Welfare registered" value={profile.welfareRegistered} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-ocean-navy uppercase tracking-wide">Fishing crafts</h4>
                <Badge variant="secondary" className="text-[11px] font-bold">
                  {profile.crafts.total.toLocaleString("en-IN")}
                </Badge>
              </div>
              <div className="space-y-2">
                {craftRows.map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-500">{r.label}</span>
                      <span className="font-semibold text-ocean-navy">{r.value.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(4, (r.value / maxCraft) * 100)}%`, background: r.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* live platform stats */}
            <div className="rounded-lg border border-ocean-blue/25 bg-ocean-blue/5 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ocean-blue opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-ocean-blue" />
                </span>
                <h4 className="text-xs font-bold text-ocean-navy uppercase tracking-wide">Live O3L platform stats</h4>
              </div>
              {apiProfile?.live_stats ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { k: "Members", v: apiProfile.live_stats.members },
                    { k: "Contributions", v: apiProfile.live_stats.contributions },
                    { k: "Verified", v: apiProfile.live_stats.verified_contributions },
                    { k: "Points", v: apiProfile.live_stats.total_points },
                    { k: "Districts", v: apiProfile.live_stats.districts_in_db },
                    { k: "Villages", v: apiProfile.live_stats.villages_in_db },
                  ].map((s) => (
                    <div key={s.k}>
                      <div className="text-sm font-bold text-ocean-blue">{s.v.toLocaleString("en-IN")}</div>
                      <div className="text-[9px] uppercase text-slate-400 font-semibold">{s.k}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Live community stats unavailable — showing official static reference data. Start the O3L API to
                  merge contributor counts.
                </p>
              )}
            </div>

            {/* relief summary */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1.5">Ban relief & schemes</h4>
              {profile.relief.banRelief.map((r) => (
                <div key={r.label} className="text-[11px] mb-1.5">
                  <span className="font-bold text-amber-900">{r.label}:</span>{" "}
                  <span className="text-amber-800">{r.value}</span>
                </div>
              ))}
              <div className="text-[11px] text-amber-800">
                <CalendarDays className="h-3 w-3 inline -mt-0.5 mr-1" />
                <b>{profile.relief.period}</b>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">{profile.dataNote}</p>
          </>
        )}

        {view === "districts" && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">
              {districts.length} coastal district{districts.length === 1 ? "" : "s"} mapped for {profile.state}.
            </p>
            {districts.map((f) => {
              const name = String(f.properties?.district);
              const band = geo?.bands.features.find(
                (bf) => bf.properties?.district === name && bf.properties?.state === profile.state
              );
              const count = locations.filter((lf) => lf.properties?.district === name).length;
              return (
                <div key={name} className="border border-slate-200 rounded-lg p-2.5 hover:border-ocean-blue/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ocean-navy">{name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {count} mapped point{count === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {band && (
                    <div className="mt-1.5 space-y-1">
                      <div className="text-[11px] text-slate-600">
                        <span className="text-red-600 font-semibold">Ban:</span> {String(band.properties?.ban_period)}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span className="text-amber-600 font-semibold">Lean:</span> {String(band.properties?.lean_period)}
                      </div>
                      <ConfidenceBadge level={String(band.properties?.confidence)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(view === "villages" || view === "harbours") && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">
              {view === "villages"
                ? `${villages.length} marine fishing villages mapped from the official coastal inventory.`
                : `${harbours.length} fishing harbours and landing centres mapped for ${profile.state}.`}
            </p>
            {(view === "villages" ? villages : harbours).map((f, i) => (
              <div key={i} className="flex items-start justify-between gap-2 border border-slate-200 rounded-lg px-2.5 py-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-ocean-navy truncate">{String(f.properties?.name)}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {String(f.properties?.district)} {f.properties?.town ? `· ${String(f.properties.town)}` : ""}
                  </div>
                </div>
                <span
                  className="text-[10px] shrink-0 font-semibold"
                  style={{ color: f.properties?.kind === "harbour" ? "#0F766E" : f.properties?.kind === "village" ? "#2563EB" : "#0891B2" }}
                >
                  {String(f.properties?.kind)}
                </span>
              </div>
            ))}
          </div>
        )}

        {view === "seasons" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Annual fishing ban</h4>
              <p className="text-sm font-bold text-red-900">{profile.relief.period}</p>
              <ul className="mt-2 space-y-1">
                {profile.relief.highlights.map((h) => (
                  <li key={h} className="text-[11px] text-red-800 leading-relaxed flex gap-1.5">
                    <span className="text-red-400">•</span> {h}
                  </li>
                ))}
              </ul>
              {profile.relief.qualification && (
                <p className="text-[11px] text-amber-700 mt-2 italic">{profile.relief.qualification}</p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-ocean-navy uppercase tracking-wide mb-2">Lean fishing periods</h4>
              <div className="space-y-2">
                {profile.lean.map((l, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ocean-navy">{l.region}</span>
                      <span className="text-[11px] font-semibold text-amber-600 shrink-0">{l.period}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{l.reason}</p>
                    <div className="mt-1.5">
                      <ConfidenceBadge level={l.confidence} />
                      <div className="text-[10px] text-slate-400 mt-0.5">{l.confidenceLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "agencies" && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">
              State fisheries departments, cooperatives and institutions relevant to {profile.state}.
            </p>
            {profile.agencies.map((a) => (
              <div key={a.name} className="border border-slate-200 rounded-lg p-2.5">
                <div className="text-xs font-bold text-ocean-navy">{a.name}</div>
                <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{a.detail}</div>
              </div>
            ))}
            <p className="text-[10px] text-slate-400">
              API mirror: {apiProfile?.agencies?.length ?? "—"} agency records served by O3L /state-profiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
