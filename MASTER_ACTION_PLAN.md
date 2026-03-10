# MASTER ACTION PLAN — Nova Hub (Optimus-K)
> **Fuente:** ENGINE_DESIGN.md + chattt.txt (documento fundacional) + chatttt2.txt (documento avanzado) + auditoría de código Claude
> **Fecha:** 2026-02-24
> **Estado:** PLAN DE DISEÑO E IMPLEMENTACIÓN — no ejecutado aún
> **Propósito:** Lista completa y ordenada de TODO lo que falta para que el sistema esté terminado

---

## Índice

| Tier | Nombre | Items | Tipo |
|------|--------|-------|------|
| [TIER 0](#tier-0-fundamentos-matemáticos-y-de-datos) | Fundamentos — Matemáticas y datos | 8 | Diseño + DB |
| [TIER 1](#tier-1-los-4-motores-estratégicos) | Los 4 motores estratégicos | 12 | Backend + Lógica |
| [TIER 2](#tier-2-onboarding--primera-experiencia) | Onboarding y primera experiencia | 10 | UX + Backend |
| [TIER 3](#tier-3-ux-core--superficies-del-motor) | UX Core — Superficies del motor | 14 | Frontend |
| [TIER 4](#tier-4-sistema-de-roles-fix-crítico) | Sistema de roles — Fix crítico | 8 | Backend + Frontend |
| [TIER 5](#tier-5-optimus--psicología-del-sistema) | Optimus y psicología del sistema | 12 | IA + UX |
| [TIER 6](#tier-6-notificaciones-layers-2-5) | Notificaciones (Layers 2–5) | 6 | Backend |
| [TIER 7](#tier-7-content--playbooks) | Contenido y playbooks | 7 | Contenido |
| [TIER 8](#tier-8-features-por-fase-y-modo) | Features por fase y modo | 6 | Arquitectura |
| [TIER 9](#tier-9-sistemas-avanzados) | Sistemas avanzados | 8 | Backend + UX |
| [TIER 10](#tier-10-monetización--planes) | Monetización y planes | 5 | Backend + UX |
| [TIER 11](#tier-11-edge-cases) | Edge cases | 10 | Backend + UX |
| [TIER 12](#tier-12-mvp-scope) | Definición del MVP real | — | Estrategia |

---

## TIER 0: Fundamentos Matemáticos y de Datos

> **Bloquea todo lo demás.** Sin estas definiciones, ningún motor puede implementarse.
> **Tipo:** Diseño + base de datos + lógica pura

### 0.1 — Iteration Velocity — CERRADA ✅ (2026-02-24)

**Definición final:**
```
iteration_velocity = número de OBVs con resultado documentado
                     en los últimos 28 días (rolling window)

Cuenta: OBVs con resultado registrado (positivo O negativo)
No cuenta: KPIs, tareas, reuniones, documentos, trabajo interno
No cuenta: OBVs sin resultado, OBVs cancelados, OBVs editados (no generan nueva iteración)
No cuenta: OBVs duplicados salvo que el resultado sea distinto
Especial: Proyecto pausado → velocity se congela, no baja
```

**Clasificación:**
```
0   → Crítico
1   → Fricción
2   → Saludable mínimo
3   → Alto rendimiento
4+  → Excelente
```

**Normalización a 0–100:**
```
velocity_score = MIN(100, iteration_velocity × 25)
// 0=0, 1=25, 2=50, 3=75, 4+=100
```

**Integración en Phase Engine:**
```
Velocity actúa como condición estructural mínima, NO como gate de puntuación.
Para avanzar de fase se requiere:
  - Phase Score ≥ 75%
  - Hard Signal cumplido
  - iteration_velocity > 0 en los últimos 28 días

Si velocity = 0  → no puede avanzar (inactividad total)
Si velocity ≥ 1  → puede avanzar si lo demás es fuerte
NO se exige velocity ≥ 2 como gate duro (evita bloqueos artificiales)
```

**Integración en Probability Engine:**
```
Velocity NO entra como variable independiente.
Vive dentro de execution_rate:

execution_rate =
  (velocity_score       × wV)
+ (task_completion_rate × wT)
+ (role_execution_health× wR)
= MIN(100, resultado)

Pesos por fase (siempre suman 1.00):
         wV     wT     wR
  Fase 1: 0.60  0.25  0.15  → aprendizaje domina
  Fase 2: 0.55  0.30  0.15  → más "hacer", menos iterar
  Fase 3: 0.45  0.35  0.20  → ejecución consistente
  Fase 4: 0.35  0.45  0.20  → escala = tareas > velocidad

Fórmula de probability:
  probability =
    (phase_score        × 0.35)
  + (execution_rate     × 0.20)
  + (validation_strength× 0.15)
  + (revenue_momentum   × 0.15)
  + (capacity_health    × 0.15)
  = 1.00
```

**Integración en Risk Score:**
```
velocity = 0 durante 4 semanas → RiskScore.ExecutionDrop = alto → warning
velocity = 0 durante 8 semanas → estado ESTANCAMIENTO (escala progresivamente, no bloquea)
```

**Integración en Viability Engine:**
```
Se activa revisión estructural si concurren los 3:
  - velocity = 0
  - phase_score estancado
  - probability < 50
  durante 8 semanas consecutivas
Nunca por velocity sola.
```

**Solo founder:**
```
No se modifica la fórmula de velocity.
Se ajusta capacity_health, no velocity.
Un founder puede tener velocity alta aunque esté sobrecargado — son dimensiones distintas.
```

---

### 0.2 — evidence_quality_score — CERRADA ✅ (2026-02-24)

**Fórmula final por OBV:**
```
final_evidence_score = MIN(100,
  evidence_base_score × verification_multiplier × decay_factor
)
```

**Paso 1 — evidence_base_score (tipo más fuerte del OBV):**
```
Pago real verificable (factura, Stripe con metadata)  → 90
Contrato / LOI firmado                                → 80
Entrevista grabada (audio/video)                      → 75
Test landing con métricas verificables                → 70
Screenshot conversación cliente real                  → 65
Encuesta estructurada con respuestas reales           → 55
Texto auto-declarado sin adjuntos                     → 30
Sin evidencia                                         →  0
```

**Paso 2 — verification_multiplier (solo el más alto, nunca acumulan):**
```
Peer validated (confirmado por otro usuario)  → ×1.15
URL externa verificable                       → ×1.10
Auto-declarado sin validación                 → ×1.00
Marcado como inconsistente                    → ×0.70
```

**Paso 3 — decay_factor (relevancia temporal):**
```
Semanas 0–8  → 1.00
Semana 9     → 0.90
Semana 10    → 0.80
Semana 11    → 0.70
Semana 12    → 0.60
Semana 13+   → 0.50 (suelo mínimo)

decay_factor = MAX(0.50, 1 - ((semanas_desde_creación - 8) × 0.10))
Solo aplica si semanas_desde_creación > 8
```

**Cómo se convierte en validation_strength:**
```
Paso 1 — validation_raw (promedio ponderado por tipo de OBV, últimas 8 semanas):
  revenue_validation   → peso ×1.3
  customer_discovery   → peso ×1.0
  operational_system   → peso ×0.8

  validation_raw = Σ(final_evidence_score × type_weight) / Σ(type_weight)

Paso 2 — consistency_factor (volumen de OBVs):
  consistency_factor = MIN(1.2, 1 + (n_OBVs_válidos / 10))
  // 1 OBV=×1.1 · 3 OBVs=×1.3 · 5+ OBVs=×1.2 (cap)

Paso 3:
  validation_strength = MIN(100, validation_raw × consistency_factor)
```

**Edge cases:**
```
OBV sin evidencia adjunta            → base_score = 0
OBV solo texto                       → base_score = 30
OBV con pago real + URL              → 90 × 1.10 × decay (casi 100)
OBV >13 semanas                      → decay_factor = 0.50 (sigue contando)
Proyecto nuevo sin OBVs              → validation_strength = 0
  (protegido por Day 1 Probability warm strategy)
```

**Qué NO mide:** cantidad (eso es velocity), actividad, opinión del founder.
**Qué SÍ mide:** profundidad, verificabilidad, consistencia, tipo de validación.

---

### 0.3 — Capacidad del solo founder — CERRADA ✅ (2026-02-24)

**Principio:** El error no era el baseline, era modelar igual equipo e individuo.
El verdadero coste en equipo no es solo trabajo — es coordinación y fricción.

**Baseline: 100 unidades para todos (no se diferencia)**

**Coste por actividad según modo:**

```
                    EQUIPO    SOLO FOUNDER
OBV activo          10        7   (sin coordinación ni sincronización)
Tarea activa         3        2   (más foco, menos fricción)
Reunión             10        6   (solo externas; sin reuniones internas)
```

**Verificación con ejemplo estándar:**
```
SOLO FOUNDER:                    EQUIPO:
3 OBVs  × 7  = 21               3 OBVs  × 10 = 30
8 tareas × 2 = 16               8 tareas × 3  = 24
2 reun.  × 6 = 12               2 reun.  × 10 = 20
Total = 49% → Normal ✅          Total = 74% → Cerca de warning ✅
```

**Umbrales de capacidad:**
```
              WARNING    CRÍTICO
Equipo        ≥ 75%      ≥ 85%
Solo founder  ≥ 80%      ≥ 92%
```

**Por qué estos umbrales:**
- Solo founder puede sostener más carga sin fricción de coordinación
- Pero sigue teniendo límite humano real
- Umbral crítico en 92% detecta burnout sin falsos positivos

**Qué NO se hizo:**
- ❌ Baseline distinto (120 unidades) → rompería comparación entre proyectos
- ❌ Umbrales muy bajos → nunca detectaría burnout real

**Nota implementación:** `capacity_health` entra en Probability con peso 15%.
Formula: `capacity_health = MAX(0, 100 - capacity_used_percent)`

---

### 0.4 — Calibrar el "Day 1 Probability Problem"

**Problema:** En Fase 1, día 1, sin datos:
```
probability = (0 × 0.35) + (50 default × 0.20) + (0 × 0.15) + (30 neutral × 0.15) + (0 × 0.15)
            = 0 + 10 + 0 + 4.5 + 0
            = 14.5 / 100 → CRÍTICO
```
Un usuario nuevo ve inmediatamente que su probabilidad es "crítica". Esto **mata la motivación.**

**Decisión: D como base + C como condición técnica — CERRADA ✅ (2026-02-24)**

**Estado inicial:**
```
probability_status  = "INACTIVE"
probability_display = "N/A"

Mensaje UX: "Tu probabilidad se activa cuando tengamos señales reales de ejecución."
```

**Condición de activación (≥2 de 5 inputs con datos reales ≠ default):**
```
1. phase_score > 0
2. execution_rate > 0
3. validation_strength > 0
4. revenue_momentum con datos reales
5. capacity_health calculado con actividad real

Con que 2 estén activos → se calcula y muestra
```

**UX Día 1:**
```
FASE 1 · 12%
Probabilidad: —
Riesgo: —
Tooltip: "La probabilidad se calcula cuando haya suficiente evidencia de ejecución."
```

**UX tras activación:**
```
Probabilidad: 48
Microcopy: "Tu probabilidad ya se está calculando en base a tus primeras acciones."
(No dramatizar si es baja — es normal en arranque)
```

**capacity_health — condición de señal real:**
```
Solo cuenta como input real si hay actividad mínima en la ventana:
  ≥1 tarea creada o completada, O
  ≥1 OBV activo/creado, O
  ≥1 reunión registrada

Sin actividad → capacity_health_status = "NO_SIGNAL"
               → no cuenta para la regla de activación (≥2 inputs reales)

Razón: capacity_used=0 → capacity_health=100 sin actividad.
       Eso no es señal real, es ausencia de datos.
```

**Mientras INACTIVE — bloqueado:**
```
- No se disparan notificaciones de probabilidad
- No se activa Viability Engine
- No hay color rojo
- El sistema está en modo "arranque"
```

**Por qué NO B (warm start):** infla el score artificialmente → luego cae con datos reales → sensación de "empeoré" — peor que empezar en N/A.
**Por qué NO A (bloqueo temporal):** el tiempo no es la señal relevante, la ejecución sí. Un usuario puede generar datos en 5 días.

**Principio:** La probabilidad no existe hasta que existe.

---

### 0.5 — Thresholds Fase 1 (Descubrimiento) — CERRADA ✅ (2026-02-24)

**Objetivo de Fase 1:** Demostrar que existe un problema real, frecuente y doloroso en un segmento definido.

**Hard Signal (las 3 condiciones simultáneas para avanzar a Fase 2):**
```
1. ≥10 entrevistas reales documentadas
2. ≥30% de entrevistados confirman el problema como frecuente y relevante
3. Problema + segmento definidos explícitamente en el sistema
Si no se cumplen las 3 → no avanza aunque phase_score ≥ 75%
```

**Outcomes medibles:**
```
O1.1 — Volumen de entrevistas (peso 0.40)
  score = MIN(100, (n_entrevistas / 10) × 100)
  Saludable: ≥10 entrevistas en ≤6 semanas
  Fricción:  5–9 entrevistas en 6 semanas
  Crítico:   <5 entrevistas tras 8 semanas

O1.2 — Claridad y recurrencia del problema (peso 0.40)
  base = MIN(100, (porcentaje_dolor / 30) × 100)
  if n_entrevistas < 5 → O1.2_score = base × 0.5  (penalty por muestra pequeña)
  if n_entrevistas ≥ 5 → O1.2_score = base
  Razón: 2 entrevistas con 1 sí = 50% → sin penalty daría 100. Estadísticamente incoherente.
  Saludable: ≥30% expresan dolor claro y repetido + patrón consistente documentado
  Fricción:  10–29% muestran interés o dolor moderado, patrón ambiguo
  Crítico:   <10% muestran dolor relevante, hipótesis cambia constantemente

O1.3 — Foco en segmento definido (peso 0.20)
  Segmento preciso + ≤1 pivot en 4 semanas          → 100
  Segmento definido pero amplio + ≤2 pivots          →  75
  Segmento amplio + 2–3 pivots                       →  50
  Indefinido o ≥4 pivots                             →   0
  (escala 4 niveles para evitar saltos bruscos entre 50 y 100)

  DEFINICIÓN COMPUTABLE DE PIVOT:
  pivot_event = cambio guardado en cualquiera de {segment, problem, value_prop}
  Solo cuenta si se crea nuevo record en strategic_model_versions (no edición de texto)
  pivot_count = número de records en strategic_model_versions en últimas 4 semanas
```

**Phase 1 Score:**
```
phase1_score = (O1.1 × 0.40) + (O1.2 × 0.40) + (O1.3 × 0.20)

≥ 75% → Saludable
50–74% → Fricción
< 50% → Crítico
```

**Alertas temporales:**
```
4 semanas sin ≥1 entrevista       → warning
6 semanas sin ≥5 entrevistas      → fricción
8 semanas sin ≥5 entrevistas      → crítico
Solo founder: +2 semanas en todos los umbrales temporales
```

**Requisitos numéricos (solo founder NO tiene tolerancia aquí):**
```
Las 10 entrevistas y el 30% son iguales para todos.
Solo el tiempo tiene tolerancia +2 semanas para solo founder.
```

**Condiciones que bloquean avance:**
```
- 10 entrevistas pero dolor < 30%
- Dolor fuerte pero < 10 entrevistas
- Cambia de hipótesis cada semana
- iteration_velocity = 0 en últimas 4 semanas
```

**Qué mide Fase 1:** exposición real al mercado, claridad del problema, disciplina estratégica.
**Qué NO mide:** entusiasmo, idea brillante, prototipo bonito.

---

### 0.6 — Thresholds Fase 3 (Operación) — CERRADA ✅ (2026-02-24)

**Objetivo de Fase 3:** El sistema genera ingresos repetibles sin depender del caos ni del founder al límite.

**Hard Signal (las 3 condiciones simultáneas para avanzar a Fase 4):**
```
1. ≥3 meses estables dentro de ventana de 4 meses (ver definición abajo)
2. Cash flow positivo o neutro (confidence: HIGH) durante esos meses
3. ≥1 función crítica no depende exclusivamente del founder
   (Solo founder: sustituir por procesos documentados en Demand + Delivery)
```

**Definición de "mes estable":**
```
Mes 1:  stability_check = PASS (sin baseline)
Mes 2:  ingresos_mes2 ≥ 0.75 × ingresos_mes1
Mes 3+: ingresos_mesN ≥ 0.75 × AVG(ingresos_mes-1, ingresos_mes-2)
        AND cash_flow ≥ 0

Reglas adicionales del hard signal:
  - No puede haber 2 meses negativos consecutivos
  - Un mes negativo no puede ser < -20% del promedio previo
```

**Cash flow confidence:**
```
HIGH: costes reales registrados en ≥2 de los 3 meses evaluados → puede avanzar a F4
LOW:  se usa margen estimado por model_type → puede operar, NO puede avanzar a F4

Margen estimado por model_type (cuando no hay costes reales):
  SaaS / Software    → 75%
  Servicio           → 50%
  Producto físico    → 35%
  Marketplace        → 60%
  Agencia híbrida    → 55%
  Sin definir        → 50% (conservative default)

estimated_cash_flow = ingresos_mes × margen_estimado
```

**Outcomes medibles:**
```
O3.1 — Consistencia de ingresos (peso 0.40)
  score = MIN(100, (meses_estables_en_ventana_4 / 3) × 100)
  3 meses → 100 · 2 meses → 66 · 1 mes → 33 · 0 → 0

O3.2 — Salud operativa (peso 0.35)
  O3.2_score =
    (capacity_health × 0.50)
  + (execution_rate  × 0.30)
  + (bloqueo_penalty × 0.20)

  bloqueo_penalty = MAX(0, 100 - (friction_count × 15) - (critical_count × 40))
  Ejemplos: 0 bloq=100 · 1fric=85 · 2fric=70 · 1crit=60 · 1crit+1fric=45 · 2crit=20

  Condición estructural adicional (no se suma, cap):
    si iteration_velocity = 0 durante ≥4 semanas → O3.2_score = MIN(O3.2_score, 40)

O3.3 — Descentralización mínima (peso 0.25)
  ≥1 función crítica cubierta por otro miembro        → 100
  Founder cubre todo con procesos documentados         →  60
  Founder central en todo sin sistema                  →  20

  Solo founder: sustituir por escala de documentación:
    Procesos documentados en ≥2 funciones críticas     →  60 (máximo alcanzable)
    → cap natural: Phase3_score_max_solo = 40+35+15 = 90
```

**Phase 3 Score:**
```
phase3_score = (O3.1 × 0.40) + (O3.2 × 0.35) + (O3.3 × 0.25)
≥75% → Saludable · 50–74% → Fricción · <50% → Crítico
Hard signal debe cumplirse para avanzar (independiente del score)
```

**Duración esperada y alertas:**
```
Normal: 8–16 semanas
8 sem sin 2 meses consecutivos estables  → Warning
12 sem sin estabilidad                   → Fricción
20 sem sin estabilidad                   → Crítico estructural
Solo founder: +2 semanas en todos los umbrales temporales
```

**Qué mide Fase 3:** estabilidad, repetibilidad, no fragilidad.
**Qué NO mide:** crecimiento explosivo, tracción nueva, innovación.

---

### 0.7 — Thresholds Fase 4 (Escala) — CERRADA ✅ (2026-02-24)

**Qué mide Fase 4:** crecimiento consistente, márgenes estables, equipo que no depende del founder.
**Qué NO mide:** tamaño absoluto, velocidad de expansión, innovación de producto.

#### Hard Signal (todos obligatorios — 6 condiciones)
```
1. ≥3 meses con crecimiento ≥10% dentro de ventana de 4 meses
2. Sin 2 meses negativos consecutivos
3. Sin ningún mes por debajo de -10%
4. Promedio de los 4 meses ≥10%
5. Margen bruto estable: variance_margen ≤ 0.15
6. Sin critical_block activo durante el período
```
*(capacity_health se evalúa como variable continua en O4.2, no como gate duro)*

**Tolerancia ventana:** se evalúan los últimos 4 meses disponibles (rolling, no calendario).
Hard signal se cumple si ≥3 de esos 4 meses cumplen las condiciones individuales.

#### O4.1 — Crecimiento sostenido (peso: 0.40)
```
O4.1 = MAX(0, MIN(100, (avg_growth_4m / 0.15) × 100))

Ejemplos:
  avg_growth =  5%  → 33
  avg_growth = 10%  → 67
  avg_growth = 15%  → 100
  avg_growth = 20%  → 100 (cap)
  avg_growth = -5%  → 0   (floor, no negativo)
```
`avg_growth_4m` = promedio de tasas de crecimiento mensual de los 4 meses de la ventana.

#### O4.2 — Execution & margin health (peso: 0.35)
```
variance_margen = (max_margen_4m - min_margen_4m) / promedio_margen_4m
  (rango relativo sobre el promedio; unidad: decimal, ej. 0.12 = 12%)

margin_stability_score = MAX(0, MIN(100, (1 - variance_margen) × 100))

O4.2 = (capacity_health       × 0.40)
     + (execution_rate        × 0.30)
     + (margin_stability_score × 0.30)
```
Suma de pesos: 0.40 + 0.30 + 0.30 = 1.00 ✅

Ejemplo: márgenes 65%/80%/70%/72% → max=80, min=65, avg=71.75 → variance=0.209 → margin_stability_score=79.1

#### O4.3 — Independencia del founder (peso: 0.25)
```
≥3 funciones críticas en manos de miembros distintos → 100
≥2 funciones críticas delegadas                      → 70
Founder central, sin sistema                         → 30

Solo founder:
  Max O4.3 = 70 (sin automatización estructural)
  Si ≥2 funciones con automation_score ≥70 Y coverage_level = strong → max 100

Cap natural solo (sin automatización):
  100×0.40 + 100×0.35 + 70×0.25 = 92.5
```

#### Definición: automation_score (para solo founder O4.3)
```
automation_score =
    (sistema_automatizado_real    ? 40 : 0)
  + (proceso_con_checklist_activo ? 35 : 0)
  + (metricas_auto_generadas      ? 25 : 0)

sistema_automatizado_real = TRUE si cumple al menos UNA categoría:
  A) Integración externa vía API/webhook (persistent, sin intervención manual)
  B) Pipeline de datos automatizado (event/scheduler, sin intervención manual)
  C) Sistema de notificaciones auto-disparadas (rule-based, sin intervención manual)
  D) Proceso recurrente con scheduler (cron/trigger, sin intervención manual)

NO califica: dashboards manuales, docs en Notion, plantillas, scripts ejecutados manualmente
REQUISITO ADICIONAL: conectado al proyecto + ejecutado ≥1 vez en últimos 30 días

Umbral: automation_score ≥70 requiere sistema_automatizado_real (40) + al menos uno más:
  sistema + proceso = 75 ✅
  sistema + métricas = 65 ✗
  proceso + métricas = 60 ✗
  → sistema_automatizado_real es obligatorio para llegar a 70
```

#### Definición: coverage_level (para O4.3 solo founder)
```
coverage_score =
    (owner_assigned              ? 30 : 0)
  + (≥3 tareas completadas 4w   ? 30 : 0)
  + (sin critical_block activo  ? 20 : 0)
  + (documented_process_exists  ? 20 : 0)

≥70 → strong | 40–69 → basic | <40 → none

DEPENDENCIA: task.function_id debe existir en schema (F1.11 / Fase 2)
```

#### Definición: critical_block
```
duration_points = MIN(40, duration_weeks × 10)

execution_penalty:
  0  si execution_rate ≥ 70
  10 si 50 ≤ execution_rate < 70
  20 si execution_rate < 50
  (v1: usar execution_rate global del proyecto como proxy de causalidad)

impact_weight =
    (funcion_critica ? 40 : 20)
  + duration_points
  + execution_penalty

impact_weight ≥ 70  → critical_block
40–69               → friction_block
<40                 → minor_signal

funcion_critica = TRUE si function.type ∈ {demand, delivery, cash}
  Sub-funciones (marketing, ventas, etc.) mapeadas internamente a una de las 3 macro-funciones.
  No editable por el founder (evita gaming y mantiene comparabilidad entre proyectos).
```

#### Fórmula Phase 4 Score
```
phase4_score = (O4.1 × 0.40) + (O4.2 × 0.35) + (O4.3 × 0.25)

≥80%   → Healthy scale
60–79% → Fragile scale
<60%   → Unstructured growth
```

#### Alertas temporales
```
4 sem sin crecimiento ≥10%   → Warning
8 sem sin hard signal        → Fricción
16 sem sin graduación        → Crítico estructural
Solo founder: +2 semanas en todos los umbrales temporales
```

#### Duración esperada
```
12–24 semanas
```

---

### 0.8 — OBV Types en schema — CERRADA ✅ (2026-02-24)

#### 4 tipos formales
```
customer_discovery   → peso ×1.0  (entrevistas, descubrimiento de problema)
product_validation   → peso ×1.1  (validación de que la solución funciona)
revenue_validation   → peso ×1.3  (alguien paga — señal estructural superior)
operational_system   → peso ×0.8  (validación de proceso interno)
```

#### Relevancia por fase (orientativa, no restrictiva)
```
Fase 1 → customer_discovery (principal)
Fase 2 → product_validation + revenue_validation
Fase 3 → revenue_validation + operational_system
Fase 4 → operational_system (principal)
```
Los tipos están disponibles en todas las fases. El Phase Engine usa relevancia contextual, no bloqueo por tipo.

#### Regla: un OBV = un tipo primario
Determinado por la hipótesis central que se está testeando:
- "¿El problema existe?" → `customer_discovery`
- "¿La solución funciona?" → `product_validation`
- "¿Alguien paga?" → `revenue_validation`
- "¿El proceso funciona?" → `operational_system`

#### Forzado automático por pago verificado
```
si evidence_type = payment_verified
AND evidence_status = active
→ obv.type = revenue_validation (automático, no editable mientras evidencia activa)

Genera event_log:
  type_auto_updated = TRUE
  reason = "verified_payment_detected"

Notificación founder:
  "Hemos actualizado este OBV a revenue_validation porque se detectó un pago verificado."
```

#### Reversión automática del tipo
El tipo revierte al valor anterior declarado si ocurre cualquiera de:
```
- evidence deleted
- evidence_status = invalid
- evidence_status = test_mode  (Stripe test mode excluido explícitamente)
- evidence_status = refund
- founder activa dispute_flag = TRUE → fuerza re-evaluación
```
Toda reclasificación genera event_log. No hay cambios silenciosos.

#### Señal de aceleración de fase
```
si current_phase = 1
AND existe OBV con type = revenue_validation AND evidence_status = active
→ phase_acceleration_signal = TRUE
→ Phase Engine recalcula inmediatamente
→ Notificación: "Has registrado un ingreso. Recalculando tu fase según tus señales actuales."
```
El Phase Score decide si se puede avanzar. No hay condiciones adicionales paralelas.
No fuerza avance. No modifica RiskScore ni otros motores.

#### Definición de `payment_high_confidence` (unificada con F1.2)

**Fuente única de verdad: `verification_multiplier` de F1.2. No existe `payment_confidence` como campo separado.**

```
payment_high_confidence = TRUE
si verification_multiplier ∈ {1.10, 1.15}

→ activa: auto-type revenue_validation, phase_acceleration_signal,
          cuenta para hard signals F2/F3/F4

payment_high_confidence = FALSE
si verification_multiplier ∈ {1.00, 0.70}

→ OBV se registra como revenue_validation con confidence baja.
  No dispara aceleración ni hard signals.
  Sigue contando como evidencia con su peso reducido.
```

Opcional v1: guardar `verification_reason ENUM(url, peer, structured_fields, self, inconsistent)`
para legibilidad en UI. La lógica siempre se decide por el multiplier.

#### 3 rutas para `verification_multiplier = 1.10 / 1.15`

**Ruta A — URL verificable** → multiplier = 1.10
```
Enlace a recibo/factura con ID, fecha e importe visibles
(Stripe invoice, Paddle receipt, Shopify order, etc.)
verification_reason = 'url'
```

**Ruta B — Peer validation** → multiplier = 1.15
```
Peer = usuario que cumple TODAS:
  - No es el founder principal del proyecto
  - Pertenece al mismo proyecto (miembro/colaborador invitado)
  - Rol ≠ 'viewer'
  - Cuenta con ≥7 días de antigüedad
  - ≥1 acción real en cualquier proyecto (tarea completada o OBV validado)

Solo founders sin colaboradores no pueden usar esta ruta.
verification_reason = 'peer'
```

**Ruta C — Campos estructurados + adjunto** → multiplier = 1.10
```
Formulario obligatorio:
  provider          TEXT     (Stripe, Paddle, Shopify, etc.)
  transaction_id    TEXT     (length ≥ 8)
  amount            NUMERIC  (> 0)
  currency          TEXT
  date              DATE     (no futura; within last 90 days)
  customer_identifier TEXT   (email/domain — hashed en DB)
  attachment        FILE     (screenshot/receipt obligatorio)

Validaciones mínimas del sistema:
  transaction_id.length ≥ 8
  amount > 0
  date ≤ today AND date ≥ today - 90 days

Si pago más antiguo de 90 días:
  → se registra normalmente como LOW confidence (multiplier = 1.00)
  → no dispara aceleración ni hard signals
  → sigue siendo evidencia válida con peso reducido

verification_reason = 'structured_fields'
```

#### Dependencias de schema (Fase 2)
```
evidence.status:              { active, deleted, invalid, test_mode, refund }
evidence.verification_reason: ENUM(url, peer, structured_fields, self, inconsistent)
evidence.payment_fields:      JSONB NULL  -- campos estructurados de Ruta C
obv.dispute_flag:             BOOLEAN
obv.type_auto_updated:        BOOLEAN
obv.type_auto_update_reason:  TEXT
obv.type_declared_original:   obv_type
event_log:                    tabla de cambios de tipo con timestamp y reason
```

---

### 0.6 — Risk Score — fórmula ausente del plan ✅ [+chattt.txt]

**Origen:** chattt.txt — completamente distinto al Probability Engine. Es el "Índice de Riesgo Operativo".

**Propósito:** Mientras el Probability Engine mide *momentum de avance*, el Risk Score mide *riesgo de colapso*. Son complementarios. Uno motiva, el otro disciplina.

**Fórmula:**
```
RiskScore =
  (RunwayFactor × 0.25)           // ¿Cuántos meses de runway quedan?
+ (RevenueConcentration × 0.20)   // ¿Depende de 1 cliente para >50% ingresos?
+ (ExecutionDrop × 0.20)          // ¿El loop semanal no se completa?
+ (ValidationWeakness × 0.20)     // ¿0 validaciones externas?
+ (BottleneckSeverity × 0.15)     // ¿Hay un rol crítico bloqueado?

→ Clasificado: Bajo / Medio / Alto / Crítico
```

**Cómo se muestra:**
- Discreto en el header: `Riesgo: ●` (punto de color: verde/amarillo/naranja/rojo)
- Solo se detalla en 3 momentos: cuando sube de categoría, en estancamiento, en Simulación Mode
- NUNCA se muestra como "probabilidad de fracaso" — siempre como "riesgo estructural actual"

**Ejemplo de output:**
```
⚠ Riesgo estructural: Alto
  · Sobrecarga operativa (al 132% de capacidad)
  · Canal de adquisición no validado
  · Dependencia de 1 cliente (73% de ingresos)
```

**Nueva tabla requerida:**
```sql
CREATE TABLE project_risk_score (
  project_id UUID,
  risk_level TEXT,  -- bajo|medio|alto|critico
  runway_factor NUMERIC(5,2),
  revenue_concentration NUMERIC(5,2),
  execution_drop NUMERIC(5,2),
  validation_weakness NUMERIC(5,2),
  bottleneck_severity NUMERIC(5,2),
  calculated_at TIMESTAMPTZ
);
```

---

### 0.7 — Phase 2 — thresholds concretos ✅ [+chattt.txt]

**Origen:** chattt.txt — los números exactos ya están definidos. Solo falta implementarlos.

**Outcome 2.1 — Problema-Solución validado:**
```
Saludable:  ≥10 entrevistas + interés ≥20%
Fricción:   <10 entrevistas tras 4 semanas, interés 10–15%
Crítico:    <10 entrevistas tras 8 semanas, interés <10% tras 2 iteraciones
```

**Outcome 2.2 — Primer ingreso o intención fuerte:**
```
Saludable:  ≥1 ingreso real antes de semana 6
            O ≥3 pre-compromisos (LOI, reserva, pago parcial)
Fricción:   0 ingresos en semana 6–8, conversión 5–10%
Crítico:    0 ingresos tras semana 10–12, conversión <5%,
            ≥3 iteraciones sin mejora
```

**Outcome 2.3 — Canal reproducible inicial:**
```
Saludable:  Canal genera leads consistentes 2 semanas seguidas + CAC estimado
Fricción:   Leads irregulares, sin medición de CAC
Crítico:    0 leads consistentes tras 6 semanas,
            dependencia de referrals casuales únicamente
```

**Alerta de inviabilidad Fase 2 (activa si se dan TODOS):**
- 0 ingresos
- ≥3 iteraciones sin mejora métrica
- Canal no identificado
- Conversión <5%
- Validación externa negativa repetida
- Todo ello durante 8–12 semanas

**Ajuste por work_mode:**
```
Solo founder:  +2 semanas de tolerancia en cada umbral
Equipo:        Menor tolerancia, ritmo esperado mayor
               Si no hay reuniones estructuradas → penalización execution_rate
```

**Tarea:** Replicar esta misma estructura de thresholds para Fase 1, 3 y 4 (aún no definidos con este nivel de detalle).

---

### 0.8 — Definir la Location Layer (datos obligatorios)

**Originado en:** chatttt2.txt análisis.

Todo proyecto debe tener como datos de base:
```
location = {
  country: "ES",                    // ISO 3166-1 alpha-2
  market_scope: "local" | "global", // ¿opera solo en su país o internacionalmente?
  cluster: "EU" | "US" | "LATAM" | "APAC" | "Other"
}
```

**Tarea:** Definir:
- ¿Es obligatorio en onboarding? (Sí — no se puede saltar)
- ¿Afecta thresholds del motor? (¿LATAM startup tiene tolerancias diferentes?)
- ¿De dónde vienen los benchmarks por región? (Fuente pendiente — ver 0.7)
- ¿Cómo se usa en el contexto de Optimus? ("En Europa, el ciclo de validación es...")

---

### 0.7 — Benchmarks v1 — CERRADA ✅ (2026-02-24)

#### Estrategia
```
v1 = Curados (Opción A)
Arquitectura = preparada para Híbrido (Opción C) desde el día 1
v2+ = transición a datos internos cuando n_proyectos_validos ≥ 30 por segmento
```

#### Tabla `benchmarks` (schema definitivo)
```sql
benchmarks
-----------
id               UUID
industry         TEXT
model_type       TEXT          -- SaaS, Service, Physical, Marketplace, Agency, Unknown
region_cluster   TEXT
metric_name      TEXT
p25              NUMERIC
p50              NUMERIC
p75              NUMERIC
source_type      TEXT          -- 'curated' | 'internal'
confidence_score INTEGER       -- 0–100 (ver tabla abajo)
updated_at       TIMESTAMPTZ
```
- Rangos, no números únicos
- `source_type` diferencia curado de interno
- Reemplazable progresivamente sin reescribir motor

#### Métricas v1 y su uso en motores
```
Métrica               Uso en motor           Tipo
──────────────────────────────────────────────────────
margen_estimado       F3/F4 Phase Engine     estructural (ya definido por model_type)
crecimiento_p50       Probability Engine     estructural (revenue_momentum_score)
conversión_media      Dashboard              informativo
ciclo_venta_medio     Dashboard              informativo (alerta si > p75)
ticket_medio          Dashboard              informativo
CAC_estimado          Dashboard              informativo
```

#### revenue_momentum_score (Probability Engine — peso 15%)
```
Caso normal (crecimiento_p50_benchmark > 0):
  growth_vs_benchmark = crecimiento_real / crecimiento_p50_benchmark
  revenue_momentum_score = MAX(0, MIN(100, (growth_vs_benchmark / 1.5) × 100))

Caso fallback (crecimiento_p50_benchmark ≤ 0):
  growth_vs_benchmark = crecimiento_real / 0.05   (referencia neutral: 5% mensual)
  revenue_momentum_score = MAX(0, MIN(100, (growth_vs_benchmark / 1.5) × 100))
  UI muestra: "Benchmark sectorial no positivo; usando referencia absoluta (5%/mes)."

Interpretación (ambos casos):
  Ratio 1.0× referencia →  ~67
  Ratio 1.5× referencia → 100
  Ratio 0              →   0
  Ratio negativo       →   0
```

Diseño: p50 exacto no da score perfecto (100 requiere 1.5× el benchmark).

#### confidence_score — tabla definitiva
```
source_type = curated:
  default                           → 60
  con fuente externa validada       → 70

source_type = internal:
  n_proyectos_validos < 30          → 50
  30–99                             → 80
  100–299                           → 90
  ≥300                              → 95

Cap absoluto: 95 (nunca 100)
```

#### Cómo se muestra al founder
```
0–49   → "Confianza: Baja"
50–69  → "Confianza: Media"
70–84  → "Confianza: Alta"
85–95  → "Confianza: Muy alta"

Texto contextual: "Benchmark basado en datos sectoriales estimados (confianza media)"
```

#### Transición a Híbrido (v2)
```
si n_proyectos_validos ≥ 30 por segmento:
  → source_type cambia a 'internal'
  → confidence_score se actualiza por tabla

Motor siempre usa el benchmark del segmento más específico disponible.
Fallback: industria → model_type → global si no hay datos suficientes.
```

#### Lo que NO hace en v1
```
❌ No mezcla curado e interno sin source_type explícito
❌ No usa número único (siempre rangos p25/p50/p75)
❌ No oculta fuente al founder
❌ No alimenta directamente Phase Score ni Execution Rate
```

---

### 0.9 — Viability Engine v1 — CERRADA ✅ (2026-02-24)

#### Filosofía v1
```
❌ No bloquea acciones
❌ No cambia fase
❌ No fuerza protocolos
❌ No activa Rescue Mode
❌ No altera Probability ni Phase Score

✔ Detecta patrones estructurales peligrosos
✔ Emite recomendación contextual
✔ Registra decisión del founder
```
Es un motor de advertencia estratégica, no de control. En v2 puede volverse más firme.

#### Evaluación
```
Método: cron job semanal (cada lunes)
Alcance: todos los proyectos activos
No tiempo real en v1
```

#### 4 Triggers v1

**Trigger 1 — Estancamiento prolongado**
```
iteration_velocity = 0
durante ≥4 semanas (4 evaluaciones consecutivas)
AND phase_score < 75

→ "Tu proyecto no está generando aprendizaje activo."
```

**Trigger 2 — Ingresos sin margen**
```
ingresos > 0
AND cash_flow < 0
durante ≥2 meses
AND cash_flow_confidence = HIGH   ← solo con datos reales

→ "Estás creciendo ingresos sin sostenibilidad financiera."

Si cash_flow_confidence = LOW:
  No se emite viability_event.
  Solo banner suave: "Para evaluar sostenibilidad financiera, registra tus costes reales."
```

**Trigger 3 — Crecimiento con sobrecarga**
```
crecimiento_real ≥ crecimiento_p50_benchmark
AND capacity_health < 55
durante ≥4 semanas

Fallback si benchmark ≤ 0 o no existe:
  crecimiento_real ≥ 0.05 (5% mensual — referencia absoluta)
  (nunca queda silencioso por tabla vacía)

→ "El crecimiento está tensionando tu sistema."
```

**Trigger 4 — Validación débil persistente**
```
validation_strength < 40
AND ≥6 semanas en misma fase

→ "Las señales de validación siguen siendo débiles."
```

#### Registro por evento
```
viability_event {
  project_id         UUID
  trigger_type       TEXT        -- stagnation | margin_risk | overload | weak_validation
  metrics_snapshot   JSONB       -- valores al momento del trigger
  timestamp          TIMESTAMPTZ
  recommendation_text TEXT
  founder_response   TEXT        -- accept | ignore | postpone
  postpone_until     DATE        -- nullable; solo si response = postpone
  resolved_at        TIMESTAMPTZ -- nullable
}
```

#### Respuestas del founder y comportamiento
```
Acción    Silencia    Registro    Efecto
accept    Oculta      Sí          Ejecuta acción sugerida (si aplica)
ignore    1 semana    Sí          Oculta hasta próxima evaluación semanal
postpone  2 semanas   Sí          postpone_until = current_week + 2

Si mismo trigger se activa 2 evaluaciones consecutivas sin accept:
  → añade nota: "Esta es la segunda vez que detectamos este patrón."
  Sin castigo. Sin cambio de estado.
```

#### Formato UX
```
⚠ Observación estratégica
Detectamos [condición].
Recomendación: [acción sugerida].
[Aceptar recomendación]  [Revisar más tarde]  [Ignorar]

Nunca: rojo, "crítico", "fallando", lenguaje de riesgo extremo.
```

#### Lo que NO hace en v1
```
❌ No activa Rescue Mode
❌ No altera Probability Engine
❌ No altera Phase Score
❌ No bloquea avance de fase
❌ No penaliza métricas
```

---

### 0.11 — engine_version — CERRADA ✅ (2026-02-24)

#### Decisión
```
engine_version se gestiona via tabla FK, no string libre ni regex.
Razón: CHECK(regex) solo valida formato — no evita versiones inexistentes,
       colisiones entre motores, ni despliegues sin registro formal.
```

#### Schema: `engine_versions`
```sql
engine_versions
- id          TEXT PRIMARY KEY     -- "phase_v1.0", "probability_v1.0", etc.
- motor       TEXT NOT NULL        -- 'phase' | 'probability' | 'viability' | 'execution'
- deployed_at TIMESTAMPTZ NOT NULL
- notes       TEXT
- is_active   BOOLEAN DEFAULT TRUE
```

#### Tablas que llevan `engine_version`
```sql
-- En cada tabla de outputs calculados:
engine_version TEXT NOT NULL REFERENCES engine_versions(id)

Tablas afectadas:
  phase_history        → engine_version → "phase_v1.0"
  probability_history  → engine_version → "probability_v1.0"
  viability_events     → engine_version → "viability_v1.0"
  execution_history    → engine_version → "execution_v1.0"  (si se persiste)

Tablas NO afectadas:
  tasks, obvs, benchmarks, project_functions,
  process_artifacts, config tables
```

#### Control en código (constante centralizada por motor)
```typescript
const PHASE_ENGINE_VERSION       = "phase_v1.0"
const PROBABILITY_ENGINE_VERSION = "probability_v1.0"
const VIABILITY_ENGINE_VERSION   = "viability_v1.0"
const EXECUTION_ENGINE_VERSION   = "execution_v1.0"
```
Si el valor no existe en `engine_versions` → FK falla inmediatamente.
Error ruidoso > error silencioso.

#### Protocolo de despliegue de nueva versión
```
1. INSERT en engine_versions con nueva id, motor, deployed_at, notes
2. Actualizar constante en código de la edge function
3. Desplegar función
4. Opcionalmente: is_active = FALSE en versión anterior (sin borrar)
```

#### Poplar inicial (v1 seed data)
```sql
INSERT INTO engine_versions (id, motor, deployed_at, notes) VALUES
  ('phase_v1.0',       'phase',       NOW(), 'Fórmula inicial F1.5/F1.6/F1.7'),
  ('probability_v1.0', 'probability', NOW(), 'Fórmula inicial F1.4'),
  ('viability_v1.0',   'viability',   NOW(), 'Triggers iniciales F1.10'),
  ('execution_v1.0',   'execution',   NOW(), 'Fórmula inicial F1.1');
```

---

### 0.12 — data_completeness_score — CERRADA ✅ (2026-02-24)

#### Propósito
Mide densidad y verificabilidad de datos registrados — no calidad ni éxito.
Evita que el sistema produzca outputs matemáticamente correctos pero epistemológicamente vacíos.

#### 5 dimensiones (v1)

**D1 — Activity Coverage (máx 20 pts)**
```
≥1 OBV en últimas 4 semanas                                          → 10 pts
≥3 tareas completed en 4 semanas
  con function_type ∈ {demand, delivery, cash} AND status='completed' → 10 pts
```
Tareas con function_type = NULL o 'support' no cuentan.

**D2 — Financial Data (máx 25 pts)**
```
costes registrados en los últimos 3 meses  → 15 pts
ingresos registrados en los últimos 3 meses → 10 pts

Si usa solo margen estimado → 0 pts (datos obsoletos o ausentes → 0 pts)
```
Confianza financiera es temporal: datos >3 meses = no confiables.

**D3 — Evidence Quality (máx 20 pts)**
```
≥1 OBV con verification_multiplier ≥ 1.10  → 20 pts
≥1 OBV con verification_multiplier = 1.00  → 10 pts
else                                        →  0 pts

Explícito: verification_multiplier = 0.70 → 0 pts
(evidencia inconsistente no suma completeness)
Nota UX si hay evidencia inconsistente: "tienes evidencia marcada como inconsistente"
```
No acumulativo — se aplica la rama más alta que se cumpla.

**D4 — Function Structure (máx 20 pts)**
```
≥1 función strong                                 → 20 pts
≥2 funciones basic (sin ninguna strong)           → 15 pts
≥1 función basic  (sin ninguna strong)            → 10 pts
else (todas none)                                 →  0 pts

strong domina — no suma con basic.
```
Incentiva cobertura amplia sin inflar: 3 basic sin strong → 15 (no 30).

**D5 — Strategic Definition (máx 15 pts)**
```
segment definido  → 5 pts
problem definido  → 5 pts
value_prop def.   → 5 pts

Válido si: campo NOT NULL AND length ≥ 10 chars
Fuente: project_strategy_current (inicializada con NULLs al crear proyecto)
```

#### Fórmula
```
data_completeness_score = D1 + D2 + D3 + D4 + D5
Cap natural: 100
```

#### Umbrales de confianza
```
< 50   → LOW CONFIDENCE  (probability_status = "LOW CONFIDENCE")
50–69  → Medium confidence (UI badge)
≥ 70   → High confidence
```

#### Efecto en el sistema
```
NO altera fórmulas de ningún motor
NO bloquea acciones
NO cambia Phase

Solo:
  < 50 → banner: "Tus métricas se calculan con datos incompletos."
  probability_status = "LOW CONFIDENCE"
  Viability Engine no dispara Trigger 2 si D2 = 0 (ya definido en F1.10)
```

#### Display en UI
```
Header:  Probability: 62  |  Confidence: Medium (58/100)
Tooltip: breakdown D1–D5 con puntos obtenidos y qué falta
```

#### Schema: `project_strategy_current`
```sql
project_strategy_current
- project_id   UUID PRIMARY KEY
- segment      TEXT NULL
- problem      TEXT NULL
- value_prop   TEXT NULL
- updated_at   TIMESTAMPTZ

-- Inicializar al crear proyecto:
INSERT INTO project_strategy_current(project_id, segment, problem, value_prop)
VALUES (new_project_id, NULL, NULL, NULL)

-- strategic_model_versions trackea cambios históricos.
-- project_strategy_current es la fuente actual para D5.
```

---

### R1.1 — RunwayFactor (RiskScore input) — CERRADA ✅ (2026-02-24)

**Peso en RiskScore:** 0.25
**Qué mide:** cuántos meses de vida le quedan al proyecto con el burn rate actual. A más runway, mayor riesgo el motor marca como menor (escala invertida: 0 = sin riesgo, 100 = máximo riesgo).

#### Instrumentación requerida
```
cash_on_hand NUMERIC(14,2) NULL       → campo añadido a project_economic_profile
cash_on_hand_updated_at TIMESTAMPTZ   → campo añadido a project_economic_profile
field_sources JSONB incluye "cash_on_hand": "declared"
```

#### Condiciones para que RunwayFactor sea calculable
```
1. cash_flow_confidence = HIGH  (costes reales registrados)
2. cash_on_hand IS NOT NULL
3. n_meses_con_costes ≥ 2 dentro de los últimos 3 meses

Si alguna condición no se cumple → RunwayFactor = NULL (no contribuye al RiskScore)
```

#### Cálculo
```
n = COUNT(meses con costes reales registrados dentro de los últimos 3 meses)

Si n < 2         → RunwayFactor = NULL
Si n >= 2:
  net_burn_month = MAX(0, AVG(costes_mes - ingresos_mes) sobre esos n meses)

  Si net_burn_month = 0  → runway = ∞ → RunwayFactor = 0 (sin riesgo)
  Si net_burn_month > 0  → runway_months = cash_on_hand / net_burn_month
```

#### Mapping runway_months → RunwayFactor (0 = sin riesgo, 100 = máximo)
```
runway ≥ 12 meses  → RunwayFactor = 0
9–12 meses         → RunwayFactor = 20
6–9 meses          → RunwayFactor = 40
3–6 meses          → RunwayFactor = 70
1–3 meses          → RunwayFactor = 90
<1 mes             → RunwayFactor = 100
```

#### Con LOW confidence o sin datos
```
RunwayFactor = NULL
→ RiskScore tendrá risk_status = 'low_confidence' si no hay suficientes inputs reales
```

---

### R1.4 — RevenueConcentration (RiskScore input) — CERRADA ✅ (2026-02-24)

**Peso en RiskScore:** 0.20
**Qué mide:** riesgo de depender de muy pocos clientes para la mayoría de los ingresos.

#### Input v1 (declarado)
```
Campo: top_client_revenue_percent NUMERIC(5,2) NULL
Tabla: project_economic_profile (campo añadido)
field_sources JSONB: {"top_client_revenue_percent": "declared"}

Si NULL → RevenueConcentration = NULL (no contribuye al RiskScore)
```
En v2: reemplazable por `computed` cuando existan invoices/CRM desglosados por cliente.

#### Mapping top_client_revenue_percent → riesgo (0–100)
```
≤20%         → 0
>20% – ≤40%  → 25
>40% – ≤60%  → 50
>60% – ≤80%  → 75
>80%         → 95

Cap: 100
```

#### Notas de implementación
```
Datos declarados → risk_status puede ser 'low_confidence' si data_completeness < 50
En v2: campo pasa de 'declared' a 'computed' automáticamente cuando
       hay datos de ingresos por cliente disponibles (HHI o top-3 opcional)
```

---

### R1.5 — BottleneckSeverity (RiskScore input) — CERRADA ✅ (2026-02-24)

**Peso en RiskScore:** 0.15
**Qué mide:** severidad del bloqueo estructural activo más grave + acumulación de bloqueos activos.

#### Fuente de datos
```
Tabla: strategic_blocks (D2.10)
Filtro activos: resolved_at IS NULL AND status IN ('active', 'monitoring')
Origen: 'manual' (founder declara) | 'engine' (motor detecta patrón estructural)
En v1: manual es la fuente principal; engine solo para 1–2 casos simples de detección automática.
```

#### Fórmula de agregación
```
Sea B = lista de bloques activos ordenados por impact_weight DESC

Si |B| = 0:
  BottleneckSeverity = 0   ← No NULL. Dato disponible = sin riesgo.

Si |B| ≥ 1:
  top3 = primeros MIN(3, |B|) bloques por impact_weight
  BottleneckSeverity = MIN(100,
    MAX(B.impact_weight) × 0.70
    + AVG(top3.impact_weight) × 0.30
  )
```

**Lógica:**
- `MAX × 0.70` → el bloqueo más severo domina
- `AVG(top3) × 0.30` → captura acumulación sin necesitar factor de normalización mágico
- Si hay 1 bloque: MAX = AVG → fórmula collapsa a `impact_weight × 1.0` (correcto)
- Si hay 3+ bloques mediocres: el AVG sube y penaliza, pero no tanto como 1 bloque catastrófico

#### impact_weight (de F1.7)
```
impact_weight = (funcion_critica ? 40 : 20)
              + MIN(40, weeks_active × 10)
              + execution_penalty

funcion_critica = TRUE si function.type ∈ {demand, delivery, cash}
execution_penalty: definido en F1.7 (penalización por execution rate bajo)
```

#### Ciclo de vida de un bloque
```
Estado activo:  resolved_at IS NULL, status IN ('active', 'monitoring')
Estado resuelto: resolved_at IS NOT NULL, status = 'resolved'

Se resuelve cuando:
  → Founder lo marca como resuelto (manual)
  → La tarea asociada pasa a status = 'completed'
  → El engine detecta que la condición desapareció (solo origin = 'engine')

Re-apertura:
  Si el mismo bloque vuelve a activarse:
    → Pasaron >7 días desde resolved_at → nuevo bloque (nuevo id)
    → Pasaron ≤7 días desde resolved_at → se reabre (resolved_at = NULL, reopen_count + 1)
```

#### NULL guard
```
NULL solo si el motor está desactivado (no aplica en v1).
0 bloques activos → BottleneckSeverity = 0 (contribuye al RiskScore con valor bajo)
```

#### Dependencias de schema
```
Requiere D2.10 strategic_blocks (schema definitivo):
  - id, project_id, origin ('manual'|'engine')
  - function_id FK → project_functions (nullable)
  - task_id FK → tasks (nullable)
  - impact_weight NUMERIC(5,2) — computado y almacenado en cada evaluación
  - status TEXT ('active'|'monitoring'|'resolved')
  - first_detected_at, last_updated_at, resolved_at
  - reopen_count INTEGER DEFAULT 0
  - engine_version FK → engine_versions (solo cuando origin = 'engine')
  - created_by UUID FK → auth.users (solo cuando origin = 'manual')
  - description TEXT (descripción del bloqueo)
```

---

### D2.10 — strategic_blocks — CERRADA ✅ (2026-02-24)

**Propósito:** Fuente única de verdad de bloqueos activos por proyecto. Alimenta BottleneckSeverity (R1.5). Una tarea está bloqueada si existe un registro activo con `block_type = 'task_blocked'` para ese `task_id`. No existe `tasks.is_blocked`.

#### block_type ENUM (fijo v1)
```
'task_blocked'       — tarea específica bloqueada (declarado por founder)
'function_no_owner'  — función crítica sin owner asignado (engine detecta)
'execution_drop'     — caída de execution rate detectada por engine
'cash_bottleneck'    — bloqueo de flujo de caja (engine o manual)
'other'              — escape hatch controlado (no usar si encaja en los anteriores)
```

#### origin
```
'manual'  — founder declara el bloqueo desde UI
'engine'  — motor detecta patrón estructural automáticamente (v1: 1-2 casos)
```

#### Campos principales
```
id                  UUID PK
project_id          UUID FK → projects (cascade)
block_type          TEXT NOT NULL (ENUM arriba)
origin              TEXT NOT NULL ('manual'|'engine')
function_id         UUID NULL FK → project_functions (para 'function_no_owner')
task_id             UUID NULL FK → tasks (para 'task_blocked')
description         TEXT (legible, para UI y auditoría)
```

#### Severidad (persistida, actualizada semanalmente)
```
impact_weight       NUMERIC(5,2) DEFAULT 0 — fórmula F1.7
weeks_active        INTEGER DEFAULT 0       — actualizado por cron
last_evaluated_at   TIMESTAMPTZ
engine_version      TEXT NULL FK → engine_versions
  → NULL hasta primera evaluación por cron
  → se rellena incluso en bloques manuales (auditoría del cálculo de severidad)
```

#### Ciclo de vida
```
status: 'active' | 'monitoring' | 'resolved'

first_detected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
last_updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
resolved_at         TIMESTAMPTZ NULL
reopen_count        INTEGER DEFAULT 0

Resolución:
  → Founder marca resuelto (manual)
  → task_id pasa a status='completed'
  → Engine detecta que condición desapareció (solo origin='engine')

Re-apertura:
  → >7 días desde resolved_at  → nuevo bloque (nuevo id)
  → ≤7 días desde resolved_at  → se reabre (resolved_at=NULL, reopen_count+1)

created_by          UUID NULL FK → auth.users (relevante para origin='manual')
```

#### Índices
```sql
-- Para BottleneckSeverity: bloques activos por proyecto ordenados por severidad
CREATE INDEX idx_strategic_blocks_project_active
  ON strategic_blocks (project_id, status, impact_weight DESC)
  WHERE resolved_at IS NULL;

-- Para badge en task view sin full scan
CREATE INDEX idx_strategic_blocks_task
  ON strategic_blocks (task_id)
  WHERE task_id IS NOT NULL AND resolved_at IS NULL;
```

---

### D2.7 — project_risk_score + project_risk_score_history — CERRADA ✅ (2026-02-24)

**Propósito:** Estado actual del Risk Score por proyecto (una fila). Versión history para series temporales y calibración.

#### Fórmula del score final
```
RiskScore =
  (RunwayFactor       × w1)   -- w original 0.25
+ (RevenueConcentration × w2) -- w original 0.20
+ (ExecutionDrop      × w3)   -- w original 0.20
+ (ValidationWeakness × w4)   -- w original 0.20
+ (BottleneckSeverity × w5)   -- w original 0.15

Si un input es NULL → se excluye y los pesos de los disponibles
  se redistribuyen proporcionalmente (mantienen ratio entre sí):
    w_i_efectivo = w_i_original / SUM(w_j para j disponibles)

Si inputs_available < 3 → risk_score = NULL, risk_status = 'insufficient_data'
Si inputs_available ≥ 3 → calcular con redistribución proporcional
```

#### Umbrales risk_level (v1 — recalibrar en v2)
```
< 30          → low
30 – 54.99    → medium
55 – 79.99    → high
≥ 80          → critical
```

#### risk_status (dos campos separados)
```
risk_level:  low | medium | high | critical  (derivado del score)
risk_status: active | low_confidence | insufficient_data

active:             ≥3 inputs disponibles, score calculado
low_confidence:     ≥3 inputs pero data_completeness_score < 50
insufficient_data:  <3 inputs con valor, risk_score = NULL

UI: muestra risk_level + badge 'low confidence' si aplica
```

#### 5 inputs snapshot (guardados en tabla)
```
runway_factor_input           NULL si cash_on_hand no declarado o sin ≥2m datos costes
revenue_concentration_input   NULL si top_client_revenue_percent no declarado
execution_drop_input          NULL si <6 semanas de historial execution_rate
validation_weakness_input     NULL si validation_strength no disponible
bottleneck_severity_input     0 si no hay bloques activos (nunca NULL en v1)

inputs_available              SMALLINT (0–5) — cuántos tenían valor
data_completeness_score       NUMERIC(5,2) — de F1.13
```

#### Historial (project_risk_score_history)
```
Política: misma que phase_history y probability_history
Inserta en:
  → weekly_job:  recálculo estándar semanal
  → block_event: cuando un strategic_block con impacto alto aparece o se resuelve

trigger_source CHECK: ('weekly_job', 'block_event')
```

#### engine_version
```
Motor: 'risk' (nuevo tipo añadido a engine_versions)
Seed:  'risk_v1.0' → 'Fórmula inicial — R1.1–R1.5'
```

---

### D2.19 — RLS Policies — CERRADAS ✅ (2026-02-24)

#### Modelo de acceso v1
```
'owner'      → SELECT + escritura completa (configuración + datos)
'member'     → SELECT todo + escribir tareas, OBVs, blocks manuales, decisiones propias
'viewer'     → solo SELECT en todo
service_role → bypass RLS implícito (Supabase) — usa edge functions / cron
```

#### Helper functions (SECURITY DEFINER)
```sql
auth_is_project_member(project_id)  → cualquier rol activo en project_members
auth_is_project_owner(project_id)   → role = 'owner'
auth_is_project_writer(project_id)  → role IN ('owner', 'member')
```

#### Patrón 1 — Públicas/semi-públicas (sin project_id)
```
engine_versions  → authenticated read (true)
benchmarks       → authenticated read (true)
```

#### Patrón 2 — Engine read-only (escritura solo service_role)
```
project_phase_state, project_phase_history
project_probability, project_probability_history
project_viability_state
project_risk_score, project_risk_score_history
project_function_coverage
viability_events
project_economic_profile_history

Policy: SELECT USING auth_is_project_member(project_id)
Write:  service_role únicamente (bypass RLS)
```

#### Patrón 3 — Configuración (owner escribe, todos leen)
```
project_functions         → owner: ALL | member+viewer: SELECT
project_protocols         → owner: ALL | member+viewer: SELECT
process_artifacts         → owner: ALL | member+viewer: SELECT
project_strategy_current  → owner: ALL | member+viewer: SELECT
project_economic_profile  → owner: ALL | member+viewer: SELECT
strategic_model_versions  → owner: INSERT | member+viewer: SELECT
strategic_cycles          → owner: ALL | member+viewer: SELECT
```

#### Patrón 4 — Operativas (owner + member escriben)
```
strategic_blocks:
  SELECT: all members
  INSERT: auth_is_project_writer AND origin = 'manual'
           (origin='engine' → service_role bypass)
  UPDATE: auth_is_project_writer

decision_events:
  SELECT: all members
  INSERT: auth_is_project_writer
  UPDATE: auth_is_project_owner OR decided_by = auth.uid()
```

---

### D2.11 — project_protocols — CERRADA ✅ (2026-02-24)

**Propósito:** Reglas y rituales transversales de proyecto. Diferente de `process_artifacts` (ejecución operativa por función).

```
process_artifacts  = cómo se EJECUTA Demand/Delivery/Cash (checklist operativo)
project_protocols  = cómo se DECIDE / cómo funciona el sistema (cadencias, acuerdos)
```

#### protocol_type ENUM
```
'weekly_review'      → cadencia de revisión semanal
'prioritization'     → regla de prioridades (ICE, RICE, etc.)
'decision_rule'      → cómo se aprueban cambios de scope / decisiones
'incident_response'  → protocolo de critical blocks / incidentes
'other'              → escape hatch controlado
```

#### Campos
```
id, project_id, protocol_type, title, description, link_or_doc_id, is_active
Sin score / sin historial / sin engine_version en v1.
```

---

### D2.12 — strategic_cycles — CERRADA ✅ (2026-02-24)

**Propósito:** Contenedor temporal de 4 semanas por proyecto. Guarda snapshot de motores al cierre. `ritual_responses` NULL en v1.

#### Ciclo
```
start_date: lunes (ISO week) — calculado por app layer
end_date:   start_date + 27 días (28 días inclusive = 4 semanas completas)
cycle_index: secuencial (1, 2, 3...) — UNIQUE (project_id, cycle_index)
```

#### Campos clave
```
cycle_index         INTEGER ≥ 1
start_date          DATE    — lunes ISO
end_date            DATE    — start + 27d
closed_at           TIMESTAMPTZ NULL
close_reason        TEXT NULL ('manual'|'scheduled')
engine_snapshot     JSONB DEFAULT '{}'  — estado engines al cierre
ritual_responses    JSONB NULL          — siempre NULL en v1 (v2: 5 preguntas Optimus)
decision_event_id   UUID NULL FK → decision_events
```

#### engine_snapshot estructura esperada
```json
{
  "phase":        {"current_phase": 1, "phase_score": 67.5, "phase_status": "healthy"},
  "probability":  {"probability_score": 42.0, "probability_status": "active"},
  "risk":         {"risk_score": 35.0, "risk_level": "medium", "risk_status": "active"},
  "viability":    {"viability_status": "monitoring"},
  "completeness": {"data_completeness_score": 68.0}
}
```

---

### D2.14–D2.18 — ALTERs a tablas existentes — CERRADAS ✅ (2026-02-24)

#### D2.14 — tasks.leader_id
```sql
ALTER TABLE tasks ADD COLUMN leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```
Leader = responsable del resultado. Distinto de assignee_id (ejecutor).
Validación leader ≠ executor en app layer. NULL en modo solo founder.

#### D2.15 — projects: Location Layer
```sql
ALTER TABLE projects
  ADD COLUMN country      TEXT,                            -- ISO 3166-1 alpha-2
  ADD COLUMN market_scope TEXT CHECK ('local'|'global'),
  ADD COLUMN cluster      TEXT CHECK ('EU'|'US'|'LATAM'|'APAC'|'Other');
```
Requerido en onboarding Fase A (preguntas 8-9).
Cluster se usa para benchmark lookup en `benchmarks.region_cluster`.

#### D2.16 — project_members.performance_score_v2
```sql
ALTER TABLE project_members ADD COLUMN performance_score_v2 NUMERIC(5,2) CHECK (0–100);
```
NULL hasta que engine implemente 6 fórmulas por rol (C3.4).
`performance_score` (v1) se mantiene sin tocar.

#### D2.17 — obvs: tipos ENUM + campos auto-tipo (F1.8)
```sql
-- Nuevos tipos (F1.8): product_validation (×1.1), operational_system (×0.8)
ALTER TYPE obv_type ADD VALUE IF NOT EXISTS 'product_validation';
ALTER TYPE obv_type ADD VALUE IF NOT EXISTS 'operational_system';

-- Campos de gestión de tipo automático
ALTER TABLE obvs
  ADD COLUMN type_auto_updated        BOOLEAN   DEFAULT FALSE,
  ADD COLUMN type_auto_update_reason  TEXT,
  ADD COLUMN type_declared_original   obv_type,
  ADD COLUMN dispute_flag             BOOLEAN   DEFAULT FALSE;
```
`dispute_flag = TRUE` → engine revierte a `type_declared_original`.

#### D2.18 — project_roles.maps_to_specialization
```sql
ALTER TABLE project_roles ADD COLUMN maps_to_specialization TEXT;
```
TEXT en v1 (sin ENUM). Se formaliza en v2 con lista estable de especializaciones.

---

### D2.13 — benchmarks — CERRADA ✅ (2026-02-24)

**Propósito:** Valores de referencia sectoriales para los motores. Arquitectura híbrida: `source_type='curated'` en v1, transición a `'internal'` en v2 cuando `n_proyectos_validos ≥ 30` por segmento.

#### Clasificadores (definen qué segmento aplica)
```
industry        TEXT          — sector/industria
model_type      TEXT CHECK (saas|service|physical|marketplace|agency|unknown)
region_cluster  TEXT          — cluster geográfico/de mercado
metric_name     TEXT CHECK (6 métricas abajo)
source_type     TEXT CHECK ('curated'|'internal')
UNIQUE (industry, model_type, region_cluster, metric_name, source_type)
```

#### 6 métricas v1
```
margen_estimado    → F3/F4 Phase Engine — estructural
crecimiento_p50    → Probability Engine — revenue_momentum_score (peso 15%)
conversion_media   → Dashboard — informativo
ciclo_venta_medio  → Dashboard — alerta si > p75
ticket_medio       → Dashboard — informativo
cac_estimado       → Dashboard — informativo
```

#### confidence_score (tabla F1.9)
```
curated:  default → 60 | con fuente externa validada → 70
internal: n<30 → 50 | 30–99 → 80 | 100–299 → 90 | ≥300 → 95
Cap absoluto: 95
```

#### Campos adicionales
```
p25 / p50 / p75       NUMERIC NULL — percentiles (rangos, no valores únicos)
n_proyectos_validos   INTEGER NULL — solo internal, determina confidence_score
source_notes          TEXT NULL    — trazabilidad en curated
updated_at            TIMESTAMPTZ
```

---

### D2.20 — strategic_model_versions — CERRADA ✅ (2026-02-24)

**Propósito:** Log append-only de pivots y cambios en la hipótesis estratégica. Alimenta `pivot_count` para O1.3 del Phase Engine (Fase 1). Solo INSERT, nunca UPDATE.

#### Semántica
```
pivot_event  = nuevo record en esta tabla
pivot_count  = COUNT de filas en últimas 4 semanas (rolling 28d)
              Usado en O1.3 para calcular el score de foco de segmento.

Trigger de inserción: cuando cambia cualquier campo en
  {segment_text, problem_text, value_prop_text} de project_strategy_current.
  No cuenta ediciones menores — solo cambios sustantivos (app layer decide).
```

#### Campos
```
id              UUID PK
project_id      UUID FK → projects (cascade)
version_number  INTEGER — coincide con project_strategy_current.version_number
segment_text    TEXT    — snapshot completo en esta versión
problem_text    TEXT
value_prop_text TEXT
changed_fields  JSONB DEFAULT '{}' — {"campo": {"old": "...", "new": "..."}}
created_at      TIMESTAMPTZ DEFAULT NOW()
created_by      UUID FK → auth.users NULL
```

---

### D2.25 — viability_events — CERRADA ✅ (2026-02-24)

**Propósito:** Una fila por trigger activo por proyecto (modelo de estado). `consecutive_count` persiste la consecutividad sin queries. `hidden_until` persiste el cooldown. Respuesta vive en `decision_events`.

#### PK y modelo de estado
```
PRIMARY KEY (project_id, trigger_type)
Una fila por trigger activo → se actualiza en cron, no se inserta cada semana.

Ciclo:
  Trigger se activa → INSERT (si no existe) o resolverlo y resetear
  Cron: trigger sigue activo → consecutive_count++, last_evaluated_at = NOW()
  Trigger desaparece → resolved_at = NOW()
  Re-activación: resolved_at = NULL, consecutive_count = 1, decision_event_id = NULL
```

#### trigger_type (4 triggers de F1.10)
```
'stagnation'     → T1: proyecto estancado
'margin_risk'    → T2: riesgo flujo de caja (solo con confidence_level='high')
'overload'       → T3: sobrecarga operativa
'weak_validation'→ T4: validación externa débil
```

#### Campos clave
```
consecutive_count  INTEGER DEFAULT 1    — evaluaciones semanales consecutivas activo
confidence_level   TEXT ('low'|'medium'|'high') — crítico para T2
first_triggered_at TIMESTAMPTZ
last_evaluated_at  TIMESTAMPTZ          — actualizado en cada cron
resolved_at        TIMESTAMPTZ NULL     — NULL = activo | NOT NULL = resuelto
hidden_until       TIMESTAMPTZ NULL     — cooldown: ignore+7d | postpone+14d | accept→NULL
decision_event_id  UUID NULL FK → decision_events — FK opcional cuando founder responde
engine_version     TEXT FK → engine_versions ('viability_v1.0')
```

#### Filtro del cron
```sql
WHERE resolved_at IS NULL
  AND (hidden_until IS NULL OR hidden_until < NOW())
```

---

### D2.9 — decision_events — CERRADA ✅ (2026-02-24)

**Propósito:** Registro central de decisiones estratégicas y respuestas a recomendaciones del sistema. Sin `engine_version` — log humano, no output de motor. Debe existir antes de `viability_events` (D2.25) que tiene FK opcional a esta.

#### decision_category
```
'system_recommendation' → founder responde a algo que el motor sugirió
'strategic_change'      → pivot de segmento, modelo, propuesta de valor
'structural_change'     → cambio en equipo, roles, funciones críticas
'manual_acknowledgment' → founder documenta decisión sin prompt del sistema
```

#### origin
```
'system'  → motor recomendó, founder responde
'founder' → iniciativa propia del founder
```

#### Campos clave
```
id                  UUID PK
project_id          UUID FK → projects
decision_category   TEXT NOT NULL (ENUM arriba)
origin              TEXT NOT NULL ('system'|'founder')
title               TEXT NOT NULL
description         TEXT NULL
related_entity_type TEXT NULL   — referencia polimórfica ('viability_trigger', 'strategic_block', etc.)
related_entity_id   UUID NULL   — ID de la entidad relacionada (sin FK dura — polimórfico)
metadata            JSONB DEFAULT '{}'  — contexto extensible sin migrar schema
outcome_status      TEXT NULL   — SIEMPRE NULL en v1 (preparado para Decision Accuracy Index P8.12)
decided_at          TIMESTAMPTZ DEFAULT NOW()
decided_by          UUID FK → auth.users NULL
```

#### outcome_status
```
Valores: 'positive' | 'negative' | 'neutral' | 'unknown'
v1: siempre NULL — campo preservado para evitar migración futura cuando se
    implemente Decision Accuracy Index (P8.12).
```

#### Relación con viability_events (D2.25)
```
viability_events.decision_event_id → decision_events.id (FK opcional)
Se crea el link cuando el founder responde al trigger (accept/ignore/postpone).
Si no responde → decision_event_id = NULL.
```

---

### D2.8 — project_function_coverage — CERRADA ✅ (2026-02-24)

**Propósito:** Estado actual de cobertura por función crítica. PK compuesta `(project_id, function_type)`. Sin historial en v1. Patrón consistente con los otros engines.

#### 4 componentes del coverage_score (F1.11)
```
owner_assigned_score    0 | 30  — tiene owner asignado en project_functions
tasks_execution_score   0 | 30  — ≥3 tasks completed en últimos 28d con function_type crítico
block_health_score      0 | 20  — sin bloqueo activo en strategic_blocks para esta función
process_score           0 | 20  — process_artifact activo (checklist ≥5 + last_used_at en ventana)

coverage_score = suma (0–100)
```

#### coverage_level
```
0          → 'none'   (sin ningún criterio)
1 – 69     → 'basic'  (tiene algo pero sin cobertura mínima operativa)
≥ 70       → 'strong' (cobertura mínima operativa cumplida — F1.11)
```

#### Eventos que disparan recálculo (edge function, no DB trigger)
```
cron semanal                          — base de seguridad
owner asignado/removido en project_functions
task → status='completed' con function_type crítico
bloque activo creado o resuelto en strategic_blocks
process_artifact actualizado (checklist_items_count o last_used_at)
```

#### Nota de diseño
```
Sin tabla de historial en v1.
Sin index adicional — (project_id, function_type) como PK lo cubre.
engine_version: usa 'phase_v1.0' (coverage alimenta Phase Score).
```

---

### D2.22 — project_strategy_current — CERRADA ✅ (2026-02-24)

**Propósito:** Fuente de verdad de la hipótesis estratégica actual. Alimenta la dimensión D5 de `data_completeness_score` (F1.13). No tiene `engine_version` — es dato del founder, no output de motor.

#### Campos
```
project_id        UUID PK FK → projects
segment_text      TEXT NULL  — segmento objetivo (≥10 chars para contar en D5)
problem_text      TEXT NULL  — problema que resuelve (≥10 chars para contar en D5)
value_prop_text   TEXT NULL  — propuesta de valor (≥10 chars para contar en D5)
version_number    INTEGER DEFAULT 1  — se incrementa en cada pivot sustantivo (v2)
last_updated_at   TIMESTAMPTZ
updated_by        UUID FK → auth.users
```

#### Regla D5
```
Los 3 campos cuentan en data_completeness_score D5 solo si tienen ≥10 caracteres.
version_number permite trackear cuántos pivotes ha hecho el proyecto (analytics v2).
```

---

### D2.23 — project_functions — CERRADA ✅ (2026-02-24)

**Propósito:** 3 funciones críticas fijas por proyecto (demand, delivery, cash). Fuente de verdad para Function Coverage (F1.11) y `block_type='function_no_owner'` en strategic_blocks (D2.10).

#### Inicialización — trigger comprensivo
```
Trigger: trg_initialize_project_data
  → AFTER INSERT ON projects, FOR EACH ROW
  → Inicializa TODAS las state tables (no solo project_functions)
  → Garantiza que UI nunca rompe en Day 1 antes del primer cron

Función: fn_initialize_project_data() LANGUAGE plpgsql
  Tablas inicializadas por el trigger:
    project_functions       (demand, delivery, cash)
    project_phase_state     (phase=1, score=0, status='friction')
    project_probability     (status='inactive', score=NULL)
    project_viability_state (status='healthy', triggers=0)
    project_risk_score      (status='insufficient_data', score=NULL)
    project_strategy_current(todos los campos NULL)
    project_economic_profile(model_type='unknown', confidence='low')
    project_function_coverage (3 filas, score=0, level='none')
    strategic_cycles        (cycle_index=1, lunes ISO week)

  engine_version: se resuelve con SELECT id FROM engine_versions
                  WHERE motor='X' AND is_active=TRUE LIMIT 1
                  Fallback al id convencional (defensa de red).

Nota: engines siempre hacen UPSERT como defensa adicional.
Todos los INSERTs con ON CONFLICT DO NOTHING → trigger idempotente.
```

#### Unicidad de versión activa en engine_versions
```sql
CREATE UNIQUE INDEX idx_engine_versions_one_active_per_motor
  ON engine_versions (motor)
  WHERE is_active = TRUE;
-- Garantía: solo 1 versión activa por motor en todo momento.
-- Al deployar v2 → SET is_active=FALSE en la anterior primero.
```

#### Campos
```
id                    UUID PK
project_id            UUID FK → projects (cascade)
function_type         TEXT NOT NULL CHECK ('demand'|'delivery'|'cash')
owner_user_id         UUID NULL FK → auth.users (NULL = bloqueo)
documented_process_id UUID NULL FK → process_artifacts(id) ON DELETE SET NULL
UNIQUE (project_id, function_type)
created_at / updated_at TIMESTAMPTZ
```

#### Dependencia circular resuelta
```
project_functions.documented_process_id → process_artifacts
process_artifacts.function_type          → (ENUM, no FK inversa)

Solución: CREATE TABLE project_functions sin FK a process_artifacts.
           Luego CREATE TABLE process_artifacts.
           Luego ALTER TABLE project_functions ADD CONSTRAINT fk_...
```

---

### D2.24 — process_artifacts — CERRADA ✅ (2026-02-24)

**Propósito:** Procesos documentados por función crítica. Fuente para `documented_process_exists` (F1.11).

#### Regla documented_process_exists
```
TRUE si:
  checklist_items_count ≥ 5
  AND last_used_at within ventana:
    phase ≤ 2 → 60 días
    phase > 2 → 30 días

"Used" = ≥1 item del checklist marcado en ejecución real (no solo creación del doc)
```

#### Campos
```
id                    UUID PK
project_id            UUID FK → projects (cascade)
function_type         TEXT NOT NULL CHECK ('demand'|'delivery'|'cash')
title                 TEXT NOT NULL
checklist_items_count INTEGER DEFAULT 0 (mínimo 5 para contar)
last_used_at          TIMESTAMPTZ NULL (NULL = nunca usado en real)
link_or_doc_id        TEXT NULL
created_at / updated_at TIMESTAMPTZ
```

#### Índice
```sql
CREATE INDEX idx_process_artifacts_project_function
  ON process_artifacts (project_id, function_type);
```

---

### R1.3 — ValidationWeakness (RiskScore input) — CERRADA ✅ (2026-02-24)

**Peso en RiskScore:** 0.20
**Qué mide:** riesgo derivado de validación externa débil, combinando nivel actual y tendencia de mejora.

#### Fórmula
```
base_risk = 100 - validation_strength_current

stagnation_penalty:
  improved_last_4w = TRUE  → 0
  improved_last_4w = FALSE → 15

ValidationWeakness = MIN(100, base_risk + stagnation_penalty)
```

#### Definición de "mejora"
```
improved_last_4w = TRUE
si validation_strength_actual - validation_strength_hace_4_semanas ≥ +5 puntos

Fuente: validation_strength_input de project_probability_history
Comparación: semana actual vs semana -4 (delta simple — v1)
```

#### Casos especiales
```
Si <4 semanas de histórico → stagnation_penalty = 0 (no penalizar falta de datos)
Si validation_strength_input no disponible → ValidationWeakness = NULL
```

#### Ejemplos
```
validation_strength = 30, mejorando  → 70 + 0  = 70
validation_strength = 30, estancado  → 70 + 15 = 85
validation_strength = 80, mejorando  → 20 + 0  = 20
validation_strength = 80, estancado  → 20 + 15 = 35
validation_strength = 95, mejorando  →  5 + 0  =  5
```

---

### R1.2 — ExecutionDrop (RiskScore input) — CERRADA ✅ (2026-02-24)

**Peso en RiskScore:** 0.20
**Qué mide:** caída en la ejecución del proyecto respecto a su propio baseline histórico, combinando riesgo relativo y riesgo absoluto.

#### Ventanas temporales (sin solapamiento)
```
Current  = promedio execution_rate semanas -1 y -2
Baseline = promedio execution_rate semanas -3 a -8 (6 semanas)

Requiere mínimo 6 semanas totales de histórico.
Si <6 semanas → ExecutionDrop = NULL
```

#### Casos especiales
```
Si execution_rate no existe          → NULL
Si baseline = 0                      → ExecutionDrop = 100
Si baseline < 40                     → omitir cálculo relativo; usar solo riesgo_absoluto
Si drop_ratio ≤ 0 (current ≥ baseline) → riesgo_relativo = 0
```

#### Cálculo
```
drop_ratio = (baseline - current) / baseline   (solo si baseline ≥ 40)
```

**A) Riesgo relativo (por caída respecto al baseline)**
```
drop_ratio ≤ 10%   → riesgo_relativo = 10
10–20%             → riesgo_relativo = 30
20–35%             → riesgo_relativo = 60
>35%               → riesgo_relativo = 85
```

**B) Riesgo absoluto (floor si current es objetivamente bajo)**
```
current ≥ 60       → riesgo_absoluto = 0
50–60              → riesgo_absoluto = 20
40–50              → riesgo_absoluto = 40
<40                → riesgo_absoluto = 70
```

#### ExecutionDrop final
```
ExecutionDrop = MAX(riesgo_relativo, riesgo_absoluto)
Cap: 0–100
```

#### Fuente de datos
```
execution_rate_input de project_probability_history
(campo guardado como snapshot en cada recálculo semanal)
```

---

### 0.10 — Function Coverage v1 — CERRADA ✅ (2026-02-24)

#### 3 funciones críticas fijas (no configurables)
```
demand   → captar demanda
delivery → entregar valor
cash     → cobrar + controlar caja

Instanciadas automáticamente al crear proyecto.
El founder no puede crear nuevas funciones críticas en v1.
```

#### Schema: `project_functions`
```sql
project_functions
- id                    UUID
- project_id            UUID
- function_type         ENUM(demand, delivery, cash)
- owner_user_id         UUID NULL
- documented_process_id UUID NULL    -- FK a process_artifacts (principal)
- created_at            TIMESTAMPTZ
- updated_at            TIMESTAMPTZ
```

#### Schema: `tasks` (campo añadido)
```sql
tasks.function_type  ENUM(demand, delivery, cash, support)  NULL  DEFAULT NULL

NULL     = sin clasificar (no cuenta para coverage_score)
support  = tarea no crítica (no cuenta para coverage_score)
Selector obligatorio en UI al crear tarea, pero motor no asume default.
```

#### Schema: `process_artifacts`
```sql
process_artifacts
- id                   UUID
- project_id           UUID
- function_type        ENUM(demand, delivery, cash)
- title                TEXT
- checklist_items_count INT
- last_used_at         TIMESTAMPTZ   -- fecha del último item marcado en ejecución real
- link_or_doc_id       TEXT NULL
- created_at           TIMESTAMPTZ
```

"Used" = al menos 1 item del checklist marcado en ejecución real (no solo creado el doc).

#### Regla: `documented_process_exists`
```
process_recent_window =
  current_phase ≤ 2 ? 60 días : 30 días

documented_process_exists = TRUE si existe process_artifact donde:
  function_type = [la función evaluada]
  AND checklist_items_count ≥ 5
  AND last_used_at within process_recent_window
```

#### Regla: `tasks_done_4w`
```
tasks_done_4w =
  COUNT(tasks)
  WHERE task.status = 'completed'
    AND completed_at within last 4 weeks (28 días)
    AND function_type ∈ {demand, delivery, cash}

No cuentan: in_progress, validated, review, cancelled, NULL, support
```

#### `coverage_score` por función (confirmado)
```
coverage_score =
  (owner_user_id IS NOT NULL    ? 30 : 0)
+ (tasks_done_4w ≥ 3           ? 30 : 0)
+ (no critical_block activo    ? 20 : 0)
+ (documented_process_exists   ? 20 : 0)

≥70 → strong | 40–69 → basic | <40 → none

critical_block evaluado por function_type (usa funcion_critica={demand,delivery,cash}).
```

#### Support functions (opcionales, sin impacto en motores)
```
Solo dashboard informativo.
Sin scores. Sin fases. Sin coverage.
Ejemplos: legal, hiring, finance-ops, partnerships.
No se mezclan con las 3 críticas en v1.
```

#### Expectativas por fase
```
Proyecto sano F3: ≥1 función con coverage = strong
Proyecto sano F4: 2–3 funciones con coverage = strong
```

#### UX mínimo
```
Pantalla "Coverage": 3 cards (Demand / Delivery / Cash)
  Cada card: estado (none/basic/strong) + 2 CTAs
    → "Asignar owner"
    → "Adjuntar proceso"

Al crear tarea: selector "¿Esto es Demand, Delivery, Cash o Support?"
  No se puede guardar sin elegir (UI obliga).
```

---

### 0.8 — Nuevas tablas de base de datos

Además de las 4 tablas de ENGINE_DESIGN.md (`project_phase_state`, `project_probability`, `project_viability_state`, `project_economic_profile`), se necesitan:

```sql
-- Historial de probabilidad (trending)
CREATE TABLE project_probability_history (
  project_id UUID,
  week_number INTEGER,
  probability_score NUMERIC(5,2),
  fase_score NUMERIC(5,2),
  execution_rate NUMERIC(5,2),
  validation_strength NUMERIC(5,2),
  revenue_momentum NUMERIC(5,2),
  capacity_health NUMERIC(5,2),
  recorded_at TIMESTAMPTZ
);

-- Cobertura funcional (ver Tier 4)
CREATE TABLE project_function_coverage (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  function TEXT, -- demand_generation|closing|cash_control|delivery_ops|direction_strategy|automation_tech
  owner_member_id UUID REFERENCES project_members(id) NULLABLE,
  coverage_level TEXT, -- full|partial|none
  source TEXT, -- assigned|observed|inferred
  impact_weight NUMERIC(3,2),
  updated_at TIMESTAMPTZ
);

-- Tracking de decisiones (ver Tier 5)
CREATE TABLE decision_events (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  recommendation_type TEXT,
  recommendation_content TEXT,
  accepted BOOLEAN,
  dismissed_reason TEXT NULLABLE,
  context_metrics JSONB, -- snapshot del estado en el momento
  resultado_posterior JSONB NULLABLE, -- resultado 30 días después
  created_at TIMESTAMPTZ
);

-- Bloques estratégicos detectados (ver Tier 5)
CREATE TABLE strategic_blocks (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  block_type TEXT, -- clarity_block|traction_block|structural_block|behavioral_block
  detected_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ NULLABLE,
  evidence JSONB,
  mode_activated TEXT NULLABLE -- modo_desbloqueo|build|rescue
);

-- Protocolo activo del proyecto
CREATE TABLE project_protocols (
  project_id UUID PRIMARY KEY REFERENCES projects(id),
  primary_protocol TEXT, -- playbook ID
  secondary_protocol TEXT NULLABLE, -- max 1 secondary
  activated_at TIMESTAMPTZ,
  mode TEXT -- build|rescue
);

-- Ciclos estratégicos (Reset Ritual)
CREATE TABLE strategic_cycles (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  cycle_number INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ NULLABLE,
  evaluation TEXT NULLABLE, -- solido|inestable|critico
  auto_diagnosis JSONB,
  founder_answers JSONB,
  structural_decision TEXT NULLABLE
);

-- Location Layer
ALTER TABLE projects ADD COLUMN country TEXT;
ALTER TABLE projects ADD COLUMN market_scope TEXT; -- local|global
ALTER TABLE projects ADD COLUMN cluster TEXT;      -- EU|US|LATAM|APAC|Other
```

---

## TIER 1: Los 4 Motores Estratégicos

> **Depende de:** TIER 0 completado
> **Tipo:** Backend (Deno Edge Functions) + PostgreSQL + cron jobs

### 1.1 — Phase Engine: implementar compute-phase-score

Crear edge function `compute-phase-score` que:
1. Lee outcomes de cada fase (OBVs, tasks, KPIs, CRM data)
2. Aplica pesos por fase (ENGINE_DESIGN.md §2.2)
3. Verifica hard signals (requiere TIER 0.5 — OBV types)
4. Escribe resultado en `project_phase_state`
5. Dispara notificaciones si score cambia de banda (saludable/fricción/crítico)

**Submódulos:**
- Calculador Fase 1 (Descubrimiento)
- Calculador Fase 2 (Validación)
- Calculador Fase 3 (Operación)
- Calculador Fase 4 (Escala)

---

### 1.2 — Phase Engine: lógica de avance y regresión

Implementar en `compute-phase-score`:
- **ADVANCE:** score ≥ 75% + hard signal → propuesta a usuario → confirmar → log
- **REGRESS WARNING:** 4 semanas < 50% → notificación + 30 días recovery window
- **REGRESS:** 6 semanas < 50% → phase -= 1 → Viability notificada → preserve data at 40%

**Importante:** La regresión NO borra datos. Solo cambia `current_phase` y resetea score parcialmente.

---

### 1.3 — Probability Engine: implementar compute-probability-score

Crear edge function `compute-probability-score`:
1. Lee los 5 inputs (fase_score, execution_rate, validation_strength, revenue_momentum, capacity_health)
2. Aplica pesos (35/20/15/15/15)
3. Escribe en `project_probability` + `project_probability_history`
4. Detecta si algún input = 0 (dispara `probability_input_zero` notification)
5. Detecta drops >15 puntos en una semana (dispara `probability_drop`)

**Requiere:** TIER 0.2 (evidence_quality_score) + TIER 0.4 (Day 1 calibration) + TIER 0.3 (solo math)

---

### 1.4 — Probability Engine: conexión con CRM pipeline

**Gap identificado:** Revenue momentum usa `revenue_records` pero **NO usa datos del CRM pipeline.**

Un proyecto con 5 deals en "Proposal" stage tiene revenue momentum que el motor no ve.

**Tarea:** Añadir a la fórmula de `revenue_momentum`:
```
pipeline_signal = (
  leads_in_late_stages × avg_deal_value × win_rate_estimate
) / monthly_revenue_target

revenue_momentum_adjusted = revenue_momentum + (pipeline_signal × 0.20)
```

Decidir si pipeline_signal es input adicional o modificador de revenue_momentum.

---

### 1.5 — Probability Engine: conexión con peer validation

**Gap identificado:** `validation_strength` incluye `peer_validations_received × 5` pero el módulo de peer validation KPIs **no alimenta esta tabla.**

**Tarea:** Crear trigger o proceso que cuando `kpi_validations` recibe una peer validation, actualiza `validation_strength` en `project_probability`.

---

### 1.6 — Viability Engine: implementar evaluate-viability

Crear edge function `evaluate-viability`:
1. Lee `project_probability_history` (últimas N semanas)
2. Cuenta semanas consecutivas por debajo de umbrales
3. Transiciona entre estados (SALUDABLE → ESTANCAMIENTO → CRÍTICO)
4. Dispara las 3 Paths cuando corresponde
5. Gestiona el cooldown de 30 días post-decisión

---

### 1.7 — Organizational Engine: implementar compute-org-capacity

Crear edge function `compute-org-capacity`:
1. Lee `project_members`, `tasks`, `obvs`, `meetings` por proyecto
2. Calcula capacity units por miembro
3. Detecta bottlenecks (role > 60% OBVs / 70% tasks)
4. Detecta empty critical roles por fase
5. Escribe `capacity_health` en formato para Probability Engine
6. Dispara notificaciones Layer 5

**Requiere:** TIER 0.3 (solo math) resuelto primero.

---

### 1.8 — Economic Profile: implementar detect-economic-profile

Crear edge function `detect-economic-profile`:
1. En `project_created`: detectar perfil desde datos de onboarding
2. A las 4 semanas: revisar con datos reales de CRM + OBVs
3. Aplicar ajustes de thresholds según perfil (ENGINE_DESIGN.md §6.3)
4. User puede override desde Settings > Perfil Económico

**Adición [+chattt.txt] — UX del Perfil Económico Detectado:**

Después del onboarding, Optimus muestra una tarjeta:
```
📊 Perfil Operativo Detectado
Modelo:          B2B · Ticket medio-alto
Ciclo de venta:  4–8 semanas
Monetización:    Proyecto / contrato
Intensidad:      Baja infraestructura

En base a esto:
  Tiempo esperado para validar ingresos: 6–10 semanas
  Conversión saludable estimada:         8–15%
  Iteraciones mínimas recomendadas:      2/mes

[Ajustar perfil si no es correcto →]
```

Esto elimina la sensación de "el sistema me pone en rojo sin razón" para negocios con ciclo largo.

---

### 1.9 — Economic Profile: detección de incoherencia del modelo ✅ [+chattt.txt]

**Origen:** chattt.txt — feature completamente ausente del plan actual.

El sistema detecta cuando el modelo económico elegido es **estructuralmente incoherente**, no simplemente que va mal.

**4 patrones de incoherencia:**
```
Caso A: Ticket bajo + ciclo largo
  Ticket: <100€, Ciclo: >4 semanas, Esfuerzo comercial: alto
  → Modelo insostenible: el coste de vender supera el margen.
  Optimus: "El esfuerzo comercial estimado supera el margen por cliente."

Caso B: Suscripción sin retención
  MRR creciendo pero retención <50% a 2 meses
  → No es SaaS real. Es venta recurrente disfrazada.
  Optimus: "La retención actual no sostiene un modelo de suscripción."

Caso C: B2B enterprise + solo founder + runway corto
  Ciclo 3–6 meses + equipo = 1 + runway < 6 meses
  → Desalineación riesgo–estructura.
  Optimus: "Tu ciclo de venta supera tu runway disponible."

Caso D: Servicio manual intentando escalar como producto
  Cada cliente requiere trabajo manual, margen decreciente
  → No es modelo escalable aún.
  Optimus: "Tu modelo requiere personalización por cliente. Escalar requiere estandarizar primero."
```

**Output al usuario:**
```
🟠 Desalineación estructural detectada

Tu modelo actual: B2B · Ticket 120€ · Ciclo 5 semanas
Problema: El esfuerzo comercial supera el margen por cliente.
Impacto: Probabilidad de estancamiento en 12 semanas: 68%

Alternativas:
  · Aumentar ticket a ≥300€
  · Reducir ciclo con oferta estandarizada
  · Cambiar a modelo retainer mensual
```

**Nunca dice "modelo incorrecto".** Dice "desalineación estructural" con evidencia y alternativas.

---

### 1.10 — Economic Profile: historial de versiones ✅ [+chattt.txt]

**Origen:** chattt.txt — no está en el plan actual.

Cuando el modelo económico cambia (de proyecto a suscripción, de B2C a B2B, etc.), el sistema:
1. Detecta el cambio (ingresos recurrentes por 6–8 semanas, ticket cambia >30%, ciclo se acorta/alarga)
2. Propone actualización con impacto visualizado:
   ```
   Perfil actual:   Proyecto B2B · ciclo 6–8 semanas
   Perfil detectado: Suscripción B2B · ciclo 2–4 semanas

   Si actualizas: nuevos umbrales + nuevo ritmo esperado + nuevo cálculo de probabilidad
   [Actualizar perfil] [Mantener actual]
   ```
3. Si el usuario confirma → guarda versión anterior con timestamp
4. El historial de perfiles es parte del Project Timeline (TIER 8.6)

**Tabla adicional:**
```sql
CREATE TABLE project_economic_profile_history (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  sales_cycle TEXT,
  monetization_type TEXT,
  capital_intensity TEXT,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  change_reason TEXT  -- 'auto_detected'|'manual_override'|'phase_transition'
);
```

---

### 1.9 — Cron jobs: orquestación semanal

Configurar cron jobs en Supabase (pg_cron o Deno cron):
```
Domingo 23:00 UTC:
  1. compute-org-capacity (todos los proyectos activos)
  2. compute-phase-score (todos los proyectos activos)
  3. compute-probability-score (todos los proyectos activos)
  4. evaluate-viability (todos los proyectos activos)
  5. trigger-engine-notifications (procesar outputs → crear notificaciones)
  6. send-weekly-digest (generar y enviar resumen semanal por email)
```

---

### 1.10 — On-demand recalculation triggers

Para que el sistema no espere hasta el domingo:
- **OBV validado** → recalcular Phase Score → recalcular Probability
- **Tarea completada** → recalcular execution_rate → recalcular Probability
- **CRM lead movido a "Won"** → recalcular revenue_momentum → recalcular Probability
- **Miembro añadido/removido** → recalcular org_capacity → recalcular Probability

Implementar como database triggers o Supabase webhooks → edge functions.

---

### 1.11 — Conectar role_performance → Phase Score (Gap 2)

Implementar el componente `execution_health` de la Phase Score formula:
```
Phase Score = (
  outcome_scores_weighted  × 0.70 +
  execution_health         × 0.20 +  // promedio de roles críticos
  validation_quality       × 0.10
)
```

`execution_health` = promedio de performance scores de los roles críticos para la fase actual.
Si un rol crítico está vacío → contribuye 0 (penalización estructural).

---

### 1.12 — Bottleneck → Challenge suggestion (Gap 3)

Implementar `suggest-bottleneck-challenge`:
- Cuando Org Engine detecta bottleneck → verificar si hay challenge activo para ese rol
- Si no → Optimus propone challenge de 14 días
- Usuario acepta → Challenge creado con tipo `bottleneck_relief`
- Outcome del challenge → alimenta `execution_rate` de Probability Engine

---

## TIER 2: Onboarding y Primera Experiencia

> **Depende de:** TIER 0 (Location Layer, Economic Profile detection)
> **Tipo:** UX + Backend + Lógica de flujo

### 2.1 — Las 10 preguntas exactas del onboarding

Diseñar y construir el onboarding con exactamente estas preguntas (en 2 fases):

**FASE A — Obligatoria (3–4 minutos, no se puede saltar):**
1. ¿En qué punto está tu proyecto? (Fase detection inicial — ver 2.3)
2. ¿Generas ingresos hoy? Si sí → ¿cuánto al mes?
3. ¿Cuántos clientes activos tienes?
4. ¿Cuántas personas trabajan en esto contigo? (team size → work_mode)
5. ¿Cuál es tu ticket promedio por cliente?
6. ¿Cuánto tiempo pasa entre tu primer contacto y el pago? (→ sales_cycle)
7. ¿Cómo monetizas? (transaccional / suscripción / ticket alto / contrato) (→ monetization_type)
8. ¿En qué país operas principalmente? (→ Location Layer)
9. ¿Tu mercado es local o global? (→ market_scope)
10. ¿Cuál es tu objetivo principal en los próximos 90 días?

**FASE B — Progresiva (se completa en las primeras 2 semanas):**
- Capital intensity (→ economic_profile)
- Sectores / industria específica
- Competidores (usado en SWOT)
- Canal de adquisición actual

---

### 2.2 — Diseño UX del onboarding 2-fases

- Fase A: pantalla dedicada, sin navegación lateral visible, progress bar de 10 preguntas
- Bienvenida: "Vamos a entender dónde estás en 3 minutos."
- Al terminar Fase A: setup inicial completo, llevar al dashboard
- Fase B: aparece como "Completa tu perfil estratégico" en banner dismissible del dashboard
- Completion de Fase B: desbloquea features adicionales

---

### 2.3 — Discovery Path como sub-estado de Fase 1

**Originado en:** chatttt2.txt + chattt.txt.

La primera pregunta del onboarding define el sub-estado inicial (no un onboarding distinto):

```
"¿En qué punto estás ahora?"
  → "Quiero empezar desde cero"    → Fase 1 · Sub-estado: Sin hipótesis
  → "Tengo una idea"               → Fase 1 · Sub-estado: Hipótesis definida
  → "Ya estoy operando"            → Motor calcula fase real con datos del onboarding
```

**Sub-estado "Sin hipótesis" (usuario sin idea):**
- La app muestra SOLO el flujo de exploración / generación de ideas
- NO se muestran CRM, KPIs de ventas, OBVs de revenue
- Solo: generador de ideas IA, interview tracker, hypothesis builder, persona canvas
- El sub-estado desaparece cuando se elige y documenta la primera hipótesis

**Sub-estado "Hipótesis definida":**
- Se salta generación de ideas
- Empieza directamente en: validación de problema, entrevistas, test inicial

**Estado "Ya estoy operando":**
- El motor calcula la fase real con los datos del onboarding (ingresos, clientes, equipo)
- Puede colocarlo en Validación / Operación / Escala según resultados

---

### 2.3b — Idea generation con viabilidad desde el minuto 1 ✅ [+chattt.txt]

**Origen:** chattt.txt — diseño específico del flujo para usuarios "sin idea".

**NO es solo inspiración.** Cada idea generada viene con filtro de viabilidad estructural inmediato.

**Flujo completo:**
1. Optimus pregunta: intereses, habilidades, restricciones de tiempo y dinero
2. Genera 3 opciones de negocio. Cada opción incluye:
   ```
   Idea: [nombre + descripción en 1 línea]
   Por qué encaja contigo: [match con intereses/habilidades]
   Perfil económico estimado: B2C · Ticket bajo · Ciclo corto
   Riesgos principales: [2–3 riesgos concretos]
   Primer experimento de 7 días: [OBV específico para validarla]
   ```
3. El usuario elige una opción (o la descarta todas → regenerar)
4. Al elegir → automáticamente:
   - Fase = 1 · Sub-estado = "Hipótesis definida"
   - Se crea el primer OBV con el experimento de 7 días pre-cargado
   - Economic Profile detectado desde el perfil estimado de la idea elegida

**Criterio de las 3 ideas:**
- Idea 1: Menor riesgo, mayor velocidad de validación (servicios digitales, consultoría)
- Idea 2: Mayor potencial de escala, más capital requerido (tech/SaaS)
- Idea 3: Basada en el interés más fuerte del usuario, sin filtro de viabilidad

**Conecta con:** `generate-business-ideas` edge function (ya existe — adaptar output al nuevo formato).

---

### 2.4 — Double filter para ideas

**Originado en:** chatttt2.txt.

Cuando un usuario ingresa una nueva idea o hipótesis de negocio, el sistema aplica 2 filtros:

**Filtro Nivel 1 — Hard filter (incoherencia estructural):**
- ¿La idea describe un problema real o solo una solución?
- ¿Tiene segmento de cliente identificable?
- Si NO pasa → no se guarda como hipótesis válida. Optimus redirige: "Antes de esto, definamos el problema."

**Filtro Nivel 2 — Warning (riesgo alto pero posible):**
- ¿El mercado es demasiado amplio? ("todos")
- ¿El ciclo de venta proyectado no coincide con el modelo económico?
- Si activa warning → se guarda pero con banner amarillo + sugerencia de Optimus

---

### 2.5 — Modelo Estratégico como sección permanente

**Originado en:** chatttt2.txt.

Reemplazar el concepto de "onboarding completado" por "Modelo Estratégico" — sección viva que siempre existe y se actualiza.

5 bloques del Modelo Estratégico:
1. **Fase actual** (calculada por Phase Engine, no declarada)
2. **Modelo Económico** (ciclo de venta + tipo monetización + intensidad de capital)
3. **Mercado** (segmento + geografía + scope)
4. **Estructura** (team size + work_mode + función coverage)
5. **Salud** (probability score + viability state + last week execution)

Accesible desde el sidebar como ítem permanente: "Mi Modelo"

---

### 2.6 — Reality Mode vs Simulation Mode

**Originado en:** chatttt2.txt.

El sistema opera siempre en **Reality Mode** por defecto.

**Simulation Mode (sandbox):**
- Permite al usuario "jugar" con escenarios: "¿Qué pasaría si cierro 3 deals este mes?"
- No afecta los scores reales
- Los engines corren en paralelo con datos ficticios
- Al salir: "Volver a tu situación real"
- **No mostrar en MVP v1** — es una feature de v2

---

### 2.7 — Los 3 Modos de Optimus

**Originado en:** chatttt2.txt.

El usuario elige su modo de operación (o Optimus lo detecta y sugiere):

| Modo | Threshold score para avanzar | Tolerancia de inactividad | Tono |
|------|------------------------------|---------------------------|------|
| **Exploración** | 65% | 5 semanas | Curioso, exploratorio |
| **Estándar** | 75% | 3 semanas | Directo, motivador |
| **Estricto** | 85% | 2 semanas | Exigente, sin excusas |

El modo afecta:
- Thresholds del Phase Engine
- Frecuencia de notificaciones
- Tono de los mensajes de Optimus
- Velocidad de escalada de alertas

**Importante:** Modo = parámetro del proyecto, no del usuario (un usuario puede tener proyecto en Exploración y otro en Estricto).

---

### 2.8 — Post-onboarding: los primeros 15 minutos

**Gap crítico identificado por Claude:** No existe diseño para lo que pasa justo después de terminar el onboarding.

**Tarea:** Diseñar el flujo completo:
1. Pantalla: "Tu perfil está listo. Esto es lo que Optimus detectó." → mostrar Modelo Estratégico v1
2. Primera sugerencia de Optimus según fase detectada:
   - Fase 1 → "Te propongo tu primera entrevista de descubrimiento"
   - Fase 2 → "Veo que tienes clientes. Documentemos tu primera validación de revenue"
   - Fase 3+ → "Empecemos con tu primera OBV de sistema operacional"
3. Crear el primer OBV automáticamente (con confirmación del usuario)
4. Mostrar el header con Phase Score inicial + Probability Score inicial
5. Opcional: tour de 3 slides del dashboard

---

### 2.9 — Mentira en onboarding / datos incorrectos

**Edge case, pero importante de diseñar (ver Tier 11.4).**

Si los datos de onboarding son contradictorios (ej: "genero €50K/mes" pero "tengo 0 clientes"), el sistema debe:
1. No bloquear — guardar y continuar
2. Marcar como "datos pendientes de verificación"
3. Optimus en la primera sesión: "Noto una inconsistencia en tu perfil. Cuéntame más sobre..."

---

### 2.10 — Strategic Reset Ritual (ciclos de 4 semanas)

**Originado en:** chatttt2.txt.

Cada 4 semanas, el sistema propone (no obliga) un ritual de reset estratégico:

**4 pasos del ritual:**
1. **Auto-diagnóstico:** El sistema presenta las métricas de las últimas 4 semanas
2. **5 preguntas:** Optimus hace 5 preguntas de reflexión (¿Qué funcionó? ¿Qué no? ¿Qué evitaste? ¿Qué aprendiste? ¿Cuál es tu apuesta para el próximo ciclo?)
3. **Decisión estructural:** ¿Continuar igual / ajustar / pivote / pausa?
4. **Nuevo ciclo:** Se crea registro en `strategic_cycles` con estado del ciclo: 🟢 Sólido / 🟠 Inestable / 🔴 Crítico

El ritual genera un `strategic_cycle` record y alimenta el historial del proyecto.

---

## TIER 3: UX Core — Superficies del Motor

> **Depende de:** TIER 1 (engines calculando datos)
> **Tipo:** Frontend React/TypeScript

### 3.1 — Header permanente: 3 indicadores siempre visibles

El header principal (en todas las vistas del proyecto) debe mostrar:
```
[Logo] [Proyecto actual]    [FASE 2 · 67%] [●●●○○ 54] [Riesgo: ●]    [Avatar]
```

Donde:
- **FASE N · X%** — fase actual + phase score (badge color: verde/amarillo/rojo)
- **●●●○○ N** — probability score en escala de 5 puntos (nunca el número exacto)
- **Riesgo: ●** — viability state como punto de color (verde/amarillo/rojo)

Al hacer hover: tooltip con "Tu probabilidad de avance es 54/100. El factor más bajo es execution_rate (32%)."

---

### 3.2 — Phase progress bar

En la vista de Dashboard y en "Mi Modelo":
- Barra horizontal dividida en 4 fases
- La fase actual tiene fill gradient hasta el score actual
- Las fases completadas están llenas
- Las fases futuras están vacías con outline

Hacer clic en cualquier fase → ver outcomes y score detallado.

---

### 3.3 — Phase Score breakdown view

Vista expandible (en Dashboard o Mi Modelo) que muestra:
```
FASE 2: VALIDACIÓN — 67% (Fricción)
─────────────────────────────────────
O2.1 — Revenue evidence     ████░░  45% (Saludable mínimo: 50%)
O2.2 — MVP testing          ██████  72% ✓
O2.3 — Acquisition channel  ██░░░░  28% ← Factor más bajo
─────────────────────────────────────
Hard signal: ❌ No revenue OBV validado aún
─────────────────────────────────────
Próxima acción: Documenta tu primera venta o compromiso de compra
```

---

### 3.4 — Probability Engine breakdown

Vista expandible (al hacer clic en el indicator del header):
```
PROBABILIDAD DE AVANCE — 54/100 (Fricción)
─────────────────────────────────────────────
Fase score         ████████░░  67  (peso: 35%)
Execution rate     █████░░░░░  52  (peso: 20%)  ← Bajo
Validation         ███████░░░  63  (peso: 15%)
Revenue momentum   ████████░░  71  (peso: 15%)
Capacity health    ████░░░░░░  38  (peso: 15%)  ← Bajo
─────────────────────────────────────────────
Tendencia: ↓ -8 puntos vs semana pasada
```

---

### 3.5 — Regression UX — La experiencia de ir hacia atrás

**Gap crítico no diseñado.** Si ocurre una regresión de fase:

**Lo que NO se debe hacer:** mensaje de error brutal, datos borrados, sensación de castigo.

**Diseño propuesto:**
1. Notificación especial (tipo distinto visualmente): "Tu proyecto ha entrado en revisión de Fase 1"
2. Pantalla de transición: "Esta no es una derrota. Es datos." → explicar qué causó la regresión
3. Las 3 Paths aparecen (mismas del Viability Engine)
4. Optimus: "Llevas 6 semanas sin OBVs. Hablemos de qué está bloqueándote."
5. Dashboard muestra "Modo Recuperación" con las 3 acciones más prioritarias

---

### 3.6 — Viability state UI

**SALUDABLE:** Sin banner. Solo el punto verde en el header.

**ESTANCAMIENTO:** Banner amarillo sticky en el top del dashboard:
```
⚠️ Tu proyecto lleva 8 semanas sin avanzar. [Ver las 3 opciones →]
```

**CRÍTICO:** Banner rojo que NO desaparece hasta que el usuario elige una path:
```
🔴 Tu modelo necesita revisión estratégica. [Iniciar revisión — obligatorio]
```

Al entrar en modo CRÍTICO: nueva creación de OBVs/tareas bloqueada hasta que se reconoce el estado.

---

### 3.7 — Empty states para cada engine

Diseñar estados vacíos específicos (no genéricos):

| Situación | Empty State |
|-----------|-------------|
| Phase score: 0 datos | "Completa tu primera validación para activar el motor de fase" |
| Probability: < semana 2 | "Tu probabilidad se activa a partir de la semana 3" |
| Org Engine: solo | "Eres el único, pero no estás solo. Optimus monitorea tu carga." |
| Org Engine: equipo, 0 datos | "Añade a tu equipo para activar el motor organizacional" |
| Function Coverage: vacío | "¿Quién hace qué? Asigna funciones a los miembros de tu equipo." |
| Benchmarks: no disponible | "Los benchmarks se activan cuando tu sector tiene datos suficientes" |

---

### 3.8 — Modo Desbloqueo UX

**Originado en:** chatttt2.txt. Activado cuando se detecta `behavioral_block`.

El sistema detecta que el founder lleva N semanas evitando una acción específica (ej: nunca habla con clientes, evita cerrar deals, siempre postpone tareas de finanzas).

**"Modo Desbloqueo" — 7 días:**
- Duración fija: 7 días
- 1 objetivo único (no negociable)
- Máximo 3 tareas en ese período
- Obligatorio 1 experimento/test real
- Al final: Optimus hace check-in: "¿Completaste el test? ¿Qué aprendiste?"

UX: modo visual distinto en el dashboard durante los 7 días. Resto de features atenuadas (no bloqueadas).

---

### 3.9 — "Cost of Ignoring" visualization

**Originado en:** chatttt2.txt.

Cuando Optimus hace una recomendación que el usuario ignora repetidamente, después de 2 rechazos mostrar:

```
┌──────────────────────────────────────────────────────────┐
│  Si actúas ahora:    Trayectoria A → [gráfico ascendente] │
│  Si sigues igual:    Trayectoria B → [gráfico plano]      │
│                                                            │
│  Diferencia estimada en 90 días: X leads, Y revenue       │
└──────────────────────────────────────────────────────────┘
```

No es amenaza. Es visualización de oportunidad perdida. Datos reales del motor.

---

### 3.10 — Weekly Review digest UI (en-app)

Además del email (Appendix C de ENGINE_DESIGN.md), el digest debe existir como vista in-app:
- Accesible desde el sidebar: "Resumen Semanal"
- Muestra el digest del domingo (formato ENGINE_DESIGN.md Appendix C)
- Historial de semanas anteriores navegable
- Acción rápida: "Confirmar mis 3 acciones para esta semana"

---

### 3.11 — Build Mode vs Rescue Mode

**Originado en:** chatttt2.txt.

El "motor" tiene 2 estados operacionales:

**Build Mode** (estado normal):
- Objetivo: construir, validar, escalar
- Optimus: proactivo, sugiere próximos pasos
- Playbooks: expansión y crecimiento

**Rescue Mode** (activado por Viability Engine en ESTANCAMIENTO/CRÍTICO):
- Objetivo: estabilizar y recuperar
- Optimus: enfocado en 1 cosa a la vez
- Playbooks: tracción de emergencia, cash generation, team alignment
- UI: paleta visual diferente (no alarmante, pero distinta)
- Duración: máximo 12 semanas → si no recupera → Viability CRÍTICO

Transición Build → Rescue: automática por Viability Engine
Transición Rescue → Build: 4 semanas consecutivas con probability ≥ 60

---

### 3.12 — Dynamic phase horizon

**Originado en:** chatttt2.txt.

En lugar de mostrar un deadline fijo ("completarás Fase 2 en 8 semanas"), mostrar una trayectoria:

```
Al ritmo actual:  ────────────────────────────── [Fase 3 en ~14 semanas]
Ritmo objetivo:   ──────────── [Fase 3 en ~6 semanas]
Diferencia:       Si completas [acción X] podrías acortar en 8 semanas
```

Dinámico: se actualiza cada semana según execution_rate real.

---

### 3.13 — Phase transition UX

Cuando Phase Engine propone avanzar de fase (score ≥ 75% + hard signal):

1. Notificación especial (celebratoria pero sustantiva)
2. Vista de confirmación:
   - "Estás listo para Fase 3: Operación"
   - Resumen de lo logrado en Fase 2
   - Preview de los 3 nuevos Outcomes de Fase 3
   - Botón: "Confirmar avance"
3. Post-confirmación: animación + "Bienvenido a Fase 3"
4. Primera sugerencia de Optimus para Fase 3
5. Features desbloqueadas por nueva fase aparecen marcadas como "Nuevo"

---

### 3.14 — Notification center renovado

El notification center actual necesita adaptarse a los 5 layers:
- Filtros por layer: Operacional / Fase / Probabilidad / Viabilidad / Organización
- Indicador de prioridad visual (crítico = rojo, alto = naranja, medio = amarillo, bajo = gris)
- Snooze (7 días) en cada notificación
- Agrupamiento: máximo 5/día (hard cap)
- Digest dominical substituye notificaciones Layer 3 de la semana

---

## TIER 4: Sistema de Roles — Fix Crítico

> **BUGS ACTUALES:** InviteMemberWizard = simulación pura (setTimeout). project_members.role nunca se asigna desde ningún flujo. calculate_role_performance_score ignora el parámetro role. Dos sistemas de roles paralelos sin conexión.
> **Depende de:** TIER 0.8 (tablas), TIER 1.11 (role → Phase Score)
> **Tipo:** Backend + Frontend — fixes de código existente

### 4.1 — Fix InviteMemberWizard — persistir datos reales

Archivo: `src/components/roles/InviteMemberWizard.tsx`

El `handleSubmit` actual usa `setTimeout` de simulación. Reemplazar con:
1. Mutación real a `project_members` (INSERT o UPDATE)
2. Guardar el campo `role` (specialization_role ENUM)
3. Guardar `is_lead` si se selecciona
4. En caso de error: mostrar toast de error real, no de éxito falso
5. Post-éxito: invalidar query de `project_members`

---

### 4.2 — Unificar los 2 sistemas de roles

**Problema actual:**
- `project_roles` table: descripciones de rol generadas por IA (AI job descriptions)
- `project_members.role`: ENUM de especialización (sales/finance/ai_tech/etc.)

Son dos cosas distintas que el wizard mezcla.

**Solución:**
- `project_roles` → renombrar conceptualmente a "role_descriptions" o "role_profiles" (descripciones para atraer miembros)
- `project_members.role` → es la especialización real (lo que se asigna al invitar)
- El wizard: al seleccionar un `project_role` para el invite, mapear automáticamente al `specialization_role` ENUM correspondiente

Crear mapping table si es necesario:
```sql
-- O simplemente añadir campo a project_roles:
ALTER TABLE project_roles ADD COLUMN maps_to_specialization specialization_role;
```

---

### 4.3 — Fix calculate_role_performance_score — usar el parámetro role

La función SQL actual recibe `_role_name TEXT` pero usa siempre la misma fórmula genérica:
```sql
score = (obvs_count × 10) + (kpis_count × 5) + (tasks_completed × 2)
```

Reemplazar con las 6 fórmulas diferenciadas de ENGINE_DESIGN.md §7.2:
- SALES: peso en leads_closed_won + CRM advancement
- FINANCE: peso en cash_flow_accuracy + collections
- MARKETING: peso en leads_generated + conversion_rate
- OPERATIONS: peso en tasks_on_time + processes_documented
- AI_TECH: peso en mvp_milestones + delivery_velocity
- STRATEGY: peso en OKRs_on_track + pivots_documented

---

### 4.4 — Añadir leader_id a tasks table

```sql
ALTER TABLE tasks ADD COLUMN leader_id UUID REFERENCES profiles(id);
```

Actualizar el task creation form:
- Campo "Ejecutor" (assignee_id) — quien hace el trabajo
- Campo "Líder" (leader_id) — quien es responsable del resultado
- Validación: leader ≠ executor (enforced)
- En solo mode: leader_id = null (no mostrar el campo)

---

### 4.5 — Function Coverage: implementar las 6 funciones

**Originado en:** chatttt2.txt.

Las 6 funciones estructurales (diferentes de los 6 roles de especialización):

| Función | Descripción | Ejemplo de quien la cubre |
|---------|-------------|---------------------------|
| Demand Generation | Generar demanda / awareness | Marketing, Growth |
| Closing | Cerrar ventas | Sales |
| Cash Control | Controlar finanzas | Finance, founder |
| Delivery/Ops | Entregar el producto/servicio | Operations, Tech |
| Direction/Strategy | Estrategia y dirección | Founder, Strategy |
| Automation/Tech | Automatizar y construir tech | Tech, AI |

**Diferencia clave:** Un mismo miembro puede cubrir 2-3 funciones. Una función puede estar cubierta por múltiples miembros. Esto es más flexible que el sistema de roles.

Implementar `project_function_coverage` (tabla ya definida en TIER 0.8).

---

### 4.6 — Role emergence desde comportamiento

**Originado en:** chatttt2.txt.

No obligar a asignar roles desde el inicio. Observar durante 2-4 semanas quién hace qué:
- ¿Quién crea más OBVs de tipo revenue? → sugerir Sales role
- ¿Quién completa más tareas de tipo finance? → sugerir Finance role
- ¿Quién tiene más actividad en CRM? → sugerir Sales role

Después de 2 semanas: "Optimus detectó que [Nombre] actúa principalmente como [rol]. ¿Quieres asignarlo oficialmente?"

El sistema guarda la sugerencia y el usuario confirma/rechaza.

---

### 4.7 — Role change UX

Si un miembro cambia de rol (raro pero posible):
1. Preservar historial de performance del rol anterior
2. El performance score del nuevo rol empieza desde 0 pero con nota "Rol anterior: [X] · Score anterior: [Y]"
3. Notificación al proyecto: "El rol de [Nombre] cambió de [X] a [Y]"
4. Phase Score se recalcula con nueva distribución de critical roles

---

### 4.8 — Empty role display

Si un rol crítico para la fase actual está vacío:
- En la vista de equipo: mostrar el slot vacío con estado "Rol sin cubrir"
- Tooltip: "Este rol es crítico en Fase [N]. Sin él, tu Phase Score tiene una penalización de -X puntos."
- CTA: "¿Quieres cubrir este rol? Invita a alguien o asúmelo tú."
- Si el founder lo asume → asignar founder con flag `is_also_covering_role = true`

---

## TIER 5: Optimus — Psicología del Sistema

> **Depende de:** TIER 1 (engines) + TIER 2 (onboarding) + TIER 4 (roles)
> **Tipo:** IA (prompts) + UX + Backend (decision tracking)

### 5.1 — Definir el carácter completo de Optimus

**Gap crítico:** El tono, personalidad y voz de Optimus están completamente indefinidos en código y diseño.

**Tarea:** Crear documento `OPTIMUS_CHARACTER.md` con:
- **Quién es:** Mentor estratégico senior con experiencia en startups. No es un chatbot. Es un advisor con criterio.
- **Qué NO es:** Un motivational speaker. No usa frases vacías. No celebra cosas que no merecen celebración.
- **Tono:** Directo pero cálido. Dice las cosas que el founder necesita escuchar, no las que quiere escuchar.
- **Lenguaje:** Español natural, no corporativo. Sin jerga innecesaria.
- **Límites:** No hace promesas. No predice. Trabaja con datos, no con esperanza.

Ejemplos de respuestas:
- MAL: "¡Excelente avance! Sigues en el camino correcto."
- BIEN: "Cerraste 2 deals esta semana. El patrón de lo que funcionó: contacto directo por WhatsApp. Replícalo."

---

### 5.2 — Optimus context packet en todas las conversaciones

El sistema inyecta en cada conversación con Optimus el contexto completo del motor (ENGINE_DESIGN.md Appendix B):
```json
{
  "current_phase": 2,
  "phase_score": 62,
  "phase_state": "friccion",
  "probability_score": 54,
  "probability_trend": "declining",
  "viability_state": "saludable",
  "bottleneck_role": "sales",
  "economic_profile": { "sales_cycle": "medio", "monetization": "suscripcion", "capital": "bajo" },
  "user_role": "strategy",
  "weeks_in_current_phase": 6,
  "active_blocks": ["clarity_block"],
  "optimus_mode": "estandar",
  "last_ritual_completed": "2026-02-10"
}
```

Optimus responde diferente según este contexto. No responde genérico.

---

### 5.3 — Detection de patrones psicológicos

**Originado en:** chatttt2.txt.

El sistema detecta silenciosamente:

**Patrón de evitación estratégica:**
- Mismo tipo de tarea/OBV postponeado N veces
- Sesiones de Optimus sin acciones resultantes
- Trigger: activar Modo Desbloqueo (TIER 3.8)

**Exceso de optimismo:**
- Execution rate real sistemáticamente por debajo de compromisos
- Revenue actuals < proyecciones propias > 2 ciclos consecutivos
- Decisiones tomadas ignorando la recomendación de Optimus con frecuencia
- Trigger: Optimus dice explícitamente: "Noto que tus proyecciones tienden a ser más optimistas que los resultados. ¿Hablamos de eso?"

**Exceso de conservadurismo:**
- Score alto pero el founder retrasa avance de fase
- Múltiples oportunidades de venta sin acción
- Sistematicamente rechaza recomendaciones de escala
- Trigger: "Tus números muestran que estás listo para el siguiente nivel. ¿Qué te está frenando?"

---

### 5.4 — Structural block detection

**Originado en:** chatttt2.txt.

Los 4 tipos de bloqueos estructurales:

| Block Type | Señal | Trigger |
|-----------|-------|---------|
| `clarity_block` | Hipótesis cambia cada semana, no hay foco | 3+ cambios de hipótesis en 4 semanas |
| `traction_block` | Actividad alta pero 0 avance en outcomes | execution_rate alta + fase_score sin moverse 6 semanas |
| `structural_block` | Falta un recurso crítico (rol, capital, tech) | critical_role vacío + capital_intensity alta + no progress |
| `behavioral_block` | Patrón de evitación específica | mismo elemento evitado N veces |

Cuando se detecta: crear registro en `strategic_blocks` + informar a Optimus en context packet.

---

### 5.5 — Conectar SWOT/Competitors → structural_block

**Gap identificado por Claude:** Los módulos de SWOT y análisis de competidores existen pero no conectan con la detección de bloques estructurales.

**Tarea:** Si SWOT detecta una debilidad crítica que no está siendo atendida → marcar como posible `structural_block`. Si hay un competidor con ventaja significativa en el área de menor score → añadir al contexto de Optimus.

---

### 5.6 — Decision Accuracy Index (interno)

**Originado en:** chatttt2.txt.

El sistema trackea todas las recomendaciones de Optimus y si fueron aceptadas o rechazadas. 30 días después, evalúa el resultado:

```
decision_accuracy = (
  casos donde seguir recomendación = mejor resultado / total recomendaciones seguidas
)
```

**IMPORTANTE:**
- **No mostrar al usuario nunca** (evita manipulación o inseguridad)
- Solo uso interno para mejorar los prompts de Optimus
- Si accuracy < 60% → revisar el prompt de recomendaciones para ese tipo

Guardar en `decision_events` (tabla definida en TIER 0.8).

---

### 5.7 — Protocol system: Playbook base + AI adaptation

**Originado en:** chatttt2.txt.

Cada proyecto tiene:
- 1 playbook principal activo (metodología probada)
- Máximo 1 playbook secundario simultáneamente
- IA adapta el playbook al contexto específico del proyecto

Ejemplo:
- Playbook base: "Lean Customer Discovery" (pasos fijos, probados)
- AI adaptation: Optimus adapta la pregunta de entrevista según el sector/país del proyecto

La IA nunca reemplaza el playbook. Lo adapta en lenguaje y contexto, pero no cambia los pasos.

---

### 5.8 — Proyecto "graduation" — estado de éxito

**Gap identificado por Claude:** El sistema nunca define qué pasa cuando un proyecto "termina bien."

**Tarea:** Definir el estado de graduación:
- Condición: Fase 4 mantenida por ≥ 12 semanas con probability ≥ 75%
- Optimus propone: "Has completado el ciclo de Optimus. Tu proyecto está en escala sostenida."
- Opciones: Archivat como "Completado con éxito" / Continuar en modo mantenimiento / Crear proyecto hijo (expansión)
- El proyecto graduado aparece en el portfolio del usuario con badge

---

### 5.9 — Detección de patrón del Optimus por modo

Según el modo activo (Exploración/Estándar/Estricto):

**Exploración:** Optimus hace preguntas más abiertas. "¿Qué más podrías explorar?" Tolera ambigüedad.

**Estándar:** Optimus equilibra exploración y ejecución. Pregunta y también dirige.

**Estricto:** Optimus es directo y exigente. "No hay avance desde hace 3 semanas. Necesitas una decisión hoy."

Implementar como parámetro en el system prompt de Optimus.

---

### 5.10 — Patrón de evitación → escalada progresiva

```
Semana 1: Optimus pregunta suavemente
Semana 2: Optimus nombra el patrón directamente
Semana 3: Modo Desbloqueo activado (automático)
Semana 4 sin desbloqueo: structural_block marcado como behavioral
```

---

### 5.11 — Primeras sesiones de Optimus por fase

Diseñar los primeros mensajes de Optimus cuando se entra en cada fase:
- **Fase 1:** "Tu misión ahora es encontrar un problema real. No una solución. Un problema. ¿Con quién puedes hablar esta semana?"
- **Fase 2:** "Tienes una hipótesis. Ahora necesitas alguien que pague por ella. ¿Quién es tu primer intento de venta?"
- **Fase 3:** "Tienes tracción. El riesgo ahora es crecer sin sistema. ¿Qué procesos repetitivos necesitas documentar primero?"
- **Fase 4:** "El riesgo de Fase 4 es depender de ti. ¿Qué puedes dejar de hacer tú esta semana?"

---

### 5.12 — Respuesta a la pregunta pendiente de chatttt2.txt

La última pregunta de ChatGPT (línea 7143):
> "¿Quieres que el sistema detecte patrones de 'exceso de optimismo' o 'exceso de conservadurismo' en la toma de decisiones del founder y lo señale explícitamente?"

**Respuesta de diseño:** Sí, y ya está especificado en TIER 5.3. El sistema lo detecta y Optimus lo nombra explícitamente — pero siempre desde datos, nunca como juicio personal. No es "eres demasiado optimista" sino "tus proyecciones han sido X% más altas que los resultados en los últimos 3 ciclos. ¿Ajustamos cómo proyectamos?"

---

## TIER 6: Notificaciones — Layers 2–5

> **Depende de:** TIER 1 (engines generando datos)
> **Layer 1 ya funciona. Construir layers 2–5.**

### 6.1 — Layer 2: Phase Engine notifications (6 tipos)

Implementar en `trigger-engine-notifications`:
- `phase_score_warning` — score < 50%
- `phase_score_critical` — score < 30%
- `phase_advance_ready` — score ≥ 75% + hard signal
- `phase_advanced` — transición confirmada
- `phase_regression_warning` — 4 semanas < 50%
- `phase_regressed` — fase decrementada

---

### 6.2 — Layer 3: Probability Engine notifications (4 tipos)

- `probability_drop` — caída >15 puntos en una semana
- `probability_critical` — score < 30 por 2 semanas
- `probability_high` — score ≥ 80 por primera vez
- `probability_input_zero` — cualquier input en 0

---

### 6.3 — Layer 4: Viability Engine notifications (5 tipos)

- `viability_stagnation_warning` — 6 semanas < 50%
- `viability_stagnation` — 8 semanas (obligatorio)
- `viability_critical` — 12 semanas (bloquea nuevas tareas/OBVs)
- `viability_path_chosen` — usuario elige una path
- `viability_recovery` — recuperación confirmada

---

### 6.4 — Layer 5: Org Engine notifications (6 tipos, team-only)

- `org_capacity_warning` — miembro > 80%
- `org_capacity_critical` — miembro > 95%
- `org_bottleneck_detected` — rol > 60% OBVs
- `org_role_empty_warning` — rol crítico vacío 2+ semanas
- `org_role_empty_critical` — rol crítico vacío 4+ semanas
- `org_challenge_suggested` — bottleneck sin challenge activo

---

### 6.5 — Notification volume control

Implementar hard caps:
- Máximo 5 notificaciones/día por proyecto (priorización por severidad)
- Máximo 15/semana
- Snooze individual: 7 días
- Digest dominical: agrupa Layer 3 de toda la semana en 1 mensaje
- Archivado: nunca borrar, siempre archivable

---

### 6.6 — Email channel para Layer 2 y 4

Implementar envío de email (via Resend o similar) para:
- Phase transitions (Layer 2: `phase_advance_ready`, `phase_regressed`)
- Viability alerts (Layer 4: `viability_stagnation`, `viability_critical`)

NO enviar email para Layer 1 (ya en-app), Layer 3 (ruido), Layer 5 (interno).

---

## TIER 7: Contenido y Playbooks

> **Depende de:** TIER 5 (Optimus character definido)
> **Tipo:** Contenido estratégico + AI prompts

### 7.1 — Playbooks library v1

Definir y escribir los playbooks base:

**Playbooks de Build Mode:**
1. Lean Customer Discovery (Fase 1)
2. Revenue Validation Sprint (Fase 2)
3. Repeatable Sales Playbook (Fase 2/3)
4. Operations Systemization (Fase 3)
5. Scaling Without Founder (Fase 4)

**Playbooks de Rescue Mode:**
1. Emergency Cash Generation (< 60 días de runway)
2. Pivot Segment Protocol (cambiar quién compra)
3. Pivot Value Protocol (cambiar qué se vende)
4. Team Alignment Crisis (equipo desalineado)
5. Solo Founder Burn Recovery (agotamiento)

Para cada playbook: nombre, cuándo activar, pasos (3–7 pasos), KPIs de éxito, duración estimada.

---

### 7.2 — Microcopy para todos los estados del motor

Escribir los textos exactos (en español) para:
- Cada estado de Viability (saludable/estancamiento/crítico)
- Cada transición de fase (advance + regression)
- Cada empty state (definidos en TIER 3.7)
- Cada notificación de los 4 layers
- Los 3 Paths del Viability Engine
- El Weekly Digest (formato Appendix C de ENGINE_DESIGN.md)
- El Modelo Estratégico (cabeceras y labels)

**Principio:** Nunca usar "fracaso", "abandonar", "imposible". Siempre frame de aprendizaje y estrategia.

---

### 7.3 — Prompts de Optimus por contexto

Escribir los system prompts de Optimus para cada combinación crítica:
- Fase 1 + clarity_block
- Fase 2 + traction_block + revenue_momentum bajo
- Fase 3 + bottleneck en Sales
- Fase 4 + founder > 50% de tareas críticas
- Modo Estricto + 3 semanas sin avance
- Viability ESTANCAMIENTO + path selection
- Post-ritual + ciclo 🔴 Crítico

---

### 7.4 — Benchmarks v1 curados (si se elige Opción A del TIER 0.7)

Definir valores concretos para benchmarks por:
- Fase 1: número de entrevistas, tiempo en fase, % con hipótesis documentada
- Fase 2: semanas hasta primera venta, % que hacen pivot, conversion rate inicial
- Fase 3: MoM growth promedio, team size típico, OKR adoption rate
- Fase 4: % revenue sin founder, churn rate, team to revenue ratio

Fuentes: CB Insights, First Round Capital reports, Carta benchmarks, Stripe Atlas data, Endeavor LATAM.

---

### 7.5 — Discovery Path content (Fase 1 sub-estado)

Contenido específico para el sub-estado "Sin hipótesis" de Fase 1:
- Template de entrevista de descubrimiento (5 preguntas)
- Template de hipótesis (problema / segmento / propuesta de valor)
- Persona canvas simplificado
- Guía: "Cómo ir de idea a primera hipótesis en 7 días"

---

### 7.6 — 5 preguntas del Strategic Reset Ritual

Las 5 preguntas exactas que Optimus hace en cada ritual de 4 semanas:
1. "De todo lo que hiciste este ciclo, ¿qué generó movimiento real?"
2. "¿Qué evitaste hacer? ¿Por qué?"
3. "¿Qué creyó tu sistema que funcionaría y no funcionó?"
4. "¿Qué aprendiste que no esperabas aprender?"
5. "¿Cuál es tu apuesta más importante para el próximo ciclo?"

---

### 7.7 — Weekly Loop vs Strategic Reset Ritual — coordinación

**Gap identificado por Claude:** El Weekly Loop (domingo) y el Reset Ritual (cada 4 semanas) pueden solaparse o contradecirse.

**Diseño de coordinación:**
- Semanas 1, 2, 3: Weekly Loop normal (resumen + 3 acciones)
- Semana 4: Weekly Loop + Ritual (el ritual reemplaza la parte de "3 acciones" del loop)
- El ritual puede postponerse 1 semana si el usuario está en Modo Desbloqueo
- No pueden estar activos simultáneamente

---

## TIER 8: Features por Fase y Modo

> **Depende de:** TIER 1 + TIER 2 + TIER 3 completados
> **Tipo:** Arquitectura de feature flags + UX

### 8.1 — Auditoría completa de las 223 features

Clasificar CADA feature existente por:
1. **Fase mínima requerida** (1/2/3/4)
2. **Work mode** (individual/equipo_pequeño/equipo_establecido)
3. **Viability state** (disponible en saludable/estancamiento/crítico)
4. **Mode** (Build/Rescue)
5. **Priority** (core/secondary/advanced)

Resultado esperado: tabla completa `feature_matrix.md` con los 223 items clasificados.

---

### 8.2 — Feature visibility system en código

Implementar sistema en el frontend que, dado el estado actual del proyecto:
```typescript
interface FeatureVisibility {
  featureId: string;
  visible: boolean;
  reason?: string; // "Disponible en Fase 2" | "Solo en equipo"
  teaser?: boolean; // Mostrar bloqueada con preview
}
```

Cada feature tiene su configuración en `src/config/features.ts` expandida con los 5 parámetros de clasificación.

---

### 8.3 — Teaser UX para features bloqueadas

Features no disponibles en la fase/modo actual se muestran como:
- Visibles en sidebar pero con candado
- Al hacer clic: "Esta feature se activa en Fase 3 — a tu ritmo actual, en ~X semanas"
- NO bloquear con paywall si no hay planes (ENABLE_PAYMENTS = false)
- Bloquear solo por lógica de fase/modo

---

### 8.4 — Analytics módulo: evitar redundancia con engines

**Gap identificado por Claude:** El módulo de Analytics puede ser redundante con lo que los engines ya calculan.

**Tarea:** Revisar qué hace Analytics actualmente y distinguir:
- **Cosas que el engine ya calcula** → Analytics las muestra como visualización del engine (no recalcular)
- **Cosas que el engine no calcula** → Analytics tiene valor propio (benchmarks comparativos, tendencias históricas largas, exportación)

Evitar tener dos fuentes de verdad para los mismos datos.

---

### 8.5 — Feature matrix: qué va en MVP v1

Ver TIER 12 para la definición completa del MVP. Aquí: asegurar que el feature flag system soporte versiones:
```typescript
FEATURES = {
  PHASE_ENGINE: { enabled: true, sinceVersion: '2.0' },
  PROBABILITY_ENGINE: { enabled: true, sinceVersion: '2.0' },
  SIMULATION_MODE: { enabled: false, sinceVersion: '3.0' }, // v3
  MULTI_PROJECT: { enabled: false, sinceVersion: '2.1' },   // v2.1
}
```

---

### 8.6 — Feature: Historial del proyecto (timeline)

**Originado en:** ChatGPT bloque 10.

Vista timeline del proyecto mostrando:
- Fases completadas (fecha inicio/fin + score final)
- Pivotes tomados (con motivo)
- Decisiones estratégicas (de `decision_events`)
- Ciclos estratégicos y su evaluación
- Hitos: primera venta, primer equipo, primer OBV validado
- Exportable a PDF

Accesible desde: "Mi Modelo" → tab "Historia"

---

## TIER 9: Sistemas Avanzados

> **Depende de:** TIER 1–8 funcionales
> **Tipo:** Features adicionales de valor diferencial

### 9.1 — Múltiples proyectos

**Gap identificado por Claude:** No está definido cómo funciona el sistema cuando un usuario tiene múltiples proyectos.

**Diseño:**
- Selector de proyecto en el header (ya existe: `SelectProjectPage`)
- Cada proyecto tiene su propio estado completo de los 4 engines
- Dashboard multiproyecto: vista resumen de todos los proyectos del usuario
- Límite por plan: 1 proyecto (Free), 3 proyectos (Pro), ilimitados (Business)
- Los engines corren independientemente por proyecto

---

### 9.2 — Proyecto pausado

Estado `paused` para proyectos (Path 3 de Viability Engine):
- Todos los datos preservados
- Los engines dejan de recalcular (no consumir compute)
- Se puede reactivar en cualquier momento
- Al reactivar: Phase Score se restaura al 40% del valor pre-pausa
- Notificación mensual: "Tu proyecto [X] sigue pausado. ¿Quieres retomarlo?"

---

### 9.3 — Proyecto archivado (cierre definitivo)

Diferente de pausa. Definitivo:
- Estado `archived` (no `deleted`)
- Datos preservados indefinidamente
- No se puede reactivar directamente (requiere crear nuevo proyecto)
- En el portfolio del usuario: aparece como "Cerrado" con fecha y último estado
- No hay emails ni notificaciones para proyectos archivados

---

### 9.4 — Member deletion y redistribución

**Edge case del TIER 11.**

Si un miembro se va del proyecto:
1. Sus tareas activas se quedan sin assignee (no se borran)
2. Optimus sugiere redistribución: "3 tareas de [Nombre] quedaron sin asignar. ¿A quién las asignas?"
3. Sus OBVs activos se transfieren al miembro de mayor rol en esa función
4. Su performance history se preserva
5. El Org Engine recalcula capacidad inmediatamente

---

### 9.5 — Project model change

**Edge case.** Si el modelo de negocio cambia radicalmente (pivot):
- El Economic Profile se recalcula
- Los thresholds de los engines se ajustan
- El historial de fase anterior se preserva como "Fase previa al pivote"
- Optimus: "Has cambiado tu modelo. Ajustando los parámetros del sistema..."
- Los OBVs y tareas del modelo anterior se archivan (no borran)

---

### 9.6 — Export functionality

- Export del Modelo Estratégico (PDF/Excel)
- Export del historial del proyecto (PDF)
- Export de financial projections (Excel — ya parcialmente existe)
- Export de KPIs report
- Para uso en pitch decks, reportes de inversores, retrospectivas

---

### 9.7 — Iteration Velocity tracking (una vez definido en TIER 0.1)

Implementar el cálculo y mostrar como metric en el Weekly Digest y en el breakdown de Probability Engine.

Mostrar también tendencia: "Tu velocity de iteración subió un 30% respecto al ciclo anterior."

---

### 9.8 — Integración Slack mejorada

La integración de Slack existe pero conectarla a:
- Notificaciones Layer 2 (phase transitions) → canal del equipo
- Notificaciones Layer 4 (viability alerts) → canal privado del founder
- Weekly Digest → canal del equipo el domingo
- Bottleneck detection → canal del equipo

---

## TIER 10: Monetización y Planes

> **Estado actual:** ENABLE_PAYMENTS = false. Diseñar antes de activar.
> **Depende de:** TIER 8.1 (feature matrix) para saber qué va en cada plan

### 10.1 — Definir los tiers de plan

**Propuesta inicial a validar:**

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Proyectos | 1 | 3 | Ilimitados |
| Miembros | 1 (solo) | 5 | Ilimitados |
| Engines activos | Phase only | Phase + Probability | Los 4 |
| Optimus conversaciones/mes | 10 | 100 | Ilimitadas |
| Benchmarks | No | Sí | Sí + custom |
| Export | No | PDF | PDF + Excel |
| Notificaciones layers | Layer 1 | L1+L2+L4 | Todos |
| Strategic Reset Ritual | No | Sí | Sí |
| Historial | 3 meses | 12 meses | Ilimitado |

---

### 10.2 — Upgrade hints (SHOW_UPGRADE_HINTS)

Activar gradualmente:
1. Primero: telemetría de qué features usan más los usuarios Free
2. Mostrar hints solo en los momentos de mayor valor percibido
3. No interrumpir el flujo principal con upgrade prompts

---

### 10.3 — Plan limits enforcement

Implementar en el backend:
- Middleware que verifica plan_level antes de ejecutar features premium
- Si límite alcanzado: no error duro, sino redirect a upgrade page
- Mantener contadores en DB: `user_plan_usage` table

---

### 10.4 — Stripe integration

Con ENABLE_PAYMENTS = true:
- Stripe Checkout para suscripción
- Webhook para sync de estado de plan (activar/cancelar)
- Período de prueba (14 días Pro gratis)
- Cancelación → downgrade automático a Free (no borrar datos, solo limitar acceso)

---

### 10.5 — Onboarding a planes

El flujo de selección de plan ocurre:
- Después del onboarding A (Fase 2 del onboarding)
- O cuando el usuario intenta usar una feature Pro por primera vez
- Nunca interrumpir el onboarding inicial con ventas

---

## TIER 11: Edge Cases

> **Todos deben tener diseño de respuesta del sistema — no pueden quedar sin manejar**

### 11.1 — Usuario no completa el ritual (ritual ignorado)

Si el usuario no hace el Strategic Reset en la semana 4:
- Sistema lo reagenda automáticamente a semana 5
- En semana 6: Optimus lo menciona en la próxima interacción: "No hicimos el ritual de este ciclo. ¿Quieres hacerlo ahora rápido?"
- Si se ignora 3 ciclos seguidos: no se fuerza, pero se marca como `behavioral_block` potential

---

### 11.2 — Onboarding incompleto

Si el usuario completa solo la Fase A pero no la Fase B:
- El sistema funciona con datos parciales
- Los engines que pueden calcular, calculan
- Los engines que necesitan datos de Fase B → estado "datos insuficientes"
- No bloquear. Recordar suavemente.

---

### 11.3 — Datos inconsistentes en onboarding

Si Q2 dice "€50K/mes de ingresos" pero Q3 dice "0 clientes activos":
- Guardar sin bloquear
- Marcar como `data_inconsistency = true`
- Optimus en primera sesión: "Quiero entender mejor tu situación. Me dijiste que generas €50K pero sin clientes activos. ¿Cómo funciona eso?"

---

### 11.4 — Cambio radical de modelo de negocio

Si el founder decide cambiar completamente de mercado, producto y segmento:
- Trigger: usuario marca como "Pivote total" desde Settings
- Sistema pregunta: "¿Esto es un ajuste o un pivote completo?"
- Pivote completo: archiva el "Proyecto anterior" bajo el mismo ID con timestamp
- Nuevo ciclo empieza desde Fase 1 sub-estado "Con experiencia previa"
- El historial de aprendizaje se preserva y Optimus lo usa como contexto

---

### 11.5 — Miembro que nunca acepta su rol

Si se invita a un miembro y no acepta en 14 días:
- Notificación al admin: "La invitación de [Nombre] lleva 14 días sin respuesta."
- A los 30 días: invitación expirada automáticamente
- Opciones: reenviar / cancelar / invitar a otra persona para ese rol

---

### 11.6 — Solo founder llega a Fase 4

Matemáticamente problemático (ver TIER 0.3). En Fase 4:
- O4.2 requiere: "Finance, Sales, Marketing, Ops cada uno con ≥1 miembro activo"
- Impossible para solo founder

**Diseño:** En Fase 4, si work_mode = individual:
- Optimus alerta explícitamente: "Escalar en solitario más allá de este punto es un riesgo estructural"
- El O4.2 se evalúa con criterio diferente: ¿Hay freelancers/contractors para cada función?
- Los O4.1 y O4.3 tienen más peso (40% + 60%)

---

### 11.7 — Probability score Day 1 = demotivante

Ver TIER 0.4. Diseñar la solución elegida (Opción A, B, C o D) e implementarla de forma que el primer contacto del usuario con el Probability Engine sea motivador, no deflactante.

---

### 11.8 — Proyecto sin ningún movimiento durante 60 días

Edge case de abandono silencioso:
- Email a los 30 días: "¿Sigues trabajando en [Proyecto]?"
- Email a los 60 días: "Tu proyecto ha estado inactivo. ¿Quieres pausarlo o seguimos?"
- A los 90 días: notificación in-app única. Después: nada más. No spamear.

---

### 11.9 — Datos de revenue no confiables (auto-declarados)

El sistema confía en los datos que el founder introduce. No tiene forma de verificar externamente (sin integración bancaria).

**Diseño:**
- Pedir evidencia adjunta cuando se registra revenue > umbral (ej: >€5K en un mes)
- Si no hay evidencia → el dato se cuenta con peso reducido en `revenue_momentum` (× 0.7)
- Peer validation puede "confirmar" un dato de revenue (sube el peso a ×1.0)

---

### 11.10 — Conflicto entre dos miembros sobre ownership de un OBV

Si dos miembros reclaman el crédito de una validación:
- Sistema asigna a quien lo creó por defecto
- Admin puede reasignar
- Ambos reciben crédito parcial si el admin lo decide (50/50 split en performance score)
- Historial de cambios preservado

---

## TIER 12: Definición del MVP Real

> **Pregunta central:** ¿Qué necesita estar funcionando para que un founder real pueda usar esto?
> **Principio:** Mejor menos y que funcione que más y roto.

### MVP v1 — Lo que debe estar funcionando en el lanzamiento

**Engine Layer:**
- [x] Phase Engine calculando (Fases 1 y 2 principalmente — donde están los usuarios early stage)
- [x] Probability Engine con los 5 inputs
- [x] Notification Layer 1 (ya existe) + Layer 2 (phase transitions)
- [ ] Viability Engine (simplificado: solo SALUDABLE / ESTANCAMIENTO — sin CRÍTICO en v1)
- [ ] Org Engine (solo capacidad básica, sin bottleneck detection en v1)

**Onboarding:**
- [x] Onboarding Fase A (10 preguntas, datos mínimos)
- [x] Location Layer capturado
- [x] Economic Profile detectado automáticamente
- [ ] Post-onboarding first 15 minutes diseñados

**UX Surface:**
- [ ] Header con los 3 indicadores
- [ ] Phase Score breakdown view
- [ ] Probability breakdown (on demand)
- [x] Notification center (ya existe, adaptar a 5 layers)
- [ ] Modelo Estratégico (sección "Mi Modelo")

**Roles:**
- [ ] Fix InviteMemberWizard (persistir datos reales)
- [ ] Fix calculate_role_performance_score (usar role parameter)
- [x] leader_id en tasks (migración simple)

**Optimus:**
- [ ] Character definido (prompt system)
- [ ] Context packet inyectado en cada conversación
- [ ] Detección de 2 tipos de bloques (clarity + traction)

**Contenido:**
- [ ] Playbooks de Build Mode (Fases 1 y 2)
- [ ] Microcopy para estados principales

**Excluido del MVP v1 (va a v2+):**
- Simulation Mode
- Decision Accuracy Index (interno)
- Strategic Reset Ritual completo
- Modo Desbloqueo
- Cost of Ignoring visualization
- Multi-proyecto
- Monetización (ENABLE_PAYMENTS sigue en false)
- Analytics redundancy cleanup
- Benchmarks externos
- Viability Engine CRÍTICO (complejidad alta, impacto en usuarios early = bajo)
- Build Mode / Rescue Mode visual distinction
- Org Engine bottleneck → Challenge suggestion

---

### Orden de construcción sugerido

```
SPRINT 1 (fundamentos sin UX visible):
  ├── TIER 0: Todas las definiciones matemáticas resueltas
  ├── TIER 0.8: Tablas de DB creadas
  └── TIER 4.1-4.4: Fixes de roles (bugs existentes)

SPRINT 2 (engines backend):
  ├── TIER 1.1-1.3: Phase Engine + Probability Engine
  ├── TIER 1.8: Economic Profile detection
  └── TIER 1.9: Cron jobs configurados

SPRINT 3 (onboarding + primera experiencia):
  ├── TIER 2.1-2.5: Onboarding rediseñado
  ├── TIER 2.8: Post-onboarding first 15 min
  └── TIER 6.1-6.2: Notifications Layer 2-3

SPRINT 4 (UX core):
  ├── TIER 3.1-3.4: Header + Phase progress + breakdowns
  ├── TIER 3.5-3.6: Regression UX + Viability state UI
  ├── TIER 3.7: Empty states
  └── TIER 3.14: Notification center renovado

SPRINT 5 (Optimus):
  ├── TIER 5.1: Character document
  ├── TIER 5.2: Context packet implementado
  ├── TIER 5.3: Block detection (clarity + traction)
  └── TIER 7.3: Prompts por contexto

SPRINT 6 (contenido):
  ├── TIER 7.1: Playbooks v1 (5 de Build)
  ├── TIER 7.2: Microcopy completo
  └── TIER 7.6-7.7: Ritual questions + Loop/Ritual coordination

SPRINT 7 (features avanzadas, post-MVP):
  ├── TIER 1.4-1.7: Engines avanzados
  ├── TIER 3.8-3.13: UX avanzada
  ├── TIER 5.4-5.12: Optimus avanzado
  ├── TIER 6.3-6.6: Notification layers 4-5
  └── TIER 9: Sistemas avanzados

SPRINT 8 (monetización):
  └── TIER 10: Completo
```

---

## Resumen ejecutivo — ¿Cuánto falta?

| Categoría | Items totales | En MVP v1 | Post-MVP |
|-----------|--------------|-----------|----------|
| Definiciones matemáticas | 8 | 6 | 2 |
| Backend / Engines | 12 | 5 | 7 |
| Onboarding / Primera experiencia | 10 | 7 | 3 |
| UX Core | 14 | 8 | 6 |
| Roles fix | 8 | 4 | 4 |
| Optimus / Psicología | 12 | 4 | 8 |
| Notificaciones | 6 | 2 | 4 |
| Contenido / Playbooks | 7 | 5 | 2 |
| Features por fase | 6 | 3 | 3 |
| Sistemas avanzados | 8 | 0 | 8 |
| Monetización | 5 | 0 | 5 |
| Edge cases | 10 | 5 | 5 |
| **TOTAL** | **106** | **49** | **57** |

---

## Lo que ChatGPT tenía y Claude añadió (delta)

Los ítems marcados como **[+Claude]** son adiciones al inventario de ChatGPT:

- **[+Claude]** Broken solo founder math → TIER 0.3
- **[+Claude]** Day 1 Probability demotivating → TIER 0.4
- **[+Claude]** OBV types audit → TIER 0.5
- **[+Claude]** CRM pipeline → Revenue Momentum gap → TIER 1.4
- **[+Claude]** Peer validation → Probability gap → TIER 1.5
- **[+Claude]** Role system bugs (InviteMemberWizard = fake) → TIER 4.1-4.4
- **[+Claude]** calculate_role_performance_score ignores role → TIER 4.3
- **[+Claude]** Two parallel role systems → TIER 4.2
- **[+Claude]** SWOT/Competitors → structural_block connection → TIER 5.5
- **[+Claude]** Analytics redundancy with engines → TIER 8.4
- **[+Claude]** Project graduation state → TIER 5.8
- **[+Claude]** Weekly Loop vs Ritual coordination → TIER 7.7
- **[+Claude]** Answer to ChatGPT's final unanswered question → TIER 5.12
- **[+Claude]** Revenue data trustworthiness problem → TIER 11.9
- **[+Claude]** Solo founder in Fase 4 math problem → TIER 11.6

---

*Generado: 2026-02-24*
*Fuentes: chattt.txt (documento fundacional ChatGPT) + chatttt2.txt (documento avanzado ChatGPT) + ENGINE_DESIGN.md (síntesis Claude) + auditoría de código Nova Hub*
*Autores: Claude Code (Anthropic) + ChatGPT (OpenAI) — revisión final: Zarko*

---

## Adiciones de chattt.txt — Resumen de lo incorporado

| Item | Sección | Estado antes |
|------|---------|-------------|
| Iteration Velocity — definición concreta | TIER 0.1 | "Pendiente de definir" → ✅ Definida |
| Risk Score formula (5 inputs, 4 niveles) | TIER 0.6 (nuevo) | No existía |
| Phase 2 thresholds exactos (3 outcomes) | TIER 0.7 (nuevo) | Solo referencia genérica |
| Economic Profile UX (tarjeta post-onboarding) | TIER 1.8 | Incompleto |
| Detección de incoherencia del modelo (4 casos) | TIER 1.9 (nuevo) | No existía |
| Historial de versiones del Economic Profile | TIER 1.10 (nuevo) | No existía |
| Idea generation con viabilidad desde min 1 | TIER 2.3b (nuevo) | Solo mencionado |
| 1 sistema con múltiples puntos de entrada (no 3 onboardings) | TIER 2.1, 2.3 | Reforzado |
