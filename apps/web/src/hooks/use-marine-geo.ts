"use client";

import { useQuery } from "@tanstack/react-query";

export interface MarineGeoState {
  name: string;
  slug: string;
}

export interface CoastalLocationProps {
  name: string;
  state: string;
  district: string;
  kind: "harbour" | "village" | "landing";
  confidence?: string;
  source?: string;
}

export interface MarineGeoData {
  states: GeoJSON.FeatureCollection;
  districts: GeoJSON.FeatureCollection;
  locations: GeoJSON.FeatureCollection;
  bands: GeoJSON.FeatureCollection;
  eez: GeoJSON.FeatureCollection;
  locationsByState: Record<string, GeoJSON.Feature[]>;
  districtsByState: Record<string, GeoJSON.Feature[]>;
}

async function loadMarineGeo(): Promise<MarineGeoData> {
  const load = async (file: string): Promise<GeoJSON.FeatureCollection> => {
    const res = await fetch(`/data/marine/${file}`);
    if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
    return res.json();
  };

  const [states, districts, locations, bands, eez] = await Promise.all([
    load("southern-states.geojson"),
    load("coastal-districts.geojson"),
    load("coastal-locations.geojson"),
    load("coastal-bands.geojson"),
    load("eez-south.geojson"),
  ]);

  const locationsByState: Record<string, GeoJSON.Feature[]> = {};
  for (const f of locations.features) {
    const st = (f.properties?.state as string) ?? "";
    (locationsByState[st] ||= []).push(f);
  }

  const districtsByState: Record<string, GeoJSON.Feature[]> = {};
  for (const f of districts.features) {
    const st = (f.properties?.state as string) ?? "";
    (districtsByState[st] ||= []).push(f);
  }

  return { states, districts, locations, bands, eez, locationsByState, districtsByState };
}

export function useMarineGeo() {
  return useQuery({
    queryKey: ["marineGeo"],
    queryFn: loadMarineGeo,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });
}
