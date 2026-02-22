# ✅ CHECKLIST IMPLEMENTACIÓN FINAL - NOVA HUB

## 📊 ESTADO ACTUAL

**SQLs Ejecutados:**
- ✅ `FIX_SECURITY_WARNINGS.sql` (ejecutado)
- ✅ `RECREAR_TRIGGERS_FALTANTES.sql` (ejecutado)
- ✅ `SQL_SISTEMA_ROTACION_ROLES.sql` (ejecutado)
- ✅ `migration_feedback_system.sql` (ejecutado)

**SQLs Pendientes:**
- ⏳ `AGREGAR_COLUMNAS_TRACKING.sql`
- ⏳ `TRACKER_AUTOMATICO_PROGRESO.sql`
- ⏳ `SISTEMA_COMPLETO_FASES_BADGES_NOTIF.sql`
- ⏳ `SQL_CAMINO_A_MASTER.sql` (NUEVO)
- ⏳ `BORRAR_PROYECTOS_DEMO.sql` (OPCIONAL)

---

## 🎯 PLAN DE EJECUCIÓN (ORDEN RECOMENDADO)

### FASE 1: BASE DE DATOS (30 min)

#### Paso 1: Agregar columnas de tracking
```bash
# Archivo: AGREGAR_COLUMNAS_TRACKING.sql
```
**Qué hace:**
- Agrega columnas para tracking automático
- `tasks_on_time`, `obvs_validated`, `initiative_obvs`, `duration_days`

**Verificar después:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'role_exploration_periods';
```

---

#### Paso 2: Crear trackers automáticos
```bash
# Archivo: TRACKER_AUTOMATICO_PROGRESO.sql
```
**Qué hace:**
- Triggers que actualizan contadores automáticamente
- Al completar tarea → actualiza `tasks_completed`
- Al validar OBV → actualiza `obvs_validated`

**Verificar después:**
```sql
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'tasks';
```

---

#### Paso 3: Sistema completo (CRÍTICO)
```bash
# Archivo: SISTEMA_COMPLETO_FASES_BADGES_NOTIF.sql
```
**Qué hace:**
- ✨ Vista: `role_leaderboard` (rankings por rol)
- ✨ Tabla: `member_badges` (badges ganados)
- ✨ Tabla: `badge_definitions` (15 badges predefinidos)
- ✨ Tabla: `member_phase_progress` (tracking de fases)
- ✨ Triggers: auto-grant badges, notificaciones
- ✨ Conecta `user_insights` con exploraciones

**Verificar después:**
```sql
-- Ver badges disponibles
SELECT * FROM badge_definitions;

-- Ver leaderboard
SELECT * FROM role_leaderboard LIMIT 10;

-- Ver progreso de usuarios
SELECT * FROM member_phase_progress;
```

---

#### Paso 4: Sistema "Camino a Master" (NUEVO)
```bash
# Archivo: SQL_CAMINO_A_MASTER.sql
```
**Qué hace:**
- ✨ Función: `start_path_to_master()` (iniciar exploración)
- ✨ Función: `can_challenge_master()` (verificar elegibilidad)
- ✨ Función: `extend_exploration()` (extender tiempo)
- ✨ Vista: `path_to_master_active` (exploraciones activas)
- ✨ RLS policies para acceso público

**Verificar después:**
```sql
-- Probar función
SELECT start_path_to_master(
  (SELECT id FROM members LIMIT 1),
  'marketing',
  NULL
);

-- Ver exploraciones activas
SELECT * FROM path_to_master_active;
```

---

#### Paso 5: Borrar proyectos demo (OPCIONAL)
```bash
# Archivo: BORRAR_PROYECTOS_DEMO.sql
```
**⚠️ CUIDADO:** Borra proyectos existentes. Solo ejecuta si quieres empezar limpio.

---

### FASE 2: FRONTEND (60 min)

#### Paso 6: Integrar PhaseTimeline

**Archivo a editar:** `src/pages/views/ExplorationDashboard.tsx`

```typescript
import { PhaseTimeline } from '@/components/exploration/PhaseTimeline';

// Agregar estado
const [phaseProgress, setPhaseProgress] = useState<any>(null);

// Cargar datos
useEffect(() => {
  if (user?.id) {
    loadPhaseProgress();
  }
}, [user]);

const loadPhaseProgress = async () => {
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('auth_id', user!.id)
    .single();

  if (!member) return;

  const { data: progress } = await supabase
    .from('member_phase_progress')
    .select('*')
    .eq('member_id', member.id)
    .single();

  setPhaseProgress(progress);
};

// En el render
<TabsTrigger value="timeline">
  <Rocket size={16} />
  Mi Progreso
</TabsTrigger>

<TabsContent value="timeline">
  {phaseProgress ? (
    <PhaseTimeline {...phaseProgress} />
  ) : (
    <div>Cargando...</div>
  )}
</TabsContent>
```

**✅ Checklist:**
- [ ] Importar componente
- [ ] Agregar estado `phaseProgress`
- [ ] Crear función `loadPhaseProgress()`
- [ ] Agregar tab "Mi Progreso"
- [ ] Renderizar componente

---

#### Paso 7: Integrar BadgesList

**Archivo a editar:** `src/pages/views/MiDesarrolloView.tsx`

```typescript
import { BadgesList } from '@/components/exploration/BadgesList';

// Agregar estado
const [badges, setBadges] = useState<any>({ earned: [], all: [] });

// Cargar datos
const loadBadges = async () => {
  const { data: earned } = await supabase
    .from('member_badges')
    .select('*')
    .eq('member_id', profile.id);

  const { data: all } = await supabase
    .from('badge_definitions')
    .select('*')
    .order('badge_category, points_value DESC');

  setBadges({ earned: earned || [], all: all || [] });
};

// En el render
<TabsTrigger value="logros">
  <Trophy size={16} />
  Logros
</TabsTrigger>

<TabsContent value="logros">
  <BadgesList earnedBadges={badges.earned} allBadges={badges.all} />
</TabsContent>
```

**✅ Checklist:**
- [ ] Importar componente
- [ ] Agregar estado `badges`
- [ ] Crear función `loadBadges()`
- [ ] Agregar tab "Logros"
- [ ] Renderizar componente

---

#### Paso 8: Integrar RoleInsightsPanel

**Archivo a editar:** `src/pages/views/TeamPerformanceDashboard.tsx`

```typescript
import { RoleInsightsPanel } from '@/components/exploration/RoleInsightsPanel';

// Agregar estado
const [roleInsights, setRoleInsights] = useState<any[]>([]);
const [selectedInsightRole, setSelectedInsightRole] = useState<string>('sales');

// Cargar datos
const loadRoleInsights = async () => {
  const { data } = await supabase
    .from('role_insights')
    .select('*')
    .eq('role', selectedInsightRole)
    .order('created_at', { ascending: false });

  setRoleInsights(data || []);
};

// En el render
<TabsTrigger value="insights">
  <Lightbulb size={16} />
  Insights del Equipo
</TabsTrigger>

<TabsContent value="insights">
  <RoleInsightsPanel
    role={selectedInsightRole}
    insights={roleInsights}
    currentUserId={user?.id}
  />
</TabsContent>
```

**✅ Checklist:**
- [ ] Importar componente
- [ ] Agregar estado `roleInsights`
- [ ] Crear función `loadRoleInsights()`
- [ ] Agregar tab "Insights del Equipo"
- [ ] Renderizar componente

---

#### Paso 9: Integrar PathToMaster (NUEVO)

**Ver archivo:** `INTEGRACION_PATH_TO_MASTER.md` para detalles completos.

**Archivo a editar:** `src/pages/views/ExplorationDashboard.tsx`

```typescript
import { PathToMaster } from '@/components/exploration/PathToMaster';

// Agregar estado
const [currentRoles, setCurrentRoles] = useState<string[]>([]);
const [allRoles] = useState<string[]>([
  'sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy', 'customer'
]);

// Cargar roles actuales
const loadCurrentRoles = async () => {
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('auth_id', user!.id)
    .single();

  const { data: progress } = await supabase
    .from('member_phase_progress')
    .select('star_role, secondary_role')
    .eq('member_id', member.id)
    .single();

  if (progress) {
    const roles = [progress.star_role, progress.secondary_role].filter(Boolean);
    setCurrentRoles(roles);
  }
};

// Handler
const handleStartExploration = async (role: string) => {
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('auth_id', user!.id)
    .single();

  const { data, error } = await supabase.rpc('start_path_to_master', {
    p_member_id: member.id,
    p_role: role,
    p_project_id: null
  });

  if (error) throw error;

  toast.success('🚀 Exploración iniciada!');
  loadCurrentRoles();
};

// En el render
<TabsTrigger value="path-to-master">
  <Rocket size={16} />
  Camino a Master
</TabsTrigger>

<TabsContent value="path-to-master">
  <PathToMaster
    currentRoles={currentRoles}
    allRoles={allRoles}
    onStartExploration={handleStartExploration}
  />
</TabsContent>
```

**✅ Checklist:**
- [ ] Importar componente
- [ ] Agregar estado `currentRoles` y `allRoles`
- [ ] Crear función `loadCurrentRoles()`
- [ ] Crear handler `handleStartExploration()`
- [ ] Agregar tab "Camino a Master"
- [ ] Renderizar componente

---

#### Paso 10: Crear ChallengeChecker (NUEVO)

**Archivo a crear:** `src/components/exploration/ChallengeChecker.tsx`

Ver contenido completo en `INTEGRACION_PATH_TO_MASTER.md`

**✅ Checklist:**
- [ ] Crear archivo `ChallengeChecker.tsx`
- [ ] Copiar código desde guía
- [ ] Importar en página relevante
- [ ] Probar verificación de elegibilidad

---

#### Paso 11: Agregar botón flotante "Camino a Master"

**Opción A: Badge en sidebar**
```typescript
// src/components/Sidebar.tsx
<div className="mt-auto p-4 border-t">
  <Button
    variant="default"
    className="w-full gap-2"
    onClick={() => navigate('/exploration?tab=path-to-master')}
  >
    <Rocket size={16} />
    🚀 Camino a Master
  </Button>
</div>
```

**Opción B: Floating Action Button**
Ver `INTEGRACION_PATH_TO_MASTER.md` para componente FAB.

**✅ Checklist:**
- [ ] Elegir opción (A o B)
- [ ] Implementar botón
- [ ] Probar navegación

---

### FASE 3: BACKEND (30 min)

#### Paso 12: Modificar generate-project-roles

**Archivo a editar:** `supabase/functions/generate-project-roles/index.ts`

**CAMBIAR DE:**
```typescript
// Asignar roles permanentemente
await supabaseAdmin
  .from('project_members')
  .update({ role: assignment.role })
  .eq('id', pm.id)
```

**A:**
```typescript
// Crear períodos de exploración (Fase 1)
await supabaseAdmin
  .from('role_exploration_periods')
  .insert({
    member_id: assignment.member_id,
    role: assignment.role,
    project_id: project_id,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    duration_days: 7,
  });

// Inicializar phase progress
await supabaseAdmin
  .from('member_phase_progress')
  .upsert({
    member_id: assignment.member_id,
    current_phase: 1,
    phase_1_started_at: new Date().toISOString(),
    roles_explored_phase_1: [assignment.role],
  }, {
    onConflict: 'member_id',
    ignoreDuplicates: false
  });
```

**✅ Checklist:**
- [ ] Editar función
- [ ] Cambiar lógica de asignación
- [ ] Desplegar edge function
- [ ] Probar crear proyecto nuevo

---

#### Paso 13: Crear función de auto-rotación

Ver `IMPLEMENTACION_COMPLETA_GUIA.md` líneas 290-365 para SQL completo.

**✅ Checklist:**
- [ ] Crear función `auto_rotate_to_next_role()`
- [ ] Configurar cron job en Supabase (diario)
- [ ] Verificar que rota roles correctamente

---

#### Paso 14: Renombrar "owner" → "creator"

**Base de datos:**
```sql
ALTER TABLE projects RENAME COLUMN owner_id TO creator_id;

COMMENT ON COLUMN projects.creator_id IS 'Usuario que creó el proyecto (sin privilegios especiales)';
```

**Código frontend:**
Buscar y reemplazar:
- `owner_id` → `creator_id`
- `project_owner` → `project_creator`
- `"Owner"` → `"Creador"`

**✅ Checklist:**
- [ ] Ejecutar SQL de renombrado
- [ ] Buscar/reemplazar en código
- [ ] Verificar que no hay errores
- [ ] Probar UI

---

### FASE 4: TESTING (45 min)

#### Paso 15: Probar flujo completo

**Test 1: Crear proyecto**
1. Crear nuevo proyecto
2. Verificar que crea exploraciones (NO asignaciones permanentes)
3. Ver que usuarios tienen roles temporales

**Test 2: Completar tareas**
1. Completar 3 tareas
2. Verificar que `tasks_completed` se actualiza automáticamente
3. Ver que `tasks_on_time` incrementa si completada antes del deadline

**Test 3: Dar feedback**
1. Dar feedback a otro usuario
2. Verificar que fit score se calcula
3. Ver que aparece en leaderboard

**Test 4: Rotación de roles**
1. Esperar a que termine semana 1
2. Verificar que auto-rotación cambia al siguiente rol
3. Ver notificación

**Test 5: Badges**
1. Completar requisitos de un badge
2. Verificar que se otorga automáticamente
3. Ver notificación

**Test 6: Camino a Master**
1. Ir a tab "Camino a Master"
2. Seleccionar un rol nuevo
3. Iniciar exploración
4. Verificar notificación
5. Completar tareas durante 2 semanas
6. Verificar elegibilidad para desafiar
7. Crear desafío (si cumple requisitos)

**✅ Checklist:**
- [ ] Test 1 pasado
- [ ] Test 2 pasado
- [ ] Test 3 pasado
- [ ] Test 4 pasado
- [ ] Test 5 pasado
- [ ] Test 6 pasado

---

## 🎯 VERIFICACIÓN FINAL

### Base de Datos

```sql
-- 1. Verificar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deberías tener:
-- - role_exploration_periods ✅
-- - member_phase_progress ✅
-- - member_badges ✅
-- - badge_definitions ✅
-- - master_challenges ✅
-- - peer_feedback ✅
-- - feedback_summary ✅
-- - user_insights (modificada) ✅

-- 2. Verificar vistas
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- Deberías tener:
-- - role_leaderboard ✅
-- - role_insights ✅
-- - path_to_master_active ✅
-- - member_feedback_overview ✅

-- 3. Verificar funciones
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';

-- Deberías tener:
-- - calculate_fit_score ✅
-- - start_path_to_master ✅
-- - can_challenge_master ✅
-- - extend_exploration ✅
-- - auto_rotate_to_next_role ✅

-- 4. Verificar triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Deberías tener al menos 10 triggers ✅

-- 5. Verificar badges predefinidos
SELECT badge_key, badge_name, points_value
FROM badge_definitions
ORDER BY badge_category, points_value DESC;

-- Deberías tener 15 badges ✅
```

### Frontend

**Archivos creados/modificados:**
- [ ] `src/components/exploration/PhaseTimeline.tsx` ✅ (ya existe)
- [ ] `src/components/exploration/BadgesList.tsx` ✅ (ya existe)
- [ ] `src/components/exploration/RoleInsightsPanel.tsx` ✅ (ya existe)
- [ ] `src/components/exploration/PathToMaster.tsx` ✅ (ya existe)
- [ ] `src/components/exploration/ChallengeChecker.tsx` ⏳ (por crear)
- [ ] `src/pages/views/ExplorationDashboard.tsx` ⏳ (modificar)
- [ ] `src/pages/views/MiDesarrolloView.tsx` ⏳ (modificar)
- [ ] `src/pages/views/TeamPerformanceDashboard.tsx` ⏳ (modificar)

---

## 🚀 DEPLOYMENT

### Supabase

1. **Ejecutar SQLs:**
   - Ir a Supabase Dashboard → SQL Editor
   - Ejecutar en orden los 5 SQLs pendientes

2. **Configurar Cron Job:**
   - Ir a Database → Cron Jobs
   - Crear nuevo job:
     - Name: `auto-rotate-roles`
     - Schedule: `0 0 * * *` (diario a medianoche)
     - Command: `SELECT auto_rotate_to_next_role();`

3. **Activar protección:**
   - Ir a Authentication → Settings
   - Activar "Leaked Password Protection"

### Edge Functions

```bash
# Deploy calculate-fit-score
supabase functions deploy calculate-fit-score

# Deploy generate-project-roles (modificada)
supabase functions deploy generate-project-roles
```

### Frontend

```bash
# Build
npm run build

# Deploy (Vercel/Netlify/etc)
vercel deploy --prod
```

---

## 📊 MÉTRICAS DE ÉXITO

Después de implementar, verifica:

1. **Seguridad:**
   - ✅ Solo 1 warning en Supabase (Leaked Password - requiere upgrade)
   - ✅ 10+ triggers funcionando
   - ✅ RLS policies activas y accesibles

2. **Funcionalidad:**
   - ✅ Usuarios pueden explorar 4 roles en Fase 1
   - ✅ Sistema rotación automática funciona
   - ✅ Badges se otorgan automáticamente
   - ✅ Fit scores se calculan correctamente
   - ✅ Leaderboards muestran rankings
   - ✅ "Camino a Master" permite explorar nuevos roles
   - ✅ Verificación de elegibilidad para desafiar funciona

3. **UX:**
   - ✅ Timeline visual muestra progreso
   - ✅ Badges list se ve profesional
   - ✅ Insights conectados con roles
   - ✅ Notificaciones en cada hito
   - ✅ Todos ven todo (transparencia)

---

## 🎉 LISTO PARA PRODUCCIÓN

Cuando completes este checklist, tendrás:

✅ **Sistema de 3 Fases** (6 semanas total)
✅ **Rotación Automática** de roles
✅ **15 Badges** desbloqueables
✅ **Leaderboard** por cada rol
✅ **Sistema de Desafíos** profesional y justo
✅ **Timeline Visual** del progreso
✅ **Notificaciones** automáticas en cada hito
✅ **Insights Conectados** con roles y fit scores
✅ **Tracking Automático** de tasks/OBVs
✅ **Transparencia Total** - Todos ven todo
✅ **Sin "Owners"** - Cultura horizontal
✅ **"Camino a Master"** - Aprendizaje continuo
✅ **Challenge System** - Competencia justa

---

**¿LISTO PARA ARRANCAR? 🚀**

Empieza por Fase 1 (Base de Datos) y sigue en orden.
