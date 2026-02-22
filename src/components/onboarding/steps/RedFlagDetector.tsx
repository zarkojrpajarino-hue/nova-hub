/**
 * RED FLAG DETECTOR
 * Analiza respuestas y detecta red flags automáticamente
 */

import { AlertCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type {
  RealityCheckAnswers,
  TeamStructure,
  GoalsAndStrategy,
  CurrentTraction,
  PMFAssessment,
  YourEdge
} from '@/types/ultra-onboarding';

interface RedFlag {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  recommendation: string;
}

interface RedFlagDetectorProps {
  realityCheck?: Partial<RealityCheckAnswers>;
  teamStructure?: Partial<TeamStructure>;
  goals?: Partial<GoalsAndStrategy>;
  traction?: Partial<CurrentTraction>;
  pmf?: Partial<PMFAssessment>;
  edge?: Partial<YourEdge>;
}

export function RedFlagDetector({
  realityCheck,
  teamStructure,
  goals,
  traction,
  pmf,
  edge
}: RedFlagDetectorProps) {
  const detectRedFlags = (): RedFlag[] => {
    const flags: RedFlag[] = [];

    // Reality Check flags
    if (realityCheck) {
      if ((realityCheck.financial_runway_months || 0) < 3) {
        flags.push({
          severity: 'critical',
          title: '🔴 Runway crítico',
          message: 'Tienes menos de 3 meses de runway',
          recommendation: 'NO dejes tu trabajo todavía. Valida tu idea mientras mantienes ingresos estables.'
        });
      }

      if (realityCheck.time_commitment === 'side_project' && goals?.final_goal === 'ipo_unicorn') {
        flags.push({
          severity: 'critical',
          title: '🔴 Mismatch: Side project + Unicorn goal',
          message: 'Quieres construir unicorn con 5-10h/semana',
          recommendation: 'Side projects NO se convierten en unicorns. Ajusta expectativas o commitment.'
        });
      }

      if (realityCheck.family_support === 'have_doubts' && (realityCheck.financial_runway_months || 0) < 6) {
        flags.push({
          severity: 'warning',
          title: '⚠️ Familia preocupada + Runway corto',
          message: 'Tu familia tiene dudas y tienes poco runway',
          recommendation: 'Construye seguridad: extiende runway o muestra tracción early para tranquilizarlos.'
        });
      }
    }

    // Team flags
    if (teamStructure) {
      if ((teamStructure.mode === 'has_1_cofounder' || teamStructure.mode === 'has_2plus_cofounders') &&
          !teamStructure.equity_split_agreed) {
        flags.push({
          severity: 'critical',
          title: '🔴 Equity no acordado',
          message: 'Tienes co-founders pero equity split no documentado',
          recommendation: 'CRÍTICO: Documenta equity split AHORA. 65% de startups fallan por conflictos co-founders.'
        });
      }

      if (teamStructure.mode === 'seeking_cofounder' && goals?.fundraise_timeline === 'next_3_months') {
        flags.push({
          severity: 'warning',
          title: '⚠️ Buscando co-founder + Fundraise urgente',
          message: 'Planeas fundraise en 3 meses pero aún buscas co-founder',
          recommendation: 'VCs raramente invierten en solo-founders sin tracción. Encuentra co-founder ANTES de fundraise.'
        });
      }
    }

    // Goals flags
    if (goals) {
      if (goals.final_goal === 'ipo_unicorn' && goals.funding_strategy === 'bootstrap') {
        flags.push({
          severity: 'critical',
          title: '🔴 Contradicción: Unicorn + Bootstrap',
          message: 'Quieres construir unicorn sin funding',
          recommendation: 'Unicorns requieren venture capital. Ajusta meta a "acquisition" o cambia a "raise".'
        });
      }

      if (goals.funding_strategy === 'raise_series_a' && !traction?.monthly_revenue) {
        flags.push({
          severity: 'warning',
          title: '⚠️ Series A sin revenue',
          message: 'Planeas Series A pero no tienes revenue todavía',
          recommendation: 'Series A típicamente requiere $1M+ ARR. Considera seed primero.'
        });
      }
    }

    // Traction flags
    if (traction) {
      if (traction.current_stage === 'launched' && traction.growth_trend === 'declining') {
        flags.push({
          severity: 'critical',
          title: '🔴 Growth declinando',
          message: 'Métricas están bajando post-launch',
          recommendation: 'STOP scaling. Diagnostica: ¿churn alto? ¿PMF débil? ¿competencia? Fix antes de crecer.'
        });
      }

      const validationScore = (traction.validation_completed || []).reduce((sum, act) => {
        const points: Record<string, number> = {
          customer_interviews: 15,
          surveys: 10,
          landing_page: 20,
          prototype: 15,
          mvp: 30,
          beta_users: 35,
          paying_customers: 50,
          press_coverage: 20,
          none: 0
        };
        return sum + (points[act] || 0);
      }, 0);

      if (validationScore === 0 && goals?.fundraise_timeline === 'next_3_months') {
        flags.push({
          severity: 'critical',
          title: '🔴 Zero validation + Fundraise urgente',
          message: 'Planeas fundraise sin haber validado NADA',
          recommendation: 'Investors NO invierten en ideas puras. Valida problema primero (entrevistas, MVP, usuarios).'
        });
      }
    }

    // PMF flags
    if (pmf) {
      if ((pmf.sean_ellis_score || 0) < 20 && traction?.monthly_revenue && traction.monthly_revenue > 10000) {
        flags.push({
          severity: 'warning',
          title: '⚠️ Revenue sin amor de usuarios',
          message: 'Generas revenue pero usuarios no aman el producto',
          recommendation: 'Tienes sales pero no PMF. Churn será alto. Focus en product antes de scale.'
        });
      }

      if (pmf.retention_signal === 'declining' && goals?.funding_strategy?.includes('raise')) {
        flags.push({
          severity: 'critical',
          title: '🔴 Retention bajando + Plans to raise',
          message: 'Retention empeora pero planeas fundraise',
          recommendation: 'Fix retention ANTES de fundraise. VCs verán esto inmediatamente.'
        });
      }
    }

    // Edge flags
    if (edge) {
      if ((!edge.unfair_advantages || edge.unfair_advantages.length === 0) &&
          goals?.final_goal !== 'experiment_learn') {
        flags.push({
          severity: 'warning',
          title: '⚠️ Sin unfair advantages',
          message: 'No tienes ventajas competitivas claras',
          recommendation: 'Sin edge, competirás solo en ejecución. Considera construir expertise/network/audiencia PRIMERO.'
        });
      }
    }

    return flags;
  };

  const redFlags = detectRedFlags();
  const criticalFlags = redFlags.filter(f => f.severity === 'critical');
  const warningFlags = redFlags.filter(f => f.severity === 'warning');

  if (redFlags.length === 0) return null;

  return (
    <div className="space-y-4">
      {criticalFlags.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">
            {criticalFlags.length} Red Flag{criticalFlags.length > 1 ? 's' : ''} Crítico{criticalFlags.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription className="space-y-4 mt-3">
            {criticalFlags.map((flag, idx) => (
              <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="font-semibold mb-1">{flag.title}</div>
                <div className="text-sm mb-2">{flag.message}</div>
                <div className="text-sm font-medium text-red-900">
                  → {flag.recommendation}
                </div>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {warningFlags.length > 0 && (
        <Alert className="border-2 border-orange-300 bg-orange-50">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-lg font-bold text-orange-900">
            {warningFlags.length} Warning{warningFlags.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription className="space-y-4 mt-3">
            {warningFlags.map((flag, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-orange-200">
                <div className="font-semibold mb-1 text-orange-900">{flag.title}</div>
                <div className="text-sm mb-2 text-orange-800">{flag.message}</div>
                <div className="text-sm font-medium text-orange-900">
                  → {flag.recommendation}
                </div>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
