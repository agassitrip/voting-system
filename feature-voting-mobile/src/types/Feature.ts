export interface Feature {
  id: string;
  title: string;
  description: string;
  vote_count: number;
  created_at: string;
  created_by: string;
  anchor_to?: string;
  archived: boolean;
  anchored_features: string[];
}

export interface FeatureCreate {
  title: string;
  description: string;
  anchor_to?: string;
}

export interface User {
  id: string;
  ip_address: string;
  cookie_id: string;
  created_at: string;
}
