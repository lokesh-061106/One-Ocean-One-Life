import { create } from 'zustand';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
}

interface MapFilter {
  dateFrom: string | null;
  dateTo: string | null;
  density: string | null;
  type: string | null;
  qualityMin: number | null;
  species: string | null;
  village: string | null;
  zone: string | null;
}

interface Hotspot {
  id: string;
  cell_id: string;
  latitude: number;
  longitude: number;
  contribution_count: number;
  quality_score: number;
  density_level: string;
  zone_name: string | null;
}

interface Observation {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  [key: string]: any;
}

export interface StateLeanPeriod {
  id: string;
  district: string;
  region_label: string;
  typical_period: string;
  main_reason: string;
  confidence: string;
  order: number;
}

export interface StateLiveStats {
  members: number;
  contributions: number;
  verified_contributions: number;
  total_points: number;
  districts_in_db: number;
  villages_in_db: number;
}

export interface StateProfile {
  id: string;
  state: string;
  slug: string;
  latitude: number;
  longitude: number;
  coastal_length_km: string;
  eez: string;
  continental_shelf_km2: string;
  coastal_districts: number;
  marine_fishing_villages: string;
  fisherfolk_population: string;
  welfare_registered: string;
  mechanized_crafts: number;
  motorized_crafts: number;
  non_motorized_crafts: number;
  total_crafts: number;
  agencies: { name: string; detail: string }[];
  ban_relief_text: string;
  lean_allowance_text: string;
  period_remarks: string;
  data_note: string;
  lean_periods: StateLeanPeriod[];
  live_stats: StateLiveStats;
}

interface MapState {
  center: [number, number];
  zoom: number;
  layers: MapLayer[];
  filter: MapFilter;
  hotspots: Hotspot[];
  observations: Observation[];
  stateProfiles: StateProfile[];
  activeStateSlug: string | null;
  loading: boolean;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  toggleLayer: (layerId: string) => void;
  setFilter: (filter: Partial<MapFilter>) => void;
  clearFilter: () => void;
  fetchHotspots: () => Promise<void>;
  fetchObservations: () => Promise<void>;
  fetchStateProfiles: () => Promise<void>;
  selectState: (slug: string | null) => void;
}

const DEFAULT_FILTER: MapFilter = {
  dateFrom: null,
  dateTo: null,
  density: null,
  type: null,
  qualityMin: null,
  species: null,
  village: null,
  zone: null,
};

export const useMapStore = create<MapState>((set, get) => ({
  center: [80.0, 10.5],
  zoom: 7,
  layers: [
    { id: 'hotspots', name: 'Ocean Hotspots', visible: true, color: '#EF4444' },
    { id: 'sightings', name: 'Marine Sightings', visible: true, color: '#3B82F6' },
    { id: 'sounds', name: 'Ocean Sounds', visible: false, color: '#8B5CF6' },
    { id: 'contributions', name: 'Contributions', visible: false, color: '#10B981' },
    { id: 'emergency', name: 'Emergency Contacts', visible: false, color: '#F59E0B' },
    { id: 'states', name: 'State Profiles', visible: true, color: '#0EA5E9' },
  ],
  filter: { ...DEFAULT_FILTER },
  hotspots: [],
  observations: [],
  stateProfiles: [],
  activeStateSlug: null,
  loading: false,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),

  toggleLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    })),

  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),

  clearFilter: () => set({ filter: { ...DEFAULT_FILTER } }),

  fetchHotspots: async () => {
    set({ loading: true });
    try {
      const params: Record<string, string> = {};
      const { filter } = get();
      if (filter.density) params.density = filter.density;
      if (filter.zone) params.zone = filter.zone;

      const data = (await api.get(ENDPOINTS.MAPS.HOTSPOTS + 'geojson/', params)) as any;
      const hotspots = data.features.map((f: any) => ({
        id: f.id,
        cell_id: f.properties.cell_id,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        contribution_count: f.properties.contribution_count,
        quality_score: f.properties.quality_score,
        density_level: f.properties.density_level,
        zone_name: f.properties.zone_name,
      }));
      set({ hotspots });
    } catch (err) {
      console.error('Failed to fetch hotspots:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchObservations: async () => {
    set({ loading: true });
    try {
      const params: Record<string, string> = {};
      const { filter } = get();
      if (filter.dateFrom) params.date_from = filter.dateFrom;
      if (filter.dateTo) params.date_to = filter.dateTo;
      if (filter.qualityMin) params.quality_min = String(filter.qualityMin);
      if (filter.species) params.species = filter.species;
      if (filter.village) params.village = filter.village;
      if (filter.zone) params.zone = filter.zone;

      const data = (await api.get(ENDPOINTS.MAPS.OBSERVATIONS || '/maps/observations/', params)) as any;
      const observations = [
        ...(data.contributions || []).map((o: any) => ({ ...o, layer: 'contributions' })),
        ...(data.sightings || []).map((o: any) => ({ ...o, layer: 'sightings' })),
        ...(data.sounds || []).map((o: any) => ({ ...o, layer: 'sounds' })),
      ];
      set({ observations });
    } catch (err) {
      console.error('Failed to fetch observations:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchStateProfiles: async () => {
    try {
      const data = (await api.get(ENDPOINTS.MAPS.STATE_PROFILES, {})) as any;
      const rows = Array.isArray(data) ? data : data?.results || [];
      set({ stateProfiles: rows });
    } catch (err) {
      console.error('Failed to fetch state profiles:', err);
    }
  },

  selectState: (slug) => set({ activeStateSlug: slug }),
}));
