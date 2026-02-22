# 🎯 SISTEMA PROFESIONAL DE FEEDBACK Y EVALUACIÓN DE ROLES - NOVA HUB

**Fecha:** 2026-01-31
**Metodologías Base:** 360° Feedback, OKRs, Google's Project Oxygen, Netflix Culture, Holocracy
**Objetivo:** Sistema completo de evaluación, feedback y asignación de roles basado en datos objetivos y subjetivos

---

## 📋 ÍNDICE

1. [Respuestas a tus Preguntas Clave](#respuestas-a-tus-preguntas-clave)
2. [Sistema de Evaluación Actual vs. Nuevo](#sistema-de-evaluación)
3. [Sistema de Feedback 360°](#sistema-de-feedback-360)
4. [Proceso de Exploración y Competencia](#proceso-de-exploración)
5. [Asignación Final de Roles](#asignación-final-de-roles)
6. [Schema de Base de Datos](#schema-de-base-de-datos)
7. [Implementación Paso a Paso](#implementación)

---

## 🔑 RESPUESTAS A TUS PREGUNTAS CLAVE

### 1. ¿Qué se tiene en cuenta AHORA para valorar a una persona en un rol?

**Sistema Actual (según `SISTEMA_ROTACION_ROLES_PROFESIONAL.md`):**

#### Métricas Objetivas (70% del score):
- ✅ **Tareas completadas** vs. asignadas (25%)
- ✅ **Tareas a tiempo** (20%)
- ✅ **OBVs creados** (10%)
- ✅ **OBVs validados** (15%)

#### Métricas Subjetivas (30% del score):
- ⚠️ **Auto-evaluación** del miembro (1-5) (15%)
- ⚠️ **Evaluación del equipo** (promedio) (15%)

**PROBLEMA:** El "evaluación del equipo" no está bien definido. Solo es un promedio genérico.

---

### 2. ¿Cuánto tiempo dura la exploración de roles?

**RESPUESTA:**
- **Período estándar:** 2 semanas (14 días)
- **Período extendido:** 4 semanas (si fit score entre 3.0-3.9)
- **Período acelerado:** 1 semana (para roles urgentes)

**JUSTIFICACIÓN:**
- 2 semanas es suficiente para completar un ciclo completo de tareas
- Permite interactuar con todo el equipo
- No es tan largo que genere frustración
- Basado en sprints ágiles (1-2 semanas)

---

### 3. ¿Qué pasa DESPUÉS de la exploración?

**3 ESCENARIOS:**

#### Escenario A: **Fit Score Alto (≥4.0)**
- ✅ Se asigna el rol de forma **permanente**
- El miembro continúa en ese rol
- `assignment_type = 'permanent'`

#### Escenario B: **Fit Score Medio (3.0-3.9)**
- ⚠️ Se extiende 2 semanas más
- Se hace coaching/mentoring
- Se revisa al final de la extensión

#### Escenario C: **Fit Score Bajo (<3.0)**
- 🔄 Se sugiere cambio de rol
- IA recomienda nuevo rol basado en:
  - Preferencias del usuario
  - Resultados en otros roles (si probó antes)
  - Necesidades del proyecto

---

### 4. ¿Si dos usuarios empatan en la evaluación?

**SOLUCIÓN - Sistema de Desempate Profesional:**

#### Paso 1: **Revisar Métricas Específicas**
Si dos usuarios tienen el mismo Fit Score (ej: ambos 4.2), se compara:

1. **Colaboración Score** (mayor gana)
2. **Feedback del equipo** (mayor promedio gana)
3. **Iniciativa** (quién creó más OBVs propios)
4. **Senority/Experiencia previa** en el rol

#### Paso 2: **Roles Múltiples**
Si el empate persiste:

**AMBOS pueden tener el mismo rol de especialización**
👉 **SÍ, MÚLTIPLES USUARIOS PUEDEN TENER EL MISMO ROL**

**¿Por qué esto es bueno?**
- En empresas reales, hay múltiples "Senior Engineers", "Product Managers", etc.
- Fomenta mentoría entre pares
- Permite equipos más grandes

**Ejemplo Real:**
- Google: 1000+ Software Engineers
- Netflix: 50+ Product Designers

---

### 5. ¿Dos usuarios pueden tener la misma especialización?

**RESPUESTA: SÍ, TOTALMENTE VÁLIDO** ✅

**En Nova Hub:**
- **9 usuarios** pueden tener cualquier combinación de roles
- **NO es necesario** 9 roles diferentes
- **ES MEJOR** que múltiples personas compartan rol si encajan bien

**Ejemplos de distribución saludable:**

#### Opción 1: Startup Tech (10 personas)
- 4 x AI/Tech (desarrollo)
- 2 x Marketing
- 2 x Sales/Customer
- 1 x Finance
- 1 x Operations

#### Opción 2: Startup Marketing (10 personas)
- 5 x Marketing
- 2 x Sales
- 1 x Finance
- 1 x Operations
- 1 x AI/Tech

**CONCLUSIÓN:** La distribución debe ser **orgánica**, basada en:
- Necesidades reales de los proyectos
- Fit real de los usuarios
- No forzar 1 rol por persona

---

### 6. ¿Pueden aparecer roles nuevos para proyectos nuevos?

**RESPUESTA: SÍ, ROLES DINÁMICOS** ✅

#### Sistema de Roles Dinámicos:

**Roles Predefinidos (Core):**
```typescript
enum CoreRoles {
  SALES = 'sales',
  FINANCE = 'finance',
  AI_TECH = 'ai_tech',
  MARKETING = 'marketing',
  OPERATIONS = 'operations',
  STRATEGY = 'strategy',
  CUSTOMER = 'customer'
}
```

**Roles Personalizados (por proyecto):**
```typescript
// Tabla: custom_project_roles
{
  project_id: UUID,
  role_name: string,         // Ej: "UX Designer", "Community Manager"
  responsibilities: string[],
  created_by_ai: boolean,    // ¿Fue sugerido por IA?
  based_on_core_role: CoreRole // Hereda de un rol core
}
```

**Ejemplo:**
1. Proyecto nuevo: "App de Fitness"
2. IA analiza y sugiere:
   - "UX Designer" (basado en `marketing`)
   - "Community Manager" (basado en `marketing`)
   - "Data Analyst" (basado en `ai_tech`)
3. Owner del proyecto aprueba
4. Usuarios pueden explorar estos nuevos roles

---

### 7. ¿Cómo se compite entre roles si hay 5 proyectos y 3 usuarios tienen el mismo rol en proyectos diferentes?

**ESCENARIO:**
- **Proyecto A:** Usuario 1 es "Marketing"
- **Proyecto B:** Usuario 2 es "Marketing"
- **Proyecto C:** Usuario 3 es "Marketing"

**¿Compiten entre ellos?**

#### RESPUESTA: **NO COMPITEN DIRECTAMENTE** ❌

**¿Por qué?**
Porque cada proyecto tiene sus propias métricas, contexto y necesidades.

**Sistema de Evaluación:**
- Cada usuario es evaluado **dentro de su proyecto**
- No se comparan entre proyectos diferentes
- Se comparan **solo si están en el mismo proyecto**

#### Competencia DENTRO del Mismo Proyecto:

**ESCENARIO 2:**
- **Proyecto A:** Usuario 1 es "Marketing" y Usuario 2 es "Marketing"

Aquí **SÍ compiten** para ver quién se queda con el rol permanente:

1. Ambos hacen período de exploración (2 semanas)
2. Se miden con las mismas métricas
3. Se comparan Fit Scores
4. **Opciones:**
   - Uno tiene score mayor → Se queda ese
   - Empate → Ambos se quedan (roles compartidos)
   - Ambos bajo score → Se rotan a otros roles

---

## 📊 SISTEMA DE EVALUACIÓN COMPLETO

### Componentes de Evaluación (100% Total)

#### 1. Métricas Objetivas - 50%

| Métrica | Peso | Cómo se mide |
|---------|------|--------------|
| **Tarea Completion Rate** | 15% | Tareas completadas / Tareas asignadas |
| **Tareas On-Time** | 15% | Tareas a tiempo / Tareas completadas |
| **OBVs Creados** | 5% | Cantidad de OBVs propios creados |
| **OBVs Validados** | 10% | OBVs validados / OBVs creados |
| **Iniciativa** | 5% | OBVs creados sin que se los asignen |

#### 2. Feedback de Pares (360°) - 30%

| Métrica | Peso | Cómo se mide |
|---------|------|--------------|
| **Colaboración** | 10% | Promedio de ratings en "colaboración" |
| **Calidad de Trabajo** | 10% | Promedio de ratings en "calidad" |
| **Comunicación** | 5% | Promedio de ratings en "comunicación" |
| **Liderazgo/Iniciativa** | 5% | Promedio de ratings en "liderazgo" |

#### 3. Auto-Evaluación - 10%

| Métrica | Peso | Cómo se mide |
|---------|------|--------------|
| **Confianza en el rol** | 5% | Self-rating 1-5 |
| **Disfrute del rol** | 5% | Self-rating 1-5 |

#### 4. Evaluación del Project Owner - 10%

| Métrica | Peso | Cómo se mide |
|---------|------|--------------|
| **Fit con el proyecto** | 5% | Rating del owner 1-5 |
| **Impacto en resultados** | 5% | Rating del owner 1-5 |

**TOTAL:** 100%

---

## 🔄 SISTEMA DE FEEDBACK 360° (PEER REVIEW)

### ¿Qué es Feedback 360°?

**Metodología usada por:**
- Google (Project Oxygen)
- Meta (Facebook)
- Netflix
- Amazon (Leadership Principles)

**Principio:** Cada persona es evaluada por:
- Sus pares (compañeros del proyecto)
- Su manager (project owner)
- A sí misma (auto-evaluación)

### Implementación en Nova Hub

#### Períodos de Feedback:

**Mid-Exploration (Día 7):**
- Feedback informal
- Check-in rápido
- "¿Cómo va X en el rol?"

**End-Exploration (Día 14):**
- Feedback formal y estructurado
- Evaluación completa
- Se guarda en historial

#### Formulario de Feedback (Peer Review)

```typescript
interface PeerFeedback {
  // Metadata
  from_member_id: UUID;      // Quién da el feedback
  to_member_id: UUID;        // A quién evalúa
  project_id: UUID;          // En qué proyecto
  role_evaluated: specialization_role; // Qué rol evalúa
  exploration_period_id: UUID; // Período de exploración

  // Ratings (1-5 cada uno)
  collaboration_rating: number;    // ¿Qué tan bien colabora?
  quality_rating: number;          // ¿Calidad de su trabajo?
  communication_rating: number;    // ¿Qué tan bien se comunica?
  initiative_rating: number;       // ¿Toma iniciativa?
  technical_skills_rating: number; // ¿Skills técnicas del rol?

  // Comentarios
  strengths: string;         // ¿Qué hace bien?
  improvements: string;      // ¿Qué puede mejorar?
  would_work_again: boolean; // ¿Trabajarías con X otra vez?

  // Metadata
  is_anonymous: boolean;     // ¿Anónimo o público?
  created_at: timestamp;
}
```

#### Categorías de Evaluación (basadas en Google's Project Oxygen)

**1. Colaboración (Collaboration)**
- "¿Qué tan bien trabaja en equipo?"
- "¿Comparte conocimiento?"
- "¿Ayuda a otros?"

**2. Calidad de Trabajo (Quality)**
- "¿Su trabajo cumple estándares?"
- "¿Es detallista?"
- "¿Entrega trabajo completo?"

**3. Comunicación (Communication)**
- "¿Se comunica claramente?"
- "¿Responde a tiempo?"
- "¿Escucha activamente?"

**4. Iniciativa/Liderazgo (Initiative)**
- "¿Propone ideas nuevas?"
- "¿Toma ownership?"
- "¿Resuelve problemas sin que se lo pidan?"

**5. Skills Técnicas (Technical Skills)**
- "¿Tiene las habilidades para el rol?"
- "¿Aprende rápido?"
- "¿Ejecuta bien las tareas?"

---

## 🏆 PROCESO DE EXPLORACIÓN Y COMPETENCIA

### Timeline Completo (2 Semanas)

#### **Día 0: Asignación Inicial**

**Proceso:**
1. Proyecto completa onboarding
2. IA sugiere roles necesarios
3. Owner asigna miembros a roles
4. Se crean períodos de exploración

**Si hay competencia (2+ usuarios en mismo rol):**
- Ambos entran en exploración
- Se les notifica: "Estás compitiendo con X por el rol Y"
- Se explican las métricas de evaluación

---

#### **Días 1-6: Exploración Activa (Semana 1)**

**Actividades:**
- Usuarios completan tareas asignadas
- Crean OBVs
- Colaboran con equipo
- Sistema registra automáticamente métricas

**Tracking Automático:**
```sql
-- Se actualiza automáticamente cuando completan tareas
UPDATE role_exploration_periods
SET tasks_completed = tasks_completed + 1
WHERE member_id = '...' AND status = 'active';
```

---

#### **Día 7: Mid-Period Check-in**

**Popup/Notificación:**
```
🔍 Mid-Exploration Check-in: Marketing

¿Cómo va tu exploración del rol Marketing?

1. ¿Cómo te sientes en este rol? (1-5) ⭐⭐⭐⭐⭐
2. ¿Qué te está gustando?
3. ¿Qué te resulta difícil?
4. ¿Quieres continuar? [Sí] [No] [No estoy seguro]

[Enviar]
```

**Feedback de Pares (Informal):**
"Dale feedback rápido a tus compañeros:"
- 👍 Buen trabajo | 💬 Necesita mejorar

---

#### **Días 8-13: Exploración Activa (Semana 2)**

- Continúan tareas
- Se ajustan basándose en feedback del día 7
- Colaboración intensiva

---

#### **Día 14: Evaluación Final**

**Paso 1: Auto-Evaluación**

Formulario para el usuario:
```
🎯 Auto-Evaluación Final: Marketing

1. ¿Qué tan seguro te sientes en este rol? (1-5)
2. ¿Cuánto disfrutaste este rol? (1-5)
3. ¿Qué hiciste bien?
4. ¿Qué mejorarías?
5. ¿Quieres continuar en este rol? [Sí] [No]
```

**Paso 2: Peer Feedback (360°)**

Cada miembro del proyecto recibe:
```
💬 Evalúa a tus compañeros

Evalúa a Juan en su rol de Marketing:

Colaboración: ⭐⭐⭐⭐⭐
Calidad: ⭐⭐⭐⭐⭐
Comunicación: ⭐⭐⭐⭐⭐
Iniciativa: ⭐⭐⭐⭐⭐
Skills: ⭐⭐⭐⭐⭐

¿Qué hace bien Juan?
[Textarea]

¿Qué puede mejorar?
[Textarea]

¿Trabajarías con Juan otra vez? [Sí] [No]

[Enviar de forma anónima] [Enviar con mi nombre]
```

**Paso 3: Owner Evaluation**

El owner del proyecto evalúa:
```
👤 Evalúa a Juan (Marketing)

1. ¿Qué tan bien encaja en el proyecto? (1-5)
2. ¿Qué impacto tuvo en resultados? (1-5)
3. Comentarios adicionales
```

**Paso 4: IA Calcula Fit Score**

```typescript
function calculateFitScore(data: ExplorationData): number {
  const objective = (
    (data.tasks_completed / data.tasks_assigned) * 0.15 +
    (data.tasks_on_time / data.tasks_completed) * 0.15 +
    (data.obvs_created / 5) * 0.05 +
    (data.obvs_validated / data.obvs_created) * 0.10 +
    (data.initiative_obvs / 3) * 0.05
  );

  const peer = (
    (data.peer_collaboration / 5) * 0.10 +
    (data.peer_quality / 5) * 0.10 +
    (data.peer_communication / 5) * 0.05 +
    (data.peer_initiative / 5) * 0.05
  );

  const self = (
    (data.self_confidence / 5) * 0.05 +
    (data.self_enjoyment / 5) * 0.05
  );

  const owner = (
    (data.owner_fit / 5) * 0.05 +
    (data.owner_impact / 5) * 0.05
  );

  return (objective + peer + self + owner) * 5; // Scale to 0-5
}
```

---

#### **Día 15: Decisión y Asignación**

**Dashboard de Resultados:**

```
📊 Resultados de Exploración: Proyecto Alpha

ROL: MARKETING

┌─────────────┬────────────┬──────────┬────────────┬────────────┐
│ Usuario     │ Fit Score  │ Objetivo │ Peer (360) │ Decisión   │
├─────────────┼────────────┼──────────┼────────────┼────────────┤
│ Juan        │ 4.3 ⭐⭐⭐⭐ │ 4.5      │ 4.2        │ ✅ Asignar │
│ María       │ 3.8 ⭐⭐⭐  │ 4.0      │ 3.5        │ 🔄 Extender│
└─────────────┴────────────┴──────────┴────────────┴────────────┘

ROL: AI/TECH

┌─────────────┬────────────┬──────────┬────────────┬────────────┐
│ Usuario     │ Fit Score  │ Objetivo │ Peer (360) │ Decisión   │
├─────────────┼────────────┼──────────┼────────────┼────────────┤
│ Carlos      │ 4.5 ⭐⭐⭐⭐ │ 4.7      │ 4.3        │ ✅ Asignar │
│ Ana         │ 4.4 ⭐⭐⭐⭐ │ 4.6      │ 4.2        │ ✅ Asignar │
│             │            │          │            │ (EMPATE)   │
└─────────────┴────────────┴──────────┴────────────┴────────────┘

🎯 Acción Recomendada:
- Juan → Marketing (permanente)
- María → Extender 2 semanas en Marketing
- Carlos y Ana → AMBOS en AI/Tech (roles compartidos)
```

---

## 🎓 ASIGNACIÓN FINAL DE ROLES

### Sistema de Decisiones

#### Caso 1: **Score Alto (≥4.0) - Sin Competencia**
```sql
UPDATE project_members
SET assignment_type = 'permanent',
    assignment_end_date = NULL
WHERE member_id = '...' AND project_id = '...';

UPDATE role_exploration_periods
SET status = 'completed',
    fit_score = 4.3,
    wants_to_continue = true
WHERE id = '...';

-- Insertar en historial
INSERT INTO role_rotation_history (...)
VALUES (..., 'exploration_completed', 'Fit score alto, asignación permanente');
```

#### Caso 2: **Empate (Scores Similares)**

**Escenario:** Carlos (4.5) vs Ana (4.4) en AI/Tech

**Opciones:**

**Opción A: Roles Compartidos (RECOMENDADO)** ✅
```sql
-- Ambos se quedan
UPDATE project_members
SET assignment_type = 'permanent'
WHERE member_id IN ('carlos-id', 'ana-id')
  AND project_id = 'project-id';

-- Marcar como "shared role"
UPDATE project_members
SET metadata = jsonb_set(metadata, '{shared_role}', 'true')
WHERE ...;
```

**Beneficios:**
- Ambos contribuyen
- Mentoría entre pares
- Redundancia (si uno sale, el otro continúa)
- Equipos más fuertes

**Opción B: Desempate por Criterios Secundarios**
```typescript
if (carlos.fitScore === ana.fitScore) {
  // 1. Mayor peer rating
  if (carlos.peerAvg > ana.peerAvg) return carlos;

  // 2. Mayor iniciativa
  if (carlos.initiative > ana.initiative) return carlos;

  // 3. Experiencia previa
  if (carlos.previousRolesFit > ana.previousRolesFit) return carlos;

  // 4. Preferencia del owner
  return ownerChoice;
}
```

#### Caso 3: **Score Bajo (<3.0)**
```sql
-- Marcar exploración como completada
UPDATE role_exploration_periods
SET status = 'completed',
    fit_score = 2.8,
    notes = 'Fit bajo, se recomienda cambio de rol'
WHERE id = '...';

-- IA sugiere nuevo rol
SELECT suggest_new_role('member-id', 'current-role', 'project-id');

-- Notificar al usuario
INSERT INTO notifications (user_id, type, message)
VALUES ('...', 'role_rotation_suggested',
  'Tu exploración de Marketing finalizó. Te sugerimos probar Sales basado en tus fortalezas.');
```

---

## 💾 SCHEMA DE BASE DE DATOS ACTUALIZADO

### Nueva Tabla: `peer_feedback`

```sql
CREATE TABLE IF NOT EXISTS public.peer_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Metadata
  from_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  to_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_evaluated specialization_role NOT NULL,
  exploration_period_id UUID REFERENCES public.role_exploration_periods(id) ON DELETE CASCADE,

  -- Ratings (1-5)
  collaboration_rating INTEGER CHECK (collaboration_rating >= 1 AND collaboration_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  initiative_rating INTEGER CHECK (initiative_rating >= 1 AND initiative_rating <= 5),
  technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),

  -- Comentarios
  strengths TEXT,
  improvements TEXT,
  would_work_again BOOLEAN,

  -- Configuración
  is_anonymous BOOLEAN DEFAULT false,
  feedback_type TEXT DEFAULT 'end_exploration' CHECK (feedback_type IN ('mid_exploration', 'end_exploration', 'ongoing')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: No autoevaluarse con peer feedback
  CHECK (from_member_id != to_member_id),

  -- Unique: Solo un feedback por persona por período
  UNIQUE(from_member_id, to_member_id, exploration_period_id)
);

CREATE INDEX idx_peer_feedback_to_member ON public.peer_feedback(to_member_id);
CREATE INDEX idx_peer_feedback_exploration ON public.peer_feedback(exploration_period_id);
CREATE INDEX idx_peer_feedback_project ON public.peer_feedback(project_id);
```

### Actualizar Tabla: `role_exploration_periods`

```sql
-- Añadir campos de feedback
ALTER TABLE public.role_exploration_periods
  ADD COLUMN IF NOT EXISTS peer_feedback_avg DECIMAL(3,2),           -- Promedio de peer feedback
  ADD COLUMN IF NOT EXISTS peer_feedback_count INTEGER DEFAULT 0,    -- Cantidad de feedbacks recibidos
  ADD COLUMN IF NOT EXISTS owner_fit_rating INTEGER,                 -- Rating del owner (1-5)
  ADD COLUMN IF NOT EXISTS owner_impact_rating INTEGER,              -- Rating de impacto (1-5)
  ADD COLUMN IF NOT EXISTS owner_comments TEXT,                      -- Comentarios del owner
  ADD COLUMN IF NOT EXISTS initiative_obvs INTEGER DEFAULT 0,        -- OBVs creados por iniciativa propia
  ADD COLUMN IF NOT EXISTS competing_with UUID[],                    -- Array de IDs de usuarios con quienes compite
  ADD COLUMN IF NOT EXISTS is_shared_role BOOLEAN DEFAULT false,     -- ¿Es rol compartido?
  ADD COLUMN IF NOT EXISTS final_decision TEXT CHECK (final_decision IN ('assigned', 'extended', 'rotated', 'removed'));
```

### Nueva Tabla: `role_competition_results`

```sql
-- Guardar resultados de competencias entre usuarios
CREATE TABLE IF NOT EXISTS public.role_competition_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,

  -- Participantes
  participants UUID[] NOT NULL,  -- Array de member_ids

  -- Resultados
  winners UUID[],                -- Quiénes ganaron (puede ser > 1 en empates)
  fit_scores JSONB,              -- { "member-id": 4.3, "member-id-2": 4.1 }
  decision_type TEXT CHECK (decision_type IN ('clear_winner', 'shared_role', 'extended_all', 'rotated_all')),

  -- Razón
  decision_reason TEXT,
  decided_by UUID REFERENCES public.members(id), -- Project owner

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_role_competition_project ON public.role_competition_results(project_id);
```

---

## 🚀 IMPLEMENTACIÓN PASO A PASO

### FASE 1: Schema y Backend (Semana 1)

#### 1.1 Ejecutar SQL
```sql
-- Archivo: migration_feedback_system.sql
-- Crear tabla peer_feedback
-- Actualizar role_exploration_periods
-- Crear role_competition_results
-- Políticas RLS
-- Grants
```

#### 1.2 Funciones de Cálculo (Edge Functions)

**Función: `calculate-fit-score`**
```typescript
// supabase/functions/calculate-fit-score/index.ts

export async function calculateFitScore(explorationPeriodId: string) {
  // 1. Obtener métricas objetivas
  const objective = await getObjectiveMetrics(explorationPeriodId);

  // 2. Obtener peer feedback (promedio)
  const peerFeedback = await getPeerFeedbackAverage(explorationPeriodId);

  // 3. Obtener auto-evaluación
  const selfEval = await getSelfEvaluation(explorationPeriodId);

  // 4. Obtener evaluación del owner
  const ownerEval = await getOwnerEvaluation(explorationPeriodId);

  // 5. Calcular score final (fórmula de arriba)
  const fitScore = (
    objective * 0.5 +
    peerFeedback * 0.3 +
    selfEval * 0.1 +
    ownerEval * 0.1
  );

  // 6. Actualizar en DB
  await supabase
    .from('role_exploration_periods')
    .update({ fit_score: fitScore })
    .eq('id', explorationPeriodId);

  return fitScore;
}
```

**Función: `suggest-role-rotation`**
```typescript
// Analiza fit scores y sugiere rotaciones
export async function suggestRotation(memberId: string) {
  const history = await getRoleHistory(memberId);
  const preferences = await getRolePreferences(memberId);
  const currentFit = await getCurrentFitScore(memberId);

  // Llamar a Claude AI
  const suggestion = await callClaude({
    prompt: ROTATION_SUGGESTION_PROMPT,
    data: { history, preferences, currentFit }
  });

  return suggestion;
}
```

---

### FASE 2: UI de Feedback (Semana 2)

#### 2.1 Componente: `PeerFeedbackForm.tsx`

```typescript
// src/components/feedback/PeerFeedbackForm.tsx

export function PeerFeedbackForm({
  toMember,
  explorationPeriod
}: Props) {
  const [ratings, setRatings] = useState({
    collaboration: 0,
    quality: 0,
    communication: 0,
    initiative: 0,
    technical: 0
  });

  const [comments, setComments] = useState({
    strengths: '',
    improvements: ''
  });

  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async () => {
    await supabase.from('peer_feedback').insert({
      from_member_id: currentUser.id,
      to_member_id: toMember.id,
      project_id: project.id,
      role_evaluated: explorationPeriod.role,
      exploration_period_id: explorationPeriod.id,
      collaboration_rating: ratings.collaboration,
      quality_rating: ratings.quality,
      communication_rating: ratings.communication,
      initiative_rating: ratings.initiative,
      technical_skills_rating: ratings.technical,
      strengths: comments.strengths,
      improvements: comments.improvements,
      is_anonymous: isAnonymous
    });

    toast.success('Feedback enviado');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evalúa a {toMember.nombre} en {explorationPeriod.role}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Ratings */}
          <RatingInput
            label="Colaboración"
            value={ratings.collaboration}
            onChange={(v) => setRatings({...ratings, collaboration: v})}
          />

          {/* ... más ratings ... */}

          {/* Comentarios */}
          <Textarea
            label="¿Qué hace bien?"
            value={comments.strengths}
            onChange={(e) => setComments({...comments, strengths: e.target.value})}
          />

          <Textarea
            label="¿Qué puede mejorar?"
            value={comments.improvements}
            onChange={(e) => setComments({...comments, improvements: e.target.value})}
          />

          {/* Anónimo */}
          <Checkbox
            checked={isAnonymous}
            onChange={setIsAnonymous}
            label="Enviar feedback de forma anónima"
          />

          <Button onClick={handleSubmit}>Enviar Feedback</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 2.2 Vista: `ExplorationDashboard.tsx`

```typescript
// src/pages/views/ExplorationDashboard.tsx

export function ExplorationDashboard() {
  const { user } = useAuth();
  const { data: explorations } = useQuery({
    queryKey: ['my-explorations'],
    queryFn: () => supabase
      .from('role_exploration_periods')
      .select('*')
      .eq('member_id', user.id)
      .eq('status', 'active')
  });

  return (
    <div>
      <h1>Mi Exploración de Roles</h1>

      {explorations.map(exp => (
        <ExplorationCard key={exp.id} exploration={exp}>
          {/* Mostrar progreso */}
          <ProgressBar
            current={exp.tasks_completed}
            total={exp.tasks_assigned}
          />

          {/* Mostrar días restantes */}
          <CountdownTimer endDate={exp.end_date} />

          {/* Mostrar fit score actual */}
          <FitScoreGauge score={exp.fit_score || 0} />

          {/* Botón de auto-evaluación */}
          {daysRemaining <= 0 && (
            <Button onClick={() => openSelfEvaluation(exp.id)}>
              Completar Auto-Evaluación
            </Button>
          )}
        </ExplorationCard>
      ))}

      {/* Solicitar feedback a pares */}
      <PeerFeedbackRequests />
    </div>
  );
}
```

---

### FASE 3: Sistema de Competencia (Semana 3)

#### 3.1 Lógica de Competencia

```typescript
// src/utils/roleCompetition.ts

export async function startRoleCompetition(params: {
  projectId: string;
  role: string;
  memberIds: string[];
}) {
  // 1. Crear exploration periods para todos
  const periods = await Promise.all(
    params.memberIds.map(memberId =>
      supabase.from('role_exploration_periods').insert({
        member_id: memberId,
        role: params.role,
        project_id: params.projectId,
        end_date: addWeeks(new Date(), 2),
        competing_with: params.memberIds.filter(id => id !== memberId),
        status: 'active'
      })
    )
  );

  // 2. Notificar a todos
  await Promise.all(
    params.memberIds.map(memberId =>
      createNotification({
        user_id: memberId,
        type: 'role_competition_started',
        title: 'Competencia de Rol Iniciada',
        message: `Estás compitiendo por el rol de ${params.role} con ${params.memberIds.length - 1} personas más.`
      })
    )
  );

  return periods;
}

export async function resolveCompetition(params: {
  projectId: string;
  role: string;
}) {
  // 1. Obtener todos los participantes
  const participants = await getCompetitionParticipants(params);

  // 2. Calcular fit scores
  const scores = await Promise.all(
    participants.map(async (p) => ({
      memberId: p.member_id,
      fitScore: await calculateFitScore(p.id),
      peerAvg: p.peer_feedback_avg
    }))
  );

  // 3. Ordenar por score
  const sorted = scores.sort((a, b) => b.fitScore - a.fitScore);

  // 4. Detectar empates
  const topScore = sorted[0].fitScore;
  const winners = sorted.filter(s => Math.abs(s.fitScore - topScore) < 0.1);

  // 5. Decisión
  let decision: string;
  if (winners.length === 1) {
    decision = 'clear_winner';
  } else if (winners.length > 1) {
    decision = 'shared_role';
  }

  // 6. Guardar resultado
  await supabase.from('role_competition_results').insert({
    project_id: params.projectId,
    role: params.role,
    participants: sorted.map(s => s.memberId),
    winners: winners.map(w => w.memberId),
    fit_scores: Object.fromEntries(sorted.map(s => [s.memberId, s.fitScore])),
    decision_type: decision,
    decision_reason: generateDecisionReason(decision, scores)
  });

  return { winners, decision, scores };
}
```

---

## 📈 MÉTRICAS Y ANALYTICS

### Dashboard para Project Owners

```typescript
// src/pages/views/TeamPerformanceDashboard.tsx

export function TeamPerformanceDashboard() {
  return (
    <div>
      <h1>Performance del Equipo</h1>

      {/* Tabla de exploraciones activas */}
      <ExplorationTable />

      {/* Matriz de Fit por Rol */}
      <RoleFitMatrix />

      {/* Historial de Feedback */}
      <FeedbackHistoryChart />

      {/* Sugerencias de IA */}
      <AIRecommendations />
    </div>
  );
}
```

**Vista de Matriz:**
```
┌──────────┬─────────┬──────────┬─────────┬──────────┐
│ Usuario  │ Sales   │ Marketing│ AI/Tech │ Finance  │
├──────────┼─────────┼──────────┼─────────┼──────────┤
│ Juan     │ 3.2 ⭐⭐ │ 4.5 ⭐⭐⭐│ N/A     │ N/A      │
│ María    │ 4.8 ⭐⭐ │ N/A      │ 3.1 ⭐⭐ │ N/A      │
│ Carlos   │ N/A     │ N/A      │ 4.7 ⭐⭐ │ 2.8 ⭐   │
└──────────┴─────────┴──────────┴─────────┴──────────┘

Recomendación IA:
✅ Juan → Marketing (permanente)
✅ María → Sales (permanente)
✅ Carlos → AI/Tech (permanente)
🔄 Carlos probó Finance pero no encajó, mantener en AI/Tech
```

---

## 🎯 RESUMEN EJECUTIVO

### Sistema Completo de Evaluación:

**50% Métricas Objetivas:**
- Tareas completadas/asignadas
- Tareas a tiempo
- OBVs creados/validados
- Iniciativa propia

**30% Feedback 360° (Peer Review):**
- Colaboración (10%)
- Calidad (10%)
- Comunicación (5%)
- Liderazgo (5%)

**10% Auto-Evaluación:**
- Confianza en el rol
- Disfrute del rol

**10% Evaluación del Owner:**
- Fit con proyecto
- Impacto en resultados

### Proceso de Exploración:

1. **Día 0:** Asignación inicial
2. **Días 1-6:** Exploración activa (tracking automático)
3. **Día 7:** Mid-check-in
4. **Días 8-13:** Exploración activa
5. **Día 14:** Evaluación final (auto + peer + owner)
6. **Día 15:** Cálculo de Fit Score y decisión

### Decisiones Finales:

- **Score ≥4.0:** Asignación permanente
- **Score 3.0-3.9:** Extender 2 semanas
- **Score <3.0:** Rotar a otro rol
- **Empate:** Roles compartidos (ambos se quedan)

### Roles:

- ✅ Múltiples usuarios pueden tener el mismo rol
- ✅ Roles nuevos pueden aparecer según necesidad de proyectos
- ✅ No es necesario 9 roles únicos para 9 personas
- ✅ Distribución orgánica basada en fit real

### Competencia:

- Solo compiten usuarios en el **mismo proyecto y mismo rol**
- No compiten usuarios en proyectos diferentes
- Empates se resuelven con roles compartidos o criterios secundarios

---

## 📝 PRÓXIMOS PASOS

### Para Implementar:

1. **SQL Migration** - Crear tablas nuevas
2. **Edge Functions** - Cálculo de fit score
3. **UI Components** - Formularios de feedback
4. **Dashboard** - Vista de exploración y competencia
5. **Notificaciones** - Sistema de recordatorios

**¿Quieres que empiece a implementar alguna parte específica?**

---

**Basado en metodologías de:**
- Google's Project Oxygen
- Netflix Culture (Freedom & Responsibility)
- Holocracy (Dynamic Roles)
- OKRs (Objective & Key Results)
- 360° Feedback (Multi-rater Assessment)
