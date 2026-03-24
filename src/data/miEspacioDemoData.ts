/**
 * Demo data for MiEspacioPreviewModal — V5.5.2
 * Extracted from MiEspacioPreviewModal.tsx
 */

import type { TFunction } from 'i18next';

export interface DemoTask {
  id: number;
  titulo: string;
  proyecto: string;
  prioridad: 'high' | 'medium' | 'low';
  deadline: string;
  progreso: number;
  etiquetas: string[];
}

export interface DemoOBV {
  id: number;
  titulo: string;
  tipo: 'validada' | 'en_validacion';
  proyecto: string;
  fecha: string;
  valor: number;
  impacto: 'high' | 'medium' | 'low';
}

export interface DemoLearningPath {
  id: number;
  titulo: string;
  progreso: number;
  completado: boolean;
  modulos_total: number;
  modulos_completados: number;
  certificado: boolean;
  fecha_completado?: string;
  proximo_modulo?: string;
}

export interface DemoNotification {
  id: number;
  tipo: 'urgente' | 'logro' | 'info';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}

export interface DemoEvent {
  id: number;
  titulo: string;
  tipo: 'meeting' | 'presentation' | 'one_on_one';
  fecha: string;
  hora: string;
  duracion: string;
  asistentes: number;
}

export interface DemoUser {
  nombre: string;
  rol: string;
  email: string;
  avatar_url: null;
  stats: {
    tareas_completadas: number;
    tareas_activas: number;
    obvs_creadas: number;
    obvs_validadas: number;
    learning_paths_completados: number;
    learning_paths_en_curso: number;
    puntos_xp: number;
    nivel: number;
    racha_dias: number;
  };
  tareas_activas: DemoTask[];
  obvs_recientes: DemoOBV[];
  learning_paths: DemoLearningPath[];
  notificaciones: DemoNotification[];
  proximos_eventos: DemoEvent[];
}

export function getDemoUser(t: TFunction): DemoUser {
  return {
    nombre: t('preview.maríaGarcía'),
    rol: t('preview.seniorProductManager'),
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
      { id: 1, titulo: t('preview.revisarRoadmapQ2Con'), proyecto: t('preview.enterpriseSaasPlatform'), prioridad: 'high', deadline: '2026-02-05', progreso: 65, etiquetas: ['strategic', 'urgent'] },
      { id: 2, titulo: t('preview.prepararPresentaciónParaBoard'), proyecto: t('preview.corporateStrategy'), prioridad: 'high', deadline: '2026-02-07', progreso: 40, etiquetas: ['presentation', 'leadership'] },
      { id: 3, titulo: t('preview.reviewDeBacklogCon'), proyecto: t('preview.enterpriseSaasPlatform'), prioridad: 'medium', deadline: '2026-02-10', progreso: 80, etiquetas: ['development', 'planning'] },
      { id: 4, titulo: t('preview.analizarFeedbackDeUsuarios'), proyecto: t('preview.mobileAppLaunch'), prioridad: 'medium', deadline: '2026-02-12', progreso: 25, etiquetas: ['research', 'ux'] },
      { id: 5, titulo: t('preview.documentarProcesoDeOnboarding'), proyecto: t('preview.customerSuccess'), prioridad: 'low', deadline: '2026-02-15', progreso: 10, etiquetas: ['documentation', 'process'] },
    ],
    obvs_recientes: [
      { id: 1, titulo: t('preview.nuevoDashboardDeAnalytics'), tipo: 'validada', proyecto: t('preview.enterpriseSaasPlatform'), fecha: '2026-02-01', valor: 8500, impacto: 'high' },
      { id: 2, titulo: t('preview.featureDeExportaciónA'), tipo: 'validada', proyecto: t('preview.enterpriseSaasPlatform'), fecha: '2026-01-28', valor: 3200, impacto: 'medium' },
      { id: 3, titulo: 'Optimización de flujo de onboarding (-40% tiempo)', tipo: 'validada', proyecto: t('preview.customerSuccess'), fecha: '2026-01-25', valor: 5600, impacto: 'high' },
      { id: 4, titulo: t('preview.integraciónConSlackPara'), tipo: 'en_validacion', proyecto: t('preview.enterpriseSaasPlatform'), fecha: '2026-02-02', valor: 4200, impacto: 'medium' },
    ],
    learning_paths: [
      { id: 1, titulo: t('preview.advancedProductManagement'), progreso: 100, completado: true, modulos_total: 8, modulos_completados: 8, certificado: true, fecha_completado: '2025-12-15' },
      { id: 2, titulo: t('preview.datadrivenDecisionMaking'), progreso: 75, completado: false, modulos_total: 6, modulos_completados: 4, certificado: false, proximo_modulo: t('preview.advancedAnalyticsWithPython') },
      { id: 3, titulo: t('preview.leadershipTeamManagement'), progreso: 45, completado: false, modulos_total: 10, modulos_completados: 4, certificado: false, proximo_modulo: t('preview.conflictResolutionStrategies') },
    ],
    notificaciones: [
      { id: 1, tipo: 'urgente', titulo: 'Deadline próximo: Roadmap Q2', mensaje: t('preview.tuTareaVenceEn'), fecha: '2026-02-03', leida: false },
      { id: 2, tipo: 'logro', titulo: t('preview.nuevoLogroDesbloqueado'), mensaje: t('preview.hasCompletado45Días'), fecha: '2026-02-03', leida: false },
      { id: 3, tipo: 'info', titulo: t('preview.nuevaRespuestaEnComentario'), mensaje: 'Carlos Mendoza respondió a tu comentario en Analytics Dashboard', fecha: '2026-02-02', leida: false },
      { id: 4, tipo: 'info', titulo: t('preview.nuevoMóduloDisponible'), mensaje: 'El módulo Advanced Analytics with Python ya está disponible', fecha: '2026-02-01', leida: true },
    ],
    proximos_eventos: [
      { id: 1, titulo: 'Sprint Planning - Q1 Sprint 4', tipo: 'meeting', fecha: '2026-02-04', hora: '10:00 AM', duracion: '90 min', asistentes: 8 },
      { id: 2, titulo: t('preview.boardMeetingPresentation'), tipo: 'presentation', fecha: '2026-02-07', hora: '2:00 PM', duracion: '60 min', asistentes: 5 },
      { id: 3, titulo: '1:1 con CEO - Strategy Review', tipo: 'one_on_one', fecha: '2026-02-08', hora: '11:00 AM', duracion: '45 min', asistentes: 2 },
    ],
  };
}
