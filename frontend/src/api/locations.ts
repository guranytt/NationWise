import { fetchJson } from './client';

export async function getStates(): Promise<string[]> {
  return fetchJson<string[]>('/locations/states');
}

export async function getLgas(state: string): Promise<string[]> {
  return fetchJson<string[]>(`/locations/lgas?state=${encodeURIComponent(state)}`);
}
