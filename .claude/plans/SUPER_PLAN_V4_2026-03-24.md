# SUPER PLAN V4 -- Analisis Completo 2026-03-24

> 6 agentes, 15 roles expertos, codebase completo analizado
> Ejecucion anterior: v3 (2026-03-22) -- 72 items, scorecard 5.4/10
> Esta ejecucion: v4 -- post UI PERFECTA, post verificacion completa

---

## SCORECARD DE SALUD (v4 vs v3)

| Dimension | v3 (03-22) | v4 (03-24) | Delta | Comentario |
|---|---|---|---|---|
| Seguridad | 5/10 | 5/10 | = | 31/42 edge fn sin sanitizacion. Role permissions solo frontend. |
| Performance | 7/10 | 7/10 | = | 12-18 queries/dashboard. Entry chunk 313KB gzip. |
| UX / Retencion | 5/10 | 6/10 | +1 | UI PERFECTA completa. Pero NextAction enterrado en pos 5. |
| Monetizacion | 3/10 | 3/10 | = | Infra lista, ENABLE_PAYMENTS=false, 0 revenue. |
| Datos | 4/10 | 4/10 | = | 13 tablas AI-output sin frontend. 6 tablas muertas. |
| IA | 7/10 | 7/10 | = | 42 funciones LLM, $0.36/user. 11 sin safeJsonParse. |
| Docs | 8/10 | 8/10 | +2 vs v3 | CLAUDE.md actualizado, TASK_LIST verificado, planes actualizados. |
| Tests | 4/10 | 4/10 | = | 18/38 lib files sin tests. |
| Arquitectura | 7/10 | 7/10 | = | 5 E2E flows conectados. 16 queries a tabla `members` inexistente. |
| Escalabilidad | 6/10 | 6/10 | = | Tech debt 30.5 dev-days. |
| **MEDIA** | **5.4/10** | **5.7/10** | **+0.3** | Mejora por UI PERFECTA + docs |

---

## BUGS CRITICOS (fix inmediato)

| # | Bug | Archivo | Linea | Severidad |
|---|---|---|---|---|
| 1 | 16 queries a tabla `members` inexistente | useValidationSystem.ts, ExplorationDashboard.tsx, +6 | Multiple | CRITICO |
| 2 | FeatureGate.tsx: t() fuera de componente React | FeatureGate.tsx | 88-146 | CRITICO |
| 3 | 14 edge functions sin entry en config.toml (auth ES256 fail) | config.toml | -- | CRITICO |
| 4 | .env tiene API key Anthropic expirada | .env | -- | ALTO |
| 5 | generate-testimonial: crea claims atribuidos a personas | generate-testimonial/index.ts | 45-71 | ALTO (legal) |
| 6 | 31/42 funciones IA sin sanitizacion de inputs | Multiple edge fn | -- | ALTO |
| 7 | 11 edge fn con JSON.parse sin safeJsonParse | Multiple | -- | ALTO |
| 8 | Task/OBV mutations no invalidan engine queries (scores stale) | useTaskMutations.ts | 26-32 | MEDIO |
| 9 | N+1 waterfall en useMyPendingValidations | useValidationSystem.ts | 147-208 | MEDIO |
| 10 | OptimusProfileCard: import duplicado SourceBadge | OptimusProfileCard.tsx | 12,15 | BAJO |

---

## UX CRITICO: REORDENAR DASHBOARD

### Problema central
NextActionFocusBlock (el "aha moment") esta en posicion 5 del dashboard, detras de:
1. TrialCountdownBanner (ansiedad)
2. FirstStepsPanel (300px de setup)
3. FaseBPanel (400px de formulario)
4. MomentBanner (celebraciones)

Un founder Day 1 que no hace scroll NUNCA ve la inteligencia del sistema.

### Orden propuesto (por fase)

**FASE 0-1 (Zen Mode, primeros 7 dias):**
```
1. MomentBanner (solo si hay celebracion)
2. NextActionFocusBlock (HERO, 60% viewport)
3. FirstStepsPanel (compacto, 3 cards lado a lado)
4. Stats Grid (solo stats con valor > 0)
```
HIDDEN: FaseBPanel (collapsed), TrialCountdown (hasta D7), Engine panels, ProbabilityBreakdown, RiskBreakdown, WhatIfSimulator

**FASE 2:**
Anade: PhaseRoadmap, ExecutionTrends, PipelineVelocity, DataCompletenessCard

**FASE 3:**
Anade: ProbabilityBreakdown, RiskBreakdown, TeamHeatmap, InvestorSummary

**FASE 4:**
Todo visible.

### 10 Reglas de presentacion de valor

1. Nunca mostrar un score sin mostrar la accion que lo mejora
2. Mostrar progreso antes que gaps (3/10 completados, no 7 faltantes)
3. Zero no es valor -- reemplazar con CTA ("Crea tu primera OBV")
4. Cada feature bloqueada debe decir QUE desbloquea, no solo que esta bloqueada
5. Celebrar el camino, no solo el destino (micro-celebraciones intermedias)
6. Un CTA por estado de pantalla, nunca tres
7. Complejidad se gana con uso -- revelar gradualmente
8. El motor debe sentirse como coach, no como juez ("Ganando traccion" no "Friccion")
9. Datos estimados deben verse diferentes de datos verificados
10. Contexto temporal > estado actual ("Score: 42%, +8pts este mes")

---

## KILL LIST (consenso de 5 agentes)

| Feature | Razon | Ahorro | Cuando revivir |
|---|---|---|---|
| WhatIfSimulator | Pearson con N=4 es estadisticamente invalido | -1 componente, -1 lib | Si hay 12+ semanas de datos |
| OptimusProfileCard | Meta-data de IA que no aporta al founder | -1 componente | Nunca (integrar en Settings) |
| 22 edge functions zombie | Cold starts, superficie ataque, coste mantenimiento | -22 archivos | Si usuarios las piden |
| 10 preview modals (.tsx.bak) | Dead files en src/components/preview/ | -10,000 lineas | Nunca |
| 13 tablas AI-output sin frontend | Datos que nadie lee | Reducir coste IA | Cuando se cree UI para ellos |
| generate-testimonial | Riesgo legal: claims atribuidos sin consentimiento | -1 edge fn | Con guardrails estrictos |

---

## TOP 5 FEATURES MAS VALIOSAS (proteger)

1. **Phase Engine + NextAction** -- "Que hacer ahora" personalizado. MOAT real.
2. **Generative Business Ideas** -- Captura pre-founders (TAM expansion masivo).
3. **Moment Detector** -- Celebraciones + coaching proactivo. Retencion pura.
4. **Phase-Adaptive UI** -- Progressive disclosure. 5 items en F0, 20+ en F4.
5. **Fast-Track Detection** -- Founders con revenue saltan fases. Zero friccion.

---

## MEJORAS POR FASE PARA MAXIMIZAR VALOR

### FASE 0 (Exploracion)
- Mover NextAction al TOP del dashboard
- Eliminar stats con valor 0 (reemplazar con CTAs)
- Ocultar TrialCountdown hasta D7
- Anadir micro-celebracion: "Primera tarea creada!"

### FASE 1 (Validacion problema)
- FaseBPanel collapsed por defecto
- Score impact visible junto a NextAction ("1 OBV validada sube score ~15%")
- Teaser enriquecido en sidebar: "CRM se desbloquea cuando tengas leads cualificados"

### FASE 2 (Validacion solucion)
- PhaseRoadmap como momento revelacion (primera vez visible)
- DataCompletenessCard para explicar scores bajos (no es mal rendimiento, es data faltante)
- ExecutionTrends primera aparicion (4+ semanas de datos)

### FASE 3 (Revenue)
- ProbabilityBreakdown + RiskBreakdown visibles por primera vez
- InvestorSummary en sidebar
- Celebrar revenue milestones (1k, 5k, 10k MRR) con confetti
- Corregir MRR milestones de EUR hardcoded a moneda del usuario

### FASE 4 (Crecimiento)
- Todo visible
- FunctionDelegationHint para founders solos
- GraduationCelebration + CycleDashboard reemplazan PhaseRoadmap

---

## OPTIMIZACION IA (ahorro 60-70%)

| Accion | Funciones | Ahorro |
|---|---|---|
| Downgrade a Haiku | 10 funciones (SWOT, geo, weekly, suggest, etc.) | 92% por funcion |
| Eliminar zombies | 22 funciones sin uso | 100% |
| Consolidar vendor | 2 funciones OpenAI -> Haiku | Consolidar |
| Aplicar safeJsonParse | 11 funciones sin proteccion | Prevenir crashes |
| Aplicar sanitizePromptInput | 31 funciones sin sanitizacion | Prevenir injection |
| Cachear respuestas | Solo 1 funcion cachea (analyze-v4) | Reducir calls repetidas |

**Coste estimado actual:** ~$0.36/user/mes
**Coste post-optimizacion:** ~$0.12/user/mes

---

## MONETIZACION -- PLAN DE ACCION

### Pricing recomendado (ajustado del actual)
- **Starter ($0):** Subir AI calls de 10 a 20 (el usuario hace 5-8 en setup)
- **Pro ($19/mo):** Bajar de $29. Incluye integraciones + 100 AI calls + 10 miembros
- **Scale ($49/mo):** Bajar de $79. Incluye benchmarking + API + 500 AI calls

### Faltante para activar pagos
1. Crear edge function `create-checkout-session` (Stripe Checkout)
2. Configurar Stripe products/price IDs
3. Implementar contador real de AI calls
4. Resolver inconsistencia PLAN_LIMITS vs PLAN_TIERS en features.ts
5. Activar ENABLE_PAYMENTS=true

### North Star Metric
**OBVs validadas por proyecto por semana** -- proxy mas fuerte de engagement real.

---

## SEGURIDAD -- ACCIONES PRIORITARIAS

1. Aplicar `sanitizePromptInput()` a las 31 funciones sin proteccion
2. Anadir las 14 edge functions faltantes a config.toml con verify_jwt=false
3. Implementar role permissions en RLS (no solo frontend)
4. Reescribir generate-testimonial con guardrails (nunca inventar claims)
5. Eliminar market-research que inventa datos de mercado

---

## ARQUITECTURA -- DEUDA TECNICA (30.5 dev-days)

| Categoria | Dias | Prioridad |
|---|---|---|
| Fix 16 `.from('members')` -> `profiles` | 2 | P0 |
| Migrar 18 imports de useNovaData a Optimized | 5 | P1 |
| Agregar staleTime a 16 hooks sin el | 1 | P1 |
| Server-side role permissions (RLS) | 5 | P1 |
| Tests para 18 lib files sin cobertura | 8 | P2 |
| Fix type casts (30+ `as any`) | 3 | P2 |
| Eliminar query keys duplicados | 3 | P2 |
| Fix FeatureGate.tsx t() bug | 0.5 | P0 |
| Agregar invalidacion engine en mutations | 2 | P1 |
| Error handling visible en 6+ vistas | 1 | P2 |

---

## FEATURE PROPUESTA: "Investor Update" one-click

**Que:** Auto-generar email mensual para inversores con datos del Phase Engine (score, risk, probability) + financiero + OBVs.

**Por que:**
1. Accountability externa -> el founder NECESITA actualizar datos para enviar el update
2. Viral loop: inversor ve la herramienta, recomienda a portafolio
3. Convierte vitamin en painkiller
4. Los datos ya existen en useAgentContext()
5. Bajo esfuerzo (1 edge function + 1 componente)

---

## EXPERIMENTOS PROPUESTOS

| Test | Hipotesis | Metrica | Duracion |
|---|---|---|---|
| NextAction en posicion 1 vs posicion 5 | "Ver la siguiente accion primero aumenta D1 completion" | first_action_completed rate | 2 semanas |
| Onboarding 3Q vs 4Q (eliminar pais) | "Menos preguntas = mas completions" | onboarding_completion | 2 semanas |
| Pro $19/mo vs $29/mo | "Precio mas bajo = mas conversiones netas" | trial_to_paid rate | 45 dias |
| Daily push D1-D7 vs weekly email | "Push diario retiene mas que email semanal" | D7 retention | 2 semanas |

---

## PLAN 90 DIAS A 100 USUARIOS PAGOS

### S1-2: Foundation
- Fix bugs criticos (members, FeatureGate, config.toml)
- Reordenar dashboard (NextAction al top)
- Implementar Zen Mode D1-D7
- Crear create-checkout-session edge function
- Configurar Stripe (Pro $19, Scale $49)

### S3-4: Metering + Nudges
- Contador AI calls real
- 3 upgrade nudges (10a llamada, 3er miembro, 2o proyecto)
- Weekly digest automatico (cron + email)
- PostHog funnel: signup -> onboarding -> first_obv -> upgrade

### S5-6: Landing + Beta
- Landing con demo interactiva (DemoMode pre-signup)
- 10-20 beta users como "founding members" (50% off lifetime)
- ProductHunt "coming soon"
- Cold outreach a 50 founders YC/Antler/Seedcamp

### S7-8: Launch
- ProductHunt launch
- Twitter/LinkedIn founder thread
- 3 blog posts (Phase Engine, AI coach, Why tools fail Phase 0)
- Oferta: Pro $9/mo primer ano (100 primeros)

### S9-10: Community
- Discord/Slack founders
- Weekly Office Hours
- Case study primer usuario Fase 0->3
- Partnership 2 incubadoras

### S11-12: Optimization
- PostHog: que feature activa conversion a pago
- A/B tests precio + trial length
- Referral program
- Target: 100 usuarios pagos

### S13: Iterate
- Kill 5 features sin uso
- Downgrade 10 funciones a Haiku
- Redirigir ahorro a acquisition
