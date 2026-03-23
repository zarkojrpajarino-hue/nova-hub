# PLAN MAESTRO — ONBOARDING PERFECTO + UI ENTERPRISE

> Generado: 2026-03-23 · Basado en auditoría exhaustiva de 4 onboarding paths + 71 feature components + 25 sidebar items
> Objetivo: onboarding diferenciador que retiene al 95%+ de usuarios + UI adaptativa nivel enterprise
> Principio: NUNCA pedir lo que la IA puede deducir. NUNCA mostrar vacío. SIEMPRE guiar al siguiente paso.

---

## PARTE 1 — ONBOARDING PERFECTO (4 paths optimizados al máximo)

### PRINCIPIOS FUNDAMENTALES

1. **Menos preguntas, más IA** — si puedo deducir la respuesta de una URL o dato anterior, NO la pregunto
2. **Valor inmediato** — el usuario ve algo útil ANTES de terminar el onboarding (no después)
3. **Progressive disclosure** — no abrumar; mostrar lo justo para avanzar
4. **AutoFill es el diferencial** — "pega tu URL y rellenamos el 80%" es la feature que nos separa de TODOS
5. **Sin emojis** — iconos Lucide, tono profesional, estilo PostHog
6. **Cada pregunta alimenta algo concreto** — si no alimenta un engine/feature, no se pregunta

---

### PATH 1: "TENGO UNA EMPRESA" (Existing) — EL MÁS IMPORTANTE

**Target:** Founder con empresa existente, clientes, revenue. Quiere optimizar.
**Promesa:** "En 5 minutos, Optimus-K analiza tu negocio y te dice dónde mejorar."
**Diferencial:** AutoFill con URL + conexión de integraciones en el propio onboarding.

#### Flujo optimizado:

```
STEP 1 — URL AutoFill (NUEVO — diferenciador)
┌─────────────────────────────────────────┐
│ "Pega la URL de tu empresa"             │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ https://miempresa.com            [→] │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ "Optimus-K extraerá automáticamente:     │
│  nombre, descripción, industria,         │
│  propuesta de valor, y competidores"     │
│                                          │
│ [Continuar sin URL →]                    │
└─────────────────────────────────────────┘

↓ Si pega URL: llama a extract-business-info
↓ Pre-rellena: nombre, descripción, industria, público objetivo
↓ El usuario solo CONFIRMA (no escribe)

STEP 2 — Confirmar datos extraídos (o rellenar si no dio URL)
┌─────────────────────────────────────────┐
│ Nombre: [Mi Empresa SL        ] ← auto │
│ Qué hace: [Vendemos software   ] ← auto│
│ Industria: [SaaS ▼             ] ← auto │
│                                          │
│ ✓ Correcto   ✎ Editar                   │
└─────────────────────────────────────────┘

STEP 3 — Métricas clave (4 preguntas)
┌─────────────────────────────────────────┐
│ ¿Generas ingresos?  [Sí] [No]          │
│ MRR actual: [€5.000        ]            │
│ Clientes activos: [12      ]            │
│ Equipo: [4 personas        ]            │
└─────────────────────────────────────────┘

STEP 4 — Conectar herramientas (NUEVO — ahorra 30min)
┌─────────────────────────────────────────┐
│ "Conecta tus herramientas para que      │
│  Optimus-K se llene automáticamente"    │
│                                          │
│ [🔌 Stripe]  [🔌 HubSpot]  [🔌 Asana] │
│ [🔌 Slack]   [🔌 Notion]   [🔌 Trello]│
│                                          │
│ "Puedes hacerlo después también"         │
│ [Saltar →]                               │
└─────────────────────────────────────────┘

STEP 5 — Objetivo 90 días
┌─────────────────────────────────────────┐
│ "¿Cuál es tu objetivo principal?"       │
│ ○ Aumentar ventas                        │
│ ○ Reducir costes                         │
│ ○ Escalar el equipo                      │
│ ○ Mejorar ejecución                      │
│ ○ Otro: [_______________]               │
└─────────────────────────────────────────┘

STEP 6 — IA genera análisis en vivo
┌─────────────────────────────────────────┐
│ "Analizando tu negocio..."              │
│                                          │
│ ✓ Business Model Canvas generado         │
│ ✓ 3 buyer personas identificados         │
│ ✓ Análisis competitivo creado            │
│ ~ Proyecciones financieras...            │
│ ○ Sales playbook pendiente               │
│                                          │
│ [████████████░░░] 75%                    │
└─────────────────────────────────────────┘

STEP 7 — Instant Diagnostic (resultado inmediato)
┌─────────────────────────────────────────┐
│ "Diagnóstico inicial de Mi Empresa SL"  │
│                                          │
│ ⚠ Tu mayor riesgo: Concentración de     │
│   revenue en pocos clientes (12)         │
│                                          │
│ ✓ Tu ventaja: MRR estable (€5K) con     │
│   equipo de 4 — eficiencia alta          │
│                                          │
│ → Primer paso: Conecta Stripe para       │
│   que Optimus-K monitorice tu MRR real   │
│                                          │
│ [Ir a mi Dashboard →]                    │
└─────────────────────────────────────────┘
```

**Total: 7 steps, ~5 minutos. El usuario ve VALOR en step 6-7 sin esperar.**

#### Features implementar:

| ID | Feature | Backend existe | UI existe | Acción |
|----|---------|---------------|-----------|--------|
| **OB.E.1** | URL AutoFill input field | ✅ extract-business-info | ❌ | Crear campo URL + conectar a edge fn |
| **OB.E.2** | Datos pre-rellenados editables | ✅ edge fn retorna BusinessInfo | ❌ | Crear UI de confirmación |
| **OB.E.3** | Conexión de integraciones inline | ✅ connect-* edge fns | ❌ | Mini-cards de conexión en onboarding |
| **OB.E.4** | Generación IA con progreso visible | ✅ generateAllArtifacts | ⚠️ spinner básico | Mejorar con checklist animada |
| **OB.E.5** | Instant Diagnostic mejorado | ✅ InstantDiagnostic.tsx | ⚠️ estático | Usar datos de URL + IA para personalizar |

---

### PATH 2: "TENGO UNA IDEA" (Idea) — VALIDACIÓN INTELIGENTE

**Target:** Founder con idea, necesita validar.
**Promesa:** "En 4 minutos, Optimus-K valida tu idea y te dice si merece la pena."
**Diferencial:** Competitor URL analysis + hypothesis scoring.

#### Flujo optimizado:

```
STEP 1 — Screening de hipótesis (YA EXISTE — mantener)
"¿En qué punto está tu idea?"
○ Tengo hipótesis clara → Lean Startup path
○ Tengo idea pero no clara → Design Thinking path
○ Quiero descubrir oportunidad → Design Thinking path

STEP 2A (Lean) — Pitch + Nombre
┌─────────────────────────────────────────┐
│ Nombre del proyecto: [_______________]  │
│ Describe tu idea: [                     │
│   ¿Qué problema resuelves?              │
│   ¿Para quién?                           │
│   ¿Cómo? ________________________      │
│ ]                                        │
└─────────────────────────────────────────┘

STEP 2B (Design Thinking) — 5 pasos guiados (YA EXISTE — mantener)

STEP 3 — URLs de competidores (NUEVO — diferenciador)
┌─────────────────────────────────────────┐
│ "¿Conoces competidores? Pega sus URLs"  │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ https://competidor1.com          [+] │ │
│ │ https://competidor2.com          [+] │ │
│ │ https://competidor3.com          [+] │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ "Optimus-K analizará sus websites para   │
│  generar tu SWOT y diferenciación"       │
│                                          │
│ [No conozco competidores → Saltar]       │
└─────────────────────────────────────────┘

↓ Si pega URLs: llama a analyze-competitor-urls
↓ Genera: SWOT automático, pricing insights, diferenciación

STEP 4 — Métricas básicas (FaseA reducida)
País, tamaño equipo, objetivo 90 días

STEP 5 — IA genera artefactos + SWOT
(Si dio URLs de competidores: SWOT con datos reales)
(Si no: SWOT genérico con estimaciones)

STEP 6 — Resultado: Hypothesis Score
┌─────────────────────────────────────────┐
│ "Score de tu hipótesis: 72/100"         │
│                                          │
│ ✓ Problema claro: 8/10                  │
│ ⚠ Mercado: 6/10 (competencia alta)     │
│ ✓ Solución: 7/10                        │
│ ⚠ Monetización: 5/10 (sin validar)     │
│                                          │
│ "Tu experimento de 7 días:              │
│  Identifica 5 clientes potenciales      │
│  y pregúntales si pagarían por esto"    │
│                                          │
│ [Ir a mi Dashboard →]                    │
└─────────────────────────────────────────┘
```

#### Features implementar:

| ID | Feature | Backend existe | UI existe | Acción |
|----|---------|---------------|-----------|--------|
| **OB.I.1** | Competitor URL input (multi) | ✅ analyze-competitor-urls | ❌ | Crear input multi-URL |
| **OB.I.2** | SWOT con datos reales de competitors | ✅ edge fn genera SWOT | ❌ | Conectar output a artefactos |
| **OB.I.3** | Hypothesis Score visual | ❌ | ❌ | Crear scoring UI |
| **OB.I.4** | Experimento 7 días mejorado | ✅ ya existe | ⚠️ | Hacerlo más visual/accionable |

---

### PATH 3: "QUIERO EMPRENDER" (Generative) — DESCUBRIMIENTO IA

**Target:** Persona sin idea, quiere emprender.
**Promesa:** "En 4 minutos, la IA te genera 3 ideas de negocio viables para ti."
**Diferencial:** Ideas personalizadas por ubicación, skills, capacidad de inversión.

#### Flujo (YA ESTÁ BIEN — optimizar detalles):

```
STEP 1 — Industria (obligatorio) + Skills/Inversión/Tiempo (opcional)
STEP 2 — FaseA: país, equipo, objetivo
STEP 3 — IA genera 3 ideas con:
  • Viability score (0-100, colores)
  • Perfil económico (inversión, MRR potencial, time-to-revenue)
  • Riesgos principales
  • Experimento 7 días
  • Filtro doble (hard + soft warnings)
STEP 4 — Usuario selecciona 1 idea
STEP 5 — Instant Diagnostic personalizado
```

#### Mejoras:

| ID | Feature | Acción |
|----|---------|--------|
| **OB.G.1** | Geo-intelligence integrada | Conectar geo-intelligence edge fn para dar ideas localizadas (ej: "En España, el mercado de X crece 15%") |
| **OB.G.2** | "Regenerar ideas" button | Si ninguna convence, regenerar con ajustes |
| **OB.G.3** | Comparativa lado a lado | Las 3 ideas en tabla comparativa (no solo cards) |

---

### PATH 4: "PROBLEMA URGENTE" (Emergency) — SPEED

**Target:** Founder con crisis activa.
**Promesa:** "En 2 minutos, plan de acción con 3 tareas prioritarias."
**YA ESTÁ BIEN** — 5 tipos de crisis, auto-crea 3 tareas. No tocar.

#### Mejora única:

| ID | Feature | Acción |
|----|---------|--------|
| **OB.EM.1** | Post-emergency: link a análisis IA | Después de crear las 3 tareas, CTA: "Genera un análisis completo de tu situación →" (link a AI Analysis) |

---

## PARTE 2 — UI ENTERPRISE ADAPTATIVA

### BLOQUE A — SIDEBAR ADAPTATIVO POR FASE

(Mismo diseño del plan anterior — 5 items en Fase 0, progresivo hasta 20+ en Fase 4)

| ID | Tarea |
|----|-------|
| **UI.A.1** | Crear SIDEBAR_PHASE_CONFIG en phase-features.ts |
| **UI.A.2** | NovaSidebar lee fase actual, filtra items |
| **UI.A.3** | Items teaser: opacity 50% + lock + tooltip |
| **UI.A.4** | Click teaser: modal con razón + condición |
| **UI.A.5** | Badge "NUEVO" en items recién desbloqueados |

### BLOQUE B — HOWITWORKS COMPLETO

Cada feature tiene un "Cómo funciona" con:
- **Qué es** (1 frase)
- **De dónde saca datos** (visual: iconos de fuentes → flechas → output)
- **Qué genera** (outputs concretos)
- **Siguiente paso** (CTA)

| ID | Feature que necesita HowItWorks |
|----|--------------------------------|
| **UI.B.1** | Análisis IA (3 niveles + chat + export) |
| **UI.B.2** | Integraciones (8 providers + insights) |
| **UI.B.3** | Meeting Intelligence (grabar → insights) |
| **UI.B.4** | Founder Toolkit (herramientas IA) |
| **UI.B.5** | Execution Trends + Pipeline Velocity |
| **UI.B.6** | MRR Forecast + Stress Test + Risk Alerts |
| **UI.B.7** | Cycle Intelligence (compromisos + patrones) |
| **UI.B.8** | Scenario Builder + Revenue Quality |
| **UI.B.9** | CRM Pipeline |
| **UI.B.10** | Financiero completo |
| **UI.B.11** | Actualizar las 42 secciones existentes con dataInputs/dataOutputs |

### BLOQUE C — UNLOCKPROGRESS EVERYWHERE

14 features con desbloqueo progresivo. Nunca pantalla vacía.
(Mismo diseño del plan anterior)

| ID | Tarea |
|----|-------|
| **UI.C.1** | Extender compute_unlock_progress con 14 features |
| **UI.C.2** | UnlockGate en CRM, AI Analysis, Meetings, Toolkit |
| **UI.C.3** | Empty states con UnlockProgress en Tasks, OBVs, CRM tabs |

### BLOQUE D — COLORES BRANDING OFICIAL

Actualizar CSS con paleta oficial de Canva:

| Variable | Actual | Nuevo | Uso |
|----------|--------|-------|-----|
| --background dark | HSL genérico | `#0D0A1A` | Fondo dark mode |
| --sidebar-bg | genérico | `#2E1065` | Sidebar dark |
| --primary | `#7C3AED` | `#7C3AED` | YA CORRECTO |
| --primary-light | genérico | `#C4B5FD` | Hover, badges |
| --surface | genérico | `#F5F3FF` | Cards, backgrounds |
| --accent-pink | no existe | `#EC4899` (pink-500) | Accent secundario |
| --accent-cyan | no existe | `#0D9488` (teal) | Accent terciario |

| ID | Tarea |
|----|-------|
| **UI.D.1** | Actualizar index.css con paleta oficial |
| **UI.D.2** | Sidebar: fondo `#2E1065` en dark mode |
| **UI.D.3** | Cards: fondo `#F5F3FF` en light mode |

### BLOQUE E — ESTILO POSTHOG (sin emojis, profesional)

| ID | Tarea |
|----|-------|
| **UI.E.1** | Eliminar TODOS los emojis de componentes UI (reemplazar con iconos Lucide) |
| **UI.E.2** | Eliminar emojis de i18n strings (solo iconos) |
| **UI.E.3** | Tipografía: headers más grandes, más spacing, más aire |
| **UI.E.4** | Cards: bordes más sutiles, shadows suaves, esquinas rounded-xl |
| **UI.E.5** | Buttons: más padding, font-medium, transitions suaves |

### BLOQUE F — EMPTY STATES INTELIGENTES

| ID | Tarea |
|----|-------|
| **UI.F.1** | Componente EmptyState genérico reutilizable |
| **UI.F.2** | Tasks empty: "Crea tu primera tarea" + 3 plantillas |
| **UI.F.3** | CRM empty: "Registra tu primer lead" + CTA |
| **UI.F.4** | OBVs empty: "Crea tu primera OBV" + CTA |
| **UI.F.5** | AI Analysis empty: "Tu análisis estará listo en {N} días" + progreso |
| **UI.F.6** | Meetings empty: "Graba tu primera reunión" + CTA |

### BLOQUE G — CLEANUP

| ID | Tarea |
|----|-------|
| **UI.G.1** | Eliminar ProjectPage.tsx (deprecado, 398 líneas) |
| **UI.G.2** | Eliminar emojis restantes de edge functions |
| **UI.G.3** | Unificar feature gating (1 sistema, no 2) |

---

## RESUMEN TOTAL

| Bloque | Tareas | Impacto |
|--------|--------|---------|
| **Onboarding Existing** (URL AutoFill + integraciones) | 5 | ★★★★★ DIFERENCIADOR |
| **Onboarding Idea** (Competitor URLs + Hypothesis Score) | 4 | ★★★★★ DIFERENCIADOR |
| **Onboarding Generative** (mejoras) | 3 | ★★★☆☆ |
| **Onboarding Emergency** (mejora) | 1 | ★★☆☆☆ |
| **Sidebar adaptativo** | 5 | ★★★★★ |
| **HowItWorks completo** | 11 | ★★★★☆ |
| **UnlockProgress everywhere** | 3 | ★★★★★ |
| **Colores branding** | 3 | ★★★☆☆ |
| **Estilo PostHog** | 5 | ★★★★☆ |
| **Empty states** | 6 | ★★★★☆ |
| **Cleanup** | 3 | ★★★☆☆ |
| **TOTAL** | **49 tareas** | |

## ORDEN DE EJECUCIÓN

```
BLOQUE D (colores) → E (estilo PostHog) → A (sidebar) → ONBOARDING (4 paths) → C (unlock) → F (empty) → B (HowItWorks) → G (cleanup)
```

1. Colores + estilo primero — toda UI posterior usa la paleta correcta
2. Sidebar adaptativo — la estructura de navegación
3. Onboarding — el flujo de entrada (los 4 paths)
4. Unlock + Empty — eliminar pantallas vacías
5. HowItWorks — documentación de features
6. Cleanup — limpieza final
