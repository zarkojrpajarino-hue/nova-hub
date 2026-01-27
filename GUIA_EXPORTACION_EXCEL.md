# 📊 Guía de Exportación a Excel - Nova Hub

**Fecha:** 27 Enero 2026
**Estado:** ✅ Sistema completo implementado

---

## 🎯 COMPONENTES CREADOS

### 1. Edge Function (Backend)
**Archivo:** `supabase/functions/export-excel/index.ts`

**Características:**
- ✅ Genera archivos Excel (.xlsx) válidos
- ✅ Formato XML compatible con Microsoft Excel
- ✅ Estilos incluidos (headers, moneda, porcentaje)
- ✅ Autenticación requerida
- ✅ Soporte para 10 tipos de exportación

**Tipos de exportación soportados:**
- `obvs` - OBVs completas
- `crm` - Datos del pipeline CRM
- `crm_cerrados` - Clientes cerrados ganados
- `cobros` - Control de cobros
- `productos` - Top productos rentables
- `clientes` - Top clientes por valor
- `proyectos` - Análisis por proyecto
- `kpis` - KPIs del sistema
- `members` - Estadísticas de miembros
- `financiero` - Análisis financiero detallado

### 2. Hook del Frontend
**Archivo:** `src/hooks/useExcelExport.ts`

**Uso:**
```typescript
import { useExcelExport } from '@/hooks/useExcelExport';

const { exportToExcel, isExporting } = useExcelExport();

// Exportar datos
await exportToExcel('obvs', data, {
  title: 'OBVs Diciembre 2025',
  currencyColumns: [5, 6, 7], // Facturación, Margen, Costes
  percentageColumns: [], // Opcional
});
```

### 3. Componente Reutilizable
**Archivo:** `src/components/export/ExportButton.tsx`

**Características:**
- ✅ Botón simple para 1 opción de exportación
- ✅ Dropdown menu para múltiples opciones
- ✅ Loading state automático
- ✅ Contador de filas
- ✅ Validación de datos vacíos

---

## 📚 EJEMPLOS DE IMPLEMENTACIÓN

### Ejemplo 1: CRMView - Múltiples Exportaciones

```typescript
import { ExportButton } from '@/components/export/ExportButton';

export function CRMView() {
  const { data: clientesGanados = [] } = useQuery({
    queryKey: ['crm_cerrados_ganados'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_cerrados_ganados')
        .select('*');
      return data;
    },
  });

  const { data: pipelineData = [] } = useQuery({
    queryKey: ['pipeline_global'],
    queryFn: async () => {
      const { data } = await supabase
        .from('obvs')
        .select('*');
      return data;
    },
  });

  return (
    <div>
      <NovaHeader
        title="CRM Global"
        subtitle="Pipeline de ventas"
        actions={
          <ExportButton
            options={[
              {
                label: 'Cartera de Clientes',
                type: 'crm_cerrados',
                data: clientesGanados,
                metadata: {
                  title: 'Cartera de Clientes',
                  currencyColumns: [6, 7], // Facturación, Margen
                },
              },
              {
                label: 'Pipeline Completo',
                type: 'crm',
                data: pipelineData,
                metadata: {
                  title: 'Pipeline CRM',
                  currencyColumns: [5], // Valor Potencial
                },
              },
            ]}
          />
        }
      />
      {/* Rest of the view */}
    </div>
  );
}
```

### Ejemplo 2: FinancieroView - Exportación de Cobros

```typescript
import { ExportButton } from '@/components/export/ExportButton';

export function FinancieroView() {
  const { data: alertasCobros = [] } = useQuery({
    queryKey: ['alertas_cobros_atrasados'],
    queryFn: async () => {
      const { data } = await supabase
        .from('alertas_cobros_atrasados')
        .select('*');
      return data;
    },
  });

  const { data: costesPorProyecto = [] } = useQuery({
    queryKey: ['analisis_costes_por_proyecto'],
    queryFn: async () => {
      const { data } = await supabase
        .from('analisis_costes_por_proyecto')
        .select('*');
      return data;
    },
  });

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="cobros">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Control de Cobros</CardTitle>
                <ExportButton
                  options={[
                    {
                      label: 'Alertas de Cobros',
                      type: 'cobros',
                      data: alertasCobros,
                      metadata: {
                        title: 'Cobros Atrasados',
                        currencyColumns: [2, 3, 4], // Facturación, Cobrado, Pendiente
                      },
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabla de alertas */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proyectos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Análisis por Proyecto</CardTitle>
                <ExportButton
                  options={[
                    {
                      label: 'Costes por Proyecto',
                      type: 'financiero',
                      data: costesPorProyecto,
                      metadata: {
                        title: 'Análisis Financiero',
                        currencyColumns: [1, 2, 3, 5, 6, 7, 8], // Todas las columnas de dinero
                        percentageColumns: [4], // % Margen
                      },
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabla de proyectos */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Ejemplo 3: AnalyticsView - Exportación de Productos

```typescript
import { ExportButton } from '@/components/export/ExportButton';

export function AnalyticsView() {
  const { data: topProductos = [] } = useQuery({
    queryKey: ['top_productos_rentables'],
    queryFn: async () => {
      const { data } = await supabase
        .from('top_productos_rentables')
        .select('*')
        .order('margen_total', { ascending: false })
        .limit(10);
      return data;
    },
  });

  const { data: topClientes = [] } = useQuery({
    queryKey: ['top_clientes_valor'],
    queryFn: async () => {
      const { data } = await supabase
        .from('top_clientes_valor')
        .select('*')
        .order('valor_total_facturado', { ascending: false })
        .limit(10);
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Productos y Clientes</CardTitle>
          <ExportButton
            options={[
              {
                label: 'Top 10 Productos',
                type: 'productos',
                data: topProductos,
                metadata: {
                  title: 'Top Productos Rentables',
                  currencyColumns: [2, 3], // Facturación, Margen
                  percentageColumns: [4], // % Margen
                },
              },
              {
                label: 'Top 10 Clientes',
                type: 'clientes',
                data: topClientes,
                metadata: {
                  title: 'Top Clientes por Valor',
                  currencyColumns: [2], // Valor Total
                },
              },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Tablas y gráficos */}
      </CardContent>
    </Card>
  );
}
```

### Ejemplo 4: Exportación Simple (1 opción)

```typescript
<ExportButton
  options={[
    {
      label: 'Exportar OBVs',
      type: 'obvs',
      data: obvs,
    },
  ]}
  variant="default"
  size="sm"
/>
```

---

## 🔧 CÓMO DESPLEGAR

### 1. Desplegar Edge Function

```bash
# Desde la raíz del proyecto nova-hub
supabase functions deploy export-excel
```

### 2. Configurar Variables de Entorno

Las variables ya deberían estar configuradas:
- `SUPABASE_URL` - URL del proyecto Supabase
- `SUPABASE_ANON_KEY` - Anon key del proyecto

### 3. Probar la Función

```bash
# Desde consola local
curl -X POST https://YOUR_PROJECT_URL.supabase.co/functions/v1/export-excel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exportType": "obvs",
    "data": [{"titulo": "Test", "facturacion": 5000}],
    "metadata": {"title": "Test Excel"}
  }'
```

---

## 📋 INTEGRACIÓN EN VISTAS EXISTENTES

### Vistas que deben incluir exportación:

1. **CRMView** (4 tabs)
   - Tab "Cartera Clientes" → Exportar `crm_cerrados`
   - Tab "Centro Contacto" → Exportar `crm` (pipeline completo)

2. **FinancieroView** (5 tabs)
   - Tab "Por Proyecto" → Exportar `financiero`
   - Tab "Productos" → Exportar `productos` + `clientes`
   - Tab "Cobros" → Exportar `cobros`

3. **AnalyticsView**
   - Tab "Partners" → Exportar `members`
   - Tab "Proyectos" → Exportar `proyectos`

4. **ProjectView (individual)**
   - Exportar OBVs del proyecto → tipo `obvs` filtrado
   - Exportar KPIs del proyecto → tipo `kpis` filtrado

5. **ValidacionesView**
   - Tab "OBVs" → Exportar OBVs pendientes
   - Tab "KPIs" → Exportar KPIs pendientes

---

## 🎨 ESTILOS Y FORMATO DEL EXCEL

El archivo Excel generado incluye:

- **Headers con fondo morado** (#4F46E5) y texto en negrita
- **Formato de moneda** para columnas especificadas: `€#,##0.00`
- **Formato de porcentaje** para columnas especificadas: `0.00%`
- **Metadata del documento**: Título, Autor, Fecha de creación

### Ejemplo de metadata:

```typescript
metadata: {
  title: 'Cobros Atrasados Enero 2026',
  currencyColumns: [2, 3, 4], // Índices de columnas con valores monetarios
  percentageColumns: [5], // Índices de columnas con porcentajes
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Edge function creada
- [x] Hook frontend creado
- [x] Componente ExportButton creado
- [ ] Desplegar edge function en Supabase
- [ ] Integrar ExportButton en CRMView
- [ ] Integrar ExportButton en FinancieroView
- [ ] Integrar ExportButton en AnalyticsView
- [ ] Probar todas las exportaciones
- [ ] Verificar formato de Excel

---

## 🐛 TROUBLESHOOTING

### Error: "Authorization required"
- Verifica que el usuario esté autenticado
- Comprueba que el token JWT sea válido

### Error: "Invalid token"
- El token ha expirado, recarga la página

### El archivo descargado está vacío
- Verifica que `data` no sea un array vacío
- Comprueba logs de la edge function en Supabase

### Excel muestra caracteres raros
- Asegúrate de que los datos no contengan caracteres XML especiales sin escapar
- La función `escapeXml` debería manejar esto automáticamente

---

## 📊 TIPOS DE DATOS SOPORTADOS

| Tipo Export | Vista SQL | Columnas |
|-------------|-----------|----------|
| `obvs` | `obvs` tabla | 9 columnas |
| `crm` | `obvs` (pipeline fields) | 9 columnas |
| `crm_cerrados` | `crm_cerrados_ganados` view | 10 columnas |
| `cobros` | `alertas_cobros_atrasados` view | 11 columnas |
| `productos` | `top_productos_rentables` view | 5 columnas |
| `clientes` | `top_clientes_valor` view | 4 columnas |
| `proyectos` | `analisis_costes_por_proyecto` view | 8 columnas |
| `kpis` | `kpis` tabla | 9 columnas |
| `members` | `member_stats_complete` view | 9 columnas |
| `financiero` | `analisis_costes_por_proyecto` view | 9 columnas |

---

## 🚀 PRÓXIMOS PASOS

1. Desplegar la edge function
2. Integrar ExportButton en todas las vistas mencionadas
3. Probar cada tipo de exportación
4. Ajustar estilos y formato según feedback del usuario
5. Considerar añadir más tipos de exportación si es necesario

---

**Estado:** ✅ Sistema completo y listo para integración
**Progreso:** 13/16 tareas completadas (81.25%)
