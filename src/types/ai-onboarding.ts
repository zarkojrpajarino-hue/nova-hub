/**
 * TYPES FOR AI-POWERED ONBOARDING
 */

export type ProjectPhase = 'idea' | 'problema_validado' | 'solucion_validada' | 'mvp' | 'traccion' | 'crecimiento';

export type ContextType = 'own_business' | 'competitor' | 'reference';

export interface BusinessInfo {
  nombre_sugerido?: string;
  descripcion?: string;
  industria?: string;
  problema_detectado?: string;
  solucion_propuesta?: string;
  publico_objetivo?: string;
  propuesta_valor?: string;
  canales_distribucion?: string[];
  competidores?: string[];
  tecnologias?: string[];
  modelo_negocio?: string;
  fase_sugerida?: ProjectPhase;
  insights?: string[];
}

export interface ExtractBusinessInfoRequest {
  url: string;
  project_phase: ProjectPhase;
  context_type: ContextType;
}

export interface ExtractBusinessInfoResponse {
  success: boolean;
  data?: BusinessInfo;
  ai_used?: boolean;
  source_url?: string;
  error?: string;
}

export interface AIOnboardingState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  data?: BusinessInfo;
  error?: string;
  sourceUrl?: string;
}

// Configuración de preguntas adaptativas por fase
export const ADAPTIVE_QUESTIONS: Record<ProjectPhase, {
  urlLabel: string;
  urlPlaceholder: string;
  urlHint: string;
  contextOptions: Array<{ value: ContextType; label: string; description: string }>;
}> = {
  idea: {
    urlLabel: '¿Tienes un negocio de referencia?',
    urlPlaceholder: 'https://ejemplo-referente.com',
    urlHint: 'Pega la URL de un negocio similar al que quieres crear. La IA analizará su modelo.',
    contextOptions: [
      {
        value: 'reference',
        label: 'Negocio referente',
        description: 'Un negocio que te inspira o quieres emular',
      },
      {
        value: 'competitor',
        label: 'Competidor potencial',
        description: 'Un competidor que ya existe en el mercado',
      },
    ],
  },
  problema_validado: {
    urlLabel: '¿Ya tienes algo publicado?',
    urlPlaceholder: 'https://tu-landing.com',
    urlHint: 'Si tienes landing page, encuesta o contenido publicado, pega la URL.',
    contextOptions: [
      {
        value: 'own_business',
        label: 'Mi landing/contenido',
        description: 'Material que ya has creado',
      },
      {
        value: 'reference',
        label: 'Referencia del sector',
        description: 'Ejemplo de cómo otros comunican soluciones similares',
      },
    ],
  },
  solucion_validada: {
    urlLabel: 'URL de tu solución validada',
    urlPlaceholder: 'https://tu-prototipo.com',
    urlHint: 'Pega la URL de tu prototipo, demo o documentación de la solución.',
    contextOptions: [
      {
        value: 'own_business',
        label: 'Mi prototipo/demo',
        description: 'Tu solución validada',
      },
      {
        value: 'competitor',
        label: 'Competidor directo',
        description: 'Para analizar diferenciación',
      },
    ],
  },
  mvp: {
    urlLabel: 'URL de tu MVP',
    urlPlaceholder: 'https://tu-mvp.com',
    urlHint: 'Pega la URL de tu producto mínimo viable.',
    contextOptions: [
      {
        value: 'own_business',
        label: 'Mi MVP',
        description: 'Tu producto actual',
      },
      {
        value: 'competitor',
        label: 'Competidor',
        description: 'Para comparar funcionalidades',
      },
    ],
  },
  traccion: {
    urlLabel: 'URL de tu producto',
    urlPlaceholder: 'https://tu-producto.com',
    urlHint: 'La URL de tu producto en funcionamiento con usuarios.',
    contextOptions: [
      {
        value: 'own_business',
        label: 'Mi producto',
        description: 'Tu producto con tracción',
      },
      {
        value: 'competitor',
        label: 'Competidor establecido',
        description: 'Para análisis competitivo',
      },
    ],
  },
  crecimiento: {
    urlLabel: 'URL de tu empresa',
    urlPlaceholder: 'https://tu-empresa.com',
    urlHint: 'La web oficial de tu empresa.',
    contextOptions: [
      {
        value: 'own_business',
        label: 'Mi empresa',
        description: 'Tu web corporativa',
      },
      {
        value: 'competitor',
        label: 'Líder del mercado',
        description: 'Para benchmark estratégico',
      },
    ],
  },
};
