import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  const { sql } = await req.json()

  // Use the postgres service role to execute SQL
  // This is a hacky way to run SQL via edge function
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

  return new Response(JSON.stringify({ data, error }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
