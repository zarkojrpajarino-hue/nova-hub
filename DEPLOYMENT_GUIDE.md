# 🚀 GUÍA DE DEPLOYMENT - ONBOARDING 100% COMPLETO

## ✅ TODO LO QUE SE HA IMPLEMENTADO

### 1. **4 FUNCIONES IA CORE** (Ya deployadas anteriormente)
- `analyze-competitors` - Análisis de competidores
- `suggest-buyer-persona` - Generación de buyer personas
- `validate-monetization` - Validación de modelo de negocio
- `analyze-competitor-urls` - Scraping y análisis de URLs

### 2. **3 NUEVAS FUNCIONES IA** (Nuevas - Por deployar)
- `market-research` - Investigación de mercado automática
- `generate-pitch-deck` - Generador de pitch deck
- `google-analytics-sync` - Integración con Google Analytics

### 3. **COMPONENTES UX** (Nuevos - Por integrar)
- `StrategicQuestionsStep.tsx` - Preguntas estratégicas FASE 2
- `ValidatedInput.tsx` - Inputs con validación en tiempo real
- `ContextualExample.tsx` - Ejemplos contextuales
- `useAutoSave.ts` - Hook de auto-guardado cada 10s
- `validation.ts` - Utilidades de validación

---

## 📋 PASO 1: DEPLOY EDGE FUNCTIONS

### Deploy las 3 nuevas funciones

```bash
cd C:\Users\Zarko\nova-hub

# Deploy market research
supabase functions deploy market-research

# Deploy pitch deck generator
supabase functions deploy generate-pitch-deck

# Deploy Google Analytics sync
supabase functions deploy google-analytics-sync

# Verificar que todas deployaron correctamente
supabase functions list
```

**Output esperado**:
```
Functions deployed:
- analyze-competitors
- suggest-buyer-persona
- validate-monetization
- analyze-competitor-urls
- market-research ✨ NEW
- generate-pitch-deck ✨ NEW
- google-analytics-sync ✨ NEW
```

---

## 📋 PASO 2: CONFIGURAR VARIABLES DE ENTORNO

### En Supabase Dashboard

Ir a: **Project Settings → Edge Functions → Secrets**

Añadir:
```bash
# Ya configuradas (verificar)
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx  # Para DALL-E logos

# NUEVAS (para Google Analytics sync)
GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxx
GOOGLE_OAUTH_REDIRECT_URI=https://yourapp.com/auth/google/callback
```

### Cómo obtener Google OAuth credentials:

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto (o usar existente)
3. Ir a **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `https://yourapp.com/auth/google/callback`
7. Copiar Client ID y Client Secret

8. Habilitar APIs necesarias:
   - Google Analytics Data API
   - Google Analytics Admin API

---

## 📋 PASO 3: ACTUALIZAR PROYECTO METADATA SCHEMA

La tabla `projects` necesita campos nuevos para guardar progreso de onboarding y strategic questions.

### Ejecutar en SQL Editor de Supabase:

```sql
-- Añadir columna para guardar progreso de onboarding (auto-save)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{}'::jsonb;

-- Añadir columna para strategic questions
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS strategic_questions JSONB DEFAULT '{}'::jsonb;

-- Índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_projects_onboarding_progress
ON projects USING GIN (onboarding_progress);

COMMENT ON COLUMN projects.onboarding_progress IS
'Stores auto-saved onboarding wizard progress (every 10s)';

COMMENT ON COLUMN projects.strategic_questions IS
'Stores FASE 2 strategic questions (unique advantage, go-to-market, goals, etc.)';
```

---

## 📋 PASO 4: INTEGRAR COMPONENTES UX EN EL WIZARD

### Opción A: Integración Manual (Recomendada)

Editar `src/components/generative/GenerativeOnboardingWizard.tsx`:

1. **Importar componentes nuevos**:
```typescript
import { ValidatedInput } from './ValidatedInput';
import { ContextualExample } from './ContextualExample';
import { StrategicQuestionsStep } from './StrategicQuestionsStep';
import { useAutoSave } from '@/hooks/useAutoSave';
import {
  validateProblemStatement,
  validateBusinessIdea,
  validateTargetCustomer,
  validateUrl,
} from '@/utils/validation';
```

2. **Añadir auto-save hook**:
```typescript
// En el componente GenerativeOnboardingWizard
const { saveNow } = useAutoSave({
  projectId: project?.id,
  data: {
    type: selectedType,
    step,
    answers: formData,
    completedSteps,
  },
  enabled: true,
  interval: 10000, // 10 segundos
});
```

3. **Reemplazar inputs básicos con ValidatedInput**:
```typescript
// ANTES:
<Textarea
  value={problemStatement}
  onChange={(e) => setProblemStatement(e.target.value)}
  placeholder="Describe el problema..."
/>

// DESPUÉS:
<ValidatedInput
  label="Problema que resuelves"
  value={problemStatement}
  onChange={setProblemStatement}
  validate={validateProblemStatement}
  type="textarea"
  placeholder="Describe el problema..."
  required
/>
```

4. **Añadir ejemplos contextuales**:
```typescript
<ValidatedInput ... />
<ContextualExample
  fieldType="problem"
  industry={detectedIndustry}
  businessType={selectedBusinessType}
/>
```

5. **Añadir strategic questions como step adicional**:
```typescript
// Después de las preguntas básicas, antes de "generate"
{step === 'strategic-questions' && (
  <StrategicQuestionsStep
    data={strategicQuestions}
    onUpdate={setStrategicQuestions}
    onNext={() => advanceToStep('preview-ready')}
    onBack={() => setStep('resources')}
    section="goToMarket"  // o 'uniqueAdvantage', 'goals', etc.
  />
)}
```

### Opción B: Integración Automática con Script

Crear `scripts/integrate-ux-improvements.ts` que hace los cambios automáticamente.

---

## 📋 PASO 5: TESTEAR FUNCIONES INDIVIDUALES

### Test 1: Market Research

```bash
# Desde consola del navegador o Postman
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/market-research', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    idea: 'Una app de gestión de proyectos ultra simple',
    industry: 'SaaS',
    targetCustomer: 'Startups de 5-20 personas',
    problemStatement: 'Jira es demasiado complejo para equipos pequeños'
  })
});

const data = await response.json();
console.log(data.report);
```

**Output esperado**:
- `viabilityScore`: high/medium/low
- `trendsAnalysis`: Array de keywords con trends
- `socialListening`: Menciones de Reddit/Twitter
- `marketSize`: TAM y SAM estimados
- `keyFindings`, `redFlags`, `opportunities`
- `recommendation`: GO/NO-GO con justificación

### Test 2: Pitch Deck

```bash
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/generate-pitch-deck', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    projectId: 'your-project-id',
    businessName: 'ProjectX',
    tagline: 'Project Management That Works',
    problemStatement: 'Teams waste 10h/week on complex tools',
    solution: '1-click setup, AI-powered roadmaps',
    targetCustomer: 'Startups 5-20 employees',
    revenueModel: 'Freemium SaaS',
    branding: {
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED'
    }
  })
});

const data = await response.json();
console.log(data.pitchDeck.slides); // 10 slides
```

### Test 3: Google Analytics Sync

```bash
# Primero obtener OAuth URL
const authResponse = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/google-analytics-sync', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    projectId: 'your-project-id'
  })
});

// Esto devolverá authUrl - el usuario debe ir a esa URL y autorizar
// Luego Google redirige con un 'code' que usas para sync

const syncResponse = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/google-analytics-sync', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    projectId: 'your-project-id',
    authCode: 'code-from-google-redirect'
  })
});

const metrics = await syncResponse.json();
console.log(metrics); // totalUsers, conversions, topSources, etc.
```

---

## 📋 PASO 6: TESTEAR FLUJO COMPLETO

### Test end-to-end de onboarding mejorado:

1. **Login** a la app
2. Ir a `/select-onboarding-type`
3. Seleccionar "Tengo una idea"

4. **Verificar auto-save**:
   - Llenar pregunta 1
   - Esperar 10 segundos
   - Refrescar página
   - Debe mostrar "Progreso guardado detectado"

5. **Verificar validación en tiempo real**:
   - Escribir problema muy corto: "difícil"
   - Debe mostrar error: "Sé más específico (mínimo 5 palabras)"
   - Escribir problema largo y específico
   - Debe mostrar checkmark verde ✅

6. **Verificar ejemplos contextuales**:
   - Debe mostrar ejemplo bueno/malo según el tipo de negocio

7. **Completar preguntas básicas** → Generar buyer persona con IA ✨

8. **Completar strategic questions FASE 2**:
   - Unique Advantage
   - Go-to-Market
   - Goals & OKRs
   - Challenges

9. **Generar negocio completo**

10. **Verificar outputs**:
    - Branding (3 opciones)
    - Productos (5 con pricing)
    - Buyer Persona
    - Competitor Analysis
    - Validation Experiments
    - Website Structure
    - **Market Research Report** ✨ NEW
    - **Pitch Deck** ✨ NEW

---

## 📋 PASO 7: VERIFICAR LOGGING & ANALYTICS

```sql
-- Ver últimas generaciones IA
SELECT
  function_name,
  success,
  execution_time_ms,
  tokens_used,
  cost_usd,
  created_at
FROM ai_generations_log
ORDER BY created_at DESC
LIMIT 20;

-- Ver analytics agregados
SELECT * FROM ai_generations_analytics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, total_calls DESC;
```

**Verificar**:
- ✅ Todas las llamadas se loguean
- ✅ Costos se calculan correctamente
- ✅ Success rate > 95%
- ✅ Execution time < 5000ms promedio

---

## 🎯 CHECKLIST FINAL

### Funciones IA:
- [ ] `market-research` deployada y funcionando
- [ ] `generate-pitch-deck` deployada y funcionando
- [ ] `google-analytics-sync` configurada con OAuth

### UX Improvements:
- [ ] Auto-save cada 10s funciona
- [ ] Validación en tiempo real funciona
- [ ] Ejemplos contextuales se muestran
- [ ] Strategic questions FASE 2 integradas

### Testing:
- [ ] Market research genera reports completos
- [ ] Pitch deck genera 10 slides
- [ ] GA sync extrae métricas (si configurado)
- [ ] Auto-save no pierde progreso
- [ ] Validaciones previenen datos incorrectos

### Analytics:
- [ ] Todas las llamadas IA se loguean
- [ ] Costos se trackean correctamente
- [ ] Dashboard analytics funciona

---

## 🐛 TROUBLESHOOTING

### "Market research devuelve error"
- Verificar `ANTHROPIC_API_KEY` configurada
- Verificar límite de rate en Anthropic API
- Check logs: `supabase functions logs market-research`

### "Pitch deck slides incompletos"
- Aumentar `max_tokens` en la función (actualmente 4000)
- Verificar que todos los campos requeridos se envían

### "Google Analytics sync falla"
- Verificar OAuth credentials correctas
- Verificar que user autorizó los scopes necesarios
- Check que GA4 property existe (no UA)

### "Auto-save no funciona"
- Verificar columna `onboarding_progress` existe en tabla `projects`
- Verificar RLS policies permiten UPDATE
- Check browser console para errores

### "Validación demasiado estricta"
- Ajustar parámetros en `src/utils/validation.ts`
- Ej: reducir `minWords` de 5 a 3 si necesario

---

## 📊 MÉTRICAS DE ÉXITO (Después de 1 semana)

Medir estos KPIs:

1. **Completion Rate**:
   - Target: >75% (vs ~50% antes)
   ```sql
   SELECT
     COUNT(DISTINCT project_id) FILTER (WHERE function_name LIKE '%generate-complete-business%') * 100.0 /
     COUNT(DISTINCT project_id) as completion_rate
   FROM ai_generations_log;
   ```

2. **Time to Complete**:
   - Target: <10 minutos (vs ~15 antes)

3. **Output Quality** (User satisfaction):
   - Target: >4.0/5.0 rating
   ```sql
   SELECT AVG(user_rating) FROM ai_generations_log
   WHERE user_rating IS NOT NULL;
   ```

4. **Function Success Rates**:
   - Target: >95% para todas las funciones
   ```sql
   SELECT
     function_name,
     COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*) as success_rate
   FROM ai_generations_log
   GROUP BY function_name;
   ```

---

## 🚀 PRÓXIMOS PASOS (Opcional - Post-Launch)

Después de validar que todo funciona:

1. **PDF Export para Market Research**:
   - Usar jsPDF para generar PDF descargable del reporte
   - Incluir gráficos con Chart.js

2. **Pitch Deck Export to PowerPoint**:
   - Usar PptxGenJS para exportar slides a .pptx
   - Aplicar branding automáticamente

3. **A/B Testing**:
   - Testear diferentes versiones de preguntas
   - Medir cuál genera mejor completion rate

4. **User Feedback Loop**:
   - Añadir rating stars después de cada generación IA
   - Guardar en `ai_generations_log.user_rating`

---

¡Listo para deployar! 🎉
