/**
 * BUSINESS OPTIONS SELECTOR (ONBOARDING GENERATIVO)
 *
 * Muestra 3 opciones de negocio generadas por IA
 * Permite comparar lado a lado y seleccionar
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import type { BusinessOption } from '@/types/ultra-onboarding';
import { cn } from '@/lib/utils';

interface BusinessOptionsSelectorProps {
  options: BusinessOption[];
  onSelect: (optionIndex: number) => void;
  selectedIndex?: number;
}

export function BusinessOptionsSelector({ options, onSelect, selectedIndex }: BusinessOptionsSelectorProps) {
  const [expandedOption, setExpandedOption] = useState<number | null>(null);

  if (options.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600">Generando opciones de negocio personalizadas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">✨ Tus 3 Opciones de Negocio</h2>
        <p className="text-gray-600">Generadas específicamente para ti basadas en tus skills y constraints</p>
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle>📊 Comparación Rápida</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Métrica</th>
                  {options.map((option, idx) => (
                    <th key={idx} className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Opción {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <ComparisonRow
                  label="Inversión inicial"
                  values={options.map((o) => `€${o.financial_projections.initial_investment.toLocaleString()}`)}
                />
                <ComparisonRow
                  label="Breakeven"
                  values={options.map((o) => `${o.financial_projections.breakeven_months} meses`)}
                />
                <ComparisonRow
                  label="Revenue año 1"
                  values={options.map((o) => `€${o.financial_projections.year_1_revenue.toLocaleString()}`)}
                  highlight="high"
                />
                <ComparisonRow
                  label="Escalabilidad"
                  values={options.map((o) => {
                    const stars = o.financial_projections.scalability === 'high' ? '⭐⭐⭐⭐⭐' : o.financial_projections.scalability === 'medium' ? '⭐⭐⭐' : '⭐⭐';
                    return stars;
                  })}
                />
                <ComparisonRow
                  label="Fit Score"
                  values={options.map((o) => `${o.fit_score}/100`)}
                  highlight="high"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Individual Options */}
      <div className="grid gap-6">
        {options.map((option, idx) => (
          <OptionCard
            key={idx}
            option={option}
            index={idx}
            isSelected={selectedIndex === idx}
            isExpanded={expandedOption === idx}
            onSelect={() => onSelect(idx)}
            onToggleExpand={() => setExpandedOption(expandedOption === idx ? null : idx)}
          />
        ))}
      </div>

      {/* Recommendation */}
      {options.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">💡 Recomendación IA</h3>
                <p className="text-sm text-blue-800">
                  Opción {options.findIndex((o) => o.fit_score === Math.max(...options.map((o) => o.fit_score))) + 1} tiene el mejor fit score ({Math.max(...options.map((o) => o.fit_score))}/100).
                  {options[0].reasoning && (
                    <span className="block mt-2">
                      Razón: {options[0].reasoning.split('.')[0]}.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OptionCard({
  option,
  index,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: {
  option: BusinessOption;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg cursor-pointer',
        isSelected && 'ring-2 ring-blue-500 shadow-lg'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600">Opción {index + 1}</Badge>
              <Badge variant="outline" className="font-semibold">
                Fit: {option.fit_score}/100
              </Badge>
              {option.financial_projections.scalability === 'high' && (
                <Badge variant="secondary">Alta escalabilidad</Badge>
              )}
            </div>
            <CardTitle className="text-xl mb-2">{option.title}</CardTitle>
            <CardDescription className="text-base">{option.description}</CardDescription>
          </div>
          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={onSelect}
            className="ml-4"
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Seleccionada
              </>
            ) : (
              'Seleccionar'
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickMetric
            icon={<DollarSign className="h-4 w-4" />}
            label="Inversión"
            value={`€${option.financial_projections.initial_investment.toLocaleString()}`}
          />
          <QuickMetric
            icon={<Clock className="h-4 w-4" />}
            label="Breakeven"
            value={`${option.financial_projections.breakeven_months}m`}
          />
          <QuickMetric
            icon={<TrendingUp className="h-4 w-4" />}
            label="Revenue año 1"
            value={`€${(option.financial_projections.year_1_revenue / 1000).toFixed(0)}K`}
          />
          <QuickMetric
            icon={<Target className="h-4 w-4" />}
            label="Profit año 1"
            value={`€${(option.financial_projections.year_1_profit / 1000).toFixed(0)}K`}
          />
        </div>

        {/* Pros & Cons */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Pros
            </h4>
            <ul className="space-y-1">
              {option.pros.slice(0, isExpanded ? undefined : 2).map((pro, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Contras
            </h4>
            <ul className="space-y-1">
              {option.cons.slice(0, isExpanded ? undefined : 2).map((con, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">!</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t animate-fade-in">
            {/* Implementation Roadmap */}
            <div>
              <h4 className="text-sm font-semibold mb-3">🗺️ Roadmap de Implementación</h4>
              <div className="space-y-2">
                {option.implementation_roadmap.map((phase, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{phase.phase}</span>
                      <Badge variant="outline" className="text-xs">
                        {phase.duration_weeks} semanas
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{phase.deliverable}</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {phase.key_tasks.slice(0, 3).map((task, i) => (
                        <li key={i}>• {task}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* First Steps */}
            <div>
              <h4 className="text-sm font-semibold mb-3">🎯 Primeros Pasos (próximos 7 días)</h4>
              <ol className="space-y-2">
                {option.first_steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Risks */}
            {option.risks && option.risks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">⚠️ Riesgos & Mitigación</h4>
                <div className="space-y-2">
                  {option.risks.map((risk, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900">{risk.risk}</p>
                          <p className="text-xs text-orange-700 mt-1">
                            <span className="font-medium">Mitigación:</span> {risk.mitigation}
                          </p>
                        </div>
                        <Badge
                          variant={risk.severity === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle Expand */}
        <Button variant="ghost" className="w-full" onClick={onToggleExpand}>
          {isExpanded ? (
            <>
              Ver menos <ChevronUp className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Ver detalles completos <ChevronDown className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function ComparisonRow({
  label,
  values,
  highlight,
}: {
  label: string;
  values: string[];
  highlight?: 'high' | 'low';
}) {
  const numericValues = values.map((v) => {
    const match = v.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
  });

  const maxValue = Math.max(...numericValues);
  const minValue = Math.min(...numericValues);

  return (
    <tr>
      <td className="px-4 py-3 text-sm font-medium text-gray-700">{label}</td>
      {values.map((value, idx) => {
        const isHighlight =
          highlight === 'high'
            ? numericValues[idx] === maxValue
            : highlight === 'low'
            ? numericValues[idx] === minValue
            : false;

        return (
          <td
            key={idx}
            className={cn(
              'px-4 py-3 text-sm text-center',
              isHighlight && 'bg-green-50 font-semibold text-green-900'
            )}
          >
            {value}
          </td>
        );
      })}
    </tr>
  );
}

function QuickMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <div className="text-blue-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
