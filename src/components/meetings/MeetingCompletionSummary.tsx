/**
 * ✨ MEETING COMPLETION SUMMARY
 *
 * Componente que muestra un resumen al completar una reunión
 * Incluye:
 * - Resumen ejecutivo
 * - Estadísticas de lo creado
 * - Links a entidades creadas
 * - Acciones rápidas
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Target,
  Briefcase,
  AlertTriangle,
  BarChart3,
  FileText,
  ArrowRight,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MeetingCompletionSummaryProps {
  meetingTitle: string;
  meetingSummary?: string;
  keyPoints?: string[];
  results: {
    tasks: number;
    decisions: number;
    leads: number;
    obv_updates: number;
    blockers: number;
    metrics: number;
    insights_degraded?: number;
    engine_writes_blocked?: number;
  };
  meetingDuration?: number;
  /** Confianza de la transcripción (0–1) — para badge de calidad */
  transcriptionConfidence?: number;
  onViewDetails?: () => void;
  onClose?: () => void;
}

export function MeetingCompletionSummary({
  meetingTitle,
  meetingSummary,
  keyPoints = [],
  results,
  meetingDuration,
  transcriptionConfidence,
  onViewDetails,
  onClose,
}: MeetingCompletionSummaryProps) {
  const navigate = useNavigate();

  const totalCreated =
    results.tasks +
    results.decisions +
    results.leads +
    results.obv_updates +
    results.blockers +
    results.metrics;

  const items = [
    {
      count: results.tasks,
      label: 'Tareas',
      labelSingular: 'Tarea',
      icon: Target,
      color: 'blue',
      link: '/proyectos',
    },
    {
      count: results.decisions,
      label: 'Decisiones',
      labelSingular: 'Decisión',
      icon: CheckCircle2,
      color: 'green',
      link: '/proyectos',
    },
    {
      count: results.leads,
      label: 'Leads',
      labelSingular: 'Lead',
      icon: Briefcase,
      color: 'purple',
      link: '/crm',
    },
    {
      count: results.obv_updates,
      label: 'OBVs Actualizados',
      labelSingular: 'OBV Actualizado',
      icon: Target,
      color: 'orange',
      link: '/obvs',
    },
    {
      count: results.blockers,
      label: 'Blockers',
      labelSingular: 'Blocker',
      icon: AlertTriangle,
      color: 'red',
      link: '/proyectos',
    },
    {
      count: results.metrics,
      label: 'Métricas',
      labelSingular: 'Métrica',
      icon: BarChart3,
      color: 'indigo',
      link: '/kpis',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-900">
          <strong>¡Reunión procesada exitosamente!</strong>
          <br />
          Se han creado {totalCreated} elementos en tu proyecto basados en la reunión.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {meetingTitle}
        </h2>
        <p className="text-gray-600 mt-1">Resumen de la reunión completada</p>
      </div>

      {/* Summary Card */}
      {meetingSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumen Ejecutivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{meetingSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Puntos Clave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items
          .filter((item) => item.count > 0)
          .map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(item.link)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-8 w-8 text-${item.color}-600`} />
                    <span className="text-3xl font-bold">{item.count}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.count === 1 ? item.labelSingular : item.label}
                  </div>
                  <div className="mt-2 flex items-center text-xs text-primary hover:underline">
                    Ver en proyecto
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {/* Empty state si no hay nada */}
        {items.filter((item) => item.count > 0).length === 0 && (
          <Card className="col-span-2 md:col-span-3">
            <CardContent className="py-8 text-center text-gray-500">
              No se crearon elementos accionables en esta reunión
            </CardContent>
          </Card>
        )}
      </div>

      {/* Calidad de la sesión — M18.X.6 */}
      {(transcriptionConfidence !== undefined || (results.insights_degraded ?? 0) > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {transcriptionConfidence !== undefined && transcriptionConfidence >= 0.75 ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : transcriptionConfidence !== undefined && transcriptionConfidence >= 0.45 ? (
                <ShieldAlert className="h-5 w-5 text-amber-500" />
              ) : (
                <ShieldOff className="h-5 w-5 text-red-500" />
              )}
              Calidad de la sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transcriptionConfidence !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confianza de transcripción</span>
                <Badge
                  className={
                    transcriptionConfidence >= 0.75
                      ? 'bg-green-100 text-green-700'
                      : transcriptionConfidence >= 0.45
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }
                >
                  {Math.round(transcriptionConfidence * 100)}%
                </Badge>
              </div>
            )}
            {(results.insights_degraded ?? 0) > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{results.insights_degraded}</strong> insight{results.insights_degraded !== 1 ? 's' : ''} reclasificado{results.insights_degraded !== 1 ? 's' : ''} por baja fiabilidad — aplicado{results.insights_degraded !== 1 ? 's' : ''} como operativo{results.insights_degraded !== 1 ? 's' : ''}, no estratégico{results.insights_degraded !== 1 ? 's' : ''}.
                </span>
              </div>
            )}
            {(results.engine_writes_blocked ?? 0) > 0 && (
              <p className="text-xs text-gray-500">
                {results.engine_writes_blocked} señal{results.engine_writes_blocked !== 1 ? 'es' : ''} bloqueada{results.engine_writes_blocked !== 1 ? 's' : ''} del motor por fiabilidad combinada insuficiente.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
        {meetingDuration && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {meetingDuration} min de reunión
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onViewDetails && (
          <Button onClick={onViewDetails} variant="outline">
            Ver Detalles Completos
          </Button>
        )}
        <Button onClick={() => navigate('/proyectos')} className="gap-2">
          <Target className="h-4 w-4" />
          Ver Tareas Creadas
        </Button>
        {onClose && (
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
        )}
      </div>

      {/* AI Badge */}
      <div className="text-center">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Procesado con IA - Whisper + GPT-4
        </Badge>
      </div>
    </div>
  );
}
