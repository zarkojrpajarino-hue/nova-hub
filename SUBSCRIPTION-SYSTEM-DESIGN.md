# 🔐 NOVA HUB - SISTEMA DE SUBSCRIPCIONES POR PROYECTO

## 📋 RESUMEN EJECUTIVO

**Modelo de Negocio:** Plan-per-project (cada proyecto tiene su propia subscripción)

**Problema a Resolver:** Prevenir abuso de free trial mientras permitimos flexibilidad

**Solución:** Sistema híbrido de límites a nivel de usuario + plan por proyecto

---

## 🎯 ARQUITECTURA DE LÍMITES

### 1. LÍMITES A NIVEL DE USUARIO (Anti-Abuso)

Para prevenir que un usuario cree infinitos proyectos en trial con diferentes emails:

```
┌─────────────────────────────────────────────┐
│  LÍMITES GLOBALES POR CUENTA DE USUARIO    │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ Cuenta Verificada (email + método pago)│
│     → Máx 10 proyectos activos totales     │
│     → Máx 3 proyectos en free trial        │
│     → Resto requieren plan de pago         │
│                                             │
│  ⚠️  Cuenta No Verificada (solo email)     │
│     → Máx 2 proyectos activos totales      │
│     → Máx 1 proyecto en free trial         │
│                                             │
│  🔴 Free Trial Expirado sin pago           │
│     → No puede crear más proyectos trial   │
│     → Debe pagar o eliminar proyectos      │
│                                             │
└─────────────────────────────────────────────┘
```

**Ventajas de este enfoque:**
- ✅ Previene abuso masivo (crear 100 emails con proyectos trial)
- ✅ Permite uso legítimo (1 usuario puede tener múltiples proyectos pagos)
- ✅ Incentiva verificación de método de pago
- ✅ Convierte trials en ventas (límite de 3 trials max)

### 2. PLANES POR PROYECTO (Monetización)

Cada proyecto tiene su propio plan individual:

| Plan | Precio | Trial | Límites por Proyecto |
|------|--------|-------|----------------------|
| **Free Trial** | €0 | 14 días | 3 miembros, 50 tasks, features básicas |
| **Starter** | €9/mes | ❌ | 10 miembros, 200 tasks, AI roles |
| **Pro** | €29/mes | ❌ | 50 miembros, 1000 tasks, AI tasks, analytics |
| **Enterprise** | €99/mes | ❌ | ∞ miembros, ∞ tasks, todo incluido |

---

## 🗄️ SCHEMA DE BASE DE DATOS

### Nueva Tabla: `user_account_limits`

Controla límites globales por cuenta de usuario (anti-abuso):

```sql
CREATE TABLE user_account_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Verificación
  email_verified BOOLEAN DEFAULT FALSE,
  payment_method_verified BOOLEAN DEFAULT FALSE, -- Ha agregado tarjeta

  -- Límites actuales
  total_projects_created INTEGER DEFAULT 0, -- Histórico total
  active_projects_count INTEGER DEFAULT 0, -- Proyectos activos ahora
  trial_projects_count INTEGER DEFAULT 0, -- Proyectos en trial actualmente

  -- Control de abuso
  trial_projects_used_total INTEGER DEFAULT 0, -- Histórico de trials usados
  first_trial_started_at TIMESTAMPTZ, -- Primera vez que usó trial
  last_trial_started_at TIMESTAMPTZ, -- Última vez que usó trial

  -- Bloqueos
  blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_limits_verified ON user_account_limits(payment_method_verified);
CREATE INDEX idx_user_limits_blocked ON user_account_limits(blocked);

-- Trigger para crear límites al crear usuario
CREATE OR REPLACE FUNCTION create_user_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_account_limits (user_id, email_verified)
  VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_limits();
```

### Nueva Tabla: `subscription_plans`

Define los planes disponibles (catálogo):

```sql
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY, -- 'free_trial', 'starter', 'pro', 'enterprise'
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly_eur DECIMAL(10,2) NOT NULL,
  price_yearly_eur DECIMAL(10,2), -- Con descuento del 20%
  trial_days INTEGER DEFAULT 0,

  -- Feature limits per project
  max_members INTEGER, -- NULL = unlimited
  max_tasks INTEGER, -- NULL = unlimited
  max_leads INTEGER, -- NULL = unlimited
  max_obvs INTEGER, -- NULL = unlimited
  max_storage_mb INTEGER, -- NULL = unlimited

  -- Feature flags
  ai_role_generation BOOLEAN DEFAULT FALSE,
  ai_task_generation BOOLEAN DEFAULT FALSE,
  ai_logo_generation BOOLEAN DEFAULT FALSE,
  advanced_analytics BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  white_label BOOLEAN DEFAULT FALSE,

  -- Metadata
  recommended BOOLEAN DEFAULT FALSE, -- Badge "Recomendado"
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO subscription_plans (
  id, name, display_name, description,
  price_monthly_eur, price_yearly_eur, trial_days,
  max_members, max_tasks, max_leads, max_obvs, max_storage_mb,
  ai_role_generation, ai_task_generation, ai_logo_generation,
  advanced_analytics, custom_branding, api_access, priority_support, white_label,
  recommended, display_order
) VALUES
(
  'free_trial',
  'Free Trial',
  'Prueba Gratis',
  'Prueba completa por 14 días sin compromiso',
  0.00,
  0.00,
  14, -- 14 días de trial
  3, 50, 50, 50, 100, -- Límites básicos
  TRUE, FALSE, FALSE, -- AI roles pero no tasks/logo
  FALSE, FALSE, FALSE, FALSE, FALSE, -- Features avanzadas desactivadas
  FALSE, 1
),
(
  'starter',
  'Starter',
  'Starter',
  'Perfecto para proyectos pequeños y equipos emergentes',
  9.00,
  86.40, -- 9*12 - 20% = 86.40
  0,
  10, 200, 200, 200, 500,
  TRUE, TRUE, TRUE, -- AI completo
  FALSE, FALSE, FALSE, FALSE, FALSE,
  FALSE, 2
),
(
  'pro',
  'Pro',
  'Pro',
  'Para equipos establecidos que necesitan analíticas y más capacidad',
  29.00,
  278.40, -- 29*12 - 20% = 278.40
  0,
  50, 1000, 1000, 1000, 5000,
  TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE, FALSE, -- Analytics + API + support
  TRUE, 3 -- RECOMENDADO
),
(
  'enterprise',
  'Enterprise',
  'Enterprise',
  'Sin límites, personalización completa y soporte prioritario',
  99.00,
  950.40, -- 99*12 - 20% = 950.40
  0,
  NULL, NULL, NULL, NULL, NULL, -- UNLIMITED
  TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE, TRUE, -- TODO incluido
  FALSE, 4
);
```

### Nueva Tabla: `project_subscriptions`

Subscripción activa de cada proyecto:

```sql
CREATE TABLE project_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),

  -- Owner (quien paga)
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN (
    'trial',        -- En período de prueba
    'active',       -- Subscripción activa y pagada
    'past_due',     -- Pago fallido, grace period
    'cancelled',    -- Cancelada, expira al final del período
    'expired'       -- Expirada, sin acceso
  )),

  -- Billing cycle
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- Dates
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,

  -- Limits tracking (cache for performance)
  current_members_count INTEGER DEFAULT 0,
  current_tasks_count INTEGER DEFAULT 0,
  current_leads_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un proyecto solo puede tener una subscripción activa
  UNIQUE(project_id)
);

-- Índices
CREATE INDEX idx_project_subs_project ON project_subscriptions(project_id);
CREATE INDEX idx_project_subs_owner ON project_subscriptions(owner_id);
CREATE INDEX idx_project_subs_status ON project_subscriptions(status);
CREATE INDEX idx_project_subs_trial_ends ON project_subscriptions(trial_ends_at)
  WHERE status = 'trial';
CREATE INDEX idx_project_subs_stripe_sub ON project_subscriptions(stripe_subscription_id);

-- RLS Policies
ALTER TABLE project_subscriptions ENABLE ROW LEVEL SECURITY;

-- Solo el owner puede ver/editar la subscripción
CREATE POLICY "Owners can manage project subscription"
  ON project_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id);

-- Miembros pueden ver el plan (para mostrar límites)
CREATE POLICY "Project members can view subscription"
  ON project_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_subscriptions.project_id
      AND pm.member_id = auth.uid()
    )
  );
```

### Actualización: Tabla `projects`

Agregar campos para tracking y owner:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_mode TEXT DEFAULT 'team_small' CHECK (
  work_mode IN ('individual', 'team_small', 'team_established', 'no_roles')
);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS business_idea TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; -- Soft delete

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_active ON projects(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para incrementar contadores al crear proyecto
CREATE OR REPLACE FUNCTION increment_user_project_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_account_limits
  SET
    total_projects_created = total_projects_created + 1,
    active_projects_count = active_projects_count + 1,
    updated_at = NOW()
  WHERE user_id = NEW.owner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_project_count();

-- Trigger para decrementar al soft-delete
CREATE OR REPLACE FUNCTION decrement_user_project_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE user_account_limits
    SET
      active_projects_count = active_projects_count - 1,
      updated_at = NOW()
    WHERE user_id = NEW.owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_deleted
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION decrement_user_project_count();
```

---

## 📐 LÓGICA DE LÍMITES

### Validación al Crear Proyecto

```typescript
/**
 * Valida si un usuario puede crear un nuevo proyecto
 */
async function validateCanCreateProject(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  upgradeNeeded?: boolean;
}> {
  // 1. Obtener límites del usuario
  const { data: limits } = await supabase
    .from('user_account_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 2. Usuario bloqueado
  if (limits.blocked) {
    return {
      canCreate: false,
      reason: limits.blocked_reason || 'Cuenta bloqueada',
      upgradeNeeded: false
    };
  }

  // 3. Determinar límites máximos según verificación
  const maxActiveProjects = limits.payment_method_verified ? 10 : 2;
  const maxTrialProjects = limits.payment_method_verified ? 3 : 1;

  // 4. Validar límite de proyectos activos
  if (limits.active_projects_count >= maxActiveProjects) {
    return {
      canCreate: false,
      reason: limits.payment_method_verified
        ? 'Has alcanzado el límite de 10 proyectos activos. Elimina proyectos o contáctanos para aumentar tu límite.'
        : 'Has alcanzado el límite de 2 proyectos. Agrega un método de pago para crear hasta 10 proyectos.',
      upgradeNeeded: !limits.payment_method_verified
    };
  }

  // 5. Validar límite de proyectos en trial
  if (limits.trial_projects_count >= maxTrialProjects) {
    return {
      canCreate: false,
      reason: limits.payment_method_verified
        ? 'Tienes 3 proyectos en período de prueba. Actualiza al menos uno a un plan de pago para crear más.'
        : 'Ya tienes 1 proyecto en prueba. Agrega un método de pago para crear hasta 3 proyectos en prueba.',
      upgradeNeeded: true
    };
  }

  // 6. Todo OK
  return { canCreate: true };
}
```

### Creación de Proyecto con Trial Automático

```typescript
/**
 * Crea un proyecto con free trial automático
 */
async function createProjectWithTrial(
  userId: string,
  projectData: {
    nombre: string;
    descripcion?: string;
    work_mode: string;
    business_idea?: string;
    industry?: string;
  }
) {
  // 1. Validar límites
  const validation = await validateCanCreateProject(userId);
  if (!validation.canCreate) {
    throw new Error(validation.reason);
  }

  // 2. Crear proyecto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      owner_id: userId,
    })
    .select()
    .single();

  if (projectError) throw projectError;

  // 3. Crear subscripción en trial
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 días

  const { error: subError } = await supabase
    .from('project_subscriptions')
    .insert({
      project_id: project.id,
      plan_id: 'free_trial',
      owner_id: userId,
      status: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
    });

  if (subError) throw subError;

  // 4. Incrementar contador de trials
  await supabase
    .from('user_account_limits')
    .update({
      trial_projects_count: sql`trial_projects_count + 1`,
      trial_projects_used_total: sql`trial_projects_used_total + 1`,
      last_trial_started_at: new Date().toISOString(),
      first_trial_started_at: sql`COALESCE(first_trial_started_at, NOW())`,
    })
    .eq('user_id', userId);

  // 5. Agregar owner como admin del proyecto
  await supabase.from('project_members').insert({
    project_id: project.id,
    member_id: userId,
    role: 'admin',
  });

  return project;
}
```

### Upgrade de Trial a Plan de Pago

```typescript
/**
 * Actualiza un proyecto de trial a plan de pago
 */
async function upgradeProjectPlan(
  projectId: string,
  userId: string,
  planId: 'starter' | 'pro' | 'enterprise',
  billingCycle: 'monthly' | 'yearly',
  stripeSubscriptionId: string
) {
  // 1. Obtener subscripción actual
  const { data: currentSub } = await supabase
    .from('project_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('project_id', projectId)
    .eq('owner_id', userId)
    .single();

  if (!currentSub) {
    throw new Error('Subscripción no encontrada');
  }

  const wasTrial = currentSub.status === 'trial';

  // 2. Actualizar a plan de pago
  const periodStart = new Date();
  const periodEnd = new Date();

  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  await supabase
    .from('project_subscriptions')
    .update({
      plan_id: planId,
      status: 'active',
      billing_cycle: billingCycle,
      stripe_subscription_id: stripeSubscriptionId,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('id', currentSub.id);

  // 3. Si era trial, decrementar contador
  if (wasTrial) {
    await supabase
      .from('user_account_limits')
      .update({
        trial_projects_count: sql`GREATEST(trial_projects_count - 1, 0)`,
      })
      .eq('user_id', userId);
  }

  return { success: true };
}
```

---

## 🎨 UX DEL SISTEMA

### 1. Flujo de Onboarding Mejorado

```
Usuario crea cuenta
       ↓
Email de verificación enviado
       ↓
[MODAL] "Crear tu primer proyecto"
       ↓
Formulario básico (nombre, industria, work_mode)
       ↓
Proyecto creado automáticamente en FREE TRIAL (14 días)
       ↓
[BANNER] "🎉 Tu proyecto está en período de prueba por 14 días"
       ↓
Dashboard del proyecto
```

### 2. Banner de Trial con Countdown

```typescript
/**
 * Banner superior que se muestra en proyectos en trial
 */
function TrialCountdownBanner({ subscription }) {
  const daysLeft = differenceInDays(
    new Date(subscription.trial_ends_at),
    new Date()
  );

  const urgency = daysLeft <= 3 ? 'error' : daysLeft <= 7 ? 'warning' : 'info';

  return (
    <Banner variant={urgency}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5" />
          <div>
            <p className="font-semibold">
              {daysLeft > 0
                ? `Te quedan ${daysLeft} días de prueba gratis`
                : 'Tu período de prueba ha terminado'
              }
            </p>
            <p className="text-sm opacity-90">
              {daysLeft > 0
                ? 'Actualiza ahora para no perder acceso a tu proyecto'
                : 'Actualiza para recuperar acceso completo'
              }
            </p>
          </div>
        </div>
        <Button onClick={() => openPlanSelectionModal()}>
          Ver Planes
        </Button>
      </div>
    </Banner>
  );
}
```

### 3. Modal de Límite Alcanzado

```typescript
/**
 * Modal que se muestra cuando usuario intenta crear proyecto pero alcanzó límite
 */
function ProjectLimitReachedModal({ limits, onClose }) {
  const hasPaymentMethod = limits.payment_method_verified;

  return (
    <Modal>
      <ModalHeader>
        <Lock className="h-6 w-6" />
        <h3>Límite de proyectos alcanzado</h3>
      </ModalHeader>

      <ModalContent>
        {!hasPaymentMethod ? (
          <div className="space-y-4">
            <p>
              Has alcanzado el límite de <strong>2 proyectos activos</strong>
              para cuentas sin método de pago verificado.
            </p>

            <Alert variant="info">
              <CreditCard className="h-4 w-4" />
              <div>
                <p className="font-semibold">Agrega un método de pago para desbloquear:</p>
                <ul className="list-disc list-inside text-sm mt-2">
                  <li>Hasta 10 proyectos activos</li>
                  <li>3 períodos de prueba simultáneos</li>
                  <li>Prioridad en soporte</li>
                </ul>
              </div>
            </Alert>

            <p className="text-sm text-muted-foreground">
              No se te cobrará hasta que actualices un proyecto a plan de pago
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p>
              Has alcanzado el límite de <strong>10 proyectos activos</strong>.
            </p>

            <p>Para crear más proyectos, puedes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Eliminar proyectos que ya no uses</li>
              <li>Archivar proyectos inactivos</li>
              <li>Contactar a ventas para un plan empresarial personalizado</li>
            </ul>
          </div>
        )}
      </ModalContent>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => !hasPaymentMethod ? openAddPaymentMethod() : contactSales()}>
          {!hasPaymentMethod ? 'Agregar Método de Pago' : 'Contactar Ventas'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

### 4. Indicador de Uso de Límites

```typescript
/**
 * Muestra uso actual vs límite del plan
 */
function PlanLimitsIndicator({ subscription, plan }) {
  const limits = [
    {
      label: 'Miembros',
      current: subscription.current_members_count,
      max: plan.max_members,
      icon: Users,
    },
    {
      label: 'Tareas',
      current: subscription.current_tasks_count,
      max: plan.max_tasks,
      icon: CheckSquare,
    },
    {
      label: 'Leads',
      current: subscription.current_leads_count,
      max: plan.max_leads,
      icon: UserPlus,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <h3>Uso del Plan {plan.display_name}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {limits.map((limit) => {
          const percentage = limit.max
            ? (limit.current / limit.max) * 100
            : 0;
          const isNearLimit = percentage >= 80;
          const isUnlimited = limit.max === null;

          return (
            <div key={limit.label}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <limit.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{limit.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {limit.current} / {isUnlimited ? '∞' : limit.max}
                </span>
              </div>

              {!isUnlimited && (
                <>
                  <Progress
                    value={percentage}
                    className={isNearLimit ? 'bg-orange-500' : ''}
                  />
                  {isNearLimit && (
                    <p className="text-xs text-orange-600 mt-1">
                      Cerca del límite. Considera actualizar tu plan.
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}

        <Button variant="outline" size="sm" className="w-full" onClick={openUpgradeModal}>
          <Zap className="h-4 w-4 mr-2" />
          Actualizar Plan
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🔄 EDGE FUNCTIONS NECESARIAS

### 1. Verificar Email y Crear Límites

```typescript
// supabase/functions/on-user-signup/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { record } = await req.json();
  const userId = record.id;

  // Crear límites para el usuario
  await supabase.from('user_account_limits').insert({
    user_id: userId,
    email_verified: record.email_confirmed_at !== null,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 2. Webhook de Stripe

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  );

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;

      await supabase
        .from('project_subscriptions')
        .update({
          status: subscription.status === 'active' ? 'active' : 'past_due',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      await supabase
        .from('project_subscriptions')
        .update({ status: 'expired' })
        .eq('stripe_subscription_id', subscription.id);

      break;
    }

    case 'payment_method.attached': {
      const paymentMethod = event.data.object;
      const customerId = paymentMethod.customer;

      // Marcar cuenta como verificada
      await supabase
        .from('user_account_limits')
        .update({ payment_method_verified: true })
        .eq('stripe_customer_id', customerId);

      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 3. Expirar Trials Automáticamente

```typescript
// supabase/functions/expire-trials/index.ts
// Ejecutar diariamente con Supabase Cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date().toISOString();

  // Encontrar trials expirados
  const { data: expiredTrials } = await supabase
    .from('project_subscriptions')
    .select('*')
    .eq('status', 'trial')
    .lt('trial_ends_at', now);

  if (!expiredTrials || expiredTrials.length === 0) {
    return new Response(JSON.stringify({ expired: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Marcar como expirados
  const ids = expiredTrials.map(s => s.id);
  await supabase
    .from('project_subscriptions')
    .update({ status: 'expired' })
    .in('id', ids);

  // Decrementar contadores de trial
  for (const trial of expiredTrials) {
    await supabase
      .from('user_account_limits')
      .update({
        trial_projects_count: supabase.sql`GREATEST(trial_projects_count - 1, 0)`,
      })
      .eq('user_id', trial.owner_id);
  }

  // Enviar emails de notificación
  for (const trial of expiredTrials) {
    // TODO: Integrar con servicio de email (Resend, SendGrid, etc.)
    console.log(`Trial expired for project ${trial.project_id}`);
  }

  return new Response(
    JSON.stringify({ expired: expiredTrials.length }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

---

## 📊 HOOKS DE REACT

### Hook: `useProjectPlan`

```typescript
/**
 * Hook para obtener plan y límites de un proyecto
 */
export function useProjectPlan(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-plan', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('project_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('project_id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}
```

### Hook: `useUserLimits`

```typescript
/**
 * Hook para obtener límites del usuario
 */
export function useUserLimits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-limits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_account_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
```

### Hook: `useCanCreateProject`

```typescript
/**
 * Hook para validar si el usuario puede crear un proyecto
 */
export function useCanCreateProject() {
  const { user } = useAuth();
  const { data: limits } = useUserLimits();

  return useMemo(() => {
    if (!limits) return { canCreate: false, loading: true };

    const maxActive = limits.payment_method_verified ? 10 : 2;
    const maxTrials = limits.payment_method_verified ? 3 : 1;

    if (limits.blocked) {
      return {
        canCreate: false,
        loading: false,
        reason: limits.blocked_reason,
      };
    }

    if (limits.active_projects_count >= maxActive) {
      return {
        canCreate: false,
        loading: false,
        reason: `Límite de ${maxActive} proyectos alcanzado`,
        requiresPaymentMethod: !limits.payment_method_verified,
      };
    }

    if (limits.trial_projects_count >= maxTrials) {
      return {
        canCreate: false,
        loading: false,
        reason: 'Demasiados proyectos en trial. Actualiza uno a plan de pago.',
        requiresUpgrade: true,
      };
    }

    return { canCreate: true, loading: false };
  }, [limits]);
}
```

### Hook: `useFeatureAccess`

```typescript
/**
 * Hook para validar acceso a features según plan
 */
export function useFeatureAccess(projectId: string | undefined) {
  const { data: subscription } = useProjectPlan(projectId);

  const canUseFeature = useCallback((feature: string) => {
    if (!subscription || subscription.status === 'expired') return false;

    const plan = subscription.plan;

    switch (feature) {
      case 'ai_roles':
        return plan.ai_role_generation;
      case 'ai_tasks':
        return plan.ai_task_generation;
      case 'ai_logo':
        return plan.ai_logo_generation;
      case 'analytics':
        return plan.advanced_analytics;
      case 'api':
        return plan.api_access;
      default:
        return true;
    }
  }, [subscription]);

  const isNearLimit = useCallback((resource: 'members' | 'tasks' | 'leads') => {
    if (!subscription) return false;

    const plan = subscription.plan;
    let current = 0;
    let max = null;

    switch (resource) {
      case 'members':
        current = subscription.current_members_count;
        max = plan.max_members;
        break;
      case 'tasks':
        current = subscription.current_tasks_count;
        max = plan.max_tasks;
        break;
      case 'leads':
        current = subscription.current_leads_count;
        max = plan.max_leads;
        break;
    }

    if (max === null) return false; // Unlimited

    return (current / max) >= 0.8; // 80% or more
  }, [subscription]);

  const hasReachedLimit = useCallback((resource: 'members' | 'tasks' | 'leads') => {
    if (!subscription) return true;

    const plan = subscription.plan;

    switch (resource) {
      case 'members':
        return plan.max_members !== null && subscription.current_members_count >= plan.max_members;
      case 'tasks':
        return plan.max_tasks !== null && subscription.current_tasks_count >= plan.max_tasks;
      case 'leads':
        return plan.max_leads !== null && subscription.current_leads_count >= plan.max_leads;
      default:
        return false;
    }
  }, [subscription]);

  return {
    subscription,
    plan: subscription?.plan,
    canUseFeature,
    isNearLimit,
    hasReachedLimit,
    isTrial: subscription?.status === 'trial',
    isExpired: subscription?.status === 'expired',
  };
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Semana 1-2: Schema y Backend

- [ ] Crear tabla `user_account_limits`
- [ ] Crear tabla `subscription_plans` con datos iniciales
- [ ] Crear tabla `project_subscriptions`
- [ ] Actualizar tabla `projects` con campos nuevos
- [ ] Crear triggers para contadores automáticos
- [ ] Crear Edge Function `on-user-signup`
- [ ] Crear Edge Function `stripe-webhook`
- [ ] Crear Edge Function `expire-trials` (cron diario)
- [ ] Configurar RLS policies
- [ ] Crear índices de performance

### Semana 3-4: Hooks y Lógica Frontend

- [ ] Hook `useProjectPlan(projectId)`
- [ ] Hook `useUserLimits()`
- [ ] Hook `useCanCreateProject()`
- [ ] Hook `useFeatureAccess(projectId)`
- [ ] Helper `validateCanCreateProject()`
- [ ] Helper `createProjectWithTrial()`
- [ ] Helper `upgradeProjectPlan()`

### Semana 5-6: Componentes UI

- [ ] `TrialCountdownBanner` - Banner superior en proyectos trial
- [ ] `ProjectLimitReachedModal` - Modal cuando alcanza límite
- [ ] `PlanLimitsIndicator` - Indicador de uso de plan
- [ ] `PlanSelectionModal` - Modal de selección de plan
- [ ] `UpgradePrompt` - CTA para upgrade desde diferentes vistas
- [ ] `FeatureLockedOverlay` - Overlay en features bloqueadas
- [ ] Actualizar `ProjectCreationFlow` con validaciones

### Semana 7-8: Integración Stripe

- [ ] Configurar Stripe account
- [ ] Crear productos en Stripe (Starter, Pro, Enterprise)
- [ ] Crear precios monthly/yearly
- [ ] Integrar Stripe Checkout
- [ ] Configurar Stripe Customer Portal
- [ ] Testing de webhooks
- [ ] Implementar flow de upgrade
- [ ] Implementar flow de downgrade
- [ ] Implementar flow de cancelación

### Semana 9: Testing y Refinamiento

- [ ] Testing E2E del flujo completo
- [ ] Testing de límites y validaciones
- [ ] Testing de expiración de trials
- [ ] Testing de webhooks de Stripe
- [ ] Verificar RLS policies
- [ ] Performance testing
- [ ] Error handling completo

---

## 🎯 MÉTRICAS DE ÉXITO

### Conversión
- **Target:** 25% de trials convierten a pago
- **Tracking:** `trial_projects_used_total` vs subscripciones activas

### Distribución de Planes
- **Target:** 70% Pro, 20% Starter, 10% Enterprise
- **Tracking:** `SELECT plan_id, COUNT(*) FROM project_subscriptions WHERE status = 'active' GROUP BY plan_id`

### Abuso Prevención
- **Target:** <5% de usuarios con múltiples cuentas detectadas
- **Tracking:** Analizar patrones de `user_account_limits`

### MRR (Monthly Recurring Revenue)
- **Target:** €10,000 MRR en 6 meses
- **Tracking:** Sumar subscripciones activas

---

## 📝 NOTAS FINALES

**Anti-Abuso Efectivo:**
- ✅ Límite de 1-3 trials por cuenta (según verificación)
- ✅ Límite de 2-10 proyectos totales
- ✅ Requiere método de pago para más capacidad
- ✅ Tracking histórico de trials usados

**Flexibilidad de Negocio:**
- ✅ Plan-per-project permite múltiples proyectos con diferentes planes
- ✅ Owner paga, members usan gratis
- ✅ Escalabilidad clara (Starter → Pro → Enterprise)

**UX sin Fricción:**
- ✅ Trial automático al crear proyecto (sin tarjeta)
- ✅ 14 días completos de acceso
- ✅ Indicadores claros de límites
- ✅ Upgrade simple en cualquier momento

**Monetización Inteligente:**
- ✅ Precio target €29/mes (Pro) - sweet spot
- ✅ 20% descuento anual incentiva compromiso
- ✅ Enterprise para casos corporativos
- ✅ Starter como opción de entrada

---

**Estado:** 📋 Diseño Completo - Listo para Implementación
**Siguiente Paso:** Crear schema SQL y comenzar implementación backend
