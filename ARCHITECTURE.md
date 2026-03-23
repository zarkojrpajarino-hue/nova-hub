# Architecture -- Nova Hub (Optimus-K)

> **Version:** 3.0
> **Last Updated:** 2026-03-23
> **Status:** Production Ready

---

## Layer Diagram

```
+---------------------------------------------------------+
|                    Presentation Layer                     |
|  Pages (44) / Views (21) / Components (~473 .tsx files) |
+---------------------------+-----------------------------+
                            |
+---------------------------v-----------------------------+
|                      Hooks Layer                         |
|  ~50 custom hooks (React Query 5 + custom logic)        |
|  Query keys: src/lib/queryKeys.ts                       |
+---------------------------+-----------------------------+
                            |
+---------------------------v-----------------------------+
|                    Service Layer                          |
|  5 services: KPI, OBV, Lead, Task, Activity             |
+---------------------------+-----------------------------+
                            |
+---------------------------v-----------------------------+
|                   Repository Layer                        |
|  5 repositories (Supabase query builders)               |
+---------------------------+-----------------------------+
                            |
+---------------------------v-----------------------------+
|                   Database Layer                          |
|  Supabase PostgreSQL + RLS + 92 Edge Functions (Deno)   |
+---------------------------------------------------------+
```

---

## Layer Responsibilities

| Layer | Directory | Responsibility |
|-------|-----------|---------------|
| Pages | `src/pages/` | Route-level layout, page-level data orchestration (44 pages) |
| Views | `src/pages/views/` | Feature-specific views rendered within pages (21 views) |
| Components | `src/components/` | UI building blocks, forms, modals, widgets (~473 files) |
| Hooks | `src/hooks/` | Data fetching (React Query), mutations, computed state (~50 hooks) |
| Services | `src/services/` | Business logic: KPI, OBV, Lead, Task, Activity |
| Repositories | `src/repositories/` | Direct Supabase query construction |
| Contexts | `src/contexts/` | Global state: CurrentProject, DemoMode, Navigation, Search |
| Lib | `src/lib/` | Utilities, AI helpers, evidence system, engine constants, queryKeys |
| Config | `src/config/` | Feature flags (ENABLE_PAYMENTS), PLAN_TIERS, PLAN_LIMITS |
| Types | `src/types/` | Shared TypeScript type definitions |
| i18n | `src/i18n/` | Translations: ES (source), EN, FR, DE, PT, IT |

**Rules:**
- Components should NOT import `supabase` directly -- use hooks/services.
- Business logic belongs in services, not components.
- All visible strings use `t()` from react-i18next.

---

## Module Map

| Module | Layers | Key Files |
|--------|--------|-----------|
| Dashboard | Pages, Components, Hooks | `DashboardView.tsx`, `SmartAlertsWidget.tsx`, `useNovaDataOptimized.ts` |
| CRM / Leads | Pages, Components, Hooks, Services | `CRMView.tsx`, `useCRMPipeline.ts`, `useCRMData.ts` |
| OBVs | Components, Hooks, Services | `obv-form/`, `useOBVFormLogic.ts` |
| KPIs | Pages, Components, Hooks, Services | `KPIsView.tsx`, `usePendingValidations.ts` |
| Tasks | Pages, Components, Hooks | `TasksView.tsx`, `CreateTaskButton.tsx`, `AITaskExecutor.tsx` |
| Engine (Phase/Risk/Probability) | Hooks, Edge Functions | `useNovaDataOptimized.ts` (engine hooks), `analyze-project-v4` |
| Strategic Cycles | Pages, Components, Hooks | `CycleDashboard.tsx`, `useStrategicCycles.ts`, `ResetSurface.tsx` |
| Meetings | Pages, Components, Hooks, Edge Fns | `MeetingsView.tsx`, `useMeetings.ts`, `analyze-meeting` |
| Analytics | Pages, Components, Hooks | `AnalyticsView.tsx`, `useExecutionTrends.ts` |
| Financial | Pages, Components, Hooks, Edge Fns | `FinancieroView.tsx`, `useFinancialIntelligence.ts`, `ScenarioBuilder.tsx` |
| Integrations | Components, Hooks, Edge Fns | `integrations/*.tsx`, `useIntegrationConnections.ts` |
| Subscription | Components, Hooks, Config | `subscription/*.tsx`, `useSubscription.ts`, `features.ts` |
| Development | Pages, Components, Hooks | `MiDesarrolloView.tsx`, `useDevelopment.ts` |
| Founder Toolkit | Pages, Components, Hooks, Edge Fns | `FounderToolkitView.tsx`, `useFounderTool.ts` |
| Expansion | Components, Hooks, Edge Fns | `ExpansionIntelligencePage.tsx`, `useExpansionReadiness.ts` |
| Proactive Intelligence | Components, Hooks | `MomentBanner.tsx`, `useMomentDetector.ts` |

---

## Edge Function Categories (92 total)

Deployed as Deno Edge Functions in `supabase/functions/`.
Full audit: `docs/EDGE_FUNCTION_AUDIT.md`

| Category | Count | Examples |
|----------|-------|---------|
| AI Generation | ~25 | `generate-business-ideas`, `generate-tasks-v2`, `generate-buyer-persona-v2` |
| Analysis / Intelligence | ~8 | `analyze-project-v4`, `analyze-meeting`, `analyze-expansion-v1` |
| Integration Connect | 8 | `connect-asana`, `connect-slack`, `connect-stripe` |
| Integration Sync | 8 | `sync-asana`, `sync-slack`, `sync-stripe` |
| Agents | 4 | `agent-synthesis`, `ai-career-coach`, `ai-task-executor`, `ai-task-router` |
| Cron / Background | 5 | `competitor-intelligence-cron`, `auto-sync-finances`, `trial-email-triggers` |
| Utility | ~6 | `export-excel`, `send-slack-notification`, `stripe-webhooks` |
| Zombie (unused) | 22 | Candidates for removal (see audit) |

**Shared utilities** (`supabase/functions/_shared/`):
- `cors.ts` -- CORS headers
- `validateAuth.ts` -- JWT validation (ES256, manual since verify_jwt incompatible)
- `rateLimiter.ts` -- Per-user rate limiting
- `aiLogger.ts` -- AI call logging with cost estimation per model

**Edge function pattern:**
```
CORS check -> Auth (validateAuth) -> Rate limit -> Validate input
-> Fetch context from DB -> Call LLM (Claude) -> Log via aiLogger
-> Save to DB -> Return response
```

---

## Data Flow: Key Operations

### 1. Project Analysis (AI)

```
User clicks "Analyze" in AnalysisChat
  -> useProjectAnalysis.ts calls supabase.functions.invoke('analyze-project-v4')
    -> Edge function fetches project context from DB
    -> Checks ai_analysis_cache (TTL-based)
    -> If miss: calls Claude API (claude-sonnet-4-6)
    -> Logs via aiLogger (ai_generations_log table)
    -> Caches result in ai_analysis_cache
    -> Returns structured analysis
  -> Hook updates React Query cache
  -> UI renders analysis
```

### 2. Strategic Cycle Reset

```
User completes ritual in ResetSurface.tsx
  -> useSubmitRitual calls supabase.rpc('submit_strategic_reset')
    -> SQL function closes current cycle (progress/stagnation/regression)
    -> Creates new cycle N+1
    -> Updates phase_score, execution metrics
  -> onSuccess invalidates: project-engine, project_context, ritual-pending
  -> UI updates: Focus Block, PhaseRunwayIndicator, CycleDashboard
```

### 3. Integration Sync

```
User connects provider via integration UI
  -> connect-{provider} edge function stores encrypted credentials
  -> sync-{provider} fetches data from external API
  -> Maps to integration_entities table
  -> Updates sync_runs status
  -> useIntegrationConnections hook refetches
```

---

## Query Key Architecture

All React Query cache keys defined in **`src/lib/queryKeys.ts`**.

Pattern: `[domain, ...params]`

Key domains: `projects`, `engine`, `members`, `tasks`, `leads`, `obvs`, `kpis`,
`validations`, `notifications`, `meetings`, `cycles`, `development`, `masters`,
`financial`, `integrations`, `generative`, `founderTool`, `roleRotation`,
`settings`, `subscription`, `agent`.

Invalidation uses prefix matching (e.g., invalidating `['project-engine', id]` clears all engine sub-queries for that project).

---

## Auth and Security

- **Auth:** Supabase Auth with JWT (ES256 algorithm)
- **Edge functions:** `verify_jwt: false` + manual `validateAuth()` (ES256 incompatibility)
- **RLS:** Enabled on all tables
- **Roles:** `admin`, `tlt`, `member` (in `user_roles` table)
- **Project scope:** `project_members` table gates per-project access
- **Encryption:** Integration credentials encrypted via `pgcrypto` (schema `extensions`)
- **Rate limiting:** Per-user limits in edge functions via `rateLimiter.ts`

---

## State Management

| Type | Technology | Scope |
|------|-----------|-------|
| Server state | React Query 5 (TanStack) | All Supabase data |
| Global UI state | React Context (4 contexts) | CurrentProject, DemoMode, Navigation, Search |
| Form state | React Hook Form + Zod | Form inputs and validation |
| URL state | React Router 6 | Project selection, views, params |
| Persistence | localStorage | Current project, user preferences |

---

## Monetization Architecture

Tier definitions in `src/config/features.ts` (`PLAN_TIERS`):
- **Starter** (free): 1 project, 3 members, 10 AI calls
- **Pro** ($29/mo): 5 projects, 10 members, 100 AI calls, integrations
- **Scale** ($79/mo): unlimited projects/members, 500 AI calls, API, benchmarking

Gating components:
- `FeatureGate` -- wraps premium features with lock/overlay/demo modes
- `LockedFeatureOverlay` -- glassmorphism lock screen
- `PlanLimitsIndicator` -- usage bars in sidebar
- `TrialCountdownBanner` -- trial expiry countdown

All gating is controlled by `ENABLE_PAYMENTS` flag (currently `false`).

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Total components | ~473 .tsx files |
| Custom hooks | ~50 |
| Edge functions | 92 (65 active, 5 cron, 22 zombie) |
| Translations | 6 languages |
| Phases closed | 30/31 |
| Integration providers | 8 |

---

**Last Updated:** 2026-03-23
