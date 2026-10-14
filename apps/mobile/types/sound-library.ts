export interface SoundLibraryItem {
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

export interface SoundLibraryCategory {
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
  items: SoundLibraryItem[];
  children: SoundLibraryCategory[];
  item_count: number;
}
