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
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error(`[${reqId}] Missing stripe-signature header`)
    return new Response('Missing signature', { status: 400 })
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

      // 2. ATOMIC OPERATION: Check Idempotency & Insert
      // We use a unique constraint on stripe_session_id in the DB for scale
      const { data: existingSession, error: checkError } = await supabase
        .from('parking_sessions')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()

      if (checkError) {
        throw new Error(`DB Check Error: ${checkError.message}`)
      }

      if (existingSession) {
        console.log(`[${reqId}] 🔄 Session ${sessionId} already processed.`)
        return new Response(JSON.stringify({ received: true, duplicated: true }), { status: 200 })
      }

      // 3. STRUCTURED INSERT
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

      const { error: insertError } = await supabase
        .from('parking_sessions')
        .insert(insertData)

      if (insertError) {
        console.error(`[${reqId}] ❌ INSERT failed:`, insertError)
        throw new Error(`Insert Error: ${insertError.message}`)
      }

      console.log(`[${reqId}] ✨ Session recorded successfully.`)

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
