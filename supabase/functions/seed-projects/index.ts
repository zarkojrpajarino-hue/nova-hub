import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROJECTS = [
  { nombre: 'Payo Sushi', icon: '🍣', color: '#EF4444', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Experea', icon: '🎓', color: '#22C55E', fase: 'crecimiento', tipo: 'operacion' },
  { nombre: 'Apadrina tu Olivo', icon: '🫒', color: '#84CC16', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Experiencia Selecta', icon: '💎', color: '#A855F7', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Web y SaaS', icon: '💻', color: '#6366F1', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Souvenirs Online', icon: '🎁', color: '#F59E0B', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Academia Financiera', icon: '📊', color: '#06B6D4', fase: 'idea', tipo: 'validacion' },
]

// Map project -> members with roles (using emails to find profile IDs)
const PROJECT_MEMBERS = [
  { project: 'Payo Sushi', members: [
    { email: 'manuel@nova.com', role: 'operations', is_lead: true },
    { email: 'zarko@nova.com', role: 'ai_tech', is_lead: false },
    { email: 'diego@nova.com', role: 'marketing', is_lead: false },
  ]},
  { project: 'Experea', members: [
    { email: 'fernandos@nova.com', role: 'sales', is_lead: true },
    { email: 'angel@nova.com', role: 'marketing', is_lead: false },
    { email: 'fernandog@nova.com', role: 'operations', is_lead: false },
  ]},
  { project: 'Apadrina tu Olivo', members: [
    { email: 'fernandos@nova.com', role: 'operations', is_lead: true },
    { email: 'miguelangel@nova.com', role: 'strategy', is_lead: false },
    { email: 'carla@nova.com', role: 'sales', is_lead: false },
  ]},
  { project: 'Experiencia Selecta', members: [
    { email: 'luis@nova.com', role: 'finance', is_lead: true },
    { email: 'angel@nova.com', role: 'strategy', is_lead: false },
    { email: 'zarko@nova.com', role: 'ai_tech', is_lead: false },
  ]},
  { project: 'Web y SaaS', members: [
    { email: 'zarko@nova.com', role: 'ai_tech', is_lead: true },
    { email: 'fernandog@nova.com', role: 'strategy', is_lead: false },
    { email: 'carla@nova.com', role: 'marketing', is_lead: false },
  ]},
  { project: 'Souvenirs Online', members: [
    { email: 'diego@nova.com', role: 'operations', is_lead: true },
    { email: 'angel@nova.com', role: 'finance', is_lead: false },
    { email: 'manuel@nova.com', role: 'sales', is_lead: false },
  ]},
  { project: 'Academia Financiera', members: [
    { email: 'fernandog@nova.com', role: 'finance', is_lead: true },
    { email: 'luis@nova.com', role: 'sales', is_lead: false },
    { email: 'miguelangel@nova.com', role: 'marketing', is_lead: false },
  ]},
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const results = { projects: [] as any[], members: [] as any[] }

    // Get all profiles first
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
    
    if (profilesError) throw profilesError

    const profileByEmail = new Map(profiles?.map(p => [p.email, p.id]) || [])

    // Create projects
    for (const project of PROJECTS) {
      const { data: existingProject } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('nombre', project.nombre)
        .single()

      if (existingProject) {
        results.projects.push({ nombre: project.nombre, status: 'already exists', id: existingProject.id })
        continue
      }

      const { data: newProject, error } = await supabaseAdmin
        .from('projects')
        .insert({
          nombre: project.nombre,
          icon: project.icon,
          color: project.color,
          fase: project.fase,
          tipo: project.tipo,
          onboarding_completed: project.nombre === 'Payo Sushi',
        })
        .select('id')
        .single()

      if (error) {
        results.projects.push({ nombre: project.nombre, status: 'error', error: error.message })
      } else {
        results.projects.push({ nombre: project.nombre, status: 'created', id: newProject.id })
      }
    }

    // Get all projects with IDs
    const { data: allProjects } = await supabaseAdmin
      .from('projects')
      .select('id, nombre')

    const projectByName = new Map(allProjects?.map(p => [p.nombre, p.id]) || [])

    // Add members to projects
    for (const pm of PROJECT_MEMBERS) {
      const projectId = projectByName.get(pm.project)
      if (!projectId) continue

      for (const member of pm.members) {
        const memberId = profileByEmail.get(member.email)
        if (!memberId) continue

        // Check if already exists
        const { data: existing } = await supabaseAdmin
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('member_id', memberId)
          .single()

        if (existing) {
          results.members.push({ project: pm.project, email: member.email, status: 'already exists' })
          continue
        }

        const { error } = await supabaseAdmin
          .from('project_members')
          .insert({
            project_id: projectId,
            member_id: memberId,
            role: member.role,
            is_lead: member.is_lead,
          })

        if (error) {
          results.members.push({ project: pm.project, email: member.email, status: 'error', error: error.message })
        } else {
          results.members.push({ project: pm.project, email: member.email, status: 'added' })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Seed projects error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
