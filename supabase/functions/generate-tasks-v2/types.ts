// Types for generate-tasks-v2 edge function

export interface Project {
  id: string;
  nombre: string;
  descripcion: string | null;
  fase: string;
  tipo: string;
  onboarding_data: OnboardingData | null;
  project_state?: 'idea' | 'validacion_temprana' | 'traccion' | 'consolidado' | null;
}

export interface OnboardingData {
  problema?: string;
  problema_resuelve?: string;
  cliente_objetivo?: string;
  solucion_propuesta?: string;
  solucion?: string;
  hipotesis?: string[];
  metricas_exito?: string;
}

export interface TeamMember {
  member_id: string;
  role: string;
  role_responsibilities: string | null;
  profiles: {
    id: string;
    nombre: string;
    email: string;
    especialization: string | null;
  };
}

export interface EnrichedTeamMember {
  member_id: string;
  nombre: string;
  email: string;
  role: string;
  roleLabel: string;
  especialization: string | null;
  role_responsibilities: string | null;
  obvs_validadas_mes: number;
  tareas_completadas_mes: number;
}

export interface OBV {
  tipo: string;
  titulo: string;
  status: string;
  facturacion?: number | null;
  fecha?: string | null;
}

export interface Lead {
  nombre: string;
  empresa: string | null;
  status: string;
}

export interface Task {
  titulo: string;
  status: string;
  assignee_id?: string | null;
  completed_at?: string | null;
}

export interface ProjectContext {
  project: {
    nombre: string;
    descripcion: string;
    fase: string;
    tipo: string;
    project_state?: 'idea' | 'validacion_temprana' | 'traccion' | 'consolidado' | null;
  };
  onboarding: {
    problema: string;
    cliente_objetivo: string;
    solucion: string;
    hipotesis: string;
    metricas: string;
  };
  team: EnrichedTeamMember[];
  metrics: {
    obvs_total: number;
    obvs_validadas: number;
    obvs_pendientes: number;
    leads_total: number;
    leads_calientes: number;
    tareas_pendientes: number;
    tareas_completadas: number;
  };
  history: {
    ultimas_obvs: Array<{ tipo: string; titulo: string }>;
    ultimos_leads: Array<{ nombre: string; empresa: string; status: string }>;
  };
}
