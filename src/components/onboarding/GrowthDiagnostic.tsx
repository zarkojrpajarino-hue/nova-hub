/**
 * GROWTH DIAGNOSTIC (ONBOARDING EXISTENTE)
 *
 * Muestra diagnóstico del negocio actual
 * Identifica bottlenecks y plan de acción
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Zap,
  ChevronRight,
} from 'lucide-react';
import type { GrowthPlaybook, ActionItem, ActionStep } from '@/types/ultra-onboarding';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GrowthDiagnosticProps {
  playbook: GrowthPlaybook;
  currentMetrics: {
    mrr: number;
    customers: number;
    churn_rate: number;
  };
}

export function GrowthDiagnostic({ playbook, currentMetrics }: GrowthDiagnosticProps) {
  const [selectedScenario, setSelectedScenario] = useState<'status_quo' | 'fix_retention' | 'growth_mode'>(
    'status_quo'
  );

  // Prepare chart data
  const chartData = [
    {
      month: 'Actual',
      status_quo: currentMetrics.mrr,
      fix_retention: currentMetrics.mrr,
      growth_mode: currentMetrics.mrr,
    },
    {
      month: 'Mes 3',
      status_quo: playbook.scenarios.status_quo.month_3_mrr,
      fix_retention: playbook.scenarios.fix_retention?.month_3_mrr || playbook.scenarios.status_quo.month_3_mrr,
      growth_mode: playbook.scenarios.growth_mode?.month_3_mrr || playbook.scenarios.status_quo.month_3_mrr,
    },
    {
      month: 'Mes 6',
      status_quo: playbook.scenarios.status_quo.month_6_mrr,
      fix_retention: playbook.scenarios.fix_retention?.month_6_mrr || playbook.scenarios.status_quo.month_6_mrr,
      growth_mode: playbook.scenarios.growth_mode?.month_6_mrr || playbook.scenarios.status_quo.month_6_mrr,
    },
    {
      month: 'Mes 12',
      status_quo: playbook.scenarios.status_quo.month_12_mrr,
      fix_retention: playbook.scenarios.fix_retention?.month_12_mrr || playbook.scenarios.status_quo.month_12_mrr,
      growth_mode: playbook.scenarios.growth_mode?.month_12_mrr || playbook.scenarios.status_quo.month_12_mrr,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">📊 Diagnóstico de tu Negocio</h2>
        <p className="text-gray-600">Análisis basado en tus métricas actuales</p>
      </div>

      {/* Health Score */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🏥 Health Score</CardTitle>
              <CardDescription>Estado general de tu negocio</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{playbook.diagnosis.health_score}</div>
              <div className="text-sm text-gray-600">/ 100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Progress value={playbook.diagnosis.health_score} className="h-3 mb-4" />
          <p className="text-sm text-gray-700">{playbook.diagnosis.current_phase_assessment}</p>
        </CardContent>
      </Card>

      {/* Bottleneck Identification */}
      <Card
        className={cn(
          'border-2',
          playbook.diagnosis.founder_was_right ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {playbook.diagnosis.founder_was_right ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            )}
            🎯 El Bottleneck REAL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              'p-4 rounded-lg border-2',
              playbook.diagnosis.founder_was_right
                ? 'bg-white border-green-200'
                : 'bg-white border-orange-200'
            )}
          >
            <h3 className="font-semibold text-lg mb-2">{playbook.diagnosis.actual_bottleneck}</h3>
            <p className="text-sm text-gray-700 mb-3">{playbook.diagnosis.explanation}</p>

            {!playbook.diagnosis.founder_was_right && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded mt-3">
                <p className="text-sm text-orange-900">
                  <span className="font-semibold">⚠️ Nota:</span> El bottleneck real es diferente de lo que pensabas.
                  Es crítico enfocarte en esto PRIMERO.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      {playbook.diagnosis.critical_issues && playbook.diagnosis.critical_issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              🚨 Issues Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {playbook.diagnosis.critical_issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-4 border-2 rounded-lg',
                    issue.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : issue.severity === 'important'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{issue.issue}</h4>
                    <Badge
                      variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{issue.impact}</p>
                  <div className="p-2 bg-white border border-gray-200 rounded mt-2">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Evidencia:</span> {issue.evidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmarking */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Benchmarking vs Industria</CardTitle>
          <CardDescription>Cómo te comparas con otros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <BenchmarkRow
              label="Churn mensual"
              yourValue={playbook.benchmarks_vs_industry.your_metrics.churn}
              industryAvg={playbook.benchmarks_vs_industry.industry_average.churn}
              bestInClass={playbook.benchmarks_vs_industry.best_in_class.churn}
              inverse={true}
            />
            <BenchmarkRow
              label="NPS"
              yourValue={playbook.benchmarks_vs_industry.your_metrics.nps}
              industryAvg={playbook.benchmarks_vs_industry.industry_average.nps}
              bestInClass={playbook.benchmarks_vs_industry.best_in_class.nps}
            />
            <BenchmarkRow
              label="LTV/CAC Ratio"
              yourValue={playbook.benchmarks_vs_industry.your_metrics.ltv_cac}
              industryAvg={playbook.benchmarks_vs_industry.industry_average.ltv_cac}
              bestInClass={playbook.benchmarks_vs_industry.best_in_class.ltv_cac}
            />
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">
              Tu posición:{' '}
              <span
                className={cn(
                  'font-bold',
                  playbook.benchmarks_vs_industry.your_standing === 'Best in class'
                    ? 'text-green-600'
                    : playbook.benchmarks_vs_industry.your_standing === 'Above average'
                    ? 'text-blue-600'
                    : playbook.benchmarks_vs_industry.your_standing === 'Average'
                    ? 'text-orange-600'
                    : 'text-red-600'
                )}
              >
                {playbook.benchmarks_vs_industry.your_standing}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Projections */}
      <Card>
        <CardHeader>
          <CardTitle>🔮 Proyecciones de Escenarios</CardTitle>
          <CardDescription>Qué pasa si...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scenario Tabs */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedScenario === 'status_quo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedScenario('status_quo')}
            >
              Status Quo
            </Button>
            {playbook.scenarios.fix_retention && (
              <Button
                variant={selectedScenario === 'fix_retention' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedScenario('fix_retention')}
              >
                Fix Retention
              </Button>
            )}
            {playbook.scenarios.growth_mode && (
              <Button
                variant={selectedScenario === 'growth_mode' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedScenario('growth_mode')}
              >
                Growth Mode
              </Button>
            )}
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="status_quo" stroke="#94a3b8" name="Status Quo" strokeWidth={2} />
                {playbook.scenarios.fix_retention && (
                  <Line
                    type="monotone"
                    dataKey="fix_retention"
                    stroke="#3b82f6"
                    name="Fix Retention"
                    strokeWidth={2}
                  />
                )}
                {playbook.scenarios.growth_mode && (
                  <Line
                    type="monotone"
                    dataKey="growth_mode"
                    stroke="#10b981"
                    name="Growth Mode"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Scenario Details */}
          <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              {selectedScenario === 'status_quo'
                ? '📊 Status Quo'
                : selectedScenario === 'fix_retention'
                ? '🔧 Fix Retention'
                : '🚀 Growth Mode'}
            </h4>
            <p className="text-sm text-blue-800 mb-3">{playbook.scenarios[selectedScenario].description}</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="p-2 bg-white rounded text-center">
                <p className="text-xs text-gray-600">Mes 3</p>
                <p className="text-sm font-bold">€{playbook.scenarios[selectedScenario].month_3_mrr.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-white rounded text-center">
                <p className="text-xs text-gray-600">Mes 6</p>
                <p className="text-sm font-bold">€{playbook.scenarios[selectedScenario].month_6_mrr.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-white rounded text-center">
                <p className="text-xs text-gray-600">Mes 12</p>
                <p className="text-sm font-bold">€{playbook.scenarios[selectedScenario].month_12_mrr.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-blue-700">
              <span className="font-medium">Asunción clave:</span> {playbook.scenarios[selectedScenario].key_assumption}
            </p>
            {playbook.scenarios[selectedScenario].value_vs_status_quo && (
              <p className="text-xs text-green-700 mt-2 font-semibold">
                💰 {playbook.scenarios[selectedScenario].value_vs_status_quo}
              </p>
            )}
            {playbook.scenarios[selectedScenario].warning && (
              <div className="p-2 bg-orange-100 border border-orange-200 rounded mt-2">
                <p className="text-xs text-orange-900">
                  <span className="font-semibold">⚠️ Warning:</span> {playbook.scenarios[selectedScenario].warning}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Tu Plan de Acción (Priorizado)</CardTitle>
          <CardDescription>Focus en estas acciones en orden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playbook.action_plan.slice(0, 3).map((action, idx) => (
              <ActionCard key={idx} action={action} priority={idx + 1} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Wins */}
      {playbook.quick_wins && playbook.quick_wins.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              ⚡ Quick Wins
            </CardTitle>
            <CardDescription>Acciones rápidas que puedes hacer esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {playbook.quick_wins.map((win, idx) => (
                <div key={idx} className="p-3 bg-white border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{win.win}</p>
                    <p className="text-xs text-gray-600 mt-1">{win.impact}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {win.effort} effort
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fundraising Readiness */}
      <Card className={cn(playbook.when_to_fundraise.ready_now ? 'border-2 border-green-200' : 'border-2 border-orange-200')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            💰 ¿Listo para Fundraising?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={cn('p-4 rounded-lg', playbook.when_to_fundraise.ready_now ? 'bg-green-50' : 'bg-orange-50')}>
            <p className="font-semibold mb-2">
              {playbook.when_to_fundraise.ready_now ? '✅ Sí, estás ready' : '⏳ No todavía'}
            </p>
            <p className="text-sm text-gray-700">{playbook.when_to_fundraise.reasoning}</p>
          </div>

          {!playbook.when_to_fundraise.ready_now && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Milestones necesarios:</h4>
              <ul className="space-y-1">
                {playbook.when_to_fundraise.milestones_needed.map((milestone, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{milestone}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {playbook.when_to_fundraise.ready_now && (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-1">Monto recomendado:</h4>
                <p className="text-lg font-bold text-green-600">{playbook.when_to_fundraise.recommended_amount}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Úsalo para:</h4>
                <p className="text-sm text-gray-700">{playbook.when_to_fundraise.what_to_use_it_for}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BenchmarkRow({
  label,
  yourValue,
  industryAvg,
  bestInClass,
  inverse = false,
}: {
  label: string;
  yourValue: number | string;
  industryAvg: number | string;
  bestInClass: number | string;
  inverse?: boolean;
}) {
  const parseValue = (v: number | string) => (typeof v === 'string' ? parseFloat(v.replace(/[^0-9.]/g, '')) : v);

  const yourNum = parseValue(yourValue);
  const avgNum = parseValue(industryAvg);
  const bestNum = parseValue(bestInClass);

  const isGood = inverse ? yourNum <= avgNum : yourNum >= avgNum;
  const isBest = inverse ? yourNum <= bestNum : yourNum >= bestNum;

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {isBest ? (
          <Badge className="bg-green-600">Best in class</Badge>
        ) : isGood ? (
          <Badge className="bg-blue-600">Above average</Badge>
        ) : (
          <Badge variant="secondary">Below average</Badge>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-600">Tú</p>
          <p className={cn('text-sm font-bold', isBest ? 'text-green-600' : isGood ? 'text-blue-600' : 'text-red-600')}>
            {yourValue}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Promedio</p>
          <p className="text-sm font-semibold text-gray-700">{industryAvg}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Best</p>
          <p className="text-sm font-semibold text-gray-700">{bestInClass}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ action, priority }: { action: ActionItem; priority: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryColors = {
    retention: 'bg-blue-100 text-blue-900 border-blue-200',
    acquisition: 'bg-green-100 text-green-900 border-green-200',
    product: 'bg-purple-100 text-purple-900 border-purple-200',
    ops: 'bg-orange-100 text-orange-900 border-orange-200',
    fundraising: 'bg-red-100 text-red-900 border-red-200',
  };

  return (
    <div className={cn('p-4 border-2 rounded-lg', categoryColors[action.category as keyof typeof categoryColors] || 'bg-gray-100')}>
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-current flex items-center justify-center font-bold">
          {priority}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-base">{action.action}</h4>
            <Badge variant="outline" className="text-xs">
              {action.category}
            </Badge>
          </div>
          <p className="text-sm mb-2">{action.reasoning}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{action.timeline}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{action.expected_impact}</span>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 mt-3 pt-3 border-t border-current/20 animate-fade-in">
          <div>
            <h5 className="text-sm font-semibold mb-2">Pasos específicos:</h5>
            <ol className="space-y-2">
              {action.steps.map((step: ActionStep, idx: number) => (
                <li key={idx} className="text-sm flex gap-2">
                  <span className="font-semibold">{idx + 1}.</span>
                  <div>
                    <p className="font-medium">{step.step}</p>
                    <p className="text-xs opacity-75">
                      Owner: {step.owner} • {step.duration} • Entrega: {step.deliverable}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-3 bg-white/50 rounded">
            <h5 className="text-sm font-semibold mb-1">Recursos necesarios:</h5>
            <p className="text-xs">
              Budget: €{action.resources_needed.budget.toLocaleString()} • People: {action.resources_needed.people}
            </p>
          </div>
        </div>
      )}

      <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Ver menos' : 'Ver pasos detallados'}
      </Button>
    </div>
  );
}
