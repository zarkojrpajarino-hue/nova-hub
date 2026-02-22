/**
 * 🤖 USE GENERATE ROLES HOOK
 *
 * Hook para generar roles con IA llamando al Edge Function
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GenerateRolesRequest {
  project_id: string;
  project_name: string;
  industry: string;
  business_idea: string;
  work_mode: 'individual' | 'team_small' | 'team_established' | 'no_roles';
}

interface GeneratedRole {
  id: string;
  role_name: string;
  description: string;
  responsibilities: string[];
  required_skills: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'expert';
  department: string;
  is_critical: boolean;
  display_order: number;
}

interface GenerateRolesResponse {
  success: boolean;
  roles: GeneratedRole[];
  count: number;
  message: string;
}

export function useGenerateRoles() {
  return useMutation({
    mutationFn: async (request: GenerateRolesRequest): Promise<GenerateRolesResponse> => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-project-roles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roles');
      }

      return await response.json();
    },
  });
}
