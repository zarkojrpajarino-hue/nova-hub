# SUPER PLAN — Fases 29, 30, 31 Rediseñadas (v3 — con feedback usuario)

> **Principio central:** Todo funciona con datos internos de Optimus-K.
> Las integraciones enriquecen pero nunca son requisito.
>
> **Principio de honestidad:** Sin integraciones, los datos son declarados/inferidos.
> Eso es **heurística útil**, no verdad financiera. El sistema SIEMPRE muestra
> el nivel de confianza del dato. Nunca se oculta. Nunca se sobreprometee.
>
> **Riesgo #1:** Input quality. Si el founder no usa tareas/OBVs/métricas de forma
> consistente, todo se degrada. Hay que blindar esto ANTES de construir analytics.

---

## PREREQUISITO TRANSVERSAL — Unlock Progress (no "gate")

**REGLA CRÍTICA:** Nunca mostrar "datos insuficientes" como bloqueo.
Plantear SIEMPRE como **progreso hacia desbloqueo**. El founder debe sentir
que está avanzando, no que la herramienta no funciona.

### Diseño del unlock

En vez de:
> "No hay datos suficientes para analizar ejecución"

Mostrar:
> **"3 de 5 pasos para desbloquear Execution Trends"**
> ████████░░ 60%
> - ✅ 3 tareas completadas
> - ✅ 2 OBVs registradas
> - ⬜ Completa 2 tareas más → desbloqueas insights de ejecución
> - ⬜ Registra 1 venta → activa correlación con revenue
> - ⬜ Registra métricas de este mes → habilita forecast

Cada paso tiene un **CTA directo**: "Crear tarea", "Registrar OBV", "Añadir métricas".
Fricción → juego. El founder entiende QUÉ hacer y POR QUÉ.

### Umbrales de desbloqueo

| Feature | Qué necesita | Unlock message |
|---------|-------------|----------------|
| F29 Trends | ≥5 tareas + ≥3 OBVs (30d) | "2 tareas más y 1 OBV para ver tus tendencias" |
| F29 Pipeline | ≥5 OBVs con pipeline_status | "Registra 2 OBVs más para ver velocidad de pipeline" |
| F30 Forecast | ≥6 meses key_metrics | "4 meses más de métricas para activar forecast" |
| F30 Stress | ≥3 meses key_metrics + burn_rate | "Registra burn rate para activar stress test" |
| F31 Delta | ≥1 ciclo completado | "Completa tu primer ciclo para ver el delta" |
| F31 Patrones v1 | ≥1 ciclo | Insights simples ("en este ciclo subestimaste X") |
| F31 Patrones v2 | ≥2 ciclos | Comparación entre ciclos ("vs ciclo anterior") |
| F31 Patrones v3 | ≥3 ciclos | Patrones fuertes con confianza alta |

### Implementación

| ID | Tarea | Timebox |
|----|-------|---------|
| **GUARD.1** | RPC `compute_unlock_progress(project_id)` — retorna por feature: `{unlocked, progress_percent, steps: [{done, label, cta_action}]}` | 3h |
| **GUARD.2** | `UnlockProgress.tsx` — componente reutilizable: barra de progreso + checklist + CTAs. Tono positivo, nunca "bloqueado". | 3h |
| **GUARD.3** | Hook `useUnlockProgress(projectId)` | 1h |

---

## SISTEMA DE CONFIANZA (aplica a las 3 fases)

Todo insight generado incluye `confidence_level`:

| Nivel | Cuándo | UI |
|-------|--------|-----|
| **high** | Dato observado (integración real: Stripe, Holded, Asana) | Badge verde "Confirmado por [provider]" |
| **medium** | Dato declarado (OBV manual, key_metrics manual) | Badge amarillo "Basado en datos manuales" |
| **low** | Dato inferido/estimado (cálculo del motor sin input directo) | Badge naranja "Estimación del sistema" |
| **insufficient** | No hay suficientes datos | No se muestra el insight, solo el empty state |

**Regla de copy:** Nunca "estas tareas generaron €X". Siempre "cuando haces más tareas de demanda, tus ventas tienden a subir". **Dirección, no causalidad.**

---

## ORDEN DE EJECUCIÓN (corregido)

**1. F31 primero** — Es el más robusto. Usa solo datos internos (ciclos, weekly_reviews). No necesita volumen. El delta "prometí vs hice" funciona desde el primer ciclo. Valor inmediato.

**2. F29 light** — Sin obsesión por correlación exacta. Muestra tendencias ("semanas con más tareas de demanda → más OBVs de venta"), no causalidad. El founder lo usa como brújula, no como contabilidad.

**3. F30 último** — Solo cuando hay ≥6 meses de key_metrics. Un forecast con 3 datapoints es ruido con gráfico bonito. Mejor no mostrarlo que mostrarlo mal.

---

## FASE 31 — Ciclo Intelligence (PRIMERO)

> **Objetivo:** El founder ve la brecha entre lo que prometió y lo que hizo.
> Con ≥3 ciclos, el sistema detecta patrones de comportamiento.
>
> **Por qué primero:** 100% datos internos, no depende de volumen,
> valor inmediato desde el primer ciclo completado, muy diferencial.
>
> **Valor progresivo — no esperar perfección para dar valor:**
> - **v1 (1 ciclo):** Delta simple — "prometiste X, hiciste Y". Insights directos.
> - **v2 (2 ciclos):** Comparación — "vs ciclo anterior mejoraste en Z, empeoraste en W".
> - **v3 (3+ ciclos):** Patrones fuertes — "siempre subestimas cash" con confianza alta.
>
> **Prerequisito real:** ≥1 ciclo completado.

### Bloque A — Compromisos y delta

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **CI31.1** | Migración: `commitments_json JSONB` en `strategic_cycles` | 1.5h |
| **CI31.2** | UI compromisos en `ResetSurface` al iniciar ciclo — formulario 3-5 compromisos con categoría (revenue/ejecución/equipo/producto) y meta medible opcional | 3h |
| **CI31.3** | RPC `compute_cycle_delta(cycle_id)` — compara compromisos vs `weekly_reviews` + `key_metrics` + `tasks` + `obvs` del periodo. Output: por compromiso → `{commitment, actual, gap_percent, verdict}` | 5h |
| **CI31.4** | `CycleDeltaCard.tsx` — tabla visual con colores por veredicto (met/partial/missed). Score global. Badge de confianza. | 3h |

### Bloque B — Insights progresivos (valor desde ciclo 1)

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **CI31.5** | Migración: tabla `founder_patterns` | 1.5h |
| **CI31.6** | RPC `detect_founder_patterns(project_id)` — lógica progresiva: | 6h |

**v1 (1 ciclo):** Insights simples del ciclo actual:
- "Prometiste 5 compromisos, cumpliste 3" (delta directo)
- "Tu function_type más ignorado fue cash (0 tareas)"
- "Tu ejecución cayó en las últimas 3 semanas del ciclo"

**v2 (2 ciclos):** Comparación entre ciclos:
- "Vs ciclo anterior: mejoraste en ejecución (+15%), empeoraste en revenue (-8%)"
- "En ambos ciclos ignoraste tareas de cash — ¿patrón?"

**v3 (3+ ciclos):** Patrones con confianza creciente:
- "Optimism bias detectado: subestimas metas en promedio 35% (3 ciclos, confianza media)"
- "Execution decay: tu actividad cae 40% en semanas 7-12 (confianza media)"

Cada insight incluye: `{insight, evidence, confidence_level, recommendation, cycles_used}`.
Confidence sube con más ciclos: 1 ciclo = "observación", 2 = "señal temprana", 3+ = "patrón detectado".

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **CI31.7** | `FounderPatternsCard.tsx` — tono constructivo. Adapta copy según número de ciclos. Con recomendación concreta. | 3h |

### Bloque C — Integración con sistema

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **CI31.8** | Patrones en contexto Optimus (`get_optimus_context`) | 2h |
| **CI31.9** | Banner en `ResetSurface` al iniciar nuevo ciclo si hay patrones detectados | 1.5h |

**Total F31: 9 tareas, ~27h realistas** (no 17h como dije antes)

---

## FASE 29 — Execution-to-Revenue (LIGHT)

> **Objetivo:** El founder ve la dirección entre acciones y resultados.
> NO es causalidad. Es "cuando haces más X, Y tiende a subir".
>
> **Por qué light:** Sin volumen de datos, la correlación es anécdota.
> Mejor una brújula honesta que un dashboard que miente.
>
> **Prerequisito real:** ≥4 semanas de actividad con ≥10 tareas + ≥5 OBVs.

### Bloque A — Tendencias internas (CORE)

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **ER29.1** | RPC `compute_execution_trends(project_id, weeks)` — agrupa por semana: tareas completadas por `function_type`, OBVs por `tipo`, facturación declarada. Calcula tendencia (subiendo/estable/bajando) por métrica. NO calcula correlación causal. | 4h |
| **ER29.2** | Tabla `execution_trends` — cache de resultados semanales | 1.5h |
| **ER29.3** | `ExecutionTrendsCard.tsx` — gráfico de área apilada por semana. Líneas: tareas demand, OBVs venta, facturación. El founder ve visualmente si cuando sube una, sube la otra. Sin texto que diga "causó". | 4h |
| **ER29.4** | `useExecutionTrends` hook | 1.5h |

### Bloque B — Pipeline velocity interna

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **ER29.5** | RPC `compute_pipeline_velocity(project_id)` — tiempo promedio por transición en `obv_pipeline_history`. Detecta bottleneck. | 3h |
| **ER29.6** | `PipelineVelocityCard.tsx` — funnel con tiempos y bottleneck highlight | 3h |

### Bloque C — Enriquecimiento (OPCIONAL)

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **ER29.7** | Extender `compute_execution_trends` para leer `integration_entities` si existen — Asana (tareas externas), Stripe/Holded (pagos reales), HubSpot (deals). Flag `enriched_by`. | 3h |
| **ER29.8** | Badge de confianza en cards — "Basado en datos manuales" vs "Enriquecido con [providers]" | 1.5h |

### Bloque D — Contexto Optimus

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **ER29.9** | Tendencias en contexto Optimus — "Tus tareas de demanda llevan 3 semanas subiendo y las ventas también. Sigue." | 2h |
| **ER29.10** | Señal en Focus Block si hay tendencia clara (≥4 semanas consistente) | 1.5h |

**Total F29: 10 tareas, ~25h realistas** (no 18h)
**Copy rule:** "Cuando haces más X, Y tiende a subir" — NUNCA "X generó Y"

---

## FASE 30 — Financial Intelligence Predictiva (ÚLTIMO)

> **Objetivo:** El tab Financiero muestra hacia dónde vas, no solo dónde estás.
> Stress test, forecast MRR, alertas de riesgo.
>
> **Por qué último:** Un forecast con 3 meses de datos es ruido con gráfico.
> Necesita ≥6 meses de `key_metrics` para ser útil. Mejor no mostrarlo que mostrarlo mal.
>
> **Prerequisito real:** ≥6 entradas en `key_metrics` (antes decía 3 — era poco).
> Con integración financiera (Stripe/Holded): se reduce a ≥3 meses (datos observados).

### Bloque A — Forecast (CORE)

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **FI30.1** | RPC `compute_mrr_forecast(project_id, months_ahead)` — regresión lineal sobre `key_metrics.mrr`. Banda de confianza. Si <6 datos manuales (o <3 con integración), retorna `insufficient_data`. | 4h |
| **FI30.2** | `MRRForecastCard.tsx` — línea con banda sombreada. Badge: "Estimación con N meses de datos (confianza X)". Disclaimer: "Esta proyección asume que las condiciones actuales se mantienen." | 3h |

### Bloque B — Stress test

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **FI30.3** | RPC `run_cash_flow_stress_test(project_id)` — 3 escenarios con `key_metrics` + `financial_projections`. Calcula runway para cada uno. | 4h |
| **FI30.4** | `CashFlowStressCard.tsx` — 3 barras con semáforo. "En escenario crisis, tu runway baja de 8 a 3 meses." | 3h |

### Bloque C — Alertas de riesgo

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **FI30.5** | RPC `detect_financial_risks(project_id)` — MRR decreciente 2+ meses, burn>revenue 3+ meses, cobros atrasados >30d, concentración revenue. Cada riesgo con severidad + evidencia. | 4h |
| **FI30.6** | `FinancialRiskAlerts.tsx` — panel con severidad. Cada alerta: qué pasa, por qué importa, qué hacer. | 3h |

### Bloque D — Enriquecimiento

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **FI30.7** | Extender forecast/stress con datos Stripe/Holded si conectados. `source_confidence` sube de 0.7 a 1.0. | 3h |
| **FI30.8** | Churn signal cruzando reuniones + CRM (si hay integraciones) | 2h |

### Bloque E — Contexto Optimus

| ID | Tarea | Timebox real |
|----|-------|-------------|
| **FI30.9** | Insights financieros en Optimus | 2h |
| **FI30.10** | Alerta proactiva en MomentBanner si runway <4 meses | 1.5h |

**Total F30: 10 tareas, ~30h realistas** (no 20h)

---

## RESUMEN CONSOLIDADO (v2 honesto)

| Fase | Tareas | Horas reales | Orden | Prerequisito |
|------|--------|-------------|-------|-------------|
| **Guard** | 3 | ~5h | 0 (antes de todo) | — |
| **F31** | 9 | ~27h | 1 | ≥1 ciclo completado |
| **F29** | 10 | ~25h | 2 | ≥4 semanas actividad |
| **F30** | 10 | ~30h | 3 | ≥6 meses key_metrics |
| **Total** | **32** | **~87h** | | |

### Vs plan anterior

| Aspecto | Plan v1 | Plan v2 |
|---------|---------|---------|
| Horas | 55h (mentira) | 87h (realista) |
| Prerequisito F29 | Asana+HubSpot+Stripe | ≥4 semanas actividad |
| Prerequisito F30 | F29 + 8 sem Stripe | ≥6 meses key_metrics |
| Precisión sin integ. | "100%" (falso) | "Heurística útil" (verdad) |
| Orden | F29→F30→F31 | F31→F29→F30 |
| Copy | "X generó €Y" | "cuando más X, Y sube" |
| Confianza | Implícita | Explícita siempre |
| Input quality | Ignorado | Gate obligatorio |

### Enriquecimiento por proveedor (sin cambios)

| Proveedor | F29 | F30 | F31 |
|-----------|-----|-----|-----|
| Stripe | Pagos reales → confianza alta | MRR real → forecast fiable | — |
| Holded | Facturas reales → márgenes | Contabilidad → stress test | — |
| HubSpot | Deal transitions → pipeline | — | — |
| Asana | Tareas externas → ejecución | — | — |
| Google Cal | Reuniones → actividad ventas | Churn signal | — |
| **Sin nada** | **Tareas + OBVs (confianza media)** | **key_metrics manual (confianza media)** | **Ciclos + reviews (confianza alta)** |
