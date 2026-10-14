"use client";

import { Anchor, BadgeCheck, BookOpen, CalendarDays, Database, Fish, Handshake, Landmark, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/ocean-components";
import {
  COMPARISON_ROWS,
  DATA_NOTE,
  INPUT_SOURCES,
  QUALITY_LEVELS,
  SEASONAL_NOTE,
  STATE_COLORS,
  STATE_PROFILES,
  SUMMARY_MODULES,
} from "@/data/marine";

/* ------------------------------------------------------------------ */
/* Summary bar                                                         */
/* ------------------------------------------------------------------ */

export function SummaryBar() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {SUMMARY_MODULES.map((m) => (
          <div key={m.id} className="bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-3 text-center">
            <div className="text-lg">{m.icon}</div>
            <div className="text-base font-extrabold text-ocean-navy leading-tight mt-0.5">{m.value}</div>
            <div className="text-[11px] font-semibold text-ocean-blue">{m.label}</div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Comparison table (§6)                                               */
/* ------------------------------------------------------------------ */

export function ComparisonSection() {
  return (
    <section id="data" className="scroll-mt-24">
      <SectionHeader
        title="State comparison"
        subtitle="Marine fisheries indicators across Andhra Pradesh, Karnataka, Kerala and Tamil Nadu — official reference figures."
      />
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-ocean-navy text-white text-left">
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Indicator</th>
                {STATE_PROFILES.map((p) => (
                  <th key={p.slug} className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-center">
                    {p.short} · {p.state}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.indicator} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-4 py-2.5 font-semibold text-ocean-navy border-t border-slate-100">
                    {row.indicator}
                    {row.unit && <span className="text-slate-400 font-normal text-xs"> ({row.unit})</span>}
                  </td>
                  {STATE_PROFILES.map((p) => (
                    <td
                      key={p.slug}
                      className="px-4 py-2.5 text-center text-slate-700 border-t border-slate-100 font-medium"
                    >
                      {row.values[p.slug]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-[11px] text-slate-400 mt-2">{DATA_NOTE}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Marine profile cards (§8 indicators)                                */
/* ------------------------------------------------------------------ */

export function ProfileSection() {
  return (
    <section id="marine-profile" className="scroll-mt-24">
      <SectionHeader
        title="Marine profile"
        subtitle="Per-state coastal profile: boundaries, communities, fleets and welfare."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STATE_PROFILES.map((p) => (
          <Card key={p.slug} className="overflow-hidden">
            <div className="h-1.5" style={{ background: STATE_COLORS[p.slug] }} />
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: STATE_COLORS[p.slug] }} />
                  {p.state}
                </span>
                <Badge variant="secondary" className="text-[11px]">
                  {p.crafts.total.toLocaleString("en-IN")} crafts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { k: "Coast", v: `${p.coastalLengthKm} km` },
                  { k: "EEZ", v: p.eez },
                  { k: "Shelf", v: `${p.shelf} km²` },
                  { k: "Districts", v: String(p.coastalDistricts) },
                  { k: "Villages", v: p.fishingVillages },
                  { k: "Fisherfolk", v: p.fisherfolk },
                ].map((m) => (
                  <div key={m.k} className="bg-slate-50 border border-slate-100 rounded-lg py-2 px-1">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">{m.k}</div>
                    <div className="text-xs font-bold text-ocean-navy leading-tight">{m.v}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { icon: <Fish className="h-3 w-3" />, label: `${p.crafts.mechanized.toLocaleString("en-IN")} mechanised` },
                  { icon: <Waves className="h-3 w-3" />, label: `${p.crafts.motorized.toLocaleString("en-IN")} motorised` },
                  { icon: <Anchor className="h-3 w-3" />, label: `${p.crafts.nonMotorized.toLocaleString("en-IN")} non-motorised` },
                ].map((chip) => (
                  <span key={chip.label} className="inline-flex items-center gap-1 text-[11px] bg-ocean-blue/10 text-ocean-navy px-2 py-1 rounded-full font-semibold">
                    {chip.icon} {chip.label}
                  </span>
                ))}
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ocean-navy mb-1">
                  <Landmark className="h-3.5 w-3.5" /> Welfare
                </div>
                <p className="text-[11px] text-slate-600">{p.welfareRegistered}</p>
              </div>

              <p className="text-[10px] text-slate-400">{p.dataNote}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fisheries agencies (§9)                                             */
/* ------------------------------------------------------------------ */

export function AgenciesSection() {
  return (
    <section id="agencies" className="scroll-mt-24">
      <SectionHeader
        title="Fisheries agencies & institutions"
        subtitle="Departments, cooperatives and corporations responsible for marine fisheries governance and welfare."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {STATE_PROFILES.map((p) => (
          <Card key={p.slug}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATE_COLORS[p.slug] }} />
                {p.state}
                <Badge variant="secondary" className="ml-auto text-[10px]">{p.agencies.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {p.agencies.map((a) => (
                <div key={a.name} className="border-l-2 pl-2.5 py-0.5" style={{ borderColor: STATE_COLORS[p.slug] }}>
                  <div className="text-xs font-bold text-ocean-navy">{a.name}</div>
                  <div className="text-[11px] text-slate-500 leading-snug">{a.detail}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fishing seasons (§10)                                               */
/* ------------------------------------------------------------------ */

export function SeasonsSection() {
  return (
    <section id="seasons" className="scroll-mt-24">
      <SectionHeader
        title="Fishing seasons, bans & lean periods"
        subtitle="Seasonal closures and low-activity windows along the south Indian coast, with source confidence."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {STATE_PROFILES.map((p) => (
          <Card key={p.slug}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: STATE_COLORS[p.slug] }} />
                {p.state}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-500">Annual ban window</div>
                <div className="text-sm font-bold text-red-900 mt-0.5">{p.relief.period}</div>
              </div>

              <div className="space-y-2">
                {p.lean.map((l, i) => {
                  const q = QUALITY_LEVELS.find((x) => x.level === l.confidence);
                  return (
                    <div key={i} className="border border-slate-200 rounded-lg p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-ocean-navy">{l.region}</span>
                        <span className="text-[11px] font-semibold text-amber-600">{l.period}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{l.reason}</p>
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        {q && (
                          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: q.color }}>
                            {q.icon} {q.label}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 text-right leading-tight">{l.confidenceLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mt-3">{SEASONAL_NOTE}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Relief & schemes (§11)                                              */
/* ------------------------------------------------------------------ */

export function ReliefSection() {
  return (
    <section id="relief" className="scroll-mt-24">
      <SectionHeader
        title="Fishing ban relief & schemes"
        subtitle="Financial support announced for fisher families during ban and lean periods."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STATE_PROFILES.map((p) => (
          <Card key={p.slug} className="border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Handshake className="h-4 w-4 text-amber-600" />
                {p.state}
                <span className="ml-auto text-[11px] font-semibold text-slate-400">{p.relief.period}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {p.relief.banRelief.map((r) => (
                <div key={r.label} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-amber-900">{r.label}</div>
                  <div className="text-[13px] text-amber-800 mt-0.5">{r.value}</div>
                </div>
              ))}

              <ul className="space-y-1.5">
                {p.relief.highlights.map((h) => (
                  <li key={h} className="text-[12px] text-slate-600 leading-relaxed flex gap-2">
                    <BadgeCheck className="h-4 w-4 text-ocean-blue shrink-0 mt-0.5" /> {h}
                  </li>
                ))}
              </ul>

              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                <b className="text-ocean-navy">Livelihood support:</b> {p.relief.livelihood}
              </div>
              {p.relief.qualification && (
                <div className="text-[11px] text-amber-700 italic">{p.relief.qualification}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Data sources & quality (§12–13)                                     */
/* ------------------------------------------------------------------ */

export function ReportsSection() {
  return (
    <section id="reports" className="scroll-mt-24">
      <SectionHeader
        title="Marine data inputs & quality"
        subtitle="Where the dashboard's information comes from, and how to read its confidence marks."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-ocean-blue" /> Marine information inputs
              <Badge variant="secondary" className="ml-auto text-[10px]">{INPUT_SOURCES.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INPUT_SOURCES.map((s) => (
              <div key={s.name} className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                <span className="text-base leading-none mt-0.5">{s.icon}</span>
                <div>
                  <div className="text-xs font-bold text-ocean-navy">{s.name}</div>
                  <div className="text-[11px] text-slate-500 leading-snug">{s.detail}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-ocean-blue" /> Data quality legend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {QUALITY_LEVELS.map((q) => (
              <div key={q.level} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: q.color }}>
                  <span className="text-base leading-none">{q.icon}</span> {q.label}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{q.detail}</p>
              </div>
            ))}
            <div className="rounded-lg bg-ocean-blue/5 border border-ocean-blue/25 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ocean-navy">
                <BookOpen className="h-3.5 w-3.5" /> Data note
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{DATA_NOTE}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
