import { create } from 'zustand';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  getPendingCounts,
  getSyncQueue,
  markSynced,
  markSyncFailed,
  checkConflict,
  clearOldSynced,
} from '@/database/offlineDb';
import { cacheEmergencyData, getCachedEmergencyData, getPendingSyncItems, markSynced as markEmergencySynced } from '@/database/emergencyDb';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { getInfoAsync } from 'expo-file-system/legacy';

const MIME_BY_EXT: Record<string, string> = {
  m4a: 'audio/mp4', mp4: 'audio/mp4', mov: 'audio/mp4',
  wav: 'audio/wav', wave: 'audio/wav',
  mp3: 'audio/mpeg', aac: 'audio/aac', caf: 'audio/x-caf', ogg: 'audio/ogg',
};

async function buildSoundForm(record: any): Promise<FormData> {
  const uri: string | undefined = record.audio_uri;
  const form = new FormData();

  if (uri) {
    const ext = (uri.split('.').pop() || '').toLowerCase();
    const info = await getInfoAsync(uri).catch(() => ({ exists: false } as any));
    if (!info?.exists) {
      throw new Error('Audio file missing — recording cannot be synced');
    }
    form.append('audio_file', {
      uri,
      name: `recording_${record.id || 'sound'}.${ext || 'm4a'}`,
      type: MIME_BY_EXT[ext] || 'audio/m4a',
    } as any);
  }

  const appendIf = (key: string, value: any) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  };

  const appendFile = async (key: string, uri: string | undefined, fallbackName: string, mimeType?: string) => {
    if (!uri) return;
    const info = await getInfoAsync(uri).catch(() => ({ exists: false } as any));
    if (!info?.exists) return; // optional attachment vanished — skip it
    const ext = (uri.split('.').pop() || '').toLowerCase();
    form.append(key, {
      uri,
      name: `${fallbackName}.${ext || 'bin'}`,
      type: mimeType || MIME_BY_EXT[ext] || 'application/octet-stream',
    } as any);
  };

  appendIf('instrument', record.instrument);
  appendIf('manufacturer', record.manufacturer);
  appendIf('model_number', record.model_number);
  appendIf('depth_meters', record.depth_meters);
  appendIf('measurement_method', record.measurement_method);
  appendIf('written_description', record.written_description || record.description);

  // Sound Library (admin parity) fields.
  appendIf('name', record.name);
  appendIf('category', record.category);
  appendIf('slug', record.slug);
  appendIf('sort_order', record.sort_order);
  appendIf('source', record.source);
  appendIf('description', record.description);
  appendIf('document_name', record.document_name);
  await appendFile('photo_file', record.photo_uri, 'photo', 'image/jpeg');
  await appendFile('spectrogram_file', record.spectrogram_uri, 'spectrogram', 'image/png');
  await appendFile('document', record.document_uri, 'document');

  if (record.environmental_conditions) {
    form.append(
      'environmental_conditions',
      typeof record.environmental_conditions === 'string'
        ? record.environmental_conditions
        : JSON.stringify(record.environmental_conditions),
    );
  }

  appendIf('frequency_range', record.frequency_range);
  appendIf('duration_seconds', record.duration_seconds);
  appendIf('recording_date', record.recording_date);
  appendIf('recording_time', record.recording_time);
  appendIf('latitude', record.latitude);
  appendIf('longitude', record.longitude);

  return form;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingCounts: {
    contributions: number;
    sightings: number;
    sounds: number;
    total: number;
  };
  isSyncing: boolean;
  syncErrors: string[];
  emergencyCached: boolean;
}

interface OfflineActions {
  setOnline: (online: boolean) => void;
  syncAll: () => Promise<void>;
  syncItem: (tableName: string, recordId: string) => Promise<boolean>;
  resolveConflict: (tableName: string, recordId: string, resolution: 'local' | 'server') => Promise<void>;
  refreshPendingCounts: () => Promise<void>;
  cacheEmergency: () => Promise<void>;
  getEmergencyData: () => Promise<any>;
  cleanupOldSynced: () => Promise<void>;
}

export const useOfflineStore = create<SyncStatus & OfflineActions>((set, get) => ({
  isOnline: true,
  lastSyncAt: null,
  pendingCounts: { contributions: 0, sightings: 0, sounds: 0, total: 0 },
  isSyncing: false,
  syncErrors: [],
  emergencyCached: false,

  setOnline: (online: boolean) => {
    set({ isOnline: online });
    if (online && !get().isSyncing) {
      get().syncAll();
    }
  },

  syncAll: async () => {
    const state = get();
    if (!state.isOnline || state.isSyncing) return;

    set({ isSyncing: true, syncErrors: [] });

    try {
      const queue = await getSyncQueue();
      let synced = 0;
      let errors: string[] = [];

      for (const item of queue) {
        try {
          const success = await get().syncItem(item.table_name, item.record_id);
          if (success) synced++;
        } catch (err: any) {
          errors.push(`${item.table_name}:${item.record_id} - ${err.message}`);
          await markSyncFailed(item.table_name, item.record_id, err.message);
        }
      }

      const pending = await getPendingSyncItems();
      for (const sighting of pending.sightings) {
        try {
          await api.post(ENDPOINTS.SIGHTINGS.CREATE, {
            species_name: sighting.species_name,
            notes: sighting.notes,
            latitude: sighting.latitude,
            longitude: sighting.longitude,
          });
          await markEmergencySynced('offline_sightings', sighting.id);
          synced++;
        } catch (err: any) {
          errors.push(`sighting:${sighting.id} - ${err.message}`);
        }
      }

      for (const sound of pending.sounds) {
        try {
          await api.post(ENDPOINTS.SOUNDS.CREATE, await buildSoundForm(sound));
          await markEmergencySynced('offline_sounds', sound.id);
          synced++;
        } catch (err: any) {
          errors.push(`sound:${sound.id} - ${err.message}`);
        }
      }

      set({
        lastSyncAt: new Date().toISOString(),
        syncErrors: errors,
      });

      await get().refreshPendingCounts();
    } finally {
      set({ isSyncing: false });
    }
  },

  syncItem: async (tableName: string, recordId: string): Promise<boolean> => {
    const database = await import('@/database/offlineDb').then(m => m.getDatabase());
    const records = await database.getAllAsync(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [recordId]
    );

    if (records.length === 0) return false;
    const record = records[0] as any;

    try {
      let endpoint = '';
      let payload: any = {};

      switch (tableName) {
        case 'offline_contributions':
          endpoint = ENDPOINTS.CONTRIBUTIONS.CREATE;
          payload = {
            type: record.type,
            title: record.title || '',
            author: record.author || '',
            description: record.description || '',
            notes: record.notes,
            village: record.village_id || undefined,
            metadata: JSON.parse(record.metadata || '{}'),
          };
          break;
        case 'offline_sightings':
          endpoint = ENDPOINTS.SIGHTINGS.CREATE;
          payload = {
            species_name: record.species_name,
            notes: record.notes,
            latitude: record.latitude,
            longitude: record.longitude,
            number_observed: record.number_observed,
            behavior: record.behavior,
          };
          break;
        case 'offline_sounds':
          endpoint = ENDPOINTS.SOUNDS.CREATE;
          payload = await buildSoundForm(record);
          break;
        default:
          return false;
      }

      const response = (await api.post(endpoint, payload)) as any;
      await markSynced(tableName, recordId, response.id);
      return true;
    } catch (err: any) {
      if (err.message?.includes('409') || err.message?.includes('conflict')) {
        const serverData = JSON.parse(err.message?.split('data:')[1] || '{}');
        const hasConflict = await checkConflict(tableName, recordId, serverData);
        if (hasConflict) {
          set(state => ({
            syncErrors: [...state.syncErrors, `Conflict: ${tableName}:${recordId}`],
          }));
          return false;
        }
      }
      throw err;
    }
  },

  resolveConflict: async (tableName: string, recordId: string, resolution: 'local' | 'server') => {
    const { resolveConflict: resolve } = await import('@/database/offlineDb');
    await resolve(tableName, recordId, resolution);
    await get().refreshPendingCounts();
  },

  refreshPendingCounts: async () => {
    const counts = await getPendingCounts();
    set({ pendingCounts: counts });
  },

  cacheEmergency: async () => {
    try {
      const data = (await api.get(ENDPOINTS.EMERGENCY.OFFLINE)) as any;
      await cacheEmergencyData(data);
      set({ emergencyCached: true });
    } catch (err) {
      console.error('Failed to cache emergency data:', err);
    }
  },

  getEmergencyData: async () => {
    return await getCachedEmergencyData();
  },

  cleanupOldSynced: async () => {
    await clearOldSynced(30);
  },
}));

export function useOfflineSync() {
  const { setOnline, refreshPendingCounts, syncAll } = useOfflineStore();

  useEffect(() => {
    refreshPendingCounts();

    const unsubscribe = NetInfo.addEventListener(netInfo => {
      const isOnline = netInfo.isConnected ?? true;
      setOnline(isOnline);
    });

    return () => unsubscribe();
  }, []);
}
