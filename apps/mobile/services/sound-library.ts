import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import type { SoundLibraryCategory, SoundLibraryItem } from '@/types/sound-library';

type Paginated<T> = { results?: T[]; next?: string | null } | T[];

async function unwrap<T>(res: Paginated<T>): Promise<T[]> {
  return Array.isArray(res) ? res : ((res as { results?: T[] }).results ?? []);
}

export async function fetchLibraryCategories(): Promise<SoundLibraryCategory[]> {
  const res = await api.get<Paginated<SoundLibraryCategory>>(ENDPOINTS.SOUNDS.LIBRARY_CATEGORIES);
  return unwrap(res);
}

export async function fetchLibraryItem(slug: string): Promise<SoundLibraryItem> {
  return api.get<SoundLibraryItem>(`${ENDPOINTS.SOUNDS.LIBRARY_ITEMS}${slug}/`);
}

export function findCategory(
  categories: SoundLibraryCategory[],
  slug: string | null | undefined
): SoundLibraryCategory | null {
  if (!slug) return null;
  for (const category of categories) {
    if (category.slug === slug) return category;
    const match = findCategory(category.children, slug);
    if (match) return match;
  }
  return null;
}

export function collectItems(category: SoundLibraryCategory): SoundLibraryItem[] {
  const items = [...category.items];
  for (const child of category.children) items.push(...collectItems(child));
  return items.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}
