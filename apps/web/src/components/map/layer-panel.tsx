"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Layers, RotateCcw, Search } from "lucide-react";
import { LAYER_GROUPS, MARINE_LAYERS, type LayerGroup } from "@/data/marine";

interface LayerPanelProps {
  active: string[];
  onToggle: (id: string) => void;
  onToggleGroup: (group: LayerGroup, on: boolean) => void;
  onReset: () => void;
  counts?: Record<string, number>;
}

export default function LayerPanel({ active, onToggle, onToggleGroup, onReset, counts = {} }: LayerPanelProps) {
  const [query, setQuery] = useState("");
  const activeSet = useMemo(() => new Set(active), [active]);

  const filtered = MARINE_LAYERS.filter((l) => l.label.toLowerCase().includes(query.trim().toLowerCase()));

  const grouped = LAYER_GROUPS.map((group) => ({
    group,
    layers: filtered.filter((l) => l.group === group),
  })).filter((g) => g.layers.length > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-ocean-navy font-bold text-sm">
          <Layers className="h-4 w-4" /> Map Layers
          <span className="text-[11px] font-semibold text-ocean-blue bg-ocean-blue/10 px-1.5 py-0.5 rounded">
            {active.length}/{MARINE_LAYERS.length}
          </span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-ocean-blue"
          title="Reset to default layers"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="px-3 py-2 border-b border-slate-100 relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search layers…"
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-blue/40"
        />
      </div>

      <div className="overflow-y-auto flex-1 px-2 py-2 space-y-2 max-h-[560px]">
        {grouped.map(({ group, layers }) => {
          const allOn = layers.every((l) => activeSet.has(l.id));
          const someOn = layers.some((l) => activeSet.has(l.id));
          return (
            <div key={group}>
              <button
                onClick={() => onToggleGroup(group, !allOn)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-100 group"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      allOn ? "bg-ocean-blue border-ocean-blue" : someOn ? "bg-ocean-blue/30 border-ocean-blue" : "bg-white border-slate-300"
                    }`}
                  >
                    {allOn && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-ocean-navy">
                    {group}
                  </span>
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              <div className="pl-1 space-y-0.5">
                {layers.map((layer) => {
                  const on = activeSet.has(layer.id);
                  const count = counts[layer.id];
                  return (
                    <button
                      key={layer.id}
                      onClick={() => onToggle(layer.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                        on ? "bg-ocean-light/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${
                            on ? "bg-ocean-blue border-ocean-blue" : "bg-white border-slate-300"
                          }`}
                        >
                          {on && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                        </span>
                        <span
                          className="w-4 h-4 rounded-sm shrink-0 border border-white shadow-sm"
                          style={{ background: layer.swatch || "#94A3B8" }}
                        />
                        <span className={`text-xs truncate ${on ? "text-ocean-navy font-semibold" : "text-slate-600"}`}>
                          {layer.label}
                        </span>
                      </span>
                      {count !== undefined && (
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {grouped.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No layers match “{query}”.</p>}
      </div>

      <div className="px-3 py-2 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
        EEZ and state boundaries always remain visible. Layer positions are indicative for orientation.
      </div>
    </div>
  );
}
