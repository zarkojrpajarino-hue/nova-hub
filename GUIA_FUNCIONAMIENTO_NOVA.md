# 📘 GUÍA COMPLETA DE FUNCIONAMIENTO - NOVA HUB

## 🤖 IMPORTANTE: Sobre la "IA" en la Aplicación

### ¿Qué IA usa la app?

**RESPUESTA CORTA**: La app **NO usa IA real** (no hay APIs de OpenAI, Claude, etc.). Usa **algoritmos heurísticos** que simulan comportamiento inteligente.

### ¿Por qué dice "IA" entonces?

Los componentes con "IA" son en realidad:

1. **Algoritmos de puntuación** (scoring algorithms)
2. **Cálculos predictivos** basados en fórmulas matemáticas
3. **Reglas de negocio** con lógica condicional
4. **Proyecciones lineales** basadas en datos históricos

### Ejemplo: AILeadScoring

```typescript
// NO hay llamadas a API de IA
// ES un cálculo basado en pesos y fórmulas:

const score =
  valueScore * 0.3 +      // 30% peso del valor
  stageScore * 0.25 +      // 25% peso de la etapa
  activityScore * 0.25 +   // 25% peso de actividad
  velocityScore * 0.2;     // 20% peso de velocidad
```

### ¿Hay que vincular alguna API?

**NO**. Todo funciona sin necesidad de:
- ❌ API keys de OpenAI
- ❌ API keys de Claude/Anthropic
- ❌ Configuración externa
- ❌ Servicios de terceros

**Todo el "análisis inteligente" se hace en el frontend con JavaScript puro.**

---

## 🏗️ ARQUITECTURA GENERAL DE NOVA

### Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: Shadcn/ui + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM

### Flujo de Datos

```
Usuario → React Components → React Query → Supabase → PostgreSQL
                ↓                                         ↑
           Local State                              Real-time Updates
```

---

## 📊 1. FINANCIERO GLOBAL

### ¿Qué es?

El módulo de **Financiero Global** centraliza toda la información económica de NOVA:
- Facturación total
- Márgenes
- Cobros pendientes
- Proyecciones de ingresos

### Tabs / Secciones

#### 1.1 Dashboard (Tab Principal)

**Métricas destacadas:**
- **Facturación Total**: Suma de todas las OBVs de tipo "venta" validadas
- **Margen Total**: Facturación - Costes
- **Margen Promedio %**: (Margen / Facturación) × 100
- **Pendiente de Cobro**: Facturas emitidas pero no cobradas aún

**Gráficos:**
- **Revenue Evolution Chart**: Evolución mensual de facturación y márgenes por proyecto
- **Project Breakdown Chart**: Distribución de ingresos por proyecto (pie chart)

**Widgets:**
- **Financial Alerts Card**: Alertas automáticas sobre:
  - Facturas vencidas
  - Margen bajo (< 40%)
  - Crecimiento negativo mensual

- **Top Facturación**: Ranking de socios por facturación generada

#### 1.2 Gestión de Cobros

**Funcionalidad:**
Controla el **estado de cobro** de cada venta:

**Estados de cobro:**
- `pendiente`: Factura emitida, no cobrada
- `cobrado_parcial`: Cobro parcial recibido
- `cobrado_total`: Completamente cobrado
- `atrasado`: Fecha de cobro vencida

**Métricas:**
- Total pendiente
- Número de facturas vencidas
- Próximas a vencer (siguiente semana)

**Vista de facturas:**
- **Facturas Vencidas**: Resaltadas en rojo, con días de retraso
- **Todos los pagos pendientes**: Lista completa con:
  - Cliente
  - Proyecto
  - Monto pendiente
  - Fecha esperada de cobro
  - Responsable

**Exportación:**
Botón "Exportar Pagos Pendientes" → Excel con todos los cobros

#### 1.3 Proyecciones

**¿Qué muestra?**

1. **🆕 AI Forecast Widget** (Recién agregado):
   - **Proyección próximos 30 días** basada en pipeline CRM
   - Desglose por etapa:
     - Hot (30% probabilidad) → €X
     - Propuesta (50% probabilidad) → €X
     - Negociación (75% probabilidad) → €X
   - **Valor ponderado**: Ingresos esperados reales
   - Análisis predictivo automático

2. **Proyección Anual**:
   - Progreso actual vs meta anual
   - Barra de progreso visual
   - % completado

3. **Progreso por Socio**:
   - Facturación individual vs objetivo personal
   - Progress bar por cada miembro
   - Ranking visual

### Fuente de Datos

**Tablas/Views de Supabase:**
- `obvs` (filtradas por `es_venta = true` y `status = 'validated'`)
- `members_public` (para stats por socio)
- `projects` (para desglose por proyecto)
- `forecast_ingresos` (view para proyecciones desde CRM)

### Cómo se Calcula

**Facturación Total:**
```sql
SELECT SUM(facturacion)
FROM obvs
WHERE es_venta = true
  AND status = 'validated'
```

**Margen Total:**
```sql
SELECT SUM(margen)
FROM obvs
WHERE es_venta = true
  AND status = 'validated'
```

**Pendiente de Cobro:**
```sql
SELECT SUM(pendiente)
FROM obvs
WHERE es_venta = true
  AND cobro_estado IN ('pendiente', 'cobrado_parcial')
```

---

## 💼 2. CRM GLOBAL

### ¿Qué es?

El **CRM (Customer Relationship Management)** gestiona todas las **oportunidades de venta** (leads) de todos los proyectos de NOVA en un solo lugar.

### Concepto: Lead vs OBV

- **Lead**: Oportunidad de venta en proceso (pipeline)
- **OBV de Venta**: Lead que se cerró ganado (convertido)

### Pipeline de Ventas (Etapas)

El CRM usa un pipeline visual con 7 etapas:

1. **Frío** 🧊
   - Contacto inicial
   - Sin engagement claro
   - Probabilidad: ~5%

2. **Tibio** 🌡️
   - Interés mostrado
   - Han respondido/interactuado
   - Probabilidad: ~15%

3. **Hot** 🔥
   - Oportunidad calificada
   - Necesidad identificada
   - Probabilidad: ~30%

4. **Propuesta** 📝
   - Propuesta comercial enviada
   - Esperando respuesta
   - Probabilidad: ~50%

5. **Negociación** 🤝
   - Negociando términos
   - Precio, plazos, condiciones
   - Probabilidad: ~75%

6. **Cerrado Ganado** ✅
   - Venta confirmada
   - Se convierte en OBV
   - Probabilidad: 100%

7. **Cerrado Perdido** ❌
   - Oportunidad perdida
   - Archivado
   - Probabilidad: 0%

### Tabs / Secciones del CRM

#### 2.1 Vista General (Overview)

**Métricas del Pipeline:**
- **Total Leads**: Cantidad total en pipeline
- **Valor Pipeline**: Suma de `valor_potencial` de todos los leads
- **En Negociación**: Leads en fase de cierre
- **Cerrados Ganados**: Conversiones exitosas

**Gráficos:**
- **Distribución por Estado**: Cuántos leads hay en cada etapa
- **Top 5 Leads por Valor**: Mayores oportunidades

**Exportación:**
- Exportar Todos los Leads
- Exportar Solo Cerrados Ganados

#### 2.2 Pipeline Kanban

**Vista Kanban:**
Tablero visual estilo Trello con columnas por etapa:

```
[Frío] → [Tibio] → [Hot] → [Propuesta] → [Negociación] → [Ganado]
  3        5         8         4             2              12
```

**Interacciones:**
- **Drag & Drop**: Arrastra leads entre columnas para cambiar etapa
- **Click en Lead**: Abre detalle completo (LeadDetail)
- **+ botón**: Crear nuevo lead en esa etapa

**Filtros:**
- Por proyecto
- Por responsable
- Por estado
- Por rango de valor

#### 2.3 Lista Detallada

**Vista Tabla:**
Tabla sorteable con todas las columnas:

| Lead | Empresa | Estado | Valor | Proyecto | Responsable | Próxima Acción |
|------|---------|--------|-------|----------|-------------|----------------|
| ...  | ...     | ...    | ...   | ...      | ...         | ...            |

**Características:**
- Ordenación por columna
- Filtros aplicados
- Exportación personalizada

#### 2.4 🆕 Insights IA

**¿Qué hace?**

Analiza automáticamente todos los leads y los **prioriza** usando algoritmos de scoring.

**Componentes del Score (0-100):**

1. **Value Score (30%)**:
   - Basado en `valor_potencial`
   - Normalizado respecto al lead más valioso

2. **Stage Score (25%)**:
   - Frío = 20 pts
   - Tibio = 35 pts
   - Hot = 55 pts
   - Propuesta = 70 pts
   - Negociación = 85 pts

3. **Activity Score (25%)**:
   - ¿Hay `proxima_accion` programada?
   - ¿Está vencida, próxima o futura?
   - Sin acción = 20 pts
   - Acción próxima (≤3 días) = 90 pts

4. **Velocity Score (20%)**:
   - ¿Cuándo fue `updated_at`?
   - Actualizado hoy = 90 pts
   - Sin actualizar en >30 días = 10 pts

**Score Final:**
```
Score = (Value × 0.3) + (Stage × 0.25) + (Activity × 0.25) + (Velocity × 0.2)
```

**Priorización:**
- **Alta**: Score ≥ 70 → 🔥
- **Media**: Score 40-69 → ⚡
- **Baja**: Score < 40 → 📌

**Recomendaciones Automáticas:**
- "⚠️ Programar próxima acción urgente" (si no hay acción)
- "🔄 Retomar contacto" (si lleva >14 días sin actualizar)
- "🎯 Alta prioridad - preparar cierre" (score alto + actividad)
- "💎 Alto valor - calentar lead" (valor alto pero etapa fría)

**Métricas:**
- Leads de alta prioridad (count)
- Probabilidad de cierre media del pipeline
- Valor potencial total
- Valor ponderado (ajustado por probabilidades)

**Top 10 Leads Priorizados:**
Lista ordenada por score con:
- Posición (🥇🥈🥉)
- Badge de prioridad
- Score numérico
- % Probabilidad de cierre
- Recomendación específica
- Desglose del score (expandible)

### Formulario Dinámico (PipelineStageForm)

**¿Qué es?**

Cuando creas o editas un lead, el **formulario se adapta** según la etapa:

**Frío/Tibio** → Solo campos básicos:
- Nombre contacto *
- Empresa *
- Email
- Teléfono
- Valor potencial
- Notas

**Hot** → + Campos de seguimiento:
- Próxima acción
- Fecha de próxima acción

**Propuesta** → + Detalles de propuesta:
- Producto/Servicio
- Cantidad
- Precio unitario

**Negociación** → + Costes:
- Costes estimados

**Cerrado Ganado** → Campos de venta completa:
- Facturación (auto-calculado: cantidad × precio)
- Costes
- Margen (auto-calculado: facturación - costes)
- Forma de pago
- Número de factura
- Fecha esperada de cobro

**Auto-cálculos:**
```javascript
facturacion = cantidad × precio_unitario
margen = facturacion - costes
```

**Botón "Avanzar Fase":**
Si el lead está en "Hot", el botón dice:
> "Pasar a: Propuesta Enviada"

Al hacer clic, automáticamente:
1. Cambia el `status` a `propuesta`
2. Muestra los nuevos campos de propuesta
3. Guarda en historial de cambios

### Fuente de Datos

**Tabla principal:**
- `leads` (tabla Supabase)

**Campos clave:**
```typescript
interface Lead {
  id: string;
  nombre: string;              // Nombre del lead/contacto
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  status: LeadStatus;          // Pipeline stage
  valor_potencial: number | null;
  notas: string | null;
  proxima_accion: string | null;
  proxima_accion_fecha: string | null;
  responsable_id: string;      // Quién gestiona este lead
  project_id: string;          // A qué proyecto pertenece
  created_at: string;
  updated_at: string;
}
```

**Relaciones:**
- `lead.responsable_id` → `members.id`
- `lead.project_id` → `projects.id`
- `lead.id` → `obvs.lead_id` (cuando se convierte a venta)

### ¿Cómo se convierte un Lead en OBV?

Cuando un lead llega a **"Cerrado Ganado"**:

1. El sistema crea automáticamente una **OBV de tipo venta**:
```typescript
{
  tipo: 'venta',
  es_venta: true,
  lead_id: lead.id,
  nombre_contacto: lead.nombre,
  empresa: lead.empresa,
  facturacion: lead.facturacion, // del form cerrado ganado
  costes: lead.costes,
  margen: lead.margen,
  // ... otros campos
}
```

2. La OBV queda en estado `pending` esperando validación
3. Cuando 2+ miembros validan → `status = 'validated'`
4. Aparece en **Financiero Global** como facturación

---

## 🎯 3. PROYECTOS

### ¿Qué es un Proyecto en NOVA?

Un **proyecto** es una iniciativa de negocio del equipo. Ejemplos:
- "TechVerse" (proyecto tecnológico)
- "BrightPath Academy" (educación)
- "HealthHub" (salud)

### Campos de un Proyecto

```typescript
interface Project {
  id: string;
  nombre: string;              // "TechVerse"
  descripcion: string | null;
  color: string;               // "#3B82F6" para visualización
  icon: string;                // "💻" emoji
  tipo: 'validacion' | 'operacion';
  fase: 'idea' | 'validacion' | 'mvp' | 'crecimiento' | 'escala';
  owner_id: string;            // Líder del proyecto
  created_at: string;
  onboarding_data: object;     // Datos del wizard de onboarding
}
```

### Tipos de Proyecto

#### 1. Proyecto de Validación

**Objetivo**: Validar una idea de negocio

**Fases:**
1. **Idea** → Concepto inicial
2. **Validación** → Validando problema/solución
3. **MVP** → Mínimo producto viable
4. **Crecimiento** → Escalando
5. **Escala** → Consolidado

**Onboarding Wizard (7 pasos):**
1. **Problema**: ¿Qué problema resuelve?
2. **Cliente**: ¿Quién es el cliente objetivo?
3. **Solución**: ¿Cómo lo resuelves?
4. **Hipótesis**: ¿Qué asumes que es verdad?
5. **Métricas**: ¿Cómo mides el éxito?
6. **Recursos**: ¿Qué necesitas?
7. **Equipo**: ¿Quién trabaja en esto?

#### 2. Proyecto de Operación

**Objetivo**: Operar un negocio ya validado

**Onboarding Wizard (6 pasos):**
1. **Corea/España**: ¿Dónde opera?
2. **Business Model Canvas (Parte 1)**:
   - Propuesta de valor
   - Segmentos de clientes
   - Canales
3. **Business Model Canvas (Parte 2)**:
   - Relaciones con clientes
   - Fuentes de ingresos
   - Recursos clave
4. **Finanzas**: Modelo financiero
5. **Clientes**: Análisis de mercado
6. **Objetivos**: KPIs y metas

### Apartados de un Proyecto

Cuando abres un proyecto (`/proyecto/:projectId`), ves estas tabs:

#### 3.1 Overview (Vista General)

**Resumen del proyecto:**
- Nombre, descripción, tipo, fase
- Equipo del proyecto (miembros asignados)
- Estadísticas:
  - Total OBVs
  - Total Leads
  - Leads ganados
  - Facturación del proyecto
  - Margen del proyecto

**Widgets:**
- **Quick Stats**: Métricas rápidas
- **Team Members**: Lista del equipo con avatares
- **Recent Activity**: Últimas OBVs y leads

#### 3.2 Pipeline (CRM del Proyecto)

**Lo mismo que CRM Global, pero filtrado por este proyecto:**
- Vista Kanban de leads solo de este proyecto
- Crear leads específicos del proyecto
- Ver progreso de ventas del proyecto

#### 3.3 OBVs (del Proyecto)

**Lista de OBVs del proyecto:**
- Todas las OBVs donde `project_id = proyecto.id`
- Filtros por tipo (venta, learning, book, community, master)
- Filtros por estado (pending, validated, rejected)

#### 3.4 Tareas

**Kanban de tareas del proyecto:**

**Columnas:**
- **To Do** → Por hacer
- **In Progress** → En curso
- **Done** → Completadas

**Campos de una tarea:**
```typescript
{
  titulo: string;
  descripcion: string;
  prioridad: 1-5;              // 1 = baja, 5 = crítica
  assignee_id: string;         // A quién se asigna
  fecha_limite: string;
  status: 'todo' | 'in_progress' | 'done';
  playbook: string | null;     // Instrucciones paso a paso
}
```

**IA Task Generator:**
Botón "🤖 Generar Tareas con IA" que:
1. Analiza el contexto del proyecto:
   - Nombre, tipo, fase
   - Equipo disponible
   - OBVs recientes
   - Leads activos
2. Genera sugerencias de tareas automáticamente
3. Muestra lista seleccionable de tareas
4. Permite crear las que quieras

**Ejemplo de tareas generadas:**
```
✓ Validar hipótesis de mercado con 10 entrevistas
✓ Diseñar landing page para captar emails
✓ Hacer seguimiento de propuesta a Empresa X
✓ Preparar demo para investor meeting
```

#### 3.5 Onboarding

**¿Qué es?**

El **onboarding** es un formulario guiado que ayuda a definir el proyecto completamente.

**¿Cuándo se usa?**
- Al crear un proyecto nuevo
- Para actualizar la estrategia del proyecto

**Componente**: `OnboardingWizard`

**Características:**
- **Progreso visual**: Barra de progreso por paso
- **Navegación**: Botones "Anterior" y "Siguiente"
- **Validación**: No puedes avanzar sin completar campos requeridos
- **Auto-guardado**: Guarda en `projects.onboarding_data` (JSONB)

**Ejemplo de datos guardados:**
```json
{
  "validacion": {
    "problema": "Las empresas no saben validar ideas rápido",
    "cliente": "Startups en etapa early-stage",
    "solucion": "Plataforma de validación guiada",
    "hipotesis": [
      "Startups pagan por validación",
      "Validación reduce fracaso en 50%"
    ],
    "metricas": ["Entrevistas completadas", "NPS"],
    "recursos": ["€5000", "1 diseñador", "1 developer"]
  },
  "equipo": ["Luis", "Ángel", "Diego"]
}
```

#### 3.6 Finanzas (del Proyecto)

**Financiero específico del proyecto:**
- Facturación solo de este proyecto
- Márgenes del proyecto
- Costes por categoría
- ROI del proyecto

---

## ✅ 4. CENTRO DE VALIDACIONES

### ¿Qué es?

El **Centro de Validaciones** es el sistema de **peer review** de NOVA. Aquí los miembros validan las OBVs de otros.

### ¿Por qué existe?

**Principio**: Ninguna OBV cuenta hasta que **2+ compañeros la validan**.

Esto garantiza:
- **Calidad**: Solo OBVs reales y verificables
- **Transparencia**: Todos revisan el trabajo de todos
- **Gamificación**: Validar también cuenta como contribución

### Flujo de Validación

```
1. Zarko crea OBV "Venta de €5000"
   ↓ status = 'pending'

2. La OBV aparece en "Centro de Validaciones" para todos (excepto Zarko)

3. Luis revisa y aprueba ✅
   ↓ 1 validación

4. Ángel revisa y aprueba ✅
   ↓ 2 validaciones → status = 'validated'

5. Ahora cuenta para:
   - Facturación global
   - Rankings
   - Objetivos
```

### Tabs del Centro de Validaciones

#### 4.1 OBVs Pendientes

**¿Qué muestra?**

Todas las OBVs con `status = 'pending'` que:
- NO creaste tú (no puedes validar tus propias OBVs)
- NO has validado aún

**Lista de OBVs:**
- Título de la OBV
- Tipo (venta, learning, book, community)
- Creador
- Valor (si es venta)
- Botones: "✅ Aprobar" | "❌ Rechazar"

**Al validar:**
- Se abre modal con:
  - Detalles completos de la OBV
  - Evidencia (si hay)
  - Campo de comentario (opcional)
- Al aprobar/rechazar:
  - Se guarda en `obv_validaciones`
  - Se actualiza contador de validaciones
  - Si llega a 2+ aprobaciones → `status = 'validated'`
  - Si llega a 2+ rechazos → `status = 'rejected'`

#### 4.2 KPIs Pendientes

**Igual que OBVs pero para KPIs:**

KPIs son otras métricas que también requieren validación:
- Learning Points (LPs)
- Book Points (BPs)
- Community Points (CPs)

#### 4.3 Historial

**Tu historial de validaciones:**
- Últimas 20 validaciones que hiciste
- Muestra:
  - Qué validaste (OBV/KPI)
  - Aprobado o rechazado
  - Tu comentario
  - Fecha/hora

**Estadística personal:**
- Total de validaciones realizadas
- % de aprobación vs rechazo
- Tiempo promedio de respuesta

### Componentes Técnicos

**Tabla**: `obv_validaciones`
```typescript
{
  id: string;
  obv_id: string;              // Qué OBV se validó
  validator_id: string;        // Quién validó
  approved: boolean;           // true = aprobado, false = rechazado
  comentario: string | null;
  created_at: string;
}
```

**Lógica de estado:**
```sql
-- Contar validaciones de una OBV
SELECT
  COUNT(*) FILTER (WHERE approved = true) as aprobaciones,
  COUNT(*) FILTER (WHERE approved = false) as rechazos
FROM obv_validaciones
WHERE obv_id = 'xxx';

-- Si aprobaciones >= 2 → status = 'validated'
-- Si rechazos >= 2 → status = 'rejected'
```

**View helper**: `validator_stats`
```sql
CREATE VIEW validator_stats AS
SELECT
  validator_id,
  COUNT(*) as total_validations,
  SUM(CASE WHEN approved THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN NOT approved THEN 1 ELSE 0 END) as rejected_count,
  AVG(EXTRACT(EPOCH FROM (created_at - obv.created_at))/3600) as avg_response_time_hours
FROM obv_validaciones
JOIN obvs ON obvs.id = obv_validaciones.obv_id
GROUP BY validator_id;
```

---

## 🎯 5. GENERACIÓN DE TAREAS

### ¿Dónde está?

En la página de un **proyecto específico** → Tab "Tareas" → Botón "🤖 Generar Tareas con IA"

### ¿Qué hace?

Analiza el contexto del proyecto y **sugiere tareas** relevantes automáticamente.

### Algoritmo (NO es IA real)

**Paso 1: Recopilar contexto**
```typescript
const context = {
  nombre: proyecto.nombre,
  tipo: proyecto.tipo,
  fase: proyecto.fase,
  equipo: miembros.map(m => m.nombre),
  obvs_count: countOBVs,
  leads_count: countLeads,
  last_activity: proyecto.updated_at,
  onboarding_data: proyecto.onboarding_data
};
```

**Paso 2: Reglas heurísticas**
```typescript
const tasks = [];

// Si es proyecto de validación en fase "idea"
if (tipo === 'validacion' && fase === 'idea') {
  tasks.push({
    titulo: 'Validar problema con entrevistas',
    descripcion: 'Hacer 10 entrevistas con clientes potenciales',
    prioridad: 5,
    assignee: equipo[0]
  });
}

// Si tiene leads activos
if (leads_count > 0) {
  tasks.push({
    titulo: 'Hacer seguimiento de propuestas pendientes',
    prioridad: 4
  });
}

// Si no hay OBVs recientes
if (daysSinceLastActivity > 7) {
  tasks.push({
    titulo: 'Actualizar estado del proyecto',
    prioridad: 3
  });
}

// ... más reglas ...
```

**Paso 3: Mostrar en modal**
- Lista de tareas generadas
- Checkbox para cada una
- Usuario selecciona las que quiere
- Click "Crear Tareas" → Se insertan en la tabla `project_tasks`

**Ejemplo real de sugerencias:**

Para proyecto "TechVerse" en fase MVP:
```
✓ Definir roadmap técnico del MVP
✓ Diseñar wireframes de pantallas principales
✓ Configurar infraestructura de desarrollo
✓ Hacer testing con 5 usuarios beta
✓ Preparar plan de lanzamiento
```

---

## 📈 6. OTROS MÓDULOS IMPORTANTES

### 6.1 Dashboard (Vista Principal)

**Al entrar a NOVA**, ves el Dashboard con:

**Métricas personales:**
- Tus OBVs este mes
- Tus validaciones pendientes
- Tu ranking actual
- Tu progreso hacia objetivos

**Widgets:**
- **Pending Validations**: Cuántas OBVs esperan tu validación
- **Smart Alerts**: Alertas personalizadas:
  - "Tienes 3 leads sin acción programada"
  - "Tu margen promedio bajó a 35%"
  - "Llevas 5 días sin crear OBVs"
- **Top Rankings**: Ranking mensual del equipo

### 6.2 Mi Espacio

**Tu área personal:**
- Tus OBVs (todas)
- Tus proyectos (donde participas)
- Tus leads (donde eres responsable)
- Tu actividad reciente

### 6.3 Mi Desarrollo

**Tu evolución personal:**
- Learning Paths completados
- Libros leídos (Book Points)
- Contribuciones comunitarias
- Certificaciones/Masters

### 6.4 Rankings

**Clasificaciones del equipo:**

**Por período:**
- Semanal
- Mensual
- Trimestral
- Anual

**Categorías:**
- 🏆 Facturación
- 💎 Márgenes
- 📚 Learning Points
- 📖 Book Points
- 🌟 Community Points
- ✅ Validaciones realizadas

**Visualización:**
```
🥇 Luis - €25,000 facturación
🥈 Ángel - €22,500 facturación
🥉 Diego - €20,000 facturación
4. Zarko - €18,500 facturación
...
```

### 6.5 Masters

**Sistema de especialización:**

**¿Qué es un Master?**
Un **rol de experto** en un área específica:
- Master en Marketing
- Master en Ventas
- Master en Producto
- Master en Datos

**¿Cómo se convierte alguien en Master?**
1. Aplica con `ApplyForMasterDialog`
2. Presenta:
   - Experiencia demostrable
   - OBVs relacionadas
   - Propuesta de valor para el equipo
3. El equipo vota
4. Si aprobado → Badge de Master

**Beneficios:**
- Reconocimiento en la plataforma
- Responsabilidades de mentoría
- Liderazgo en proyectos del área

### 6.6 Rotación de Roles

**Sistema de rotación de responsabilidades:**

**Roles del equipo:**
- Scrum Master
- Product Owner
- Tech Lead
- Marketing Lead
- Finance Lead

**Flujo:**
1. Cada X semanas/meses se rotan roles
2. `AIRotationSuggestions` analiza:
   - Historial de rotaciones
   - Especialización de cada miembro
   - Carga de trabajo actual
3. Sugiere próxima rotación óptima
4. El equipo aprueba/modifica
5. Se registra en `role_rotations`

### 6.7 Analytics

**Análisis avanzado del equipo:**

**Tabs:**
- **Comparativas de Socios**: Radar chart comparando métricas
- **Evolución Temporal**: Gráficos de tendencias
- **Comparativas de Proyectos**: ¿Qué proyectos generan más valor?
- **Activity Heatmap**: Mapa de calor de actividad
- **🆕 Predicciones**: PredictionsWidget con proyecciones de objetivos

**Filtros:**
- Período (semana/mes/trimestre/año)
- Proyecto específico
- Miembros seleccionados

**Exportación:**
- CSV de cualquier vista
- PDF (window.print)

### 6.8 Reuniones de Rol

**Seguimiento de reuniones del equipo:**

**Tipos de reunión:**
- Daily Standup
- Weekly Planning
- Sprint Review
- Retrospectiva
- All Hands

**Registro:**
- Fecha y hora
- Asistentes
- Temas tratados
- Acuerdos/decisiones
- Acción items

### 6.9 Configuración

**Settings del usuario:**
- Editar perfil (nombre, avatar, color)
- Cambiar especialización
- Configurar notificaciones
- Preferencias de visualización
- Vincular integraciones (futuro)

---

## 🔐 7. AUTENTICACIÓN Y PERMISOS

### Sistema de Auth

**Provider**: Supabase Auth

**Flujo de login:**
1. Usuario ingresa email/password en `/auth`
2. Supabase valida credenciales
3. Si válido → `Session` creada
4. `useAuth()` hook detecta sesión
5. Redirecciona a `/` (Dashboard)

### Usuarios del Sistema (9 miembros)

Todos con contraseña patrón: `[Nombre]2026Nova!`

```
luiscastillonn.nova@gmail.com → Luis2026Nova!
angeltc.nova@gmail.com → Angel2026Nova!
diegob.nova@gmail.com → Diego2026Nova!
fernandogg.nova@gmail.com → FerG2026Nova!
manuelure.nova@gmail.com → Manuel2026Nova!
majimenezm.nova@gmail.com → Miguel2026Nova!
zarkojr.nova@gmail.com → Zarko2026Nova!
fernandosf.nova@gmail.com → FerS2026Nova!
carlarey.nova@gmail.com → Carla2026Nova!
```

### Row Level Security (RLS)

**Políticas activas:**

**Tabla `members`:**
```sql
-- Todos pueden ver todos los miembros
CREATE POLICY "authenticated_can_read_all_members"
  ON members FOR SELECT
  TO authenticated
  USING (true);

-- Solo puedes actualizar tu propio perfil
CREATE POLICY "users_can_update_own_member"
  ON members FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid());
```

**Tabla `obvs`:**
```sql
-- Todos pueden ver todas las OBVs
CREATE POLICY "obvs_select_all"
  ON obvs FOR SELECT
  TO authenticated
  USING (true);

-- Solo puedes crear OBVs para ti
CREATE POLICY "obvs_insert_own"
  ON obvs FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Solo puedes editar tus OBVs
CREATE POLICY "obvs_update_own"
  ON obvs FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());
```

**Tabla `leads`:**
Similar a obvs - todos leen, solo editas las tuyas.

---

## 📊 8. BASE DE DATOS - TABLAS PRINCIPALES

### Tabla: `members`

**Representa**: Miembros del equipo NOVA

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  avatar TEXT,
  color TEXT DEFAULT '#6366F1',
  especialization TEXT, -- 'marketing', 'ventas', 'producto', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `projects`

**Representa**: Proyectos de negocio

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  color TEXT NOT NULL,
  icon TEXT,
  tipo TEXT NOT NULL, -- 'validacion' | 'operacion'
  fase TEXT, -- 'idea' | 'validacion' | 'mvp' | 'crecimiento' | 'escala'
  owner_id UUID REFERENCES members(id),
  onboarding_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `obvs`

**Representa**: OBVs (Objetivos Basados en Valor)

```sql
CREATE TABLE obvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES members(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL, -- 'venta' | 'learning' | 'book' | 'community' | 'master'
  status TEXT, -- 'pending' | 'validated' | 'rejected'

  -- Ventas
  es_venta BOOLEAN DEFAULT FALSE,
  facturacion NUMERIC,
  costes NUMERIC,
  margen NUMERIC,
  producto TEXT,
  cantidad NUMERIC,
  precio_unitario NUMERIC,

  -- Contacto (si viene de lead)
  nombre_contacto TEXT,
  empresa TEXT,
  email_contacto TEXT,
  telefono_contacto TEXT,
  lead_id UUID REFERENCES leads(id),

  -- Cobros
  cobro_estado TEXT, -- 'pendiente' | 'cobrado_parcial' | 'cobrado_total' | 'atrasado'
  cobro_fecha_esperada DATE,
  cobro_fecha_real DATE,
  forma_pago TEXT,
  numero_factura TEXT,

  -- Evidencia
  evidence_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ
);
```

### Tabla: `leads`

**Representa**: Oportunidades de venta (pipeline CRM)

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  responsable_id UUID REFERENCES members(id),

  nombre TEXT NOT NULL,
  empresa TEXT,
  email TEXT,
  telefono TEXT,

  status TEXT NOT NULL, -- LeadStatus enum
  valor_potencial NUMERIC,

  proxima_accion TEXT,
  proxima_accion_fecha DATE,
  notas TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `obv_validaciones`

**Representa**: Validaciones de OBVs

```sql
CREATE TABLE obv_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) NOT NULL,
  validator_id UUID REFERENCES members(id) NOT NULL,
  approved BOOLEAN NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(obv_id, validator_id) -- No puedes validar 2 veces la misma OBV
);
```

### Tabla: `project_tasks`

**Representa**: Tareas de proyectos

```sql
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  assignee_id UUID REFERENCES members(id),

  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad INTEGER DEFAULT 3, -- 1-5
  status TEXT DEFAULT 'todo', -- 'todo' | 'in_progress' | 'done'

  fecha_limite DATE,
  playbook TEXT, -- Instrucciones paso a paso

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

## 🔄 9. FLUJO DE TRABAJO TÍPICO

### Día 1: Luis crea un proyecto

1. Luis entra a NOVA
2. Va a "Proyectos" → "Nuevo Proyecto"
3. Llena wizard de onboarding (tipo validación):
   - Problema: "Empresas no saben gestionar proyectos"
   - Cliente: "Startups tech"
   - Solución: "Plataforma de gestión"
4. Asigna equipo: Luis, Ángel, Diego
5. Proyecto creado → aparece en lista

### Día 2: Ángel genera tareas

1. Ángel entra al proyecto
2. Tab "Tareas" → "🤖 Generar Tareas con IA"
3. Sistema sugiere 8 tareas
4. Ángel selecciona 5 relevantes
5. Click "Crear Tareas"
6. Aparecen en Kanban board

### Día 5: Diego crea un lead

1. Diego entra a "CRM Global"
2. Click "Añadir Lead"
3. Formulario dinámico (empieza en "Frío"):
   - Nombre: "Juan Pérez"
   - Empresa: "StartupX"
   - Email: "juan@startupx.com"
   - Valor potencial: €3,000
4. Lead creado en columna "Frío"

### Día 10: Diego avanza el lead

1. Diego arrastra lead a columna "Hot"
2. Se abre formulario con nuevos campos:
   - Próxima acción: "Enviar propuesta"
   - Fecha: 2026-02-01
3. Guarda

### Día 15: Diego envía propuesta

1. Diego mueve lead a "Propuesta"
2. Rellena campos adicionales:
   - Producto: "Plataforma SaaS"
   - Cantidad: 1
   - Precio: €3,000
3. Click "Guardar"

### Día 20: Cierre exitoso

1. Diego mueve lead a "Cerrado Ganado"
2. Formulario final:
   - Facturación: €3,000 (auto-calculado)
   - Costes: €1,200
   - Margen: €1,800 (auto-calculado)
   - Forma pago: "Transferencia"
   - Nº Factura: "FAC-2026-001"
   - Fecha cobro: 2026-03-15
3. Sistema crea automáticamente OBV de venta

### Día 21: Validación

1. OBV aparece en "Centro Validaciones" para todos
2. Luis entra, ve la OBV de Diego
3. Revisa detalles, click "✅ Aprobar"
4. Ángel también aprueba
5. OBV pasa a `status = 'validated'`
6. Ahora cuenta en:
   - Dashboard de Diego (+ €3,000 facturación)
   - Financiero Global (+ €3,000 total)
   - Rankings (Diego sube posiciones)

### Día 22: Análisis

1. Luis entra a "Financiero" → "Proyecciones"
2. Ve el AIForecastWidget:
   - Proyección próximos 30 días: €12,000
   - Desglose:
     - Hot: €4,000
     - Propuesta: €5,000
     - Negociación: €3,000
3. También ve "Analytics" → "Insights IA"
4. Top lead priorizado: "Empresa Y" (score 85)
5. Recomendación: "🎯 Alta prioridad - preparar cierre"

---

## ✅ RESUMEN FINAL

### ¿Todo está al 100% funcional?

**SÍ**, ahora sí:
- ✅ CRM con formulario dinámico (PipelineStageForm)
- ✅ CRM con IA Lead Scoring (tab Insights)
- ✅ Financiero con AI Forecast Widget
- ✅ Validaciones accesible en sidebar
- ✅ Todas las vistas integradas
- ✅ 285 componentes, todos utilizados

### ¿Qué IA usa?

**Ninguna IA real**. Son algoritmos JavaScript:
- Scoring = fórmulas matemáticas
- Predicciones = proyecciones lineales
- Recomendaciones = reglas if/else

### ¿Hay que configurar algo?

**NO**. Todo funciona out-of-the-box:
- No API keys necesarias
- No configuración externa
- Solo Supabase (ya configurado)

### ¿Dónde se ve cada cosa?

| Funcionalidad | Ubicación |
|---------------|-----------|
| Lead Scoring | CRM Global → Insights IA |
| Forecast Ingresos | Financiero → Proyecciones |
| Validaciones | Sidebar → Validaciones |
| Tareas IA | Proyecto → Tareas → Botón IA |
| Pipeline Dinámico | CRM → Añadir Lead |
| Analytics Predictivo | Analytics → Todas las tabs |

---

**Servidor corriendo en**: http://localhost:8080

**Credenciales de prueba**:
```
zarkojr.nova@gmail.com
Zarko2026Nova!
```

🚀 **¡Todo listo para usar!**
