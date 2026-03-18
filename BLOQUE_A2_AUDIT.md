# BLOQUE A2 — COMPATIBILIDAD CON MÓDULOS NATIVOS
> **I15.A2.1–I15.A2.8** — Qué módulos nativos pueden recibir hidratación externa, en qué modo, y cómo afecta la UX actual.
> Fecha: 2026-03-15. Basado en lectura directa de migraciones, hooks y componentes.
>
> **Archivos auditados:**
> - `supabase/migrations/20260224000001_complete_fresh_schema.sql`
> - `supabase/migrations/20260224000002_fase2_engine_tables.sql`
> - `supabase/migrations/20260224000006_execution_rate_functions.sql`
> - `src/hooks/useNovaDataOptimized.ts`
> - `src/hooks/useTaskKanban.ts`
> - `src/hooks/useMeetings.ts`
> - `src/hooks/useFinancieroData.ts`
> - `src/components/project/KeyMetricsEditor.tsx`
> - `src/components/engine-inputs/EconomicProfileForm.tsx`
> - `src/pages/views/FinancieroView.tsx`

---

## I15.A2.1 — CRM Nativo y compatibilidad con hidratación externa

**Ya documentado en BLOQUE_A_AUDIT.md §I15.6.** Resumen de hallazgos:

- Tabla `obvs` unificada para OBVs estratégicos + pipeline comercial
- Pipeline: frio → tibio → hot → propuesta → negociacion → cerrado_ganado/cerrado_perdido
- **Brecha crítica:** CRM no alimenta `revenue_momentum` (15% del Probability Engine)
- **Compatibilidad HubSpot:** vista híbrida = dos queries (obvs internos + integration_entities WHERE entity_type='deal') normalizadas a interface `Lead` común con campo `source: 'internal' | 'hubspot'`
- **Modo:** HÍBRIDO — internos editables, externos read-only en pipeline view con sync-back via edge function para transiciones de etapa

---

## I15.A2.2 — Módulo Financiero y compatibilidad con fuentes externas

### Tablas existentes y sus columnas relevantes

| Tabla | Estado | Columnas clave | Gap |
|---|---|---|---|
| `key_metrics` | ✅ Existe | mrr, arr, mrr_growth_rate, burn_rate, runway_months, cash_balance, total_customers | **Sin `integration_source` ni `synced_at`** |
| `financial_projections` | ✅ Existe | revenue, cogs, payroll, marketing_spend, infrastructure, other_costs, gross_margin, net_profit, runway_months | **Sin `source_type` ni `source_provider`** |
| `project_economic_profile` | ✅ Existe | cash_on_hand, field_sources JSONB, confidence_score | `field_sources` trackea origen en sistema ('declared'/'benchmark'/'computed'), **no origen de provider externo** |
| `project_economic_profile_history` | ✅ Existe | change_reason ENUM | ENUM no incluye 'stripe_sync', 'holded_sync' — solo 'founder_update', 'computed_update', 'confidence_updated', 'benchmark_sync' |
| `financial_integrations` | ❌ No existe | — | Requerida para guardar tokens, estado de sync, last_sync_at |
| `synced_transactions` | ❌ No existe | — | Requerida para transacciones importadas de Stripe/Holded |
| `subscription_metrics` | ❌ No existe | — | Requerida para MRR/ARR/churn de providers de suscripción |

**Evidencia:** lectura directa de `20260224000001_complete_fresh_schema.sql` líneas 705–752 y `20260224000002_fase2_engine_tables.sql` líneas 268–346.

### Componentes UI del módulo financiero

- `FinancieroView.tsx` — dashboard principal. Lee desde `pending_payments` VIEW y `get_financial_metrics_secure` RPC. **Datos de OBVs únicamente, no de integraciones.**
- `KeyMetricsEditor.tsx` — entrada manual de MRR, burn_rate, cash_balance. **INSERT sin campo de origen.**
- `EconomicProfileForm.tsx` — modelo económico. Sí trackea `field_sources` pero solo para declared/computed/benchmark, no para origen externo.
- `FinancieroView`, `ProjectFinancialTab`, etc. — ningún componente tiene UI para mostrar "último sync de Stripe" o badge de origen.

### Estado del módulo financiero en useNovaDataOptimized

**Resultado:** `key_metrics`, `financial_projections` y `project_economic_profile` **no están en `useNovaDataOptimized.ts`**. Cada componente fetcha por separado. Los datos financieros no forman parte del data layer optimizado.

### Edge functions financieras

| Función | Estado |
|---|---|
| `sync-stripe` | STUB — mock data, tablas inexistentes |
| `auto-sync-finances` | STUB — mock data, tablas inexistentes |
| `generate-financial-projections` | **IMPLEMENTADA** — Claude real, escribe en `financial_projections` |

### Gaps para FASE 15

| Gap | Severidad | Acción |
|---|---|---|
| `key_metrics` sin `integration_source` | 🟠 Alto | Añadir en Bloque B (I15.15–I15.30). Necesario para trazabilidad en UI y en trg_key_metrics_probability |
| `financial_projections` sin `source_type` | 🟡 Normal | Añadir cuando se implemente Holded sync real |
| `change_reason` ENUM incompleto en histórico | 🟡 Normal | Añadir 'stripe_sync', 'holded_sync', etc. al crear las tablas de integración |
| `financial_integrations/synced_transactions/subscription_metrics` inexistentes | 🔴 Bloqueante | Crear en Bloque B — prerequisito para cualquier sync real |
| Módulo financiero fuera de useNovaDataOptimized | 🟢 Bajo | Integrar cuando se implemente Bloque D (UI progresiva). No bloquea FASE 15 v1. |

### Modo de integración: WRITE-THROUGH parcial

Finance Agent escribe en tablas de motores (key_metrics, financial_projections, project_economic_profile) vía `write_integration_to_engine_table()`. El módulo financiero puede seguir recibiendo entradas manuales — la UI debe mostrar badge de origen cuando `integration_source != 'manual'`.

---

## I15.A2.3 — Tareas/Ejecución y compatibilidad con Asana/Trello

### Schema de la tabla `tasks`

```sql
tasks:
  id, project_id, assignee_id, titulo, descripcion
  status (task_status ENUM: todo|doing|done|blocked)
  prioridad, fecha_limite, ai_generated, playbook, metadata JSONB
  tiempo_estimado_horas, tipo_tarea, relacionada_con_leads UUID[]
  created_at, completed_at
  -- añadidos en 00002:
  leader_id UUID
  function_type TEXT  -- demand | delivery | cash
```

**Sin campo de origen externo.** No existe `external_provider`, `external_id`, ni `external_synced_at`.

### Cómo el execution rate lee tasks

La función `compute_execution_rate()` (migración `00006`) lee de `tasks`:

| Campo leído | Para qué | Implicación en importación |
|---|---|---|
| `tasks.status = 'done'` | task completion rate | Tareas importadas deben tener `status='done'` para contar |
| `tasks.completed_at ≥ NOW() - 14d` | ventana rolling | `completed_at` debe popularse desde la plataforma externa |
| `tasks.assignee_id` | role execution health | Requiere matching de usuario externo → profile UUID interno |
| `tasks.function_type` ('demand'/'delivery'/'cash') | role-function split | Tareas externas necesitan mapeo de categoría |

**Conclusión:** Si una tarea de Asana/Trello se importa con los campos correctos (status, completed_at, assignee_id, function_type), **el execution engine la contará — pero solo si supera el filtro temporal** (ver decisión v1 abajo).

### Problema del conteo sin frontera temporal

Sin condición temporal, conectar Asana con 120 tareas históricas (80 completadas) dispara una subida artificial de `execution_rate`. El engine interpreta "el equipo ejecuta bien" cuando en realidad son tareas de meses anteriores que no reflejan el estado actual del proyecto. Esto no es ruido tolerable — es una señal falsa que puede desbloquear fases o suprimir alertas de riesgo.

### Decisión v1: filtro por `integration_connected_at`

`compute_task_completion_rate()` solo cuenta tareas externas donde:

```sql
-- Para tareas con external_provider IS NOT NULL:
completed_at >= (
  SELECT connected_at FROM integration_connections
  WHERE project_id = p_project_id
    AND provider = tasks.external_provider
  LIMIT 1
)
```

**Implementación práctica:** cuando se implemente Asana/Trello (I15.95), el sync normalizer solo escribe tareas en `tasks` si `completed_at >= integration_connected_at`. Las tareas históricas completadas antes de esa fecha se importan como referencia (para mostrar en UI) pero con `status='done_historical'` — valor que `compute_task_completion_rate()` no cuenta.

Esto requiere:
- Un valor adicional en el ENUM `task_status`: `'done_historical'`
- `integration_connections.connected_at` (Bloque B, I15.19) disponible en el momento del sync

**No requiere ponderación compleja ni v1.1.** La frontera temporal resuelve el problema desde el primer día.

### Gaps para FASE 15

| Gap | Severidad | Acción |
|---|---|---|
| Sin `external_provider` en tasks | 🟠 Alto | Añadir en Bloque B. Necesario para el filtro temporal en execution_rate |
| Sin `external_id` en tasks | 🟠 Alto | Añadir en Bloque B. Necesario para deduplicación en sync |
| Sin `external_synced_at` en tasks | 🟡 Normal | Añadir junto con los anteriores |
| `task_status` ENUM sin `'done_historical'` | 🟠 Alto | Añadir en Bloque B (migración). Sin este valor el filtro temporal no es implementable limpiamente |
| UI (useTaskKanban) sin awareness de origen | 🟡 Normal | Badge de provider cuando `external_provider != null` en Bloque E-F |

### Modo de integración: WRITE-THROUGH con frontera temporal

Tareas importadas de Asana/Trello se escriben en `tasks` con campos de origen. El normalizer usa `integration_connected_at` para marcar tareas previas como `'done_historical'` (visible en UI, excluidas del engine). Tareas completadas tras la conexión cuentan normalmente. Drag-to-done en tarea activa externa dispara sync-back vía edge function.

---

## I15.A2.4 — Calendario y compatibilidad con Google Calendar

### HALLAZGO CRÍTICO: El módulo de reuniones está roto

La tabla `meetings` **no existe en ninguna migración**. Sin embargo:
- `src/hooks/useMeetings.ts` — 5 hooks que hacen queries a `supabase.from('meetings')` → **runtime error garantizado**
- Tres edge functions referencian meetings: `transcribe-meeting`, `analyze-meeting`, `apply-meeting-insights`
- No hay componente UI de calendario de eventos (solo existe `src/components/ui/calendar.tsx` = date picker de Shadcn, sin conexión a DB)

Este es un bug preexistente a FASE 15, no creado por ella.

### Lo que sí existe

| Item | Estado | Notas |
|---|---|---|
| `content_calendars` tabla | ✅ Existe | Para calendario de contenido editorial — no es un calendario de eventos |
| `calendar.tsx` componente | ✅ Existe | Date picker genérico (react-day-picker), sin datos |
| `generate-content-calendar` edge function | ✅ Funcional | Genera ideas de contenido, no eventos |
| `meetings` tabla | ❌ No existe | Hooks la esperan, no está en migraciones |
| Google Calendar sync | ❌ No existe | Ningún código relacionado |
| `calendar_events` tabla | ❌ No existe | — |

### Gaps para FASE 15

| Gap | Severidad | Acción |
|---|---|---|
| `meetings` tabla inexistente | 🔴 Pre-15 — bug activo | Registrar como I15.A2.9 (nueva tarea). Crear `meetings` table antes de cualquier integración de calendario. |
| `useMeetings.ts` roto | 🔴 Pre-15 — bug activo | Fix en misma tarea que crear tabla |
| Google Calendar sync no existe | 🟡 Normal | I15.97 ya planificado — Google Calendar se diseña desde cero |
| No `calendar_events` table | 🟡 Normal | Diseñar en I15.97 con estructura que soporte origen externo desde el primer día |

### Modo de integración: DIFERIDO

Google Calendar no es un módulo candidato para hidratación en v1 de FASE 15. El módulo de reuniones necesita ser reparado primero (meetings table + useMeetings fix). Cuando se diseñe en I15.97, la tabla `calendar_events` debe incluir `external_provider` y `external_id` desde el día 1.

---

## I15.A2.5 — Qué módulos aceptan hidratación externa parcial

| Módulo | ¿Acepta hidratación? | Provider(s) | Condición |
|---|---|---|---|
| `key_metrics` (mrr, mrr_growth_rate) | ✅ Sí | Stripe, Holded | confidence ≥ 0.8, guard function |
| `financial_projections` (revenue, costs) | ✅ Sí | Holded (facturas reales), Stripe (cobros) | confidence ≥ 0.8 |
| `project_economic_profile` (cash_on_hand) | ✅ Sí | Holded (saldo de cuenta), Stripe (balance) | confidence ≥ 0.8 |
| `tasks` (completion data) | ✅ Sí | Asana, Trello | Requiere añadir external_provider + external_id |
| CRM `obvs` (pipeline) | ✅ Sí | HubSpot | Vista híbrida, sin mezcla de datos en DB |

---

## I15.A2.6 — Qué módulos deben seguir siendo solo internos

| Módulo | Por qué interno | Nota |
|---|---|---|
| `project_phase_state` + phase_score | Phase Engine es la única fuente autorizada | Ningún provider conoce las fases estratégicas de nova-hub |
| `project_probability` (score, status) | Motor de probabilidad solo recibe inputs, el score es calculado | Los inputs pueden tener origen externo, el score nunca |
| `project_viability_state` | Viability Engine es la única fuente autorizada | Señal estratégica — no se sobreescribe desde fuera |
| `project_risk_score` | Risk Engine es la única fuente autorizada | Los 5 factores son internos (ver BLOQUE_A_AUDIT §I15.11) |
| `obvs` (OBVs estratégicos, es_venta=FALSE) | Evidencia registrada intencionalmente por el founder | Sin equivalente externo |
| `strategic_cycles`, `strategic_blocks` | Datos estratégicos del founder | Sin equivalente externo |
| `validation_strength` input | OBVs son la única fuente | Ver BLOQUE_A_AUDIT §I15.11 |
| `iteration_velocity` | Señal de actividad en sistema interno | Sin equivalente externo directo |
| `meetings` (cuando exista) | v1: interno. v2: puede recibir eventos de Google Calendar | Diseñar con external_provider desde el inicio |

---

## I15.A2.7 — Modo de integración por módulo

| Módulo | Modo | Descripción |
|---|---|---|
| `key_metrics` | **Write-through** | Finance Agent escribe con integration_source. UI muestra badge. Manual override posible. |
| `financial_projections` | **Write-through** | Finance Agent escribe datos reales de Holded/Stripe. AI projections siguen disponibles. source_type distingue. |
| `project_economic_profile` | **Write-through parcial** | Solo cash_on_hand actualizable externamente. El modelo económico (field_sources) sigue siendo interno. |
| `tasks` | **Write-through** | Tareas externas importadas con campos de origen. UI muestra badge. Execution engine las cuenta. |
| CRM pipeline `obvs` | **Hybrid view** | Internos: read-write en DB. Externos: read-only en vista unificada, sync-back vía edge function. |
| Calendar / `meetings` | **Diferido** | Diseñar en I15.97 con soporte externo nativo desde el inicio. |
| Motores (probability, viability, risk, phase) | **Read-only absoluto** | Los motores son receptores de inputs, nunca receptores de datos externos directamente. |

**Regla general:** Ningún módulo de motor recibe escrituras directas de agentes o providers. Todo pasa por `write_integration_to_engine_table()` o por las tablas de inputs (key_metrics, financial_projections) que el motor lee automáticamente.

---

## I15.A2.8 — Cómo afecta cada sync a la UX actual del módulo

### key_metrics + Stripe

**Antes:** `KeyMetricsEditor.tsx` es el único camino de entrada. El founder entra MRR cada mes manualmente.

**Con sync:** Finance Agent escribe `mrr` con `integration_source='stripe'`. `KeyMetricsEditor` debe mostrar badge "Sincronizado desde Stripe" cuando el campo es externo. Si el founder quiere sobreescribir manualmente, puede hacerlo (escribe con `integration_source='manual'` y supera el valor de Stripe). El trigger `trg_key_metrics_probability` se dispara para ambas fuentes.

**Cambio UX:** Badge en el campo MRR. Sin otros cambios. El founder no pierde control.

---

### financial_projections + Holded

**Antes:** Solo `generate-financial-projections` (Claude) escribe aquí. El founder puede regenerar las proyecciones.

**Con sync:** Finance Agent puede escribir datos reales de ingresos y costos de Holded, con `source_type='imported'`. Las proyecciones AI siguen disponibles con `source_type='ai_generated'`. `FinancieroView` puede mostrar "proyecciones basadas en datos reales" vs. "proyecciones AI" con un toggle.

**Cambio UX:** Toggle real/AI en `FinancieroView`. Bajo impacto — el founder gana visibilidad, no pierde funcionalidad.

---

### tasks + Asana/Trello

**Antes:** `useTaskKanban.ts` muestra todas las tareas sin distinción. UI simple y limpia.

**Con sync:** Tareas externas aparecen en el Kanban con badge del provider (Asana/Trello). Drag-to-done en tarea externa dispara sync-back edge function. El founder puede ver qué tareas vienen de dónde. El execution rate cambia automáticamente al recibir tareas completadas del exterior.

**Riesgo UX:** El Kanban puede llenarse de ruido si Asana tiene cientos de tareas. Mitigación: filtros por `external_provider` + límite de tareas mostradas + opción "importar proyecto específico de Asana".

**Cambio UX:** Badge en tareas externas + filtros por fuente. Impacto medio — necesita diseño cuidadoso.

---

### CRM + HubSpot

**Antes:** `ProjectCRMTab.tsx` muestra solo `obvs` internos del proyecto.

**Con sync:** Vista híbrida — dos secciones o columna `source` en cada deal. Pipeline stats suman ambas fuentes. Drag-drop en deal externo → sync-back a HubSpot. El founder puede cerrar un deal en nova-hub y que HubSpot se actualice automáticamente.

**Riesgo UX:** Conflicto si el mismo cliente tiene un deal en nova-hub y en HubSpot. Mitigación: deduplicación por `external_id` + indicador de "ya existe en HubSpot".

**Cambio UX:** Nueva columna `source` en pipeline. Columna stats con totales combinados. Impacto medio — bien definido en BLOQUE_A_AUDIT.

---

### Calendario / Meetings (diferido)

**Antes:** Módulo roto (meetings table inexistente).

**Con I15.97:** Diseñar `meetings` table con `external_provider`, `external_id` desde el día 1. Google Calendar sync importa eventos como read-only. El founder puede ver reuniones de Google Calendar directamente en nova-hub. No habrá UX de reuniones hasta que la tabla esté creada y el módulo reparado.

---

## Tabla resumen — Módulos y modo de hidratación

| Módulo | Modo | Provider v1 | Bloque FASE 15 | Condición bloqueante |
|---|---|---|---|---|
| `key_metrics` | Write-through | Stripe | Bloque B + C | Crear `financial_integrations`, añadir `integration_source` |
| `financial_projections` | Write-through | Holded | Bloque B + C | Crear `financial_integrations`, añadir `source_type` |
| `project_economic_profile.cash_on_hand` | Write-through parcial | Holded/Stripe | Bloque C | `write_integration_to_engine_table()` implementado |
| CRM `obvs` (deals HubSpot) | Hybrid view | HubSpot | Bloque C + D | I15.93 — HubSpot normalizer |
| `tasks` (Asana/Trello) | Write-through | Asana | Bloque B + C | Añadir external_provider/external_id/external_synced_at a tasks |
| `meetings` | Diferido | Google Calendar | I15.97 | Crear meetings table primero (bug pre-FASE15) |
| Motores (probability, viability, risk, phase) | Read-only absoluto | N/A | N/A | Por diseño — nunca receptores directos |

---

## Nueva tarea identificada: I15.A2.9

**Bug preexistente a FASE 15:** La tabla `meetings` no existe en ninguna migración, pero `useMeetings.ts` (5 hooks) y 3 edge functions la referencian. Cualquier usuario que acceda a la sección de reuniones recibe un error de runtime.

**Acción:** Registrar como I15.A2.9 — Crear tabla `meetings` + reparar `useMeetings.ts`. Debe completarse antes de I15.97 (Google Calendar sync). Es independiente del resto de FASE 15 y no tiene prerequisitos.

---

> **Bloques completados:** A (motores) + A2 (módulos nativos)
> **Próximo paso:** INTEGRATION_ARCHITECTURE.md — diagrama completo provider → normalizer → entities → agents → synthesis → motors → Optimus.
> Alternativa si se prefiere avanzar primero en Bloque B (arquitectura base de tablas): I15.15–I15.30.
