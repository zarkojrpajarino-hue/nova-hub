/**
 * TIPOS EXTENDIDOS DE BASE DE DATOS
 *
 * Este archivo extiende los tipos auto-generados de Supabase
 * con los nuevos campos añadidos en FASE 1 de migraciones.
 *
 * NO editar manualmente los tipos en integrations/supabase/types.ts
 * ya que son auto-generados. En su lugar, usar estos tipos extendidos.
 */

import { Database, Tables, Enums } from '@/integrations/supabase/types';

// =====================================================
// TABLA OBVS EXTENDIDA (con campos de FASE 1)
// =====================================================

export interface OBVRowExtended extends Omit<Tables<'obvs'>, 'Row'> {
  // Campos originales (del tipo auto-generado)
  cantidad: number | null;
  cobrado: boolean | null;
  cobrado_parcial: number | null;
  costes: number | null;
  created_at: string | null;
  descripcion: string | null;
  es_venta: boolean | null;
  estado_cobro: string | null;
  evidence_url: string | null;
  facturacion: number | null;
  fecha: string | null;
  fecha_cobro_esperada: string | null;
  forma_pago: string | null;
  id: string;
  importe_cobrado: number | null;
  iva_importe: number | null;
  iva_porcentaje: number | null;
  lead_id: string | null;
  margen: number | null;
  numero_factura: string | null;
  numero_presupuesto: string | null;
  owner_id: string;
  precio_unitario: number | null;
  producto: string | null;
  project_id: string | null;
  status: Enums<'kpi_status'> | null;
  tipo: Enums<'obv_type'>;
  titulo: string;
  total_factura: number | null;
  updated_at: string | null;
  validated_at: string | null;

  // ✅ FASE 1.1: Campos de Pipeline (unificación con leads)
  nombre_contacto: string | null;
  empresa: string | null;
  email_contacto: string | null;
  telefono_contacto: string | null;
  pipeline_status: Enums<'lead_status'> | null;
  valor_potencial: number | null;
  notas: string | null;
  proxima_accion: string | null;
  proxima_accion_fecha: string | null;
  responsable_id: string | null;

  // ✅ FASE 1.2: Campos de Sistema de Cobros
  cobro_estado: string | null; // 'pendiente' | 'cobrado_parcial' | 'cobrado_total' | 'atrasado'
  cobro_fecha_esperada: string | null;
  cobro_fecha_real: string | null;
  cobro_metodo: string | null; // 'transferencia' | 'tarjeta' | 'efectivo' | 'paypal' | etc

  // ✅ FASE 1.3: Campos de Costes Detallados
  costes_detalle: CostesDetalle | null;
}

// Tipo para el desglose de costes (JSONB)
export interface CostesDetalle {
  materiales?: number;
  subcontratacion?: number;
  herramientas?: number;
  marketing?: number;
  logistica?: number;
  comisiones?: number;
  otros?: number;
}

// Tipos para Insert y Update
export type OBVInsertExtended = Partial<Omit<OBVRowExtended, 'id' | 'created_at'>> & {
  owner_id: string;
  tipo: Enums<'obv_type'>;
  titulo: string;
};

export type OBVUpdateExtended = Partial<OBVRowExtended>;

// =====================================================
// NUEVAS TABLAS (FASE 1)
// =====================================================

// Tabla cobros_parciales (FASE 1.2)
export interface CobroParcial {
  id: string;
  obv_id: string;
  monto: number;
  fecha_cobro: string;
  metodo: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
}

export type CobroParcialInsert = Omit<CobroParcial, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// Tabla obv_pipeline_history (FASE 1.1)
export interface OBVPipelineHistory {
  id: string;
  obv_id: string;
  old_status: Enums<'lead_status'> | null;
  new_status: Enums<'lead_status'>;
  changed_by: string | null;
  notas: string | null;
  created_at: string;
}

// =====================================================
// VIEWS CREADAS EN FASE 1
// =====================================================

// View: crm_cerrados_ganados (FASE 1.5)
export interface CRMCerradosGanados {
  id: string;
  owner_id: string;
  project_id: string;
  titulo: string;
  nombre_contacto: string | null;
  empresa: string | null;
  email_contacto: string | null;
  telefono_contacto: string | null;
  valor_potencial: number | null;
  facturacion: number | null;
  pipeline_status: Enums<'lead_status'> | null;
  proyecto_nombre: string;
  proyecto_color: string;
  owner_nombre: string;
}

// View: member_stats_complete (FASE 1.5)
export interface MemberStatsComplete {
  id: string;
  nombre: string;
  email: string;
  avatar: string | null;
  color: string | null;
  especialization: Enums<'specialization_role'> | null;
  obvs_validated: number;
  facturacion_total: number;
  margen_total: number;
}

// View: project_stats_complete (FASE 1.5)
export interface ProjectStatsComplete {
  id: string;
  nombre: string;
  color: string;
  num_members: number;
  obvs_validated: number;
  facturacion: number;
  margen: number;
}

// View: top_productos_rentables (FASE 1.5)
export interface TopProductosRentables {
  producto: string;
  num_ventas: number;
  facturacion_total: number;
  margen_total: number;
  margen_porcentaje: number;
}

// View: top_clientes_valor (FASE 1.5)
export interface TopClientesValor {
  empresa: string;
  email_contacto: string | null;
  telefono_contacto: string | null;
  num_compras: number;
  valor_total_facturado: number;
  valor_total_margen: number;
  ultima_compra: string;
}

// View: dashboard_cobros (FASE 1.2)
export interface DashboardCobros {
  total_ventas: number;
  total_facturado: number;
  total_cobrado: number;
  total_pendiente: number;
  total_atrasado: number;
  num_pendientes: number;
  num_parciales: number;
  num_cobrados: number;
  num_atrasados: number;
  dias_promedio_cobro: number;
  tasa_morosidad_porcentaje: number;
}

// View: analisis_costes_global (FASE 1.3)
export interface AnalisisCostesGlobal {
  num_ventas: number;
  total_materiales: number;
  total_subcontratacion: number;
  total_herramientas: number;
  total_marketing: number;
  total_logistica: number;
  total_comisiones: number;
  total_otros: number;
  total_costes: number;
  pct_materiales: number;
  pct_subcontratacion: number;
  pct_herramientas: number;
  pct_marketing: number;
  pct_logistica: number;
  pct_comisiones: number;
  pct_otros: number;
}

// View: analisis_costes_por_proyecto (FASE 1.3)
export interface AnalisisCostePorProyecto {
  project_id: string;
  proyecto: string;
  proyecto_color: string;
  num_ventas: number;
  total_materiales: number;
  total_subcontratacion: number;
  total_herramientas: number;
  total_marketing: number;
  total_logistica: number;
  total_comisiones: number;
  total_otros: number;
  total_costes: number;
  facturacion: number;
  margen: number;
  pct_costes_sobre_facturacion: number;
}

// View: forecast_ingresos (FASE 1.5)
export interface ForecastIngresos {
  proyeccion_hot: number;
  proyeccion_propuesta: number;
  proyeccion_negociacion: number;
  total_proyectado_30_dias: number;
}

// =====================================================
// RE-EXPORTS ÚTILES
// =====================================================

// Re-exportar tipos originales útiles
export type { Database, Tables, Enums };

// Alias conveniente para OBV extendido
export type OBV = OBVRowExtended;
export type OBVInsert = OBVInsertExtended;
export type OBVUpdate = OBVUpdateExtended;

// Tipos de lead_status con valores literales
export type LeadStatus =
  | 'frio'
  | 'tibio'
  | 'hot'
  | 'propuesta'
  | 'negociacion'
  | 'cerrado_ganado'
  | 'cerrado_perdido';

// Tipos de cobro_estado
export type CobroEstado = 'pendiente' | 'cobrado_parcial' | 'cobrado_total' | 'atrasado';
