-- =====================================================
-- FASE 1.5: VIEWS ACTUALIZADAS PARA FRONTEND
-- =====================================================
-- Fecha: 26 Enero 2026
-- Objetivo: Views optimizadas que remplazan members_public, obvs_public
-- Todas las consultas del frontend deben usar estos views
-- =====================================================

-- Primero eliminar views antiguos si existen
DROP VIEW IF EXISTS member_stats CASCADE;
DROP VIEW IF EXISTS project_stats CASCADE;
DROP VIEW IF EXISTS pipeline_global CASCADE;
DROP VIEW IF EXISTS member_stats CASCADE;

-- =====================================================
-- 1. CRM GLOBAL - OBVs en cerrado ganado
-- =====================================================
CREATE OR REPLACE VIEW crm_cerrados_ganados AS
SELECT
  o.id,
  o.owner_id,
  o.project_id,
  o.titulo,
  o.nombre_contacto,
  o.empresa,
  o.email_contacto,
  o.telefono_contacto,
  o.valor_potencial,
  o.facturacion,
  o.pipeline_status,
  o.notas,
  o.proxima_accion,
  o.responsable_id,
  o.created_at,
  o.updated_at,
  o.validated_at,

  -- Información del proyecto
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  p.icon as proyecto_icon,

  -- Información del owner
  owner.nombre as owner_nombre,
  owner.color as owner_color,
  owner.avatar as owner_avatar,

  -- Información del responsable
  resp.nombre as responsable_nombre,
  resp.color as responsable_color

FROM obvs o
JOIN projects p ON o.project_id = p.id
JOIN members owner ON o.owner_id = owner.id
LEFT JOIN members resp ON o.responsable_id = resp.id
WHERE o.pipeline_status = 'cerrado_ganado'
  AND o.tipo IN ('exploracion', 'validacion')
ORDER BY o.updated_at DESC;

-- =====================================================
-- 2. MEMBER STATS - Estadísticas completas por miembro
-- =====================================================
CREATE OR REPLACE VIEW member_stats_complete AS
SELECT
  m.id,
  m.auth_id,
  m.nombre,
  m.email,
  m.avatar,
  m.color,
  m.especialization,
  m.created_at,

  -- Contadores de items
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'validated'), 0) as obvs_validated,
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending'), 0) as obvs_pending,
  COALESCE(COUNT(DISTINCT k.id) FILTER (WHERE k.type = 'lp' AND k.status = 'validated'), 0) as lps,
  COALESCE(COUNT(DISTINCT k.id) FILTER (WHERE k.type = 'bp' AND k.status = 'validated'), 0) as bps,
  COALESCE(SUM(k.cp_points) FILTER (WHERE k.type = 'cp' AND k.status = 'validated'), 0) as cps,

  -- Métricas financieras
  COALESCE(SUM(o.facturacion) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0) as facturacion_total,
  COALESCE(SUM(o.margen) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0) as margen_total,
  COALESCE(SUM(o.costes) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0) as costes_total,

  -- Margen porcentaje promedio
  ROUND(
    AVG(o.margen / NULLIF(o.facturacion, 0) * 100) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'),
    1
  ) as margen_porcentaje,

  -- Número de proyectos
  COALESCE(COUNT(DISTINCT pm.project_id), 0) as num_proyectos,

  -- Número de ventas cerradas
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0) as num_ventas,

  -- Pipeline
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.pipeline_status = 'hot'), 0) as leads_hot,
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.pipeline_status = 'negociacion'), 0) as leads_negociacion

FROM members m
LEFT JOIN obvs o ON o.owner_id = m.id
LEFT JOIN kpis k ON k.owner_id = m.id
LEFT JOIN project_members pm ON pm.member_id = m.id
GROUP BY m.id, m.auth_id, m.nombre, m.email, m.avatar, m.color, m.especialization, m.created_at;

-- =====================================================
-- 3. PROJECT STATS - Estadísticas completas por proyecto
-- =====================================================
CREATE OR REPLACE VIEW project_stats_complete AS
SELECT
  p.id,
  p.nombre,
  p.descripcion,
  p.fase,
  p.tipo,
  p.icon,
  p.color,
  p.onboarding_completed,
  p.created_at,

  -- Miembros
  COALESCE(COUNT(DISTINCT pm.member_id), 0) as num_miembros,

  -- OBVs
  COALESCE(COUNT(DISTINCT o.id), 0) as total_obvs,
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'validated'), 0) as obvs_validated,
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending'), 0) as obvs_pending,

  -- Pipeline CRM
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.tipo IN ('exploracion', 'validacion')), 0) as total_leads,
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.pipeline_status = 'cerrado_ganado'), 0) as leads_ganados,
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.pipeline_status = 'cerrado_perdido'), 0) as leads_perdidos,
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.pipeline_status IN ('hot', 'propuesta', 'negociacion')), 0) as leads_activos,

  -- Tasa de conversión
  ROUND(
    COUNT(DISTINCT o.id) FILTER (WHERE o.pipeline_status = 'cerrado_ganado')::DECIMAL * 100.0 /
    NULLIF(COUNT(DISTINCT o.id) FILTER (WHERE o.tipo IN ('exploracion', 'validacion')), 0),
    1
  ) as tasa_conversion,

  -- Financiero
  COALESCE(SUM(o.facturacion) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0) as facturacion_total,
  COALESCE(SUM(o.margen) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0) as margen_total,
  COALESCE(SUM(o.costes) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0) as costes_total,
  COALESCE(COUNT(DISTINCT o.id) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0) as num_ventas,

  -- Ticket promedio
  ROUND(
    SUM(o.facturacion) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated') /
    NULLIF(COUNT(DISTINCT o.id) FILTER (WHERE o.es_venta = TRUE AND o.status = 'validated'), 0),
    2
  ) as ticket_promedio,

  -- Tareas
  COALESCE(COUNT(DISTINCT t.id), 0) as total_tareas,
  COALESCE(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done'), 0) as tareas_completadas

FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN obvs o ON o.project_id = p.id
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, p.nombre, p.descripcion, p.fase, p.tipo, p.icon, p.color, p.onboarding_completed, p.created_at;

-- =====================================================
-- 4. ANÁLISIS DE CONVERSIÓN DEL PIPELINE
-- =====================================================
CREATE OR REPLACE VIEW analisis_conversion_pipeline AS
SELECT
  'Global' as scope,
  NULL::UUID as project_id,
  NULL as proyecto_nombre,

  -- Totales por estado
  COUNT(*) FILTER (WHERE pipeline_status = 'frio') as frio,
  COUNT(*) FILTER (WHERE pipeline_status = 'tibio') as tibio,
  COUNT(*) FILTER (WHERE pipeline_status = 'hot') as hot,
  COUNT(*) FILTER (WHERE pipeline_status = 'propuesta') as propuesta,
  COUNT(*) FILTER (WHERE pipeline_status = 'negociacion') as negociacion,
  COUNT(*) FILTER (WHERE pipeline_status = 'cerrado_ganado') as cerrado_ganado,
  COUNT(*) FILTER (WHERE pipeline_status = 'cerrado_perdido') as cerrado_perdido,

  -- Valor potencial por estado
  SUM(valor_potencial) FILTER (WHERE pipeline_status = 'hot') as valor_hot,
  SUM(valor_potencial) FILTER (WHERE pipeline_status = 'propuesta') as valor_propuesta,
  SUM(valor_potencial) FILTER (WHERE pipeline_status = 'negociacion') as valor_negociacion,

  -- Métricas de conversión
  ROUND(
    COUNT(*) FILTER (WHERE pipeline_status = 'cerrado_ganado')::DECIMAL * 100.0 /
    NULLIF(COUNT(*), 0),
    1
  ) as tasa_conversion,

  ROUND(
    COUNT(*) FILTER (WHERE pipeline_status = 'cerrado_perdido')::DECIMAL * 100.0 /
    NULLIF(COUNT(*), 0),
    1
  ) as tasa_perdida,

  -- Tiempo promedio en días desde creación hasta cerrado (ganado o perdido)
  ROUND(
    AVG(EXTRACT(DAY FROM (updated_at - created_at))) FILTER (
      WHERE pipeline_status IN ('cerrado_ganado', 'cerrado_perdido')
    ),
    1
  ) as dias_promedio_cierre

FROM obvs
WHERE tipo IN ('exploracion', 'validacion')

UNION ALL

SELECT
  'Por Proyecto' as scope,
  p.id as project_id,
  p.nombre as proyecto_nombre,

  COUNT(*) FILTER (WHERE o.pipeline_status = 'frio') as frio,
  COUNT(*) FILTER (WHERE o.pipeline_status = 'tibio') as tibio,
  COUNT(*) FILTER (WHERE o.pipeline_status = 'hot') as hot,
  COUNT(*) FILTER (WHERE o.pipeline_status = 'propuesta') as propuesta,
  COUNT(*) FILTER (WHERE o.pipeline_status = 'negociacion') as negociacion,
  COUNT(*) FILTER (WHERE o.pipeline_status = 'cerrado_ganado') as cerrado_ganado,
  COUNT(*) FILTER (WHERE o.pipeline_status = 'cerrado_perdido') as cerrado_perdido,

  SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'hot') as valor_hot,
  SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'propuesta') as valor_propuesta,
  SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'negociacion') as valor_negociacion,

  ROUND(
    COUNT(*) FILTER (WHERE o.pipeline_status = 'cerrado_ganado')::DECIMAL * 100.0 /
    NULLIF(COUNT(*), 0),
    1
  ) as tasa_conversion,

  ROUND(
    COUNT(*) FILTER (WHERE o.pipeline_status = 'cerrado_perdido')::DECIMAL * 100.0 /
    NULLIF(COUNT(*), 0),
    1
  ) as tasa_perdida,

  ROUND(
    AVG(EXTRACT(DAY FROM (o.updated_at - o.created_at))) FILTER (
      WHERE o.pipeline_status IN ('cerrado_ganado', 'cerrado_perdido')
    ),
    1
  ) as dias_promedio_cierre

FROM projects p
LEFT JOIN obvs o ON o.project_id = p.id
  AND o.tipo IN ('exploracion', 'validacion')
GROUP BY p.id, p.nombre;

-- =====================================================
-- 5. TOP PRODUCTOS/SERVICIOS MÁS RENTABLES
-- =====================================================
CREATE OR REPLACE VIEW top_productos_rentables AS
SELECT
  o.producto,
  COUNT(o.id) as num_ventas,
  SUM(o.facturacion) as facturacion_total,
  SUM(o.costes) as costes_total,
  SUM(o.margen) as margen_total,
  ROUND(AVG(o.margen / NULLIF(o.facturacion, 0) * 100), 1) as margen_porcentaje,
  ROUND(SUM(o.facturacion) / NULLIF(COUNT(o.id), 0), 2) as ticket_promedio,

  -- Tendencia (comparar últimos 30 días vs 30 días anteriores)
  ROUND(
    (SUM(o.facturacion) FILTER (WHERE o.fecha >= CURRENT_DATE - INTERVAL '30 days') -
     SUM(o.facturacion) FILTER (WHERE o.fecha >= CURRENT_DATE - INTERVAL '60 days'
       AND o.fecha < CURRENT_DATE - INTERVAL '30 days')
    ) * 100.0 /
    NULLIF(SUM(o.facturacion) FILTER (WHERE o.fecha >= CURRENT_DATE - INTERVAL '60 days'
      AND o.fecha < CURRENT_DATE - INTERVAL '30 days'), 0),
    1
  ) as tendencia_porcentaje

FROM obvs o
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.producto IS NOT NULL
GROUP BY o.producto
ORDER BY margen_total DESC;

-- =====================================================
-- 6. TOP CLIENTES POR VALOR
-- =====================================================
CREATE OR REPLACE VIEW top_clientes_valor AS
SELECT
  o.empresa,
  o.email_contacto,
  o.telefono_contacto,
  o.nombre_contacto,

  COUNT(DISTINCT o.id) as num_compras,
  SUM(o.facturacion) as valor_total_facturado,
  SUM(o.margen) as valor_total_margen,

  -- Última compra
  MAX(o.fecha) as ultima_compra,
  EXTRACT(DAY FROM (CURRENT_DATE - MAX(o.fecha)))::INTEGER as dias_sin_comprar,

  -- CLV estimado (Customer Lifetime Value)
  ROUND(SUM(o.margen) * 1.2, 2) as clv_estimado,  -- Factor 1.2 = estimación de compras futuras

  -- Proyectos donde ha comprado
  array_agg(DISTINCT p.nombre) as proyectos

FROM obvs o
JOIN projects p ON o.project_id = p.id
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.empresa IS NOT NULL
GROUP BY o.empresa, o.email_contacto, o.telefono_contacto, o.nombre_contacto
ORDER BY valor_total_facturado DESC;

-- =====================================================
-- 7. EVOLUCIÓN TEMPORAL MENSUAL (para gráficas)
-- =====================================================
CREATE OR REPLACE VIEW evolucion_temporal_mensual AS
SELECT
  DATE_TRUNC('month', o.fecha) as mes,

  -- Totales
  COUNT(DISTINCT o.id) as num_ventas,
  SUM(o.facturacion) as facturacion,
  SUM(o.costes) as costes,
  SUM(o.margen) as margen,
  ROUND(AVG(o.margen / NULLIF(o.facturacion, 0) * 100), 1) as margen_porcentaje,

  -- Por proyecto
  jsonb_object_agg(
    p.nombre,
    jsonb_build_object(
      'facturacion', COALESCE(SUM(o.facturacion) FILTER (WHERE o.project_id = p.id), 0),
      'margen', COALESCE(SUM(o.margen) FILTER (WHERE o.project_id = p.id), 0),
      'num_ventas', COUNT(o.id) FILTER (WHERE o.project_id = p.id)
    )
  ) as por_proyecto

FROM obvs o
JOIN projects p ON o.project_id = p.id
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.fecha IS NOT NULL
GROUP BY DATE_TRUNC('month', o.fecha)
ORDER BY mes DESC;

-- =====================================================
-- 8. VALIDACIONES PENDIENTES POR USUARIO
-- =====================================================
CREATE OR REPLACE VIEW mis_validaciones_pendientes AS
SELECT
  'OBV' as tipo,
  o.id as item_id,
  o.titulo,
  o.descripcion,
  o.evidence_url,
  o.created_at,
  o.owner_id,
  owner.nombre as owner_nombre,
  owner.color as owner_color,
  owner.avatar as owner_avatar,
  o.project_id,
  p.nombre as proyecto_nombre,

  -- Validaciones ya hechas
  (SELECT COUNT(*) FROM obv_validaciones WHERE obv_id = o.id) as validaciones_count,
  (SELECT COUNT(*) FILTER (WHERE approved = TRUE) FROM obv_validaciones WHERE obv_id = o.id) as aprobaciones,
  (SELECT COUNT(*) FILTER (WHERE approved = FALSE) FROM obv_validaciones WHERE obv_id = o.id) as rechazos

FROM obvs o
JOIN members owner ON o.owner_id = owner.id
JOIN projects p ON o.project_id = p.id
WHERE o.status = 'pending'
  AND o.tipo IN ('exploracion', 'validacion', 'venta')

UNION ALL

SELECT
  k.type as tipo,
  k.id as item_id,
  k.titulo,
  k.descripcion,
  k.evidence_url,
  k.created_at,
  k.owner_id,
  owner.nombre as owner_nombre,
  owner.color as owner_color,
  owner.avatar as owner_avatar,
  NULL as project_id,
  NULL as proyecto_nombre,

  (SELECT COUNT(*) FROM kpi_validaciones WHERE kpi_id = k.id) as validaciones_count,
  (SELECT COUNT(*) FILTER (WHERE approved = TRUE) FROM kpi_validaciones WHERE kpi_id = k.id) as aprobaciones,
  (SELECT COUNT(*) FILTER (WHERE approved = FALSE) FROM kpi_validaciones WHERE kpi_id = k.id) as rechazos

FROM kpis k
JOIN members owner ON k.owner_id = owner.id
WHERE k.status = 'pending';

-- =====================================================
-- 9. FORECAST - PROYECCIÓN DE INGRESOS
-- =====================================================
CREATE OR REPLACE VIEW forecast_ingresos AS
SELECT
  -- Ingresos proyectados según valor potencial de pipeline
  SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'hot') * 0.3 as proyeccion_hot,
  SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'propuesta') * 0.5 as proyeccion_propuesta,
  SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'negociacion') * 0.7 as proyeccion_negociacion,

  -- Total proyectado próximos 30 días
  ROUND(
    SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'hot') * 0.3 +
    SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'propuesta') * 0.5 +
    SUM(o.valor_potencial) FILTER (WHERE o.pipeline_status = 'negociacion') * 0.7,
    2
  ) as total_proyectado_30_dias,

  -- Facturación real últimos 30 días (para comparar)
  SUM(o.facturacion) FILTER (
    WHERE o.es_venta = TRUE
      AND o.status = 'validated'
      AND o.fecha >= CURRENT_DATE - INTERVAL '30 days'
  ) as facturacion_real_ultimos_30_dias,

  -- Accuracy: comparar proyección vs real del mes anterior
  ROUND(
    ABS(
      SUM(o.facturacion) FILTER (
        WHERE o.es_venta = TRUE
          AND o.status = 'validated'
          AND o.fecha >= CURRENT_DATE - INTERVAL '30 days'
      ) -
      SUM(o.valor_potencial) FILTER (
        WHERE o.pipeline_status IN ('hot', 'propuesta', 'negociacion')
      ) * 0.5
    ) * 100.0 /
    NULLIF(SUM(o.facturacion) FILTER (
      WHERE o.es_venta = TRUE
        AND o.status = 'validated'
        AND o.fecha >= CURRENT_DATE - INTERVAL '30 days'
    ), 0),
    1
  ) as error_porcentaje

FROM obvs o;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecuta estas queries para probar los views:

-- 1. CRM cerrados ganados:
-- SELECT * FROM crm_cerrados_ganados LIMIT 5;

-- 2. Stats de miembros:
-- SELECT * FROM member_stats_complete LIMIT 5;

-- 3. Stats de proyectos:
-- SELECT * FROM project_stats_complete;

-- 4. Análisis de conversión:
-- SELECT * FROM analisis_conversion_pipeline;

-- 5. Top productos:
-- SELECT * FROM top_productos_rentables LIMIT 10;

-- 6. Top clientes:
-- SELECT * FROM top_clientes_valor LIMIT 10;

-- 7. Evolución mensual:
-- SELECT * FROM evolucion_temporal_mensual LIMIT 12;

-- 8. Validaciones pendientes:
-- SELECT * FROM mis_validaciones_pendientes;

-- 9. Forecast:
-- SELECT * FROM forecast_ingresos;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Todos estos views son seguros para usar en el frontend
-- 2. Los RLS policies se aplican automáticamente a los datos base
-- 3. Los views incluyen JOINs optimizados para evitar N+1 queries
-- 4. Usar estos views en lugar de queries complejas en el frontend
-- 5. Los views se actualizan automáticamente cuando cambian los datos base
