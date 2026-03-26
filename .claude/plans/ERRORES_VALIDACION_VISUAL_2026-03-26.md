# ERRORES ENCONTRADOS EN VALIDACION VISUAL

> Detectados durante verificacion de la checklist de 4 escenarios.
> Corregir todos antes de cerrar la validacion.

---

## Escenario A: Founder P1 Solo

| # | Error | Severidad | Estado |
|---|---|---|---|
| A1 | Legacy widgets vacios (KPIs, Charts, Rankings) — useMemberStats RLS | Baja | Preexistente, no del engine |

## Escenario B: Founder P2 Rich

| # | Error | Severidad | Estado |
|---|---|---|---|
| B1 | `teamRec.needsRole` — i18n key sin traducir | Media | ARREGLADO |
| B2 | `teamRec.marketing` — i18n key sin traducir | Media | ARREGLADO |
| B3 | `teamRec.inviteForRole` — i18n key sin traducir | Media | ARREGLADO |

## Errores navegando por la app

| # | Error | Severidad | Estado |
|---|---|---|---|
| N1 | IntegrationsView.tsx:155 — IntegrationsContent sin useTranslation | Alta | ARREGLADO |

## Escenario C: Growth P2

| # | Check | Estado |
|---|---|---|
| C1 | Sidebar: financiero HIDDEN | ✅ No aparece |
| C2 | Sidebar: mi-modelo HIDDEN | ✅ No aparece |
| C3 | Sidebar: CRM visible | ✅ Visible |
| C4 | Dashboard: financial_summary HIDDEN | pendiente verificacion |
| C5 | Dashboard: KPI Grid sin facturacion/margen | pendiente verificacion |
| C6 | Sidebar: mi-desarrollo HIDDEN | pendiente verificacion |

## Escenario D: Ops P3

| # | Check | Estado |
|---|---|---|
| D1 | Metodologia: "Operaciones — Unit Economics" | ✅ Correcto |
| D2 | Motor del proyecto visible | ✅ |
| D3 | Core Stats: 11, 4, 120, 5 | ✅ |
| D4 | Sidebar: Mi Desarrollo + Mi Modelo visible (fase 3) | ✅ |
| D5 | teamRec recomienda finance | ✅ (i18n arreglado) |

---

## Errores generales detectados en sesion anterior

| # | Error | Severidad | Estado |
|---|---|---|---|
| G1 | 105 archivos con t() a nivel de modulo | Critica | ARREGLADO |
| G2 | 10 imports duplicados SourceBadge | Critica | ARREGLADO |
| G3 | auth_is_project_member comparaba auth_id con profile_id | Critica | ARREGLADO |
| G4 | project query RLS join failure | Alta | ARREGLADO |
| G5 | loadingMembers bloqueaba toda la pagina | Alta | ARREGLADO |
| G6 | Core stats invisibles en dark mode (sin bg-card) | Alta | ARREGLADO |
| G7 | Supabase site_url era localhost:3000 | Alta | ARREGLADO |
| G8 | flowType:implicit causaba session loss | Alta | ARREGLADO y revertido |
| G9 | getSession timeout 5s causaba redirect a login | Alta | ARREGLADO (eliminado timeout) |
| G10 | Stats flash/disappear por React Query refetch sin staleTime | Media | ARREGLADO |
| G11 | Bug onboarding profile null (cuentas nuevas) | Alta | Pendiente (preexistente) |
