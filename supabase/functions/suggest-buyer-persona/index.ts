/**
 * SUGGEST BUYER PERSONA - Edge Function
 *
 * Genera sugerencias de buyer personas basadas en la idea de negocio
 *
 * Input:
 * - idea: Descripción de la idea de negocio
 * - industry (opcional): Industria/sector
 * - problemStatement (opcional): Problema que resuelve
 *
 * Output:
 * - suggestions: Array de 3-5 buyer personas específicos y accionables
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface RequestBody {
  idea: string;
  industry?: string;
  problemStatement?: string;
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const { idea, industry, problemStatement }: RequestBody = await req.json();

    if (!idea || idea.trim().length < 10) {
      throw new Error('idea is required and must be at least 10 characters');
    }

    console.log('Generating buyer persona suggestions for:', idea.substring(0, 50));

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const prompt = `Eres un experto en marketing B2B/B2C con especialización en buyer personas. Tu objetivo: crear perfiles que el emprendedor pueda usar INMEDIATAMENTE para outreach, ads y product development.

IDEA DE NEGOCIO:
${idea}

${industry ? `INDUSTRIA: ${industry}` : ''}
${problemStatement ? `PROBLEMA QUE RESUELVE: ${problemStatement}` : ''}

OBJETIVO:
Genera 3-5 buyer personas ULTRA ESPECÍFICOS que:
1. Sean diferentes entre sí (cubrir todo el TAM)
2. Tengan pain points CLAROS y cuantificables
3. El emprendedor pueda encontrarlos fácilmente (LinkedIn, Reddit, etc.)

FORMATO DE CADA BUYER PERSONA:
[Edad] + [Rol específico] + [Contexto/situación] + [Pain point concreto]

EJEMPLOS DE BUYER PERSONAS EXCELENTES:
✅ "Product Managers de 28-38 años en startups Series A-B que pierden 10h/semana en hacer roadmaps en Excel porque Jira es demasiado complejo para su equipo de 5 personas"

✅ "Profesores universitarios de 35-55 años que enseñan a +100 alumnos y dedican 15h/semana a revisar tareas manualmente porque los LMS actuales no tienen IA"

✅ "Freelancers de diseño de 24-32 años con 3-7 clientes simultáneos que pierden clientes por no responder emails rápido al estar en múltiples plataformas (Upwork, Dribbble, email)"

EJEMPLOS DE BUYER PERSONAS MALOS (NO HACER):
❌ "Emprendedores que buscan crecer" → Demasiado genérico
❌ "Pequeñas empresas de 1-50 empleados" → No tiene pain point claro
❌ "Jóvenes interesados en tecnología" → No accionable

CRITERIOS DE CALIDAD:
- Incluye datos numéricos cuando sea relevante (horas perdidas, tamaño de equipo, presupuesto)
- El pain point debe ser algo que les DUELE (pierden dinero, tiempo, o clientes)
- Debe quedar claro DÓNDE encontrar a estas personas

Devuelve un JSON con este formato:
{
  "suggestions": [
    "Buyer persona 1 específico y detallado",
    "Buyer persona 2 específico y detallado",
    "Buyer persona 3 específico y detallado",
    "Buyer persona 4 específico y detallado (opcional)",
    "Buyer persona 5 específico y detallado (opcional)"
  ]
}

Devuelve SOLO el JSON, sin markdown.`;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.8, // Slightly higher for creativity
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.content[0].text;

    // Parse response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let result: { suggestions: string[] };

    try {
      result = JSON.parse(cleanContent);

      // Validate that we have at least 3 suggestions
      if (!result.suggestions || result.suggestions.length < 3) {
        throw new Error('AI returned less than 3 buyer personas');
      }

    } catch (e) {
      console.error('Parse error:', e);
      console.error('Raw content:', content);

      // Fallback: extract suggestions from text
      const lines = content.split('\n').filter(line => line.trim().length > 20);
      result = {
        suggestions: lines.slice(0, 5),
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating buyer persona suggestions:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
