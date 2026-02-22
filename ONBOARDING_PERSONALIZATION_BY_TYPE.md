# 🎯 PERSONALIZACIÓN POR TIPO DE ONBOARDING

## Los 3 Mundos Diferentes

| Tipo | Usuario | Objetivo | Output Principal |
|------|---------|----------|------------------|
| 🤖 **GENERATIVO** | No tiene idea clara | Generar negocio completo con IA | Negocio listo para ejecutar |
| 💡 **IDEA** | Tiene una idea específica | Validar y planificar | Plan de validación + roadmap |
| 🏢 **EXISTENTE** | Ya tiene negocio funcionando | Optimizar y escalar | Plan de crecimiento + insights |

---

## 🌍 CAPA 1: GEO-INTELLIGENCE

### 🤖 ONBOARDING GENERATIVO

**Contexto**: Usuario quiere que IA genere un negocio para él.

**Pregunta**:
```
"¿Desde dónde quieres operar el negocio?"
- 🌍 Remoto (trabajo desde cualquier lugar)
- 🏙️ Ciudad específica [autocomplete]
- 🌎 Mi ciudad pero mercado global

"¿Cuál es tu situación actual?"
- 📍 Vivo en: [Ciudad]
- 💰 Presupuesto inicial: [€/$ amount]
- ⏰ Dedicación: [Full-time / Part-time / Weekends]
- 🎯 Objetivo: [Ingresos pasivos / Negocio escalable / Side hustle]
```

**Qué generar con esta info**:

```javascript
✅ OPORTUNIDADES EN TU ZONA (Madrid, España):

🔥 NEGOCIOS VIABLES PARA TI:

1. **SaaS para PYMEs Españolas** (Scoring: 95/100)
   ✅ Pros:
   - Remoto, bajo capital inicial (€2K)
   - Mercado: 3.4M PYMEs en España
   - Competencia local: baja (mayoría son globals)
   - Tu ventaja: Hablas español nativo, conoces el mercado

   💰 Proyección:
   - Inversión inicial: €2,000
   - Break-even: 6 meses (20 clientes a €99/mo)
   - Año 1 revenue: €50K

   🎯 Nicho sugerido: Facturación electrónica (obligatoria en España 2024)

2. **E-commerce Dropshipping Europa** (Scoring: 72/100)
   ✅ Pros:
   - No necesitas inventario
   - Acceso a proveedores UE (envío rápido)

   ⚠️ Contras:
   - Competencia alta
   - Márgenes bajos (15-25%)
   - Requiere capital marketing (€5K+)

3. **Consultora B2B local** (Scoring: 65/100)
   ✅ Pros:
   - Capital cero
   - Networking en Madrid

   ⚠️ Contras:
   - No escalable
   - Trading time for money

💡 RECOMENDACIÓN IA: Opción 1 (SaaS facturación)
   Razón: Alineado con obligación legal 2024, bajo riesgo, escalable
```

**APIs necesarias**:
- Crunchbase: startups en la zona (para ver qué está funcionando)
- Numbeo: cost of living (para calcular cuánto necesita ganar)
- Google Trends: qué se busca en su región
- Government APIs: regulaciones recientes (oportunidades)

---

### 💡 ONBOARDING IDEA

**Contexto**: Usuario YA tiene una idea específica.

**Pregunta**:
```
"¿Desde dónde vas a emprender?"
- 📍 Ciudad: [autocomplete]
- 🎯 Mercado objetivo inicial: [Local / Nacional / Regional / Global]
```

**Qué generar con esta info**:

```javascript
TU IDEA: "App de nutrición personalizada con IA"
UBICACIÓN: Barcelona, España

✅ ANÁLISIS DE TU MERCADO LOCAL:

📊 TAMAÑO DE MERCADO (Barcelona):
- Población: 1.6M
- Target (adultos 25-45, clase media-alta): ~400K
- TAM estimado: €12M/año (asumiendo €30/mes, 10% penetración)

🏆 COMPETIDORES EN BARCELONA:
1. **NutriSalud BCN** (Local, 2K users)
   - Pricing: €25/mes
   - Reviews: 4.2/5
   - Debilidad: No usan IA, planes genéricos

2. **MyRealFood** (Nacional, 50K users)
   - Pricing: €9.99/mes
   - Reviews: 4.5/5
   - Fortaleza: Community fuerte
   - Debilidad: No personalización real

🌍 COMPETIDORES GLOBALES:
- MyFitnessPal (gratis, pero no personalizado)
- Noom ($60/mo, USA-focused)

💡 TU VENTAJA COMPETITIVA POTENCIAL:
1. **IA personalización real** (ellos no tienen)
2. **Foco en dieta mediterránea** (relevant para España)
3. **Integración con farmacias locales** (único)

💰 COSTOS OPERATIVOS EN BARCELONA:
- Desarrollador: €45K-60K/año
- Nutricionista: €30K-40K/año
- Marketing digital: €2K-3K/mes
- Oficina/coworking: €300-400/mes/persona

📊 BURN RATE ESTIMADO: €8K-10K/mes

🎯 PRÓXIMOS PASOS RECOMENDADOS:
1. Validar con 20 entrevistas (cafés en Barcelona)
2. MVP landing page + Typeform
3. Pre-vender a 50 early adopters
4. Buscar grant CDTI (hasta €200K)
```

**APIs necesarias**:
- Google Maps: competidores locales
- App Store/Play Store: apps similares en la región
- Glassdoor/LinkedIn: salarios locales
- Crunchbase: inversores que invirtieron en similar + geo

---

### 🏢 ONBOARDING EXISTENTE

**Contexto**: Ya tiene negocio funcionando, quiere optimizar.

**Pregunta**:
```
"¿Dónde opera tu negocio actualmente?"
- 📍 Sede principal: [Ciudad]
- 🌍 Mercados donde operas: [Multi-select: España, Francia, etc.]
- 👥 ¿Tienes equipo remoto?: [Sí/No]
- 📍 Ubicaciones de tu equipo: [Si remoto]
```

**Qué generar con esta info**:

```javascript
TU NEGOCIO: SaaS de CRM (30 clientes, €15K MRR)
UBICACIÓN: Valencia, España
MERCADOS: España 80%, Francia 15%, UK 5%

✅ ANÁLISIS DE EXPANSIÓN GEO:

📈 OPORTUNIDADES DE CRECIMIENTO:

1. **MADRID** (España) - Prioridad: ALTA
   - Tu penetración actual: 5% de tu TAM español
   - Mercado potencial: 3x más grande que Valencia
   - Ventaja: Mismo idioma, regulación, timezone
   - Inversores: 15 VCs activos en B2B SaaS
   - Acción: Contratar SDR en Madrid (€35K + comisión)

2. **BARCELONA** (España) - Prioridad: ALTA
   - Startup scene: 2º en España
   - Tu fit: Alto (muchas startups necesitan CRM)
   - Acción: Asistir a Startup Grind BCN (monthly)

3. **FRANCIA** - Prioridad: MEDIA
   - Ya tienes 15% revenue aquí (€2.2K MRR)
   - Barrera: Idioma (necesitas soporte en francés)
   - Competencia: Pipedrive dominante
   - Acción: Contratar CS bilingüe español-francés

4. **PORTUGAL** - Prioridad: ALTA (low hanging fruit)
   - Proximidad cultural + idioma similar
   - Mercado tech en crecimiento (Lisboa, Porto)
   - Competencia: Baja
   - Acción: Marketing en portugués (fácil de adaptar)

⚠️ NO PRIORIZAR:
- UK: Brexit complica pagos, ya tienes solo 5%
- LATAM: Diferencia de timezone, willingness to pay bajo

💰 OPTIMIZACIÓN DE COSTOS POR GEO:

ACTUAL (Valencia):
- 2 devs: €100K/año
- 1 sales: €40K/año
- Oficina: €400/mes
- TOTAL: €145K/año

OPTIMIZADO (Remoto):
- Contratar dev en Ucrania: €35K (vs €50K España)
- Ahorro: €30K/año
- Riesgo: Timezone, comunicación

🎯 PLAN DE ACCIÓN (próximos 6 meses):
1. Mes 1-2: Contratar SDR Madrid (€35K)
2. Mes 3: Expandir a Portugal (marketing portugués)
3. Mes 4-6: Evaluar contratar CS francés si creces >20% en Francia
4. Mes 6: Decidir si abrir oficina Madrid (cuando >50 clientes allí)
```

**APIs necesarias**:
- Google Analytics: de dónde vienen sus users actuales
- Stripe: revenue por país
- LinkedIn: dónde están sus mejores clientes
- Glassdoor: salarios en mercados potenciales

---

## 🧠 CAPA 2: ADAPTIVE QUESTIONING

### 🤖 ONBOARDING GENERATIVO

**Flow de preguntas**:

```javascript
// PASO 1: Descubrir al founder
"¿Cuál es tu background profesional?"
- 💼 Empleado corporativo
- 👨‍💻 Freelancer/Consultor
- 🎓 Recién graduado
- 🏢 Emprendedor serial
- 🎨 Creativo/Artista

// PASO 2: Skills assessment
"¿Qué sabes hacer bien?" [Multi-select]
- Programación
- Diseño
- Marketing
- Ventas
- Operaciones
- Finanzas
- Otro: ___

// PASO 3: Constraints
"¿Cuál es tu mayor limitación?"
- 💰 Capital (<€5K disponible)
- ⏰ Tiempo (solo weekends)
- 🎓 Conocimiento técnico
- 👥 Red de contactos

// PASO 4: Generar negocios según respuestas

SI (background: Empleado corporativo + skills: Marketing + constraint: Tiempo):
  ✅ Sugerir: Agencia de marketing digital part-time
  ✅ Sugerir: Newsletter de nicho con sponsors
  ❌ No sugerir: SaaS (requiere dev skills)

SI (background: Developer + skills: Programación + constraint: Capital):
  ✅ Sugerir: Micro-SaaS (puede hacer MVP solo)
  ✅ Sugerir: Plugins/Themes marketplace
  ❌ No sugerir: Hardware startup

SI (background: Recién graduado + skills: Diseño + constraint: Todo):
  ✅ Sugerir: Print-on-demand (Printful)
  ✅ Sugerir: Templates (Notion, Figma)
  ❌ No sugerir: Consultora (falta credibilidad)
```

**Output personalizado**:

```markdown
PERFIL DETECTADO:
- Empleado corporativo en finanzas
- Skills: Excel avanzado, análisis de datos
- Capital: €10K
- Tiempo: Weekends + noches
- Ubicación: Madrid

🎯 NEGOCIOS GENERADOS PARA TI (3 opciones):

## OPCIÓN 1: SaaS de automatización financiera para PYMEs (Fit: 95%)

**Por qué es perfecto para ti:**
- ✅ Usas tu expertise en finanzas (unfair advantage)
- ✅ Conoces el pain point de primera mano
- ✅ Puedes validar con tu red corporativa
- ✅ No requiere ser developer full-time (usar no-code)

**MVP en 30 días:**
1. Semana 1-2: Airtable + Zapier para automatizar reportes
2. Semana 3: Landing page + Typeform
3. Semana 4: Pre-vender a 10 empresas (€99/mo)

**Inversión inicial:** €2K (no-code tools + ads)
**Break-even:** 20 clientes (6 meses)
**Potencial año 1:** €50K revenue

## OPCIÓN 2: Newsletter financiera + Comunidad [...]
## OPCIÓN 3: Consultoría + Productización [...]
```

---

### 💡 ONBOARDING IDEA

**Flow de preguntas según tipo de idea**:

```javascript
// PASO 1: Clasificar tipo de negocio
"¿Qué tipo de negocio es tu idea?"
→ B2B SaaS

// PASO 2: Preguntas ESPECÍFICAS para B2B SaaS
"¿Cuál es tu ACV (Annual Contract Value) esperado?"
- <$1K (SMB)
- $1K-$10K (Mid-market)  ← Usuario selecciona
- $10K-$100K (Enterprise)
- >$100K (Large enterprise)

// PASO 3: Más preguntas basadas en respuesta
SI (ACV: Mid-market):
  "¿Cuál es tu ciclo de venta esperado?"
  - Self-service (<1 mes)
  - Sales-assisted (1-3 meses)  ← Usuario selecciona
  - Enterprise sales (3-12 meses)

  "¿Qué modelo de pricing?"
  - Per user
  - Per feature
  - Usage-based  ← Usuario selecciona
  - Flat fee

// PASO 4: Generar plan específico

✅ PLAN PERSONALIZADO PARA TU SAAS:

Basado en:
- ACV: $5K/año
- Ciclo de venta: 1-3 meses (sales-assisted)
- Pricing: Usage-based

📊 UNIT ECONOMICS OBJETIVO:
- CAC: <$1,500 (30% de ACV)
- LTV: >$15K (3 años retention)
- LTV/CAC ratio: >3:1 ✅

🎯 GO-TO-MARKET:
Dado tu ciclo de 1-3 meses, necesitas:
1. **Inbound marketing** (contenido SEO)
   - Blog: 2 posts/semana
   - Target keywords: long-tail, low competition

2. **Sales team pequeño**
   - Tú como founder sales (primeros 20 clientes)
   - Contratar SDR en mes 6 (cuando tengas 10 clientes)

3. **Freemium NO recomendado**
   - Con ACV $5K, prefiere free trial 14 días
   - Onboarding call obligatorio (high-touch)

❌ NO hagas:
- Self-service checkout (tu ACV lo permite sales call)
- Enterprise sales motion (muy lento para tu stage)
- Per-user pricing (usage-based da más flexibilidad)
```

**Comparación de flows por tipo**:

| Tipo de Negocio | Preguntas Únicas | Output Diferenciado |
|-----------------|------------------|---------------------|
| **B2B SaaS** | ACV, ciclo de venta, pricing model | Unit economics, GTM sales-driven |
| **E-commerce** | AOV, inventario, fulfillment | Márgenes, logistics plan |
| **Marketplace** | Supply/demand, chicken-egg | Cold-start strategy |
| **Consultora** | Rate, especialización, deliverables | Productization roadmap |
| **Content/Media** | Monetización, audience size | Sponsorship tiers, ad revenue |

---

### 🏢 ONBOARDING EXISTENTE

**Flow basado en fase actual**:

```javascript
// PASO 1: Detectar fase
"¿En qué fase está tu negocio?"
- 🌱 Pre-revenue (construyendo MVP)
- 💰 First revenue (<$10K MRR)  ← Usuario selecciona
- 📈 Growth ($10K-$100K MRR)
- 🚀 Scale (>$100K MRR)

// PASO 2: Preguntas según fase

SI (First revenue):
  // Foco: Product-market fit

  "¿Cuántos clientes pagando tienes?"
  → 8 clientes

  "¿Cuál es tu churn mensual?"
  → 15% (RED FLAG! 🚨)

  "¿Por qué se van los clientes?" [textarea]
  → "Dicen que es muy complicado de usar"

  "¿Cuántos customers has entrevistado post-churn?"
  → 0 (RED FLAG! 🚨)

// PASO 3: Generar plan de acción

⚠️ DIAGNÓSTICO CRÍTICO:

Tienes un problema de **product-market fit**, no de crecimiento.

📊 TUS NÚMEROS:
- 8 clientes
- 15% churn mensual → Retienes solo 26% a los 12 meses
- 0 entrevistas post-churn

🚨 PRIORIDAD #1: **REDUCIR CHURN**

Si no arreglas esto, cualquier dinero en marketing es tirarlo.

🎯 PLAN DE ACCIÓN (próximos 30 días):

DETÉN todo marketing y foco en retención:

Semana 1:
- ✅ Entrevistar a los 2 últimos churned customers (1h cada uno)
- ✅ Identificar patrón: ¿Por qué se van?
- ✅ Entrevistar a tus 3 mejores customers: ¿Por qué se quedan?

Semana 2-3:
- ✅ Basado en entrevistas, hacer 1-2 mejoras críticas
- ✅ Re-onboarding de clientes actuales
- ✅ Medir: ¿Churn baja?

Semana 4:
- ✅ Si churn baja a <8%, entonces volver a adquirir
- ❌ Si churn sigue alto (>10%), pivotar o matar producto

💡 MÉTRICAS A TRACKEAR:
- Churn mensual (objetivo: <5%)
- NPS (Net Promoter Score)
- Feature usage (¿qué usan los que se quedan?)

❌ NO hagas hasta que arregles churn:
- Ads
- Contratar sales
- Fundraising (nadie invierte con 15% churn)
```

**Comparación de preguntas por fase**:

| Fase | Foco | Preguntas Clave | Output |
|------|------|----------------|--------|
| **Pre-revenue** | Validación | ¿Hiciste discovery calls? ¿Cuántos? | Plan de validación |
| **First revenue** | PMF | Churn, NPS, retention | Roadmap PMF |
| **Growth** | Escalabilidad | CAC, LTV, canales | Growth playbook |
| **Scale** | Optimización | Burn múltiple, gross margin | Efficiency plan |

---

## 🎭 CAPA 4: COMPETITIVE DEEP-DIVE

### 🤖 ONBOARDING GENERATIVO

**Enfoque**: Descubrir OPORTUNIDADES (gaps en el mercado)

```javascript
// Usuario NO tiene idea todavía
// IA genera negocios BASÁNDOSE en gaps

"¿Qué industrias te interesan?" [Multi-select]
- SaaS / Tech
- E-commerce
- Salud / Wellness
- Educación
- Finanzas
- [Otra]

→ Usuario selecciona: "SaaS / Tech" + "Educación"

// IA busca gaps en esa intersección

✅ GAPS DETECTADOS (SaaS + Educación):

1. **LMS para bootcamps técnicos** (Opportunity score: 85/100)

   📊 ANÁLISIS:
   - Bootcodes creciendo 20%/año
   - Usan: Google Classroom (no diseñado para ellos)
   - Gap: No hay LMS específico para coding bootcamps

   🏆 COMPETIDORES:
   - Teachable: Genérico, no code-friendly
   - Thinkific: Igual, genérico
   - Canvas: Enterprise, muy caro

   💡 OPORTUNIDAD:
   - LMS con code playground integrado
   - Auto-grading de ejercicios
   - Slack integration nativa
   - Pricing: $99/mo por bootcamp

   📈 MERCADO:
   - 500+ bootcamps en USA/Europa
   - TAM: $50M/año
   - Ningún player dominante

2. **Plataforma de certificaciones profesionales** [...]

3. **SaaS de gestión de alumnos para academias** [...]
```

---

### 💡 ONBOARDING IDEA

**Enfoque**: Analizar competidores ESPECÍFICOS de su idea

```javascript
TU IDEA: "Duolingo pero para aprender programación"

✅ COMPETITIVE ANALYSIS:

🎯 COMPETIDORES DIRECTOS:

1. **Codecademy** ($115M revenue, Valuation: $150M)
   ✅ Strengths:
   - Brand recognition fuerte
   - 50M usuarios registrados
   - Curriculum amplio (30+ lenguajes)

   ❌ Weaknesses:
   - UX anticuada (no mobile-first)
   - Gamification débil (no engaging)
   - Pricing alto ($20/mo)
   - Retention baja (~30% MoM)

   💡 TU VENTAJA POTENCIAL:
   - Mobile-first (ellos desktop-first)
   - Gamification tipo Duolingo (adictivo)
   - Freemium agresivo (ellos paywall duro)

2. **Grasshopper** (Google, gratis)
   ✅ Strengths:
   - Gratis, brand Google
   - Mobile-native

   ❌ Weaknesses:
   - Solo JavaScript basics
   - No path a empleabilidad
   - Engagement bajo

   💡 TU VENTAJA:
   - Multi-language
   - Certificación + job board

3. **SoloLearn** (Free + $7/mo)
   ✅ Strengths:
   - Community fuerte
   - Mobile-first

   ❌ Weaknesses:
   - Monetización débil
   - Calidad de contenido inconsistente

🎯 SWOT PERSONALIZADO PARA TU IDEA:

**TUS FORTALEZAS POTENCIALES:**
1. Gamification tipo Duolingo (nadie lo hace bien)
2. Mobile-first (solo SoloLearn lo hace)
3. Pricing accesible vs Codecademy

**TUS DEBILIDADES:**
1. Brand recognition cero (vs Codecademy)
2. Sin venture backing (ellos tienen $M)
3. Content creation costoso

**OPORTUNIDADES:**
1. Mercado en crecimiento (30% YoY)
2. Codecademy tiene churn alto (opportunity)
3. Gen Z prefiere mobile (tu ventaja)

**AMENAZAS:**
1. Codecademy puede copiar tu gamification
2. YouTube gratis (competencia indirecta)

🚀 ESTRATEGIA RECOMENDADA (David vs Goliat):

**NO compitas head-to-head con Codecademy**

En vez, haz esto:

1. **Nicho primero**: "Duolingo para aprender Python"
   - Solo Python al inicio
   - Hazlo 10x mejor que nadie
   - Expande después

2. **Acquisition diferenciado**:
   - TikTok/Instagram (donde Gen Z está)
   - Codecademy no hace esto bien
   - Contenido viral sobre coding

3. **Monetization híbrido**:
   - Freemium (como Duolingo)
   - Certificación pagada ($29)
   - B2B para empresas (bootcamps)

4. **Positioning único**:
   - "Learn to code in 5 min/day while commuting"
   - Codecademy = serio, tú = fun

📊 GO-TO-MARKET:

Año 1: 10K usuarios Python (freemium)
Año 2: Expande a JavaScript + React
Año 3: B2B play (empresas usan para upskill)
```

---

### 🏢 ONBOARDING EXISTENTE

**Enfoque**: Benchmark vs competidores + identificar dónde mejorar

```javascript
TU NEGOCIO: CRM para real estate (30 clientes, €15K MRR)

✅ COMPETITIVE BENCHMARKING:

📊 TUS NÚMEROS VS COMPETENCIA:

| Métrica | Tú | Follow Up Boss | LionDesk | BoomTown |
|---------|-------|----------------|----------|----------|
| **Pricing** | €99/mo | $69/mo | $50/mo | $500/mo |
| **Clientes** | 30 | 10,000+ | 5,000+ | 2,000+ |
| **Churn** | 8%/mo | 4%/mo | 6%/mo | 3%/mo |
| **NPS** | 45 | 62 | 51 | 70 |
| **Time to value** | 14 días | 7 días | 10 días | 30 días |

⚠️ GAPS DETECTADOS:

1. **PRICING**: Estás 40% más caro que LionDesk
   - ¿Justificado por features? → Analicemos

2. **CHURN**: 2x más alto que Follow Up Boss
   - Red flag de producto o onboarding

3. **TIME TO VALUE**: 2x más lento que Follow Up Boss
   - Onboarding complicado probablemente

🎯 PLAN DE ACCIÓN:

**PRIORIDAD #1: Reducir Time to Value (14d → 7d)**

Benchmarked Follow Up Boss onboarding:
- Onboarding video (5 min)
- Setup wizard (15 min)
- Sample data pre-loaded

Tu onboarding actual:
- Manual (usuarios perdidos)
- No sample data

Acción: Copiar su onboarding

**PRIORIDAD #2: Reducir churn (8% → 5%)**

Feature comparison con Follow Up Boss:
- Tú NO tienes: Mobile app (ellos sí)
- Tú NO tienes: Email sequences (ellos sí)
- Tú SÍ tienes: WhatsApp integration (ellos no)

Acción:
1. Desarrollar mobile app (4 meses)
2. Mientras tanto, push WhatsApp como differentiator

**PRIORIDAD #3: Subir NPS (45 → 60)**

Survey a churned customers:
- "Faltan features X, Y, Z"
- "Soporte lento"

Acción:
1. Contratar CS part-time
2. Roadmap basado en feedback

📈 PROYECCIÓN:

Si implementas:
- Churn baja de 8% → 5%
- Retention sube de 40% → 60% (12 meses)
- MRR crece de €15K → €30K (12 meses)
```

---

## 💰 CAPA 5: FINANCIAL PROJECTIONS

### 🤖 ONBOARDING GENERATIVO

**Enfoque**: Proyecciones para MÚLTIPLES negocios generados

```javascript
// IA generó 3 opciones de negocio
// Mostrar proyecciones de cada uno lado a lado

📊 COMPARACIÓN FINANCIERA (3 negocios):

| Métrica | Opción 1: SaaS | Opción 2: Newsletter | Opción 3: Consultora |
|---------|----------------|----------------------|----------------------|
| **Inversión inicial** | €2K | €500 | €0 |
| **Breakeven** | 6 meses | 12 meses | 1 mes |
| **Revenue año 1** | €50K | €20K | €60K |
| **Margen bruto** | 85% | 70% | 90% |
| **Escalabilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| **Riesgo** | Medio | Bajo | Bajo |
| **Time to first €** | 90 días | 60 días | 7 días |

🎯 RECOMENDACIÓN:

Si tienes:
- €2K para invertir → Opción 1 (SaaS)
- Sin capital → Opción 3 (Consultora)
- Risk-averse → Opción 2 (Newsletter)

💡 ESTRATEGIA HÍBRIDA:

Año 1: Consultora (cash flow inmediato)
→ Genera €60K
→ Usa para vivir + invertir en SaaS

Año 2: SaaS + Consultora
→ SaaS crece a €50K
→ Consultora mantienes para estabilidad

Año 3: Full SaaS
→ Dejas consultora
→ SaaS a €200K
```

---

### 💡 ONBOARDING IDEA

**Enfoque**: Proyecciones REALISTAS para SU idea

```javascript
TU IDEA: App de nutrición con IA
UBICACIÓN: Barcelona
MODELO: Freemium ($30/mo premium)

📊 PROYECCIONES 36 MESES (Conservador):

SUPUESTOS:
- Lanzamiento: Mes 1
- Adquisición: 500 signups/mo (freemium)
- Conversión free→paid: 8%
- Churn: 5%/mo
- CAC: €25 (Instagram ads)
- COGS: 20% (API IA + nutricionista)

MES A MES (primeros 12 meses):

| Mes | Signups | Free | Paid | MRR | Costs | Burn |
|-----|---------|------|------|-----|-------|------|
| 1 | 100 | 100 | 0 | €0 | €5K | -€5K |
| 3 | 500 | 456 | 24 | €720 | €8K | -€7.3K |
| 6 | 500 | 1,200 | 96 | €2.9K | €10K | -€7.1K |
| 12 | 500 | 2,100 | 180 | €5.4K | €12K | -€6.6K |

📉 BURN TOTAL AÑO 1: €80K

⚠️ REALIDAD CHECK:

Con tu presupuesto actual (€30K):
- Solo tienes runway de 4-5 meses
- Necesitas:
  - €50K más (fundraising o revenue)
  - O reducir costs (no oficina, freelancers)
  - O bootstrap más lento (500 signups es agresivo)

🎯 ESCENARIOS:

**ESCENARIO CONSERVADOR** (250 signups/mo):
- Mes 12 MRR: €2.7K
- Burn año 1: €60K
- Break-even: Mes 22

**ESCENARIO OPTIMISTA** (750 signups/mo):
- Mes 12 MRR: €8.1K
- Burn año 1: €95K
- Break-even: Mes 14

**ESCENARIO REALISTA** (500 signups/mo):
- Mes 12 MRR: €5.4K
- Burn año 1: €80K
- Break-even: Mes 18

💡 RECOMENDACIÓN:

Plan para escenario CONSERVADOR, espera REALISTA.

Si en mes 6 estás en optimista → Acelera (contrata, ads)
Si estás en conservador → Reduce costs o fundraise
```

---

### 🏢 ONBOARDING EXISTENTE

**Enfoque**: Proyecciones desde situación ACTUAL

```javascript
TU SITUACIÓN ACTUAL:
- MRR actual: €15K (30 clientes a €500/mo)
- Crecimiento: +€2K MRR/mes (4 nuevos clientes)
- Churn: 8%/mes
- CAC: €800
- Team: Tú + 2 empleados
- Burn: €12K/mes

📊 PROYECCIONES 12 MESES:

ESCENARIO 1: **Status Quo** (sin cambios)

Con churn 8%/mes actual:
- Mes 3: €21K MRR
- Mes 6: €25K MRR
- Mes 12: €28K MRR ← Plateau por churn alto

⚠️ Problema: Churn te come el crecimiento

ESCENARIO 2: **Fix Churn** (8% → 5%)

Si reduces churn a 5%:
- Mes 3: €21K MRR
- Mes 6: €27K MRR
- Mes 12: €38K MRR ← +€10K vs status quo!

💡 Reducir churn vale €120K/año extra

ESCENARIO 3: **Growth Mode** (duplicar adquisición)

8 nuevos clientes/mes (vs 4 actual):
- Inversión ads: +€6K/mes
- Mes 12: €55K MRR
- Break-even: Mes 9

⚠️ Riesgo: Requiere €54K extra capital

🎯 RECOMENDACIÓN:

**Fase 1 (Mes 1-3): FIX CHURN**
- Costo: €0
- Impacto: +€10K MRR en 12 meses

**Fase 2 (Mes 4-6): DOBLAR ADQUISICIÓN**
- Solo cuando churn <6%
- Fundraise €50K o bootstrap más lento

**Fase 3 (Mes 7-12): SCALE**
- Contratar SDR
- Automatizar onboarding
```

---

## 🎓 CAPA 6: PERSONALIZED LEARNING PATH

### 🤖 ONBOARDING GENERATIVO

```javascript
// IA detectó que usuario es:
// - Background: Marketing
// - Skills gap: Technical, Finance
// - Negocio sugerido: SaaS

📚 TU LEARNING PATH (para ejecutar tu SaaS):

PRIORIDAD CRÍTICA (aprender ANTES de empezar):

1. **No-Code Development** (2 semanas)
   📖 Recursos:
   - Curso: "Build SaaS with Bubble" (Udemy, €20)
   - ¿Por qué? Tu idea es viable sin código
   - Meta: Tener MVP funcionando en 30 días

2. **SaaS Metrics 101** (1 semana)
   📖 Libro: "Lean Analytics" (gratis PDF)
   🎥 Video: "SaaS Metrics" por ChartMogul (YouTube)
   ¿Por qué? Necesitas trackear MRR, churn, LTV/CAC

PRIORIDAD MEDIA (aprender mientras ejecutas):

3. **Basic Finance** (ongoing)
   📖 "The Personal MBA" (Finanzas para emprendedores)
   ¿Por qué? Gestionar cash flow, entender P&L

4. **Customer Development** (1 semana)
   📖 "The Mom Test" by Rob Fitzpatrick
   ¿Por qué? Validar antes de construir

YA SABES (skip):
- ✅ Marketing & Growth (tu background)
- ✅ Content creation
```

---

### 💡 ONBOARDING IDEA

```javascript
// Usuario tiene idea: "E-commerce dropshipping ropa"
// Detectado: Sin experiencia en e-commerce

📚 LEARNING PATH ESPECÍFICO PARA E-COMMERCE:

URGENTE (antes de lanzar):

1. **Dropshipping Fundamentals** (1 semana)
   📖 Guía: "Shopify Dropshipping Guide" (gratis)
   🎥 Curso: "E-commerce Empire Bootcamp" (€50)
   ¿Por qué? Necesitas entender modelo antes de gastar

2. **Facebook Ads para E-commerce** (2 semanas)
   📖 Curso: "Facebook Ads for Shopify" (€100)
   ¿Por qué? 80% de tu adquisición vendrá de FB/IG ads

3. **Product Selection** (3 días)
   📖 Guía: "How to Find Winning Products" (gratis)
   Tool: AliExpress Dropship Center
   ¿Por qué? Producto equivocado = fracaso

DESPUÉS DEL LANZAMIENTO:

4. **Conversion Optimization** (ongoing)
   📖 "E-commerce Conversion Rate Secrets"
   ¿Por qué? Mejorar del 1% al 3% conversion = 3x revenue

NO NECESITAS (común mistake):
- ❌ SEO (toma 6+ meses, tú necesitas revenue YA)
- ❌ Email marketing avanzado (eso es para después)
```

---

### 🏢 ONBOARDING EXISTENTE

```javascript
// Negocio actual: SaaS con €15K MRR
// Fase: Early growth
// Detectado gaps: Scaling, fundraising

📚 LEARNING PATH PARA SCALE:

PRIORIDAD ALTA (próximos 3 meses):

1. **SaaS Growth Playbook** (2 semanas)
   📖 "From $10K to $100K MRR" (Baremetrics guide)
   🎥 Curso: "SaaS Growth Masterclass" (YC)
   ¿Por qué? Estás en €15K, siguiente fase es €100K

2. **Hiring for Startups** (1 semana)
   📖 "Who: The A Method for Hiring"
   ¿Por qué? Vas a necesitar contratar 2-3 personas este año

3. **Fundraising Basics** (1 semana)
   📖 YC: "How to Raise a Seed Round"
   Template: "Pitch Deck Template" (Sequoia)
   ¿Por qué? Con €15K MRR, estás ready para seed

PRIORIDAD MEDIA:

4. **Unit Economics Optimization**
   📖 "SaaS Financial Model" (Excel template)
   ¿Por qué? Optimizar CAC, LTV antes de scale

YA NO NECESITAS:
- ✅ MVP building (ya lo tienes)
- ✅ Customer discovery (tienes 30 clientes)
```

---

## 🤝 CAPA 7: COLLABORATIVE ONBOARDING

### 🤖 ONBOARDING GENERATIVO

```javascript
// Contexto: IA va a GENERAR negocio para 2 co-founders

"¿Tienes co-founder?"
→ Sí

"Invítalo a completar el onboarding también"
→ [Email enviado]

// AMBOS completan onboarding

CO-FOUNDER A:
- Background: Marketing
- Skills: Growth, content
- Quiere: Negocio escalable, exit en 5 años
- Disponibilidad: Full-time
- Capital: €10K

CO-FOUNDER B:
- Background: Developer
- Skills: Full-stack, product
- Quiere: Ingresos pasivos, lifestyle business
- Disponibilidad: Part-time (weekends)
- Capital: €5K

🚨 ANÁLISIS DE ALINEAMIENTO:

❌ **DESALINEAMIENTO CRÍTICO** (40% match)

1. **OBJETIVOS** (CRÍTICO):
   - A: Exit en 5 años (VC-backed, high-growth)
   - B: Lifestyle business (bootstrap, slow growth)

   ⚠️ INCOMPATIBLES - Discutir ANTES de empezar

2. **DEDICACIÓN** (IMPORTANTE):
   - A: Full-time
   - B: Part-time

   ⚠️ Desequilibrio puede causar resentimiento

3. **CAPITAL** (MENOR):
   - Total: €15K (suficiente para MVP)

🎯 RECOMENDACIONES:

**OPCIÓN 1: ALINEAR EXPECTATIVAS**

Meeting agenda sugerido:
1. ¿Objetivo final? (Exit vs Lifestyle)
2. Si exit: ¿Cuándo? ¿A qué valuation?
3. Si lifestyle: ¿Cuánto revenue target?
4. Dedicación: ¿B puede ir full-time en mes 6?

**OPCIÓN 2: SPLIT AMICABLEMENTE**

Si no alinean en objetivos fundamentales:
- Es mejor NO ser co-founders
- Pueden ser founder + advisor/freelancer

💡 NEGOCIO SUGERIDO (si deciden continuar):

Dado el desalineamiento, sugerir:
- **Bootstrapped SaaS** (híbrido)
- A: Full-time (60% equity)
- B: Part-time dev (30% equity + consultoría rate)
- Objetivo: €10K MRR en año 1, decidir después

No sugerir:
- ❌ VC-backed startup (B no quiere dedicación)
- ❌ Puro lifestyle (A quiere más)
```

---

### 💡 ONBOARDING IDEA

```javascript
// Contexto: 2 co-founders con MISMA idea

CO-FOUNDER A completó:
- Idea: "SaaS de HR para startups"
- Pricing: €49/mo
- Target: Startups 10-50 personas
- GTM: Content marketing

CO-FOUNDER B completó:
- Idea: "SaaS de HR para startups"
- Pricing: €99/mo  ← DIFERENTE
- Target: Startups 10-100 personas  ← DIFERENTE
- GTM: Outbound sales  ← DIFERENTE

✅ ANÁLISIS DE ALINEAMIENTO:

🎯 **VISIÓN**: 90% alineados (mismo producto base)

💰 **PRICING**: DESALINEADOS
   - A: €49/mo (market rate)
   - B: €99/mo (premium positioning)

🎯 **TARGET**: PARCIALMENTE ALINEADOS
   - A: 10-50 (SMB)
   - B: 10-100 (SMB + Mid-market)

   💡 B tiene razón: expandir a 100 da más TAM

📢 **GTM**: DESALINEADOS
   - A: Content (largo plazo, escalable)
   - B: Outbound (corto plazo, no escalable)

🎯 PREGUNTAS PARA DISCUTIR:

1. **PRICING** (CRITICAL):

   Ejercicio sugerido:
   - Hacer 10 discovery calls
   - Preguntar willingness to pay
   - Decidir basado en data, no opiniones

   Hipótesis para testar:
   - €49: Conversion 10% (1 de 10)
   - €99: Conversion 5% (1 de 20)

   ¿Cuál da más revenue?

2. **GTM** (IMPORTANT):

   Compromiso sugerido:
   - Mes 1-3: Outbound (validación rápida)
   - Mes 4+: Content (escalable)

   Usar outbound para aprender, content para scale

🎯 ROADMAP CONSENSUADO:

Basado en ambos inputs:

Mes 1-2: Build MVP
Mes 3-4: Outbound (validar pricing €49 vs €99)
Mes 5: Decidir pricing final basado en data
Mes 6+: Content marketing + inbound
```

---

### 🏢 ONBOARDING EXISTENTE

```javascript
// Contexto: 2 co-founders, negocio existente en problemas

CO-FOUNDER A (CEO):
- Diagnóstico: "Necesitamos crecer más rápido"
- Prioridad: Marketing & sales
- Propuesta: Fundraise €200K

CO-FOUNDER B (CTO):
- Diagnóstico: "Producto no está listo"
- Prioridad: Arreglar tech debt
- Propuesta: No fundraise hasta PMF

⚠️ DESALINEAMIENTO EN DIAGNÓSTICO

📊 ANÁLISIS OBJETIVO (basado en métricas):

MÉTRICAS ACTUALES:
- MRR: €15K
- Churn: 8%/mo (ALTO)
- NPS: 35 (BAJO)
- Bugs reportados: 15/semana (ALTO)
- Uptime: 95% (BAJO para SaaS)

🎯 VEREDICTO:

**CO-FOUNDER B tiene razón.**

Con churn 8% y bugs altos:
- Producto NO está listo para scale
- Fundraising sería tirar dinero en adquisición
- Nuevos customers churnarían igual

📋 PLAN CONSENSUADO:

**FASE 1 (Mes 1-3): FIX PRODUCTO** (Prioridad B)
- Sprint tech debt
- Objetivo: Churn <5%, uptime >99%
- Métrica éxito: NPS >50

**FASE 2 (Mes 4-6): GROWTH** (Prioridad A)
- Solo DESPUÉS de arreglar producto
- Doblar marketing spend
- Considerar fundraise

💡 COMPROMISO:
- A: Acepta que producto necesita fixing
- B: Comprométete a timeline (3 meses max)
- Ambos: Metrics-driven decision (no opiniones)
```

---

## 📊 CAPA 9: PROGRESSIVE PROFILING

### 🤖 ONBOARDING GENERATIVO

```javascript
FASE 1: ESSENTIALS (5 min) - TODOS los usuarios

1. "¿Cuál es tu situación?"
   - Empleado buscando side hustle
   - Desempleado buscando negocio
   - Emprendedor serial

2. "¿Qué sabes hacer bien?" [Multi-select]

3. "¿Cuánto capital tienes?" (€/$ range)

4. "¿Ubicación?" (ciudad)

5. "¿Cuánto tiempo puedes dedicar?"

→ **CON ESTO YA GENERAS**: 3 ideas de negocio + roadmap básico

FASE 2: DEEP DIVE (cuando vuelve) - OPCIONAL

Prompt: "Completaste 40%. Completa para unlock advanced features"

6. "Conecta LinkedIn" (extraer skills, network)

7. "¿Tienes co-founder?" (collaborative onboarding)

8. "¿Qué te motiva?" (dinero vs impacto)

→ **CON ESTO GENERAS**: Founder profiling, co-founder matching, learning path

FASE 3: CONTINUOUS (ongoing)

Pop-ups contextuales:
- "Detectamos que trabajaste en Google. ¿Quieres usar tu network?"
- "3 aceleradoras en tu ciudad. ¿Te interesa aplicar?"
```

---

### 💡 ONBOARDING IDEA

```javascript
FASE 1: ESSENTIALS (5 min)

1. "¿Cuál es tu idea?" (1 frase)
2. "¿Quién es el customer?"
3. "¿Qué problema resuelves?"
4. "¿Tipo de negocio?" (SaaS, E-comm, etc.)
5. "¿Ubicación?"
6. "¿Ya validaste?" (Sí/No)

→ **GENERA**: Pitch deck básico, competidores, checklist validación

FASE 2: STRATEGIC (cuando vuelve)

Profile: 45% complete

7. Preguntas específicas según tipo (adaptive questioning)
8. "¿Pricing strategy?"
9. "¿GTM plan?"
10. "¿Tienes co-founder?"

→ **GENERA**: Financial projections, GTM plan detallado, SWOT

FASE 3: EXECUTION (cuando está ejecutando)

Profile: 70% complete

11. "Conecta Google Analytics"
12. "Sube logo"
13. "¿Primera venta?" → Actualiza projections

→ **DESBLOQUEA**: AI Business Advisor, Investor matching
```

---

### 🏢 ONBOARDING EXISTENTE

```javascript
FASE 1: ESSENTIALS (3 min) - RÁPIDO

1. "¿Cuál es tu MRR actual?"
2. "¿Cuántos clientes?"
3. "¿Cuál es tu mayor problema?" [Select]
   - Adquisición
   - Retención
   - Producto
   - Fundraising

→ **GENERA**: Diagnóstico básico + top 3 recommendations

FASE 2: METRICS (cuando conecta integraciones)

Profile: 50% complete

4. "Conecta Stripe" → Auto-extraer revenue, churn
5. "Conecta GA" → Auto-extraer traffic, conversions

→ **GENERA**: Dashboards, benchmarking vs competencia

FASE 3: DEEP DIVE (para advanced features)

Profile: 75% complete

6. Unit economics (CAC, LTV, margins)
7. Team composition
8. Fundraising history

→ **DESBLOQUEA**: Investor matching, Financial modeling, Acquisition playbooks
```

---

## 🎯 IMPLEMENTACIÓN PRIORIZADA POR ONBOARDING

### 🔥 PRIORIDAD 1 (Semana 1-2):

**PARA LOS 3 ONBOARDINGS**:
1. ✅ Geo-Intelligence (ubicación + recursos locales)
2. ✅ Context Everywhere (metadata en project, todas las funciones lo usan)

**ESPECÍFICO POR TIPO**:
- 🤖 **Generativo**: Adaptive questioning (skills → negocios sugeridos)
- 💡 **Idea**: Competitive deep-dive (SWOT personalizado)
- 🏢 **Existente**: Benchmarking automático (sus métricas vs competencia)

### 🎯 PRIORIDAD 2 (Semana 3-4):

**PARA LOS 3**:
3. ✅ Financial projections personalizadas (por ubicación + tipo)
4. ✅ Progressive profiling (3 fases, gamification)

**ESPECÍFICO**:
- 🤖 **Generativo**: Multi-option comparison (3 negocios lado a lado)
- 💡 **Idea**: Validation roadmap personalizado
- 🏢 **Existente**: Growth playbook basado en su fase

### 💎 PRIORIDAD 3 (Semana 5+):

5. ✅ Collaborative onboarding (co-founders)
6. ✅ LinkedIn integration
7. ✅ Personalized learning path
8. ✅ Voice onboarding

---

## 📋 SIGUIENTE PASO

¿Quieres que implemente **PRIORIDAD 1** (Geo-Intelligence + Adaptive Questioning + Context) adaptado a los 3 tipos de onboarding?

O prefieres enfocarte en **UN** tipo específico primero (Generativo, Idea, o Existente)?
