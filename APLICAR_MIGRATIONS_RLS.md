# 🚨 URGENTE: Aplicar Migrations de Seguridad RLS

**ESTADO:** ⚠️ CRÍTICO - Tablas sin protección RLS en producción

**Detectado por:** Lovable Code Security Review
**Fecha:** 25 Enero 2026

---

## 🔴 Problema

Lovable ha detectado que **2 migrations críticas de seguridad** existen en el código pero **NO se han aplicado a la base de datos**:

1. `20260125_enable_rls_missing_tables.sql` (371 líneas)
2. `20260125_fix_critical_rls_policies.sql` (414 líneas)

**Esto significa:** 10 tablas críticas siguen **sin protección RLS**, permitiendo acceso no autorizado a datos sensibles.

---

## 📋 Tablas Afectadas (SIN PROTECCIÓN)

| Tabla | Datos Sensibles | Riesgo |
|-------|----------------|--------|
| `activity_log` | Historial de acciones de usuarios | ALTO |
| `kpis` | Métricas de rendimiento | MEDIO |
| `kpi_validaciones` | Aprobaciones de KPIs | MEDIO |
| `projects` | Información de proyectos | MEDIO |
| `project_members` | Membresías y roles | ALTO |
| `obv_validaciones` | Validaciones de OBVs | MEDIO |
| `obv_participantes` | Participantes en OBVs | MEDIO |
| `profiles` | Emails y datos de usuarios | **CRÍTICO** |
| `objectives` | Objetivos de proyectos | MEDIO |
| `notifications` | Notificaciones privadas | ALTO |

---

## 🚀 SOLUCIÓN INMEDIATA

### Opción 1: Aplicar vía Supabase Dashboard (RECOMENDADO)

#### **Paso 1: Acceder al SQL Editor**

1. Abre tu proyecto en Supabase: https://supabase.com/dashboard/project/tqvzdgysxjrjtwvkhkli
2. Click en **SQL Editor** en el sidebar (icono de base de datos)
3. Click en **+ New Query**

#### **Paso 2: Ejecutar Primera Migration**

**Archivo:** `20260125_enable_rls_missing_tables.sql`

1. Copia **TODO** el contenido del archivo:
   ```bash
   # En tu terminal:
   cat supabase/migrations/20260125_enable_rls_missing_tables.sql
   ```

2. Pega el contenido completo en el SQL Editor
3. Click en **RUN** (o presiona Ctrl+Enter)
4. **Espera confirmación:** Debe decir "Success. No rows returned"

**✅ Qué hace esta migration:**
- Habilita RLS en 10 tablas críticas
- Crea 30+ policies de seguridad
- Implementa aislamiento basado en proyectos
- Protege privacidad de emails en `profiles`

#### **Paso 3: Ejecutar Segunda Migration**

**Archivo:** `20260125_fix_critical_rls_policies.sql`

1. Copia **TODO** el contenido del archivo:
   ```bash
   # En tu terminal:
   cat supabase/migrations/20260125_fix_critical_rls_policies.sql
   ```

2. Abre **Nueva Query** en SQL Editor
3. Pega el contenido completo
4. Click en **RUN**
5. **Espera confirmación:** Debe decir "Success. No rows returned"

**✅ Qué hace esta migration:**
- Corrige policies existentes con problemas
- Agrega validaciones de seguridad adicionales
- Mejora performance de queries con RLS

---

### Opción 2: Aplicar vía CLI de Supabase

Si tienes Supabase CLI instalado:

```bash
# 1. Asegúrate de estar autenticado
npx supabase login

# 2. Link al proyecto
npx supabase link --project-ref tqvzdgysxjrjtwvkhkli

# 3. Aplicar todas las migrations pendientes
npx supabase db push

# 4. Verificar que se aplicaron
npx supabase migration list
```

---

## ✅ Verificación

### Después de aplicar las migrations, ejecuta esta query:

```sql
-- Verificar que TODAS las tablas tienen RLS habilitado
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ Protegida'
    ELSE '❌ SIN PROTECCIÓN'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'activity_log', 'kpis', 'kpi_validaciones', 'projects',
    'project_members', 'obv_validaciones', 'obv_participantes',
    'profiles', 'objectives', 'notifications'
  )
ORDER BY tablename;
```

**Resultado Esperado:** Todas las filas deben mostrar `rls_enabled = true` ✅

### Verificar Policies Creadas:

```sql
-- Contar policies por tabla
SELECT
  schemaname,
  tablename,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

**Resultado Esperado:**
- `activity_log`: 2 policies
- `kpis`: 3 policies
- `kpi_validaciones`: 2 policies
- `projects`: 3 policies
- `project_members`: 3 policies
- `obv_validaciones`: 2 policies
- `obv_participantes`: 2 policies
- `profiles`: 2 policies
- `objectives`: 3 policies
- `notifications`: 4 policies

---

## 🧪 Testing

### Test 1: Verificar que usuarios solo ven sus propias notificaciones

```sql
-- Simular usuario específico (reemplaza con un user_id real)
SET request.jwt.claim.sub = 'tu-user-id-aqui';

-- Intentar ver todas las notificaciones (solo debe mostrar las del usuario)
SELECT * FROM notifications;
```

### Test 2: Verificar aislamiento de proyectos

```sql
-- Verificar que solo veo leads de mis proyectos
SELECT
  l.id,
  l.empresa,
  p.nombre as proyecto,
  'Debería tener acceso' as estado
FROM leads l
JOIN projects p ON p.id = l.project_id;
```

### Test 3: Verificar protección de emails

```sql
-- Verificar que NO puedo ver emails de otros usuarios
SELECT
  id,
  nombre,
  email,
  CASE
    WHEN email IS NULL THEN '✅ Email protegido'
    ELSE '❌ Email visible (ERROR)'
  END as privacidad
FROM members_public
WHERE auth_id != auth.uid()
LIMIT 5;
```

---

## 🔄 Estado de Lovable

Después de aplicar las migrations, Lovable debería:

1. ✅ Detectar que las migrations fueron aplicadas
2. ✅ Remover el error "Critical RLS security migrations pending deployment"
3. ✅ Permitir deployment sin bloqueo de seguridad

---

## 📊 Impacto

### Antes de aplicar:
- ❌ 10 tablas sin RLS (acceso no autorizado posible)
- ❌ Cualquier usuario podía leer datos de cualquier proyecto
- ❌ Emails de todos los usuarios visibles públicamente
- ❌ No hay aislamiento entre proyectos

### Después de aplicar:
- ✅ 10 tablas protegidas con RLS
- ✅ Usuarios solo ven datos de sus proyectos
- ✅ Emails protegidos (solo visible el propio)
- ✅ Aislamiento completo entre proyectos
- ✅ Audit trail protegido por usuario

---

## ⚠️ Problemas Conocidos

### Si aparece: "policy already exists"

Algunas policies pueden ya existir. **Esto es normal y seguro**. La migration continuará y creará las que faltan.

### Si aparece: "column does not exist"

Verifica que todas las migrations anteriores se hayan aplicado primero. Ejecuta:

```bash
npx supabase migration list
```

Y aplica cualquier migration pendiente antes de estas dos.

### Si aparece: "function get_member_id does not exist"

Ejecuta primero esta función helper:

```sql
CREATE OR REPLACE FUNCTION public.get_member_id(auth_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT id FROM public.profiles WHERE auth_id = $1 LIMIT 1;
$$;
```

---

## 🎯 Próximos Pasos

1. **Aplicar las 2 migrations** (arriba)
2. **Ejecutar queries de verificación** (arriba)
3. **Confirmar en Lovable** que el error desapareció
4. **Testing manual** en la app para verificar que todo funciona
5. **Monitorear logs** por 24h para detectar problemas de acceso

---

## 📞 Soporte

Si encuentras errores al aplicar las migrations:

1. **Copia el mensaje de error completo**
2. **Verifica en qué línea falló** (Supabase SQL Editor muestra la línea)
3. **Revisa si alguna policy ya existe** (puedes dropearla primero)
4. **Intenta aplicar el resto** de la migration manualmente

---

## ✅ Checklist de Aplicación

- [ ] Backup de la base de datos (opcional pero recomendado)
- [ ] Aplicar `20260125_enable_rls_missing_tables.sql`
- [ ] Verificar "Success" en SQL Editor
- [ ] Aplicar `20260125_fix_critical_rls_policies.sql`
- [ ] Verificar "Success" en SQL Editor
- [ ] Ejecutar query de verificación de RLS
- [ ] Confirmar que todas las tablas tienen `rls_enabled = true`
- [ ] Ejecutar query de conteo de policies
- [ ] Verificar números esperados
- [ ] Testing manual en la app
- [ ] Confirmar en Lovable que error desapareció
- [ ] Monitoring por 24h

---

**IMPORTANTE:** Estas migrations son **idempotentes** - puedes ejecutarlas múltiples veces sin problemas. Si alguna policy ya existe, simplemente continuará con la siguiente.

**NO SALTES ESTE PASO** - Sin estas migrations, tu app está vulnerable a acceso no autorizado.

---

**Generado:** 25 Enero 2026
**Prioridad:** 🔴 CRÍTICA
**Tiempo Estimado:** 10 minutos
**Riesgo de Aplicación:** BAJO (migrations probadas en desarrollo)
