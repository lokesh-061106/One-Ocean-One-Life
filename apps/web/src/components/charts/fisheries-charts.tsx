"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATE_COLORS, STATE_PROFILES } from "@/data/marine";

const CRAFT_COLORS = { mechanized: "#087EA4", motorized: "#38BDF8", nonMotorized: "#94A3B8" };

const craftData = STATE_PROFILES.map((p) => ({
  state: p.short,
  full: p.state,
  slug: p.slug,
  color: STATE_COLORS[p.slug],
  mechanized: p.crafts.mechanized,
  motorized: p.crafts.motorized,
  nonMotorized: p.crafts.nonMotorized,
  total: p.crafts.total,
}));

const coastData = STATE_PROFILES.map((p) => ({
  state: p.short,
  full: p.state,
  color: STATE_COLORS[p.slug],
  coast: Number(p.coastalLengthKm.split(/[–-]/)[0].replace(/,/g, "")),
  villages: Number((p.fishingVillages.split(/[–-]/)[0] || "0").replace(/,/g, "")),
}));

export default function FisheriesCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Fishing crafts by state</span>
            <span className="text-xs font-medium text-slate-400">stacked · latest official counts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={craftData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis dataKey="state" type="category" width={40} tick={{ fontSize: 12, fill: "#082A38", fontWeight: 700 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [value.toLocaleString("en-IN"), name]}
                  labelFormatter={(label) => craftData.find((d) => d.state === label)?.full ?? String(label)}
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E2E8F0" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="nonMotorized" name="Non-motorised" stackId="crafts" fill={CRAFT_COLORS.nonMotorized} radius={[0, 0, 0, 0]} />
                <Bar dataKey="motorized" name="Motorised" stackId="crafts" fill={CRAFT_COLORS.motorized} />
                <Bar dataKey="mechanized" name="Mechanised" stackId="crafts" fill={CRAFT_COLORS.mechanized} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {craftData.map((d) => (
              <div key={d.state} className="text-center rounded-lg border border-slate-100 bg-slate-50 py-1.5">
                <div className="text-sm font-bold" style={{ color: d.color }}>
                  {d.total.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">{d.full}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Coastal length &amp; fishing villages</span>
            <span className="text-xs font-medium text-slate-400">km · village count</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coastData} margin={{ top: 4, right: 8, bottom: 4, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="state" tick={{ fontSize: 12, fill: "#082A38", fontWeight: 700 }} />
                <YAxis yAxisId="km" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis yAxisId="v" orientation="right" tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toLocaleString("en-IN"),
                    name === "Coast (km)" ? "Coast (km)" : "Fishing villages",
                  ]}
                  labelFormatter={(label) => coastData.find((d) => d.state === label)?.full ?? String(label)}
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E2E8F0" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="km" dataKey="coast" name="Coast (km)" radius={[4, 4, 0, 0]}>
                  {coastData.map((d) => (
                    <Cell key={d.state} fill={d.color} />
                  ))}
                </Bar>
                <Bar yAxisId="v" dataKey="villages" name="Fishing villages" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Kerala villages shown at the lower bound of the reported 220–222 range. Sources and reference years differ
            by state (see data notes).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
