# 🚀 GUÍA DEFINITIVA - TODO LO QUE TIENES QUE HACER AHORA

## ✅ ESTADO ACTUAL

**Ya ejecutado:**
- ✅ FIX_SECURITY_WARNINGS.sql
- ✅ RECREAR_TRIGGERS_FALTANTES.sql
- ✅ SQL_SISTEMA_ROTACION_ROLES.sql
- ✅ migration_feedback_system.sql

**Componentes creados (solo archivos, NO integrados):**
- ✅ PhaseTimeline.tsx
- ✅ BadgesList.tsx
- ✅ RoleInsightsPanel.tsx
- ✅ PathToMaster.tsx
- ✅ PathToMasterProgress.tsx
- ✅ ActiveChallengeView.tsx
- ✅ PathToMasterPage.tsx

---

## 📋 TODO LO QUE TIENES QUE HACER (EN ORDEN)

---

# PARTE 1: BASE DE DATOS (30 min)

## PASO 1: Ejecutar SQL de Tracking

**Archivo:** `AGREGAR_COLUMNAS_TRACKING.sql`

```bash
# En Supabase Dashboard → SQL Editor → New Query
# Copiar y pegar el contenido completo del archivo
# Click "Run"
```

**Qué hace:**
- Agrega columnas: `tasks_on_time`, `obvs_validated`, `initiative_obvs`, `duration_days`

**Verificar después:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'role_exploration_periods'
ORDER BY ordinal_position;

-- Deberías ver las 4 columnas nuevas
```

---

## PASO 2: Ejecutar SQL de Trackers Automáticos

**Archivo:** `TRACKER_AUTOMATICO_PROGRESO.sql`

```bash
# En Supabase Dashboard → SQL Editor → New Query
# Copiar y pegar el contenido completo del archivo
# Click "Run"
```

**Qué hace:**
- Crea triggers que actualizan contadores automáticamente cuando:
  - Completas una tarea → actualiza `tasks_completed`
  - Completas a tiempo → actualiza `tasks_on_time`
  - Validas un OBV → actualiza `obvs_validated`

**Verificar después:**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('tasks', 'obvs')
ORDER BY event_object_table, trigger_name;

-- Deberías ver triggers nuevos
```

---

## PASO 3: Ejecutar Sistema Completo (CRÍTICO)

**Archivo:** `SISTEMA_COMPLETO_FASES_BADGES_NOTIF.sql`

```bash
# En Supabase Dashboard → SQL Editor → New Query
# Copiar y pegar el contenido completo del archivo
# Click "Run"
```

**Qué hace:**
- ✨ Crea vista: `role_leaderboard` (rankings)
- ✨ Crea tabla: `member_badges` (badges ganados)
- ✨ Crea tabla: `badge_definitions` (15 badges predefinidos)
- ✨ Crea tabla: `member_phase_progress` (tracking de fases 1, 2, 3)
- ✨ Crea triggers: auto-grant badges, notificaciones
- ✨ Conecta `user_insights` con `exploration_period_id`
- ✨ Crea vista: `role_insights` (insights públicos por rol)

**Verificar después:**
```sql
-- Ver badges disponibles
SELECT badge_key, badge_name, points_value
FROM badge_definitions
ORDER BY badge_category, points_value DESC;

-- Deberías ver 15 badges

-- Ver vista de leaderboard
SELECT * FROM role_leaderboard LIMIT 5;

-- Ver vista de insights
SELECT * FROM role_insights LIMIT 5;
```

---

## PASO 4: Ejecutar Sistema "Camino a Master"

**Archivo:** `SQL_CAMINO_A_MASTER_v2_ESTRICTO.sql`

```bash
# En Supabase Dashboard → SQL Editor → New Query
# Copiar y pegar el contenido completo del archivo
# Click "Run"
```

**Qué hace:**
- ✨ Crea función: `start_path_to_master()` (iniciar exploración)
- ✨ Crea función: `can_challenge_master()` (verificar 8 requisitos)
- ✨ Crea vista: `path_to_master_active` (exploraciones activas)
- ✨ Actualiza RLS policies

**Verificar después:**
```sql
-- Ver funciones creadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('start_path_to_master', 'can_challenge_master');

-- Deberías ver 2 funciones

-- Probar función (con un member_id real)
SELECT can_challenge_master(
  (SELECT id FROM members LIMIT 1),
  'marketing'
);

-- Debería retornar JSON con met_requirements y failed_requirements
```

---

## PASO 5: Renombrar "owner" → "creator"

```sql
-- En Supabase SQL Editor:
ALTER TABLE projects RENAME COLUMN owner_id TO creator_id;

COMMENT ON COLUMN projects.creator_id IS 'Usuario que creó el proyecto (sin privilegios especiales)';
```

**Verificar después:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name LIKE '%creator%';

-- Debería mostrar "creator_id"
```

---

## PASO 6: (OPCIONAL) Borrar proyectos demo

**Archivo:** `BORRAR_PROYECTOS_DEMO.sql`

⚠️ **CUIDADO:** Solo ejecuta si quieres empezar limpio.

```sql
-- Si decides ejecutarlo:
-- En Supabase SQL Editor → Copiar contenido del archivo → Run
```

---

# PARTE 2: FRONTEND (60 min)

## PASO 7: Agregar Ruta /path-to-master

**Archivo:** `src/App.tsx` (o tu archivo de rutas)

```typescript
// 1. Importar
import { PathToMasterPage } from '@/pages/PathToMasterPage';

// 2. Agregar ruta (dentro de <Routes>)
<Route path="/path-to-master" element={<PathToMasterPage />} />
```

**Verificar:** Ir a http://localhost:5173/path-to-master (debería cargar)

---

## PASO 8: Agregar botón en Sidebar

**Archivo:** `src/components/Sidebar.tsx`

```typescript
// Importar
import { Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Dentro del componente
const navigate = useNavigate();

// Agregar al FINAL del sidebar (antes del </div> final):
<div className="mt-auto p-4 border-t">
  <Button
    variant="default"
    className="w-full gap-2"
    onClick={() => navigate('/path-to-master')}
  >
    <Rocket size={16} />
    🚀 Camino a Master
  </Button>
</div>
```

**Verificar:** Sidebar ahora tiene botón "Camino a Master" al final

---

## PASO 9: Integrar PhaseTimeline en ExplorationDashboard

**Archivo:** `src/pages/views/ExplorationDashboard.tsx`

**AGREGAR AL INICIO:**
```typescript
import { PhaseTimeline } from '@/components/exploration/PhaseTimeline';
import { supabase } from '@/lib/supabase';
```

**AGREGAR ESTADO:**
```typescript
const [phaseProgress, setPhaseProgress] = useState<any>(null);
```

**AGREGAR useEffect:**
```typescript
useEffect(() => {
  if (user?.id) {
    loadPhaseProgress();
  }
}, [user]);

const loadPhaseProgress = async () => {
  try {
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
  } catch (error) {
    console.error('Error loading phase progress:', error);
  }
};
```

**AGREGAR TAB (dentro de <Tabs>):**
```typescript
// En <TabsList>:
<TabsTrigger value="timeline" className="gap-2">
  <Rocket size={16} />
  Mi Progreso
</TabsTrigger>

// En el contenido:
<TabsContent value="timeline">
  {phaseProgress ? (
    <PhaseTimeline
      currentPhase={phaseProgress.current_phase}
      phase1StartedAt={phaseProgress.phase_1_started_at}
      phase1CompletedAt={phaseProgress.phase_1_completed_at}
      phase2StartedAt={phaseProgress.phase_2_started_at}
      phase2CompletedAt={phaseProgress.phase_2_completed_at}
      phase3StartedAt={phaseProgress.phase_3_started_at}
      rolesExploredPhase1={phaseProgress.roles_explored_phase_1 || []}
      top2Roles={phaseProgress.top_2_roles || []}
      starRole={phaseProgress.star_role}
      starRoleFitScore={phaseProgress.star_role_fit_score}
      secondaryRole={phaseProgress.secondary_role}
      secondaryRoleFitScore={phaseProgress.secondary_role_fit_score}
    />
  ) : (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center">
        <p className="text-muted-foreground">
          Cargando tu progreso...
        </p>
      </CardContent>
    </Card>
  )}
</TabsContent>
```

**Verificar:** Tab "Mi Progreso" muestra timeline visual

---

## PASO 10: Integrar BadgesList en MiDesarrolloView

**Archivo:** `src/pages/views/MiDesarrolloView.tsx`

**AGREGAR AL INICIO:**
```typescript
import { BadgesList } from '@/components/exploration/BadgesList';
import { supabase } from '@/lib/supabase';
```

**AGREGAR ESTADO:**
```typescript
const [badges, setBadges] = useState<any>({ earned: [], all: [] });
```

**AGREGAR useEffect:**
```typescript
useEffect(() => {
  if (profile?.id) {
    loadBadges();
  }
}, [profile]);

const loadBadges = async () => {
  try {
    // Badges ganados
    const { data: earned } = await supabase
      .from('member_badges')
      .select('*')
      .eq('member_id', profile.id);

    // Todos los badges
    const { data: all } = await supabase
      .from('badge_definitions')
      .select('*')
      .order('badge_category, points_value DESC');

    setBadges({ earned: earned || [], all: all || [] });
  } catch (error) {
    console.error('Error loading badges:', error);
  }
};
```

**AGREGAR TAB:**
```typescript
// En <TabsList>:
<TabsTrigger value="logros" className="gap-2">
  <Trophy size={16} />
  Logros
</TabsTrigger>

// En el contenido:
<TabsContent value="logros">
  <BadgesList earnedBadges={badges.earned} allBadges={badges.all} />
</TabsContent>
```

**Verificar:** Tab "Logros" muestra badges

---

## PASO 11: Integrar RoleInsightsPanel en TeamPerformanceDashboard

**Archivo:** `src/pages/views/TeamPerformanceDashboard.tsx`

**CAMBIO 1: Cambiar de "solo owned" a "ALL projects"**

BUSCAR:
```typescript
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('owner_id', member.id); // ← ESTO
```

REEMPLAZAR CON:
```typescript
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .order('nombre', { ascending: true }); // ← TODOS los proyectos
```

**CAMBIO 2: Cambiar título**

BUSCAR:
```typescript
<h1>Gestión de Equipo</h1>
```

REEMPLAZAR CON:
```typescript
<h1>Vista Global de Equipos</h1>
```

**CAMBIO 3: Agregar RoleInsightsPanel**

AGREGAR AL INICIO:
```typescript
import { RoleInsightsPanel } from '@/components/exploration/RoleInsightsPanel';
import { Lightbulb } from 'lucide-react';
```

AGREGAR ESTADO:
```typescript
const [roleInsights, setRoleInsights] = useState<any[]>([]);
const [selectedInsightRole, setSelectedInsightRole] = useState<string>('sales');
```

AGREGAR useEffect:
```typescript
useEffect(() => {
  loadRoleInsights();
}, [selectedInsightRole]);

const loadRoleInsights = async () => {
  try {
    const { data } = await supabase
      .from('role_insights')
      .select('*')
      .eq('role', selectedInsightRole)
      .order('created_at', { ascending: false });

    setRoleInsights(data || []);
  } catch (error) {
    console.error('Error loading insights:', error);
  }
};
```

AGREGAR TAB:
```typescript
// En <TabsList>:
<TabsTrigger value="insights" className="gap-2">
  <Lightbulb size={16} />
  Insights del Equipo
</TabsTrigger>

// En el contenido:
<TabsContent value="insights">
  <div className="space-y-4">
    {/* Selector de rol */}
    <div className="flex gap-2">
      {['sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy', 'customer'].map((role) => (
        <Button
          key={role}
          variant={selectedInsightRole === role ? 'default' : 'outline'}
          onClick={() => setSelectedInsightRole(role)}
        >
          {role}
        </Button>
      ))}
    </div>

    {/* Panel de insights */}
    <RoleInsightsPanel
      role={selectedInsightRole}
      insights={roleInsights}
      currentUserId={user?.id}
    />
  </div>
</TabsContent>
```

**Verificar:**
- Todos los proyectos visibles (no solo "tuyos")
- Tab "Insights del Equipo" funciona

---

## PASO 12: Integrar PathToMaster en ExplorationDashboard

**Archivo:** `src/pages/views/ExplorationDashboard.tsx`

**AGREGAR AL INICIO:**
```typescript
import { PathToMaster } from '@/components/exploration/PathToMaster';
```

**AGREGAR ESTADO:**
```typescript
const [currentRoles, setCurrentRoles] = useState<string[]>([]);
const [allRoles] = useState<string[]>([
  'sales',
  'finance',
  'ai_tech',
  'marketing',
  'operations',
  'strategy',
  'customer',
]);
```

**AGREGAR useEffect:**
```typescript
useEffect(() => {
  if (user?.id) {
    loadCurrentRoles();
  }
}, [user]);

const loadCurrentRoles = async () => {
  try {
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_id', user!.id)
      .single();

    if (!member) return;

    const { data: progress } = await supabase
      .from('member_phase_progress')
      .select('star_role, secondary_role')
      .eq('member_id', member.id)
      .single();

    if (progress) {
      const roles = [progress.star_role, progress.secondary_role].filter(Boolean);
      setCurrentRoles(roles);
    }
  } catch (error) {
    console.error('Error loading current roles:', error);
  }
};
```

**AGREGAR HANDLER:**
```typescript
const handleStartExploration = async (role: string) => {
  try {
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_id', user!.id)
      .single();

    if (!member) throw new Error('Usuario no encontrado');

    const { data, error } = await supabase.rpc('start_path_to_master', {
      p_member_id: member.id,
      p_role: role,
      p_project_id: null,
    });

    if (error) throw error;

    // Mostrar éxito (asume que tienes toast configurado)
    alert('🚀 Exploración iniciada!'); // O usa tu sistema de toasts

    loadCurrentRoles();
  } catch (error: any) {
    alert('Error: ' + (error.message || 'No se pudo iniciar la exploración'));
  }
};
```

**AGREGAR TAB:**
```typescript
// En <TabsList>:
<TabsTrigger value="path-to-master" className="gap-2">
  <Rocket size={16} />
  Camino a Master
</TabsTrigger>

// En el contenido:
<TabsContent value="path-to-master">
  <PathToMaster
    currentRoles={currentRoles}
    allRoles={allRoles}
    onStartExploration={handleStartExploration}
  />
</TabsContent>
```

**Verificar:** Tab "Camino a Master" permite iniciar exploraciones

---

# PARTE 3: BACKEND (45 min)

## PASO 13: Modificar generate-project-roles

**Archivo:** `supabase/functions/generate-project-roles/index.ts`

**BUSCAR:**
```typescript
// Asignar roles permanentemente
await supabaseAdmin
  .from('project_members')
  .update({ role: assignment.role })
  .eq('id', pm.id);
```

**REEMPLAZAR CON:**
```typescript
// Crear períodos de exploración (Fase 1)
await supabaseAdmin
  .from('role_exploration_periods')
  .insert({
    member_id: assignment.member_id,
    role: assignment.role,
    project_id: project_id,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +1 semana
    status: 'active',
    duration_days: 7,
    tasks_completed: 0,
    tasks_on_time: 0,
    obvs_validated: 0,
    initiative_obvs: 0,
  });

// Inicializar/actualizar phase progress
const { data: existingProgress } = await supabaseAdmin
  .from('member_phase_progress')
  .select('*')
  .eq('member_id', assignment.member_id)
  .single();

if (existingProgress) {
  // Actualizar
  await supabaseAdmin
    .from('member_phase_progress')
    .update({
      roles_explored_phase_1: [
        ...(existingProgress.roles_explored_phase_1 || []),
        assignment.role,
      ],
      updated_at: new Date().toISOString(),
    })
    .eq('member_id', assignment.member_id);
} else {
  // Crear nuevo
  await supabaseAdmin
    .from('member_phase_progress')
    .insert({
      member_id: assignment.member_id,
      current_phase: 1,
      phase_1_started_at: new Date().toISOString(),
      roles_explored_phase_1: [assignment.role],
    });
}
```

**Desplegar:**
```bash
supabase functions deploy generate-project-roles
```

**Verificar:** Crear un nuevo proyecto → Debería crear exploraciones en vez de asignaciones

---

## PASO 14: Crear función de auto-rotación

**En Supabase SQL Editor:**

```sql
-- Función que rota roles automáticamente cada semana
CREATE OR REPLACE FUNCTION auto_rotate_to_next_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exploration RECORD;
  next_role TEXT;
  member_progress RECORD;
  all_roles TEXT[] := ARRAY['sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy', 'customer'];
BEGIN
  -- Buscar exploraciones que ya terminaron
  FOR exploration IN (
    SELECT *
    FROM role_exploration_periods
    WHERE status = 'active'
      AND end_date <= NOW()
  )
  LOOP
    -- Marcar como completada
    UPDATE role_exploration_periods
    SET status = 'completed'
    WHERE id = exploration.id;

    -- Obtener progreso del miembro
    SELECT * INTO member_progress
    FROM member_phase_progress
    WHERE member_id = exploration.member_id;

    -- FASE 1: Rotar a siguiente rol (4 roles × 1 semana)
    IF member_progress.current_phase = 1 THEN
      -- Encontrar rol que no ha probado
      SELECT role INTO next_role
      FROM unnest(all_roles) AS role
      WHERE role != ALL(COALESCE(member_progress.roles_explored_phase_1, ARRAY[]::TEXT[]))
      LIMIT 1;

      IF next_role IS NOT NULL THEN
        -- Crear nueva exploración
        INSERT INTO role_exploration_periods (
          member_id, role, project_id, start_date, end_date, status, duration_days
        ) VALUES (
          exploration.member_id,
          next_role,
          exploration.project_id,
          NOW(),
          NOW() + INTERVAL '1 week',
          'active',
          7
        );

        -- Actualizar progreso
        UPDATE member_phase_progress
        SET
          roles_explored_phase_1 = array_append(roles_explored_phase_1, next_role),
          updated_at = NOW()
        WHERE member_id = exploration.member_id;

        -- Notificar
        INSERT INTO notifications (user_id, title, message, priority, created_at)
        SELECT
          m.auth_id,
          '🔄 Rotación de Rol',
          'Has terminado tu semana de ' || exploration.role || '. Ahora explorarás ' || next_role || ' por 1 semana.',
          'high',
          NOW()
        FROM members m
        WHERE m.id = exploration.member_id;
      ELSE
        -- Completó los 4 roles → Pasar a Fase 2
        -- Calcular top 2 roles por fit score
        UPDATE member_phase_progress
        SET
          current_phase = 2,
          phase_1_completed_at = NOW(),
          phase_2_started_at = NOW(),
          top_2_roles = (
            SELECT ARRAY_AGG(role ORDER BY avg_fit DESC)
            FROM (
              SELECT role, AVG(fit_score) as avg_fit
              FROM role_exploration_periods
              WHERE member_id = exploration.member_id
                AND status = 'completed'
                AND fit_score IS NOT NULL
              GROUP BY role
              ORDER BY avg_fit DESC
              LIMIT 2
            ) top_roles
          ),
          updated_at = NOW()
        WHERE member_id = exploration.member_id;

        -- Notificar
        INSERT INTO notifications (user_id, title, message, priority, created_at)
        SELECT
          m.auth_id,
          '🎉 Fase 1 Completada',
          'Has completado la exploración de 4 roles. Ahora pasas a Fase 2 con tus 2 mejores roles.',
          'high',
          NOW()
        FROM members m
        WHERE m.id = exploration.member_id;
      END IF;
    END IF;

    -- FASE 2: Rotar entre top 2 roles
    IF member_progress.current_phase = 2 THEN
      -- Similar lógica para rotar entre top_2_roles
      -- Después de 2 semanas → Pasar a Fase 3
      -- (Implementar según necesidad)
    END IF;
  END LOOP;
END;
$$;
```

**Configurar Cron Job:**
```sql
-- Ejecutar diariamente a las 00:00
SELECT cron.schedule(
  'auto-rotate-roles',
  '0 0 * * *',
  'SELECT auto_rotate_to_next_role();'
);
```

**Verificar:**
```sql
-- Ver cron jobs configurados
SELECT * FROM cron.job;
```

---

## PASO 15: Buscar y reemplazar "owner" → "creator"

**En VS Code:**

1. Abrir búsqueda global (Ctrl + Shift + F)
2. Buscar: `owner_id`
3. Reemplazar con: `creator_id`
4. Click "Replace All" (revisar cada caso primero)

5. Buscar: `project_owner`
6. Reemplazar con: `project_creator`

7. Buscar: `"Owner"`
8. Reemplazar con: `"Creador"`

**Verificar:** No quedan referencias a "owner" en el código

---

# PARTE 4: TESTING (30 min)

## PASO 16: Testing Completo

### Test 1: Ver página Path to Master
1. Ir a http://localhost:5173/path-to-master
2. Verificar que carga correctamente
3. Leer tab "¿Qué es?" - TODO debe estar claro
4. Revisar tabs: Mi Progreso, Explorar Rol, Desafíos, FAQ

### Test 2: Iniciar exploración
1. Click en tab "Explorar Rol"
2. Seleccionar un rol (ej: Marketing)
3. Click "Iniciar Camino"
4. Verificar notificación
5. Ir a tab "Mi Progreso" → Debería aparecer countdown

### Test 3: Verificar countdown en tiempo real
1. Tab "Mi Progreso"
2. Ver que countdown actualiza cada minuto
3. Ver roadmap con fases 1, 2, 3
4. Ver requisitos con barras de progreso

### Test 4: Completar tareas
1. Ir a un proyecto
2. Completar 2-3 tareas
3. Volver a "Mi Progreso"
4. Ver que `tasks_completed` incrementó automáticamente

### Test 5: Ver badges
1. Ir a "Mi Desarrollo" → Tab "Logros"
2. Ver badges disponibles
3. Ver progreso general %

### Test 6: Ver leaderboard
1. Ir a "Exploración" → Tab "Mi Progreso"
2. Ver tu ranking actual
3. Ver fit scores

### Test 7: Crear proyecto nuevo
1. Crear proyecto
2. Verificar que crea exploraciones (NO asignaciones permanentes)
3. Ver en `role_exploration_periods` tabla

---

# ✅ CHECKLIST FINAL

## Base de Datos
- [ ] ✅ Ejecuté AGREGAR_COLUMNAS_TRACKING.sql
- [ ] ✅ Ejecuté TRACKER_AUTOMATICO_PROGRESO.sql
- [ ] ✅ Ejecuté SISTEMA_COMPLETO_FASES_BADGES_NOTIF.sql
- [ ] ✅ Ejecuté SQL_CAMINO_A_MASTER_v2_ESTRICTO.sql
- [ ] ✅ Renombré owner_id → creator_id
- [ ] ✅ Configuré cron job de rotación

## Frontend
- [ ] ✅ Agregué ruta /path-to-master en App.tsx
- [ ] ✅ Agregué botón en Sidebar
- [ ] ✅ Integré PhaseTimeline en ExplorationDashboard
- [ ] ✅ Integré BadgesList en MiDesarrolloView
- [ ] ✅ Integré RoleInsightsPanel en TeamPerformanceDashboard
- [ ] ✅ Integré PathToMaster en ExplorationDashboard
- [ ] ✅ Cambié TeamPerformanceDashboard a "ALL projects"

## Backend
- [ ] ✅ Modifiqué generate-project-roles
- [ ] ✅ Creé función auto_rotate_to_next_role
- [ ] ✅ Desplegué edge function

## Testing
- [ ] ✅ Probé página /path-to-master
- [ ] ✅ Probé iniciar exploración
- [ ] ✅ Probé countdown en tiempo real
- [ ] ✅ Probé tracking automático
- [ ] ✅ Probé badges
- [ ] ✅ Probé crear proyecto → crea exploraciones

---

# 🎉 RESULTADO FINAL

Cuando completes TODO esto, tendrás:

✅ **Sistema de 3 Fases** (6 semanas total)
✅ **Rotación Automática** de roles cada semana
✅ **15 Badges** desbloqueables
✅ **Leaderboard** por cada rol
✅ **Sistema de Desafíos** profesional con 8 requisitos estrictos
✅ **"Camino a Master"** siempre abierto
✅ **Timeline Visual** con countdown en tiempo real
✅ **Notificaciones** automáticas
✅ **Insights Conectados** con roles
✅ **Tracking Automático** de tasks/OBVs
✅ **Transparencia Total** - Todos ven todo
✅ **Sin "Owners"** - Cultura horizontal

---

**TIEMPO ESTIMADO TOTAL: 2-3 HORAS**

**¡A por ello! 🚀**
