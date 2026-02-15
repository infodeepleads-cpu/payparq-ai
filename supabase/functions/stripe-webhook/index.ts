import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  const reqId = crypto.randomUUID()
  // For Stripe webhooks, we don't use Supabase Auth JWTs.
  // We use the Stripe signature for verification.
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error(`[${reqId}] Missing stripe-signature header`)
    return new Response(JSON.stringify({ error: 'No Stripe signature' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') as string
    )

    console.log(`[${reqId}] 🔔 Event received: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const sessionId = session.id
      
      // LOG RAW METADATA AND CUSTOM FIELDS
      console.log(`[${reqId}] 📝 Raw Metadata:`, JSON.stringify(session.metadata))
      console.log(`[${reqId}] 📝 Raw Custom Fields:`, JSON.stringify(session.custom_fields))
      
      console.log(`[${reqId}] ✅ Processing Session: ${sessionId}`)

      // 1. EXTRACT DATA WITH ROBUST FALLBACKS
      let location_id = session.metadata?.location_id || ''
      let plate_number = session.metadata?.plate_number || ''

      if ((!location_id || !plate_number) && session.custom_fields) {
        for (const f of session.custom_fields) {
          const key = (f.key || '').toLowerCase().replace(/[^a-z0-9]/g, '')
          const val = f.text?.value || f.numeric?.value || ''
          
          if (key.includes('location') || key.includes('loc')) location_id = val
          if (key.includes('plate') || key.includes('reg')) plate_number = val.toUpperCase()
        }
      }

      location_id = location_id || 'DEFAULT_LOC'
      plate_number = plate_number || 'UNKNOWN'

      console.log(`[${reqId}] 📦 Extracted Data - Plate: ${plate_number}, Loc: ${location_id}`)

      // 2. ATOMIC INSERT (Upsert)
      // Relying on UNIQUE constraint on stripe_session_id for true scalability.
      // This prevents double-processing even if two webhooks arrive at the same millisecond.
      const insertData = {
        location_id,
        plate: plate_number,
        mobile: session.customer_details?.phone || '',
        email: session.customer_details?.email || '',
        price: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
        stripe_session_id: sessionId,
        payment_status: 'paid',
        created_at: new Date().toISOString(),
      }

      console.log(`[${reqId}] 🚀 Upserting session: ${sessionId}`)

      const { error: upsertError } = await supabase
        .from('parking_sessions')
        .upsert(insertData, { 
          onConflict: 'stripe_session_id',
          ignoreDuplicates: true 
        })
        .select()
        .single()

      if (upsertError) {
        console.error(`[${reqId}] ❌ Upsert failed:`, upsertError)
        throw new Error(`Upsert Error: ${upsertError.message}`)
      }

      console.log(`[${reqId}] ✨ Session processed successfully.`)

      // 4. BEST-EFFORT OCCUPANCY UPDATE
      try {
        // Try to find location by ID (UUID) or display_id (Stripe short-code)
        const { data: loc } = await supabase
          .from('locations')
          .select('id, occupancy')
          .or(`id.eq.${location_id},display_id.eq.${location_id}`)
          .maybeSingle()

        if (loc) {
          await supabase.from('locations').update({ occupancy: (loc.occupancy || 0) + 1 }).eq('id', loc.id)
          console.log(`[${reqId}] 📈 Occupancy updated for ${loc.id}.`)
        } else {
          console.log(`[${reqId}] ⚠️ Location not found for ID: ${location_id}. Skipping occupancy update.`)
        }
      } catch (e) {
        console.error(`[${reqId}] ⚠️ Occupancy Update Error: ${e.message}`)
      }
    } else if (event.type === 'account.updated') {
      const account = event.data.object as any
      console.log(`[${reqId}] 💳 Account Updated: ${account.id}`)

      const onboardingComplete = account.details_submitted
      const payoutsEnabled = account.payouts_enabled

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_onboarding_complete: onboardingComplete,
          stripe_payouts_enabled: payoutsEnabled,
        })
        .eq('stripe_account_id', account.id)

      if (updateError) {
        console.error(`[${reqId}] ❌ Profile update failed:`, updateError)
        throw new Error(`Profile Update Error: ${updateError.message}`)
      }
      
      console.log(`[${reqId}] ✨ Profile updated for Stripe account ${account.id}.`)
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" } 
    })

  } catch (err: any) {
    console.error(`[${reqId}] ❌ Webhook Critical Failure: ${err.message}`)
    // Return 400 to Stripe for non-recoverable errors so they show in logs
    return new Response(JSON.stringify({ error: err.message, requestId: reqId }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }
})
