/**
 * COFOUNDER ALIGNMENT SCORE (CAPA 7)
 *
 * Muestra análisis de alineamiento entre co-founders
 * Incluye radar chart y misalignments detectados
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  MessageSquare,
  TrendingUp,
  Target,
  Heart,
  Zap,
} from 'lucide-react';
import type { CofounderAlignment } from '@/types/ultra-onboarding';
import { cn } from '@/lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

interface CofounderAlignmentScoreProps {
  alignment: CofounderAlignment;
}

export function CofounderAlignmentScore({ alignment }: CofounderAlignmentScoreProps) {
  // Prepare radar chart data
  const radarData = [
    {
      category: 'Visión',
      score: alignment.vision_alignment,
      fullMark: 100,
    },
    {
      category: 'Estrategia',
      score: alignment.strategy_alignment,
      fullMark: 100,
    },
    {
      category: 'Commitment',
      score: alignment.commitment_alignment,
      fullMark: 100,
    },
    {
      category: 'Valores',
      score: alignment.values_alignment,
      fullMark: 100,
    },
  ];

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'strong_partnership':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'proceed_with_caution':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high_risk':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'recommend_split':
        return 'text-red-700 bg-red-100 border-red-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'strong_partnership':
        return '✅';
      case 'proceed_with_caution':
        return '⚠️';
      case 'high_risk':
        return '🚨';
      case 'recommend_split':
        return '❌';
      default:
        return '🤔';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🤝 Análisis de Alineamiento Co-Founders</h2>
        <p className="text-gray-600">Detectamos compatibilidad y posibles conflictos</p>
      </div>

      {/* Overall Score */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alignment Score Total</CardTitle>
              <CardDescription>Score general de compatibilidad</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-600">{alignment.alignment_score}</div>
              <div className="text-sm text-gray-600">/ 100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Progress value={alignment.alignment_score} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AlignmentMetric
              icon={<Target className="h-4 w-4" />}
              label="Visión"
              score={alignment.vision_alignment}
            />
            <AlignmentMetric
              icon={<Zap className="h-4 w-4" />}
              label="Estrategia"
              score={alignment.strategy_alignment}
            />
            <AlignmentMetric
              icon={<TrendingUp className="h-4 w-4" />}
              label="Commitment"
              score={alignment.commitment_alignment}
            />
            <AlignmentMetric
              icon={<Heart className="h-4 w-4" />}
              label="Valores"
              score={alignment.values_alignment}
            />
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Vista Radar</CardTitle>
          <CardDescription>Alineamiento por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Alignment Score"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Overall Verdict */}
      <Card className={cn('border-2', getVerdictColor(alignment.recommendations.overall_verdict))}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {getVerdictIcon(alignment.recommendations.overall_verdict)} Veredicto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-lg border-2 border-current/20">
            <h3 className="font-semibold text-lg mb-2 capitalize">
              {alignment.recommendations.overall_verdict.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm text-gray-700">{alignment.recommendations.reasoning}</p>
          </div>

          {/* Green Flags */}
          {alignment.recommendations.green_flags && alignment.recommendations.green_flags.length > 0 && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                ✅ Green Flags
              </h4>
              <ul className="space-y-1">
                {alignment.recommendations.green_flags.map((flag, idx) => (
                  <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Red Flags */}
          {alignment.recommendations.red_flags && alignment.recommendations.red_flags.length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                🚨 Red Flags
              </h4>
              <div className="space-y-3">
                {alignment.recommendations.red_flags.map((flag, idx) => (
                  <div key={idx} className="p-3 bg-white border border-red-200 rounded">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">{flag.flag}</p>
                        <p className="text-xs text-red-700 mt-1">
                          <span className="font-medium">Qué vigilar:</span> {flag.what_to_watch}
                        </p>
                      </div>
                      <Badge variant={flag.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {flag.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Misalignments */}
      {alignment.misalignments && alignment.misalignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Desalineamientos Detectados
            </CardTitle>
            <CardDescription>Áreas donde no están de acuerdo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alignment.misalignments.map((misalignment, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-4 border-2 rounded-lg',
                    misalignment.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : misalignment.severity === 'important'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{misalignment.topic}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {misalignment.category}
                      </Badge>
                    </div>
                    <Badge
                      variant={misalignment.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {misalignment.severity}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <div className="p-2 bg-white border border-current/20 rounded">
                      <p className="text-xs font-medium text-gray-700 mb-1">Founder A:</p>
                      <p className="text-sm text-gray-900">{misalignment.founder_a_position}</p>
                    </div>
                    <div className="p-2 bg-white border border-current/20 rounded">
                      <p className="text-xs font-medium text-gray-700 mb-1">Founder B:</p>
                      <p className="text-sm text-gray-900">{misalignment.founder_b_position}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 bg-white/50 rounded">
                      <p className="text-xs font-medium text-gray-700 mb-1">Impacto:</p>
                      <p className="text-xs text-gray-800">{misalignment.impact}</p>
                    </div>
                    <div className="p-2 bg-white/50 rounded">
                      <p className="text-xs font-medium text-gray-700 mb-1">Por qué importa:</p>
                      <p className="text-xs text-gray-800">{misalignment.why_it_matters}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discussion Topics */}
      {alignment.discussion_topics && alignment.discussion_topics.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              💬 Temas para Discutir
            </CardTitle>
            <CardDescription>Preguntas que deben resolver juntos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alignment.discussion_topics.map((topic, idx) => (
                <div key={idx} className="p-4 bg-white border-2 border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{topic.topic}</h4>
                    <Badge
                      variant={topic.priority === 'critical' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {topic.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 font-medium">{topic.question}</p>

                  {topic.sub_questions && topic.sub_questions.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {topic.sub_questions.map((subQ, i) => (
                        <p key={i} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{subQ}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-800">{topic.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* If Proceed Actions */}
      {alignment.recommendations.if_proceed && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Si deciden continuar juntos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Immediate Actions */}
            {alignment.recommendations.if_proceed.immediate_actions &&
              alignment.recommendations.if_proceed.immediate_actions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Acciones inmediatas:</h4>
                  <ol className="space-y-2">
                    {alignment.recommendations.if_proceed.immediate_actions.map((action, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-semibold">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

            {/* Topics to Codify */}
            {alignment.recommendations.if_proceed.topics_to_codify &&
              alignment.recommendations.if_proceed.topics_to_codify.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Deben codificar por escrito:</h4>
                  <ul className="space-y-1">
                    {alignment.recommendations.if_proceed.topics_to_codify.map((topic, idx) => (
                      <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Suggested Exercises */}
      {alignment.suggested_exercises && alignment.suggested_exercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 Ejercicios Sugeridos</CardTitle>
            <CardDescription>Para mejorar alineamiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alignment.suggested_exercises.map((exercise, idx) => (
                <div key={idx} className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{exercise.exercise}</h4>
                    <Badge variant="outline" className="text-xs">
                      {exercise.duration}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{exercise.description}</p>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-xs text-blue-800">
                      <span className="font-medium">Objetivo:</span> {exercise.goal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compatibility Strengths */}
      {alignment.compatibility_strengths && alignment.compatibility_strengths.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="h-5 w-5" />
              💪 Fortalezas de su Partnership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alignment.compatibility_strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-green-800 flex items-start gap-2 p-2 bg-white rounded">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AlignmentMetric({ icon, label, score }: { icon: React.ReactNode; label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-3 bg-white rounded-lg border">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1 rounded', getColor(score))}>{icon}</div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={cn('text-2xl font-bold', getColor(score))}>{score}</span>
        <span className="text-xs text-gray-600 mb-1">/100</span>
      </div>
      <Progress value={score} className="h-1 mt-2" />
    </div>
  );
}
