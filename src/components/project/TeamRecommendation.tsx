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
import { UserPlus, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_CONFIG } from '@/data/mockData';
import { InviteLinkDialog } from '@/components/roles/InviteLinkDialog';

// Roles recommended per phase transition
const PHASE_ROLE_NEEDS: Record<number, { role: string; reason: string }[]> = {
  2: [{ role: 'marketing', reason: 'Para escalar la demanda validada necesitas marketing.' }],
  3: [
    { role: 'operations', reason: 'Revenue requiere procesos operativos documentados.' },
    { role: 'finance', reason: 'Con ingresos reales, necesitas control financiero.' },
  ],
  4: [
    { role: 'sales', reason: 'Para escalar necesitas un equipo de ventas dedicado.' },
    { role: 'ai_tech', reason: 'La automatización es clave para escalar sin quemar al equipo.' },
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
            Tu proyecto necesita un <strong>{roleConfig?.label ?? top.role}</strong>
          </p>
          <p className="text-xs text-blue-600 mt-0.5">{top.reason}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 gap-1"
            onClick={() => setShowInvite(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invitar para este rol
          </Button>
        </div>
      </div>

      <InviteLinkDialog
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        projectId={projectId}
      />
    </>
  );
}
