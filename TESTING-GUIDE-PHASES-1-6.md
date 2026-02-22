# 🧪 Guía de Testing - Fases 1-6

## Preparación Inicial

### 1. Verificar Base de Datos
```sql
-- Verificar que las tablas existen
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'subscription_plans',
  'user_account_limits',
  'project_subscriptions',
  'project_roles',
  'learning_roadmap_steps'
);

-- Verificar los 4 planes
SELECT id, display_name, price_monthly, price_yearly FROM subscription_plans;

-- Verificar que NO existe enum specialization_role
SELECT typname FROM pg_type WHERE typname = 'specialization_role';
-- Debe devolver 0 filas

-- Verificar que project_members.role es TEXT
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'project_members'
AND column_name IN ('role', 'previous_role');
-- Ambos deben ser 'text'
```

### 2. Verificar Edge Functions
```bash
# Verificar que las funciones existen
cd supabase/functions
ls -la | grep generate

# Debería mostrar:
# - generate-project-roles/
# - generate-learning-roadmap/
```

### 3. Compilar y Correr el Proyecto
```bash
# Instalar dependencias si no están
npm install

# Verificar que no hay errores de TypeScript
npm run type-check

# Correr el proyecto
npm run dev
```

---

## 🧪 Testing por Fase

### ✅ FASE 1: Base de Datos

#### Test 1.1: Verificar User Account Limits
```sql
-- Crear un usuario de prueba y verificar flag
SELECT id, email, has_used_free_trial
FROM user_account_limits
WHERE email = 'tu-email-de-prueba@example.com';

-- Debe mostrar has_used_free_trial = false inicialmente
```

#### Test 1.2: Verificar Planes
```sql
SELECT
  id,
  display_name,
  price_monthly,
  members_limit,
  tasks_limit,
  leads_limit,
  obvs_limit,
  ai_role_generation,
  advanced_analytics
FROM subscription_plans
ORDER BY price_monthly;

-- Verificar que existen 4 planes:
-- free_trial: €0, límites 3/10/20/10, ai_role_generation = true
-- starter: €9, límites 5/50/50/20, ai_role_generation = true
-- pro: €29, límites 20/unlimited/unlimited/unlimited, ai_role_generation = true
-- enterprise: €99, todos unlimited, ai_role_generation = true
```

#### Test 1.3: Verificar Triggers
```sql
-- Crear un proyecto de prueba con free_trial
-- Luego verificar que el flag se marcó automáticamente
SELECT has_used_free_trial
FROM user_account_limits
WHERE user_id = 'TU_USER_ID';

-- Debe cambiar a true después de crear proyecto con free_trial
```

---

### ✅ FASE 2: Flujo de Entrada

#### Test 2.1: SelectProjectPage
1. Navegar a `/select-project`
2. ✅ Verificar que se muestran todos los proyectos del usuario
3. ✅ Cada card debe mostrar:
   - Nombre del proyecto
   - Logo o inicial
   - Badge de plan (Free Trial, Starter, Pro, Enterprise)
   - Badge de work mode
   - Industria
   - Última actualización
4. ✅ Card "Crear Nuevo Proyecto" al final
5. ✅ Click en un proyecto debe navegar a `/dashboard`

#### Test 2.2: CreateFirstProjectPage
1. Navegar a `/create-first-project`
2. **Step 1: Información Básica**
   - ✅ Input de nombre (obligatorio)
   - ✅ Select de industria (obligatorio)
   - ✅ Textarea de descripción (opcional)
   - ✅ Botón "Siguiente" solo funciona si nombre e industria están completos
3. **Step 2: Idea de Negocio**
   - ✅ Textarea grande para idea (obligatorio)
   - ✅ Tip sobre detallar para mejor IA
   - ✅ Botones "Atrás" y "Siguiente"
4. **Step 3: Work Mode**
   - ✅ 4 opciones: Individual, Team Small, Team Established, No Roles
   - ✅ Cada opción con icono y descripción
   - ✅ Botón "Seleccionar Plan" abre modal
5. **Selección de Plan**
   - ✅ Modal se abre con 4 planes (o 3 si ya usaste free trial)
   - ✅ Toggle Mensual/Anual con badge "Ahorra 20%"
   - ✅ Features con checkmarks
   - ✅ Click en plan crea proyecto

#### Test 2.3: PlanSelectionModal
1. Abrir modal desde CreateFirstProject
2. ✅ Si es tu PRIMER proyecto, debe mostrar 4 planes (incluyendo Free Trial)
3. ✅ Si ya usaste free trial, debe mostrar solo 3 planes (Starter, Pro, Enterprise)
4. ✅ Toggle Mensual/Anual actualiza precios correctamente
5. ✅ Badge "Recomendado" en Starter
6. ✅ Badge "Popular" en Pro
7. ✅ Seleccionar plan cierra modal y crea proyecto

#### Test 2.4: ProjectSelector (Navbar)
1. En cualquier página con navbar
2. ✅ Dropdown muestra proyecto actual con logo
3. ✅ Click abre lista de todos los proyectos
4. ✅ Cada proyecto muestra:
   - Logo/inicial
   - Nombre
   - Industria
   - Badge de work mode
   - Checkmark si es el actual
5. ✅ "Crear Nuevo Proyecto" al final
6. ✅ "Ver Todos los Proyectos" si hay >3 proyectos
7. ✅ Cambiar proyecto actualiza contexto inmediatamente

#### Test 2.5: CurrentProjectContext
1. Abrir DevTools Console
2. Ejecutar: `localStorage.getItem('currentProjectId')`
3. ✅ Debe mostrar ID del proyecto actual
4. Cambiar de proyecto
5. ✅ localStorage debe actualizarse automáticamente
6. Refrescar página
7. ✅ Proyecto seleccionado debe persistir

---

### ✅ FASE 3: Sistema de Planes

#### Test 3.1: FeatureGate
**Preparación:** Crear un proyecto con plan Starter (no tiene advanced_analytics)

```tsx
// En cualquier página, añadir temporalmente:
<FeatureGate feature="advanced_analytics" showOverlay>
  <div className="p-8 bg-blue-100">
    Este es contenido premium
  </div>
</FeatureGate>
```

1. ✅ Debe mostrar contenido con blur
2. ✅ Overlay con mensaje "Analíticas Avanzadas"
3. ✅ Botón "Actualizar Plan"
4. ✅ Click abre modal de selección de plan

**Prueba con plan Pro:**
1. Cambiar a proyecto con plan Pro
2. ✅ Contenido debe mostrarse SIN blur ni overlay

#### Test 3.2: TrialCountdownBanner
**Preparación:** Proyecto con free_trial activo

```tsx
// Añadir en dashboard:
<TrialCountdownBanner projectId={currentProject.id} />
```

1. ✅ Banner se muestra solo si proyecto está en trial
2. ✅ Muestra días restantes correctamente
3. ✅ Progress bar refleja días consumidos
4. ✅ Si faltan ≤3 días, banner es rojo con pulse animation
5. ✅ Si faltan >7 días, banner es azul
6. ✅ Botón "Ver Planes" abre modal
7. ✅ Botón "X" dismissible solo si >3 días restantes

**Para testear urgencia:**
```sql
-- Temporalmente modificar trial_end_date para simular expiracion
UPDATE project_subscriptions
SET trial_end_date = NOW() + INTERVAL '2 days'
WHERE project_id = 'TU_PROJECT_ID';

-- Refrescar página y verificar que banner es rojo
```

#### Test 3.3: PlanLimitsIndicator
**Preparación:** Proyecto con límites (Starter o Pro)

```tsx
// Añadir en sidebar o dashboard:
<PlanLimitsIndicator
  projectId={currentProject.id}
  compact
/>
```

1. ✅ Muestra 4 recursos: Miembros, Tareas, Leads, OBVs
2. ✅ Cada recurso muestra: current / max
3. ✅ Progress bars reflejan uso
4. ✅ Si recurso >80%, progress bar naranja
5. ✅ Si recurso >95%, progress bar roja
6. ✅ Botón "Upgrade" abre modal

**Modo Full:**
```tsx
<PlanLimitsIndicator
  projectId={currentProject.id}
  compact={false}
/>
```

1. ✅ Card más grande con más detalles
2. ✅ Mensajes de warning si cerca del límite
3. ✅ Badge del plan actual

**Plan Enterprise:**
1. Cambiar a proyecto Enterprise
2. ✅ Debe mostrar "∞" en lugar de números para límites ilimitados

---

### ✅ FASE 4: IA Y Roles

#### Test 4.1: Generación de Roles con IA
**Flujo completo desde cero:**

1. Logout y volver a login con email NUEVO (para tener free trial disponible)
2. Ir a `/create-first-project`
3. Completar wizard:
   - Nombre: "Test SaaS B2B"
   - Industria: "Tecnología"
   - Idea: "Plataforma de gestión de proyectos con IA para equipos remotos"
   - Work Mode: "Equipo Pequeño"
4. Seleccionar plan: "Free Trial"
5. ✅ Loading overlay "Generando roles personalizados con IA..."
6. ✅ Modal de RolesExplanationModal se abre automáticamente
7. ✅ Verificar que se generaron 8 roles (team_small)
8. ✅ Cada rol debe tener:
   - Nombre personalizado (NO genérico como "CEO" o "CTO")
   - Descripción detallada
   - Responsabilidades (4-6 items)
   - Habilidades requeridas (4-6 items)
   - Experience level badge
   - Department badge
   - Star icon si es crítico

**Verificar en base de datos:**
```sql
SELECT
  role_name,
  description,
  experience_level,
  department,
  is_critical,
  display_order
FROM project_roles
WHERE project_id = 'TU_PROJECT_ID'
ORDER BY display_order;

-- Debe haber 8 roles personalizados
```

#### Test 4.2: RolesExplanationModal
1. ✅ Título: "Roles Generados con IA"
2. ✅ Contador: "{X} roles personalizados"
3. ✅ Cards ordenados: críticos primero
4. ✅ Star amarilla en roles críticos
5. ✅ Responsabilidades con checkmarks verdes
6. ✅ Skills en badges secundarios
7. ✅ Info box explicando que son sugerencias
8. ✅ Botón "Entendido, Continuar" → navega a dashboard

#### Test 4.3: InviteMemberWizard
**Preparación:** Estar en un proyecto con roles generados

```tsx
// Añadir botón temporalmente:
<InviteMemberWizard
  isOpen={true}
  onClose={() => {}}
  projectId={currentProject.id}
/>
```

1. ✅ Modal "Invitar Miembro al Equipo"
2. ✅ Muestra uso actual de miembros vs límite
3. ✅ Progress bar si cerca del límite
4. ✅ Inputs: Email (obligatorio), Nombre (obligatorio)
5. ✅ Select de roles con todos los roles generados
6. ✅ Opción "Sin rol asignado"
7. ✅ Al seleccionar rol, muestra descripción en info box
8. ✅ Badge "Crítico" si el rol es is_critical
9. ✅ Botón "Enviar Invitación" disabled si falta info
10. ✅ Si límite alcanzado, muestra warning rojo y deshabilita form

#### Test 4.4: Modo "no_roles"
1. Crear nuevo proyecto
2. Seleccionar work_mode: "Sin Roles"
3. Seleccionar Free Trial
4. ✅ NO debe mostrar loading de IA
5. ✅ NO debe mostrar modal de roles
6. ✅ Va directo al dashboard

**Verificar en BD:**
```sql
SELECT ai_roles_generated, work_mode
FROM projects
WHERE id = 'TU_PROJECT_ID';

-- ai_roles_generated debe ser true
-- work_mode debe ser 'no_roles'

SELECT COUNT(*) FROM project_roles WHERE project_id = 'TU_PROJECT_ID';
-- Debe ser 0
```

---

### ✅ FASE 5: Límites y Gates

#### Test 5.1: CreateTaskButton
**Preparación:** Proyecto Starter (límite 50 tareas)

```tsx
// Añadir en página:
<CreateTaskButton onCreateTask={() => alert('Crear tarea!')} />
```

**Caso 1: Por debajo del límite**
1. ✅ Icono Plus (+)
2. ✅ Texto "Nueva Tarea"
3. ✅ Click ejecuta callback onCreateTask

**Caso 2: Límite alcanzado**
```sql
-- Simular límite alcanzado
UPDATE project_subscriptions
SET tasks_count = 50
WHERE project_id = 'TU_PROJECT_ID';
```
1. ✅ Icono Lock (🔒)
2. ✅ Botón con opacity reducida
3. ✅ Click muestra toast error
4. ✅ Modal de upgrade se abre automáticamente

#### Test 5.2: InviteButton
**Preparación:** Proyecto Starter (límite 5 miembros)

```tsx
<InviteButton onSuccess={() => console.log('Success!')} />
```

**Caso 1: Por debajo del límite**
1. ✅ Icono UserPlus
2. ✅ Texto "Invitar Miembro"
3. ✅ Click abre InviteMemberWizard

**Caso 2: Límite alcanzado**
```sql
UPDATE project_subscriptions
SET members_count = 5
WHERE project_id = 'TU_PROJECT_ID';
```
1. ✅ Icono Lock
2. ✅ Click muestra toast error
3. ✅ Modal de upgrade se abre

#### Test 5.3: AddLeadButton
Similar a CreateTaskButton pero para leads.

```tsx
<AddLeadButton onAddLead={() => alert('Añadir lead!')} />
```

**Verificar con límite de leads alcanzado:**
```sql
UPDATE project_subscriptions
SET leads_count = 50
WHERE project_id = 'TU_PROJECT_ID';
```

---

### ✅ FASE 6: Learning Roadmap

#### Test 6.1: Generar Roadmap
**Preparación:** Proyecto en modo "individual"

1. Navegar a `/learning-roadmap`
2. ✅ Página muestra título "Mi Roadmap de Aprendizaje"
3. ✅ Botón "Generar Roadmap con IA" visible
4. ✅ Click en botón muestra toast "Generando..."
5. ✅ Loading durante generación
6. ✅ Toast success cuando completa

**Verificar en BD:**
```sql
SELECT
  role_name,
  step_order,
  tasks_required,
  obvs_required,
  estimated_weeks,
  skills_to_learn,
  unlock_criteria
FROM learning_roadmap_steps
WHERE project_id = 'TU_PROJECT_ID'
AND member_id = 'TU_MEMBER_ID'
ORDER BY step_order;

-- Debe haber 5 steps secuenciales
```

#### Test 6.2: LearningRoadmapView
**Verificar estados:**

1. **Step 1 (Activo):**
   - ✅ Borde azul
   - ✅ Icono PlayCircle azul
   - ✅ Badge "En Progreso"
   - ✅ Progress bar visible
   - ✅ Click expande detalles
   - ✅ Muestra requisitos (tareas y OBVs)
   - ✅ Botón "Ir a Tareas del Rol"

2. **Steps 2-5 (Bloqueados):**
   - ✅ Opacity reducida
   - ✅ Icono Lock gris
   - ✅ Badge "Bloqueado"
   - ✅ Click expande detalles
   - ✅ Warning naranja con criterio de desbloqueo

3. **Progreso General Card:**
   - ✅ Muestra X de 5 roles completados
   - ✅ Progress bar refleja porcentaje
   - ✅ Indica rol actual

**Simular paso completado:**
```sql
UPDATE learning_roadmap_steps
SET
  tasks_completed = tasks_required,
  obvs_completed = obvs_required,
  completed_at = NOW()
WHERE project_id = 'TU_PROJECT_ID'
AND step_order = 1;
```

Refrescar página:
- ✅ Step 1 debe tener fondo verde, icono CheckCircle, badge "Completado"
- ✅ Step 2 debe cambiar a "En Progreso" (activo)

#### Test 6.3: Proyecto NO Individual
1. Cambiar a proyecto con work_mode ≠ 'individual'
2. Navegar a `/learning-roadmap`
3. ✅ Debe mostrar mensaje "Roadmap No Disponible"
4. ✅ Explicar que solo está disponible para modo individual
5. ✅ Botón "Volver al Dashboard"

---

## 🧪 Tests de Integración

### Integration Test 1: Flujo Completo Nuevo Usuario
**Objetivo:** Verificar todo el flujo desde cero

1. ✅ Crear cuenta nueva (email nunca usado)
2. ✅ Verificar que `has_used_free_trial = false`
3. ✅ Crear primer proyecto:
   - Wizard completo
   - Seleccionar Free Trial (debe estar disponible)
   - Generación automática de roles con IA
   - Modal de explicación de roles
4. ✅ Verificar en BD:
   - `project_subscriptions` creado con plan_id = 'free_trial'
   - `project_roles` tiene 5/8/12 roles según work_mode
   - `has_used_free_trial = true`
5. ✅ Dashboard muestra:
   - TrialCountdownBanner con 14 días
   - PlanLimitsIndicator con límites
   - ProjectSelector con proyecto
6. ✅ Intentar crear SEGUNDO proyecto:
   - Free Trial NO debe aparecer en modal
   - Solo Starter, Pro, Enterprise disponibles

### Integration Test 2: Límites en Acción
**Objetivo:** Verificar que los límites funcionan end-to-end

1. Proyecto Starter (límite 50 tareas)
2. ✅ CreateTaskButton funcional
3. Simular 50 tareas creadas
4. ✅ Botón cambia a Lock icon
5. ✅ Click muestra modal de upgrade
6. ✅ Seleccionar Pro en modal
7. ✅ Verificar que botón vuelve a ser funcional (Pro tiene tareas ilimitadas)

### Integration Test 3: Learning Roadmap Completo
**Objetivo:** Completar todo el roadmap

1. Proyecto modo individual con roadmap generado
2. ✅ Step 1 activo
3. Simular completar tareas y OBVs del Step 1
4. ✅ Step 1 marca como completado
5. ✅ Step 2 se desbloquea automáticamente
6. ✅ Repeat hasta completar todos los steps
7. ✅ Progreso general muestra 100%

---

## 🐛 Errores Comunes a Verificar

### Error 1: Free Trial Aparece Cuando No Debería
**Verificar:**
```sql
SELECT has_used_free_trial FROM user_account_limits WHERE user_id = 'TU_ID';
```
Si es `true`, Free Trial NO debe aparecer en modal.

### Error 2: Roles Predefinidos en Lugar de IA
**Verificar:**
```sql
SELECT role_name FROM project_roles WHERE project_id = 'TU_ID';
```
NO deben aparecer: "sales", "finance", "ai_tech", "marketing", "operations", "strategy"
Deben ser nombres descriptivos como: "Especialista en Growth Marketing B2B"

### Error 3: Enums en project_members.role
**Verificar:**
```sql
SELECT data_type FROM information_schema.columns
WHERE table_name = 'project_members' AND column_name = 'role';
```
Debe ser `text`, NO `USER-DEFINED`.

### Error 4: CurrentProject No Persiste
**Verificar:**
- localStorage tiene 'currentProjectId'
- Context provider envuelve toda la app
- Al refrescar, proyecto sigue seleccionado

### Error 5: Límites No se Actualizan
**Verificar triggers:**
```sql
-- Debe haber triggers en project_members, tasks, leads, obvs
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table IN ('project_members', 'tasks', 'leads', 'obvs');
```

---

## ✅ Checklist Final

- [ ] Base de datos: 5 tablas creadas y verificadas
- [ ] Planes: 4 planes insertados con límites correctos
- [ ] Roles: Convertidos de ENUM a TEXT
- [ ] SelectProjectPage: Muestra proyectos con badges
- [ ] CreateFirstProjectPage: Wizard 3 pasos funcional
- [ ] PlanSelectionModal: Filtra free trial correctamente
- [ ] ProjectSelector: Cambia proyecto y persiste
- [ ] FeatureGate: Bloquea features según plan
- [ ] TrialCountdownBanner: Muestra días restantes
- [ ] PlanLimitsIndicator: Muestra uso de recursos
- [ ] Generación de Roles IA: Crea roles personalizados
- [ ] RolesExplanationModal: Muestra roles detallados
- [ ] InviteMemberWizard: Invita con rol flexible
- [ ] CreateTaskButton: Valida límite de tareas
- [ ] InviteButton: Valida límite de miembros
- [ ] AddLeadButton: Valida límite de leads
- [ ] LearningRoadmapView: Muestra 5 steps secuenciales
- [ ] generate-learning-roadmap: Genera con IA
- [ ] Flujo completo: Nuevo usuario → proyecto → roles → dashboard
- [ ] Free trial: Solo 1 vez por email
- [ ] Límites: Bloquean acciones correctamente

---

## 📝 Notas para Testing

- Usar diferentes cuentas de email para testear free trial
- Usar Stripe Test Mode cuando llegue Fase 7
- DevTools console para verificar errors
- Network tab para verificar llamadas a edge functions
- Supabase Dashboard para verificar datos en tiempo real

## 🚀 Cuando Termines de Testear

Reporta cualquier bug encontrado y continuaremos con **Fase 7: Stripe Integration**.
