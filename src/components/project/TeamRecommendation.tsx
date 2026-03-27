/**
 * EQ26.10 — TeamRecommendation
 *
 * Shows when the project needs a new team member:
 * - Phase advance suggests new roles (e.g., Phase 2→3 needs operations)
 * - Few team members for the current phase
 *
 * CTA: opens InviteLinkDialog with pre-selected role.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_CONFIG } from '@/data/mockData';

// Roles recommended per phase transition
// reasonKey maps to teamRec.marketing, teamRec.operations, etc.
const PHASE_ROLE_NEEDS: Record<number, { role: string; reasonKey: string }[]> = {
  2: [{ role: 'marketing', reasonKey: 'teamRec.marketing' }],
  3: [
    { role: 'operations', reasonKey: 'teamRec.operations' },
    { role: 'finance', reasonKey: 'teamRec.finance' },
  ],
  4: [
    { role: 'sales', reasonKey: 'teamRec.sales' },
    { role: 'ai_tech', reasonKey: 'teamRec.tech' },
  ],
};

interface TeamRecommendationProps {
  projectId: string;
  currentPhase: number;
  teamSize: number;
  existingRoles: string[];
}

export function TeamRecommendation({
  projectId,
  currentPhase,
  teamSize,
  existingRoles,
}: TeamRecommendationProps) {
  const { t } = useTranslation();
  const [showInvite, setShowInvite] = useState(false);

  // Find roles needed for current phase that aren't covered
  const recommendations = (PHASE_ROLE_NEEDS[currentPhase] ?? [])
    .filter(r => !existingRoles.includes(r.role));

  // Don't show if team is large enough or no recommendations
  if (teamSize >= 4 || recommendations.length === 0) return null;

  const top = recommendations[0];
  const roleConfig = ROLE_CONFIG[top.role];

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">
            {t('teamRec.needsRole', { role: roleConfig?.label ?? top.role })}
          </p>
          <p className="text-xs text-blue-600 mt-0.5">{t(top.reasonKey)}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 gap-1"
            onClick={() => setShowInvite(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {t('teamRec.inviteForRole')}
          </Button>
        </div>
      </div>

    </>
  );
}
