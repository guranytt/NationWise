import { fetchJson } from './client';

export interface Candidate {
  id: string;
  full_name: string;
  party: string;
  state: string;
  lga: string | null;
  position_sought: string;
  election_cycle: string;
  photo_url: string | null;
  overall_score: number | null;
}

export interface CandidateScore {
  overall_score: number;
  transparency_score: number;
  track_record_score: number;
  financial_score: number;
  governance_score: number;
  public_trust_score: number;
}

export interface CandidateMetric {
  id: string;
  metric_type: string;
  value: number;
  source_url: string | null;
  source_label: string | null;
  scraped_at: string;
}

export interface CandidateDetail {
  candidate: Candidate & { bio: string | null };
  score: CandidateScore | null;
  metrics: CandidateMetric[];
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  full_name: string;
  party: string;
  state: string;
  position_sought: string;
  overall_score: number;
}

export const getCandidates = async (params?: Record<string, string>): Promise<Candidate[]> => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchJson<Candidate[]>(`/candidates/${query}`);
};

export const getCandidateDetail = async (id: string): Promise<CandidateDetail> => {
  return fetchJson<CandidateDetail>(`/candidates/${id}`);
};

export const getCompareCandidates = async (ids: string[]): Promise<CandidateDetail[]> => {
  return fetchJson<CandidateDetail[]>(`/candidates/compare/?ids=${ids.join(',')}`);
};

export const getLeaderboard = async (params?: Record<string, string>): Promise<LeaderboardEntry[]> => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchJson<LeaderboardEntry[]>(`/candidates/board/leaderboard${query}`);
};

export const rateCandidate = async (candidateId: string, fingerprintId: string, rating: number): Promise<void> => {
  await fetchJson(`/candidates/${candidateId}/rate`, {
    method: 'POST',
    body: JSON.stringify({
      fingerprint_id: fingerprintId,
      rating
    })
  });
};
