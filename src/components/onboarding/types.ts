import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const validacionSchema = z.object({
  tipo: z.literal('validacion'),
  problema: z.string().min(10, 'Describe el problema con al menos 10 caracteres'),
  cliente_objetivo: z.string().min(10, 'Describe tu cliente objetivo'),
  solucion_propuesta: z.string().min(10, 'Describe tu solución propuesta'),
  hipotesis: z.array(z.string().min(5, 'Cada hipótesis debe tener al menos 5 caracteres')).min(1, 'Añade al menos una hipótesis'),
  metricas_exito: z.string().min(10, 'Define métricas de éxito'),
  recursos_disponibles: z.string().min(5, 'Lista tus recursos'),
  limitaciones: z.string().optional(),
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
export const defaultValidacionData: ValidacionData = {
  tipo: 'validacion',
  problema: '',
  cliente_objetivo: '',
  solucion_propuesta: '',
  hipotesis: [''],
  metricas_exito: '',
  recursos_disponibles: '',
  limitaciones: '',
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
