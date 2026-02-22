# ✅ FASE 1: FUNDACIÓN - Verificación

## 📦 Archivos Creados

### Backend (SQL)
- ✅ `subscription-system-corrected.sql` - Schema completo corregido

### Frontend (Hooks y Contexts)
- ✅ `src/hooks/useSubscription.ts` - Hooks corregidos
- ✅ `src/contexts/CurrentProjectContext.tsx` - Context de proyecto actual
- ✅ `src/hooks/useAuth.ts` - Ya existía, verificado ✓

---

## 🚀 PASO 1: Ejecutar SQL (5 minutos)

### 1.1 Ir a Supabase Dashboard

1. Ir a https://app.supabase.com
2. Seleccionar tu proyecto Nova Hub
3. SQL Editor → New Query

### 1.2 Ejecutar Migration

1. Abrir archivo `subscription-system-corrected.sql`
2. Copiar TODO el contenido
3. Pegar en SQL Editor
4. Click en **RUN**

### 1.3 Verificar Ejecución

Deberías ver al final:

```
✅ All subscription system tables created successfully!
✅ 4 plans inserted: Free Trial, Starter, Pro, Enterprise
✅ FREE TRIAL: Only 1 per email (has_used_free_trial flag)
✅ PROJECTS: Unlimited - no limits per user
```

---

## ✅ PASO 2: Verificar Tablas (2 minutos)

Ejecutar estas queries para verificar:

### Verificar Planes

```sql
SELECT id, display_name, price_monthly_eur, max_members, max_tasks
FROM subscription_plans
ORDER BY display_order;
```

**Resultado esperado:**
| id | display_name | price_monthly_eur | max_members | max_tasks |
|----|--------------|-------------------|-------------|-----------|
| free_trial | Prueba Gratis | 0.00 | 3 | 50 |
| starter | Starter | 9.00 | 10 | 200 |
| pro | Pro | 29.00 | 50 | 1000 |
| enterprise | Enterprise | 99.00 | NULL | NULL |

### Verificar Límites de Usuario

```sql
-- Ver tu límite de usuario
SELECT *
FROM user_account_limits
WHERE user_id = auth.uid();
```

**Resultado esperado:**
- `has_used_free_trial`: false (si no has creado proyectos aún)
- `free_trial_used_at`: null
- `blocked`: false

### Verificar Tablas Adicionales

```sql
-- Verificar que todas las tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_account_limits',
  'subscription_plans',
  'project_subscriptions',
  'project_roles',
  'learning_roadmap_steps'
)
ORDER BY table_name;
```

**Resultado esperado:** 5 tablas listadas

---

## 🎨 PASO 3: Integrar Contexts en App (10 minutos)

### 3.1 Actualizar App.tsx

Envolver tu app con los nuevos contexts:

```tsx
// src/App.tsx
import { CurrentProjectProvider } from '@/contexts/CurrentProjectContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      refetchOnWindowFocus: true,
      retry: (failureCount, error: any) => {
        const statusCode = error?.status || error?.code;
        if (statusCode >= 400 && statusCode < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrentProjectProvider>
        {/* Tu app aquí */}
        <YourRoutes />
      </CurrentProjectProvider>
    </QueryClientProvider>
  );
}
```

### 3.2 Usar en Componentes

Ahora puedes usar los hooks en cualquier componente:

```tsx
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useUserLimits, useCanUseFreeTrial } from '@/hooks/useSubscription';

function MyComponent() {
  const { currentProject, hasProjects } = useCurrentProject();
  const { data: limits } = useUserLimits();
  const { canUse, reason } = useCanUseFreeTrial();

  console.log('Current project:', currentProject);
  console.log('Can use free trial:', canUse);
  console.log('User limits:', limits);

  return <div>...</div>;
}
```

---

## 🧪 PASO 4: Testing Rápido (5 minutos)

### 4.1 Crear Componente de Debug

Crear `src/components/debug/SubscriptionDebug.tsx`:

```tsx
import { useUserLimits, useCanUseFreeTrial, useSubscriptionPlans } from '@/hooks/useSubscription';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

export function SubscriptionDebug() {
  const { data: limits } = useUserLimits();
  const { canUse } = useCanUseFreeTrial();
  const { data: plans = [] } = useSubscriptionPlans();
  const { currentProject, userProjects } = useCurrentProject();

  return (
    <div className="p-6 bg-gray-100 rounded-lg space-y-4">
      <h2 className="text-2xl font-bold">🔍 Subscription Debug</h2>

      {/* User Limits */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">👤 User Limits</h3>
        <pre className="text-xs">{JSON.stringify(limits, null, 2)}</pre>
      </div>

      {/* Can Use Free Trial */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">🎁 Free Trial Status</h3>
        <p>Can use: {canUse ? '✅ YES' : '❌ NO'}</p>
        {limits && (
          <p>Has used: {limits.has_used_free_trial ? '✅ YES' : '❌ NO'}</p>
        )}
      </div>

      {/* Plans */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">💳 Available Plans ({plans.length})</h3>
        {plans.map(plan => (
          <div key={plan.id} className="text-sm mb-1">
            <strong>{plan.display_name}</strong> - €{plan.price_monthly_eur}/mes
          </div>
        ))}
      </div>

      {/* Current Project */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">📁 Current Project</h3>
        <p>{currentProject ? currentProject.nombre : 'No project selected'}</p>
        <p className="text-sm text-gray-600">
          Total projects: {userProjects.length}
        </p>
      </div>
    </div>
  );
}
```

### 4.2 Agregar Ruta Temporal

En tu router:

```tsx
import { SubscriptionDebug } from '@/components/debug/SubscriptionDebug';

<Route path="/debug-subscription" element={<SubscriptionDebug />} />
```

### 4.3 Visitar y Verificar

Ir a: `http://localhost:8080/debug-subscription`

**Deberías ver:**
- ✅ User Limits con `has_used_free_trial: false`
- ✅ Can use free trial: YES
- ✅ 4 planes disponibles
- ✅ Current project (o "No project selected" si no tienes aún)

---

## 🎯 CHECKLIST FASE 1

- [ ] SQL ejecutado exitosamente
- [ ] 4 planes verificados en DB
- [ ] user_account_limits creada
- [ ] project_subscriptions creada
- [ ] project_roles creada
- [ ] Contexts integrados en App.tsx
- [ ] Hooks funcionando (verificado en debug)
- [ ] No hay errores en consola

---

## 🚨 Troubleshooting

### Error: "Table doesn't exist"

**Solución:** Ejecutar nuevamente el SQL. Asegurarse de ejecutar TODO el archivo.

### Error: "user_account_limits not found"

**Solución:** El trigger no se ejecutó. Ejecutar manualmente:

```sql
INSERT INTO user_account_limits (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

### Error: "Cannot find module '@/contexts/CurrentProjectContext'"

**Solución:** Verificar que el archivo existe en la ruta correcta:
`src/contexts/CurrentProjectContext.tsx`

### No aparecen planes en debug

**Solución:** Verificar RLS policies:

```sql
-- Verificar que la policy existe
SELECT * FROM pg_policies
WHERE tablename = 'subscription_plans';
```

Si no existe, ejecutar:

```sql
CREATE POLICY "Plans are viewable by authenticated users"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (active = true);
```

---

## ✅ SIGUIENTE PASO

Una vez verificado todo, estarás listo para **FASE 2: FLUJO DE ENTRADA**

Archivos que crearemos:
1. `SelectProjectPage.tsx` - Cuando usuario tiene múltiples proyectos
2. `CreateFirstProjectPage.tsx` - Cuando usuario no tiene proyectos
3. `ProjectSelector.tsx` - Dropdown en navbar
4. `OnboardingWizard.tsx` - Diferenciado por work_mode

**¿TODO LISTO?** ✅
