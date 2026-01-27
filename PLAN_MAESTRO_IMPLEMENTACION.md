# 🚀 PLAN MAESTRO DE IMPLEMENTACIÓN - NOVA PLATFORM

**Fecha:** 26 Enero 2026
**Objetivo:** Reestructurar completamente la app según nueva arquitectura

---

## 📊 RESUMEN EJECUTIVO

### Cambios Principales:
1. ✅ **Unificar Leads y OBVs** - Eliminar duplicidad de tablas
2. ✅ **Acceso Total** - Todos los usuarios ven todos los datos de todos los proyectos
3. ✅ **CRM Global Profesional** - 4 pestañas con funcionalidades avanzadas
4. ✅ **Financiero Global Completo** - 5 secciones con análisis y proyección IA
5. ✅ **Sistema de Validaciones** - Nueva sección global para validar OBVs/KPIs
6. ✅ **Tracking de Cobros** - Sistema completo de gestión de pagos
7. ✅ **Costes Desglosados** - Análisis detallado de gastos por categoría
8. ✅ **Formularios Dinámicos** - Modal diferente por cada fase del pipeline
9. ✅ **Exportación Excel** - En CRM y Financiero
10. ✅ **Onboarding Editable** - Con botón "Save Changes"

---

## 🗄️ FASE 1: REESTRUCTURACIÓN DE BASE DE DATOS

### 1.1 Eliminar Tabla `leads` - Unificar con `obvs`

**Razón:** Leads y OBVs de exploración/validación son la misma cosa.

**SQL de migración:**

```sql
-- PASO 1: Añadir campos de leads a tabla obvs
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS nombre_contacto TEXT;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS empresa TEXT;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS email_contacto TEXT;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS telefono_contacto TEXT;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS pipeline_status lead_status DEFAULT 'frio';
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS valor_potencial DECIMAL(12,2);
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS proxima_accion TEXT;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS proxima_accion_fecha DATE;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES profiles(id);

-- PASO 2: Migrar datos de leads existentes a obvs
INSERT INTO obvs (
  owner_id, project_id, titulo, tipo, status,
  nombre_contacto, empresa, email_contacto, telefono_contacto,
  pipeline_status, valor_potencial, notas, responsable_id, created_at, updated_at
)
SELECT
  COALESCE(responsable_id, created_by) as owner_id,
  project_id,
  nombre as titulo,
  CASE
    WHEN status = 'cerrado_ganado' THEN 'venta'::obv_type
    ELSE 'exploracion'::obv_type
  END as tipo,
  CASE
    WHEN status = 'cerrado_ganado' THEN 'validated'::kpi_status
    ELSE 'pending'::kpi_status
  END as status,
  nombre as nombre_contacto,
  empresa,
  email as email_contacto,
  telefono as telefono_contacto,
  status as pipeline_status,
  valor_potencial,
  notas,
  responsable_id,
  created_at,
  updated_at
FROM leads;

-- PASO 3: Migrar historial de leads
-- (Opcional - si se quiere mantener el historial)
CREATE TABLE obv_pipeline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  old_status lead_status,
  new_status lead_status,
  changed_by UUID REFERENCES profiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO obv_pipeline_history (obv_id, old_status, new_status, changed_by, notas, created_at)
SELECT
  o.id as obv_id,
  lh.old_status,
  lh.new_status,
  lh.changed_by,
  lh.notas,
  lh.created_at
FROM lead_history lh
JOIN leads l ON l.id = lh.lead_id
JOIN obvs o ON o.nombre_contacto = l.nombre AND o.empresa = l.empresa;

-- PASO 4: Eliminar tablas leads
DROP TABLE IF EXISTS lead_history CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- PASO 5: Eliminar columna lead_id de obvs (ya no es necesaria)
ALTER TABLE obvs DROP COLUMN IF EXISTS lead_id;
```

---

### 1.2 Añadir Sistema de Cobros Detallado

```sql
-- Añadir campos de tracking de cobros
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS cobro_estado TEXT DEFAULT 'pendiente';
  -- Valores: 'pendiente', 'cobrado_parcial', 'cobrado_total', 'atrasado'

ALTER TABLE obvs ADD COLUMN IF NOT EXISTS cobro_fecha_esperada DATE;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS cobro_fecha_real DATE;
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS cobro_metodo TEXT;
  -- Valores: 'transferencia', 'tarjeta', 'efectivo', 'paypal', 'stripe', 'bizum'

-- Crear tabla para cobros parciales (pagos en cuotas)
CREATE TABLE IF NOT EXISTS cobros_parciales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha_cobro DATE NOT NULL,
  metodo TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar estado de cobro automáticamente
CREATE OR REPLACE FUNCTION actualizar_estado_cobro()
RETURNS TRIGGER AS $$
DECLARE
  total_cobrado DECIMAL(12,2);
  facturacion_total DECIMAL(12,2);
BEGIN
  -- Obtener facturación total de la OBV
  SELECT facturacion INTO facturacion_total
  FROM obvs WHERE id = NEW.obv_id;

  -- Sumar todos los cobros parciales
  SELECT COALESCE(SUM(monto), 0) INTO total_cobrado
  FROM cobros_parciales WHERE obv_id = NEW.obv_id;

  -- Actualizar estado según lo cobrado
  IF total_cobrado >= facturacion_total THEN
    UPDATE obvs SET
      cobro_estado = 'cobrado_total',
      cobrado = TRUE,
      cobro_fecha_real = NEW.fecha_cobro
    WHERE id = NEW.obv_id;
  ELSIF total_cobrado > 0 THEN
    UPDATE obvs SET
      cobro_estado = 'cobrado_parcial',
      cobrado_parcial = total_cobrado
    WHERE id = NEW.obv_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_actualizar_estado_cobro
AFTER INSERT ON cobros_parciales
FOR EACH ROW EXECUTE FUNCTION actualizar_estado_cobro();

-- Función para marcar cobros atrasados automáticamente
CREATE OR REPLACE FUNCTION marcar_cobros_atrasados()
RETURNS void AS $$
BEGIN
  UPDATE obvs
  SET cobro_estado = 'atrasado'
  WHERE cobro_estado = 'pendiente'
    AND es_venta = TRUE
    AND status = 'validated'
    AND cobro_fecha_esperada < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar esta función diariamente (configurar con pg_cron o edge function)
```

---

### 1.3 Añadir Desglose de Costes

```sql
-- Añadir columna JSONB para costes detallados
ALTER TABLE obvs ADD COLUMN IF NOT EXISTS costes_detalle JSONB;

-- Función para validar estructura de costes
CREATE OR REPLACE FUNCTION validar_costes_detalle()
RETURNS TRIGGER AS $$
BEGIN
  -- Si hay costes_detalle, validar que tenga estructura correcta
  IF NEW.costes_detalle IS NOT NULL THEN
    -- Calcular total de costes desde el detalle
    NEW.costes := (
      COALESCE((NEW.costes_detalle->>'materiales')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'subcontratacion')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'herramientas')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'marketing')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'logistica')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'comisiones')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'otros')::DECIMAL, 0)
    );
  END IF;

  -- Recalcular margen si cambió costes
  IF NEW.es_venta = TRUE AND NEW.facturacion IS NOT NULL THEN
    NEW.margen := NEW.facturacion - COALESCE(NEW.costes, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_costes
BEFORE INSERT OR UPDATE ON obvs
FOR EACH ROW EXECUTE FUNCTION validar_costes_detalle();

-- Ejemplo de estructura costes_detalle:
-- {
--   "materiales": 450.00,
--   "subcontratacion": 800.00,
--   "herramientas": 120.00,
--   "marketing": 230.00,
--   "logistica": 50.00,
--   "comisiones": 150.00,
--   "otros": 100.00
-- }
```

---

### 1.4 Actualizar RLS Policies - Acceso Total

**IMPORTANTE:** Todos los usuarios de Nova ven TODOS los datos de TODOS los proyectos.

```sql
-- ============================================
-- ELIMINAR POLICIES RESTRICTIVAS ANTERIORES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- OBVs
DROP POLICY IF EXISTS "OBVs viewable by authenticated" ON obvs;
DROP POLICY IF EXISTS "Authenticated can create OBVs" ON obvs;
DROP POLICY IF EXISTS "Owner can update OBV" ON obvs;
DROP POLICY IF EXISTS "Owner can delete OBV" ON obvs;

-- KPIs
DROP POLICY IF EXISTS "KPIs viewable" ON kpis;
DROP POLICY IF EXISTS "Authenticated can create KPIs" ON kpis;
DROP POLICY IF EXISTS "Owner can update KPI" ON kpis;

-- Projects
DROP POLICY IF EXISTS "Projects viewable by authenticated" ON projects;
DROP POLICY IF EXISTS "Authenticated can create projects" ON projects;
DROP POLICY IF EXISTS "Project members can update" ON projects;

-- Tasks
DROP POLICY IF EXISTS "Tasks viewable" ON tasks;
DROP POLICY IF EXISTS "Authenticated can create tasks" ON tasks;
DROP POLICY IF EXISTS "Assignee can update tasks" ON tasks;
DROP POLICY IF EXISTS "Assignee can delete tasks" ON tasks;

-- ============================================
-- CREAR POLICIES ABIERTAS (TODOS VEN TODO)
-- ============================================

-- PROFILES: Todos ven todos, cada uno edita el suyo
CREATE POLICY "All authenticated users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth_id = auth.uid());

-- PROJECTS: Todos ven y pueden crear, solo miembros editan
CREATE POLICY "All authenticated can view all projects" ON projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated can create projects" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Project members can update project" ON projects
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
      AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- PROJECT_MEMBERS: Todos ven todos
CREATE POLICY "All authenticated can view project members" ON project_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated can join projects" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- OBVs: TODOS ven TODAS, solo owner puede editar/eliminar
CREATE POLICY "All authenticated can view all obvs" ON obvs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated can create obvs" ON obvs
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Owner can update own obv" ON obvs
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Owner can delete own obv if pending" ON obvs
  FOR DELETE TO authenticated
  USING (
    owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND status = 'pending'
  );

-- KPIs: TODOS ven TODOS, solo owner puede editar
CREATE POLICY "All authenticated can view all kpis" ON kpis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated can create kpis" ON kpis
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Owner can update own kpi" ON kpis
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- VALIDACIONES: Todos ven todas, cualquiera puede validar (excepto owner)
CREATE POLICY "All can view obv validations" ON obv_validaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Validators can validate obvs" ON obv_validaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    validator_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()) AND
    validator_id != (SELECT owner_id FROM obvs WHERE id = obv_id)
  );

CREATE POLICY "All can view kpi validations" ON kpi_validaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Validators can validate kpis" ON kpi_validaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    validator_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()) AND
    validator_id != (SELECT owner_id FROM kpis WHERE id = kpi_id)
  );

-- TASKS: Todos ven todas, solo asignado a proyecto puede crear/editar
CREATE POLICY "All authenticated can view all tasks" ON tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Project members can create tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Assignee or project member can update task" ON tasks
  FOR UPDATE TO authenticated
  USING (
    assignee_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Assignee can delete own task" ON tasks
  FOR DELETE TO authenticated
  USING (assignee_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- COBROS PARCIALES: Todos ven todos
CREATE POLICY "All can view cobros parciales" ON cobros_parciales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "All can create cobros parciales" ON cobros_parciales
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- NOTIFICATIONS: Solo propias
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));
```

---

### 1.5 Actualizar Views

```sql
-- Eliminar views antiguas que referenciaban tabla leads
DROP VIEW IF EXISTS pipeline_global CASCADE;

-- Crear view para CRM Global - OBVs en cerrado ganado
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
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  p.icon as proyecto_icon,
  owner.nombre as owner_nombre,
  owner.color as owner_color,
  resp.nombre as responsable_nombre
FROM obvs o
JOIN projects p ON o.project_id = p.id
JOIN profiles owner ON o.owner_id = owner.id
LEFT JOIN profiles resp ON o.responsable_id = resp.id
WHERE o.pipeline_status = 'cerrado_ganado'
  AND o.tipo IN ('exploracion', 'validacion');

-- View para análisis financiero global
CREATE OR REPLACE VIEW financiero_global_stats AS
SELECT
  DATE_TRUNC('month', o.fecha) as mes,
  o.project_id,
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  COUNT(o.id) as num_ventas,
  SUM(o.facturacion) as facturacion_total,
  SUM(o.costes) as costes_totales,
  SUM(o.margen) as margen_total,
  AVG(o.margen / NULLIF(o.facturacion, 0) * 100) as margen_porcentaje,
  SUM(o.facturacion) / NULLIF(COUNT(o.id), 0) as ticket_promedio,
  COUNT(CASE WHEN o.cobro_estado = 'cobrado_total' THEN 1 END) as num_cobradas,
  COUNT(CASE WHEN o.cobro_estado = 'pendiente' THEN 1 END) as num_pendientes,
  COUNT(CASE WHEN o.cobro_estado = 'atrasado' THEN 1 END) as num_atrasadas
FROM obvs o
JOIN projects p ON o.project_id = p.id
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
GROUP BY DATE_TRUNC('month', o.fecha), o.project_id, p.nombre, p.color;

-- View para productos más rentables
CREATE OR REPLACE VIEW productos_rentables AS
SELECT
  o.producto,
  COUNT(o.id) as num_ventas,
  SUM(o.facturacion) as facturacion_total,
  SUM(o.margen) as margen_total,
  AVG(o.margen / NULLIF(o.facturacion, 0) * 100) as margen_porcentaje,
  SUM(o.facturacion) / NULLIF(COUNT(o.id), 0) as ticket_promedio
FROM obvs o
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.producto IS NOT NULL
GROUP BY o.producto
ORDER BY margen_total DESC;

-- View para top clientes
CREATE OR REPLACE VIEW top_clientes AS
SELECT
  o.empresa,
  o.email_contacto,
  o.telefono_contacto,
  COUNT(o.id) as num_compras,
  SUM(o.facturacion) as valor_total,
  MAX(o.fecha) as ultima_compra,
  EXTRACT(DAYS FROM (CURRENT_DATE - MAX(o.fecha))) as dias_sin_comprar
FROM obvs o
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.empresa IS NOT NULL
GROUP BY o.empresa, o.email_contacto, o.telefono_contacto
ORDER BY valor_total DESC;
```

---

## 🎨 FASE 2: IMPLEMENTACIÓN DE INTERFACES

### 2.1 Vista: Validaciones Global

**Ubicación:** Panel izquierdo (sidebar)

**Archivo:** `src/pages/views/ValidacionesView.tsx`

**Estructura:**

```typescript
interface ValidacionesPendientes {
  obvs: OBVPendiente[];
  lps: KPIPendiente[];
  bps: KPIPendiente[];
}

// Mostrar 3 tabs:
// - OBVs pendientes
// - LPs pendientes
// - BPs pendientes

// Por cada item:
// - Nombre del owner
// - Título
// - Descripción
// - Evidencia (link/imagen)
// - Botones: ✅ Aprobar | ❌ Rechazar
// - Campo: Comentario (opcional)
```

**Funcionalidades:**
- Filtrar por tipo (OBV, LP, BP)
- Ordenar por fecha
- Ver solo "pendientes de mi validación"
- Contador de validaciones: "3 OBVs, 2 LPs, 1 BP"
- Notificación cuando hay nueva pendiente

---

### 2.2 Vista: CRM Global (Rediseñado)

**Ubicación:** Panel izquierdo

**Archivo:** `src/pages/views/CRMView.tsx` (refactorizar completo)

**Estructura:** 4 pestañas

#### Pestaña 1: 📇 Cartera de Clientes
```
┌──────────────────────────────────────────────┐
│ 📇 CARTERA DE CLIENTES                       │
├──────────────────────────────────────────────┤
│ Filtros: [Proyecto ▼] [Búsqueda...]         │
├──────────────────────────────────────────────┤
│ Total clientes: 47                           │
│ Valor total: €185,000                        │
├──────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 🏢 Empresa ABC                          │ │
│ │ 📧 contacto@abc.com │ 📞 +34 600 123   │ │
│ │ 💰 €12,500 (3 compras) │ Sushi Payo    │ │
│ │ 📅 Última: 15 Ene 2026 (11 días)       │ │
│ │ [📧 Contactar] [➕ Nueva venta]         │ │
│ └─────────────────────────────────────────┘ │
│ ... (más clientes)                           │
└──────────────────────────────────────────────┘
```

#### Pestaña 2: 📊 Análisis de Conversión
```
┌──────────────────────────────────────────────┐
│ 📊 ANÁLISIS DE CONVERSIÓN                    │
├──────────────────────────────────────────────┤
│ 📈 MÉTRICAS GLOBALES                         │
│ • Tasa conversión: 23% (47/204)              │
│ • Tiempo promedio: 18 días                   │
│ • Valor promedio: €3,936                     │
├──────────────────────────────────────────────┤
│ 📊 POR PROYECTO                              │
│ ┌──────────────────────────────────────────┐│
│ │ Sushi Payo    | 28% | 12 días | €4,200  ││
│ │ Experea       | 19% | 24 días | €5,100  ││
│ │ ...                                       ││
│ └──────────────────────────────────────────┘│
├──────────────────────────────────────────────┤
│ [Gráfica de evolución temporal]              │
└──────────────────────────────────────────────┘
```

#### Pestaña 3: 👥 Centro de Contactos
```
┌──────────────────────────────────────────────┐
│ 👥 CENTRO DE CONTACTOS                       │
├──────────────────────────────────────────────┤
│ [🔍 Buscar...] [Filtros ▼] [📊 Exportar]    │
├──────────────────────────────────────────────┤
│ Tabla con:                                   │
│ • Nombre                                     │
│ • Empresa                                    │
│ • Email                                      │
│ • Teléfono                                   │
│ • Proyecto                                   │
│ • Estado pipeline                            │
│ • Responsable                                │
│ • Acciones                                   │
└──────────────────────────────────────────────┘
```

#### Pestaña 4: 🤖 Predicción IA
```
┌──────────────────────────────────────────────┐
│ 🤖 PREDICCIÓN CON IA                         │
├──────────────────────────────────────────────┤
│ 💰 INGRESOS PROYECTADOS (30 días)           │
│ €18,500 ± €3,200                             │
├──────────────────────────────────────────────┤
│ 📊 LEADS CON ALTA PROBABILIDAD               │
│ ┌──────────────────────────────────────────┐│
│ │ Lead: "Web Premium" | 87% cierre         ││
│ │ Valor: €5,000 | Días en negociación: 8  ││
│ │ 💡 Sugerencia: Enviar caso de éxito     ││
│ └──────────────────────────────────────────┘│
│ ... (más leads)                              │
├──────────────────────────────────────────────┤
│ ⚠️ ALERTAS                                   │
│ • Lead X sin actividad hace 14 días          │
│ • Lead Y en propuesta hace 21 días           │
└──────────────────────────────────────────────┘
```

---

### 2.3 Vista: Financiero Global (Rediseñado)

**Ubicación:** Panel izquierdo

**Archivo:** `src/pages/views/FinancieroView.tsx` (refactorizar completo)

**Estructura:** 5 pestañas

#### Pestaña 1: 💵 Dashboard Ejecutivo
```
┌──────────────────────────────────────────────┐
│ 💵 DASHBOARD FINANCIERO                      │
├──────────────────────────────────────────────┤
│ Filtros: [Enero 2026] [Todos proyectos ▼]   │
├──────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│ │💰      │ │📈      │ │📊      │ │💳      ││
│ │€95,000 │ │€52,000 │ │54.7%   │ │€43,000 ││
│ │Factua. │ │Margen  │ │Margen% │ │Costes  ││
│ └────────┘ └────────┘ └────────┘ └────────┘│
├──────────────────────────────────────────────┤
│ 📈 EVOLUCIÓN TEMPORAL                        │
│ [Gráfica lineal facturación vs margen]       │
├──────────────────────────────────────────────┤
│ 📊 POR PROYECTO                              │
│ [Gráfica de barras comparativa]              │
└──────────────────────────────────────────────┘
```

#### Pestaña 2: 📊 Análisis por Proyecto
```
┌──────────────────────────────────────────────┐
│ 📊 RENTABILIDAD POR PROYECTO                 │
├──────────────────────────────────────────────┤
│ Tabla:                                       │
│ Proyecto | Factua | Costes | Margen | % | # │
│ Sushi P. | €45K   | €18K   | €27K |60%| 23││
│ Experea  | €32K   | €20K   | €12K |37%| 12││
│ ...                                          │
├──────────────────────────────────────────────┤
│ 💡 INSIGHTS                                  │
│ • 🏆 Sushi Payo mayor margen % (60%)        │
│ • ⚠️ Academia Fin. margen bajo (25%)        │
│ • 📈 Apadrina creció +35% vs trimestre      │
├──────────────────────────────────────────────┤
│ 📊 CUADRANTE DE RENTABILIDAD                 │
│ [Gráfico scatter: Facturación vs Margen%]    │
└──────────────────────────────────────────────┘
```

#### Pestaña 3: 📦 Productos & Servicios
```
┌──────────────────────────────────────────────┐
│ 📦 ANÁLISIS DE PRODUCTOS                     │
├──────────────────────────────────────────────┤
│ 🏆 TOP PRODUCTOS POR RENTABILIDAD            │
│ ┌──────────────────────────────────────────┐│
│ │ 1. Consultoría Strategy                  ││
│ │    8 ventas | €24K | Margen 75% 📈      ││
│ │ 2. Web Premium                           ││
│ │    15 ventas | €22.5K | Margen 46.7%    ││
│ │ ...                                       ││
│ └──────────────────────────────────────────┘│
├──────────────────────────────────────────────┤
│ 👥 TOP CLIENTES                              │
│ • Cliente X: 3 compras, €12,500 total        │
│ • Cliente Y: 2 compras, €9,800 total         │
│ ...                                          │
├──────────────────────────────────────────────┤
│ 💡 RECOMENDACIONES                           │
│ • Ampliar oferta Consultoría (mejor margen)  │
│ • Revisar pricing SaaS Básico (margen bajo)  │
└──────────────────────────────────────────────┘
```

#### Pestaña 4: 💰 Control de Cobros
```
┌──────────────────────────────────────────────┐
│ 💰 CONTROL DE COBROS                         │
├──────────────────────────────────────────────┤
│ 📊 ESTADO GLOBAL                             │
│ • Facturado:  €95,000                        │
│ • Cobrado:    €78,000 (82%) 🟢              │
│ • Pendiente:  €17,000 (18%) 🟡              │
│ • Atrasado:   €3,200 (>60d) 🔴              │
├──────────────────────────────────────────────┤
│ 📅 TIMELINE DE COBROS                        │
│ [Gráfica temporal mostrando cobros esperados]│
├──────────────────────────────────────────────┤
│ 🔴 ALERTAS - COBROS ATRASADOS                │
│ ┌──────────────────────────────────────────┐│
│ │ Cliente ABC | Sushi Payo | €2,500       ││
│ │ Vencido hace: 45 días                    ││
│ │ [📧 Enviar recordatorio] [Ver detalles]  ││
│ └──────────────────────────────────────────┘│
├──────────────────────────────────────────────┤
│ 📊 MÉTRICAS                                  │
│ • Días promedio de cobro: 38 días           │
│ • Tasa de morosidad: 3.4%                    │
└──────────────────────────────────────────────┘
```

#### Pestaña 5: 🔮 Proyección IA
```
┌──────────────────────────────────────────────┐
│ 🔮 PROYECCIÓN FINANCIERA CON IA              │
├──────────────────────────────────────────────┤
│ 📈 FORECAST PRÓXIMOS 3 MESES                 │
│ • Febrero:  €22,500 ± €3,100                 │
│ • Marzo:    €24,800 ± €3,500                 │
│ • Abril:    €21,200 ± €2,900                 │
│ Confianza: 87%                               │
├──────────────────────────────────────────────┤
│ 🎯 OBJETIVOS                                 │
│ Objetivo semestral: €150,000                 │
│ Progreso: €82,000 (54.7%)                    │
│ ┌──────────────────────────────────────────┐│
│ │ ████████████░░░░░░░░░░░░░░░              ││
│ └──────────────────────────────────────────┘│
│ Para alcanzar objetivo:                      │
│ • Necesitas: €22,666/mes                     │
│ • Estás en camino ✅                         │
├──────────────────────────────────────────────┤
│ 📊 FORECAST VS REAL                          │
│ [Gráfica comparando proyección vs real]      │
│ Accuracy score: 87%                          │
└──────────────────────────────────────────────┘
```

---

### 2.4 Formularios Dinámicos por Fase del Pipeline

**Ubicación:** Modal que aparece al arrastrar OBV entre fases en CRM por proyecto

**Archivo:** `src/components/crm/PipelinePhaseModal.tsx` (NUEVO)

**Lógica:**

```typescript
interface PipelinePhaseModalProps {
  obv: OBV;
  oldPhase: LeadStatus;
  newPhase: LeadStatus;
  onConfirm: (updatedData: Partial<OBV>) => void;
  onCancel: () => void;
}

// Campos según la transición:
const PHASE_FIELDS = {
  'frio -> tibio': ['telefono_contacto', 'empresa', 'proxima_accion_fecha'],
  'tibio -> hot': ['valor_potencial', 'producto', 'notas'],
  'hot -> propuesta': ['valor_potencial', 'cantidad', 'precio_unitario'],
  'propuesta -> negociacion': ['notas', 'costes_estimados'],
  'negociacion -> cerrado_ganado': [
    'nombre_contacto',  // REQUERIDO
    'email_contacto',   // REQUERIDO
    'telefono_contacto', // REQUERIDO
    'empresa',          // REQUERIDO
    'cantidad',         // REQUERIDO
    'precio_unitario',  // REQUERIDO
    'facturacion',      // Auto-calculado
    'costes',           // REQUERIDO
    'costes_detalle',   // Opcional (desglose)
    'margen',           // Auto-calculado
    'producto',         // REQUERIDO
    'cobro_fecha_esperada', // REQUERIDO
    'cobro_metodo'      // REQUERIDO
  ]
};

// Formulario con validación de Zod
```

**Comportamiento:**
- ✅ Al arrastrar de una fase a otra → Modal aparece
- ✅ Campos pre-rellenados si ya existen datos
- ✅ Validación: no permite confirmar sin campos requeridos
- ✅ "Cerrado ganado" requiere TODOS los datos financieros
- ✅ Al confirmar: actualiza OBV y cambia fase
- ✅ Al cancelar: OBV vuelve a fase anterior

---

### 2.5 Sistema de Exportación a Excel

**Ubicación:** Botón en CRM Global y Financiero Global

**Archivo:** `src/utils/exportToExcel.ts`

**Funcionalidades:**

```typescript
// Exportar contactos desde CRM
function exportCRMToExcel(contacts: Contact[]) {
  // Columnas: Nombre, Empresa, Email, Teléfono, Proyecto, Estado, Responsable
}

// Exportar ventas desde Financiero
function exportFinancieroToExcel(sales: OBV[]) {
  // Columnas: Fecha, Proyecto, Cliente, Producto, Facturación, Costes, Margen, Estado Cobro
}

// Usar librería: xlsx o exceljs
```

**Botones:**
- 📊 **CRM Global → Pestaña "Centro de Contactos"**: Botón "Exportar contactos"
- 💰 **Financiero Global → Pestaña "Dashboard"**: Botón "Exportar ventas"

---

### 2.6 Onboarding Editable

**Ubicación:** Dentro de cada proyecto → Tab "Onboarding"

**Archivo:** `src/components/project/ProjectOnboardingTab.tsx`

**Cambios:**

```typescript
// Estado editable
const [isEditing, setIsEditing] = useState(false);
const [onboardingData, setOnboardingData] = useState(project.onboarding_data);

// Renderizar:
{isEditing ? (
  <>
    {/* Formulario completo del onboarding */}
    <OnboardingForm data={onboardingData} onChange={setOnboardingData} />

    <div className="flex gap-4 mt-6">
      <button onClick={handleSaveChanges}>💾 Save Changes</button>
      <button onClick={handleCancel}>❌ Cancel</button>
    </div>
  </>
) : (
  <>
    {/* Vista read-only */}
    <OnboardingDisplay data={onboardingData} />

    <button onClick={() => setIsEditing(true)}>✏️ Edit Onboarding</button>
  </>
)}

// Guardar cambios
async function handleSaveChanges() {
  const { error } = await supabase
    .from('projects')
    .update({
      onboarding_data: onboardingData,
      updated_at: new Date().toISOString()
    })
    .eq('id', project.id);

  if (!error) {
    toast.success('Onboarding actualizado correctamente');
    setIsEditing(false);
  }
}
```

**Restricción:** Solo miembros del proyecto pueden editar (verificar en RLS ya está)

---

### 2.7 Sistema de Tareas Ajustado

**Archivo:** `src/components/tasks/TaskList.tsx` y `src/components/tasks/GenerateTasksButton.tsx`

**Lógica:**

```typescript
// Verificar límite antes de generar
async function handleGenerateTasks(projectId: string, userId: string, role: string) {
  // 1. Contar tareas activas del usuario en este proyecto
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('assignee_id', userId)
    .in('status', ['todo', 'doing']);  // No contar 'done'

  // 2. Verificar límite
  if (count >= 5) {
    toast.error('Ya tienes 5 tareas activas. Completa alguna antes de generar más.');
    return;
  }

  // 3. Calcular cuántas puede generar
  const canGenerate = 5 - count;

  // 4. Llamar a IA para generar tareas
  const tasksToGenerate = Math.min(canGenerate, 5);
  const tasks = await generateTasksWithAI({
    projectId,
    role,
    count: tasksToGenerate,
    context: project.onboarding_data  // Usar onboarding para contexto
  });

  // 5. Crear tareas
  await supabase.from('tasks').insert(tasks);

  toast.success(`${tasks.length} tareas generadas`);
}
```

**Mostrar en UI:**
```
📋 Mis Tareas (3/5)
┌─────────────────────────────┐
│ □ Tarea 1                   │
│ □ Tarea 2                   │
│ ✓ Tarea 3 (completada)      │
└─────────────────────────────┘

[🤖 Generar más tareas] (puede generar 2 más)
```

---

### 2.8 Sistema de Notificaciones para Validadores

**Archivo:** `src/utils/notifications.ts`

**Trigger en base de datos:**

```sql
-- Crear notificación cuando se sube OBV/KPI
CREATE OR REPLACE FUNCTION notificar_validadores()
RETURNS TRIGGER AS $$
DECLARE
  validador_record RECORD;
  item_type TEXT;
  item_title TEXT;
BEGIN
  -- Determinar tipo de item
  IF TG_TABLE_NAME = 'obvs' THEN
    item_type := 'OBV';
    item_title := NEW.titulo;
  ELSIF TG_TABLE_NAME = 'kpis' THEN
    item_type := NEW.type;  -- 'lp', 'bp', 'cp'
    item_title := NEW.titulo;
  END IF;

  -- Obtener los 3 validadores del owner
  FOR validador_record IN
    SELECT user_id FROM validation_order
    WHERE position IN (
      SELECT position + 1, position + 2, position + 3
      FROM validation_order
      WHERE user_id = NEW.owner_id
        AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    )
  LOOP
    -- Crear notificación para cada validador
    INSERT INTO notifications (
      user_id,
      tipo,
      titulo,
      mensaje,
      link
    ) VALUES (
      validador_record.user_id,
      'validation_pending',
      'Nueva validación pendiente',
      'Tienes un nuevo ' || item_type || ' para validar: ' || item_title,
      '/validaciones'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a obvs y kpis
CREATE TRIGGER trigger_notificar_validadores_obv
AFTER INSERT ON obvs
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notificar_validadores();

CREATE TRIGGER trigger_notificar_validadores_kpi
AFTER INSERT ON kpis
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notificar_validadores();
```

**Componente de notificaciones:**

```typescript
// src/components/notifications/NotificationBell.tsx
function NotificationBell() {
  const { data: notifications, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('leida', false)
        .order('created_at', { ascending: false });
      return data;
    },
    refetchInterval: 30000  // Refetch cada 30s
  });

  const unreadCount = notifications?.length || 0;

  return (
    <button className="relative">
      🔔
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
```

---

## 📦 FASE 3: ARCHIVOS A MODIFICAR/CREAR

### Archivos SQL a Ejecutar (en orden):

1. ✅ `FASE1_1_unificar_leads_obvs.sql` (migración de leads → obvs)
2. ✅ `FASE1_2_sistema_cobros.sql` (añadir tracking de cobros)
3. ✅ `FASE1_3_costes_detallados.sql` (añadir desglose de costes)
4. ✅ `FASE1_4_rls_policies_abiertas.sql` (eliminar restricciones)
5. ✅ `FASE1_5_views_actualizadas.sql` (recrear views)

### Archivos TypeScript a Crear:

**Nuevas vistas:**
- `src/pages/views/ValidacionesView.tsx` (NUEVO)
- `src/pages/views/CRMView.tsx` (REFACTORIZAR COMPLETO)
- `src/pages/views/FinancieroView.tsx` (REFACTORIZAR COMPLETO)

**Nuevos componentes CRM:**
- `src/components/crm/CarteraClientesTab.tsx` (NUEVO)
- `src/components/crm/AnalisisConversionTab.tsx` (NUEVO)
- `src/components/crm/CentroContactosTab.tsx` (NUEVO)
- `src/components/crm/PrediccionIATab.tsx` (NUEVO)
- `src/components/crm/PipelinePhaseModal.tsx` (NUEVO)

**Nuevos componentes Financiero:**
- `src/components/financiero/DashboardEjecutivoTab.tsx` (NUEVO)
- `src/components/financiero/AnalisisProyectosTab.tsx` (NUEVO)
- `src/components/financiero/ProductosServiciosTab.tsx` (NUEVO)
- `src/components/financiero/ControlCobrosTab.tsx` (NUEVO)
- `src/components/financiero/ProyeccionIATab.tsx` (NUEVO)

**Nuevos componentes Validaciones:**
- `src/components/validaciones/ValidacionCard.tsx` (NUEVO)
- `src/components/validaciones/ValidacionModal.tsx` (NUEVO)

**Utilidades:**
- `src/utils/exportToExcel.ts` (NUEVO)
- `src/utils/notifications.ts` (actualizar)

**Hooks:**
- `src/hooks/useCRMGlobal.ts` (NUEVO)
- `src/hooks/useFinancieroGlobal.ts` (NUEVO)
- `src/hooks/useValidaciones.ts` (NUEVO)

### Archivos a Modificar:

- `src/components/project/ProjectTabs.tsx` - Añadir tab "Onboarding"
- `src/components/project/ProjectOnboardingTab.tsx` - Hacer editable
- `src/components/tasks/TaskList.tsx` - Añadir límite de 5 tareas
- `src/components/tasks/GenerateTasksButton.tsx` - Verificar límite
- `src/components/nova/OBVForm.tsx` - Añadir campos de pipeline y costes
- `src/types/index.ts` - Actualizar tipos OBV, Lead, etc.

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos:
- [ ] Ejecutar FASE1_1: Unificar leads → obvs
- [ ] Ejecutar FASE1_2: Sistema de cobros
- [ ] Ejecutar FASE1_3: Costes detallados
- [ ] Ejecutar FASE1_4: RLS policies abiertas
- [ ] Ejecutar FASE1_5: Views actualizadas
- [ ] Verificar que no hay errores en BD

### Backend/Edge Functions:
- [ ] Crear función para marcar cobros atrasados (cron job)
- [ ] Crear función IA para predicción de ventas
- [ ] Crear función IA para generación de tareas contextuales

### Frontend - Validaciones:
- [ ] Crear ValidacionesView.tsx
- [ ] Crear componentes de validación
- [ ] Implementar lógica de aprobación/rechazo
- [ ] Añadir notificaciones

### Frontend - CRM Global:
- [ ] Refactorizar CRMView.tsx con 4 tabs
- [ ] Crear CarteraClientesTab
- [ ] Crear AnalisisConversionTab
- [ ] Crear CentroContactosTab
- [ ] Crear PrediccionIATab
- [ ] Crear PipelinePhaseModal
- [ ] Implementar exportación a Excel

### Frontend - Financiero Global:
- [ ] Refactorizar FinancieroView.tsx con 5 tabs
- [ ] Crear DashboardEjecutivoTab
- [ ] Crear AnalisisProyectosTab
- [ ] Crear ProductosServiciosTab
- [ ] Crear ControlCobrosTab
- [ ] Crear ProyeccionIATab
- [ ] Implementar exportación a Excel

### Frontend - Otros:
- [ ] Hacer onboarding editable
- [ ] Ajustar sistema de tareas (límite 5)
- [ ] Actualizar OBVForm con nuevos campos
- [ ] Actualizar tipos TypeScript

### Testing:
- [ ] Probar flujo completo de OBV exploración → cerrado ganado
- [ ] Probar sistema de validaciones
- [ ] Probar límite de tareas
- [ ] Probar exportación a Excel
- [ ] Probar edición de onboarding
- [ ] Probar tracking de cobros

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

**Día 1-2: Base de datos**
1. Ejecutar migraciones SQL
2. Verificar que todo funciona
3. Hacer backup antes de eliminar tabla leads

**Día 3-4: Validaciones**
1. Crear vista ValidacionesView
2. Implementar lógica de validación
3. Notificaciones

**Día 5-7: CRM Global**
1. Refactorizar CRMView
2. Crear 4 pestañas
3. Formularios dinámicos por fase
4. Exportación Excel

**Día 8-10: Financiero Global**
1. Refactorizar FinancieroView
2. Crear 5 pestañas
3. Gráficas y análisis
4. Exportación Excel

**Día 11-12: Ajustes finales**
1. Onboarding editable
2. Sistema de tareas
3. Testing completo
4. Pulir UI/UX

---

## 📞 PRÓXIMOS PASOS

1. **Revisar este plan** - ¿Falta algo? ¿Algo que cambiar?
2. **Aprobar** - Confirmar que todo está claro
3. **Empezar implementación** - Comenzar por FASE 1 (base de datos)

**¿Estás listo para empezar? ¿Alguna pregunta o modificación al plan?**
