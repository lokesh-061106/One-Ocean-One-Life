import { RecognitionAward, ContributionScore, LeaderboardEntry, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function getLeaderboard(level?: string): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams();
  if (level) params.set('level', level);

  const res = await fetch(`${API_BASE}/recognition/leaderboard/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function getMyScore(): Promise<ContributionScore> {
  const res = await fetch(`${API_BASE}/recognition/scores/me/`);
  if (!res.ok) throw new Error('Failed to fetch score');
  return res.json();
}

export async function getMyAwards(): Promise<PaginatedResponse<RecognitionAward>> {
  const res = await fetch(`${API_BASE}/recognition/awards/me/`);
  if (!res.ok) throw new Error('Failed to fetch awards');
  return res.json();
}

export async function getAllAwards(): Promise<PaginatedResponse<RecognitionAward>> {
  const res = await fetch(`${API_BASE}/recognition/awards/`);
  if (!res.ok) throw new Error('Failed to fetch awards');
  return res.json();
}
