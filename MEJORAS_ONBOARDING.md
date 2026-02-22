# 🎯 PLAN DE MEJORA: GENERATIVE ONBOARDING

## CONTEXTO
El Generative Onboarding es **la parte más importante de la app** porque:
- Es donde la IA obtiene todo el contexto del proyecto
- Determina la calidad de todos los outputs futuros (tareas, roles, insights)
- Es la primera impresión del usuario con la potencia de la plataforma

## ESTADO ACTUAL

### ✅ FUNCIONES QUE EXISTEN Y FUNCIONAN

1. **extract-business-info** ✅
   - Web scraping + Claude AI
   - Extrae: nombre, descripción, industria, problema, solución, público, competidores
   - Usa Claude 3.5 Sonnet
   - **BIEN IMPLEMENTADO**

2. **generate-business-ideas** ✅
   - Genera 5-10 ideas desde frustraciones del usuario
   - Para onboarding "Sin Idea"
   - **FUNCIONAL**

3. **generate-complete-business** ✅ **KILLER FEATURE**
   - Genera negocio completo:
     * 3 opciones branding (logo DALL-E, colores, tipografía)
     * 5 productos con pricing
     * Buyer persona
     * Value proposition
     * Website HTML + deploy Vercel
     * Competitor analysis
     * Plan validación Lean Startup
   - **MUY POTENTE** - Una de las mejores features

### ❌ FUNCIONES QUE FALTAN (CRÍTICO)

El wizard intenta llamar funciones que NO existen:

1. **analyze-competitors** ❌
   - Llamado en: `handleAutoAnalyzeCompetitors()` (línea 435)
   - Impacto: Análisis automático de competidores NO funciona

2. **suggest-buyer-persona** ❌
   - Llamado en: `handleGenerateBuyerPersona()` (línea 392)
   - Impacto: Botón "Generar con IA" en paso de target customer NO funciona

3. **validate-monetization** ❌
   - Llamado en: `handleValidateMonetization()` (línea 419)
   - Impacto: Validación de modelo de negocio NO funciona

4. **analyze-competitor-urls** ❌
   - Llamado en: `handleAnalyzeCompetitorUrls()` (línea 465)
   - Impacto: Análisis visual de URLs de competidores NO funciona

---

## 🚀 PLAN DE ACCIÓN

### FASE 1: FIXES CRÍTICOS ⚡ (Prioridad MÁXIMA)

**Objetivo**: Hacer que TODAS las features del wizard funcionen

#### 1.1 Crear `analyze-competitors` Edge Function

**Input:**
```typescript
{
  startupUrl: string,
  industry: string
}
```

**Output:**
```typescript
{
  competitors: [
    {
      name: string,
      url: string,
      description: string,
      strengths: string[],
      weaknesses: string[],
      pricing: string,
      targetAudience: string,
      differentiationOpportunities: string[]
    }
  ],
  marketGaps: string[],
  positioningRecommendations: string[]
}
```

**Implementación:**
1. Usar Perplexity API o Tavily para buscar competidores en la industria
2. Para cada competidor, hacer scraping de su web
3. Claude analiza y compara features/pricing/positioning
4. Identifica gaps y oportunidades de diferenciación

#### 1.2 Crear `suggest-buyer-persona` Edge Function

**Input:**
```typescript
{
  idea: string,
  industry?: string,
  problemStatement?: string
}
```

**Output:**
```typescript
{
  suggestions: [
    "Profesionales de 30-45 años en marketing digital que buscan automatizar reportes",
    "Fundadores de startups early-stage sin equipo técnico",
    "Freelancers creativos que necesitan gestión de proyectos simple"
  ]
}
```

**Implementación:**
1. Claude analiza la idea
2. Genera 3-5 buyer personas específicos y accionables
3. Incluye: edad, rol, pain points, motivaciones

#### 1.3 Crear `validate-monetization` Edge Function

**Input:**
```typescript
{
  model: string, // "SaaS", "Marketplace", "E-commerce", etc.
  idea: string,
  targetCustomer: string
}
```

**Output:**
```typescript
{
  validation: {
    viability: "high" | "medium" | "low",
    pros: string[],
    cons: string[],
    examples: string[], // Empresas similares que usan este modelo
    recommendations: string[]
  }
}
```

**Implementación:**
1. Claude analiza el fit entre modelo de monetización e idea
2. Busca ejemplos reales de empresas similares
3. Da feedback específico sobre viabilidad

#### 1.4 Crear `analyze-competitor-urls` Edge Function

**Input:**
```typescript
{
  urls: string[],
  myIdea: string
}
```

**Output:**
```typescript
{
  competitors: [
    {
      url: string,
      name: string,
      mainFeatures: string[],
      pricing: { plan: string, price: string }[],
      strengths: string[],
      weaknesses: string[],
      screenshots?: string[] // Optional: captura visual
    }
  ],
  differentiationStrategies: string[],
  pricingInsights: string
}
```

**Implementación:**
1. Para cada URL hacer scraping
2. Extraer features, pricing, value prop
3. Claude hace análisis comparativo
4. (Opcional) Usar Browserless para screenshots

---

### FASE 2: MEJORAS DE CONTEXTO 🧠 (Semana 2)

**Objetivo**: Capturar MÁS contexto del usuario para mejorar outputs futuros

#### 2.1 Añadir campos estratégicos al wizard

**Para "Tengo Idea":**
- [ ] **Competitors known better**: Permitir describir competidores en texto libre
- [ ] **Unique advantage**: "¿Qué tienes tú que ellos no?"
- [ ] **Go-to-market strategy**: "¿Cómo conseguirás tus primeros 10 clientes?"
- [ ] **Revenue goal (Year 1)**: "¿Cuánto quieres facturar el primer año?"

**Para "Startup Funcionando":**
- [ ] **Current challenges** (multi-select):
  - Adquisición de clientes
  - Retención/churn
  - Product-market fit
  - Escalabilidad técnica
  - Funding
- [ ] **Top 3 OKRs**: "¿Cuáles son tus 3 objetivos principales este trimestre?"
- [ ] **Tech stack**: Qué tecnologías usan (para mejores sugerencias técnicas)

#### 2.2 Añadir paso de "Visión" al final

Después de completar el onboarding técnico, añadir un paso emocional:

```
"Imagina que es dentro de 2 años y tu proyecto es un éxito rotundo.
¿Cómo describirías ese éxito?"
```

Esto ayuda a la IA a:
- Generar tareas alineadas con la visión
- Priorizar features según impacto
- Dar coaching más personalizado

---

### FASE 3: INTEGRACIÓN CON FUENTES EXTERNAS 🔌 (Semana 3)

#### 3.1 Integración con LinkedIn Profile

Si el usuario tiene LinkedIn conectado:
- Extraer skills, experiencia, network
- Auto-rellenar "situación actual" en onboarding "Sin Idea"
- Sugerir ideas basadas en expertise real

#### 3.2 Integración con Google Analytics (para "Startup Funcionando")

Si pegan URL de web:
- Pedir permiso para conectar GA
- Auto-extraer: tráfico, tasa conversión, fuentes tráfico
- Mucho más preciso que pedir métricas manualmente

#### 3.3 Integración con Product Hunt / Crunchbase

Para análisis de competencia:
- Buscar competidores en Product Hunt
- Ver lanzamientos recientes en la industria
- Analizar funding de competidores (Crunchbase)

---

### FASE 4: MEJORAS DE UX/UI 🎨 (Semana 4)

#### 4.1 Visualización de progreso mejorada

En lugar de solo "Paso X de Y", mostrar:
```
[=========>       ] 60% completado
⏱️ Tiempo estimado restante: 3 minutos
```

#### 4.2 Preview en tiempo real

Mientras el usuario escribe su idea, mostrar:
- Industria detectada automáticamente
- Buyer persona preliminar
- Competidores potenciales

Esto hace el onboarding más "mágico" y reactivo.

#### 4.3 Auto-save granular

Guardar cada respuesta inmediatamente (no solo en localStorage):
- Guardar en DB tabla `onboarding_drafts`
- Permitir continuar desde cualquier dispositivo
- Menos riesgo de perder progreso

#### 4.4 Ejemplos contextuales

En cada pregunta, mostrar 2-3 ejemplos reales:

```
Pregunta: "¿Qué problema resuelve tu idea?"

Ejemplos:
🔹 Airbnb: "Los hoteles son caros y impersonales"
🔹 Uber: "Es difícil conseguir un taxi cuando lo necesitas"
🔹 Notion: "Las herramientas de productividad están fragmentadas"
```

---

### FASE 5: VALIDACIÓN AUTOMÁTICA 🤖 (Mes 2)

#### 5.1 Market Research automático

Después del onboarding, lanzar automáticamente:
- [ ] **Google Trends analysis**: ¿El problema está creciendo?
- [ ] **Reddit/Twitter scraping**: ¿La gente se queja de este problema?
- [ ] **Competitor traffic analysis** (via SimilarWeb API): ¿Cuánto tráfico tienen?

Generar reporte:
```
📊 VALIDACIÓN DE MERCADO

✅ Tendencia de búsqueda: +23% últimos 12 meses
⚠️ Competencia: Alta (15 competidores directos)
✅ Conversaciones online: 234 menciones/mes en Reddit
💡 Recomendación: Nicho viable pero saturado.
   Diferenciación crítica: [insights]
```

#### 5.2 Pricing Validation con IA

Claude analiza:
- Pricing de 10 competidores
- Value proposition del usuario
- Target customer
- Features propuestos

Output:
```
💰 ANÁLISIS DE PRICING

Competidores cargan: $29-99/mes
Tu propuesta: $49/mes

✅ Precio competitivo
✅ Alineado con features
⚠️ Considera tier gratuito para adquisición

Estrategia sugerida:
- Free: [features básicos]
- Pro ($49): [features actuales]
- Enterprise ($199): [añadir estas features]
```

---

### FASE 6: OUTPUTS MEJORADOS 📦 (Mes 2)

Después de completar onboarding, generar automáticamente:

#### 6.1 Pitch Deck (10 slides)
- Problema
- Solución
- Mercado
- Producto
- Business Model
- Competencia
- Go-to-Market
- Equipo
- Financiero
- Ask

#### 6.2 One-Pager para inversores
- PDF de 1 página con lo esencial
- Diseñado profesionalmente
- Listo para enviar

#### 6.3 Landing Page completa
- No solo HTML, sino deployada en Vercel/Netlify
- Con dominio temporal (ej: proyecto-123.optimus-k.app)
- Optimizada para conversión
- Integrada con Mailchimp/ConvertKit para leads

#### 6.4 Primera campaña de validación
- 3 experimentos Lean Startup específicos
- Con métricas de éxito definidas
- Guía paso a paso para ejecutar

---

## 📊 MÉTRICAS DE ÉXITO

Para medir si las mejoras funcionan:

### Métricas de Calidad del Onboarding
- **Completion rate**: % usuarios que terminan onboarding (objetivo: >80%)
- **Time to complete**: Tiempo promedio (objetivo: <10 min)
- **Drop-off points**: Dónde abandonan (para optimizar)

### Métricas de Calidad de Output
- **AI outputs accuracy**: % de datos generados que usuario acepta sin editar (objetivo: >70%)
- **Business validation score**: % de ideas que pasan validación automática (objetivo: >60%)
- **User satisfaction**: Rating del onboarding (objetivo: >4.5/5)

### Métricas de Impacto
- **Feature usage post-onboarding**: ¿Usan las herramientas generadas? (objetivo: >50%)
- **Project activity**: ¿Siguen activos después de 1 semana? (objetivo: >60%)
- **Referrals**: ¿Invitan a otros después de onboarding? (objetivo: >10%)

---

## ⚡ QUICK WINS (Esta Semana)

Cosas que podemos hacer YA para mejorar dramáticamente:

### 1. Arreglar funciones rotas (1 día)
- Crear las 4 edge functions faltantes
- Testear cada paso del wizard
- Fix: Asegurar que TODA la UI funcione

### 2. Mejorar prompts existentes (2 horas)
- `generate-complete-business`: Añadir más contexto al prompt
- Especificar formato de outputs más estructurado
- Añadir ejemplos de outputs buenos

### 3. Añadir validación de inputs (2 horas)
- No permitir avanzar si campos críticos están vacíos
- Validar URLs antes de procesarlas
- Dar feedback inmediato sobre calidad de inputs

### 4. Mejorar error handling (2 horas)
- Si una edge function falla, no bloquear todo el onboarding
- Permitir continuar sin esa feature
- Logging detallado para debug

---

## 🎯 RECOMENDACIÓN FINAL

**PRIORIDAD ABSOLUTA: FASE 1**

1. Crear las 4 funciones faltantes (1-2 días)
2. Testear el flujo completo end-to-end
3. Medir completion rate

**Después:**
- FASE 2 si quieres más contexto para mejor IA
- FASE 3 si quieres automatización máxima
- FASE 5 si quieres validación automática (muy diferenciador)

El onboarding es TAN importante que vale la pena invertir 2-3 semanas en hacerlo PERFECTO.

**ROI esperado:**
- Mejor onboarding → Mejor contexto IA → Mejores outputs → Mayor retención
- Si mejoras completion rate de 50% → 80% = +60% de usuarios que ven valor
- Si mejoras accuracy de outputs de 50% → 70% = -40% de tiempo editando manualmente

¿Por cuál fase empezamos?
