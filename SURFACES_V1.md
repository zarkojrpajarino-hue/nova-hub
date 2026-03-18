# SURFACES V1 — Nova Hub

> Arquitectura de producto: las 4 superficies funcionales del sistema.
> Versión: v1.2 · Fecha: 2026-03-12
>
> Esta página define QUÉ ve el founder y CUÁNDO.
> No es UI detallada — es la estructura antes de construir componentes.
>
> Regla estructural: cada feature pertenece a una sola superficie.
> Si una feature puede vivir en dos superficies, vive en la más específica.

---

## Mapa de superficies

```
Project Engine Surface      ← siempre visible (estado continuo)
       ↓
Weekly Review Surface       ← semanas 1–3 del ciclo (operativo)
       ↓
Strategic Reset Surface     ← semana 4 del ciclo (estratégico)
       ↓
Cycle History Surface       ← siempre accesible (memoria histórica)
```

Cada superficie corresponde a un momento distinto del sistema operativo de la startup.

---

## System Rules

Las 4 reglas que gobiernan todo el sistema de superficies.
Si un componente viola alguna, pertenece a otro lugar o no existe.

```
Rule 1 — 1 action authority
  All tactical actions come from Next Action (getNextAction()).
  No surface generates a second tactical action.
  Weekly Review does not generate actions — it contextualizes.
  Optimus does not generate actions — it interprets.

Rule 2 — 1 surface = 1 time context
  Engine surface   = continuous state   (always)
  Weekly surface   = weekly event       (weeks 1–3)
  Reset surface    = monthly event      (week 4)
  History surface  = historical record  (always, read-only)
  Never show two time contexts simultaneously.
  Surfaces 2 and 3 are exclusive navigational states, not panels over Surface 1.

Rule 3 — Ritual ends in decision, not in text
  The last thing the founder sees in Surface 3 is next_bet + success_signal + invalidation_condition.
  Never end the ritual on Optimus text.
  cycle_evaluation + next cycle bet = the decision. Optimus = the bridge.

Rule 4 — Optimus rendering contract (Surface 1)
  Only render: primary.action · primary.reason · primary.signal_basis
  Do NOT render: alternative.action · alternative.reason · confidence
  alternative is reserved for: future exploration surfaces, Optimus chat, internal debugging.
  confidence is internal signal — never show to founder in Surface 1.
```

---

## Surface 1 — Project Engine Surface

### Qué es

El dashboard operativo continuo del founder.
Estado del proyecto en tiempo real. Siempre visible, siempre actual.

### Cuándo aparece

Siempre. Es la superficie principal del proyecto.

### Componentes

```
ProjectEnginePanel
 ├ phase_state           (fase actual + phase_score + hard_signal_met)
 ├ viability_state       (viability_status + top_trigger_type)
 ├ probability_state     (probability_score + probability_trend)
 ├ coverage_state        (demand / delivery / cash coverage)
 ├ risk_state            (risk_level + risk_status)
 ├ phase_progress_bar    (phase_score/100 + label + señal dura)
 └ mode_badge            (Build Mode / Rescue Mode — derivado del engine)

Next Action
 └ acción única del engine (getNextAction())

Optimus interpretation
 └ por qué esa acción importa ahora (OPTIMUS_PROMPTS.md §1–7)
```

### Regla de la superficie

```
Next Action = acción        (qué hacer)
Optimus     = interpretación (por qué ahora)
```

Nunca al revés. Optimus no inventa acciones. Next Action no explica.

### Regla de renderizado (Optimus en Surface 1)

```
RENDER:     primary.action
            primary.reason
            primary.signal_basis

NO RENDER:  alternative.action      ← viola Rule 1 (dos acciones en pantalla)
            alternative.reason
            confidence              ← señal interna, no para el founder
```

`alternative` existe en el schema de Optimus (OPTIMUS_PROMPTS.md §4) para uso futuro
(exploración, chat, debugging). En Surface 1 no se muestra nunca.

### Estado de implementación

| Componente | Estado |
|---|---|
| ProjectEnginePanel (phase/viability/probability/coverage/risk) | ✅ Implementado |
| phase_progress_bar | ✅ Implementado (U6.2) |
| mode_badge | ✅ Implementado (U6.10) |
| Next Action (getNextAction v1.1) | ✅ Implementado (XE.3) |
| Optimus context packet | ✅ Implementado (migr 00049) |
| Optimus prompt templates (7 CASEs) | ✅ Implementado (OPTIMUS_PROMPTS.md §6) |
| **Optimus interpretation UI** | ❌ Pendiente FASE 11 |

---

## Surface 2 — Weekly Review Surface

### Qué es

Revisión operativa semanal. Pequeño check del estado del proyecto.
No es estratégica — es operativa. No reemplaza al Engine Panel, lo complementa.

### Cuándo aparece

Semanas 1–3 del ciclo estratégico (28 días).
Generada por el cron domingo 23:30 UTC → `generate_all_weekly_reviews()`.
En semana 4, no aparece — el Weekly Review es reemplazado por el Strategic Reset Ritual.

### Componentes

```
Weekly Review
 ├ cambios de signals     (qué señal del engine cambió esta semana)
 ├ warnings del engine    (notificaciones críticas relevantes)
 └ confirmación de foco   (el Next Action en contexto semanal — read-only)
```

### Regla de la superficie

```
Weekly Review does not generate actions.
All tactical actions come from Next Action (Rule 1).
Weekly Review only contextualizes: what changed, what to watch, confirm focus.
```

"Confirmación de foco" NO es una acción nueva — es el Next Action actual
mostrado en contexto de lo que cambió esta semana. El founder sale con el
mismo foco que ya tenía, ahora con más contexto operativo.

Scope estrictamente operativo. Si algo requiere decisión estratégica,
pertenece al Strategic Reset Ritual (Surface 3), no aquí.

### Nota sobre write-path

En v1: **read-only**. El founder ve el estado, no lo ajusta.
Write-path diferido a v1.1 — requiere schema nuevo + datos de uso real.

### Estado de implementación

| Componente | Estado |
|---|---|
| `weekly_reviews` table | ✅ Implementado (migr 00034) |
| `generate_weekly_review_for_project()` | ✅ Implementado (migr 00034) |
| `generate_all_weekly_reviews()` cron | ✅ Implementado (migr 00034, 00051) |
| **Weekly Review UI** | ❌ Pendiente FASE 11 |

---

## Surface 3 — Strategic Reset Ritual Surface

### Qué es

La superficie de decisión estratégica. Se activa una vez cada 4 semanas.
Fuerza al founder a evaluar el ciclo, nombrar aprendizajes y definir la próxima apuesta.

### Cuándo aparece

Semana 4 del ciclo estratégico (últimos 7 días del ciclo de 28 días).
Reemplaza el Weekly Review — en semana 4 no hay revisión operativa, solo el ritual.

### Flujo

```
FASE DE INPUT
1. El sistema detecta semana 4 (CURRENT_DATE >= end_date - 6)
2. Se muestra la superficie del ritual al founder
3. Founder responde las 5 preguntas (Q1–Q5)
4. submit_strategic_reset() → guarda ritual_responses → cierra ciclo → crea ciclo N+1

FASE DE OUTPUT (orden inamovible)
5. Optimus interpretation  ← el puente: por qué este ciclo fue así
6. cycle_evaluation        ← la consecuencia: 🟢 progress · 🟠 stagnation · 🔴 regression
7. Next cycle bet          ← el estado final: next_bet + success_signal + invalidation_condition
```

**Regla de orden de salida (Rule 3):** la última cosa visible es siempre el next cycle bet.
Nunca terminar en texto. El founder sale con una decisión, no con una interpretación.

### Componentes

```
Strategic Reset Ritual

  [INPUT]
  Q1–Q5 ritual inputs       (las 5 preguntas → ritual_responses JSONB)

  [OUTPUT — en este orden]
  Optimus interpretation    (summary + main_learning + key_bottleneck)
  cycle_evaluation          (🟢 progress · 🟠 stagnation · 🔴 regression)
  Next cycle bet            (next_bet + success_signal + invalidation_condition)
                             ← último elemento visible
```

### Regla de la superficie

```
El ritual es una decisión estructurada, no una retrospectiva.
Output order is fixed: interpretation → evaluation → decision.
Never end on Optimus text (Rule 3).
Optimus tone follows cycle_evaluation: regression=strict, stagnation=analytical, progress=forward.
```

### Estado de implementación

| Componente | Estado |
|---|---|
| `submit_strategic_reset()` | ✅ Implementado (migr 00050) |
| `close_strategic_cycle()` | ✅ Implementado (migr 00050) |
| `run_strategic_cycle_checks()` cron | ✅ Implementado (migr 00051) |
| Detección semana 4 (skip weekly review) | ✅ Implementado (migr 00051) |
| `get_ritual_optimus_context()` | ✅ Implementado (migr 00052) |
| Optimus ritual template (§8) | ✅ Implementado (OPTIMUS_PROMPTS.md §8) |
| **Strategic Reset Ritual UI** | ❌ Pendiente FASE 11 |

---

## Surface 4 — Cycle History Surface

### Qué es

La memoria estratégica del proyecto. Historial de todos los ciclos completados.
Convierte los rituales pasados en una línea de tiempo de decisiones estratégicas.

### Cuándo aparece

Siempre accesible (read-only). No es urgente para el día a día.

### Componentes

```
Cycle History
 ├ cycle_index        (número de ciclo)
 ├ evaluation         (progress / stagnation / regression)
 ├ key_learning       (síntesis de Q1+Q2 del ritual — main_learning de R10.2)
 ├ bottleneck         (cuello principal de ese ciclo — key_bottleneck de R10.2)
 └ next_bet           (apuesta que se eligió — next_bet de R10.2)
```

**Fuente:** tabla `strategic_cycles` — los datos ya existen.
`ritual_responses` (7 campos) + `cycle_evaluation` + `closed_at` + `cycle_index`.

### Estado de implementación

| Componente | Estado |
|---|---|
| Datos en `strategic_cycles` | ✅ Disponibles tras primer ciclo cerrado |
| **Cycle History UI** | ❌ Pendiente FASE 11 (diferible si no hay usuarios con 2+ ciclos) |

### Nota de prioridad v1

**Diferible.** Para que esta superficie tenga valor, el founder necesita al menos
2 ciclos completados con ritual. En early adopters, eso equivale a ~2 meses de uso.
Construir la UI antes de que haya datos reales es trabajo prematuro.

Recomendación: implementar la estructura del componente en FASE 11 pero no priorizar
el diseño hasta tener usuarios con ciclos completados. Los datos ya se capturan
— la UI puede venir después sin perder nada.

---

## Tabla de asignación: feature → superficie

| Feature | Superficie |
|---|---|
| phase_state, viability, probability, coverage, risk | Engine |
| phase_progress_bar | Engine |
| mode_badge (Build / Rescue) | Engine |
| Next Action | Engine |
| Optimus interpretation (semanal) | Engine |
| Weekly Review (signals + warnings + foco) | Weekly |
| Signal changes notification | Weekly |
| Strategic Reset Ritual (Q1–Q5 + evaluación) | Reset |
| Optimus interpretation (ritual) | Reset |
| cycle_evaluation display | Reset |
| Cycle history (ciclos pasados) | History |

---

## Modelo de navegación

### Estados del sistema — no navegación manual

Las superficies 2 y 3 no son pestañas ni opciones de menú.
Son estados del sistema que se activan automáticamente.

```
Surface 1 = default (siempre)

Surface 2 activa cuando:
  weekly_review_pending = true
  condición: EXISTS weekly_review sin leer para esta semana y proyecto

Surface 3 activa cuando:
  ritual_pending = true
  condición: cycle_due OR urgent_reset_requested
```

**Definición de `ritual_pending`:**
```
cycle_due =
  CURRENT_DATE >= strategic_cycles.end_date - 6
  AND closed_at IS NULL
  AND ritual_responses IS NULL

urgent_reset_requested =
  strategic_cycles.urgent_reset_requested = true
  AND closed_at IS NULL
  AND ritual_responses IS NULL

ritual_pending = cycle_due OR urgent_reset_requested
```

**Caminos de activación:**
```
Camino normal   → semana 4 del ciclo  (cycle_due = true)
Camino urgencia → Rescue Playbook recomienda reset
                  → UI hace UPDATE strategic_cycles SET urgent_reset_requested = true
                  → ritual_pending = true aunque sea semana 1 o 2
```

**Nota de implementación:** `urgent_reset_requested BOOLEAN DEFAULT FALSE`
requiere un `ALTER TABLE strategic_cycles` (migración pendiente FASE 11).
`close_reason` no sirve para esta condición — es el resultado del cierre,
no el trigger previo. El flag debe ponerse ANTES de que el founder ejecute el ritual.

**Prioridad de estados:**
```
ritual_pending = true    →  Surface 3  (prioridad sobre weekly)
weekly_pending = true    →  Surface 2
ninguno                  →  Surface 1  (default)
```

Si el ritual y el weekly coinciden (no debería ocurrir en el camino normal —
`generate_all_weekly_reviews` skipea semana 4; sí puede ocurrir en el camino
urgencia en semanas 1–3), el ritual tiene prioridad.

### Re-entry navigation order (V11.0)

Cuando `is_reentry = true` (ausencia > 7d), el re-entry summary se muestra **siempre primero**
— antes de cualquier superficie activa. Nunca abrir directamente notification feed,
Weekly Review ni Ritual.

```
is_reentry = true
  → mostrar re-entry summary ("Since you were away")
  → al acknowledge, navegar a superficie activa:

      ritual_pending = true    →  Surface 3
      weekly_pending = true    →  Surface 2
      ninguno                  →  Surface 1 (default)
```

Razón: el founder necesita contexto de lo que cambió antes de procesar
cualquier decisión pendiente. Si vuelve tras una crisis y hay un ritual urgente,
el re-entry summary se lo comunica — luego Surface 3 le permite ejecutarlo
con contexto completo.

**Fuente de `last_seen_at`:** tabla `project_user_state (project_id, user_id, last_seen_at TIMESTAMPTZ)`.
No `project_members` — la ausencia es per-project, no global.
Un founder activo en proyecto A puede llevar 2 semanas sin abrir proyecto B.
Re-entry debe dispararse solo en B.

### Formato: full page, no modal

Superficies 2 y 3 son **full page** — reemplazan Surface 1 completamente.

Motivo: Rule 2 (1 surface = 1 time context). Un modal sobre Surface 1
mantiene el Engine panel visible detrás — continuo + semanal simultáneos.
Full page fuerza el contexto limpio.

### Botones de salida (obligatorios)

```
Surface 2 →  "Continue execution"    →  regresa a Surface 1
Surface 3 →  "Start next cycle"      →  regresa a Surface 1
                                         (activa tras submit_strategic_reset())
```

Sin botón de salida, el founder queda atrapado en la superficie.
El botón de salida de Surface 3 solo aparece después de que el output
del ritual es visible (Optimus interpretation + cycle_evaluation + next cycle bet).

---

## Dependencias de FASE 11

```
S11.1 (este documento) → S11.2 (mapear componentes actuales)
S11.2 → V11.1 (auditar features dentro de superficies)
V11.1 → V11.2 (feature matrix)
V11.2 → V11.3 (visibility system)
V11.3 → V11.4 (teaser UX)
```

V11.5 (Analytics) y V11.6 (Function Coverage) son independientes.

---

## Change impact

Si modificas una superficie, revisa:

| Si modificas... | Revisa... |
|---|---|
| Engine Surface components | `get_optimus_context()` input schema, OPTIMUS_PROMPTS.md §1 |
| Weekly Review components | `weekly_reviews` table schema, `generate_weekly_review_for_project()` |
| Reset Ritual components | `submit_strategic_reset()`, STRATEGIC_RESET_RITUAL.md, OPTIMUS_PROMPTS.md §8 |
| Cycle History components | `strategic_cycles` schema, `get_ritual_optimus_context()` |

---

## Gaps de implementación pendientes

Detectados en simulación de ciclo completo + simulación de crisis (2026-03-12).

| Gap | Superficie afectada | Solución mínima | Estado |
|---|---|---|---|
| `urgent_reset_requested` | Surface 3 navegación | `ALTER TABLE strategic_cycles ADD COLUMN urgent_reset_requested BOOLEAN DEFAULT FALSE` — seteado por playbook UI antes del ritual | ❌ Migración pendiente FASE 11 |
| Re-entry summary layer | Surface 1 (modo transitorio) | `last_seen_at > 7d` → mostrar "Since you were away". Requiere tabla nueva `project_user_state (project_id, user_id, last_seen_at TIMESTAMPTZ)` — per-project, no global. Payload derivado (no tabla nueva): `{ is_reentry, absence_days, trigger_reason, current_state, changes_since_last_seen, active_urgencies, resume }`. Navegación post-acknowledge: ritual_pending → Surface 3; weekly_pending → Surface 2; else → Surface 1. Ver sección "Re-entry navigation order" más arriba. | ❌ V11.0 — implementación FASE 11 |

**Nota sobre re-entry:** no es una 5ª superficie — es Surface 1 en modo transitorio.
Se activa cuando `last_seen_at > threshold` y se limpia al acknowledger.
No requiere limpiar notificaciones — solo despriorizarlas visualmente.

---

*v1.2 — 2026-03-12*
*Para features dentro de cada superficie → TASK_LIST.md (V11.1–V11.6).*
*Para templates de Optimus → OPTIMUS_PROMPTS.md.*
*Para runtime de ciclos → STRATEGIC_RESET_RITUAL.md.*
