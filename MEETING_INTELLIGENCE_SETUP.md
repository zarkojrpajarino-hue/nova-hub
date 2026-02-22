# 🎙️ Meeting Intelligence System - Setup Guide

## 📋 Descripción

Sistema completo de IA para reuniones que permite:
- Grabar/transcribir reuniones
- IA que facilita y guía la conversación en tiempo real
- Extracción automática de insights (tareas, decisiones, leads, métricas)
- Integración 100% con el sistema existente
- Revisión y aprobación manual antes de aplicar cambios

---

## 🚀 Instalación de Base de Datos

### Paso 1: Ejecutar Migración en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com)
2. Ve a **SQL Editor** (icono de base de datos en el sidebar)
3. Crea una **New Query**
4. Copia y pega el contenido completo de `migration_meeting_intelligence.sql`
5. Click en **Run** (o `Ctrl + Enter`)

Deberías ver un mensaje: **"Meeting Intelligence schema created successfully!"**

### Paso 2: Verificar la Instalación

Ejecuta este query en SQL Editor para verificar:

```sql
-- Verificar que todas las tablas se crearon
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'meeting%'
ORDER BY table_name;
```

Deberías ver:
- `meetings`
- `meeting_ai_questions`
- `meeting_ai_recommendations`
- `meeting_decisions`
- `meeting_insights`
- `meeting_participants`

---

## 📊 Estructura de Base de Datos

### 1. **meetings** - Tabla principal
Almacena toda la información de reuniones:
- Metadata básica (título, tipo, objetivos)
- Configuración pre-reunión (contexto estratégico, duración)
- Audio y transcripción
- Insights generados por IA
- Estados del procesamiento

**Estados:**
```
configuring → recording → processing_audio → transcribing →
analyzing → reviewing_questions → reviewing_insights → completed
```

### 2. **meeting_participants** - Participantes
- Participantes internos (miembros del proyecto)
- Participantes externos (invitados, clientes)
- Control de quién puede recibir tareas

### 3. **meeting_ai_questions** - Preguntas de IA
Preguntas que la IA hace durante la reunión para clarificar:
- Pregunta con contexto
- Respuesta (durante o post-reunión)
- Estado: pending, answered, ignored, skipped

### 4. **meeting_ai_recommendations** - Recomendaciones del Facilitador
Recomendaciones proactivas de la IA durante la reunión:
- Tipos: context_alert, missing_topic, time_management, etc.
- Acciones sugeridas
- Respuesta del usuario (aceptada/ignorada)

### 5. **meeting_insights** - Insights Extraídos
Insights que la IA extrae de la transcripción:
- Tipos: task, obv_update, lead, decision, risk, metric
- Contenido estructurado en JSON
- Estado de revisión y aplicación
- Vinculación a entidades creadas

### 6. **meeting_decisions** - Decisiones Documentadas
Decisiones clave tomadas en reuniones:
- Decisión con contexto y razonamiento
- Responsables y deadlines
- Vinculación a OBVs, tareas, métricas
- Estados: active, completed, cancelled, etc.

---

## 🔗 Integración con Sistema Existente

### Vinculaciones Automáticas

Cuando se aplican insights de reuniones:

```typescript
// TAREAS → tabla: tasks
meeting_insight (type: 'task') → task created → linked to:
  - project_id
  - assigned_to (member_id)
  - linked_obvs
  - meeting_id (trazabilidad)

// LEADS → tabla: leads
meeting_insight (type: 'lead_update') → lead updated → updates:
  - status (closed_won, closed_lost)
  - contract_value
  - linked to meeting_id

// MÉTRICAS → tabla: project_metrics
meeting_insight (type: 'metric') → metric recorded → updates:
  - financial dashboards
  - MRR/ARR calculations
  - linked to meeting_id

// OBVs → tabla: obvs
meeting_insight (type: 'obv_update') → obv updated → updates:
  - status change
  - blocker information
  - linked to meeting_id
```

### Campos de Trazabilidad

Todas las entidades creadas desde reuniones tienen:
- `created_from: 'meeting'` - Tag identificador
- `meeting_id: UUID` - Referencia a la reunión origen
- Link "Ver transcripción" en el UI

---

## 🔒 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado basado en:

```sql
-- Usuario puede acceder si es miembro del proyecto
project_id IN (
  SELECT project_id FROM project_members
  WHERE member_id = auth.uid()
)
```

**Políticas aplicadas:**
- SELECT: Ver reuniones/insights de proyectos donde eres miembro
- INSERT: Crear reuniones en proyectos donde eres miembro
- UPDATE: Modificar reuniones de tus proyectos
- DELETE: Cascada automática al eliminar proyecto

---

## 🛠️ Funciones Auxiliares

### `get_pending_insights(meeting_id)`
Obtiene todos los insights pendientes de revisión de una reunión, ordenados por tipo y confianza.

```sql
SELECT * FROM get_pending_insights('meeting-uuid-here');
```

### `complete_meeting(meeting_id)`
Marca una reunión como completada.

```sql
SELECT complete_meeting('meeting-uuid-here');
```

### `get_meeting_stats(meeting_id)`
Obtiene estadísticas de una reunión (total insights, por tipo, aplicados, etc).

```sql
SELECT get_meeting_stats('meeting-uuid-here');
```

---

## 📝 Ejemplos de Uso

### Crear una reunión

```typescript
const { data: meeting } = await supabase
  .from('meetings')
  .insert({
    project_id: 'project-uuid',
    title: 'Sprint Planning Q1',
    meeting_type: 'sprint_planning',
    objectives: 'Definir sprint y asignar tareas',
    estimated_duration_min: 60,
    strategic_context: {
      has_critical_decisions: true,
      areas_to_discuss: ['product', 'marketing'],
      current_blockers: 'API Stripe no funciona'
    },
    status: 'configuring',
    created_by: 'user-uuid'
  })
  .select()
  .single();
```

### Añadir participantes

```typescript
// Participante interno
await supabase.from('meeting_participants').insert({
  meeting_id: meeting.id,
  member_id: 'maria-uuid',
  attended: true
});

// Participante externo
await supabase.from('meeting_participants').insert({
  meeting_id: meeting.id,
  is_external: true,
  external_name: 'Cliente Acme Corp',
  external_email: 'contacto@acme.com',
  external_role: 'Cliente'
});
```

### Registrar pregunta de IA

```typescript
await supabase.from('meeting_ai_questions').insert({
  meeting_id: meeting.id,
  question: '¿Quién será responsable del testing?',
  question_type: 'clarification',
  context: 'Se mencionó testing pero no se asignó responsable',
  priority: 'high',
  status: 'pending'
});
```

### Guardar insight extraído

```typescript
await supabase.from('meeting_insights').insert({
  meeting_id: meeting.id,
  insight_type: 'task',
  content: {
    title: 'Implementar webhook Stripe',
    description: 'Resolver signature validation',
    assigned_to_name: 'María García',
    assigned_to_id: 'maria-uuid',
    priority: 'high',
    deadline: '2024-02-23',
    context: 'Bloqueando beta launch'
  },
  ai_confidence: 0.95,
  review_status: 'pending_review'
});
```

### Aplicar insight (crear tarea real)

```typescript
// 1. Marcar insight como aprobado
await supabase.from('meeting_insights').update({
  review_status: 'approved',
  reviewed_by: 'user-uuid',
  reviewed_at: new Date()
}).eq('id', insight.id);

// 2. Crear la tarea real en el sistema
const { data: task } = await supabase.from('tasks').insert({
  project_id: meeting.project_id,
  title: insight.content.title,
  description: insight.content.description,
  assigned_to: insight.content.assigned_to_id,
  priority: insight.content.priority,
  deadline: insight.content.deadline,
  created_from: 'meeting', // TAG importante
  meeting_id: meeting.id,  // Trazabilidad
  status: 'todo'
}).select().single();

// 3. Vincular insight a tarea creada
await supabase.from('meeting_insights').update({
  applied: true,
  applied_at: new Date(),
  applied_by: 'user-uuid',
  applied_entity_type: 'task',
  applied_entity_id: task.id
}).eq('id', insight.id);
```

---

## 📈 Queries Útiles

### Ver todas las reuniones de un proyecto

```sql
SELECT
  id,
  title,
  meeting_type,
  status,
  started_at,
  duration_actual_min,
  (SELECT COUNT(*) FROM meeting_insights WHERE meeting_id = meetings.id) as insights_count
FROM meetings
WHERE project_id = 'project-uuid'
ORDER BY started_at DESC;
```

### Ver insights pendientes de revisión

```sql
SELECT
  mi.id,
  mi.insight_type,
  mi.content,
  mi.ai_confidence,
  m.title as meeting_title
FROM meeting_insights mi
JOIN meetings m ON mi.meeting_id = m.id
WHERE mi.review_status = 'pending_review'
  AND m.project_id = 'project-uuid'
ORDER BY mi.ai_confidence DESC;
```

### Estadísticas de reuniones por proyecto

```sql
SELECT
  COUNT(*) as total_meetings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_meetings,
  SUM(duration_actual_min) as total_minutes,
  AVG(ai_confidence_score) as avg_confidence
FROM meetings
WHERE project_id = 'project-uuid';
```

### Decisiones activas del proyecto

```sql
SELECT
  decision,
  decided_by,
  deadline,
  area,
  impact_level,
  m.title as meeting_title,
  m.started_at as meeting_date
FROM meeting_decisions md
JOIN meetings m ON md.meeting_id = m.id
WHERE md.project_id = 'project-uuid'
  AND md.status = 'active'
ORDER BY md.deadline ASC;
```

---

## 🔄 Flujo de Estados

```
Meeting Status Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. configuring        (Usuario configurando pre-reunión)
   ↓
2. recording          (Grabando audio en vivo)
   ↓
3. processing_audio   (Procesando/subiendo audio)
   ↓
4. transcribing       (Whisper API generando transcripción)
   ↓
5. analyzing          (GPT-4 analizando y extrayendo insights)
   ↓
6. reviewing_questions (Usuario respondiendo preguntas IA)
   ↓
7. reviewing_insights  (Usuario revisando insights antes de aplicar)
   ↓
8. completed          (Todo aplicado, reunión finalizada)

   OR

   failed               (Error en algún paso)
```

---

## 🎯 Próximos Pasos

1. ✅ **Base de datos creada** (estás aquí)
2. ⏳ Crear componentes React (modales, UI)
3. ⏳ Implementar Edge Functions (Whisper, GPT-4)
4. ⏳ Integrar con sistema existente
5. ⏳ Testing y refinamiento

---

## 📞 Soporte

Si encuentras algún error:
1. Verifica que ejecutaste el SQL completo
2. Revisa que todas las tablas se crearon
3. Verifica que RLS está habilitado
4. Chequea logs en Supabase Dashboard

---

**Sistema Meeting Intelligence v1.0**
*Revolucionando cómo los equipos documentan y actúan sobre sus reuniones* 🚀
