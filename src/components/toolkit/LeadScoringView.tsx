/**
 * LeadScoringView — F21.5
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface LeadScored {
  nombre: string;
  empresa?: string | null;
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  razon_principal: string;
}

interface Criterio {
  nombre: string;
  descripcion: string;
  peso: number;
  senales_positivas: string[];
}

interface LeadScoringOutput {
  criterios: Criterio[];
  leads_scored: LeadScored[];
  top_hot: Array<{ nombre: string; score: number; next_action: string }>;
}

const TIER_STYLE: Record<string, string> = {
  hot:  'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-amber-100 text-amber-700 border-amber-200',
  cold: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function LeadScoringView({ output }: { output: LeadScoringOutput }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {/* Top Hot */}
      {output.top_hot?.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 dark:text-red-400">Top leads calientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {output.top_hot.map((lead, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-white dark:bg-gray-900 border border-red-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{lead.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">→ {lead.next_action}</p>
                </div>
                <span className="text-lg font-bold text-red-600 shrink-0">{lead.score}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Criterios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('toolkit.criteriosDeScoring')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(output.criterios ?? []).map((c, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.nombre}</p>
                <span className="text-xs text-gray-500">peso {Math.round(c.peso * 100)}%</span>
              </div>
              <p className="text-xs text-gray-500">{c.descripcion}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${c.peso * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Todos los leads */}
      {output.leads_scored?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('toolkit.leadsPuntuados')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {output.leads_scored.map((lead, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <Badge className={cn('text-[10px] shrink-0 min-w-[44px] justify-center', TIER_STYLE[lead.tier])}>
                    {lead.tier.toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lead.nombre}{lead.empresa ? ` · ${lead.empresa}` : ''}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.razon_principal}</p>
                  </div>
                  <span className={cn('text-sm font-bold shrink-0', lead.score >= 70 ? 'text-red-600' : lead.score >= 40 ? 'text-amber-600' : 'text-blue-600')}>
                    {lead.score}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
