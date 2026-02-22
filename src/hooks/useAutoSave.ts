/**
 * AUTO-SAVE HOOK
 *
 * Guarda automáticamente el progreso del onboarding cada 10 segundos
 * Para que el usuario no pierda datos si cierra el wizard
 */

import { useEffect, useRef } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import { toast } from 'sonner';

interface AutoSaveOptions {
  projectId: string | undefined;
  data: Record<string, unknown>;
  enabled?: boolean;
  interval?: number; // milliseconds
  onSave?: () => void;
  onError?: (error: Error) => void;
}

export function useAutoSave({
  projectId,
  data,
  enabled = true,
  interval = 10000, // 10 seconds
  onSave,
  onError,
}: AutoSaveOptions) {
  const { supabase } = useSupabase();
  const lastSavedRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled || !projectId) return;

    const saveData = async () => {
      try {
        const dataString = JSON.stringify(data);

        // Only save if data has changed
        if (dataString === lastSavedRef.current) {
          return;
        }

        console.log('🔄 Auto-saving onboarding progress...');

        const { error } = await supabase
          .from('projects')
          .update({
            onboarding_progress: data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        if (error) throw error;

        lastSavedRef.current = dataString;
        console.log('✅ Auto-save complete');

        if (onSave) onSave();
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        if (onError) onError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(saveData, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, projectId, enabled, interval, supabase, onSave, onError]);

  // Manual save function
  const saveNow = async () => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          onboarding_progress: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      lastSavedRef.current = JSON.stringify(data);
      toast.success('Progreso guardado');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Error al guardar');
      throw error;
    }
  };

  return { saveNow };
}
