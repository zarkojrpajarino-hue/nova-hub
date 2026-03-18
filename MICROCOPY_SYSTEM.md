# MICROCOPY SYSTEM — Nova Hub

> Vocabulario oficial del producto para todos los estados del motor.
> Fuente canónica para UI copy, Optimus (T9.6), playbooks (T9.2–T9.3) y edge cases.
> Versión: v1.0 · Fecha: 2026-03-12
>
> **Alcance:** estados del engine. No cubre onboarding, emails, errores de sistema, ni marketing.
> **Segundo pase pendiente:** lista completa de estados (captura el ~20% restante tras v1).

---

## 3 Reglas (aplican a todo copy de este documento)

**R1 — Estado → implicación**
No solo etiqueta técnica. Cada estado responde implícitamente: ¿y esto qué significa?
- ❌ `Risk: High`
- ✅ `High operational risk — progress may stall`

**R2 — Sin jerga interna del sistema**
El usuario no ve: `phase_score`, `coverage_level`, `structural_block`, `traction_block`, `probability_score`.
El microcopy traduce esos términos.
- ❌ `demand_coverage = none`
- ✅ `No evidence of demand yet`

**R3 — Tono proporcional al estado**
Exploración → neutro. Estándar → directo. Estricto → urgente. No sonar urgente cuando no hay urgencia real.

---

## Cómo usar este documento

Cada entrada tiene:

```
STATE: [state_id]
Trigger: [campo del engine + condición]
Microcopy: "[copy visible al usuario]"
Notes: [contexto para implementadores — nunca visible al usuario]
```

`state_id` es la referencia canónica. Los componentes deben usar el `state_id`, no inventar copy inline.

---

## 1. Phase — Estado de Fase

### 1.1 Etiquetas de fase

```
STATE: phase_label_1
Trigger: current_phase = 1
Microcopy: "Phase 1 — Discovery"
Notes: Label compacto. Usar en badges, EngineIndicators, PhaseProgressBar.

STATE: phase_label_2
Trigger: current_phase = 2
Microcopy: "Phase 2 — Validation"

STATE: phase_label_3
Trigger: current_phase = 3
Microcopy: "Phase 3 — Operations"

STATE: phase_label_4
Trigger: current_phase = 4
Microcopy: "Phase 4 — Scale"
```

### 1.2 Descripción de fase (una línea)

```
STATE: phase_desc_1
Trigger: current_phase = 1
Microcopy: "Finding the right problem for the right customer"
Notes: Subtexto bajo el label. Orienta sin comprometer.

STATE: phase_desc_2
Trigger: current_phase = 2
Microcopy: "Testing whether the solution creates real value"

STATE: phase_desc_3
Trigger: current_phase = 3
Microcopy: "Building repeatable operations around what works"

STATE: phase_desc_4
Trigger: current_phase = 4
Microcopy: "Growing what's already proven to work"
```

### 1.3 Progreso de fase

```
STATE: phase_progress_normal
Trigger: phase_status = 'active' AND weeks_in_current_phase <= 6
Microcopy: "Building phase evidence"
Notes: Estado por defecto. Neutro. No añade urgencia ni entusiasmo.

STATE: phase_progress_stagnant
Trigger: weeks_in_current_phase > 6 AND phase_score delta < 5 pts últimas 2 semanas
Microcopy: "No progress in {N} weeks — what's blocking the next step?"
Notes: N = weeks_in_current_phase. No culpabiliza. Señala el problema.

STATE: phase_score_critical
Trigger: phase_status = 'critical'
Microcopy: "Phase score below threshold — key signals are missing"
Notes: Diferente de stagnant. Este es score bajo, no tiempo sin avance.

STATE: phase_hard_signal_missing
Trigger: hard_signal_met = false AND current_phase >= 2
Microcopy: "Key milestone not yet reached"
Notes: No especifica cuál es el milestone aquí — eso es trabajo de Next Action.

STATE: phase_hard_signal_met
Trigger: hard_signal_met = true
Microcopy: "Key milestone reached"
Notes: Señal positiva. Breve. No excesivo.
```

### 1.4 Transiciones de fase

```
STATE: phase_advanced
Trigger: current_phase > previous phase (desde project_phase_history)
Microcopy: "Advanced to Phase {N}"
Sub-copy: "{phase_desc_N}"
Notes: Usado en PhaseTransitionToast. N = nueva fase. Celebración breve.

STATE: phase_regressed_strong
Trigger: phase_drop = true (fase bajó de N a N-1)
Microcopy: "Project returned to Phase {N}"
Sub-copy: "Something changed since your last milestone. Review what shifted."
Notes: No punitivo. Factual. CTA → dashboard. N = fase actual (la más baja).

STATE: phase_regressed_soft
Trigger: score_drop >= 15 pts (misma fase, score cayó)
Microcopy: "Phase score dropped"
Sub-copy: "Recent signals are weaker. Check what changed."
Notes: Menos alarmante que phase_regressed_strong. Misma fase, score peor.
```

---

## 2. Viability — Viabilidad

```
STATE: viability_healthy
Trigger: viability_status = 'healthy'
Microcopy: "Business model sustainable"
Notes: Estado positivo por defecto. Solo mostrar si hubo alerta previa (evitar ruido).

STATE: viability_monitoring
Trigger: viability_status = 'monitoring'
Microcopy: "Under watch — some indicators need attention"
Notes: Tono ámbar. No urgente, pero no ignorable.

STATE: viability_stagnation
Trigger: viability_status = 'stagnation'
Microcopy: "Growth stalled — business isn't progressing as expected"
Notes: Más específico que monitoring. Implica que algo está parado, no solo en riesgo.

STATE: viability_critical
Trigger: viability_status = 'critical'
Microcopy: "Viability at risk — immediate action required"
Notes: Rojo. No suavizar. Optimus usa modo Estricto aquí. Banner no dismissible.

STATE: viability_resolved
Trigger: viability_status vuelve a 'healthy' después de monitoring/critical
Microcopy: "Back on track — viability restored"
Notes: Solo mostrar si hubo alerta previa. Fix G9.7 garantiza esto.

STATE: cash_flow_alert
Trigger: t2_cash_flow_active = true
Microcopy: "Cash flow issue active — financial pressure on the business"
Notes: Puede coexistir con viability_critical. Ambos pueden mostrarse simultáneamente.
```

---

## 3. Risk — Riesgo

```
STATE: risk_low
Trigger: risk_level = 'low'
Microcopy: "Low risk — stable conditions"
Notes: Positivo. Breve.

STATE: risk_medium
Trigger: risk_level = 'medium'
Microcopy: "Moderate risk — monitor key areas"
Notes: Ámbar. No alarmante, pero no ignorable.

STATE: risk_high
Trigger: risk_level = 'high'
Microcopy: "High operational risk — progress may stall"
Notes: Rojo. Directo. Implica acción sin especificar cuál (eso es Next Action).

STATE: risk_critical
Trigger: risk_level = 'critical'
Microcopy: "Critical risk — business continuity at stake"
Notes: Severidad máxima. No suavizar. Optimus usa modo Estricto.

STATE: risk_insufficient_data
Trigger: risk_status = 'insufficient_data'
Microcopy: "Not enough data to assess risk yet"
Notes: Neutro. Normal en proyectos nuevos. No alarmante.

STATE: risk_active
Trigger: risk_status = 'active' (riesgo calculado y presente)
Microcopy: [usar el label del nivel — risk_low / risk_medium / risk_high / risk_critical]
Notes: risk_status='active' solo indica que el cálculo existe. El nivel da el copy.
```

---

## 4. Probability — Probabilidad

```
STATE: probability_inactive
Trigger: probability_status = 'inactive'
Microcopy: "Not enough activity to calculate probability"
Notes: Default en proyectos nuevos. No mostrar número. No alarmante.

STATE: probability_low
Trigger: probability_score < 30
Microcopy: "Weak signals — confidence in this direction is low"
Notes: No dice que el proyecto falle. Dice que las señales son débiles.

STATE: probability_medium
Trigger: probability_score 30–59
Microcopy: "Some positive signals — keep building evidence"
Notes: Neutro-positivo. No emocionante, no alarmante.

STATE: probability_high
Trigger: probability_score >= 60
Microcopy: "Strong signals — multiple areas pointing in the right direction"
Notes: Positivo. Tono neutro (no "¡genial!").

STATE: probability_critical
Trigger: probability_score < 20
Microcopy: "Very weak signals — this direction needs significant reassessment"
Notes: Más directo que probability_low. Implica repensar, no solo "seguir".

STATE: probability_dropping
Trigger: probability_trend = 'declining'
Microcopy: "Probability declining — signals have weakened recently"
Notes: Tendencia, no nivel absoluto. Algo cambió.

STATE: probability_growing
Trigger: probability_trend = 'growing'
Microcopy: "Probability improving — positive momentum"
Notes: Breve señal positiva.

STATE: probability_stable_healthy
Trigger: probability_trend = 'stable' AND probability_score >= 40
Microcopy: [sin copy — estado normal, no añadir ruido]
Notes: Estable y aceptable = sin noticias = buenas noticias.

STATE: probability_stable_low
Trigger: probability_trend = 'stable' AND probability_score < 30
Microcopy: "Signals aren't improving — something may need to change"
Notes: Estable-pero-bajo es señal diferente a declining. Menos urgente.

STATE: probability_insufficient_history
Trigger: COUNT(project_probability_history) < 2 en últimos 14 días
Microcopy: "Not enough history to show a trend yet"
Notes: Para el indicador de tendencia. Diferente de inactive.
```

---

## 5. Coverage — Cobertura

### 5.1 Demand

```
STATE: demand_none
Trigger: coverage.demand = 'none'
Microcopy: "No evidence of demand yet"
Notes: Normal en Fase 1. Sin tono de urgencia.

STATE: demand_basic
Trigger: coverage.demand = 'basic'
Microcopy: "Early demand signals — not yet validated"
Notes: Progreso, pero no confirmación.

STATE: demand_validated
Trigger: coverage.demand = 'validated'
Microcopy: "Demand confirmed — customers have engaged"
Notes: Positivo. "Engaged" es intencionalmente amplio (cubre entrevistas, pagos, pre-orders).

STATE: demand_strong
Trigger: coverage.demand = 'strong'
Microcopy: "Strong demand — consistent customer interest"
Notes: Nivel más alto. Tono neutro (no "increíble").
```

### 5.2 Delivery

```
STATE: delivery_none
Trigger: coverage.delivery = 'none'
Microcopy: "No delivery capability yet"
Notes: Normal en fases tempranas. Sin urgencia en Fase 1.

STATE: delivery_basic
Trigger: coverage.delivery = 'basic'
Microcopy: "Basic delivery in place — not yet tested at scale"
Notes: Indicador de progreso.

STATE: delivery_working
Trigger: coverage.delivery = 'working' o equivalente superior
Microcopy: "Delivery working — product reaching customers"
Notes: Positivo. Breve.
```

### 5.3 Cash

```
STATE: cash_not_tracked
Trigger: coverage.cash = 'none'
Microcopy: "Cash management not yet tracked"
Notes: No es alarma. Solo datos incompletos. Neutro.

STATE: cash_tracked_healthy
Trigger: coverage.cash activo, sin t2_cash_flow_active
Microcopy: "Cash tracked — no active issues"
Notes: Estado positivo. Breve.

STATE: cash_active_alert
Trigger: t2_cash_flow_active = true
Microcopy: "Cash flow issue detected — business under financial pressure"
Notes: Urgente. Diferente de cash_not_tracked. Ver también viability_critical.
```

---

## 6. Empty States del Engine

```
STATE: engine_no_data
Trigger: proyecto sin ningún dato de engine (recién creado, engines no han corrido)
Microcopy: "Engine hasn't run yet — add your first evidence to start"
Notes: No es un error. Normal para proyectos nuevos. CTA → primer OBV.

STATE: engine_no_phase
Trigger: project_phase_state row no existe
Microcopy: "Phase not calculated yet"
Notes: Debe ser raro (trigger lo crea). Solo para fallback.

STATE: engine_no_probability
Trigger: probability_status = 'inactive'
Microcopy: "Probability not calculated yet — add metrics to unlock this"
Notes: Añade hint de CTA. Diferente del label probability_inactive (que es solo descriptivo).

STATE: engine_no_risk
Trigger: risk_status = 'insufficient_data'
Microcopy: "Risk can't be assessed yet — not enough data"
Notes: Neutro. Es un problema de inputs, no un riesgo en sí mismo.

STATE: engine_no_viability
Trigger: viability_state row no existe
Microcopy: "Viability not assessed yet"
Notes: Fallback. Normal en Fase 1 antes del primer cron.
```

---

## 7. Surface States de Optimus

*Estados que controlan qué muestra el bloque Optimus — no el contenido del análisis (eso es T9.6).*

```
STATE: optimus_normal
Trigger: context packet disponible con señales suficientes
Microcopy: [renderizar objeto completo — primary + alternative si existe]
Notes: Sin label de "Optimus" en la UI necesariamente. Solo renderizar el contenido.

STATE: optimus_no_data
Trigger: current_phase IS NULL o proyecto sin historial de engine
Microcopy: "Not enough signals yet to analyze. Start with the recommended next step."
Notes: Fallback. No ocultar Next Action. Dejarla sola.

STATE: optimus_error
Trigger: get_optimus_context() falla o devuelve vacío
Microcopy: [fallback silencioso — mostrar solo Next Action, sin label de error]
Notes: No exponer el error al usuario. Next Action sigue siendo útil.
```

### Calificadores de confidence (prefijos, no títulos)

```
STATE: optimus_confidence_high
Trigger: confidence = 'high' en la respuesta
Microcopy: [sin calificador — afirmar el análisis directamente]
Notes: Alta confianza = sin hedging.

STATE: optimus_confidence_medium
Trigger: confidence = 'medium'
Microcopy: Prefijo → "Based on current signals, ..."
Notes: Hedge ligero. No socavar la recomendación.

STATE: optimus_confidence_low
Trigger: confidence = 'low'
Microcopy: Prefijo → "With limited data, the best current read is ..."
Notes: Explícito sobre la incertidumbre. Regla de OPTIMUS_CHARACTER.md §5.
```

---

## 8. Block Surface States

*Cómo aparecen los bloques en UI si se implementa un indicador visible. Optimus usa el análisis del bloque, no este copy directamente.*

```
STATE: clarity_block_indicator
Trigger: 'clarity_block' in active_blocks
Microcopy: "Problem not clear enough to execute yet"
Notes: Para badge/indicador si se implementa. Modo Exploración.

STATE: traction_block_indicator
Trigger: 'traction_block' in active_blocks
Microcopy: "No validated acquisition path yet"
Notes: Para badge/indicador. Modo Estándar típicamente.

STATE: structural_block_indicator
Trigger: 'structural_block' in active_blocks
Microcopy: "Operational bottleneck active"
Notes: Para badge/indicador. Modo Estricto típicamente.

STATE: no_active_blocks
Trigger: active_blocks = []
Microcopy: [sin indicador — estado normal, no añadir ruido]
Notes: La ausencia de bloques no necesita copy.
```

---

## 9. Stagnation Signals

*Estados derivados de combinación de señales — no tienen campo único en el engine.*

```
STATE: phase_duration_long
Trigger: weeks_in_current_phase > 8 (sin avance en phase_score)
Microcopy: "In Phase {N} for {W} weeks — progress has slowed"
Notes: W = weeks_in_current_phase. Más suave que phase_stagnant. Para hint en PhaseHorizonHint.

STATE: probability_flat_long
Trigger: probability_trend = 'stable' AND probability_score < 40 AND weeks > 4
Microcopy: "Signals haven't moved in weeks — something may need to change"
Notes: Combinación de tendencia + nivel + tiempo. Más directo que probability_stable_low.

STATE: no_recent_decisions
Trigger: recent_decisions (28d) = [] o muy pocas entradas
Microcopy: [solo disponible para Optimus — no mostrar en UI directamente]
Notes: Optimus puede mencionar "no recent strategic decisions" como contexto.
```

---

## 10. Mensajes de sistema (breves)

*Copy corto para labels, tooltips y estados de carga. Sin implicación narrativa.*

```
STATE: loading_engine
Trigger: engine data loading
Microcopy: "Calculating..."
Notes: Usar en spinners de EngineIndicators.

STATE: engine_last_updated
Trigger: mostrar cuándo corrió el engine por última vez
Microcopy: "Updated {relative_time}"
Notes: "Updated 2 hours ago", "Updated just now". Relativo, no timestamp absoluto.

STATE: data_incomplete_hint
Trigger: inputs_available < 3 en risk o probability
Microcopy: "{N}/5 signals available"
Notes: Para el hint de confianza en RiskBreakdown / ProbabilityBreakdown. N = inputs_available.
```

---

## Índice de state_ids

| state_id | Dominio | Trigger resumido |
|----------|---------|-----------------|
| phase_label_1–4 | Phase | current_phase = N |
| phase_desc_1–4 | Phase | current_phase = N |
| phase_progress_normal | Phase | active, ≤6 weeks |
| phase_progress_stagnant | Phase | >6 weeks sin avance |
| phase_score_critical | Phase | phase_status = 'critical' |
| phase_hard_signal_missing | Phase | hard_signal_met = false, phase ≥2 |
| phase_hard_signal_met | Phase | hard_signal_met = true |
| phase_advanced | Phase | fase subió |
| phase_regressed_strong | Phase | fase bajó (drop) |
| phase_regressed_soft | Phase | score cayó ≥15 pts |
| viability_healthy | Viability | status = 'healthy' |
| viability_monitoring | Viability | status = 'monitoring' |
| viability_stagnation | Viability | status = 'stagnation' |
| viability_critical | Viability | status = 'critical' |
| viability_resolved | Viability | vuelta a healthy tras alerta |
| cash_flow_alert | Viability | t2_cash_flow_active = true |
| risk_low / medium / high / critical | Risk | risk_level = level |
| risk_insufficient_data | Risk | risk_status = 'insufficient_data' |
| probability_inactive | Probability | status = 'inactive' |
| probability_low / medium / high / critical | Probability | score ranges |
| probability_dropping / growing | Probability | trend |
| probability_stable_healthy / stable_low | Probability | trend + score |
| probability_insufficient_history | Probability | <2 filas en 14d |
| demand_none / basic / validated / strong | Coverage | coverage.demand level |
| delivery_none / basic / working | Coverage | coverage.delivery level |
| cash_not_tracked / healthy / active_alert | Coverage | coverage.cash + t2 |
| engine_no_data / no_phase / no_probability / no_risk / no_viability | Empty | filas faltantes |
| optimus_normal / no_data / error | Optimus | disponibilidad del packet |
| optimus_confidence_high / medium / low | Optimus | confidence field |
| clarity_block_indicator | Blocks | active_blocks contiene clarity |
| traction_block_indicator | Blocks | active_blocks contiene traction |
| structural_block_indicator | Blocks | active_blocks contiene structural |
| phase_duration_long | Stagnation | weeks > 8 sin avance |
| probability_flat_long | Stagnation | stable + bajo + weeks > 4 |
| loading_engine / engine_last_updated / data_incomplete_hint | Sistema | estados de carga/info |

---

*v1.0 — 2026-03-12*
*Segundo pase pendiente: captura de estados omitidos (~20% restante).*
*Para narrativa de Optimus por combinación de contexto → T9.6 (OPTIMUS_PROMPTS.md).*
*Para carácter y tono de Optimus → OPTIMUS_CHARACTER.md.*
