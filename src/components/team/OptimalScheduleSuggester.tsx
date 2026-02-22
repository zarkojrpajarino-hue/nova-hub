/**
 * OPTIMAL SCHEDULE SUGGESTER
 *
 * Sugiere horarios óptimos para reuniones basándose en disponibilidad del equipo
 * Conecta con edge function: suggest-optimal-schedule
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Calendar, Clock, Users, CheckCircle2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface ScheduleSuggestion {
  date: string;
  time: string;
  duration_minutes: number;
  participants: string[];
  confidence_score: number;
  reasoning: string;
  conflicts: string[];
  alternative_slots: Array<{
    date: string;
    time: string;
    confidence_score: number;
  }>;
}

export function OptimalScheduleSuggester() {
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();
  const [meetingType, setMeetingType] = useState('');
  const [duration, setDuration] = useState('60');
  const [participants, setParticipants] = useState('');
  const [preferences, setPreferences] = useState('');
  const [suggestion, setSuggestion] = useState<ScheduleSuggestion | null>(null);

  const handleGenerationComplete = (result: any) => {
    if (result.error) {
      toast.error('Error al generar: ' + result.error);
      return;
    }

    setSuggestion(result.content?.suggestion || result.content);
    toast.success('Horarios sugeridos generados');
  };

  const handleGenerationError = (error: Error) => {
    console.error('Error generating schedule:', error);
    toast.error('Error al generar: ' + error.message);
  };

  const handleCopy = () => {
    if (!suggestion) return;

    const text = `Reunión: ${meetingType}
Fecha: ${suggestion.date}
Hora: ${suggestion.time}
Duración: ${suggestion.duration_minutes} min
Participantes: ${suggestion.participants.join(', ')}

Razón: ${suggestion.reasoning}`;

    navigator.clipboard.writeText(text);
    toast.success('Horario copiado');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl nova-gradient flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Optimal Schedule Suggester</CardTitle>
              <CardDescription>
                Encuentra el mejor horario para reuniones basándose en disponibilidad del equipo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles de la reunión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingType">Tipo de reunión *</Label>
            <Select value={meetingType} onValueChange={setMeetingType} disabled={isGenerating}>
              <SelectTrigger id="meetingType">
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-on-one">1-on-1</SelectItem>
                <SelectItem value="team-standup">Standup de equipo</SelectItem>
                <SelectItem value="project-review">Revisión de proyecto</SelectItem>
                <SelectItem value="brainstorming">Brainstorming</SelectItem>
                <SelectItem value="planning">Planificación</SelectItem>
                <SelectItem value="retrospective">Retrospectiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración</Label>
              <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Participantes *</Label>
              <Textarea
                id="participants"
                placeholder="Nombres separados por comas"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                disabled={isGenerating}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferences">Preferencias (opcional)</Label>
            <Textarea
              id="preferences"
              placeholder="Ej: Mañanas preferiblemente, evitar viernes tarde, considerar zonas horarias..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
          </div>

          <EvidenceAIGenerator
            functionName="suggest-optimal-schedule"
            evidenceProfile="team"
            projectId={currentProject?.id || ''}
            userId={user?.id || ''}
            buttonLabel="Sugerir horarios"
            buttonSize="lg"
            buttonClassName="w-full"
            additionalParams={{
              meetingType,
              duration: parseInt(duration),
              participants: participants.split(',').map(p => p.trim()),
              preferences,
            }}
            onGenerationComplete={handleGenerationComplete}
            onError={handleGenerationError}
          />
        </CardContent>
      </Card>

      {/* Suggestion Result */}
      {suggestion && (
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <CardTitle className="text-base">Horario recomendado</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">
                  {Math.round(suggestion.confidence_score)}% confianza
                </Badge>
                <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
                  <Copy size={14} />
                  Copiar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Suggestion */}
            <div className="p-4 rounded-lg border-2 border-green-500/20 bg-background">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar size={16} className="text-green-500" />
                    {suggestion.date}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hora</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Clock size={16} className="text-green-500" />
                    {suggestion.time}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duración</p>
                  <p className="font-semibold">{suggestion.duration_minutes} min</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Participantes</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestion.participants.map((participant, idx) => (
                    <Badge key={idx} variant="outline">
                      <Users size={12} className="mr-1" />
                      {participant}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm">
                <strong className="text-green-600 dark:text-green-400">Por qué este horario:</strong>{' '}
                {suggestion.reasoning}
              </p>
            </div>

            {/* Conflicts */}
            {suggestion.conflicts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  ⚠️ Conflictos a considerar:
                </p>
                <ul className="space-y-1">
                  {suggestion.conflicts.map((conflict, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground pl-4">
                      • {conflict}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternative Slots */}
            {suggestion.alternative_slots.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Horarios alternativos:</p>
                <div className="space-y-2">
                  {suggestion.alternative_slots.map((alt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                    >
                      <div className="flex items-center gap-4">
                        <Calendar size={14} />
                        <span className="font-medium">
                          {alt.date} a las {alt.time}
                        </span>
                      </div>
                      <Badge variant="outline">{Math.round(alt.confidence_score)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
