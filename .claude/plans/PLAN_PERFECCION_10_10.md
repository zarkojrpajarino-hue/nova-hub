# PLAN PERFECCIÓN 10/10 — Optimus-K

> Generado: 2026-03-23 · Basado en Súper Análisis v4 (22 agentes)
> Objetivo: llevar TODAS las dimensiones del scorecard a 10/10
> Scorecard actual: 4.5/10 media
>
> Principio: lo más barato y de mayor impacto primero. Sin excusas.

---

## SCORECARD ACTUAL → OBJETIVO

| Dimensión | Actual | Objetivo | Gap | Esfuerzo |
|-----------|--------|----------|-----|----------|
| Seguridad | 4/10 | 10/10 | +6 | Alto |
| Performance | 6/10 | 10/10 | +4 | Medio |
| UX / Retención | 4/10 | 10/10 | +6 | Alto |
| Monetización | 3/10 | 10/10 | +7 | Alto |
| Tests | 4/10 | 10/10 | +6 | Alto |
| IA | 7/10 | 10/10 | +3 | Medio |
| CI/CD | 2/10 | 10/10 | +8 | Medio |
| Arquitectura | 5/10 | 10/10 | +5 | Alto |
| Docs | 6/10 | 10/10 | +4 | Bajo |
| Escalabilidad | 4/10 | 10/10 | +6 | Alto |
| **MEDIA** | **4.5** | **10** | **+5.5** | |

---

## SPRINT 0 — EMERGENCIAS (4h) ⚡
> Cosas que deben hacerse ANTES de cualquier otra cosa.
> Sin estas, el producto no puede ir a producción.

- [ ] **S0.1** `npm uninstall xlsx papaparse pdf-parse` — vuln HIGH + unused + -7.2MB (1h)
  > Reemplazar exportData.ts con CSV puro (sin librería)
- [ ] **S0.2** Sourcemaps → hidden: `sourcemap: 'hidden'` en vite.config.ts (10min)
- [ ] **S0.3** CORS: añadir dominio de producción a ALLOWED_ORIGINS en cors-config.ts (15min)
- [ ] **S0.4** Stripe webhook: implementar verificación de firma con Stripe SDK (3h)
  > El código ya lee stripe-signature y WEBHOOK_SECRET — solo falta la verificación

**Score después de S0:** Seguridad 5/10 (+1)

---

## SPRINT 1 — SEGURIDAD → 10/10 (20h)

### Bloque A — Auth (8h)
- [ ] **S1.1** Añadir validateAuth() a las 18 edge functions sin auth (8h)
  > Lista: analyze-expansion-v1, deploy-to-vercel, generate-hiring-guidance,
  > generate-learning-roadmap, generate-playbook, generate-project-roles,
  > generate-tasks-v2, export-excel, + 10 más del grep

### Bloque B — Prompt Injection (12h)
- [ ] **S1.2** Aplicar sanitizeInput() de ai-prompt-sanitizer.ts a las ~10 funciones que reciben input libre del usuario (6h)
  > Prioridad: ai-business-advisor, ai-lead-finder, ai-career-coach,
  > generate-email-pitch, ai-task-executor
- [ ] **S1.3** Añadir output validation (JSON parse + fallback) a las 48 funciones AI (4h)
- [ ] **S1.4** deploy-to-vercel: reemplazar CORS '*' con cors-config.ts compartido (1h)
- [ ] **S1.5** Rotar service_role_key y Anthropic API key (expuestas en git history) (1h)

### Bloque C — Rate Limiting (4h)
- [ ] **S1.6** Añadir rate limiting a las 54 edge functions que no lo tienen (4h)
  > Usar el rate-limiter-persistent.ts que ya existe. Presets: AI_GENERATION para LLM calls.

**Score después de S1:** Seguridad 10/10

---

## SPRINT 2 — CI/CD → 10/10 (16h)

- [ ] **S2.1** Crear .github/workflows/ci.yml (4h)
  ```yaml
  on: [push, pull_request]
  jobs:
    lint: npm run lint
    build: npm run build
    test: npx vitest run
  ```
- [ ] **S2.2** Fix 165 tests failing — crear mock i18n correcto en vitest setup (6h)
  > Causa raíz: tests buscan texto en español, i18n devuelve keys.
  > Fix: mock useTranslation que retorna la key como valor.
- [ ] **S2.3** Crear workflow de deploy edge functions (4h)
  > Script que despliega las funciones cambiadas (diff-based, no todas cada vez)
- [ ] **S2.4** Crear workflow de deploy Vercel + migration check (2h)

**Score después de S2:** CI/CD 10/10, Tests 6/10 (+2)

---

## SPRINT 3 — TESTS → 10/10 (24h)

- [ ] **S3.1** Fix los 13 TODOs de "Fase 7" (upgrade/Stripe) en componentes (4h)
  > AddLeadButton, InviteButton, NovaSidebar, DemoBanner, etc.
- [ ] **S3.2** Fix useEvidenceGeneration — quitar "TODO" como dato real (2h)
  > Línea 175: value: 'TODO: Extract from AI generation' → implementar o quitar
- [ ] **S3.3** Fix useDocumentUpload — implementar o eliminar PDF/XLSX parsing stubs (2h)
- [ ] **S3.4** Añadir tests para paths críticos sin cobertura (12h):
  > Auth flow, integration connect/sync, Optimus context, buildNextAction,
  > compute_execution_trends, detect_financial_risks
- [ ] **S3.5** Target: 0 failing, ≥80% cobertura en libs críticas (4h)
  > Actualmente: 31% en libs. Objetivo: 80%.

**Score después de S3:** Tests 10/10

---

## SPRINT 4 — UX / RETENCIÓN → 10/10 (32h)

### Bloque A — First Impression (8h)
- [ ] **S4.1** WelcomeModal → migrar TODO el contenido a t() (3h)
  > Strings hardcodeados en líneas 38-50. Importa useTranslation pero no lo usa.
- [ ] **S4.2** Onboarding: reducir Fase A de 8 a 4 preguntas esenciales (3h)
  > Mantener: industry, revenue model, team_size, main_challenge
  > Mover el resto a "completar después"
- [ ] **S4.3** Crear "Instant Diagnostic" post-onboarding (2h)
  > Basado solo en las 4 respuestas: generar 3 insights inmediatos con AI
  > "Tu mayor riesgo es X", "Tu ventaja es Y", "Primer paso: Z"

### Bloque B — Dashboard Day 1 (8h)
- [ ] **S4.4** Mejorar EmptyStateDashboard con checklist interactiva (4h)
  > En vez de "conecta herramienta" genérico: checklist personalizada
  > "□ Conecta Stripe (tu MRR se calcula automáticamente)"
  > "□ Crea tu primera tarea (activa insights de ejecución)"
  > Progreso visible: "2/5 pasos para desbloquear Optimus"
- [ ] **S4.5** Quick Actions en dashboard (2h)
  > Botones de acción rápida: "Nueva tarea", "Registrar venta", "Ver análisis"
  > Sin tener que navegar por 25 sidebar items
- [ ] **S4.6** Modo solo founder (2h)
  > Si team_size=1 en onboarding: ocultar Team section del sidebar (5 items menos)
  > Sidebar pasa de 25 a 20 items automáticamente

### Bloque C — Sidebar (8h)
- [ ] **S4.7** Reducir sidebar de 25 a 8 items principales (4h)
  > Core: Dashboard, Tareas, OBVs, Financiero, Análisis IA, Integraciones, Equipo, Config
  > Todo lo demás: sub-menús colapsables o accesible desde las páginas principales
- [ ] **S4.8** Progressive disclosure por fase (4h)
  > Fase 0-1: solo 5 items visibles
  > Fase 2+: desbloquea Financiero, Análisis IA
  > Fase 3+: desbloquea Equipo avanzado, CRM

### Bloque D — Retention Loop (8h)
- [ ] **S4.9** Email semanal automático con resumen (4h)
  > Edge function + Resend: "Esta semana: 5 tareas completadas, MRR +8%, 1 insight nuevo"
  > Trigger: cron semanal lunes 9am
- [ ] **S4.10** Push notification / in-app notification cuando hay insight nuevo (2h)
  > "Optimus detectó: tu pipeline está estancado. Ver análisis →"
- [ ] **S4.11** Gamification: streak de días activos + badges (2h)
  > "5 días consecutivos" badge. Sutil, no invasivo.

**Score después de S4:** UX/Retención 10/10

---

## SPRINT 5 — PERFORMANCE → 10/10 (16h)

- [ ] **S5.1** Code splitting: sacar i18n locales del main chunk (2h)
  > Dynamic import de locale files. -2MB del main chunk.
- [ ] **S5.2** Lazy load Recharts (2h)
  > Charts solo se cargan cuando el usuario navega a una vista con gráficos
- [ ] **S5.3** Lazy load DnD (hello-pangea) (1h)
  > Solo necesario en Kanban views
- [ ] **S5.4** Consolidar preview modals (4h)
  > 10 modals de 700-1400 líneas → extraer data fetching a hooks, UI a componentes shared
- [ ] **S5.5** Añadir useMemo/useCallback a los 20 componentes más pesados (3h)
  > Dashboard cards, charts, lists con recálculos frecuentes
- [ ] **S5.6** Composite indexes en BD para queries frecuentes (2h)
  > obvs(project_id, status, es_venta), tasks(project_id, status, fecha_limite),
  > key_metrics(project_id, date)
- [ ] **S5.7** Eliminar 6 componentes dead code confirmados (1h)
  > AnimatedKPICard, ContextualExample, OnboardingStepGuide, etc.
- [ ] **S5.8** Eliminar @anthropic-ai/sdk de devDependencies (10min)

**Score después de S5:** Performance 10/10

---

## SPRINT 6 — ARQUITECTURA → 10/10 (24h)

- [ ] **S6.1** Crear repositories para módulos sin repo (8h)
  > Meetings, Cycles, Financial, Integrations, Settings, Development, Rotation
  > Cada uno: single file con queries tipadas, reemplaza supabase.from() directo
- [ ] **S6.2** Migrar 55 llamadas directas de componentes → hooks/repos (8h)
  > Prioridad: componentes de dashboard, integraciones, financiero
- [ ] **S6.3** Consolidar/eliminar 34 edge functions zombie (4h)
  > Verificar cuáles son cron/trigger-invoked vs dead code
  > Eliminar las que no tienen invocador
- [ ] **S6.4** QueryKey factory centralizada (2h)
  > Un archivo queryKeys.ts con todas las keys tipadas
  > Evita invalidaciones inconsistentes
- [ ] **S6.5** Consolidar migraciones: squash las 150 en ~20 migraciones limpias (2h)
  > Solo para desarrollo local. Producción mantiene las 150 (ya aplicadas).

**Score después de S6:** Arquitectura 10/10

---

## SPRINT 7 — IA → 10/10 (12h)

- [ ] **S7.1** Actualizar precios en aiLogger.ts (30min)
  > Añadir claude-sonnet-4-6, claude-haiku-4-5. Fix precios obsoletos.
- [ ] **S7.2** Output validation en todas las funciones AI (4h)
  > Wrapper: tryParseJSON(response) → fallback si no es JSON válido
- [ ] **S7.3** Downgrade a Haiku las 15 funciones simples (2h)
  > testimonial, hiring-guidance, learning-roadmap, role-questions, checklist, etc.
  > Ahorro: ~30% del coste AI total
- [ ] **S7.4** Implementar streaming para funciones AI largas (3h)
  > analyze-project-v4, generate-complete-business: mostrar output progresivo
- [ ] **S7.5** Token budget enforcement por proyecto/mes (2h)
  > Limitar a X tokens/proyecto/mes según plan (Free: 10K, Pro: 100K, Scale: 500K)
- [ ] **S7.6** Caching de respuestas AI similares (30min)
  > ai_analysis_cache ya existe. Extender patrón a generate-business-ideas, etc.

**Score después de S7:** IA 10/10

---

## SPRINT 8 — MONETIZACIÓN → 10/10 (24h)

> PREREQUISITO: Sprint 0 item S0.4 (Stripe webhook firma) DEBE estar hecho.

- [ ] **S8.1** Definir tiers finales (2h)
  > Free: 1 proyecto, 3 miembros, 10 AI calls/mes, analytics 30d
  > Pro ($29/mes): 5 proyectos, 10 miembros, 100 AI calls/mes, 1 año analytics, integraciones
  > Scale ($79/mes): Unlimited, 500 AI calls, benchmarking, API, priority
- [ ] **S8.2** Configurar Stripe Products + Prices (2h)
  > Crear products en Stripe Dashboard, configurar precios mensuales/anuales
- [ ] **S8.3** ENABLE_PAYMENTS = true + verificar flujo completo (4h)
  > Checkout → webhook → activar plan → FeatureGate → upgrade/downgrade
- [ ] **S8.4** Resolver 13 TODOs de "Fase 7" (upgrade hints) (4h)
  > Los 13 componentes con // TODO: Implementar upgrade en Fase 7
- [ ] **S8.5** Upgrade hints contextuales (4h)
  > Cuando el usuario intenta acceder a AI Analysis Nivel 3 → "Upgrade a Pro para desbloquear"
  > Cuando genera 10/10 AI calls → "Has usado tu límite Free. Upgrade para más."
- [ ] **S8.6** Trial 7 días Pro gratis al registrarse (4h)
  > Auto-activar trial. Al día 5: email "Tu trial termina en 2 días."
- [ ] **S8.7** Landing page "First 100 Founders" (4h)
  > Página simple: pitch + pricing + CTA de registro
  > Deploy en /pricing o landing page separada

**Score después de S8:** Monetización 10/10

---

## SPRINT 9 — ESCALABILIDAD → 10/10 (16h)

- [ ] **S9.1** Fix N+1 en useNovaDataOptimized (4h)
  > Filtrar queries por project_id actual, no traer TODOS los datos
- [ ] **S9.2** Paginación en queries de leads, tasks, obvs (4h)
  > Limit + offset con infinite scroll o pagination component
- [ ] **S9.3** Connection pooling para edge functions (2h)
  > Verificar que Supabase client reutiliza conexiones
- [ ] **S9.4** Edge function consolidation: combinar funciones similares (4h)
  > generate-* funciones que hacen lo mismo con prompts diferentes → 1 función con parámetro
- [ ] **S9.5** Implementar pg_stat_statements monitoring (2h)
  > Activar extensión para identificar queries lentas en producción

**Score después de S9:** Escalabilidad 10/10

---

## SPRINT 10 — DOCS → 10/10 (8h)

- [ ] **S10.1** Actualizar MEMORY.md (1h)
  > 92 edge functions (no 80), hooks count, component count
- [ ] **S10.2** Actualizar feature_matrix.md (2h)
  > Incluir F17-F31 features, estados actuales
- [ ] **S10.3** Actualizar ENGINE_SPEC_V1.md o crear V2 (2h)
  > Documentar los engines post-F4 (Cycles, Trends, Financial Intelligence)
- [ ] **S10.4** Crear ARCHITECTURE.md (2h)
  > Diagrama de capas, módulos, dependencias, patterns usados
- [ ] **S10.5** Actualizar TASK_LIST.md header con estado real (1h)
  > "Última actualización: 2026-03-23"

**Score después de S10:** Docs 10/10

---

## RESUMEN TOTAL

| Sprint | Dimensión | Horas | De → A |
|--------|-----------|-------|--------|
| S0 | Emergencias | 4h | Prerequisito |
| S1 | Seguridad | 20h | 4 → 10 |
| S2 | CI/CD | 16h | 2 → 10 |
| S3 | Tests | 24h | 4 → 10 |
| S4 | UX/Retención | 32h | 4 → 10 |
| S5 | Performance | 16h | 6 → 10 |
| S6 | Arquitectura | 24h | 5 → 10 |
| S7 | IA | 12h | 7 → 10 |
| S8 | Monetización | 24h | 3 → 10 |
| S9 | Escalabilidad | 16h | 4 → 10 |
| S10 | Docs | 8h | 6 → 10 |
| **TOTAL** | **10 dimensiones** | **196h** | **4.5 → 10** |

## ORDEN DE EJECUCIÓN

```
S0 (4h) → S1 (20h) → S2 (16h) → S3 (24h) → S8 (24h) → S4 (32h) → S5 (16h) → S7 (12h) → S6 (24h) → S9 (16h) → S10 (8h)
```

**Por qué este orden:**
1. S0: emergencias — sin esto nada más importa
2. S1: seguridad — sin esto no puedes ir a producción
3. S2: CI/CD — sin esto cada cambio posterior es un riesgo
4. S3: tests — con CI/CD los tests ahora tienen valor
5. S8: monetización — genera revenue CUANTO ANTES
6. S4: UX — retiene a los usuarios que S8 atrae
7. S5-S10: refinamiento progresivo
