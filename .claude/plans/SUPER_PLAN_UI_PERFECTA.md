# SÚPER PLAN — UI PERFECTA ADAPTATIVA

> Generado: 2026-03-23 · Basado en auditoría de 3 agentes (71 feature components, 25 sidebar items, 42 HowItWorks, 95 archivos Nova)
> Objetivo: UI enterprise, adaptativa, personalizada por fase. El cliente ve exactamente lo que necesita.
> Principio: el código ya tiene todo. Este plan CONECTA el código con lo que el usuario VE.

---

## DIAGNÓSTICO

| Problema | Impacto | Evidencia |
|----------|---------|-----------|
| Sidebar muestra 25 items sin filtrar por fase | Usuario abrumado Day 1 | NovaSidebar.tsx:44-107 |
| PHASE_TAB_CONFIG solo aplica a ProjectPage tabs (deprecado) | Lógica adaptativa NO llega al sidebar real | phase-features.ts solo usado en ProjectPage.tsx |
| HowItWorks existe en 42 secciones pero NO usa dataInputs/dataOutputs | Cliente no sabe DE DÓNDE vienen los datos | how-it-works.tsx soporta pero 0 instancias lo usan |
| UnlockProgress solo en 4 componentes de 71 | Páginas vacías en vez de "X pasos para desbloquear" | Solo ExecutionTrends, Pipeline, MRR, Stress |
| "Nova" en 95 archivos | Branding incorrecto | i18n, edge functions, CSS, componentes |
| 5 páginas sin empty state | Pantalla en blanco si no hay datos | Tasks, CRM, OBVs, AI Analysis, Onboarding |
| ProjectPage.tsx deprecado pero vivo | Código muerto confuso | 398 líneas sin ruta en App.tsx |
| DashboardView vs ProjectDashboardTab | Dos dashboards diferentes sin conexión clara | Dashboard global vs proyecto |

---

## BLOQUE 1 — SIDEBAR ADAPTATIVO POR FASE (CORE)

### Objetivo
El sidebar se adapta a la fase del proyecto activo. Menos items = menos confusión = más acción.

### Diseño

```
FASE 0 (Exploración — sin idea):
├── 📊 Dashboard
├── ✅ Tareas
├── 🎯 Startup OS (generar ideas)
├── ⚙️ Settings
└── 🔔 Notificaciones
    5 items. Todo lo demás OCULTO (no teaser, oculto).

FASE 1 (Validación — tiene idea):
├── 📊 Dashboard
├── ✅ Tareas
├── 📋 OBVs (validar hipótesis)
├── 🛡️ Validaciones
├── 🎯 Startup OS
├── 📁 Proyectos
├── ⚙️ Settings
├── 🔔 Notificaciones
└── 🔒 CRM (teaser: "Se desbloquea en Fase 2")
└── 🔒 Financiero (teaser)
    8 items + 2 teasers

FASE 2 (Solución — validando producto):
├── 📊 Dashboard
├── ✅ Tareas
├── 📋 OBVs
├── 🛡️ Validaciones
├── 📞 CRM (NUEVO — pipeline de leads)
├── 🎯 Startup OS
├── 📁 Proyectos
├── 🔌 Integraciones
├── ⚙️ Settings
├── 🔔 Notificaciones
└── 🔒 Financiero (teaser)
└── 🔒 Análisis IA (teaser)
    10 items + 2 teasers

FASE 3 (Revenue — generando dinero):
├── 📊 Dashboard
├── ✅ Tareas
├── 📋 OBVs
├── 📞 CRM
├── 💰 Financiero (NUEVO)
├── ✨ Análisis IA (NUEVO)
├── 🎙️ Meeting Intelligence
├── 📋 Founder Toolkit
├── 👥 Equipo (si team_size > 1)
├── 📊 KPIs
├── 🔌 Integraciones
├── ⚙️ Settings
├── 🔔 Notificaciones
    13-14 items

FASE 4 (Escala — todo desbloqueado):
    TODO visible (20+ items)
    + Analytics avanzado
    + Team Performance
    + Expansion Intelligence
```

### Implementación

| ID | Tarea | Archivos |
|----|-------|----------|
| **UI.1.1** | Crear `SIDEBAR_PHASE_CONFIG` en phase-features.ts — mapeo sidebar item → fase de visibilidad | phase-features.ts |
| **UI.1.2** | Modificar NovaSidebar.tsx — leer fase actual, filtrar items con SIDEBAR_PHASE_CONFIG | NovaSidebar.tsx |
| **UI.1.3** | Items teaser en sidebar: opacity 50% + 🔒 + tooltip "Se desbloquea en Fase N" | NovaSidebar.tsx |
| **UI.1.4** | Click en teaser sidebar: abrir modal con razón + condición de desbloqueo (reusar PhaseTeaserModal) | NovaSidebar.tsx |
| **UI.1.5** | Badge "NUEVO" en items recién desbloqueados (persistir en localStorage qué fase vio por última vez) | NovaSidebar.tsx |

---

## BLOQUE 2 — HOWITWORKS COMPLETO EN CADA FEATURE

### Objetivo
Cada feature tiene un "Cómo funciona" que explica: qué es, de dónde saca datos, qué outputs genera, y cuál es el siguiente paso. El cliente NUNCA se pierde.

### Diseño del HowItWorks mejorado

```
┌─────────────────────────────────────────────────┐
│ 📘 Cómo funciona: Análisis Estratégico IA       │
│                                                   │
│ Qué es: Análisis personalizado de tu startup     │
│ generado por IA en 3 niveles progresivos.         │
│                                                   │
│ De dónde saca datos:                              │
│ ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│ │ 📊 Motor │ → │ 🔌 Stripe│ → │ 📋 OBVs  │      │
│ │ de fases │   │ (MRR)    │   │ (validac.)│      │
│ └──────────┘   └──────────┘   └──────────┘      │
│                                                   │
│ Qué genera:                                       │
│ ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│ │ Resumen  │   │ Decisiones│  │ Hard     │       │
│ │ ejecutivo│   │ urgentes  │  │ Truths   │       │
│ └──────────┘   └──────────┘   └──────────┘      │
│                                                   │
│ Siguiente paso: [Generar mi primer análisis →]    │
│                                                   │
│ ▼ Expandir detalles                               │
└─────────────────────────────────────────────────┘
```

### Implementación

| ID | Tarea | Detalle |
|----|-------|---------|
| **UI.2.1** | Actualizar helpContent.ts — añadir dataInputs + dataOutputs a CADA sección | 42 secciones |
| **UI.2.2** | Crear entradas HowItWorks para features NUEVAS que no tienen: | |
| | - Análisis IA (3 niveles + chat + export) | |
| | - Integraciones (8 providers + insights) | |
| | - Meeting Intelligence | |
| | - Founder Toolkit | |
| | - Execution Trends + Pipeline Velocity | |
| | - MRR Forecast + Stress Test + Risk Alerts | |
| | - Cycle Intelligence (compromisos + patrones) | |
| | - Scenario Builder + Revenue Quality | |
| **UI.2.3** | Cada HowItWorks debe tener dataInputs (fuentes) y dataOutputs (resultados) activados | how-it-works.tsx ya soporta, solo hay que pasar props |
| **UI.2.4** | Añadir nextStep con CTA concreto a cada HowItWorks | "Conecta Stripe →", "Crea tu primera tarea →" |

---

## BLOQUE 3 — UNLOCKPROGRESS EN CADA FEATURE

### Objetivo
Nunca una pantalla vacía. Si el usuario no tiene datos suficientes, ve: "3 de 5 pasos para desbloquear [Feature]" con CTAs directos.

### Features que necesitan UnlockProgress

| Feature | Condición de desbloqueo | CTA |
|---------|------------------------|-----|
| CRM | ≥1 lead registrado | "Registra tu primer lead →" |
| Financiero | ≥1 ingreso registrado | "Registra tu primera venta →" |
| Análisis IA Nivel 1 | ≥14 días activo | "Día {N}/14 para tu primer análisis" |
| Análisis IA Nivel 2 | ≥1 integración activa | "Conecta una herramienta →" |
| Análisis IA Nivel 3 | ≥2 integraciones + 5 decisiones | "Conecta 2 herramientas + registra decisiones" |
| Execution Trends | ≥10 tasks + 5 OBVs (30d) | YA IMPLEMENTADO |
| MRR Forecast | ≥6 meses key_metrics (3 con integración) | YA IMPLEMENTADO |
| Stress Test | ≥3 meses key_metrics | YA IMPLEMENTADO |
| Pipeline Velocity | ≥5 OBVs con pipeline | YA IMPLEMENTADO |
| Cycle Intelligence | ≥1 ciclo completado | "Completa tu primer ciclo estratégico →" |
| Founder Patterns | ≥2 ciclos completados | "Completa 2 ciclos para ver patrones" |
| Meeting Intelligence | ≥1 reunión grabada | "Graba tu primera reunión →" |
| Team Performance | ≥2 miembros en equipo | "Invita a tu primer compañero →" |
| Analytics Avanzado | Plan Pro requerido | "Upgrade a Pro →" |

### Implementación

| ID | Tarea |
|----|-------|
| **UI.3.1** | Extender compute_unlock_progress RPC con las 14 features de arriba (ahora solo tiene 6) |
| **UI.3.2** | Añadir UnlockGate wrapper a CRMView, AIAnalysisPage, MeetingIntelligencePage, FounderToolkitPage |
| **UI.3.3** | Añadir empty state con UnlockProgress a ProjectTasksTab, ProjectOBVsTab, ProjectCRMTab |
| **UI.3.4** | Cada UnlockProgress muestra progreso (barra), pasos (checklist), y CTAs (botones de acción) |

---

## BLOQUE 4 — REBRANDING NOVA → OPTIMUS-K

### Alcance total: ~95 archivos

| Categoría | Archivos | Qué hacer |
|-----------|----------|-----------|
| **i18n** (6 idiomas) | 6 | Reemplazar "Nova Hub" → "Optimus-K", "NOVA" → "OPTIMUS-K" en 18 keys × 6 idiomas |
| **CSS** | 1 (index.css) | Renombrar --nova-gradient → --optimus-gradient, .nova-* → .optimus-* |
| **Componentes** | 126 archivos usan .nova-* CSS classes | Bulk replace .nova- → .optimus- |
| **Directorio** | src/components/nova/ | NO renombrar directorio (demasiados imports). Solo renombrar exports y displayNames |
| **Edge functions** | 13 | Reemplazar "Nova Hub" en prompts, emails, user-agents |
| **Hooks** | useNovaDataOptimized, useNovaData | NO renombrar (demasiados imports internos). Añadir alias exports |
| **README** | 1 | "Optimus-K" |
| **Seeds** | 2 | NOVA_USERS → OPTIMUS_USERS |

### Implementación

| ID | Tarea |
|----|-------|
| **UI.4.1** | Bulk replace en 6 archivos i18n: "Nova Hub" → "Optimus-K", "NOVA" → "OPTIMUS-K" (18 keys × 6) |
| **UI.4.2** | CSS: --nova-* → --optimus-* en index.css + bulk replace .nova- → .optimus- en 126 componentes |
| **UI.4.3** | Edge functions: actualizar 13 archivos con "Nova Hub" → "Optimus-K" en mensajes user-facing |
| **UI.4.4** | NovaSidebar logo: cambiar "N" → "O-K" o logo Optimus-K |
| **UI.4.5** | WelcomeModal: "Bienvenido a NOVA" → "Bienvenido a Optimus-K" |

---

## BLOQUE 5 — EMPTY STATES INTELIGENTES

### Páginas sin empty state (pantalla en blanco)

| Página | Empty state necesario |
|--------|----------------------|
| **ProjectTasksTab** | "Crea tu primera tarea para empezar a ejecutar" + CTA + 3 plantillas sugeridas |
| **ProjectCRMTab** | "Registra tu primer lead para activar el pipeline" + CTA |
| **ProjectOBVsTab** | "Crea tu primera OBV para empezar a validar" + CTA |
| **AIAnalysisPage** | "Tu primer análisis estará listo en {14-N} días" + progreso + qué datos tiene |
| **MeetingIntelligencePage** | "Graba tu primera reunión para extraer decisiones y insights" + CTA |
| **FounderToolkitPage** | "Explora las herramientas IA disponibles" (no empty per se — siempre hay tools) |

### Implementación

| ID | Tarea |
|----|-------|
| **UI.5.1** | Crear EmptyState genérico reutilizable con: icono, título, descripción, CTA, progreso opcional |
| **UI.5.2** | Aplicar a las 5 páginas sin empty state |
| **UI.5.3** | Cada empty state incluye HowItWorks collapsed debajo (explica la feature) |

---

## BLOQUE 6 — CLEANUP TÉCNICO

| ID | Tarea | Impacto |
|----|-------|---------|
| **UI.6.1** | Eliminar ProjectPage.tsx (deprecado, 398 líneas, sin ruta) | -398 líneas dead code |
| **UI.6.2** | Unificar feature gating: sidebar usa SIDEBAR_PHASE_CONFIG, vistas usan UnlockGate | 1 sistema, no 2 |
| **UI.6.3** | Eliminar fallback legacy `currentView` de NovaSidebar | Limpieza de código |
| **UI.6.4** | Consolidar i18n keys: nav.* y project.* que duplican | Menos keys, menos confusión |

---

## RESUMEN — Completado 2026-03-24

| Bloque | Tareas | Estado | Notas |
|--------|--------|--------|-------|
| **1. Sidebar adaptativo** | 5 | ✅ DONE | SIDEBAR_PHASE_CONFIG + filtrado + teasers + badge dot pulsante. Teaser usa toast. |
| **2. HowItWorks completo** | 4 | ✅ DONE | 20/20 archivos con dataInputs/dataOutputs. ProjectsView era el ultimo. |
| **3. UnlockProgress everywhere** | 4 | ✅ DONE | RPC 11 features. UnlockGate en CRM + AIAnalysis + MeetingIntelligence. Toolkit tiene su propio sistema per-tool. |
| **4. Rebranding Nova → Optimus-K** | 5 | ✅ DONE | ProjectPage.tsx eliminado. i18n/CSS/Edge functions limpios. |
| **5. Empty states** | 3 | ✅ DONE | EmptyState generico en shared/EmptyState.tsx. Aplicado a Tasks, OBVs, CRM tabs. |
| **6. Cleanup técnico** | 4 | ✅ DONE | ProjectPage eliminado. currentView legacy eliminado de NovaSidebar. |
| **TOTAL** | **25 tareas** | **100% ejecutado** | Commit 3eff178 |

## ORDEN DE EJECUCIÓN

```
BLOQUE 4 (rebranding) → BLOQUE 1 (sidebar) → BLOQUE 3 (unlock) → BLOQUE 5 (empty states) → BLOQUE 2 (HowItWorks) → BLOQUE 6 (cleanup)
```

**Por qué este orden:**
1. Rebranding PRIMERO — afecta todo, mejor hacerlo antes de tocar UI
2. Sidebar adaptativo — el cambio de mayor impacto visual
3. UnlockProgress — elimina pantallas vacías
4. Empty states — complementa unlock con CTAs específicos
5. HowItWorks — documentación de features (necesita que todo esté en su sitio)
6. Cleanup — último para no romper nada durante los cambios
