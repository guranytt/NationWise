import { fetchJson } from './client';

export interface Category {
  id: string;
  name: string;
  description: string;
}

export async function getCategories(): Promise<Category[]> {
  return fetchJson<Category[]>('/categories');
}
