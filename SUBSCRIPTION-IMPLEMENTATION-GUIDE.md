# 📘 GUÍA DE IMPLEMENTACIÓN - SISTEMA DE SUBSCRIPCIONES

## 🎯 RESUMEN

Esta guía te llevará paso a paso por la implementación completa del sistema de subscripciones plan-per-project con límites anti-abuso.

**Tiempo estimado:** 6-8 semanas (40-50 horas)

**Prerequisitos:**
- Proyecto Nova Hub con Supabase configurado
- Cuenta de Stripe (para pagos)
- Conocimientos de React, TypeScript, Supabase

---

## 📋 FASE 1: BACKEND Y BASE DE DATOS (Semana 1-2)

### Paso 1.1: Ejecutar Migraciones SQL

```bash
# 1. Ir a Supabase Dashboard → SQL Editor
# 2. Crear nueva query
# 3. Copiar contenido de subscription-system-schema.sql
# 4. Ejecutar
```

**Verificación:**
```sql
-- Verificar que las tablas se crearon correctamente
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_account_limits',
  'subscription_plans',
  'project_subscriptions'
);

-- Verificar que los planes se insertaron
SELECT id, display_name, price_monthly_eur
FROM subscription_plans
ORDER BY display_order;

-- Deberías ver:
-- free_trial  | Prueba Gratis | 0.00
-- starter     | Starter       | 9.00
-- pro         | Pro           | 29.00
-- enterprise  | Enterprise    | 99.00
```

### Paso 1.2: Configurar Edge Functions

#### A. Function: on-user-signup

Crea límites automáticamente al registrar usuario.

```bash
# Crear carpeta
mkdir -p supabase/functions/on-user-signup

# Crear archivo
touch supabase/functions/on-user-signup/index.ts
```

Contenido de `index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { record } = await req.json();
    const userId = record.id;

    console.log('Creating limits for user:', userId);

    // Crear límites para el usuario
    const { error } = await supabase
      .from('user_account_limits')
      .insert({
        user_id: userId,
        email_verified: record.email_confirmed_at !== null,
      });

    if (error) {
      console.error('Error creating limits:', error);
      throw error;
    }

    console.log('Limits created successfully for:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

Deploy:

```bash
supabase functions deploy on-user-signup
```

Configurar webhook en Supabase Dashboard:
1. Authentication → Hooks → Enable "Send Email Confirmations"
2. Database → Webhooks → Create Webhook
   - Name: `on_user_signup`
   - Table: `auth.users`
   - Events: `INSERT`
   - Type: `HTTP Request`
   - URL: `https://<project-ref>.supabase.co/functions/v1/on-user-signup`
   - Secret: `<your-service-role-key>`

#### B. Function: expire-trials (Cron Job)

Expira trials automáticamente cada día.

```bash
mkdir -p supabase/functions/expire-trials
touch supabase/functions/expire-trials/index.ts
```

Contenido:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString();

    console.log('Running trial expiration check at:', now);

    // Encontrar trials expirados
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('project_subscriptions')
      .select('*')
      .eq('status', 'trial')
      .lt('trial_ends_at', now);

    if (fetchError) throw fetchError;

    if (!expiredTrials || expiredTrials.length === 0) {
      console.log('No expired trials found');
      return new Response(
        JSON.stringify({ expired: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredTrials.length} expired trials`);

    // Marcar como expirados
    const ids = expiredTrials.map(s => s.id);
    const { error: updateError } = await supabase
      .from('project_subscriptions')
      .update({ status: 'expired' })
      .in('id', ids);

    if (updateError) throw updateError;

    // Decrementar contadores de trial (handled by trigger)
    console.log(`Successfully expired ${expiredTrials.length} trials`);

    return new Response(
      JSON.stringify({ expired: expiredTrials.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

Deploy:

```bash
supabase functions deploy expire-trials
```

Configurar Cron (en Supabase Dashboard → Database → Cron Jobs):

```sql
-- Ejecutar diariamente a las 2 AM
SELECT cron.schedule(
  'expire-trials-daily',
  '0 2 * * *', -- 2 AM every day
  $$
  SELECT
    net.http_post(
      url:='https://<project-ref>.supabase.co/functions/v1/expire-trials',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <service-role-key>"}'::jsonb,
      body:='{}'::jsonb
    );
  $$
);
```

### Paso 1.3: Migrar Proyectos Existentes

Si ya tienes proyectos en la base de datos, necesitas crearles subscripciones:

```sql
-- Agregar owner_id a proyectos existentes (ajustar según tu lógica)
UPDATE projects
SET owner_id = (
  SELECT member_id
  FROM project_members
  WHERE project_id = projects.id
  AND role = 'admin'
  LIMIT 1
)
WHERE owner_id IS NULL;

-- Crear subscripciones trial para proyectos existentes
INSERT INTO project_subscriptions (
  project_id,
  plan_id,
  owner_id,
  status,
  trial_started_at,
  trial_ends_at,
  current_period_start,
  current_period_end
)
SELECT
  p.id,
  'free_trial',
  p.owner_id,
  'trial',
  NOW(),
  NOW() + INTERVAL '14 days',
  NOW(),
  NOW() + INTERVAL '14 days'
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_subscriptions ps
  WHERE ps.project_id = p.id
)
AND p.owner_id IS NOT NULL;
```

---

## 📋 FASE 2: HOOKS Y LÓGICA FRONTEND (Semana 3-4)

### Paso 2.1: Copiar Hooks

El archivo `src/hooks/useSubscription.ts` ya está creado con todos los hooks necesarios:

✅ `useSubscriptionPlans()` - Lista de planes
✅ `useProjectPlan(projectId)` - Plan de un proyecto
✅ `useUserLimits()` - Límites del usuario
✅ `useCanCreateProject()` - Validar creación de proyecto
✅ `useFeatureAccess(projectId)` - Acceso a features
✅ `useTrialStatus(projectId)` - Estado del trial
✅ `useCreateProjectWithTrial()` - Crear proyecto con trial
✅ `useUpgradeProjectPlan()` - Upgrade a plan de pago

### Paso 2.2: Crear Hook de Auth (si no existe)

Archivo: `src/hooks/useAuth.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  return {
    user: session?.user || null,
    isAuthenticated: !!session,
  };
}
```

### Paso 2.3: Testing de Hooks

Crear un componente de testing temporal:

```tsx
// src/components/debug/SubscriptionDebug.tsx
import { useUserLimits, useCanCreateProject } from '@/hooks/useSubscription';

export function SubscriptionDebug() {
  const { data: limits } = useUserLimits();
  const canCreate = useCanCreateProject();

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">Subscription Debug</h3>

      <div className="space-y-2">
        <p><strong>Active Projects:</strong> {limits?.active_projects_count} / {limits?.payment_method_verified ? 10 : 2}</p>
        <p><strong>Trial Projects:</strong> {limits?.trial_projects_count} / {limits?.payment_method_verified ? 3 : 1}</p>
        <p><strong>Can Create:</strong> {canCreate.canCreate ? '✅' : '❌'}</p>
        {!canCreate.canCreate && <p className="text-red-600">{canCreate.reason}</p>}
      </div>
    </div>
  );
}
```

Usarlo temporalmente en tu dashboard para verificar que funciona.

---

## 📋 FASE 3: COMPONENTES UI (Semana 5-6)

### Paso 3.1: Banner de Trial

Archivo: `src/components/subscription/TrialCountdownBanner.tsx`

```tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Zap } from 'lucide-react';
import { useTrialStatus } from '@/hooks/useSubscription';
import { differenceInDays } from 'date-fns';

interface TrialCountdownBannerProps {
  projectId: string;
  onUpgradeClick: () => void;
}

export function TrialCountdownBanner({ projectId, onUpgradeClick }: TrialCountdownBannerProps) {
  const { isTrial, daysLeft, isExpiringSoon, trialEndsAt } = useTrialStatus(projectId);

  if (!isTrial) return null;

  const variant = daysLeft <= 3 ? 'destructive' : daysLeft <= 7 ? 'warning' : 'default';

  return (
    <Alert variant={variant} className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5" />
          <AlertDescription>
            <p className="font-semibold">
              {daysLeft > 0
                ? `Te quedan ${daysLeft} días de prueba gratis`
                : 'Tu período de prueba ha terminado'
              }
            </p>
            <p className="text-sm opacity-90 mt-1">
              {daysLeft > 0
                ? 'Actualiza ahora para no perder acceso a tu proyecto'
                : 'Actualiza para recuperar acceso completo'
              }
            </p>
          </AlertDescription>
        </div>
        <Button onClick={onUpgradeClick} variant={daysLeft <= 3 ? 'default' : 'outline'}>
          <Zap className="h-4 w-4 mr-2" />
          Ver Planes
        </Button>
      </div>
    </Alert>
  );
}
```

### Paso 3.2: Modal de Selección de Plan

Archivo: `src/components/subscription/PlanSelectionModal.tsx`

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { useSubscriptionPlans } from '@/hooks/useSubscription';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  currentPlanId?: string;
}

export function PlanSelectionModal({
  isOpen,
  onClose,
  projectId,
  currentPlanId
}: PlanSelectionModalProps) {
  const { data: plans = [] } = useSubscriptionPlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (planId: string) => {
    // TODO: Integrar con Stripe Checkout
    console.log('Selected plan:', planId, 'Billing:', billingCycle);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Elige el plan perfecto para tu proyecto
          </DialogTitle>
        </DialogHeader>

        {/* Billing Toggle */}
        <div className="flex justify-center gap-2 my-6">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensual
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('yearly')}
          >
            Anual
            <Badge className="ml-2 bg-green-500">-20%</Badge>
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly'
              ? plan.price_monthly_eur
              : plan.price_yearly_eur / 12;

            const isCurrentPlan = plan.id === currentPlanId;
            const isTrial = plan.id === 'free_trial';

            return (
              <div
                key={plan.id}
                className={cn(
                  'border rounded-lg p-6 relative',
                  plan.recommended && 'border-primary border-2 shadow-lg',
                  isCurrentPlan && 'bg-muted'
                )}
              >
                {plan.recommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Recomendado
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <h3 className="font-bold text-xl mb-2">{plan.display_name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                  <div className="mb-2">
                    <span className="text-4xl font-bold">€{price.toFixed(0)}</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>

                  {isTrial && (
                    <p className="text-sm text-muted-foreground">
                      {plan.trial_days} días gratis
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.max_members === null ? 'Miembros ilimitados' : `Hasta ${plan.max_members} miembros`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.max_tasks === null ? 'Tareas ilimitadas' : `Hasta ${plan.max_tasks} tareas`}
                    </span>
                  </li>
                  {plan.ai_role_generation && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Generación IA de roles</span>
                    </li>
                  )}
                  {plan.ai_task_generation && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Generación IA de tareas</span>
                    </li>
                  )}
                  {plan.advanced_analytics && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Analíticas avanzadas</span>
                    </li>
                  )}
                  {plan.api_access && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">Acceso a API</span>
                    </li>
                  )}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.recommended ? 'default' : 'outline'}
                  disabled={isCurrentPlan}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isCurrentPlan ? 'Plan Actual' : isTrial ? 'Comenzar Trial' : 'Actualizar'}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Paso 3.3: Indicador de Límites

Archivo: `src/components/subscription/PlanLimitsIndicator.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Users, CheckSquare, UserPlus, Zap } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useSubscription';

interface PlanLimitsIndicatorProps {
  projectId: string;
  onUpgradeClick: () => void;
}

export function PlanLimitsIndicator({ projectId, onUpgradeClick }: PlanLimitsIndicatorProps) {
  const { plan, getLimitInfo } = useFeatureAccess(projectId);

  if (!plan) return null;

  const limits = [
    { type: 'members', label: 'Miembros', icon: Users },
    { type: 'tasks', label: 'Tareas', icon: CheckSquare },
    { type: 'leads', label: 'Leads', icon: UserPlus },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Uso del Plan {plan.display_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {limits.map(({ type, label, icon: Icon }) => {
          const info = getLimitInfo(type);
          const percentage = info.percentage;
          const isNearLimit = percentage >= 80;

          return (
            <div key={type}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {info.current} / {info.isUnlimited ? '∞' : info.max}
                </span>
              </div>

              {!info.isUnlimited && (
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

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={onUpgradeClick}
        >
          <Zap className="h-4 w-4 mr-2" />
          Actualizar Plan
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Paso 3.4: Feature Gate Component

Archivo: `src/components/subscription/FeatureGate.tsx`

```tsx
import { ReactNode } from 'react';
import { useFeatureAccess, SubscriptionPlan } from '@/hooks/useSubscription';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FeatureGateProps {
  projectId: string;
  feature: keyof SubscriptionPlan;
  children: ReactNode;
  fallback?: ReactNode;
  onUpgradeClick?: () => void;
}

export function FeatureGate({
  projectId,
  feature,
  children,
  fallback,
  onUpgradeClick
}: FeatureGateProps) {
  const { canUseFeature } = useFeatureAccess(projectId);

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Feature Bloqueada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Actualiza tu plan para desbloquear esta funcionalidad
            </p>
          </div>
          <Button onClick={onUpgradeClick}>
            Actualizar Plan
          </Button>
        </div>
      </div>
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
    </Card>
  );
}
```

---

## 📋 FASE 4: INTEGRACIÓN STRIPE (Semana 7-8)

### Paso 4.1: Configurar Cuenta de Stripe

1. Crear cuenta en https://stripe.com
2. Obtener API keys (Dashboard → Developers → API keys)
3. Crear productos y precios:

```bash
# Starter - Monthly
stripe prices create \
  --product "Starter Plan" \
  --unit-amount 900 \
  --currency eur \
  --recurring interval=month

# Starter - Yearly
stripe prices create \
  --product "Starter Plan" \
  --unit-amount 8640 \
  --currency eur \
  --recurring interval=year

# Repetir para Pro y Enterprise
```

4. Guardar los Price IDs generados

### Paso 4.2: Configurar Variables de Entorno

Archivo: `.env.local`

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
SUPABASE_STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Paso 4.3: Edge Function - Stripe Webhook

Archivo: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  console.log('Processing event:', event.type);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;

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
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from('project_subscriptions')
        .update({ status: 'expired' })
        .eq('stripe_subscription_id', subscription.id);

      break;
    }

    case 'payment_method.attached': {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      const customerId = paymentMethod.customer as string;

      await supabase
        .from('user_account_limits')
        .update({ payment_method_verified: true })
        .eq('stripe_customer_id', customerId);

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      await supabase
        .from('project_subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subscriptionId);

      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Deploy:

```bash
supabase functions deploy stripe-webhook
```

Configurar webhook en Stripe Dashboard:
1. Developers → Webhooks → Add endpoint
2. URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Events: Select all subscription and payment events
4. Copiar Signing Secret a `.env`

### Paso 4.4: Integrar Stripe Checkout

Archivo: `src/lib/stripe.ts`

```typescript
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export async function createCheckoutSession(
  projectId: string,
  planId: string,
  billingCycle: 'monthly' | 'yearly'
) {
  // TODO: Llamar a edge function que cree session de Stripe
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, planId, billingCycle }),
  });

  const { sessionId } = await response.json();

  const stripe = await stripePromise;
  await stripe?.redirectToCheckout({ sessionId });
}
```

---

## 📋 FASE 5: TESTING (Semana 9)

### Checklist de Testing

- [ ] Crear usuario nuevo → Verificar límites creados
- [ ] Crear proyecto → Verificar subscription trial creada
- [ ] Verificar contadores incrementan correctamente
- [ ] Intentar crear más de 2 proyectos sin payment method → Bloqueado
- [ ] Agregar payment method → Límite aumenta a 10
- [ ] Crear 4to proyecto trial → Bloqueado (max 3 trials)
- [ ] Upgrade proyecto trial a Starter → Contador trial decrementa
- [ ] Verificar feature gates funcionan correctamente
- [ ] Esperar 14 días o cambiar fecha manualmente → Trial expira
- [ ] Webhook de Stripe funciona correctamente
- [ ] Performance: Queries <300ms
- [ ] RLS policies: Usuario no puede ver subscriptions de otros

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs a Trackear

```sql
-- Tasa de conversión trial → paid
SELECT
  COUNT(*) FILTER (WHERE status = 'active')::FLOAT /
  NULLIF(COUNT(*), 0) * 100 as conversion_rate
FROM project_subscriptions
WHERE plan_id != 'free_trial';

-- MRR (Monthly Recurring Revenue)
SELECT
  SUM(CASE
    WHEN ps.billing_cycle = 'monthly' THEN sp.price_monthly_eur
    WHEN ps.billing_cycle = 'yearly' THEN sp.price_yearly_eur / 12
  END) as mrr
FROM project_subscriptions ps
JOIN subscription_plans sp ON ps.plan_id = sp.id
WHERE ps.status = 'active';

-- Distribución de planes
SELECT
  plan_id,
  COUNT(*) as count,
  ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM project_subscriptions
WHERE status = 'active'
GROUP BY plan_id;
```

---

## 🚀 LANZAMIENTO

### Pre-Launch Checklist

- [ ] Todos los tests pasando
- [ ] Stripe webhooks configurados
- [ ] Edge functions deployed
- [ ] Variables de entorno en producción
- [ ] Documentación de usuario lista
- [ ] Plan de comunicación a usuarios existentes
- [ ] Monitoring configurado (Sentry, etc.)
- [ ] Backup de base de datos

### Post-Launch

1. **Semana 1:** Monitorear errores y performance
2. **Semana 2:** Analizar conversión y feedback
3. **Mes 1:** Optimizar flows basado en datos
4. **Trimestre 1:** Iterar features y pricing

---

## 📚 RECURSOS

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Stripe Elements React](https://stripe.com/docs/stripe-js/react)

---

**¡ÉXITO EN LA IMPLEMENTACIÓN!** 🎉
