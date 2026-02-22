/**
 * 🎓 USE GENERATE LEARNING ROADMAP HOOK
 *
 * Hook para generar roadmap de aprendizaje con IA
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GenerateRoadmapRequest {
  project_id: string;
  member_id: string;
  project_name: string;
  industry: string;
  business_idea: string;
}

interface RoadmapStep {
  id: string;
  role_name: string;
  description: string;
  step_order: number;
  tasks_required: number;
  obvs_required: number;
  estimated_weeks: number;
  skills_to_learn: string[];
  unlock_criteria: string;
}

interface GenerateRoadmapResponse {
  success: boolean;
  roadmap: RoadmapStep[];
  count: number;
  message: string;
}

export function useGenerateLearningRoadmap() {
  return useMutation({
    mutationFn: async (request: GenerateRoadmapRequest): Promise<GenerateRoadmapResponse> => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-learning-roadmap`,
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
        throw new Error(errorData.error || 'Failed to generate roadmap');
      }

      return await response.json();
    },
  });
}
