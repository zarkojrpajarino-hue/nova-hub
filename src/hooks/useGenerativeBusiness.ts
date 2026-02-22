/**
 * HOOK: useGenerativeBusiness
 *
 * Maneja todas las llamadas a Edge Functions de Generative Onboarding:
 * - generate-business-ideas (para usuarios sin idea)
 * - generate-complete-business (para generar negocio completo)
 * - approve-generation-preview (para aplicar preview seleccionado)
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessIdea {
  idea_name: string;
  description: string;
  target_customer: string;
  problem: string;
  solution: string;
  why_viable: string;
}

export interface BrandingOption {
  option: number;
  company_name: string;
  tagline: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  font_heading: string;
  font_body: string;
  logo_url: string;
  logo_prompt_used: string;
}

export interface GenerationPreview {
  id: string;
  project_id: string;
  generation_type: string;
  generated_options: Record<string, unknown>[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export function useGenerativeBusiness(projectId?: string) {
  // ============================================================================
  // GENERATE BUSINESS IDEAS (for users without idea)
  // ============================================================================
  const generateIdeasMutation = useMutation({
    mutationFn: async ({ interests }: { interests: string[] }) => {
      if (!projectId) throw new Error('Project ID required');

      const { data, error } = await supabase.functions.invoke('generate-business-ideas', {
        body: {
          project_id: projectId,
          user_interests: interests,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate ideas');

      return data;
    },
    onSuccess: (data) => {
      toast.success('✨ Ideas generadas con IA', {
        description: `${data.ideas.length} ideas de negocio creadas`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al generar ideas', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // GENERATE COMPLETE BUSINESS (from selected idea)
  // ============================================================================
  const generateBusinessMutation = useMutation({
    mutationFn: async ({ ideaId }: { ideaId: string }) => {
      if (!projectId) throw new Error('Project ID required');

      const { data, error } = await supabase.functions.invoke('generate-complete-business', {
        body: {
          project_id: projectId,
          idea_id: ideaId,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate business');

      return data;
    },
    onSuccess: (data) => {
      toast.success('🎉 Negocio completo generado', {
        description: `${data.branding_options} opciones de branding creadas`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al generar negocio', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // APPROVE GENERATION PREVIEW (apply selected branding to DB)
  // ============================================================================
  const approvePreviewMutation = useMutation({
    mutationFn: async ({
      previewId,
      selectedOption,
    }: {
      previewId: string;
      selectedOption: number;
    }) => {
      if (!projectId) throw new Error('Project ID required');

      const { data, error } = await supabase.functions.invoke('approve-generation-preview', {
        body: {
          preview_id: previewId,
          selected_option: selectedOption,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to approve preview');

      return data;
    },
    onSuccess: (data) => {
      toast.success('✅ Negocio aplicado correctamente', {
        description: data.website_url
          ? `Website deployado: ${data.website_url}`
          : 'Datos guardados en DB',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al aplicar negocio', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // GET PENDING PREVIEWS (for user to review)
  // ============================================================================
  const {
    data: pendingPreviews,
    isLoading: loadingPreviews,
    refetch: refetchPreviews,
  } = useQuery({
    queryKey: ['generation-previews', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('generation_previews')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as GenerationPreview[];
    },
    enabled: !!projectId,
  });

  // ============================================================================
  // GET GENERATED BUSINESS IDEAS (for user to select)
  // ============================================================================
  const {
    data: businessIdeas,
    isLoading: loadingIdeas,
    refetch: refetchIdeas,
  } = useQuery({
    queryKey: ['business-ideas', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('generated_business_ideas')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // ============================================================================
  // SELECT BUSINESS IDEA (mark as selected, others as rejected)
  // ============================================================================
  const selectIdeaMutation = useMutation({
    mutationFn: async ({ ideaId }: { ideaId: string }) => {
      if (!projectId) throw new Error('Project ID required');

      // Mark selected idea as selected
      const { error: selectError } = await supabase
        .from('generated_business_ideas')
        .update({ status: 'selected' })
        .eq('id', ideaId);

      if (selectError) throw selectError;

      // Mark other ideas as rejected
      const { error: rejectError } = await supabase
        .from('generated_business_ideas')
        .update({ status: 'rejected' })
        .eq('project_id', projectId)
        .neq('id', ideaId);

      if (rejectError) throw rejectError;

      // Update project stage to idea_generada
      const { error: projectError } = await supabase
        .from('projects')
        .update({ user_stage: 'idea_generada' })
        .eq('id', projectId);

      if (projectError) throw projectError;

      return { ideaId };
    },
    onSuccess: () => {
      toast.success('Idea seleccionada', {
        description: 'Ahora puedes generar el negocio completo',
      });
      refetchIdeas();
    },
    onError: (error: Error) => {
      toast.error('Error al seleccionar idea', {
        description: error.message,
      });
    },
  });

  return {
    // Generate ideas
    generateIdeas: generateIdeasMutation.mutate,
    isGeneratingIdeas: generateIdeasMutation.isPending,

    // Generate complete business
    generateBusiness: generateBusinessMutation.mutate,
    isGeneratingBusiness: generateBusinessMutation.isPending,

    // Approve preview
    approvePreview: approvePreviewMutation.mutate,
    isApprovingPreview: approvePreviewMutation.isPending,

    // Select idea
    selectIdea: selectIdeaMutation.mutate,
    isSelectingIdea: selectIdeaMutation.isPending,

    // Data
    pendingPreviews,
    loadingPreviews,
    refetchPreviews,

    businessIdeas,
    loadingIdeas,
    refetchIdeas,
  };
}
