import { MapObservation, OceanHotspot, EmergencyContact, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function getMapObservations(filters?: {
  type?: string;
  bounds?: string;
}): Promise<MapObservation[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.bounds) params.set('bounds', filters.bounds);

  const res = await fetch(`${API_BASE}/maps/observations/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch observations');
  return res.json();
}

export async function getHotspots(): Promise<OceanHotspot[]> {
  const res = await fetch(`${API_BASE}/maps/hotspots/`);
  if (!res.ok) throw new Error('Failed to fetch hotspots');
  return res.json();
}

export async function getHotspotsGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(`${API_BASE}/maps/hotspots/geojson/`);
  if (!res.ok) throw new Error('Failed to fetch hotspots GeoJSON');
  return res.json();
}

export async function getEmergencyContacts(filters?: {
  contact_type?: string;
  latitude?: number;
  longitude?: number;
}): Promise<EmergencyContact[]> {
  const params = new URLSearchParams();
  if (filters?.contact_type) params.set('contact_type', filters.contact_type);
  if (filters?.latitude) params.set('latitude', String(filters.latitude));
  if (filters?.longitude) params.set('longitude', String(filters.longitude));

  const res = await fetch(`${API_BASE}/maps/emergency/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch emergency contacts');
  return res.json();
}

export async function getNearbyContacts(
  latitude: number,
  longitude: number,
  radius_km: number = 10
): Promise<EmergencyContact[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius_km: String(radius_km),
  });

  const res = await fetch(`${API_BASE}/maps/emergency/nearby/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch nearby contacts');
  return res.json();
}
