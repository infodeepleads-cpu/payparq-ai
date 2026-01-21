import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  const payload = await req.json()
  const { type, email, data } = payload

  console.log(`Processing email type: ${type} for ${email}`)

  let subject = ''
  let body = ''

  if (type === 'welcome_admin') {
    subject = 'Welcome to PayParq.AI - Admin Account Created'
    body = `
      Welcome to PayParq.AI!
      
      Your Admin account has been created successfully.
      Your primary Location ID is: ${data.location_id}
      
      You can now sign in to manage your parking lots.
    `
  } else if (type === 'new_location') {
    subject = 'New Parking Location Registered'
    body = `
      Your new parking location "${data.location_name}" has been registered.
      
      UNIQUE LOCATION ID: ${data.location_id}
      
      Please use this ID for all enforcement and signage at this lot.
    `
  } else if (type === 'welcome_officer') {
    subject = 'Access Granted - PayParq.AI Officer'
    body = `
      You have been added as an Officer on PayParq.AI.
      
      Assigned Location ID: ${data.location_id}
      Temporary Password: ${data.password}
      
      Please sign in to start enforcement.
    `
  }

  // Placeholder for actual email sending logic (Resend/SendGrid/etc.)
  console.log('--- EMAIL SENT ---')
  console.log(`To: ${email}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body: ${body}`)
  console.log('------------------')

  return new Response(JSON.stringify({ message: 'Email notification triggered' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
