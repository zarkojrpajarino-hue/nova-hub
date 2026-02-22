# 🗺️ ROADMAP: SISTEMA DE CONFIANZA IA - IMPLEMENTACIÓN ESTRATÉGICA

## 📋 FASE 0: FUNDAMENTOS (Semana 1)

### Objetivo
Crear la infraestructura base sin tocar funciones existentes

### Tareas Técnicas

#### 1. TypeScript Types & Interfaces
```typescript
// src/types/ai-trust.ts

export type SourceType = 'official' | 'academic' | 'news' | 'business_data' | 'user_input' | 'internal';
export type ReliabilityMode = 'strict' | 'balanced' | 'exploratory';
export type ValidationStatus = 'verified' | 'pending' | 'flagged' | 'insufficient_evidence';

export interface AISource {
  id: string;
  url: string;
  title: string;
  type: SourceType;
  reliability_score: number; // 0-100
  date: string;
  author?: string;
  quote: string; // Fragmento exacto usado
  relevance_score: number; // 0-100
  domain: string;
}

export interface AIResponse<T = any> {
  // Contenido generado
  content: T;

  // Metadatos de confianza
  confidence_score: number; // 0-100
  sources: AISource[];
  reasoning: string; // Por qué llegó a esta conclusión

  // Metadatos técnicos
  model: string;
  timestamp: string;
  generation_time_ms: number;
  validation_status: ValidationStatus;

  // Warnings
  warnings?: string[];
  conflicts?: Array<{ claim: string; sources: AISource[] }>;
}

export interface SourcePolicy {
  mode: ReliabilityMode;

  // Tipos de fuentes permitidas
  allowed_source_types: SourceType[];

  // Reglas de validación
  require_multiple_sources: boolean;
  minimum_sources: number;
  max_source_age_days: number;
  require_consensus: boolean;

  // Overrides por función
  function_overrides: Record<string, Partial<SourcePolicy>>;
}

export interface EvidenceContract {
  claim: string;
  required_evidence: {
    min_sources: number;
    source_types: SourceType[];
    consensus_required: boolean;
    max_age_days: number;
  };
  actual_evidence: AISource[];
  status: 'met' | 'partial' | 'unmet';
  gap_analysis?: string;
}
```

#### 2. Base de Datos (Supabase Migration)
```sql
-- supabase/migrations/20260207_ai_trust_system.sql

-- Registro de fuentes verificadas
CREATE TABLE ai_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'official', 'academic', etc.
  base_reliability_score INTEGER NOT NULL CHECK (base_reliability_score BETWEEN 0 AND 100),
  metadata JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Políticas de usuario
CREATE TABLE user_source_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  policy JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, project_id, is_default)
);

-- Log de generaciones IA (auditoría)
CREATE TABLE ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  function_name TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB NOT NULL,
  sources JSONB DEFAULT '[]',
  confidence_score INTEGER,
  validation_status TEXT,
  generation_time_ms INTEGER,
  model TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_generation_logs_user ON ai_generation_logs(user_id);
CREATE INDEX idx_generation_logs_function ON ai_generation_logs(function_name);
CREATE INDEX idx_source_registry_type ON ai_source_registry(type);

-- RLS Policies
ALTER TABLE user_source_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own policies" ON user_source_policies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON ai_generation_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Seed data: Fuentes verificadas iniciales
INSERT INTO ai_source_registry (domain, name, type, base_reliability_score, verified) VALUES
  -- Official
  ('sec.gov', 'U.S. Securities and Exchange Commission', 'official', 95, true),
  ('census.gov', 'U.S. Census Bureau', 'official', 95, true),
  ('europa.eu', 'European Union Official', 'official', 90, true),

  -- Academic
  ('arxiv.org', 'ArXiv', 'academic', 90, true),
  ('scholar.google.com', 'Google Scholar', 'academic', 85, true),
  ('researchgate.net', 'ResearchGate', 'academic', 80, true),

  -- Business Data
  ('crunchbase.com', 'Crunchbase', 'business_data', 85, true),
  ('linkedin.com', 'LinkedIn', 'business_data', 80, true),
  ('pitchbook.com', 'PitchBook', 'business_data', 85, true),

  -- News
  ('reuters.com', 'Reuters', 'news', 85, true),
  ('bloomberg.com', 'Bloomberg', 'news', 85, true),
  ('ft.com', 'Financial Times', 'news', 85, true),
  ('wsj.com', 'Wall Street Journal', 'news', 85, true);
```

#### 3. Configuración por Defecto
```typescript
// src/lib/ai-trust/default-policies.ts

export const DEFAULT_POLICIES: Record<ReliabilityMode, SourcePolicy> = {
  strict: {
    mode: 'strict',
    allowed_source_types: ['official', 'academic', 'business_data'],
    require_multiple_sources: true,
    minimum_sources: 2,
    max_source_age_days: 180,
    require_consensus: true,
    function_overrides: {
      'financial-projections': { minimum_sources: 3, max_source_age_days: 90 },
      'legal-analysis': { minimum_sources: 3, allowed_source_types: ['official', 'academic'] }
    }
  },

  balanced: {
    mode: 'balanced',
    allowed_source_types: ['official', 'academic', 'business_data', 'news'],
    require_multiple_sources: true,
    minimum_sources: 1,
    max_source_age_days: 365,
    require_consensus: false,
    function_overrides: {}
  },

  exploratory: {
    mode: 'exploratory',
    allowed_source_types: ['official', 'academic', 'business_data', 'news', 'user_input'],
    require_multiple_sources: false,
    minimum_sources: 1,
    max_source_age_days: 730,
    require_consensus: false,
    function_overrides: {}
  }
};

// Política por defecto para nuevos usuarios
export const DEFAULT_USER_POLICY: SourcePolicy = DEFAULT_POLICIES.balanced;
```

### Entregables Fase 0
- ✅ Types completos en TypeScript
- ✅ Tablas de base de datos creadas
- ✅ 10-15 fuentes verificadas seeded
- ✅ Políticas por defecto definidas

---

## 🎯 FASE 1: TRANSPARENCY LAYER (Semanas 2-4)

### Objetivo
**Quick Win**: Mostrar fuentes y confianza después de cada generación IA

### Funciones Prioritarias (Orden estratégico)

#### **Tier 1 - Critical (Implementar primero)**
1. **Business Model Canvas Generator**
   - Por qué: Función core, alta visibilidad, datos críticos
   - Ubicación: `/proyecto/:id/mi-desarrollo`

2. **Sales Playbook Generator**
   - Por qué: Salida muy estructurada, fácil de validar
   - Ubicación: `/proyecto/:id/mi-desarrollo`

3. **Financial Projections**
   - Por qué: Máximo riesgo si hay errores, necesita máxima confianza
   - Ubicación: `/proyecto/:id/financiero`

#### **Tier 2 - High Value (Segunda semana)**
4. **Competitive Analysis**
5. **Market Research**
6. **Buyer Personas Generator**

#### **Tier 3 - Nice to Have (Tercera semana)**
7. Resto de generadores (~10 funciones)

### UX Flow Detallado

#### **Pantalla 1: ANTES de generar (OPCIONAL en Fase 1)**

```
┌─────────────────────────────────────────────────┐
│  Generate Business Model Canvas                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Input del usuario]                            │
│  Business Pitch: _______________________        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ⚙️ Generation Settings (collapsed)        │ │
│  │                                           │ │
│  │ Reliability: ⚖️ Balanced    [Change]     │ │
│  │                                           │ │
│  │ > Advanced settings                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Generate with AI] ← Main CTA                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Justificación**:
- Collapsed por defecto → No abruma al usuario
- Modo visible (Balanced) → Transparencia sin fricción
- "Advanced settings" para power users

#### **Pantalla 2: Generando (Loading State)**

```
┌─────────────────────────────────────────────────┐
│  🤖 Generating Business Model Canvas...         │
├─────────────────────────────────────────────────┤
│                                                 │
│      [Animated AI icon]                         │
│                                                 │
│  ✓ Analyzing your business pitch                │
│  ✓ Searching reliable sources (3 found)         │
│  → Generating insights with Claude AI...        │
│  ○ Validating output...                         │
│                                                 │
│  This may take 20-30 seconds                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Justificación**:
- Mostrar progreso → Reduce ansiedad
- "3 found" → Hint de transparencia
- Expectativas claras (20-30s)

#### **Pantalla 3: DESPUÉS de generar (CORE VALUE)**

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Business Model Canvas Generated                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [BUSINESS MODEL CANVAS CONTENT]                            │
│  Value Proposition: ....                                    │
│  Customer Segments: ....                                    │
│  ...                                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  🔍 AI Transparency Report                            ║ │
│  ║                                                       ║ │
│  ║  Confidence Score: ████████░░ 85%  [Good]            ║ │
│  ║                                                       ║ │
│  ║  📚 Sources Used (4):                                 ║ │
│  ║  ┌─────────────────────────────────────────────────┐ ║ │
│  ║  │ 1. Crunchbase - Market Data                     │ ║ │
│  ║  │    ⭐ Reliability: 85/100  📅 Updated 2 days ago │ ║ │
│  ║  │    💬 "Average B2B SaaS pricing..."              │ ║ │
│  ║  │    🔗 [View source]                              │ ║ │
│  ║  └─────────────────────────────────────────────────┘ ║ │
│  ║  │ 2. Harvard Business Review - Revenue Models     │ ║ │
│  ║  │    ⭐ 90/100  📅 6 months ago                    │ ║ │
│  ║  └─────────────────────────────────────────────────┘ ║ │
│  ║  │ 3. [+ 2 more sources] [Show all]                │ ║ │
│  ║  └─────────────────────────────────────────────────┘ ║ │
│  ║                                                       ║ │
│  ║  💡 AI Reasoning:                                     ║ │
│  ║  "Based on your B2B SaaS pitch targeting SMBs,       ║ │
│  ║   I identified subscription pricing as the optimal   ║ │
│  ║   model (Source 1,2). The freemium approach suits    ║ │
│  ║   your customer acquisition strategy (Source 3)..."  ║ │
│  ║                                                       ║ │
│  ║  ⚠️ Validation Status: Verified ✓                    ║ │
│  ║                                                       ║ │
│  ║  [📥 Export Report] [🔄 Regenerate with different    ║ │
│  ║                          sources]                     ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│  [Save] [Edit Manually] [Regenerate]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Justificación KEY**:
- **Transparency Report separado visualmente** → No interfiere con el contenido
- **Confidence Score prominent** → Métrica clave al frente
- **Sources colapsables** → Info disponible sin abrumar
- **Reasoning explicado** → Auditable, educativo
- **CTA: "Regenerate with different sources"** → Empodera al usuario

### Implementación Técnica Fase 1

#### **1. Componente React: AITransparencyCard**

```typescript
// src/components/ai/AITransparencyCard.tsx

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ExternalLink, RefreshCw, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AIResponse } from '@/types/ai-trust';

interface AITransparencyCardProps {
  response: AIResponse;
  onRegenerate?: (newPolicy?: Partial<SourcePolicy>) => void;
  onExport?: () => void;
}

export function AITransparencyCard({ response, onRegenerate, onExport }: AITransparencyCardProps) {
  const confidenceColor = response.confidence_score >= 80 ? 'green' :
                          response.confidence_score >= 60 ? 'yellow' : 'red';

  const statusIcon = response.validation_status === 'verified' ? CheckCircle2 : AlertTriangle;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          🔍 AI Transparency Report
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Confidence Score</span>
            <Badge variant={confidenceColor}>{response.confidence_score}%</Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full bg-${confidenceColor}-500`}
              style={{ width: `${response.confidence_score}%` }}
            />
          </div>
        </div>

        {/* Sources */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            📚 Sources Used ({response.sources.length})
          </h4>

          {response.sources.slice(0, 2).map((source, idx) => (
            <div key={source.id} className="mb-3 p-3 bg-white rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{idx + 1}. {source.title}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    ⭐ Reliability: {source.reliability_score}/100
                    <span className="mx-2">•</span>
                    📅 {formatDate(source.date)}
                  </div>
                  {source.quote && (
                    <div className="text-sm text-gray-700 mt-2 italic">
                      "{source.quote.substring(0, 100)}..."
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={source.url} target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}

          {response.sources.length > 2 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="more-sources">
                <AccordionTrigger>
                  + {response.sources.length - 2} more sources
                </AccordionTrigger>
                <AccordionContent>
                  {response.sources.slice(2).map((source, idx) => (
                    <div key={source.id} className="mb-2 p-2 bg-gray-50 rounded">
                      {idx + 3}. {source.title}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>

        {/* Reasoning */}
        <Accordion type="single" collapsible>
          <AccordionItem value="reasoning">
            <AccordionTrigger>💡 AI Reasoning</AccordionTrigger>
            <AccordionContent>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {response.reasoning}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Validation Status */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
          {React.createElement(statusIcon, {
            className: `h-5 w-5 ${response.validation_status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`
          })}
          <span className="text-sm font-medium">
            Validation Status: {response.validation_status}
          </span>
        </div>

        {/* Warnings */}
        {response.warnings && response.warnings.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="font-medium text-yellow-800 mb-2">⚠️ Warnings:</div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {response.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
          {onRegenerate && (
            <Button variant="outline" size="sm" onClick={() => onRegenerate()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate with different sources
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **2. Helper: Enhanced AI Call Wrapper**

```typescript
// src/lib/ai-trust/enhanced-ai-call.ts

import { callClaude } from '@/lib/anthropic-client';
import { AIResponse, AISource, SourcePolicy } from '@/types/ai-trust';
import { supabase } from '@/integrations/supabase/client';

export async function enhancedAICall<T = string>(
  functionName: string,
  systemPrompt: string,
  userPrompt: string,
  sourcePolicy: SourcePolicy,
  options: {
    extractSources?: boolean;
    logGeneration?: boolean;
    userId?: string;
    projectId?: string;
  } = {}
): Promise<AIResponse<T>> {
  const startTime = Date.now();

  // 1. Buscar fuentes relevantes (Fase 1: mock, Fase 2: real)
  const sources = options.extractSources
    ? await findRelevantSources(userPrompt, sourcePolicy)
    : [];

  // 2. Construir prompt mejorado con fuentes
  const enhancedPrompt = buildPromptWithSources(systemPrompt, userPrompt, sources);

  // 3. Llamar a Claude
  const rawResponse = await callClaude(
    enhancedPrompt.system,
    enhancedPrompt.user,
    Deno.env.get('ANTHROPIC_API_KEY')!
  );

  // 4. Parsear respuesta (asume que Claude devuelve JSON)
  let content: T;
  let reasoning = '';
  try {
    const parsed = JSON.parse(rawResponse);
    content = parsed.content || parsed;
    reasoning = parsed.reasoning || '';
  } catch {
    content = rawResponse as T;
  }

  // 5. Calcular confidence
  const confidence_score = calculateConfidence(sources, content);

  // 6. Determinar validation status
  const validation_status = determineValidationStatus(
    confidence_score,
    sources,
    sourcePolicy
  );

  // 7. Generar warnings si aplica
  const warnings = generateWarnings(confidence_score, sources, sourcePolicy);

  const response: AIResponse<T> = {
    content,
    confidence_score,
    sources,
    reasoning,
    model: 'claude-3-5-sonnet-20241022',
    timestamp: new Date().toISOString(),
    generation_time_ms: Date.now() - startTime,
    validation_status,
    warnings
  };

  // 8. Log (auditoría)
  if (options.logGeneration && options.userId) {
    await logAIGeneration(functionName, userPrompt, response, options);
  }

  return response;
}

// Helper: Encontrar fuentes (Fase 1: mock simple)
async function findRelevantSources(
  query: string,
  policy: SourcePolicy
): Promise<AISource[]> {
  // Fase 1: Retornar fuentes mock desde registry
  const { data: registrySources } = await supabase
    .from('ai_source_registry')
    .select('*')
    .in('type', policy.allowed_source_types)
    .gte('base_reliability_score', 70)
    .limit(4);

  if (!registrySources) return [];

  // Convertir a AISource format (mock)
  return registrySources.map((reg, idx) => ({
    id: reg.id,
    url: `https://${reg.domain}/relevant-article`,
    title: `${reg.name} - Relevant Research`,
    type: reg.type as any,
    reliability_score: reg.base_reliability_score,
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    quote: `Mock excerpt from ${reg.name} relevant to: ${query.substring(0, 50)}...`,
    relevance_score: 85 - idx * 5,
    domain: reg.domain
  }));
}

// Helper: Construir prompt con fuentes
function buildPromptWithSources(
  systemPrompt: string,
  userPrompt: string,
  sources: AISource[]
): { system: string; user: string } {
  if (sources.length === 0) {
    return { system: systemPrompt, user: userPrompt };
  }

  const sourcesContext = sources.map((s, idx) =>
    `[Source ${idx + 1}] ${s.title} (${s.domain}, reliability: ${s.reliability_score}/100)\n${s.quote}`
  ).join('\n\n');

  const enhancedSystem = `${systemPrompt}

You MUST cite sources when making claims. Use [Source N] notation.
You MUST return JSON with this structure:
{
  "content": { ...your generated content... },
  "reasoning": "Explain your thought process and which sources you used for each claim"
}`;

  const enhancedUser = `${userPrompt}

Available Sources:
${sourcesContext}

Remember to cite sources and explain your reasoning.`;

  return {
    system: enhancedSystem,
    user: enhancedUser
  };
}

// Helper: Calcular confidence
function calculateConfidence(sources: AISource[], content: any): number {
  if (sources.length === 0) return 50; // Sin fuentes = baja confianza

  const avgReliability = sources.reduce((sum, s) => sum + s.reliability_score, 0) / sources.length;
  const avgRelevance = sources.reduce((sum, s) => sum + s.relevance_score, 0) / sources.length;
  const sourcesBonus = Math.min(sources.length * 5, 20); // +5 por fuente, max +20

  return Math.min(
    Math.round((avgReliability * 0.4) + (avgRelevance * 0.4) + sourcesBonus),
    100
  );
}

// Helper: Validation status
function determineValidationStatus(
  confidence: number,
  sources: AISource[],
  policy: SourcePolicy
): ValidationStatus {
  if (sources.length < policy.minimum_sources) return 'insufficient_evidence';
  if (confidence >= 80) return 'verified';
  if (confidence >= 60) return 'pending';
  return 'flagged';
}

// Helper: Warnings
function generateWarnings(
  confidence: number,
  sources: AISource[],
  policy: SourcePolicy
): string[] {
  const warnings: string[] = [];

  if (sources.length < policy.minimum_sources) {
    warnings.push(`Only ${sources.length} source(s) found (policy requires ${policy.minimum_sources})`);
  }

  if (confidence < 70) {
    warnings.push('Low confidence score - manual review recommended');
  }

  const oldSources = sources.filter(s => {
    const age = Date.now() - new Date(s.date).getTime();
    return age > policy.max_source_age_days * 24 * 60 * 60 * 1000;
  });

  if (oldSources.length > 0) {
    warnings.push(`${oldSources.length} source(s) older than ${policy.max_source_age_days} days`);
  }

  return warnings;
}

// Helper: Log generation
async function logAIGeneration(
  functionName: string,
  input: string,
  response: AIResponse,
  options: { userId?: string; projectId?: string }
) {
  await supabase.from('ai_generation_logs').insert({
    user_id: options.userId,
    project_id: options.projectId,
    function_name: functionName,
    input: { prompt: input },
    output: response.content,
    sources: response.sources,
    confidence_score: response.confidence_score,
    validation_status: response.validation_status,
    generation_time_ms: response.generation_time_ms,
    model: response.model
  });
}
```

#### **3. Ejemplo: Modificar Business Model Generator**

```typescript
// Antes (en generate-business-model/index.ts):
export async function generateBusinessModel(pitch: string) {
  const prompt = `Generate a business model canvas for: ${pitch}`;
  const response = await callClaude(systemPrompt, prompt, apiKey);
  return JSON.parse(response);
}

// Después (Fase 1):
import { enhancedAICall } from '@/lib/ai-trust/enhanced-ai-call';
import { DEFAULT_USER_POLICY } from '@/lib/ai-trust/default-policies';

export async function generateBusinessModel(
  pitch: string,
  userId: string,
  projectId: string,
  policy: SourcePolicy = DEFAULT_USER_POLICY
) {
  const systemPrompt = `You are a business strategy expert. Generate a business model canvas in JSON format.`;
  const userPrompt = `Generate a business model canvas for this business: ${pitch}`;

  return await enhancedAICall<BusinessModelCanvas>(
    'business-model-canvas',
    systemPrompt,
    userPrompt,
    policy,
    {
      extractSources: true,
      logGeneration: true,
      userId,
      projectId
    }
  );
}
```

### Métricas de Éxito Fase 1

```
KPIs a medir:
✅ Tiempo de implementación: ≤ 3 semanas
✅ Funciones migradas: ≥ 3 críticas + 3 high-value
✅ User feedback: "¿Te resulta útil ver las fuentes?" > 70% positive
✅ Confidence score promedio: > 75%
✅ Time-to-generate aumenta: < 30% (acceptable)
```

---

## 🎛️ FASE 2: SOURCE POLICIES & USER CONTROL (Semanas 5-8)

### Objetivo
Dar poder al usuario para configurar sus preferencias de confianza

### Tareas

#### **1. Settings Page: AI Reliability**

```typescript
// src/pages/Settings/AIReliabilitySettings.tsx

export function AIReliabilitySettings() {
  const [policy, setPolicy] = useState<SourcePolicy>(DEFAULT_USER_POLICY);
  const [saving, setSaving] = useState(false);

  return (
    <SettingsSection title="AI Reliability & Sources">

      {/* Modo principal */}
      <div className="space-y-4">
        <Label>Reliability Mode</Label>
        <RadioGroup value={policy.mode} onValueChange={(mode) => setPolicy({...policy, mode})}>

          <RadioCard value="strict">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-semibold">🔒 Strict (Maximum Reliability)</div>
                <div className="text-sm text-gray-600">
                  • Only verified sources (official, academic, business data)
                  <br />• Requires 2+ independent sources
                  <br />• Slower generation (~30-45s)
                  <br />• Best for: Financial projections, legal analysis
                </div>
              </div>
            </div>
          </RadioCard>

          <RadioCard value="balanced">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold">⚖️ Balanced (Recommended)</div>
                <div className="text-sm text-gray-600">
                  • Mix of verified + reputable sources
                  <br />• Requires 1+ source
                  <br />• Good speed (~20-30s)
                  <br />• Best for: Most use cases
                </div>
              </div>
            </div>
          </RadioCard>

          <RadioCard value="exploratory">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-semibold">🚀 Exploratory (Fast & Creative)</div>
                <div className="text-sm text-gray-600">
                  • All sources including user input
                  <br />• No minimum sources required
                  <br />• Fastest (~10-20s)
                  <br />• Best for: Brainstorming, ideation
                </div>
              </div>
            </div>
          </RadioCard>

        </RadioGroup>
      </div>

      {/* Source types */}
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger>⚙️ Advanced Settings</AccordionTrigger>
          <AccordionContent className="space-y-4">

            <div>
              <Label>Allowed Source Types</Label>
              <div className="space-y-2 mt-2">
                {(['official', 'academic', 'business_data', 'news'] as SourceType[]).map(type => (
                  <Checkbox
                    key={type}
                    checked={policy.allowed_source_types.includes(type)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...policy.allowed_source_types, type]
                        : policy.allowed_source_types.filter(t => t !== type);
                      setPolicy({...policy, allowed_source_types: newTypes});
                    }}
                    label={SOURCE_TYPE_LABELS[type]}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Minimum Sources Required: {policy.minimum_sources}</Label>
              <Slider
                value={[policy.minimum_sources]}
                onValueChange={([val]) => setPolicy({...policy, minimum_sources: val})}
                min={1}
                max={5}
                step={1}
              />
            </div>

            <div>
              <Label>Max Source Age: {policy.max_source_age_days} days</Label>
              <Select
                value={policy.max_source_age_days.toString()}
                onValueChange={(val) => setPolicy({...policy, max_source_age_days: parseInt(val)})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Checkbox
              checked={policy.require_multiple_sources}
              onCheckedChange={(checked) => setPolicy({...policy, require_multiple_sources: !!checked})}
              label="Require multiple independent sources"
            />

            <Checkbox
              checked={policy.require_consensus}
              onCheckedChange={(checked) => setPolicy({...policy, require_consensus: !!checked})}
              label="Flag conflicts between sources"
            />

          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Policy'}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>

      {/* Preview */}
      <Alert className="mt-4">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Current settings will apply to:</strong> All new AI generations.
          You can override per-function if needed.
        </AlertDescription>
      </Alert>

    </SettingsSection>
  );
}
```

#### **2. Pre-Generation Modal (Opcional)**

Para funciones ultra-críticas como Financial Projections:

```typescript
// src/components/ai/PreGenerationModal.tsx

interface PreGenerationModalProps {
  functionName: string;
  defaultPolicy: SourcePolicy;
  onConfirm: (policy: SourcePolicy) => void;
  onCancel: () => void;
}

export function PreGenerationModal({ functionName, defaultPolicy, onConfirm, onCancel }: Props) {
  const [policy, setPolicy] = useState(defaultPolicy);

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure AI Generation</DialogTitle>
          <DialogDescription>
            You're about to generate {functionName}. Configure how the AI should work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Mode Selector */}
          <RadioGroup value={policy.mode} onValueChange={(mode) => setPolicy({...policy, mode})}>
            <RadioCard value="strict">🔒 Strict - Maximum reliability</RadioCard>
            <RadioCard value="balanced">⚖️ Balanced - Recommended</RadioCard>
            <RadioCard value="exploratory">🚀 Exploratory - Fast</RadioCard>
          </RadioGroup>

          {/* Preview */}
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>With "{policy.mode}" mode:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Will search {policy.allowed_source_types.length} source types</li>
                <li>• Requires minimum {policy.minimum_sources} sources</li>
                <li>• Estimated time: {estimateTime(policy)}</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(policy)}>
            Generate with AI
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
```

**Cuándo mostrar este modal:**
- ✅ Financial Projections
- ✅ Legal Analysis (si lo agregas)
- ✅ Investment Recommendations (si lo agregas)
- ❌ Brainstorming, Ideas, etc. (no necesita)

#### **3. Real Source Search (Edge Function)**

```typescript
// supabase/functions/source-search/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { callClaude } from '../_shared/anthropic-client.ts';

serve(async (req) => {
  const { query, policy } = await req.json();

  // 1. Buscar en múltiples APIs según source types
  const searches: Promise<any>[] = [];

  if (policy.allowed_source_types.includes('official')) {
    searches.push(searchGovernmentAPIs(query));
  }

  if (policy.allowed_source_types.includes('academic')) {
    searches.push(searchSemanticScholar(query));
    searches.push(searchArXiv(query));
  }

  if (policy.allowed_source_types.includes('business_data')) {
    searches.push(searchCrunchbase(query));
  }

  if (policy.allowed_source_types.includes('news')) {
    searches.push(searchNewsAPI(query));
  }

  // 2. Ejecutar búsquedas en paralelo
  const results = await Promise.allSettled(searches);
  const sources = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // 3. Filtrar por age
  const maxAge = policy.max_source_age_days * 24 * 60 * 60 * 1000;
  const filtered = sources.filter(s => {
    const age = Date.now() - new Date(s.date).getTime();
    return age <= maxAge;
  });

  // 4. Rankear por reliability + relevance
  const ranked = filtered.sort((a, b) => {
    const scoreA = a.reliability_score * 0.6 + a.relevance_score * 0.4;
    const scoreB = b.reliability_score * 0.6 + b.relevance_score * 0.4;
    return scoreB - scoreA;
  });

  // 5. Limitar a top N
  const topSources = ranked.slice(0, Math.max(policy.minimum_sources, 5));

  return new Response(JSON.stringify({
    sources: topSources,
    total_found: filtered.length
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Helpers (implementar según APIs disponibles)
async function searchSemanticScholar(query: string) {
  // Llamar a Semantic Scholar API
  // https://api.semanticscholar.org/graph/v1/paper/search
  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5`,
    { headers: { 'x-api-key': Deno.env.get('SEMANTIC_SCHOLAR_KEY')! } }
  );
  const data = await response.json();
  return data.data.map(paper => ({
    url: paper.url,
    title: paper.title,
    type: 'academic',
    reliability_score: 90,
    date: paper.publicationDate,
    quote: paper.abstract?.substring(0, 200) || '',
    relevance_score: 85,
    domain: 'semanticscholar.org'
  }));
}

async function searchNewsAPI(query: string) {
  // Similar para News API, etc.
}

// ... otros helpers
```

### Métricas de Éxito Fase 2

```
✅ Settings page desplegada y funcional
✅ Users configuran sus preferencias: > 40% adoption
✅ Edge Function source-search funcionando
✅ Tiempo de generación se mantiene: < 45s para strict
✅ User satisfaction con control: > 75%
```

---

## 🛡️ FASE 3: EVIDENCE CONTRACTS & VALIDATION (Semanas 9-14)

### Objetivo
Garantías formales de evidencia para funciones ultra-críticas

### Implementación

#### **1. Contract System**

```typescript
// src/lib/ai-trust/evidence-contracts.ts

export const EVIDENCE_CONTRACTS: Record<string, EvidenceContract[]> = {
  'financial-projections': [
    {
      claim: 'Market size estimate',
      required_evidence: {
        min_sources: 2,
        source_types: ['official', 'business_data'],
        consensus_required: true,
        max_age_days: 180
      },
      actual_evidence: [], // Se llena en runtime
      status: 'unmet'
    },
    {
      claim: 'Revenue growth projection',
      required_evidence: {
        min_sources: 3,
        source_types: ['official', 'business_data', 'academic'],
        consensus_required: true,
        max_age_days: 365
      },
      actual_evidence: [],
      status: 'unmet'
    }
  ],

  'legal-analysis': [
    {
      claim: 'Legal regulation applicable',
      required_evidence: {
        min_sources: 2,
        source_types: ['official'],
        consensus_required: true,
        max_age_days: 90
      },
      actual_evidence: [],
      status: 'unmet'
    }
  ]
};

export async function validateContracts(
  functionName: string,
  generatedContent: any,
  sources: AISource[]
): Promise<{ contracts: EvidenceContract[]; allMet: boolean }> {
  const contracts = EVIDENCE_CONTRACTS[functionName] || [];

  // Para cada contrato, verificar si se cumple
  const validated = contracts.map(contract => {
    // Filtrar fuentes relevantes para este claim
    const relevantSources = sources.filter(s =>
      contract.required_evidence.source_types.includes(s.type) &&
      isRecentEnough(s, contract.required_evidence.max_age_days)
    );

    const met = relevantSources.length >= contract.required_evidence.min_sources;

    return {
      ...contract,
      actual_evidence: relevantSources,
      status: met ? 'met' : 'unmet',
      gap_analysis: met ? undefined : `Need ${contract.required_evidence.min_sources - relevantSources.length} more sources`
    };
  });

  return {
    contracts: validated,
    allMet: validated.every(c => c.status === 'met')
  };
}
```

#### **2. Pre-Generation Contract Preview**

```typescript
// Mostrar ANTES de generar (para funciones con contracts)

<Dialog>
  <DialogHeader>
    <DialogTitle>Evidence Requirements</DialogTitle>
    <DialogDescription>
      Financial projections require verified evidence. Here's what we'll validate:
    </DialogDescription>
  </DialogHeader>

  <div className="space-y-3">
    {contracts.map((contract, idx) => (
      <Card key={idx}>
        <CardContent className="pt-4">
          <div className="font-medium mb-2">{contract.claim}</div>
          <div className="text-sm text-gray-600">
            Requires:
            <ul className="list-disc list-inside mt-1">
              <li>{contract.required_evidence.min_sources}+ sources</li>
              <li>Types: {contract.required_evidence.source_types.join(', ')}</li>
              <li>Max age: {contract.required_evidence.max_age_days} days</li>
              {contract.required_evidence.consensus_required && (
                <li>Must have consensus (no conflicts)</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>

  <Alert className="mt-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      If evidence requirements are not met, the AI will return a "hypothesis"
      instead of a definitive projection.
    </AlertDescription>
  </Alert>

  <DialogFooter>
    <Button onClick={onProceed}>I Understand - Proceed</Button>
  </DialogFooter>
</Dialog>
```

#### **3. Post-Generation Contract Report**

```typescript
<Card className="border-2 border-orange-200 mt-4">
  <CardHeader>
    <CardTitle>🛡️ Evidence Contract Report</CardTitle>
  </CardHeader>
  <CardContent>
    {contracts.map((contract, idx) => (
      <div key={idx} className="mb-4 last:mb-0">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">{contract.claim}</div>
          <Badge variant={contract.status === 'met' ? 'success' : 'warning'}>
            {contract.status === 'met' ? '✓ Met' : '⚠ Not Met'}
          </Badge>
        </div>

        <div className="text-sm text-gray-600">
          Found {contract.actual_evidence.length}/{contract.required_evidence.min_sources} required sources
        </div>

        {contract.status === 'unmet' && contract.gap_analysis && (
          <Alert className="mt-2" variant="warning">
            <AlertDescription>{contract.gap_analysis}</AlertDescription>
          </Alert>
        )}
      </div>
    ))}

    {!allMet && (
      <Alert className="mt-4" variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Evidence requirements not fully met.</strong>
          <br />This output should be treated as a hypothesis and manually reviewed.
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

### Métricas de Éxito Fase 3

```
✅ Contracts definidos para 3+ funciones críticas
✅ Contract validation funcionando
✅ User awareness: > 80% entienden el sistema
✅ False negatives: < 5% (no rechazar outputs válidos)
✅ Enterprise interest: demos exitosos
```

---

## 🚀 FASE 4: ADVANCED FEATURES & ENTERPRISE (Semanas 15-22)

### Features Opcionales (Implementar según demanda)

#### **1. Source Whitelisting/Blacklisting**

```typescript
// Permitir a empresas definir sus propias fuentes aprobadas

interface CustomSourceRegistry {
  user_id: string;
  whitelisted_domains: string[]; // Solo usar estas
  blacklisted_domains: string[]; // Nunca usar estas
  custom_sources: Array<{
    url: string;
    name: string;
    reliability_override: number;
  }>;
}
```

#### **2. Compliance Reports**

```typescript
// Generar PDF con todas las generaciones + fuentes del mes

export async function generateComplianceReport(
  userId: string,
  month: string
): Promise<Buffer> {
  const logs = await getGenerationLogs(userId, month);

  const pdf = new PDFDocument();
  pdf.text('AI Generation Compliance Report');
  pdf.text(`Period: ${month}`);

  logs.forEach(log => {
    pdf.addPage();
    pdf.text(`Function: ${log.function_name}`);
    pdf.text(`Confidence: ${log.confidence_score}%`);
    pdf.text('Sources:');
    log.sources.forEach(s => {
      pdf.text(`- ${s.title} (${s.reliability_score}/100)`);
    });
  });

  return pdf.toBuffer();
}
```

#### **3. A/B Testing: Con vs Sin Transparency**

```typescript
// Medir impacto en confianza del usuario

const showTransparency = Math.random() > 0.5; // 50/50 split

if (showTransparency) {
  <AITransparencyCard response={response} />
} else {
  // Solo mostrar contenido, sin fuentes
}

// Trackear: ¿qué grupo tiene mayor satisfaction/retention?
```

#### **4. AI Advisor Chat con Fuentes**

```typescript
// Cada mensaje del chat muestra fuentes en tiempo real

<ChatMessage role="assistant">
  <div className="prose">{message.content}</div>

  <div className="text-xs text-gray-500 mt-2 flex gap-2">
    <span>Sources:</span>
    {message.sources.map(s => (
      <a href={s.url} className="underline">[{s.domain}]</a>
    ))}
  </div>
</ChatMessage>
```

---

## 📊 RESUMEN EJECUTIVO

### Timeline Total: 16-22 semanas

```
┌────────────┬─────────────┬──────────┬────────────┐
│ Fase       │ Semanas     │ Valor    │ Prioridad  │
├────────────┼─────────────┼──────────┼────────────┤
│ 0: Setup   │ 1           │ 0%       │ MUST       │
│ 1: Trans.  │ 2-3         │ 30%      │ MUST       │
│ 2: Policies│ 3-4         │ +60%     │ SHOULD     │
│ 3: Contract│ 4-6         │ +90%     │ NICE       │
│ 4: Advanced│ 6-8         │ +100%    │ OPTIONAL   │
└────────────┴─────────────┴──────────┴────────────┘
```

### ROI por Fase

| Fase | Esfuerzo | Valor Comercial | ROI |
|------|----------|-----------------|-----|
| 1 | Bajo | Alto | ⭐⭐⭐⭐⭐ |
| 2 | Medio | Muy Alto | ⭐⭐⭐⭐⭐ |
| 3 | Alto | Alto (Enterprise) | ⭐⭐⭐⭐ |
| 4 | Muy Alto | Medio (Niche) | ⭐⭐⭐ |

### Recomendación Final

**EMPEZAR CON: Fase 0 + Fase 1**

Esto te da:
- ✅ Diferenciador visible en 3-4 semanas
- ✅ 80% del valor percibido
- ✅ Feedback real de usuarios para guiar Fase 2+
- ✅ Demos convincentes para ventas

**Fases 2-4: Implementar según tracción**
- Si users piden más control → Fase 2
- Si enterprise interesado → Fase 3
- Fase 4 solo si hay budget/demanda clara

---

¿Empezamos con Fase 0 + Fase 1? Puedo ayudarte a implementar los componentes base.
