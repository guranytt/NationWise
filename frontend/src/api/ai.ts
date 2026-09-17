import { fetchJson } from './client';

export interface AIInsight {
  id: string;
  candidate_id: string;
  insight_type: string;
  content: {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    [key: string]: any;
  };
  model_used: string;
  created_at: string;
}

export interface PromiseRecord {
  id: string;
  candidate_id: string;
  promise_text: string;
  category: string;
  status: 'pending' | 'fulfilled' | 'broken' | 'in_progress';
  evidence?: string;
  confidence_score: number;
  extracted_from_url?: string;
  created_at: string;
}

export async function getInsights(candidateId: string): Promise<AIInsight[]> {
  return fetchJson<AIInsight[]>(`/ai/insights/${candidateId}`);
}

export async function analyzeCandidate(candidateId: string): Promise<AIInsight> {
  return fetchJson<AIInsight>(`/ai/analyze-candidate/${candidateId}`, { method: 'POST' });
}

export async function getPromises(candidateId: string): Promise<PromiseRecord[]> {
  return fetchJson<PromiseRecord[]>(`/ai/promises/${candidateId}`);
}
