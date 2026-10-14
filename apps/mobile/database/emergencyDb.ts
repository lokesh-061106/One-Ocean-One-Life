import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('o3l_emergency.db');
  await initTables(db);
  return db;
}

async function initTables(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_type TEXT NOT NULL,
      phone TEXT NOT NULL,
      phone_secondary TEXT DEFAULT '',
      latitude REAL,
      longitude REAL,
      address TEXT DEFAULT '',
      village_name TEXT DEFAULT '',
      district_name TEXT DEFAULT '',
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS safety_instructions (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT DEFAULT '',
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emergency_numbers (
      key TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offline_contributions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_sightings (
      id TEXT PRIMARY KEY,
      species_name TEXT NOT NULL,
      notes TEXT DEFAULT '',
      latitude REAL,
      longitude REAL,
      photo_uri TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_sounds (
      id TEXT PRIMARY KEY,
      audio_uri TEXT NOT NULL,
      description TEXT DEFAULT '',
      latitude REAL,
      longitude REAL,
      duration_seconds REAL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cache_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export async function cacheEmergencyData(data: {
  contacts: any[];
  safety_instructions: any[];
  emergency_numbers: Record<string, string>;
  villages: any[];
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();

  await database.runAsync('DELETE FROM emergency_contacts');
  for (const contact of data.contacts) {
    await database.runAsync(
      `INSERT INTO emergency_contacts (id, name, contact_type, phone, phone_secondary, latitude, longitude, address, village_name, district_name, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contact.id, contact.name, contact.contact_type,
        contact.phone, contact.phone_secondary || '',
        contact.latitude, contact.longitude,
        contact.address || '',
        contact.village__name || '',
        contact.district__name || '',
        now,
      ]
    );
  }

  await database.runAsync('DELETE FROM safety_instructions');
  for (const instruction of data.safety_instructions) {
    await database.runAsync(
      `INSERT INTO safety_instructions (id, title, description, icon, cached_at)
       VALUES (?, ?, ?, ?, ?)`,
      [instruction.id, instruction.title, instruction.description, instruction.icon || '', now]
    );
  }

  await database.runAsync('DELETE FROM emergency_numbers');
  for (const [key, number] of Object.entries(data.emergency_numbers)) {
    await database.runAsync(
      `INSERT INTO emergency_numbers (key, number, cached_at) VALUES (?, ?, ?)`,
      [key, number as string, now]
    );
  }

  await database.runAsync(
    `INSERT OR REPLACE INTO cache_meta (key, value, updated_at) VALUES (?, ?, ?)`,
    ['emergency_data', 'cached', now]
  );
}

export async function getCachedEmergencyData() {
  const database = await getDatabase();

  const contacts = await database.getAllAsync(
    'SELECT * FROM emergency_contacts ORDER BY contact_type, name'
  );

  const instructions = await database.getAllAsync(
    'SELECT * FROM safety_instructions ORDER BY id'
  );

  const numbers = await database.getAllAsync(
    'SELECT * FROM emergency_numbers'
  );

  const emergencyNumbers: Record<string, string> = {};
  for (const row of numbers as any[]) {
    emergencyNumbers[row.key] = row.number;
  }

  return { contacts, instructions, emergencyNumbers };
}

export async function findNearestContacts(
  latitude: number,
  longitude: number,
  limit: number = 5
) {
  const database = await getDatabase();
  const limitInt = Math.floor(limit);
  const contacts = await database.getAllAsync(
    `SELECT *,
      ABS(latitude - ?) + ABS(longitude - ?) as distance_approx
     FROM emergency_contacts
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL
     ORDER BY distance_approx
     LIMIT ${limitInt}`
  );
  return contacts;
}

export async function saveOfflineSighting(sighting: {
  id: string;
  species_name: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  photo_uri: string | null;
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO offline_sightings (id, species_name, notes, latitude, longitude, photo_uri, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [sighting.id, sighting.species_name, sighting.notes, sighting.latitude, sighting.longitude, sighting.photo_uri, now]
  );
}

export async function saveOfflineSound(sound: {
  id: string;
  audio_uri: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  duration_seconds: number | null;
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO offline_sounds (id, audio_uri, description, latitude, longitude, duration_seconds, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [sound.id, sound.audio_uri, sound.description, sound.latitude, sound.longitude, sound.duration_seconds, now]
  );
}

export async function getPendingSyncItems() {
  const database = await getDatabase();
  const sightings = await database.getAllAsync(
    "SELECT * FROM offline_sightings WHERE status = 'pending'"
  );
  const sounds = await database.getAllAsync(
    "SELECT * FROM offline_sounds WHERE status = 'pending'"
  );
  const contributions = await database.getAllAsync(
    "SELECT * FROM offline_contributions WHERE status = 'pending'"
  );
  return { sightings, sounds, contributions };
}

export async function markSynced(table: string, id: string) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    `UPDATE ${table} SET status = 'synced', synced_at = ? WHERE id = ?`,
    [now, id]
  );
}
