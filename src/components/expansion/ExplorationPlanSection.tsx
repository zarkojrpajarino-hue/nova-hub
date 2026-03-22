/**
 * F22.7 — ExplorationPlanSection
 *
 * Plan de 5 días por mercado en modal/panel.
 * Día a día: actividades, coste, hipótesis a validar.
 */

import { MapPin, Calendar, Lightbulb } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ExpansionMarket } from './ExpansionMarketCard';

import { useTranslation } from 'react-i18next';
interface ExplorationPlanSectionProps {
  market: ExpansionMarket;
  onClose: () => void;
}

export function ExplorationPlanSection({ market, onClose }: ExplorationPlanSectionProps) {
  const { t } = useTranslation();
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          Plan de 5 días — {market.country}, {market.city}
        </DialogTitle>

        <div className="space-y-4 mt-2">
          {market.five_day_plan.map((day) => (
            <div key={day.day} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold">Día {day.day}: {day.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">~€{day.estimated_cost_eur}</span>
              </div>

              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                {day.activities.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>

              <div className="flex items-start gap-1.5 bg-amber-50 rounded p-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{day.hypothesis}</p>
              </div>
            </div>
          ))}

          {/* Cultural tips */}
          {market.cultural_tips.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-1.5">{t('expansion.consejosCulturalesDeNegocio')}</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
                {market.cultural_tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Total cost */}
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="font-medium">{t('expansion.costeTotalEstimado')}</span>
            <span className="font-semibold">
              €{market.total_trip_cost.min}–{market.total_trip_cost.max}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
