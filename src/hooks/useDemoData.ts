import { useDemoMode } from '@/contexts/DemoModeContext';
import {
  getDemoData,
  DEMO_MEMBERS,
  DEMO_PROJECTS,
  DEMO_OBVS,
  DEMO_TASKS,
  DEMO_LEADS,
  DEMO_VALIDATIONS,
  DEMO_NOTIFICATIONS,
  DEMO_FINANCIAL,
  DEMO_KPIS,
  DEMO_RANKINGS,
  DEMO_ACTIVITY,
  DEMO_MASTERS,
  type DemoDataSection,
} from '@/data/demoData';

export function useDemoData<T>(section: DemoDataSection, realData: T): T {
  const { isDemoMode } = useDemoMode();
  
  if (!isDemoMode) {
    return realData;
  }
  
  const demoData = getDemoData(section);
  return (demoData as T) ?? realData;
}

// Hook específico para miembros
export function useDemoMembers<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_MEMBERS as unknown as T[]) : realData;
}

// Hook específico para proyectos
export function useDemoProjects<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_PROJECTS as unknown as T[]) : realData;
}

// Hook específico para OBVs
export function useDemoOBVs<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_OBVS as unknown as T[]) : realData;
}

// Hook específico para tareas
export function useDemoTasks<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_TASKS as unknown as T[]) : realData;
}

// Hook específico para leads
export function useDemoLeads<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_LEADS as unknown as T[]) : realData;
}

// Hook específico para validaciones
export function useDemoValidations<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_VALIDATIONS as unknown as T[]) : realData;
}

// Hook específico para notificaciones
export function useDemoNotifications<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_NOTIFICATIONS as unknown as T[]) : realData;
}

// Hook específico para datos financieros
export function useDemoFinancial() {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? DEMO_FINANCIAL : null;
}

// Hook específico para KPIs
export function useDemoKPIs() {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? DEMO_KPIS : null;
}

// Hook específico para rankings
export function useDemoRankings() {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? DEMO_RANKINGS : null;
}

// Hook específico para actividad reciente
export function useDemoActivity<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_ACTIVITY as unknown as T[]) : realData;
}

// Hook específico para masters
export function useDemoMasters<T>(realData: T[]): T[] {
  const { isDemoMode } = useDemoMode();
  return isDemoMode ? (DEMO_MASTERS as unknown as T[]) : realData;
}

// Hook para verificar si está en modo demo
export function useIsDemoMode() {
  const { isDemoMode } = useDemoMode();
  return isDemoMode;
}
