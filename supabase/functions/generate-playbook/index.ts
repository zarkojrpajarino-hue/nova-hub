import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { PlaybookRequestSchema, validateRequestSafe } from '../_shared/validation-schemas.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
    
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user token and get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await authSupabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const authUserId = claims.claims.sub;

    // Rate limiting - AI generation is expensive
    const rateLimitResult = await checkRateLimit(
      authUserId,
      'generate-playbook',
      RateLimitPresets.AI_GENERATION
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = await validateRequestSafe(PlaybookRequestSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const { userId, roleName } = validation.data;

    // Use service role for data operations

    // Verify the requesting user matches the target user or is authorized
    const { data: requestingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', authUserId)
      .single();

    if (!requestingProfile || requestingProfile.id !== userId) {
      // Check if user is admin (optional additional authorization)
      const { data: isAdmin } = await supabase.rpc('has_role', { 
        user_id: requestingProfile?.id, 
        required_role: 'admin' 
      });
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized to generate playbook for this user' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        );
      }
    }

    // Get user performance data
    const { data: performance, error: perfError } = await supabase
      .from('user_role_performance')
      .select('*')
      .eq('user_id', userId)
      .eq('role_name', roleName)
      .maybeSingle();

    if (perfError) {
      console.error('Error fetching performance');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre, especialization')
      .eq('id', userId)
      .single();

    // Get user's recent insights for context
    const { data: insights } = await supabase
      .from('user_insights')
      .select('titulo, tipo, contenido')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Build context for AI (sanitized)
    const context = {
      userName: String(profile?.nombre || 'Usuario').slice(0, 100),
      roleName: roleName.toLowerCase(),
      specialization: profile?.especialization,
      performance: performance || {
        task_completion_rate: 0,
        validated_obvs: 0,
        lead_conversion_rate: 0,
      },
      recentInsights: (insights || []).slice(0, 5).map(i => ({
        tipo: String(i.tipo || '').slice(0, 50),
        titulo: String(i.titulo || '').slice(0, 200)
      })),
    };

    // Call Claude API
    const anthropicApiKey = requireEnv('ANTHROPIC_API_KEY');

    const systemPrompt = `Eres un coach de desarrollo profesional para startups. Genera playbooks personalizados en español.

El playbook debe ser práctico, accionable y específico para el rol indicado.
Responde SOLO con JSON válido, sin markdown ni texto adicional.`;

    const userPrompt = `Genera un playbook personalizado para ${context.userName} en el rol de "${context.roleName}".

Datos de rendimiento:
- Tasa de completitud de tareas: ${context.performance.task_completion_rate}%
- OBVs validadas: ${context.performance.validated_obvs}
- Tasa de conversión de leads: ${context.performance.lead_conversion_rate}%
- Especialización: ${context.specialization || 'No definida'}

Insights recientes del usuario:
${context.recentInsights.map(i => `- [${i.tipo}] ${i.titulo}`).join('\n') || 'Sin insights registrados'}

Responde con este JSON exacto:
{
  "sections": [
    {
      "title": "Responsabilidades Clave",
      "content": "Descripción de las responsabilidades principales del rol",
      "tips": ["Tip 1", "Tip 2"]
    },
    {
      "title": "Mejores Prácticas",
      "content": "Prácticas recomendadas basadas en el rendimiento actual",
      "tips": ["Práctica 1", "Práctica 2"]
    },
    {
      "title": "Desarrollo de Habilidades",
      "content": "Áreas de desarrollo prioritarias",
      "tips": ["Habilidad 1", "Habilidad 2"]
    }
  ],
  "fortalezas": ["Fortaleza 1", "Fortaleza 2"],
  "areas_mejora": ["Área 1", "Área 2"],
  "objetivos_sugeridos": [
    {
      "objetivo": "Objetivo específico",
      "plazo": "2 semanas",
      "metricas": ["Métrica 1", "Métrica 2"]
    }
  ]
}`;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', aiResponse.status);
      return new Response(
        JSON.stringify({ error: 'Unable to generate playbook at this time' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.content?.[0]?.text;
    
    // Parse AI response
    let playbookContent;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedContent = aiContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      playbookContent = JSON.parse(cleanedContent);
    } catch (_parseError) {
          if (error instanceof Response) return error;
console.error('Failed to parse AI response');
      // Fallback content
      playbookContent = {
        sections: [
          {
            title: 'Responsabilidades del Rol',
            content: `Como ${roleName}, tu función principal es contribuir al éxito del equipo a través de tus habilidades y compromiso.`,
            tips: ['Mantén comunicación constante con tu equipo', 'Documenta tu trabajo regularmente']
          }
        ],
        fortalezas: ['Compromiso', 'Trabajo en equipo'],
        areas_mejora: ['Completar más tareas', 'Registrar más OBVs'],
        objetivos_sugeridos: [
          {
            objetivo: 'Mejorar tasa de completitud de tareas',
            plazo: '1 mes',
            metricas: ['Completar 80% de tareas asignadas']
          }
        ]
      };
    }

    // Get current version
    const { data: existingPlaybook } = await supabase
      .from('user_playbooks')
      .select('version')
      .eq('user_id', userId)
      .eq('role_name', roleName)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = (existingPlaybook?.version || 0) + 1;

    // Deactivate previous playbooks
    await supabase
      .from('user_playbooks')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('role_name', roleName);

    // Insert new playbook
    const { data: newPlaybook, error: insertError } = await supabase
      .from('user_playbooks')
      .insert({
        user_id: userId,
        role_name: roleName,
        version: newVersion,
        contenido: { sections: playbookContent.sections },
        fortalezas: playbookContent.fortalezas || [],
        areas_mejora: playbookContent.areas_mejora || [],
        objetivos_sugeridos: playbookContent.objetivos_sugeridos || [],
        ai_model: 'claude-3-5-sonnet-20241022',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting playbook');
      return new Response(
        JSON.stringify({ error: 'Failed to save playbook' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, playbook: newPlaybook }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );

  } catch (error: unknown) {
        if (error instanceof Response) return error;
console.error('Error in generate-playbook:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate playbook at this time' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
