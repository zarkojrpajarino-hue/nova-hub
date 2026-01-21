import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for Master system
export interface MasterApplication {
  id: string;
  user_id: string;
  role_name: string;
  project_id: string | null;
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'expired';
  motivation: string;
  achievements: Array<{ title: string; description: string }>;
  votes_for: number;
  votes_against: number;
  votes_required: number;
  voting_deadline: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MasterVote {
  id: string;
  application_id: string;
  voter_id: string;
  vote: boolean;
  comentario: string | null;
  created_at: string;
}

export interface TeamMaster {
  id: string;
  user_id: string;
  role_name: string;
  level: number;
  title: string | null;
  appointed_at: string;
  expires_at: string | null;
  is_active: boolean;
  total_mentees: number;
  successful_defenses: number;
  created_at: string;
}

export interface MasterChallenge {
  id: string;
  challenger_id: string;
  master_id: string;
  role_name: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'expired';
  challenge_type: 'performance' | 'project' | 'peer_vote';
  description: string | null;
  criteria: Json;
  deadline: string | null;
  result: 'challenger_wins' | 'master_wins' | 'draw' | null;
  result_notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface MasterEligibility {
  eligible: boolean;
  performance: number;
  months_in_role: number;
  reasons: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

// Hook for master applications
export function useMasterApplications(status?: string) {
  return useQuery({
    queryKey: ['master_applications', status],
    queryFn: async () => {
      let query = supabase
        .from('master_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MasterApplication[];
    },
  });
}

// Hook for user's own applications
export function useMyMasterApplications(userId?: string) {
  return useQuery({
    queryKey: ['master_applications', 'my', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('master_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MasterApplication[];
    },
    enabled: !!userId,
  });
}

// Hook for team masters
export function useTeamMasters(roleName?: string) {
  return useQuery({
    queryKey: ['team_masters', roleName],
    queryFn: async () => {
      let query = supabase
        .from('team_masters')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false });
      
      if (roleName) {
        query = query.eq('role_name', roleName);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TeamMaster[];
    },
  });
}

// Hook for master votes on an application
export function useMasterVotes(applicationId?: string) {
  return useQuery({
    queryKey: ['master_votes', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      
      const { data, error } = await supabase
        .from('master_votes')
        .select('*')
        .eq('application_id', applicationId);
      
      if (error) throw error;
      return data as MasterVote[];
    },
    enabled: !!applicationId,
  });
}

// Hook for master challenges
export function useMasterChallenges(masterId?: string) {
  return useQuery({
    queryKey: ['master_challenges', masterId],
    queryFn: async () => {
      let query = supabase
        .from('master_challenges')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (masterId) {
        query = query.eq('master_id', masterId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MasterChallenge[];
    },
  });
}

// Hook to check eligibility
export function useCheckMasterEligibility(userId?: string, roleName?: string) {
  return useQuery({
    queryKey: ['master_eligibility', userId, roleName],
    queryFn: async () => {
      if (!userId || !roleName) return null;
      
      const { data, error } = await supabase
        .rpc('check_master_eligibility', {
          p_user_id: userId,
          p_role: roleName,
        });
      
      if (error) throw error;
      return data as unknown as MasterEligibility;
    },
    enabled: !!userId && !!roleName,
  });
}

// Mutation to create application
export function useCreateMasterApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (application: {
      user_id: string;
      role_name: string;
      project_id?: string;
      motivation: string;
      achievements?: Array<{ title: string; description: string }>;
    }) => {
      const { data, error } = await supabase
        .from('master_applications')
        .insert({
          ...application,
          status: 'voting',
          voting_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_applications'] });
    },
  });
}

// Mutation to vote on application
export function useVoteOnApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (vote: {
      application_id: string;
      voter_id: string;
      vote: boolean;
      comentario?: string;
    }) => {
      const { data, error } = await supabase
        .from('master_votes')
        .insert(vote)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['master_applications'] });
      queryClient.invalidateQueries({ queryKey: ['master_votes', variables.application_id] });
    },
  });
}

// Mutation to create challenge
export function useCreateChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (challenge: {
      challenger_id: string;
      master_id: string;
      role_name: string;
      challenge_type: 'performance' | 'project' | 'peer_vote';
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('master_challenges')
        .insert({
          ...challenge,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_challenges'] });
    },
  });
}

// Mutation to update challenge
export function useUpdateChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MasterChallenge> & { id: string }) => {
      const { data, error } = await supabase
        .from('master_challenges')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_challenges'] });
      queryClient.invalidateQueries({ queryKey: ['team_masters'] });
    },
  });
}
