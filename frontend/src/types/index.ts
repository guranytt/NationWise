export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Agency {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  complaints_portal_url: string | null;
}

export interface StatusHistory {
  old_status: string | null;
  new_status: string;
  changed_at: string;
  note: string | null;
}

export interface Issue {
  id: string;
  category: Category;
  title: string;
  description: string;
  state: string;
  lga: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  routed_agency: Agency | null;
  created_at: string;
  history?: StatusHistory[];
}

export interface IssueCreate {
  category_id: string;
  title: string;
  description: string;
  state: string;
  lga: string;
  latitude?: number | null;
  longitude?: number | null;
  fingerprint_visitor_id: string;
}

export interface StatusUpdate {
  new_status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'stalled';
  note?: string | null;
}
