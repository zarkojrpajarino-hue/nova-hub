# INTEGRATION ARCHITECTURE
> Documento capstone de FASE 15. Arquitectura completa del sistema de integraciones externas.
> Fecha: 2026-03-15. Basado en auditorías BLOQUE_A, BLOQUE_A2, INTEGRATION_DATA_CONTRACT, AGENTS_CONTRACT.
>
> **Propósito:** Mapa definitivo del sistema. Cualquier implementador que llegue a Bloque B+ debe leer este documento antes de escribir una línea de código.

---

## 1. Principio arquitectónico base

El sistema sigue un patrón de un solo sentido:

```
datos externos → tablas internas → triggers existentes → motores existentes
```

**Lo que NO hace:**
```
datos externos → lógica paralela al motor
datos externos → motor ← directo
datos externos → agente que sobreescribe motor
```

Esto no es un requisito cosmético. Es la diferencia entre un sistema que escala y uno que se divide en dos motores en conflicto. Los motores existentes (Probability, Phase, Risk, Viability, Next Action) no saben si los datos que reciben vienen de entrada manual o de Stripe. No necesitan saberlo. Solo necesitan recibir datos bien formados en las tablas que ya leen.

---

## 2. Diagrama completo

```
┌─────────────────────────────────────────────────────────────────────┐
│  PROVIDERS EXTERNOS                                                 │
│  Stripe · Holded · HubSpot · Asana · Trello · Google Calendar      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ API calls / webhooks (v2)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PROVIDER ADAPTER (por provider)                                    │
│  • Valida schema del payload                                        │
│  • Mapea a ContractEntity (INTEGRATION_DATA_CONTRACT.md §3)         │
│  • Calcula confidence = schema_score×0.5 + provider_score×0.3       │
│    + recency_score×0.2                                              │
│  • Descarta entidades con confidence < 0.6                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  integration_entities (tabla staging — Bloque B, I15.21)           │
│  provider · entity_type · external_id · project_id                 │
│  occurred_at · source_timestamp · synced_at                        │
│  payload JSONB · confidence · is_complete · missing_fields         │
│  expires_at · sync_run_id · connection_id                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ lectura por entity_type de dominio
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENTES ESPECIALIZADOS (AGENTS_CONTRACT.md)                       │
│                                                                     │
│  Finance Agent    ← financial_transaction · invoice · expense      │
│                      subscription · customer                        │
│  Sales Agent      ← deal · contact · company · pipeline_event      │
│  Execution Agent  ← task · milestone · project_item               │
│  Calendar Agent   ← calendar_event · meeting                       │
│  Team Agent       ← message_signal · channel_activity              │
│                                                                     │
│  Cada agente genera AgentInsight:                                   │
│  { insight_type, signal, content, confidence,                      │
│    entity_ids, motor_write? }                                       │
│                                                                     │
│  Condición de emisión: confidence ≥ umbral mínimo por insight_type  │
│  Silencio si datos insuficientes (no insight de baja confidence)   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SYNTHESIS LAYER (función determinista, no 6º agente)              │
│  Prioridad: Finance > Sales > Execution > Team > Calendar           │
│  Cap: máximo 3 insights en context packet                          │
│  Anti-contradicción: motor central siempre gana                    │
│  Anti-Goodhart: signal_integrity check antes de emitir             │
└──────────────┬─────────────────────────────────┬───────────────────┘
               │                                 │
               ▼                                 ▼
   [motor_write presente]              [solo contexto — severity=warning]
               │                                 │
               ▼                                 ▼
┌─────────────────────────┐         ┌────────────────────────────────┐
│  write_integration_to_  │         │  integration_insights tabla    │
│  engine_table() [GUARD] │         │  (lectura por get_optimus_     │
│                         │         │   context(), max 3)            │
│  verifica:              │         └────────────────────────────────┘
│  • confidence ≥ 0.8     │
│  • expires_at > NOW()   │
│  • marca integration_   │
│    source = true        │
│  • log en trazabilidad  │
│                         │
│  Si no pasa → rechaza   │
│  Sin excepción posible  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TABLAS DE INPUT DE MOTORES                                        │
│                                                                     │
│  key_metrics.mrr             ← Finance Agent (Stripe/Holded)       │
│  key_metrics.mrr_growth_rate ← Finance Agent (Stripe)              │
│  financial_projections       ← Finance Agent (Holded facturas)     │
│  project_economic_profile    ← Finance Agent (cash_on_hand)        │
│    .cash_on_hand                                                    │
│    .top_client_revenue_pct   ← Finance/Sales Agent (Holded/HubSpot)│
│  obvs (deals HubSpot)        ← Sales Agent (vista híbrida v1,     │
│                                 tabla directa en v2)               │
│  tasks (Asana/Trello)        ← Execution Agent                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │ triggers automáticos existentes
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TRIGGER CHAIN (sin cambios al motor)                              │
│                                                                     │
│  key_metrics INSERT/UPDATE mrr                                      │
│    → trg_key_metrics_probability                                    │
│    → run_probability_engine()                                       │
│    → project_probability.revenue_momentum_input actualizado         │
│    → trg_probability_phase                                          │
│    → run_phase_engine()                                             │
│                                                                     │
│  project_economic_profile UPDATE cash_on_hand                       │
│    → trg_fn_economic_profile_risk                                   │
│    → run_risk_engine() → R1.1 RunwayFactor recalculado             │
│                                                                     │
│  project_probability UPDATE execution_rate_input                    │
│    → trg_fn_probability_risk                                        │
│    → run_risk_engine() → R1.2 ExecutionDrop recalculado            │
│                                                                     │
│  tasks UPDATE status='done'                                         │
│    → trg_tasks_done_phase                                           │
│    → run_phase_engine()                                             │
│                                                                     │
│  obviamente: todos los triggers existentes — sin modificar          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  OUTPUTS DE MOTORES                                                 │
│                                                                     │
│  project_probability.probability_score + status                    │
│  project_phase_state.current_phase + phase_score + hard_signal_met │
│  project_risk_score.risk_level + risk_score                        │
│  project_viability_state.viability_status                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  get_optimus_context()                                              │
│  22 campos existentes (sin cambios)                                │
│  + integration_insights[] (max 3, de synthesis layer)              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  OPTIMUS (Claude)                                                   │
│  Genera next action, contexto estratégico para el founder           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                  SURFACE 1 / SURFACE 2 / SURFACE 3
             (ProjectDashboardTab — Motor, Weekly, Reset)
```

---

## 3. Tabla de infra por bloque de implementación

| Componente | Existe hoy | Bloque de creación |
|---|---|---|
| `integration_connections` | ❌ | Bloque B — I15.19 |
| `integration_sync_runs` | ❌ | Bloque B — I15.20 |
| `integration_entities` | ❌ | Bloque B — I15.21 |
| `integration_insights` | ❌ | Bloque B — I15.22 |
| `integration_credentials` (cifrado) | ❌ | Bloque B — I15.23 |
| Provider adapter (Stripe) | ❌ (stub) | Bloque C — I15.92 |
| `write_integration_to_engine_table()` | ❌ | Bloque B — crítico |
| Finance Agent | ❌ | Bloque G — I15.78 |
| Sales Agent | ❌ | Bloque G — I15.79 |
| Synthesis layer | ❌ | Bloque G — I15.87 |
| `key_metrics.integration_source` campo | ❌ | Bloque B — migration |
| `tasks.external_provider/external_id` | ❌ | Bloque B — migration |
| `obvs.external_provider/external_id` | ❌ | Bloque B — migration |
| Trigger chain (key_metrics→probability→phase) | ✅ | Existente |
| Trigger (economic_profile→risk) | ✅ | Existente |
| Trigger (probability→phase) | ✅ | Existente |
| Todos los motores SQL | ✅ | Existentes |
| `weekly_reviews` | ✅ | Existente — funcional |
| `strategic_cycles` | ✅ | Existente — funcional |

**La función más crítica de todo el sistema es `write_integration_to_engine_table()`.**
Sin ella, ningún agente puede escribir a ningún motor. Es el único punto de entrada. Debe implementarse en Bloque B antes que cualquier agente.

---

## 4. Estados de source_of_truth

Por proyecto, por módulo. Nunca global.

```
internal_only
  ↓ (connect + sync OK)
external_primary          — external data overrides internal inputs
  ↓                         (key_metrics.mrr, financial_projections, etc.)
hybrid                    — ambas fuentes activas (CRM: obvs + HubSpot deals)

  Si sync excede staleness window:
  external_primary / hybrid → stale_external

  Si sync se recupera:
  stale_external → external_primary / hybrid

  Si desconexión manual:
  cualquier estado → internal_only
```

### Estado `stale_external` — comportamiento

| Capa | Comportamiento |
|---|---|
| Agentes | No emiten nuevos insights sobre entidades stale |
| Insights existentes | `recency_score = 0` → confidence baja → inelegibles para motor writes |
| UI | Banner "Sincronización desactualizada — última sync [fecha]" |
| Fallback | Si stale durante 3× ventana de staleness con errores consecutivos → revert a `internal_only` |

### Estado `hybrid` — CRM específico

En el módulo CRM, `hybrid` no mezcla datos en la tabla `obvs`. Es una vista de UI:
- Query 1: `obvs WHERE project_id = X` (internos)
- Query 2: `integration_entities WHERE entity_type = 'deal' AND project_id = X` (HubSpot)
- Normalización a interface `Lead` común con campo `source: 'internal' | 'hubspot'`
- Drag-to-done en deal externo → sync-back vía edge function al provider

---

## 5. Confidence pipeline

```
Cada ContractEntity tiene confidence calculado en el normalizer:

  schema_score   (0.0 – 1.0) — ¿todos los campos requeridos presentes?
                               ¿tipos correctos? ¿payload completo?
    × 0.5

  provider_score (0.0 – 1.0) — fiabilidad histórica del provider para este entity_type
                               (se construye con datos reales en v2; 0.8 por defecto en v1)
    × 0.3

  recency_score  (0.0 – 1.0) — qué tan fresco es el dato
                               (synced_at vs expires_at de la ventana de staleness)
    × 0.2

  confidence = schema_score×0.5 + provider_score×0.3 + recency_score×0.2
```

### Umbrales de decisión

| Umbral | Decisión |
|---|---|
| `< 0.6` | Entidad descartada en el normalizer. No llega a `integration_entities`. |
| `0.6 – 0.79` | Entidad almacenada. Agente puede leer y generar insight. NO puede hacer motor writes. |
| `≥ 0.8` | Agente puede proponer motor write. `write_integration_to_engine_table()` lo permite. |

El umbral 0.8 para motor writes no es configurable por agente ni por proyecto. Es invariante del sistema.

---

## 6. Trigger chain (no requiere modificaciones)

La cadena automática más importante del sistema:

```
[1] Finance Agent escribe en key_metrics.mrr
    (vía write_integration_to_engine_table, confidence ≥ 0.8)
      ↓
[2] trg_key_metrics_probability (ya existe)
    AFTER INSERT OR UPDATE OF mrr ON key_metrics
      ↓
[3] run_probability_engine() recalcula
    → project_probability.revenue_momentum_input actualizado
      ↓
[4] trg_probability_phase (ya existe)
    AFTER UPDATE OF revenue_momentum_input ON project_probability
      ↓
[5] run_phase_engine()
    → phase_score recalculado
    → si F3/F4: O3.1/O4.1 mejoran con MRR real
```

**Esto significa:** Finance Agent con Stripe activo → Phase 3 avanza con MRR real de forma automática. Sin tocar ni un SQL de motor.

Cadena paralela para Risk Engine:

```
Finance Agent escribe en project_economic_profile.cash_on_hand
  ↓
trg_fn_economic_profile_risk (ya existe)
  ↓
run_risk_engine() → R1.1 RunwayFactor recalculado
```

---

## 7. Mapa de providers v1 → tablas de input → motores

| Provider | Entity type | Tabla destino | Motor impactado | Trigger |
|---|---|---|---|---|
| **Stripe** | subscription | `key_metrics.mrr` | Probability (15%), Phase F3/F4 O3.1/O4.1 | trg_key_metrics_probability |
| **Stripe** | subscription | `key_metrics.mrr_growth_rate` | Viability T3 | (cron weekly) |
| **Stripe** | financial_transaction | `financial_projections.revenue` | Risk R1.1 (burn_rate) | trg_fn_economic_profile_risk |
| **Holded** | invoice / expense | `financial_projections` (revenue, cogs, payroll...) | Risk R1.1, Viability T2 | (cron weekly) |
| **Holded** | balance | `project_economic_profile.cash_on_hand` | Risk R1.1 RunwayFactor | trg_fn_economic_profile_risk |
| **HubSpot** | deal | `integration_entities` (hybrid view en UI) | Sales Agent → synthesis | (no motor write directo v1) |
| **Asana** | task | `tasks` (write-through, external_provider='asana') | Probability (20% execution_rate), Phase trg_tasks_done | trg_tasks_done_phase |

---

## 8. Scope Stripe v1 (invariante)

Stripe es el primer provider. El scope v1 es fijo y no se expande:

| v1 (primer corte) | v2 (segundo corte) |
|---|---|
| Conexión OAuth | Webhooks en tiempo real |
| Import manual inicial | Sync incremental |
| Write-through limpio | Reconciliación de discrepancias |
| Efecto en motor visible | Backfill histórico |

El v1 prueba la arquitectura completa de extremo a extremo. Si algo está roto en el chain, se descubre aquí, no después de implementar 3 providers.

---

## 9. Gaps documentados para v1.1

### Gap R1.1: RunwayFactor con financial_projections vacío

`RunwayFactor` requiere `financial_projections` con ≥2 meses de datos. Si la tabla está vacía, `burn_rate = NULL` → `RunwayFactor = NULL` → Risk Engine trabaja con 4 inputs en lugar de 5 (redistribuye pesos).

**v1 (interim):** Holded escribe datos reales en `financial_projections`. Si Holded no está conectado, el founder puede entrar datos manualmente (ya funciona).

**v1.1 (cuando haya datos):** Finance Agent estima burn_rate desde promedio de últimos 2 meses de gastos internos si `financial_projections` tiene datos pero no hay sync externo:
```
burn_rate_estimate = AVG(cogs + payroll + marketing_spend + infrastructure + other_costs)
                     FROM financial_projections
                     WHERE year = CURRENT_YEAR AND month IN (last_2_months)
```
Esto es mejor que NULL — reduce el `'insufficient_data'` del Risk Engine en proyectos sin Holded conectado.

### Gap obvs: sin external_provider / external_id

HubSpot deals importados en `obvs` serían indistinguibles de OBVs internos. En v1, el HubSpot path es hybrid view (no escribe en `obvs` directamente). Pero para v2 (writes directos), `obvs` necesita:

```sql
ALTER TABLE obvs ADD COLUMN external_provider TEXT;
ALTER TABLE obvs ADD COLUMN external_id TEXT;
CREATE UNIQUE INDEX idx_obvs_external ON obvs(external_provider, external_id)
  WHERE external_provider IS NOT NULL;
```

Crear en Bloque B junto con los demás campos de trazabilidad.

### Gap key_metrics: sin integration_source

`key_metrics` no tiene campo para marcar origen (manual vs. Stripe vs. Holded). Sin este campo:
- La UI no puede mostrar badge "Sincronizado desde Stripe"
- No hay forma de distinguir override manual de dato automático en queries

```sql
ALTER TABLE key_metrics ADD COLUMN integration_source TEXT
  DEFAULT 'manual'
  CHECK (integration_source IN ('manual', 'stripe', 'holded', 'quickbooks', 'xero', 'paypal', 'csv'));
ALTER TABLE key_metrics ADD COLUMN synced_at TIMESTAMPTZ;
```

### Gap tasks: sin external_provider / external_id / external_synced_at

Necesario para la frontera temporal del execution_rate (BLOQUE_A2_AUDIT.md §I15.A2.3):
- Solo cuenta tareas externas completadas DESPUÉS de `integration_connected_at`
- Tareas previas → `status = 'done_historical'` (nuevo valor ENUM)

```sql
ALTER TABLE tasks ADD COLUMN external_provider TEXT;
ALTER TABLE tasks ADD COLUMN external_id TEXT;
ALTER TABLE tasks ADD COLUMN external_synced_at TIMESTAMPTZ;
ALTER TYPE task_status ADD VALUE 'done_historical';
```

---

## 10. Módulos pasivos (mejoran sin cambios)

Estos módulos no necesitan modificaciones para beneficiarse de las integraciones:

| Módulo | Por qué es pasivo | Cómo mejora |
|---|---|---|
| Weekly Review | Lee key_metrics, tasks, obvs | Si esos datos mejoran, el review mejora automáticamente |
| Strategic Cycles | Captura engine_snapshot al cerrar | Los motores mejoran → el snapshot al cierre es más preciso |
| Next Action Engine | Lee phase_state, probability, risk | Los motores mejoran → el next action es más informado |

---

## 11. Módulos que necesitan cambios de UI (Bloque E-F)

Estos módulos funcionan con datos externos, pero el founder necesita visibilidad del origen:

| Módulo | Cambio UX necesario | Cuándo |
|---|---|---|
| `KeyMetricsEditor` | Badge "Sincronizado desde Stripe" cuando `integration_source != 'manual'`. Override manual posible. | Bloque E |
| `FinancieroView` | Indicador "último sync [fecha]". Toggle real/AI en proyecciones. | Bloque E |
| `ProjectCRMTab` | Columna `source` en pipeline. Stats unificados. Drag-to-done en HubSpot deal → sync-back. | Bloque E |
| Task Kanban | Badge de provider en tareas externas. Filtro por `external_provider`. | Bloque F |

---

## 12. Invariantes de diseño (no negociables)

1. **Ningún agente escribe directamente en tablas de motor.** Solo vía `write_integration_to_engine_table()`.
2. **`write_integration_to_engine_table()` siempre verifica confidence ≥ 0.8.** Sin excepción por agente, provider o urgencia.
3. **Los motores no saben el origen de sus datos.** No hay lógica condicional `IF integration_source = 'stripe' THEN...` en los engines SQL.
4. **`source_of_truth` es per-proyecto, per-módulo.** Nunca global. Un proyecto puede tener `key_metrics = external_primary` y `obvs = internal_only` simultáneamente.
5. **`stale_external` es un estado explícito.** Si el último sync superó la ventana de staleness, los agentes no emiten y los motores no usan esos datos. No existe "datos externos desactualizados que el motor acepta como frescos".
6. **Síntesis determinista, no 6º agente.** La función de síntesis es código, no un LLM generando consenso entre agentes.
7. **Silencio en lugar de ruido.** Si un agente no tiene datos suficientes (data_points < mínimo por insight_type), no emite. Un insight de baja calidad es más dañino que ninguno.
8. **1 provider bien → luego generalizar.** Stripe v1 valida el camino completo. No escalar a múltiples providers hasta que el primer corte esté en producción con datos reales.

---

## 13. Orden de implementación recomendado

```
PR1 (post-freeze, inmediato):
  → Crear tabla meetings + reparar useMeetings.ts
    (bug activo, runtime failures ahora mismo)

Bloque B:
  → integration_connections, sync_runs, entities, insights, credentials
  → write_integration_to_engine_table() ← LO MÁS CRÍTICO
  → ALTER TABLE key_metrics ADD integration_source, synced_at
  → ALTER TABLE tasks ADD external_provider, external_id, external_synced_at
  → ALTER TABLE obvs ADD external_provider, external_id
  → ALTER TYPE task_status ADD VALUE 'done_historical'

Stripe v1 (I15.92):
  → Provider adapter Stripe (conexión + import manual)
  → Finance Agent mínimo (mrr_trend insight + motor_write a key_metrics)
  → Verificar chain: key_metrics → probability → phase
  → UI: badge "Sincronizado desde Stripe" en KeyMetricsEditor

Holded v1 (I15.91):
  → Provider adapter Holded (facturas + gastos)
  → Finance Agent ampliado (financial_projections → Risk R1.1)
  → RunwayFactor mejora con datos reales

HubSpot v1 (I15.93):
  → Provider adapter HubSpot (deals)
  → Sales Agent (pipeline_velocity insight)
  → CRM hybrid view (ProjectCRMTab)
```

---

---

## 14. Capa de inteligencia causal

### El problema

El pipeline produce deltas reales (probability 62% → 71%), pero sin captura explícita, la UI solo puede mostrar el estado actual. El usuario ve "MRR actualizado" en lugar de "Optimus recalculó tu empresa con datos reales". Eso convierte el sistema en un dashboard de importación, no en un sistema de interpretación.

### La solución: snapshots pre/post en integration_sync_runs

```sql
ALTER TABLE integration_sync_runs
  ADD COLUMN pre_engine_snapshot  JSONB,
  ADD COLUMN post_engine_snapshot JSONB;
```

**No se añade `delta_insights`.** La narrativa se genera en **lectura**, no en escritura. Guardar narrativa en la tabla acopla los datos históricos al copy, al idioma y a la lógica de interpretación. Si la lógica cambia, los syncs antiguos quedan mal explicados. Con snapshots puros (before/after), la narrativa se puede regenerar en cualquier momento.

### Schema canónico del snapshot

Solo motores relevantes. Compacto y estable.

```json
{
  "probability": {
    "value": 62,
    "status": "active"
  },
  "phase": {
    "current_phase": 2,
    "phase_score": 68
  },
  "risk": {
    "level": "medium",
    "score": 41
  },
  "economic_profile": {
    "mrr": 9200,
    "runway_months": 7
  }
}
```

Campos fuente (verificados en auditoría Bloque A):
- `probability.value` ← `project_probability.probability_score`
- `probability.status` ← `project_probability.status`
- `phase.current_phase` ← `project_phase_state.current_phase`
- `phase.phase_score` ← `project_phase_state.phase_score`
- `risk.level` ← `project_risk_score.risk_level`
- `risk.score` ← `project_risk_score.composite_score`
- `economic_profile.mrr` ← `key_metrics.mrr` (fila más reciente)
- `economic_profile.runway_months` ← `project_economic_profile.runway_months`

Si no existe fila para un motor (proyecto nuevo), el campo es `null`. `engine-delta.ts` interpreta `null → valor` como "primer cálculo", no como mejora.

### Timing de captura

Los triggers de PostgreSQL son síncronos dentro de la misma transacción. Cuando `write_integration_to_engine_table()` (RPC) completa, los motores ya se han recalculado. Por tanto, el post_snapshot puede leerse inmediatamente después del último write, sin delay ni polling.

Flujo en la edge function de sync:

```
1. sync_run inicia (status = 'running')
2. leer estado de motores → guardar en pre_engine_snapshot
3. ejecutar writes (múltiples RPC calls) — cada write dispara sus triggers
4. último write completa — todos los motores han recalculado
5. leer estado de motores → guardar en post_engine_snapshot
6. sync_run cierra (status = 'completed')
```

El post_snapshot se toma **una sola vez**, después del último write. No después de cada write individual.

### Generación de narrativa (lectura)

`src/lib/engine-delta.ts` — función pura, determinista, sin estado.

```typescript
interface EngineSnapshot {
  probability?: { value: number; status: string } | null;
  phase?: { current_phase: number; phase_score: number } | null;
  risk?: { level: string; score: number } | null;
  economic_profile?: { mrr: number; runway_months: number } | null;
}

interface EngineDeltaItem {
  motor: string;
  before: string;
  after: string;
  direction: 'improved' | 'worsened' | 'unchanged' | 'first_calculation';
  narrative: string;
}

function computeEngineDelta(
  pre: EngineSnapshot,
  post: EngineSnapshot
): EngineDeltaItem[]
```

Ejemplos de narrativa determinista:
```
probability null → 71   → "Primer cálculo de probabilidad: 71%"
probability 62  → 71    → "Revenue momentum mejoró — probabilidad 62% → 71%"
probability 71  → 68    → "Probabilidad ajustada a la baja: 71% → 68%"
phase 2 → 3             → "Avanzaste a Fase 3 — validación completada"
risk medium → high      → "Nivel de riesgo subió a alto"
```

### Next action derivada desde estado post-sync

El Next Action Engine no tiene (confirmado o asumido) un trigger propio que persista su resultado en una tabla separada. La "next action" se deriva en lectura desde el estado actualizado de los motores. Esto significa que después del último write y la captura del post_snapshot, la next_action ya refleja el estado post-sync — sin llamada adicional.

Flujo completo del banner post-sync:

```
1. lee post_engine_snapshot (ya guardado en sync_run)
2. computeEngineDelta(pre, post) → lista de cambios
3. deriva next_action desde estado post-sync (lectura del engine, no RPC)
4. UI muestra: delta + next_action juntos
```

Si en el futuro se descubre que next_action sí existe como motor persistido con triggers, el flujo de UI no cambia — solo el paso 3 lee de una tabla en lugar de derivar.

### Regla de copy: evaluación vs. negocio

**Los cambios producidos por una integración son mejoras de evaluación, no mejoras del negocio.**

Optimus tiene datos más precisos. El negocio no ha cambiado por conectar Stripe.

| Incorrecto | Correcto |
|-----------|---------|
| "Tu probabilidad mejoró de 62% a 71%" | "Con datos reales de Stripe, Optimus recalculó tu estado: Probabilidad 62% → 71%" |
| "Conectar HubSpot mejoró tu momentum" | "Con pipeline real de HubSpot, Optimus actualizó la evaluación de ventas" |
| "Tu riesgo bajó al importar datos" | "Con datos de Holded, Optimus calculó tu runway real: 7 meses" |

**Esta regla protege la credibilidad en los dos sentidos.** Si el MRR real de Stripe es menor que el ingresado manualmente, la probability puede bajar. El banner no puede sugerir que el negocio empeoró por conectar Stripe — eso destruye la confianza justo cuando el sistema está siendo honesto. La distinción evaluación/negocio aplica igual a mejoras y a correcciones a la baja.

**Excepción v1 — criterio técnico exacto para hablar de "mejora de negocio":**

Las tres condiciones deben cumplirse simultáneamente:
1. `mrr_actual > mrr_mes_anterior` (dato real, no proyectado)
2. El dato viene de provider externo con `confidence >= 0.8`
3. No es `first_calculation` (ya existía valor previo para comparar)

Si no se cumplen las tres → siempre "mejora de evaluación", nunca "mejora de negocio". Sin excepción en v1.

### Consecuencia estratégica: timeline de inteligencia

Cada sync_run con pre/post snapshot es un evento de inteligencia del proyecto. Esto habilita construir (en fases posteriores) un timeline histórico:

```
Jun 12 — Stripe conectado
         Probability: 62% → 71%  (+9pp)

Jul 2  — HubSpot conectado
         Probability: 71% → 74%  (+3pp)

Aug 10 — Burn rate detectado (Holded)
         Risk: medium → high
```

Optimus pasa de mostrar estado actual a mostrar **historia razonada del proyecto**.

### Lo que esto requiere en Bloque B

Solo un cambio al schema de `integration_sync_runs` (I15.20):

```sql
ADD COLUMN pre_engine_snapshot  JSONB,
ADD COLUMN post_engine_snapshot JSONB;
```

La lógica de captura va en la edge function de sync (Bloque H/provider adapters). `engine-delta.ts` va en Bloque E/F (UI). El schema debe incluir los campos desde el primer día — añadirlos retroactivamente obligaría a backfill de todos los syncs históricos.

---

> **Documentos relacionados:**
> - `INTEGRATION_DATA_CONTRACT.md` — schema canónico ContractEntity, confidence, staleness
> - `AGENTS_CONTRACT.md` — AgentInsight schema, catálogo de insight_types, síntesis, invariantes
> - `BLOQUE_A_AUDIT.md` — motores: inputs, triggers, puntos de integración
> - `BLOQUE_A2_AUDIT.md` — módulos nativos: modos de integración, impacto UX
> - `INTEGRATION_INVENTORY.md` — estado actual de stubs, decisiones por integración
> - `INTEGRATION_WRITE_GUARD.md` — especificación completa de write_integration_to_engine_table()
