import { CommunityPost, Event, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface CommunityFilters {
  visibility?: string;
  search?: string;
  village?: string;
}

export interface EventFilters {
  event_type?: string;
  search?: string;
  village?: string;
  upcoming?: boolean;
}

export async function getCommunityPosts(
  filters?: CommunityFilters
): Promise<PaginatedResponse<CommunityPost>> {
  const params = new URLSearchParams();
  if (filters?.visibility) params.set('visibility', filters.visibility);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.village) params.set('village', filters.village);

  const res = await fetch(`${API_BASE}/community/posts/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function createCommunityPost(data: Partial<CommunityPost>): Promise<CommunityPost> {
  const res = await fetch(`${API_BASE}/community/posts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}

export async function getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
  const params = new URLSearchParams();
  if (filters?.event_type) params.set('event_type', filters.event_type);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.village) params.set('village', filters.village);
  if (filters?.upcoming) params.set('upcoming', 'true');

  const res = await fetch(`${API_BASE}/community/events/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function joinEvent(eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/community/events/${eventId}/join/`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to join event');
}

export async function leaveEvent(eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/community/events/${eventId}/leave/`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to leave event');
}
