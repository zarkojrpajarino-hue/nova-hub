// Types for Masters system

export interface Master {
  id: string;
  user_id: string;
  role_name: string;
  level: number;
  title: string;
  is_active: boolean;
  appointed_at: string;
  successful_defenses: number;
  total_mentees: number;
  expires_at: string | null;
  created_at: string;
}

export interface MasterApplication {
  id: string;
  user_id: string;
  role_name: string;
  motivation: string;
  status: string;
  votes_for: number;
  votes_against: number;
  votes_required: number;
  voting_deadline: string;
  created_at: string;
  project_id: string | null;
  achievements: string | null;
  reviewed_at: string | null;
  updated_at: string;
}

export interface MasterChallenge {
  id: string;
  master_id: string;
  challenger_id: string;
  role_name: string;
  status: string;
  description: string;
  deadline: string;
  created_at: string;
  challenge_type: string;
  criteria: string | null;
  result: string | null;
  result_notes: string | null;
  completed_at: string | null;
}

export interface Profile {
  id: string;
  nombre: string;
  email: string;
  avatar: string | null;
  color: string;
  auth_id: string;
  created_at: string | null;
  updated_at: string | null;
  especialization: string | null;
}

export interface ProjectMember {
  member_id: string;
  role: string;
  project_id?: string;
}

export interface EnrichedMaster extends Master {
  userName: string;
  userAvatar: string | null;
  userColor: string;
}

export type MastersByRole = Record<string, EnrichedMaster[]>;
