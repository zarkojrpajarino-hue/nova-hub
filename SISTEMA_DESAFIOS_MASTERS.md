# 🏆 SISTEMA DE DESAFÍOS - REGLAS PROFESIONALES

## 📋 REGLAS PARA DESAFIAR

### 1. REQUISITOS PARA DESAFIAR

**El retador DEBE cumplir AL MENOS UNO de estos:**
- ✅ Estar en **Top 3** del ranking del rol (basado en fit score)
- ✅ Haber completado **Fase 2** en ese rol (especialización)
- ✅ Tener **fit score mínimo de 4.0** en ese rol
- ✅ Haber estado activo en ese rol en los últimos **3 meses**

**PROTECCIÓN DEL MASTER:**
- ⚠️ El Master solo puede ser desafiado **1 vez cada 2 meses**
- ⚠️ El Master tiene **7 días** para aceptar/declinar
- ⚠️ Si el Master declina sin razón válida **3 veces**, pierde el título
- ✅ El Master puede declinar si:
  - Está de vacaciones
  - Tiene emergencia personal
  - Está en período crítico de proyecto

---

## 🎯 TIPOS DE DESAFÍO

### TIPO 1: RENDIMIENTO (Performance Battle)
**Duración:** 2 semanas

**Métricas comparadas:**
- Tareas completadas (peso: 30%)
- OBVs validados (peso: 25%)
- Puntualidad (peso: 15%)
- Peer feedback promedio (peso: 20%)
- Iniciativa (OBVs propios) (peso: 10%)

**Ganador:** Quien tenga mayor puntuación combinada

**Ideal para:** Roles cuantitativos (sales, operations, finance)

---

### TIPO 2: PROYECTO (Project Showdown)
**Duración:** 3 semanas

**Proceso:**
1. Ambos reciben el **mismo proyecto** (creado por equipo)
2. Trabajan en paralelo (sin comunicarse)
3. Al final, presentan resultados
4. Equipo vota cuál es mejor

**Evaluación:**
- Calidad del resultado (40%)
- Innovación/creatividad (30%)
- Eficiencia (tiempo/recursos) (20%)
- Presentación (10%)

**Ganador:** Mayor puntuación combinada + voto mayoritario

**Ideal para:** Roles creativos (marketing, strategy, ai_tech)

---

### TIPO 3: VOTACIÓN DEL EQUIPO (Peer Vote)
**Duración:** 1 semana

**Proceso:**
1. Ambos presentan su **caso** (5 min cada uno)
   - Logros en el rol
   - Por qué merecen ser Master
   - Visión para el rol
2. Equipo hace preguntas (10 min)
3. Votación secreta

**Requisitos:**
- Mínimo **66% del equipo** debe votar
- Master gana si obtiene **51% de votos**
- Retador gana si obtiene **60% de votos** (threshold más alto por ser desafío)

**Ganador:** Mayor porcentaje de votos

**Ideal para:** Roles de liderazgo (strategy, operations)

---

## ⚖️ SISTEMA DE PUNTOS DE DESAFÍO

### GANAR DESAFÍO:
- ✅ +100 puntos de Master
- ✅ +1 defensa exitosa (si eres Master)
- ✅ Título de "Master" si ganas siendo retador
- ✅ Badge especial en perfil

### PERDER DESAFÍO:
- ❌ -0 puntos (no penalizas por intentar)
- ❌ Si eres Master y pierdes:
  - Pierdes el título
  - Puedes volver a desafiar en 1 mes
  - Mantienes badge "Ex-Master"

### EMPATE:
- 🤝 Ambos comparten título "Co-Master" por 2 meses
- 🤝 Automáticamente se programa re-match en 2 meses
- 🤝 +50 puntos para ambos

---

## 🛡️ PROTECCIONES ANTI-ABUSO

### 1. COOLDOWN PERIODS
```
Retador pierde:     → No puede desafiar mismo rol por 1 mes
Retador gana:       → Protección de 2 meses antes de ser desafiado
Master gana defensa: → Cooldown de 2 meses para próximo desafío
```

### 2. LÍMITE DE DESAFÍOS SIMULTÁNEOS
- Solo puedes tener **1 desafío activo** a la vez
- No puedes desafiar **2 roles diferentes** al mismo tiempo
- Master puede recibir máximo **2 desafíos en cola**

### 3. PENALIZACIONES POR MAL COMPORTAMIENTO
- ⚠️ Abandonar desafío → **-200 puntos** + ban de 3 meses
- ⚠️ Trampas/fraude → **Ban permanente** del sistema de Masters
- ⚠️ Declinar como Master sin razón 3 veces → **Pérdida automática del título**

---

## 📊 CRITERIOS DE EVALUACIÓN OBJETIVOS

### PARA TIPO 1 (PERFORMANCE):
Sistema **100% automático** basado en datos reales de la DB:

```sql
CREATE OR REPLACE FUNCTION calculate_challenge_score(
  member_id UUID,
  role_name TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP
)
RETURNS DECIMAL(5,2)
AS $$
DECLARE
  tasks_score DECIMAL(5,2);
  obvs_score DECIMAL(5,2);
  punctuality_score DECIMAL(5,2);
  peer_score DECIMAL(5,2);
  initiative_score DECIMAL(5,2);
  total_score DECIMAL(5,2);
BEGIN
  -- Tasks completadas (30%)
  SELECT COUNT(*) * 0.3 INTO tasks_score
  FROM tasks
  WHERE assignee_id = member_id
    AND status = 'done'
    AND completed_at BETWEEN start_date AND end_date;

  -- OBVs validados (25%)
  SELECT COUNT(*) * 0.25 INTO obvs_score
  FROM obvs
  WHERE owner_id = member_id
    AND status = 'validated'
    AND validated_at BETWEEN start_date AND end_date;

  -- Puntualidad (15%)
  SELECT
    (COUNT(CASE WHEN completed_at <= due_date THEN 1 END)::DECIMAL /
     NULLIF(COUNT(*), 0)) * 0.15 INTO punctuality_score
  FROM tasks
  WHERE assignee_id = member_id
    AND status = 'done'
    AND completed_at BETWEEN start_date AND end_date;

  -- Peer feedback (20%)
  SELECT AVG(
    (collaboration_rating + quality_rating + communication_rating +
     initiative_rating + technical_skills_rating) / 5.0
  ) * 0.2 INTO peer_score
  FROM peer_feedback
  WHERE to_member_id = member_id
    AND created_at BETWEEN start_date AND end_date;

  -- Iniciativa (10%)
  SELECT COUNT(*) * 0.1 INTO initiative_score
  FROM obvs
  WHERE owner_id = member_id
    AND task_id IS NULL
    AND created_at BETWEEN start_date AND end_date;

  total_score :=
    COALESCE(tasks_score, 0) +
    COALESCE(obvs_score, 0) +
    COALESCE(punctuality_score, 0) +
    COALESCE(peer_score, 0) +
    COALESCE(initiative_score, 0);

  RETURN total_score;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎖️ SISTEMA DE MÉRITOS Y LOGROS

### BADGES AUTOMÁTICOS:

#### Por Desafíos:
- 🏆 **"Primera Sangre"** - Ganar tu primer desafío
- ⚔️ **"Invicto"** - 3 defensas exitosas seguidas
- 👑 **"Rey del Rol"** - 5 defensas exitosas en total
- 🔥 **"Leyenda"** - 10 defensas exitosas
- 🤝 **"Deportista"** - Perder con dignidad (feedback positivo)

#### Por Fases:
- 🌱 **"Explorador"** - Completar Fase 1 (4 roles)
- 📈 **"Especialista"** - Completar Fase 2
- ⭐ **"Master"** - Obtener título de Master
- 💎 **"Polímata"** - Fit score >4.0 en 3+ roles

#### Por Contribución:
- 💡 **"Innovador"** - 10+ insights valiosos
- 🎯 **"Mentor"** - Ayudar a 3+ personas con feedback
- 🚀 **"Iniciativa"** - 20+ OBVs propios creados

---

## 📢 SISTEMA DE NOTIFICACIONES

### NOTIFICACIONES AUTOMÁTICAS:

```typescript
// Cuando te desafían
{
  title: "🔔 ¡Te han desafiado!",
  message: "Carlos te ha desafiado por el título de Master en Sales",
  action: "Ver Desafío",
  deadline: "7 días para aceptar",
  priority: "high"
}

// Cuando ganas
{
  title: "🏆 ¡VICTORIA!",
  message: "Has ganado el desafío. Ahora eres Master de Finance",
  action: "Ver Logros",
  badge: "Master de Finance",
  priority: "critical"
}

// Fase completada
{
  title: "✅ Fase 1 Completada",
  message: "Has explorado 4 roles. Tus mejores: Finance (4.5), AI Tech (4.2)",
  action: "Iniciar Fase 2",
  timeline: "Siguiente: Especialización (2 semanas)",
  priority: "medium"
}

// Cooldown terminado
{
  title: "⚡ Listo para Desafiar",
  message: "Ya puedes desafiar a María por Master de Finance",
  action: "Crear Desafío",
  priority: "low"
}
```

---

## 📊 TRANSPARENCIA TOTAL

### DASHBOARD PÚBLICO:
Todos pueden ver:
- 📋 Ranking completo por rol
- 🏆 Masters actuales
- ⚔️ Desafíos activos
- 📈 Historial de desafíos
- 🎖️ Logros de cada usuario
- 💬 Insights compartidos

### DATOS VISIBLES:
```
┌────────────────────────────────────────┐
│ MASTER DE FINANCE: María               │
│ ─────────────────────────────────────  │
│ Fit Score:           4.9               │
│ Defensas Exitosas:   3                 │
│ Tiempo como Master:  4 meses           │
│ Próximo desafío:     En 15 días        │
│ Logros:              👑⚔️🏆            │
│                                         │
│ TOP RETADORES:                         │
│ #2 Juan    (4.7) [Desafiar]            │
│ #3 Carlos  (4.3)                       │
│ #4 Ana     (4.1)                       │
└────────────────────────────────────────┘
```

---

## 🎯 RESUMEN DE JUSTICIA

### POR QUÉ ES JUSTO PARA EL MASTER:

✅ **Cooldown de 2 meses** - No puede ser desafiado constantemente
✅ **Puede declinar con razón** - Vacaciones, emergencias
✅ **Threshold más alto para retador** - En votación necesita 60% vs 51%
✅ **Ventaja en empates** - Co-Master automático
✅ **Datos objetivos** - No hay favoritismos
✅ **Reconocimiento permanente** - Badge "Ex-Master" aunque pierda

### POR QUÉ ES JUSTO PARA EL RETADOR:

✅ **Acceso transparente** - Top 3 puede desafiar
✅ **Sin penalización por perder** - 0 puntos negativos
✅ **Múltiples oportunidades** - Puede reintentar cada mes
✅ **Tipos de desafío** - Puede elegir su fuerte
✅ **Sistema automático** - Sin sesgos humanos

---

## ✅ IMPLEMENTACIÓN

Este sistema se integra con:
- ✅ Tabla `master_challenges` (ya existe)
- ✅ Tabla `masters` (ya existe)
- ✅ Vista `role_leaderboard` (por crear)
- ✅ Función `calculate_challenge_score` (por crear)
- ✅ Sistema de notificaciones (por crear)
- ✅ Sistema de badges (por crear)
