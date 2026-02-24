# ENGINE_DESIGN.md — Nova Hub Strategic Engine Architecture

> Master specification document. Captures the 4 strategic engines, their formulas, thresholds,
> notification taxonomy (5 layers), role differentiation, and connection architecture.
> Source: ChatGPT multi-day design session + notifications audit + roles deep audit.
> Status: DESIGN — not yet implemented in code.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase Engine](#2-phase-engine)
3. [Probability Engine](#3-probability-engine)
4. [Viability Engine](#4-viability-engine)
5. [Organizational Engine](#5-organizational-engine)
6. [Economic Profile System](#6-economic-profile-system)
7. [Role Metrics — Differentiated by Specialization](#7-role-metrics--differentiated-by-specialization)
8. [Connection Architecture](#8-connection-architecture)
9. [Notification Taxonomy — 5 Layers](#9-notification-taxonomy--5-layers)
10. [Solo vs Team Adaptations](#10-solo-vs-team-adaptations)
11. [Implementation Gap Analysis](#11-implementation-gap-analysis)
12. [Engine Interaction Map](#12-engine-interaction-map)

---

## 1. Architecture Overview

The 4 strategic engines are the invisible backbone of Nova Hub. They are not features — they are the
operating system that makes all features coherent. The user never sees the engines directly; they see
their consequences: phase progression, probability shifts, viability alerts, capacity warnings.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NOVA HUB ENGINE LAYER                            │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │   PHASE     │  │ PROBABILITY  │  │  VIABILITY   │  │  ORG    │ │
│  │  ENGINE     │→ │   ENGINE     │→ │   ENGINE     │→ │ ENGINE  │ │
│  │ (progreso)  │  │ (momentum)   │  │ (sostenib.)  │  │ (equipo)│ │
│  └─────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
│         │                │                 │                │       │
│         ▼                ▼                 ▼                ▼       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            NOTIFICATION LAYER (5 layers)                    │   │
│  │  Operational | Phase | Probability | Viability | Org        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │   PRODUCT SURFACE (Dashboard, KPIs, CRM, Tasks, etc.)       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Relation to User-Facing Scenarios (SCENARIO_MAP.md)

The scenarios (A1–C4) are the **user-facing narrative**. The phases are the **engine logic**.
They map approximately:

| Scenario Group | Phase Engine State     | Methodology Overlay  |
|----------------|------------------------|----------------------|
| A (Explorer)   | Fase 1: Descubrimiento | Design Thinking      |
| B (Validator)  | Fase 2: Validación     | Lean Startup         |
| C1–C2 (Traction) | Fase 3: Operación   | Scaling Up básico + OKRs |
| C3–C4 (Scale)  | Fase 4: Escala         | Scaling Up completo  |

A user can be in scenario B2 (Validador Servicios Solo) but in Phase 1 if they haven't
met the Fase 1 exit criteria. Phase is computed, not self-declared.

---

## 2. Phase Engine

### 2.1 Overview

4 phases, each with 3 mandatory Outcomes. Phase score ≥ 75% + 1 hard signal required to advance.
Recalculated every Sunday (weekly cadence). Can **regress** after 6 consecutive weeks of inactivity.

### 2.2 Phase Definitions

#### Fase 1: Descubrimiento
*Methodology: Design Thinking*
*Purpose: Find a real, specific problem worth solving*

| Outcome | Indicator | Saludable | Fricción | Crítico |
|---------|-----------|-----------|----------|---------|
| O1.1 — Problem validated with real people | Interviews with ≥5 real people (evidences) | ≥5 interviews | 2–4 interviews | 0–1 interview |
| O1.2 — Target segment defined | Persona profile with demographic + behavioral + pain | Profile complete | Profile partial | No profile |
| O1.3 — Value hypothesis documented | Written hypothesis with differentiation statement | Documented + tested | Documented only | Not documented |

**Phase 1 Score formula:**
```
P1_score = (
  O1.1_score × 0.40 +   // Most critical: real contact
  O1.2_score × 0.30 +   // Segment clarity
  O1.3_score × 0.30     // Hypothesis quality
)
```

**Hard signal to exit Fase 1:**
- At least 1 OBV with type=`customer_discovery` in status=`validated`

**Regression trigger:** 6 weeks with 0 OBVs created + 0 tasks completed → regress to Fase 1 warning state

---

#### Fase 2: Validación
*Methodology: Lean Startup*
*Purpose: Validate that someone pays (or commits) for the solution*

| Outcome | Indicator | Saludable | Fricción | Crítico |
|---------|-----------|-----------|----------|---------|
| O2.1 — Revenue or commitment evidence | ≥1 paying customer OR ≥3 pre-orders/LOIs | Revenue OR 3+ commitments | 1–2 commitments, no revenue | 0 evidence |
| O2.2 — Validated MVP tested | User test sessions with feedback loop | ≥3 sessions with documented pivots | 1–2 sessions | No testing |
| O2.3 — Repeatable acquisition channel | Can explain how to get next 10 customers | Channel documented + tested | Channel hypothesized | No channel |

**Phase 2 Score formula:**
```
P2_score = (
  O2.1_score × 0.45 +   // Revenue signal is king
  O2.2_score × 0.25 +   // MVP validation
  O2.3_score × 0.30     // Acquisition clarity
)
```

**Hard signal to exit Fase 2:**
- At least 1 OBV with type=`revenue_validation` in status=`validated`
- AND `revenue_momentum` > 0 in Probability Engine

**Regression trigger:** 8 weeks with 0 CRM activity + 0 OBV validations

---

#### Fase 3: Operación
*Methodology: Scaling Up básico + OKRs*
*Purpose: Build repeatable, sustainable operational systems*

| Outcome | Indicator | Saludable | Fricción | Crítico |
|---------|-----------|-----------|----------|---------|
| O3.1 — Predictable revenue | MoM growth ≥5% for 3 consecutive months | 3+ months growth | 1–2 months growth | Stagnant/declining |
| O3.2 — Team functional with roles | All key roles filled + performance tracked | All roles active | Partial coverage | No role system |
| O3.3 — OKRs connected to weekly execution | OKRs exist + tasks linked to objectives | OKRs + tasks linked | OKRs only | No OKRs |

**Phase 3 Score formula:**
```
P3_score = (
  O3.1_score × 0.40 +   // Revenue growth is the floor
  O3.2_score × 0.25 +   // Team health
  O3.3_score × 0.35     // Execution system
)
```

**Hard signal to exit Fase 3:**
- `capacity_health` in Organizational Engine ≥ 70
- AND revenue in 3 consecutive months

---

#### Fase 4: Escala
*Methodology: Scaling Up completo*
*Purpose: Systematic growth without proportional founder time*

| Outcome | Indicator | Saludable | Fricción | Crítico |
|---------|-----------|-----------|----------|---------|
| O4.1 — Growth without founder bottleneck | ≤30% of revenue-generating tasks assigned to founder | ≤30% | 31–50% | >50% |
| O4.2 — Functional departments | Finance, Sales, Marketing, Ops each with ≥1 active member | All 4 covered | 2–3 covered | ≤1 covered |
| O4.3 — Strategic planning cycle | Quarterly OKRs + monthly reviews documented | Full cycle | Partial | No planning |

**Phase 4 Score formula:**
```
P4_score = (
  O4.1_score × 0.35 +   // Founder leverage
  O4.2_score × 0.30 +   // Org structure
  O4.3_score × 0.35     // Planning maturity
)
```

---

### 2.3 Phase Transition Rules

```
ADVANCE:
  current_phase_score ≥ 75%
  AND hard_signal_met = TRUE
  → Optimus suggests transition
  → User confirms (hybrid: system proposes, human decides)
  → Transition logged with timestamp + evidence

MAINTAIN:
  50% ≤ current_phase_score < 75%
  → Normal operation
  → Weekly coaching focused on lowest Outcome

REGRESS WARNING:
  current_phase_score < 50%
  → Viability Engine notified
  → 30-day recovery window opened

REGRESS:
  current_phase_score < 50% for 6 weeks
  → Phase reduces by 1
  → Full notification event
  → Viability Engine assesses state
```

### 2.4 Phase Score → Overall Phase State

```
≥ 75%: Saludable (green)
50–74%: Fricción (yellow)
< 50%: Crítico (red)
```

---

## 3. Probability Engine

### 3.1 Formula

```
probability_score = (
  fase_score        × 0.35 +
  execution_rate    × 0.20 +
  validation_strength × 0.15 +
  revenue_momentum  × 0.15 +
  capacity_health   × 0.15
)
```

All inputs normalized to 0–100 scale. Output is 0–100.

### 3.2 Input Definitions

#### fase_score (35%)
The current phase's composite score (as computed in Phase Engine).
The highest-weight input — where you are in the journey matters most.

#### execution_rate (20%)
```
execution_rate = (tasks_completed_on_time / tasks_due_in_period) × 100
Period: last 4 weeks rolling
Minimum tasks for significance: 5 (below 5 tasks, default = 50)
```

#### validation_strength (15%)
```
validation_strength = (
  obv_validated_count × 10 +
  peer_validations_received × 5 +
  evidence_quality_score × 15    // avg quality of attached evidences
) capped at 100
```

#### revenue_momentum (15%)
```
-- If Fase 1 (no revenue expected):
revenue_momentum = 30  // neutral, not penalized

-- If Fase 2+ :
IF revenue_this_month > revenue_last_month:
  revenue_momentum = 60 + (growth_pct × 0.4) capped at 100
ELSE IF revenue_this_month = revenue_last_month:
  revenue_momentum = 40
ELSE:
  revenue_momentum = MAX(0, 40 - (decline_pct × 0.5))
```

#### capacity_health (15%)
Provided by Organizational Engine (see §5). Represents team's operational capacity
relative to workload. Score 0–100.

### 3.3 Display Logic

**Never shown as a raw number to the user unless they explicitly open it.**

Surface behavior:
- Header shows as a compact signal: `●●●○○` (5 dots) or color-coded arc
- Full breakdown shown only at 3 strategic moments:
  1. Weekly review (Sunday)
  2. Phase transition proposal
  3. Viability alert triggered
- Tooltip on demand: "Tu probabilidad de avance esta semana es X/100. El factor más bajo es..."

### 3.4 Probability Zones

```
80–100: Alto momentum — suggest scaling next actions
60–79:  Progresando — steady state, coaching on next lever
40–59:  Fricción — identify and address lowest input
20–39:  En riesgo — Viability Engine activated
0–19:   Crítico — immediate Viability Engine intervention
```

---

## 4. Viability Engine

### 4.1 Three States

```
SALUDABLE
  Condition: probability_score ≥ 60 for ≥4 weeks
  Display: No banner. Normal operation.
  Action: None required.

ESTANCAMIENTO ESTRUCTURAL
  Condition: probability_score < 50 for 8 consecutive weeks
  Display: Yellow banner — "Tu proyecto lleva 8 semanas sin avanzar."
  Action: Optimus presents 3 paths (see §4.3)

MODELO NO VALIDADO CRÍTICAMENTE
  Condition: probability_score < 30 for 12 consecutive weeks
             OR revenue_momentum = 0 for 16 weeks (Fase 2+)
             OR validation_strength = 0 for 20 weeks (Fase 1+)
  Display: Red banner — "Tu modelo necesita una revisión estratégica urgente."
  Action: Mandatory strategic review. Blocks new tasks/OBVs until acknowledged.
```

### 4.2 State Transition Logic

```
SALUDABLE → ESTANCAMIENTO:
  8 weeks with probability_score < 50
  [tracked via viability_state table, week counter]

ESTANCAMIENTO → CRÍTICO:
  Additional 4 weeks without recovery (total 12 weeks)
  OR any single input drops to 0 for extended period

CRÍTICO → ESTANCAMIENTO (recovery):
  2 consecutive weeks with probability_score ≥ 40
  + user completes ≥1 path action from the 3 paths

ESTANCAMIENTO → SALUDABLE (recovery):
  4 consecutive weeks with probability_score ≥ 60
```

### 4.3 The 3 Paths (shown when ESTANCAMIENTO or CRÍTICO)

These are never framed as "failure". They are strategic pivots.

```
Path 1: PIVOTAR SEGMENTO
  "Mantén la solución, cambia quién la compra"
  Action: Opens Discovery OBV flow for new segment
  Resets: O1.2 (Target segment) to In Progress
  Does NOT reset: O1.1 (interviews), O2.2 (MVP work)

Path 2: PIVOTAR PROPUESTA DE VALOR
  "Mantén el segmento, cambia qué ofreces"
  Action: Opens ideation flow with Optimus
  Resets: O1.3 (Value hypothesis), O2.1 (Revenue evidence)
  Does NOT reset: O1.1 (interviews), O1.2 (segment)

Path 3: PAUSAR PROYECTO
  "Documenta, descansa, y reactiva cuando estés listo"
  Action: Project moves to 'paused' status
  Preserves: All data, history, OBVs, KPIs
  Can reactivate: Any time. Phase score preserved at 40% of prior.
```

**Design constraint:** NEVER use the word "fracaso" or "abandonar". Always "pausa estratégica."

### 4.4 Viability Cooldown

After a path is chosen:
- 30-day cooldown before Viability Engine can re-trigger
- Weekly check-ins (light) continue
- Optimus actively suggests quick wins to rebuild momentum

---

## 5. Organizational Engine

### 5.1 Capacity Score

The base unit for understanding team load.

```
INDIVIDUAL BASELINE: 100 capacity units per member per week

DEDUCTIONS:
  Active OBV:        -10 units each (high complexity, external dependency)
  Assigned task:     -3 units each  (execution unit)
  Active meeting:    -10 units each (preparation + follow-up cost)

MAXIMUM LOAD: 80 units consumed = 80% capacity (leave 20% buffer)
```

**Capacity formula:**
```
capacity_health = (
  (available_units / total_units) × 100
) × team_size_adjustment

team_size_adjustment:
  1 member:  × 0.85  (solo founder carries more cognitive load)
  2–3 members: × 1.00
  4–6 members: × 1.05 (specialization benefit)
  7+ members:  × 1.10 (division of labor)
```

### 5.2 Bottleneck Detection

A bottleneck is detected when one functional area carries disproportionate load.

```
BOTTLENECK THRESHOLDS:
  A role with > 60% of all active OBVs = bottleneck
  A role with > 70% of all active tasks = bottleneck
  A functional area with 0 members = structural gap (see §7.3)

FUNCTIONAL AREAS TRACKED:
  Sales        → roles: [sales]
  Marketing    → roles: [marketing]
  Finance      → roles: [finance]
  Operations   → roles: [operations]
  Technology   → roles: [ai_tech]
  Strategy     → roles: [strategy]
```

**Bottleneck triggers:**
1. Notification to project admin
2. Optimus suggestion: "Considera añadir capacidad en [área]"
3. If work_mode allows: Role Simulation activated (§5.3)

### 5.3 Role Simulation

*"What if we added a Marketing person?"*

```
SIMULATION FORMULA:
  current_capacity_health = X
  simulated_new_member_role = [role]

  marketing_tasks_currently_unassigned_or_overloaded = Y

  simulated_capacity_health = X + (100 × team_size_adjustment_delta)
                              - (Y × 0.3)  // redistributed load

  OUTPUT: "Añadir [rol] llevaría tu capacidad de X% → Z%"
```

**When shown:**
- Only when bottleneck detected
- Only when work_mode ≠ 'individual'
- Shown as suggestion, not requirement

### 5.4 Organizational Health Score

```
org_health = (
  capacity_health   × 0.40 +
  role_coverage     × 0.35 +   // % of functional areas with ≥1 active member
  bottleneck_free   × 0.25     // 100 if no bottleneck, 0 if critical bottleneck
)
```

This feeds into `capacity_health` input of Probability Engine.

---

## 6. Economic Profile System

### 6.1 Overview

3 structural variables that adjust engine thresholds. These are detected automatically
from onboarding data and OBV patterns. Not self-declared by type ("I'm a SaaS").

### 6.2 The 3 Variables

#### Variable 1: Ciclo de Venta
How long from first contact to closed deal.

```
corto:   < 7 days
medio:   1 week – 4 weeks
largo:   1 month – 6 months
```

#### Variable 2: Tipo de Monetización

```
transaccional:          One-time purchase (marketplace, e-commerce, retail)
suscripción:            Recurring subscription (SaaS, membership)
ticket_alto:            High-ticket, low-volume (consulting, B2B enterprise)
recurrente_contractual: Contract-based recurring (agency retainers, SLA)
```

#### Variable 3: Intensidad de Capital

```
bajo:   < $10K to launch (digital services, consulting, info products)
medio:  $10K – $100K (tech product, physical product MVP)
alto:   > $100K (hardware, regulated industries, marketplace cold start)
```

### 6.3 Threshold Adjustments by Profile

Different profiles have inherently different timelines. The engines adapt:

| Profile Combination | revenue_momentum baseline | Phase 2 exit window | Org bottleneck threshold |
|---------------------|--------------------------|---------------------|--------------------------|
| corto + transaccional + bajo | Standard | 4 weeks | Standard |
| largo + ticket_alto + medio | +20% tolerance | 12 weeks | +15% tolerance |
| medio + suscripción + medio | Standard | 8 weeks | Standard |
| largo + ticket_alto + alto | +40% tolerance | 20 weeks | +25% tolerance |

**Design principle:** A B2B enterprise founder (largo + ticket_alto + alto) who has 0 revenue after
16 weeks is NOT in crisis — they may be closing a $200K deal. The engine must know this.

### 6.4 Economic Profile Detection

```
Onboarding signals used:
  - avg_sale_amount (from business profile)
  - sales_cycle_estimate (from onboarding Q)
  - product_type (digital/physical/service/software)
  - target_customer (B2B/B2C/B2B2C)

Auto-classification occurs at project creation.
User can override via Settings > Economic Profile.
Profile reviewed after 4 weeks of data (CRM + OBV patterns).
```

---

## 7. Role Metrics — Differentiated by Specialization

### 7.1 Problem Statement

**Current state (Gap 1):** Performance score formula is IDENTICAL for all roles:
```sql
score = (obvs_validados × 10) + (kpis_validados × 5) + (tareas_completadas × 2)
-- This is wrong. A Sales role and a Finance role succeed differently.
```

**Target state:** Each role has a weighted formula that reflects what success looks like
in that specialization.

### 7.2 Role-Specific Performance Formulas

#### SALES
*"Revenue is the output. Pipeline is the leading indicator."*

```
sales_score = (
  crm_leads_closed_won      × 20 +  // Highest weight: closed deals
  crm_leads_advanced        × 8  +  // Pipeline movement
  obv_revenue_validation    × 15 +  // Revenue-type OBVs validated
  tasks_completed_on_time   × 3  +  // Execution reliability
  kpis_met                  × 5     // KPI achievement
) normalized to 100
```

Key KPIs for Sales role: CAC, conversion_rate, pipeline_value, revenue_this_month

#### FINANCE
*"Precision and predictability. No surprises."*

```
finance_score = (
  financial_records_updated × 10 +  // Consistency of record-keeping
  cash_flow_accuracy        × 20 +  // Forecast vs actual variance
  collections_on_time       × 15 +  // AR management
  obv_finance_validated     × 12 +  // Finance-type OBVs
  tasks_completed_on_time   × 5     // Execution
) normalized to 100
```

Key KPIs for Finance role: runway_months, MRR, churn_rate, gross_margin

#### MARKETING
*"Reach and resonance. Leads are the output."*

```
marketing_score = (
  leads_generated           × 12 +  // Top of funnel contribution
  content_published         × 5  +  // Consistency of output
  conversion_rate_mkt       × 15 +  // Quality of leads
  obv_market_validated      × 10 +  // Market-type OBVs
  tasks_completed_on_time   × 3  +  // Execution
  kpis_met                  × 8     // KPI achievement
) normalized to 100
```

Key KPIs for Marketing role: CPL, brand_mentions, channel_performance, lead_quality_score

#### OPERATIONS
*"Systems and reliability. Everything runs on time."*

```
operations_score = (
  tasks_completed_on_time   × 15 +  // Core metric: execution
  processes_documented      × 10 +  // System building
  sla_met                   × 12 +  // Reliability
  obv_ops_validated         × 8  +  // Operations-type OBVs
  kpis_met                  × 8     // KPI achievement
) normalized to 100
```

Key KPIs for Operations role: task_completion_rate, on_time_delivery, process_coverage

#### AI_TECH (Technology)
*"Velocity and quality. Ship it, test it, learn fast."*

```
tech_score = (
  tasks_completed_on_time   × 12 +  // Delivery velocity
  obv_tech_validated        × 15 +  // Tech validation OBVs
  mvp_milestones_hit        × 20 +  // Product milestone delivery
  technical_debt_managed    × 8  +  // Quality discipline
  kpis_met                  × 5     // KPI achievement
) normalized to 100
```

Key KPIs for Tech role: sprint_velocity, bug_rate, feature_delivery_rate

#### STRATEGY
*"Insight and direction. OKRs aligned, pivots justified."*

```
strategy_score = (
  okrs_on_track             × 20 +  // Strategic alignment
  pivots_documented         × 10 +  // Decision quality
  obv_validated_any_type    × 12 +  // Strategic validation
  meeting_insights_captured × 8  +  // Intelligence extraction
  tasks_completed_on_time   × 5     // Execution
) normalized to 100
```

Key KPIs for Strategy role: phase_progression_rate, OKR_completion_rate, strategic_decision_speed

### 7.3 Role Coverage Score

Used by Organizational Engine for functional gap detection.

```sql
-- For each phase, critical roles differ:
Fase 1: [strategy, ai_tech] are critical
Fase 2: [sales, strategy] are critical
Fase 3: [sales, finance, operations] are critical
Fase 4: [sales, finance, marketing, operations, strategy] are critical

role_coverage = (filled_critical_roles / total_critical_roles_for_phase) × 100
```

**Structural gap alert:** If a critical role for current phase has 0 members AND work_mode ≠ 'individual',
trigger bottleneck notification.

### 7.4 Executor + Leader Methodology

**Current state (Gap 3):** `leader_id` does NOT exist in `tasks` table. Only `assignee_id`.

**Target state:** Each task has:
```sql
assignee_id  UUID  -- The Executor (does the work)
leader_id    UUID  -- The Leader (accountable for outcome)
```

Rules:
```
Executor: Does. Reports. Gets task_completed credit.
Leader:   Unblocks. Reviews. Gets accountability_score credit.
Leader ≠ Executor always (enforced at task creation).
In solo mode: leader_id = null (no penalty).
```

Performance impact:
```
leader_score contribution = (tasks_led × 8) + (unblocks_provided × 5)
executor_score contribution = (tasks_completed × 12) + (on_time_rate × 10)
```

---

## 8. Connection Architecture

### 8.1 Role Performance → Phase Score

**Current state (Gap 2):** Role performance score exists but does NOT feed Phase Score.

**Target architecture:**

```
role_performance_scores (by specialization)
        ↓
  weighted by current phase's critical roles
        ↓
  contributes 20% to Phase Score (capacity_execution component)

Phase Score = (
  outcome_scores_weighted  × 0.70 +  // Core: Are outcomes being met?
  execution_health         × 0.20 +  // New: Are critical roles performing?
  validation_quality       × 0.10    // Peer + evidence quality
)
```

**execution_health formula:**
```
execution_health = AVG(
  performance_score_of_critical_roles_for_this_phase
) normalized

If critical role is EMPTY: contributes 0 to that slot (structural penalty)
```

### 8.2 Bottleneck → Challenge Suggestion

**Current state (Gap 3):** Bottlenecks detected by Org Engine but no automatic follow-up.

**Target architecture:**

```
BOTTLENECK DETECTED (e.g., Sales role overloaded)
        ↓
  Org Engine flags: bottleneck_role = 'sales', severity = 'high'
        ↓
  Challenge system queries: existing_challenges WHERE role = 'sales'
        ↓
  IF no active challenge for that role:
    Optimus proposes: "Tu área de ventas está al límite.
    ¿Quieres lanzar un challenge de performance para Sales?"
        ↓
  User accepts → Challenge created with:
    type: 'bottleneck_relief'
    role: 'sales'
    duration: 14 days
    target_metric: (reduce OBV count by 30% OR advance 3 leads to next stage)
        ↓
  Challenge outcome feeds back to Probability Engine (execution_rate input)
```

### 8.3 Empty Role → Alert Escalation

```
EMPTY CRITICAL ROLE DETECTED
        ↓
  Week 1: Low priority notification (informational)
  Week 2: Medium priority notification + Optimus suggestion
  Week 4: High priority notification + Org Engine penalty applied
  Week 8: Viability Engine notified (structural gap signal)
```

### 8.4 Phase Transition → Notification Cascade

```
PHASE TRANSITION PROPOSED (score ≥75% + hard signal)
        ↓
  1. Probability Engine recalculates with new phase_score = 0 (new phase starting)
  2. Notification: "Estás listo para [Fase N+1]" (celebratory, high priority)
  3. Optimus proposes new OBVs appropriate for new phase
  4. SCENARIO_MAP: Re-evaluate which features move HIDDEN → AVAILABLE
  5. Weekly loop adapts to new phase methodology
```

---

## 9. Notification Taxonomy — 5 Layers

### Design Principles

1. **No notification without an action.** Every notification must have a clear `action_url`.
2. **Priority is behavioral, not arbitrary.** Critical = blocks progress. High = affects engines. Medium = informational with urgency. Low = ambient awareness.
3. **Severity escalation is time-based.** Same event can escalate from medium → high → critical over weeks.
4. **No duplicate states.** If a notification is snoozed, the engine does not re-send for 7 days.
5. **Solo vs team differentiation.** Some notifications only make sense in team context.

---

### Layer 1: Operational (EXISTING — 13 types)

These already work. No changes needed to trigger logic. Can add richer metadata.

| Type | Current Priority | Trigger | Action |
|------|-----------------|---------|--------|
| `nuevas_obvs` | medium | New OBV assigned | View OBV |
| `validaciones` | high | OBV needs peer validation | Validate OBV |
| `tareas` | medium | Task assigned | View task |
| `lead_inactive` | medium | Lead inactive 7d | View CRM lead |
| `task_overdue` | high | Task past due date | Update task |
| `validation_expiring` | high | OBV validation window closing | Validate now |
| `project_inactive` | medium | Project inactive 14d | Open project |
| `objective_near` | medium | KPI deadline approaching | View KPI |
| `welcome` | low | New project created | Start onboarding |
| `project_deleted` | high | Project deleted by admin | — |
| `role_accepted` | low | Team member accepted role | View member |
| `lead_won` | high | CRM lead marked won | Celebrate + next OBV |
| `obv_validated` | high | OBV peer-validated | View validated OBV |

---

### Layer 2: Phase Engine Notifications (NEW — 6 types)

| Type | Priority | Trigger | Action | Team Only? |
|------|----------|---------|--------|------------|
| `phase_score_warning` | medium | Phase score drops below 50% | Review outcomes | No |
| `phase_score_critical` | high | Phase score drops below 30% | Urgent review | No |
| `phase_advance_ready` | high | Score ≥75% + hard signal met | Confirm advance | No |
| `phase_advanced` | medium | Phase transition confirmed | View new phase goals | No |
| `phase_regression_warning` | high | 4 weeks below 50% | Take action | No |
| `phase_regressed` | critical | Phase decremented | Review + recover | No |

---

### Layer 3: Probability Engine Notifications (NEW — 4 types)

| Type | Priority | Trigger | Action | Team Only? |
|------|----------|---------|--------|------------|
| `probability_drop` | medium | Score drops >15 points in one week | Review inputs | No |
| `probability_critical` | high | Score < 30 for 2 consecutive weeks | Open Viability review | No |
| `probability_high` | low | Score ≥ 80 for first time | Celebrate + expand | No |
| `probability_input_zero` | high | Any single input drops to 0 | Fix specific input | No |

---

### Layer 4: Viability Engine Notifications (NEW — 5 types)

| Type | Priority | Trigger | Action | Team Only? |
|------|----------|---------|--------|------------|
| `viability_stagnation_warning` | high | 6 weeks below 50% probability | Review 3 paths | No |
| `viability_stagnation` | critical | 8 weeks below 50% probability | Choose a path | No |
| `viability_critical` | critical | 12 weeks below 50% / model not validated | Strategic review required | No |
| `viability_path_chosen` | medium | User selects one of 3 paths | Confirm + first action | No |
| `viability_recovery` | high | Recovery confirmed after stagnation | Celebrate + momentum | No |

---

### Layer 5: Organizational Engine Notifications (NEW — 6 types, team-focused)

| Type | Priority | Trigger | Action | Team Only? |
|------|----------|---------|--------|------------|
| `org_capacity_warning` | medium | Any member > 80% capacity | Redistribute tasks | Yes |
| `org_capacity_critical` | high | Any member > 95% capacity | Immediate rebalance | Yes |
| `org_bottleneck_detected` | high | Role > 60% of all active OBVs | View bottleneck + simulate | Yes |
| `org_role_empty_warning` | medium | Critical role empty 2+ weeks | Invite member OR reassign | Yes |
| `org_role_empty_critical` | high | Critical role empty 4+ weeks | Structural gap alert | Yes |
| `org_challenge_suggested` | medium | Bottleneck detected + no active challenge | Launch challenge | Yes |

---

### Notification Delivery Matrix

```
CHANNEL:        In-App    Slack     Email     Push
─────────────────────────────────────────────────
Layer 1 (Ops):    ✓         ✓         ○         ○
Layer 2 (Phase):  ✓         ✓         ✓         ○
Layer 3 (Prob):   ✓         ○         ○         ○
Layer 4 (Viab):   ✓         ✓         ✓         ○
Layer 5 (Org):    ✓         ✓         ○         ○

✓ = implemented/planned  ○ = future

EMAIL: Only for Layer 2 (phase transitions) and Layer 4 (viability alerts).
       These are too important to miss. Never email Layer 3 (noise risk).
```

### Notification Volume Control

```
MAX per day:     5 notifications (hard cap, prioritized by severity)
MAX per week:    15 notifications
SNOOZE:          Any notification snoozable for 7 days
ARCHIVE:         All notifications archivable (never deleted)
DIGEST:          Sunday weekly summary replaces individual Layer 3 notifs
```

---

## 10. Solo vs Team Adaptations

### 10.1 Phase Engine (Solo)

```
Solo adaptations:
  - Org bottleneck: skipped (no team to distribute to)
  - capacity_health: adjusted with solo_adjustment × 0.85
  - Role coverage: measured vs solo_critical_roles only

  Solo critical roles by phase:
    Fase 1: [strategy] (1 role needed)
    Fase 2: [sales, strategy] (2 roles needed — founder wears both hats)
    Fase 3: [sales, finance, operations] (3 roles — decision point: hire or stay solo)
    Fase 4: Optimus warns: "Escalar en solitario es un riesgo estructural"
```

### 10.2 Probability Engine (Solo)

```
capacity_health for solo:
  = individual_capacity_health × 0.85
  (solo founders are structurally at higher cognitive load)

execution_rate for solo:
  = tasks_completed_on_time / tasks_due
  (same formula — solo founders are held to same execution standard)

revenue_momentum for solo:
  = same formula
  (no team to hide behind — revenue signals are pure founder output)
```

### 10.3 Organizational Engine (Solo)

```
IF work_mode = 'individual':
  - Layer 5 notifications: SUPPRESSED (team-only)
  - Role simulation: SHOWN as "what if I hire someone for [role]?"
  - Bottleneck detection: SHOWN but framed as "You are the bottleneck in [area]"
  - Org health score: Simplified to capacity_health only
```

### 10.4 Notification Adaptation (Solo)

```
Solo receives: Layer 1 + Layer 2 + Layer 3 + Layer 4
Solo does NOT receive: Layer 5 Org notifications (except org_bottleneck_detected with solo framing)
Solo framing for bottleneck: "Estás asumiendo el 80% de las tareas de ventas.
  ¿Es tu prioridad correcta esta semana?" (not "add a person")
```

---

## 11. Implementation Gap Analysis

### Current State vs Target State

| Component | Current | Target | Gap Type |
|-----------|---------|--------|----------|
| Phase Engine | ❌ Does not exist | 4-phase with outcomes | **BUILD** |
| Probability Engine | ❌ Does not exist | 5-input formula | **BUILD** |
| Viability Engine | ❌ Does not exist | 3-state machine | **BUILD** |
| Organizational Engine | ❌ Partial (capacity exists in concept, no formula) | Full capacity + bottleneck | **BUILD** |
| Role metrics | ⚠️ Generic formula (same for all) | 6 differentiated formulas | **EXTEND** |
| Leader/Executor | ❌ leader_id missing from tasks table | Dual assignment | **EXTEND** |
| Notifications Layer 1 | ✅ 13 types working | No changes needed | — |
| Notifications Layer 2 | ❌ 0 types | 6 types | **BUILD** |
| Notifications Layer 3 | ❌ 0 types | 4 types | **BUILD** |
| Notifications Layer 4 | ❌ 0 types | 5 types | **BUILD** |
| Notifications Layer 5 | ❌ 0 types | 6 types | **BUILD** |
| metric_alerts table | ⚠️ Exists but orphaned | Connect to Probability Engine | **CONNECT** |
| Economic profile | ❌ Does not exist | 3-variable auto-detection | **BUILD** |
| Phase score → Probability | ❌ No connection | 35% weight input | **BUILD** |
| Role performance → Phase | ❌ No connection | 20% execution_health | **BUILD** |
| Bottleneck → Challenge | ❌ No connection | Auto-suggestion flow | **BUILD** |

### Database Changes Required

```sql
-- New tables:
CREATE TABLE project_phase_state (
  project_id UUID,
  current_phase INTEGER,  -- 1,2,3,4
  phase_score NUMERIC(5,2),
  phase_state TEXT,  -- saludable|friccion|critico
  phase_started_at TIMESTAMPTZ,
  hard_signal_met BOOLEAN DEFAULT FALSE,
  weeks_below_50 INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ
);

CREATE TABLE project_probability (
  project_id UUID,
  probability_score NUMERIC(5,2),
  fase_score NUMERIC(5,2),
  execution_rate NUMERIC(5,2),
  validation_strength NUMERIC(5,2),
  revenue_momentum NUMERIC(5,2),
  capacity_health NUMERIC(5,2),
  calculated_at TIMESTAMPTZ
);

CREATE TABLE project_viability_state (
  project_id UUID,
  viability_state TEXT,  -- saludable|estancamiento|critico
  weeks_in_current_state INTEGER DEFAULT 0,
  path_chosen TEXT,  -- null|pivot_segment|pivot_value|pause
  path_chosen_at TIMESTAMPTZ,
  last_evaluated_at TIMESTAMPTZ
);

CREATE TABLE project_economic_profile (
  project_id UUID,
  sales_cycle TEXT,  -- corto|medio|largo
  monetization_type TEXT,  -- transaccional|suscripcion|ticket_alto|recurrente_contractual
  capital_intensity TEXT,  -- bajo|medio|alto
  detected_at TIMESTAMPTZ,
  manually_overridden BOOLEAN DEFAULT FALSE
);

-- Extend existing tables:
ALTER TABLE tasks ADD COLUMN leader_id UUID REFERENCES profiles(id);

ALTER TABLE project_members ADD COLUMN performance_score_v2 NUMERIC(5,2);
-- (keep performance_score for backwards compat, new formula in v2)
```

### Edge Functions Required

```
New edge functions (Deno):
  compute-phase-score         -- Weekly recalc of Phase Engine
  compute-probability-score   -- Weekly recalc of Probability Engine
  evaluate-viability          -- Weekly check of Viability state
  compute-org-capacity        -- Weekly org health calc
  detect-economic-profile     -- Project creation + 4-week review
  trigger-engine-notifications -- Reads engine outputs → creates notifications
  suggest-bottleneck-challenge -- Org bottleneck → challenge proposal

Cron jobs (weekly, Sunday 23:00):
  1. compute-phase-score (all active projects)
  2. compute-probability-score (all active projects)
  3. evaluate-viability (all active projects)
  4. compute-org-capacity (all active projects)
  5. trigger-engine-notifications (process engine outputs → notify)
```

---

## 12. Engine Interaction Map

Full data flow showing how the 4 engines interact:

```
RAW DATA SOURCES
────────────────────────────────────────────────────────────────
tasks_completed  ──┐
OBVs_validated   ──┼──→ PHASE ENGINE ──────────────────────────┐
KPIs_met         ──┘    (Outcomes × weights = phase_score)      │
                                                                 │
CRM leads        ──┐                                            │
revenue_records  ──┼──→ ECONOMIC PROFILE ──→ adjust thresholds  │
product_type     ──┘                                            │
                                                                 │
├─── phase_score (35%) ─────────────────────────────────────────┤
│                                                                ↓
tasks_on_time ──────────── execution_rate (20%) ──→ PROBABILITY ENGINE
OBVs_quality ──────────── validation_strength (15%) ──→  (5-input formula)
revenue_trend ─────────── revenue_momentum (15%) ──→        │
org_health ─────────────── capacity_health (15%) ──────┐   │
                                                         │   │
project_members          ┌───────────────────────────────┘   │
role_assignments ──→ ORGANIZATIONAL ENGINE                    │
tasks_per_role         (capacity + bottleneck)                │
                              │                               │
                              ├──→ Layer 5 Notifications      │
                              ├──→ Challenge Suggestions      │
                              └──→ Role Simulation            │
                                                              │
                          probability_score ─────────────────→┤
                                                              ↓
                                                    VIABILITY ENGINE
                                                    (state machine)
                                                         │
                                                         ├──→ 3 Paths
                                                         └──→ Layer 4 Notifications

ALL ENGINES ──→ NOTIFICATION LAYER (5 layers, 34 types total)
               ──→ DASHBOARD SURFACE (phase indicator, probability arc)
               ──→ OPTIMUS ADVISOR (context for AI suggestions)
               ──→ WEEKLY REVIEW (Sunday digest)
```

---

## Appendix A: Engine Recalculation Schedule

```
FREQUENCY:          Weekly (Sunday 23:00 UTC project's timezone)
ORDER:              Org Engine → Phase Engine → Probability Engine → Viability Engine
REASON FOR ORDER:   Org capacity_health feeds Probability; Phase feeds Probability;
                    Probability feeds Viability.

ON-DEMAND:
  Phase score:      Recalc on OBV validated / task completed / KPI met
  Probability:      Recalc after any Phase score change
  Viability:        Recalc only on weekly schedule (avoid false alarms from noise)
  Org capacity:     Recalc on task assigned/completed, member added/removed
```

## Appendix B: Optimus Integration Points

Optimus (AI advisor) uses engine outputs as context for all recommendations:

```
Optimus context packet (injected per conversation):
{
  current_phase: 2,
  phase_score: 62,
  phase_state: "friccion",
  probability_score: 54,
  probability_trend: "declining",  // vs last week
  viability_state: "saludable",
  bottleneck_role: "sales",
  economic_profile: {
    sales_cycle: "medio",
    monetization: "suscripcion",
    capital: "bajo"
  },
  user_role: "strategy",
  weeks_in_current_phase: 6
}

This context makes Optimus respond differently:
- Phase 1 + Discovery → Design Thinking questions
- Phase 2 + low revenue_momentum → Lean Startup: "¿Cuándo fue el último intento de venta?"
- Bottleneck=sales → "Veo que ventas está sobrecargado. ¿Qué está bloqueando el cierre?"
- Viability stagnation → "Llevas 8 semanas en fricción. Hablemos de las 3 opciones."
```

## Appendix C: Weekly Review Digest Format

Every Sunday, the user receives a structured summary:

```
─────────────────────────────────────────
RESUMEN SEMANAL — [Project Name]
Semana [N] · Fase [1-4]: [Phase Name]
─────────────────────────────────────────

PROGRESO DE FASE
  Score actual:     [X]% ([Saludable/Fricción/Crítico])
  Outcome más bajo: [O.X.X — name] → [current value] / [target]
  Cambio vs semana: [↑+5% | ↓-3% | → sin cambio]

PROBABILIDAD DE ÉXITO
  ●●●●○  [score]/100
  Factor que más pesa: [input_name] ([value]%)

EJECUCIÓN DE LA SEMANA
  Tareas completadas: [N] de [M]
  OBVs validados:     [N]
  KPIs en verde:      [N] de [M]

PRÓXIMA SEMANA — TOP 3 ACCIONES
  1. [Auto-generated from lowest Outcome]
  2. [Auto-generated from bottleneck or low input]
  3. [User's own next task]
─────────────────────────────────────────
```

---

*Last updated: 2026-02-24*
*Author: Design session synthesis — ChatGPT (engine concepts) + Claude Code (implementation audit)*
*Status: DESIGN SPECIFICATION — implementation pending*
