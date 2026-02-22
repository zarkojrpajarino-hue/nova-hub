/**
 * LEARNING PATH TIMELINE (CAPA 6)
 *
 * Muestra roadmap de aprendizaje personalizado
 * Con recursos priorizados y tracking de progreso
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Book,
  Video,
  FileText,
  Laptop,
  ExternalLink,
  CheckCircle2,
  Clock,
  DollarSign,
  Target,
  AlertCircle,
} from 'lucide-react';
import type { LearningPath, LearningResource } from '@/types/ultra-onboarding';
import { cn } from '@/lib/utils';

interface LearningPathTimelineProps {
  learningPath: LearningPath;
  completedResources?: string[];
  onMarkComplete?: (resourceId: string) => void;
}

const resourceIcons = {
  book: <Book className="h-4 w-4" />,
  course: <Laptop className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  tool: <Laptop className="h-4 w-4" />,
};

const priorityColors = {
  critical: 'bg-red-100 text-red-900 border-red-200',
  high: 'bg-orange-100 text-orange-900 border-orange-200',
  medium: 'bg-blue-100 text-blue-900 border-blue-200',
  low: 'bg-gray-100 text-gray-900 border-gray-200',
};

export function LearningPathTimeline({
  learningPath,
  completedResources = [],
  onMarkComplete,
}: LearningPathTimelineProps) {
  const [selectedPhase, setSelectedPhase] = useState<'phase_1_immediate' | 'phase_2_building' | 'phase_3_growth'>(
    'phase_1_immediate'
  );

  const phases = [
    { id: 'phase_1_immediate' as const, label: 'Fase 1: Inmediato', emoji: '🚀' },
    { id: 'phase_2_building' as const, label: 'Fase 2: Construcción', emoji: '🏗️' },
    { id: 'phase_3_growth' as const, label: 'Fase 3: Crecimiento', emoji: '📈' },
  ];

  const currentPhase = learningPath.learning_roadmap[selectedPhase];
  const phaseResources = learningPath.resources.filter((r) => currentPhase.resources.includes(r.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">📚 Tu Learning Path Personalizado</h2>
        <p className="text-gray-600">Recursos priorizados según tus gaps y tipo de negocio</p>
      </div>

      {/* Skill Gaps Summary */}
      {learningPath.skill_gaps && learningPath.skill_gaps.length > 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Gaps Detectados
            </CardTitle>
            <CardDescription>Skills que necesitas desarrollar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {learningPath.skill_gaps.map((gap, idx) => (
                <Badge key={idx} variant="outline" className="capitalize">
                  {gap.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Skills */}
      {learningPath.skills_you_already_have && learningPath.skills_you_already_have.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="h-5 w-5" />
              ✓ Skills que YA tienes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {learningPath.skills_you_already_have.map((skill, idx) => (
                <div key={idx} className="p-2 bg-white rounded border border-green-200">
                  <p className="text-sm font-medium text-green-900">{skill.skill}</p>
                  <p className="text-xs text-green-700">{skill.why_valuable}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Selector */}
      <div className="flex gap-2 flex-wrap">
        {phases.map((phase) => (
          <Button
            key={phase.id}
            variant={selectedPhase === phase.id ? 'default' : 'outline'}
            onClick={() => setSelectedPhase(phase.id)}
            className="flex-1 min-w-[150px]"
          >
            {phase.emoji} {phase.label}
          </Button>
        ))}
      </div>

      {/* Current Phase Info */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                {phases.find((p) => p.id === selectedPhase)?.label}
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Duración</p>
                <p className="text-sm font-semibold">{currentPhase.duration}</p>
              </div>
              <div className="p-3 bg-white rounded border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Focus</p>
                <p className="text-sm font-semibold">{currentPhase.focus}</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded border border-blue-200 mt-2">
              <p className="text-xs text-gray-600 mb-1">Outcome esperado:</p>
              <p className="text-sm text-gray-900">{currentPhase.outcome}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <div className="space-y-3">
        {phaseResources.map((resource, idx) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            index={idx}
            isCompleted={completedResources.includes(resource.id)}
            onMarkComplete={onMarkComplete}
          />
        ))}
      </div>

      {/* Common Mistakes */}
      {learningPath.common_mistakes_to_avoid && learningPath.common_mistakes_to_avoid.length > 0 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              ⚠️ Errores Comunes a Evitar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {learningPath.common_mistakes_to_avoid.map((mistake, idx) => (
                <li key={idx} className="text-sm text-red-800 flex items-start gap-2 p-2 bg-white rounded">
                  <span className="text-red-600 mt-0.5">!</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommended Mentors */}
      {learningPath.recommended_mentors && learningPath.recommended_mentors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🧑‍🏫 Mentores Recomendados</CardTitle>
            <CardDescription>Busca ayuda de personas con experiencia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {learningPath.recommended_mentors.map((mentor, idx) => (
                <div key={idx} className="p-3 border-2 border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">{mentor.name}</h4>
                  <p className="text-sm text-gray-700 mb-2">{mentor.why}</p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Dónde encontrar:</span> {mentor.where_to_find}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResourceCard({
  resource,
  index,
  isCompleted,
  onMarkComplete,
}: {
  resource: LearningResource;
  index: number;
  isCompleted: boolean;
  onMarkComplete?: (resourceId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      className={cn(
        'border-2 transition-all',
        isCompleted && 'opacity-60 bg-gray-50',
        priorityColors[resource.priority]
      )}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            {onMarkComplete && (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onMarkComplete(resource.id)}
                className="mt-1"
              />
            )}

            {/* Priority Badge */}
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                resource.priority === 'critical'
                  ? 'bg-red-600 text-white'
                  : resource.priority === 'high'
                  ? 'bg-orange-600 text-white'
                  : resource.priority === 'medium'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-400 text-white'
              )}
            >
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{resource.title}</h3>
                    {isCompleted && <Badge className="bg-green-600">✓ Completado</Badge>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {resourceIcons[resource.type]} {resource.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {resource.priority}
                    </Badge>
                  </div>
                </div>
                {resource.url && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex gap-3 text-sm text-gray-700 mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{resource.estimated_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="text-xs">{resource.cost}</span>
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-gray-700 mb-2">{resource.reasoning}</p>

              {/* When to do it */}
              <div className="p-2 bg-white/50 rounded border border-current/20 mb-2">
                <p className="text-xs">
                  <span className="font-medium">Cuándo hacerlo:</span> {resource.when_to_do_it}
                </p>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t border-current/20 animate-fade-in">
                  {/* Key Takeaways */}
                  {resource.key_takeaways && resource.key_takeaways.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">📝 Key Takeaways:</h4>
                      <ul className="space-y-1">
                        {resource.key_takeaways.map((takeaway, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* How to Apply */}
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <h4 className="text-xs font-semibold text-green-900 mb-1">🎯 Cómo aplicarlo:</h4>
                    <p className="text-xs text-green-800">{resource.how_to_apply}</p>
                  </div>
                </div>
              )}

              {/* Toggle Expand */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Ver menos' : 'Ver detalles'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
