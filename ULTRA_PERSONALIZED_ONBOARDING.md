# 🎯 ONBOARDING ULTRA-PERSONALIZADO

## El Problema Actual

Los onboardings son **genéricos**. El usuario no siente que estás creando algo especial para ÉL.

**Objetivo**: Que cada founder sienta: *"Wow, esto fue hecho ESPECÍFICAMENTE para mí y mi negocio"*

---

## 🌍 CAPA 1: GEO-INTELLIGENCE (CRÍTICO)

### ¿Qué preguntar?

```
1. ¿Desde dónde vas a emprender?
   - Ciudad exacta (autocomplete con Google Places API)
   - País

2. ¿Dónde está tu mercado objetivo inicial?
   - Local (misma ciudad)
   - Nacional (mismo país)
   - Regional (ej: Latinoamérica, Europa)
   - Global
```

### ¿Qué generar con esta info?

#### **A) Competidores Locales Reales**
```javascript
// En vez de competidores genéricos globales
❌ "Competidores: Notion, Asana, Monday.com"

// Competidores en su zona + globales
✅ "Competidores en Madrid:
   - FactorialHR (Series B, €80M raised, 200 empleados)
   - Kenjo (Series A, €12M raised, 50 empleados)

   Competidores Globales:
   - BambooHR, Gusto, etc."
```

**Cómo**:
- Scraping de Crunchbase filtrado por ubicación + industria
- Google Maps API para competidores locales
- LinkedIn Company Search API

#### **B) Inversores en su Zona**
```javascript
✅ "Inversores activos en Madrid + tu sector (HR Tech):

   🏦 VCs locales:
   - Seaya Ventures (€300M fund, invirtieron en Glovo, Cabify)
   - K Fund (€125M, invirtieron en TravelPerk, Typeform)

   👼 Angels locales:
   - Bernat Farrero (ex-founder de Typeform)
   - Iñaki Arrola (ex-CEO de Carto)

   💰 Grants disponibles:
   - CDTI (hasta €200K non-dilutive)
   - ENISA (préstamos participativos)
```

**Cómo**:
- Crunchbase API: inversores por geo + sector
- AngelList API
- Base de datos de grants por país (manual pero high value)

#### **C) Costos Operativos Reales**
```javascript
✅ "Proyecciones financieras para Madrid:

   💰 Salarios promedio (según Glassdoor):
   - Developer Senior: €50K-70K/año
   - Marketing Manager: €35K-45K/año
   - Sales Rep: €30K-40K + comisión

   🏢 Coworking:
   - WeWork Madrid: €350-500/mes por persona
   - Utopicus: €250-400/mes

   📊 Tu burn rate estimado: €15K/mes (3 personas)
```

**Cómo**:
- Glassdoor API / Numbeo API para salarios
- Scraping de coworkings por ciudad
- Cost of living APIs

#### **D) Regulaciones Específicas**
```javascript
✅ "Requisitos legales en España para SaaS:

   📋 Obligatorio:
   - Darse de alta como autónomo (€294/mes cuota)
   - RGPD compliance (multas hasta €20M)
   - Facturación electrónica obligatoria 2024

   ⚖️ Estructura legal recomendada:
   - Fase inicial: Autónomo
   - Con inversión: SL (€3K capital mínimo)
```

**Cómo**:
- Base de datos manual de regulaciones por país (high value)
- Templates legales por país

#### **E) Eventos y Aceleradoras Locales**
```javascript
✅ "Recursos en tu zona (Madrid):

   🚀 Aceleradoras:
   - Lanzadera (Valencia, pero acepta de toda España)
   - Wayra (Telefónica, Madrid)
   - Plug and Play (Madrid)

   🎪 Eventos próximos:
   - SaaStock Local Madrid (15 marzo)
   - Startup Grind Madrid (cada mes)

   🏢 Comunidades:
   - Madrid Startup Community
   - Spain Startup
```

**Cómo**:
- Database manual de aceleradoras
- Eventbrite API filtrado por ubicación + keywords
- Meetup API

---

## 🧠 CAPA 2: ADAPTIVE QUESTIONING (IA Inteligente)

### El Problema:
Hacemos las mismas preguntas a todos. Un SaaS B2B necesita info DISTINTA que un e-commerce.

### La Solución:
**Preguntas dinámicas que se adaptan según las respuestas previas**

### Ejemplo Real:

```javascript
// PREGUNTA BASE (todos)
"¿Qué tipo de negocio es?"
→ Usuario selecciona: "SaaS B2B"

// PREGUNTAS ESPECÍFICAS PARA SAAS B2B
✅ "¿Cuál es tu ciclo de venta esperado?"
   - <1 mes (self-service)
   - 1-3 meses (mid-market)
   - 3-12 meses (enterprise)

✅ "¿Cuál es tu ACV (Annual Contract Value) objetivo?"
   - <$1K (SMB)
   - $1K-10K (mid-market)
   - $10K-100K (enterprise)
   - >$100K (large enterprise)

✅ "¿Cuál es tu estrategia de pricing?"
   - Per user
   - Per feature (good-better-best)
   - Usage-based
   - Flat fee

// SI HUBIERA ELEGIDO "E-commerce" EN VEZ DE "SaaS"
// Las preguntas serían TOTALMENTE DISTINTAS:
✅ "¿Vas a manejar inventario físico?"
✅ "¿Cuál es tu estrategia de fulfillment?"
✅ "¿Cuál es tu AOV (Average Order Value) objetivo?"
```

### Implementación:

```typescript
// En strategic-questions.ts
interface QuestionRule {
  id: string;
  showIf: (answers: Answers) => boolean;
  question: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
}

const adaptiveQuestions: QuestionRule[] = [
  // B2B SaaS específico
  {
    id: 'sales_cycle',
    showIf: (ans) => ans.business_type === 'saas' && ans.customer_type === 'b2b',
    question: '¿Cuál es tu ciclo de venta esperado?',
    type: 'select',
    options: ['<1 mes', '1-3 meses', '3-12 meses', '>12 meses']
  },

  // E-commerce específico
  {
    id: 'inventory_management',
    showIf: (ans) => ans.business_type === 'ecommerce',
    question: '¿Manejarás inventario físico?',
    type: 'select',
    options: ['Sí, propio', 'Dropshipping', 'Print-on-demand', 'Digital products']
  },

  // Marketplace específico
  {
    id: 'chicken_egg',
    showIf: (ans) => ans.business_type === 'marketplace',
    question: '¿Cuál es tu estrategia para resolver el chicken-egg problem?',
    type: 'textarea',
    placeholder: 'Ej: Empezar con supply propio, luego abrir a terceros'
  }
];
```

---

## 👤 CAPA 3: FOUNDER PROFILING (LinkedIn + Social)

### ¿Qué preguntar?

```
"Conecta tu LinkedIn (opcional pero recomendado)"
→ Botón OAuth con LinkedIn
```

### ¿Qué extraer y usar?

#### **A) Background del Founder**
```javascript
// Si tiene experiencia en marketing
✅ Pitch personalizado:
   "Tu advantage: 10 años de experiencia en growth marketing.
    Destaca esto en tu pitch como 'unfair advantage'."

// Si es ingeniero
✅ Pitch personalizado:
   "Tu advantage: Background técnico. Puedes construir el MVP tú mismo.
    Burn rate inicial bajo. Destaca technical moat en pitch."

// Si trabajó en empresas grandes
✅ "Tu network incluye contactos en Google y Meta.
    Potencial para warm intros con early customers enterprise."
```

#### **B) Skills Gap Analysis**
```javascript
✅ "Basado en tu perfil, te faltan skills en:
    - Finance/Accounting → Recomendación: Contratar CFO part-time
    - Legal → Recomendación: Usar Stripe Atlas para incorporación

    Tus strengths:
    - Product development ✅
    - UX Design ✅"
```

#### **C) Co-Founder Matching**
```javascript
✅ "Basado en tu perfil (Marketing background),
    necesitas un co-founder con perfil:
    - Technical (CTO)
    - O Sales (si quieres outsourcear desarrollo)

    💡 Te conectaremos con co-founders en nuestra red"
```

---

## 🎭 CAPA 4: COMPETITIVE DEEP-DIVE PERSONALIZADO

### En vez de:
❌ "Tus competidores son: Notion, Asana, Monday"

### Hacer:
✅ **SWOT Automático Personalizado**

```markdown
## 📊 Tu Posición Competitiva (generado por IA)

### TU IDEA:
"Project management para equipos remotos con IA"

### COMPETIDORES DIRECTOS:
1. **Notion** ($10B valuation)
   - ✅ Strengths: Brand, features, integrations
   - ❌ Weaknesses: Slow, complejo, no mobile-first

2. **ClickUp** ($4B valuation)
   - ✅ Strengths: Todo-in-one, pricing agresivo
   - ❌ Weaknesses: Overwhelming UI, learning curve alto

### 🎯 TU VENTAJA COMPETITIVA (sugerida por IA):
1. **Mobile-first**: Notion/ClickUp son desktop-first
   → 60% de workers usan móvil como primary device

2. **IA nativa**: Ellos añadieron IA después (bolt-on)
   → Tú lo construyes desde día 1 (IA-native)

3. **Simplicidad**: Ellos son complejos
   → Tu foco: "Delightfully simple"

### 💡 GAPS QUE PUEDES EXPLOTAR:
- Mercado desatendido: Equipos <10 personas
- Feature ausente: Real-time voice collaboration
- Geo específico: Latinoamérica (pricing localizado)

### 🚀 GO-TO-MARKET RECOMENDADO:
1. Start with niche: "PM tool para startups <10 personas"
2. Expand después a SMBs
3. No intentar competir head-to-head con Notion
```

**Cómo implementarlo**:
```typescript
// Edge function: generate-competitive-analysis
const prompt = `
Analiza estos competidores: ${competitors}

Para la idea: ${userIdea}

Genera un SWOT detallado donde:
1. Identifiques las debilidades de cada competidor
2. Sugieras cómo ${userIdea} puede diferenciarse
3. Identifiques gaps no cubiertos en el mercado
4. Recomienda una estrategia de GTM específica

Se ULTRA específico y práctico.
`;
```

---

## 💰 CAPA 5: FINANCIAL PROJECTIONS HIPER-REALISTAS

### En vez de:
❌ Números genéricos que no significan nada

### Hacer:
✅ Proyecciones basadas en:

1. **Su ubicación** (costos reales de su ciudad)
2. **Su industria** (benchmarks de empresas similares)
3. **Su modelo de negocio** (B2B SaaS vs E-commerce tienen economics distintas)

```javascript
// Pregunta:
"¿Cuántas personas van a trabajar en el equipo inicial?"
→ 3 personas

"¿Qué roles?"
→ 1 Developer, 1 Designer, 1 Marketing

// Generar:
✅ "Proyecciones para Madrid, equipo de 3:

💰 COSTOS MENSUALES (primeros 6 meses):
- Salarios: €8,500/mes
  · Developer: €3,500 (junior, equity-heavy)
  · Designer: €2,500 (freelance)
  · Marketing: €2,500 (part-time)

- Infraestructura: €500/mes
  · AWS/Vercel: €200
  · Supabase Pro: €25
  · Tools (Figma, Linear, etc.): €275

- Marketing: €1,000/mes
  · Google Ads: €500
  · Content creation: €500

- Legal/Admin: €500/mes
  · Accountant: €300
  · Subscriptions: €200

📊 BURN RATE: €10,500/mes
📊 RUNWAY con €50K: 4.7 meses

⚠️ RECOMENDACIÓN:
Con este burn rate, necesitas:
- €126K para 12 meses de runway
- O revenue de €10K/mes en <5 meses
- O reducir equipo a 2 personas (runway: 7 meses)"
```

**Datos reales usados**:
- Glassdoor API para salarios
- Numbeo API para cost of living
- Benchmarks de industria (manual database)

---

## 🎓 CAPA 6: PERSONALIZED LEARNING PATH

### En vez de:
❌ Lista genérica de recursos

### Hacer:
✅ Learning path personalizado según:
- Su background (qué YA sabe)
- Sus gaps (qué necesita aprender)
- Su tipo de negocio

```markdown
## 📚 Tu Camino de Aprendizaje Personalizado

### PRIORIDAD ALTA (aprende esto primero):
Basado en tu perfil (Engineer sin experiencia en marketing):

1. **Growth Marketing Fundamentals** (4 semanas)
   📖 Libro: "Traction" by Gabriel Weinberg
   🎥 Curso: YCombinator Startup School
   ⏱️ Por qué primero: Es tu mayor gap y lo necesitas para adquirir customers

2. **Sales for Engineers** (2 semanas)
   📖 Libro: "The Mom Test" by Rob Fitzpatrick
   🎥 Video: "How to Sell" by Tyler Bosmeny (YC)
   ⏱️ Por qué: Necesitas validar antes de construir

### PRIORIDAD MEDIA:
3. **Fundraising Basics** (1 semana)
   📖 Guía: YC Series A Guide
   ⏱️ Por qué: Necesitarás esto en 6-12 meses

### YA SABES (skip):
- ✅ Technical/Product development
- ✅ UX Design basics
```

**Cómo generar**:
```typescript
// Basado en:
// 1. LinkedIn skills
// 2. Respuestas en onboarding
// 3. Tipo de negocio

const skills_needed = {
  'saas_b2b': ['sales', 'marketing', 'finance'],
  'ecommerce': ['supply_chain', 'marketing', 'logistics'],
  'marketplace': ['community', 'growth', 'network_effects']
};

const user_skills = linkedInProfile.skills;
const gaps = skills_needed[businessType].filter(s => !user_skills.includes(s));

// Generar learning path priorizado por gaps
```

---

## 🤝 CAPA 7: COLLABORATIVE ONBOARDING (Co-Founders)

### El Problema:
Si tienen co-founder, ambos deberían estar alineados.

### La Solución:
```
"¿Tienes co-founder(s)?"
→ Sí

"Invítalos a completar el onboarding también"
→ Envía email con link
```

### ¿Qué hacer con 2+ onboardings del mismo proyecto?

#### **A) Detectar Alineamiento**
```javascript
✅ "Análisis de alineamiento con co-founder:

🎯 VISION:
- Tú: "Ser el Notion de Latinoamérica"
- Co-founder: "Crear la mejor tool de PM del mundo"
⚠️ PARCIALMENTE ALINEADOS (80%)

💰 MONETIZACIÓN:
- Tú: "Freemium con plan Pro a $49/mo"
- Co-founder: "Freemium con plan Pro a $99/mo"
⚠️ DESALINEADOS - NECESITAN DISCUTIR

🎯 PRIORIDADES AÑO 1:
- Tú: "Product-market fit primero, revenue después"
- Co-founder: "Revenue desde mes 1"
❌ DESALINEADOS - RED FLAG"
```

#### **B) Generar Preguntas para Discutir**
```markdown
## 🚨 Temas para Discutir con tu Co-Founder

Basado en sus respuestas, tienen desalineamiento en:

1. **Pricing** (CRÍTICO)
   - Tú propones: $49/mo
   - Él propone: $99/mo

   💡 Preguntas para discutir:
   - ¿Qué evidencia tenemos para cada precio?
   - ¿Hicimos willingness-to-pay research?
   - ¿Podemos testear ambos con A/B test?

2. **Prioridades** (IMPORTANTE)
   - Diferencia en timing de monetización

   💡 Acción:
   - Definir clear milestones
   - ¿Cuándo EXACTAMENTE empezamos a cobrar?
```

**Esto es GOLD** - muchos startups fallan por co-founder misalignment.

---

## 🎙️ CAPA 8: VOICE/VIDEO ONBOARDING (Opcional)

### El Problema:
Escribir 50 respuestas es tedioso.

### La Solución:
```
"Prefiere hacer esto hablando en vez de escribiendo?"
→ [Grabar Video/Audio]
```

### Cómo funciona:
1. Usuario graba video de 10-15 minutos explicando su idea
2. Whisper API transcribe
3. GPT-4 extrae las respuestas a las preguntas del onboarding
4. Usuario solo revisa y aprueba

**Ventajas**:
- Más rápido para el usuario
- Captura MÁS contexto (tono, emoción, detalles que no escribiría)
- Más personal

**Implementación**:
```typescript
// Edge function: analyze-onboarding-video

1. Upload video to Supabase Storage
2. Send to Whisper API → transcript
3. Send transcript + questions to GPT-4:

const prompt = `
Transcript de video de onboarding:
"${transcript}"

Extrae las respuestas a estas preguntas:
1. ¿Cuál es tu idea de negocio?
2. ¿Quién es tu target customer?
3. ¿Cuál es el problema que resuelves?
...

Devuelve JSON estructurado.
`;

4. Presentar al usuario para review
5. Él solo edita lo que quiera cambiar
```

---

## 📊 CAPA 9: PROGRESSIVE PROFILING

### El Problema:
100 preguntas de golpe = usuario overwhelmed

### La Solución:
**Onboarding en capas**

#### **FASE 1: Essentials (10 preguntas - 3 minutos)**
Lo mínimo para empezar:
1. ¿Cuál es tu idea?
2. ¿Quién es el customer?
3. ¿Qué problema resuelves?
4. ¿Dónde vas a emprender? (ubicación)
5. ¿Qué tipo de negocio es?
6. ¿Tienes co-founder?
7. ¿Cuál es tu timeline? (cuándo quieres lanzar)
8. ¿Cuál es tu presupuesto inicial?
9. ¿Ya validaste la idea?
10. ¿Qué necesitas más urgentemente? (producto, customers, funding)

**→ Con esto YA podemos generar:**
- Pitch deck básico
- Competitors list
- Basic financial projections
- Checklist inicial

#### **FASE 2: Deep Dive (30 preguntas - 10 minutos)**
Cuando usuario vuelve, pedimos más:
- Estrategia de go-to-market
- Pricing strategy
- Revenue model details
- Team composition
- Technical architecture
- etc.

**→ Con esto generamos:**
- Advanced financial projections
- Go-to-market plan
- Technical roadmap
- Hiring plan

#### **FASE 3: Continuous Profiling (ongoing)**
A medida que usa el sistema:
- "Vimos que trabajas en marketing. ¿Quieres conectar tu LinkedIn?"
- "Tienes 3 competidores rastreados. ¿Quieres agregar 2 más?"
- "Tu perfil está 65% completo. Completa para desbloquear X"

**Gamification**:
```javascript
Profile Completeness: 65% ████████░░

🎁 Complete to 100% to unlock:
✅ 75%: Advanced competitor analysis
✅ 85%: Investor matching
✅ 100%: AI Co-founder feature
```

---

## 🎯 CAPA 10: CONTEXT EVERYWHERE (Memoria Total)

### El Problema:
El sistema olvida lo que dijiste en onboarding.

### La Solución:
**Cada feature usa el contexto del onboarding**

#### Ejemplos:

**A) AI Business Advisor**
```javascript
// Usuario pregunta:
"¿Debería subir mi precio?"

// AI Advisor responde CON CONTEXTO:
✅ "Basado en tu onboarding:
- Target market: SMBs (10-50 empleados)
- Tu ubicación: Madrid, España
- ACV actual: $588/año ($49/mo)

Benchmarks para PM tools en tu segmento:
- Asana: $10.99/user/mo
- Monday: $8/user/mo
- ClickUp: $5/user/mo

Tu precio está en el rango. PERO:

1. Tu valor prop es 'IA-native' → Premium positioning
2. Competidores están en $8-11/user
3. En Madrid, SMBs pueden pagar más que en LATAM

✅ RECOMENDACIÓN: Test $59/mo (20% increase)
- Grandfathering para customers actuales
- A/B test en nuevos signups
- Target: 5% conversion rate (vs actual 7%)"
```

**B) Content Calendar**
```javascript
// Generamos contenido CON CONTEXTO:

✅ "Calendario de contenido personalizado para:
- Negocio: PM tool con IA
- Target: Founders de startups <10 personas
- Ubicación: España + LATAM
- Idiomas: Español + Inglés

POSTS SUGERIDOS:
1. 'Cómo gestionar proyectos con un equipo remoto en España' (ES)
   - Keywords: gestión proyectos remoto españa
   - Volume: 1,200/mo
   - Difficulty: Low

2. 'Project management tools comparison for Spanish startups' (EN)
   - Keywords: project management spain
   - Volume: 800/mo"
```

**C) Investor Matching**
```javascript
✅ "Inversores recomendados para ti:

Basado en:
- Tu industria: B2B SaaS (PM tool)
- Tu ubicación: Madrid
- Tu stage: Pre-seed
- Tu funding need: €150K

MATCHES (95% fit):
1. **K Fund** (Madrid)
   - ✅ Invirtieron en: Typeform, Factorial
   - ✅ Ticket size: €100K-500K (fit)
   - ✅ Sector: B2B SaaS (fit)
   - 📧 Warm intro available via: Pablo García (mentor)

2. **Seaya Ventures**
   - ✅ Invirtieron en: Glovo, Cabify
   - ⚠️ Ticket size: €500K-2M (fuera de rango)
   - ✅ Sector: Tech (fit)
   - Recomendación: Acércate cuando levantes Series A"
```

**Implementación**:
- Toda la info del onboarding se guarda en `projects.metadata`
- Cada edge function recibe `project_id`
- Hace `SELECT metadata FROM projects WHERE id = project_id`
- Usa ese contexto en el prompt de IA

---

## 🚀 IMPLEMENTACIÓN PRIORIZADA

### 🔥 FASE 1 (MÁXIMA PRIORIDAD - 1 semana)

**1. Geo-Intelligence** (2 días)
- ✅ Pregunta: "¿Desde dónde emprendes?" (ciudad + país)
- ✅ Integrar Google Places Autocomplete
- ✅ Guardar en `projects.metadata.location`
- ✅ Usar en financial projections (costos locales)
- ✅ Edge function: `get-local-resources`
  - Competidores locales (Crunchbase API)
  - Inversores locales (Crunchbase API)
  - Costos operativos (Numbeo API)

**2. Adaptive Questioning** (2 días)
- ✅ Crear sistema de preguntas condicionales
- ✅ Diferentes flows para:
  - B2B SaaS
  - E-commerce
  - Marketplace
  - Service business
- ✅ Preguntas específicas por tipo

**3. Competitive Deep-Dive** (1 día)
- ✅ Edge function: `generate-competitive-swot`
- ✅ Input: idea + competidores + ubicación
- ✅ Output: SWOT + gaps + GTM suggestions

**4. Context Everywhere** (2 días)
- ✅ Todas las edge functions reciben project context
- ✅ AI Advisor usa onboarding context
- ✅ Content Calendar usa onboarding context
- ✅ Financial Projections usan ubicación real

---

### 🎯 FASE 2 (ALTO VALOR - 1 semana)

**5. LinkedIn Integration** (2 días)
- OAuth con LinkedIn
- Extraer: skills, experience, current company
- Founder profiling automático
- Co-founder matching suggestions

**6. Progressive Profiling** (2 días)
- Onboarding en 3 fases
- Gamification: profile completeness %
- Prompts contextuales para completar perfil

**7. Collaborative Onboarding** (3 días)
- Invitar co-founder
- Detectar alineamiento/desalineamiento
- Generar preguntas para discutir

---

### 💎 FASE 3 (NICE TO HAVE - 1 semana)

**8. Voice/Video Onboarding** (3 días)
- Upload de video/audio
- Whisper API transcription
- GPT-4 extraction
- Review & approve flow

**9. Personalized Learning Path** (2 días)
- Según background + gaps + business type
- Libros, cursos, videos curados

**10. Local Resources Database** (2 días)
- Database manual de:
  - Aceleradoras por país
  - Grants por país
  - Regulaciones por país
  - Eventos por ciudad

---

## 💰 ROI ESPERADO

### Comparación:

| Aspecto | Onboarding Genérico | Onboarding Ultra-Personalizado |
|---------|---------------------|-------------------------------|
| **Percepción de valor** | "Es una tool más" | "Esto fue hecho PARA MÍ" |
| **Completion rate** | 40-60% | 85-95% |
| **Time to value** | 1-2 semanas | <24 horas |
| **Retention 30 días** | 30-40% | 70-80% |
| **WOM (word of mouth)** | Bajo | Alto ("Tienes que ver esto!") |
| **Willingness to pay** | $20-30/mo | $80-150/mo |

---

## 🎁 BONUS IDEAS

### 11. **Industry-Specific Templates**
- Si dice "FinTech" → templates de compliance
- Si dice "HealthTech" → HIPAA checklist
- Si dice "E-commerce" → Shopify setup guide

### 12. **Founder Personality Assessment**
```
"¿Cómo prefieres trabajar?"
- Solo, deep work → Sugerir: remote team, async tools
- Colaborativo, social → Sugerir: coworking, eventos

"¿Qué te motiva más?"
- Impacto social → Sugerir: B-corp, grants
- Dinero → Sugerir: high-growth playbook, VCs
```

### 13. **Real-time Validation**
Mientras escribe su idea, mostrar:
- ✅ "3 personas buscaron esto en Google hoy"
- ✅ "Mercado estimado: $2.3B"
- ⚠️ "15 competidores activos en este espacio"

### 14. **Onboarding Replay**
Generar video de 2 min resumiendo su onboarding:
- Su idea
- Su mercado
- Sus competidores
- Su plan
→ Para compartir con co-founders, inversores, etc.

---

## 🎯 CONCLUSIÓN

**La clave es**: Que cada founder sienta que recibió un servicio de **consultoría personalizada de $10,000** gratis.

No es solo "rellenar un formulario". Es:
- Alguien investigó TU mercado
- Alguien analizó TUS competidores
- Alguien calculó TUS números
- Alguien encontró inversores para TI
- Alguien te dio un plan hecho para TI

**Eso es lo que genera WOW.**

¿Por dónde empezamos? Recomiendo **FASE 1** (Geo-Intelligence + Adaptive Questioning + Competitive Deep-Dive).
