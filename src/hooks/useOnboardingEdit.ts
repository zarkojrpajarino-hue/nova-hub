import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { OnboardingData } from '@/components/onboarding/types';

interface UseOnboardingEditProps {
  projectId: string;
  onSuccess?: () => void;
}

export function useOnboardingEdit({ projectId, onSuccess }: UseOnboardingEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const saveOnboardingData = async (data: OnboardingData, selectedMembers: string[]) => {
    setIsSaving(true);

    try {
      // 1. Update onboarding data
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          onboarding_data: data,
          onboarding_completed: true,
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // 2. Get current project members
      const { data: currentMembers } = await supabase
        .from('project_members')
        .select('member_id')
        .eq('project_id', projectId);

      const currentMemberIds = currentMembers?.map(m => m.member_id) || [];

      // 3. Find members to add and remove
      const toAdd = selectedMembers.filter(id => !currentMemberIds.includes(id));
      const toRemove = currentMemberIds.filter(id => !selectedMembers.includes(id));

      // 4. Remove members not in selection
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId)
          .in('member_id', toRemove);

        if (removeError) throw removeError;
      }

      // 5. Add new members
      if (toAdd.length > 0) {
        const membersToInsert = toAdd.map(memberId => ({
          project_id: projectId,
          member_id: memberId,
          role: null,
          role_accepted: false,
        }));

        const { error: addError } = await supabase
          .from('project_members')
          .insert(membersToInsert);

        if (addError) throw addError;
      }

      // 6. Clear draft from localStorage
      localStorage.removeItem(`onboarding-draft-${projectId}`);

      toast.success('Cambios guardados correctamente');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_members'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving onboarding changes:', error);
      toast.error('Error al guardar los cambios');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveOnboardingData,
    isSaving,
  };
}
