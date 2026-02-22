# 🔒 GUÍA: Corregir Problemas de Seguridad en Supabase

## ⚠️ ESTADO ACTUAL
Tu base de datos tiene **múltiples problemas críticos** de seguridad que están causando:
- ❌ App va a tirones (queries bloqueadas)
- ❌ Features que no funcionan
- ❌ Errores en consola
- ❌ Datos potencialmente expuestos

## 🎯 SOLUCIÓN: Ejecutar Script SQL

### Opción 1: SQL Editor (RECOMENDADO)

1. **Abre Supabase Dashboard**:
   - Ve a https://supabase.com/dashboard/project/sngjcqqbvmpfwigfwigb
   - Ve a `SQL Editor`

2. **Crea una nueva query**:
   - Click en `New query`

3. **Copia y pega** el contenido del archivo:
   ```
   supabase/migrations/FIX_ALL_SECURITY_ISSUES.sql
   ```

4. **Ejecuta** la query (Run / Ctrl+Enter)

5. **Verifica** que no hay errores en el output

---

### Opción 2: CLI de Supabase (Si tienes instalado)

```bash
cd /c/Users/Zarko/nova-hub

# Aplicar la migración
supabase db push

# O ejecutar el script directamente
psql "postgresql://postgres.[PROJECT-REF]@aws-0-us-west-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/FIX_ALL_SECURITY_ISSUES.sql
```

---

## 📋 QUÉ HACE EL SCRIPT

El script corrige automáticamente:

### ✅ Parte 1: Habilitar RLS (Row Level Security)
Habilita RLS en 11 tablas sin protección:
- badges
- key_results
- member_badges
- okrs
- project_context
- role_meeting_insights
- role_meetings
- transacciones
- cobros_parciales
- objetivos_semanales
- obv_pipeline_history

### ✅ Parte 2: Eliminar Políticas Duplicadas
Elimina políticas RLS duplicadas en:
- kpis
- notifications
- leads
- objectives

### ✅ Parte 3: Crear Políticas de Acceso
Crea políticas correctas para que:
- Los usuarios solo vean datos de sus proyectos
- Las insignias sean públicas
- Los datos financieros estén protegidos

### ✅ Parte 4: Corregir Security Definer Views
Reemplaza vistas inseguras con versiones seguras:
- active_projects
- deleted_projects

### ✅ Parte 5: Fijar search_path en Funciones
Corrige 5 funciones SQL para prevenir inyección:
- actualizar_estado_cobro
- archive_notification
- snooze_notification
- restore_project
- soft_delete_project

---

## 🔧 ACCIONES MANUALES ADICIONALES

Después de ejecutar el script, debes hacer manualmente:

### 1. Habilitar Protección de Contraseñas Filtradas
1. Ve a `Authentication` → `Policies` → `Settings`
2. Busca "Leaked Password Protection"
3. **Actívalo** (toggle ON)

### 2. Revisar Funciones Complejas (Opcional - Baja Prioridad)
Las siguientes funciones tienen el warning "Function Search Path Mutable":
- auto_calcular_costes_y_margen
- calcular_costes_desde_detalle
- check_kpi_validations
- check_obv_validations
- crear_costes_detalle
- create_notification
- create_transaction_from_obv

**Acción**: Agregar `SET search_path = public, pg_temp` a cada una.
**Nota**: Esto es de baja prioridad, no afecta la funcionalidad actual.

---

## 🧪 VERIFICACIÓN

### 1. Verifica en Supabase Security Advisor
1. Ve a `Database` → `Advisors`
2. Verifica que:
   - ✅ "RLS Disabled in Public" errors han desaparecido
   - ✅ Quedan solo warnings menores (no críticos)

### 2. Verifica tablas con RLS habilitado
Ejecuta en SQL Editor:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;
```
**Resultado esperado**: Todas las tablas deben mostrar `rowsecurity = true`

### 3. Verifica políticas creadas
Ejecuta en SQL Editor:
```sql
SELECT tablename, COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```
**Resultado esperado**: Cada tabla debe tener 1-4 políticas

---

## 🚀 PRUEBA LA APLICACIÓN

1. **Reinicia tu servidor de desarrollo**:
   ```bash
   cd /c/Users/Zarko/nova-hub
   npm run dev
   ```

2. **Abre la app** en tu navegador

3. **Verifica**:
   - ✅ La app carga rápidamente (sin tirones)
   - ✅ Todas las features funcionan
   - ✅ No hay errores en la consola del navegador (F12)
   - ✅ Los datos se cargan correctamente

---

## 🐛 SI HAY PROBLEMAS

### Error: "relation does not exist"
- **Causa**: Alguna tabla no existe en tu base de datos
- **Solución**: Verifica que todas las migraciones anteriores se aplicaron correctamente

### Error: "permission denied"
- **Causa**: Estás usando la anon key en vez de la service role key
- **Solución**: Verifica que el script se ejecutó con permisos de admin

### Error: "policy already exists"
- **Causa**: Algunas políticas ya existen
- **Solución**: El script usa `CREATE POLICY IF NOT EXISTS`, debería ser ignorado

### La app sigue con errores
1. Abre la consola del navegador (F12)
2. Mira el error específico
3. Compártelo conmigo para ayudarte a resolverlo

---

## 📞 ¿NECESITAS AYUDA?

Si encuentras errores durante la ejecución:
1. Copia el mensaje de error completo
2. Indícame en qué parte del script falló
3. Te ayudaré a resolverlo

---

## 🎉 RESULTADO ESPERADO

Después de aplicar todo:
- ✅ Supabase Security Advisor mostrará ~90% menos errores
- ✅ La app cargará suavemente sin tirones
- ✅ Todas las features del código funcionarán
- ✅ Los datos estarán protegidos correctamente
- ✅ La consola no mostrará errores de permisos

**Tiempo estimado**: 5-10 minutos total
