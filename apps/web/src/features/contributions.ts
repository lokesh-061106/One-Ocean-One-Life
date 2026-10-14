import { Contribution, ContributionType, ContributionStatus, PaginatedResponse, ContributionMediaFile } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ContributionFilters {
  type?: string;
  status?: ContributionStatus;
  village?: string;
  search?: string;
  user?: string;
}

export async function getContributionTypes(): Promise<ContributionType[]> {
  const res = await fetch(`${API_BASE}/contributions/types/`);
  if (!res.ok) throw new Error('Failed to fetch contribution types');
  return res.json();
}

export async function getMyContributions(filters?: ContributionFilters): Promise<PaginatedResponse<Contribution>> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.village) params.set('village', filters.village);
  if (filters?.search) params.set('search', filters.search);

  const token = typeof window !== 'undefined' ? localStorage.getItem('o3l_access_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/contributions/my/?${params}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch contributions');
  return res.json();
}

export async function getPublicContributions(type?: string): Promise<Contribution[]> {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.set('type', type);
  const res = await fetch(`${API_BASE}/contributions/public/?${params}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || data || [];
}

export async function getPublicContribution(idOrSlug: string): Promise<Contribution | null> {
  const res = await fetch(`${API_BASE}/contributions/public/${idOrSlug}/`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function reviewContribution(
  id: string,
  action: 'approve' | 'reject' | 'verify',
  opts?: { notes?: string; rejection_reason?: string; points?: number }
): Promise<Contribution> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('o3l_access_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/contributions/${id}/review/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...opts }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Failed to review contribution');
  }
  return res.json();
}

export type { ContributionMediaFile };

// ── Contribution wizard (mirrors apps/api/contributions/schemas.py) ──

export type ContributorType =
  | 'fisher' | 'researcher' | 'volunteer' | 'enthusiast' | 'student' | 'organisation';

export interface WizardChoice { value: string; label: string }

export interface WizardField {
  key: string;
  label: string;
  type: 'string' | 'text' | 'choice' | 'integer' | 'float' | 'date' | 'boolean';
  required?: boolean;
  section?: string;
  help?: string;
  choices?: WizardChoice[];
  min?: number;
  max?: number;
}

export interface WizardMediaSection {
  required: { field: string; label: string }[];
  any_of: { field: string; label: string }[];
  optional: { field: string; label: string }[];
}

export interface WizardTypeConfig {
  value: string;
  label: string;
  primary: boolean;
  description: string;
  icon: string;
  requires_geotag: boolean;
  media: WizardMediaSection;
  text_fields: { key: string; label: string; required?: boolean }[];
  fields: WizardField[];
}

export interface ContributionWizardConfig {
  contributor_types: WizardChoice[];
  species_groups: WizardChoice[];
  types: WizardTypeConfig[];
}

export async function getWizardConfig(): Promise<ContributionWizardConfig> {
  const res = await fetch(`${API_BASE}/contributions/wizard-config/`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch contribution wizard config (HTTP ${res.status})`);
  }
  return res.json();
}
