# EXPERIENCE MATRIX -- Optimus-K

> Documento autoritativo: que ve cada usuario, en cada fase, con cada rol.
> Fuente de verdad: `src/lib/experience-engine.ts` + `src/lib/phase-features.ts`
> Ultima actualizacion: 2026-03-25

---

## ESTADO DEL SISTEMA

```
Engine core:          HECHO — getDashboardConfig + getSidebarConfig + transitions
Dashboard (ruta real):ACTIVO — DashboardAdapter montado en DashboardView.tsx
Sidebar:              ACTIVO — NovaSidebar usa getSidebarConfig() con role filtering
Role filtering:       ACTIVO — dashboard (engine + KPI Grid legacy) + sidebar
Project fetch:        OPTIMIZADO — query directa por projectId (no useProjects)
Zen mode:             SEGURO — no flash en carga (daysActive=-1 hasta project load)
teamMode:             ACTIVO — solo/team/hiring desde onboarding_data
hasIntegrations:      ACTIVO — query real integration_connections
kpiCount:             ACTIVO — query real kpis via memberIds (profiles.id confirmado)
conversion_rate:      ACTIVO — leads_ganados real / leadsCount (no fake)
Tests:                136/136 passing (3 test suites)
Agujeros abiertos:    0 (6 auditados, todos cerrados o confirmados no-agujero)
```

### Arquitectura actual de la ruta real

```
/proyecto/:id/ (DashboardView.tsx)
  |
  +-- NovaHeader
  +-- [Banners condicionales: EmptyState, Onboarding (<7d), Revenue]
  +-- DashboardAdapter <-- EXPERIENCE ENGINE
  |     |-- PRIMARY zone (max 6 blocks above fold)
  |     |-- SECONDARY zone (max 3 blocks below fold)
  |     '-- DEEP zone (sidebar/navigation)
  +-- [Zen dismiss button]
  +-- Quick Actions (3 shortcuts)
  +-- Legacy widgets (KPI Grid, Chart, Alerts, Rankings, Validaciones)
  |
NovaSidebar.tsx
  '-- getSidebarConfig(phase, macroRole, teamMode, teamSize) + phaseConfig fallback
```

### Sidebar: campos reales vs hardcoded

`getSidebarConfig()` solo lee 4 campos. Los otros 10 estan hardcoded a defaults en NovaSidebar.

| Campo | Valor en NovaSidebar | Leido por getSidebarConfig |
|---|---|---|
| **phase** | REAL (usePhaseFeatures) | SI — decide visible/teaser/hidden por fase |
| **macroRole** | REAL (useRolePermissions + resolveMacroRole) | SI — Growth hide financial, Ops hide CRM |
| **teamMode** | REAL (isSoloMode) | SI — solo founders ven team items como teaser |
| **teamSize** | REAL (projectContext.teamSize) | SI — <=1 + solo = team items hidden/teaser |
| dataMaturity | 'minimal' (hardcoded) | NO — no se lee |
| daysActive | 0 (hardcoded) | NO — no se lee |
| isZenMode | false (hardcoded) | NO — no se lee |
| totalOBVs | 0 (hardcoded) | NO — no se lee |
| totalLeads | 0 (hardcoded) | NO — no se lee |
| totalTasks | 0 (hardcoded) | NO — no se lee |
| hasRevenue | false (hardcoded) | NO — no se lee |
| hasIntegrations | false (hardcoded) | NO — no se lee |
| kpiCount | 0 (hardcoded) | NO — no se lee |
| phaseSCore | 0 (hardcoded) | NO — no se lee |

**LIMITACION:** Si getSidebarConfig se expande para usar dataMaturity o daysActive,
se rompera silenciosamente. Solucion futura: crear getSidebarConfigLight(phase, macroRole, teamMode, teamSize).

---

## 22 ESCENARIOS

### Con tests completos (7 — 3 suites, 136 tests total)

| # | Escenario | Tests | Suite |
|---|---|---|---|
| 1 | Founder P1 Solo | 12+10 | engine.test + scenarios.test + real-route.test |
| 2 | Founder P2 Rich | 6+7+9 | engine.test + scenarios.test + real-route.test |
| 3 | Growth P2 | 7+9 | engine.test + scenarios.test + real-route.test |
| 4 | Founder P0 Zen | 4+4 | engine.test + scenarios.test (budget) |
| 5 | Ops P3 | 3+9 | engine.test + real-route.test |
| 6 | Ops P3 (budget) | 4 | scenarios.test |
| 7 | Founder P4 Graduated | 4 | scenarios.test (budget) |

### Definidos pero sin tests individuales (15)

| # | Escenario | Wired |
|---|---|---|
| 5 | Founder P0 Week 1 | No |
| 6 | Founder P1 Month 1 | No |
| 7 | Founder P2 Month 2 (sin integrations) | No |
| 8 | Founder P3 solo | No |
| 9 | Founder P3 rich solo | No |
| 10 | Founder+Team P1 (just invited) | No |
| 11 | Founder+Team P2 | No |
| 12 | Founder+Team P3 | No |
| 13 | Founder+Team P3 full | No |
| 14 | Founder+Team P4 graduated | No |
| 15 | Growth P1 Day 0 | Desbloqueado (role real) |
| 16 | Growth P3 | Desbloqueado (role real) |
| 19 | Ops P4 | No |
| 20 | P3 poor data | No |
| 21 | P4 solo (no delego) | No |
| 22 | Hiring mode P1 | No |

---

## CAPAS DEL ENGINE

| Capa | Estado |
|---|---|
| getDashboardConfig() | Funciona para 22 escenarios, montado en ruta real |
| getSidebarConfig() | Funciona, conectado a NovaSidebar (contexto simplificado) |
| Display budget max 6/3 | Verificado en 10 escenarios |
| Transition triggers | Implementados para 10 blocks |
| Role filtering | ACTIVO en dashboard Y sidebar |
| Depth Matrix | Definida, NO implementada en UI (teasers basicos si) |

---

## LO QUE FALTA

### Prioridad 1 — Consolidar lo montado

| Area | Que falta | Esfuerzo |
|---|---|---|
| Separacion visual cockpit vs legacy | OsWindow o titulo "Team Overview" para KPI Grid | Pequeno |
| Tests 15 escenarios restantes | Suites individuales | Medio |
| Depth Matrix real en UI | ResumenCard, vistas compact, teasers ricos | Grande |

### Prioridad 2 — Migrar legacy al engine

| Area | Que falta | Esfuerzo |
|---|---|---|
| ~12 bloques legacy en ProjectDashboardTab | FirstStepsPanel, FaseBPanel, PhaseRoadmap, 5 analytics, sidebar widgets | Grande |
| Sidebar agrupado | 4 secciones colapsables (B4) | Medio |

### Prioridad 3 — Features UX (SUPER_PLAN_UX_DEFINITIVO)

| Area | Bloque | Esfuerzo |
|---|---|---|
| Methodology visible | B2 (8 tareas) | Grande |
| Loop 2 minutos | B1 (10 tareas) | Grande |
| DailyCheckIn | B9 (7 tareas) | Grande |
| MethodologyGuard | B8 (8 tareas) | Medio |
| DataQualityNudges | B10 (7 tareas) | Medio |

---

## ORDEN DE EJECUCION

1. ~~Montar engine en ruta real~~ HECHO — DashboardAdapter en DashboardView
2. ~~Conectar sidebar al engine~~ HECHO — getSidebarConfig con role filtering
3. ~~Datos reales en engine~~ HECHO — role, isLead, teamMode, integrations, kpis
4. ~~Verificar memberIds = profiles.id~~ HECHO — confirmado via member_stats view
5. Separar visualmente cockpit vs legacy (pendiente)
6. Tests 15 escenarios restantes
7. Ejecutar plan UX bloque por bloque

---

## EJES DE LA MATRIZ

| Eje | Valores | Fuente |
|---|---|---|
| **Fase** | 0-4 | `project_phase_state.current_phase` |
| **Macro-rol** | Founder, Growth, Operations | `resolveMacroRole()` |
| **Team mode** | Solo, Team, Hiring | `onboarding_data.team_mode` |
| **Data maturity** | Empty, Minimal, Growing, Rich | `computeDataMaturity()` |
| **Zen mode** | On (< 7 dias + phase < 2), Off | Calculado |

---

## METODOLOGIA POR FASE

| Fase | Metodologia | Founder | Growth | Operations |
|---|---|---|---|---|
| 0 | Design Thinking | "Explora problemas" | "Investiga mercado" | "Organiza investigacion" |
| 1 | Customer Discovery | "Valida tu problema" | "Consigue evidencia" | "Facilita entrevistas" |
| 2 | Product-Market Fit | "Demuestra PMF" | "Activa usuarios" | "Estructura procesos" |
| 3 | Unit Economics | "Optimiza unit econ" | "Escala canales" | "Controla margenes" |
| 4 | Scaling Up | "Delega y crece" | "Multiplica canales" | "Automatiza ops" |

---

## DASHBOARD — 10 BLOQUES

| # | Bloque | Que muestra |
|---|---|---|
| 1 | `next_action` | Siguiente accion concreta |
| 2 | `methodology` | Fase + framework + por que |
| 3 | `core_stats` | 4 metricas por fase |
| 4 | `phase_engine` | Score + senales duras |
| 5 | `tasks` | Tareas (renderer null — vista completa) |
| 6 | `obvs` | OBVs (renderer null — vista completa) |
| 7 | `crm_summary` | Pipeline CRM |
| 8 | `financial_summary` | Revenue / financiero |
| 9 | `team_status` | Equipo + recomendaciones |
| 10 | `alerts` | TrialCountdown + AICallsNudge |

**Budget:** PRIMARY max 6, SECONDARY max 3. Overflow va a DEEP (no se pierde).

---

## TRANSICIONES (teaser -> summary -> full)

| Bloque | toSummary | toFull |
|---|---|---|
| core_stats | OBVs > 0 OR tasks > 0 OR team > 1 | — |
| tasks | tasks >= 1 | tasks >= 5 AND phase >= 2 |
| obvs | OBVs >= 1 | OBVs >= 3 AND phase >= 1 |
| crm_summary | leads >= 1 | leads >= 5 AND phase >= 2 |
| financial_summary | hasRevenue | revenue AND days >= 90 AND phase >= 3 |
| team_status | team >= 2 OR hiring | team >= 4 AND phase >= 3 |

**Phase gates:** crm >= P1, financial >= P2.
**Defaults:** P0-1 → summary, P2+ → full.

---

## SIDEBAR — FASE + ROL

| Item | F0 | F1 | F2 | F3 | F4 |
|---|---|---|---|---|---|
| dashboard | vis | vis | vis | vis | vis |
| mi-espacio | hid | vis | vis | vis | vis |
| mi-desarrollo | hid | hid | hid | vis | vis |
| mi-modelo | hid | hid | vis | vis | vis |
| proyectos | hid | vis | vis | vis | vis |
| validaciones | hid | vis | vis | vis | vis |
| obvs | hid | vis | vis | vis | vis |
| startup-os | vis | vis | vis | vis | vis |
| crm | hid | vis | vis | vis | vis |
| financiero | hid | tea | vis | vis | vis |
| meetings | hid | hid | tea | vis | vis |
| analisis-ia | hid | hid | tea | vis | vis |
| toolkit | hid | hid | tea | vis | vis |
| exploration | hid | hid | hid | vis | vis |
| path-to-master | hid | hid | hid | hid | vis |
| rankings | hid | hid | hid | vis | vis |
| masters | hid | hid | hid | hid | vis |
| rotacion | hid | hid | hid | hid | vis |
| kpis | hid | vis | vis | vis | vis |
| analytics | hid | hid | hid | vis | vis |
| team-performance | hid | hid | hid | vis | vis |
| settings | vis | vis | vis | vis | vis |
| integrations | hid | tea | vis | vis | vis |
| notificaciones | vis | vis | vis | vis | vis |

**Role overrides (phase < 3):**
- Growth: financiero, mi-desarrollo, mi-modelo → HIDDEN
- Operations: crm, exploration, rankings → HIDDEN
- Solo P0: team items → HIDDEN
- Solo P1+: team items → TEASER

---

## CORE STATS POR FASE

| Fase | Stat 1 | Stat 2 | Stat 3 | Stat 4 |
|---|---|---|---|---|
| 0 | ideas_explored | problems_identified | days_active | team_count |
| 1 | total_obvs | kpi_count | tasks_weekly | days_active |
| 2 | total_obvs | kpi_count | tasks_weekly | conversion_rate |
| 3 | facturacion | lead_conversion_rate | leads_ganados | margen |
| 4 | facturacion | margen | lead_conversion_rate | leads_ganados |

---

## ZEN MODE

| Condicion | Efecto |
|---|---|
| daysActive < 7 AND phase < 2 | Zen ON: solo next_action + methodology + phase_engine + alerts |
| daysActive >= 7 OR phase >= 2 | Zen OFF: dashboard completo |
| Dismiss manual | Zen OFF permanente |

---

## MACRO-ROL

| specialization_role | is_lead | Macro-rol |
|---|---|---|
| cualquiera | true | Founder |
| strategy | false | Founder |
| sales / marketing | false | Growth |
| operations / finance / ai_tech / null | false | Operations |

---

## DATA MATURITY

| Signal | Puntos |
|---|---|
| OBVs >= 5 | 2 (>= 1: 1) |
| Leads >= 10 | 2 (>= 1: 1) |
| Tasks >= 10 | 2 (>= 1: 1) |
| Revenue | 2 |
| Integrations | 2 |
| KPIs >= 3 | 1 |
| Days >= 30 | 1 |

0 = Empty, 1-3 = Minimal, 4-7 = Growing, 8+ = Rich.
