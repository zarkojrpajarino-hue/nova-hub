/**
 * ONE-ON-ONE PREP
 *
 * Herramienta para preparar reuniones 1-on-1 con IA
 * Conecta con edge function: prepare-one-on-one
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, TrendingUp, MessageCircle, CheckCircle2, Copy, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface OneOnOneAgenda {
  member_name: string;
  meeting_date: string;
  sections: Array<{
    title: string;
    emoji: string;
    items: Array<{
      question: string;
      context?: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }>;
  performance_summary: {
    recent_wins: string[];
    areas_for_growth: string[];
    mood_indicator: 'positive' | 'neutral' | 'concern';
  };
  talking_points: string[];
  follow_up_actions: string[];
}

export function OneOnOnePrep() {
  const { user, profile } = useAuth();
  const { currentProject } = useCurrentProject();
  const [selectedMember, setSelectedMember] = useState('');
  const [meetingContext, setMeetingContext] = useState('');
  const [agenda, setAgenda] = useState<OneOnOneAgenda | null>(null);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, nombre, email, color')
        .neq('id', profile?.id)
        .order('nombre');

      if (error) throw error;
      return data;
    },
  });

  const handleGenerationComplete = (result: { error?: string; content?: { agenda?: OneOnOneAgenda } | OneOnOneAgenda }) => {
    if (result.error) {
      toast.error('Error al generar agenda: ' + result.error);
      return;
    }

    setAgenda(result.content?.agenda || result.content);
    toast.success('Agenda generada exitosamente');
  };

  const handleGenerationError = (error: Error) => {
    toast.error('Error al generar agenda: ' + error.message);
  };

  const handleCopy = () => {
    if (!agenda) return;

    let text = `📋 Agenda 1-on-1: ${agenda.member_name}\n`;
    text += `📅 ${agenda.meeting_date}\n\n`;

    agenda.sections.forEach((section) => {
      text += `${section.emoji} ${section.title}\n`;
      section.items.forEach((item, idx) => {
        text += `  ${idx + 1}. ${item.question}\n`;
        if (item.context) {
          text += `     Context: ${item.context}\n`;
        }
      });
      text += '\n';
    });

    text += `🎯 Puntos clave:\n`;
    agenda.talking_points.forEach((point, idx) => {
      text += `  ${idx + 1}. ${point}\n`;
    });

    navigator.clipboard.writeText(text);
    toast.success('Agenda copiada al portapapeles');
  };

  const handleDownload = () => {
    if (!agenda) return;

    let text = `Agenda 1-on-1: ${agenda.member_name}\n`;
    text += `Fecha: ${agenda.meeting_date}\n\n`;
    text += `=`.repeat(60) + '\n\n';

    agenda.sections.forEach((section) => {
      text += `${section.emoji} ${section.title}\n`;
      text += `-`.repeat(60) + '\n';
      section.items.forEach((item, idx) => {
        text += `${idx + 1}. ${item.question}\n`;
        if (item.context) {
          text += `   Context: ${item.context}\n`;
        }
        text += '\n';
      });
      text += '\n';
    });

    text += `Puntos Clave de Discusión:\n`;
    text += `-`.repeat(60) + '\n';
    agenda.talking_points.forEach((point, idx) => {
      text += `${idx + 1}. ${point}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1on1-${agenda.member_name.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Agenda descargada');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'positive':
        return '🌟';
      case 'neutral':
        return '😐';
      case 'concern':
        return '⚠️';
      default:
        return '❓';
    }
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
              <CardTitle>Preparación de 1-on-1</CardTitle>
              <CardDescription>
                Genera agendas personalizadas con IA basadas en performance reciente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración de la reunión</CardTitle>
          <CardDescription>
            Selecciona el miembro del equipo y proporciona contexto adicional si lo deseas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="member">Miembro del equipo *</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember} disabled={isGenerating}>
              <SelectTrigger id="member">
                <SelectValue placeholder="Selecciona un miembro" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-semibold"
                        style={{ background: member.color || '#6366F1' }}
                      >
                        {member.nombre.charAt(0)}
                      </div>
                      {member.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              La IA analizará su performance reciente, tareas, OBVs y progreso
            </p>
          </div>

          {/* Optional Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Contexto adicional (opcional)</Label>
            <Textarea
              id="context"
              placeholder="Ej: Revisar progreso en nuevo rol de Product Lead, discutir feedback del último sprint..."
              value={meetingContext}
              onChange={(e) => setMeetingContext(e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Añade temas específicos que quieras cubrir en la reunión
            </p>
          </div>

          {/* Generate Button */}
          <EvidenceAIGenerator
            functionName="prepare-one-on-one"
            evidenceProfile="team"
            projectId={currentProject?.id || ''}
            userId={user?.id || ''}
            buttonLabel="Generar agenda 1-on-1"
            buttonSize="lg"
            buttonClassName="w-full"
            additionalParams={{
              memberId: selectedMember,
              context: meetingContext || undefined,
            }}
            onGenerationComplete={handleGenerationComplete}
            onError={handleGenerationError}
          />
        </CardContent>
      </Card>

      {/* Generated Agenda */}
      {agenda && (
        <div className="space-y-6">
          {/* Agenda Header */}
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <CardTitle className="text-base">Agenda 1-on-1 con {agenda.member_name}</CardTitle>
                    <CardDescription>{agenda.meeting_date}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
                    <Copy size={14} />
                    Copiar
                  </Button>
                  <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                    <Download size={14} />
                    Descargar
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={18} />
                Resumen de Performance
                <Badge
                  variant="outline"
                  className={`ml-auto ${getPriorityColor(agenda.performance_summary.mood_indicator)}`}
                >
                  {getMoodEmoji(agenda.performance_summary.mood_indicator)} Estado:{' '}
                  {agenda.performance_summary.mood_indicator === 'positive'
                    ? 'Positivo'
                    : agenda.performance_summary.mood_indicator === 'concern'
                    ? 'Requiere atención'
                    : 'Neutral'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recent Wins */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                  🏆 Logros recientes:
                </p>
                <ul className="space-y-1">
                  {agenda.performance_summary.recent_wins.map((win, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Areas for Growth */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                  🎯 Áreas de crecimiento:
                </p>
                <ul className="space-y-1">
                  {agenda.performance_summary.areas_for_growth.map((area, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <TrendingUp size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Agenda Sections */}
          {agenda.sections.map((section, sectionIdx) => (
            <Card key={sectionIdx}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{section.emoji}</span>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-medium text-sm flex-1">{item.question}</p>
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        {getPriorityLabel(item.priority)}
                      </Badge>
                    </div>
                    {item.context && (
                      <p className="text-xs text-muted-foreground">{item.context}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Talking Points */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle size={18} />
                Puntos clave de conversación
              </CardTitle>
              <CardDescription>Temas importantes que deberías mencionar</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {agenda.talking_points.map((point, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="flex-1 pt-0.5">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Follow-up Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 size={18} />
                Acciones de seguimiento sugeridas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {agenda.follow_up_actions.map((action, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <div className="w-5 h-5 rounded border-2 border-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
