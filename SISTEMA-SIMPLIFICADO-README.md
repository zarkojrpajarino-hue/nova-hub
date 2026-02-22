# ✅ SISTEMA SIMPLIFICADO - Uso Interno Empresa

## CAMBIOS REALIZADOS

Has identificado correctamente que el sistema anterior era demasiado complejo para tu caso de uso.

### ❌ ELIMINADO (innecesario para uso interno):

1. **Planes de pago** (Free/Pro/Enterprise con pricing)
2. **Sistema de créditos de IA**
3. **Sistema de aprobaciones manuales**
4. **Tablas de suscripciones**
5. **Monetización**

### ✅ MANTENIDO (valor real):

1. **AI Workers especializados** (10 tipos diferentes)
2. **Sistema de ejecución automática**
3. **Task routing inteligente (NLP)**
4. **Templates de ejecución**
5. **Project Intelligence System** (contexto rico)

### ✅ SIMPLIFICADO:

**Límites globales para TODOS los usuarios:**
- 🎯 **5 tareas/día** por usuario
- 🎯 **35 tareas/semana** por usuario
- 🤖 **10 ejecuciones IA/día** por usuario
- 🤖 **50 ejecuciones IA/semana** por usuario

**Sin distinción de roles, sin admin, sin planes.**

---

## 📊 ARQUITECTURA SIMPLIFICADA

### Tabla: `system_limits`
Configuración global simple:
```json
{
  "max_tasks_per_day": 5,
  "max_tasks_per_week": 35,
  "max_ai_executions_per_day": 10,
  "max_ai_executions_per_week": 50
}
```

### Tabla: `user_usage_limits`
Tracking individual:
- Contador diario por usuario
- Contador semanal por usuario (lunes-domingo)
- Reset automático cada día/semana

### Function: `can_execute_task(user_id, is_ai_execution)`
Verifica límites y devuelve:
```json
{
  "can_execute": true/false,
  "reason": "OK" o "Límite diario alcanzado",
  "limits": {
    "daily": {
      "tasks_used": 3,
      "tasks_limit": 5,
      "ai_executions_used": 2,
      "ai_executions_limit": 10
    },
    "weekly": {
      "tasks_used": 12,
      "tasks_limit": 35,
      "ai_executions_used": 8,
      "ai_executions_limit": 50
    }
  }
}
```

---

## 📁 ARCHIVOS A EJECUTAR

### OPCIÓN 1: Sistema Simplificado (RECOMENDADO)

#### Paso 1: SQL Simplificado
```bash
# Ejecutar en Supabase SQL Editor:
C:\Users\Zarko\nova-hub\phase-E-ai-execution-SIMPLE.sql
```

**Esto crea:**
- ✅ Límites globales (5/día, 35/semana)
- ✅ 10 AI Workers disponibles para todos
- ✅ Tracking de uso diario/semanal
- ✅ Sin planes, sin créditos, sin pagos

#### Paso 2: Project Intelligence (OPCIONAL pero recomendado)
```bash
# Si quieres contexto rico para outputs de calidad:
C:\Users\Zarko\nova-hub\phase-F-project-intelligence.sql
```

**Esto añade:**
- ✅ Buyer personas detallados
- ✅ Value propositions con pruebas
- ✅ Brand guidelines
- ✅ Competitive intelligence
- ✅ Conversation memory
- ✅ Learning loops

#### Paso 3: Deploy Edge Functions
```bash
cd C:\Users\Zarko\nova-hub

# Reemplazar ai-task-router con versión simplificada
cp supabase/functions/ai-task-router/index-simple.ts supabase/functions/ai-task-router/index.ts

# Deploy
npx supabase functions deploy ai-task-router
npx supabase functions deploy ai-task-executor
npx supabase functions deploy auto-sync-finances
```

### OPCIÓN 2: Solo límites básicos (mínimo)

Si NO quieres el sistema de ejecución de IA aún, solo límites:

```sql
-- Solo ejecutar la parte de límites del SQL:
CREATE TABLE user_usage_limits (...);
CREATE FUNCTION can_execute_task (...);
CREATE TRIGGER increment_task_usage (...);
```

---

## 🎯 FLUJO DE USUARIO

### Escenario: Usuario crea tarea

1. **Usuario escribe**: "Conseguir 5 clientes restaurantes en Madrid"

2. **Sistema verifica límites**:
   ```
   ¿Puede crear tarea?
   - Tareas hoy: 2/5 ✅
   - Tareas semana: 8/35 ✅
   → SÍ, puede crear
   ```

3. **AI Router clasifica**:
   ```
   Tipo: lead_generation
   Worker: lead_scraper
   Params: {quantity: 5, industry: "restaurante", location: "Madrid"}
   ```

4. **AI Executor ejecuta**:
   - 🔍 Scrapea 5 restaurantes
   - 📧 Extrae emails/teléfonos
   - ✍️ Genera 5 pitches personalizados
   - ✅ Output: 5 campañas listas

5. **Usuario solo**: Revisa 2 mins → Aprueba → Envía ✅

### Si alcanza límite:

```
❌ "Límite diario alcanzado (5/5 tareas hoy)"
💡 "Podrás crear más tareas mañana"
📊 "Esta semana: 15/35 tareas usadas"
```

---

## 📊 DASHBOARD DE USO

Con la vista `user_usage_dashboard` puedes mostrar en frontend:

```sql
SELECT * FROM user_usage_dashboard WHERE user_id = 'xxx';
```

Devuelve:
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@empresa.com",
  "tasks_today": 3,
  "tasks_this_week": 12,
  "daily_task_limit": 5,
  "weekly_task_limit": 35,
  "tasks_remaining_today": 2,
  "tasks_remaining_this_week": 23
}
```

Esto lo puedes mostrar en un widget:
```
📊 Uso de Tareas
Hoy: ████░ 3/5
Semana: ███████░░░ 12/35
```

---

## 🔧 AJUSTAR LÍMITES

Si quieres cambiar los límites globales:

```sql
UPDATE system_limits
SET setting_value = '{
  "max_tasks_per_day": 10,
  "max_tasks_per_week": 50,
  "max_ai_executions_per_day": 20,
  "max_ai_executions_per_week": 100
}'::jsonb
WHERE setting_name = 'task_limits';
```

---

## ⚠️ IMPORTANTE: Eliminar archivos antiguos

Los archivos con sistema de créditos/planes ya NO son necesarios:

```bash
# BORRAR (ya no usarás):
C:\Users\Zarko\nova-hub\phase-E-ai-execution-system.sql

# USAR en su lugar:
C:\Users\Zarko\nova-hub\phase-E-ai-execution-SIMPLE.sql
```

---

## 🚀 QUÉ HACER AHORA

### 1. Ejecutar SQL Simplificado
```sql
-- En Supabase SQL Editor:
C:\Users\Zarko\nova-hub\phase-E-ai-execution-SIMPLE.sql
```

### 2. (Opcional) Ejecutar Project Intelligence
```sql
-- Si quieres outputs de IA de alta calidad:
C:\Users\Zarko\nova-hub\phase-F-project-intelligence.sql
```

### 3. Actualizar `generate-tasks-v2`

Integrar verificación de límites:

```typescript
// Al inicio de generate-tasks-v2
const { data: canCreate } = await supabase.rpc('can_execute_task', {
  p_user_id: authUserId,
  p_is_ai_execution: false
});

if (!canCreate.can_execute) {
  return new Response(
    JSON.stringify({
      error: canCreate.reason,
      limits: canCreate.limits
    }),
    { status: 429, headers: corsHeaders }
  );
}
```

### 4. Frontend: Mostrar límites

Antes de que usuario cree tarea, mostrar:
```
"Puedes crear 2 tareas más hoy (3/5 usadas)"
"Esta semana llevas 12/35 tareas"
```

---

## 📈 VENTAJAS DE ESTE APPROACH

### ✅ Simplicidad:
- Sin complicaciones de planes/créditos
- Todos tienen mismo acceso
- Fácil de entender para usuarios

### ✅ Control:
- Límites previenen abuso
- Tracking de uso por usuario
- Fácil ajustar límites

### ✅ Escalable:
- Cuando quieras monetizar → Solo añadir tabla `subscription_plans`
- Los límites ya están implementados
- Infraestructura lista para crecer

### ✅ Uso interno empresa:
- Perfecto para equipos internos
- No necesitas pagos
- Todos colaboran sin restricciones de "plan"

---

## 🎊 RESUMEN

**ANTES**: Sistema complejo con planes Free/Pro/Enterprise, créditos, aprobaciones

**AHORA**: Sistema simple con límites globales (5/día, 35/semana) para todos

**RESULTADO**:
- ✅ Mismo poder de ejecución de IA
- ✅ Sin complejidad innecesaria
- ✅ Perfecto para uso interno
- ✅ Fácil escalar cuando quieras monetizar

---

## ❓ FAQ

**P: ¿Puedo tener usuarios admin que tengan límites diferentes?**
R: Sí, puedes añadir una columna `is_admin` a profiles y modificar `can_execute_task()` para que admins no tengan límites.

**P: ¿Puedo cambiar límites sin tocar código?**
R: Sí, solo UPDATE en tabla `system_limits`.

**P: ¿Cómo reinicio los contadores de un usuario?**
R: `DELETE FROM user_usage_limits WHERE user_id = 'xxx';`

**P: ¿Los límites son por usuario o por proyecto?**
R: Por usuario. Si quieres por proyecto, modificar la function.

---

**¿Listo para ejecutar? Confirma y te guío en el siguiente paso** 👍
