import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  // 1. Check if the requester is an admin
  const authHeader = req.headers.get('Authorization')!
  const client = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
  const { data: { user }, error: authError } = await client.auth.getUser(authHeader.replace('Bearer ', ''))
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role, location_id').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Only admins can create officers' }), { status: 403 })
  }

  // 2. Parse request body
  const { email, password, name, role } = await req.json()

  // 3. Create the user in auth.users
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      name, 
      role: role || 'officer', 
      location_id: profile.location_id 
    }
  })

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ user: newUser.user }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
