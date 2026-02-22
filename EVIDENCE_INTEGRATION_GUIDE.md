# 🎯 GUÍA DE INTEGRACIÓN - EVIDENCE SYSTEM

## ✅ LO QUE YA ESTÁ COMPLETADO

### 1. Settings > Fuentes de Evidencia ✅

**Ubicación:** `/proyecto/:projectId` → Settings → Tab "Fuentes de Evidencia"

Ya está integrado y funcional:
- Los usuarios pueden subir documentos (PDF, CSV, XLSX)
- Los documentos se indexan automáticamente con búsqueda full-text
- Todos los documentos quedan disponibles como Tier 1 sources para la IA

**Cómo probarlo:**
1. `npm run dev`
2. Abre tu proyecto en el dashboard
3. Click en "Configuración" (Settings) en el sidebar
4. Click en la nueva tab "Fuentes de Evidencia"
5. Sube un documento PDF o CSV
6. El documento se procesará automáticamente

---

## 🚀 CÓMO INTEGRAR EN PÁGINAS CON IA

Tienes 2 opciones para integrar el Evidence System en páginas que usan IA:

### OPCIÓN A: Reemplazar generación existente (Recomendado)

**Antes** (generación directa):
```tsx
// En AutoFillStep.tsx, línea 168
const response = await fetch(`${supabase.supabaseUrl}/functions/v1/scrape-and-extract`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({
    type: 'idea',
    business_pitch: businessPitch,
    // ... otros parámetros
  }),
});
```

**Después** (con Evidence System):
```tsx
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

export function AutoFillStep({ answers, onChange }: AutoFillStepProps) {
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();

  return (
    <div>
      {/* Tu UI existente */}

      {/* Reemplaza el botón de "Auto-Fill" con: */}
      <EvidenceAIGenerator
        functionName="idea-autofill"
        projectId={currentProject?.id || ''}
        userId={user?.id || ''}
        buttonLabel="🚀 Auto-Fill con Evidencias"
        additionalParams={{
          type: 'idea',
          business_pitch: businessPitch,
          website_url: websiteUrl,
          linkedin_urls: linkedinUrls,
          competitor_urls: competitorUrls,
        }}
        onGenerationComplete={(result) => {
          // result.content tiene los datos generados
          // result.evidence tiene el reporte de evidencias
          if (result.content?.data) {
            onChange('extracted_data', result.content.data);
          }
        }}
      />
    </div>
  );
}
```

**Ventajas:**
- El usuario ve el modal pre-generación
- Puede configurar Evidence Mode (Strict/Balanced/Hypothesis)
- Puede elegir qué fuentes usar
- Ve un reporte de evidencias después
- Todo el flow ya está implementado

---

### OPCIÓN B: Agregar como botón alternativo

Si no quieres reemplazar la generación existente, puedes agregar un botón adicional:

```tsx
<div className="flex gap-3">
  {/* Botón existente */}
  <Button onClick={autoFill}>
    <Sparkles className="h-4 w-4 mr-2" />
    Auto-Fill Rápido
  </Button>

  {/* Nuevo botón con Evidence */}
  <EvidenceAIGenerator
    functionName="idea-autofill"
    projectId={currentProject?.id || ''}
    userId={user?.id || ''}
    buttonLabel="Auto-Fill con Evidencias"
    buttonVariant="outline"
    additionalParams={{
      type: 'idea',
      business_pitch: businessPitch,
      // ... otros params
    }}
    onGenerationComplete={(result) => {
      onChange('extracted_data', result.content.data);
    }}
  />
</div>
```

**Ventajas:**
- No rompes el flow existente
- Los usuarios pueden elegir el modo que prefieran
- Puedes A/B test cuál funciona mejor

---

## 📄 PÁGINAS DONDE PUEDES INTEGRARLO

Encontré estas páginas que actualmente usan `scrape-and-extract`:

### 1. **AutoFillStep.tsx** (Onboarding - IDEA type)
- **Ubicación:** `src/components/onboarding/steps/AutoFillStep.tsx`
- **Función:** Auto-rellena datos desde web, LinkedIn, competidores
- **functionName sugerido:** `"idea-autofill"`
- **Integración:** Opción A o B (arriba)

### 2. **CompetitorIntelligenceStep.tsx** (Onboarding)
- **Ubicación:** `src/components/onboarding/steps/CompetitorIntelligenceStep.tsx`
- **Función:** Análisis de competencia
- **functionName sugerido:** `"competitor-intelligence"`
- **Integración:** Similar a AutoFillStep

### 3. **DataIntegrationStep.tsx** (Onboarding - EXISTING type)
- **Ubicación:** `src/components/onboarding/steps/DataIntegrationStep.tsx`
- **Función:** Integra datos de negocios existentes
- **functionName sugerido:** `"data-integration"`
- **Integración:** Similar a AutoFillStep

### 4. **StartupOSDashboard.tsx** (Dashboard principal)
- **Ubicación:** `src/components/startup-os/StartupOSDashboard.tsx`
- **Función:** Dashboard con Financial Projections, Competitor Intelligence, etc.
- **functionName sugerido:** `"financial-projections"`, `"market-research"`, etc.
- **Integración:** Agregar botones EvidenceAIGenerator en cada sección

### 5. **Cualquier otra página que genere contenido con IA**
- Business Model Canvas
- Pitch Deck Generator
- Market Research
- etc.

---

## 🎬 EJEMPLO COMPLETO: StartupOSDashboard

Aquí te muestro cómo agregar Evidence a la sección de Financial Projections:

```tsx
// En StartupOSDashboard.tsx

import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';

export function StartupOSDashboard({ projectId }: StartupOSDashboardProps) {
  const { user } = useAuth();

  return (
    <div>
      {/* ... tu código existente ... */}

      {/* En la tab de "Metrics" o donde tengas Financial Projections */}
      <TabsContent value="metrics">
        <Card>
          <CardHeader>
            <CardTitle>Financial Projections</CardTitle>
            <CardDescription>
              Proyecciones financieras basadas en datos y evidencias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Agrega el generator */}
            <EvidenceAIGenerator
              functionName="financial-projections"
              projectId={projectId}
              userId={user?.id || ''}
              buttonLabel="Generar Proyecciones Financieras"
              onGenerationComplete={(result) => {
                console.log('Proyecciones generadas:', result);
                // Aquí puedes guardar result.content en tu estado
                // o actualizar la UI con las proyecciones
              }}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
}
```

---

## ⚙️ PARÁMETROS DE EvidenceAIGenerator

```tsx
<EvidenceAIGenerator
  // REQUERIDOS
  functionName="nombre-funcion"     // Identifica qué tipo de generación
  projectId={projectId}              // ID del proyecto actual
  userId={userId}                    // ID del usuario actual

  // OPCIONALES
  buttonLabel="Texto del botón"      // Texto personalizado (default: "Generate with Evidence")
  buttonVariant="default"            // Variante del botón (default/outline/secondary/etc)
  buttonSize="default"               // Tamaño del botón (sm/default/lg)
  additionalParams={{}}              // Parámetros extra para el Edge Function
  onGenerationComplete={(result) => {}} // Callback cuando termina
  onError={(error) => {}}            // Callback si hay error
/>
```

**El resultado en onGenerationComplete tiene:**
```typescript
{
  content: any,           // Contenido generado por la IA
  evidence: {
    coverage: number,     // % de cobertura (0-100)
    mode: string,         // "strict" | "balanced" | "hypothesis"
    sources: Source[],    // Fuentes usadas
    claims: Claim[],      // Claims con citations
    conflicts: Conflict[] // Conflictos encontrados
  }
}
```

---

## 🔌 CONECTAR CON TU EDGE FUNCTION REAL

**Actualmente la generación usa MOCK DATA.**

Para conectar con tu Edge Function `scrape-and-extract` real:

1. Abre `src/hooks/useEvidenceGeneration.ts`
2. Ve a la función `generateWithEvidence` (línea ~147)
3. Reemplaza el mock data con:

```tsx
// Llamar a tu Edge Function real
const { data: { session } } = await supabase.auth.getSession();
const response = await fetch(`${supabase.supabaseUrl}/functions/v1/scrape-and-extract`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({
    function_name: config.functionName,
    project_id: config.projectId,
    user_id: config.userId,
    evidence_config: {
      mode: config.evidenceMode,
      sources: foundSources,
      strict_requirements: config.strictRequirements,
    },
    additional_params: config.additionalParams,
  }),
});

const result = await response.json();
```

---

## ✅ TESTING CHECKLIST

Antes de integrar en producción, verifica que:

1. **Settings > Fuentes de Evidencia funciona:**
   - ✅ Puedes subir documentos
   - ✅ Aparecen en la lista
   - ✅ La búsqueda funciona

2. **Modal pre-generación funciona:**
   - ✅ Se abre al click en el botón
   - ✅ Puedes cambiar Evidence Mode
   - ✅ Puedes toggle source tiers
   - ✅ Dice "Unknown until search" (no promesas falsas)

3. **Búsqueda de evidencias funciona:**
   - ✅ Busca en tus documentos (Tier 1)
   - ✅ Busca en APIs oficiales (Tier 2) - mock por ahora
   - ✅ Muestra progreso de búsqueda

4. **Generación funciona:**
   - ✅ Llama al Edge Function (o mock)
   - ✅ Muestra loader mientras genera
   - ✅ Retorna resultado

5. **Evidence Report funciona:**
   - ✅ Muestra coverage %
   - ✅ Muestra claims con citations
   - ✅ Muestra fuentes usadas
   - ✅ Los claims se expanden/colapsan

6. **Strict Mode funciona:**
   - ✅ Si coverage < 80%, muestra dialog
   - ✅ Opciones: Search More / Continue as Hypothesis / Cancel
   - ✅ Cada opción funciona correctamente

---

## 🎉 PRÓXIMOS PASOS

1. **Prueba la integración en Settings** (ya está hecho)
2. **Elige una página para integrar** (recomiendo empezar con AutoFillStep o StartupOS)
3. **Sigue el ejemplo de Opción A o B** (arriba)
4. **Prueba el flow completo** (modal → search → generate → report)
5. **Conecta con tu Edge Function real** (cuando estés listo)
6. **Despliega a producción** 🚀

---

## 🆘 AYUDA

Si tienes dudas o errores:

1. **Revisa la consola (F12)** - El sistema hace mucho logging
2. **Usa `/evidence-test`** - Página de prueba completa ya creada
3. **Lee el código de EvidenceTestPage.tsx** - Ejemplo funcional completo

---

**¿Listo para integrar?** Elige una página, sigue el ejemplo, y prueba! 🚀
