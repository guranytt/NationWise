import { fetchJson } from './client';
import type { Issue, IssueCreate, Category, StatusUpdate } from '../types';

export async function createIssue(data: IssueCreate): Promise<Issue> {
  return fetchJson<Issue>('/issues', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getIssues(params?: Record<string, string>): Promise<Issue[]> {
  const query = params ? new URLSearchParams(params).toString() : '';
  const url = query ? `/issues?${query}` : '/issues';
  return fetchJson<Issue[]>(url);
}

export async function getIssue(id: string): Promise<Issue> {
  return fetchJson<Issue>(`/issues/${id}`);
}

export async function updateIssueStatus(id: string, data: StatusUpdate, credentials: string): Promise<Issue> {
  return fetchJson<Issue>(`/admin/issues/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: {
      'Authorization': `Basic ${btoa(credentials)}`
    }
  });
}

export async function getCategories(): Promise<Category[]> {
  return fetchJson<Category[]>('/categories');
}

export async function getStates(): Promise<string[]> {
  return fetchJson<string[]>('/locations/states');
}

export async function getLgas(state: string): Promise<string[]> {
  return fetchJson<string[]>(`/locations/lgas?state=${encodeURIComponent(state)}`);
}
