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

export type ContextoCoreaData = z.infer<typeof contextoCoreaSchema>;
export type ValidacionData = z.infer<typeof validacionSchema>;
export type OperacionData = z.infer<typeof operacionSchema>;
export type OnboardingData = ValidacionData | OperacionData;

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
  { id: 'problema', title: 'Problema', icon: '⚠️', description: 'El problema que resuelves' },
  { id: 'cliente', title: 'Cliente', icon: '🎯', description: 'Tu cliente objetivo' },
  { id: 'solucion', title: 'Solución', icon: '💡', description: 'Tu propuesta de valor' },
  { id: 'hipotesis', title: 'Hipótesis', icon: '🧪', description: 'Lo que necesitas validar' },
  { id: 'corea-espana', title: 'Corea → España', icon: '✈️', description: 'Plan de validación internacional' },
  { id: 'metricas', title: 'Métricas', icon: '📊', description: 'Cómo medir el éxito' },
  { id: 'recursos', title: 'Recursos', icon: '👥', description: 'Con qué cuentas' },
];

export const OPERACION_STEPS: OnboardingStep[] = [
  { id: 'canvas1', title: 'Canvas I', icon: '📋', description: 'Propuesta y clientes' },
  { id: 'canvas2', title: 'Canvas II', icon: '📋', description: 'Ingresos y recursos' },
  { id: 'finanzas', title: 'Finanzas', icon: '💰', description: 'Situación financiera' },
  { id: 'clientes', title: 'Clientes', icon: '🏢', description: 'Cartera actual' },
  { id: 'objetivos', title: 'Objetivos', icon: '🚀', description: 'Metas del trimestre' },
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
