# 🔒 Guía de Integración de Límites y Feature Gates

Esta guía documenta cómo integrar los componentes de validación de límites y feature gates en los componentes existentes de Nova Hub.

## 📋 Componentes Creados

### 1. **CreateTaskButton** (`src/components/tasks/CreateTaskButton.tsx`)
- Valida límite de tareas antes de permitir creación
- Muestra modal de upgrade si se alcanza el límite
- Uso: Reemplazar botones "Nueva Tarea" existentes

### 2. **InviteButton** (`src/components/members/InviteButton.tsx`)
- Valida límite de miembros antes de permitir invitación
- Abre InviteMemberWizard automáticamente
- Muestra modal de upgrade si se alcanza el límite
- Uso: Reemplazar botones "Invitar Miembro" existentes

### 3. **AddLeadButton** (`src/components/leads/AddLeadButton.tsx`)
- Valida límite de leads antes de permitir creación
- Muestra modal de upgrade si se alcanza el límite
- Uso: Reemplazar botones "Nuevo Lead" existentes

### 4. **FeatureGate** (`src/components/subscription/FeatureGate.tsx`)
- Wrapper para bloquear features completas según plan
- Muestra overlay con blur si no tiene acceso
- Uso: Envolver secciones completas que requieren plan específico

## 🔧 Integraciones Necesarias

### A. Dashboard Principal
**Archivo:** `src/pages/DashboardPage.tsx`

```tsx
import { CreateTaskButton } from '@/components/tasks/CreateTaskButton';
import { InviteButton } from '@/components/members/InviteButton';
import { AddLeadButton } from '@/components/leads/AddLeadButton';
import { PlanLimitsIndicator } from '@/components/subscription/PlanLimitsIndicator';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';

// En el componente:
<TrialCountdownBanner projectId={currentProject.id} />

<PlanLimitsIndicator
  projectId={currentProject.id}
  compact
  className="mb-6"
/>

// Reemplazar botones existentes:
<CreateTaskButton onCreateTask={() => setShowCreateTaskModal(true)} />
<InviteButton onSuccess={() => refetchMembers()} />
<AddLeadButton onAddLead={() => setShowAddLeadModal(true)} />
```

### B. Página de Tareas
**Archivo:** `src/pages/TasksPage.tsx`

```tsx
import { CreateTaskButton } from '@/components/tasks/CreateTaskButton';

// Header de la página:
<div className="flex items-center justify-between mb-6">
  <h1>Tareas</h1>
  <CreateTaskButton
    onCreateTask={() => setShowCreateModal(true)}
    size="lg"
  />
</div>
```

### C. Página de Leads
**Archivo:** `src/pages/LeadsPage.tsx`

```tsx
import { AddLeadButton } from '@/components/leads/AddLeadButton';

// Header de la página:
<div className="flex items-center justify-between mb-6">
  <h1>Leads</h1>
  <AddLeadButton
    onAddLead={() => setShowAddModal(true)}
    size="lg"
  />
</div>
```

### D. Página de Equipo/Miembros
**Archivo:** `src/pages/TeamPage.tsx`

```tsx
import { InviteButton } from '@/components/members/InviteButton';

// Header de la página:
<div className="flex items-center justify-between mb-6">
  <h1>Equipo</h1>
  <InviteButton
    onSuccess={() => refetchMembers()}
    size="lg"
  />
</div>
```

### E. Features Premium Bloqueadas
**Archivo:** Cualquier página con features premium

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate';

// Bloquear sección completa:
<FeatureGate feature="advanced_analytics" showOverlay>
  <AnalyticsDashboard />
</FeatureGate>

// Bloquear solo botón (sin overlay):
<FeatureGate feature="api_access" showOverlay={false}>
  <Button>Ver API Keys</Button>
</FeatureGate>

// Con fallback personalizado:
<FeatureGate
  feature="custom_branding"
  fallback={<p>Actualiza a Pro para personalizar tu marca</p>}
>
  <BrandingSettings />
</FeatureGate>
```

### F. Sidebar del Proyecto
**Archivo:** `src/components/layout/Sidebar.tsx`

```tsx
import { PlanLimitsIndicator } from '@/components/subscription/PlanLimitsIndicator';

// Al final del sidebar:
<div className="p-4">
  <PlanLimitsIndicator
    projectId={currentProject.id}
    compact
  />
</div>
```

## 🎯 Features a Bloquear con FeatureGate

| Feature | Dónde aplicar | Plan requerido |
|---------|---------------|----------------|
| `ai_role_generation` | Botón "Generar Roles con IA" | Starter |
| `ai_task_generation` | Botón "Generar Tareas con IA" | Starter |
| `ai_logo_generation` | Sección de diseño de logo | Starter |
| `ai_buyer_persona` | Sección de Buyer Persona | Starter |
| `advanced_analytics` | Dashboard de Analytics | Pro |
| `api_access` | Página de API Keys | Pro |
| `custom_branding` | Configuración de marca | Pro |
| `white_label` | Eliminar marca Nova Hub | Enterprise |
| `custom_domain` | Configurar dominio personalizado | Enterprise |
| `priority_support` | Canal de soporte prioritario | Pro |

## 📊 Ejemplo Completo de Integración

```tsx
import { useState } from 'react';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { CreateTaskButton } from '@/components/tasks/CreateTaskButton';
import { InviteButton } from '@/components/members/InviteButton';
import { PlanLimitsIndicator } from '@/components/subscription/PlanLimitsIndicator';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';
import { FeatureGate } from '@/components/subscription/FeatureGate';

export function DashboardPage() {
  const { currentProject } = useCurrentProject();
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  if (!currentProject) return <div>Selecciona un proyecto</div>;

  return (
    <div className="p-6">
      {/* Trial Banner */}
      <TrialCountdownBanner projectId={currentProject.id} />

      {/* Plan Limits Indicator */}
      <PlanLimitsIndicator
        projectId={currentProject.id}
        compact
        className="mb-6"
      />

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <CreateTaskButton
          onCreateTask={() => setShowCreateTaskModal(true)}
        />
        <InviteButton />

        {/* AI Feature con gate */}
        <FeatureGate feature="ai_task_generation" showOverlay={false}>
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Tareas con IA
          </Button>
        </FeatureGate>
      </div>

      {/* Analytics Section con gate */}
      <FeatureGate feature="advanced_analytics" showOverlay>
        <AdvancedAnalyticsDashboard />
      </FeatureGate>
    </div>
  );
}
```

## ✅ Checklist de Integración

- [ ] Dashboard: Añadir TrialCountdownBanner
- [ ] Dashboard: Añadir PlanLimitsIndicator
- [ ] Dashboard: Reemplazar botones por CreateTaskButton, InviteButton
- [ ] TasksPage: Usar CreateTaskButton
- [ ] LeadsPage: Usar AddLeadButton
- [ ] TeamPage: Usar InviteButton
- [ ] Sidebar: Añadir PlanLimitsIndicator (compact)
- [ ] Analytics: Bloquear con FeatureGate (advanced_analytics)
- [ ] API Keys: Bloquear con FeatureGate (api_access)
- [ ] Branding: Bloquear con FeatureGate (custom_branding)
- [ ] AI Buttons: Bloquear con FeatureGate (ai_*)

## 🚀 Próximos Pasos

1. **Fase 6**: Implementar Learning Roadmap para modo individual
2. **Fase 7**: Integrar Stripe Checkout para pagos reales
3. **Fase 8**: Mejorar UX de valor (comparaciones, testimonios)
4. **Fase 9**: Gestión post-creación (editar roles, cambiar plan)
5. **Fase 10**: Sistema de notificaciones (emails, in-app)
6. **Fase 11**: Testing, migración, seguridad

## 📝 Notas Importantes

- Los límites se verifican en tiempo real usando el hook `useFeatureAccess`
- Los botones muestran icono de `Lock` cuando el límite está alcanzado
- Todos los componentes incluyen toast notifications para feedback inmediato
- El modal de upgrade se abre automáticamente cuando se alcanza un límite
- FeatureGate soporta tres modos: overlay con blur, sin renderizar, o fallback personalizado
