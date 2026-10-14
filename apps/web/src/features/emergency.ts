import { EmergencyProfile, EmergencyContact } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function getEmergencyProfile(): Promise<EmergencyProfile> {
  const res = await fetch(`${API_BASE}/emergency/profile/`);
  if (!res.ok) throw new Error('Failed to fetch emergency profile');
  return res.json();
}

export async function updateEmergencyProfile(
  data: Partial<EmergencyProfile>
): Promise<EmergencyProfile> {
  const res = await fetch(`${API_BASE}/emergency/profile/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update emergency profile');
  return res.json();
}

export async function getOfflineData(): Promise<{
  contacts: EmergencyContact[];
  villages: { id: string; name: string; lat: number; lng: number }[];
  safety_instructions: string[];
  emergency_numbers: { name: string; phone: string }[];
}> {
  const res = await fetch(`${API_BASE}/emergency/offline-data/`);
  if (!res.ok) throw new Error('Failed to fetch offline data');
  return res.json();
}

export async function addEmergencyContact(
  data: Partial<EmergencyContact>
): Promise<EmergencyContact> {
  const res = await fetch(`${API_BASE}/emergency/contacts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add emergency contact');
  return res.json();
}

export async function removeEmergencyContact(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/emergency/contacts/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove emergency contact');
}
