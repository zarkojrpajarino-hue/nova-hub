/**
 * VALIDATE MONETIZATION - Edge Function
 *
 * Valida el modelo de monetización propuesto para una idea de negocio
 *
 * Input:
 * - model: Modelo de monetización (ej: "SaaS", "Marketplace", "E-commerce")
 * - idea: Descripción de la idea de negocio
 * - targetCustomer: Cliente objetivo
 *
 * Output:
 * - validation: Análisis de viabilidad del modelo
 *   - viability: "high" | "medium" | "low"
 *   - pros: Ventajas del modelo para esta idea
 *   - cons: Desventajas o riesgos
 *   - examples: Empresas similares que usan este modelo exitosamente
 *   - recommendations: Recomendaciones específicas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

interface RequestBody {
  model: string;
  idea: string;
  targetCustomer: string;
}

interface ValidationResult {
  viability: 'high' | 'medium' | 'low';
  pros: string[];
  cons: string[];
  examples: string[];
  recommendations: string[];
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS headers
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const { user } = await validateAuth(req);
    const rateLimitResult = await checkRateLimit(user.id, 'validate-monetization', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }
    const { model, idea, targetCustomer }: RequestBody = await req.json();

    if (!model || !idea) {
      throw new Error('model and idea are required');
    }

    console.log('Validating monetization model:', model);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const prompt = `Eres un consultor de estrategia de negocio especializado en monetización y pricing. Has ayudado a 50+ startups a optimizar su modelo de ingresos.

MODELO DE MONETIZACIÓN PROPUESTO:
${model}

IDEA DE NEGOCIO:
${idea}

CLIENTE OBJETIVO:
${targetCustomer || 'No especificado'}

CONTEXTO:
El emprendedor usará este análisis para decidir:
1. Si proceder con este modelo o cambiar
2. Cómo estructurar el pricing
3. Qué métricas trackear para validar

TU TAREA:
Analiza la viabilidad del modelo con visión 360°:

1. VIABILITY SCORE (high/medium/low):
   - "high": Modelo probado en mercado similar, bajo riesgo, implementación clara
   - "medium": Modelo viable pero requiere adaptación, riesgo moderado
   - "low": Modelo poco adecuado, alto riesgo de fracaso, considera alternativa

2. PROS (3 ventajas ESPECÍFICAS para ESTA idea):
   - NO genérico: "escalable" ❌
   - SÍ específico: "CAC 3x menor que competidores porque el modelo freemium genera virality orgánica" ✅
   - Incluye cifras/datos cuando sea posible

3. CONS (3 riesgos/desventajas REALES):
   - Sé brutalmente honesto
   - Incluye métricas: "Necesitas 300+ usuarios activos para break-even vs 50 con modelo premium"

4. EXAMPLES (3 empresas REALES del 2020-2026):
   - Nombre + breve contexto + resultado
   - Ejemplo: "Notion ($10B valuación): Freemium con plan gratuito generoso → 20M usuarios → 10% conversión a pago"
   - Prioriza empresas similares en industria/modelo

5. RECOMMENDATIONS (3-4 acciones CONCRETAS):
   ❌ NO: "Considera pricing dinámico"
   ✅ SÍ: "Implementa tier gratuito hasta 100 items, luego $19/mes (vs $49 competidores) para capturar early adopters"

CALIDAD ESPERADA:
- Cada pro/con debe tener impacto financiero claro
- Ejemplos deben ser verificables (empresas reales)
- Recomendaciones deben ser implementables en 1-2 semanas

FORMATO DE RESPUESTA (JSON):
{
  "viability": "high" | "medium" | "low",
  "pros": [
    "Pro específico 1 para ESTA idea",
    "Pro específico 2",
    "Pro específico 3"
  ],
  "cons": [
    "Con específico 1 o riesgo para ESTA idea",
    "Con específico 2",
    "Con específico 3"
  ],
  "examples": [
    "Empresa 1 similar que usa este modelo con éxito",
    "Empresa 2 similar",
    "Empresa 3 similar"
  ],
  "recommendations": [
    "Recomendación accionable 1 (ej: 'Considera añadir un tier gratuito para adquisición')",
    "Recomendación accionable 2",
    "Recomendación accionable 3"
  ]
}

CRITERIOS PARA VIABILITY:
- "high": Modelo muy adecuado, usado exitosamente por competidores similares
- "medium": Modelo puede funcionar pero requiere adaptaciones o tiene riesgos moderados
- "low": Modelo poco adecuado para este tipo de negocio, alto riesgo

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
        max_tokens: 2048,
        temperature: 0.5,
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
    let validation: ValidationResult;

    try {
      validation = JSON.parse(cleanContent);

      // Validate structure
      if (!validation.viability || !validation.pros || !validation.cons) {
        throw new Error('Invalid response structure');
      }

    } catch (e) {
          if (error instanceof Response) return error;
console.error('Parse error:', e);
      console.error('Raw content:', content);

      // Fallback response
      validation = {
        viability: 'medium',
        pros: ['El modelo es popular en la industria'],
        cons: ['Requiere análisis más detallado'],
        examples: [],
        recommendations: ['Investiga competidores con modelos similares'],
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        validation,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );

  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error validating monetization:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});
