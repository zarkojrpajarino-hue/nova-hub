/**
 * MI ESPACIO PREVIEW MODAL
 *
 * Modal interactivo que muestra TODAS las funcionalidades de Mi Espacio
 * (workspace personal del usuario) con datos demo enterprise-level.
 *
 * Se activa desde el botón "Ver Sección en Acción" en HowItWorks
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  X,
  User,
  CheckSquare,
  Target,
  BookOpen,
  Bell,
  Sparkles,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  AlertCircle,
  MessageSquare,
  Zap,
  Star,
  ArrowUp,
  Brain,
  CheckCircle2,
} from 'lucide-react';

interface MiEspacioPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Datos demo enterprise-level de un usuario real
const DEMO_USER = {
  nombre: 'María García',
  rol: 'Senior Product Manager',
  email: 'maria.garcia@company.com',
  avatar_url: null,
  stats: {
    tareas_completadas: 142,
    tareas_activas: 8,
    obvs_creadas: 28,
    obvs_validadas: 23,
    learning_paths_completados: 3,
    learning_paths_en_curso: 2,
    puntos_xp: 3420,
    nivel: 12,
    racha_dias: 45,
  },
  tareas_activas: [
    {
      id: 1,
      titulo: 'Revisar roadmap Q2 con stakeholders',
      proyecto: 'Enterprise SaaS Platform',
      prioridad: 'high',
      deadline: '2026-02-05',
      progreso: 65,
      etiquetas: ['strategic', 'urgent'],
    },
    {
      id: 2,
      titulo: 'Preparar presentación para board meeting',
      proyecto: 'Corporate Strategy',
      prioridad: 'high',
      deadline: '2026-02-07',
      progreso: 40,
      etiquetas: ['presentation', 'leadership'],
    },
    {
      id: 3,
      titulo: 'Review de backlog con equipo de desarrollo',
      proyecto: 'Enterprise SaaS Platform',
      prioridad: 'medium',
      deadline: '2026-02-10',
      progreso: 80,
      etiquetas: ['development', 'planning'],
    },
    {
      id: 4,
      titulo: 'Analizar feedback de usuarios beta',
      proyecto: 'Mobile App Launch',
      prioridad: 'medium',
      deadline: '2026-02-12',
      progreso: 25,
      etiquetas: ['research', 'ux'],
    },
    {
      id: 5,
      titulo: 'Documentar proceso de onboarding clientes',
      proyecto: 'Customer Success',
      prioridad: 'low',
      deadline: '2026-02-15',
      progreso: 10,
      etiquetas: ['documentation', 'process'],
    },
  ],
  obvs_recientes: [
    {
      id: 1,
      titulo: 'Nuevo dashboard de analytics validado por cliente enterprise',
      tipo: 'validada',
      proyecto: 'Enterprise SaaS Platform',
      fecha: '2026-02-01',
      valor: 8500,
      impacto: 'high',
    },
    {
      id: 2,
      titulo: 'Feature de exportación a Excel implementada',
      tipo: 'validada',
      proyecto: 'Enterprise SaaS Platform',
      fecha: '2026-01-28',
      valor: 3200,
      impacto: 'medium',
    },
    {
      id: 3,
      titulo: 'Optimización de flujo de onboarding (-40% tiempo)',
      tipo: 'validada',
      proyecto: 'Customer Success',
      fecha: '2026-01-25',
      valor: 5600,
      impacto: 'high',
    },
    {
      id: 4,
      titulo: 'Integración con Slack para notificaciones en tiempo real',
      tipo: 'en_validacion',
      proyecto: 'Enterprise SaaS Platform',
      fecha: '2026-02-02',
      valor: 4200,
      impacto: 'medium',
    },
  ],
  learning_paths: [
    {
      id: 1,
      titulo: 'Advanced Product Management',
      progreso: 100,
      completado: true,
      modulos_total: 8,
      modulos_completados: 8,
      certificado: true,
      fecha_completado: '2025-12-15',
    },
    {
      id: 2,
      titulo: 'Data-Driven Decision Making',
      progreso: 75,
      completado: false,
      modulos_total: 6,
      modulos_completados: 4,
      certificado: false,
      proximo_modulo: 'Advanced Analytics with Python',
    },
    {
      id: 3,
      titulo: 'Leadership & Team Management',
      progreso: 45,
      completado: false,
      modulos_total: 10,
      modulos_completados: 4,
      certificado: false,
      proximo_modulo: 'Conflict Resolution Strategies',
    },
  ],
  notificaciones: [
    {
      id: 1,
      tipo: 'urgente',
      titulo: 'Deadline próximo: Roadmap Q2',
      mensaje: 'Tu tarea vence en 2 días',
      fecha: '2026-02-03',
      leida: false,
    },
    {
      id: 2,
      tipo: 'logro',
      titulo: '¡Nuevo logro desbloqueado!',
      mensaje: 'Has completado 45 días consecutivos de actividad',
      fecha: '2026-02-03',
      leida: false,
    },
    {
      id: 3,
      tipo: 'info',
      titulo: 'Nueva respuesta en comentario',
      mensaje: 'Carlos Mendoza respondió a tu comentario en "Analytics Dashboard"',
      fecha: '2026-02-02',
      leida: false,
    },
    {
      id: 4,
      tipo: 'info',
      titulo: 'Nuevo módulo disponible',
      mensaje: 'El módulo "Advanced Analytics with Python" ya está disponible',
      fecha: '2026-02-01',
      leida: true,
    },
  ],
  proximos_eventos: [
    {
      id: 1,
      titulo: 'Sprint Planning - Q1 Sprint 4',
      tipo: 'meeting',
      fecha: '2026-02-04',
      hora: '10:00 AM',
      duracion: '90 min',
      asistentes: 8,
    },
    {
      id: 2,
      titulo: 'Board Meeting Presentation',
      tipo: 'presentation',
      fecha: '2026-02-07',
      hora: '2:00 PM',
      duracion: '60 min',
      asistentes: 5,
    },
    {
      id: 3,
      titulo: '1:1 con CEO - Strategy Review',
      tipo: 'one_on_one',
      fecha: '2026-02-08',
      hora: '11:00 AM',
      duracion: '45 min',
      asistentes: 2,
    },
  ],
};

const SLIDES = [
  {
    id: 'intro',
    title: 'Mi Espacio - Tu Workspace Personal',
    icon: User,
    description: 'Tu hub centralizado con todas tus tareas, OBVs, aprendizaje y notificaciones en un solo lugar.',
    content: (
      <div className="space-y-6">
        {/* User Profile Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                MG
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">{DEMO_USER.nombre}</CardTitle>
                <p className="text-muted-foreground mb-2">{DEMO_USER.rol}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">Nivel {DEMO_USER.stats.nivel}</Badge>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {DEMO_USER.stats.puntos_xp} XP
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                    {DEMO_USER.stats.racha_dias} días de racha
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-4 gap-3">
          <Card className="border-primary/10 hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <p className="text-xs text-muted-foreground">Tareas</p>
              </div>
              <p className="text-2xl font-bold">{DEMO_USER.stats.tareas_completadas}</p>
              <p className="text-xs text-muted-foreground mt-1">{DEMO_USER.stats.tareas_activas} activas</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <p className="text-xs text-muted-foreground">OBVs</p>
              </div>
              <p className="text-2xl font-bold">{DEMO_USER.stats.obvs_creadas}</p>
              <p className="text-xs text-green-600 mt-1">{DEMO_USER.stats.obvs_validadas} validadas</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <p className="text-xs text-muted-foreground">Learning</p>
              </div>
              <p className="text-2xl font-bold">{DEMO_USER.stats.learning_paths_completados}</p>
              <p className="text-xs text-muted-foreground mt-1">{DEMO_USER.stats.learning_paths_en_curso} en curso</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-amber-600" />
                <p className="text-xs text-muted-foreground">Nivel</p>
              </div>
              <p className="text-2xl font-bold">{DEMO_USER.stats.nivel}</p>
              <Progress value={65} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            ¿Qué puedes hacer en Mi Espacio?
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Gestionar todas tus tareas con prioridades y deadlines visuales</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Trackear tus OBVs (Objetivos de Valor) y su impacto en revenue</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Seguir tu progreso en learning paths con certificaciones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Recibir notificaciones inteligentes y gestionar tu calendario</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Ver tu evolución con gamificación (XP, niveles, logros)</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'perfil-stats',
    title: 'Perfil y Estadísticas Personales',
    icon: User,
    description: 'Tu progreso, logros y performance en tiempo real con insights personalizados.',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Performance Overview */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Performance Este Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="group relative p-2 rounded-lg bg-muted/50 hover:bg-primary/5 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tareas Completadas</span>
                  <span className="text-sm font-bold">24</span>
                </div>
                <Progress value={85} className="h-1 mt-2" />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-popover border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs pointer-events-none">
                  +20% vs mes anterior
                </div>
              </div>

              <div className="group relative p-2 rounded-lg bg-muted/50 hover:bg-primary/5 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">OBVs Validadas</span>
                  <span className="text-sm font-bold">5</span>
                </div>
                <Progress value={70} className="h-1 mt-2" />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-popover border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs pointer-events-none">
                  Valor total: $22,500
                </div>
              </div>

              <div className="group relative p-2 rounded-lg bg-muted/50 hover:bg-primary/5 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Módulos Completados</span>
                  <span className="text-sm font-bold">3</span>
                </div>
                <Progress value={60} className="h-1 mt-2" />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-popover border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs pointer-events-none">
                  2 learning paths activos
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logros y Gamificación */}
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Logros y Reconocimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <p className="text-xs font-semibold">Racha Épica</p>
                    <p className="text-[10px] text-muted-foreground">45 días consecutivos</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600">
                  Nuevo
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">⭐</div>
                  <div>
                    <p className="text-xs font-semibold">Top Performer</p>
                    <p className="text-[10px] text-muted-foreground">Top 5% este mes</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🎓</div>
                  <div>
                    <p className="text-xs font-semibold">Learning Master</p>
                    <p className="text-[10px] text-muted-foreground">3 certificaciones</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* XP Progress */}
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold">Nivel {DEMO_USER.stats.nivel}</p>
                <p className="text-xs text-muted-foreground">
                  {DEMO_USER.stats.puntos_xp} / 4000 XP
                </p>
              </div>
              <Badge className="bg-primary">580 XP hasta nivel {DEMO_USER.stats.nivel + 1}</Badge>
            </div>
            <Progress value={65} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ¡Sigue así! Completa 2 tareas más para desbloquear el siguiente nivel
            </p>
          </CardContent>
        </Card>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Insights de IA
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Tu productividad es 15% mayor los martes y jueves</li>
            <li>• Completas tareas de alta prioridad 30% más rápido que el promedio</li>
            <li>• Recomendación: Planifica presentaciones para las mañanas (mejor performance)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'tareas-activas',
    title: 'Mis Tareas Activas',
    icon: CheckSquare,
    description: 'Gestiona todas tus tareas con prioridades inteligentes, deadlines y progreso visual.',
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">
              {DEMO_USER.stats.tareas_activas} tareas activas
            </p>
            <p className="text-xs text-muted-foreground">Ordenadas por prioridad y deadline</p>
          </div>
          <Badge variant="outline" className="text-xs">
            2 tareas vencen esta semana
          </Badge>
        </div>

        <div className="space-y-2">
          {DEMO_USER.tareas_activas.slice(0, 4).map((tarea, idx) => {
            const isPriorityHigh = tarea.prioridad === 'high';
            const isPriorityMedium = tarea.prioridad === 'medium';
            const diasRestantes = Math.ceil((new Date(tarea.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isUrgente = diasRestantes <= 3;

            return (
              <div
                key={tarea.id}
                className="group relative p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                style={{ animation: `slideIn 0.3s ease-out ${idx * 0.1}s both` }}
              >
                {/* Hover tooltip con más info */}
                <div className="absolute left-0 top-full mt-2 w-full p-3 rounded-lg bg-popover border shadow-xl z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Proyecto</p>
                      <p className="font-semibold">{tarea.proyecto}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Deadline</p>
                      <p className="font-semibold">{new Date(tarea.deadline).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">Etiquetas</p>
                      <div className="flex gap-1">
                        {tarea.etiquetas.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all group-hover:scale-110 ${
                      isPriorityHigh ? 'border-red-500 bg-red-500/10' :
                      isPriorityMedium ? 'border-amber-500 bg-amber-500/10' :
                      'border-muted-foreground/30 bg-muted/30'
                    }`}>
                      {tarea.progreso === 100 && <span className="text-xs">✓</span>}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {tarea.titulo}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isUrgente && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {diasRestantes}d
                          </Badge>
                        )}
                        {isPriorityHigh && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            <ArrowUp className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Progress value={tarea.progreso} className="h-1.5 flex-1" />
                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                          {tarea.progreso}%
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {tarea.proyecto}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(tarea.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground">
            Filtra por proyecto, prioridad o deadline • Arrastra para reordenar • Crea subtareas
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'obvs-recientes',
    title: 'Mis OBVs Recientes',
    icon: Target,
    description: 'Trackea tus Objetivos de Valor con impacto en revenue y validación de stakeholders.',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Total Validadas</p>
              <p className="text-2xl font-bold text-green-600">{DEMO_USER.stats.obvs_validadas}</p>
              <p className="text-xs text-muted-foreground mt-1">de {DEMO_USER.stats.obvs_creadas} creadas</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-blue-600">$22.5K</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +35% este mes
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-purple-600">82%</p>
              <p className="text-xs text-muted-foreground mt-1">validation rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          {DEMO_USER.obvs_recientes.map((obv, idx) => {
            const isValidada = obv.tipo === 'validada';
            const isHighImpact = obv.impacto === 'high';

            return (
              <div
                key={obv.id}
                className="group relative p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
                style={{ animation: `slideIn 0.3s ease-out ${idx * 0.1}s both` }}
              >
                {/* Hover tooltip */}
                <div className="absolute left-0 top-full mt-2 w-full p-3 rounded-lg bg-popover border shadow-xl z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Proyecto</p>
                      <p className="font-semibold">{obv.proyecto}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor de Negocio</p>
                      <p className="font-semibold text-green-600">${obv.valor.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha</p>
                      <p className="font-semibold">{new Date(obv.fecha).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${
                    isValidada ? 'bg-green-500/10' : 'bg-amber-500/10'
                  }`}>
                    {isValidada ? '✓' : '⏳'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {obv.titulo}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={isValidada ? 'default' : 'secondary'}
                          className={`text-[10px] ${isValidada ? 'bg-green-600' : ''}`}
                        >
                          {isValidada ? 'Validada' : 'En validación'}
                        </Badge>
                        {isHighImpact && (
                          <Badge variant="destructive" className="text-[10px]">
                            <Star className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {obv.proyecto}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-green-600">
                        ${(obv.valor / 1000).toFixed(1)}K valor
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(obv.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Insights de OBVs
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Tus OBVs generan en promedio $5,625 de valor validado</li>
            <li>• 82% de tasa de validación (18% sobre el promedio del equipo)</li>
            <li>• Proyecto con mayor impacto: Enterprise SaaS Platform ($17.3K)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'learning-progress',
    title: 'Mi Progreso en Learning Paths',
    icon: BookOpen,
    description: 'Sigue tu desarrollo profesional con cursos, certificaciones y módulos interactivos.',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Completados</p>
              <p className="text-2xl font-bold text-purple-600">{DEMO_USER.stats.learning_paths_completados}</p>
              <div className="flex items-center gap-1 mt-1">
                <Award className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-muted-foreground">3 certificaciones</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">En Progreso</p>
              <p className="text-2xl font-bold text-blue-600">{DEMO_USER.stats.learning_paths_en_curso}</p>
              <p className="text-xs text-muted-foreground mt-1">5 módulos restantes</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Horas Totales</p>
              <p className="text-2xl font-bold text-green-600">47</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12h este mes
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {DEMO_USER.learning_paths.map((lp, idx) => (
            <Card
              key={lp.id}
              className={`border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                lp.completado ? 'bg-green-500/5' : ''
              }`}
              style={{ animation: `slideIn 0.3s ease-out ${idx * 0.1}s both` }}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{lp.titulo}</h4>
                      {lp.completado && (
                        <Badge className="text-[10px] bg-green-600">
                          <Award className="w-3 h-3 mr-1" />
                          Completado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lp.modulos_completados} de {lp.modulos_total} módulos completados
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{lp.progreso}%</p>
                  </div>
                </div>

                <Progress value={lp.progreso} className="h-2 mb-3" />

                {!lp.completado && lp.proximo_modulo && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowUp className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Próximo módulo</p>
                        <p className="text-[10px] text-muted-foreground">{lp.proximo_modulo}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Continuar
                    </Button>
                  </div>
                )}

                {lp.completado && lp.certificado && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        Certificado obtenido - {new Date(lp.fecha_completado || '').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs h-7">
                      Descargar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            Recomendaciones Personalizadas
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Basado en tu rol, te recomendamos: "Strategic Product Planning"</li>
            <li>• Compañeros con roles similares también estudiaron "OKR Mastery"</li>
            <li>• Nuevo curso disponible: "AI for Product Managers" (5h)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'notificaciones-eventos',
    title: 'Notificaciones y Próximos Eventos',
    icon: Bell,
    description: 'Mantente al día con notificaciones inteligentes y gestiona tu calendario.',
    content: (
      <div className="space-y-4">
        {/* Notificaciones */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Notificaciones Recientes</h4>
            <Badge variant="destructive" className="text-xs">
              3 nuevas
            </Badge>
          </div>

          <div className="space-y-2">
            {DEMO_USER.notificaciones.slice(0, 3).map((notif, idx) => {
              const isUrgente = notif.tipo === 'urgente';
              const isLogro = notif.tipo === 'logro';
              const isNueva = !notif.leida;

              return (
                <div
                  key={notif.id}
                  className={`group relative p-3 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-lg ${
                    isNueva ? 'bg-primary/5 border-primary/30' : 'bg-card'
                  }`}
                  style={{ animation: `slideIn 0.3s ease-out ${idx * 0.1}s both` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isUrgente ? 'bg-red-500/10' :
                      isLogro ? 'bg-amber-500/10' :
                      'bg-blue-500/10'
                    }`}>
                      {isUrgente ? '⚠️' : isLogro ? '🎉' : '💬'}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {notif.titulo}
                        </h5>
                        {isNueva && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{notif.mensaje}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximos Eventos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Próximos Eventos</h4>
            <Badge variant="outline" className="text-xs">
              Esta semana
            </Badge>
          </div>

          <div className="space-y-2">
            {DEMO_USER.proximos_eventos.map((evento, idx) => {
              const tipoIcon = evento.tipo === 'meeting' ? '👥' :
                              evento.tipo === 'presentation' ? '📊' : '🤝';
              const tipoColor = evento.tipo === 'meeting' ? 'blue' :
                               evento.tipo === 'presentation' ? 'purple' : 'green';

              return (
                <Card
                  key={evento.id}
                  className="border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  style={{ animation: `slideIn 0.3s ease-out ${idx * 0.1}s both` }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-${tipoColor}-500/10 flex items-center justify-center text-2xl flex-shrink-0`}>
                        {tipoIcon}
                      </div>

                      <div className="flex-1">
                        <h5 className="font-semibold text-sm mb-1">{evento.titulo}</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(evento.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {evento.hora} ({evento.duracion})
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {evento.asistentes} asistentes
                          </div>
                          <div>
                            <Badge variant="secondary" className={`text-[10px] bg-${tipoColor}-500/10`}>
                              {evento.tipo === 'meeting' ? 'Meeting' :
                               evento.tipo === 'presentation' ? 'Presentation' : '1:1'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Notificaciones Inteligentes
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Filtros personalizables por tipo (tareas, OBVs, learning, eventos)</li>
            <li>• Integración con Slack y email para notificaciones críticas</li>
            <li>• Calendario sincronizado con Google Calendar y Outlook</li>
            <li>• Recordatorios automáticos antes de deadlines y eventos</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export function MiEspacioPreviewModal({ open, onOpenChange }: MiEspacioPreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setCurrentSlide(0);
    onOpenChange(false);
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;
  const progress = ((currentSlide + 1) / SLIDES.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Mi Espacio Preview</DialogTitle>
          <DialogDescription>
            Interactive preview of personal workspace section
          </DialogDescription>
        </VisuallyHidden>
        {/* Header */}
        <div className="relative p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-background/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{slide.title}</h2>
              <p className="text-sm text-muted-foreground">{slide.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Paso {currentSlide + 1} de {SLIDES.length}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {slide.content}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <div className="flex gap-1">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlide
                      ? 'w-8 bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={currentSlide === SLIDES.length - 1 ? handleClose : handleNext}
              className="gap-2"
            >
              {currentSlide === SLIDES.length - 1 ? (
                <>
                  Finalizar
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
