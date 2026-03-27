# Criterio de decisión: QuickActionModal (B1)

> No implementar QuickActionModal hasta que este criterio se evalúe con datos reales de PostHog.
> Mínimo 50 usuarios en paso 1, mínimo 2 semanas de datos.

---

## Funnel

```
1. focus_block_impression         → ¿cuántos ven NextAction?
2. focus_block_cta_clicked        → ¿cuántos hacen click?
3. action_completed_post_cta      → ¿cuántos completan la acción?
   (filtro: originated_from = next_action)
```

Conversion window: 30 minutos.
Breakdown: action_type.

---

## Métricas

| Métrica | Cálculo | Propiedad |
|---|---|---|
| CTR | paso 2 / paso 1 | — |
| Completion rate | paso 3 / paso 2 | — |
| Time to complete | mediana de time_to_complete_ms (paso 3) | — |
| Return D2 | session_return o segundo focus_block_impression en otra sesión | — |

---

## Criterio de decisión combinado

| CTR | Completion | Tiempo (mediana) | Diagnóstico | Acción |
|---|---|---|---|---|
| < 15% | cualquiera | cualquiera | NextAction no genera interés | Mejorar copy/CTA del bloque, no tocar wizard |
| > 30% | > 70% | < 3 min | Loop funciona | No tocar nada |
| > 30% | > 70% | 3-7 min | Loop funciona pero hay fricción | Optimizar defaults del wizard, reducir campos opcionales |
| > 30% | 40-70% | < 5 min | Wizard pierde usuarios pero los que completan son rápidos | Optimizar wizard (menos pasos, mejores defaults) |
| > 30% | 40-70% | > 5 min | Wizard pierde usuarios Y es lento | Candidato a QuickActionModal |
| > 30% | < 40% | > 5 min | **Wizard mata el momentum** | **QuickActionModal justificado** |
| > 30% | < 40% | < 3 min | Wizard es rápido pero se abandona | Problema de UX del form, no de velocidad — investigar |
| 15-30% | < 40% | cualquiera | Ni el bloque ni el wizard funcionan | Revisar producto completo, no solo QAM |

### Regla final

**QuickActionModal solo se justifica cuando:**
- CTR > 30% (NextAction genera interés real)
- AND completion < 40% (el wizard destruye ese interés)
- AND tiempo mediana > 5 min (hay fricción real, no solo abandono)

Si cualquiera de las 3 condiciones no se cumple, la solución es otra:
- CTR bajo → mejorar NextAction
- Completion bajo + tiempo bajo → investigar UX del form
- Completion alto → no hace falta QuickActionModal

---

## Cómo no autoengañarnos

- Mínimo 50 usuarios en paso 1 antes de decidir (con menos, ±15% de margen)
- Mínimo 2 semanas (ideal 4) para cubrir variación temporal
- Usar mediana de time_to_complete (no media — outliers la distorsionan)
- Filtrar por data_completeness > 50% para separar "datos insuficientes" de "wizard malo"
- Los early adopters son más tolerantes — esperar usuarios orgánicos antes de decidir
- No confundir abandono del wizard con "usuario cerró la tab" (filtrar time > 30 min)

---

## Prerequisitos

- [ ] Deploy a producción (Vercel) con VITE_POSTHOG_KEY configurado
- [ ] Verificar que los 3 eventos del funnel se disparan en producción
- [ ] Esperar 2-4 semanas de datos
- [ ] Evaluar con esta tabla antes de construir QuickActionModal
