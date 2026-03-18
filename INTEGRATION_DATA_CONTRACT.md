# INTEGRATION DATA CONTRACT — v1.0
> **I15.A.15** — Contrato canónico para datos externos en Optimus-K.
> Fecha: 2026-03-15. Autoritativo — cualquier integración que no lo cumpla no entra al sistema.
>
> **Relación con otros documentos:**
> - `INTEGRATION_INVENTORY.md` — qué hay hoy en el código (estado y decisiones de limpieza)
> - `OPTIMUS_CHARACTER.md` — cómo Optimus usa los outputs finales (insights)
> - `OPTIMUS_PROMPTS.md §8` — cómo los insights alimentan el context packet del ritual
> - Bloque B (I15.15–I15.30) — las tablas que implementan este contrato
> - Bloque C (I15.31–I15.44) — los normalizadores que aplican este contrato
> - Bloque G0 (I15.G0.1–I15.G0.12) — contrato canónico de agentes (complementario a este)

---

## 1. Propósito y principios

### Para qué existe
Establecer el formato único en el que Optimus acepta datos externos. Cualquier proveedor externo
(Stripe, Holded, HubSpot, Asana, Slack, Google Calendar...) debe convertir sus datos a este
formato antes de que sean legibles por motores, agentes o la UI.

### Tres garantías que este contrato provee
1. **Aislamiento de proveedor:** los motores y agentes nunca ven payload crudo. Si Stripe cambia
   su API, solo cambia el normalizador de Stripe — nada más.
2. **Normalización semántica:** `deal` de HubSpot y `deal` de Salesforce son la misma entidad
   desde el punto de vista del Sales Agent.
3. **Trazabilidad:** cualquier insight generado puede rastrearse hasta el dato origen,
   hasta el sync que lo trajo, hasta el provider que lo emitió.

### Principio fundamental
> Datos externos → Normalización → Contrato → Motores/Agentes.
> Ningún motor ni agente puede leer payload crudo de un provider.
> Sin normalización, el dato no existe para el sistema.

### Qué NO define este contrato
- El mecanismo de autenticación con cada provider (→ I15.23 `integration_credentials`)
- Los intervalos de sync por provider (→ I15.26 `integration_sync_runs`)
- El sistema de retry/backoff (→ I15.27)
- El formato de output de los agentes (→ Bloque G0, `AGENTS_CONTRACT.md`)
- Las reglas de síntesis entre agentes (→ I15.G0.9)

---

## 2. Taxonomía de entidades

### Principio de naming
Los tipos son semánticos, no técnicos. No se llaman `stripe_charge` — se llaman `financial_transaction`.
El provider es metadata del dato, no parte de su identidad semántica.

### Catálogo v1

| entity_type | Descripción | Providers v1 | Providers v2 |
|---|---|---|---|
| `financial_transaction` | Cobro, pago, refund | Stripe, Holded | QuickBooks, Xero |
| `invoice` | Factura emitida o recibida | Holded | QuickBooks |
| `expense` | Gasto o coste | Holded | QuickBooks, Xero |
| `subscription` | Suscripción activa, sus cambios | Stripe | — |
| `customer` | Cliente identificable | Stripe, Holded | HubSpot |
| `deal` | Oportunidad comercial en pipeline | — | HubSpot |
| `contact` | Persona de contacto | — | HubSpot |
| `company` | Empresa cliente o prospect | — | HubSpot |
| `pipeline_event` | Movimiento de deal entre etapas | — | HubSpot |
| `task` | Tarea o acción ejecutable | — | Asana, Trello |
| `milestone` | Hito con fecha objetivo | — | Asana |
| `project_item` | Ítem genérico de un board externo | — | Asana, Trello |
| `calendar_event` | Evento o reunión agendada | — | Google Calendar |
| `meeting` | Reunión con participantes | — | Google Calendar |
| `message_signal` | Señal de mensaje en canal | Slack | Teams |
| `channel_activity` | Actividad agregada de un canal | Slack | Teams |

> **Nota v1:** solo entidades con "Providers v1" tienen normalizadores que se implementan
> en este ciclo. Las de v2 se implementan cuando el provider esté en desarrollo.
> El contrato define TODAS para que la arquitectura no tenga que rehacerse después.

---

## 3. Schema canónico de dato externo (ContractEntity)

Todo dato que entra al sistema debe cumplir este schema. Sin excepciones.

```typescript
interface ContractEntity {
  // ── Identidad ─────────────────────────────────────────────────────────────
  provider:       string;          // 'stripe' | 'holded' | 'hubspot' | 'slack' | ...
  entity_type:    EntityType;      // ver §2
  external_id:    string;          // ID único en el sistema del provider — NUNCA null
  project_id:     string;          // UUID del proyecto Optimus al que pertenece

  // ── Temporalidad ──────────────────────────────────────────────────────────
  occurred_at:    string;          // ISO 8601 — cuándo ocurrió el evento en el proveedor
  source_timestamp: string;        // ISO 8601 — cuándo lo leyó el sync (≥ occurred_at siempre)
  synced_at:      string;          // ISO 8601 — cuándo se insertó en Optimus

  // ── Datos ─────────────────────────────────────────────────────────────────
  payload:        EntityPayload;   // datos normalizados específicos del entity_type (ver §4)
  raw_payload?:   object;          // payload original del provider — opcional, solo para debug

  // ── Calidad ───────────────────────────────────────────────────────────────
  confidence:     number;          // 0.0–1.0 — ver §5 para definición exacta
  is_complete:    boolean;         // ¿cumple todos los campos required del entity_type?
  missing_fields: string[];        // campos required ausentes (vacío si is_complete=true)

  // ── Trazabilidad ──────────────────────────────────────────────────────────
  sync_run_id:    string;          // FK a integration_sync_runs
  connection_id:  string;          // FK a integration_connections
}
```

### Clave de deduplicación
`(project_id, provider, entity_type, external_id)` — única en `integration_entities`.
Si llega una entidad con la misma clave, es un UPDATE (sync incremental), no un INSERT.

---

## 4. Schema de payload por entity_type

Cada entity_type tiene campos required (R) y opcionales (O).
Un dato puede entrar al sistema con campos opcionales ausentes — su `confidence` baja.
Un dato con campos required ausentes no entra: se registra como error en `integration_sync_runs`.

### `financial_transaction`
```typescript
{
  amount:        number;    // R — en unidad mínima de moneda (centavos para EUR/USD)
  currency:      string;    // R — ISO 4217 ('EUR', 'USD', ...)
  direction:     'in'|'out'; // R — ingreso o gasto
  status:        'completed'|'pending'|'failed'|'refunded'; // R
  description?:  string;    // O
  customer_id?:  string;    // O — external_id del customer si lo hay
  category?:     string;    // O — categoría del provider
  metadata?:     object;    // O — campos extra del provider
}
```

### `invoice`
```typescript
{
  amount:        number;    // R
  currency:      string;    // R
  status:        'draft'|'sent'|'paid'|'overdue'|'cancelled'; // R
  due_date?:     string;    // O — ISO 8601
  customer_id?:  string;    // O
  line_items?:   object[];  // O
}
```

### `expense`
```typescript
{
  amount:        number;    // R
  currency:      string;    // R
  category:      string;    // R — categoría del gasto
  description?:  string;    // O
  vendor?:       string;    // O
}
```

### `subscription`
```typescript
{
  plan_name:     string;    // R
  status:        'active'|'trialing'|'past_due'|'cancelled'|'paused'; // R
  mrr_contribution: number; // R — aportación mensual en centavos
  customer_id?:  string;    // O
  trial_end?:    string;    // O — ISO 8601
  cancel_at?:    string;    // O — ISO 8601
}
```

### `customer`
```typescript
{
  name:          string;    // R
  email?:        string;    // O
  lifetime_value?: number;  // O — en centavos
  segment?:      string;    // O
  first_seen_at?: string;   // O — ISO 8601
}
```

### `deal`
```typescript
{
  title:         string;    // R
  stage:         string;    // R — etapa del pipeline (nombre libre)
  amount?:       number;    // O — valor estimado en centavos
  currency?:     string;    // O
  probability?:  number;    // O — 0.0–1.0
  expected_close_date?: string; // O — ISO 8601
  contact_id?:   string;    // O
  company_id?:   string;    // O
}
```

### `pipeline_event`
```typescript
{
  deal_id:       string;    // R — external_id del deal
  from_stage:    string;    // R
  to_stage:      string;    // R
  moved_by?:     string;    // O — usuario que lo movió
}
```

### `task`
```typescript
{
  title:         string;    // R
  status:        'todo'|'in_progress'|'done'|'blocked'; // R
  due_date?:     string;    // O — ISO 8601
  assignee_id?:  string;    // O — external_id del usuario en el provider
  priority?:     'low'|'medium'|'high'; // O
  project_ref?:  string;    // O — referencia al proyecto en el provider externo
}
```

### `calendar_event`
```typescript
{
  title:         string;    // R
  start_at:      string;    // R — ISO 8601
  end_at:        string;    // R — ISO 8601
  status:        'confirmed'|'tentative'|'cancelled'; // R
  attendees?:    string[];  // O — emails
  location?:     string;    // O
  is_recurring?: boolean;   // O
}
```

### `meeting`
```typescript
{
  title:         string;    // R
  start_at:      string;    // R — ISO 8601
  duration_min:  number;    // R — duración en minutos
  attendees?:    string[];  // O
  outcome?:      string;    // O — notas o resultado
}
```

### `message_signal`
```typescript
{
  channel_id:    string;    // R — ID del canal en el provider
  signal_type:   'mention'|'keyword_match'|'reaction'|'reply'; // R
  content_preview?: string; // O — extracto de máximo 200 chars
  sender_id?:    string;    // O
}
```

### `channel_activity`
```typescript
{
  channel_id:    string;    // R
  message_count: number;    // R — mensajes en el período
  period_start:  string;    // R — ISO 8601
  period_end:    string;    // R — ISO 8601
  active_users?: number;    // O
}
```

---

## 5. Política de confianza (confidence)

### Problema
Un `confidence: number` sin definición es inútil: Stripe podría usar una escala y Holded otra.
Los agentes no pueden comparar ni priorizar sin base común.

### Definición determinista
`confidence` es la media ponderada de tres componentes calculados en el normalizador:

```
confidence = (w1 × schema_score) + (w2 × provider_score) + (w3 × recency_score)

w1 = 0.5   // schema_score pesa más: un dato incompleto es un dato no fiable
w2 = 0.3
w3 = 0.2
```

**`schema_score`** — qué porcentaje de los campos required están presentes y tienen tipo correcto.
```
schema_score = campos_required_válidos / total_campos_required
```
Si todos los required están: `schema_score = 1.0`
Si faltan 2 de 4 campos required: `schema_score = 0.5` → dato no entra (ver regla abajo)

**`provider_score`** — fiabilidad histórica del provider para este entity_type.
Calculado en `integration_connections.reliability_score` (media móvil de 30 días).
Valor inicial cuando no hay historial: `0.8` (beneficio de la duda en v1).

**`recency_score`** — qué tan reciente es el dato relativo a su ventana de staleness (ver §10).
```
recency_score = MAX(0, 1 - (elapsed_seconds / staleness_window_seconds))
```
Dato recién sincronizado: `recency_score = 1.0`
Dato a la mitad de su ventana de staleness: `recency_score = 0.5`
Dato vencido: `recency_score = 0.0`

### Reglas de uso por umbral

| Rango | Estado | Qué pueden hacer los agentes |
|---|---|---|
| `>= 0.8` | Fiable | Usar como base de insight y recomendación |
| `0.7 – 0.79` | Usable | Usar como dato informativo; no generar recomendación basada solo en este dato |
| `0.5 – 0.69` | Degradado | Solo mostrar en UI como "dato incompleto"; agentes no lo usan |
| `< 0.5` | Rechazado | No entra a `integration_entities`; se registra error en `integration_sync_runs` |

> **Regla de schema_score = 0.0:** si ningún campo required está presente,
> el dato se rechaza independientemente del confidence calculado.

---

## 6. Validaciones obligatorias antes de aceptar datos

El normalizador de cada provider ejecuta estas validaciones ANTES de insertar en `integration_entities`.
Si falla cualquier validación obligatoria (marcada 🔴), el dato se rechaza y se registra en
`integration_sync_runs.errors`.

### Validaciones de identidad (🔴 obligatorias)
- `external_id` no puede ser null ni string vacío
- `provider` debe estar en la lista de providers registrados en `integration_connections`
- `entity_type` debe ser un valor válido del catálogo (ver §2)
- `project_id` debe existir en la tabla `projects`

### Validaciones de temporalidad (🔴 obligatorias)
- `occurred_at` debe ser ISO 8601 válido
- `occurred_at` no puede ser en el futuro (±5 minutos de tolerancia para drift de reloj)
- `source_timestamp` debe ser ≥ `occurred_at`

### Validaciones de payload (🔴 obligatorias)
- El payload debe cumplir el schema del entity_type (ver §4)
- Todos los campos required del entity_type deben tener tipo correcto
- Si `schema_score < 0.5`, rechazar (aunque los required presentes sean válidos)

### Validaciones de deduplicación (🟠 importantes, no bloquean si hay error)
- Si `(project_id, provider, entity_type, external_id)` ya existe → UPDATE, no INSERT
- Si la versión existente es más reciente (`synced_at` mayor), descartar (no sobreescribir con dato viejo)

### Validaciones de cuota (🟡 soft limits)
- Por proyecto: máximo 10.000 entidades activas por entity_type (si se supera, archivar las más viejas)
- Por sync_run: máximo 1.000 entidades por ejecución (si hay más, paginar con múltiples sync_runs)

---

## 7. Almacenamiento y pipeline

### Tablas del contrato (Bloque B, I15.19–I15.23)

```
integration_connections          integration_sync_runs
  id (PK)                          id (PK)
  project_id → projects            connection_id → integration_connections
  provider                         started_at
  status (connected/error/paused)  finished_at
  connected_at                     entities_synced
  last_sync_at                     entities_rejected
  reliability_score                errors JSONB[]
  config JSONB                     sync_type (full/incremental)
        ↓
integration_credentials          integration_entities
  connection_id → above            id (PK)
  [cifrado — ver §11]              connection_id
                                   sync_run_id
                                   provider
                                   entity_type
                                   external_id
                                   project_id
                                   occurred_at
                                   source_timestamp
                                   synced_at
                                   payload JSONB
                                   confidence
                                   is_complete
                                   missing_fields TEXT[]
                                   is_stale BOOLEAN
                                   archived_at
        ↓
integration_insights               (generadas por agentes — Bloque G)
  id (PK)
  project_id
  entity_ids UUID[]               → FK a integration_entities
  agent_type
  insight_type
  content JSONB
  confidence
  generated_at
  expires_at
```

### Flujo completo de un dato

```
Provider API
    ↓ (sync_run)
Normalizer                   ← aplica §4 schemas + calcula confidence (§5)
    ↓ (validaciones §6)
integration_entities         ← dato almacenado o error registrado
    ↓ (leído por agentes — ver §8)
integration_insights         ← insight generado con trazabilidad a entity_ids
    ↓ (guard de escritura a motores — ver abajo)
project_economic_profile /   ← ÚNICA vía por la que un dato externo modifica estado del motor
project_viability_state /
revenue_momentum             ← nunca directamente desde insights; siempre vía guard
    ↓
get_optimus_context()        ← consume solo insights + valores de tablas de motor, nunca payload crudo
```

### Guard de escritura a tablas de motor (invariante de implementación)

El flujo anterior protege los motores en diseño. Para que sea real en implementación,
el check `confidence >= 0.8` antes de escribir a tablas de motor **no puede vivir disperso
en cada agente**. Si vive en el Finance Agent y en el Sales Agent por separado, tarde o
temprano una implementación lo omite.

**Regla de implementación obligatoria:**

Debe existir una única función compartida `write_integration_to_engine_table(insight, target_table, target_column)` que:
1. Verifica `insight.confidence >= 0.8` — rechaza si no cumple
2. Verifica que `insight.expires_at > NOW()` — rechaza si el insight está vencido
3. Marca el valor escrito con `integration_source = true` en la tabla destino
4. Registra el write en un log de trazabilidad

Ningún agente puede escribir directamente en tablas de motor con un `UPDATE` / `upsert` propio.
Todo write a tablas de motor pasa por esta función. Si no existe esta función, el agente
no puede modificar el estado del sistema — solo puede generar `integration_insights`.

Esta regla es un requisito de aceptación de cualquier agente en Bloque G.

---

## 8. Normalización por provider

### Patrón de implementación

Cada provider implementa una función pura `normalize_<provider>_<entity_type>`:
- Input: payload crudo del provider
- Output: `ContractEntity` o `null` (si el dato es irrecuperable)
- Sin efectos secundarios — la inserción en DB la hace el sistema de sync

```typescript
// Patrón base para todos los normalizadores
function normalize_stripe_financial_transaction(raw: StripeCharge, context: SyncContext): ContractEntity | null {
  // 1. Mapear campos
  // 2. Calcular schema_score
  // 3. Calcular confidence
  // 4. Retornar ContractEntity o null
}
```

### Mapa de normalización v1

| Provider | entity_type | Fuente en la API del provider |
|---|---|---|
| Stripe | `financial_transaction` | `charges` endpoint (type=charge, refund) |
| Stripe | `subscription` | `subscriptions` endpoint |
| Stripe | `customer` | `customers` endpoint |
| Holded | `financial_transaction` | `sales/invoices` + `purchases/expenses` |
| Holded | `invoice` | `sales/invoices` |
| Holded | `expense` | `purchases/expenses` |
| Holded | `customer` | `contacts` (type=client) |
| Slack | `message_signal` | Events API (app_mention, message events) |
| Slack | `channel_activity` | `conversations.history` aggregado |

### Reglas de normalización que aplican a todos los providers
1. Timestamps del provider → convertir siempre a ISO 8601 UTC
2. Montos monetarios → convertir siempre a unidad mínima (centavos). Nunca float para dinero.
3. Estados del provider → mapear al enum del entity_type. Si no hay mapeo claro, usar el más conservador
4. IDs externos → preservar como string, nunca convertir a UUID interno

---

## 9. Reglas de hidratación de módulos internos

### Principio: source_of_truth es configuración de proyecto, no hardcode del sistema
Un proyecto sin HubSpot conectado usa su CRM interno como única fuente. No existe un default
global que diga "el CRM es siempre externo". La hidratación es opt-in por proyecto por módulo.

### Estados posibles por módulo

Hay dos tipos de estados: **configurados** (el proyecto los activa) y **derivados** (el sistema los calcula automáticamente a partir del estado de la integración).

| Estado | Tipo | Descripción |
|---|---|---|
| `internal_only` | Configurado | Solo datos internos de Optimus. Default para todos los módulos. |
| `external_primary` | Configurado | Datos externos como fuente principal cuando la integración está activa y el sync está fresco. |
| `hybrid` | Configurado | Ambas fuentes activas. Reglas de prioridad en sección "Resolución de conflictos". |
| `external_readonly` | Configurado | Datos externos visibles en UI pero no alimentan motores. |
| **`stale_external`** | **Derivado** | **Estado automático: la integración está conectada pero el último sync superó la ventana de staleness. Los datos externos se muestran con indicador de obsolescencia y los motores no los usan. No confundir con `external_primary` con sync fresco.** |

> **`stale_external` es el estado más peligroso.** Un módulo en `external_primary` con sync
> vencido parece funcionar con normalidad, pero los motores están tomando decisiones con datos
> que pueden tener horas o días de retraso. La distinción explícita entre `external_primary`
> y `stale_external` evita que este escenario quede invisible.

### Transiciones de estado por módulo

```
internal_only
    ↓ (usuario conecta integración + primer sync completa)
external_primary / hybrid / external_readonly
    ↓ (última sync supera ventana de staleness)
stale_external
    ↓ (sync exitoso)
external_primary / hybrid / external_readonly  ← recupera estado configurado
    ↓ (usuario desconecta integración)
internal_only
```

No hay transición directa de `stale_external` a `internal_only` sin desconexión explícita:
la integración sigue conectada, solo que los datos están obsoletos. El sistema muestra
el estado con claridad y espera a que el próximo sync recupere la frescura.

### Comportamiento en `stale_external`
- Los agentes **no generan nuevos insights** basados en entidades marcadas `is_stale = true`
- Los insights existentes (generados antes de que los datos envejecieran) se mantienen pero con
  `confidence` recalculado con `recency_score = 0` → efectivamente inelegibles para escribir en motores
- La UI muestra banner "Datos de [provider] desactualizados — última sync: hace X horas"
- `get_optimus_context()` omite insights de integraciones en estado `stale_external`

### Configuración por módulo (default + override)

| Módulo | Default | Override posible | Condición para override |
|---|---|---|---|
| CRM (leads/deals) | `internal_only` | `external_primary` | Cuando HubSpot o similar conectado y primer sync completado |
| Financiero | `internal_only` | `external_primary` | Cuando Stripe o Holded conectado y primer sync completado |
| Tareas | `internal_only` | `hybrid` | Cuando Asana o Trello conectado |
| Calendario | `internal_only` | `external_readonly` | Cuando Google Calendar conectado (datos externos nunca alimentan engines) |
| Slack | N/A | `message_signal` | Solo señales de actividad, no datos estructurales |

### Resolución de conflictos en modo `hybrid`
1. Un campo editado manualmente en Optimus DESPUÉS del último sync: el valor manual prevalece
2. Un campo actualizado en el provider DESPUÉS de la edición manual: el valor externo prevalece SOLO si `confidence >= 0.8`
3. Empate de timestamps (±5 min): dato manual prevalece
4. El usuario siempre puede hacer override manual explícito — su decisión es final
5. Si el módulo está en `stale_external`, ninguna de las reglas anteriores aplica: solo datos internos

### Cuándo el módulo vuelve a `internal_only`
- Si la integración se desconecta explícitamente → `internal_only` inmediato
- Si el último sync tiene `status=error` y han pasado > 3× la ventana de staleness → `internal_only` (failsafe)
- El failsafe es irreversible hasta que el usuario reconecte la integración

---

## 10. Acceso por motores y agentes

### Principio
Los motores existentes (Phase, Probability, Risk, Viability) NO consumen `integration_entities`
directamente. Consumen `integration_insights` que los agentes generan. Esta indirección
protege los motores de cambios en el schema del proveedor.

### Qué puede consumir cada capa

| Motor/Agente | Lee de | Entity types relevantes |
|---|---|---|
| Finance Agent | `integration_entities` | `financial_transaction`, `invoice`, `expense`, `subscription` |
| Sales Agent | `integration_entities` | `deal`, `contact`, `company`, `pipeline_event`, `customer` |
| Execution Agent | `integration_entities` | `task`, `milestone`, `project_item` |
| Calendar Agent | `integration_entities` | `calendar_event`, `meeting` |
| Team Agent | `integration_entities` | `message_signal`, `channel_activity` |
| Probability Engine | `integration_insights` | insights de Finance Agent + Sales Agent |
| Risk Engine | `integration_insights` | insights de Finance Agent |
| Phase Engine | `integration_insights` | insights de Execution Agent |
| Viability Engine | `integration_insights` | insights de Finance Agent (runway) |
| Next Action / getNextAction() | `integration_insights` | insights de todos los agentes (via context packet) |
| `get_optimus_context()` | `integration_insights` | insights marcados como `include_in_context=true` |

### Regla de acceso crítica
> **Ningún motor puede leer `integration_entities.payload` directamente.**
> Si un motor necesita un dato de una integración, debe existir un agente que lo procese
> y genere el insight correspondiente. Esta regla evita que los motores dependan
> del formato de un provider específico.

### Cómo los insights alimentan los motores (v1 — detalle)

| Insight | Genera | Alimenta |
|---|---|---|
| `mrr_from_stripe` | Finance Agent | `project_economic_profile.arr_estimado` → Probability Engine |
| `runway_estimate` | Finance Agent | `project_viability_state` inputs → Viability Engine |
| `pipeline_velocity` | Sales Agent | `revenue_momentum` input del Probability Engine |
| `task_completion_rate` | Execution Agent | `execution_health` del Phase Engine (futuro v2) |

---

## 11. Política de staleness

Un dato se considera stale (obsoleto) cuando ha superado su ventana sin recibir una
actualización. Un dato stale no se elimina, pero:
- Los agentes lo marcan como de baja confianza (recency_score → 0)
- La UI lo muestra con indicador visual de "datos desactualizados"
- Los motores no lo usan para decisiones hasta el próximo sync exitoso

### Ventanas de staleness v1

| entity_type | Ventana de staleness | Razón |
|---|---|---|
| `financial_transaction` | 24h | Cobros pueden llegar con delay bancario |
| `invoice` | 24h | Igual que transacciones |
| `expense` | 24h | Igual |
| `subscription` | 24h | Cambios de plan pueden tener delay |
| `customer` | 72h | Datos de clientes cambian menos |
| `deal` | 12h | Pipeline activo requiere frescura |
| `contact` | 72h | Datos de contacto cambian poco |
| `company` | 72h | Igual |
| `pipeline_event` | 6h | Movimientos de pipeline son tiempo-críticos |
| `task` | 6h | Tareas activas necesitan estar actualizadas |
| `calendar_event` | 1h | Reuniones pueden cambiar en el día |
| `meeting` | 1h | Igual |
| `message_signal` | 30min | Señales de comunicación son inmediatas |
| `channel_activity` | 1h | Actividad agrupada |

### Cuándo se marca `is_stale = true`
El campo `is_stale` en `integration_entities` se actualiza por el cron de sync:
si `NOW() - synced_at > staleness_window` → `is_stale = true`.
Se resetea a `false` en el próximo sync exitoso que actualice el dato.

---

## 12. Política de seguridad

### Credenciales (I15.23 + I15.0.9)
- Ninguna credencial (API key, OAuth token, refresh token) se almacena en texto plano
- Las credenciales viven en `integration_credentials` como tabla separada con:
  - Cifrado de columnas sensibles (Supabase Vault o `pgcrypto.encrypt`)
  - RLS: solo el proyecto dueño puede leer sus credenciales
  - Las credenciales nunca aparecen en logs ni en payloads de error
- El payload `raw_payload` en `integration_entities` NUNCA debe contener credenciales

### Acceso por RLS
- `integration_entities`: solo miembros del proyecto pueden leer (`auth_is_project_member`)
- `integration_connections`: solo miembros del proyecto pueden leer y modificar
- `integration_insights`: solo miembros del proyecto pueden leer
- `integration_credentials`: solo owner del proyecto + service role para sync

### Audit
- Todo sync run se registra en `integration_sync_runs` con timestamps y conteos
- Los errores se registran sin incluir el payload completo del provider
- Las desconexiones de una integración se registran en `integration_connections.disconnected_at` — no se borran

### Scopes mínimos
Cada provider debe solicitar solo los scopes necesarios para los entity_types que sincroniza.
Ejemplo Stripe v1: `charges:read`, `subscriptions:read`, `customers:read` — nunca `payouts:write`.
Los scopes deben documentarse en el normalizador de cada provider.

---

## 13. Compatibilidad con motores existentes

Esta tabla es la interfaz entre este contrato y lo que ya existe en producción.
Es la garantía de que las integraciones no rompen el engine actual.

| Motor existente | Input actual (antes de integraciones) | Input con integración | Riesgo de rotura |
|---|---|---|---|
| Phase Engine (`run_phase_engine`) | OBVs validados, tareas completadas, team coverage | + insights de Execution Agent (futuro) | Bajo — Phase Engine no cambia; los insights son adicionales |
| Probability Engine (`compute-probability-score`) | `key_metrics.mrr`, `revenue_momentum` de CRM interno | `mrr` puede venir de Finance Agent insight | **Medio** — si Finance Agent sobreescribe `key_metrics.mrr` sin validación, el score cambia abruptamente |
| Risk Engine | `key_metrics`, runway calculado | + runway de Finance Agent | Bajo — insight complementa, no sobreescribe |
| Viability Engine (`run_viability_engine`) | `project_economic_profile.runway_months` | + runway de Finance Agent insight | **Medio** — mismo riesgo que Probability Engine |
| Next Action (`getNextAction`) | `phaseState`, `riskLevel`, `viabilityStatus` | + insights relevantes en context packet | Bajo — getNextAction no cambia; insights son contexto adicional |
| `get_optimus_context()` | 22 campos del engine actual | + campo `integration_insights[]` (nuevo) | Bajo — campo adicional, no modifica existentes |

### Regla de protección para motores de riesgo medio
Los motores Probability y Viability NO leen insights de integración directamente.
El flujo correcto es:
```
Finance Agent insight → project_economic_profile UPDATE (con flag integration_source=true)
                                                          ↓
                                              Probability Engine / Viability Engine
                                              (leen project_economic_profile como siempre)
```
El campo `integration_source` permite que una auditoría pueda distinguir valores de integración
de valores manuales. Si el insight tiene `confidence < 0.8`, NO se escribe en `project_economic_profile`.

---

## 14. Contrato de errores

Cuando un dato es rechazado en la normalización, el error se registra en
`integration_sync_runs.errors` como objeto estructurado:

```typescript
interface SyncError {
  entity_type:   string;
  external_id:   string;         // para trazabilidad — sin datos sensibles
  error_code:    SyncErrorCode;
  error_detail:  string;         // descripción legible
  occurred_at:   string;
}

type SyncErrorCode =
  | 'MISSING_REQUIRED_FIELD'     // faltó un campo R del payload
  | 'INVALID_TIMESTAMP'          // timestamp malformado o futuro
  | 'UNKNOWN_ENTITY_TYPE'        // entity_type no reconocido
  | 'SCHEMA_SCORE_TOO_LOW'       // schema_score < 0.5
  | 'DUPLICATE_NEWER_EXISTS'     // ya existe versión más reciente
  | 'QUOTA_EXCEEDED'             // superó límite de entidades por proyecto
  | 'INVALID_PROVIDER'           // provider no registrado en integration_connections
  | 'PROJECT_NOT_FOUND';         // project_id no existe
```

Un sync_run con `entities_rejected > 0` no es un fallo del sync — es información valiosa.
El sistema debe continuar procesando entidades válidas aunque algunas fallen.

---

## 15. Versioning del contrato

### Cómo se versiona este contrato
- El campo `payload` en `integration_entities` lleva un campo `_contract_version: string`
  que indica qué versión del schema se usó para normalizar ese dato
- Los cambios **aditivos** (nuevos campos O opcionales) son backward-compatible: no requieren migración
- Los cambios **destructivos** (renombrar campos R, eliminar entity_types) requieren migración
  y bump de versión mayor

### Versiones
- `v1.0` (2026-03-15): schema base, 15 entity_types, providers Stripe+Holded+Slack
- `v1.1` (pendiente): añadir entity_types de HubSpot cuando se implemente el provider
- `v2.0` (pendiente): si se redefine el modelo de confidence o se rompe backward compat

---

> **Próximo documento:** `AGENTS_CONTRACT.md` (Bloque G0, I15.G0.1–I15.G0.12)
> — define cómo los agentes consumen `integration_entities`, producen `integration_insights`,
> y coordinan sin generar señales contradictorias para el founder.
