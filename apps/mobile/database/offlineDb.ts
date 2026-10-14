import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('o3l_full.db');
  await initAllTables(db);
  return db;
}

async function initAllTables(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      conflict_data TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT,
      attempts INTEGER DEFAULT 0,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_contributions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT DEFAULT '',
      author TEXT DEFAULT '',
      description TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      latitude REAL,
      longitude REAL,
      location_precision TEXT DEFAULT 'exact',
      village_id TEXT,
      metadata TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      quality_score REAL DEFAULT 0,
      image_uris TEXT DEFAULT '[]',
      video_uri TEXT,
      audio_uri TEXT,
      document_uris TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      server_id TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_sightings (
      id TEXT PRIMARY KEY,
      contribution_id TEXT NOT NULL,
      species_id TEXT,
      species_name TEXT NOT NULL,
      ai_suggestion TEXT DEFAULT '',
      ai_confidence REAL DEFAULT 0,
      number_observed INTEGER DEFAULT 1,
      behavior TEXT DEFAULT 'unknown',
      sea_condition TEXT DEFAULT '',
      weather TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      photo_uri TEXT,
      video_uri TEXT,
      sighting_date TEXT,
      sighting_time TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      synced_at TEXT,
      server_id TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_sounds (
      id TEXT PRIMARY KEY,
      contribution_id TEXT NOT NULL,
      audio_uri TEXT NOT NULL,
      voice_uri TEXT,
      instrument TEXT DEFAULT '',
      manufacturer TEXT DEFAULT '',
      model_number TEXT DEFAULT '',
      depth_meters REAL,
      measurement_method TEXT DEFAULT '',
      written_description TEXT DEFAULT '',
      environmental_conditions TEXT DEFAULT '{}',
      frequency_range TEXT DEFAULT '',
      duration_seconds REAL,
      recording_date TEXT,
      recording_time TEXT,
      latitude REAL,
      longitude REAL,
      name TEXT DEFAULT '',
      category TEXT DEFAULT '',
      slug TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      source TEXT DEFAULT '',
      description TEXT DEFAULT '',
      document_name TEXT DEFAULT '',
      photo_uri TEXT,
      spectrogram_uri TEXT,
      document_uri TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      synced_at TEXT,
      server_id TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_education (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      post_type TEXT DEFAULT 'blog',
      village_id TEXT,
      image_uri TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      synced_at TEXT,
      server_id TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      event_type TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      village_id TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      max_participants INTEGER,
      photo_uri TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      synced_at TEXT,
      server_id TEXT
    );

    CREATE TABLE IF NOT EXISTS cached_guides (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      category TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_species (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cache_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Lightweight upgrades for databases created before the contribution media fields.
  const contributionColumns = [
    ["title", "TEXT DEFAULT ''"],
    ["author", "TEXT DEFAULT ''"],
    ["description", "TEXT DEFAULT ''"],
    ["image_uris", "TEXT DEFAULT '[]'"],
    ["video_uri", "TEXT"],
    ["audio_uri", "TEXT"],
    ["document_uris", "TEXT DEFAULT '[]'"],
  ] as const;
  const existing = await database.getAllAsync<{ name: string }>(
    `SELECT name FROM pragma_table_info('offline_contributions')`
  );
  const have = new Set(existing.map((c) => c.name));
  for (const [name, definition] of contributionColumns) {
    if (!have.has(name)) {
      await database.execAsync(`ALTER TABLE offline_contributions ADD COLUMN ${name} ${definition};`);
    }
  }

  // Upgrades for databases created before the Sound Library (admin parity) fields.
  const soundColumns = [
    ["name", "TEXT DEFAULT ''"],
    ["category", "TEXT DEFAULT ''"],
    ["slug", "TEXT DEFAULT ''"],
    ["sort_order", "INTEGER DEFAULT 0"],
    ["source", "TEXT DEFAULT ''"],
    ["description", "TEXT DEFAULT ''"],
    ["document_name", "TEXT DEFAULT ''"],
    ["photo_uri", "TEXT"],
    ["spectrogram_uri", "TEXT"],
    ["document_uri", "TEXT"],
  ] as const;
  const soundExisting = await database.getAllAsync<{ name: string }>(
    `SELECT name FROM pragma_table_info('offline_sounds')`
  );
  const soundHave = new Set(soundExisting.map((c) => c.name));
  for (const [name, definition] of soundColumns) {
    if (!soundHave.has(name)) {
      await database.execAsync(`ALTER TABLE offline_sounds ADD COLUMN ${name} ${definition};`);
    }
  }
}

export async function saveOfflineContribution(data: {
  id: string;
  type: string;
  title?: string;
  author?: string;
  description?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  location_precision?: string;
  village_id?: string;
  metadata?: any;
  image_uris?: string[];
  video_uri?: string;
  audio_uri?: string;
  document_uris?: string[];
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO offline_contributions (id, type, title, author, description, notes, latitude, longitude, location_precision, village_id, metadata, image_uris, video_uri, audio_uri, document_uris, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      data.id, data.type,
      data.title || '', data.author || '', data.description || '', data.notes || '',
      data.latitude || null, data.longitude || null,
      data.location_precision || 'exact',
      data.village_id || null,
      JSON.stringify(data.metadata || {}),
      JSON.stringify(data.image_uris || []),
      data.video_uri || null,
      data.audio_uri || null,
      JSON.stringify(data.document_uris || []),
      now, now,
    ]
  );

  await addToSyncQueue(database, 'offline_contributions', data.id, 'create', data);
}

export async function saveOfflineSighting(data: {
  id: string;
  contribution_id: string;
  species_id?: string;
  species_name: string;
  ai_suggestion?: string;
  ai_confidence?: number;
  number_observed?: number;
  behavior?: string;
  sea_condition?: string;
  weather?: string;
  notes?: string;
  photo_uri?: string;
  video_uri?: string;
  sighting_date?: string;
  sighting_time?: string;
  latitude?: number;
  longitude?: number;
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO offline_sightings (id, contribution_id, species_id, species_name, ai_suggestion, ai_confidence,
     number_observed, behavior, sea_condition, weather, notes, photo_uri, video_uri,
     sighting_date, sighting_time, latitude, longitude, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      data.id, data.contribution_id, data.species_id || null, data.species_name,
      data.ai_suggestion || '', data.ai_confidence || 0,
      data.number_observed || 1, data.behavior || 'unknown',
      data.sea_condition || '', data.weather || '', data.notes || '',
      data.photo_uri || null, data.video_uri || null,
      data.sighting_date || null, data.sighting_time || null,
      data.latitude || null, data.longitude || null,
      now,
    ]
  );

  await addToSyncQueue(database, 'offline_sightings', data.id, 'create', data);
}

export async function saveOfflineSound(data: {
  id: string;
  contribution_id: string;
  audio_uri: string;
  voice_uri?: string;
  instrument?: string;
  manufacturer?: string;
  model_number?: string;
  depth_meters?: number;
  measurement_method?: string;
  written_description?: string;
  environmental_conditions?: any;
  frequency_range?: string;
  duration_seconds?: number;
  recording_date?: string;
  recording_time?: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  category?: string;
  slug?: string;
  sort_order?: number;
  source?: string;
  description?: string;
  document_name?: string;
  photo_uri?: string;
  spectrogram_uri?: string;
  document_uri?: string;
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO offline_sounds (id, contribution_id, audio_uri, voice_uri, instrument, manufacturer, model_number,
     depth_meters, measurement_method, written_description, environmental_conditions, frequency_range,
     duration_seconds, recording_date, recording_time, latitude, longitude,
     name, category, slug, sort_order, source, description, document_name,
     photo_uri, spectrogram_uri, document_uri, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      data.id, data.contribution_id, data.audio_uri, data.voice_uri || null,
      data.instrument || '', data.manufacturer || '', data.model_number || '',
      data.depth_meters || null, data.measurement_method || '',
      data.written_description || '', JSON.stringify(data.environmental_conditions || {}),
      data.frequency_range || '', data.duration_seconds || null,
      data.recording_date || null, data.recording_time || null,
      data.latitude || null, data.longitude || null,
      data.name || '', data.category || '', data.slug || '', data.sort_order || 0,
      data.source || '', data.description || '', data.document_name || '',
      data.photo_uri || null, data.spectrogram_uri || null, data.document_uri || null,
      now,
    ]
  );

  await addToSyncQueue(database, 'offline_sounds', data.id, 'create', data);
}

async function addToSyncQueue(database: SQLite.SQLiteDatabase, tableName: string, recordId: string, action: string, data: any) {
  const id = `${tableName}_${recordId}_${Date.now()}`;
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO sync_queue (id, table_name, record_id, action, data, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [id, tableName, recordId, action, JSON.stringify(data), now]
  );
}

export async function getSyncQueue() {
  const database = await getDatabase();
  return await database.getAllAsync(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC"
  );
}

export async function getPendingCounts() {
  const database = await getDatabase();
  const contributions = await database.getAllAsync("SELECT COUNT(*) as count FROM offline_contributions WHERE status = 'pending'");
  const sightings = await database.getAllAsync("SELECT COUNT(*) as count FROM offline_sightings WHERE status = 'pending'");
  const sounds = await database.getAllAsync("SELECT COUNT(*) as count FROM offline_sounds WHERE status = 'pending'");
  const queue = await database.getAllAsync("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'");

  return {
    contributions: (contributions[0] as any).count,
    sightings: (sightings[0] as any).count,
    sounds: (sounds[0] as any).count,
    total: (queue[0] as any).count,
  };
}

export async function markSynced(table: string, id: string, serverId?: string) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    `UPDATE ${table} SET status = 'synced', synced_at = ?, server_id = ? WHERE id = ?`,
    [now, serverId || null, id]
  );
  await database.runAsync(
    `UPDATE sync_queue SET status = 'synced', synced_at = ? WHERE table_name = ? AND record_id = ?`,
    [now, table, id]
  );
}

export async function markSyncFailed(table: string, id: string, error: string) {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE table_name = ? AND record_id = ?`,
    [error, table, id]
  );
}

export async function checkConflict(table: string, id: string, serverData: any): Promise<boolean> {
  const database = await getDatabase();
  const local = await database.getAllAsync(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  if (local.length === 0) return false;

  const localRecord = local[0] as any;
  const localUpdated = new Date(localRecord.updated_at || localRecord.created_at).getTime();
  const serverUpdated = new Date(serverData.updated_at || serverData.created_at).getTime();

  return serverUpdated > localUpdated;
}

export async function resolveConflict(table: string, id: string, resolution: 'local' | 'server') {
  const database = await getDatabase();
  if (resolution === 'server') {
    await database.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
  }
  await database.runAsync(
    `UPDATE sync_queue SET status = 'resolved' WHERE table_name = ? AND record_id = ?`,
    [table, id]
  );
}

export async function getCachedGuides(category?: string) {
  const database = await getDatabase();
  if (category) {
    return await database.getAllAsync(
      'SELECT * FROM cached_guides WHERE category = ? ORDER BY cached_at DESC',
      [category]
    );
  }
  return await database.getAllAsync('SELECT * FROM cached_guides ORDER BY cached_at DESC');
}

export async function cacheGuides(guides: any[], category: string) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync('DELETE FROM cached_guides WHERE category = ?', [category]);
  for (const guide of guides) {
    await database.runAsync(
      'INSERT INTO cached_guides (id, data, category, cached_at) VALUES (?, ?, ?, ?)',
      [guide.id, JSON.stringify(guide), category, now]
    );
  }
}

export async function clearOldSynced(maxAgeDays: number = 30) {
  const database = await getDatabase();
  const cutoff = new Date(Date.now() - maxAgeDays * 86400000).toISOString();
  await database.runAsync("DELETE FROM sync_queue WHERE status = 'synced' AND synced_at < ?", [cutoff]);
  await database.runAsync("DELETE FROM offline_contributions WHERE status = 'synced' AND synced_at < ?", [cutoff]);
  await database.runAsync("DELETE FROM offline_sightings WHERE status = 'synced' AND synced_at < ?", [cutoff]);
  await database.runAsync("DELETE FROM offline_sounds WHERE status = 'synced' AND synced_at < ?", [cutoff]);
}
