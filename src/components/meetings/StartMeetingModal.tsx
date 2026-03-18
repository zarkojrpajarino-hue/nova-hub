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

const FUNCTIONS_URL     = 'https://zzxngvqwmnouchbulvlo.supabase.co/functions/v1'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eG5ndnF3bW5vdWNoYnVsdmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDkyNDEsImV4cCI6MjA4NzQ4NTI0MX0.u0bzjhkbHrijmuvKecdRsdxYN4qn43g1fhayP7SiOvs'

interface MeetingBrief {
  headline:         string
  engine_status:    string
  key_signals:      string[]
  suggested_topics: string[]
  risk_flags:       string[]
  confidence:       'high' | 'medium' | 'low'
}

// Types
interface MeetingType {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: string;
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

// Meeting types catalog
const MEETING_TYPES: MeetingType[] = [
  // Planning & Roadmap
  {
    id: 'sprint_planning',
    label: 'Sprint Planning',
    description: 'Planificación de sprint y asignación de tareas',
    icon: Calendar,
    category: 'planning',
  },
  {
    id: 'quarterly_planning',
    label: 'Quarterly Planning (OKRs)',
    description: 'Definición de objetivos trimestrales',
    icon: Target,
    category: 'planning',
  },
  {
    id: 'product_roadmap',
    label: 'Product Roadmap Review',
    description: 'Revisión y actualización del roadmap',
    icon: ChevronRight,
    category: 'planning',
  },
  {
    id: 'feature_prioritization',
    label: 'Feature Prioritization',
    description: 'Priorización de funcionalidades',
    icon: CheckCircle2,
    category: 'planning',
  },

  // Seguimiento & Review
  {
    id: 'sprint_review',
    label: 'Sprint Review',
    description: 'Revisión de resultados del sprint',
    icon: CheckCircle2,
    category: 'review',
  },
  {
    id: 'weekly_sync',
    label: 'Weekly Sync',
    description: 'Sincronización semanal del equipo',
    icon: Users,
    category: 'review',
  },
  {
    id: 'obv_status_update',
    label: 'OBV Status Update',
    description: 'Actualización de estado de OBVs',
    icon: Target,
    category: 'review',
  },
  {
    id: 'kpi_review',
    label: 'KPI Review',
    description: 'Revisión de métricas clave',
    icon: Target,
    category: 'review',
  },

  // Retrospectiva & Mejora
  {
    id: 'sprint_retrospective',
    label: 'Sprint Retrospective',
    description: 'Reflexión sobre el sprint pasado',
    icon: Brain,
    category: 'retro',
  },
  {
    id: 'post_mortem',
    label: 'Post-Mortem',
    description: 'Análisis de incidente o problema',
    icon: AlertCircle,
    category: 'retro',
  },
  {
    id: 'process_improvement',
    label: 'Process Improvement',
    description: 'Mejora de procesos del equipo',
    icon: Sparkles,
    category: 'retro',
  },

  // Personas & Team
  {
    id: 'one_on_one',
    label: 'One-on-One',
    description: 'Reunión individual con miembro',
    icon: Users,
    category: 'people',
  },
  {
    id: 'performance_review',
    label: 'Performance Review',
    description: 'Evaluación de desempeño',
    icon: CheckCircle2,
    category: 'people',
  },
  {
    id: 'team_building',
    label: 'Team Building',
    description: 'Actividad de construcción de equipo',
    icon: Users,
    category: 'people',
  },

  // Cliente & Stakeholders
  {
    id: 'client_demo',
    label: 'Client Demo',
    description: 'Demostración para cliente',
    icon: Sparkles,
    category: 'client',
  },
  {
    id: 'stakeholder_update',
    label: 'Stakeholder Update',
    description: 'Actualización para stakeholders',
    icon: Users,
    category: 'client',
  },
  {
    id: 'sales_pitch',
    label: 'Sales Pitch',
    description: 'Presentación de ventas',
    icon: Target,
    category: 'client',
  },
  {
    id: 'discovery_call',
    label: 'Discovery Call',
    description: 'Llamada de descubrimiento con prospecto',
    icon: Sparkles,
    category: 'client',
  },

  // Urgente & Crisis
  {
    id: 'emergency_meeting',
    label: 'Emergency Meeting',
    description: 'Reunión de emergencia',
    icon: AlertCircle,
    category: 'urgent',
  },
  {
    id: 'incident_review',
    label: 'Incident Review',
    description: 'Revisión de incidente crítico',
    icon: AlertCircle,
    category: 'urgent',
  },

  // General
  {
    id: 'general_meeting',
    label: 'Reunión General',
    description: 'Reunión sin categoría específica',
    icon: Users,
    category: 'other',
  },
];

// Areas de discusión
const DISCUSSION_AREAS = [
  { id: 'product', label: 'Producto/Features' },
  { id: 'marketing', label: 'Marketing/Ventas' },
  { id: 'finance', label: 'Finanzas' },
  { id: 'operations', label: 'Operaciones' },
  { id: 'tech', label: 'Tecnología' },
  { id: 'people', label: 'Personas/HR' },
  { id: 'strategy', label: 'Estrategia' },
];

export function StartMeetingModal({
  isOpen,
  onClose,
  onStart,
  projectId,
  projectMembers,
  currentOBVs = [],
}: StartMeetingModalProps) {
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
        toast.error('Por favor ingresa un título para la reunión');
        return false;
      }
      if (!config.meeting_type && !customMeetingType) {
        toast.error('Por favor selecciona un tipo de reunión');
        return false;
      }
      if (config.participants.length === 0) {
        toast.error('Por favor selecciona al menos un participante');
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
            <Mic className="h-6 w-6 text-primary" />
            Iniciar Reunión Inteligente
          </DialogTitle>
          <DialogDescription>
            Configura tu reunión para que la IA pueda generar los mejores insights
          </DialogDescription>
        </DialogHeader>

        {/* Progress steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {[
            { id: 'basic', label: 'Información Básica' },
            { id: 'strategic', label: 'Contexto Estratégico' },
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
                <Label htmlFor="title">
                  Título de la Reunión <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ej: Sprint Planning Q1 2024"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="text-base"
                />
              </div>

              {/* Meeting Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  Tipo de Reunión <span className="text-red-500">*</span>
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
                      <SelectValue placeholder="Selecciona el tipo de reunión" />
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
                              ? '🎯 Planning & Roadmap'
                              : category === 'review'
                              ? '🔄 Seguimiento & Review'
                              : category === 'retro'
                              ? '💬 Retrospectiva & Mejora'
                              : category === 'people'
                              ? '👥 Personas & Team'
                              : category === 'client'
                              ? '💼 Cliente & Stakeholders'
                              : category === 'urgent'
                              ? '🚨 Urgente & Crisis'
                              : '📋 Otras'}
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
                      placeholder="Escribe el tipo de reunión personalizado"
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
                <Label htmlFor="duration">Duración Estimada</Label>
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
                <Label>
                  Participantes <span className="text-red-500">*</span>
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
                        <Badge variant="secondary" className="text-xs">
                          Presente
                        </Badge>
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
                  <Badge variant="outline" className="text-xs">
                    Opcional
                  </Badge>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Podrás asignar tareas a estos miembros aunque no asistan a la reunión
                  </AlertDescription>
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
                    <p className="text-sm text-gray-500 text-center py-4">
                      Todos los miembros están como participantes
                    </p>
                  )}
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <Label htmlFor="objectives">¿Cuál es el objetivo principal?</Label>
                <Textarea
                  id="objectives"
                  placeholder="Ej: Definir el roadmap del Q2 y asignar responsables..."
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
                  <strong>¿Por qué estas preguntas?</strong> La IA usará este contexto para
                  generar insights más precisos y relevantes durante la reunión.
                </AlertDescription>
              </Alert>

              {/* M18.8 — Brief pre-reunión del motor */}
              {briefLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 rounded-lg border border-border/40 bg-muted/20">
                  <Loader2 size={13} className="animate-spin flex-shrink-0" />
                  Optimus está preparando tu brief…
                </div>
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
                      {brief.confidence === 'high' ? 'Motor actualizado' : brief.confidence === 'medium' ? 'Datos parciales' : 'Sin datos frescos'}
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
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide" style={{ fontSize: '10px' }}>
                        Temas sugeridos por el motor
                      </p>
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
                          <span className="flex-shrink-0">⚠</span>{flag}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Critical Decisions */}
              <div className="space-y-3">
                <Label>¿Hay decisiones críticas pendientes?</Label>
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
                    <label htmlFor="has-decisions" className="text-sm cursor-pointer">
                      Sí, hay decisiones críticas
                    </label>
                  </div>
                </div>
                {config.strategic_context.has_critical_decisions && (
                  <Textarea
                    placeholder="Describe las decisiones que se deben tomar..."
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
                <Label>¿Qué áreas del proyecto se tratarán?</Label>
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
                <Label>¿Hay blockers actuales a resolver?</Label>
                <Textarea
                  placeholder="Ej: API de pagos no está lista, necesitamos priorizar..."
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
                  <Label>¿Qué OBVs se discutirán?</Label>
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
                <Label>¿Métricas clave a revisar?</Label>
                <Input
                  placeholder="Ej: MRR, CAC, Churn Rate, Usuarios Activos..."
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
                  <strong>IA Facilitador Inteligente</strong> - Configura cómo la IA te ayudará
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
                    >
                      Permitir que IA haga preguntas de clarificación
                    </label>
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
                    <label htmlFor="enable-guidance" className="font-medium cursor-pointer block">
                      IA puede guiar y recomendar temas
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      La IA sugerirá temas importantes que se están pasando por alto, recordará
                      contexto relevante y recomendará conversaciones críticas
                    </p>
                    {config.ai_config.enable_proactive_guidance && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                        <strong>Ejemplo:</strong> "Están definiendo el sprint, pero hay 3 tareas
                        bloqueadas del anterior. ¿Deberían discutirlas primero?"
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
                    <label htmlFor="enable-context" className="font-medium cursor-pointer block">
                      Detectar contexto relevante del proyecto
                    </label>
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
                    <label htmlFor="enable-time" className="font-medium cursor-pointer block">
                      Alertas de gestión de tiempo
                    </label>
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
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Resumen de Configuración
                </div>
                <div className="text-sm space-y-1 text-gray-700">
                  <div>
                    • <strong>Título:</strong> {config.title || 'Sin título'}
                  </div>
                  <div>
                    • <strong>Tipo:</strong>{' '}
                    {selectedMeetingType?.label || customMeetingType || 'No seleccionado'}
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
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {step !== 'ai' ? (
              <Button onClick={handleNext}>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleStart} className="gap-2">
                <Mic className="h-4 w-4" />
                Iniciar Reunión
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
