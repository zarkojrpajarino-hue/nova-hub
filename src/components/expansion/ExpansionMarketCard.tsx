/**
 * F22.6 — ExpansionMarketCard
 *
 * Card por mercado con: nombre, score, 6 dimensiones como barras,
 * "por qué para tu negocio", CTA t('expansion.verPlanDe5').
 */

import { useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExplorationPlanSection } from './ExplorationPlanSection';

import { useTranslation } from 'react-i18next';
export interface MarketDimensions {
  market_size_fit: number;
  regulatory_ease: number;
  cultural_proximity: number;
  startup_ecosystem: number;
  cost_of_exploration: number;
  synergy_potential: number;
}

export interface FiveDayPlan {
  day: number;
  title: string;
  activities: string[];
  hypothesis: string;
  estimated_cost_eur: number;
}

export interface ExpansionMarket {
  country: string;
  city: string;
  overall_score: number;
  dimensions: MarketDimensions;
  why_for_your_business: string;
  cultural_tips: string[];
  five_day_plan: FiveDayPlan[];
  total_trip_cost: { min: number; max: number; currency: string };
}

const DIMENSION_LABELS: Record<keyof MarketDimensions, string> = {
  market_size_fit: t('expansion.tamañoDeMercado'),
  regulatory_ease: t('expansion.facilidadRegulatoria'),
  cultural_proximity: t('expansion.proximidadCultural'),
  startup_ecosystem: t('expansion.ecosistemaStartup'),
  cost_of_exploration: t('expansion.costeDeExploración'),
  synergy_potential: t('expansion.potencialDeSinergias'),
};

function DimensionBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums w-4 text-right">{value}</span>
    </div>
  );
}

export function ExpansionMarketCard({ market }: { market: ExpansionMarket }) {
  const [showPlan, setShowPlan] = useState(false);

  return (
    <>
      <div className="bg-card border rounded-lg p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <div>
              <h4 className="text-sm font-semibold">{market.country}</h4>
              <p className="text-xs text-muted-foreground">{market.city}</p>
            </div>
          </div>
          <div className="text-lg font-bold tabular-nums text-blue-600">
            {Math.round(market.overall_score)}
          </div>
        </div>

        {/* Why */}
        <p className="text-xs text-muted-foreground">{market.why_for_your_business}</p>

        {/* Dimensions */}
        <div className="space-y-1.5">
          {(Object.entries(DIMENSION_LABELS) as [keyof MarketDimensions, string][]).map(([key, label]) => (
            <DimensionBar key={key} label={label} value={market.dimensions[key] ?? 0} />
          ))}
        </div>

        {/* Cost + CTA */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Coste viaje: €{market.total_trip_cost.min}–{market.total_trip_cost.max}
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowPlan(true)} className="gap-1">{t('expansion.planDe5Días')}<ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* F22.7 — Exploration Plan Modal */}
      {showPlan && (
        <ExplorationPlanSection
          market={market}
          onClose={() => setShowPlan(false)}
        />
      )}
    </>
  );
}
