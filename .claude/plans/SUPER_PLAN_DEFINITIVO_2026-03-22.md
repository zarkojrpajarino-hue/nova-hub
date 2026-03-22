# SUPER PLAN DEFINITIVO — Fusión v1 (57 items) + v3 (30 items) + Verificación

> Generado: 2026-03-22 · 15 agentes (6 producto + 6 código + 3 verificación) + datos externos
> Filtrado por: Devil's Advocate (falsos positivos eliminados) + ROI Calculator (priorizado)
> User Simulator: María 7/10, Carlos 6.5/10, Natalia 7.5/10

---

## SCORECARD DE SALUD (baseline para comparar con próxima ejecución)

| Dimensión | Nota | Delta vs anterior | Comentario |
|---|---|---|---|
| Seguridad | 5/10 | +1 (fixes B0) | 15-20 edge fn sin membership (no 63). RLS es escudo real |
| Performance | 7/10 | = | 8 queries/render. Bundle 164KB gzip (lazy-load parcial) |
| UX / Retención | 5/10 | = | Dashboard 20 componentes, onboarding 10Q. Score opaco |
| Monetización | 3/10 | = | 70% infra lista, ENABLE_PAYMENTS=false, 0 revenue |
| Datos | 4/10 | = | 8 tablas muertas, 0 cohort analysis |
| IA | 7/10 | = | Prompts buenos, $0.36/user, thresholds altos |
| Docs | 6/10 | +2 (fixes H7) | CLAUDE.md corregido, types.ts regenerado, MEMORY actualizado |
| Tests | 4/10 | = | 31% cobertura libs (11/36) |
| Arquitectura | 7/10 | = | 5 flujos E2E funcionales, 2 incompletos (Expansion en tab) |
| Escalabilidad | 6/10 | = | Tech debt 2.4 días. Crons sin stagger |
| **MEDIA** | **5.4/10** | **+0.5 vs 4.9** | Mejora por fixes B0+B7 ejecutados |

---

## RIESGOS DE NEGOCIO (Top 5)

| Riesgo | Prob. | Impacto | Mitigación | Bloque |
|---|---|---|---|---|
| 0 revenue en 90 días | 40% | Fatal | Activar ENABLE_PAYMENTS ahora | B2 |
| Founder churn D1 por score opaco | 55% | Alto | Score breakdown + acciones concretas | B3+B4 |
| Data breach (15-20 edge fn) | 10% | Crítico | Membership middleware | B1 |
| Notion copia Phase Engine en 18m | 20% | Alto | Acumular behavioral data + community | B8 |
| npm audit: 8 HIGH vulnerabilities | 15% | Medio | npm audit fix | B7 |

---

## KILL LIST (features a eliminar para ganar foco — consenso de 3 agentes)

| Feature | Razón | Ahorro | Cuándo revivir |
|---|---|---|---|
| Expansion Intelligence tab (Fase 0-2) | 0 usuarios en Fase 3+ | UX más limpia | Cuando haya datos de expansión |
| Masters Program / Community Voting | Gamificación sin usuarios | -2k líneas | ≥100 founders |
| Learning Roadmap (generate-learning-roadmap) | 0 evidence de consumo | -1 edge fn | Si founders la piden |
| Meeting Intelligence (Fase 0-2) | 53 tareas para 0 reuniones pre-revenue | Menos surfaces | Fase 3+ |
| Financial projections manuales | Causal/Runway lo hacen mejor | Simplifica Financiero tab | Cuando integración Stripe sea fuerte |

---

## EXPERIMENTOS PROPUESTOS (Top 3 A/B tests)

| Test | Hipótesis | Métrica | Duración |
|---|---|---|---|
| Checkpoint Checklist vs MomentBanner (Fase 0) | Acciones concretas retienen mejor que celebraciones | D7 retention +15% | 2 semanas |
| Onboarding 7Q vs 10Q | Menos preguntas = menos abandono | Completion rate +20% | 2 semanas |
| Pro trial 7d gratis vs modal estándar | Experimentar features premium convierte más | Trial→paid +36% | 45 días |

---

## PLAN DE EJECUCIÓN (fusionado, filtrado, priorizado por ROI)

### SEMANA 1 — FUNDACIÓN (€485, ~10h)

#### B0 — Emergencias (30 min) ✅ YA EJECUTADO
- [x] E0.1: Fix JSON.parse error handler
- [x] E0.2: Fix CHECK constraint trigger_source
- [x] E0.3: Fix evidence_mode schema
- [x] E0.4: Commitear 20 archivos

#### B0-v3 — Emergencias nuevas (45 min) ✅ EJECUTADO
- [x] Fix `ai-task-executor` variable shadowing en catch
- [x] ~~Fix `export-excel` auth~~ FALSO POSITIVO — archivo no existe
- [x] Responsive grid dashboard: `grid-cols-1 lg:grid-cols-12`
- [x] Tipo Project: añadir `paused_at`, `archived_at`, `created_by`
- [x] ~~Fix O4.3 NULL query~~ FALSO POSITIVO — frontend maneja correctamente
- [x] Fix optimus_profile thresholds: reducido 20% (>50→>35, >70→>55, >30→>25)

#### B1 — Seguridad (4h) — PARCIALMENTE EJECUTADO
- [x] Crear `verifyProjectMembership()` en `_shared/auth.ts`
- [ ] Aplicar a las 15-20 edge functions que ESCRIBEN datos (3h) ← PENDIENTE (requiere import en cada fn)
- [x] Fix `engine_versions` USING(true) FOR ALL → solo admin write (aplicado en BD)
- [ ] INSERT policies para 6 engine history tables (30 min) ← PENDIENTE

#### B6 — IA Optimización (3h) — PARCIALMENTE EJECUTADO
- [x] Downgrade: hiring→Haiku, strategic-cycle→Sonnet 3.5 (advisor pendiente)
- [ ] Validación JSON robusta en 5 edge functions (2h) ← PENDIENTE
- [ ] Cache generate-role-questions por role (30 min) ← PENDIENTE

#### H7 — Housekeeping (1h) ✅ PARCIALMENTE EJECUTADO
- [x] H7.1: Regenerar types.ts
- [x] H7.2: CLAUDE.md 0-4
- [x] H7.3: MEMORY.md actualizado
- [ ] H7.4: ENGINE_SPEC_V1.md con Phase 0 + graduation (30 min)
- [x] H7.5: Lazy-load Expansion + GeneratedBusiness
- [x] H7.6: staleTime en hooks
- [x] H7.8: npm audit fix (8 HIGH → 1 HIGH en xlsx)
- [ ] H7.9: Cron staggering: 14 jobs separados por 5 min (15 min) ← PENDIENTE

---

### SEMANA 1-2 — ACTIVACIÓN UX (€325, ~6.5h)

#### B3 — UX Simplificación
- [ ] U3.1: Fix Fase 0 "aha moment ausente" — añadir NextAction para Phase 0 (15 min) **← TOP 1 del Devil's Advocate**
- [ ] U3.2: Dashboard 2-fase: ocultar PhaseRoadmap+TeamRec+Risk+Probability en Fase 0-1 (2h)
- [ ] U3.3: Onboarding 10→7 preguntas: mover Q5(ticket)+Q6(sales_cycle) a post-onboarding (3h)
- [ ] U3.4: FirstStepsPanel: botones "Ir a [tab]" en vez de solo texto (1h)
- [ ] U3.5: TrialCountdownBanner: no mostrar Day 0, empezar en Day 3 (15 min)
- [ ] U3.6: Score breakdown: "Para subir necesitas: [acción] (+X%)" en PhaseRoadmap (2h) **← NUEVO v3**

---

### SEMANA 2-3 — REVENUE (€1,350, ~27h)

#### B2 — Monetización
- [ ] M2.1: Stripe webhooks edge function (1 día)
- [ ] M2.2: Trial auto-expiration cron (1h)
- [ ] M2.3: Resource enforcement RLS (2h)
- [ ] M2.4: ENABLE_PAYMENTS=true (1 línea)
- [ ] M2.5: Email triggers: day 3, 7, 10, 13 del trial (1 día)
- [ ] M2.6: Landing "First 100 Founders" (1 día)
- [ ] M2.7: Investor Summary (M14.V2.2) como paywall premium (1 día) **← 50% conversión**

---

### SEMANA 3-4 — PRODUCTO (€1,000, ~20h)

#### B4 — Feedback Loops
- [ ] P4.1: Task→Objective linking: al completar tarea, actualizar cycle_objective (1 día)
- [ ] P4.2: Retroactive Phase Detection: preguntas extra en onboarding existing (4h)
- [ ] P4.3: Moment History + Retry: tabla + widget + retry si no visto en 3d (4h)
- [ ] P4.4: Score impact per action: "esta acción sube score +X%" en NextAction (4h) **← NUEVO v3, pedido por User Simulator**

#### B5 — Datos Explotados
- [ ] D5.1: Lead Conversion Timeline (obv_pipeline_history) (4h)
- [ ] D5.2: Cycle Objective Progress tracker (cycle_objective_progress leído!) (3h)
- [ ] D5.3: Bottleneck Duration Alert (strategic_blocks >14d) (2h)
- [ ] D5.4: Data Completeness Widget ("qué dato te falta") (3h)

---

### SEMANA 4-5 — CALIDAD (€500, ~10h)

#### B9 — Items faltantes
- [ ] F9.1: get_profile_id() añadir auth check (5 min)
- [ ] F9.4: MemberOnboarding trigger en ProjectPage (1h)
- [ ] F9.6: Cron staggering (ya en H7.9)
- [ ] F9.10: useFounderTool mutation invalidar project-engine (5 min)
- [ ] F9.11: notifications.action_taken_at para medir weekly review engagement (1h)
- [ ] F9.14: Tests para canonical-hash, errorHandler, build-next-action (4h)

#### B10 — IA Guardrails (NUEVO v3)
- [ ] Validación salary_range vs benchmarks en hiring-guidance (30 min)
- [ ] Cap MRR projections a ±5x histórico en financial-projections (30 min)
- [ ] Añadir disclaimer "Consejo de IA, no de asesor legal/financiero" en advisor (15 min)
- [ ] Reescribir prompt hiring-guidance (el prompt mejorado ya está generado) (30 min)

---

### SEMANA 5+ — GROWTH (60 días)

#### B8 — Adquisición
- [ ] G8.1: Warm beta 50 founders (día 14-28)
- [ ] G8.2: Email triggers contextuales (día 28-45)
- [ ] G8.3: Viral referral: "Trae 3 miembros → -20% Pro" (día 30-45)
- [ ] G8.4: Product Hunt launch (día 60-75)
- [ ] G8.5: Partners: aceleradoras LATAM/EU (día 75-90)
- [ ] G8.6: Phase Graduation Celebration → tweet automático (viral) **← NUEVO v3**

---

## DEPENDENCIAS (qué bloquea qué)

```
B0 (emergencias) → TODO
B1 (seguridad) → B2 (monetización) — no cobrar sin seguridad
B3 (UX) → B8 (growth) — no adquirir sin activación
B2 (monetización) → B8 (growth) — no crecer sin cobrar
B4 (feedback loops) → retención long-term
B5 (datos) → B8 (growth) — dashboards dan razón para volver
```

---

## MÉTRICAS DE ÉXITO

| Métrica | Hoy | Meta D30 | Meta D90 |
|---|---|---|---|
| Usuarios registrados | ~5 | 50 | 300 |
| Usuarios pagando | 0 | 10-20 | 50-100 |
| MRR | €0 | €500-1K | €3K+ |
| Retención D7 | ~45% (est.) | 65% | 75% |
| Onboarding completion | ~55% (est.) | 75% | 85% |
| North Star (% Fase 3) | 0% | 10% | 25% |
| Scorecard salud | 5.4/10 | 7.0/10 | 8.0/10 |
| Tests | 1,842 | 1,900+ | 2,000+ |
| Bugs críticos | 5 | 0 | 0 |

---

## USER JOURNEYS (resumen del simulador)

| Founder | Satisfacción | Fix #1 que la sube |
|---|---|---|
| María (pre-revenue) | 7→8.5 | Score breakdown + "Primeros pasos" checklist |
| Carlos (3 clientes) | 6.5→8 | Path existing salta preguntas + acceptance criteria por acción |
| Natalia (20k MRR) | 7.5→9 | Expansion visible en dashboard + OKRs en ciclos |

---

## TOTAL CONSOLIDADO

| Concepto | Cantidad |
|---|---|
| Items totales | **72** (57 v1 + 30 v3 - 15 duplicados) |
| Ya ejecutados (B0+H7) | 10 |
| Pendientes | 62 |
| Falsos positivos filtrados | 5 |
| Esfuerzo dev total | ~14 días |
| Presupuesto | €3,500 |
| Kill list | 5 features |
| Experimentos | 3 A/B tests |
| Modelos predictivos posibles | 5 |
| Ahorro IA posible | -67% ($7.20→$2.40/mes) |
