# 📘 GUÍA: Tipos TypeScript Actualizados (FASE 1)

**Fecha:** 27 Enero 2026
**Estado:** ✅ Tipos extendidos creados

---

## 🎯 CÓMO USAR LOS NUEVOS TIPOS

### ✅ CORRECTO: Importar desde `/types`

```typescript
// ✅ USAR ESTO - Tipos extendidos con TODOS los campos
import { OBV, OBVInsert, CobroParcial, DashboardCobros } from '@/types';

// Ahora tienes acceso a TODOS los campos nuevos
const obv: OBV = {
  id: 'xxx',
  titulo: 'Nueva venta',
  tipo: 'venta',
  owner_id: 'yyy',

  // ✅ Campos de FASE 1.1 (Pipeline)
  nombre_contacto: 'Juan Pérez',
  empresa: 'Acme Corp',
  email_contacto: 'juan@acme.com',
  pipeline_status: 'hot',
  valor_potencial: 5000,

  // ✅ Campos de FASE 1.2 (Cobros)
  cobro_estado: 'pendiente',
  cobro_fecha_esperada: '2026-02-15',

  // ✅ Campos de FASE 1.3 (Costes)
  costes_detalle: {
    materiales: 500,
    subcontratacion: 1200,
    marketing: 300
  }
};
```

### ❌ INCORRECTO: Importar desde `/integrations/supabase/types`

```typescript
// ❌ NO USAR - No tiene los campos nuevos
import { Tables } from '@/integrations/supabase/types';

type OBV = Tables<'obvs'>; // ⚠️ Le faltan 14 campos!
```

---

## 📦 TIPOS DISPONIBLES

### Tablas Principales

| Tipo | Descripción |
|------|-------------|
| `OBV` | Tabla obvs con TODOS los campos (31 originales + 14 nuevos) |
| `OBVInsert` | Para insertar nueva OBV |
| `OBVUpdate` | Para actualizar OBV |
| `CobroParcial` | Tabla de pagos en cuotas |
| `OBVPipelineHistory` | Historial de cambios de pipeline |

### Views (FASE 1.5)

| Tipo | Descripción | View SQL |
|------|-------------|----------|
| `CRMCerradosGanados` | OBVs ganadas con datos de contacto | `crm_cerrados_ganados` |
| `MemberStatsComplete` | Estadísticas completas de miembros | `member_stats_complete` |
| `ProjectStatsComplete` | Estadísticas de proyectos | `project_stats_complete` |
| `TopProductosRentables` | Productos más rentables | `top_productos_rentables` |
| `TopClientesValor` | Mejores clientes por facturación | `top_clientes_valor` |
| `DashboardCobros` | Métricas globales de cobros | `dashboard_cobros` |
| `AnalisisCostesGlobal` | Desglose de costes global | `analisis_costes_global` |
| `AnalisisCostePorProyecto` | Costes por proyecto | `analisis_costes_por_proyecto` |
| `ForecastIngresos` | Proyección de ingresos 30 días | `forecast_ingresos` |

### Tipos Auxiliares

| Tipo | Descripción |
|------|-------------|
| `CostesDetalle` | Desglose JSONB de costes (7 categorías) |
| `LeadStatus` | Estados del pipeline de ventas |
| `CobroEstado` | Estados del sistema de cobros |

---

## 🔧 EJEMPLOS DE USO

### 1. Crear OBV con Pipeline

```typescript
import { supabase } from '@/integrations/supabase/client';
import { OBVInsert } from '@/types';

const nuevaOBV: OBVInsert = {
  titulo: 'Venta Web Acme Corp',
  tipo: 'venta',
  owner_id: userId,
  project_id: projectId,
  es_venta: true,

  // Pipeline
  nombre_contacto: 'María García',
  empresa: 'Acme Corp',
  email_contacto: 'maria@acme.com',
  telefono_contacto: '+34 600 123 456',
  pipeline_status: 'propuesta',
  valor_potencial: 8500,
  proxima_accion: 'Enviar propuesta comercial',
  proxima_accion_fecha: '2026-02-10',

  // Venta
  facturacion: 8500,
  cantidad: 1,
  producto: 'Consultoría Digital',

  // Costes detallados
  costes_detalle: {
    subcontratacion: 3000,
    herramientas: 500,
    marketing: 200
  }
};

const { data, error } = await supabase
  .from('obvs')
  .insert(nuevaOBV)
  .select()
  .single();
```

### 2. Registrar Cobro Parcial

```typescript
import { supabase } from '@/integrations/supabase/client';
import { CobroParcialInsert } from '@/types';

const cobro: CobroParcialInsert = {
  obv_id: 'obv-id-xxx',
  monto: 2500,
  fecha_cobro: '2026-01-27',
  metodo: 'transferencia',
  notas: 'Primera cuota de 3',
  created_by: userId
};

const { data, error } = await supabase
  .from('cobros_parciales')
  .insert(cobro);

// El trigger actualizar_estado_cobro se ejecuta automáticamente
// y cambia cobro_estado de 'pendiente' a 'cobrado_parcial'
```

### 3. Consultar Dashboard de Cobros

```typescript
import { supabase } from '@/integrations/supabase/client';
import { DashboardCobros } from '@/types';

const { data, error } = await supabase
  .from('dashboard_cobros')
  .select('*')
  .single();

if (data) {
  const dashboard: DashboardCobros = data;

  console.log(`Total facturado: €${dashboard.total_facturado}`);
  console.log(`Total cobrado: €${dashboard.total_cobrado}`);
  console.log(`Pendiente: €${dashboard.total_pendiente}`);
  console.log(`Tasa morosidad: ${dashboard.tasa_morosidad_porcentaje}%`);
}
```

### 4. Consultar CRM Cerrados Ganados

```typescript
import { supabase } from '@/integrations/supabase/client';
import { CRMCerradosGanados } from '@/types';

const { data, error } = await supabase
  .from('crm_cerrados_ganados')
  .select('*')
  .order('created_at', { ascending: false });

if (data) {
  const ganados: CRMCerradosGanados[] = data;

  ganados.forEach(obv => {
    console.log(`${obv.titulo} - ${obv.empresa}`);
    console.log(`Contacto: ${obv.nombre_contacto} (${obv.email_contacto})`);
    console.log(`Valor: €${obv.facturacion}`);
  });
}
```

### 5. Análisis de Costes por Proyecto

```typescript
import { supabase } from '@/integrations/supabase/client';
import { AnalisisCostePorProyecto } from '@/types';

const { data, error } = await supabase
  .from('analisis_costes_por_proyecto')
  .select('*')
  .order('total_costes', { ascending: false });

if (data) {
  const analisis: AnalisisCostePorProyecto[] = data;

  analisis.forEach(proyecto => {
    console.log(`\n${proyecto.proyecto}:`);
    console.log(`- Materiales: €${proyecto.total_materiales}`);
    console.log(`- Subcontratación: €${proyecto.total_subcontratacion}`);
    console.log(`- Marketing: €${proyecto.total_marketing}`);
    console.log(`- Total costes: €${proyecto.total_costes}`);
    console.log(`- % sobre facturación: ${proyecto.pct_costes_sobre_facturacion}%`);
  });
}
```

---

## 🔄 MIGRACIÓN DE CÓDIGO EXISTENTE

### Antes (código viejo)

```typescript
// ❌ Código antiguo que no compila
import { Tables } from '@/integrations/supabase/types';

type OBV = Tables<'obvs'>;

const obv: OBV = {
  id: 'xxx',
  titulo: 'Test',
  tipo: 'venta',
  owner_id: 'yyy',
  nombre_contacto: 'Juan', // ⚠️ ERROR: Property does not exist
  pipeline_status: 'hot'   // ⚠️ ERROR: Property does not exist
};
```

### Después (código nuevo)

```typescript
// ✅ Código actualizado que funciona
import { OBV } from '@/types';

const obv: OBV = {
  id: 'xxx',
  titulo: 'Test',
  tipo: 'venta',
  owner_id: 'yyy',
  nombre_contacto: 'Juan', // ✅ OK
  pipeline_status: 'hot'   // ✅ OK
};
```

---

## 📊 CAMPOS NUEVOS POR FASE

### FASE 1.1: Pipeline (Unificación Leads → OBVs)

- ✅ `nombre_contacto` - Nombre del contacto
- ✅ `empresa` - Nombre de la empresa
- ✅ `email_contacto` - Email del contacto
- ✅ `telefono_contacto` - Teléfono del contacto
- ✅ `pipeline_status` - Estado en el pipeline (frio → cerrado_ganado)
- ✅ `valor_potencial` - Valor estimado de la oportunidad
- ✅ `notas` - Notas internas sobre el lead
- ✅ `proxima_accion` - Siguiente acción a realizar
- ✅ `proxima_accion_fecha` - Fecha de la próxima acción
- ✅ `responsable_id` - Responsable del seguimiento

### FASE 1.2: Sistema de Cobros

- ✅ `cobro_estado` - Estado del cobro (pendiente, cobrado_parcial, cobrado_total, atrasado)
- ✅ `cobro_fecha_esperada` - Cuándo se espera recibir el pago
- ✅ `cobro_fecha_real` - Cuándo se recibió el pago completo
- ✅ `cobro_metodo` - Método de pago usado (transferencia, tarjeta, etc.)

### FASE 1.3: Costes Detallados

- ✅ `costes_detalle` - Desglose JSONB con 7 categorías:
  - `materiales` - Materias primas
  - `subcontratacion` - Servicios externos
  - `herramientas` - Software, licencias
  - `marketing` - Publicidad, campañas
  - `logistica` - Envíos, transporte
  - `comisiones` - Comisiones de venta
  - `otros` - Otros costes

---

## ⚙️ TRIGGERS AUTOMÁTICOS

Estos triggers se ejecutan automáticamente en la base de datos:

| Trigger | Tabla | Cuándo | Qué hace |
|---------|-------|--------|----------|
| `trigger_registrar_cambio_pipeline` | `obvs` | Al cambiar `pipeline_status` | Guarda en `obv_pipeline_history` |
| `trigger_actualizar_estado_cobro` | `cobros_parciales` | Al insertar/actualizar | Actualiza `cobro_estado` en `obvs` |
| `trigger_auto_calcular_costes` | `obvs` | Al guardar `costes_detalle` | Calcula `costes` y `margen` automáticamente |

**IMPORTANTE:** No necesitas calcular `costes` ni `margen` manualmente si proporcionas `costes_detalle`.

---

## ✅ PRÓXIMOS PASOS

1. ✅ Tipos TypeScript actualizados
2. 🔄 Crear `ValidacionesView.tsx`
3. ⏳ Refactorizar `CRMView.tsx` (4 pestañas)
4. ⏳ Refactorizar `FinancieroView.tsx` (5 pestañas)
5. ⏳ Formularios dinámicos por fase de pipeline
6. ⏳ Sistema de exportación a Excel

---

**Estado:** ✅ Tipos listos para usar
**Ubicación archivos:** `src/types/database-extended.ts` y `src/types/index.ts`
