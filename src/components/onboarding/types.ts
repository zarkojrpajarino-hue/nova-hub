import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Contexto Corea → España para validación internacional
export const contextoCoreaSchema = z.object({
  que_validar_desde_corea: z.array(z.object({
    item: z.string(),
    checked: z.boolean().default(false),
  })).default([
    { item: 'Entrevistas con clientes potenciales', checked: false },
    { item: 'Tests de pricing', checked: false },
    { item: 'Validación de propuesta de valor', checked: false },
    { item: 'Feedback de prototipo/MVP', checked: false },
    { item: 'Investigación de competencia local', checked: false },
    { item: 'Networking con stakeholders', checked: false },
  ]),
  
  hipotesis_mes: z.array(z.object({
    mes: z.number().min(1).max(3),
    hipotesis: z.string(),
    metrica_exito: z.string(),
  })).max(3).default([
    { mes: 1, hipotesis: '', metrica_exito: '' },
    { mes: 2, hipotesis: '', metrica_exito: '' },
    { mes: 3, hipotesis: '', metrica_exito: '' },
  ]),
  
  plan_espana: z.object({
    que_tener_listo: z.string().default(''),
    mercado_objetivo: z.string().default(''),
    aprendizajes_aplicar: z.string().default(''),
    primeros_pasos: z.string().default(''),
  }),
});

export const validacionSchema = z.object({
  tipo: z.literal('validacion'),
  problema: z.string().min(10, 'Describe el problema con al menos 10 caracteres'),
  cliente_objetivo: z.string().min(10, 'Describe tu cliente objetivo'),
  solucion_propuesta: z.string().min(10, 'Describe tu solución propuesta'),
  hipotesis: z.array(z.string().min(5, 'Cada hipótesis debe tener al menos 5 caracteres')).min(1, 'Añade al menos una hipótesis'),
  metricas_exito: z.string().min(10, 'Define métricas de éxito'),
  recursos_disponibles: z.string().min(5, 'Lista tus recursos'),
  limitaciones: z.string().optional(),
  // Contexto internacional Corea → España
  contexto_corea: contextoCoreaSchema.optional(),
});

export const operacionSchema = z.object({
  tipo: z.literal('operacion'),
  modelo_negocio: z.object({
    propuesta_valor: z.string().min(10, 'Requerido'),
    segmento_clientes: z.string().min(10, 'Requerido'),
    canales: z.string().min(5, 'Requerido'),
    relacion_clientes: z.string().optional(),
    fuentes_ingresos: z.string().min(5, 'Requerido'),
    recursos_clave: z.string().optional(),
    actividades_clave: z.string().optional(),
    socios_clave: z.string().optional(),
    estructura_costes: z.string().optional(),
  }),
  facturacion_actual: z.number().min(0),
  pipeline_valor: z.number().min(0),
  clientes_actuales: z.string().optional(),
  equipo_roles: z.string().optional(),
  objetivos_q1: z.string().min(10, 'Define al menos un objetivo'),
});

// ============================================
// STATE-BASED ONBOARDING SCHEMAS (NEW)
// ============================================

// IDEA STATE - For projects in exploration phase
export const ideaSchema = z.object({
  state: z.literal('idea'),
  problema: z.string().min(10, 'Requerido (min 10 caracteres)'),
  quien_problema: z.string().min(10, 'Requerido'),
  impacto_problema: z.string().min(10, 'Requerido'),
  solucion: z.string().min(10, 'Requerido'),
  propuesta_valor: z.string().min(10, 'Requerido'),
  alternativas_actuales: z.string().optional(),
  hipotesis_validar: z.array(z.string().min(5)).min(1, 'Al menos una hipótesis'),
  primeros_pasos: z.string().min(10, 'Requerido'),
  metrica_exito: z.string().min(10, 'Requerido'),
  recursos: z.string().optional(),
  bloqueadores: z.string().optional(),
});

// VALIDACIÓN TEMPRANA STATE - First customers, early revenue
export const validacionTempranaSchema = z.object({
  state: z.literal('validacion_temprana'),
  num_clientes: z.number().min(1, 'Requerido'),
  mrr_actual: z.number().min(0, 'Requerido'),
  problema_resuelto: z.string().min(10, 'Requerido'),
  cliente_tipico: z.string().min(10, 'Requerido'),
  feedback_positivo: z.string().min(10, 'Requerido'),
  feedback_negativo: z.string().min(10, 'Requerido'),
  tasa_retencion: z.string().optional(),
  como_llegaron: z.string().min(10, 'Requerido'),
  tiempo_venta: z.string().min(3, 'Requerido'),
  metricas_seguimiento: z.string().min(10, 'Requerido'),
  bloqueadores_crecimiento: z.string().optional(),
  objetivo_clientes: z.number().min(1, 'Requerido'),
  objetivo_mrr: z.number().min(0, 'Requerido'),
  prioridades: z.string().min(10, 'Requerido'),
  necesidades_equipo: z.string().optional(),
});

// TRACCIÓN STATE - Growing business (10-100 customers, €1-10k/month)
export const traccionSchema = z.object({
  state: z.literal('traccion'),
  num_clientes: z.number().min(10, 'Requerido'),
  mrr: z.number().min(1000, 'Requerido'),
  crecimiento_mom: z.number().min(0, 'Requerido'),
  cac: z.number().min(0, 'Requerido'),
  ltv: z.number().min(0, 'Requerido'),
  churn_rate: z.number().min(0, 'Requerido'),
  ticket_promedio: z.number().min(0, 'Requerido'),
  canales_principales: z.string().min(10, 'Requerido'),
  conversion_rate: z.string().min(3, 'Requerido'),
  estrategia_retencion: z.string().min(10, 'Requerido'),
  competencia: z.string().optional(),
  tamano_equipo: z.number().min(1, 'Requerido'),
  roles_equipo: z.string().min(10, 'Requerido'),
  burn_rate: z.number().min(0, 'Requerido'),
  runway: z.number().optional(),
  procesos_clave: z.string().optional(),
  objetivo_mrr: z.number().min(0, 'Requerido'),
  objetivo_clientes: z.number().min(0, 'Requerido'),
  prioridades: z.string().min(10, 'Requerido'),
  retos_principales: z.string().min(10, 'Requerido'),
  fundraising: z.string().optional(),
});

// CONSOLIDADO STATE - Established business (100+ customers, €10k+/month)
export const consolidadoSchema = z.object({
  state: z.literal('consolidado'),
  num_clientes: z.number().min(100, 'Requerido'),
  arr: z.number().min(120000, 'Requerido (mín €120k ARR)'),
  yoy_growth: z.number().min(0, 'Requerido'),
  gross_margin: z.number().min(0).max(100, 'Entre 0-100%'),
  net_revenue_retention: z.number().min(0, 'Requerido'),
  profitability: z.string().min(5, 'Requerido'),
  tamano_equipo: z.number().min(5, 'Requerido'),
  estructura_equipos: z.string().min(10, 'Requerido'),
  cultura_valores: z.string().min(10, 'Requerido'),
  retos_equipo: z.string().optional(),
  segmentos_principales: z.string().min(10, 'Requerido'),
  canales_adquisicion: z.string().min(10, 'Requerido'),
  roadmap_producto: z.string().min(10, 'Requerido'),
  diferenciacion: z.string().optional(),
  objetivo_arr: z.number().min(0, 'Requerido'),
  objetivo_equipo: z.number().min(0, 'Requerido'),
  iniciativas_estrategicas: z.string().min(10, 'Requerido'),
  riesgos: z.string().min(10, 'Requerido'),
  fundraising_status: z.string().min(5, 'Requerido'),
  vision_largo_plazo: z.string().optional(),
});

// Type exports for state-based onboarding
export type IdeaData = z.infer<typeof ideaSchema>;
export type ValidacionTempranaData = z.infer<typeof validacionTempranaSchema>;
export type TraccionData = z.infer<typeof traccionSchema>;
export type ConsolidadoData = z.infer<typeof consolidadoSchema>;

export type StateBasedOnboardingData =
  | IdeaData
  | ValidacionTempranaData
  | TraccionData
  | ConsolidadoData;

// Legacy exports (still used for existing projects)
export type ContextoCoreaData = z.infer<typeof contextoCoreaSchema>;
export type ValidacionData = z.infer<typeof validacionSchema>;
export type OperacionData = z.infer<typeof operacionSchema>;
export type OnboardingData = ValidacionData | OperacionData | StateBasedOnboardingData;

// ============================================
// STEP DEFINITIONS
// ============================================

export interface OnboardingStep {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export const VALIDACION_STEPS: OnboardingStep[] = [
  { id: 'equipo', title: 'Equipo', icon: '👥', description: 'Selecciona tu equipo' },
  { id: 'problema', title: 'Problema', icon: '⚠️', description: 'El problema que resuelves' },
  { id: 'cliente', title: 'Cliente', icon: '🎯', description: 'Tu cliente objetivo' },
  { id: 'solucion', title: 'Solución', icon: '💡', description: 'Tu propuesta de valor' },
  { id: 'hipotesis', title: 'Hipótesis', icon: '🧪', description: 'Lo que necesitas validar' },
  { id: 'corea-espana', title: 'Corea → España', icon: '✈️', description: 'Plan de validación internacional' },
  { id: 'metricas', title: 'Métricas', icon: '📊', description: 'Cómo medir el éxito' },
  { id: 'recursos', title: 'Recursos', icon: '👥', description: 'Con qué cuentas' },
];

export const OPERACION_STEPS: OnboardingStep[] = [
  { id: 'equipo', title: 'Equipo', icon: '👥', description: 'Selecciona tu equipo' },
  { id: 'canvas1', title: 'Canvas I', icon: '📋', description: 'Propuesta y clientes' },
  { id: 'canvas2', title: 'Canvas II', icon: '📋', description: 'Ingresos y recursos' },
  { id: 'finanzas', title: 'Finanzas', icon: '💰', description: 'Situación financiera' },
  { id: 'clientes', title: 'Clientes', icon: '🏢', description: 'Cartera actual' },
  { id: 'objetivos', title: 'Objetivos', icon: '🚀', description: 'Metas del trimestre' },
];

// ============================================
// STATE-BASED ONBOARDING STEPS (NEW)
// ============================================

export const IDEA_STEPS: OnboardingStep[] = [
  { id: 'state', title: 'Estado', icon: '🎯', description: '¿En qué estado está tu proyecto?' },
  { id: 'equipo', title: 'Equipo', icon: '👥', description: 'Selecciona tu equipo' },
  { id: 'problem-discovery', title: 'Problema', icon: '🔍', description: 'Descubrimiento del problema' },
  { id: 'solution-hypothesis', title: 'Solución', icon: '💡', description: 'Hipótesis de solución' },
  { id: 'hypotheses', title: 'Hipótesis', icon: '🧪', description: 'Qué validar' },
  { id: 'validation-plan', title: 'Plan', icon: '📋', description: 'Plan de validación' },
];

export const VALIDACION_TEMPRANA_STEPS: OnboardingStep[] = [
  { id: 'state', title: 'Estado', icon: '🎯', description: '¿En qué estado está tu proyecto?' },
  { id: 'equipo', title: 'Equipo', icon: '👥', description: 'Selecciona tu equipo' },
  { id: 'current-status', title: 'Estado Actual', icon: '📊', description: 'Tracción inicial' },
  { id: 'feedback', title: 'Feedback', icon: '💬', description: 'Aprendizajes' },
  { id: 'pmf', title: 'PMF', icon: '🎯', description: 'Product-market fit' },
  { id: 'next-steps', title: 'Próximos Pasos', icon: '🚀', description: 'Objetivos' },
];

export const TRACCION_STEPS: OnboardingStep[] = [
  { id: 'state', title: 'Estado', icon: '🎯', description: '¿En qué estado está tu proyecto?' },
  { id: 'equipo', title: 'Equipo', icon: '👥', description: 'Selecciona tu equipo' },
  { id: 'key-metrics', title: 'Métricas', icon: '📈', description: 'KPIs del negocio' },
  { id: 'growth-engine', title: 'Crecimiento', icon: '🚀', description: 'Motor de crecimiento' },
  { id: 'operations', title: 'Operaciones', icon: '⚙️', description: 'Equipo y procesos' },
  { id: 'growth-plan', title: 'Plan', icon: '🎯', description: 'Objetivos 6-12 meses' },
];

export const CONSOLIDADO_STEPS: OnboardingStep[] = [
  { id: 'state', title: 'Estado', icon: '🎯', description: '¿En qué estado está tu proyecto?' },
  { id: 'equipo', title: 'Equipo', icon: '👥', description: 'Selecciona tu equipo' },
  { id: 'business-metrics', title: 'Métricas', icon: '💼', description: 'Estado del negocio' },
  { id: 'team-org', title: 'Equipo', icon: '👥', description: 'Organización' },
  { id: 'gtm-product', title: 'GTM', icon: '🎯', description: 'Go-to-Market' },
  { id: 'strategic', title: 'Estrategia', icon: '🚀', description: 'Visión 12-24 meses' },
];

// Default values
export const defaultContextoCorea: ContextoCoreaData = {
  que_validar_desde_corea: [
    { item: 'Entrevistas con clientes potenciales', checked: false },
    { item: 'Tests de pricing', checked: false },
    { item: 'Validación de propuesta de valor', checked: false },
    { item: 'Feedback de prototipo/MVP', checked: false },
    { item: 'Investigación de competencia local', checked: false },
    { item: 'Networking con stakeholders', checked: false },
  ],
  hipotesis_mes: [
    { mes: 1, hipotesis: '', metrica_exito: '' },
    { mes: 2, hipotesis: '', metrica_exito: '' },
    { mes: 3, hipotesis: '', metrica_exito: '' },
  ],
  plan_espana: {
    que_tener_listo: '',
    mercado_objetivo: '',
    aprendizajes_aplicar: '',
    primeros_pasos: '',
  },
};

export const defaultValidacionData: ValidacionData = {
  tipo: 'validacion',
  problema: '',
  cliente_objetivo: '',
  solucion_propuesta: '',
  hipotesis: [''],
  metricas_exito: '',
  recursos_disponibles: '',
  limitaciones: '',
  contexto_corea: defaultContextoCorea,
};

export const defaultOperacionData: OperacionData = {
  tipo: 'operacion',
  modelo_negocio: {
    propuesta_valor: '',
    segmento_clientes: '',
    canales: '',
    relacion_clientes: '',
    fuentes_ingresos: '',
    recursos_clave: '',
    actividades_clave: '',
    socios_clave: '',
    estructura_costes: '',
  },
  facturacion_actual: 0,
  pipeline_valor: 0,
  clientes_actuales: '',
  equipo_roles: '',
  objetivos_q1: '',
};

// ============================================
// STATE-BASED DEFAULT DATA (NEW)
// ============================================

export const defaultIdeaData: IdeaData = {
  state: 'idea',
  problema: '',
  quien_problema: '',
  impacto_problema: '',
  solucion: '',
  propuesta_valor: '',
  alternativas_actuales: '',
  hipotesis_validar: [''],
  primeros_pasos: '',
  metrica_exito: '',
  recursos: '',
  bloqueadores: '',
};

export const defaultValidacionTempranaData: ValidacionTempranaData = {
  state: 'validacion_temprana',
  num_clientes: 0,
  mrr_actual: 0,
  problema_resuelto: '',
  cliente_tipico: '',
  feedback_positivo: '',
  feedback_negativo: '',
  tasa_retencion: '',
  como_llegaron: '',
  tiempo_venta: '',
  metricas_seguimiento: '',
  bloqueadores_crecimiento: '',
  objetivo_clientes: 0,
  objetivo_mrr: 0,
  prioridades: '',
  necesidades_equipo: '',
};

export const defaultTraccionData: TraccionData = {
  state: 'traccion',
  num_clientes: 0,
  mrr: 0,
  crecimiento_mom: 0,
  cac: 0,
  ltv: 0,
  churn_rate: 0,
  ticket_promedio: 0,
  canales_principales: '',
  conversion_rate: '',
  estrategia_retencion: '',
  competencia: '',
  tamano_equipo: 0,
  roles_equipo: '',
  burn_rate: 0,
  runway: 0,
  procesos_clave: '',
  objetivo_mrr: 0,
  objetivo_clientes: 0,
  prioridades: '',
  retos_principales: '',
  fundraising: '',
};

export const defaultConsolidadoData: ConsolidadoData = {
  state: 'consolidado',
  num_clientes: 0,
  arr: 0,
  yoy_growth: 0,
  gross_margin: 0,
  net_revenue_retention: 0,
  profitability: '',
  tamano_equipo: 0,
  estructura_equipos: '',
  cultura_valores: '',
  retos_equipo: '',
  segmentos_principales: '',
  canales_adquisicion: '',
  roadmap_producto: '',
  diferenciacion: '',
  objetivo_arr: 0,
  objetivo_equipo: 0,
  iniciativas_estrategicas: '',
  riesgos: '',
  fundraising_status: '',
  vision_largo_plazo: '',
};
