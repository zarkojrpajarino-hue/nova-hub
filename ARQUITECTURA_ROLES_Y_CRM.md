# 🏗️ Arquitectura: Roles Financieros y CRM Global

**Fecha:** 25 Enero 2026

---

## 📊 PREGUNTA 1: ¿Los Roles Financieros son por Proyecto?

### ✅ RESPUESTA: **SÍ, los roles son POR PROYECTO**

```
┌─────────────────────────────────────────────────────┐
│              EMPRESA (Global)                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐      ┌─────────────────┐     │
│  │  Proyecto A     │      │  Proyecto B     │     │
│  ├─────────────────┤      ├─────────────────┤     │
│  │ Juan - Sales    │      │ Juan - Finance  │ ←── Juan tiene DIFERENTE rol
│  │ María - Finance │      │ María - Sales   │     en cada proyecto
│  │ Pedro - Dev     │      │ Pedro - Leader  │     │
│  └─────────────────┘      └─────────────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 🔍 Cómo Funciona:

**Tabla `project_members`:**
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY,
  project_id UUID,  -- ← Específico del proyecto
  member_id UUID,
  role specialization_role,  -- ← Rol EN ESE proyecto
  joined_at TIMESTAMP
);
```

**Ejemplo de Datos:**
```
| member_id | project_id | role     |
|-----------|------------|----------|
| juan-123  | proyecto-A | sales    | ← Juan es Sales en Proyecto A
| juan-123  | proyecto-B | finance  | ← Juan es Finance en Proyecto B
| maria-456 | proyecto-A | finance  | ← María es Finance en Proyecto A
| maria-456 | proyecto-B | sales    | ← María es Sales en Proyecto B
```

**Implicación:**
- ✅ Juan puede ver datos financieros SOLO del Proyecto B
- ✅ María puede ver datos financieros SOLO del Proyecto A
- ✅ Cada usuario puede tener diferentes roles en diferentes proyectos

---

## 💰 Cómo Funciona el View `obvs_financial`

```sql
CREATE VIEW obvs_financial AS
SELECT o.*
FROM obvs o
WHERE EXISTS (
  SELECT 1
  FROM project_members pm
  WHERE pm.project_id = o.project_id       -- ← OBV del mismo proyecto
    AND pm.member_id = get_member_id(auth.uid())  -- ← Usuario actual
    AND pm.role = 'finance'                -- ← Tiene rol finance EN ESE proyecto
);
```

### Ejemplo Práctico:

**Situación:**
- Juan tiene rol `finance` en Proyecto A
- Juan tiene rol `sales` en Proyecto B

**Cuando Juan ejecuta:**
```typescript
const { data } = await supabase.from('obvs_financial').select('*');
```

**Resultado:**
```javascript
[
  {
    id: "obv-1",
    project_id: "proyecto-A",  // ✅ Ve este (finance en Proyecto A)
    precio_unitario: 1500,
    facturacion: 15000,
    margen: 7000
  },
  // ❌ NO ve obvs del Proyecto B (es sales allí, no finance)
]
```

---

## 🌍 PREGUNTA 2: ¿El CRM Global Muestra TODAS las OBVs de la Empresa?

### ⚠️ RESPUESTA: **El CRM muestra LEADS, NO OBVs**

**IMPORTANTE:** Hay que distinguir entre:

### 📌 **LEADS** (Oportunidades de venta)
- **Vista:** `CRMView.tsx`
- **Título:** "CRM Global - Pipeline de todos los proyectos"
- **Tabla:** `pipeline_global` (VIEW)
- **Alcance:** **GLOBAL** - Muestra TODOS los leads de TODOS los proyectos

### 📌 **OBVs** (Operaciones de venta cerradas)
- **Vista:** `OBVCenterView.tsx`
- **Título:** "Centro de OBVs"
- **Tabla:** `obvs_public` o `obvs_financial`
- **Alcance:** **POR PROYECTO** - Solo ve obvs de proyectos donde es miembro

---

## 🔄 Diferencia entre LEADS y OBVs

```
PIPELINE DE VENTAS
==================

1. LEAD (Oportunidad)
   ↓
   Estado: "contacto_inicial"
   Estado: "calificacion"
   Estado: "propuesta"
   Estado: "negociacion"
   ↓
2. OBV (Venta Cerrada)
   ↓
   Estado: "cerrado_ganado"
   Datos: precio, facturacion, margen
```

### CRMView (GLOBAL)
```typescript
// Línea 20: Usa usePipelineGlobal()
const { data: realLeads } = usePipelineGlobal();

// Línea 186: Query
const { data } = await supabase
  .from('pipeline_global')  // ← VIEW global
  .select('*');

// Resultado: TODOS los leads de TODA la empresa
```

**Título:** "CRM Global - Pipeline de todos los proyectos"

**Filtros disponibles:**
```typescript
filters: {
  project: 'all',      // ← Puede filtrar por proyecto
  responsable: 'all',  // ← Puede filtrar por responsable
  status: 'all',       // ← Puede filtrar por estado
}
```

**Implicación:**
- ✅ Cualquier usuario ve TODOS los leads de TODOS los proyectos
- ✅ Puede filtrar para ver solo leads de un proyecto específico
- ⚠️ **POSIBLE PROBLEMA DE PRIVACIDAD:** Sales de Proyecto A ve leads de Proyecto B

---

## 🔒 ¿Están las OBVs Protegidas?

### ✅ SÍ, las OBVs SÍ están protegidas por proyecto

```typescript
// En OBVCenterView.tsx
const { data } = await supabase
  .from('obvs_public')  // ← View con RLS
  .select('*');
```

**View `obvs_public` con RLS:**
```sql
CREATE VIEW obvs_public AS
SELECT ...
FROM obvs
WHERE EXISTS (
  SELECT 1
  FROM project_members pm
  WHERE pm.project_id = obvs.project_id  -- ← Solo del proyecto
    AND pm.member_id = get_member_id(auth.uid())  -- ← Donde es miembro
);
```

**Resultado:**
- ✅ Solo ves OBVs de proyectos donde eres miembro
- ✅ NO ves OBVs de otros proyectos
- ✅ Datos financieros ocultos (excepto si tienes rol 'finance')

---

## 📋 RESUMEN: Arquitectura de Seguridad

### Tabla de Accesos:

| Elemento | Alcance | Restricción | Datos Financieros |
|----------|---------|-------------|-------------------|
| **LEADS (CRM)** | 🌍 GLOBAL | ❌ Ninguna | ❌ N/A (no tiene datos financieros) |
| **OBVs (obvs_public)** | 📁 Por Proyecto | ✅ Solo proyectos donde es miembro | ❌ Ocultos |
| **OBVs (obvs_financial)** | 📁 Por Proyecto | ✅ Solo si role='finance' EN ESE proyecto | ✅ Visibles |
| **Emails** | 👤 Personal | ✅ Solo propio email | ❌ N/A |

---

## ⚠️ POSIBLES PROBLEMAS DETECTADOS

### 🚨 Problema 1: CRM Global Sin Restricciones

**Situación Actual:**
- Cualquier usuario puede ver TODOS los leads de TODA la empresa
- No hay RLS en `pipeline_global` view
- Sales de un proyecto ve leads de otros proyectos

**¿Es esto intencional?**

**Opciones:**

#### Opción A: **Mantener como está** (CRM Global)
✅ **Ventaja:** Todos pueden colaborar, ver oportunidades globales
❌ **Desventaja:** Falta de privacidad entre proyectos

#### Opción B: **Restringir por Proyecto**
```sql
-- Modificar pipeline_global view para filtrar por proyecto
CREATE OR REPLACE VIEW pipeline_global AS
SELECT l.*
FROM leads l
WHERE EXISTS (
  SELECT 1
  FROM project_members pm
  WHERE pm.project_id = l.project_id
    AND pm.member_id = get_member_id(auth.uid())
);
```
✅ **Ventaja:** Solo ves leads de tus proyectos
❌ **Desventaja:** Ya no es "global", es "mis proyectos"

#### Opción C: **Ocultar Información Sensible**
```sql
-- Crear view con información limitada
CREATE VIEW pipeline_global_public AS
SELECT
  id,
  nombre,
  empresa,
  status,
  project_id,
  -- ❌ valor_potencial (oculto)
  -- ❌ responsable_id (oculto)
  -- ❌ proxima_accion (oculto)
  CASE
    WHEN EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = leads.project_id
        AND pm.member_id = get_member_id(auth.uid())
    )
    THEN valor_potencial  -- ✅ Solo si es miembro
    ELSE NULL             -- ❌ Oculto
  END as valor_potencial
FROM leads;
```
✅ **Ventaja:** Balance entre global y privacidad
✅ **Ventaja:** Ves que existen leads pero no los detalles

---

## 🔍 Verificación: ¿Qué ve cada usuario?

### Escenario:
- **Usuario:** Juan
- **Proyectos:**
  - Proyecto A: Sales
  - Proyecto B: Finance
  - Proyecto C: No es miembro

### Lo que Juan VE:

#### CRM (Leads):
```
✅ Leads del Proyecto A (es miembro)
✅ Leads del Proyecto B (es miembro)
✅ Leads del Proyecto C (⚠️ NO ES MIEMBRO pero VE los leads!)
✅ Leads de TODOS los proyectos de la empresa
```

#### Centro de OBVs (obvs_public):
```
✅ OBVs del Proyecto A (sin datos financieros - es sales)
✅ OBVs del Proyecto B (sin datos financieros - aunque es finance, usa obvs_public)
❌ OBVs del Proyecto C (NO VE - no es miembro)
```

#### OBVs Financieros (obvs_financial):
```
❌ OBVs del Proyecto A (no finance - es sales)
✅ OBVs del Proyecto B (es finance - VE TODO)
❌ OBVs del Proyecto C (no es miembro)
```

---

## 🎯 RECOMENDACIONES

### Decisión Pendiente: CRM Global

**Pregunta para ti:**
¿Quieres que TODOS los usuarios vean TODOS los leads de la empresa?

**Si SÍ:**
- ✅ Mantener como está
- 📝 Documentar que es intencional
- ⚠️ Considerar ocultar valores potenciales de leads de otros proyectos

**Si NO:**
- 🔧 Aplicar RLS a `pipeline_global`
- 🔧 Crear view restringido por proyecto
- 🔧 Cambiar título de "CRM Global" a "Mis Leads"

---

## 📊 SQL para Verificar Configuración Actual

```sql
-- Ver estructura de project_members
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'project_members'
ORDER BY ordinal_position;

-- Ver roles disponibles
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'specialization_role';

-- Ver qué proyectos tienes y con qué rol
SELECT
  p.nombre as proyecto,
  pm.role as tu_rol,
  pm.joined_at
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE pm.member_id = get_member_id(auth.uid());

-- Ver si pipeline_global tiene RLS
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'pipeline_global';
```

---

## 🚀 PRÓXIMOS PASOS

1. **Decidir:** ¿CRM debe ser global o por proyecto?

2. **Si quieres restringir CRM por proyecto:**
   - Aplicar RLS a `pipeline_global`
   - Actualizar título en CRMView
   - Testing

3. **Si quieres mantener CRM global:**
   - Documentar que es intencional
   - Considerar ocultar detalles sensibles (valores)

---

**Estado Actual:**
- ✅ OBVs protegidas por proyecto
- ✅ Datos financieros protegidos por rol (por proyecto)
- ✅ Emails protegidos
- ⚠️ LEADS visibles globalmente (sin restricción)

**Pregunta para ti:** ¿Cómo prefieres que funcione el CRM?
