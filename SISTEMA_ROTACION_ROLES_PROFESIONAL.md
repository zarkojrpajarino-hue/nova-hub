# 🎯 SISTEMA PROFESIONAL DE ROTACIÓN DE ROLES - NOVA HUB

**Fecha:** 2026-01-29
**Objetivo:** Sistema de exploración de roles, asignación dinámica y fit discovery

---

## 📋 ÍNDICE

1. [Filosofía del Sistema](#filosofía-del-sistema)
2. [Schema de Base de Datos](#schema-de-base-de-datos)
3. [Onboarding Inteligente](#onboarding-inteligente)
4. [Sistema de Exploración](#sistema-de-exploración)
5. [Analytics y Fit Discovery](#analytics-y-fit-discovery)
6. [Flujos de Usuario](#flujos-de-usuario)
7. [Prompts de IA](#prompts-de-ia)
8. [Roadmap de Implementación](#roadmap-de-implementación)

---

## 🧠 FILOSOFÍA DEL SISTEMA

### Principio Central:
**"No hay roles fijos, hay roles en exploración"**

### Objetivos:
1. ✅ **Descubrir el fit real** de cada persona con diferentes roles
2. ✅ **Asignación dinámica** según necesidades del proyecto
3. ✅ **Contexto personalizado** por país, fase, equipo
4. ✅ **Rotación inteligente** basada en resultados
5. ✅ **Data-driven decisions** con analytics de performance

### Estados de una Persona:
- 🔍 **Explorando** (probando roles)
- 📊 **Evaluando** (analizando resultados)
- ✅ **Convergiendo** (encontrando fit)
- 🎯 **Especializado** (expertise confirmado)

---

## 💾 SCHEMA DE BASE DE DATOS

### 1. Actualizar `project_members` (ya existe)

```sql
-- Añadir campos para rotación
ALTER TABLE public.project_members
  ADD COLUMN assignment_type TEXT DEFAULT 'permanent' CHECK (assignment_type IN ('exploration', 'temporary', 'permanent')),
  ADD COLUMN assignment_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN assignment_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN assignment_reason TEXT,
  ADD COLUMN previous_role specialization_role;

CREATE INDEX idx_project_members_assignment_type ON public.project_members(assignment_type);
CREATE INDEX idx_project_members_end_date ON public.project_members(assignment_end_date);
```

### 2. Nueva tabla: `role_exploration_periods`

```sql
-- Períodos de exploración activos
CREATE TABLE IF NOT EXISTS public.role_exploration_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Período
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),

  -- Resultados
  tasks_completed INTEGER DEFAULT 0,
  obvs_completed INTEGER DEFAULT 0,
  collaboration_score DECIMAL(3,2), -- 0.00 a 5.00
  self_rating INTEGER, -- 1 a 5
  team_rating DECIMAL(3,2), -- promedio ratings del equipo

  -- Decisión final
  wants_to_continue BOOLEAN,
  fit_score DECIMAL(3,2), -- calculado por IA
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_role_exploration_member ON public.role_exploration_periods(member_id);
CREATE INDEX idx_role_exploration_status ON public.role_exploration_periods(status);
CREATE INDEX idx_role_exploration_end_date ON public.role_exploration_periods(end_date);
```

### 3. Nueva tabla: `role_preferences`

```sql
-- Preferencias marcadas por el usuario
CREATE TABLE IF NOT EXISTS public.role_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,

  -- Preferencia
  preference_level INTEGER CHECK (preference_level >= 1 AND preference_level <= 5), -- 1=no interesa, 5=muy interesado
  reasons TEXT[], -- Array de razones

  -- Contexto
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  after_exploration_period_id UUID REFERENCES public.role_exploration_periods(id),

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, role)
);

CREATE INDEX idx_role_preferences_member ON public.role_preferences(member_id);
CREATE INDEX idx_role_preferences_level ON public.role_preferences(preference_level);
```

### 4. Nueva tabla: `role_performance_metrics`

```sql
-- Métricas de performance por rol (snapshot histórico)
CREATE TABLE IF NOT EXISTS public.role_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Período
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Métricas cuantitativas
  tasks_assigned INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_on_time INTEGER DEFAULT 0,
  obvs_created INTEGER DEFAULT 0,
  obvs_validated INTEGER DEFAULT 0,

  -- Métricas cualitativas
  collaboration_events INTEGER DEFAULT 0, -- interacciones con equipo
  quality_score DECIMAL(3,2), -- evaluación de calidad de trabajo
  initiative_score DECIMAL(3,2), -- proactividad

  -- Score general
  overall_score DECIMAL(3,2), -- calculado por IA

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_role_performance_member_role ON public.role_performance_metrics(member_id, role);
CREATE INDEX idx_role_performance_period ON public.role_performance_metrics(period_end DESC);
```

### 5. Nueva tabla: `role_rotation_history`

```sql
-- Historial completo de rotaciones
CREATE TABLE IF NOT EXISTS public.role_rotation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Cambio
  from_role specialization_role,
  to_role specialization_role NOT NULL,
  rotation_type TEXT CHECK (rotation_type IN ('manual', 'suggested', 'automatic', 'request')),

  -- Razón
  reason TEXT NOT NULL,
  suggested_by UUID REFERENCES public.members(id), -- quien sugirió el cambio
  approved_by UUID REFERENCES public.members(id), -- quien aprobó

  -- Contexto
  performance_before JSONB, -- snapshot de métricas antes del cambio

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_role_rotation_member ON public.role_rotation_history(member_id);
CREATE INDEX idx_role_rotation_project ON public.role_rotation_history(project_id);
```

### 6. Actualizar `projects` para onboarding extendido

```sql
-- Añadir contexto de onboarding
ALTER TABLE public.projects
  ADD COLUMN country TEXT, -- país donde emprende
  ADD COLUMN target_markets TEXT[], -- mercados objetivo
  ADD COLUMN mobility_plan TEXT, -- plan de movilidad/expansión
  ADD COLUMN team_size_current INTEGER DEFAULT 0,
  ADD COLUMN team_size_needed INTEGER,
  ADD COLUMN has_existing_team BOOLEAN DEFAULT false,
  ADD COLUMN onboarding_data JSONB; -- data completa del onboarding

CREATE INDEX idx_projects_country ON public.projects(country);
```

---

## 🎯 ONBOARDING INTELIGENTE

### Flujo de Onboarding (Multi-step)

#### PASO 1: Información Básica del Proyecto
```typescript
interface BasicProjectInfo {
  nombre: string;
  descripcion: string;
  fase: 'ideacion' | 'validacion' | 'desarrollo' | 'lanzamiento' | 'escalado';
}
```

#### PASO 2: Contexto Geográfico y de Mercado
```typescript
interface GeographicContext {
  country: string; // País principal
  city?: string;
  targetMarkets: string[]; // Mercados objetivo
  mobilityPlan?: string; // Plan de expansión/viajes
  hasInternationalAspiration: boolean;
}
```

#### PASO 3: Situación del Equipo
```typescript
interface TeamSituation {
  hasExistingTeam: boolean;
  currentTeamSize: number;

  // Si tiene equipo
  existingMembers?: {
    memberId: string;
    role?: specialization_role;
    responsibilities?: string;
  }[];

  // Si no tiene equipo
  neededRoles?: {
    role: specialization_role;
    quantity: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}
```

#### PASO 4: Necesidades Específicas
```typescript
interface SpecificNeeds {
  mainChallenges: string[]; // Principales desafíos
  urgentNeeds: string[]; // Necesidades urgentes
  resources: {
    budget?: string;
    time?: string;
    network?: string;
  };
  expectations: string; // Qué esperan lograr
}
```

### Prompt para IA - Análisis de Onboarding

```typescript
const ONBOARDING_ANALYSIS_PROMPT = `
Eres un consultor experto en equipos de startups y asignación de roles.

Analiza el siguiente proyecto y genera:
1. Roles necesarios con justificación
2. Cantidad de personas por rol
3. Prioridad de cada rol
4. Sugerencias de asignación de miembros disponibles
5. Plan de exploración de roles

CONTEXTO DEL PROYECTO:
Nombre: {nombre}
Fase: {fase}
País: {country}
Mercados objetivo: {targetMarkets}
Plan de movilidad: {mobilityPlan}

EQUIPO:
- Tiene equipo: {hasExistingTeam}
- Tamaño actual: {currentTeamSize}
- Miembros existentes: {existingMembers}

NECESIDADES:
- Desafíos principales: {mainChallenges}
- Necesidades urgentes: {urgentNeeds}

MIEMBROS DISPONIBLES:
{availableMembers.map(m => \`- \${m.nombre} (experiencia en: \${m.previousRoles})\`)}

GENERA (JSON):
{
  "rolesNeeded": [
    {
      "role": "marketing",
      "quantity": 2,
      "priority": "high",
      "justification": "Por qué se necesita este rol",
      "responsibilities": ["Responsabilidad 1", "Responsabilidad 2"],
      "suggestedMembers": ["memberId1", "memberId2"],
      "explorationPeriod": "2 semanas"
    }
  ],
  "teamStructure": {
    "total": 7,
    "breakdown": "Explicación de la estructura"
  },
  "explorationPlan": {
    "phase1": "Qué hacer en las primeras 2 semanas",
    "rotationStrategy": "Estrategia de rotación sugerida"
  },
  "contextualAdvice": "Consejos específicos según país/fase/mercado"
}
`;
```

---

## 🔄 SISTEMA DE EXPLORACIÓN

### Fase 1: Asignación Inicial (Semana 0)

**Proceso:**
1. Proyecto completa onboarding
2. IA sugiere roles y asignaciones
3. Owner del proyecto revisa y aprueba
4. Se crean `role_exploration_periods` para cada asignación
5. Período por defecto: **2 semanas**

**SQL de Asignación:**
```sql
-- Crear período de exploración
INSERT INTO public.role_exploration_periods (
  member_id, role, project_id, end_date, status
) VALUES (
  'member-uuid',
  'marketing',
  'project-uuid',
  NOW() + INTERVAL '2 weeks',
  'active'
);

-- Asignar en project_members
INSERT INTO public.project_members (
  project_id, member_id, role, assignment_type, assignment_end_date, assignment_reason
) VALUES (
  'project-uuid',
  'member-uuid',
  'marketing',
  'exploration',
  NOW() + INTERVAL '2 weeks',
  'Exploración inicial - IA sugirió fit basado en onboarding'
);
```

### Fase 2: Exploración Activa (Semanas 1-2)

**Durante la exploración:**

1. **Tracking automático:**
   - Tareas completadas
   - OBVs creados/validados
   - Interacciones con equipo
   - Tiempo invertido

2. **Check-in Mid-Period (Día 7):**
   - Popup: "¿Cómo va tu exploración del rol Marketing?"
   - Rating 1-5
   - ¿Qué te gusta?
   - ¿Qué no te gusta?
   - ¿Quieres continuar?

3. **Feedback del equipo:**
   - Otros miembros pueden dar feedback
   - "¿Cómo está performando X en el rol?"

### Fase 3: Evaluación Final (Fin de Semana 2)

**Proceso:**
1. **Auto-evaluación:**
   ```typescript
   interface SelfEvaluation {
     enjoyment: number; // 1-5
     confidence: number; // 1-5
     wantsToContinue: boolean;
     strengths: string[];
     challenges: string[];
     notes: string;
   }
   ```

2. **IA calcula Fit Score:**
   ```typescript
   const fitScore = calculateFitScore({
     tasksCompletionRate: 0.8,
     qualityScore: 4.2,
     collaborationScore: 4.5,
     selfRating: 4,
     teamRating: 4.3,
     enjoyment: 5,
     confidence: 4
   });
   // Resultado: 4.3/5.0
   ```

3. **Decisión:**
   - **Fit Score >= 4.0** → Sugerir continuar (convertir a 'permanent')
   - **Fit Score 3.0-3.9** → Extender 2 semanas más
   - **Fit Score < 3.0** → Sugerir cambio de rol

### Fase 4: Rotación o Permanencia

**Si continúa:**
```sql
UPDATE public.project_members
SET assignment_type = 'permanent',
    assignment_end_date = NULL
WHERE member_id = 'uuid' AND project_id = 'uuid';

UPDATE public.role_exploration_periods
SET status = 'completed',
    fit_score = 4.3,
    wants_to_continue = true
WHERE id = 'period-uuid';
```

**Si rota:**
```sql
-- Crear historial
INSERT INTO public.role_rotation_history (
  member_id, project_id, from_role, to_role, rotation_type, reason
) VALUES (
  'member-uuid',
  'project-uuid',
  'marketing',
  'sales',
  'suggested',
  'Fit score bajo en marketing (2.8). Sugiere probar sales por experiencia previa.'
);

-- Cambiar rol
UPDATE public.project_members
SET role = 'sales',
    assignment_type = 'exploration',
    assignment_start_date = NOW(),
    assignment_end_date = NOW() + INTERVAL '2 weeks',
    previous_role = 'marketing'
WHERE member_id = 'uuid' AND project_id = 'uuid';

-- Nuevo período de exploración
INSERT INTO public.role_exploration_periods (...);
```

---

## 📊 ANALYTICS Y FIT DISCOVERY

### Dashboard de Exploración (Vista de Usuario)

```typescript
interface UserExplorationDashboard {
  currentExplorations: {
    role: string;
    project: string;
    daysRemaining: number;
    progress: {
      tasksCompleted: number;
      tasksTotal: number;
      currentScore: number;
    };
  }[];

  roleHistory: {
    role: string;
    project: string;
    duration: string;
    fitScore: number;
    wouldDoAgain: boolean;
  }[];

  preferences: {
    role: string;
    interest: number; // 1-5
    experience: string;
    lastTried: Date;
  }[];

  recommendations: {
    role: string;
    reason: string;
    matchScore: number;
    basedOn: string[];
  }[];

  convergenceStatus: {
    isConverging: boolean;
    topRoles: string[]; // Roles con mejor fit
    readyToSpecialize: boolean;
  };
}
```

### Vista de Admin/Project Owner

```typescript
interface TeamExplorationOverview {
  activeExplorations: number;
  endingThisWeek: ExplorationPeriod[];
  needsAttention: {
    member: string;
    role: string;
    issue: string;
    action: string;
  }[];

  teamFitMatrix: {
    member: string;
    roles: {
      [role: string]: {
        tried: boolean;
        fitScore?: number;
        interest?: number;
      };
    };
  }[];

  suggestedRotations: {
    member: string;
    from: string;
    to: string;
    reason: string;
    confidence: number;
  }[];
}
```

---

## 🎬 FLUJOS DE USUARIO

### Flujo 1: Nuevo Proyecto con Equipo Existente

1. Owner crea proyecto → Onboarding
2. IA analiza y sugiere: "Tu equipo de 5 necesita estos roles: 1 Marketing, 2 Sales, 1 Finance, 1 Operations"
3. Owner asigna miembros a roles (o acepta sugerencia de IA)
4. Se crean períodos de exploración de 2 semanas
5. Cada miembro recibe notificación: "¡Estás explorando Marketing en Proyecto X por 2 semanas!"
6. Después de 2 semanas → Evaluación → Decisión

### Flujo 2: Nuevo Proyecto sin Equipo (Solo Idea)

1. Owner crea proyecto → Onboarding
2. IA sugiere: "Para validar esta idea en España, necesitas: 1 Customer (sales), 1 Marketing, 1 Operations. Sugerimos a Luis, Angel y Diego"
3. Owner manda invitaciones a esos miembros
4. Al aceptar, entran en exploración
5. Proceso de evaluación igual

### Flujo 3: Usuario Marca Preferencias

1. Usuario va a "Mi Desarrollo" → "Exploración de Roles"
2. Ve grid con todos los roles
3. Marca interés (1-5 estrellas) en cada rol
4. IA usa esto para futuras asignaciones

### Flujo 4: Rotación Sugerida por IA

1. IA detecta: "Zarko lleva 4 semanas en Finance con fit score 3.2, pero tiene alto interés en AI/Tech"
2. Notificación al Owner: "Sugerimos rotar a Zarko de Finance a AI/Tech"
3. Owner aprueba
4. Se crea nuevo período de exploración
5. Zarko recibe: "¡Vas a probar AI/Tech por 2 semanas!"

---

## 🤖 PROMPTS DE IA

### Prompt 1: Análisis de Fit Score

```typescript
const FIT_SCORE_ANALYSIS_PROMPT = `
Analiza el desempeño de un miembro en un rol y calcula un Fit Score (0-5).

DATOS DEL PERÍODO:
- Rol: {role}
- Duración: {duration}
- Tareas completadas: {tasksCompleted}/{tasksAssigned}
- Tareas a tiempo: {tasksOnTime}
- OBVs creados: {obvsCreated}
- OBVs validados: {obvsValidated}
- Colaboración (interacciones): {collaborationEvents}
- Auto-evaluación: {selfRating}/5
- Evaluación del equipo: {teamRating}/5
- ¿Quiere continuar?: {wantsToContinue}

CONTEXTO:
- Experiencia previa en este rol: {previousExperience}
- Otros roles probados: {otherRolesTried}
- Preferencia marcada: {userPreference}/5

CALCULA:
{
  "fitScore": 4.3,
  "breakdown": {
    "performance": 4.5,
    "engagement": 5.0,
    "collaboration": 4.0,
    "growth": 4.2
  },
  "strengths": ["Alta proactividad", "Buena colaboración"],
  "improvements": ["Mejorar timing en entregas"],
  "recommendation": "CONTINUAR",
  "nextSteps": "Asignar proyectos más complejos para desarrollar expertise"
}
`;
```

### Prompt 2: Sugerencia de Rotación

```typescript
const ROTATION_SUGGESTION_PROMPT = `
Analiza si un miembro debería rotar de rol.

MIEMBRO: {memberName}
ROL ACTUAL: {currentRole}
TIEMPO EN ROL: {timeInRole}
FIT SCORE ACTUAL: {currentFitScore}

HISTORIAL:
{roleHistory.map(r => \`- \${r.role}: \${r.fitScore} (\${r.duration})\`)}

PREFERENCIAS:
{preferences.map(p => \`- \${p.role}: \${p.interest}/5\`)}

CONTEXTO DEL PROYECTO:
- Fase: {projectPhase}
- Necesidades actuales: {projectNeeds}
- Roles disponibles: {availableRoles}

¿DEBERÍA ROTAR?
{
  "shouldRotate": true/false,
  "confidence": 0.85,
  "suggestedRole": "sales",
  "reasoning": "Por qué sugerimos este cambio",
  "expectedFitScore": 4.2,
  "timing": "Ahora / En 2 semanas / Cuando termine X",
  "risks": ["Riesgo potencial del cambio"],
  "benefits": ["Beneficio del cambio"]
}
`;
```

### Prompt 3: Recomendaciones Personalizadas

```typescript
const PERSONALIZED_RECOMMENDATIONS_PROMPT = `
Genera recomendaciones personalizadas para ayudar a un miembro a encontrar su rol ideal.

MIEMBRO: {memberName}
ROLES PROBADOS:
{roleHistory.map(r => \`- \${r.role}: fit \${r.fitScore}, disfrutó: \${r.enjoyed}\`)}

ROLES NO PROBADOS: {untriedRoles}

PREFERENCIAS MARCADAS:
{preferences}

PATRONES DETECTADOS:
- Mejor en roles: {topRoles}
- Disfruta más: {enjoyedMost}
- Evita: {avoided}

GENERA:
{
  "topRecommendations": [
    {
      "role": "marketing",
      "matchScore": 0.92,
      "reasoning": "Por qué este rol encajaría bien",
      "basedOn": ["Alto interés", "Skills transferibles de X"],
      "nextStep": "Buscar proyecto que necesite marketing"
    }
  ],
  "rolesWorthExploring": ["Roles que aún debería probar"],
  "convergenceStatus": {
    "isConverging": true,
    "confidence": 0.85,
    "readyToSpecialize": false,
    "recommendedPath": "Probar 2 roles más antes de especializar"
  }
}
`;
```

---

## 🚀 ROADMAP DE IMPLEMENTACIÓN

### FASE 1: Base (1-2 semanas) ✅ YA HECHO
- [x] Schema de base de datos
- [x] Usuarios creados
- [x] Proyecto base funcional

### FASE 2: Onboarding Inteligente (1 semana)
- [ ] Formulario multi-step extendido
- [ ] Integración con Claude para análisis
- [ ] Sugerencias de roles y asignaciones
- [ ] Vista de aprobación para project owner

### FASE 3: Sistema de Exploración (2 semanas)
- [ ] Crear períodos de exploración automáticos
- [ ] Tracking de métricas durante exploración
- [ ] Check-in mid-period (popup/notificación)
- [ ] Evaluación final con fit score
- [ ] Decisión de continuar/rotar

### FASE 4: Analytics y Dashboard (1 semana)
- [ ] Dashboard de exploración para usuarios
- [ ] Vista de gestión para project owners
- [ ] Gráficos de fit por rol
- [ ] Historial de rotaciones
- [ ] Preferencias de roles

### FASE 5: Rotación Inteligente (1 semana)
- [ ] Sugerencias automáticas de rotación
- [ ] Notificaciones de cambios sugeridos
- [ ] Aprobación de rotaciones
- [ ] Historial de rotaciones

### FASE 6: Convergencia y Especialización (1 semana)
- [ ] Sistema de detección de convergencia
- [ ] Recomendaciones personalizadas
- [ ] Estado de "Especialista" cuando se confirma fit
- [ ] Analytics avanzados de equipo

---

## 💡 FEATURES ADICIONALES

### 1. Desafíos entre Roles
```sql
CREATE TABLE role_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_role specialization_role NOT NULL,
  to_role specialization_role NOT NULL,
  challenge_type TEXT, -- 'collaboration', 'handoff', 'shared_goal'
  description TEXT,
  reward_points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Marketplace de Roles
- Miembros pueden "solicitar" probar un rol en un proyecto
- Projects pueden "publicar" necesidad de rol
- Match automático por IA

### 3. Badges y Achievements
- "Explorador" - Probó 5 roles diferentes
- "Especialista" - Fit score >4.5 en un rol por 3 meses
- "Versátil" - Fit score >4.0 en 3 roles diferentes

---

## 🎯 MÉTRICAS DE ÉXITO

### A Nivel de Usuario:
- Número de roles explorados
- Fit score promedio
- Tiempo hasta encontrar fit >4.0
- Satisfacción con el proceso

### A Nivel de Proyecto:
- Tiempo hasta tener equipo completo
- Fit score promedio del equipo
- Tasa de rotación
- Productividad por rol

### A Nivel de Sistema:
- % de usuarios que encuentran fit >4.0
- Tiempo promedio de exploración
- Accuracy de sugerencias de IA
- Satisfacción general

---

## 🔥 NEXT STEPS INMEDIATOS

1. **Ejecutar el SQL del schema extendido** (te lo preparo aparte)
2. **Diseñar el nuevo onboarding** (wireframes)
3. **Implementar tracking de exploración** (hooks + analytics)
4. **Crear prompts de IA** (Claude integration)

---

**¿Quieres que empiece a implementar alguna fase específica?**
