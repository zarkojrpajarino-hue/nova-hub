# AGENTS CONTRACT — v1.0
> **I15.G0.1–I15.G0.12** — Contrato canónico del sistema de agentes especializados de Optimus-K.
> Fecha: 2026-03-15. Autoritativo — ningún agente puede implementarse sin cumplir este contrato.
>
> **Prerequisito:** `INTEGRATION_DATA_CONTRACT.md` v1.0 aprobado.
> **Complementa:** `OPTIMUS_CHARACTER.md` (Optimus central) · `INTEGRATION_DATA_CONTRACT.md` (datos de entrada)
> **Implementa:** Bloque G (I15.77–I15.90) de FASE 15.
>
> **Problema central que este documento resuelve:**
> 5 agentes especializados + 1 motor central = riesgo de 5 cerebros compitiendo.
> Sin este contrato, cada agente puede generar señales contradictorias, ruido acumulado,
> y recomendaciones que socavan la autoridad del motor central.
> Este documento define cómo 5 agentes → 1 decisión unificada.

---

## 1. Propósito exacto de cada agente — G0.1

### Principio de dominio único
Cada agente observa exactamente un dominio de datos externos. Un agente no comenta
sobre el dominio de otro agente. Si dos agentes tienen visión sobre el mismo fenómeno
(ej. Finance ve que hay poco cash; Risk ya lo sabe), el agente no duplica la señal —
silencia su output porque el motor central ya lo captura.

### Los 5 agentes y su dominio

| Agente | Dominio | Entity types que observa | Qué NO toca |
|---|---|---|---|
| **Finance Agent** | Estado financiero y flujo de caja | `financial_transaction`, `invoice`, `expense`, `subscription` | Ventas (pipeline), tareas, personas |
| **Sales Agent** | Pipeline comercial y relaciones | `deal`, `contact`, `company`, `pipeline_event`, `customer` | Finanzas (cash), tareas, calendario |
| **Execution Agent** | Progreso operativo de tareas | `task`, `milestone`, `project_item` | Finanzas, ventas, comunicación |
| **Calendar Agent** | Agenda y carga temporal | `calendar_event`, `meeting` | Finanzas, ventas, tareas |
| **Team Agent** | Señales de comunicación y colaboración | `message_signal`, `channel_activity` | Finanzas, ventas, calendario |

### Qué hace cada agente en concreto
Un agente toma un conjunto de `integration_entities` de su dominio, aplica lógica de
agregación y comparación, y produce uno o más `integration_insights` estructurados.

Un agente **no**:
- Habla directamente al founder (no genera texto para la UI — eso es Optimus)
- Toma decisiones (solo informa o propone inputs)
- Lee entidades de dominio ajeno
- Modifica tablas de motor directamente (ver guard en `INTEGRATION_DATA_CONTRACT.md §7`)

---

## 2. Qué decisiones puede influir cada agente — G0.2

### Jerarquía de autoridad (inamovible)

```
Motor central (getNextAction + Optimus)
        ↑
Capa de síntesis (§9 — integra insights de agentes)
        ↑
Agentes especializados (Finance, Sales, Execution, Calendar, Team)
        ↑
integration_entities (datos normalizados)
        ↑
Providers (Stripe, Holded, Slack, ...)
```

Los agentes **influyen** en las entradas de los motores existentes — no las sustituyen.
La única salida ejecutable hacia el founder es `getNextAction()` / Optimus. Los agentes
no tienen canal de comunicación directo con el founder.

### Qué puede influir cada agente

| Agente | Puede influir en | Vía |
|---|---|---|
| Finance Agent | `project_economic_profile.arr_estimado`, `project_economic_profile.runway_months` | Guard de escritura → tablas de motor |
| Finance Agent | `revenue_momentum` input del Probability Engine | Guard de escritura |
| Sales Agent | `revenue_momentum` input del Probability Engine (pipeline) | Guard de escritura |
| Execution Agent | `execution_health` del Phase Engine (futuro v2) | Guard de escritura |
| Calendar Agent | Contexto informativo en `get_optimus_context()` | Solo vía insights, sin escribir tablas de motor |
| Team Agent | Contexto informativo en `get_optimus_context()` | Solo vía insights, sin escribir tablas de motor |

**Calendar Agent y Team Agent** nunca escriben en tablas de motor. Sus insights son
informativos y aparecen como contexto en Optimus, no como inputs de scoring.

---

## 3. Qué decisiones no puede tocar ningún agente — G0.3

Las siguientes decisiones están reservadas al motor central. Ningún agente puede
modificarlas, sobreescribirlas, ni emitir insights que busquen sustituirlas.

| Decisión reservada | Por qué no puede ser de los agentes |
|---|---|
| `getNextAction()` — la próxima acción recomendada al founder | La acción debe tener autoridad única. Si un agente puede proponer alternativas en el mismo nivel, el founder recibe señales contradictorias. |
| `current_phase` — la fase actual del proyecto | Determinado por el Phase Engine con sus thresholds calibrados. Un agente que "opina" sobre la fase crea confusión sobre qué es real. |
| `viability_status` — estado de viabilidad | Determinado por el Viability Engine. Un agente que dice "el proyecto parece viable" basado en pipeline datos externos genera confianza falsa. |
| `optimus_mode` — modo de Optimus (exploración/estándar/estricto) | Derivado del engine state. Un agente no cambia el modo. |
| Evaluación del ciclo (`cycle_evaluation`) | Determinada en `close_strategic_cycle()`. |
| Avance o regresión de fase | Determinado por `run_phase_engine()` con sus hard signals. |

**Regla de implementación:** si al revisar el output de un agente se encuentra que está
calculando alguna de las variables de la tabla anterior, el agente está fuera de contrato
y debe ser corregido antes de integrarse al sistema.

---

## 4. Formato obligatorio de output de agente — G0.4

Todo agente produce `integration_insights` con este schema. Sin excepciones.

```typescript
interface AgentInsight {
  // ── Identidad ─────────────────────────────────────────────────────────────
  id:            string;          // UUID generado por el sistema
  project_id:    string;          // proyecto al que pertenece
  agent_type:    AgentType;       // 'finance' | 'sales' | 'execution' | 'calendar' | 'team'
  insight_type:  string;          // identificador semántico del insight — ver §4.1

  // ── Datos ─────────────────────────────────────────────────────────────────
  signal:        InsightSignal;   // el dato que fundamenta el insight — ver §4.2
  content:       InsightContent;  // descripción estructurada del insight — ver §4.3

  // ── Calidad y vigencia ────────────────────────────────────────────────────
  confidence:    number;          // 0.0–1.0 — ver §5 para thresholds
  generated_at:  string;          // ISO 8601
  expires_at:    string;          // ISO 8601 — cuándo este insight deja de ser válido

  // ── Trazabilidad ──────────────────────────────────────────────────────────
  entity_ids:    string[];        // IDs de integration_entities que fundamentan este insight
  include_in_context: boolean;    // si debe aparecer en get_optimus_context()

  // ── Motor ─────────────────────────────────────────────────────────────────
  motor_write?:  MotorWrite;      // si este insight debe escribir en una tabla de motor — ver §4.4
}
```

### §4.1 — insight_type: catálogo

Cada agente tiene un conjunto fijo de insight_types. No se improvisan.

**Finance Agent:**
- `mrr_trend` — tendencia del MRR (crecimiento, estable, caída)
- `runway_estimate` — estimación de meses de runway con datos reales
- `expense_spike` — pico de gastos inusual en período reciente
- `revenue_concentration` — % del MRR de un solo cliente (riesgo de concentración)
- `cash_flow_signal` — señal de flujo de caja positivo o negativo

**Sales Agent:**
- `pipeline_velocity` — velocidad de movimiento de deals (aceleración o estancamiento)
- `pipeline_value` — valor total del pipeline activo
- `conversion_rate` — tasa de cierre real vs ciclo anterior
- `deal_stagnation` — deals sin movimiento por más de X días
- `customer_churn_signal` — clientes que dejaron de tener actividad

**Execution Agent:**
- `task_completion_rate` — % de tareas completadas en el período
- `overdue_ratio` — proporción de tareas vencidas sobre activas
- `milestone_at_risk` — milestone con fecha próxima y tareas pendientes
- `execution_drop` — caída en completion rate respecto a período anterior

**Calendar Agent:**
- `meeting_load` — carga de reuniones en la semana (alto/normal/bajo)
- `no_focus_time` — días sin bloques de tiempo de trabajo profundo

**Team Agent (I15.81 — diferido, contrato definido para compatibilidad con F19):**
- `communication_drop` — caída en actividad de canal respecto a semana anterior
- `response_lag` — señal de respuestas lentas en canal activo
- `team_overdue_tasks` — payload incluye `{ overdue_count: number, blocked_members: string[] }`
  Consumido por `buildNextAction()` (F19.A.2): si `overdue_count >= 3` → CTA prioritario.
- `collaboration_gap` — miembros sin actividad en 7+ días (payload: `{ silent_members: string[], days_silent: number }`)

### §4.2 — InsightSignal

```typescript
interface InsightSignal {
  metric_name:    string;   // qué se mide ('mrr_monthly', 'pipeline_value', ...)
  current_value:  number | string;
  previous_value?: number | string;  // para tendencias
  delta?:         number;   // cambio absoluto
  delta_pct?:     number;   // cambio porcentual
  period_days:    number;   // ventana de tiempo analizada
  data_points:    number;   // número de entidades usadas para calcular
}
```

### §4.3 — InsightContent

```typescript
interface InsightContent {
  summary:         string;   // 1 frase. Sin jerga de motor.
  implication:     string;   // por qué importa para el proyecto. Sin hipérboles.
  severity:        'info' | 'attention' | 'warning' | 'critical';
  action_hint?:    string;   // sugerencia de acción (nunca obligatoria). Omitir si no es obvia.
}
```

**Reglas de contenido:**
- `summary` en tiempo presente, factual: "El MRR cayó 12% este mes." No: "El proyecto está en crisis."
- `implication` en términos de impacto en el proyecto, no en el agente: "Reduce el runway estimado en ~3 semanas."
- `severity = 'critical'` solo cuando hay riesgo real y demostrado — no como énfasis
- `action_hint` es opcional. Si el insight no tiene una acción obvia, mejor omitirlo que inventarla

### §4.4 — MotorWrite (opcional)

Cuando un insight debe escribir en una tabla de motor (solo Finance y Sales Agents):

```typescript
interface MotorWrite {
  target_table:   string;   // 'project_economic_profile' | 'key_metrics' | ...
  target_column:  string;
  value:          number | string;
  condition:      'confidence_gte_0.8';  // constante — el guard lo verifica
}
```

Si `motor_write` está presente, el sistema lo pasa por la función `write_integration_to_engine_table()`
definida en `INTEGRATION_DATA_CONTRACT.md §7`. El agente no ejecuta el write directamente.

---

## 5. Niveles de confidence y umbrales mínimos para emitir insight — G0.5

### Umbrales mínimos para generar un insight

| Condición | Umbral | Si no se cumple |
|---|---|---|
| `data_points` mínimos por insight_type | ver tabla abajo | No emitir — registrar `no_data` en log |
| `confidence` del insight | `>= 0.5` | No emitir |
| Datos de las entidades de base | `confidence >= 0.7` en la mayoría (> 60%) | Emitir con `confidence` reducido |

### `data_points` mínimos por insight_type

| Insight type | Mínimo | Razón |
|---|---|---|
| `mrr_trend` | 4 transacciones en 30d | Tendencia requiere al menos 2 períodos |
| `runway_estimate` | 3 meses de datos de gastos | Proyección sin base histórica es ficción |
| `pipeline_velocity` | 3 deals con movimiento en 30d | 1 deal no es velocidad |
| `conversion_rate` | 5 deals cerrados (won o lost) | Tasa estadísticamente significativa |
| `task_completion_rate` | 5 tareas en el período | Proxy válido solo con volumen mínimo |
| `communication_drop` | 7 días de historial | Comparación requiere baseline |
| `meeting_load` | 3 eventos en la semana | 1 reunión no es carga |

> **Si no hay datos suficientes, el agente emite silencio — no un insight de baja confianza.**
> Un insight con `data_points = 1` no informa — ruido. Ver §12.

### Cálculo de confidence del insight

El confidence del insight hereda del confidence de las entidades que lo fundamentan:
```
insight_confidence = AVG(entity.confidence for entity in entity_ids) × completeness_factor

completeness_factor = MIN(1.0, data_points / min_data_points)
```
Si hay 2 transacciones para `mrr_trend` (mínimo 4): `completeness_factor = 0.5` → insight no emite.
Si hay 6 transacciones: `completeness_factor = 1.0` → confidence hereda del avg de entidades.

---

## 6. Cuándo un agente informa vs cuándo recomienda — G0.6

### Distinción fundamental

| Tipo | Qué es | Formato |
|---|---|---|
| **Informa** | Presenta un hecho derivado de datos | `summary` + `implication` sin `action_hint` |
| **Recomienda** | Sugiere una acción posible basada en el hecho | `summary` + `implication` + `action_hint` |

### Cuándo un agente puede recomendar (condiciones acumulativas)
1. El insight tiene `confidence >= 0.8`
2. `data_points >= min_data_points × 1.5` (margen de seguridad)
3. La acción sugerida está dentro del dominio del agente (Finance Agent no sugiere "hablar con el equipo")
4. La acción no contradice el `getNextAction()` actual (si hay contradicción, solo informa)

### Lo que nunca hace un agente, aunque tenga confianza alta
- Dar una orden ("Debes hacer X")
- Evaluar la decisión del founder ("Eso fue un error")
- Hablar sobre otro agente ("El Sales Agent también dice...")
- Atribuir problemas a personas del equipo

---

## 7. Cómo escalan al motor central sin sobreescribir getNextAction() — G0.7

### Problema
Un agente con un insight de severity='critical' podría querer cambiar la próxima acción
recomendada. Pero `getNextAction()` es la autoridad única (G0.3). ¿Cómo conciliar esto?

### Solución: escalada como contexto, no como override

Un agente nunca modifica `getNextAction()`. En cambio, cuando tiene un insight crítico:
1. Lo marca `include_in_context = true` con `severity = 'critical'`
2. El insight aparece en `get_optimus_context()` en el campo `integration_insights`
3. Optimus recibe el contexto ampliado y **puede** modular su respuesta basándose en él
4. `getNextAction()` recibe el insight como señal adicional en las reglas de prioridad (v2)

En v1: los insights de agentes son contexto adicional en Optimus. No modifican las reglas
de `getNextAction()`. En v2 (cuando haya datos suficientes para calibrar): algunos insight_types
de alta confianza pueden elevar la prioridad de ciertos `next_action_types`.

### Límite en el context packet
`get_optimus_context()` incluye máximo **3 insights de agentes** por llamada, ordenados por:
1. `severity` (critical > warning > attention > info)
2. `confidence` (mayor primero)
3. `generated_at` (más reciente primero)

Si hay más de 3 insights elegibles, los más bajos en esta jerarquía se omiten del context packet
(pero siguen existiendo en `integration_insights` para la UI y para consultas directas).

---

## 8. Reglas anti-contradicción entre agentes — G0.8

### Qué es una contradicción
Dos insights son contradictorios si llevan a conclusiones opuestas sobre el mismo aspecto del proyecto
y el founder no puede actuar en ambos sentidos simultáneamente.

Ejemplos de contradicción:
- Finance Agent: `cash_flow_signal: positive` + Sales Agent: `pipeline_velocity: stagnant` → no son contradictorios (dominios distintos, ambos pueden ser ciertos)
- Finance Agent insight dice "runway > 6 meses" + Viability Engine dice `viability_status = critical` → **contradicción** — no puede aparecer en el mismo context packet

Ejemplos que parecen contradictorios pero no lo son:
- `mrr_trend: falling` + `pipeline_velocity: accelerating` → coexisten, el pipeline puede crecer mientras el MRR cae si hay churn

### Regla de resolución
Cuando existe contradicción entre un insight de agente y el estado actual de un motor central:
**el motor central tiene razón. El insight de agente se suprime del context packet.**

El insight no se borra de `integration_insights` — sigue disponible para auditoría y UI.
Pero `include_in_context` se pone a `false` hasta que la contradicción se resuelva.

### Contradicciones entre agentes del mismo nivel
Si dos agentes emiten insights sobre el mismo dominio (solo posible si ambos observan
entidades con overlap — raro pero posible):
- El insight de mayor `confidence` prevalece
- Si confidence igual: el más reciente prevalece
- Ambos se mantienen en `integration_insights` pero solo el prevaleciente va al context packet

### Verificación en el ciclo de síntesis (§9)
La capa de síntesis ejecuta este check automáticamente. No es responsabilidad de cada agente
detectar contradicciones — el agente solo genera su insight. La síntesis filtra.

---

## 9. Síntesis final única — G0.9

Este es el mecanismo central que convierte 5 agentes en 1 decisión.

### El problema sin síntesis
Sin síntesis: el founder recibe 5 streams de información, debe integrarlos mentalmente,
y nadie es responsable de la coherencia del conjunto. Esto es exactamente lo que un sistema
de agentes no debería hacer.

### Diseño de la capa de síntesis

La síntesis **no es un sexto agente**. Es una función determinista que:
1. Toma todos los insights activos (`expires_at > NOW()` y `include_in_context = true`)
2. Aplica las reglas de contradicción (§8) → filtra los suprimidos
3. Aplica el cap de 3 insights (§7) → selecciona por prioridad
4. Construye el `synthesis_output` que entra en `get_optimus_context()`
5. **No genera texto** — solo selecciona y estructura qué insights van al contexto

### Schema de synthesis_output

```typescript
interface SynthesisOutput {
  primary_insight?:      AgentInsight;    // el más crítico y confiable
  supporting_insights:   AgentInsight[];  // máximo 2 adicionales
  suppressed_count:      number;          // cuántos insights se omitieron (para transparencia)
  synthesis_confidence:  number;          // AVG de confidence de los insights seleccionados
  domains_covered:       AgentType[];     // qué agentes contribuyeron

  // Metadatos para Optimus
  has_engine_contradiction: boolean;      // si algún insight contradijo el motor central
  dominant_signal:          string;       // insight_type del primary_insight
}
```

### Reglas de selección del primary_insight

```
1. Si hay algún insight con severity='critical' y confidence >= 0.8 → es el primary
2. Si hay múltiples con severity='critical':
   a. Finance Agent tiene prioridad sobre Sales Agent
   b. Sales Agent tiene prioridad sobre Execution Agent
   c. Execution Agent tiene prioridad sobre Team Agent
   d. Team Agent tiene prioridad sobre Calendar Agent
3. Si no hay 'critical': mismo criterio con severity='warning'
4. Si no hay 'warning': el de mayor confidence independientemente del agente
5. Si no hay ningún insight elegible: primary_insight = null
```

### Prioridad entre agentes (para síntesis y resolución de conflictos)

```
Finance > Sales > Execution > Team > Calendar
```

**Justificación:**
- Finance: los datos financieros tienen el impacto más directo en viabilidad del proyecto
- Sales: el pipeline es el segundo indicador más predictivo
- Execution: las tareas reflejan capacidad operativa, crítica pero más granular
- Team: señales de colaboración son indicativas pero no directamente accionables
- Calendar: contexto útil pero nunca urgente

Esta prioridad aplica **solo cuando hay ambigüedad** en la síntesis. No significa que
Calendar Agent sea irrelevante — significa que si Finance y Calendar tienen insights
de igual severidad y confidence, Finance va al context packet primero.

> **Nota de diseño v1 (2026-03-15):** Esta prioridad fija es una simplificación consciente.
> Es correcta para la mayoría de proyectos en Fase 1–2, donde el cuello suele ser financiero.
> Sin embargo, no es una verdad ontológica: hay proyectos donde ventas es el cuello real
> y las finanzas solo reflejan el síntoma con retraso. En v2, cuando haya datos suficientes
> de outcomes de agentes (si el founder actuó según el insight del agente primario y el
> resultado fue positivo), la prioridad debería poder ajustarse dinámicamente por proyecto
> o por fase. Hasta entonces, la prioridad fija es preferible a no tener ninguna.
> Registrado para revisión cuando haya ≥ 30 proyectos con integraciones activas.

### Cuándo la síntesis produce output vacío
Si no hay ningún insight que cumpla los umbrales → `synthesis_output.primary_insight = null`,
`supporting_insights = []`. `get_optimus_context()` lleva el campo vacío. Optimus no menciona
integraciones al founder. **El silencio correcto es preferible al ruido.**

---

## 10. Límites anti-ruido y anti-Goodhart — G0.10

### Anti-ruido

**Problema:** sin límites, un agente puede generar el mismo insight repetidamente cuando
nada ha cambiado. El founder recibe "el MRR cayó" cada día aunque ya lo sabe.

**Reglas:**

| Condición | Regla |
|---|---|
| Mismo insight_type para el mismo proyecto en ventana reciente | No re-emitir si el insight anterior tiene `expires_at > NOW()` |
| Insight de `severity='info'` | Ventana mínima entre emisiones: 7 días |
| Insight de `severity='attention'` | Ventana mínima: 3 días |
| Insight de `severity='warning'` | Ventana mínima: 24h |
| Insight de `severity='critical'` | Sin ventana — emitir cuando la condición exista |

**Re-emisión permitida cuando:** el valor del signal cambia en ≥ 15% respecto al insight anterior
del mismo tipo. Un `mrr_trend` puede re-emitirse si el MRR cambió significativamente desde
la última vez, aunque la ventana no haya expirado.

### `expires_at` — duración por insight_type

El valor de `expires_at` se calcula en el momento de emisión: `generated_at + duración`.

| Insight type | Duración | Severity base |
|---|---|---|
| `mrr_trend` | 48h | warning |
| `runway_estimate` | 72h | warning |
| `expense_spike` | 24h | warning |
| `revenue_concentration` | 7d | attention |
| `cash_flow_signal` | 24h | warning |
| `pipeline_velocity` | 48h | attention |
| `pipeline_value` | 48h | info |
| `conversion_rate` | 7d | info |
| `deal_stagnation` | 24h | attention |
| `customer_churn_signal` | 24h | warning |
| `task_completion_rate` | 48h | info |
| `overdue_ratio` | 24h | attention |
| `milestone_at_risk` | 24h | warning |
| `execution_drop` | 48h | warning |
| `meeting_load` | 48h | info |
| `no_focus_time` | 24h | attention |
| `communication_drop` | 48h | attention |
| `response_lag` | 24h | attention |

**Nota:** `severity='critical'` nunca tiene `expires_at` — permanece activo hasta que la condición desaparece.
La duración base puede reducirse si `confidence >= 0.9` (insight de alta confianza caduca antes para
forzar re-validación con datos más recientes).

### Anti-Goodhart (mismo riesgo identificado en FASE 8 §G4.7)

**Problema:** si los insights de agentes se usan como indicadores del "éxito" del founder,
el founder puede optimizar para generar insights positivos sin mejorar realmente.

**Ejemplo:** un founder puede conectar Stripe y subir sus transacciones artificialmente para
que el Finance Agent emita `mrr_trend: growing`. Si el Probability Engine sube por eso,
el sistema ha sido engañado.

**Controles:**

1. **No exponer el score de los insights al founder.** El founder ve el insight (qué dice),
   no el confidence ni el impacto en el engine score.

2. **Correlación cruzada en síntesis:** si un agente emite insights positivos pero los motores
   centrales (Viability, Risk) no se mueven en la dirección esperada, la síntesis puede
   reducir `synthesis_confidence` y marcar la discrepancia para auditoría.

3. **Signal integrity check** (heredado de G4.7 — `OPTIMUS_CHARACTER.md §4`):
   Si `phase_score ↑ ≥ 15pts` en 30d pero `mrr unchanged` y `integration_insights positivos`
   → `signal_integrity = false` en el context packet. Optimus lo menciona.

4. **Los insights de agentes no determinan la fase.** Solo el Phase Engine determina la fase.
   Un agente que ve pipeline creciendo no puede avanzar la fase.

---

## 11. Trazabilidad del insight al dato origen — G0.11

### Cadena de trazabilidad completa

```
AgentInsight.entity_ids[]
    ↓ join
integration_entities.id
    ↓ join (connection_id)
integration_connections.id  →  integration_connections.provider
    ↓ join (sync_run_id)
integration_sync_runs.id    →  integration_sync_runs.started_at
```

Dado cualquier insight, es posible responder:
- ¿Qué entidades fundamentan este insight? → `entity_ids`
- ¿De qué provider vinieron esas entidades? → `integration_connections.provider`
- ¿En qué sync llegaron? → `integration_sync_runs`
- ¿Cuándo ocurrieron los hechos en el provider? → `integration_entities.occurred_at`

### Por qué es obligatorio
Si un agente emite "El MRR cayó 20%" y el founder pregunta "¿basado en qué?", el sistema
debe poder responder con datos reales: "Basado en 47 transacciones de Stripe del período
2026-03-01 al 2026-03-15, sincronizadas el 2026-03-15 a las 08:00 UTC."

Sin esta trazabilidad, los agentes son cajas negras. Una caja negra que afecta decisiones
de negocio es inaceptable.

### Implementación práctica
Al generar un insight, el agente debe incluir en `entity_ids` todos los IDs de las entidades
que usó en el cálculo. No solo las más relevantes — todas. El sistema puede comprimir
el historial en entidades de tipo 'aggregate' cuando el volumen sea alto (>100 entidades
por insight), pero la referencia al sync_run que las trajo siempre debe conservarse.

---

## 12. Política de "no insight" cuando no hay base de datos suficiente — G0.12

### La regla fundamental
**Un agente que no tiene datos suficientes emite silencio, no un insight de baja confianza.**

Un insight inventado con datos insuficientes es más dañino que no tener insight:
- Puede generar acción incorrecta
- Erosiona la confianza en el sistema cuando el founder verifica y los datos no cuadran
- Puede modificar tablas de motor con basura

### Condiciones para emitir silencio

| Condición | Acción |
|---|---|
| `data_points < min_data_points` para el insight_type | Silencio. Registrar `no_data` en log interno del agente. |
| Más del 40% de las entidades de base tienen `confidence < 0.7` | Silencio. |
| Todas las entidades disponibles están en estado `stale_external` | Silencio. |
| El agente no tiene ninguna `integration_entities` de su dominio con `is_stale = false` | Silencio completo del agente para ese proyecto. |

### Qué ve el founder cuando un agente está en silencio
Nada específico del agente. La UI de integraciones puede mostrar "Sin datos suficientes
para análisis" en el panel del agente, pero Optimus no menciona la ausencia de datos.
La ausencia de un insight de agente no es una señal negativa sobre el proyecto.

### Qué registra el sistema cuando hay silencio
El agente debe registrar en su log interno:
```json
{
  "agent_type": "finance",
  "project_id": "...",
  "attempted_insight_type": "mrr_trend",
  "reason": "insufficient_data",
  "data_points_available": 2,
  "data_points_required": 4,
  "timestamp": "2026-03-15T10:00:00Z"
}
```
Esto permite diagnosticar por qué un agente no está produciendo insights sin exponer
la ausencia de datos al founder.

---

## 13. Resumen de invariantes (requisitos de aceptación)

Antes de integrar cualquier agente al sistema, debe cumplir todos estos invariantes:

| # | Invariante | Verificación |
|---|---|---|
| 1 | Solo lee `integration_entities` de su dominio | Auditar imports y queries del agente |
| 2 | No genera texto para la UI | El agente no produce strings renderizables directamente |
| 3 | No toma decisiones — solo informa o propone inputs | Revisar `action_hint` — nunca imperativo |
| 4 | Output siempre cumple `AgentInsight` schema | Test de schema en CI |
| 5 | Nunca escribe directamente en tablas de motor | Solo a través de `write_integration_to_engine_table()` |
| 6 | Emite silencio si `data_points < min_data_points` | Test con dataset vacío |
| 7 | `entity_ids` incluye TODOS los datos usados en el cálculo | Test de trazabilidad |
| 8 | Respeta ventanas anti-ruido | Test de re-emisión dentro de ventana |
| 9 | No genera insights sobre dominios ajenos | Auditar `insight_type` contra catálogo de su agente |
| 10 | No contradice el motor central | Test con proyectos en estados extremos (viability=critical + finance positivo) |

---

> **Próximo documento:** `INTEGRATION_ARCHITECTURE.md`
> — diagrama de dependencias entre todos los componentes de FASE 15:
> providers → normalizers → integration_entities → agents → synthesis → motores → Optimus.
