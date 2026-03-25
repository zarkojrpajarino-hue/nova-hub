/**
 * 🎙️ START MEETING MODAL
 *
 * Modal de configuración pre-reunión para Meeting Intelligence
 * Permite al usuario configurar todos los aspectos antes de iniciar la grabación
 */

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Users,
  Target,
  Sparkles,
  ChevronRight,
  Mic,
  Brain,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/config'

import { useTranslation } from 'react-i18next';
import { getMeetingTypes, getDiscussionAreas, type MeetingType } from '@/data/meetingTypeData';

interface MeetingBrief {
  headline:         string
  engine_status:    string
  key_signals:      string[]
  suggested_topics: string[]
  risk_flags:       string[]
  confidence:       'high' | 'medium' | 'low'
}

interface Participant {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

interface MeetingConfig {
  title: string;
  meeting_type: string;
  description?: string;
  objectives: string;
  estimated_duration_min: number;
  participants: string[]; // member IDs
  assignable_members: string[]; // members que pueden recibir tareas aunque no estén
  strategic_context: {
    has_critical_decisions: boolean;
    critical_decisions_description?: string;
    areas_to_discuss: string[];
    current_blockers?: string;
    obvs_to_discuss: string[];
    metrics_to_review?: string;
  };
  ai_config: {
    enable_questions: boolean;
    enable_proactive_guidance: boolean;
    enable_context_detection: boolean;
    enable_time_alerts: boolean;
  };
}

interface StartMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: MeetingConfig) => void;
  projectId: string;
  projectMembers: Participant[];
  currentOBVs?: Array<{ id: string; title: string }>;
}

export function StartMeetingModal({
  isOpen,
  onClose,
  onStart,
  projectId,
  projectMembers,
  currentOBVs = [],
}: StartMeetingModalProps) {
  const { t } = useTranslation();
  const MEETING_TYPES = getMeetingTypes(t);
  const DISCUSSION_AREAS = getDiscussionAreas(t);
  const [step, setStep] = useState<'basic' | 'strategic' | 'ai'>('basic');
  const [customMeetingType, setCustomMeetingType] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);

  // M18.8 — brief pre-reunión
  const [brief, setBrief]             = useState<MeetingBrief | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const briefFetchedFor = useRef<string>('')   // evita doble-fetch si se vuelve al paso

  // Form state
  const [config, setConfig] = useState<MeetingConfig>({
    title: '',
    meeting_type: '',
    description: '',
    objectives: '',
    estimated_duration_min: 60,
    participants: [],
    assignable_members: [],
    strategic_context: {
      has_critical_decisions: false,
      areas_to_discuss: [],
      obvs_to_discuss: [],
    },
    ai_config: {
      enable_questions: true,
      enable_proactive_guidance: true,
      enable_context_detection: true,
      enable_time_alerts: true,
    },
  });

  // M18.8 — cargar brief cuando el usuario llega al paso 2 con meeting_type seleccionado
  useEffect(() => {
    const meetingType = config.meeting_type || customMeetingType
    if (step !== 'strategic' || !projectId || !meetingType) return
    const cacheKey = `${projectId}:${meetingType}`
    if (briefFetchedFor.current === cacheKey) return   // ya cargado para esta combinación

    setBriefLoading(true)
    briefFetchedFor.current = cacheKey

    void (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) return

        const res = await fetch(`${FUNCTIONS_URL}/get-meeting-brief`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            project_id:            projectId,
            meeting_type:          meetingType,
            objectives:            config.objectives || undefined,
            estimated_duration_min: config.estimated_duration_min,
          }),
        })
        if (!res.ok) return   // fallo silencioso — el wizard sigue funcionando
        const data = await res.json() as { ok: boolean; brief?: MeetingBrief }
        if (data.ok && data.brief) setBrief(data.brief)
      } catch {
        // no bloquear — brief es decorativo
      } finally {
        setBriefLoading(false)
      }
    })()
  }, [step, projectId, config.meeting_type, customMeetingType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleParticipantToggle = (memberId: string) => {
    setConfig((prev) => ({
      ...prev,
      participants: prev.participants.includes(memberId)
        ? prev.participants.filter((id) => id !== memberId)
        : [...prev.participants, memberId],
    }));
  };

  const handleAssignableToggle = (memberId: string) => {
    setConfig((prev) => ({
      ...prev,
      assignable_members: prev.assignable_members.includes(memberId)
        ? prev.assignable_members.filter((id) => id !== memberId)
        : [...prev.assignable_members, memberId],
    }));
  };

  const handleAreaToggle = (areaId: string) => {
    setConfig((prev) => ({
      ...prev,
      strategic_context: {
        ...prev.strategic_context,
        areas_to_discuss: prev.strategic_context.areas_to_discuss.includes(areaId)
          ? prev.strategic_context.areas_to_discuss.filter((id) => id !== areaId)
          : [...prev.strategic_context.areas_to_discuss, areaId],
      },
    }));
  };

  const handleOBVToggle = (obvId: string) => {
    setConfig((prev) => ({
      ...prev,
      strategic_context: {
        ...prev.strategic_context,
        obvs_to_discuss: prev.strategic_context.obvs_to_discuss.includes(obvId)
          ? prev.strategic_context.obvs_to_discuss.filter((id) => id !== obvId)
          : [...prev.strategic_context.obvs_to_discuss, obvId],
      },
    }));
  };

  const validateStep = (currentStep: typeof step): boolean => {
    if (currentStep === 'basic') {
      if (!config.title.trim()) {
        toast.error(t('meetings.porFavorIngresaUn'));
        return false;
      }
      if (!config.meeting_type && !customMeetingType) {
        toast.error(t('meetings.porFavorSeleccionaUn'));
        return false;
      }
      if (config.participants.length === 0) {
        toast.error(t('meetings.porFavorSeleccionaAl'));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    if (step === 'basic') setStep('strategic');
    else if (step === 'strategic') setStep('ai');
  };

  const handleBack = () => {
    if (step === 'ai') setStep('strategic');
    else if (step === 'strategic') setStep('basic');
  };

  const handleStart = () => {
    if (!validateStep('basic')) return;

    // Si hay custom type, usar ese
    const finalConfig = {
      ...config,
      meeting_type: config.meeting_type || customMeetingType,
    };

    onStart(finalConfig);
  };

  const selectedMeetingType = MEETING_TYPES.find((t) => t.id === config.meeting_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Mic className="h-6 w-6 text-primary" />{t('meetings.iniciarReuniónInteligente')}</DialogTitle>
          <DialogDescription>{t('meetings.configuraTuReuniónPara')}</DialogDescription>
        </DialogHeader>

        {/* Progress steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {[
            { id: 'basic', label: t('meetings.informaciónBásica') },
            { id: 'strategic', label: t('meetings.contextoEstratégico') },
            { id: 'ai', label: 'Configuración IA' },
          ].map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
                  step === s.id
                    ? 'bg-primary text-white'
                    : idx < ['basic', 'strategic', 'ai'].indexOf(step)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {idx + 1}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm font-medium',
                  step === s.id ? 'text-primary' : 'text-gray-500'
                )}
              >
                {s.label}
              </span>
              {idx < 2 && (
                <div className="flex-1 h-0.5 mx-4 bg-gray-200">
                  <div
                    className={cn(
                      'h-full transition-all',
                      idx < ['basic', 'strategic', 'ai'].indexOf(step)
                        ? 'bg-primary'
                        : 'bg-transparent'
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1">
          {/* STEP 1: Basic Info */}
          {step === 'basic' && (
            <div className="space-y-6 pb-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{t('meetings.títuloDeLaReunión')}<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={t('meetings.ejSprintPlanningQ1')}
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="text-base"
                />
              </div>

              {/* Meeting Type */}
              <div className="space-y-2">
                <Label htmlFor="type">{t('meetings.tipoDeReunión')}<span className="text-red-500">*</span>
                </Label>
                {!showCustomType ? (
                  <Select
                    value={config.meeting_type}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setShowCustomType(true);
                      } else {
                        setConfig({ ...config, meeting_type: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('meetings.seleccionaElTipoDe')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(
                        MEETING_TYPES.reduce((acc, type) => {
                          if (!acc[type.category]) acc[type.category] = [];
                          acc[type.category].push(type);
                          return acc;
                        }, {} as Record<string, MeetingType[]>)
                      ).map(([category, types]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                            {category === 'planning'
                              ? 'Planning & Roadmap'
                              : category === 'review'
                              ? 'Seguimiento & Review'
                              : category === 'retro'
                              ? 'Retrospectiva & Mejora'
                              : category === 'people'
                              ? 'Personas & Team'
                              : category === 'client'
                              ? 'Cliente & Stakeholders'
                              : category === 'urgent'
                              ? 'Urgente & Crisis'
                              : 'Otras'}
                          </div>
                          {types.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-start gap-2">
                                <type.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-gray-500">
                                    {type.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="font-medium">✏️ Personalizado (escribe el tuyo)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder={t('meetings.escribeElTipoDe')}
                      value={customMeetingType}
                      onChange={(e) => setCustomMeetingType(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCustomType(false);
                        setCustomMeetingType('');
                      }}
                    >
                      ← Volver a tipos predefinidos
                    </Button>
                  </div>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">{t('meetings.duraciónEstimada')}</Label>
                <Select
                  value={config.estimated_duration_min.toString()}
                  onValueChange={(value) =>
                    setConfig({ ...config, estimated_duration_min: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Participants */}
              <div className="space-y-3">
                <Label>{t('meetings.participantes')}<span className="text-red-500">*</span>
                </Label>
                <div className="border rounded-lg p-4 max-h-[240px] overflow-y-auto space-y-2">
                  {projectMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`participant-${member.id}`}
                          checked={config.participants.includes(member.id)}
                          onCheckedChange={() => handleParticipantToggle(member.id)}
                        />
                        <label
                          htmlFor={`participant-${member.id}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.role}</div>
                          </div>
                        </label>
                      </div>
                      {config.participants.includes(member.id) && (
                        <Badge variant="secondary" className="text-xs">{t('meetings.presente')}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignable Members */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Label className="flex-1">
                    Miembros que pueden recibir tareas (aunque no estén presentes)
                  </Label>
                  <Badge variant="outline" className="text-xs">{t('meetings.opcional')}</Badge>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{t('meetings.podrásAsignarTareasA')}</AlertDescription>
                </Alert>
                <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
                  {projectMembers
                    .filter((m) => !config.participants.includes(m.id))
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <Checkbox
                          id={`assignable-${member.id}`}
                          checked={config.assignable_members.includes(member.id)}
                          onCheckedChange={() => handleAssignableToggle(member.id)}
                        />
                        <label
                          htmlFor={`assignable-${member.id}`}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.role}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  {projectMembers.filter((m) => !config.participants.includes(m.id)).length ===
                    0 && (
                    <p className="text-sm text-gray-500 text-center py-4">{t('meetings.todosLosMiembrosEstán')}</p>
                  )}
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <Label htmlFor="objectives">{t('meetings.cuálEsElObjetivo')}</Label>
                <Textarea
                  id="objectives"
                  placeholder={t('meetings.ejDefinirElRoadmap')}
                  value={config.objectives}
                  onChange={(e) => setConfig({ ...config, objectives: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Strategic Context */}
          {step === 'strategic' && (
            <div className="space-y-6 pb-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Brain className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  <strong>{t('meetings.porQuéEstasPreguntas')}</strong> La IA usará este contexto para
                  generar insights más precisos y relevantes durante la reunión.
                </AlertDescription>
              </Alert>

              {/* M18.8 — Brief pre-reunión del motor */}
              {briefLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 rounded-lg border border-border/40 bg-muted/20">
                  <Loader2 size={13} className="animate-spin flex-shrink-0" />{t('meetings.optimusEstáPreparandoTu')}</div>
              )}
              {!briefLoading && brief && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold text-foreground">{brief.headline}</p>
                      <p className="text-xs text-muted-foreground">{brief.engine_status}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] h-4 px-1 flex-shrink-0',
                        brief.confidence === 'high'   && 'border-green-500/40 text-green-700',
                        brief.confidence === 'medium' && 'border-amber-500/40 text-amber-700',
                        brief.confidence === 'low'    && 'border-muted-foreground/40 text-muted-foreground',
                      )}
                    >
                      {brief.confidence === 'high' ? 'Motor actualizado': brief.confidence === 'medium' ? 'Datos parciales': t('meetings.sinDatosFrescos')}
                    </Badge>
                  </div>

                  {brief.key_signals.length > 0 && (
                    <ul className="space-y-0.5 pl-5">
                      {brief.key_signals.map((s, i) => (
                        <li key={i} className="text-xs text-foreground/80 list-disc">{s}</li>
                      ))}
                    </ul>
                  )}

                  {brief.suggested_topics.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('meetings.temasSugeridosPorEl')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {brief.suggested_topics.map((topic, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setConfig((prev) => ({
                              ...prev,
                              objectives: prev.objectives
                                ? `${prev.objectives}\n• ${topic}`
                                : `• ${topic}`,
                            }))}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-primary/30 bg-background text-primary hover:bg-primary/10 transition-colors"
                          >
                            + {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {brief.risk_flags.length > 0 && (
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 space-y-0.5">
                      {brief.risk_flags.map((flag, i) => (
                        <p key={i} className="text-xs text-amber-700 dark:text-amber-400 flex gap-1">
                          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />{flag}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Critical Decisions */}
              <div className="space-y-3">
                <Label>{t('meetings.hayDecisionesCríticasPendientes')}</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="has-decisions"
                      checked={config.strategic_context.has_critical_decisions}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          strategic_context: {
                            ...config.strategic_context,
                            has_critical_decisions: !!checked,
                          },
                        })
                      }
                    />
                    <label htmlFor="has-decisions" className="text-sm cursor-pointer">{t('meetings.síHayDecisionesCríticas')}</label>
                  </div>
                </div>
                {config.strategic_context.has_critical_decisions && (
                  <Textarea
                    placeholder={t('meetings.describeLasDecisionesQue')}
                    value={config.strategic_context.critical_decisions_description || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        strategic_context: {
                          ...config.strategic_context,
                          critical_decisions_description: e.target.value,
                        },
                      })
                    }
                    rows={2}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Discussion Areas */}
              <div className="space-y-3">
                <Label>{t('meetings.quéÁreasDelProyecto')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {DISCUSSION_AREAS.map((area) => (
                    <div
                      key={area.id}
                      className={cn(
                        'flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all',
                        config.strategic_context.areas_to_discuss.includes(area.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-gray-50'
                      )}
                      onClick={() => handleAreaToggle(area.id)}
                    >
                      <Checkbox
                        checked={config.strategic_context.areas_to_discuss.includes(area.id)}
                        onCheckedChange={() => handleAreaToggle(area.id)}
                      />
                      <span className="text-sm font-medium">{area.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Blockers */}
              <div className="space-y-2">
                <Label>{t('meetings.hayBlockersActualesA')}</Label>
                <Textarea
                  placeholder={t('meetings.ejApiDePagos')}
                  value={config.strategic_context.current_blockers || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      strategic_context: {
                        ...config.strategic_context,
                        current_blockers: e.target.value,
                      },
                    })
                  }
                  rows={2}
                />
              </div>

              {/* OBVs to Discuss */}
              {currentOBVs.length > 0 && (
                <div className="space-y-3">
                  <Label>{t('meetings.quéObvsSeDiscutirán')}</Label>
                  <div className="border rounded-lg p-3 max-h-[180px] overflow-y-auto space-y-2">
                    {currentOBVs.map((obv) => (
                      <div
                        key={obv.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                          config.strategic_context.obvs_to_discuss.includes(obv.id)
                            ? 'bg-primary/10'
                            : 'hover:bg-gray-50'
                        )}
                        onClick={() => handleOBVToggle(obv.id)}
                      >
                        <Checkbox
                          checked={config.strategic_context.obvs_to_discuss.includes(obv.id)}
                          onCheckedChange={() => handleOBVToggle(obv.id)}
                        />
                        <span className="text-sm">{obv.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics to Review */}
              <div className="space-y-2">
                <Label>{t('meetings.métricasClaveARevisar')}</Label>
                <Input
                  placeholder={t('meetings.ejMrrCacChurn')}
                  value={config.strategic_context.metrics_to_review || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      strategic_context: {
                        ...config.strategic_context,
                        metrics_to_review: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* STEP 3: AI Configuration */}
          {step === 'ai' && (
            <div className="space-y-6 pb-4">
              <Alert className="bg-purple-50 border-purple-200">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-sm text-purple-900">
                  <strong>{t('meetings.iaFacilitadorInteligente')}</strong> - Configura cómo la IA te ayudará
                  durante la reunión
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {/* Enable Questions */}
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="enable-questions"
                    checked={config.ai_config.enable_questions}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        ai_config: {
                          ...config.ai_config,
                          enable_questions: !!checked,
                        },
                      })
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="enable-questions"
                      className="font-medium cursor-pointer block"
                    >{t('meetings.permitirQueIaHaga')}</label>
                    <p className="text-sm text-gray-600 mt-1">
                      La IA detectará ambigüedades y hará preguntas específicas para obtener
                      información más precisa (modo silencioso: solo texto en pantalla)
                    </p>
                  </div>
                </div>

                {/* Proactive Guidance */}
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="enable-guidance"
                    checked={config.ai_config.enable_proactive_guidance}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        ai_config: {
                          ...config.ai_config,
                          enable_proactive_guidance: !!checked,
                        },
                      })
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor="enable-guidance" className="font-medium cursor-pointer block">{t('meetings.iaPuedeGuiarY')}</label>
                    <p className="text-sm text-gray-600 mt-1">
                      La IA sugerirá temas importantes que se están pasando por alto, recordará
                      contexto relevante y recomendará conversaciones críticas
                    </p>
                    {config.ai_config.enable_proactive_guidance && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                        <strong>Ejemplo:</strong> t('meetings.estánDefiniendoElSprint')
                      </div>
                    )}
                  </div>
                </div>

                {/* Context Detection */}
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="enable-context"
                    checked={config.ai_config.enable_context_detection}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        ai_config: {
                          ...config.ai_config,
                          enable_context_detection: !!checked,
                        },
                      })
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor="enable-context" className="font-medium cursor-pointer block">{t('meetings.detectarContextoRelevanteDel')}</label>
                    <p className="text-sm text-gray-600 mt-1">
                      La IA conectará la conversación con OBVs, tareas, métricas y decisiones del
                      proyecto en tiempo real
                    </p>
                  </div>
                </div>

                {/* Time Alerts */}
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="enable-time"
                    checked={config.ai_config.enable_time_alerts}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        ai_config: {
                          ...config.ai_config,
                          enable_time_alerts: !!checked,
                        },
                      })
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor="enable-time" className="font-medium cursor-pointer block">{t('meetings.alertasDeGestiónDe')}</label>
                    <p className="text-sm text-gray-600 mt-1">
                      La IA te recordará temas pendientes cuando se acerque el tiempo estimado de
                      finalización
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />{t('meetings.resumenDeConfiguración')}</div>
                <div className="text-sm space-y-1 text-gray-700">
                  <div>
                    • <strong>Título:</strong> {config.title || t('meetings.sinTítulo')}
                  </div>
                  <div>
                    • <strong>Tipo:</strong>{' '}
                    {selectedMeetingType?.label || customMeetingType || t('meetings.noSeleccionado')}
                  </div>
                  <div>
                    • <strong>Participantes:</strong> {config.participants.length}{' '}
                    {config.participants.length === 1 ? 'persona' : 'personas'}
                  </div>
                  <div>
                    • <strong>Duración:</strong> {config.estimated_duration_min} minutos
                  </div>
                  <div>
                    • <strong>Funcionalidades IA:</strong>{' '}
                    {Object.values(config.ai_config).filter(Boolean).length} activas
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {step !== 'basic' && (
              <Button variant="ghost" onClick={handleBack}>
                ← Atrás
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>{t('meetings.cancelar')}</Button>
            {step !== 'ai' ? (
              <Button onClick={handleNext}>{t('meetings.siguiente')}<ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleStart} className="gap-2">
                <Mic className="h-4 w-4" />{t('meetings.iniciarReunión')}</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
