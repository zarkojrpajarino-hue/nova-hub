# 📚 GUÍA COMPLETA DE FUNCIONAMIENTO - NOVA HUB

## 🎯 TABLA DE CONTENIDOS

1. [Dashboard](#1-dashboard)
2. [Mi Espacio](#2-mi-espacio)
3. [Mi Desarrollo](#3-mi-desarrollo)
4. [Rankings](#4-rankings)
5. [Masters](#5-masters)
6. [Rotación de Roles](#6-rotacion-de-roles)
7. [Sistema de Validaciones - PROFUNDO](#7-sistema-de-validaciones)
8. [Sistema de Notificaciones](#8-sistema-de-notificaciones)
9. [Generador de Tareas IA - REAL](#9-generador-de-tareas-ia)
10. [Mejoras Propuestas](#10-mejoras-propuestas)

---

## 1. DASHBOARD

### ¿Qué es?

El **Dashboard** es la vista principal que ves al entrar a NOVA. Es tu **centro de control personal** con:
- Tus métricas del mes actual
- Alertas inteligentes
- Validaciones pendientes
- Actividad reciente
- Ranking del equipo

### Secciones del Dashboard

#### 1.1 StatCards (Métricas Personales)

**6 tarjetas con tus KPIs principales:**

```typescript
// Datos que muestra:
{
  obvs: 24,              // OBVs validadas este mes
  lps: 12,               // Learning Points
  bps: 45,               // Book Points
  cps: 30,               // Community Points
  facturacion: 15000,    // € facturados
  margen: 7500           // € de margen
}
```

**Cada tarjeta muestra:**
- Valor actual
- Objetivo personal (ej: 150 OBVs/semestre)
- Progress bar (% completado)
- Color distintivo

**Ejemplo visual:**
```
┌─────────────────────┐
│ OBVs                │
│ 24 / 150            │
│ ████░░░░░░ 16%      │
└─────────────────────┘
```

#### 1.2 Weekly Evolution Chart

**Gráfico de líneas** que muestra tu evolución semanal en:
- OBVs
- Learning Points
- Book Points
- Community Points

**Datos:**
- Últimas 4-6 semanas
- Comparativa con semanas anteriores
- Tendencia (subiendo/bajando)

#### 1.3 Smart Alerts Widget

**Sistema de alertas inteligentes** que analiza tu actividad y te avisa:

**Tipos de alertas:**

1. **🔴 Críticas** (rojas):
   - "Llevas 7 días sin crear OBVs"
   - "Tienes 5 validaciones vencidas"
   - "Tu margen bajó a 35% (mínimo 40%)"

2. **🟡 Advertencias** (amarillas):
   - "3 leads sin próxima acción programada"
   - "Facturas vencidas: €2,000"
   - "Sin actividad en proyecto X esta semana"

3. **🟢 Informativas** (verdes):
   - "¡Has alcanzado tu objetivo mensual!"
   - "Nueva posición en rankings: #2"
   - "Tu equipo validó 5 de tus OBVs"

**Algoritmo de generación:**
```typescript
// Analiza:
- días_sin_obvs: si > 5 → alerta
- validaciones_pendientes: si > 3 → alerta
- margen_promedio: si < 40% → alerta
- leads_sin_accion: si > 2 → alerta
- facturas_vencidas: si > 0 → alerta crítica
```

#### 1.4 Pending Validations Widget

**Lista de OBVs esperando tu validación:**

```
┌───────────────────────────────────┐
│ Validaciones Pendientes (3)      │
├───────────────────────────────────┤
│ ✅ Venta €5,000 - Luis            │
│ ✅ Learning Path - Ángel          │
│ ✅ Community Event - Diego        │
└───────────────────────────────────┘
```

**Click en una OBV:**
- Abre modal con detalles completos
- Botones: "✅ Aprobar" | "❌ Rechazar"
- Campo de comentario opcional

#### 1.5 Top Rankings Widget

**Ranking mensual del equipo:**

```
🏆 TOP 5 FACTURACIÓN
───────────────────
🥇 Luis    - €25,000
🥈 Ángel   - €22,500
🥉 Diego   - €20,000
4. Zarko   - €18,500
5. Manuel  - €17,000
```

**Categorías:**
- Facturación
- Márgenes
- OBVs
- Learning Points

#### 1.6 Recent Activity Feed

**Feed de actividad reciente del equipo:**

```
📝 Luis creó OBV "Venta StartupX"        hace 2h
✅ Ángel validó tu OBV "Learning Path"   hace 4h
🎯 Diego completó tarea "Diseño MVP"     hace 1d
💰 Miguel facturó €3,000                 hace 2d
```

---

## 2. MI ESPACIO

### ¿Qué es?

**Tu área personal** donde ves TODO lo tuyo:
- Tus KPIs actualizados
- Tus proyectos
- Tus tareas pendientes
- Tus roles por proyecto

### Secciones de Mi Espacio

#### 2.1 Mis KPIs

**Grid de 6 StatCards** con tus métricas:
- OBVs, LPs, BPs, CPs, Facturación, Margen
- Botón "Editar KPIs" (KPIBaseEditor)
  - Permite ajustar objetivos personales
  - Cambiar metas semestrales

#### 2.2 Mis Proyectos

**Lista de proyectos donde participas:**

```typescript
interface UserProject {
  nombre: string;
  rol: string;           // Tu rol en este proyecto
  color: string;
  icon: string;
  stats: {
    obvs: number;        // OBVs del proyecto
    leads: number;       // Leads activos
    facturacion: number;
  };
}
```

**Ejemplo visual:**
```
┌─────────────────────────────────────────┐
│ 💻 TechVerse                            │
│ Tu rol: Product Owner                   │
│ 12 OBVs · 5 Leads · €15,000           │
│ [Ver Proyecto →]                        │
└─────────────────────────────────────────┘
```

**Click en proyecto:**
- Navega a `/proyecto/:projectId`

#### 2.3 Mis Tareas

**Kanban personal** con TODAS tus tareas de TODOS tus proyectos:

**3 columnas:**
- **To Do** (por hacer)
- **In Progress** (en curso) ← Tú estás trabajando en estas
- **Done** (completadas)

**Filtros:**
- Por proyecto
- Por prioridad
- Por fecha límite

**Cada tarea muestra:**
- Título
- Descripción
- Proyecto (badge con color)
- Prioridad (1-5)
- Fecha límite
- Playbook (si tiene)

#### 2.4 Botón "Nueva Tarea Personal"

**TaskForm** para crear tareas manuales:
- Título
- Descripción
- Proyecto al que pertenece
- Prioridad
- Fecha límite

#### 2.5 Mis Roles en Proyectos

**Lista de roles activos:**

```
TechVerse     → Product Owner    (desde 01/09/2025)
BrightPath    → Marketing Lead   (desde 15/10/2025)
HealthHub     → Tech Lead        (desde 01/11/2025)
```

**ROLE_CONFIG disponibles:**
- Product Owner
- Scrum Master
- Tech Lead
- Marketing Lead
- Sales Lead
- Design Lead
- Finance Lead
- Operations Lead

---

## 3. MI DESARROLLO

### ¿Qué es?

Vista enfocada en tu **crecimiento profesional** y **desempeño por rol**.

### Tabs de Mi Desarrollo

#### 3.1 Tab: Rendimiento

**Rendimiento por Rol y Proyecto:**

Muestra tu **performance score** en cada rol que desempeñas:

```typescript
interface RolePerformance {
  role_name: string;              // "Product Owner"
  project_name: string;           // "TechVerse"
  performance_score: number;      // 85 (de 0-100)

  // Métricas específicas del rol:
  task_completion_rate: number;   // 92% tareas completadas a tiempo
  total_tasks: number;            // 25 tareas totales
  completed_tasks: number;        // 23 tareas completadas

  total_obvs: number;             // 15 OBVs creadas en este proyecto
  validated_obvs: number;         // 13 OBVs validadas

  total_facturacion: number;      // €18,000 generados

  total_leads: number;            // 8 leads gestionados (si es Sales)
  leads_ganados: number;          // 5 leads cerrados ganados
  lead_conversion_rate: number;   // 62.5% tasa de conversión
}
```

**RolePerformanceCard** por cada rol:

```
┌─────────────────────────────────────────┐
│ 👨‍💼 Product Owner @ TechVerse           │
│                                         │
│ Score: 85/100 ████████░░ 🔥            │
│                                         │
│ • Tareas completadas: 92%               │
│ • OBVs validadas: 13/15                 │
│ • Facturación: €18,000                  │
│                                         │
│ Ranking: #2 en Product Owners          │
│ Tendencia: ↗️ +5 posiciones             │
└─────────────────────────────────────────┘
```

**Cálculo del Performance Score:**

```typescript
performance_score = (
  task_completion_rate * 0.4 +        // 40% peso
  (validated_obvs / total_obvs) * 30 + // 30% peso
  lead_conversion_rate * 0.3           // 30% peso (si aplica)
) * 100
```

#### 3.2 Tab: Insights

**InsightsList** - Recomendaciones personalizadas:

**Ejemplo de insights:**
```
💡 Insights para Product Owner

1. "Tus tareas se completan un 15% más rápido que el promedio de POs"
   → Recomendación: Comparte tu metodología en la próxima reunión

2. "Tu tasa de validación de OBVs es 92% (por encima del 85% esperado)"
   → Recomendación: Mantén este ritmo, estás alineado con el equipo

3. "Llevas 2 semanas sin crear Learning Points"
   → Recomendación: Dedica 2h esta semana a aprendizaje

4. "Tu proyecto genera el 35% de la facturación total del equipo"
   → Recomendación: Considera escalar o replicar el modelo
```

**Algoritmo de generación de insights:**
```typescript
// Compara tus métricas con:
- Promedio del equipo
- Promedio de personas en tu mismo rol
- Tus propios datos históricos

// Genera insights si:
- Estás >15% por encima o debajo del promedio
- Llevas >7 días sin actividad en un KPI
- Tu tendencia cambia (subiendo→bajando o viceversa)
```

#### 3.3 Tab: Playbooks

**PlaybookViewer** - Guías paso a paso por rol:

**¿Qué son los playbooks?**

Manuales de procedimientos para cada rol. Ejemplo:

```markdown
# Playbook: Product Owner

## 1. Definición de Features
1. Reunirse con stakeholders
2. Documentar requisitos
3. Crear user stories
4. Priorizar en backlog

## 2. Sprint Planning
1. Revisar backlog con equipo
2. Estimar story points
3. Definir sprint goal
4. Asignar tareas

## 3. Daily Standup
- ¿Qué hiciste ayer?
- ¿Qué harás hoy?
- ¿Tienes bloqueos?

## 4. Sprint Review
1. Demostrar features completadas
2. Recoger feedback
3. Actualizar roadmap
```

**Formato:**
- Markdown con pasos numerados
- Checklists
- Tips y mejores prácticas
- Enlaces a recursos

#### 3.4 Filtro por Rol

**Selector** para filtrar todo por un rol específico:
- Ver solo rendimiento como "Product Owner"
- Ver solo insights de "Marketing Lead"
- Ver solo playbooks de "Tech Lead"

---

## 4. RANKINGS

### ¿Qué es?

Sistema de **clasificación competitiva** del equipo por roles y proyectos.

### Funcionamiento

#### 4.1 Tipos de Ranking

**Global (todos los roles):**
```
🏆 Ranking General - Enero 2026
────────────────────────────────
🥇 Luis    - 95 pts (Product Owner)
🥈 Ángel   - 92 pts (Marketing Lead)
🥉 Diego   - 88 pts (Tech Lead)
4. Zarko   - 85 pts (Sales Lead)
5. Manuel  - 82 pts (Product Owner)
```

**Por Rol Específico:**
```
👨‍💼 Ranking Product Owners
─────────────────────────
🥇 Luis    - 95 pts
🥈 Manuel  - 82 pts
🥉 Fernando - 78 pts
```

**Por Proyecto:**
```
💻 Ranking TechVerse
───────────────────
🥇 Luis (PO)    - 95 pts
🥈 Diego (Tech) - 88 pts
🥉 Ángel (Mkt)  - 87 pts
```

#### 4.2 Cálculo de Puntos

**Sistema de scoring:**

```typescript
ranking_score =
  performance_score * 0.5 +         // 50% - Tu rendimiento
  (obvs / objetivo_obvs) * 20 +     // 20% - OBVs cumplidas
  (facturacion / 1000) * 0.2 +      // 20% - Facturación (€ / 1000)
  task_completion_rate * 10          // 10% - Tareas completadas
```

**Ejemplo real:**
```
Luis (Product Owner @ TechVerse):
- Performance: 92 → 92 * 0.5 = 46 pts
- OBVs: 24/150 (16%) → 16 * 20 = 3.2 pts
- Facturación: €25,000 → 25 * 0.2 = 5 pts
- Tasks: 95% → 95 * 0.1 = 9.5 pts
─────────────────────────────────────
TOTAL: 63.7 pts (normalizado a 95/100)
```

#### 4.3 Tendencias

**Indicadores de movimiento:**
- ↗️ **+3** (subió 3 posiciones desde el mes pasado)
- ↘️ **-2** (bajó 2 posiciones)
- ━ **=** (se mantuvo igual)

**Almacenado en `role_rankings`:**
```sql
SELECT
  ranking_position,      -- Posición actual (#1, #2, etc.)
  previous_position,     -- Posición mes pasado
  (previous_position - ranking_position) as change
FROM role_rankings
WHERE user_id = 'luis'
  AND period_start = '2026-01-01';
```

#### 4.4 Períodos

**Selector de período:**
- Semanal (última semana)
- Mensual (mes actual)
- Trimestral (Q1, Q2, etc.)
- Anual (año completo)

**Recalculación automática:**
- Cada lunes (ranking semanal)
- Día 1 de mes (ranking mensual)
- Inicio de trimestre (ranking trimestral)

#### 4.5 Widgets

**RankingLeaderboard:**
- Podio top 3 con iconos 🥇🥈🥉
- Lista completa ordenada
- Filtros por rol/proyecto

**RankingTrends:**
- Gráfico de evolución de posiciones
- Comparativa con otros miembros
- Proyección siguiente mes

**MyRankingCard:**
- Tu posición destacada
- Puntos para alcanzar al siguiente
- Consejos para mejorar

---

## 5. MASTERS

### ¿Qué es?

Sistema de **especialización y expertise** donde miembros pueden convertirse en **Masters** de un rol.

### Concepto

**Master = Experto Reconocido** en un rol específico.

**Roles con Masters:**
- Product Owner Master
- Marketing Master
- Tech Master
- Sales Master
- Design Master
- etc.

### ¿Cómo convertirse en Master?

#### Paso 1: Aplicar

**ApplyForMasterDialog** - Formulario de aplicación:

```typescript
interface MasterApplication {
  role_name: string;           // Rol al que aplicas
  motivation: string;          // ¿Por qué quieres ser Master?
  achievements: string[];      // Logros demostrables
  project_id: string;          // Proyecto principal
}
```

**Ejemplo de aplicación:**
```
Rol: Product Owner Master
Proyecto: TechVerse

Motivación:
"Llevo 2 años como PO, he liderado 3 proyectos exitosos,
y quiero mentorar a nuevos POs del equipo."

Logros:
- 95% tasa de validación de OBVs
- €75,000 facturados en último trimestre
- 3 proyectos escalados a fase de crecimiento
- 92% satisfacción del equipo
```

#### Paso 2: Votación del Equipo

**Sistema de votación:**

```typescript
interface VotingProcess {
  votes_required: number;      // 5 votos (mayoría simple)
  votes_for: number;          // Votos a favor
  votes_against: number;      // Votos en contra
  voting_deadline: string;    // 7 días para votar
  status: 'voting' | 'approved' | 'rejected';
}
```

**Flujo:**
1. Aplicación se publica en tab "Aplicaciones"
2. TODOS los miembros pueden votar
3. Si votes_for >= votes_required → APROBADO
4. Si votes_against > votes_required → RECHAZADO
5. Si llega deadline sin mayoría → RECHAZADO

**Notificaciones:**
- A todos: "Luis aplicó a Product Owner Master - Vota ahora"
- A aplicante: "3 votos a favor - Faltan 2 para aprobar"
- Al aprobar: "¡Felicidades! Eres Product Owner Master 🎓"

#### Paso 3: Obtener el Título

Si aprobado:

```sql
INSERT INTO team_masters (
  user_id,
  role_name,
  level,              -- 'master' (hay niveles: 'master', 'senior_master', 'grandmaster')
  title,              -- "Product Owner Master"
  appointed_at        -- Fecha de nombramiento
);
```

**Badge visible:**
- En tu perfil
- En rankings
- En proyectos donde participas

### Niveles de Master

**3 niveles progresivos:**

1. **Master** 🎓
   - Primer nivel
   - Otorgado por votación del equipo
   - Puede mentorar

2. **Senior Master** ⭐
   - Después de 6 meses como Master
   - + 3 defensas exitosas contra challenges
   - + 5 mentees graduados

3. **Grandmaster** 👑
   - Nivel máximo
   - Después de 1 año como Senior Master
   - + 10 defensas exitosas
   - + 15 mentees graduados
   - Reconocimiento de toda la organización

### System de Challenges (Desafíos)

**¿Qué es un challenge?**

Cualquier miembro puede **desafiar** a un Master para quitarle el título.

```typescript
interface MasterChallenge {
  master_id: string;          // Master actual
  challenger_id: string;      // Quien desafía
  role_name: string;          // Rol en disputa
  challenge_type: string;     // 'performance' | 'project' | 'vote'
  description: string;        // Descripción del desafío
  deadline: string;           // Fecha límite
  status: 'pending' | 'accepted' | 'completed' | 'challenger_won' | 'master_won';
}
```

**Tipos de challenge:**

1. **Performance Challenge:**
   - Competir por mejor performance score en 1 mes
   - Métricas: OBVs, facturación, task completion
   - Gana quien tenga mayor score al final

2. **Project Challenge:**
   - Cada uno lidera un proyecto similar
   - Competir por mejores resultados
   - Evaluado por el equipo al final

3. **Vote Challenge:**
   - Revotación del equipo
   - Gana quien tenga más votos

**Flujo de un challenge:**

```
1. Challenger envía desafío
   ↓
2. Master tiene 3 días para aceptar/rechazar
   ↓ (si acepta)
3. Período de competición (30 días)
   ↓
4. Evaluación de resultados
   ↓
5. Ganador declarado
   ↓ (si gana challenger)
6. Challenger se convierte en Master
   Master pierde el título
```

**Histórico de defensas:**

```sql
SELECT
  successful_defenses,    -- Cuántos challenges ha ganado
  total_mentees           -- Cuántos ha mentorado
FROM team_masters
WHERE user_id = 'luis';
```

### Beneficios de ser Master

1. **Badge distintivo** en toda la plataforma
2. **Acceso a responsabilidades de mentoría**
3. **Prioridad en decisiones del rol**
4. **Reconocimiento en rankings**
5. **Invitación automática a reuniones estratégicas**

---

## 6. ROTACIÓN DE ROLES

### ¿Qué es?

Sistema para **intercambiar roles** entre miembros para:
- Desarrollar nuevas habilidades
- Evitar burnout
- Aumentar versatilidad del equipo

### Flujo Completo

#### Paso 1: Crear Solicitud

**CreateRotationDialog:**

```typescript
interface RotationRequest {
  requester_id: string;           // Quien solicita (tú)
  requester_current_role: string; // Tu rol actual
  requester_project_id: string;   // Tu proyecto

  target_user_id: string;         // Con quién quieres cambiar
  target_role: string;            // Rol que quieres obtener
  target_project_id: string;      // Proyecto de destino

  request_type: 'swap' | 'transfer';
  reason: string;                 // ¿Por qué quieres cambiar?
}
```

**Tipos de solicitud:**

1. **Swap (Intercambio):**
   - Tú: Product Owner @ TechVerse
   - Otro: Tech Lead @ BrightPath
   - Resultado: Intercambian roles completos

2. **Transfer (Transferencia):**
   - Solo cambias tú de rol
   - No afecta al otro
   - Ejemplo: Dejas Product Owner, pasas a Marketing Lead

**Ejemplo de solicitud:**
```
De: Zarko
Rol actual: Product Owner @ TechVerse
Quiere: Tech Lead @ BrightPath
Con: Diego (Tech Lead @ BrightPath)
Tipo: Swap

Razón:
"Quiero desarrollar skills técnicas y Diego tiene experiencia
en producto que quiere profundizar. Win-win para ambos."
```

#### Paso 2: Análisis de Compatibilidad (AI)

**AIRotationSuggestions** analiza:

```typescript
compatibility_score = (
  skill_match * 0.3 +           // ¿Tienen las skills necesarias?
  performance_history * 0.3 +   // ¿Han tenido buen rendimiento?
  project_fit * 0.2 +           // ¿Encajan en los proyectos?
  team_approval * 0.2           // ¿El equipo lo ve bien?
)
```

**Ejemplo de análisis:**
```
Compatibilidad Zarko ↔️ Diego: 85%

✅ Zarko tiene experiencia técnica (3 años dev)
✅ Diego ha liderado features (skill de PO)
⚠️ Zarko nunca ha sido Tech Lead (riesgo medio)
✅ Ambos tienen performance >80
✅ Proyectos son de tamaño similar
```

**Recomendación automática:**
```
💡 Recomendación: APROBAR

Puntos a favor:
- Ambos han demostrado versatilidad
- Skills complementarias
- Proyectos en fase estable (buen momento)

Riesgos mitigables:
- Zarko necesitará mentoría en Tech Lead (asignar a Luis como mentor)
- Período de transición: 2 semanas de overlap
```

#### Paso 3: Aprobaciones Necesarias

**3 niveles de aprobación:**

```
1. Requester (tú) → Auto-aprobado al crear
   ↓
2. Target User (la otra persona) → Debe aceptar
   ↓
3. Admin/Team Lead → Aprobación final
```

**Estado de la solicitud:**

```typescript
{
  requester_accepted: true,      // ✅ (auto)
  target_accepted: false,        // ❌ Pendiente
  admin_approved: false,         // ❌ Pendiente
  status: 'pending'
}
```

**Notificaciones enviadas:**
- A target: "Zarko quiere intercambiar rol contigo - Revisar"
- A admin: "Nueva solicitud de rotación - Aprobar/Rechazar"
- A equipo del proyecto: "Posible cambio de roles - Opiniones bienvenidas"

#### Paso 4: Ejecución de la Rotación

Una vez aprobado por todos:

**1. Update de `project_members`:**
```sql
-- Cambio de Zarko
UPDATE project_members
SET role = 'Tech Lead',
    role_accepted_at = NOW()
WHERE member_id = 'zarko'
  AND project_id = 'brightpath';

-- Cambio de Diego (si es swap)
UPDATE project_members
SET role = 'Product Owner',
    role_accepted_at = NOW()
WHERE member_id = 'diego'
  AND project_id = 'techverse';
```

**2. Registro en `role_history`:**
```sql
INSERT INTO role_history (user_id, project_id, old_role, new_role, change_type, notes)
VALUES
  ('zarko', 'brightpath', 'Product Owner', 'Tech Lead', 'rotation', 'Swap con Diego'),
  ('diego', 'techverse', 'Tech Lead', 'Product Owner', 'rotation', 'Swap con Zarko');
```

**3. Notificaciones:**
- A ambos: "Rotación completada - Tu nuevo rol es X"
- Al equipo: "Cambios de roles efectivos desde hoy"
- A managers: "Actualizar expectations para nuevos roles"

#### Paso 5: Período de Transición

**Overlap recomendado: 1-2 semanas**

```typescript
interface TransitionPeriod {
  start_date: string;
  end_date: string;
  mentor_assigned: string;      // Mentor para el nuevo rol
  milestones: [
    { week: 1, goal: "Familiarizarse con código/producto" },
    { week: 2, goal: "Tomar decisiones con supervisión" },
    { week: 3, goal: "Autonomía completa" }
  ];
}
```

### Tabs de Rotación de Roles

#### Tab 1: Solicitudes Activas

**RotationRequestsList:**
- Todas las solicitudes pendientes
- Filtros: Mis solicitudes | Todas | Por estado
- Acciones: Aprobar | Rechazar | Ver detalles

#### Tab 2: Mi Historial

**MyRotationRequests:**
- Solicitudes que has creado
- Estado actual de cada una
- Outcome (aprobada/rechazada)

#### Tab 3: Historial Global

**RoleHistoryList:**
- Todos los cambios de rol del equipo
- Timeline visual
- Filtros por persona/proyecto/rol

#### Tab 4: Sugerencias IA

**AIRotationSuggestions:**
- Sugerencias proactivas del sistema
- "Diego y Zarko: 87% compatibilidad para swap"
- "Luis podría beneficiarse de experiencia en Marketing"

---

## 7. SISTEMA DE VALIDACIONES - PROFUNDO

### ¿Por qué existe?

**Principio fundamental de NOVA:**

> "Ningún logro cuenta hasta que tus compañeros lo validan"

Esto evita:
- ❌ Auto-reportes exagerados
- ❌ OBVs ficticias
- ❌ Métricas infladas
- ❌ Falta de transparencia

Y garantiza:
- ✅ Peer review real
- ✅ Calidad verificable
- ✅ Confianza en los datos
- ✅ Cultura de accountability

### Flujo Completo de Validación

#### Paso 1: Creación de OBV

**Luis crea una OBV de venta:**

```typescript
OBV creada:
{
  id: "obv-001",
  owner_id: "luis",              // Creador
  titulo: "Venta StartupX",
  tipo: "venta",
  es_venta: true,
  facturacion: 5000,
  costes: 2000,
  margen: 3000,
  status: "pending",             // ⚠️ ESTADO INICIAL
  validated_at: null,
  created_at: "2026-01-28 10:00"
}
```

**Estado inicial:** `pending`

#### Paso 2: Aparece en Centro de Validaciones

**¿Quiénes la ven?**

**TODOS los miembros EXCEPTO Luis** (no puedes validar tus propias OBVs)

```sql
-- Query para obtener OBVs pendientes para Zarko:
SELECT o.*
FROM obvs o
WHERE o.status = 'pending'
  AND o.owner_id != 'zarko'                    -- No las mías
  AND NOT EXISTS (                             -- Que NO haya validado aún
    SELECT 1
    FROM obv_validaciones v
    WHERE v.obv_id = o.id
      AND v.validator_id = 'zarko'
  );
```

**Vista en Centro Validaciones:**

```
┌─────────────────────────────────────────┐
│ OBVs Pendientes de Validar (3)         │
├─────────────────────────────────────────┤
│                                         │
│ 💰 Venta StartupX                      │
│ Luis • €5,000 • hace 2h                │
│ Costes: €2,000 | Margen: €3,000       │
│ [Ver detalles] [✅ Aprobar] [❌ Rechazar]│
│                                         │
│ 📚 Learning Path React                 │
│ Ángel • 12 LPs • hace 5h              │
│ [Ver detalles] [✅ Aprobar] [❌ Rechazar]│
│                                         │
│ 🌟 Community Event                     │
│ Diego • 25 CPs • hace 1d              │
│ [Ver detalles] [✅ Aprobar] [❌ Rechazar]│
└─────────────────────────────────────────┘
```

#### Paso 3: Primera Validación

**Zarko revisa la OBV:**

**Click en "Ver detalles"** → Modal completo:

```
┌──────────────────────────────────────────────┐
│ Validar OBV                                  │
├──────────────────────────────────────────────┤
│ Venta StartupX                               │
│ Creado por: Luis                             │
│ Fecha: 28/01/2026 10:00                      │
│                                              │
│ Detalles:                                    │
│ • Cliente: StartupX SL                       │
│ • Producto: Consultoría Tech                 │
│ • Facturación: €5,000                        │
│ • Costes: €2,000                             │
│ • Margen: €3,000 (60%)                       │
│ • Nº Factura: FAC-2026-012                   │
│ • Forma pago: Transferencia                  │
│ • Cobro esperado: 15/02/2026                 │
│                                              │
│ Evidencia:                                   │
│ 📎 factura_startupx.pdf                      │
│ 📎 contrato_firmado.pdf                      │
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │ Comentario (opcional):               │    │
│ │ ┌──────────────────────────────────┐ │    │
│ │ │ Todo correcto, factura validada  │ │    │
│ │ │ Buen trabajo Luis!               │ │    │
│ │ └──────────────────────────────────┘ │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ [❌ Rechazar]            [✅ Aprobar]        │
└──────────────────────────────────────────────┘
```

**Zarko clickea "✅ Aprobar":**

```sql
INSERT INTO obv_validaciones (
  obv_id,
  validator_id,
  approved,
  comentario,
  created_at
) VALUES (
  'obv-001',
  'zarko',
  true,                          -- ✅ Aprobado
  'Todo correcto, factura validada. Buen trabajo Luis!',
  NOW()
);
```

**Estado de la OBV:**
```
Validaciones: 1/2
Status: pending (aún no alcanza el mínimo)
```

**Notificación a Luis:**
> "Zarko validó tu OBV 'Venta StartupX' ✅ (1/2)"

#### Paso 4: Segunda Validación

**Ángel también revisa:**

```sql
INSERT INTO obv_validaciones (
  obv_id,
  validator_id,
  approved,
  comentario
) VALUES (
  'obv-001',
  'angel',
  true,
  'Aprobado, excelente margen!'
);
```

**TRIGGER automático se dispara:**

```sql
-- Función que se ejecuta después de cada INSERT en obv_validaciones:
CREATE OR REPLACE FUNCTION check_obv_validation_status()
RETURNS TRIGGER AS $$
DECLARE
  v_approved_count INT;
  v_rejected_count INT;
BEGIN
  -- Contar validaciones
  SELECT
    COUNT(*) FILTER (WHERE approved = true),
    COUNT(*) FILTER (WHERE approved = false)
  INTO v_approved_count, v_rejected_count
  FROM obv_validaciones
  WHERE obv_id = NEW.obv_id;

  -- Si 2+ aprobaciones → VALIDADO
  IF v_approved_count >= 2 THEN
    UPDATE obvs
    SET
      status = 'validated',
      validated_at = NOW()
    WHERE id = NEW.obv_id;

    -- Notificar al creador
    -- (lógica de notificación)
  END IF;

  -- Si 2+ rechazos → RECHAZADO
  IF v_rejected_count >= 2 THEN
    UPDATE obvs
    SET status = 'rejected'
    WHERE id = NEW.obv_id;

    -- Notificar al creador
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Estado actualizado:**
```
Validaciones aprobadas: 2
Status: validated ✅
Validated_at: 2026-01-28 15:30
```

**Notificaciones:**
- A Luis: "¡Tu OBV 'Venta StartupX' fue validada! 🎉"
- A todo el equipo: "Luis completó una venta de €5,000"
- Dashboard de Luis se actualiza automáticamente

#### Paso 5: Impacto de la Validación

**Una vez `status = 'validated'`, la OBV:**

1. **Cuenta para métricas:**
```sql
-- Facturación total
SELECT SUM(facturacion)
FROM obvs
WHERE status = 'validated';
```

2. **Aparece en dashboards:**
   - Dashboard de Luis (sus OBVs validadas)
   - Financiero Global (facturación total)
   - Rankings (Luis sube posiciones)

3. **Contribuye a objetivos:**
```sql
-- Progreso de Luis hacia objetivo
SELECT
  COUNT(*) as obvs_validadas,
  150 as objetivo,
  (COUNT(*) / 150.0) * 100 as porcentaje
FROM obvs
WHERE owner_id = 'luis'
  AND status = 'validated';
```

4. **Genera actividad:**
   - Aparece en Recent Activity Feed
   - Se registra en historial

### ¿Quién Valida a Quién?

**Regla principal:** Todos validan a todos (excepto a sí mismos)

```
Luis crea OBV
↓
Pueden validar: Ángel, Diego, Zarko, Manuel, Miguel, Fernando, Carla
No pueden: Luis (es el creador)
```

**¿Hay validadores específicos?**

**NO.** Es **peer review distribuido**:
- Cualquier miembro puede validar
- No hay "validadores asignados"
- Todos tienen igual responsabilidad

**Ventajas:**
- ✅ Descentralizado (no depende de 1 persona)
- ✅ Múltiples perspectivas
- ✅ Fomenta conocimiento del trabajo de otros
- ✅ Detecta errores (si algo es sospechoso, alguien lo verá)

### ¿Se Cambian Validadores?

**NO.** No hay rotación de validadores porque:
- No existen "validadores asignados"
- Es responsabilidad de TODOS
- Sistema automático distribuye la carga

**Algoritmo de priorización:**

Para cada miembro, las OBVs pendientes se ordenan por:

```typescript
priority_score =
  dias_esperando * 10 +           // Más viejas = más urgentes
  (es_del_mismo_proyecto ? 5 : 0) + // Mismo proyecto = más contexto
  (valor / 1000)                   // Mayor valor = más importante
```

### Casos Especiales

#### Caso 1: OBV Rechazada

**2+ personas rechazan:**

```sql
-- Diego rechaza
INSERT INTO obv_validaciones VALUES ('obv-002', 'diego', false, 'Falta evidencia');

-- Zarko rechaza
INSERT INTO obv_validaciones VALUES ('obv-002', 'zarko', false, 'Números no cuadran');

-- TRIGGER automático
UPDATE obvs SET status = 'rejected' WHERE id = 'obv-002';
```

**¿Qué pasa?**
1. OBV marcada como `rejected`
2. NO cuenta para métricas
3. Luis recibe notificación:
   > "Tu OBV 'Venta X' fue rechazada por 2 miembros. Revisa los comentarios."
4. Luis puede:
   - Editar la OBV (corregir errores)
   - Volver a enviar a validación
   - Eliminarla si era incorrecta

#### Caso 2: Validaciones Mixtas (1 aprueba, 1 rechaza)

```sql
-- Zarko aprueba
INSERT INTO obv_validaciones VALUES ('obv-003', 'zarko', true, 'OK');

-- Diego rechaza
INSERT INTO obv_validaciones VALUES ('obv-003', 'diego', false, 'Dudas en costes');
```

**Estado:**
```
Aprobaciones: 1
Rechazos: 1
Status: pending (necesita +1 voto en cualquier dirección)
```

**Espera a 3ra validación:**
- Si Ángel aprueba → Status = 'validated'
- Si Ángel rechaza → Status = 'rejected'

#### Caso 3: OBV Sin Validaciones

**Luis crea OBV pero nadie la valida:**

**Recordatorios automáticos:**
```
Día 1: (silencio)
Día 2: (silencio)
Día 3: Notificación a equipo: "3 OBVs llevan >3 días sin validar"
Día 5: Alerta en Dashboard: "OBV de Luis esperando validación hace 5 días"
Día 7: Notificación directa a miembros con menos validaciones realizadas
```

### Estadísticas de Validador

**Tabla `validator_stats`:**

```sql
CREATE VIEW validator_stats AS
SELECT
  validator_id,
  COUNT(*) as total_validations,
  SUM(CASE WHEN approved THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN NOT approved THEN 1 ELSE 0 END) as rejected_count,

  -- Tasa de aprobación
  (SUM(CASE WHEN approved THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as approval_rate,

  -- Tiempo promedio de respuesta (en horas)
  AVG(
    EXTRACT(EPOCH FROM (obv_validaciones.created_at - obvs.created_at)) / 3600
  ) as avg_response_time_hours

FROM obv_validaciones
JOIN obvs ON obvs.id = obv_validaciones.obv_id
GROUP BY validator_id;
```

**Ejemplo:**
```
Zarko:
- Total validaciones: 45
- Aprobadas: 42 (93%)
- Rechazadas: 3 (7%)
- Tiempo respuesta promedio: 18 horas
```

**Ranking de validadores:**
```
🏆 Top Validadores (Enero 2026)
────────────────────────────────
1. Ángel   - 52 validaciones (95% aprobación)
2. Diego   - 48 validaciones (91% aprobación)
3. Zarko   - 45 validaciones (93% aprobación)
```

---

## 8. SISTEMA DE NOTIFICACIONES

### Tipos de Notificaciones

#### 8.1 Notificaciones en Tiempo Real

**NotificationsView** - Centro de notificaciones:

```typescript
interface Notification {
  id: string;
  user_id: string;           // Destinatario
  type: string;              // Tipo de notificación
  title: string;
  message: string;
  related_id: string | null; // ID del objeto relacionado (OBV, lead, etc.)
  read: boolean;
  created_at: string;
  action_url: string | null; // URL para navegar al hacer click
}
```

**Categorías:**

1. **Validaciones** 🔍
   ```
   "Zarko validó tu OBV 'Venta StartupX' ✅"
   → Click: Ir a OBV

   "Tu OBV 'Venta X' fue validada por 2 miembros 🎉"
   → Click: Ver detalles

   "Tu OBV 'Venta Y' fue rechazada - Revisar comentarios"
   → Click: Editar OBV
   ```

2. **Tareas** ✅
   ```
   "Nueva tarea asignada: 'Diseñar mockup landing'"
   → Click: Ir a tarea

   "Tarea 'MVP Review' vence en 2 días"
   → Click: Ver tarea

   "Diego completó tarea 'API Integration'"
   → Click: Ver proyecto
   ```

3. **CRM** 💼
   ```
   "Nuevo lead asignado: StartupX (€5,000)"
   → Click: Ver lead

   "Lead 'Empresa Y' sin actividad hace 7 días"
   → Click: Actualizar lead

   "Tu lead 'Empresa Z' avanzó a 'Negociación'"
   → Click: Ver detalles
   ```

4. **Proyectos** 📁
   ```
   "Añadido a proyecto 'TechVerse'"
   → Click: Ver proyecto

   "Nuevo rol: Product Owner @ BrightPath"
   → Click: Ver onboarding

   "Rotación aprobada: Ahora eres Tech Lead"
   → Click: Ver detalles
   ```

5. **Rankings** 🏆
   ```
   "Subiste 2 posiciones en ranking Product Owners"
   → Click: Ver ranking

   "Alcanzaste #1 en facturación este mes 🥇"
   → Click: Ver dashboard
   ```

6. **Masters** 👑
   ```
   "Tu aplicación a Marketing Master fue aprobada 🎓"
   → Click: Ver perfil

   "Luis te desafió por el título de Product Owner Master"
   → Click: Ver challenge

   "Nuevo voto en tu aplicación a Master (3/5)"
   → Click: Ver estado
   ```

7. **Sistema** ⚙️
   ```
   "Nueva versión disponible de NOVA"
   "Mantenimiento programado: 29/01 02:00-04:00"
   "Cambios en política de validaciones"
   ```

#### 8.2 Badge de Notificaciones

**Icono en Header:**

```
┌──────────────────────────────────────┐
│  NOVA    [🔍] [📊] [⚙️] [🔔 3]  👤 │
└──────────────────────────────────────┘
                             ↑
                    Badge con contador
```

**Contador rojo:**
- Muestra número de notificaciones NO LEÍDAS
- Actualiza en tiempo real
- Click: Abre panel de notificaciones

#### 8.3 Panel de Notificaciones

**Dropdown al hacer click:**

```
┌────────────────────────────────────────┐
│ Notificaciones (3)       [Marcar todas]│
├────────────────────────────────────────┤
│ 🆕 Zarko validó tu OBV           hace 2h│
│    "Venta StartupX"                    │
│                                        │
│ 🆕 Nueva tarea asignada          hace 4h│
│    "Diseñar landing page"              │
│                                        │
│ 🆕 Subiste a #2 en rankings     hace 1d│
│    "Ranking Product Owners"            │
├────────────────────────────────────────┤
│ ✓ Luis completó tarea           hace 2d│
│ ✓ Lead avanzó a propuesta       hace 3d│
│                                        │
│ [Ver todas las notificaciones →]      │
└────────────────────────────────────────┘
```

**Features:**
- Scroll infinito
- Marcar como leída (individualmente o todas)
- Filtros por categoría
- Click en notificación: Navega al objeto
- Eliminar notificación

#### 8.4 Notificaciones por Email

**Configuración por usuario:**

```typescript
interface NotificationSettings {
  user_id: string;

  // Por canal
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;

  // Por tipo
  validations_email: boolean;
  tasks_email: boolean;
  crm_email: boolean;
  rankings_email: boolean;

  // Frecuencia
  digest_frequency: 'realtime' | 'daily' | 'weekly';
}
```

**Tipos de email:**

1. **Tiempo Real:**
   ```
   Asunto: "Zarko validó tu OBV 'Venta StartupX' ✅"

   Hola Luis,

   Buenas noticias! Zarko acaba de validar tu OBV.

   OBV: Venta StartupX
   Validaciones: 1/2
   Comentario: "Todo correcto, factura validada"

   [Ver detalles en NOVA →]
   ```

2. **Digest Diario:**
   ```
   Asunto: "Tu resumen diario de NOVA - 28 Enero"

   Hola Luis,

   Hoy en NOVA:

   ✅ 2 OBVs validadas
   📝 1 nueva tarea asignada
   🏆 Subiste al #2 en facturación
   🔔 3 notificaciones pendientes

   [Ver dashboard →]
   ```

3. **Digest Semanal:**
   ```
   Asunto: "Tu semana en NOVA - Semana 4"

   Esta semana:
   - 8 OBVs validadas (+20% vs semana pasada)
   - €12,000 facturados
   - #2 en ranking (↗️ +1)
   - 5 tareas completadas

   Top logro: ¡Cerrado lead de €8,000! 🎉
   ```

#### 8.5 Smart Notifications (Inteligentes)

**Algoritmo que decide CUÁNDO notificar:**

```typescript
function shouldNotify(notification: Notification): boolean {
  // No notificar de noche (22:00 - 08:00)
  if (isNightTime()) return false;

  // No spamear: max 5 notificaciones por hora
  if (getNotificationsLastHour() >= 5) return false;

  // Agrupar similares
  if (hasSimilarRecentNotification(notification)) {
    groupNotifications(notification);
    return false;
  }

  // Priorizar críticas
  if (notification.type === 'critical') return true;

  return true;
}
```

**Agrupación inteligente:**

```
Antes (spam):
- Luis validó OBV 1
- Luis validó OBV 2
- Luis validó OBV 3

Después (agrupado):
- Luis validó 3 OBVs tuyas
```

---

## 9. GENERADOR DE TAREAS IA - REAL

### ⚠️ IMPORTANTE: Esto SÍ usa IA REAL

A diferencia de los otros componentes "IA" (que son algoritmos), **este SÍ llama a una API de IA externa** (OpenAI GPT).

### Arquitectura

```
Frontend (AITaskGenerator)
    ↓ Click "Generar tareas"
    ↓
Supabase Edge Function (generate-tasks-v2)
    ↓ Prepara contexto
    ↓
OpenAI API (GPT-4)
    ↓ Genera tareas
    ↓
Supabase (guarda en DB)
    ↓ Retorna tareas
    ↓
Frontend (muestra tareas)
```

### Flujo Completo

#### Paso 1: Recopilar Contexto

**Cuando haces click en "🤖 Generar tareas":**

```typescript
// Frontend envía:
{
  projectId: "techverse-001"
}

// Edge Function consulta DB para obtener contexto completo:
const context = {
  // Datos del proyecto
  proyecto: {
    id: "techverse-001",
    nombre: "TechVerse",
    tipo: "validacion",           // o "operacion"
    fase: "mvp",                  // idea | validacion | mvp | crecimiento | escala
    descripcion: "Plataforma de gestión de proyectos tech",
    onboarding_data: {            // Datos del wizard
      problema: "Empresas no gestionan proyectos eficientemente",
      cliente: "Startups tech de 5-50 personas",
      solucion: "SaaS de gestión todo-en-uno",
      hipotesis: ["Startups pagarán $50/user/mes", "..."],
      metricas: ["MAU", "NPS", "Churn"],
      recursos: ["€10,000", "2 devs", "1 diseñador"]
    }
  },

  // Equipo del proyecto
  team: [
    { id: "luis", nombre: "Luis", role: "Product Owner" },
    { id: "diego", nombre: "Diego", role: "Tech Lead" },
    { id: "angel", nombre: "Ángel", role: "Marketing Lead" }
  ],

  // Actividad reciente
  obvs_count: 12,              // OBVs creadas hasta ahora
  leads_count: 5,              // Leads activos
  last_activity: "2026-01-27", // Última actividad

  // Tareas actuales (para evitar duplicados)
  existing_tasks: [
    "Diseñar wireframes principales",
    "Configurar backend API"
  ]
};
```

#### Paso 2: Prompt a GPT

**Edge Function construye prompt:**

```typescript
const prompt = `
Eres un asistente experto en gestión de proyectos de startups.

Contexto del proyecto:
- Nombre: ${context.proyecto.nombre}
- Tipo: ${context.proyecto.tipo}
- Fase: ${context.proyecto.fase}
- Descripción: ${context.proyecto.descripcion}
- Problema que resuelve: ${context.proyecto.onboarding_data.problema}
- Cliente objetivo: ${context.proyecto.onboarding_data.cliente}

Equipo:
${context.team.map(m => `- ${m.nombre} (${m.role})`).join('\n')}

Estadísticas:
- OBVs completadas: ${context.obvs_count}
- Leads activos: ${context.leads_count}
- Última actividad: ${context.last_activity}

Tareas existentes:
${context.existing_tasks.join('\n')}

Genera 5 tareas específicas y accionables para ESTA SEMANA que ayuden a avanzar el proyecto según su fase actual.

Requisitos:
1. Tareas SMART (específicas, medibles, alcanzables, relevantes, con tiempo)
2. Asignar a un miembro específico del equipo según su rol
3. Prioridad: 1 (alta), 2 (media), 3 (baja)
4. Fecha límite dentro de los próximos 7 días
5. Incluir un playbook paso a paso para cada tarea

Formato JSON:
{
  "tasks": [
    {
      "titulo": "string (máx 80 chars)",
      "descripcion": "string (contexto y qué lograr)",
      "assignee": "nombre del miembro",
      "prioridad": 1 | 2 | 3,
      "fecha_limite": "YYYY-MM-DD",
      "playbook": "string (pasos numerados para completar la tarea)"
    }
  ]
}

IMPORTANTE:
- NO generar tareas duplicadas de las existentes
- Enfocarse en la FASE actual (${context.proyecto.fase})
- Ser ESPECÍFICO con nombres de deliverables
- Incluir métricas de éxito cuando aplique
`;

// Llamada a OpenAI
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: "Eres un experto en gestión de proyectos tech." },
    { role: "user", content: prompt }
  ],
  temperature: 0.7,
  response_format: { type: "json_object" }
});
```

#### Paso 3: Respuesta de GPT

**GPT genera tareas contextuales:**

```json
{
  "tasks": [
    {
      "titulo": "Validar hipótesis de pricing con 10 entrevistas",
      "descripcion": "Realizar 10 entrevistas a startups target para validar que pagarían $50/user/mes. Documentar insights y ajustar pricing si necesario.",
      "assignee": "Luis",
      "prioridad": 1,
      "fecha_limite": "2026-02-03",
      "playbook": "1. Preparar guión de entrevista (30 min)\n2. Identificar 10 startups de LinkedIn (1h)\n3. Enviar emails de contacto (30 min)\n4. Realizar entrevistas (5h)\n5. Documentar insights en Notion (1h)\n6. Presentar hallazgos al equipo (30 min)"
    },
    {
      "titulo": "Diseñar MVP de dashboard principal en Figma",
      "descripcion": "Crear wireframes y mockups de alta fidelidad del dashboard que los usuarios verán al entrar a la plataforma. Incluir vista de proyectos, tareas y métricas clave.",
      "assignee": "Ángel",
      "prioridad": 1,
      "fecha_limite": "2026-02-04",
      "playbook": "1. Revisar ejemplos de dashboards (Asana, Linear, Notion)\n2. Sketching de ideas en papel (1h)\n3. Wireframes en Figma (2h)\n4. Feedback de equipo (30 min)\n5. Mockups finales con branding (3h)\n6. Preparar design system components (2h)"
    },
    {
      "titulo": "Implementar autenticación con JWT en backend",
      "descripcion": "Configurar sistema de auth con JWT tokens, rutas protegidas y refresh tokens. Documentar endpoints en Swagger.",
      "assignee": "Diego",
      "prioridad": 1,
      "fecha_limite": "2026-02-05",
      "playbook": "1. Setup de librería JWT (express-jwt)\n2. Crear middleware de autenticación\n3. Implementar login/register endpoints\n4. Configurar refresh tokens\n5. Proteger rutas existentes\n6. Testing con Postman\n7. Documentar en Swagger"
    },
    {
      "titulo": "Crear landing page con formulario de early access",
      "descripcion": "Landing simple con propuesta de valor, screenshot del producto y formulario para captar emails de early adopters. Meta: 50 signups en 1 semana.",
      "assignee": "Ángel",
      "prioridad": 2,
      "fecha_limite": "2026-02-06",
      "playbook": "1. Copywriting de hero section y beneficios\n2. Diseño en Figma (opcional)\n3. Desarrollo con HTML/Tailwind\n4. Integrar formulario con Mailchimp\n5. Deploy en Vercel\n6. Configurar analytics (Plausible)\n7. Compartir en redes sociales"
    },
    {
      "titulo": "Preparar demo para investor meeting del 10 Feb",
      "descripcion": "Demo de 10 minutos mostrando: login, crear proyecto, asignar tareas, dashboard con métricas. Slides de apoyo con traction y roadmap.",
      "assignee": "Luis",
      "prioridad": 2,
      "fecha_limite": "2026-02-08",
      "playbook": "1. Definir storyline de la demo\n2. Crear cuenta de demo con datos de ejemplo\n3. Practicar flujo de usuario (3 veces mínimo)\n4. Crear slides en Pitch (10 slides)\n5. Rehearsal con equipo\n6. Ajustar timing y messaging"
    }
  ]
}
```

#### Paso 4: Guardar en Base de Datos

**Edge Function guarda directamente:**

```typescript
// Por cada tarea generada:
for (const task of generatedTasks) {
  // Buscar ID del assignee
  const assignee = context.team.find(m =>
    m.nombre.toLowerCase().includes(task.assignee.toLowerCase())
  );

  await supabase.from('project_tasks').insert({
    project_id: context.proyecto.id,
    assignee_id: assignee?.id || null,
    titulo: task.titulo,
    descripcion: task.descripcion,
    prioridad: task.prioridad,
    fecha_limite: task.fecha_limite,
    playbook: task.playbook,       // ⭐ Playbook incluido
    status: 'todo',
    ai_generated: true,            // Marca de IA
    created_at: new Date()
  });
}
```

#### Paso 5: Mostrar en Frontend

**Modal con tareas generadas:**

```
┌──────────────────────────────────────────┐
│ 🤖 Generar Tareas con IA                │
├──────────────────────────────────────────┤
│ 5 tareas generadas                       │
│                                          │
│ ☑️ 🔥 Alta · 📖 Playbook                 │
│    Validar hipótesis de pricing con     │
│    10 entrevistas                        │
│    Luis • Vence 03 Feb                   │
│                                          │
│ ☑️ 🔥 Alta · 📖 Playbook                 │
│    Diseñar MVP de dashboard principal   │
│    en Figma                              │
│    Ángel • Vence 04 Feb                  │
│                                          │
│ ☑️ 🔥 Alta · 📖 Playbook                 │
│    Implementar autenticación con JWT    │
│    en backend                            │
│    Diego • Vence 05 Feb                  │
│                                          │
│ ☑️ ⚡ Media · 📖 Playbook                 │
│    Crear landing page con formulario    │
│    de early access                       │
│    Ángel • Vence 06 Feb                  │
│                                          │
│ ☑️ ⚡ Media · 📖 Playbook                 │
│    Preparar demo para investor meeting  │
│    del 10 Feb                            │
│    Luis • Vence 08 Feb                   │
│                                          │
│ [Regenerar] [✅ ¡Listo! Ver tareas]     │
└──────────────────────────────────────────┘
```

**Ya están guardadas** - Click en "Ver tareas" cierra el modal.

### Limitaciones y Costos

**Rate Limits:**
- Máximo 5 tareas IA pendientes por proyecto
- Esperar a completar tareas antes de generar más
- Evita spam y controla costos

**Costos de IA:**
```
Llamada a GPT-4:
- Input: ~1,500 tokens (contexto)
- Output: ~800 tokens (5 tareas con playbooks)
- Costo: ~$0.06 por generación
```

**Manejo de errores:**
```typescript
// Error 429: Rate limit excedido
if (error.status === 429) {
  toast.error('Has excedido el límite. Espera unos minutos.');
}

// Error 402: Créditos agotados
if (error.status === 402) {
  toast.error('Créditos de IA agotados. Contacta al admin.');
}
```

### ¿Cómo se Adapta a la Fase del Proyecto?

**Actualmente, GPT YA se adapta** según la fase:

**Fase: idea**
```
GPT genera:
- Validar problema con entrevistas
- Definir ICP (Ideal Customer Profile)
- Investigar competencia
- Crear landing de validación
```

**Fase: mvp**
```
GPT genera:
- Diseñar wireframes de features core
- Implementar funcionalidad básica
- Setup de analytics
- Preparar beta testing
```

**Fase: crecimiento**
```
GPT genera:
- Optimizar funnel de conversión
- Implementar referral program
- Mejorar onboarding de usuarios
- Escalar infraestructura
```

**PERO** el prompt puede mejorar con:
1. Campo explícito de "estado del proyecto" en onboarding
2. Más contexto sobre clientes/ingresos actuales
3. Diferenciar proyectos con/sin tracción

---

## 10. MEJORAS PROPUESTAS

### Mejora 1: Onboarding Adaptativo por Estado del Proyecto

**Problema actual:**
- Mismo onboarding para "idea sin clientes" y "proyecto con €50k MRR"
- Preguntas no alineadas con realidad del proyecto
- Tareas generadas muy genéricas

**Solución:**

**PREGUNTA INICIAL nueva:**

```
¿En qué estado está tu proyecto?

○ Idea/Exploración
  Tengo una idea pero aún sin validar
  Sin clientes, sin ingresos

○ Validación Temprana
  Primeros clientes/testers (1-10)
  Validando problema y solución
  Ingresos: €0-1,000/mes

○ Proyecto con Tracción
  Clientes recurrentes (10-100)
  Modelo de negocio validado
  Ingresos: €1,000-10,000/mes

○ Negocio Consolidado
  100+ clientes
  Operación estable
  Ingresos: €10,000+/mes
```

**Flujo adaptativo:**

```
┌─────────────────────────────────────────┐
│ ¿En qué estado está tu proyecto?       │
├─────────────────────────────────────────┤
│                                         │
│ [ ] Idea/Exploración                    │
│     └→ Onboarding tipo VALIDACIÓN       │
│        7 preguntas sobre hipótesis      │
│                                         │
│ [ ] Validación Temprana                 │
│     └→ Onboarding tipo EXPLORACIÓN      │
│        Mix validación + primeros KPIs   │
│                                         │
│ [ ] Proyecto con Tracción               │
│     └→ Onboarding tipo OPERACIÓN        │
│        Métricas, modelo de negocio      │
│                                         │
│ [ ] Negocio Consolidado                 │
│     └→ Onboarding tipo CRECIMIENTO      │
│        Escalabilidad, optimización      │
└─────────────────────────────────────────┘
```

**Preguntas específicas por estado:**

**IDEA:**
1. ¿Qué problema específico resuelves?
2. ¿Quién es tu cliente objetivo?
3. ¿Cuál es tu solución propuesta?
4. ¿Qué hipótesis estás asumiendo?
5. ¿Cómo validarás cada hipótesis?
6. ¿Qué recursos necesitas?
7. ¿Quién está en el equipo?

**VALIDACIÓN:**
1. ¿Cuántos clientes/testers tienes?
2. ¿Qué feedback has recibido hasta ahora?
3. ¿Cuál es tu propuesta de valor validada?
4. ¿Qué métricas estás siguiendo?
5. ¿Cuál es tu modelo de monetización?
6. ¿Qué bloqueadores has encontrado?
7. Roadmap próximos 3 meses

**TRACCIÓN:**
1. Revenue mensual actual
2. # de clientes activos
3. CAC (Customer Acquisition Cost)
4. LTV (Lifetime Value)
5. Churn rate
6. Principales canales de adquisición
7. Plan de escalamiento

**CONSOLIDADO:**
1. ARR (Annual Recurring Revenue)
2. Tamaño del equipo
3. Burn rate
4. Runway
5. Objetivos de crecimiento (3x, 5x, etc.)
6. Mercados a expandir
7. Planes de fundraising

**Tareas IA adaptadas:**

```typescript
// Contexto enriquecido:
{
  proyecto: {
    fase_negocio: "traccion",    // ⭐ NUEVO
    clientes_actuales: 45,
    mrr: 8500,
    cac: 120,
    ltv: 2400
  }
}

// Prompt a GPT incluye:
"Este proyecto tiene TRACCIÓN REAL: 45 clientes y €8,500 MRR.
Genera tareas de CRECIMIENTO y OPTIMIZACIÓN, NO de validación."

// Resultado:
GPT genera:
- "Optimizar funnel: aumentar conversión del 2% al 4%"
- "Implementar referral program con incentivo €50"
- "Setup de customer success: onboarding calls para nuevos"
- "Automatizar reporte mensual de métricas clave"
```

### Mejora 2: Crear/Eliminar Proyectos

**Actualmente:** No hay UI para crear proyectos desde la app.

**Solución:**

**Botón en ProjectsView:**

```
┌──────────────────────────────────────────┐
│ Proyectos (7)          [+ Nuevo Proyecto]│
└──────────────────────────────────────────┘
```

**Dialog de creación:**

```typescript
<CreateProjectDialog>
  <Step 1: Básico>
    - Nombre del proyecto
    - Icono (emoji picker)
    - Color (color picker)
    - Descripción breve

  <Step 2: Estado> ⭐ NUEVO
    - ¿En qué estado está?
      [ ] Idea
      [ ] Validación
      [ ] Tracción
      [ ] Consolidado

  <Step 3: Equipo>
    - Seleccionar miembros
    - Asignar roles

  <Step 4: Onboarding Adaptativo>
    - Preguntas según estado seleccionado
</CreateProjectDialog>
```

**Eliminar proyecto:**

```
En ProjectPage > Settings Tab:

[🗑️ Eliminar Proyecto]

Modal de confirmación:
┌─────────────────────────────────────────┐
│ ⚠️ Eliminar TechVerse                  │
├─────────────────────────────────────────┤
│ Esto eliminará:                         │
│ • 12 OBVs del proyecto                  │
│ • 8 Leads                               │
│ • 24 Tareas                             │
│ • Todo el historial                     │
│                                         │
│ ⚠️ ACCIÓN IRREVERSIBLE                  │
│                                         │
│ Escribe "ELIMINAR" para confirmar:     │
│ [________________]                      │
│                                         │
│ [Cancelar] [Eliminar Definitivamente]  │
└─────────────────────────────────────────┘
```

---

## CONCLUSIÓN

**NOVA es una plataforma completa** con:

✅ Sistema de validaciones peer-to-peer robusto
✅ Generador de tareas con IA REAL (GPT-4)
✅ CRM con scoring predictivo
✅ Rankings competitivos
✅ Sistema de Masters con challenges
✅ Rotación de roles inteligente
✅ Notificaciones contextuales
✅ Analytics avanzado

**Próximos pasos:**
1. Implementar onboarding adaptativo
2. Añadir crear/eliminar proyectos
3. Mejorar prompt de IA con contexto de estado

¿Procedemos con las implementaciones? 🚀
