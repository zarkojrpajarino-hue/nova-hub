# 📋 GUÍA: Aplicar Migraciones FASE 1

**Fecha:** 26 Enero 2026
**Estado:** ✅ Archivos SQL listos para aplicar
**CRÍTICO:** Hacer backup ANTES de aplicar

---

## ⚠️ ANTES DE EMPEZAR

### 1. Hacer Backup Completo
```sql
-- En Supabase Dashboard → Settings → Database → Backups
-- O usar pg_dump desde tu terminal
```

### 2. Cerrar Aplicación
- Detener el servidor local (`npm run dev`)
- Asegurarte de que nadie esté usando la app en producción

### 3. Verificar Tabla `members` (no `profiles`)
```sql
-- Ejecuta esto para confirmar el nombre de la tabla:
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%member%' OR tablename LIKE '%profile%';
```

**IMPORTANTE:** Si tu tabla se llama `profiles` en lugar de `members`, debes buscar y reemplazar en TODOS los archivos SQL:
- Buscar: `members`
- Reemplazar: `profiles`

---

## 📂 ARCHIVOS SQL A APLICAR (EN ORDEN)

Los archivos están en: `C:\Users\Zarko\nova-hub\supabase\migrations\`

1. ✅ **FASE1_1_unificar_leads_obvs.sql**
2. ✅ **FASE1_2_sistema_cobros.sql**
3. ✅ **FASE1_3_costes_detallados.sql**
4. ✅ **FASE1_4_rls_policies_abiertas.sql**
5. ✅ **FASE1_5_views_actualizadas.sql**

---

## 🚀 PASO A PASO

### PASO 1: Aplicar FASE1_1 (Unificar Leads → OBVs)

**Ubicación:** Supabase Dashboard → SQL Editor → New query

1. Abre el archivo: `FASE1_1_unificar_leads_obvs.sql`
2. Copia TODO el contenido
3. Pégalo en Supabase SQL Editor
4. **LEE LAS NOTAS del archivo** (están al final)
5. Click en **"Run"**

**Verificación:**
```sql
-- Ver OBVs con datos de pipeline:
SELECT id, titulo, tipo, pipeline_status, nombre_contacto, empresa
FROM obvs
WHERE nombre_contacto IS NOT NULL
LIMIT 10;

-- Contar OBVs por tipo:
SELECT tipo, COUNT(*) FROM obvs GROUP BY tipo;

-- Ver historial de pipeline:
SELECT * FROM obv_pipeline_history ORDER BY created_at DESC LIMIT 10;
```

**⚠️ IMPORTANTE:**
- Las tablas `leads` y `lead_history` NO se eliminan automáticamente
- Verifica que los datos migraron correctamente ANTES de eliminarlas
- Para eliminar después de verificar:
```sql
DROP TABLE IF EXISTS lead_history CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
```

---

### PASO 2: Aplicar FASE1_2 (Sistema de Cobros)

1. Abre el archivo: `FASE1_2_sistema_cobros.sql`
2. Copia TODO el contenido
3. Pégalo en Supabase SQL Editor
4. Click en **"Run"**

**Verificación:**
```sql
-- Ver dashboard de cobros:
SELECT * FROM dashboard_cobros;

-- Ver cobros por proyecto:
SELECT * FROM cobros_por_proyecto;

-- Ver alertas de cobros atrasados:
SELECT * FROM alertas_cobros_atrasados;
```

---

### PASO 3: Aplicar FASE1_3 (Costes Detallados)

1. Abre el archivo: `FASE1_3_costes_detallados.sql`
2. Copia TODO el contenido
3. Pégalo en Supabase SQL Editor
4. Click en **"Run"**

**Verificación:**
```sql
-- Ver análisis de costes global:
SELECT * FROM analisis_costes_global;

-- Ver análisis por proyecto:
SELECT * FROM analisis_costes_por_proyecto;

-- Ver una OBV con costes detallados:
SELECT
  titulo,
  facturacion,
  costes,
  margen,
  costes_detalle
FROM obvs
WHERE costes_detalle IS NOT NULL
LIMIT 1;
```

---

### PASO 4: Aplicar FASE1_4 (RLS Policies Abiertas) ⚠️ CRÍTICO

**Este es el cambio MÁS IMPORTANTE** - Cambia toda la seguridad.

1. Abre el archivo: `FASE1_4_rls_policies_abiertas.sql`
2. Copia TODO el contenido
3. Pégalo en Supabase SQL Editor
4. Click en **"Run"**

**Verificación:**
```sql
-- Ver todas las policies activas:
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Ver policies de obvs (debe empezar con "nova_"):
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'obvs';

-- Contar policies por tabla:
SELECT tablename, COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Resultado esperado:**
- Todas las policies antiguas eliminadas
- Nuevas policies con prefijo `nova_`
- Views `members_public`, `obvs_public`, `obvs_financial` eliminados

---

### PASO 5: Aplicar FASE1_5 (Views Actualizadas)

1. Abre el archivo: `FASE1_5_views_actualizadas.sql`
2. Copia TODO el contenido
3. Pégalo en Supabase SQL Editor
4. Click en **"Run"**

**Verificación:**
```sql
-- Ver CRM cerrados ganados:
SELECT * FROM crm_cerrados_ganados LIMIT 5;

-- Ver stats de miembros:
SELECT * FROM member_stats_complete LIMIT 5;

-- Ver stats de proyectos:
SELECT * FROM project_stats_complete;

-- Ver top productos:
SELECT * FROM top_productos_rentables LIMIT 10;

-- Ver forecast:
SELECT * FROM forecast_ingresos;
```

---

## ✅ VERIFICACIÓN FINAL

### 1. Verificar Estructura de `obvs`:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'obvs'
ORDER BY ordinal_position;
```

**Debe incluir estos campos nuevos:**
- ✅ `nombre_contacto`
- ✅ `empresa`
- ✅ `email_contacto`
- ✅ `telefono_contacto`
- ✅ `pipeline_status`
- ✅ `valor_potencial`
- ✅ `cobro_estado`
- ✅ `cobro_fecha_esperada`
- ✅ `costes_detalle`

### 2. Verificar RLS Habilitado:
```sql
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('obvs', 'members', 'projects', 'kpis', 'tasks');
```

**Todos deben tener** `rls_enabled = true`

### 3. Verificar Views Existen:
```sql
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
```

**Debe incluir:**
- ✅ `crm_cerrados_ganados`
- ✅ `member_stats_complete`
- ✅ `project_stats_complete`
- ✅ `analisis_conversion_pipeline`
- ✅ `top_productos_rentables`
- ✅ `top_clientes_valor`
- ✅ `dashboard_cobros`
- ✅ `analisis_costes_global`
- ✅ `forecast_ingresos`

### 4. Verificar Triggers:
```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname LIKE '%obv%' OR tgname LIKE '%cost%' OR tgname LIKE '%cobro%';
```

**Debe incluir:**
- ✅ `trigger_registrar_cambio_pipeline`
- ✅ `trigger_actualizar_estado_cobro`
- ✅ `trigger_auto_calcular_costes`
- ✅ `trigger_check_obv_validations`

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "relation 'members' does not exist"
**Solución:** Tu tabla se llama `profiles`, no `members`. Reemplaza en TODOS los archivos SQL.

### Error: "relation 'leads' does not exist"
**Esto es normal** - Si ya no existe tabla leads, el script la omite automáticamente.

### Error: "column already exists"
**Solución:** Ya aplicaste parte del script antes. Puedes:
1. Restaurar backup y empezar de nuevo
2. O comentar las líneas que dan error y continuar

### Error: "policy already exists"
**Solución:** Elimina la policy manualmente:
```sql
DROP POLICY IF EXISTS "nombre_de_la_policy" ON nombre_tabla;
```

### Error: "view already exists"
**Solución:** Elimina el view y vuelve a crearlo:
```sql
DROP VIEW IF EXISTS nombre_view CASCADE;
```

---

## 📝 CHECKLIST FINAL

Después de aplicar TODAS las migraciones:

- [ ] Backup creado ✅
- [ ] FASE1_1 aplicada ✅
- [ ] FASE1_2 aplicada ✅
- [ ] FASE1_3 aplicada ✅
- [ ] FASE1_4 aplicada ✅
- [ ] FASE1_5 aplicada ✅
- [ ] Verificaciones ejecutadas ✅
- [ ] Tabla `leads` eliminada (después de verificar migración) ✅
- [ ] App funciona correctamente ✅

---

## 🔄 SIGUIENTE PASO

Una vez aplicadas TODAS las migraciones SQL:

1. **Actualizar código TypeScript** - Cambiar referencias de:
   - `members_public` → `members`
   - `obvs_public` → `obvs` (para SELECT)
   - Añadir nuevos campos a tipos

2. **Testing local:**
```bash
npm run dev
```

3. **Verificar que todo funciona:**
   - Login/Logout
   - Ver OBVs
   - Ver datos financieros (TODOS deben ver TODO)
   - Crear OBV
   - Validar OBV

---

## 📞 AYUDA

Si encuentras errores durante la aplicación:

1. **NO ENTRES EN PÁNICO** - Tienes backup
2. **Anota el error exacto**
3. **Revisa la sección "Solución de Problemas" arriba**
4. **Restaura backup si es necesario**

---

**Estado:** ⏸️ Esperando aplicación de migraciones
**Próximo paso:** Actualizar código frontend
