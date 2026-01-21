import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOVA_USERS = [
  { email: 'zarko@nova.com', password: 'Zarko2026!', nombre: 'ZARKO', color: '#8B5CF6' },
  { email: 'fernandos@nova.com', password: 'FernandoS2026!', nombre: 'FERNANDO S', color: '#10B981' },
  { email: 'angel@nova.com', password: 'Angel2026!', nombre: 'ÁNGEL', color: '#F59E0B' },
  { email: 'miguelangel@nova.com', password: 'MiguelAngel2026!', nombre: 'MIGUEL ÁNGEL', color: '#3B82F6' },
  { email: 'manuel@nova.com', password: 'Manuel2026!', nombre: 'MANUEL', color: '#EC4899' },
  { email: 'fernandog@nova.com', password: 'FernandoG2026!', nombre: 'FERNANDO G', color: '#EF4444' },
  { email: 'carla@nova.com', password: 'Carla2026!', nombre: 'CARLA', color: '#F472B6' },
  { email: 'diego@nova.com', password: 'Diego2026!', nombre: 'DIEGO', color: '#84CC16' },
  { email: 'luis@nova.com', password: 'Luis2026!', nombre: 'LUIS', color: '#06B6D4' },
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

    const results = []

    for (const user of NOVA_USERS) {
      // Create user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { nombre: user.nombre }
      })

      if (authError) {
        // User might already exist
        if (authError.message.includes('already been registered')) {
          results.push({ email: user.email, status: 'already exists' })
        } else {
          results.push({ email: user.email, status: 'error', error: authError.message })
        }
        continue
      }

      // Update the profile with the correct color
      if (authData.user) {
        await supabaseAdmin
          .from('profiles')
          .update({ color: user.color })
          .eq('auth_id', authData.user.id)
      }

      results.push({ email: user.email, status: 'created' })
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
