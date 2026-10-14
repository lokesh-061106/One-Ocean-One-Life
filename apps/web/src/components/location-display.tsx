"use client";

import { MapPin } from "lucide-react";

interface LocationDisplayProps {
  name?: string;
  lat?: number | null;
  lng?: number | null;
  showCoords?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function formatCoord(val: number): string {
  return val.toFixed(4);
}

export function LocationDisplay({
  name,
  lat,
  lng,
  showCoords = true,
  size = "sm",
  className = "",
}: LocationDisplayProps) {
  const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
  const iconSize = size === "lg" ? "h-4 w-4" : size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  const textSize = size === "lg" ? "text-sm" : size === "md" ? "text-xs" : "text-xs";

  return (
    <div className={`flex items-start gap-1.5 ${className}`}>
      <MapPin className={`${iconSize} text-ocean-blue mt-0.5 flex-shrink-0`} />
      <div className="min-w-0">
        {name && (
          <span className={`${textSize} font-medium text-ocean-navy block leading-tight`}>
            {name}
          </span>
        )}
        {showCoords && hasCoords && (
          <span className="text-[10px] text-ocean-muted leading-tight block">
            {formatCoord(lat!)}, {formatCoord(lng!)}
          </span>
        )}
      </div>
    </div>
  );
}

export function CoordinatesBadge({ lat, lng }: { lat: number | null; lng: number | null }) {
  if (lat == null || lng == null || lat === 0 || lng === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-ocean-blue/5 border border-ocean-blue/10 px-1.5 py-0.5 text-[10px] font-mono text-ocean-blue">
      <MapPin className="h-2.5 w-2.5" />
      {lat.toFixed(4)}, {lng.toFixed(4)}
    </span>
  );
}
