# 🚀 EJECUTAR SQLs EN SUPABASE - PASO A PASO

**IMPORTANTE:** Ejecuta estos SQLs en el **SQL Editor de Supabase** en este orden exacto.

URL: https://supabase.com/dashboard/project/aguuckggskweobxeosrq/sql

---

## 📋 ANTES DE EMPEZAR

### 1. Verificar estado actual de la DB

Primero ejecuta esto para ver qué tienes:

**Archivo:** `check-db-status.sql`

```sql
-- Ver qué tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Resultado esperado:**

Si ves tablas como `members`, `projects`, `tasks`, etc. → **La DB ya está configurada**

Si NO ves tablas → **La DB está vacía**

---

## 🎯 OPCIÓN A: DB VACÍA (Ejecutar todo desde cero)

### Paso 1: Setup Base
**Archivo:** `SETUP_NUEVA_DB_ASIA.sql`

1. Abre Supabase SQL Editor
2. Copia TODO el contenido de `SETUP_NUEVA_DB_ASIA.sql`
3. Pega en el editor
4. Click en **"Run"** (▶️)
5. Espera a que termine (puede tardar 10-20 segundos)

**Verifica:**
```sql
SELECT COUNT(*) FROM public.members;
-- Debe devolver 0 (tabla creada pero vacía)
```

### Paso 2: Sistema de Rotación
**Archivo:** `SQL_SISTEMA_ROTACION_ROLES.sql`

1. Copia TODO el contenido
2. Pega en el editor
3. **Run** ▶️

**Verifica:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'role_exploration_periods',
  'role_preferences',
  'role_performance_metrics',
  'role_rotation_history'
);
-- Debe devolver 4 filas
```

### Paso 3: Sistema de Feedback
**Archivo:** `migration_feedback_system.sql`

1. Copia TODO el contenido
2. Pega en el editor
3. **Run** ▶️

**Verifica:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'peer_feedback',
  'role_competition_results',
  'feedback_summary'
);
-- Debe devolver 3 filas
```

---

## 🎯 OPCIÓN B: DB YA CONFIGURADA (Solo añadir nuevo sistema)

Si ya tienes tablas `members`, `projects`, etc., ejecuta solo:

### Paso 1: Sistema de Rotación (si no lo ejecutaste antes)
**Archivo:** `SQL_SISTEMA_ROTACION_ROLES.sql`

### Paso 2: Sistema de Feedback (NUEVO)
**Archivo:** `migration_feedback_system.sql`

---

## ✅ VERIFICACIÓN FINAL

Ejecuta esto al final para verificar que todo está OK:

```sql
-- 1. Ver todas las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar RLS está activado
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Ver vistas creadas
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Contar políticas RLS
SELECT
  tablename,
  COUNT(*) as policies_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Resultado esperado:**

Deberías ver:
- ✅ ~15-20 tablas
- ✅ RLS enabled en todas las tablas importantes
- ✅ 2 vistas (`member_feedback_overview`, `active_role_competitions`)
- ✅ Políticas RLS en cada tabla

---

## ⚠️ SI HAY ERRORES

### Error: "relation already exists"
**Solución:** La tabla ya existe. Ignora el error o elimínala primero.

### Error: "type already exists"
**Solución:** Los ENUMs ya existen. Ignora el error.

### Error: "permission denied"
**Solución:** Asegúrate de estar usando la **service_role** key, no la anon key.

### Error: "syntax error"
**Solución:** Asegúrate de copiar TODO el archivo, desde la primera línea hasta la última.

---

## 📊 DESPUÉS DE EJECUTAR

### Crear tu usuario

Si la DB estaba vacía, necesitas crear tu usuario:

```sql
-- REEMPLAZA 'TU_AUTH_ID' con tu auth_id real
-- Lo obtienes haciendo login en la app primero

INSERT INTO public.members (auth_id, email, nombre, color, role, especialization)
VALUES (
  'TU_AUTH_ID_AQUI',
  'zarkojr.nova@gmail.com',
  'Zarko',
  '#F472B6',
  'admin',
  'ai_tech'
);
```

**¿Cómo obtener tu AUTH_ID?**

1. Haz login en la app
2. Ve a Supabase Dashboard → Authentication → Users
3. Busca tu email
4. Copia el UUID de la columna "ID"
5. Ese es tu `auth_id`

---

## 🎉 ¡LISTO!

Una vez ejecutados los 3 SQLs:

✅ Schema completo configurado
✅ Sistema de rotación de roles activo
✅ Sistema de feedback 360° activo
✅ RLS configurado
✅ Triggers automáticos funcionando

**Siguiente paso:** Ejecutar la app y ver que funciona.

---

## 📝 CHECKLIST

- [ ] Ejecuté `SETUP_NUEVA_DB_ASIA.sql` (si DB vacía)
- [ ] Ejecuté `SQL_SISTEMA_ROTACION_ROLES.sql`
- [ ] Ejecuté `migration_feedback_system.sql`
- [ ] Verifiqué que las tablas se crearon
- [ ] Verifiqué que RLS está activo
- [ ] Creé mi usuario en `members`
- [ ] Puedo hacer login en la app

**Avísame cuando hayas terminado de ejecutar los SQLs.**
