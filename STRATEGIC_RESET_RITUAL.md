# STRATEGIC RESET RITUAL — T9.5

> Diseño de las 5 preguntas del ritual de revisión estratégica cada 4 semanas.
> Versión: v1.0 · Fecha: 2026-03-12
>
> El ritual se ejecuta al final de cada ciclo de 4 semanas (`strategic_cycles`).
> Las respuestas se almacenan en `strategic_cycles.ritual_responses` (JSONB).
> El engine snapshot del momento queda en `strategic_cycles.engine_snapshot`.
> Implementación completa → FASE 10 (R10.1–R10.5).

---

## Trigger

El ritual se activa en dos vías:

**Vía regular:**
```
fin del ciclo de 4 semanas activo
(semana 4 del loop semanal — el ritual reemplaza el loop, no se añade encima)
```

**Vía de urgencia (desde Rescue Mode):**
```
salida de Project Reset Playbook (RESCUE_PLAYBOOKS.md)
OR salida de Focus Recovery Playbook (sin mejora tras 3 semanas)
```

En la vía de urgencia el ciclo puede no haber llegado a las 4 semanas. El trigger es la señal del playbook, no el calendario.

---

## Objetivo

No es una retrospectiva. Es una decisión estructurada.

El ritual fuerza al founder o equipo a nombrar qué evidencia existe, qué hipótesis ya no aguanta, qué cuello hay que resolver, qué hay que cortar, y cuál es la única apuesta para el siguiente ciclo. Cada pregunta obliga a una respuesta observable — no una reflexión sobre el esfuerzo realizado.

---

## Las 5 preguntas

### Q1 — ¿Qué evidencia real mejoró en las últimas 4 semanas?

**Anclaje al engine:**
```
phase_score (delta vs. ciclo anterior)
probability_trend → 'growing'
demand_coverage o delivery_coverage subió de nivel
desaparición de un block (structural, clarity, traction)
```

**Regla de respuesta:**
La respuesta debe citar una señal observable del engine, no una sensación. "Aprendimos mucho" no es válido. "demand_coverage pasó de 'none' a 'basic' tras 3 entrevistas con perfil objetivo" sí lo es. Si no hay señal mejorada que nombrar, la respuesta correcta es "ninguna."

**Campo de salida:** `evidence_progress`

---

### Q2 — ¿Qué hipótesis importante quedó debilitada o falsa?

**Anclaje al engine:**
```
demand_coverage sin avance tras 4 semanas
delivery_coverage sin adopción real
probability_trend = 'declining' o 'stable' < 30
feedback real del ciclo (entrevistas, uso, pagos)
```

**Regla de respuesta:**
Debe nombrar la hipótesis específica que falló, no el área general. Las hipótesis posibles son: problema, segmento objetivo, solución, canal de adquisición, timing, o capacidad de ejecución. "El canal que probamos no funciona" es aceptable. "Las cosas no van bien" no lo es.

**Campo de salida:** `broken_hypothesis`

---

### Q3 — ¿Qué cuello de botella frenó más el proyecto?

**Anclaje al engine:**
```
primary_block (structural_block | clarity_block | traction_block)
bottleneck_role (si está definido)
t2_cash_flow_active = true
weeks_in_current_phase (si > 6 sin avance)
```

**Regla de respuesta:**
Uno solo. Si hay varios cuellos candidatos, el que se nombra es el que más frenó. No una lista. Si el cuello es estructural y hay un `bottleneck_role` definido, debe nombrarse explícitamente ("ventas sin dueño", no "problemas de equipo").

**Campo de salida:** `main_bottleneck`

---

### Q4 — ¿Qué seguimos haciendo que ya no merece más tiempo?

**Anclaje al engine:**
```
weeks_in_current_phase (tiempo sin señal)
active_blocks sin cambio durante 2+ semanas
probability_trend = 'stable' o 'declining'
acciones repetidas sin cambio en señales del engine
```

**Regla de respuesta:**
Debe nombrar una actividad o proceso concreto que se cortará. No "optimizar prioridades". Si la respuesta es vacía ("todo lo que hacemos vale la pena"), es un failure signal del ritual — indica falta de autocrítica, no que el proyecto esté perfecto.

**Campo de salida:** `stop_doing`

---

### Q5 — ¿Cuál es la apuesta única para las próximas 4 semanas?

**Anclaje al engine:**
```
next_action de getNextAction() (el engine ya propone una dirección)
primary_block (qué habría que resolver para desbloquear)
phase_score delta objetivo
```

**Regla de respuesta:**
Q5 captura tres partes, todas obligatorias:

1. **Apuesta principal** — qué se va a hacer (una cosa, no tres)
2. **Señal de éxito** — qué señal del engine confirmaría que funcionó
3. **Condición de invalidación** — cuándo se descartaría esta apuesta antes de las 4 semanas

Sin condición de invalidación, la apuesta no es falseable. Sin señal de éxito, no hay forma de saber si funcionó.

**Campos de salida:** `next_bet` + `success_signal` + `invalidation_condition`

---

## Schema de output

Las respuestas del ritual se almacenan en `strategic_cycles.ritual_responses` (JSONB). El campo existe en el schema actual y está `NULL` en v1 hasta que el ritual se implemente.

```json
{
  "evidence_progress": "string — señal observable que mejoró, o 'ninguna'",
  "broken_hypothesis": "string — hipótesis específica que falló",
  "main_bottleneck": "string — cuello único que más frenó",
  "stop_doing": "string — actividad concreta que se corta",
  "next_bet": "string — apuesta única del siguiente ciclo",
  "success_signal": "string — señal del engine que confirmaría éxito",
  "invalidation_condition": "string — condición que descartaría la apuesta antes de 4 semanas"
}
```

**Nota de mapping:** `success_signal` e `invalidation_condition` son parte de Q5 — se capturan en la misma interacción que `next_bet`. En UI, Q5 se presenta como una sola pregunta con tres campos de respuesta.

---

## Conexión con Optimus

El ritual genera el input más rico que Optimus recibe. Al cierre del ciclo, Optimus tiene disponibles:

- `ritual_responses` (7 campos del ritual)
- `engine_snapshot` (estado del engine en el momento de cierre: phase, probability, risk, viability, completeness)
- `next_action` de `getNextAction()` (acción recomendada por el engine)

Con ese contexto, Optimus puede generar un análisis de ciclo más informado que el análisis semanal estándar. El template específico para ese output → R10.2 (FASE 10).

El output del ritual no reemplaza el schema estándar de Optimus (OPTIMUS_PROMPTS.md). Lo complementa con contexto longitudinal.

---

## Relación con Playbooks

**Entrada al ritual desde Build Mode:**
```
Ciclo regular → fin del cuarto loop semanal
→ ritual reemplaza el loop de esa semana (R10.5)
```

**Entrada al ritual desde Rescue Mode:**
```
Project Reset Playbook (RESCUE_PLAYBOOKS.md §4)
→ "Strategic Reset Ritual para estructurar la revisión si hay equipo"

Focus Recovery Playbook (RESCUE_PLAYBOOKS.md §5)
→ "Strategic Reset Ritual si el foco no mejora después de 3 semanas"
```

**Salida del ritual:**
```
Respuestas estructuradas → ritual_responses guardado en strategic_cycles
Evaluación del ciclo → 🟢 Sólido / 🟠 Inestable / 🔴 Crítico (R10.3, FASE 10)
next_bet → input al siguiente ciclo de 4 semanas
```

---

## Common Mistakes

1. **Responder Q1 con esfuerzo en lugar de evidencia.** "Hicimos muchas entrevistas" no es evidencia de demanda. "demand_coverage subió de 'none' a 'basic'" sí lo es.
2. **Omitir Q4 porque parece negativa.** Nombrar qué se para es más útil que describir qué va bien. Si todo merece seguir, es una señal de falta de priorización.
3. **Q5 sin condición de invalidación.** Una apuesta sin fecha de descarte se convierte en hipótesis permanente — el problema que el ritual intenta evitar.
4. **Hacer el ritual sin el equipo cuando hay equipo.** Las respuestas del founder solo reflejan la perspectiva de una persona. Si hay cofounder o equipo, las 5 respuestas deben consensuarse antes de registrarse.
5. **Usar el ritual como validación del trabajo pasado.** El ritual mira hacia adelante: qué apuesta se hace, no qué tan bien se ejecutó.

---

## Notas de implementación

**Schema actual:**
- `strategic_cycles.ritual_responses JSONB NULL` — campo listo, sin implementar en v1.
- `strategic_cycles.engine_snapshot JSONB` — se registra al cerrar el ciclo.
- `strategic_cycles.closed_at TIMESTAMPTZ NULL` — escritura pendiente (cron no implementado en v1, ver comentario en migración 00015).

**Implementación completa:** FASE 10 (R10.1–R10.5)
- R10.1 — trigger del ritual (calendarizado + urgencia)
- R10.2 — template Optimus para output del ciclo
- R10.3 — evaluación 🟢/🟠/🔴
- R10.4 — registro en `strategic_cycles`
- R10.5 — coordinación Weekly Loop vs. Ritual

**Dependencias de T9.5:**
- `OPTIMUS_PROMPTS.md` — Optimus procesa las respuestas con el schema base ya definido
- `MICROCOPY_SYSTEM.md` — copy de los estados del ritual (estado del ciclo, evaluación final)
- `strategic_cycles` schema actual — verificado en migración `20260224000002`

---

*v1.0 — 2026-03-12*
*Para Rescue Mode playbooks que referencian este ritual → RESCUE_PLAYBOOKS.md (§4, §5).*
*Para implementación técnica → FASE 10 (R10.1–R10.5).*
*Para prompts de Optimus en el ritual → OPTIMUS_PROMPTS.md + R10.2.*
