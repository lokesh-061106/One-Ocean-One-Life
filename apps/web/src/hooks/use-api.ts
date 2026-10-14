import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, PaginatedResponse } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: number;
  phone: string;
  is_verified: boolean;
  preferred_language: string;
  date_joined: string;
}

export interface Profile {
  id: string;
  user: User;
  photo: string;
  village: string;
  occupation: string;
  organization: string;
  bio: string;
  contribution_score: number;
  member_status: string;
  lat: number;
  lng: number;
}

export interface Zone {
  id: string;
  name: string;
  slug: string;
  zone_number: number;
}

export interface District {
  id: string;
  name: string;
  zone: Zone;
  state: string;
  population: number;
  area: number;
}

export interface Village {
  id: string;
  name: string;
  district: District;
  is_coastal: boolean;
  lat: number;
  lng: number;
}

export interface GuideCategory {
  id: string;
  name: string;
  name_tamil: string;
  slug: string;
  icon: string;
  parent: string | null;
  sort_order: number;
}

export interface GuideSpecies {
  id: string;
  category: GuideCategory;
  common_name: string;
  tamil_name: string;
  scientific_name: string;
  description: string;
  habitat: string;
  diet: string;
  behavior: string;
  identification: string;
  conservation_status: string;
  image: string;
  is_verified: boolean;
}

export interface EducationCategory {
  id: string;
  name: string;
  name_tamil: string;
  slug: string;
  icon: string;
}

export interface EducationPost {
  id: string;
  author: User;
  category: EducationCategory;
  title: string;
  content: string;
  post_type: string;
  village: Village;
  image: string;
  is_verified: boolean;
  reactions_count: number;
  views_count: number;
  created_at: string;
}

export interface Contribution {
  id: string;
  user: User;
  type: string;
  status: string;
  location: any;
  village: Village;
  zone: Zone;
  quality_score: number;
  points: number;
  metadata: any;
  created_at: string;
}

export interface OceanSound {
  id: string;
  contribution: Contribution;
  audio_file: string;
  duration: number;
  instrument: string;
  depth: number;
  environmental_conditions: any;
  frequency_range: string;
  recording_date: string;
  recording_time: string;
}

export interface MarineSighting {
  id: string;
  contribution: Contribution;
  species: GuideSpecies;
  ai_species_suggestion: string;
  ai_confidence: number;
  photo: string;
  video: string;
  number_observed: number;
  behavior: string;
  sea_condition: string;
  weather: string;
  sighting_date: string;
  sighting_time: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  organizer: User;
  village: Village;
  start_date: string;
  end_date: string;
  max_participants: number;
  is_published: boolean;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  author: User;
  title: string;
  content: string;
  category: string;
  village: Village;
  is_verified: boolean;
  reactions_count: number;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  contact_type: string;
  phone: string;
  village: Village;
  district: District;
  is_active: boolean;
}

export interface RecognitionAward {
  id: string;
  user: User;
  category: string;
  year: number;
  title: string;
  score: number;
  rank: number;
  village: Village;
  zone: Zone;
}

export interface Notification {
  id: string;
  user: User;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  data: any;
  created_at: string;
}

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      apiClient.post<{ access: string; refresh: string }>(ENDPOINTS.AUTH.LOGIN, data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: any) => apiClient.post(ENDPOINTS.AUTH.REGISTER, data),
  });
}

export function useMe(token?: string) {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get<User>(ENDPOINTS.AUTH.ME, undefined, token),
    enabled: !!token,
  });
}

// Zone hooks
export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: () => apiClient.get<PaginatedResponse<Zone>>(ENDPOINTS.ZONES.LIST),
  });
}

export function useZone(id: string) {
  return useQuery({
    queryKey: ['zones', id],
    queryFn: () => apiClient.get<Zone>(ENDPOINTS.ZONES.DETAIL(id)),
  });
}

// District hooks
export function useDistricts(zoneId?: string) {
  return useQuery({
    queryKey: ['districts', zoneId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<District>>(ENDPOINTS.DISTRICTS.LIST, 
        zoneId ? { zone: zoneId } : undefined
      ),
  });
}

// Village hooks
export function useVillages(districtId?: string) {
  return useQuery({
    queryKey: ['villages', districtId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Village>>(ENDPOINTS.VILLAGES.LIST,
        districtId ? { district: districtId } : undefined
      ),
  });
}

// State fisheries profile hooks
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
  agencies: Array<{ name: string; detail: string }>;
  ban_relief_text: string;
  lean_allowance_text: string;
  period_remarks: string;
  data_note: string;
  lean_periods: StateLeanPeriod[];
  live_stats: StateLiveStats;
}

export function useStateProfiles() {
  return useQuery({
    queryKey: ['stateProfiles'],
    queryFn: () => apiClient.get<PaginatedResponse<StateProfile>>(ENDPOINTS.STATE_PROFILES.LIST),
  });
}

// Guide hooks
export function useGuideCategories() {
  return useQuery({
    queryKey: ['guideCategories'],
    queryFn: () => apiClient.get<PaginatedResponse<GuideCategory>>(ENDPOINTS.GUIDES.CATEGORIES),
  });
}

export function useGuideSpecies(categoryId?: string) {
  return useQuery({
    queryKey: ['guideSpecies', categoryId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<GuideSpecies>>(ENDPOINTS.GUIDES.SPECIES,
        categoryId ? { category: categoryId } : undefined
      ),
  });
}

export function useGuideSpeciesDetail(id: string) {
  return useQuery({
    queryKey: ['guideSpecies', id],
    queryFn: () => apiClient.get<GuideSpecies>(ENDPOINTS.GUIDES.SPECIES_DETAIL(id)),
  });
}

// Education hooks
export function useEducationCategories() {
  return useQuery({
    queryKey: ['educationCategories'],
    queryFn: () => apiClient.get<PaginatedResponse<EducationCategory>>(ENDPOINTS.EDUCATION.CATEGORIES),
  });
}

export function useEducationPosts(categoryId?: string) {
  return useQuery({
    queryKey: ['educationPosts', categoryId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<EducationPost>>(ENDPOINTS.EDUCATION.POSTS,
        categoryId ? { category: categoryId } : undefined
      ),
  });
}

export function useEducationPostDetail(id: string) {
  return useQuery({
    queryKey: ['educationPosts', id],
    queryFn: () => apiClient.get<EducationPost>(ENDPOINTS.EDUCATION.POST_DETAIL(id)),
  });
}

// Contribution hooks
export function useContributions(token?: string) {
  return useQuery({
    queryKey: ['contributions'],
    queryFn: () => apiClient.get<PaginatedResponse<Contribution>>(ENDPOINTS.CONTRIBUTIONS.LIST, undefined, token),
  });
}

export function useMyContributions(token?: string) {
  return useQuery({
    queryKey: ['myContributions'],
    queryFn: () => apiClient.get<PaginatedResponse<Contribution>>(ENDPOINTS.CONTRIBUTIONS.MY, undefined, token),
    enabled: !!token,
  });
}

export function useMyContributionStats(token?: string) {
  return useQuery({
    queryKey: ['myContributionStats'],
    queryFn: () => apiClient.get<any>(ENDPOINTS.CONTRIBUTIONS.MY_STATS, undefined, token),
    enabled: !!token,
  });
}

// Sound hooks
export function useOceanSounds() {
  return useQuery({
    queryKey: ['oceanSounds'],
    queryFn: () => apiClient.get<PaginatedResponse<OceanSound>>(ENDPOINTS.SOUNDS.LIST),
  });
}

export function useCreateOceanSound(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post(ENDPOINTS.SOUNDS.CREATE, data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oceanSounds'] });
    },
  });
}

// Sighting hooks
export function useMarineSightings() {
  return useQuery({
    queryKey: ['marineSightings'],
    queryFn: () => apiClient.get<PaginatedResponse<MarineSighting>>(ENDPOINTS.SIGHTINGS.LIST),
  });
}

export function useCreateMarineSighting(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post(ENDPOINTS.SIGHTINGS.CREATE, data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marineSightings'] });
    },
  });
}

// Community hooks
export function useCommunityMembers() {
  return useQuery({
    queryKey: ['communityMembers'],
    queryFn: () => apiClient.get<PaginatedResponse<Profile>>(ENDPOINTS.COMMUNITY.MEMBERS),
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => apiClient.get<PaginatedResponse<Event>>(ENDPOINTS.COMMUNITY.EVENTS),
  });
}

export function useCreateEvent(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post(ENDPOINTS.COMMUNITY.EVENT_CREATE, data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCommunityPosts() {
  return useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => apiClient.get<PaginatedResponse<CommunityPost>>(ENDPOINTS.COMMUNITY.POSTS),
  });
}

// Map hooks
export function useOceanHotspots() {
  return useQuery({
    queryKey: ['oceanHotspots'],
    queryFn: () => apiClient.get<PaginatedResponse<any>>(ENDPOINTS.MAPS.HOTSPOTS),
  });
}

export function useEmergencyContacts(districtId?: string) {
  return useQuery({
    queryKey: ['emergencyContacts', districtId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<EmergencyContact>>(ENDPOINTS.MAPS.EMERGENCY_CONTACTS,
        districtId ? { district: districtId } : undefined
      ),
  });
}

// Recognition hooks
export function useRecognitionAwards() {
  return useQuery({
    queryKey: ['recognitionAwards'],
    queryFn: () => apiClient.get<PaginatedResponse<RecognitionAward>>(ENDPOINTS.RECOGNITION.AWARDS),
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => apiClient.get<any>(ENDPOINTS.RECOGNITION.LEADERBOARD),
  });
}

// Notification hooks
export function useNotifications(token?: string) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<PaginatedResponse<Notification>>(ENDPOINTS.NOTIFICATIONS.LIST, undefined, token),
    enabled: !!token,
  });
}

export function useMarkNotificationRead(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {}, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {}, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Search hook
export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => apiClient.get<any>(ENDPOINTS.SEARCH, { q: query }),
    enabled: query.length > 0,
  });
}
