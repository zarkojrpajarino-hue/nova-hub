import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Available roles
const AVAILABLE_ROLES = ['sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy'] as const

interface MemberRoleHistory {
  member_id: string
  email: string
  nombre: string
  current_roles: { project_id: string; project_name: string; role: string }[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { project_id, onboarding_data } = await req.json()

    if (!project_id) {
      throw new Error('project_id is required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, nombre, tipo, onboarding_data')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      throw new Error('Project not found')
    }

    // Get project members (just member_ids, not roles yet)
    const { data: projectMembers, error: membersError } = await supabaseAdmin
      .from('project_members')
      .select('id, member_id')
      .eq('project_id', project_id)

    if (membersError) throw membersError

    if (!projectMembers || projectMembers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No members in project' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get profiles for these members
    const memberIds = projectMembers.map(pm => pm.member_id)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, nombre')
      .in('id', memberIds)

    if (profilesError) throw profilesError

    // Get all current role assignments for these members (across all projects)
    const { data: allRoleAssignments, error: rolesError } = await supabaseAdmin
      .from('project_members')
      .select(`
        member_id,
        role,
        project_id,
        projects!inner(nombre)
      `)
      .in('member_id', memberIds)
      .neq('project_id', project_id) // Exclude current project

    if (rolesError) throw rolesError

    // Build member history
    const memberHistory: MemberRoleHistory[] = profiles?.map(profile => ({
      member_id: profile.id,
      email: profile.email,
      nombre: profile.nombre,
      current_roles: (allRoleAssignments || [])
        .filter(ra => ra.member_id === profile.id)
        .map(ra => ({
          project_id: ra.project_id,
          project_name: (ra.projects as any)?.nombre || 'Unknown',
          role: ra.role,
        })),
    })) || []

    // Check for Zarko - always gets ai_tech role
    const zarkoMember = memberHistory.find(m => 
      m.email.toLowerCase().includes('zarko') || 
      m.nombre.toLowerCase().includes('zarko')
    )

    // Generate optimal role assignments
    const assignments = generateOptimalAssignments(memberHistory, project.nombre, zarkoMember?.member_id)

    // Update project_members with assigned roles
    const updatePromises = assignments.map(async (assignment) => {
      const pm = projectMembers.find(p => p.member_id === assignment.member_id)
      if (!pm) return null

      const { error } = await supabaseAdmin
        .from('project_members')
        .update({ 
          role: assignment.role,
          role_accepted: false,
          role_responsibilities: assignment.responsibilities,
        })
        .eq('id', pm.id)

      return { member_id: assignment.member_id, role: assignment.role, error: error?.message }
    })

    const results = await Promise.all(updatePromises)

    // Update project status to indicate roles are pending
    await supabaseAdmin
      .from('projects')
      .update({ 
        onboarding_completed: true,
        onboarding_data: onboarding_data || project.onboarding_data,
      })
      .eq('id', project_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        assignments: results.filter(Boolean),
        message: 'Roles assigned. Waiting for member acceptance.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Generate roles error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateOptimalAssignments(
  members: MemberRoleHistory[],
  projectName: string,
  zarkoId?: string
): { member_id: string; role: string; responsibilities: string[] }[] {
  const assignments: { member_id: string; role: string; responsibilities: string[] }[] = []
  const usedRoles = new Set<string>()

  // If Zarko is in the project, he always gets ai_tech
  if (zarkoId) {
    const zarko = members.find(m => m.member_id === zarkoId)
    if (zarko) {
      assignments.push({
        member_id: zarkoId,
        role: 'ai_tech',
        responsibilities: [
          'Implementar herramientas de IA para el proyecto',
          'Automatizar procesos repetitivos',
          'Desarrollar soluciones técnicas',
          'Integrar tecnología en la propuesta de valor',
        ],
      })
      usedRoles.add('ai_tech')
    }
  }

  // For remaining members, assign roles they haven't done before
  const remainingMembers = members.filter(m => m.member_id !== zarkoId)
  
  for (const member of remainingMembers) {
    // Get roles this member already has in other projects
    const memberExistingRoles = new Set(member.current_roles.map(r => r.role))
    
    // Find a role they haven't done yet
    let assignedRole: string | null = null
    
    // First try: roles they've never done
    for (const role of AVAILABLE_ROLES) {
      if (!usedRoles.has(role) && !memberExistingRoles.has(role)) {
        assignedRole = role
        break
      }
    }
    
    // Second try: any available role
    if (!assignedRole) {
      for (const role of AVAILABLE_ROLES) {
        if (!usedRoles.has(role)) {
          assignedRole = role
          break
        }
      }
    }
    
    // Fallback: cycle through roles
    if (!assignedRole) {
      assignedRole = AVAILABLE_ROLES[assignments.length % AVAILABLE_ROLES.length]
    }

    usedRoles.add(assignedRole)
    
    assignments.push({
      member_id: member.member_id,
      role: assignedRole,
      responsibilities: getRoleResponsibilities(assignedRole, projectName),
    })
  }

  return assignments
}

function getRoleResponsibilities(role: string, projectName: string): string[] {
  const baseResponsibilities: Record<string, string[]> = {
    sales: [
      `Identificar y contactar clientes potenciales para ${projectName}`,
      'Gestionar el pipeline de ventas',
      'Cerrar deals y negociar contratos',
      'Mantener relación con clientes actuales',
    ],
    finance: [
      `Controlar presupuesto y gastos de ${projectName}`,
      'Definir pricing y estrategia de precios',
      'Analizar márgenes y rentabilidad',
      'Gestionar facturación y cobros',
    ],
    ai_tech: [
      `Implementar soluciones tecnológicas para ${projectName}`,
      'Automatizar procesos con IA',
      'Desarrollar y mantener herramientas digitales',
      'Investigar nuevas tecnologías aplicables',
    ],
    marketing: [
      `Crear contenido y gestionar redes de ${projectName}`,
      'Diseñar campañas de marketing',
      'Construir y posicionar la marca',
      'Analizar métricas de engagement',
    ],
    operations: [
      `Gestionar la ejecución diaria de ${projectName}`,
      'Optimizar procesos y flujos de trabajo',
      'Coordinar entregas y calidad',
      'Gestionar proveedores y recursos',
    ],
    strategy: [
      `Definir visión y roadmap de ${projectName}`,
      'Tomar decisiones estratégicas clave',
      'Analizar mercado y competencia',
      'Liderar sesiones de planificación',
    ],
  }

  return baseResponsibilities[role] || ['Contribuir al éxito del proyecto']
}
