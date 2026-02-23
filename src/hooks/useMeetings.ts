/**
 * 🎙️ MEETINGS HOOK
 *
 * Hook para gestionar reuniones del sistema Meeting Intelligence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types
export interface Meeting {
  id: string;
  project_id: string;
  title: string;
  meeting_type: string;
  description?: string;
  objectives?: string;
  estimated_duration_min?: number;
  strategic_context?: Record<string, unknown>;
  started_at?: string;
  ended_at?: string;
  duration_actual_min?: number;
  audio_url?: string;
  transcript?: string;
  insights?: Record<string, unknown>;
  summary?: string;
  key_points?: string[];
  ai_confidence_score?: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingInput {
  project_id: string;
  title: string;
  meeting_type: string;
  description?: string;
  objectives?: string;
  estimated_duration_min?: number;
  strategic_context?: Record<string, unknown>;
  participants: string[];
  assignable_members?: string[];
  ai_config: {
    enable_questions: boolean;
    enable_proactive_guidance: boolean;
    enable_context_detection: boolean;
    enable_time_alerts: boolean;
  };
}

/**
 * Hook para obtener reuniones de un proyecto
 */
export function useProjectMeetings(projectId: string | undefined) {
  return useQuery({
    queryKey: ['meetings', projectId],
    queryFn: async () => {
      if (!projectId) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        return data as Meeting[];
      } catch (error) {
        // swallow error, return empty list
        return [];
      }
    },
    enabled: !!projectId,
    retry: false, // No reintentar si falla
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener una reunión específica
 */
export function useMeeting(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: async () => {
      if (!meetingId) return null;

      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error) throw error;
      return data as Meeting;
    },
    enabled: !!meetingId,
  });
}

/**
 * Hook para crear una nueva reunión
 */
export function useCreateMeeting() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateMeetingInput) => {
      if (!profile) throw new Error('User not authenticated');

      // 1. Crear la reunión
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          project_id: input.project_id,
          title: input.title,
          meeting_type: input.meeting_type,
          description: input.description,
          objectives: input.objectives,
          estimated_duration_min: input.estimated_duration_min,
          strategic_context: input.strategic_context,
          status: 'configuring',
          created_by: profile.id,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // 2. Añadir participantes
      if (input.participants.length > 0) {
        const participantsData = input.participants.map((memberId) => ({
          meeting_id: meeting.id,
          member_id: memberId,
          attended: true,
          can_receive_tasks: true,
        }));

        const { error: participantsError } = await supabase
          .from('meeting_participants')
          .insert(participantsData);

        if (participantsError) {
          // non-fatal: meeting was created, participants partial failure
        }
      }

      // 3. Añadir miembros asignables (no presentes pero pueden recibir tareas)
      if (input.assignable_members && input.assignable_members.length > 0) {
        const assignableData = input.assignable_members.map((memberId) => ({
          meeting_id: meeting.id,
          member_id: memberId,
          attended: false,
          can_receive_tasks: true,
        }));

        const { error: assignableError } = await supabase
          .from('meeting_participants')
          .insert(assignableData);

        if (assignableError) {
          // non-fatal: meeting was created, assignable members partial failure
        }
      }

      return meeting;
    },
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meeting.project_id] });
      toast.success('Reunión creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear la reunión: ' + error.message);
    },
  });
}

/**
 * Hook para actualizar el estado de una reunión
 */
export function useUpdateMeetingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetingId,
      status,
      additionalData,
    }: {
      meetingId: string;
      status: string;
      additionalData?: Partial<Meeting>;
    }) => {
      const { data, error } = await supabase
        .from('meetings')
        .update({
          status,
          ...additionalData,
        })
        .eq('id', meetingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meeting.id] });
      queryClient.invalidateQueries({ queryKey: ['meetings', meeting.project_id] });
    },
  });
}

/**
 * Hook para obtener participantes de una reunión
 */
export function useMeetingParticipants(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-participants', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from('meeting_participants')
        .select(`
          *,
          member:members(*)
        `)
        .eq('meeting_id', meetingId);

      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });
}

/**
 * Hook para obtener insights de una reunión
 */
export function useMeetingInsights(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-insights', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from('meeting_insights')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });
}

/**
 * Hook para obtener preguntas IA de una reunión
 */
export function useMeetingAIQuestions(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-ai-questions', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from('meeting_ai_questions')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('asked_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });
}

/**
 * Hook para obtener recomendaciones IA de una reunión
 */
export function useMeetingAIRecommendations(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-ai-recommendations', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from('meeting_ai_recommendations')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('shown_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });
}

/**
 * Hook para obtener decisiones de una reunión
 */
export function useMeetingDecisions(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-decisions', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from('meeting_decisions')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });
}

/**
 * Hook para transcribir una reunión usando Whisper API
 */
export function useTranscribeMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('transcribe-meeting', {
        body: { meetingId },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      return data;
    },
    onSuccess: (_data, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Transcripción completada correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al transcribir: ' + (error.message || 'Error desconocido'));
    },
  });
}

/**
 * Hook para analizar una reunión usando GPT-4
 */
export function useAnalyzeMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-meeting', {
        body: { meetingId },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      return data;
    },
    onSuccess: (data, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-insights', meetingId] });
      toast.success(`Análisis completado: ${data.insightsCount} insights extraídos`);
    },
    onError: (error: Error) => {
      toast.error('Error al analizar: ' + (error.message || 'Error desconocido'));
    },
  });
}

/**
 * Hook para aplicar insights aprobados al sistema
 */
export function useApplyMeetingInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('apply-meeting-insights', {
        body: { meetingId },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Apply failed');
      }

      return data;
    },
    onSuccess: (data, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-insights', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      const { results } = data;
      const total = results.tasks + results.decisions + results.leads + results.obv_updates + results.blockers + results.metrics;

      toast.success(`¡Insights aplicados! ${total} elementos creados en el sistema`);
    },
    onError: (error: Error) => {
      toast.error('Error al aplicar insights: ' + (error.message || 'Error desconocido'));
    },
  });
}
