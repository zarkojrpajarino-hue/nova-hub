/**
 * V4.8.6 — AcceleratorBenchmarking
 *
 * Wrapper around PartnerComparisonTable that enables anonymous cross-team
 * comparison within an accelerator context.
 *
 * Anonymizes member names and aggregates data by team for privacy.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PartnerComparisonTable } from '@/components/analytics/PartnerComparisonTable';
import { Users2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MemberStats } from '@/hooks/useNovaDataOptimized';

interface AcceleratorBenchmarkingProps {
  members: MemberStats[];
  selectedPartners: string[];
  onSelectPartner: (id: string) => void;
}

const ANONYMOUS_LABELS = [
  'Equipo A', 'Equipo B', 'Equipo C', 'Equipo D', 'Equipo E',
  'Equipo F', 'Equipo G', 'Equipo H', 'Equipo I', 'Equipo J',
];

export function AcceleratorBenchmarking({
  members,
  selectedPartners,
  onSelectPartner,
}: AcceleratorBenchmarkingProps) {
  const { t } = useTranslation();
  const [anonymize, setAnonymize] = useState(true);

  const displayMembers = useMemo(() => {
    if (!anonymize) return members;

    return members.map((m, i) => ({
      ...m,
      nombre: ANONYMOUS_LABELS[i % ANONYMOUS_LABELS.length],
      email: undefined,
    }));
  }, [members, anonymize]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            {t('analytics.acceleratorBenchmarking')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="anonymize"
              checked={anonymize}
              onCheckedChange={setAnonymize}
            />
            <Label htmlFor="anonymize" className="text-sm">
              {t('analytics.acceleratorAnonymize')}
            </Label>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('analytics.acceleratorDesc')}
        </p>
      </CardHeader>
      <CardContent>
        <PartnerComparisonTable
          members={displayMembers}
          selectedPartners={selectedPartners}
          onSelectPartner={onSelectPartner}
        />
      </CardContent>
    </Card>
  );
}
