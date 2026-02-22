/**
 * PITCH DECK AUTOMÁTICO
 *
 * Genera un pitch deck de 10 slides profesional basado en:
 * - Branding generado
 * - Business data del proyecto
 * - Competitor analysis
 * - Market research
 *
 * Output: JSON con estructura de slides (luego se puede exportar a PDF/PPTX)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PitchDeckRequest {
  projectId: string;
  // Business basics
  businessName: string;
  tagline: string;
  problemStatement: string;
  solution: string;
  targetCustomer: string;
  // Branding
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    designStyle: string;
  };
  // Market data
  marketSize?: {
    tam: string;
    sam: string;
  };
  competitors?: Array<{
    name: string;
    weakness: string;
  }>;
  // Business model
  revenueModel: string;
  pricing?: Array<{
    name: string;
    price: number;
    features: string[];
  }>;
  // Traction (if any)
  traction?: {
    mrr?: number;
    customers?: number;
    growth?: string;
  };
  // Team
  team?: Array<{
    name: string;
    role: string;
    background: string;
  }>;
  // Ask
  fundingGoal?: string;
  useOfFunds?: string[];
}

interface Slide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  content: {
    type: 'text' | 'bullets' | 'numbers' | 'visual' | 'quote';
    data: unknown;
  };
  notes: string; // Speaker notes
  visualSuggestion?: string; // What image/chart to use
}

interface PitchDeck {
  title: string;
  subtitle: string;
  slides: Slide[];
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
  };
  exportFormats: string[]; // ['pdf', 'pptx', 'google-slides']
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: PitchDeckRequest = await req.json();
    const { projectId, businessName, tagline, problemStatement, solution, branding } = body;

    if (!projectId || !businessName || !problemStatement || !solution) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Anthropic
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    console.log('📊 Generating pitch deck for:', businessName);

    // Generate the 10 slides
    const slides = await generateSlides(anthropic, body);

    const pitchDeck: PitchDeck = {
      title: businessName,
      subtitle: tagline || 'Investor Pitch Deck',
      slides,
      branding: {
        primaryColor: branding?.primaryColor || '#2563EB',
        secondaryColor: branding?.secondaryColor || '#7C3AED',
        logoUrl: branding?.logoUrl,
      },
      exportFormats: ['pdf', 'pptx', 'google-slides'],
    };

    const executionTimeMs = Date.now() - startTime;

    // Log the AI call
    await logAICall({
      supabaseClient,
      projectId,
      userId: undefined,
      functionName: 'generate-pitch-deck',
      inputData: { businessName, problemStatement, solution },
      outputData: pitchDeck,
      success: true,
      executionTimeMs,
      tokensUsed: slides.length * 300, // Approximate
      modelUsed: 'claude-3-5-sonnet-20241022',
    });

    console.log(`✅ Pitch deck generated in ${executionTimeMs}ms`);

    return new Response(JSON.stringify({ success: true, pitchDeck }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error generating pitch deck:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate pitch deck',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate 10 pitch deck slides with AI
 */
async function generateSlides(anthropic: Anthropic, data: PitchDeckRequest): Promise<Slide[]> {
  const prompt = `Eres un experto en crear pitch decks para startups que han levantado $100M+ (Y Combinator, 500 Startups, Sequoia).

Crea un pitch deck de 10 slides siguiendo las mejores prácticas de VCs top.

DATOS DEL NEGOCIO:
Business Name: ${data.businessName}
Tagline: ${data.tagline || 'N/A'}
Problem: ${data.problemStatement}
Solution: ${data.solution}
Target Customer: ${data.targetCustomer}
Revenue Model: ${data.revenueModel || 'N/A'}
Market Size TAM: ${data.marketSize?.tam || 'N/A'}
Market Size SAM: ${data.marketSize?.sam || 'N/A'}
Competitors: ${data.competitors?.map((c) => c.name).join(', ') || 'N/A'}
Traction: ${data.traction ? `${data.traction.customers || 0} customers, $${data.traction.mrr || 0} MRR` : 'Pre-launch'}
Funding Goal: ${data.fundingGoal || 'N/A'}

ESTRUCTURA OBLIGATORIA (10 slides):

1. **COVER SLIDE**
   - Company name + tagline
   - One-liner (qué haces en 10 palabras)
   - Visual suggestion

2. **PROBLEM**
   - El problema que resuelves (3-4 bullet points)
   - Debe ser VISCERAL (que duela)
   - Estadísticas impactantes

3. **SOLUTION**
   - Tu producto/servicio
   - Cómo resuelve el problema
   - "Before vs After" o demo visual

4. **PRODUCT DEMO** (or "How It Works")
   - 3-5 features clave
   - Screenshots o workflow
   - Keep it simple

5. **MARKET OPPORTUNITY**
   - TAM, SAM, SOM
   - Market growth rate
   - Why NOW (timing)

6. **BUSINESS MODEL**
   - Cómo haces dinero
   - Pricing tiers (si aplica)
   - Unit economics (if available)

7. **TRACTION** (o "Go-to-Market" si pre-launch)
   - Customers, revenue, growth
   - O estrategia de adquisición si no tienes traction
   - Key metrics

8. **COMPETITION**
   - Competitive landscape
   - Tu diferenciador único
   - Magic quadrant o comparison table

9. **TEAM**
   - Founders + key hires
   - Relevant background
   - Why YOU can win this

10. **ASK**
    - Cuánto levantas
    - Use of funds (breakdown)
    - Milestones que alcanzarás

ESTÁNDARES DE CALIDAD:

❌ MAL: "Problem: Project management is hard"
✅ BIEN: "73% of projects fail due to poor communication (PMI 2024). Teams waste 10h/week in meetings to 'sync up' because tools are too complex. Costs $2,400/employee/year in lost productivity."

❌ MAL: "We're a SaaS platform"
✅ BIEN: "We turn 2 hours of Jira setup into 60 seconds with AI. Zero configuration. Your team is productive on Day 1, not Week 3."

❌ MAL: "Large market"
✅ BIEN: "$5.2B TAM, growing 24% CAGR. We're targeting $380M SAM (3.8M startups 5-50 employees). Wedge: capture 1% ($3.8M) in Year 1."

IMPORTANTE:
- Cada slide debe tener: title, content (bullets/numbers/visual), speaker notes
- Be CONCISE: Max 5 bullets per slide, max 10 words per bullet
- Use NUMBERS: "10x faster" not "much faster"
- Visual suggestions: qué imagen/chart usar
- Speaker notes: qué decir cuando presentas (2-3 frases)

Devuelve SOLO un JSON array de 10 slides con este formato EXACTO:
[
  {
    "slideNumber": 1,
    "title": "ProjectX",
    "subtitle": "Project Management That Actually Works",
    "content": {
      "type": "text",
      "data": {
        "oneLiner": "Jira simplicity, minus the 2-hour setup",
        "category": "B2B SaaS - Team Productivity"
      }
    },
    "notes": "Start strong: 'We're solving a $2.4B problem - teams waste 10 hours per week because project tools are too complex. We make it simple.'",
    "visualSuggestion": "Clean hero image of product in action, or abstract visual representing simplicity vs chaos"
  },
  {
    "slideNumber": 2,
    "title": "The Problem",
    "content": {
      "type": "bullets",
      "data": [
        "73% of projects fail due to poor communication (PMI 2024)",
        "Teams waste 10h/week in 'sync' meetings → $2,400/employee/year lost",
        "Jira setup takes 2 hours. 68% of teams abandon it in 3 months",
        "Alternatives are either too simple (no features) or too complex (nobody uses)"
      ]
    },
    "notes": "Make them FEEL the pain. Pause after each stat. 'Raise your hand if your team has tried Jira and given up.'",
    "visualSuggestion": "Split image: frustrated person in front of complex dashboard vs happy person using simple tool"
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as { type: string; text: string }).text;

  // Extract JSON array from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse pitch deck slides response');
  }

  return JSON.parse(jsonMatch[0]);
}
