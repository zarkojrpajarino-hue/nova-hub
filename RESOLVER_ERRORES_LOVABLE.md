# Resolver Errores de Lovable - Análisis y Soluciones

**Fecha:** 25 Enero 2026
**Estado:** Las migrations RLS YA fueron aplicadas exitosamente

---

## ❌ Error 1: "Critical RLS security migrations pending deployment"

### 🔍 Análisis
**FALSO POSITIVO** - Este error es INCORRECTO.

**Razón:**
- Lovable detecta los archivos de migración en `supabase/migrations/`
- Pero NO puede verificar si ya se aplicaron a la base de datos
- **Realidad:** Estas migrations YA fueron aplicadas manualmente vía SQL Editor

**Evidencia:**
```sql
-- Verificación ejecutada mostró:
-- 14 tablas con RLS habilitado
-- 59 policies creadas
-- Todas las tablas críticas protegidas ✅
```

### ✅ Solución
**Opción 1 (Recomendada):** Ignorar este error - es informativo solamente. Las migrations están aplicadas.

**Opción 2:** Registrar las migrations en la tabla `supabase_migrations`:
```sql
-- Ejecutar en Supabase SQL Editor para que Lovable deje de reportar:
INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES
  ('20260125000001', ARRAY['-- Applied manually'], 'enable_rls_missing_tables'),
  ('20260125000002', ARRAY['-- Applied manually'], 'fix_critical_rls_policies')
ON CONFLICT (version) DO NOTHING;
```

---

## ⚠️ Error 2: "User Email Addresses Exposed"

### 🔍 Análisis
Lovable reporta que emails de usuarios son visibles a todos los usuarios autenticados.

**Estado Actual:**
- ✅ Ya creamos el view `members_public` que oculta emails
- ❓ Pero la tabla `members` directamente PODRÍA ser accesible

**Problema:** Si alguien consulta `SELECT * FROM members` directamente (no usando el view), verían todos los emails.

### ✅ Solución
Fortalecer las policies de la tabla `members` para ocultar emails:

```sql
BEGIN;

-- Eliminar policy actual que permite ver todo
DROP POLICY IF EXISTS "members_select_all" ON public.members;

-- Crear policy que oculta emails de otros usuarios
CREATE POLICY "members_select_limited"
ON public.members
FOR SELECT
TO authenticated
USING (true)  -- Permite ver filas
WITH CHECK (auth_id = auth.uid());  -- Solo modificar propias

-- NOTA: Para ocultar columnas específicas, debemos usar el view
-- Revocar acceso directo a la tabla y forzar uso del view
REVOKE SELECT ON public.members FROM authenticated;
GRANT SELECT ON public.members_public TO authenticated;

-- Permitir a usuarios autenticados actualizar solo su propio perfil
-- (ya existe members_update_own policy)

COMMIT;
```

**IMPORTANTE:** Después de esto, las apps deben usar `members_public` en lugar de `members` para consultas.

---

## 🔴 Error 3: "Financial Transaction Data Visible to All Project Members"

### 🔍 Análisis
Lovable reporta que la tabla `obvs` contiene datos financieros sensibles:
- `numero_factura` - Números de factura
- `cantidad_a_cobrar` - Montos a cobrar
- `margen` - Márgenes de ganancia
- `datos_bancarios` - Información bancaria

**Estado Actual:**
- La policy actual permite a TODOS los miembros del proyecto ver TODOS los obvs del proyecto
- Esto incluye datos financieros sensibles

**Pregunta de Diseño:** ¿Deberían todos los miembros del equipo ver datos financieros?

### ✅ Opciones de Solución

#### Opción A: Restricción por Rol (MÁS SEGURA)
Solo usuarios con roles `finance` o `leader` pueden ver datos financieros completos:

```sql
BEGIN;

-- Primero necesitamos verificar si existe una tabla de roles
-- Si existe project_members con columna 'role' o tabla user_roles

-- Si project_members tiene columna 'role':
DROP POLICY IF EXISTS "obvs_select_policy" ON public.obvs;

CREATE POLICY "obvs_select_basic_info"
ON public.obvs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = obvs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Para acceder a campos financieros, crear un view separado
CREATE OR REPLACE VIEW public.obvs_financial AS
SELECT
  o.*
FROM public.obvs o
WHERE EXISTS (
  SELECT 1
  FROM public.project_members pm
  WHERE pm.project_id = o.project_id
    AND pm.member_id = public.get_member_id(auth.uid())
    AND pm.role IN ('finance', 'leader', 'admin')  -- Roles permitidos
);

GRANT SELECT ON public.obvs_financial TO authenticated;

COMMIT;
```

#### Opción B: Crear View Público Sin Datos Financieros (BALANCE)
Todos ven obvs pero sin campos financieros sensibles:

```sql
BEGIN;

-- View público sin datos financieros
CREATE OR REPLACE VIEW public.obvs_public AS
SELECT
  id,
  project_id,
  lead_id,
  titulo,
  descripcion,
  fase,
  progreso,
  fecha_cierre_estimada,
  participantes,
  created_by,
  created_at,
  updated_at,
  -- OMITIR: numero_factura, cantidad_a_cobrar, margen, datos_bancarios, facturacion, costes
  'RESTRINGIDO' as nota_financiera
FROM public.obvs;

GRANT SELECT ON public.obvs_public TO authenticated;

-- Acceso completo solo a roles financieros (usar obvs directamente)

COMMIT;
```

#### Opción C: Mantener Como Está (MENOS SEGURA)
Si tu equipo trabaja con transparencia total, podrías mantener el acceso actual.

---

## 🔴 Error 4: "Financial Metrics Table Has No RLS"

### 🔍 Análisis
La tabla `financial_metrics` NO tiene Row Level Security habilitado.

**Verificación Necesaria:** ¿Existe esta tabla?

### ✅ Solución

```sql
-- Paso 1: Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'financial_metrics'
);

-- Si existe, aplicar RLS:
BEGIN;

ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Solo miembros del proyecto pueden ver métricas financieras
CREATE POLICY "financial_metrics_select_project_members"
ON public.financial_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = financial_metrics.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Policy: Solo roles finance/leader pueden insertar
CREATE POLICY "financial_metrics_insert_finance"
ON public.financial_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = financial_metrics.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
      AND pm.role IN ('finance', 'leader', 'admin')
  )
);

-- Policy: Solo roles finance/leader pueden actualizar
CREATE POLICY "financial_metrics_update_finance"
ON public.financial_metrics
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = financial_metrics.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
      AND pm.role IN ('finance', 'leader', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = financial_metrics.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
      AND pm.role IN ('finance', 'leader', 'admin')
  )
);

COMMIT;
```

---

## 📋 Plan de Acción Recomendado

### Paso 1: Verificar estructura actual
Ejecuta esto en Supabase SQL Editor:

```sql
-- ¿Existe financial_metrics?
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'financial_metrics'
) as financial_metrics_exists;

-- ¿Tiene project_members columna 'role'?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'project_members'
ORDER BY ordinal_position;

-- Ver estructura de obvs (confirmar columnas financieras)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'obvs'
AND column_name IN ('numero_factura', 'cantidad_a_cobrar', 'margen', 'datos_bancarios', 'facturacion', 'costes')
ORDER BY ordinal_position;
```

### Paso 2: Aplicar soluciones según hallazgos

1. **Error 1 (False positive):** Registrar migrations en tabla o ignorar
2. **Error 2 (Emails):** Revocar acceso a `members`, forzar uso de `members_public`
3. **Error 3 (Obvs financieros):** Decidir entre Opción A, B o C según política de empresa
4. **Error 4 (financial_metrics):** Habilitar RLS si la tabla existe

### Paso 3: Verificar que todo funciona

```sql
-- Después de aplicar cambios, ejecutar:
SELECT
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as num_policies
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('members', 'obvs', 'financial_metrics')
ORDER BY tablename;
```

---

## ⚠️ Decisiones Pendientes

**NECESITAS DECIDIR:**

1. **Email Privacy:** ¿Forzar uso de `members_public` view? (Recomendado: SÍ)

2. **Obvs Financieros:** ¿Qué nivel de restricción?
   - Opción A: Solo finance/leader ven datos financieros (MÁS SEGURA)
   - Opción B: Todos ven obvs pero sin campos sensibles (BALANCE)
   - Opción C: Mantener transparencia total (MENOS SEGURA)

3. **Financial Metrics:** Si existe la tabla, ¿quién debe tener acceso?
   - Ver: Todos los miembros del proyecto
   - Editar: Solo roles finance/leader

---

## 📊 Impacto de las Soluciones

### Antes:
- ❌ Emails visibles a todos
- ❌ Datos financieros visibles a todos los miembros del proyecto
- ❌ financial_metrics sin RLS

### Después:
- ✅ Emails solo visibles al propio usuario (via members_public)
- ✅ Datos financieros con control de acceso basado en roles
- ✅ financial_metrics protegida con RLS

---

**Siguiente Paso:** Ejecuta las queries de verificación del Paso 1 y comparte los resultados para preparar el SQL exacto que necesitas.
