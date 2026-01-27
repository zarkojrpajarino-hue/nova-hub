# 🔧 Refactorización FinancieroView.tsx - Instrucciones

**Fecha:** 27 Enero 2026
**Estado:** ⏳ Pendiente de aplicar

---

## 📋 CAMBIOS A REALIZAR

### 1. **Imports a Añadir**

```typescript
// Agregar estos imports adicionales:
import { Package, ShoppingCart, AlertTriangle, Sparkles, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  DashboardCobros,
  TopProductosRentables,
  TopClientesValor,
  AnalisisCostePorProyecto,
  ForecastIngresos,
} from '@/types';
```

### 2. **State: Cambiar Tabs**

```typescript
// ANTES:
const [viewMode, setViewMode] = useState<'dashboard' | 'cobros' | 'proyecciones'>('dashboard');

// DESPUÉS:
const [activeTab, setActiveTab] = useState('dashboard');
```

### 3. **Agregar Queries para Nuevos Datos**

```typescript
// Query: Dashboard de Cobros
const { data: dashboardCobros, isLoading: loadingCobros } = useQuery({
  queryKey: ['dashboard_cobros'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('dashboard_cobros')
      .select('*')
      .single();

    if (error) throw error;
    return data as DashboardCobros;
  },
});

// Query: Alertas de Cobros Atrasados
const { data: alertasCobros = [], isLoading: loadingAlertas } = useQuery({
  queryKey: ['alertas_cobros_atrasados'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('alertas_cobros_atrasados')
      .select('*')
      .order('cobro_dias_retraso', { ascending: false });

    if (error) throw error;
    return data;
  },
});

// Query: Top Productos Rentables
const { data: topProductos = [], isLoading: loadingProductos } = useQuery({
  queryKey: ['top_productos_rentables'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('top_productos_rentables')
      .select('*')
      .order('margen_total', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as TopProductosRentables[];
  },
});

// Query: Top Clientes
const { data: topClientes = [], isLoading: loadingClientes } = useQuery({
  queryKey: ['top_clientes_valor'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('top_clientes_valor')
      .select('*')
      .order('valor_total_facturado', { ascending: false})
      .limit(10);

    if (error) throw error;
    return data as TopClientesValor[];
  },
});

// Query: Análisis de Costes por Proyecto
const { data: costesPorProyecto = [], isLoading: loadingCostes } = useQuery({
  queryKey: ['analisis_costes_por_proyecto'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('analisis_costes_por_proyecto')
      .select('*')
      .order('facturacion', { ascending: false });

    if (error) throw error;
    return data as AnalisisCostePorProyecto[];
  },
});

// Query: Forecast de Ingresos
const { data: forecast, isLoading: loadingForecast } = useQuery({
  queryKey: ['forecast_ingresos'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('forecast_ingresos')
      .select('*')
      .single();

    if (error) throw error;
    return data as ForecastIngresos;
  },
});
```

### 4. **Cambiar Estructura de Tabs**

**ANTES (3 tabs):**
- `dashboard` - Dashboard
- `cobros` - Gestión Cobros
- `proyecciones` - Proyecciones

**DESPUÉS (5 tabs):**
- `dashboard` - Dashboard
- `proyectos` - Análisis por Proyecto
- `productos` - Productos/Servicios
- `cobros` - Control de Cobros
- `prediccion` - Proyección AI

### 5. **Implementación de Tabs**

```typescript
<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
  <TabsList className="grid w-full max-w-3xl grid-cols-5">
    <TabsTrigger value="dashboard">
      <TrendingUp className="w-4 h-4" />
      Dashboard
    </TabsTrigger>
    <TabsTrigger value="proyectos">
      <BarChart3 className="w-4 h-4" />
      Por Proyecto
    </TabsTrigger>
    <TabsTrigger value="productos">
      <Package className="w-4 h-4" />
      Productos
    </TabsTrigger>
    <TabsTrigger value="cobros">
      <Receipt className="w-4 h-4" />
      Cobros
    </TabsTrigger>
    <TabsTrigger value="prediccion">
      <Sparkles className="w-4 h-4" />
      Predicción AI
    </TabsTrigger>
  </TabsList>

  {/* TAB 1: DASHBOARD */}
  <TabsContent value="dashboard">
    {/* Mantener el contenido actual */}
    {/* StatCards + RevenueEvolutionChart + ProjectBreakdownChart */}
  </TabsContent>

  {/* TAB 2: ANÁLISIS POR PROYECTO */}
  <TabsContent value="proyectos">
    {/* Usar financialMetrics (ya existe en hook) */}
    {/* O usar view analisis_costes_por_proyecto */}
    {/* Mostrar tabla con: Proyecto, Facturación, Margen, Costes, % Costes/Facturación */}
  </TabsContent>

  {/* TAB 3: PRODUCTOS/SERVICIOS */}
  <TabsContent value="productos">
    {/* Usar view top_productos_rentables */}
    {/* Mostrar top 10 productos más rentables */}
    {/* Mostrar: Producto, Nº Ventas, Facturación, Margen, % Margen */}
  </TabsContent>

  {/* TAB 4: CONTROL DE COBROS */}
  <TabsContent value="cobros">
    {/* Usar views: dashboard_cobros + alertas_cobros_atrasados */}
    {/* Métricas: Total facturado, cobrado, pendiente, atrasado */}
    {/* Lista de alertas de cobros atrasados */}
  </TabsContent>

  {/* TAB 5: PROYECCIÓN AI */}
  <TabsContent value="prediccion">
    {/* Usar view forecast_ingresos */}
    {/* Mostrar proyección a 30 días */}
    {/* Desglose por fase del pipeline */}
  </TabsContent>
</Tabs>
```

---

## 🎨 DISEÑO DE CADA TAB

### TAB 1: Dashboard (MANTENER ACTUAL)

**Datos:** Hook `useFinancieroData`

**Componentes existentes:**
- 4 StatCards (Facturación, Margen, Margen %, Pendiente Cobro)
- RevenueEvolutionChart
- ProjectBreakdownChart
- PendingPaymentsCard
- FinancialAlertsCard

**NO CAMBIAR NADA EN ESTE TAB**

### TAB 2: Análisis por Proyecto

**Datos:** Hook `useFinancieroData.financialMetrics` o view `analisis_costes_por_proyecto`

**Componentes:**
1. **Summary Cards (3):**
   - Total Proyectos Activos
   - Proyecto Top (mayor facturación)
   - Promedio Margen por Proyecto

2. **Tabla de Proyectos:**
   - Columnas:
     - Proyecto (con color badge)
     - Facturación (€)
     - Margen (€)
     - % Margen
     - Costes Totales (€)
     - % Costes/Facturación
   - Ordenar por facturación descendente
   - Resaltar proyectos con margen < 20% (warning)

3. **Gráfico de Barras:**
   - Facturación vs Margen por proyecto

### TAB 3: Productos/Servicios

**Datos:** View `top_productos_rentables` + `top_clientes_valor`

**Secciones:**

1. **Top 10 Productos:**
   - Cards o tabla con:
     - Posición (#1, #2, etc.)
     - Nombre Producto
     - Nº Ventas
     - Facturación Total (€)
     - Margen Total (€)
     - % Margen
   - Badge dorado/plata/bronce para top 3

2. **Top 10 Clientes:**
   - Cards o tabla con:
     - Posición
     - Empresa
     - Nº Compras
     - Valor Total Facturado (€)
     - Última Compra (fecha)

### TAB 4: Control de Cobros

**Datos:** Views `dashboard_cobros` + `alertas_cobros_atrasados`

**Secciones:**

1. **Métricas Globales (4 cards):**
   - Total Facturado (€)
   - Total Cobrado (€, con % del total)
   - Pendiente de Cobro (€, con % del total)
   - Atrasado (€, rojo con nº de facturas)

2. **Métricas Adicionales (2 cards):**
   - Tasa de Morosidad (%, rojo si > 5%)
   - Días Promedio de Cobro (nº, warning si > 45)

3. **Alertas de Cobros Atrasados:**
   - Lista de facturas atrasadas con:
     - Título OBV
     - Empresa/Cliente
     - Monto Pendiente (€, rojo)
     - Días de Retraso (badge rojo con número)
     - Contacto (email + teléfono)
     - Responsable
     - Botón "Contactar" (mailto: o tel:)

4. **Distribución por Estado:**
   - Badges con contadores:
     - Pendientes: X
     - Cobrado Parcial: X
     - Cobrado Total: X
     - Atrasados: X (rojo)

### TAB 5: Proyección con AI

**Datos:** View `forecast_ingresos`

**Componentes:** (Similar a CRMView predicción)

1. **Card Hero Proyección Total:**
   - Degradado purple/pink
   - Monto total proyectado a 30 días (€)
   - Icon Sparkles

2. **3 Cards Desglose:**
   - Hot (30% prob.) - naranja
   - Propuesta (50% prob.) - amarillo
   - Negociación (70% prob.) - verde

3. **Card Explicación:**
   - Cómo funciona el modelo
   - 3 fases con probabilidades
   - Nota: "Actualización automática"

4. **Timeline de Cobros Esperados** (BONUS):
   - Próximos cobros en los siguientes 30 días
   - Fecha + OBV + Monto
   - Visualización en calendario o lista

---

## 📊 DATOS Y VIEWS UTILIZADAS

| Tab | View(s) | Tipo |
|-----|---------|------|
| Dashboard | `useFinancieroData` hook | Hook personalizado |
| Por Proyecto | `analisis_costes_por_proyecto` | View SQL |
| Productos | `top_productos_rentables`, `top_clientes_valor` | Views SQL |
| Cobros | `dashboard_cobros`, `alertas_cobros_atrasados` | Views SQL |
| Predicción AI | `forecast_ingresos` | View SQL |

---

## ✅ VERIFICACIÓN POST-REFACTORIZACIÓN

Después de aplicar los cambios, verificar:

- [ ] Las 5 tabs se muestran correctamente
- [ ] Tab "Dashboard" mantiene funcionalidad actual
- [ ] Tab "Por Proyecto" muestra datos de costes y facturación
- [ ] Tab "Productos" muestra top productos y clientes
- [ ] Tab "Cobros" muestra dashboard y alertas de cobros
- [ ] Tab "Predicción AI" muestra forecast de ingresos
- [ ] No hay errores de TypeScript
- [ ] Todos los tipos se importan desde `@/types`
- [ ] Los gráficos se renderizan correctamente
- [ ] Las queries cargan datos sin errores

---

## 🎨 PALETA DE COLORES

Para consistencia visual:

- **Facturación:** Azul (#3B82F6)
- **Margen:** Verde (#22C55E)
- **Costes:** Rojo/Naranja (#EF4444)
- **Pendiente:** Amarillo (#F59E0B)
- **Atrasado:** Rojo oscuro (#DC2626)
- **AI/Predicción:** Purple (#A855F7)

---

**Estado:** ⏳ Pendiente de aplicar manualmente
**Archivos relacionados:** `FinancieroView.tsx`, `useFinancieroData.ts`
