/**
 * GENERATE LEARNING PATH - Edge Function
 *
 * Genera un learning path personalizado usando IA basado en:
 * - Skills actuales del usuario
 * - Objetivo de carrera (target role)
 * - Skill gaps identificados
 *
 * Input:
 * - user_id: UUID del usuario
 * - target_role: Rol objetivo (ej: "Senior Developer", "Tech Lead")
 * - focus_areas: Array de categorias de skills (opcional)
 *
 * Output:
 * - learning_path_id: ID del learning path creado
 * - steps: Array de pasos generados
 * - estimated_duration_weeks: Duracion estimada
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuthWithUserId } from '../_shared/auth.ts';

interface LearningPathStep {
  step_order: number;
  title: string;
  description: string;
  skill_name?: string;
  resource_type: string;
  resource_url?: string;
  estimated_hours: number;
}

interface SkillGap {
  skill_name: string;
  gap: number;
  current_level?: number;
  target_level?: number;
  category?: string;
}

interface RoleTemplate {
  duration: number;
  skills?: string[];
  steps: Array<{
    title: string;
    description: string;
    resource_type: string;
    resource_url?: string;
    estimated_hours: number;
  }>;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const { user_id, target_role, focus_areas } = await req.json();

    if (!user_id || !target_role) {
      throw new Error('user_id and target_role are required');
    }

    // Initialize Supabase client
        const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    // 1. Obtener skill gaps del usuario
    const { data: skillGaps } = await supabaseClient.rpc('get_skill_gaps', {
      p_user_id: user_id,
    });

    // 2. Obtener todas las skills del usuario
    const { data: _userSkills } = await supabaseClient
      .from('user_skills')
      .select('*, skills(*)')
      .eq('user_id', user_id);

    // 3. Generar learning path con IA
    const learningPath = generateLearningPath(
      target_role,
      (skillGaps as SkillGap[]) || [],
      focus_areas
    );

    // 4. Crear el learning path en la base de datos
    const { data: createdPath, error: pathError } = await supabaseClient
      .from('learning_paths')
      .insert({
        user_id,
        title: learningPath.title,
        description: learningPath.description,
        goal: learningPath.goal,
        target_role,
        estimated_duration_weeks: learningPath.estimated_duration_weeks,
        ai_generated: true,
        metadata: {
          focus_areas,
          skill_gaps_analyzed: skillGaps?.length || 0,
        },
      })
      .select()
      .single();

    if (pathError || !createdPath) {
      throw new Error('Failed to create learning path');
    }

    // 5. Crear los steps del learning path
    const stepsToInsert = learningPath.steps.map((step) => ({
      learning_path_id: createdPath.id,
      step_order: step.step_order,
      title: step.title,
      description: step.description,
      resource_type: step.resource_type,
      resource_url: step.resource_url,
      estimated_hours: step.estimated_hours,
      status: 'not_started',
    }));

    const { data: createdSteps, error: stepsError } = await supabaseClient
      .from('learning_path_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) {
      console.error('Error creating steps:', stepsError);
    }

    return new Response(
      JSON.stringify({
        learning_path_id: createdPath.id,
        learning_path: createdPath,
        steps: createdSteps,
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error generating learning path:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});

function generateLearningPath(
  targetRole: string,
  skillGaps: SkillGap[],
  _focusAreas?: string[]
): {
  title: string;
  description: string;
  goal: string;
  estimated_duration_weeks: number;
  steps: LearningPathStep[];
} {
  // Analizar el rol objetivo y generar path personalizado
  const roleTemplates: Record<string, RoleTemplate> = {
    'Senior Developer': {
      duration: 24,
      skills: ['API Design', 'Cloud (AWS/GCP/Azure)', 'DevOps/CI/CD', 'Mentoring'],
      steps: [
        {
          title: 'Master Advanced TypeScript Patterns',
          description: 'Dominar patrones avanzados de TypeScript: generics, utility types, decorators',
          resource_type: 'course',
          estimated_hours: 40,
        },
        {
          title: 'System Design Fundamentals',
          description: 'Aprender a disenar sistemas escalables y resilientes',
          resource_type: 'course',
          estimated_hours: 50,
        },
        {
          title: 'Build a Production-Ready API',
          description: 'Crear una API completa con autenticacion, rate limiting, y documentacion',
          resource_type: 'project',
          estimated_hours: 80,
        },
        {
          title: 'CI/CD Pipeline Setup',
          description: 'Configurar pipeline completo de CI/CD con tests automatizados',
          resource_type: 'practice',
          estimated_hours: 30,
        },
        {
          title: 'Code Review Best Practices',
          description: 'Aprender a dar code reviews constructivos y efectivos',
          resource_type: 'mentorship',
          estimated_hours: 20,
        },
      ],
    },
    'Tech Lead': {
      duration: 32,
      skills: ['Team Management', 'Strategic Thinking', 'Mentoring', 'Decision Making'],
      steps: [
        {
          title: 'Leadership Fundamentals',
          description: 'Fundamentos de liderazgo tecnico y gestion de equipos',
          resource_type: 'course',
          estimated_hours: 40,
        },
        {
          title: 'Technical Decision Making',
          description: 'Framework para tomar decisiones tecnicas efectivas',
          resource_type: 'book',
          estimated_hours: 30,
        },
        {
          title: 'Lead a Small Project',
          description: 'Liderar un proyecto pequeno de principio a fin',
          resource_type: 'project',
          estimated_hours: 120,
        },
        {
          title: '1:1s and Team Communication',
          description: 'Aprender a hacer 1:1s efectivos y comunicacion de equipo',
          resource_type: 'mentorship',
          estimated_hours: 25,
        },
        {
          title: 'Conflict Resolution Workshop',
          description: 'Tecnicas para resolver conflictos en equipos tecnicos',
          resource_type: 'course',
          estimated_hours: 20,
        },
      ],
    },
    'Product Manager': {
      duration: 28,
      skills: ['Product Strategy', 'Written Communication', 'Strategic Thinking'],
      steps: [
        {
          title: 'Product Management Foundations',
          description: 'Fundamentos de product management: discovery, delivery, strategy',
          resource_type: 'course',
          estimated_hours: 50,
        },
        {
          title: 'User Research & Interviews',
          description: 'Aprender a hacer research efectivo y user interviews',
          resource_type: 'practice',
          estimated_hours: 40,
        },
        {
          title: 'Build a Product Roadmap',
          description: 'Crear un roadmap de producto con OKRs y metricas',
          resource_type: 'project',
          estimated_hours: 60,
        },
        {
          title: 'Data-Driven Decision Making',
          description: 'Usar analytics y datos para tomar decisiones de producto',
          resource_type: 'course',
          estimated_hours: 35,
        },
        {
          title: 'Stakeholder Management',
          description: 'Gestionar stakeholders y comunicar vision de producto',
          resource_type: 'mentorship',
          estimated_hours: 30,
        },
      ],
    },
  };

  // Usar template o crear generico
  const template = roleTemplates[targetRole] || {
    duration: 20,
    steps: generateGenericSteps(skillGaps, targetRole),
  };

  // Map steps con index
  let steps: LearningPathStep[] = template.steps.map((step, index: number) => ({
    step_order: index + 1,
    title: step.title,
    description: step.description,
    resource_type: step.resource_type,
    resource_url: step.resource_url,
    estimated_hours: step.estimated_hours,
  }));

  // Si hay skill gaps especificos, anadir steps para cerrarlos
  if (skillGaps && skillGaps.length > 0) {
    const gapSteps: LearningPathStep[] = skillGaps.slice(0, 3).map((gap: SkillGap, index: number) => ({
      step_order: steps.length + index + 1,
      title: `Improve ${gap.skill_name}`,
      description: `Cerrar gap de ${gap.gap} niveles en ${gap.skill_name}`,
      skill_name: gap.skill_name,
      resource_type: 'practice',
      estimated_hours: gap.gap * 20,
    }));

    steps = [...steps, ...gapSteps];
  }

  const totalHours = steps.reduce((sum: number, step: LearningPathStep) => sum + step.estimated_hours, 0);
  const estimatedWeeks = Math.ceil(totalHours / 10); // Asumiendo 10h/semana

  return {
    title: `Path to ${targetRole}`,
    description: `Learning path personalizado para convertirte en ${targetRole}`,
    goal: `Alcanzar el rol de ${targetRole} desarrollando skills clave`,
    estimated_duration_weeks: estimatedWeeks,
    steps,
  };
}

function generateGenericSteps(skillGaps: SkillGap[], targetRole: string): LearningPathStep[] {
  if (!skillGaps || skillGaps.length === 0) {
    return [
      {
        step_order: 1,
        title: `Explore ${targetRole} Requirements`,
        description: 'Investigar que skills y experiencia se requieren para este rol',
        resource_type: 'practice',
        estimated_hours: 10,
      },
      {
        step_order: 2,
        title: 'Skill Assessment',
        description: 'Evaluar tus skills actuales vs. requerimientos del rol',
        resource_type: 'practice',
        estimated_hours: 5,
      },
      {
        step_order: 3,
        title: 'Create Custom Development Plan',
        description: 'Crear plan personalizado basado en el assessment',
        resource_type: 'project',
        estimated_hours: 15,
      },
    ];
  }

  return skillGaps.slice(0, 5).map((gap: SkillGap, index: number) => ({
    step_order: index + 1,
    title: `Develop ${gap.skill_name}`,
    description: `Mejorar ${gap.skill_name} desde nivel ${gap.current_level} a nivel ${gap.target_level}`,
    skill_name: gap.skill_name,
    resource_type: gap.category === 'technical' ? 'course' : 'practice',
    estimated_hours: gap.gap * 15,
  }));
}
