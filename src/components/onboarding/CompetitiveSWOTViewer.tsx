/**
 * COMPETITIVE SWOT VIEWER (ONBOARDING IDEA)
 *
 * Muestra análisis competitivo completo con SWOT
 * Incluye competidores, gaps, estrategia recomendada
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Shield,
  Zap,
  Users,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CompetitiveAnalysis, Competitor } from '@/types/ultra-onboarding';
import { cn } from '@/lib/utils';

interface CompetitiveSWOTViewerProps {
  analysis: CompetitiveAnalysis;
}

export function CompetitiveSWOTViewer({ analysis }: CompetitiveSWOTViewerProps) {
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🎯 Tu Análisis Competitivo</h2>
        <p className="text-gray-600">Estrategia personalizada para competir y diferenciarte</p>
      </div>

      {/* SWOT Matrix */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle>📊 Tu SWOT Analysis</CardTitle>
          <CardDescription>Análisis honesto de tu posición competitiva</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Fortalezas
              </h3>
              <ul className="space-y-2">
                {analysis.swot.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Debilidades
              </h3>
              <ul className="space-y-2">
                {analysis.swot.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Oportunidades
              </h3>
              <ul className="space-y-2">
                {analysis.swot.opportunities.map((opportunity, idx) => (
                  <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">→</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Amenazas
              </h3>
              <ul className="space-y-2">
                {analysis.swot.threats.map((threat, idx) => (
                  <li key={idx} className="text-sm text-orange-800 flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">⚠</span>
                    <span>{threat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitors */}
      <div>
        <h3 className="text-xl font-bold mb-4">🏢 Tus Competidores</h3>
        <div className="space-y-3">
          {analysis.competitors.map((competitor, idx) => (
            <CompetitorCard
              key={idx}
              competitor={competitor}
              isExpanded={expandedCompetitor === idx}
              onToggle={() => setExpandedCompetitor(expandedCompetitor === idx ? null : idx)}
            />
          ))}
        </div>
      </div>

      {/* Market Gaps */}
      {analysis.market_gaps && analysis.market_gaps.length > 0 && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              💡 Market Gaps (Oportunidades)
            </CardTitle>
            <CardDescription>Espacios que puedes explotar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.market_gaps.map((gap, idx) => (
                <div key={idx} className="p-4 bg-white border border-purple-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-purple-900">{gap.gap}</h4>
                    <Badge className="bg-purple-600">Score: {gap.opportunity_score}/100</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{gap.reasoning}</p>
                  <div className="space-y-2 mt-3">
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-xs font-medium text-purple-900 mb-1">Cómo aprovecharlo:</p>
                      <p className="text-xs text-purple-800">{gap.how_to_exploit}</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <p className="text-xs font-medium text-orange-900 mb-1">Necesitas validar:</p>
                      <p className="text-xs text-orange-800">{gap.validation_needed}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Strategy */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            🚀 Tu Estrategia Recomendada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Positioning */}
          <div>
            <h4 className="font-semibold text-green-900 mb-2">Positioning:</h4>
            <p className="text-sm text-green-800 italic">
              "{analysis.competitive_positioning.your_unique_value}"
            </p>
          </div>

          {/* Differentiation */}
          <div>
            <h4 className="font-semibold text-green-900 mb-2">Cómo te diferencias:</h4>
            <ul className="space-y-1">
              {analysis.recommended_strategy.differentiation.map((diff, idx) => (
                <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{diff}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* GTM Strategy */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-white border border-green-200 rounded-lg">
              <h4 className="font-semibold text-sm text-green-900 mb-2">
                Fase 1: {analysis.recommended_strategy.go_to_market.phase_1.focus}
              </h4>
              <p className="text-xs text-gray-600 mb-2">{analysis.recommended_strategy.go_to_market.phase_1.timeline}</p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Canales:</p>
                {analysis.recommended_strategy.go_to_market.phase_1.channels.map((channel, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs mr-1">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-3 bg-white border border-green-200 rounded-lg">
              <h4 className="font-semibold text-sm text-green-900 mb-2">
                Fase 2: {analysis.recommended_strategy.go_to_market.phase_2.focus}
              </h4>
              <p className="text-xs text-gray-600 mb-2">{analysis.recommended_strategy.go_to_market.phase_2.timeline}</p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Canales:</p>
                {analysis.recommended_strategy.go_to_market.phase_2.channels.map((channel, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs mr-1">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* David vs Goliath Tactics */}
          {analysis.recommended_strategy.david_vs_goliath_tactics &&
            analysis.recommended_strategy.david_vs_goliath_tactics.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-900 mb-2">⚔️ Tácticas David vs Goliat:</h4>
                <ul className="space-y-1">
                  {analysis.recommended_strategy.david_vs_goliath_tactics.map((tactic, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">→</span>
                      <span>{tactic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Red Flags */}
      {analysis.red_flags && analysis.red_flags.length > 0 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              🚨 Red Flags - Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.red_flags.map((flag, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-3 border rounded-lg',
                    flag.severity === 'critical'
                      ? 'bg-red-100 border-red-300'
                      : flag.severity === 'important'
                      ? 'bg-orange-100 border-orange-300'
                      : 'bg-yellow-100 border-yellow-300'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4 mt-0.5 flex-shrink-0',
                        flag.severity === 'critical'
                          ? 'text-red-600'
                          : flag.severity === 'important'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{flag.flag}</p>
                      <p className="text-xs text-gray-700 mt-1">
                        <span className="font-medium">Qué hacer:</span> {flag.what_to_do}
                      </p>
                    </div>
                    <Badge variant={flag.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                      {flag.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Questions to Validate */}
      {analysis.key_questions_to_validate && analysis.key_questions_to_validate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>❓ Preguntas Críticas para Validar</CardTitle>
            <CardDescription>Responde estas antes de continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {analysis.key_questions_to_validate.map((question, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-semibold">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700">{question}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CompetitorCard({
  competitor,
  isExpanded,
  onToggle,
}: {
  competitor: Competitor;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const threatColor =
    competitor.threat_level === 'high' ? 'text-red-600' : competitor.threat_level === 'medium' ? 'text-orange-600' : 'text-yellow-600';

  return (
    <Card className={cn('transition-shadow', isExpanded && 'shadow-lg')}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{competitor.name}</h3>
                {competitor.url && (
                  <a
                    href={competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{competitor.description}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{competitor.type}</Badge>
                <Badge variant="secondary">{competitor.market_position}</Badge>
                <Badge className={threatColor}>Amenaza: {competitor.threat_level}</Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {competitor.size.valuation && (
              <div className="p-2 bg-gray-50 rounded text-center">
                <p className="text-xs text-gray-600">Valuación</p>
                <p className="text-sm font-semibold">{competitor.size.valuation}</p>
              </div>
            )}
            {competitor.size.customers && (
              <div className="p-2 bg-gray-50 rounded text-center">
                <p className="text-xs text-gray-600">Customers</p>
                <p className="text-sm font-semibold">{competitor.size.customers}</p>
              </div>
            )}
            {competitor.pricing && (
              <div className="p-2 bg-gray-50 rounded text-center">
                <p className="text-xs text-gray-600">Pricing</p>
                <p className="text-sm font-semibold">{competitor.pricing.price_range}</p>
              </div>
            )}
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t animate-fade-in">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-700">
                    <TrendingUp className="h-4 w-4" />
                    Fortalezas
                  </h4>
                  <ul className="space-y-1">
                    {competitor.strengths.map((strength, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700">
                    <TrendingDown className="h-4 w-4" />
                    Debilidades (que puedes explotar)
                  </h4>
                  <ul className="space-y-1">
                    {competitor.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">!</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Toggle */}
          <Button variant="ghost" size="sm" className="w-full" onClick={onToggle}>
            {isExpanded ? (
              <>
                Ver menos <ChevronUp className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Ver fortalezas/debilidades <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
