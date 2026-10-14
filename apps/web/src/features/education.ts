import { EducationCategory, EducationPost, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface EducationFilters {
  category?: string;
  post_type?: string;
  search?: string;
  language?: string;
}

export async function getEducationCategories(): Promise<EducationCategory[]> {
  const res = await fetch(`${API_BASE}/education/categories/`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getEducationPosts(
  filters?: EducationFilters
): Promise<PaginatedResponse<EducationPost>> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.post_type) params.set('post_type', filters.post_type);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.language) params.set('language', filters.language);

  const res = await fetch(`${API_BASE}/education/posts/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function getEducationPostDetail(id: string): Promise<EducationPost> {
  const res = await fetch(`${API_BASE}/education/posts/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch post');
  return res.json();
}
