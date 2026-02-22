# 🎯 PLAN MAESTRO DE IMPLEMENTACIÓN - NOVA HUB

## 📊 RESUMEN EJECUTIVO

**Objetivo:** Implementar sistema completo de roles adaptativos + subscripciones plan-per-project

**Duración Total:** 22 semanas (~5.5 meses)

**Fases:** 11 fases principales

---

## 🗓️ ROADMAP COMPLETO

### ✅ FASE 1: FUNDACIÓN (Semana 1-2)

**Backend:**
- [ ] Schema SQL corregido (sin límites de proyectos)
- [ ] Tabla `user_account_limits` (solo: has_used_free_trial)
- [ ] Tabla `subscription_plans` (Free Trial, Starter, Pro, Enterprise)
- [ ] Tabla `project_subscriptions` (1 por proyecto)
- [ ] Actualizar `projects` (owner_id, work_mode, business_idea, industry)
- [ ] Tabla `project_roles` (roles generados por IA)
- [ ] Triggers automáticos
- [ ] Funciones de validación
- [ ] RLS Policies

**Frontend:**
- [ ] Hook `useSubscription` (corregido)
- [ ] Hook `useProjectPlan`
- [ ] Hook `useUserLimits`
- [ ] Hook `useFeatureAccess`
- [ ] Hook `useAuth`
- [ ] Context `CurrentProjectContext` (básico)
- [ ] Context `AuthContext`

**Archivos:**
- `subscription-system-corrected.sql`
- `src/hooks/useSubscription.ts`
- `src/contexts/CurrentProjectContext.tsx`
- `src/contexts/AuthContext.tsx`

---

### ✅ FASE 2: FLUJO DE ENTRADA (Semana 3-4)

**Componentes:**
- [ ] `SelectProjectPage` (cuando usuario tiene proyectos)
- [ ] `CreateFirstProjectPage` (cuando usuario no tiene proyectos)
- [ ] `ProjectSelector` component (dropdown en navbar)
- [ ] `CurrentProjectContext` completo (con persistencia)
- [ ] `OnboardingWizard` diferenciado por work_mode
- [ ] Routing logic (redirect según estado)

**Lógica:**
- [ ] Detectar si es primer login
- [ ] Detectar si tiene proyectos
- [ ] Auto-select proyecto si solo tiene 1
- [ ] Persistir proyecto seleccionado en localStorage

**Archivos:**
- `src/pages/SelectProjectPage.tsx`
- `src/pages/CreateFirstProjectPage.tsx`
- `src/components/projects/ProjectSelector.tsx`
- `src/components/onboarding/OnboardingWizard.tsx`

---

### ✅ FASE 3: SISTEMA DE PLANES (Semana 5-6)

**Componentes:**
- [ ] `PlanSelectionModal` (con lógica de 1 free trial)
- [ ] `PlanCard` component
- [ ] `BillingCycleToggle` (monthly/yearly)
- [ ] `FeatureGate` component
- [ ] `LockedFeatureOverlay` component
- [ ] `TrialCountdownBanner` component

**Lógica:**
- [ ] Detectar si usuario ya usó free trial
- [ ] Mostrar/ocultar Free Trial según `has_used_free_trial`
- [ ] Crear proyecto en estado `pending_payment`
- [ ] Mostrar modal ANTES de generación IA
- [ ] Marcar `has_used_free_trial = true` al seleccionar trial

**Edge Functions:**
- [ ] `validate-plan-selection` (verificar free trial)

**Archivos:**
- `src/components/subscription/PlanSelectionModal.tsx`
- `src/components/subscription/PlanCard.tsx`
- `src/components/subscription/FeatureGate.tsx`
- `src/components/subscription/LockedFeatureOverlay.tsx`
- `src/components/subscription/TrialCountdownBanner.tsx`
- `supabase/functions/validate-plan-selection/index.ts`

---

### ✅ FASE 4: IA Y ROLES (Semana 7-8)

**Edge Functions:**
- [ ] `generate-project-roles` (OpenAI integration)
- [ ] Diferentes prompts por work_mode
- [ ] Guardar roles en `project_roles` table

**Componentes:**
- [ ] `RolesExplanationModal` (muestra roles generados)
- [ ] `RoleCard` component
- [ ] `InviteMemberWizard` (flexible: pre-assign o let choose)
- [ ] `RoleSelectionForInvitee` (cuando invitado elige)
- [ ] `SendInvitationButton`

**Lógica:**
- [ ] Admin puede pre-asignar rol O dejar que invitado elija
- [ ] Email de invitación con/sin rol pre-asignado
- [ ] Página de aceptación de invitación
- [ ] Validar límites de miembros según plan

**Archivos:**
- `supabase/functions/generate-project-roles/index.ts`
- `src/components/roles/RolesExplanationModal.tsx`
- `src/components/roles/RoleCard.tsx`
- `src/components/invitations/InviteMemberWizard.tsx`
- `src/components/invitations/RoleSelectionForInvitee.tsx`
- `src/pages/AcceptInvitationPage.tsx`

---

### ✅ FASE 5: LÍMITES Y GATES (Semana 9-10)

**Componentes:**
- [ ] `CreateTaskButton` con validación de límites
- [ ] `InviteButton` con validación de límites
- [ ] `AddLeadButton` con validación de límites
- [ ] `LimitReachedModal` (muestra upgrade)
- [ ] `PlanLimitsIndicator` (sidebar widget)
- [ ] `PricingPage` (página pública)
- [ ] `UpgradePrompt` (CTA contextual)

**Lógica:**
- [ ] Validar límites ANTES de crear recurso
- [ ] Mostrar modal si límite alcanzado
- [ ] Track usage en tiempo real
- [ ] Actualizar contadores en subscriptions

**Archivos:**
- `src/components/tasks/CreateTaskButton.tsx`
- `src/components/team/InviteButton.tsx`
- `src/components/crm/AddLeadButton.tsx`
- `src/components/subscription/LimitReachedModal.tsx`
- `src/components/subscription/PlanLimitsIndicator.tsx`
- `src/pages/PricingPage.tsx`

---

### ✅ FASE 6: LEARNING ROADMAP (Semana 11-12)

**Solo para work_mode = 'individual'**

**Edge Function:**
- [ ] `generate-learning-roadmap` (OpenAI)
- [ ] Genera secuencia de aprendizaje de roles
- [ ] Tabla `learning_roadmap_steps`

**Componentes:**
- [ ] `LearningRoadmapView` (página principal)
- [ ] `RoadmapStepCard` (cada paso)
- [ ] `RoadmapProgress` (barra de progreso)
- [ ] `CompleteStepButton` (marcar completado)
- [ ] `UnlockNextRoleModal` (cuando completa)

**Lógica:**
- [ ] Solo un rol activo a la vez
- [ ] Completar tasks del rol para desbloquear siguiente
- [ ] Progress tracking
- [ ] Celebración al completar rol

**Archivos:**
- `supabase/functions/generate-learning-roadmap/index.ts`
- `src/components/learning/LearningRoadmapView.tsx`
- `src/components/learning/RoadmapStepCard.tsx`
- `src/components/learning/RoadmapProgress.tsx`

---

### ✅ FASE 7: CHECKOUT Y BILLING (Semana 13-14)

**Stripe Integration:**
- [ ] Configurar Stripe account
- [ ] Crear productos y precios
- [ ] Configurar webhooks

**Edge Functions:**
- [ ] `create-checkout-session` (Stripe)
- [ ] `stripe-webhook` (handle events)
- [ ] `create-customer-portal-session`

**Componentes:**
- [ ] `CheckoutButton` component
- [ ] `BillingPage` (gestión de subscription)
- [ ] `UpdatePaymentMethodButton`
- [ ] `CancelSubscriptionButton`
- [ ] `UpgradePlanButton`
- [ ] `DowngradePlanButton`
- [ ] `InvoiceHistory` component

**Lógica:**
- [ ] Crear customer en Stripe
- [ ] Crear checkout session
- [ ] Redirect a Stripe
- [ ] Handle success/cancel
- [ ] Webhook actualiza subscription
- [ ] Customer portal para cambios

**Archivos:**
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/create-customer-portal/index.ts`
- `src/components/billing/BillingPage.tsx`
- `src/components/billing/CheckoutButton.tsx`
- `src/lib/stripe.ts`

---

### ✅ FASE 8: UX DE VALOR (Semana 15-16)

**Componentes:**
- [ ] `UpgradeModal` (contextual según feature)
- [ ] `PlanComparisonTable` (comparar planes)
- [ ] `ValuePropositionModal` (mostrar valor)
- [ ] `FeatureTour` (onboarding de features)
- [ ] `SuccessStoriesCarousel` (social proof)
- [ ] `UpgradePromptBanner` (sticky banner)

**Analytics:**
- [ ] Track eventos de upgrade
- [ ] A/B testing de precios
- [ ] Conversion funnel
- [ ] Feature usage analytics

**Archivos:**
- `src/components/marketing/UpgradeModal.tsx`
- `src/components/marketing/PlanComparisonTable.tsx`
- `src/components/marketing/ValuePropositionModal.tsx`
- `src/lib/analytics.ts`

---

### ✅ FASE 9: GESTIÓN POST-CREACIÓN (Semana 17-18)

**Gestión de Roles:**
- [ ] `RoleManagementPage` (CRUD de roles)
- [ ] `EditRoleModal` (editar rol generado por IA)
- [ ] `AddCustomRoleButton` (crear rol manual)
- [ ] `DeleteRoleConfirmation` (con validación)
- [ ] `ReassignMembersModal` (al eliminar rol)

**Gestión de Proyectos:**
- [ ] `ProjectSettingsPage`
- [ ] `DeleteProjectModal` (con confirmación)
- [ ] `ArchiveProjectButton` (soft delete)
- [ ] `TransferOwnershipModal`
- [ ] `ChangeWorkModeModal` (migrar entre modos)

**Lógica:**
- [ ] Validar que rol no tiene miembros antes de eliminar
- [ ] Cancelar subscription en Stripe al eliminar
- [ ] Soft delete con `deleted_at`
- [ ] Transfer ownership actualiza `owner_id`

**Archivos:**
- `src/pages/RoleManagementPage.tsx`
- `src/components/roles/EditRoleModal.tsx`
- `src/pages/ProjectSettingsPage.tsx`
- `src/components/projects/DeleteProjectModal.tsx`
- `src/components/projects/TransferOwnershipModal.tsx`

---

### ✅ FASE 10: NOTIFICACIONES (Semana 19-20)

**Email Templates:**
- [ ] Welcome email
- [ ] Trial expiring (7 días)
- [ ] Trial expiring (3 días)
- [ ] Trial expired
- [ ] Payment successful
- [ ] Payment failed
- [ ] Invitation email (con/sin rol)
- [ ] Upgrade confirmation

**Edge Functions:**
- [ ] `send-trial-reminder` (cron job)
- [ ] `send-expiration-warning` (cron job)
- [ ] `send-invitation-email`
- [ ] `send-payment-notification`

**Componentes:**
- [ ] `NotificationCenter` (dropdown en navbar)
- [ ] `NotificationItem` component
- [ ] `NotificationPreferences` (settings)

**Integración:**
- [ ] Resend/SendGrid setup
- [ ] Email templates en HTML
- [ ] Cron jobs en Supabase

**Archivos:**
- `supabase/functions/send-trial-reminder/index.ts`
- `supabase/functions/send-invitation-email/index.ts`
- `email-templates/welcome.html`
- `email-templates/trial-expiring.html`
- `src/components/notifications/NotificationCenter.tsx`

---

### ✅ FASE 11: TESTING Y MIGRACIÓN (Semana 21-22)

**Testing E2E:**
- [ ] Flujo completo: signup → onboarding → crear proyecto → seleccionar plan → trial
- [ ] Flujo: crear segundo proyecto → NO aparece trial → pagar
- [ ] Flujo: invitar miembro → aceptar → asignar rol
- [ ] Flujo: alcanzar límite → modal upgrade → pagar → límite aumentado
- [ ] Flujo: trial expira → proyecto bloqueado → upgrade
- [ ] Flujo: learning roadmap (individual)
- [ ] Flujo: cambiar work_mode
- [ ] Flujo: eliminar proyecto → cancelar subscription

**Testing Unitario:**
- [ ] Tests de hooks
- [ ] Tests de validaciones
- [ ] Tests de edge functions
- [ ] Tests de componentes críticos

**Migración:**
- [ ] Script de migración para usuarios existentes
- [ ] Asignar proyectos a owners
- [ ] Crear subscriptions para proyectos existentes
- [ ] ¿Dar trial gratis a usuarios antiguos? (decisión)
- [ ] Email a usuarios explicando cambios

**Security:**
- [ ] Audit de RLS policies
- [ ] Verificar que usuarios no pueden ver proyectos de otros
- [ ] Verificar que no pueden editar subscriptions de otros
- [ ] Rate limiting en edge functions
- [ ] Validación de inputs

**Performance:**
- [ ] Optimizar queries pesadas
- [ ] Caching de planes
- [ ] Lazy loading de componentes
- [ ] Bundle size optimization

**Documentation:**
- [ ] Documentación de usuario
- [ ] Guías por work_mode
- [ ] FAQ
- [ ] Video tutorials
- [ ] Developer docs

**Archivos:**
- `tests/e2e/complete-flow.spec.ts`
- `tests/unit/useSubscription.test.ts`
- `scripts/migrate-existing-users.sql`
- `docs/user-guide.md`
- `docs/developer-guide.md`

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs a Trackear:

**Conversión:**
- Tasa de conversión trial → paid
- Target: >25%

**Revenue:**
- MRR (Monthly Recurring Revenue)
- Target: €10,000 en 6 meses

**Engagement:**
- DAU (Daily Active Users)
- Projects created per user
- Feature adoption rate

**Retención:**
- Churn rate
- Target: <5% monthly

**Distribución de Planes:**
- Target: 70% Pro, 20% Starter, 10% Enterprise

---

## 🎯 HITOS IMPORTANTES

### Hito 1 (Semana 6): MVP Funcional
- ✅ Sistema de subscripciones funcionando
- ✅ 1 free trial por usuario
- ✅ Puede crear proyectos ilimitados
- ✅ Feature gates básicos

### Hito 2 (Semana 12): IA Completa
- ✅ Generación de roles por IA
- ✅ Invitaciones flexibles
- ✅ Learning roadmap para individuales

### Hito 3 (Semana 18): Sistema Completo
- ✅ Stripe integration completa
- ✅ Gestión post-creación
- ✅ Notificaciones

### Hito 4 (Semana 22): Production Ready
- ✅ Testing completo
- ✅ Migración ejecutada
- ✅ Documentación completa
- ✅ Listo para lanzamiento

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

Vamos a seguir este orden estricto:

1. **FASE 1** (Fundación) → Base de todo
2. **FASE 2** (Flujo entrada) → Navegación básica
3. **FASE 3** (Planes) → Monetización core
4. **FASE 7** (Checkout) → Pagos funcionando
5. **FASE 5** (Límites) → Validaciones
6. **FASE 4** (IA Roles) → Diferenciación
7. **FASE 6** (Learning) → Feature única
8. **FASE 9** (Gestión) → CRUD completo
9. **FASE 8** (UX Valor) → Optimización conversión
10. **FASE 10** (Notificaciones) → Engagement
11. **FASE 11** (Testing) → Quality assurance

---

## 📝 SIGUIENTE PASO

Comenzar con **FASE 1: FUNDACIÓN**

Archivos a crear:
1. `subscription-system-corrected.sql`
2. `src/hooks/useSubscription.ts` (corregido)
3. `src/contexts/CurrentProjectContext.tsx`
4. `src/contexts/AuthContext.tsx`

**¿Comenzamos?** 🚀
