/**
 * GENERATE COMPLETE BUSINESS - KILLER FEATURE 🦄
 *
 * Takes a user with just an IDEA and generates a complete business in 10 minutes:
 * - Branding (logo, colors, typography) - 3 options to choose from
 * - Products/Services with pricing - 5 products with rationale
 * - Buyer persona - detailed profile
 * - Value proposition - why customers buy
 * - Website (HTML/CSS + copy) - deployed to Vercel
 * - Competitor analysis - battle cards
 * - Validation plan - Lean Startup experiments
 *
 * Flow:
 * 1. User provides: idea name, description, target customer, industry
 * 2. AI generates ALL the above in parallel
 * 3. User reviews previews and approves/edits
 * 4. Everything gets saved to DB and website deployed
 *
 * Result: User goes from idea → complete business ready to launch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const {
      user_id,
      project_id,
      idea_id, // Optional: if coming from generated_business_ideas
      business_info, // Manual input if no idea_id
    } = await req.json();

    if (!user_id || !project_id) {
      throw new Error('user_id and project_id are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get business context
    let businessContext: Record<string, unknown>;

    if (idea_id) {
      // Coming from generated ideas
      const { data: idea } = await supabaseClient
        .from('generated_business_ideas')
        .select('*')
        .eq('id', idea_id)
        .single();

      if (!idea) {
        throw new Error('Idea not found');
      }

      businessContext = {
        idea_name: idea.idea_name,
        description: idea.idea_description,
        problem: idea.problem_statement,
        solution: idea.solution_approach,
        target_customer: idea.target_customer,
        business_model: idea.business_model,
        industry: extractIndustry(idea.idea_description),
      };
    } else if (business_info) {
      // Manual input
      businessContext = business_info;
    } else {
      throw new Error('Either idea_id or business_info is required');
    }

    console.log('Generating complete business for:', businessContext.idea_name);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    // 2. Generate everything in ONE call (faster)
    const prompt = buildCompleteBusinessPrompt(businessContext);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API error');
    }

    const aiData = await response.json();
    const content = aiData.content?.[0]?.text;

    if (!content) {
      throw new Error('No response from AI');
    }

    // 3. Parse AI response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let generated;
    try {
      generated = JSON.parse(cleanContent);
    } catch (_e) {
      console.error('Parse error');
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }

    // 4. Generate logos with DALL-E for the 3 branding options
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    for (let i = 0; i < 3; i++) {
      const brandingOption = generated.branding[i];
      const logoPrompt = `Create a modern, minimalist logo for a business called "${businessContext.idea_name}". ${brandingOption.logo_description}. Style: ${brandingOption.design_style}. Primary color: ${brandingOption.primary_color}. Clean, professional, scalable.`;

      try {
        const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: logoPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }),
        });

        if (dalleResponse.ok) {
          const dalleData = await dalleResponse.json();
          brandingOption.logo_url = dalleData.data[0].url;
        } else {
          console.error('DALL-E error for option', i + 1);
          brandingOption.logo_url = null;
        }
      } catch (error) {
        console.error('Error generating logo:', error);
        brandingOption.logo_url = null;
      }
    }

    // 5. Save to generation_previews for user approval
    const { data: preview } = await supabaseClient
      .from('generation_previews')
      .insert({
        project_id,
        user_id,
        generation_type: 'complete_business',
        generated_options: [
          {
            option: 1,
            branding: generated.branding,
            products: generated.products,
            buyer_persona: generated.buyer_persona,
            value_proposition: generated.value_proposition,
            competitors: generated.competitors,
            validation_experiments: generated.validation_experiments,
            website_structure: generated.website_structure,
          },
        ],
        status: 'pending',
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        preview_id: preview?.id,
        message: '✨ Negocio completo generado - Revisa y aprueba',
        generated: {
          branding_options: generated.branding.length,
          products_count: generated.products.length,
          buyer_persona: generated.buyer_persona.persona_name,
          validation_experiments: generated.validation_experiments.length,
          website_pages: Object.keys(generated.website_structure.pages).length,
        },
        next_step: 'Review the preview and call /approve-generation-preview',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating complete business:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// AI PROMPTS
// ============================================================================

const SYSTEM_PROMPT = `Eres un experto en creación de negocios y branding.

Tu trabajo es tomar una IDEA de negocio y generar TODO lo necesario para que el emprendedor pueda lanzar en 10 minutos:

1. BRANDING (3 opciones para elegir):
   - Logo description (para DALL-E)
   - Primary color, secondary color, accent colors
   - Typography (heading font, body font)
   - Design style (modern, playful, elegant, bold, etc.)
   - Rationale (por qué este branding funciona)

2. PRODUCTS/SERVICES (5 productos):
   - Product name, description, tagline
   - Pricing (optimizado para el mercado)
   - Features, deliverables
   - Target customer for this product
   - Value proposition específica
   - Rationale (por qué este precio y features)

3. BUYER PERSONA (perfil detallado):
   - Persona name, age range, role, industry
   - Pain points (3-5)
   - Budget min/max, decision process
   - Common objections
   - Preferred channels
   - Buying triggers

4. VALUE PROPOSITION:
   - Headline, subheadline
   - Unique selling points (3-5)
   - Benefits (not features)
   - ROI examples
   - Success stories (hypothetical but realistic)

5. COMPETITORS (3-5 competidores):
   - Competitor name, website
   - Features, pricing
   - Strengths, weaknesses
   - Our advantage
   - Battle card (qué decir cuando cliente los menciona)

6. VALIDATION EXPERIMENTS (Lean Startup):
   - 5 experimentos para validar la idea
   - Cada uno: experiment_name, type, hypothesis, success_criteria, budget, timeline

7. WEBSITE STRUCTURE:
   - Páginas: home, about, services/products, contact
   - Para cada página: headline, subheadline, sections con copy
   - CTA buttons con texto optimizado

FORMATO DE RESPUESTA: JSON válido con esta estructura exacta.

IMPORTANTE:
- Branding: 3 opciones DISTINTAS en estilo (una moderna, una elegante, una bold)
- Products: Rango de precios (entry-level, mid-tier, premium)
- Pricing: Basado en mercado real (no inventar números al azar)
- Validation: Experimentos concretos tipo Lean Startup (no vagos)
- Website copy: Específico para ESTE negocio (no genérico)`;

function buildCompleteBusinessPrompt(context: Record<string, unknown>): string {
  return `
# GENERAR NEGOCIO COMPLETO

## CONTEXTO DEL NEGOCIO

**Nombre de la idea**: ${context.idea_name}

**Descripción**: ${context.description}

**Problema que resuelve**: ${context.problem || 'No especificado'}

**Solución propuesta**: ${context.solution || 'No especificado'}

**Cliente objetivo**: ${context.target_customer}

**Industria**: ${context.industry || 'General'}

**Modelo de negocio**: ${context.business_model || 'No especificado'}

---

## INSTRUCCIONES

Genera un negocio COMPLETO y listo para lanzar, incluyendo TODO lo siguiente:

### 1. BRANDING (3 opciones)

Genera 3 opciones de branding DISTINTAS en estilo. Responde en este formato JSON:

\`\`\`json
{
  "branding": [
    {
      "option": 1,
      "design_style": "modern_minimalist",
      "logo_description": "Descripción detallada para DALL-E...",
      "primary_color": "#HEX",
      "secondary_color": "#HEX",
      "accent_colors": ["#HEX", "#HEX"],
      "typography": {
        "heading_font": "Font Name",
        "body_font": "Font Name"
      },
      "tone_attributes": ["professional", "friendly", "innovative"],
      "rationale": "Por qué este branding funciona para ${context.idea_name}..."
    },
    { ... option 2 ... },
    { ... option 3 ... }
  ]
}
\`\`\`

### 2. PRODUCTS/SERVICES (5 productos)

Genera 5 productos/servicios con rango de precios (entry → premium):

\`\`\`json
{
  "products": [
    {
      "product_name": "...",
      "product_description": "...",
      "tagline": "...",
      "price": 99,
      "pricing_model": "monthly",
      "currency": "EUR",
      "features": [
        {"feature": "Feature 1", "description": "Detail"},
        {"feature": "Feature 2", "description": "Detail"}
      ],
      "deliverables": [
        {"deliverable": "What they get", "timeline": "When"}
      ],
      "target_customer": "Specific customer for this tier",
      "value_proposition": "Why buy this",
      "rationale": "Why this pricing makes sense"
    },
    { ... 4 more products ... }
  ]
}
\`\`\`

### 3. BUYER PERSONA

\`\`\`json
{
  "buyer_persona": {
    "persona_name": "...",
    "age_range": "25-35",
    "role": "...",
    "industry": "...",
    "pain_points": [
      {"pain": "Specific pain", "severity": "high"},
      { ... 4 more ... }
    ],
    "budget_min": 100,
    "budget_max": 500,
    "budget_frequency": "monthly",
    "decision_process": {
      "steps": ["Research", "Compare", "Trial", "Decide"],
      "timeline": "2-4 weeks"
    },
    "common_objections": [
      {"objection": "Too expensive", "response": "How to handle it"}
    ],
    "preferred_channels": ["LinkedIn", "Email", "Google"],
    "buying_triggers": ["Pain point X gets worse", "Competitor fails"]
  }
}
\`\`\`

### 4. VALUE PROPOSITION

\`\`\`json
{
  "value_proposition": {
    "headline": "...",
    "subheadline": "...",
    "unique_selling_points": [
      {"usp": "USP 1", "explanation": "Why it matters"}
    ],
    "benefits": [
      {"benefit": "Save time", "quantified": "Save 10 hours/week"}
    ],
    "roi_examples": [
      {"example": "ROI scenario", "calculation": "Numbers"}
    ]
  }
}
\`\`\`

### 5. COMPETITORS (3-5)

\`\`\`json
{
  "competitors": [
    {
      "competitor_name": "...",
      "website": "...",
      "features": ["Feature 1", "Feature 2"],
      "pricing": {"model": "subscription", "price": 99},
      "strengths": ["What they do well"],
      "weaknesses": ["Where they fail"],
      "our_advantage": ["Why we're better"],
      "battle_card": {
        "when_mentioned": "What to say when customer compares us",
        "key_differentiators": ["Diff 1", "Diff 2"]
      }
    }
  ]
}
\`\`\`

### 6. VALIDATION EXPERIMENTS (Lean Startup)

\`\`\`json
{
  "validation_experiments": [
    {
      "step": 1,
      "experiment_name": "Landing page test",
      "experiment_type": "landing_page",
      "hypothesis": "At least 100 people will sign up in 1 week",
      "success_criteria": "50+ emails with 5%+ conversion",
      "budget_allocated": 50,
      "time_allocated_hours": 8,
      "expected_learnings": "Validate demand"
    },
    { ... 4 more experiments ... }
  ]
}
\`\`\`

### 7. WEBSITE STRUCTURE

\`\`\`json
{
  "website_structure": {
    "pages": {
      "home": {
        "headline": "...",
        "subheadline": "...",
        "hero_cta": "Get Started Free",
        "sections": [
          {
            "section_name": "Problem",
            "headline": "...",
            "copy": "..."
          },
          {
            "section_name": "Solution",
            "headline": "...",
            "copy": "..."
          },
          {
            "section_name": "How it works",
            "steps": [
              {"step": 1, "title": "...", "description": "..."}
            ]
          },
          {
            "section_name": "Pricing",
            "cta": "Choose your plan"
          }
        ]
      },
      "about": { ... },
      "services": { ... },
      "contact": { ... }
    }
  }
}
\`\`\`

Responde SOLO con JSON válido que incluya TODAS las secciones anteriores.
`;
}

function extractIndustry(description: string): string {
  const industries = ['tecnología', 'salud', 'educación', 'finanzas', 'retail', 'servicios', 'marketing'];
  const desc = description.toLowerCase();
  for (const industry of industries) {
    if (desc.includes(industry)) return industry;
  }
  return 'general';
}
