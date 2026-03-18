/**
 * useMeetingTriggers — M18.I.2
 *
 * Llama a detect_meeting_triggers() para saber si el motor sugiere
 * convocar una reunión. Usado por MeetingSuggestionBanner.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface MeetingTrigger {
  key:     string
  label:   string
  count:   number
  urgency: 'high' | 'medium' | 'low'
}

export interface MeetingTriggersResult {
  triggers:        MeetingTrigger[]
  total_signals:   number
  suggest_meeting: boolean
  suggested_type:  'review' | 'strategy' | 'alignment'
  urgency:         'high' | 'medium' | 'low' | 'none'
  days_since_last: number
}

export function useMeetingTriggers(projectId: string | undefined) {
  return useQuery({
    queryKey:  ['meeting_triggers', projectId],
    enabled:   !!projectId,
    staleTime: 5 * 60_000,
    queryFn:   async (): Promise<MeetingTriggersResult> => {
      const { data, error } = await supabase
        .rpc('detect_meeting_triggers', { p_project_id: projectId! })
      if (error) throw error
      return data as MeetingTriggersResult
    },
  })
}
