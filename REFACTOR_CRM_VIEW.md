# 🔧 Refactorización CRMView.tsx - Instrucciones

**Fecha:** 27 Enero 2026
**Estado:** ⏳ Pendiente de aplicar

---

## 📋 CAMBIOS A REALIZAR

### 1. **Imports a Añadir**

```typescript
// Agregar estos imports adicionales:
import { Phone, Sparkles, Mail, Building2, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CRMCerradosGanados, ForecastIngresos } from '@/types';
```

### 2. **State: Cambiar Tabs**

```typescript
// ANTES:
const [viewMode, setViewMode] = useState<'overview' | 'pipeline' | 'lista'>('overview');

// DESPUÉS:
const [activeTab, setActiveTab] = useState('cartera');
```

### 3. **Agregar Queries para Nuevos Datos**

```typescript
// Query: Cartera de Clientes (cerrados ganados)
const { data: clientesGanados = [], isLoading: loadingClientes } = useQuery({
  queryKey: ['crm_cerrados_ganados'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('crm_cerrados_ganados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CRMCerradosGanados[];
  },
  enabled: !isDemoMode,
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
  enabled: !isDemoMode,
});
```

### 4. **Agregar Cálculo de Métricas de Conversión**

```typescript
// Calculate metrics for conversion analysis
const conversionMetrics = useMemo(() => {
  const byStatus: Record<string, number> = {
    frio: 0, tibio: 0, hot: 0, propuesta: 0,
    negociacion: 0, cerrado_ganado: 0, cerrado_perdido: 0,
  };

  filteredLeads.forEach((l) => {
    if (l.status in byStatus) {
      byStatus[l.status]++;
    }
  });

  const total = filteredLeads.length;
  const totalValue = filteredLeads.reduce((sum, l) => sum + (l.valor_potencial || 0), 0);

  // Tasas de conversión
  const hotToProposal = byStatus.hot > 0 ? (byStatus.propuesta / byStatus.hot) * 100 : 0;
  const proposalToNegotiation = byStatus.propuesta > 0 ? (byStatus.negociacion / byStatus.propuesta) * 100 : 0;
  const negotiationToWon = byStatus.negociacion > 0 ? (byStatus.cerrado_ganado / byStatus.negociacion) * 100 : 0;
  const overallConversion = total > 0 ? (byStatus.cerrado_ganado / total) * 100 : 0;

  return {
    byStatus, total, totalValue,
    hotToProposal, proposalToNegotiation, negotiationToWon, overallConversion,
  };
}, [filteredLeads]);
```

### 5. **Cambiar Estructura de Tabs**

**ANTES (3 tabs):**
- `overview` - Vista General
- `pipeline` - Pipeline Kanban
- `lista` - Lista Detallada

**DESPUÉS (4 tabs):**
- `cartera` - Cartera de Clientes
- `conversion` - Análisis de Conversión
- `contacto` - Centro de Contacto (Pipeline Kanban)
- `prediccion` - Predicción con AI

### 6. **Implementación de Tabs**

```typescript
<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
  <TabsList className="grid w-full max-w-2xl grid-cols-4">
    <TabsTrigger value="cartera" className="flex items-center gap-2">
      <Users className="w-4 h-4" />
      Cartera Clientes
    </TabsTrigger>
    <TabsTrigger value="conversion" className="flex items-center gap-2">
      <TrendingUp className="w-4 h-4" />
      Análisis Conversión
    </TabsTrigger>
    <TabsTrigger value="contacto" className="flex items-center gap-2">
      <Phone className="w-4 h-4" />
      Centro Contacto
    </TabsTrigger>
    <TabsTrigger value="prediccion" className="flex items-center gap-2">
      <Sparkles className="w-4 h-4" />
      Predicción AI
    </TabsTrigger>
  </TabsList>

  {/* TAB 1: CARTERA DE CLIENTES */}
  <TabsContent value="cartera">
    {/* Ver clientes ganados desde view crm_cerrados_ganados */}
    {/* Mostrar tarjetas con: empresa, contacto, email, teléfono, facturación */}
  </TabsContent>

  {/* TAB 2: ANÁLISIS DE CONVERSIÓN */}
  <TabsContent value="conversion">
    {/* Métricas generales: Total pipeline, Valor total, Tasa conversión, Ganados */}
    {/* Embudo de conversión: Frío → Hot → Propuesta → Negociación → Ganado */}
    {/* Mostrar % de conversión entre cada etapa */}
  </TabsContent>

  {/* TAB 3: CENTRO DE CONTACTO */}
  <TabsContent value="contacto">
    {/* Mantener el CRMPipeline actual (Kanban) */}
    <CRMFilters ... />
    <CRMPipeline leads={filteredLeads} ... />
  </TabsContent>

  {/* TAB 4: PREDICCIÓN CON AI */}
  <TabsContent value="prediccion">
    {/* Usar view forecast_ingresos */}
    {/* Mostrar proyección total a 30 días */}
    {/* Desglose por fase: Hot (30%), Propuesta (50%), Negociación (70%) */}
    {/* Explicar cómo funciona el modelo */}
  </TabsContent>
</Tabs>
```

---

## 🎨 DISEÑO DE CADA TAB

### TAB 1: Cartera de Clientes

**Datos:** View `crm_cerrados_ganados`

**Componentes:**
- Badge con total de clientes
- Cards para cada cliente con:
  - Título OBV
  - Badge de proyecto (con color)
  - Badge "Cerrado Ganado" (verde)
  - Empresa (icon Building2)
  - Contacto + Owner (icon Users)
  - Email (link mailto:)
  - Teléfono (link tel:)
  - Facturación (grande, verde, alineado derecha)

### TAB 2: Análisis de Conversión

**Datos:** Cálculo desde `filteredLeads` (conversionMetrics)

**Secciones:**
1. **4 Cards de Métricas:**
   - Total en Pipeline
   - Valor Total (€)
   - Tasa Conversión Global (%)
   - Ganados vs Perdidos

2. **Card Embudo de Conversión:**
   - Frío (azul) - % del total
   - ↓ (flecha)
   - Hot → Propuesta (naranja) - % conversión
   - ↓
   - Propuesta → Negociación (amarillo) - % conversión
   - ↓
   - Negociación → Ganado (verde) - % conversión

   Cada fase con barra de progreso visual mostrando el %

### TAB 3: Centro de Contacto

**Datos:** `filteredLeads`

**Componentes:**
- Mantener exactamente como está ahora
- `<CRMFilters />` + `<CRMPipeline />`

### TAB 4: Predicción con AI

**Datos:** View `forecast_ingresos`

**Secciones:**
1. **Card Hero con Proyección Total:**
   - Fondo degradado purple/pink
   - Icon Sparkles
   - Monto total proyectado (grande, purple)
   - Texto: "Ingresos Proyectados (30 días)"

2. **3 Cards de Desglose:**
   - **Hot (30% prob.)** - Badge naranja, monto en naranja
   - **Propuesta (50% prob.)** - Badge amarillo, monto en amarillo
   - **Negociación (70% prob.)** - Badge verde, monto en verde

3. **Card Explicación del Modelo:**
   - Icon Sparkles
   - Título: "Cómo funciona la predicción"
   - 3 puntos numerados explicando cada fase
   - Footer con tip: "Esta proyección se actualiza automáticamente"

---

## ✅ VERIFICACIÓN POST-REFACTORIZACIÓN

Después de aplicar los cambios, verificar:

- [ ] Las 4 tabs se muestran correctamente
- [ ] Tab "Cartera Clientes" muestra datos desde `crm_cerrados_ganados`
- [ ] Tab "Análisis Conversión" calcula métricas correctamente
- [ ] Tab "Centro Contacto" mantiene funcionalidad actual (Kanban)
- [ ] Tab "Predicción AI" muestra datos desde `forecast_ingresos`
- [ ] No hay errores de TypeScript
- [ ] Los tipos `CRMCerradosGanados` y `ForecastIngresos` se importan desde `@/types`
- [ ] El modo demo sigue funcionando
- [ ] Los filtros funcionan en Tab "Centro Contacto"

---

## 📁 ARCHIVOS RELACIONADOS

- **Vista:** `src/pages/views/CRMView.tsx`
- **Tipos:** `src/types/database-extended.ts`
- **Views SQL:** `crm_cerrados_ganados`, `forecast_ingresos`
- **Componentes:** `CRMPipeline.tsx`, `CRMFilters.tsx`

---

**Estado:** ⏳ Pendiente de aplicar manualmente
**Backup:** `CRMView.tsx.backup` (por si algo falla)
