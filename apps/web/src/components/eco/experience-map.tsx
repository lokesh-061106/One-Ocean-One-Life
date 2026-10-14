"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MODEL_META, formatINR, typeMeta } from "./shared";
import type { EcoModelCategory, MapPoint } from "@/types";

const CENTER: [number, number] = [79.2, 12.6];

const TYPE_COLOR: Record<string, string> = {
  fisher_coastal: "#087EA4",
  nature_tours: "#16A085",
  homestay_food: "#F59E0B",
  ocean_learning: "#3B82F6",
  festival_market: "#FF7660",
  restaurant: "#94A3B8",
  homestay: "#F59E0B",
  shop: "#94A3B8",
  craft: "#FF7660",
  guide: "#087EA4",
  fishing: "#087EA4",
  transport: "#94A3B8",
  other: "#94A3B8",
};

export function ExperienceMap({
  points,
  height = 440,
  onSelect,
}: {
  points: MapPoint[];
  height?: number;
  onSelect?: (p: MapPoint) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "street-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          { id: "basemap-streets", type: "raster", source: "street-tiles" },
        ],
      },
      center: CENTER,
      zoom: 4.6,
      minZoom: 4,
      maxZoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => setReady(true));
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    points.forEach((p) => {
      const color = TYPE_COLOR[p.category] || "#087EA4";
      const meta = MODEL_META[p.category as EcoModelCategory];
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", p.name);
      el.style.cssText = `
        width:34px;height:34px;border-radius:50% 50% 50% 6px;transform:rotate(-45deg);
        background:${p.blocked ? "#94A3B8" : color};border:2.5px solid #fff;
        box-shadow:0 3px 10px rgba(0,0,0,.3);cursor:pointer;display:flex;
        align-items:center;justify-content:center;transition:transform .2s ease;
      `;
      el.onmouseenter = () => (el.style.transform = "rotate(-45deg) scale(1.18)");
      el.onmouseleave = () => (el.style.transform = "rotate(-45deg) scale(1)");
      const inner = document.createElement("span");
      inner.style.cssText = "transform:rotate(45deg);font-size:15px;line-height:1;";
      inner.textContent = meta ? meta.icon : p.type === "business" ? "🏪" : p.type === "package" ? "📦" : "🌊";
      el.appendChild(inner);

      const priceLabel = p.price ? `${formatINR(p.price)}${p.price_unit === "person" ? "/person" : p.price_unit === "boat" ? "/boat" : p.price_unit === "night" ? "/night" : p.price_unit === "student" ? "/student" : ""}` : "";
      const typeLabel = p.type === "experience" ? typeMeta(p.category).label || p.category : p.type === "package" ? "Package" : "Local business";

      el.addEventListener("click", () => {
        if (onSelect) onSelect(p);
        else if (p.type === "experience") window.location.href = `/ecotourism/${p.slug || p.id}`;
        else if (p.type === "package") window.location.href = `/ecotourism/packages/${p.id}`;
      });

      const popup = new maplibregl.Popup({ offset: 22, closeButton: false }).setHTML(`
        <div style="min-width:180px;font-family:inherit">
          <div style="font-weight:700;color:#082A38;font-size:13px;margin-bottom:2px">${p.name}</div>
          <div style="font-size:11px;color:#087EA4;font-weight:600;margin-bottom:4px">${meta ? meta.icon + " " + meta.short : typeLabel}</div>
          ${p.village ? `<div style="font-size:11px;color:#64748B">📍 ${p.village}</div>` : ""}
          <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
            ${priceLabel ? `<span style="font-size:13px;font-weight:800;color:#063B4C">${priceLabel}</span>` : ""}
            ${p.rating ? `<span style="font-size:11px;color:#F59E0B;font-weight:700">★ ${Number(p.rating).toFixed(1)}</span>` : ""}
          </div>
          ${p.blocked ? `<div style="font-size:11px;color:#EF4444;font-weight:700;margin-top:4px">⛔ Paused during fishing-ban window</div>` : ""}
          <div style="font-size:10px;color:#94A3B8;margin-top:4px">Tap to open listing →</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el }).setLngLat([p.longitude, p.latitude]).setPopup(popup).addTo(map);
      markersRef.current.push(marker);
    });

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 10, duration: 900 });
    }
  }, [points, ready, onSelect]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-2xl border border-ocean-border shadow-ocean"
      style={{ height }}
    />
  );
}
