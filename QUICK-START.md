# ⚡ QUICK START - Sistema de Subscripciones

## 🎯 Inicio en 30 minutos

### Paso 1: Ejecutar SQL (5 min)

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Tu Proyecto → SQL Editor → New Query
3. Copiar TODO el contenido de `subscription-system-schema.sql`
4. Ejecutar (RUN)
5. Verificar que dice: "✅ All subscription system tables created successfully!"

### Paso 2: Verificar Tablas (2 min)

```sql
-- Ejecutar esto para verificar
SELECT * FROM subscription_plans ORDER BY display_order;
```

Deberías ver 4 planes:
- ✅ Free Trial (€0)
- ✅ Starter (€9)
- ✅ Pro (€29)
- ✅ Enterprise (€99)

### Paso 3: Hooks ya están listos (0 min)

El archivo `src/hooks/useSubscription.ts` ya tiene TODOS los hooks que necesitas:

```typescript
import {
  useSubscriptionPlans,    // ← Lista de planes
  useProjectPlan,          // ← Plan de un proyecto
  useUserLimits,           // ← Límites del usuario
  useCanCreateProject,     // ← Validar creación
  useFeatureAccess,        // ← Validar features
  useTrialStatus,          // ← Estado del trial
  useCreateProjectWithTrial, // ← Crear proyecto
} from '@/hooks/useSubscription';
```

### Paso 4: Testing Básico (10 min)

Crear componente temporal para testing:

```tsx
// src/pages/SubscriptionTest.tsx
import { useUserLimits, useSubscriptionPlans } from '@/hooks/useSubscription';

export function SubscriptionTest() {
  const { data: limits } = useUserLimits();
  const { data: plans } = useSubscriptionPlans();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Subscription System Test</h1>

      {/* User Limits */}
      <div className="bg-blue-50 p-4 rounded">
        <h2 className="font-bold mb-2">👤 User Limits</h2>
        <pre>{JSON.stringify(limits, null, 2)}</pre>
      </div>

      {/* Plans */}
      <div className="bg-green-50 p-4 rounded">
        <h2 className="font-bold mb-2">💳 Available Plans</h2>
        {plans?.map(plan => (
          <div key={plan.id} className="mb-2">
            <strong>{plan.display_name}</strong> - €{plan.price_monthly_eur}/mes
          </div>
        ))}
      </div>
    </div>
  );
}
```

Agregar ruta temporal:

```tsx
// src/App.tsx o router
<Route path="/test-subscription" element={<SubscriptionTest />} />
```

Visitar: `http://localhost:8080/test-subscription`

### Paso 5: Crear Primer Proyecto con Trial (10 min)

Actualizar tu formulario de creación de proyecto:

```tsx
// Donde sea que crees proyectos
import { useCreateProjectWithTrial, useCanCreateProject } from '@/hooks/useSubscription';

function CreateProjectForm() {
  const createProject = useCreateProjectWithTrial();
  const { canCreate, reason } = useCanCreateProject();

  const handleSubmit = async (data) => {
    // Validar límites
    if (!canCreate) {
      toast.error(reason);
      return;
    }

    // Crear proyecto con trial automático
    try {
      const project = await createProject.mutateAsync({
        nombre: data.name,
        work_mode: 'team_small',
        business_idea: data.idea,
        industry: data.industry,
      });

      toast.success('¡Proyecto creado! Tienes 14 días de prueba gratis 🎉');
      navigate(`/projects/${project.id}`);
    } catch (error) {
      toast.error('Error al crear proyecto');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Tu formulario actual */}
      <Button type="submit" disabled={!canCreate}>
        {canCreate ? 'Crear Proyecto' : 'Límite Alcanzado'}
      </Button>
    </form>
  );
}
```

---

## 🎨 UI Components - Copiar y Pegar

### Banner de Trial

```bash
# Crear archivo
touch src/components/subscription/TrialCountdownBanner.tsx
```

Copiar el código de `SUBSCRIPTION-IMPLEMENTATION-GUIDE.md` → Paso 3.1

Usar en tu ProjectPage:

```tsx
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';

function ProjectPage({ projectId }) {
  return (
    <div>
      <TrialCountdownBanner
        projectId={projectId}
        onUpgradeClick={() => setShowPlanModal(true)}
      />
      {/* Resto de tu página */}
    </div>
  );
}
```

---

## 🚨 Troubleshooting

### Error: "user_account_limits not found"

**Solución:** El trigger no se ejecutó para usuarios existentes.

```sql
-- Crear límites manualmente para usuarios existentes
INSERT INTO user_account_limits (user_id, email_verified)
SELECT id, email_confirmed_at IS NOT NULL
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

### Error: "Cannot read property 'plan' of null"

**Solución:** El proyecto no tiene subscripción.

```sql
-- Crear subscripciones para proyectos existentes
INSERT INTO project_subscriptions (
  project_id, plan_id, owner_id, status,
  trial_started_at, trial_ends_at
)
SELECT
  p.id,
  'free_trial',
  p.owner_id,
  'trial',
  NOW(),
  NOW() + INTERVAL '14 days'
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_subscriptions
  WHERE project_id = p.id
);
```

### Projects no tienen owner_id

```sql
-- Asignar owners a proyectos existentes
UPDATE projects p
SET owner_id = (
  SELECT member_id
  FROM project_members pm
  WHERE pm.project_id = p.id
  AND pm.role = 'admin'
  LIMIT 1
)
WHERE owner_id IS NULL;
```

---

## 📊 Verificar que Todo Funciona

### Checklist Rápido

```sql
-- 1. Planes existen
SELECT COUNT(*) FROM subscription_plans;
-- ✅ Debe retornar: 4

-- 2. Tu usuario tiene límites
SELECT * FROM user_account_limits WHERE user_id = auth.uid();
-- ✅ Debe retornar: 1 fila

-- 3. Tus proyectos tienen subscripciones
SELECT p.nombre, ps.status, ps.plan_id
FROM projects p
JOIN project_subscriptions ps ON p.id = ps.project_id;
-- ✅ Cada proyecto debe tener una subscripción

-- 4. Contadores están correctos
SELECT
  active_projects_count,
  trial_projects_count
FROM user_account_limits
WHERE user_id = auth.uid();
-- ✅ Deben coincidir con tus proyectos actuales
```

---

## 🎯 Próximos Pasos

1. **Si todo funciona:**
   - ✅ Implementar componentes UI (PlanSelectionModal, etc.)
   - ✅ Configurar Stripe (semana 7-8)
   - ✅ Testing completo

2. **Si hay errores:**
   - 🔍 Revisar Troubleshooting arriba
   - 📧 Revisar logs de Supabase (Dashboard → Logs)
   - 🐛 Ejecutar queries de verificación

---

## 📚 Documentación Completa

Para implementación paso a paso detallada:
→ Ver `SUBSCRIPTION-IMPLEMENTATION-GUIDE.md`

Para arquitectura y decisiones de diseño:
→ Ver `SUBSCRIPTION-SYSTEM-DESIGN.md`

Para SQL completo:
→ Ver `subscription-system-schema.sql`

Para hooks TypeScript:
→ Ver `src/hooks/useSubscription.ts`

---

## 🆘 Ayuda

Si tienes problemas:

1. Revisar logs: Supabase Dashboard → Logs
2. Verificar RLS policies no están bloqueando
3. Confirmar que las tablas se crearon correctamente
4. Revisar que los triggers se ejecutaron

**Comando útil para debugging:**

```sql
-- Ver estructura completa
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN (
  'user_account_limits',
  'subscription_plans',
  'project_subscriptions'
)
ORDER BY table_name, ordinal_position;
```

---

## ✅ Cuando Todo Está Listo

Deberías poder:

- ✅ Ver tus límites de cuenta
- ✅ Ver los 4 planes disponibles
- ✅ Crear un proyecto → Automáticamente entra en trial 14 días
- ✅ Ver banner de countdown en el proyecto
- ✅ Validación de límites funciona (no puedes crear más de 2 proyectos sin pago)

**¡Listo para continuar con la integración completa!** 🚀
