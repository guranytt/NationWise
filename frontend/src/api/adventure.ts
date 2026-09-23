import { fetchJson } from './client';

export interface AdventureSection {
  title: string;
  content: string;
  order: int;
}

export interface AdventureResponse {
  summary: string;
  sections: AdventureSection[];
  pdf_url?: string;
}

export async function getCandidateAdventure(candidateId: string): Promise<AdventureResponse> {
  return fetchJson<AdventureResponse>(`/adventure/${candidateId}`);
}
