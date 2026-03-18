# ANALYTICS_AUDIT — V11.5
> Auditoría del módulo Analytics según plantilla V11.5.
> Fuente de evidencia: lectura directa de todos los componentes. Fecha: 2026-03-13.

---

## 1. Resumen ejecutivo

El módulo Analytics tiene **7 componentes** activos distribuidos en 4 tabs.
La mayoría son correctos: presentan, agregan y comparan datos sin redefinir estado.
Hay **2 findings críticos** y **1 bug silencioso** que requieren acción.

**Veredicto global:**
- 5 de 7 panels: `keep in analytics` — sin deuda
- 1 panel: `keep in analytics + fix` — bug silencioso (ActivityHeatmap)
- 1 panel: `remove / merge` — frontend logic leak severo (PredictionsWidget)

---

## 2. Tabla de panels

| # | Panel | Qué muestra | Fuente real | Source of truth | Riesgo | Veredicto |
|---|-------|-------------|-------------|-----------------|--------|-----------|
| 1 | AnalyticsFilters | Checkboxes de socios | props (MemberStats) | Analytics query | ok | keep in analytics |
| 2 | PartnerComparisonTable | OBVs/LPs/BPs/CPs/facturación/margen por socio | props (MemberStats) | Analytics query | ok | keep in analytics |
| 3 | PartnerRadarChart | Radar normalizado 0-100 por socio | props (MemberStats) | Analytics query | ok | keep in analytics |
| 4 | ProjectComparisonCharts | Facturación, OBVs, Leads por proyecto | props (ProjectStats) | Analytics query | ok | keep in analytics |
| 5 | TemporalEvolutionChart | OBVs + KPIs agrupados por período | derived query (obvs, kpis) | Analytics query | ok | keep in analytics |
| 6 | ActivityHeatmap | Mapa de actividad últimos 6 meses | mixed — activity_log (DISABLED) + obvs | Analytics query (partial) | stale proxy | keep in analytics + fix naming |
| 7 | PredictionsWidget | Proyección de objetivos semestrales | mixed — hardcoded + MemberStats + useObjectives | frontend heuristic | frontend logic leak + semantic drift | remove / merge |

---

## 3. Auditoría detallada por panel

---

### Panel 1 — AnalyticsFilters

| Campo | Valor |
|-------|-------|
| Componente | `src/components/analytics/AnalyticsFilters.tsx` |
| Qué muestra | Checkboxes para seleccionar socios activos |
| Fuente real | `props (MemberStats[])` |
| Source of truth | Analytics query (`useMemberStats`) |
| Dependencias | `MemberStats` de `useNovaData` |
| Transformación | none — gestión de estado de selección |
| Riesgo | ok |
| Veredicto | **keep in analytics** |
| Nota | Nada que hacer. |

---

### Panel 2 — PartnerComparisonTable

| Campo | Valor |
|-------|-------|
| Componente | `src/components/analytics/PartnerComparisonTable.tsx` |
| Qué muestra | Tabla ordenable con OBVs, LPs, BPs, CPs, facturación, margen + fila de media |
| Fuente real | `props (MemberStats[])` |
| Source of truth | Analytics query (`useMemberStats`) |
| Dependencias | `MemberStats` de `useNovaData` |
| Transformación | Sorting client-side + media por columna |
| Riesgo | ok |
| Veredicto | **keep in analytics** |
| Nota | El color verde/rojo usa threshold 1.2x/0.8x sobre la media. Es heurística presentacional pura — no define estado del proyecto. Aceptable en Analytics. |

---

### Panel 3 — PartnerRadarChart

| Campo | Valor |
|-------|-------|
| Componente | `src/components/analytics/PartnerRadarChart.tsx` |
| Qué muestra | Radar normalizado 0-100 por dimensión para socios seleccionados |
| Fuente real | `props (MemberStats[])` filtrados a selectedPartners |
| Source of truth | Analytics query |
| Dependencias | `MemberStats` de `useNovaData` |
| Transformación | Normalización min-max por dimensión (frontend) |
| Riesgo | ok |
| Veredicto | **keep in analytics** |
| Nota | La normalización es una transformación presentacional. No hay business logic. |

---

### Panel 4 — ProjectComparisonCharts (3 charts)

| Campo | Valor |
|-------|-------|
| Componente | `src/components/analytics/ProjectComparisonCharts.tsx` |
| Qué muestra | (a) Facturación y margen por proyecto, (b) OBVs por proyecto, (c) Leads convertidos vs total |
| Fuente real | `props (ProjectStat[])` de `useProjectStats` |
| Source of truth | Analytics query (`useProjectStats`) |
| Dependencias | `useNovaData.useProjectStats` |
| Transformación | label mapping + preparación de datos para Recharts |
| Riesgo | ok |
| Veredicto | **keep in analytics** |
| Nota | El chart de leads calcula `conversion %` en frontend (`ganados / total * 100`). Es un ratio de presentación, no una señal del engine. Correcto en Analytics. |

---

### Panel 5 — TemporalEvolutionChart

| Campo | Valor |
|-------|-------|
| Componente | `src/components/analytics/TemporalEvolutionChart.tsx` |
| Qué muestra | Evolución de OBVs, LPs, BPs, CPs agrupados por día/semana/mes |
| Fuente real | derived query — queries directas a `obvs(fecha, tipo)` y `kpis(created_at, type)` |
| Source of truth | Analytics query (propia) |
| Dependencias | Supabase: `obvs`, `kpis` |
| Transformación | Agrupación temporal por intervalo (eachDay/Week/Month) |
| Riesgo | ok |
| Veredicto | **keep in analytics** |
| Nota | Filtra `kpis.type IN ('LP', 'BP', 'CP')`. Verificar que este enum coincide con los valores reales de la tabla `kpis`. Si los valores son distintos, la evolución de LPs/BPs/CPs siempre mostraría 0. |

---

### Panel 6 — ActivityHeatmap

| Campo | Valor |
|-------|-------|
| Componente | `src/components/analytics/ActivityHeatmap.tsx` |
| Qué muestra | Calendario de "actividad" últimos 6 meses |
| Fuente real | mixed — `activity_log` (DISABLED, siempre retorna `[]`) + `obvs(created_at)` |
| Source of truth | Analytics query (parcial) |
| Dependencias | `activity_log` (no existe en DB), `obvs` |
| Transformación | Count por día + level 0-4 |
| Riesgo | **stale proxy** |
| Veredicto | **keep in analytics + fix** |
| Nota de acción | El queryFn de `activity_log` tiene el comentario `// DISABLED: tabla activity_log no existe` y retorna `[]`. El heatmap solo cuenta creaciones de OBVs, pero el label dice "actividades". Opciones: (a) renombrar el label a "OBVs por día" para ser honesto, o (b) agregar otras tablas como `tasks(completed_at)`. La opción (a) es trivial y elimina el bug. |

---

### Panel 7 — PredictionsWidget ⚠️ CRÍTICO

| Campo | Valor |
|-------|-------|
| Componente | `src/components/analytics/PredictionsWidget.tsx` |
| Qué muestra | Proyección de objetivos semestrales (OBVs, LPs, BPs, CPs, facturación, margen) |
| Fuente real | mixed — `MemberStats` props + `useObjectives` + constantes hardcoded |
| Source of truth | **frontend heuristic** |
| Dependencias | `useNovaData.useObjectives`, `MemberStats`, `differenceInDays` |
| Transformación | Proyección lineal sobre tiempo transcurrido del semestre |
| Riesgo | **frontend logic leak + semantic drift** |
| Veredicto | **remove / merge** |
| Nota de acción | Ver findings críticos §4. |

---

## 4. Findings críticos

### F1 — PredictionsWidget: objetivos hardcodeados

**Código:**
```typescript
const objectivesMap: Record<string, number> = {
  obvs: 150 * 9,   // ← hardcoded: 150 OBVs * 9 miembros
  lps: 18 * 9,
  bps: 66 * 9,
  cps: 40 * 9,
  facturacion: 15000 * 9,
  margen: 7500 * 9,
};
```

El magic number `9` (número de socios del equipo) está hardcodeado. Si el equipo cambia de tamaño, las proyecciones quedan incorrectas en silencio.

### F2 — PredictionsWidget: semantic drift con Engine

Los labels `'at_risk'` y `'behind'` se calculan con reglas propias en frontend:
```typescript
if (daysBelow <= 7) { status = 'at_risk'; }
else { status = 'behind'; }
```

El Engine tiene su propia señal de riesgo (`risk_level: 'low' | 'medium' | 'high' | 'critical'`) y viabilidad (`viability_status: 'healthy' | 'monitoring' | 'stagnation' | 'critical'`). PredictionsWidget define "at_risk" con una regla distinta, lo que crea una segunda definición de riesgo que no habla el mismo idioma que el Engine.

Viola directamente la **Rule 4**: *"Si un panel usa heurística frontend para una señal core, es bug o deuda."*

### F3 — ActivityHeatmap: tabla fantasma

`activity_log` está referenciada pero no existe en DB. El heatmap presenta solo OBVs como "actividades". Si en algún momento se añade `activity_log`, el comportamiento cambiará sin que nadie lo note. Si no se añade, el label es engañoso.

---

## 5. Decisiones

| # | Decisión |
|---|----------|
| D1 | PartnerComparisonTable, PartnerRadarChart, ProjectComparisonCharts, TemporalEvolutionChart, AnalyticsFilters → **no cambiar**. Cumplen el rol correcto de Analytics. |
| D2 | ActivityHeatmap → **renombrar label** de "actividades" a "OBVs por día" mientras `activity_log` no exista. Cambio de 1 línea, elimina bug silencioso. |
| D3 | PredictionsWidget → **eliminar status labels** `'at_risk'`/`'behind'` del código, o en su defecto desacoplarlos del vocabulario del Engine. Renombrar a términos neutrales como `'ahead'`/`'below_pace'`/`'off_pace'` que no colisionen con Engine. |
| D4 | PredictionsWidget → **externalizar objetivos hardcodeados** del frontend. En v2: leer de tabla configurable. En v1 inmediato: al menos derivar el `9` de `members.length` en lugar de constante literal. |
| D5 | TemporalEvolutionChart → **verificar enum de kpis.type**. Si los valores reales no son `'LP'`/`'BP'`/`'CP'`, el gráfico muestra 0 en silencio. |

---

## 6. Acciones pendientes

| Acción | Prioridad | Alcance |
|--------|-----------|---------|
| Renombrar "actividades" → "OBVs por día" en ActivityHeatmap | Alta (bug silencioso) | 1 línea |
| Reemplazar `status: 'at_risk'/'behind'` por términos no colisionantes en PredictionsWidget | Media | PredictionsWidget |
| Reemplazar `9` hardcodeado por `members.length` en PredictionsWidget | Media | PredictionsWidget |
| Verificar enum de `kpis.type` en TemporalEvolutionChart | Baja | 1 query check |
| Eliminar query a `activity_log` en ActivityHeatmap (o añadir la tabla) | Baja | ActivityHeatmap |

---

## 7. Reglas globales — estado de cumplimiento

| Regla | Estado |
|-------|--------|
| Rule 1: Analytics no define estado del proyecto | ✅ Cumplida — excepto PredictionsWidget (computa "at_risk" / "behind") |
| Rule 2: Analytics no recalcula señales del engine | ✅ Cumplida — excepto PredictionsWidget (status de riesgo propio) |
| Rule 3: Analytics puede agregar, resumir, comparar | ✅ Todos los panels restantes cumplen |
| Rule 4: heurística frontend para señal core = bug | ❌ PredictionsWidget viola esta regla |

---

## 8. Separación final

```
ENGINE (source of truth)
├── phase / phaseScore / phaseStatus
├── probability / risk
├── viability_status
├── coverage (demand/delivery/cash)
└── structural_gap / owner_status

ANALYTICS (presentation / aggregation)
├── OBVs/LPs/BPs/CPs por socio (comparativa) ✅
├── Facturación/Margen/Leads por proyecto ✅
├── Evolución temporal de OBVs y KPIs ✅
├── Heatmap de creación de OBVs (renombrar) ⚠️
└── Predicciones lineales de objetivos (depurar) ⚠️

DEUDA / ACCIÓN REQUERIDA
└── PredictionsWidget — status semántico a depurar, objetivos a externalizar
```
