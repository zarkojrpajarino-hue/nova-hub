import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Projects start with no roles assigned - roles come after onboarding
const PROJECTS = [
  { nombre: 'Payo Sushi', icon: '🍣', color: '#EF4444', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Experea', icon: '🎓', color: '#22C55E', fase: 'crecimiento', tipo: 'operacion' },
  { nombre: 'Apadrina tu Olivo', icon: '🫒', color: '#84CC16', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Experiencia Selecta', icon: '💎', color: '#A855F7', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Web y SaaS', icon: '💻', color: '#6366F1', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Souvenirs Online', icon: '🎁', color: '#F59E0B', fase: 'idea', tipo: 'validacion' },
  { nombre: 'Academia Financiera', icon: '📊', color: '#06B6D4', fase: 'idea', tipo: 'validacion' },
]

// Members are added to projects but WITHOUT roles - roles assigned by AI after onboarding
// Zarko only participates in Payo Sushi and Experiencia Selecta
const PROJECT_MEMBERS = [
  { project: 'Payo Sushi', members: [
    { email: 'manuel@nova.com' },
    { email: 'zarko@nova.com' }, // Zarko - will get ai_tech
    { email: 'diego@nova.com' },
  ]},
  { project: 'Experea', members: [
    { email: 'fernandos@nova.com' },
    { email: 'angel@nova.com' },
    { email: 'fernandog@nova.com' },
  ]},
  { project: 'Apadrina tu Olivo', members: [
    { email: 'fernandos@nova.com' },
    { email: 'miguelangel@nova.com' },
    { email: 'carla@nova.com' },
  ]},
  { project: 'Experiencia Selecta', members: [
    { email: 'luis@nova.com' },
    { email: 'angel@nova.com' },
    { email: 'zarko@nova.com' }, // Zarko - will get ai_tech
  ]},
  { project: 'Web y SaaS', members: [
    { email: 'fernandog@nova.com' },
    { email: 'carla@nova.com' },
    { email: 'miguel@nova.com' },
  ]},
  { project: 'Souvenirs Online', members: [
    { email: 'diego@nova.com' },
    { email: 'angel@nova.com' },
    { email: 'manuel@nova.com' },
  ]},
  { project: 'Academia Financiera', members: [
    { email: 'fernandog@nova.com' },
    { email: 'luis@nova.com' },
    { email: 'miguelangel@nova.com' },
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

    const profileByEmail = new Map(profiles?.map(p => [p.email.toLowerCase(), p.id]) || [])

    // Create projects (all start with onboarding_completed = false)
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
          onboarding_completed: false, // Always start with onboarding pending
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

    // Add members to projects WITHOUT roles (roles assigned after onboarding)
    for (const pm of PROJECT_MEMBERS) {
      const projectId = projectByName.get(pm.project)
      if (!projectId) continue

      for (const member of pm.members) {
        const memberId = profileByEmail.get(member.email.toLowerCase())
        if (!memberId) {
          results.members.push({ project: pm.project, email: member.email, status: 'profile not found' })
          continue
        }

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

        // Insert member with placeholder role - will be assigned by AI
        const { error } = await supabaseAdmin
          .from('project_members')
          .insert({
            project_id: projectId,
            member_id: memberId,
            role: 'strategy', // Placeholder, will be assigned by AI after onboarding
            is_lead: false,
            role_accepted: false,
          })

        if (error) {
          results.members.push({ project: pm.project, email: member.email, status: 'error', error: error.message })
        } else {
          results.members.push({ project: pm.project, email: member.email, status: 'added (pending role assignment)' })
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
