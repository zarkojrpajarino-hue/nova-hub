# 🤖 Task #45: GPT-4 Analysis Integration

## ✅ Completado

Integración completa de GPT-4 para analizar transcripciones de reuniones y extraer insights accionables.

---

## 📋 Lo que se Implementó

### 1. Edge Function: `analyze-meeting`

**Archivo**: `supabase/functions/analyze-meeting/index.ts`

**Funcionalidad**:
- Recibe `meetingId`
- Obtiene transcript de la reunión
- Obtiene contexto del proyecto:
  - Miembros del equipo
  - OBVs activos
  - Participantes de la reunión
  - Contexto estratégico
- Construye prompt detallado para GPT-4
- Llama a GPT-4 con `response_format: json_object`
- Parsea respuesta JSON
- Guarda insights en tabla `meeting_insights`
- Actualiza reunión con:
  - `insights`: JSON completo
  - `summary`: Resumen ejecutivo
  - `key_points`: Puntos clave (array)
  - `ai_confidence_score`: Score de confianza (0-1)
  - `status`: `ready_for_review`

### 2. Insights Extraídos

La IA extrae 6 tipos de insights:

#### 📋 Tareas (tasks)
```json
{
  "title": "Implementar autenticación OAuth",
  "description": "Configurar OAuth con Google y GitHub",
  "assigned_to": "member-id-123",
  "assigned_to_name": "Juan Pérez",
  "priority": "alta",
  "estimated_hours": 8,
  "deadline": "2024-03-15",
  "context": "Se mencionó en minuto 15:30..."
}
```

#### ✅ Decisiones (decisions)
```json
{
  "title": "Usar Next.js 14 para el frontend",
  "description": "Se decidió migrar a Next.js 14",
  "rationale": "Mejor performance y SEO",
  "impact": "alto",
  "stakeholders": ["member-id-1", "member-id-2"],
  "context": "Discutido en minuto 8:45..."
}
```

#### 💼 Leads/Oportunidades (leads)
```json
{
  "company_name": "Acme Corp",
  "contact_name": "María González",
  "contact_email": "maria@acme.com",
  "contact_phone": "+34 600 123 456",
  "opportunity": "Quieren contratar 50 licencias",
  "estimated_value": 50000,
  "stage": "negociación",
  "context": "Mencionado en minuto 22:10..."
}
```

#### 🎯 OBVs Mencionados (obv_mentions)
```json
{
  "obv_id": "obv-123",
  "obv_title": "Alcanzar €50K MRR",
  "update_type": "progreso",
  "description": "Vamos por €35K, falta €15K",
  "suggested_action": "Enfocarse en upselling",
  "context": "Discutido en minuto 12:00..."
}
```

#### 🚫 Blockers (blockers)
```json
{
  "title": "API de Stripe no responde",
  "description": "Stripe está caído desde ayer",
  "affected_areas": ["Pagos", "Onboarding"],
  "severity": "crítico",
  "suggested_solution": "Usar Stripe fallback API",
  "context": "Mencionado en minuto 5:30..."
}
```

#### 📊 Métricas (metrics)
```json
{
  "name": "Monthly Recurring Revenue",
  "value": 35000,
  "unit": "€",
  "trend": "subiendo",
  "context": "Discutido en minuto 18:00...",
  "action_required": "Revisar churn rate"
}
```

### 3. Hook: `useAnalyzeMeeting()`

**Archivo**: `src/hooks/useMeetings.ts`

```typescript
const analyzeMeeting = useAnalyzeMeeting();

// Llamar análisis
await analyzeMeeting.mutateAsync(meetingId);
```

**Características**:
- Invalidación automática de queries
- Toast de éxito con count de insights
- Toast de error si falla
- Logging detallado

### 4. Integración Automática

**Archivo**: `src/components/meetings/LiveMeetingRecorder.tsx`

**Flow Automático**:
```
1. Usuario graba/sube audio
   ↓
2. Audio se sube a Storage
   ↓
3. Whisper transcribe (Task #44)
   ↓
4. GPT-4 analiza (Task #45) ✅ AUTOMÁTICO
   ↓
5. Estado: ready_for_review
```

**UI de Análisis**:
- Loader con spinner
- Alert morado informativo
- Mensaje de espera

---

## 🚀 Cómo Funciona

### 1. Prompt Engineering

El prompt incluye:

#### Contexto del Proyecto
```
- Lista de miembros con nombres, roles e IDs
- Lista de OBVs actuales con títulos y estados
- Lista de participantes (presentes y asignables)
- Contexto estratégico de la reunión
```

#### Transcripción Completa
```
Todo el texto transcrito por Whisper
```

#### Instrucciones Detalladas
```
- Extrae solo información EXPLÍCITA
- Usa IDs de miembros reales para asignaciones
- Usa IDs de OBVs reales para menciones
- Incluye "context" con cita de la transcripción
- Responde en JSON estructurado
- Sé conservador: mejor omitir que inventar
```

### 2. Configuración GPT-4

```typescript
{
  model: 'gpt-4o', // Más reciente y económico
  temperature: 0.3, // Baja = más preciso
  response_format: { type: 'json_object' } // Forzar JSON
}
```

### 3. Validación y Storage

1. GPT-4 responde con JSON
2. Se parsea y valida
3. Se divide por tipo de insight
4. Se inserta en `meeting_insights`:
   - `insight_type`: 'task', 'decision', 'lead', etc.
   - `content`: JSON con datos del insight
   - `review_status`: 'pending_review'
5. Se actualiza `meetings`:
   - `insights`: JSON completo
   - `status`: 'ready_for_review'

---

## 💰 Costos

### GPT-4o Pricing (Feb 2024)

- **Input**: $2.50 por 1M tokens
- **Output**: $10.00 por 1M tokens

### Estimaciones

| Reunión | Tokens Input | Tokens Output | Costo Total |
|---------|-------------|---------------|-------------|
| 30 min  | ~5,000      | ~1,000        | ~$0.02      |
| 60 min  | ~10,000     | ~2,000        | ~$0.05      |
| 90 min  | ~15,000     | ~3,000        | ~$0.07      |

**Presupuesto Recomendado**:
- Startup (10 reuniones/mes): ~$0.30/mes
- Equipo mediano (50 reuniones/mes): ~$2/mes
- Empresa grande (200 reuniones/mes): ~$8/mes

**Total con Whisper + GPT-4**:
- Reunión 30 min: $0.18 + $0.02 = ~$0.20
- Reunión 60 min: $0.36 + $0.05 = ~$0.41

---

## 📤 Deploy

```bash
cd /c/Users/Zarko/nova-hub
npx supabase functions deploy analyze-meeting
```

**Nota**: Usa la misma `OPENAI_API_KEY` que Task #44 (ya configurada).

---

## 🧪 Testing

### 1. Probar en la App

```bash
npm run dev
```

1. Ve a: http://localhost:5173/test-meeting-intelligence
2. Crea reunión
3. Graba audio de 30-60 segundos
4. Habla sobre:
   - Asigna tareas a personas
   - Toma decisiones
   - Menciona leads
   - Habla sobre objetivos (OBVs)
   - Menciona problemas/blockers
   - Comenta métricas

### 2. Observar el Flow

Verás en orden:
1. ✅ "Subiendo audio..."
2. ✅ "Transcribiendo con Whisper AI..." (30-90 seg)
3. ✅ "Analizando con GPT-4..." (10-30 seg)
4. ✅ Toast: "Análisis completado: X insights extraídos"

### 3. Verificar en la BD

```sql
-- Ver la reunión
SELECT
  title,
  status,
  summary,
  key_points,
  ai_confidence_score,
  LENGTH(transcript) as transcript_length
FROM meetings
ORDER BY created_at DESC
LIMIT 1;
```

Deberías ver:
- `status`: **`ready_for_review`**
- `summary`: Texto del resumen
- `key_points`: Array de puntos clave
- `ai_confidence_score`: 0.7 - 0.95

```sql
-- Ver los insights extraídos
SELECT
  insight_type,
  content->>'title' as title,
  review_status,
  created_at
FROM meeting_insights
WHERE meeting_id = 'TU_MEETING_ID'
ORDER BY created_at;
```

Deberías ver filas como:
```
| insight_type | title                        | review_status  |
|-------------|------------------------------|----------------|
| task        | Implementar OAuth            | pending_review |
| decision    | Usar Next.js 14              | pending_review |
| lead        | Acme Corp - 50 licencias     | pending_review |
| blocker     | API de Stripe no responde    | pending_review |
```

---

## 🐛 Troubleshooting

### Error: "GPT-4 API failed"

**Causa**: API key inválida o sin créditos.

**Solución**:
1. Verifica créditos: https://platform.openai.com/usage
2. Añade método de pago si es necesario
3. Verifica que la key funciona: Task #44

### Error: "Failed to parse GPT-4 response"

**Causa**: GPT-4 no respondió en JSON válido.

**Solución**:
- Revisa logs de Supabase Edge Functions
- Puede ser que la transcripción sea muy corta o incoherente
- Prueba con audio más claro y largo (>30 segundos)

### Insights están vacíos

**Causa**: Transcripción no contiene información accionable.

**Solución**:
- Habla más específicamente en la reunión
- Menciona nombres de personas
- Di claramente "Juan, tú encárgate de..."
- Menciona decisiones: "Decidimos que..."
- Habla de números: "El MRR es €35K"

### "Meeting has no transcript"

**Causa**: La transcripción (Task #44) falló.

**Solución**:
- Verifica que Task #44 funciona
- Revisa que hay transcript en la BD
- Vuelve a ejecutar transcripción manualmente

---

## 📊 Estados de la Reunión

```
configuring → recording → processing_audio → transcribing → analyzing → ready_for_review
                                                                             ↑
                                                                        Task #45
```

---

## 🎯 Siguiente Tarea

**Task #46**: Implementar IA Facilitador con recomendaciones proactivas
- Detectar cuando la conversación se desvía
- Sugerir temas pendientes
- Alertar sobre tiempo restante
- Recomendaciones en tiempo real durante la grabación

**Task #48**: Pantalla de revisión y aprobación de insights
- UI para revisar todos los insights
- Aprobar/rechazar cada insight
- Editar antes de aplicar
- Vista previa de cómo afectará al sistema

---

**¿Análisis con GPT-4 funciona? ¡Avísame para continuar! 🚀**
