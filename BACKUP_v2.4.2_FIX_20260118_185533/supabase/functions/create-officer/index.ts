import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No Authorization header found' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const client = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authError } = await client.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: profile } = await supabase.from('profiles').select('role, location_id').eq('id', user.id).maybeSingle()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && profile.role !== 'manager')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json();
    const { email, name, role, location_id, action } = body;

    // Handle "Send Email" action separately if requested
    if (action === 'send_email') {
      if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers: corsHeaders });
      
      // Get user to find their password
      const { data: userData } = await supabase.from('profiles').select('raw_password, full_name').eq('email', email).maybeSingle();
      
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { 
          name: userData?.full_name || 'Staff Member',
          temp_password: userData?.raw_password || 'Already Set'
        }
      });
      
      if (inviteError) return new Response(JSON.stringify({ error: inviteError.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ message: 'Email sent' }), { headers: corsHeaders });
    }

    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cleanup orphaned accounts
    const { data: existingAuth } = await supabase.auth.admin.listUsers();
    const existingUser = existingAuth?.users.find(u => u.email === email);
    if (existingUser) {
      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', existingUser.id).maybeSingle();
      if (!existingProfile) {
        await supabase.auth.admin.deleteUser(existingUser.id);
      } else {
        return new Response(JSON.stringify({ error: 'User already exists' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const permanentPassword = Math.random().toString(36).slice(-10) + 'A1!';
    let targetLocationId = location_id || profile.location_id;

    // Security check
    if (profile.role !== 'super_admin' && location_id) {
      if (profile.role === 'admin') {
        const { data: ownership } = await supabase.from('locations').select('id').eq('display_id', location_id).eq('owner_id', user.id).maybeSingle();
        if (!ownership) return new Response(JSON.stringify({ error: 'No permission' }), { status: 403, headers: corsHeaders });
      } else if (profile.role === 'manager') {
        const { data: assignment } = await supabase.from('officer_assignments').select('id').eq('location_id', location_id).eq('officer_id', user.id).maybeSingle();
        if (!assignment) return new Response(JSON.stringify({ error: 'No permission' }), { status: 403, headers: corsHeaders });
      }
    }

    // CREATE USER DIRECTLY (Instant Login, No Email)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: permanentPassword,
      email_confirm: true, // This makes them active immediately
      user_metadata: { 
        name, 
        role: role || 'officer', 
        location_id: targetLocationId,
        temp_password: permanentPassword 
      }
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User created successfully:', userData.user.id);

    // 4. Force update the profile with the raw password immediately
    // This acts as a backup to the trigger to ensure the password is never lost
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ raw_password: permanentPassword })
      .eq('id', userData.user.id);

    if (profileUpdateError) {
      console.warn('Manual Profile Password Update Warning:', profileUpdateError.message);
    }

    // 5. Create the officer assignment immediately using Service Role
    if (targetLocationId) {
      const { error: assignError } = await supabase
        .from('officer_assignments')
        .insert({
          officer_id: userData.user.id,
          location_id: targetLocationId,
          assigned_by: user.id
        });
      
      if (assignError) {
        console.error('Assignment Error:', assignError);
        // We don't fail the whole request because the user IS created
      }
    }

    return new Response(JSON.stringify({ 
      user: userData.user,
      temp_password: permanentPassword 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
