# CHECKLIST VALIDACION VISUAL — 4 Escenarios

> Para validar manualmente en la app. Abrir `/proyecto/:id/` y verificar cada punto.
> Debug mode: `localStorage.setItem('optimus_debug_engine', 'true')` muestra badges con priority/depth/reason.

---

## ESCENARIO A: Founder P1 Solo

**Condiciones:** Tu cuenta como lead, proyecto en fase 1, sin equipo, ~2 semanas, algunas OBVs y tareas, 0 leads, sin revenue.

### Arriba del cockpit
- [ ] NovaHeader visible con titulo "Dashboard"
- [ ] OnboardingProgressBanner: solo si < 7 dias y onboarding incompleto (si no, NO debe aparecer)
- [ ] EmptyStateDashboard: NO debe aparecer (tienes OBVs/tareas)
- [ ] RevenueBanner: NO debe aparecer (no eres existing biz o ya tienes OBVs venta)

### Cockpit del engine (DashboardAdapter)
- [ ] **NextAction visible** — bloque hero con accion concreta ("Crea OBV" o similar)
- [ ] **MomentBanner visible** — celebracion o momento si hay uno activo
- [ ] **CoreStats visible** — debe mostrar: total_obvs, kpi_count, tasks_weekly, days_active (segun datos)
- [ ] **PhaseEngine visible** — panel con score, senales duras, progreso de fase
- [ ] **Alerts visible** — TrialCountdownBanner (si trial activo) + AICallsNudge
- [ ] CRM summary: NO visible arriba (0 leads → deep)
- [ ] Financial summary: NO visible arriba (fase < 2 → teaser/deep)
- [ ] Team status: NO visible arriba (solo mode → deep)
- [ ] Budget check: maximo 6 bloques en la zona primary

### Quick Actions (debajo del cockpit)
- [ ] 3 botones visibles: "New Task", "New Sale", "AI Analysis"
- [ ] Los botones navegan a las rutas correctas

### Zona legacy (debajo)
- [ ] HowItWorks: colapsado por defecto (solo titulo visible, expandible)
- [ ] KPI Grid: 6 cards con totales de equipo (OBVs, LPs, BPs, CPs, facturacion, margen)
- [ ] WeeklyEvolutionChart: grafico de evolucion semanal
- [ ] SmartAlertsWidget: alertas inteligentes
- [ ] TopRankingsWidget: top performers
- [ ] PendingValidationsWidget: validaciones pendientes

### Sidebar
- [ ] Visible: dashboard, mi-espacio, proyectos, validaciones, obvs, startup-os, crm, kpis, settings, notificaciones
- [ ] Teaser (con lock): financiero, integrations
- [ ] Team items: teaser (con lock, "Invite team to unlock")
- [ ] Hidden (NO aparecen): mi-desarrollo, mi-modelo, meetings, analisis-ia, toolkit, analytics, team-performance
- [ ] path-to-master, masters, rotacion: hidden

### Senales de ruido / duplicacion
- [ ] CoreStats (engine) y KPI Grid (legacy) NO deben confundirse — core_stats muestra stats de fase, KPI Grid muestra totales de equipo
- [ ] Si ambos muestran "OBVs" con el mismo numero, hay confusion potencial → esto es esperado por ahora, se resolvera con separacion visual

---

## ESCENARIO B: Founder P2 Rich

**Condiciones:** Proyecto en fase 2, 60+ dias, 10+ OBVs, 15+ leads, revenue activo, integraciones conectadas.

### Cockpit del engine
- [ ] **NextAction visible** — accion de fase 2 (PMF)
- [ ] **MomentBanner visible**
- [ ] **CoreStats visible** — debe incluir: total_obvs, kpi_count, tasks_weekly, conversion_rate (leads_ganados/leads)
- [ ] **CRM Summary PRIMARY** — debe estar arriba, depth "full", mostrando LeadConversionInsights
- [ ] **PhaseEngine SECONDARY** — debajo del primary zone, no arriba
- [ ] **Financial Summary SECONDARY** — visible como summary (revenue pero < 90 dias)
- [ ] Alerts SECONDARY
- [ ] Team status: deep (si solo) o secondary (si equipo)
- [ ] OBVs y Tasks: pueden estar en deep (overflow) — esto es correcto, no un bug

### Sidebar
- [ ] financiero: VISIBLE (fase 2)
- [ ] meetings, analisis-ia, toolkit: TEASER (fase 2, disponibles en fase 3)
- [ ] integrations: VISIBLE
- [ ] mi-modelo: VISIBLE

### Senales de ruido
- [ ] CRM arriba + no hay CRM en legacy → OK, sin duplicacion
- [ ] Financial summary (engine) muestra "Facturacion: EUR X" + KPI Grid (legacy) muestra facturacion total → posible confusion. Esperado por ahora.

---

## ESCENARIO C: Growth P2

**Condiciones:** Miembro con role=sales (o marketing), NO lead, proyecto fase 2, equipo de 3, 8+ leads, revenue.
**Para simular:** Necesitas un segundo usuario invitado con specialization_role='sales' y is_lead=false.

### Cockpit del engine — DIFERENCIAS CLAVE vs Founder
- [ ] **CRM Summary PRIMARY + FULL** — Growth ve CRM como bloque principal
- [ ] **Financial Summary HIDDEN** — NO debe aparecer en absoluto (growth + phase < 3)
- [ ] PhaseEngine SECONDARY
- [ ] Team status: summary depth (equipo de 3)

### Sidebar — DIFERENCIAS CLAVE vs Founder
- [ ] **financiero: HIDDEN** — NO debe aparecer en el sidebar
- [ ] **mi-desarrollo: HIDDEN** — NO debe aparecer
- [ ] **mi-modelo: HIDDEN** — NO debe aparecer
- [ ] crm: VISIBLE (growth lo necesita)
- [ ] obvs: VISIBLE

### Coherencia dashboard + sidebar
- [ ] Si financial esta HIDDEN en el cockpit, tambien debe estar HIDDEN en el sidebar
- [ ] Si crm esta PRIMARY en el cockpit, debe estar VISIBLE en el sidebar

### Senales de ruido
- [ ] KPI Grid legacy muestra facturacion y margen → Growth NO deberia ver datos financieros. PERO legacy no tiene role filtering. Esto es ruido real. Prioridad futura: ocultar stats financieros del KPI Grid para Growth.

---

## ESCENARIO D: Ops P3

**Condiciones:** Miembro con role=operations (o finance), NO lead, proyecto fase 3, equipo de 4, revenue, integraciones.
**Para simular:** Necesitas un segundo usuario con specialization_role='operations' y is_lead=false.

### Cockpit del engine — DIFERENCIAS CLAVE
- [ ] **Tasks PRIMARY + FULL** — Ops ve tareas como bloque principal
- [ ] **Financial PRIMARY + FULL** — Ops ve financiero prominente (revenue + 120d + P3)
- [ ] **CRM Summary SUMMARY** — Ops ve CRM en version compacta, no full
- [ ] Team status: FULL (equipo 4, fase 3)
- [ ] PhaseEngine SECONDARY

### Sidebar — DIFERENCIAS CLAVE
- [ ] Todo visible en P3 (fase >= 3 desbloquea todo)
- [ ] Ops P3 NO tiene role overrides en sidebar (overrides solo aplican en phase < 3)
- [ ] path-to-master, masters, rotacion: HIDDEN (necesitan P4)

### Coherencia
- [ ] Financial prominente en cockpit + financiero visible en sidebar → coherente
- [ ] CRM compacto en cockpit + crm visible en sidebar → coherente (puede navegar para ver mas)

### Senales de ruido
- [ ] KPI Grid legacy muestra todos los datos → OK para Ops (necesitan vision completa)
- [ ] No hay duplicacion problematica en este escenario

---

## RECOMENDACION DE SEPARACION VISUAL

Para evitar confusion entre CoreStats (engine) y KPI Grid (legacy):

**Opcion recomendada:** Envolver la zona legacy (desde Quick Actions hacia abajo) en un separador visual:

```tsx
{/* Separador visual entre cockpit y legacy */}
<div className="border-t border-border pt-6 mt-2">
  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
    {t('dashboard.teamOverview')}
  </h3>
  {/* Quick Actions + HowItWorks + KPI Grid + Charts + Rankings + Validaciones */}
</div>
```

**Alternativa:** Usar `OsWindow title="Team Overview"` como wrapper del KPI Grid solamente.

**No hacer:** No mover KPI Grid al engine todavia — son datos diferentes (equipo vs fase).
**No hacer:** No ocultar KPI Grid — Ops y Founders necesitan la vision de equipo.

---

## RIESGOS CONOCIDOS

| Riesgo | Escenario | Severidad | Accion |
|---|---|---|---|
| Growth ve facturacion en KPI Grid legacy | Growth P2 | Media | Futuro: role filter en legacy |
| OBVs+Tasks overflow a deep en Founder P2 | Founder P2 Rich | Baja | Monitorear con PostHog |
| Quick Actions menos descubrible abajo | Todos | Baja | Evaluar FAB o header integration |
| CoreStats vs KPI Grid parecen duplicados | Todos | Media | Aplicar separacion visual |
