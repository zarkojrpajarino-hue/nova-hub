/**
 * Meeting type catalog — V5.5.3
 * Extracted from StartMeetingModal.tsx
 */

import type { TFunction } from 'i18next';
import {
  Calendar,
  Users,
  Target,
  Sparkles,
  ChevronRight,
  Brain,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export interface MeetingType {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

export interface DiscussionArea {
  id: string;
  label: string;
}

export function getMeetingTypes(t: TFunction): MeetingType[] {
  return [
    // Planning & Roadmap
    { id: 'sprint_planning', label: t('meetings.sprintPlanning'), description: t('meetings.planificaciónDeSprintY'), icon: Calendar, category: 'planning' },
    { id: 'quarterly_planning', label: 'Quarterly Planning (OKRs)', description: t('meetings.definiciónDeObjetivosTrimestrales'), icon: Target, category: 'planning' },
    { id: 'product_roadmap', label: t('meetings.productRoadmapReview'), description: t('meetings.revisiónYActualizaciónDel'), icon: ChevronRight, category: 'planning' },
    { id: 'feature_prioritization', label: t('meetings.featurePrioritization'), description: t('meetings.priorizaciónDeFuncionalidades'), icon: CheckCircle2, category: 'planning' },
    // Seguimiento & Review
    { id: 'sprint_review', label: t('meetings.sprintReview'), description: t('meetings.revisiónDeResultadosDel'), icon: CheckCircle2, category: 'review' },
    { id: 'weekly_sync', label: t('meetings.weeklySync'), description: t('meetings.sincronizaciónSemanalDelEquipo'), icon: Users, category: 'review' },
    { id: 'obv_status_update', label: t('meetings.obvStatusUpdate'), description: t('meetings.actualizaciónDeEstadoDe'), icon: Target, category: 'review' },
    { id: 'kpi_review', label: t('meetings.kpiReview'), description: t('meetings.revisiónDeMétricasClave'), icon: Target, category: 'review' },
    // Retrospectiva & Mejora
    { id: 'sprint_retrospective', label: t('meetings.sprintRetrospective'), description: t('meetings.reflexiónSobreElSprint'), icon: Brain, category: 'retro' },
    { id: 'post_mortem', label: t('meetings.postmortem'), description: t('meetings.análisisDeIncidenteO'), icon: AlertCircle, category: 'retro' },
    { id: 'process_improvement', label: t('meetings.processImprovement'), description: t('meetings.mejoraDeProcesosDel'), icon: Sparkles, category: 'retro' },
    // Personas & Team
    { id: 'one_on_one', label: t('meetings.oneonone'), description: t('meetings.reuniónIndividualConMiembro'), icon: Users, category: 'people' },
    { id: 'performance_review', label: t('meetings.performanceReview'), description: t('meetings.evaluaciónDeDesempeño'), icon: CheckCircle2, category: 'people' },
    { id: 'team_building', label: t('meetings.teamBuilding'), description: t('meetings.actividadDeConstrucciónDe'), icon: Users, category: 'people' },
    // Cliente & Stakeholders
    { id: 'client_demo', label: t('meetings.clientDemo'), description: t('meetings.demostraciónParaCliente'), icon: Sparkles, category: 'client' },
    { id: 'stakeholder_update', label: t('meetings.stakeholderUpdate'), description: t('meetings.actualizaciónParaStakeholders'), icon: Users, category: 'client' },
    { id: 'sales_pitch', label: t('meetings.salesPitch'), description: t('meetings.presentaciónDeVentas'), icon: Target, category: 'client' },
    { id: 'discovery_call', label: t('meetings.discoveryCall'), description: t('meetings.llamadaDeDescubrimientoCon'), icon: Sparkles, category: 'client' },
    // Urgente & Crisis
    { id: 'emergency_meeting', label: t('meetings.emergencyMeeting'), description: t('meetings.reuniónDeEmergencia'), icon: AlertCircle, category: 'urgent' },
    { id: 'incident_review', label: t('meetings.incidentReview'), description: t('meetings.revisiónDeIncidenteCrítico'), icon: AlertCircle, category: 'urgent' },
    // General
    { id: 'general_meeting', label: t('meetings.reuniónGeneral'), description: t('meetings.reuniónSinCategoríaEspecífica'), icon: Users, category: 'other' },
  ];
}

export function getDiscussionAreas(t: TFunction): DiscussionArea[] {
  return [
    { id: 'product', label: t('meetings.productofeatures') },
    { id: 'marketing', label: t('meetings.marketingventas') },
    { id: 'finance', label: t('meetings.finanzas') },
    { id: 'operations', label: t('meetings.operaciones') },
    { id: 'tech', label: t('meetings.tecnología') },
    { id: 'people', label: 'Personas/HR' },
    { id: 'strategy', label: t('meetings.estrategia') },
  ];
}
