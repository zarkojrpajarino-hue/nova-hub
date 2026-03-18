# INTEGRATION WRITE GUARD
> Especificación completa de `write_integration_to_engine_table()`.
> Fecha: 2026-03-15. Decisiones finales confirmadas.
>
> **Propósito:** Definir el único punto de acceso autorizado para que los agentes de integración escriban en tablas de motor. Esta función es el circuito cerrado que hace operativa la arquitectura de INTEGRATION_ARCHITECTURE.md. Sin ella, los agentes son cuadros sin conexión.

---

## 1. Principio fundamental

```
NINGÚN agente de integración escribe directamente en tablas de motor.
TODA escritura pasa por write_integration_to_engine_table().
Sin excepción.
```

El provider adapter puede procesar, normalizar y calcular confidence. No puede escribir. El agente puede sintetizar insights. No puede escribir. Solo `write_integration_to_engine_table()` escribe — y solo después de validar, verificar idempotencia y registrar la operación.

---

## 2. Targets autorizados (EngineTarget)

Tablas de motor que pueden recibir escrituras de integración en v1:

```typescript
type EngineTarget =
  | 'key_metrics'
  | 'financial_projections'
  | 'project_economic_profile'
  | 'tasks'
  | 'obvs';
```

Tablas **explícitamente excluidas** (no se añaden aunque se pida):
- `project_phase_state` — solo modificada por `run_phase_engine()`
- `project_probability` — solo modificada por `run_probability_engine()`
- `project_risk_score` — solo modificada por `run_risk_engine()`
- `project_viability_state` — solo modificada por su motor
- `strategic_cycles` — gestión manual/cron
- `integration_write_log` — solo escrita por esta función misma

---

## 3. Tipos TypeScript (capa de agentes)

```typescript
type AgentType = 'finance' | 'sales' | 'execution' | 'team' | 'calendar';

type EngineTarget =
  | 'key_metrics'
  | 'financial_projections'
  | 'project_economic_profile'
  | 'tasks'
  | 'obvs';

/**
 * Unidad atómica de escritura. Un MotorWrite = una fila en una tabla de motor.
 */
interface MotorWrite {
  target: EngineTarget;
  operation: 'upsert' | 'insert';
  payload: Record<string, unknown>;
  /**
   * Identidad lógica de la fila. Requerido si el target tiene identidad temporal.
   * key_metrics → 'YYYY-MM-01' (primer día UTC del mes de occurred_at)
   * financial_projections → 'YYYY-MM-01' (mes de proyección)
   * project_economic_profile → null (singleton por proyecto)
   * tasks → null (identidad = external_provider + external_id en payload)
   * obvs → null (identidad = external_provider + external_id en payload)
   */
  logical_period?: string | null;
}

/**
 * Contexto de quién llama y desde qué sync.
 */
interface WriteContext {
  project_id: string;           // UUID del proyecto
  sync_run_id: string;          // UUID del sync_run activo
  insight_id?: string;          // UUID del insight que originó la escritura (opcional)
  agent_type: AgentType;        // Agente que solicita la escritura
  source_timestamp: string;     // ISO 8601 — cuándo ocurrió el dato en el provider
  confidence: number;           // 0.0–1.0 — calculado por el provider adapter
}

/**
 * Resultado por escritura individual.
 */
interface WriteResult {
  ok: boolean;
  reason?: WriteRejectionReason;
  log_id?: string;              // UUID del registro en integration_write_log
}

type WriteRejectionReason =
  | 'confidence_too_low'         // confidence < 0.8
  | 'unauthorized_target'        // agente sin permiso para ese target
  | 'invalid_payload'            // payload no cumple schema del target
  | 'stale_or_lower_confidence'  // conflicto: dato más nuevo o mayor confianza ya existe
  | 'duplicate_skipped'          // idempotencia: misma operación ya fue escrita
  | 'invalid_sync_run'           // sync_run_id no existe o está cerrado
  | 'unknown_project';           // project_id no encontrado
```

---

## 4. Matriz de autorización

Targets permitidos por agente en **v1**. La columna "motivo" explica los casos prohibidos.

| AgentType   | key_metrics | financial_projections | project_economic_profile | tasks | obvs | Motivo restricción |
|-------------|:-----------:|:--------------------:|:------------------------:|:-----:|:----:|-------------------|
| `finance`   | ✅ | ✅ | ✅ | ❌ | ❌ | tasks/obvs son dominio de otros agentes |
| `sales`     | ❌ | ❌ | ❌ | ❌ | ✅ | key_metrics PROHIBIDO en v1 — ver nota |
| `execution` | ❌ | ❌ | ❌ | ✅ | ❌ | solo gestiona tareas |
| `team`      | ❌ | ❌ | ❌ | ❌ | ❌ | sin escrituras en motor v1 |
| `calendar`  | ❌ | ❌ | ❌ | ❌ | ❌ | sin escrituras en motor v1 |

**Nota sobre `sales` → `key_metrics`:** PROHIBIDO en v1. No es "quizá más adelante". Es una regla explícita. El Sales Agent solo puede activar escritura en key_metrics cuando se defina formalmente la conversión `pipeline_value → expected_mrr` con su propio nivel de confidence auditado y validado. Mientras eso no ocurra, la prohibición es absoluta. Cualquier cambio a esta regla requiere una decisión explícita acordada.

---

## 5. Reglas de identidad de fila por target

Antes de escribir, la función debe resolver la identidad lógica de la fila destino. Si la identidad está ocupada por un dato más reciente o de mayor confianza, la escritura se rechaza con `stale_or_lower_confidence`.

### 5.1 `key_metrics`

```
Identidad:  (project_id, date)
date:        primer día UTC del mes de occurred_at
             → DATE_TRUNC('month', occurred_at::timestamptz)::date
Operación:  siempre UPSERT
Conflicto:  si ya existe una fila para (project_id, date):
              - source_timestamp más nuevo + confidence igual o mayor → UPSERT wins
              - source_timestamp más antiguo O confidence menor → reject: stale_or_lower_confidence
              - mismo source_timestamp + mismo confidence → duplicate_skipped (idempotencia)
```

**Regla crítica:** `date` es el primer día del mes del dato en el provider, NO el mes actual del servidor. Un pago de Stripe procesado en marzo con fecha de ingreso en febrero → `date = '2026-02-01'`. Nunca `NOW()::date`.

### 5.2 `financial_projections`

```
Identidad:  (project_id, projection_month)
projection_month: proporcionado en payload.projection_month como 'YYYY-MM-01'
Operación:  UPSERT
Conflicto:  misma lógica que key_metrics (source_timestamp + confidence)
```

### 5.3 `project_economic_profile`

```
Identidad:  project_id (singleton — una fila por proyecto)
Operación:  UPSERT siempre
Conflicto:  misma lógica (source_timestamp + confidence)
Nota:       los campos no enviados en payload no se sobreescriben (UPSERT parcial)
```

### 5.4 `tasks`

```
Identidad:  (project_id, external_provider, external_id)
            → external_provider y external_id son campos del payload
Operación:  UPSERT
Temporal:   solo se escriben tareas con completed_at >= integration_connections.connected_at
            Las tareas completadas antes de la conexión → status = 'done_historical' (no contadas por motor)
Conflicto:  misma lógica (source_timestamp + confidence)
```

### 5.5 `obvs`

```
Identidad:  (project_id, external_provider, external_id)
            → external_provider y external_id son campos del payload
Operación:  UPSERT
Conflicto:  misma lógica (source_timestamp + confidence)
```

---

## 6. Cálculo de payload_hash

La idempotencia estructural requiere un hash determinista del payload.

```
payload_hash = MD5(canonical_json(payload))
```

Donde `canonical_json` aplica estas reglas de forma recursiva (todos los niveles, no solo el primero):
1. Ordenar las claves de cada objeto JSON alfabéticamente — recursivo
2. Preservar el orden de los arrays (no ordenar arrays)
3. Eliminar espacios y saltos de línea (minified)
4. Números: sin ceros insignificantes al final (`1.50 → 1.5`)
5. Nulos: `null` explícito — no omitir

El algoritmo recursivo es necesario porque payloads con objetos anidados (`metadata`, `breakdown`) producirían hashes distintos para el mismo dato si solo se ordenara el nivel superior.

**Ejemplo:**

```json
// Payload A
{"mrr": 5000, "meta": {"source": "stripe", "period": "monthly"}}

// Payload B (mismo dato, claves en orden diferente)
{"meta": {"period": "monthly", "source": "stripe"}, "mrr": 5000}

// canonical_json(A) = canonical_json(B) = {"meta":{"period":"monthly","source":"stripe"},"mrr":5000}
// MD5 identical → duplicate_skipped ✅
```

---

## 7. Implementación: stored procedure PostgreSQL

La función **debe ser un stored procedure PostgreSQL** llamado vía `supabase.rpc()`. La razón es atomicidad: los pasos 4→5→6 (log pending → write → log update) deben ejecutarse en una sola transacción de base de datos. Una función TypeScript no puede garantizar esto — si muere entre pasos, el log queda en estado `pending` pero la escritura puede haber ocurrido o no.

### 7.1 Firma del stored procedure

```sql
CREATE OR REPLACE FUNCTION write_integration_to_engine_table(
  p_project_id       UUID,
  p_sync_run_id      UUID,
  p_insight_id       UUID,          -- NULL si no aplica
  p_agent_type       TEXT,
  p_target           TEXT,
  p_operation        TEXT,          -- 'upsert' | 'insert'
  p_payload          JSONB,
  p_logical_period   TEXT,          -- NULL si no aplica
  p_payload_hash     TEXT,          -- MD5 calculado en TypeScript antes del RPC
  p_entity_ids       UUID[],        -- IDs de integration_entities de origen
  p_confidence       NUMERIC(4,3),
  p_source_timestamp TIMESTAMPTZ
)
RETURNS JSONB                        -- { ok, reason, log_id }
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$ ... $func$;
```

### 7.2 Flujo interno (6 pasos, todos en una transacción)

```
PASO 1 — Validación
  1a. Verificar que p_project_id existe en projects
      → RAISE si no: reason = 'unknown_project'
  1b. Verificar que p_sync_run_id existe en integration_sync_runs y status ≠ 'closed'
      → RAISE si no: reason = 'invalid_sync_run'
  1c. Verificar que (p_agent_type, p_target) está en la matriz de autorización
      → RAISE si no: reason = 'unauthorized_target'
  1d. Verificar p_confidence >= 0.8
      → RAISE si no: reason = 'confidence_too_low'
  1e. Verificar que p_source_timestamp <= NOW() + INTERVAL '5 minutes'
      (tolerancia mínima para drift de reloj, nunca fechas futuras reales)
      → RAISE si no: reason = 'invalid_payload'

PASO 2 — Resolución de identidad lógica
  2a. Según p_target, calcular la identidad de fila destino:
      key_metrics → (p_project_id, DATE_TRUNC('month', source_timestamp)::date)
      financial_projections → (p_project_id, p_logical_period::date)
      project_economic_profile → (p_project_id)
      tasks → (p_project_id, payload->>'external_provider', payload->>'external_id')
      obvs → (p_project_id, payload->>'external_provider', payload->>'external_id')

PASO 3 — Verificación de idempotencia
  3a. Buscar en integration_write_log WHERE
        project_id = p_project_id
        AND sync_run_id = p_sync_run_id
        AND target = p_target
        AND logical_period IS NOT DISTINCT FROM p_logical_period
        AND payload_hash = p_payload_hash
        AND status = 'written'
      → Si existe: RETURN { ok: true, reason: 'duplicate_skipped', log_id: existing_id }

PASO 4 — Crear registro en integration_write_log (status = 'pending')
  4a. INSERT INTO integration_write_log (
        project_id, sync_run_id, insight_id, agent_type, target,
        logical_period, operation, payload_hash, entity_ids,
        confidence, source_timestamp, status, created_at
      ) VALUES (... , 'pending', NOW())
      RETURNING id INTO v_log_id

PASO 5 — Ejecutar escritura en tabla de motor
  5a. Llamar al sub-handler correcto según p_target:
      'key_metrics'             → _write_key_metrics(p_project_id, p_payload, p_source_timestamp, p_confidence)
      'financial_projections'   → _write_financial_projections(...)
      'project_economic_profile'→ _write_economic_profile(...)
      'tasks'                   → _write_task(...)
      'obvs'                    → _write_obv(...)
  5b. Cada sub-handler aplica las reglas de identidad (§5) y devuelve (ok, reason)

PASO 6 — Actualizar integration_write_log
  6a. Si ok: UPDATE status = 'written', wrote_at = NOW()
  6b. Si not ok: UPDATE status = 'rejected', reason = v_reason
  6c. RETURN { ok, reason, log_id: v_log_id }

→ FIN DE TRANSACCIÓN
```

Si cualquier paso lanza una excepción, PostgreSQL hace ROLLBACK de todo — incluyendo el INSERT de paso 4. El log nunca queda en `pending` permanente.

---

## 8. Tabla `integration_write_log`

```sql
CREATE TABLE integration_write_log (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sync_run_id      UUID        NOT NULL REFERENCES integration_sync_runs(id),
  insight_id       UUID,       -- REFERENCES integration_insights(id) — NULL si no hay insight
  agent_type       TEXT        NOT NULL,
  target           TEXT        NOT NULL,
  logical_period   TEXT,       -- NULL para singletons (project_economic_profile) y si no aplica
  operation        TEXT        NOT NULL CHECK (operation IN ('upsert', 'insert')),
  payload_hash     TEXT        NOT NULL,
  entity_ids       UUID[],     -- IDs de integration_entities que originaron la escritura
  confidence       NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source_timestamp TIMESTAMPTZ NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'written', 'rejected', 'skipped')),
  reason           TEXT,       -- WriteRejectionReason si status = 'rejected' | 'skipped'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  wrote_at         TIMESTAMPTZ,

  -- Garantía estructural de idempotencia
  -- logical_period puede ser NULL → usar IS NOT DISTINCT FROM en queries, no =
  CONSTRAINT uq_write_log UNIQUE NULLS NOT DISTINCT
    (project_id, sync_run_id, target, logical_period, payload_hash)
);

-- Índices de acceso frecuente
CREATE INDEX idx_write_log_project     ON integration_write_log (project_id, created_at DESC);
CREATE INDEX idx_write_log_sync_run    ON integration_write_log (sync_run_id);
CREATE INDEX idx_write_log_status      ON integration_write_log (status) WHERE status = 'pending';

-- RLS
ALTER TABLE integration_write_log ENABLE ROW LEVEL SECURITY;
-- Solo service_role puede leer/escribir (llamado vía SECURITY DEFINER function)
CREATE POLICY "service_role_only" ON integration_write_log
  USING (auth.role() = 'service_role');
```

**Nota sobre `UNIQUE NULLS NOT DISTINCT`:** Requiere PostgreSQL 15+. En Supabase, disponible desde 2023. Si la versión es anterior, usar un índice parcial con columna generada para NULL.

---

## 9. Patrón de llamada desde TypeScript (agentes)

Los agentes **nunca** importan la función PostgreSQL directamente. Llaman vía `supabase.rpc()`.

```typescript
import { createClient } from '@supabase/supabase-js';
import { md5CanonicalJson } from '@/lib/canonical-hash'; // helper interno

async function writeToMotor(
  supabase: ReturnType<typeof createClient>,
  write: MotorWrite,
  ctx: WriteContext
): Promise<WriteResult> {
  const payload_hash = md5CanonicalJson(write.payload);

  const { data, error } = await supabase.rpc('write_integration_to_engine_table', {
    p_project_id:       ctx.project_id,
    p_sync_run_id:      ctx.sync_run_id,
    p_insight_id:       ctx.insight_id ?? null,
    p_agent_type:       ctx.agent_type,
    p_target:           write.target,
    p_operation:        write.operation,
    p_payload:          write.payload,
    p_logical_period:   write.logical_period ?? null,
    p_payload_hash:     payload_hash,
    p_entity_ids:       [],            // rellenar con UUIDs de integration_entities
    p_confidence:       ctx.confidence,
    p_source_timestamp: ctx.source_timestamp,
  });

  if (error) {
    // Error de red o de base de datos — no WriteRejectionReason
    return { ok: false, reason: 'invalid_payload' };
  }

  return data as WriteResult;
}
```

**Helper `md5CanonicalJson`** (debe existir en `src/lib/canonical-hash.ts`):

```typescript
import { createHash } from 'crypto';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const sorted = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(k => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
    .join(',');
  return '{' + sorted + '}';
}

export function md5CanonicalJson(payload: Record<string, unknown>): string {
  return createHash('md5').update(canonicalJson(payload)).digest('hex');
}
```

---

## 10. Catálogo de errores

| Código | Cuándo ocurre | Acción recomendada |
|--------|---------------|-------------------|
| `confidence_too_low` | `confidence < 0.8` en la llamada | Descartar write, registrar en sync_run.stats |
| `unauthorized_target` | Agente sin permiso para ese target | Bug en el agente — alertar |
| `invalid_payload` | Schema del payload no válido para el target | Revisar normalización del provider adapter |
| `stale_or_lower_confidence` | Fila destino tiene dato más reciente o mayor confidence | Normal — dato antiguo llegó tarde |
| `duplicate_skipped` | Idempotencia: misma operación ya fue escrita (`status=written`) | Normal — retry legítimo |
| `invalid_sync_run` | sync_run_id no existe o `status='closed'` | Bug de coordinación — no debería ocurrir |
| `unknown_project` | project_id no encontrado | Bug grave — alertar inmediatamente |

---

## 11. Invariantes de diseño (no negociables)

1. **Cero escrituras directas.** El provider adapter recibe datos, los normaliza y llama a `write_integration_to_engine_table()`. No toca tablas de motor directamente. Nunca.

2. **Confidence mínimo 0.8.** La validación está en el stored procedure, no en el agente. El agente puede invocar con confidence 0.7 — el stored procedure rechaza. Esto previene que un agente mal configurado pase datos débiles.

3. **Los motores son ciegos al origen.** `run_phase_engine()`, `run_probability_engine()`, `run_risk_engine()` leen sus tablas. No tienen `IF integration_source = 'stripe'` ni ramas de código por provider. Si key_metrics tiene un MRR, lo usa. No importa quién lo escribió.

4. **Atomicidad garantizada por PostgreSQL.** El flujo pending→write→written es una transacción. TypeScript solo ve éxito o error — nunca estado parcial.

5. **Idempotencia estructural.** La UNIQUE constraint de `integration_write_log` garantiza que dos llamadas idénticas producen un solo registro. No es lógica de aplicación, es constraint de base de datos.

6. **payload_hash calculado en TypeScript, verificado implícitamente por la constraint.** El stored procedure no recalcula el hash — confía en la constraint. Si dos llamadas con el mismo hash llegan, la segunda falla en el UNIQUE y retorna `duplicate_skipped`.

7. **source_timestamp = cuando ocurrió en el provider, no cuando se procesa.** Un pago de enero procesado en marzo tiene `source_timestamp` de enero. Esto determina la identidad lógica de la fila (`logical_period = '2026-01-01'`).

8. **`done_historical` para tareas pre-conexión.** Las tareas externas completadas antes de `integration_connections.connected_at` se insertan con `status = 'done_historical'`. El motor de ejecución ignora este status. `integration_connections.connected_at` siempre es `NOW()` al momento de conexión — nunca retroactivo.

---

## 12. Pendiente v1.1 (fuera de scope v1)

Estos casos no están cubiertos en v1 y son aceptables:

| Gap | Impacto | Solución v1.1 |
|-----|---------|---------------|
| Sub-handlers por target no implementados aún | `write_integration_to_engine_table()` existe pero sin lógica de UPSERT por target | Implementar `_write_key_metrics()`, `_write_financial_projections()`, etc. en Bloque B |
| `Sales → key_metrics` prohibido | Conversión pipeline→MRR no posible en v1 | Definir modelo de conversión + confidence propio antes de habilitar |
| `team` y `calendar` sin escrituras | Sin efecto en motores v1 | Diseñar qué tablas de motor podrían recibir señales de equipo/calendario |
| Retry de escrituras rechazadas | No hay mecanismo de reintento automático para `stale_or_lower_confidence` | Decidir si los datos stale se descartan o se acumulan para comparación |
| Audit trail de quién invocó | `integration_write_log` registra agent_type pero no el `user_id` que inició la conexión | Añadir `initiated_by UUID` a sync_runs |

---

## 13. Dependencias de implementación

```
integration_connections (I15.19)  ←┐
integration_sync_runs  (I15.20)    │  Prerrequisitos
integration_entities   (I15.21)    │  para el stored procedure
integration_insights   (I15.22)   ←┘

↓

integration_write_log [CREATE TABLE — este documento §8]
write_integration_to_engine_table [stored procedure — §7]
md5CanonicalJson helper [src/lib/canonical-hash.ts — §9]

↓

Finance Agent (I15.78)   — primer consumidor real
Stripe v1 adapter (I15.92)
```

El stored procedure puede crearse antes de que los agentes existan. Los agentes pueden desarrollarse y testarse contra el stored procedure con sync_runs manuales.
