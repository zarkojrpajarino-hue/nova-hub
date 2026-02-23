/**
 * LEARNING PATH GENERATOR (CAPA 6)
 *
 * Genera learning path personalizado basado en:
 * - Skills actuales del founder
 * - Gaps identificados
 * - Tipo de negocio
 * - Background
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';


interface LearningPathRequest {
  project_id: string;
  founder_profile: {
    background: string;
    current_skills: string[];
    experience_years?: number;
  };
  business_type: string;
  business_phase: string; // 'ideation', 'validation', 'mvp', 'growth'
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const requestData: LearningPathRequest = await req.json();

        const { serviceClient: supabaseClient } = await validateAuth(req);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    console.log('📚 Generating learning path for:', requestData.business_type);

    // Generate learning path with AI
    const learningPath = await generateLearningPath(anthropic, requestData);

    // Save to database
    const { data: saved } = await supabaseClient
      .from('learning_paths')
      .upsert({
        project_id: requestData.project_id,
        skill_gaps: learningPath.skill_gaps,
        resources: learningPath.resources,
        existing_skills: requestData.founder_profile.current_skills,
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        data: saved,
      }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    });
  }
});

async function generateLearningPath(anthropic: Anthropic, request: LearningPathRequest) {
  const { founder_profile, business_type, business_phase } = request;

  const skillsNeeded: { [key: string]: string[] } = {
    'saas_b2b': ['product_development', 'sales', 'marketing', 'saas_metrics', 'customer_success'],
    'saas_b2c': ['product_development', 'growth_marketing', 'analytics', 'retention', 'monetization'],
    'ecommerce': ['supply_chain', 'digital_marketing', 'conversion_optimization', 'customer_service'],
    'marketplace': ['network_effects', 'community_building', 'two_sided_markets', 'trust_safety'],
    'service': ['sales', 'operations', 'client_management', 'productization'],
    'content_media': ['content_creation', 'audience_building', 'monetization', 'seo'],
  };

  const baseSkills = skillsNeeded[business_type.toLowerCase().replace(/\s+/g, '_')] || [
    'business_fundamentals',
  ];
  const gaps = baseSkills.filter((skill) => !founder_profile.current_skills.includes(skill));

  const prompt = `Eres un experto en educación para emprendedores y curación de recursos de aprendizaje.

FOUNDER PROFILE:
- Background: ${founder_profile.background}
- Skills actuales: ${founder_profile.current_skills.join(', ')}
- Experiencia: ${founder_profile.experience_years || 0} años

NEGOCIO:
- Tipo: ${business_type}
- Fase: ${business_phase}

SKILL GAPS DETECTADOS:
${gaps.join(', ')}

TAREA:
Genera un LEARNING PATH personalizado y priorizado.

REGLAS:
1. **Prioriza por urgencia** - Qué necesita aprender AHORA vs después
2. **Recursos de calidad** - Solo recomienda libros/cursos/videos probados
3. **Tiempo realista** - Estima tiempo real de aprendizaje
4. **Aplicable inmediatamente** - Prioriza lo que puede usar ya
5. **Skip lo que ya sabe** - No hagas perder tiempo

FRAMEWORK DE PRIORIZACIÓN:
- **CRITICAL** - Necesita esto ANTES de empezar (ej: no sabe validar → aprende Customer Development)
- **HIGH** - Necesita en primeros 3 meses (ej: founder técnico necesita aprender sales)
- **MEDIUM** - Útil en 3-6 meses (ej: fundraising cuando aún está en ideation)
- **LOW** - Nice to have, puede aprender después (ej: advanced analytics en fase MVP)

TIPOS DE RECURSOS:
- **Book** - Profundidad, teoría
- **Course** - Hands-on, paso a paso
- **Video** - Quick learning, overview
- **Article** - Specific topic, fast
- **Tool** - Software/framework para practicar

Devuelve JSON:
{
  "skill_gaps": [
    "gap_1",
    "gap_2",
    "gap_3"
  ],

  "resources": [
    {
      "id": "resource_1",
      "title": "The Mom Test",
      "type": "book",
      "url": "https://www.momtestbook.com/",
      "skill": "customer_development",
      "priority": "critical",
      "estimated_time": "4 hours (reading)",
      "cost": "$15 (or free PDF)",
      "reasoning": "No puedes validar tu idea sin saber hacer customer interviews. Este libro es EL gold standard. Léelo ANTES de hablar con customers.",
      "key_takeaways": [
        "Cómo hacer preguntas que NO sean biased",
        "Detectar cuando customers mienten educadamente",
        "Convertir conversaciones en actionable insights"
      ],
      "when_to_do_it": "Esta semana (antes de cualquier customer interview)",
      "how_to_apply": "Crea script de 5 preguntas para tus primeras 10 entrevistas"
    },
    {
      "id": "resource_2",
      "title": "SaaS Metrics 2.0",
      "type": "article",
      "url": "https://www.forentrepreneurs.com/saas-metrics-2/",
      "skill": "saas_metrics",
      "priority": "high",
      "estimated_time": "2 hours",
      "cost": "Gratis",
      "reasoning": "Necesitas entender MRR, churn, CAC, LTV ANTES de lanzar para trackear desde día 1",
      "key_takeaways": [
        "Qué métricas trackear en cada fase",
        "Cómo calcular unit economics",
        "Benchmarks de industria"
      ],
      "when_to_do_it": "Semana 2 (después de customer interviews, antes de MVP)",
      "how_to_apply": "Crea spreadsheet para trackear estas métricas desde primer customer"
    }
  ],

  "learning_roadmap": {
    "phase_1_immediate": {
      "duration": "2-4 semanas",
      "focus": "Validación y fundamentos",
      "resources": ["resource_1", "resource_2"],
      "outcome": "Listo para hacer customer discovery y entender métricas básicas"
    },
    "phase_2_building": {
      "duration": "1-3 meses",
      "focus": "Construcción y lanzamiento",
      "resources": ["resource_3", "resource_4"],
      "outcome": "MVP listo, primeros customers"
    },
    "phase_3_growth": {
      "duration": "3-6 meses",
      "focus": "Escalar y optimizar",
      "resources": ["resource_5", "resource_6"],
      "outcome": "Growth systems en lugar"
    }
  },

  "skills_you_already_have": [
    {
      "skill": "skill_name",
      "why_valuable": "Cómo esto te ayuda en tu negocio"
    }
  ],

  "recommended_mentors": [
    {
      "name": "Tipo de mentor que necesitas",
      "why": "Qué pueden enseñarte",
      "where_to_find": "YC Startup School, LinkedIn, eventos locales"
    }
  ],

  "common_mistakes_to_avoid": [
    "Mistake que founders en tu situación cometen",
    "Otro mistake"
  ]
}

EJEMPLOS BUENOS:
✅ "The Mom Test (book, 4h) - CRITICAL. Léelo antes de hacer customer interviews. Evitarás validar una idea que nadie quiere."

✅ "Traction by Gabriel Weinberg (book, 6h) - HIGH. Tienes background técnico pero no sabes marketing. Este libro te da framework para elegir canales."

EJEMPLOS MALOS:
❌ "Lee sobre negocios" (muy genérico)
❌ "Curso de Python" (si ya sabe programar)
❌ "Stanford MBA" (no realista, muy largo)

Sé ESPECÍFICO, PRÁCTICO y PRIORIZADO.
Devuelve SOLO el JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 5000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse learning path response');
  }

  return JSON.parse(jsonMatch[0]);
}
