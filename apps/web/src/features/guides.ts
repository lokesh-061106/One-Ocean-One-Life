import { GuideCategory, GuideSpecies, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface GuideFilters {
  category?: string;
  search?: string;
  verified?: boolean;
  conservation_status?: string;
}

export async function getGuideCategories(): Promise<GuideCategory[]> {
  const res = await fetch(`${API_BASE}/guides/categories/`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getGuideSpecies(
  filters?: GuideFilters
): Promise<PaginatedResponse<GuideSpecies>> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.verified !== undefined) params.set('verified', String(filters.verified));
  if (filters?.conservation_status) params.set('conservation_status', filters.conservation_status);

  const res = await fetch(`${API_BASE}/guides/species/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch species');
  return res.json();
}

export async function getGuideSpeciesDetail(id: string): Promise<GuideSpecies> {
  const res = await fetch(`${API_BASE}/guides/species/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch species');
  return res.json();
}
