/**
 * 🎯 EVIDENCE PROFILES - Retrieval Strategy Only
 *
 * Profile define CÓMO buscar evidencias (retrieval strategy)
 * Function define QUÉ verificar (claims + contracts)
 *
 * SEPARACIÓN LIMPIA:
 * - Profile = tierOrder, docTags, queryHints, strictness default
 * - Function = claims, minSources per claim, validation rules
 */

import type { EvidenceTier } from '../types/tiers';
import type { EvidenceMode } from '../types';

export type EvidenceProfileId =
  | 'financial'
  | 'learning'
  | 'crm'
  | 'tasks'
  | 'team'
  | 'coach'
  | 'generic';

/**
 * Evidence Profile - SOLO estrategia de retrieval
 */
export interface EvidenceProfile {
  /** ID único del profile */
  id: EvidenceProfileId;

  /** Nombre descriptivo */
  name: string;

  /** Descripción del dominio */
  description: string;

  // =====================================================
  // RETRIEVAL STRATEGY
  // =====================================================

  /**
   * Orden de prioridad de tiers para búsqueda
   * Orden importa: primero busca en el tier[0], luego tier[1], etc.
   */
  tierOrder: EvidenceTier[];

  /**
   * Tags preferidos de documentos (MVP)
   * Cuando el usuario sube un doc, puede taggearlo manualmente
   * Este profile buscará primero en docs con estos tags
   */
  preferredDocTags: string[];

  /**
   * Query hints para mejorar búsqueda
   * Keywords + sinónimos que ayudan a retrieval
   */
  queryHints: {
    /** Keywords principales del dominio */
    keywords: string[];

    /** Sinónimos para expansión de queries */
    synonyms?: Record<string, string[]>;
  };

  // =====================================================
  // DEFAULTS DE UX
  // =====================================================

  /**
   * Modo de evidencia por defecto
   * Usuario puede cambiar en el modal
   */
  strictnessDefault: EvidenceMode;

  /**
   * Número mínimo de fuentes OVERALL para todo el reporte
   * (Cada claim individual puede requerir más en function config)
   */
  minSourcesOverall: number;

  /**
   * Coverage mínimo recomendado (%)
   * Solo informativo, no blocking
   */
  recommendedCoverage?: number;
}

// =====================================================
// PROFILE DEFINITIONS
// =====================================================

/**
 * 📊 FINANCIAL PROFILE
 * Dominio: Análisis financiero, proyecciones, business model
 *
 * NOTA: También usado para geo-intelligence (market data, costs, competitors)
 * ⚠️ VALIDAR: Para ciudades pequeñas puede fallar en official_apis
 * → Asegurar graceful degradation a hypothesis mode
 */
const FINANCIAL_PROFILE: EvidenceProfile = {
  id: 'financial',
  name: 'Financial Analysis',
  description: 'Optimizado para proyecciones financieras, business model canvas, análisis de costes',

  // Retrieval: Primero docs usuario, luego APIs oficiales, luego data interna
  tierOrder: ['user_docs', 'official_apis', 'internal_data'],

  // Tags preferidos
  preferredDocTags: [
    'finanzas',
    'finance',
    'budget',
    'presupuesto',
    'revenue',
    'ingresos',
    'costes',
    'costs',
    'balance',
  ],

  // Query hints
  queryHints: {
    keywords: [
      'revenue',
      'cost',
      'profit',
      'margin',
      'budget',
      'expense',
      'income',
      'cash flow',
      'ROI',
      'EBITDA',
    ],
    synonyms: {
      'revenue': ['ingresos', 'ventas', 'sales', 'income'],
      'cost': ['coste', 'gasto', 'expense'],
      'profit': ['beneficio', 'ganancia', 'earnings'],
      'budget': ['presupuesto', 'plan financiero'],
    },
  },

  // Defaults
  strictnessDefault: 'strict', // Finanzas requieren alta precisión
  minSourcesOverall: 3,
  recommendedCoverage: 80,
};

/**
 * 🎓 LEARNING PROFILE
 * Dominio: Learning paths, skill development, training
 */
const LEARNING_PROFILE: EvidenceProfile = {
  id: 'learning',
  name: 'Learning & Development',
  description: 'Optimizado para rutas de aprendizaje, desarrollo de skills, training plans',

  // Retrieval: APIs educativas first, luego web/news, luego docs usuario
  tierOrder: ['official_apis', 'web_news', 'user_docs'],

  preferredDocTags: [
    'training',
    'learning',
    'skill',
    'course',
    'education',
    'certificación',
    'formación',
  ],

  queryHints: {
    keywords: [
      'skill',
      'learn',
      'training',
      'development',
      'competency',
      'certification',
      'course',
      'education',
    ],
    synonyms: {
      'skill': ['habilidad', 'competencia', 'capability'],
      'learn': ['aprender', 'study', 'training'],
      'course': ['curso', 'formación', 'training program'],
    },
  },

  strictnessDefault: 'balanced',
  minSourcesOverall: 2,
  recommendedCoverage: 60,
};

/**
 * 👥 CRM PROFILE
 * Dominio: Customer intelligence, lead generation, sales
 */
const CRM_PROFILE: EvidenceProfile = {
  id: 'crm',
  name: 'Customer Intelligence',
  description: 'Optimizado para email pitches, lead generation, análisis de clientes y competidores',

  // Retrieval: Docs usuario, APIs, data interna
  tierOrder: ['user_docs', 'official_apis', 'internal_data'],

  preferredDocTags: [
    'customers',
    'clientes',
    'sales',
    'ventas',
    'leads',
    'prospects',
    'competitors',
    'competencia',
    'market',
    'mercado',
  ],

  queryHints: {
    keywords: [
      'customer',
      'lead',
      'prospect',
      'competitor',
      'market',
      'sales',
      'pitch',
      'pain point',
      'value proposition',
    ],
    synonyms: {
      'customer': ['cliente', 'buyer', 'purchaser'],
      'lead': ['prospecto', 'potential customer'],
      'competitor': ['competidor', 'rival', 'competencia'],
    },
  },

  strictnessDefault: 'balanced',
  minSourcesOverall: 2,
  recommendedCoverage: 65,
};

/**
 * ✅ TASKS PROFILE
 * Dominio: Task generation, routing, priorización
 *
 * NOTA IMPORTANTE: Este profile es ULTRA-LIVIANO porque:
 * - Las tareas son decisiones internas basadas en contexto del proyecto
 * - NO necesitamos evidencia externa en modo normal
 * - Solo buscar si el usuario pide strict O si hay claim factual específico
 */
const TASKS_PROFILE: EvidenceProfile = {
  id: 'tasks',
  name: 'Task Management',
  description: 'Optimizado para generación de tareas, routing, priorización (contexto interno)',

  // Retrieval: SOLO data interna. No buscar en APIs/web a menos que strict
  tierOrder: ['internal_data', 'user_docs'],

  preferredDocTags: [
    'project',
    'proyecto',
    'tasks',
    'tareas',
    'workflow',
    'process',
    'roadmap',
  ],

  queryHints: {
    keywords: [
      'task',
      'project',
      'deadline',
      'priority',
      'milestone',
      'deliverable',
      'sprint',
    ],
    synonyms: {
      'task': ['tarea', 'todo', 'action item'],
      'project': ['proyecto', 'initiative'],
      'deadline': ['fecha límite', 'due date'],
    },
  },

  strictnessDefault: 'hypothesis', // Default = NO buscar evidencia externa
  minSourcesOverall: 0, // NO forzar búsqueda en modo hypothesis/balanced
  recommendedCoverage: 30, // Reducido porque es contexto interno
};

/**
 * 🤝 TEAM PROFILE
 * Dominio: Team optimization, 1-on-1s, scheduling
 */
const TEAM_PROFILE: EvidenceProfile = {
  id: 'team',
  name: 'Team Optimization',
  description: 'Optimizado para 1-on-1s, scheduling, team performance',

  // Retrieval: Data interna, docs, APIs
  tierOrder: ['internal_data', 'user_docs', 'official_apis'],

  preferredDocTags: [
    'team',
    'equipo',
    'performance',
    'feedback',
    '1on1',
    'review',
    'evaluación',
  ],

  queryHints: {
    keywords: [
      'team',
      'member',
      'performance',
      'feedback',
      '1-on-1',
      'availability',
      'schedule',
    ],
    synonyms: {
      'team': ['equipo', 'group'],
      'feedback': ['retroalimentación', 'review'],
      'performance': ['rendimiento', 'desempeño'],
    },
  },

  strictnessDefault: 'balanced',
  minSourcesOverall: 2,
  recommendedCoverage: 55,
};

/**
 * 🎯 COACH PROFILE
 * Dominio: Mentoring, coaching, AI advisor
 */
const COACH_PROFILE: EvidenceProfile = {
  id: 'coach',
  name: 'Mentoring & Coaching',
  description: 'Optimizado para mentoring, coaching conversations, AI advisor',

  // Retrieval: Data usuario, APIs (best practices), web
  tierOrder: ['internal_data', 'official_apis', 'web_news'],

  preferredDocTags: [
    'goals',
    'objetivos',
    'feedback',
    'development',
    'desarrollo',
    'coaching',
  ],

  queryHints: {
    keywords: [
      'goal',
      'challenge',
      'growth',
      'feedback',
      'improvement',
      'development',
      'best practice',
    ],
    synonyms: {
      'goal': ['objetivo', 'target', 'aim'],
      'challenge': ['desafío', 'problem', 'obstacle'],
      'growth': ['crecimiento', 'development'],
    },
  },

  strictnessDefault: 'balanced',
  minSourcesOverall: 1,
  recommendedCoverage: 50,
};

/**
 * 🔧 GENERIC PROFILE
 * Fallback para features sin profile específico
 */
const GENERIC_PROFILE: EvidenceProfile = {
  id: 'generic',
  name: 'Generic Analysis',
  description: 'Profile genérico para cualquier tipo de feature',

  tierOrder: ['user_docs', 'official_apis', 'internal_data', 'web_news'],
  preferredDocTags: [],

  queryHints: {
    keywords: [],
  },

  strictnessDefault: 'balanced',
  minSourcesOverall: 2,
  recommendedCoverage: 60,
};

// =====================================================
// EXPORTS
// =====================================================

/**
 * Map de todos los profiles
 */
export const EVIDENCE_PROFILES: Record<EvidenceProfileId, EvidenceProfile> = {
  financial: FINANCIAL_PROFILE,
  learning: LEARNING_PROFILE,
  crm: CRM_PROFILE,
  tasks: TASKS_PROFILE,
  team: TEAM_PROFILE,
  coach: COACH_PROFILE,
  generic: GENERIC_PROFILE,
};

/**
 * Get profile by ID
 */
export function getEvidenceProfile(id: EvidenceProfileId): EvidenceProfile {
  return EVIDENCE_PROFILES[id] || GENERIC_PROFILE;
}

/**
 * Infer profile from function name
 * Auto-detección inteligente basada en keywords
 */
export function inferProfileFromFunction(functionName: string): EvidenceProfileId {
  const name = functionName.toLowerCase();

  // Financial
  if (name.includes('financial') || name.includes('projection') ||
      name.includes('revenue') || name.includes('business-model') ||
      name.includes('budget') || name.includes('cost')) {
    return 'financial';
  }

  // Learning
  if (name.includes('learning') || name.includes('skill') ||
      name.includes('training') || name.includes('course') ||
      name.includes('path') || name.includes('development')) {
    return 'learning';
  }

  // CRM
  if (name.includes('email') || name.includes('pitch') ||
      name.includes('lead') || name.includes('customer') ||
      name.includes('competitor') || name.includes('crm')) {
    return 'crm';
  }

  // Tasks
  if (name.includes('task') || name.includes('todo') ||
      name.includes('project-plan')) {
    return 'tasks';
  }

  // Team
  if (name.includes('team') || name.includes('1on1') ||
      name.includes('schedule') || name.includes('meeting') ||
      name.includes('performance')) {
    return 'team';
  }

  // Coach
  if (name.includes('mentor') || name.includes('coach') ||
      name.includes('advisor') || name.includes('guidance')) {
    return 'coach';
  }

  return 'generic';
}
