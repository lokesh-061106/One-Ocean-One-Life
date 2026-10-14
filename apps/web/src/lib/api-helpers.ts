const CMS_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Rewrite API-built media URLs (e.g. http://localhost:8000/media/x.pdf) to a
 * site-relative path (/media/x.pdf) so requests go through the Next.js proxy
 * on this origin instead of a direct cross-origin call to the API port.
 * External URLs (other hosts, data:, blob:) are returned unchanged.
 */
export function mediaUrl(url?: string | null): string {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/media/") || parsed.pathname.startsWith("/static/")) {
      return parsed.pathname;
    }
  } catch {
    /* not parseable — return as-is */
  }
  return url;
}

export async function fetchCms<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${CMS_API}${endpoint}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCmsList<T>(endpoint: string): Promise<T[]> {
  try {
    const results: T[] = [];
    const seen = new Set<string>();
    let url: string | null = `${CMS_API}${endpoint}`;
    let pages = 0;
    while (url && pages < 10) {
      const res: Response = await fetch(url);
      if (!res.ok) break;
      const data: any = await res.json();
      const batch: T[] = data?.results || (Array.isArray(data) ? data : []);
      for (const item of batch) {
        // Dedupe by id — unstable server ordering can repeat rows across pages
        const id = (item as any)?.id;
        if (id != null) {
          if (seen.has(String(id))) continue;
          seen.add(String(id));
        }
        results.push(item);
      }
      url = data?.next || null;
      pages += 1;
    }
    return results;
  } catch {
    return [];
  }
}

export interface ApiSpecies {
  id: string; slug?: string; common_name: string; tamil_name: string; scientific_name: string;
  description: string; habitat: string; diet: string; behavior: string;
  identification: string; interesting_facts: string; conservation_status: string;
    typical_size: string; image: string | null; is_verified: boolean;
    category: { id: string; name: string; name_tamil: string; icon: string; slug?: string } | string;
  latitude: number | null; longitude: number | null;
}

export interface ApiGuideCategory {
  id: string; name: string; name_tamil: string; slug: string; icon: string;
  description: string; species_count?: number;
}

export interface ApiEducationPost {
  id: string; title: string; slug: string; content: string; post_type: string;
  image?: string | null;
  images?: { id: string; image: string; caption?: string | null }[];
  is_verified: boolean; reactions_count: number; views_count: number;
  author: { id: string; username: string; first_name: string; last_name: string; role?: string; is_verified?: boolean } | string;
  author_name?: string | null;
  category: { id: string; name: string; name_tamil: string; icon: string } | string;
  village: { id: string; name: string; slug?: string } | string;
  village_name?: string | null;
  created_at: string;
}

export interface ApiEducationCategory {
  id: string; name: string; name_tamil: string; slug: string; icon: string;
  description: string; post_count?: number;
}

export interface ApiEvent {
  id: string; title: string; slug?: string; description: string; event_type: string;
  is_published: boolean; start_date: string; end_date: string | null;
  max_participants: number | null;
  organizer: { id: string; username: string; first_name: string; last_name: string } | string;
  organizer_name?: string;
  village: { id: string; name: string } | string;
  village_name?: string;
  location_name?: string;
  location?: string;
  participant_count?: number;
  created_at: string;
}

export interface ApiFishCatch {
  id: string;
  slug: string;
  species_display?: string;
  species_level: string;
  species_name: string;
  species_guide_id: string;
  species_group: string;
  number: number;
  weight: number | null;
  weight_unit: string;
  length: number | null;
  length_unit: string;
  gear: string;
  gear_other: string;
  depth_m: number | null;
  fishing_location_name: string;
  photo: string | null;
  contributor: string;
  village_name: string | null;
  status: string;
  notes: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface ApiObservation {
  id: string;
  slug: string;
  observation_display?: string;
  display_name?: string;
  observation_category: string;
  category_display?: string;
  organism_name: string;
  photo: string | null;
  contributor: string;
  village_name: string | null;
  status: string;
  notes: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  verified_at?: string | null;
  created_at: string;
}

export interface ApiCleanupPhoto {
  id: string;
  image: string;
  caption: string;
  sort_order: number;
  uploaded_by_name: string | null;
  created_at: string;
}

export interface ApiBeachCleanup {
  id: string;
  slug: string;
  beach: string | null;
  beach_name: string | null;
  event: string | null;
  title: string;
  description: string;
  cleanup_date: string;
  participants_count: number;
  waste_collected_kg: number;
  photos_count: number;
  organized_by: string | null;
  organizer_name: string | null;
  created_at: string;
  photos: ApiCleanupPhoto[];
  can_edit: boolean;
}

export interface ApiSound {
  id: string; instrument: string; manufacturer: string; model_number: string;
  duration_seconds: number | null; frequency_range: string;
  depth_meters: number | null; written_description: string;
  recording_date: string | null;
  contribution: { id: string; user: { id: string; first_name: string; last_name: string } | string; village: { id: string; name: string } | string; notes: string } | string;
}

export interface ApiSoundLibraryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  source: string;
  sort_order: number;
  category: string;
  category_name: string;
  category_slug: string;
  audio_url: string | null;
  photo_url: string | null;
  spectrogram_url: string | null;
  document_url: string | null;
  document_name: string | null;
  document_type: string | null;
  document_size: number | null;
  created_at?: string;
}

export interface ApiSoundLibraryCategory {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  description: string;
  icon: string;
  sort_order: number;
  document_url: string | null;
  document_name: string | null;
  document_type: string | null;
  document_size: number | null;
  items: ApiSoundLibraryItem[];
  children: ApiSoundLibraryCategory[];
  item_count: number;
}

export interface SoundLibraryDoc {
  document: string;
  name: string;
  file_type: string;
  file_size?: number | null;
}

export function soundLibraryDoc(
  url: string | null,
  name: string | null,
  type: string | null,
  size: number | null = null
): SoundLibraryDoc | null {
  if (!url) return null;
  const file_type = type || url.split(".").pop()?.toLowerCase() || "file";
  return { document: url, name: name || "Document", file_type, file_size: size };
}

export async function fetchSoundLibrary(): Promise<ApiSoundLibraryCategory[]> {
  return fetchCmsList<ApiSoundLibraryCategory>("/sounds/library/categories/");
}

export interface ApiSighting {
  id: string; ai_species_suggestion: string; ai_confidence: number | null;
  number_observed: number; behavior: string; sea_condition: string;
  weather: string; notes: string; sighting_date: string | null;
  photo: string | null;
  species: { id: string; common_name: string; tamil_name: string; scientific_name: string; image: string | null } | string;
  contribution: { id: string; user: { id: string; first_name: string; last_name: string } | string; village: { id: string; name: string } | string } | string;
}

export interface ApiAward {
  id: string; category: string; year: number; title: string;
  description: string; score: number; rank: number | null;
  user: { id: string; username: string; first_name: string; last_name: string } | string;
  village: { id: string; name: string } | string;
  zone: { id: string; name: string } | string;
}

export interface ApiScore {
  id: string; total_score: number; verified_contributions: number;
  total_contributions: number; quality_average: number;
  user: { id: string; username: string; first_name: string; last_name: string } | string;
}

export interface ApiMember {
  id: string;
  user: { id: string; username: string; first_name: string; last_name: string; role: string } | string;
  village: { id: string; name: string } | string;
  occupation: string; bio: string; contribution_score: number;
  member_status: string; total_contributions: number; total_verified: number;
}

export interface ApiEmergencyContact {
  id: string; name: string; contact_type: string; phone: string;
  phone_secondary: string; is_active: boolean; address: string;
  village: { id: string; name: string } | string;
  district: { id: string; name: string } | string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(val: any): val is string {
  return typeof val === "string" && UUID_RE.test(val);
}

export function resolveName(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") {
    if (isUUID(obj)) return "";
    return obj;
  }
  return obj.first_name ? `${obj.first_name} ${obj.last_name || ""}`.trim() : obj.name || obj.username || "";
}

export function resolveStr(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") {
    if (isUUID(obj)) return "";
    return obj;
  }
  return obj.name || obj.title || "";
}

export async function resolveUserName(userId: string): Promise<string> {
  const data = await fetchCms<{ first_name: string; last_name: string; username: string }>(`/accounts/users/${userId}/`);
  if (!data) return userId;
  return data.first_name ? `${data.first_name} ${data.last_name || ""}`.trim() : data.username || userId;
}

/**
 * Describes a sighting that has no observer-written notes, so the card still
 * carries real content instead of looking blank.
 */
export function sightingFallbackText(input: {
  contributor?: string | null;
  village_name?: string | null;
  sighting_date?: string | null;
}): string {
  const who = (input.contributor || "").trim();
  const village = (input.village_name || "").trim();
  const date = input.sighting_date
    ? new Date(input.sighting_date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "";

  let opening: string;
  if (who && village && date) {
    opening = `A marine life sighting reported by ${who} near ${village} on ${date}.`;
  } else if (who && village) {
    opening = `A marine life sighting reported by ${who} near ${village}.`;
  } else if (who && date) {
    opening = `A marine life sighting reported by ${who} on ${date}.`;
  } else if (village && date) {
    opening = `A marine life sighting near ${village} on ${date}.`;
  } else if (who) {
    opening = `A marine life sighting reported by ${who}.`;
  } else if (village) {
    opening = `A marine life sighting near ${village}.`;
  } else if (date) {
    opening = `A marine life sighting recorded on ${date}.`;
  } else {
    opening = "A community-reported marine life sighting.";
  }
  return `${opening} Species identification is still pending.`;
}

export async function resolveVillageName(villageId: string): Promise<string> {
  const data = await fetchCms<{ name: string }>(`/locations/villages/${villageId}/`);
  if (!data) return villageId;
  return data.name || villageId;
}
