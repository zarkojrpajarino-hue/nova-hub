# SUPER PLAN — Consolidado de 18 Agentes (2026-03-22)

> Basado en: 6 agentes de código + 6 operacionales + 6 de producto/estrategia.
> Priorizado por impacto real en retención y revenue.
> Cada item tiene: qué, por qué, esfuerzo, archivos, evidencia del agente que lo detectó.

---

## BLOQUE 0 — EMERGENCIAS (Día 0-1)
> Bugs que pueden causar crashes o vulnerabilidades en producción.

### E0.1 — Fix JSON.parse error handler roto en 3 edge functions
- **Qué:** `catch(_e)` pero referencia `error` (variable externa indefinida) → crash silencioso
- **Archivos:** `generate-tasks-v2/index.ts`, `ai-lead-finder/index.ts`, `generate-email-pitch/index.ts`
- **Fix:** Cambiar `if (error instanceof Response)` → `if (_e instanceof Response)` en cada catch
- **Esfuerzo:** 15 min
- **Agente:** Edge Functions (#5)

### E0.2 — Fix CHECK constraint trigger_source en project_probability_history
- **Qué:** No incluye `'onboarding_fast_track'` → INSERT falla si probability engine se llama con ese trigger
- **Fix:** `ALTER TABLE project_probability_history DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (trigger_source IN (..., 'onboarding_fast_track'))`
- **Esfuerzo:** 5 min (1 query SQL)
- **Agente:** SQL/BD (#1)

### E0.3 — Fix evidence_mode en generate-tasks-v2
- **Qué:** Línea 92 lee `validation.data.evidence_mode` pero el schema Zod solo define `projectId` → siempre `undefined`
- **Fix:** Añadir `evidence_mode: z.string().optional()` al schema O eliminar la línea
- **Esfuerzo:** 5 min
- **Agente:** Tests/Types (#7)

### E0.4 — Commitear 20 archivos de sesiones anteriores
- **Qué:** Bugfixes reales (Slack catch, Stripe invalidation), refactor DRY, anti-spam de agentes
- **Fix:** `git add` los 20 archivos + commit como housekeeping
- **Esfuerzo:** 10 min
- **Agente:** Uncommitted Files (#9)

---

## BLOQUE 1 — SEGURIDAD (Día 1-3)
> Vulnerabilidades que permiten acceso no autorizado a datos.

### S1.1 — Middleware compartido de membership verification para edge functions
- **Qué:** 63/80 edge functions no verifican que el usuario sea miembro del proyecto
- **Por qué:** Un usuario autenticado puede operar en proyectos ajenos
- **Fix:** Crear función shared `verifyProjectMembership(supabaseClient, projectId, userId)` en `_shared/auth.ts` e importarla en las 63 funciones
- **Esfuerzo:** 4h (crear shared + añadir import a las funciones más críticas: generate-*, analyze-*, ai-*)
- **Prioridad:** Las 15 funciones que ESCRIBEN datos primero, luego las de lectura
- **Agente:** Edge Functions (#4)

### S1.2 — RLS: añadir INSERT policies a tablas bloqueadas
- **Qué:** `objectives`, `user_playbooks`, `master_challenges` tienen RLS sin INSERT policy → escritura silenciosamente bloqueada
- **Fix:** CREATE POLICY para INSERT en cada tabla
- **Esfuerzo:** 30 min
- **Agente:** SQL/BD (#2)

### S1.3 — Validar `graduated` en generate-strategic-cycle
- **Qué:** Cualquier usuario puede generar ciclos para proyectos no graduados
- **Fix:** Añadir check `phaseState.graduated = true` antes de crear ciclo
- **Esfuerzo:** 15 min
- **Agente:** Arquitectura (#17)

---

## BLOQUE 2 — MONETIZACIÓN (Día 3-14)
> Activar pagos. Cada día sin esto = dinero perdido.

### M2.1 — Webhooks Stripe (Día 3-5)
- **Qué:** Handlers para `customer.subscription.created`, `invoice.paid`, `subscription.deleted`
- **Por qué:** Sin esto, upgrade no se procesa
- **Archivos:** Nueva edge function `stripe-webhooks/index.ts`
- **Esfuerzo:** 1 día
- **Agente:** Monetización (#18)

### M2.2 — Trial auto-expiration cron (Día 5)
- **Qué:** Cron que marca `status='expired'` cuando `trial_ends_at < NOW()`
- **Por qué:** Sin esto, trials son infinitos
- **Fix:** SQL function + pg_cron schedule diario
- **Esfuerzo:** 1h
- **Agente:** Monetización (#18)

### M2.3 — Resource enforcement backend (Día 5-6)
- **Qué:** RLS policy que bloquee INSERT si `current_X_count >= max_X` del plan
- **Por qué:** Sin esto, usuarios Free pueden exceder límites
- **Esfuerzo:** 2h (1 RLS policy por recurso: members, tasks, leads, obvs)
- **Agente:** Monetización (#18)

### M2.4 — Activar `ENABLE_PAYMENTS = true` (Día 7)
- **Qué:** Cambiar flag en `src/config/features.ts`
- **Por qué:** Activa FeatureGates, TrialCountdown, PlanLimits, LockedFeatureOverlay
- **Prerequisito:** M2.1 + M2.2 + M2.3 completados
- **Esfuerzo:** 1 línea de código
- **Agente:** Monetización (#18)

### M2.5 — Email triggers basados en Phase + Trial expiry (Día 8-10)
- **Qué:** Emails automáticos cuando: trial en día 11, fase 2→3, trial expirado
- **Por qué:** 70% del growth en SaaS viene de email triggers contextuales
- **Esfuerzo:** 1 día (edge function + templates)
- **Agente:** Monetización (#18)

### M2.6 — Landing "First 100 Founders" (Día 10-14)
- **Qué:** Página de acceso temprano con 3 testimonios + CTA
- **Por qué:** Canal de adquisición con 8-12% conversión esperada
- **Esfuerzo:** 1 día
- **Agente:** Monetización (#18)

---

## BLOQUE 3 — UX SIMPLIFICACIÓN (Día 7-14)
> Reducir fricción. Impacto directo en retención D1→D7.

### U3.1 — Dashboard 2-fase: minimalista si recién onboarded (Día 7-8)
- **Qué:** Si `!fastStartCompleted` o `weeksInPhase < 2`: solo NextActionFocusBlock + FirstStepsPanel + PhaseRoadmap
- **Por qué:** 12+ componentes simultáneos → 45-55% abandono D1
- **Archivos:** `ProjectDashboardTab.tsx` (condicional por `fastStartCompleted` + `currentPhase`)
- **Impacto:** +20% retención D7
- **Esfuerzo:** 2h
- **Agente:** UX (#13)

### U3.2 — Onboarding: reducir a 7 preguntas con 3 bloques (Día 8-9)
- **Qué:** Mover Q6 (ticket) y Q7 (sales cycle) a Week 2 (FaseBPanel). Agrupar en 3 bloques con checkpoints
- **Por qué:** 10 preguntas lineales → 30% abandono en Q3-Q7
- **Archivos:** `FaseACommon.tsx` (reordenar steps, eliminar 2, añadir visual de "Bloque 1 de 3")
- **Impacto:** +15% completación onboarding
- **Esfuerzo:** 3h
- **Agente:** UX (#13)

### U3.3 — FirstStepsPanel: botones contextuales a tabs (Día 9)
- **Qué:** Cada paso tiene botón "Ir a [tab]" en vez de solo texto
- **Por qué:** Usuario lee pero no sabe DÓNDE actuar → +25% conversión lectura→acción
- **Archivos:** `FirstStepsPanel.tsx`
- **Esfuerzo:** 1h
- **Agente:** UX (#13)

### U3.4 — PhaseRoadmap: esconder unlock checklist en Fase 0-1 (Día 9)
- **Qué:** En fases tempranas, solo mostrar score + barra de progreso. Sin locks ni condiciones detalladas
- **Por qué:** "Score 15%, necesitas 75% + señal dura" en Fase 0 es desmotivante
- **Archivos:** `PhaseRoadmap.tsx` (condicional `currentPhase >= 2` para mostrar checklist)
- **Esfuerzo:** 30 min
- **Agente:** UX (#13) + Product Strategy (#14)

### U3.5 — TrialCountdownBanner: no mostrar en Day 0 (Día 9)
- **Qué:** Mostrar a partir de Day 3, no en el primer login
- **Por qué:** Ansiedad inútil en Day 0 cuando el usuario aún explora
- **Archivos:** `TrialCountdownBanner.tsx` (condicional `daysElapsed >= 3`)
- **Esfuerzo:** 15 min
- **Agente:** UX (#13)

---

## BLOQUE 4 — PRODUCTO: FEEDBACK LOOPS (Día 14-21)
> Conectar acciones del founder con progreso visible.

### P4.1 — Task→Objective linking (Día 14-16)
- **Qué:** Al completar tarea, preguntar "¿Cumplió su objetivo?" + actualizar `cycle_objective.current_value`
- **Por qué:** Sin esto, founder completa 10 tareas pero score no sube → confusión total
- **Archivos:** `ProjectTasksTab.tsx` (modal post-completion), `useStrategicCycles.ts` (mutation update objective)
- **Impacto:** +25% retención (feedback loop visible)
- **Esfuerzo:** 1 día
- **Agente:** Product Strategy (#14)

### P4.2 — Retroactive Phase Detection (Día 16-17)
- **Qué:** En onboarding, preguntar "¿Cuántos clientes entrevistaste?" "¿Tienes MVP?" → calcular fase real
- **Por qué:** Founder con 5 clientes y 5k MRR no debería ver "Fase 0, runway 22 semanas"
- **Archivos:** `FastStartWizard.tsx` (preguntas adicionales), fast-track cascade ya existe
- **Impacto:** +20% retención (founder ve su situación real inmediatamente)
- **Esfuerzo:** 4h
- **Agente:** Product Strategy (#14)

### P4.3 — Moment History + Retry (Día 17-18)
- **Qué:** Tabla `moment_history` + widget "últimos 4 hitos" + retry si no visto en 3 días
- **Por qué:** Celebraciones se pierden si founder no abre la app esa semana
- **Archivos:** Nueva tabla + `MomentBanner.tsx` (history view), `useMomentDetector.ts` (retry logic)
- **Impacto:** +15% retención
- **Esfuerzo:** 4h
- **Agente:** Product Strategy (#14)

### P4.4 — Task Reflection post-completación (Día 18-19)
- **Qué:** Al completar tarea, Haiku genera "qué aprendiste" + "next micro-task"
- **Por qué:** Engagement +40% porque feedback loop semanal vs "tarea desaparece"
- **Coste IA:** $0.00005/task (Haiku)
- **Esfuerzo:** 4h (nueva edge function + modal en task completion)
- **Agente:** AI/LLM (#15)

---

## BLOQUE 5 — DATOS: EXPLOTAR TABLAS MUERTAS (Día 21-28)
> Convertir data muerta en insights accionables.

### D5.1 — Lead Conversion Timeline (obv_pipeline_history)
- **Qué:** Dashboard card: "frio→tibio en <7d = 42% cierre" con datos reales del proyecto
- **Por qué:** 350+ cambios/mes en esta tabla, CERO queries la leen
- **Archivos:** Nuevo componente `LeadConversionInsights.tsx`, query a `obv_pipeline_history`
- **Esfuerzo:** 4h
- **Agente:** Data Model (#16)

### D5.2 — Cycle Objective Progress tracker
- **Qué:** Dashboard dentro de CycleDashboard que muestra progreso semanal por objetivo
- **Por qué:** `cycle_objective_progress` se inserta cada semana pero nunca se lee
- **Archivos:** `CycleDashboard.tsx` (sección adicional con chart Recharts)
- **Esfuerzo:** 3h
- **Agente:** Data Model (#16)

### D5.3 — Bottleneck Duration Alert
- **Qué:** Cuando un `strategic_block` lleva >14 días activo, mostrar alerta proactiva
- **Por qué:** "Cash block >14 días = 89% regresión" — dato predictivo que existe pero no se usa
- **Archivos:** Nuevo moment type en `moment-detector.ts` + query a `strategic_blocks`
- **Esfuerzo:** 2h
- **Agente:** Data Model (#16)

### D5.4 — Data Completeness Widget ("qué dato te falta")
- **Qué:** Widget que muestra "Para subir tu score necesitas: registrar costes (D2), añadir 3 OBVs (D1)"
- **Por qué:** `data_completeness_score` existe pero el founder no sabe QUÉ dato falta
- **Archivos:** Nuevo componente `DataCompletenessGuide.tsx`
- **Esfuerzo:** 3h
- **Agente:** Data Model (#16)

---

## BLOQUE 6 — OPTIMIZACIÓN IA (Día 14-21, en paralelo con Bloque 4)
> Reducir costes sin perder calidad.

### I6.1 — Downgrade 3 funciones a Haiku/Sonnet 3.5
- **Qué:** `ai-business-advisor` → Haiku, `generate-strategic-cycle` → Sonnet 3.5, `generate-hiring-guidance` → Haiku
- **Por qué:** Ahorro -30% en costes LLM sin pérdida de calidad
- **Esfuerzo:** 30 min (cambiar model string en 3 archivos)
- **Agente:** AI/LLM (#15)

### I6.2 — Validación robusta de JSON en 5 edge functions
- **Qué:** Envolver JSON.parse en try-catch con logging del raw content + schema validation
- **Archivos:** `analyze-competitors`, `enrich-project-intelligence`, `analyze-meeting`, `calculate-lead-score`
- **Esfuerzo:** 2h
- **Agente:** AI/LLM (#15)

### I6.3 — Cache de generate-role-questions por role
- **Qué:** Si mismo role + mismo proyecto → retornar cache en vez de llamar LLM
- **Por qué:** Preguntas de rol son 90% iguales entre proyectos del mismo tipo
- **Esfuerzo:** 1h
- **Agente:** AI/LLM (#15)

---

## BLOQUE 7 — HOUSEKEEPING (Día 1-3, en paralelo)
> Limpieza técnica y documental.

### H7.1 — Regenerar types.ts
- **Qué:** `npx supabase gen types typescript --project-id zzxngvqwmnouchbulvlo > src/integrations/supabase/types.ts`
- **Por qué:** 5 tablas + 11 columnas nuevas sin tipos
- **Esfuerzo:** 5 min (1 comando)
- **Agente:** Supabase Types (#11)

### H7.2 — Actualizar CLAUDE.md: "1-4" → "0-4"
- **Qué:** Corregir rango de fases en la documentación del proyecto
- **Por qué:** CLAUDE.md alimenta a futuros agentes/developers — info incorrecta causa bugs
- **Esfuerzo:** 2 min
- **Agente:** Specs/Docs (#10)

### H7.3 — Actualizar MEMORY.md: 6 datos incorrectos
- **Qué:** profiles (no members), 50 hooks (no 42), 473 tsx (no 456), 80 edge fn (no 50+)
- **Esfuerzo:** 5 min
- **Agente:** Memory (#8)

### H7.4 — Actualizar ENGINE_SPEC_V1.md con Phase 0 + graduation
- **Qué:** Añadir spec de Phase 0, fast-track, graduated, entry_mode
- **Esfuerzo:** 30 min
- **Agente:** Specs/Docs (#10)

### H7.5 — Lazy-load ExpansionIntelligencePage + GeneratedBusinessDashboard
- **Qué:** Convertir imports estáticos en `React.lazy()` en ProjectPage.tsx
- **Por qué:** Entry point 164KB gzip — estos 2 componentes contribuyen sin necesidad
- **Esfuerzo:** 15 min
- **Agente:** Bundle Size (#12)

### H7.6 — Añadir staleTime a useStrategicCycles + useRolePermissions
- **Qué:** `staleTime: 10 * 60_000` para ciclos, `30 * 60_000` para permisos
- **Por qué:** Refetch innecesario en cada render
- **Esfuerzo:** 5 min
- **Agente:** Hooks (#3)

### H7.7 — Añadir error handling (onError + toast) a 5 hooks nuevos
- **Qué:** useRolePermissions, useExpansionReadiness, useMomentDetector, useStrategicCycles (queries)
- **Esfuerzo:** 30 min
- **Agente:** Hooks (#3)

---

## BLOQUE 8 — GROWTH (Día 14-90)
> Plan de adquisición de los primeros 100 usuarios pagando.

### G8.1 — Warm beta 50 founders (Día 14-28)
- Invitar por email/Twitter/comunidad Latam
- Instrucciones de uso + feedback form
- Objetivo: 0 pagos, solo validación de flujo

### G8.2 — Email triggers contextuales (Día 28-45)
- "Tu proyecto llegó a Fase 2 — necesitas CRM" (upgrade moment)
- "Te quedan 3 días de trial" (urgency)
- Conversión esperada: 15-20%

### G8.3 — Product Hunt launch (Día 60-75)
- Objetivo: 100-200 upvotes, 200-300 signups
- Conversión esperada: 5-8% = 10-25 pagos

### G8.4 — Partners (aceleradoras, angels) (Día 75-90)
- "Regala 10 Pro trials a tus portfolios, 20% comisión 12 meses"
- Esperado: 5-8 partners, 3-10 pagos

### G8.5 — Investor Summary (M14.V2.2) como paywall premium (Día 45-60)
- Gate behind Pro: "exportar PDF con métricas para inversores"
- Conversión esperada: 50%+ (founder levantando dinero)

---

## BLOQUE 9 — ITEMS FALTANTES (detectados en revisión cruzada)
> Items que los agentes reportaron pero no entraron en bloques 0-8.

### Seguridad adicional

#### F9.1 — `get_profile_id()` SECURITY DEFINER sin auth.uid()
- **Qué:** Permite enumerar IDs de usuarios sin restricción
- **Fix:** Añadir `IF auth.uid() IS NULL THEN RAISE EXCEPTION` al inicio
- **Esfuerzo:** 5 min
- **Agente:** SQL/BD (#3)

#### F9.2 — `slack_webhooks` SELECT con USING(true)
- **Qué:** URLs de webhooks de Slack visibles para todos los autenticados
- **Fix:** Restringir a miembros del proyecto
- **Esfuerzo:** 15 min
- **Agente:** SQL/BD (#9)

#### F9.3 — Rate limiting en scrape-and-extract + export-excel
- **Qué:** Funciones costosas sin rate limit → abuso DoS posible
- **Fix:** Añadir `checkRateLimit()` con preset `AI_GENERATION`
- **Esfuerzo:** 30 min
- **Agente:** Edge Functions (#11)

### Flujos rotos

#### F9.4 — MemberOnboarding no se triggerea en flujo de invitación
- **Qué:** `MemberOnboarding.tsx` existe pero InvitePage redirige a `/proyecto/:id` sin onboarding
- **Fix:** En ProjectPage, detectar `role_accepted=false && !role_profile` → mostrar MemberOnboarding
- **Esfuerzo:** 1h
- **Agente:** UX (#13) + Arquitectura (#6)

#### F9.5 — CycleDashboard no lazy-loaded
- **Qué:** Import estático en ProjectDashboardTab → incluido siempre en bundle
- **Fix:** `React.lazy(() => import('./CycleDashboard'))` + Suspense
- **Esfuerzo:** 15 min
- **Agente:** Bundle Size (#12)

### Performance

#### F9.6 — Cron jobs sin staggering (14 crons potencialmente colisionando)
- **Qué:** 14 pg_cron schedules, muchos a las 00:00 UTC domingo
- **Fix:** Espaciar en intervalos de 15 min (00:00, 00:15, 00:30...)
- **Esfuerzo:** 30 min (14 ALTER de schedule)
- **Agente:** SQL/BD (#10)

#### F9.7 — Dashboard: queries duplicadas (useProjectEngineData 2x, useActiveCycle 2x)
- **Qué:** React Query deduplica por queryKey, pero los hooks se ejecutan 2 veces por render
- **Fix:** Extraer los datos compartidos a un solo hook padre o memoizar
- **Esfuerzo:** 2h
- **Agente:** Arquitectura (#22)

### Tipos y consistencia

#### F9.8 — Tipo `Project` sin `paused_at`/`archived_at`
- **Qué:** Componentes usan cast `(project as Record<string, unknown>).paused_at`
- **Fix:** Añadir `paused_at?: string | null; archived_at?: string | null` al interface Project
- **Esfuerzo:** 10 min
- **Agente:** Frontend (#16)

#### F9.9 — null check inconsistente en `phase_state` (`?.` vs `!`)
- **Qué:** ProjectPage.tsx usa `!` en un lugar y `?.` en otro para `phase_state`
- **Fix:** Unificar a `?.` con fallback
- **Esfuerzo:** 5 min
- **Agente:** Frontend (#25)

#### F9.10 — useFounderTool mutation no invalida project-engine
- **Qué:** Después de tool execution, dashboard de fase puede estar desincronizado
- **Fix:** Añadir `queryClient.invalidateQueries({ queryKey: ['project-engine', projectId] })` en onSuccess
- **Esfuerzo:** 5 min
- **Agente:** Hooks (#14)

### Datos y métricas de producto

#### F9.11 — Weekly Review engagement metrics (`notifications.leida_at`)
- **Qué:** Sin `leida_at` ni `action_taken_at`, imposible medir si weekly reviews impulsan cambios
- **Fix:** ALTER TABLE notifications ADD COLUMN action_taken_at TIMESTAMPTZ
- **Esfuerzo:** 15 min (migración) + 1h (tracking en frontend)
- **Agente:** Data Model (#16)

#### F9.12 — Cohort Analysis queries (data existe pero nunca se cruza)
- **Qué:** `entry_mode × model_type × team_composition × data_maturity` → correlaciones valiosas
- **Fix:** SQL view materializada + dashboard "Benchmarking vs Peers"
- **Esfuerzo:** 1 día (post-launch, requiere N≥30 proyectos)
- **Agente:** Data Model (#16)

### Documentación

#### F9.13 — COMPLETE_SCHEMA.sql desactualizado (generado 2026-02-21)
- **Qué:** No refleja tablas de Fases 23-28 (5 tablas nuevas, 11 columnas nuevas)
- **Fix:** Regenerar desde BD real: `pg_dump --schema-only`
- **Esfuerzo:** 10 min
- **Agente:** Specs/Docs (#10)

### Tests

#### F9.14 — 22/33 archivos de lógica pura sin tests (67% sin cobertura)
- **Qué:** Funciones críticas sin test: `build-next-action.ts`, `agent-synthesis.ts`, `context-aggregator.ts`, `canonical-hash.ts`
- **Fix:** Escribir tests para los 5 más críticos
- **Esfuerzo:** 4h (5 archivos × ~45 min)
- **Agente:** Tests/Types (#16)

### Producto (post-launch)

#### F9.15 — Scenario Simulator ("si cambio precio 20%, ¿qué pasa?")
- **Qué:** Feature diferenciadora que respondería "show me the math"
- **Por qué:** Wedge competitivo fuerte (Competitive agent)
- **Esfuerzo:** 2-3 días (edge function + modal)
- **Agente:** Competitive (#17)

#### F9.16 — Comparative Benchmarking ("vs otros en tu etapa")
- **Qué:** Anónimo, requiere N≥100 proyectos en misma etapa/sector
- **Por qué:** Competencia psicológica = motivación = retención
- **Esfuerzo:** Post-launch (requiere datos reales de cohort)
- **Agente:** Competitive (#17) + Data Model (#16)

---

## TIMELINE VISUAL

```
Día  0  ░░ BLOQUE 0: Emergencias (E0.1-E0.4)
Día  1  ░░ BLOQUE 1: Seguridad (S1.1-S1.3) + BLOQUE 7: Housekeeping (H7.1-H7.7)
Día  3  ▓▓ BLOQUE 2: Monetización (M2.1-M2.6)
Día  7  ▓▓ BLOQUE 3: UX Simplificación (U3.1-U3.5)
Día 14  ██ BLOQUE 4: Feedback Loops (P4.1-P4.4) + BLOQUE 6: IA Optimización (I6.1-I6.3)
Día 21  ██ BLOQUE 5: Explotar Datos (D5.1-D5.4)
Día 28  ▒▒ BLOQUE 8: Growth (G8.1-G8.5)
Día 90  🎯 META: 50-100 usuarios pagando, €3,050 MRR
```

---

## MÉTRICAS DE ÉXITO

| Métrica | Baseline (hoy) | Meta D30 | Meta D90 |
|---|---|---|---|
| Usuarios registrados | ~5 (beta) | 50 | 300 |
| Usuarios pagando | 0 | 10-20 | 50-100 |
| MRR | €0 | €500-1,000 | €3,000+ |
| Retención D7 | ~45% (estimado) | 65% | 75% |
| Onboarding completion | ~55% (estimado) | 75% | 85% |
| North Star (validations/week) | 0 | 2+/proyecto | 5+/proyecto |
| Tests | 1,842 | 1,900+ | 2,000+ |
| Bugs críticos abiertos | 9 | 0 | 0 |

---

## RESUMEN EJECUTIVO

| Bloque | Items | Esfuerzo | Impacto |
|---|---|---|---|
| 0. Emergencias | 4 | 30 min | Previene crashes |
| 1. Seguridad | 3 | 5h | Cierra vulnerabilidades |
| 2. Monetización | 6 | 3 días | Activa revenue |
| 3. UX | 5 | 1 día | +20% retención D7 |
| 4. Feedback Loops | 4 | 2 días | +60% retención estimado |
| 5. Datos | 4 | 12h | Insights accionables |
| 6. IA Optimización | 3 | 3h | -30% costes LLM |
| 7. Housekeeping | 7 | 2h | Deuda técnica limpia |
| 8. Growth | 5 | 60 días | 50-100 usuarios pagando |
| 9. Faltantes | 16 | 2 días | Cierra gaps cruzados |
| **TOTAL** | **57 items** | **~12 días dev + 60 días growth** | **€3,000+ MRR** |
