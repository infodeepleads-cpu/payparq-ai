import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // 1. Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No Authorization header found')
      return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Initialize Supabase client with the user's JWT to verify them
    const token = authHeader.replace('Bearer ', '')
    const client = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authError } = await client.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: `Unauthorized: ${authError?.message ?? 'Invalid user'}` }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log(`User authenticated: ${user.id}`)

    // 2. Fetch profile to check if already has account
    console.log(`Fetching profile for user ID: ${user.id}`)
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, name, email, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // We don't return here, we try to use metadata instead
    }

    if (!profile) {
      console.log(`Profile record not found in DB for ${user.id}, using metadata fallback`)
      const metadata = user.user_metadata || {}
      profile = {
        stripe_account_id: null,
        name: metadata.name || metadata.full_name || 'User',
        email: user.email || metadata.email,
        role: metadata.role || 'officer'
      }
      
      // Basic validation
      if (!profile.email) {
        return new Response(JSON.stringify({ error: 'User email not found. Please update your profile.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    console.log(`Using profile data: ${JSON.stringify(profile)}`)

    // 3. Create or get Stripe account
    let accountId = profile.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'EE', // Default to Estonia as per payparq.ai context
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          supabase_user_id: user.id,
        },
      })
      accountId = account.id

      // Update profile with account ID (use upsert to create if missing)
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          stripe_account_id: accountId,
          email: profile.email,
          name: profile.name,
          role: profile.role
        }, { onConflict: 'id' })
      
      if (updateError) {
        console.error('Error updating profile with Stripe ID:', updateError)
      }
    }

    // 4. Create Account Link for onboarding
    try {
      const appUrl = 'https://payparq-d-6rex95.web.app'
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${appUrl}/#/finance`,
        return_url: `${appUrl}/#/finance`,
        type: 'account_onboarding',
      })

      return new Response(JSON.stringify({ url: accountLink.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (linkError: any) {
      console.error('Error creating account link:', linkError.message)
      
      // If the error is about the platform profile questionnaire, redirect to the dashboard
      if (linkError.message.includes('platform profile') || linkError.message.includes('questionnaire')) {
        return new Response(JSON.stringify({ 
          url: 'https://dashboard.stripe.com/connect/accounts/overview',
          message: 'Redirecting to Stripe Dashboard to complete platform setup...'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw linkError
    }
  } catch (err: any) {
    console.error('Error in create-connect-account:', err.message)
    
    // Check if the initial account creation failed due to platform profile requirements
    if (err.message.includes('platform profile') || err.message.includes('questionnaire')) {
      return new Response(JSON.stringify({ 
        url: 'https://dashboard.stripe.com/connect/accounts/overview',
        message: 'Redirecting to Stripe Dashboard to complete platform setup...'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
