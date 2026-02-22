# 🚀 Ultra-Personalized Onboarding System

## Sistema Completo de Onboarding con 10 Capas de Personalización

Este sistema proporciona una experiencia de onboarding ultra-personalizada para startups, adaptándose a 3 tipos diferentes de usuarios con análisis basado en IA y datos geo-localizados.

---

## 📋 Tabla de Contenidos

1. [Características Principales](#características-principales)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Los 3 Tipos de Onboarding](#los-3-tipos-de-onboarding)
4. [Las 10 Capas de Personalización](#las-10-capas-de-personalización)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Deployment](#deployment)
7. [Uso del Sistema](#uso-del-sistema)
8. [Componentes Principales](#componentes-principales)
9. [Edge Functions](#edge-functions)
10. [Base de Datos](#base-de-datos)

---

## ✨ Características Principales

### Diferenciadores Únicos
- **Geo-Intelligence**: Análisis competitivo, inversores y costos por ubicación
- **Adaptive Questioning**: Las preguntas cambian según respuestas previas
- **3 Flujos Especializados**: Generativo, Idea, Existente
- **Co-founder Alignment**: Detección temprana de conflictos entre socios
- **Learning Path Personalizado**: Recursos priorizados por skill gaps
- **Progressive Profiling**: 3 fases (essentials → deep_dive → continuous)
- **Gamification**: Features desbloqueables al 30%, 50%, 70%, 100%
- **AI Business Advisor**: Chat con contexto completo al 100%

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                   ULTRA ONBOARDING WIZARD                   │
│                 (EnhancedOnboardingWizard)                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   GENERATIVO            IDEA              EXISTENTE
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 3 Business   │    │ Competitive  │    │ Growth       │
│ Options      │    │ SWOT         │    │ Diagnostic   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌──────────────────┐
                  │ Learning Path    │
                  │ Geo Intelligence │
                  │ Progress Tracker │
                  └──────────────────┘
```

### Stack Tecnológico
- **Frontend**: React + TypeScript + Recharts
- **Backend**: Supabase Edge Functions (Deno)
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Database**: PostgreSQL + JSONB
- **UI**: Shadcn/ui + Tailwind CSS

---

## 🎯 Los 3 Tipos de Onboarding

### 1. GENERATIVO 💡
**Para**: Founders sin idea clara

**Flujo**:
1. Captura perfil (background, skills, constraints)
2. IA genera 3 opciones de negocio personalizadas
3. Muestra fit score, proyecciones, roadmap
4. Founder selecciona una opción
5. Learning path específico

**Edge Function**: `generate-business-options`

**Output**:
- 3 opciones con fit score 0-100
- Business model canvas
- Financial projections (investment, breakeven, year 1 revenue)
- Implementation roadmap (3 fases)
- Risks + mitigation strategies

---

### 2. IDEA 🎯
**Para**: Founders con idea específica

**Flujo**:
1. Describe la idea
2. Define target market
3. IA genera análisis competitivo SWOT
4. Identifica market gaps
5. Strategy + Go-to-market plan

**Edge Function**: `competitive-swot-generator`

**Output**:
- SWOT matrix (strengths, weaknesses, opportunities, threats)
- Competitors (direct, indirect, substitute)
- Market gaps con opportunity scores
- Recommended differentiation strategy
- David vs Goliat tactics
- Validation roadmap (experimentos)

---

### 3. EXISTENTE 📈
**Para**: Founders con negocio en marcha

**Flujo**:
1. Ingresa métricas actuales (MRR, churn, CAC, LTV)
2. IA diagnostica bottlenecks REALES
3. Compara vs industry benchmarks
4. Genera 3 escenarios (status quo, fix retention, growth)
5. Action plan priorizado

**Edge Function**: `growth-playbook-generator`

**Output**:
- Health score 0-100
- Bottleneck identification (truth check)
- Critical issues by severity
- Benchmarking vs industry (average, best-in-class)
- 3 scenario projections (interactive chart)
- Prioritized action plan
- Fundraising readiness assessment

---

## 🔟 Las 10 Capas de Personalización

### Layer 1: Geo-Intelligence 🌍
**Componente**: `GeoIntelligenceSelector.tsx`
**Edge Function**: `geo-intelligence`

Analiza ubicación del founder para proporcionar:
- Competitors locales + funding info
- Investors (VCs, angels) + focus areas
- Operational costs (salaries by role)
- Grants disponibles
- Regulatory considerations
- Local events

**Caché**: 30 días en `geo_intelligence_cache`

---

### Layer 2: Adaptive Questioning 🧠
**Implementación**: Lógica en `EnhancedOnboardingWizard.tsx`

Las preguntas cambian según respuestas previas:
- Si "no technical background" → Skip technical questions
- Si "B2B" → Focus en enterprise sales
- Si "bootstrapped" → Low-cost strategies

---

### Layer 3: Founder Profiling 👤
**Future**: Integración con LinkedIn API

Por ahora: Captura manual de:
- Background (developer, designer, marketer, etc.)
- Skills
- Years of experience
- Industries of interest
- Constraints (capital, time, remote)

---

### Layer 4: Competitive Deep-Dive 🎯
**Componente**: `CompetitiveSWOTViewer.tsx`
**Edge Function**: `competitive-swot-generator`

Análisis SWOT completo con:
- Matriz visual 4 cuadrantes
- Competitor cards (direct, indirect, substitute)
- Market gaps con opportunity scores
- Recommended strategy
- Go-to-market phases
- Red flags + validation questions

---

### Layer 5: Financial Projections 💰
**Implementación**: Dentro de cada edge function

Proyecciones hiper-realistas:
- Initial investment requerido
- Breakeven months
- Year 1 revenue
- Scalability score (high/medium/low)
- CAC, LTV, churn (para EXISTENTE)

---

### Layer 6: Personalized Learning Path 📚
**Componente**: `LearningPathTimeline.tsx`
**Edge Function**: `learning-path-generator`

Roadmap de aprendizaje en 3 fases:
- **Phase 1 (Immediate)**: 0-4 weeks
- **Phase 2 (Building)**: 1-3 months
- **Phase 3 (Growth)**: 3-6 months

Cada recurso incluye:
- Priority (critical, high, medium, low)
- Type (book, course, video, article, tool)
- Time estimate + cost
- Key takeaways
- How to apply
- When to do it

Plus:
- Skill gaps detectados
- Skills que YA tienes (y por qué son valiosos)
- Common mistakes to avoid
- Recommended mentors

---

### Layer 7: Co-founder Alignment 🤝
**Componente**: `CofounderAlignmentScore.tsx`
**Edge Function**: `cofounder-alignment-analyzer`

Compara respuestas de 2 co-founders:
- Overall alignment score 0-100
- Breakdown: vision, strategy, commitment, values
- Radar chart visual
- Misalignments por severidad (critical, important, minor)
- Discussion topics
- Green flags + Red flags
- Verdict: strong_partnership | proceed_with_caution | high_risk | recommend_split

**Previene**: 65% de startups que fallan por co-founder conflicts

---

### Layer 8: Voice/Video Onboarding 🎤
**Status**: Pendiente implementación

Permitirá:
- Grabar respuestas en voz
- Transcripción automática (Whisper API)
- Análisis de tono/energía
- Stored en `voice_onboarding_transcripts`

---

### Layer 9: Progressive Profiling ⏱️
**Componente**: `ProgressTracker.tsx`

3 fases con gamification:
1. **Essentials** (0-40%): 5-10 min, info básica
2. **Deep Dive** (40-75%): Análisis detallado
3. **Continuous** (75-100%): Optimización ongoing

Features desbloqueables:
- 30%: Business Options / Competitive Analysis / Growth Diagnostic
- 50%: Financial Projections / Market Gaps / Benchmarking
- 70%: Learning Path / Validation Roadmap / Action Plan
- 100%: AI Business Advisor (Chat RAG)

---

### Layer 10: Context Everywhere 🧠
**Implementación**: `onboarding_sessions.answers` (JSONB)

Todo guardado para:
- AI Business Advisor (usa contexto completo)
- Re-onboarding (evolución del proyecto)
- Team insights
- Future recommendations

---

## 🛠️ Instalación y Configuración

### 1. Prerrequisitos
```bash
- Node.js 18+
- Supabase account
- Anthropic API key (Claude 3.5 Sonnet)
```

### 2. Variables de Entorno

Configurar en Supabase Dashboard → Edge Functions → Secrets:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Base de Datos

Aplicar migración:

```bash
# Conectar a Supabase project
supabase link --project-ref your-project-ref

# Aplicar migración
supabase db push
```

O ejecutar manualmente el SQL:
```
supabase/migrations/20260205_ultra_personalized_onboarding.sql
```

Esto crea 9 tablas:
- `onboarding_sessions`
- `geo_intelligence_cache`
- `competitive_analysis`
- `learning_paths`
- `cofounder_alignment`
- `generated_business_options`
- `validation_roadmaps`
- `growth_playbooks`
- `voice_onboarding_transcripts`

---

## 🚀 Deployment

### Edge Functions

Las 6 edge functions deben desplegarse en Supabase:

```bash
# Desde el directorio nova-hub/

# 1. Geo Intelligence
supabase functions deploy geo-intelligence

# 2. Generate Business Options (GENERATIVO)
supabase functions deploy generate-business-options

# 3. Competitive SWOT Generator (IDEA)
supabase functions deploy competitive-swot-generator

# 4. Growth Playbook Generator (EXISTENTE)
supabase functions deploy growth-playbook-generator

# 5. Co-founder Alignment Analyzer
supabase functions deploy cofounder-alignment-analyzer

# 6. Learning Path Generator
supabase functions deploy learning-path-generator
```

### Verificar Deployment

```bash
# Listar funciones desplegadas
supabase functions list

# Ver logs
supabase functions logs geo-intelligence --tail
```

---

## 📱 Uso del Sistema

### Acceso desde la App

1. **Desde Sidebar**: Click en "🚀 Crear & Validar" → "Ultra Onboarding"
2. **URL directa**: `/proyecto/{projectId}/ultra-onboarding`

### Flujo de Usuario

**Paso 1**: Selección de Tipo
- Usuario elige: GENERATIVO / IDEA / EXISTENTE

**Paso 2**: Essentials (5-10 min)
- Location (ciudad + país)
- Founder profile (background, skills)
- Business basics

**Paso 3**: Geo Intelligence
- Sistema fetches datos locales (competitors, investors, costs)
- Caché 30 días

**Paso 4**: Type-Specific Questions
- GENERATIVO: Constraints, industries of interest
- IDEA: Target market, value proposition
- EXISTENTE: Current metrics (MRR, churn, customers)

**Paso 5**: AI Generation (15-30 seg)
- Loading state con mensaje motivacional
- IA procesa todo el contexto
- Genera insights específicos al tipo

**Paso 6**: Results
- GENERATIVO: 3 Business Options + selector
- IDEA: Competitive SWOT + strategy
- EXISTENTE: Growth Diagnostic + scenarios

**Paso 7**: Learning Path
- Resources priorizados por skill gaps
- 3-phase roadmap
- Checkboxes para tracking

**Paso 8**: Complete → Dashboard

---

## 🧩 Componentes Principales

### EnhancedOnboardingWizard
**Path**: `src/components/onboarding/EnhancedOnboardingWizard.tsx`

Wizard principal que orquesta todo el flujo.

**Props**:
```typescript
{
  projectId: string;
  onComplete: () => void;
}
```

**States**:
- `currentStep`: tipo selección → essentials → location → etc.
- `onboardingType`: generative | idea | existing
- `formData`: Todas las respuestas
- `businessOptions`, `competitiveAnalysis`, `growthPlaybook`

**Key Methods**:
- `generateInsights()`: Llama edge function apropiada
- `handleNext()`: Navegación entre pasos
- `handleSaveSession()`: Auto-save a DB

---

### GeoIntelligenceSelector
**Path**: `src/components/onboarding/GeoIntelligenceSelector.tsx`

Selector de ubicación + datos locales.

**Features**:
- City/country inputs
- Quick stats cards
- Local competitors (expandable)
- Local investors (expandable)
- Operational costs
- Available grants

**Edge Function**: `geo-intelligence`

---

### BusinessOptionsSelector
**Path**: `src/components/onboarding/BusinessOptionsSelector.tsx`

Para GENERATIVO - Muestra 3 opciones de negocio.

**Features**:
- Comparison table
- Fit score indicators
- Financial preview
- Expandable option cards:
  - Business model
  - Pros/cons
  - Implementation roadmap (3 phases)
  - Risks + mitigation
  - First steps (next 7 days)

---

### CompetitiveSWOTViewer
**Path**: `src/components/onboarding/CompetitiveSWOTViewer.tsx`

Para IDEA - Análisis competitivo.

**Features**:
- SWOT matrix (4 quadrants color-coded)
- Competitor cards con threat levels
- Market gaps con opportunity scores
- Recommended strategy
- GTM phases (validation → scale)
- Red flags + validation questions

---

### GrowthDiagnostic
**Path**: `src/components/onboarding/GrowthDiagnostic.tsx`

Para EXISTENTE - Diagnóstico de crecimiento.

**Features**:
- Health score gauge
- Truth-o-meter (founder was right?)
- Critical issues by severity
- Benchmarking table (you vs average vs best)
- **Interactive LineChart** (Recharts) con 3 scenarios
- Scenario comparison
- Prioritized action plan (expandable)
- Quick wins
- Fundraising readiness

---

### LearningPathTimeline
**Path**: `src/components/onboarding/LearningPathTimeline.tsx`

Roadmap de aprendizaje personalizado.

**Features**:
- Skill gaps summary
- Existing skills (+ why valuable)
- Phase selector (3 tabs)
- Resource cards:
  - Priority color coding
  - Type icon (book/course/video)
  - Time + cost
  - Reasoning
  - When to do it
  - Expandable: key takeaways, how to apply
  - Checkbox para completar
- Common mistakes to avoid
- Recommended mentors

---

### CofounderAlignmentScore
**Path**: `src/components/onboarding/CofounderAlignmentScore.tsx`

Análisis de compatibilidad entre co-founders.

**Features**:
- Overall score + breakdown
- **Radar chart** (Recharts) - 4 dimensiones
- Misalignments con severidad
- Side-by-side conflicting positions
- Discussion topics + sub-questions
- Green flags + red flags
- Suggested exercises
- Verdict (strong → split)

---

### ProgressTracker
**Path**: `src/components/onboarding/ProgressTracker.tsx`

Barra de progreso gamificada.

**Features**:
- Completion percentage
- Phase timeline (3 fases)
- Unlockable features (por tipo)
- Motivational messages
- Next milestone indicator

---

## ⚡ Edge Functions

### 1. geo-intelligence
**Path**: `supabase/functions/geo-intelligence/index.ts`

**Input**:
```typescript
{
  city: string;
  country: string;
  industry?: string;
  business_type?: string;
}
```

**Output**:
```typescript
{
  city, country,
  competitors: [{ name, description, funding_raised, website }],
  investors: [{ name, type, focus_areas, contact }],
  operational_costs: { avg_developer_salary, avg_designer_salary, office_rent },
  grants: [{ name, amount, eligibility, deadline }],
  regulatory_considerations: string[],
  local_events: [{ name, date, type, url }],
  startup_ecosystem_rank: string,
  cost_of_living_index: number
}
```

**Caché**: 30 días en `geo_intelligence_cache`

---

### 2. generate-business-options
**Path**: `supabase/functions/generate-business-options/index.ts`

**Input**:
```typescript
{
  project_id: string;
  founder_profile: {
    background, skills, experience_years, industries_of_interest
  };
  constraints: {
    available_capital, time_availability, must_be_remote
  };
  location: { city, country };
}
```

**Output**:
```typescript
{
  options: [
    {
      title, description, fit_score,
      business_model: { value_proposition, revenue_streams, customer_segments },
      pros, cons,
      financial_projections: { initial_investment, breakeven_months, year_1_revenue },
      implementation_roadmap: [phase_1, phase_2, phase_3],
      risks: [{ risk, likelihood, impact, mitigation }],
      first_steps: string[]
    }
  ]
}
```

**Guarda en**: `generated_business_options`

---

### 3. competitive-swot-generator
**Path**: `supabase/functions/competitive-swot-generator/index.ts`

**Input**:
```typescript
{
  project_id: string;
  business_idea: string;
  target_market: string;
  value_proposition: string;
  location: { city, country };
}
```

**Output**:
```typescript
{
  swot: { strengths, weaknesses, opportunities, threats },
  competitors: [
    {
      name, category: 'direct'|'indirect'|'substitute',
      description, strengths, weaknesses, threat_level: 'high'|'medium'|'low',
      website
    }
  ],
  market_gaps: [{ gap, opportunity_score, exploitation_strategy }],
  recommended_strategy: {
    positioning, differentiation_points,
    go_to_market_phase_1, go_to_market_phase_2
  },
  red_flags: [{ flag, severity, why_important }],
  validation_questions: string[]
}
```

**Guarda en**: `competitive_analysis`

---

### 4. growth-playbook-generator
**Path**: `supabase/functions/growth-playbook-generator/index.ts`

**Input**:
```typescript
{
  project_id: string;
  current_metrics: {
    mrr, customers, churn_rate, cac, ltv, team_size, burn_rate
  };
  founder_perception: {
    main_problem, growth_stage
  };
}
```

**Output**:
```typescript
{
  diagnosis: {
    health_score, actual_bottleneck, founder_was_right: boolean,
    critical_issues: [{ issue, severity, evidence }]
  },
  benchmarking: [
    { metric, your_value, industry_average, best_in_class, verdict }
  ],
  scenarios: {
    status_quo: { month_3_mrr, month_6_mrr, month_12_mrr },
    fix_retention: { ... },
    growth_mode: { ... }
  },
  action_plan: [
    {
      priority, action, why_critical, steps,
      expected_impact, timeline, resources_needed
    }
  ],
  quick_wins: string[],
  fundraising_readiness: { score, blockers, when_to_raise }
}
```

**Guarda en**: `growth_playbooks`

---

### 5. cofounder-alignment-analyzer
**Path**: `supabase/functions/cofounder-alignment-analyzer/index.ts`

**Input**:
```typescript
{
  project_id: string;
  founder_1_session_id: string;
  founder_2_session_id: string;
}
```

**Output**:
```typescript
{
  overall_score,
  vision_alignment, strategy_alignment, commitment_alignment, values_alignment,
  misalignments: [
    {
      category, severity, founder_1_position, founder_2_position,
      why_matters, discussion_questions
    }
  ],
  green_flags, red_flags,
  recommended_discussions: [{ topic, why_important, sub_questions }],
  verdict: 'strong_partnership' | 'proceed_with_caution' | 'high_risk' | 'recommend_split',
  suggested_exercises: string[]
}
```

**Guarda en**: `cofounder_alignment`

---

### 6. learning-path-generator
**Path**: `supabase/functions/learning-path-generator/index.ts`

**Input**:
```typescript
{
  project_id: string;
  current_skills: string[];
  business_type: string;
  founder_background: string;
  phase: 'essentials' | 'deep_dive' | 'continuous';
}
```

**Output**:
```typescript
{
  skill_gaps: string[],
  skills_you_already_have: [{ skill, why_valuable }],
  learning_roadmap: {
    phase_1_immediate: { duration, focus, outcome, resources: [...] },
    phase_2_building: { ... },
    phase_3_growth: { ... }
  },
  resources: [
    {
      id, type: 'book'|'course'|'video'|'article'|'tool',
      title, priority, reasoning, url,
      estimated_time, cost,
      when_to_do_it, how_to_apply,
      key_takeaways
    }
  ],
  common_mistakes_to_avoid: string[],
  recommended_mentors: [{ name, why, where_to_find }]
}
```

**Guarda en**: `learning_paths`

---

## 🗄️ Base de Datos

### Tablas Principales

#### onboarding_sessions
Tracking del progreso del onboarding.

```sql
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  onboarding_type TEXT, -- 'generative' | 'idea' | 'existing'
  phase TEXT, -- 'essentials' | 'deep_dive' | 'continuous'
  completion_percentage INTEGER,
  answers JSONB, -- Todas las respuestas del wizard
  location_city TEXT,
  location_country TEXT,
  has_cofounder BOOLEAN,
  alignment_score INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**Indexes**: project_id, onboarding_type, phase

---

#### geo_intelligence_cache
Caché de 30 días para datos geo-localizados.

```sql
CREATE TABLE geo_intelligence_cache (
  id UUID PRIMARY KEY,
  city TEXT,
  country TEXT,
  industry TEXT,
  data JSONB, -- GeoIntelligence object
  cached_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- cached_at + 30 days
);
```

**Indexes**: (city, country, industry), expires_at

---

#### competitive_analysis
Análisis SWOT para tipo IDEA.

```sql
CREATE TABLE competitive_analysis (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  onboarding_session_id UUID REFERENCES onboarding_sessions(id),
  swot JSONB,
  competitors JSONB,
  market_gaps JSONB,
  recommended_strategy JSONB,
  red_flags JSONB,
  validation_questions JSONB
);
```

---

#### learning_paths
Roadmap de aprendizaje personalizado.

```sql
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  onboarding_session_id UUID REFERENCES onboarding_sessions(id),
  skill_gaps JSONB,
  skills_already_have JSONB,
  learning_roadmap JSONB,
  resources JSONB,
  common_mistakes JSONB,
  recommended_mentors JSONB
);
```

---

#### cofounder_alignment
Análisis de compatibilidad entre co-founders.

```sql
CREATE TABLE cofounder_alignment (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  founder_1_session_id UUID REFERENCES onboarding_sessions(id),
  founder_2_session_id UUID REFERENCES onboarding_sessions(id),
  overall_score INTEGER,
  vision_alignment INTEGER,
  strategy_alignment INTEGER,
  commitment_alignment INTEGER,
  values_alignment INTEGER,
  misalignments JSONB,
  verdict TEXT,
  green_flags JSONB,
  red_flags JSONB
);
```

---

#### generated_business_options
3 opciones de negocio para tipo GENERATIVO.

```sql
CREATE TABLE generated_business_options (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  onboarding_session_id UUID REFERENCES onboarding_sessions(id),
  options JSONB, -- Array de 3 BusinessOption
  selected_option_index INTEGER
);
```

---

#### validation_roadmaps
Experimentos de validación para tipo IDEA.

```sql
CREATE TABLE validation_roadmaps (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  competitive_analysis_id UUID REFERENCES competitive_analysis(id),
  experiments JSONB, -- Array de experimentos
  completed_experiments JSONB
);
```

---

#### growth_playbooks
Diagnóstico y action plan para tipo EXISTENTE.

```sql
CREATE TABLE growth_playbooks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  onboarding_session_id UUID REFERENCES onboarding_sessions(id),
  diagnosis JSONB,
  benchmarking JSONB,
  scenarios JSONB,
  action_plan JSONB,
  quick_wins JSONB,
  fundraising_readiness JSONB
);
```

---

#### voice_onboarding_transcripts
Transcripciones de onboarding por voz (future).

```sql
CREATE TABLE voice_onboarding_transcripts (
  id UUID PRIMARY KEY,
  onboarding_session_id UUID REFERENCES onboarding_sessions(id),
  question_id TEXT,
  audio_url TEXT,
  transcript TEXT,
  analyzed_sentiment JSONB
);
```

---

## 🔐 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS activado con políticas:

```sql
-- Example para onboarding_sessions
CREATE POLICY "Users can view their own sessions"
  ON onboarding_sessions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sessions"
  ON onboarding_sessions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );
```

**Todas las tablas tienen**:
- SELECT policy (can view own)
- INSERT policy (can create own)
- UPDATE policy (can update own)
- DELETE policy (can delete own)

---

## 📊 Analytics

### Eventos Trackeados

El sistema trackea:
- Tipo de onboarding seleccionado
- Completion rate por fase
- Drop-off points
- Time to complete
- Features desbloqueadas
- AI generation success rate
- Edge function latency

**Implementación**: Agregar calls a analytics service en:
- `EnhancedOnboardingWizard.tsx` (step changes)
- Edge functions (generation events)

---

## 🚦 Testing

### Manual Testing Checklist

**GENERATIVO**:
- [ ] Seleccionar tipo generativo
- [ ] Completar perfil founder
- [ ] Verificar geo-intelligence fetch
- [ ] Generar 3 business options
- [ ] Seleccionar una opción
- [ ] Verificar learning path
- [ ] Completar onboarding

**IDEA**:
- [ ] Seleccionar tipo idea
- [ ] Describir idea
- [ ] Generar SWOT
- [ ] Verificar competitors
- [ ] Verificar market gaps
- [ ] Check validation questions
- [ ] Verificar learning path

**EXISTENTE**:
- [ ] Seleccionar tipo existing
- [ ] Ingresar métricas
- [ ] Generar growth diagnostic
- [ ] Verificar health score
- [ ] Check scenario chart
- [ ] Verificar action plan
- [ ] Check fundraising readiness

**CO-FOUNDER ALIGNMENT**:
- [ ] Crear 2 onboarding sessions
- [ ] Generar alignment analysis
- [ ] Verificar radar chart
- [ ] Check misalignments
- [ ] Verificar verdict

**PROGRESS TRACKER**:
- [ ] Verificar progress % updates
- [ ] Check feature unlocks at 30%, 50%, 70%, 100%
- [ ] Verificar motivational messages
- [ ] Check phase transitions

---

## 🐛 Troubleshooting

### Edge Functions no responden

**Check**:
```bash
# Ver logs
supabase functions logs geo-intelligence --tail

# Verificar API key
supabase secrets list

# Re-deploy
supabase functions deploy geo-intelligence
```

**Common Issues**:
- `ANTHROPIC_API_KEY` no configurada
- Timeout (aumentar timeout en función)
- CORS errors (verificar headers)

---

### Database Errors

**Check**:
```bash
# Verificar migración
supabase db diff

# Aplicar migración
supabase db push

# Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'onboarding_sessions';
```

---

### UI Components Missing

**Install shadcn/ui components**:
```bash
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add card
```

---

## 🎨 Customización

### Cambiar Prompts de IA

Editar edge functions:
```typescript
// supabase/functions/generate-business-options/index.ts

const prompt = `
Eres un experto...
[Modificar prompt aquí]
`;
```

Re-deploy después de cambios:
```bash
supabase functions deploy generate-business-options
```

---

### Agregar Nuevas Preguntas

En `EnhancedOnboardingWizard.tsx`:

```typescript
// Agregar step
type WizardStep =
  | 'type_selection'
  | 'essentials'
  | 'new_custom_step' // <-- Nueva pregunta
  | ...

// Agregar caso en renderStep()
case 'new_custom_step':
  return <CustomQuestionComponent />;
```

---

### Modificar Thresholds de Features

En `ProgressTracker.tsx`:

```typescript
const featuresByType: Record<string, UnlockableFeature[]> = {
  generative: [
    {
      name: 'Business Options',
      unlockAt: 30, // <-- Cambiar threshold
      ...
    }
  ]
};
```

---

## 📈 Métricas de Éxito

### KPIs a Trackear

1. **Completion Rate**
   - % que completan Essentials
   - % que completan Deep Dive
   - % que alcanzan 100%

2. **Time to Value**
   - Minutos promedio por fase
   - Abandono por paso

3. **AI Generation Quality**
   - % con fit score > 70 (GENERATIVO)
   - % con opportunity scores > 7 (IDEA)
   - % con health score < 50 (EXISTENTE, indica problem detection)

4. **Feature Adoption**
   - % que usan Learning Path
   - % que completan Co-founder Alignment
   - % que desbloquean AI Advisor

---

## 🚀 Roadmap Futuro

### Features Pendientes

- [ ] **Layer 8**: Voice/Video onboarding
- [ ] **Layer 3**: LinkedIn integration
- [ ] **AI Business Advisor**: Chat RAG con contexto
- [ ] **Mobile app**: React Native version
- [ ] **Multi-language**: i18n support
- [ ] **Team onboarding**: Multiple team members
- [ ] **Progress sharing**: Share results with investors
- [ ] **Auto-update**: Re-run analysis periodically
- [ ] **Competitive monitoring**: Alerts on competitor moves
- [ ] **Investor matching**: Connect with relevant VCs

---

## 📞 Soporte

Para issues, bugs o feature requests:
1. GitHub Issues: [Link to repo]
2. Email: support@novahub.com
3. Discord: [Community link]

---

## 📝 Licencia

Propietario - Nova Hub
© 2026 Todos los derechos reservados

---

**Última actualización**: 2026-02-05
**Versión**: 1.0.0
**Status**: ✅ Completado - Ready for deployment
