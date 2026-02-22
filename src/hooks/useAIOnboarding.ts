/**
 * HOOK: useAIOnboarding
 *
 * Maneja la extracción de información de URLs con IA
 * para pre-rellenar el onboarding
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ProjectPhase,
  ContextType,
  BusinessInfo,
  AIOnboardingState,
} from '@/types/ai-onboarding';

export function useAIOnboarding() {
  const [state, setState] = useState<AIOnboardingState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const extractInfoMutation = useMutation({
    mutationFn: async ({
      url,
      projectPhase,
      contextType,
    }: {
      url: string;
      projectPhase: ProjectPhase;
      contextType: ContextType;
    }) => {
      const { data, error } = await supabase.functions.invoke('extract-business-info', {
        body: {
          url,
          project_phase: projectPhase,
          context_type: contextType,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to extract info');

      return data;
    },
    onMutate: () => {
      setState({
        isLoading: true,
        isSuccess: false,
        isError: false,
      });
    },
    onSuccess: (data) => {
      setState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        data: data.data,
        sourceUrl: data.source_url,
      });

      const aiUsed = data.ai_used ? 'con IA' : 'básica';
      toast.success(`Información extraída ${aiUsed}`, {
        description: data.data.insights?.[0] || 'Revisa los campos sugeridos',
      });
    },
    onError: (error: Error) => {
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: error.message,
      });

      toast.error('Error al analizar URL', {
        description: error.message,
      });
    },
  });

  const extractInfo = (
    url: string,
    projectPhase: ProjectPhase,
    contextType: ContextType
  ) => {
    return extractInfoMutation.mutate({ url, projectPhase, contextType });
  };

  const reset = () => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  };

  const applyData = (data: BusinessInfo, currentFormData: Record<string, unknown>) => {
    // Merge AI data with current form data, keeping user's manual entries
    const merged: Record<string, unknown> = { ...currentFormData };

    if (data.nombre_sugerido && !currentFormData.nombre) {
      merged.nombre = data.nombre_sugerido;
    }

    if (data.descripcion && !currentFormData.descripcion) {
      merged.descripcion = data.descripcion;
    }

    if (data.problema_detectado && !currentFormData.problema) {
      merged.problema = data.problema_detectado;
    }

    if (data.solucion_propuesta && !currentFormData.solucion) {
      merged.solucion = data.solucion_propuesta;
    }

    if (data.publico_objetivo && !currentFormData.publico_objetivo) {
      merged.publico_objetivo = data.publico_objetivo;
    }

    if (data.propuesta_valor && !currentFormData.propuesta_valor) {
      merged.propuesta_valor = data.propuesta_valor;
    }

    if (data.modelo_negocio && !currentFormData.modelo_negocio) {
      merged.modelo_negocio = data.modelo_negocio;
    }

    // Arrays: merge without duplicates
    if (data.canales_distribucion?.length) {
      merged.canales_distribucion = Array.from(
        new Set([
          ...(currentFormData.canales_distribucion || []),
          ...data.canales_distribucion,
        ])
      );
    }

    if (data.competidores?.length) {
      merged.competidores = Array.from(
        new Set([...(currentFormData.competidores || []), ...data.competidores])
      );
    }

    if (data.tecnologias?.length) {
      merged.tecnologias = Array.from(
        new Set([...(currentFormData.tecnologias || []), ...data.tecnologias])
      );
    }

    // Store insights separately for display
    if (data.insights?.length) {
      merged._ai_insights = data.insights;
    }

    return merged;
  };

  return {
    ...state,
    extractInfo,
    reset,
    applyData,
  };
}
