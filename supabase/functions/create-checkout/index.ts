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
  const url = new URL(req.url)
  const locationId = url.searchParams.get('location_id')
  const type = url.searchParams.get('type') // hourly, daily, monthly

  if (!locationId || !type) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 })
  }

  try {
    // 1. Fetch location pricing settings and owner's Stripe account
    const isFiveDigit = locationId.length === 5 && /^\d+$/.test(locationId);
    
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('*, profiles:owner_id(stripe_account_id, stripe_onboarding_complete)')
      .or(isFiveDigit ? `display_id.eq.${locationId}` : `id.eq.${locationId}`)
      .single();

    if (locError || !location) {
      return new Response(JSON.stringify({ error: 'Location not found' }), { status: 404 })
    }

    const ownerProfile = (location as any).profiles;
    const stripeAccountId = ownerProfile?.stripe_onboarding_complete ? ownerProfile?.stripe_account_id : null;

    // 2. Calculate Base Price
    let basePrice = 0
    if (type === 'hourly') basePrice = location.rate_per_hour || 0
    else if (type === 'daily') basePrice = location.base_price_daily || 0
    else if (type === 'monthly') basePrice = location.base_price_monthly || 0
    else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 })

    // 3. Apply Dynamic Adjustments
    let dynamicRatio = location.dynamic_pricing_ratio || 1.0
    let surchargeMultiplier = location.surcharge_multiplier || 1.0
    
    // AutoPilot Logic (Global Toggle)
    if (location.autopilot_enabled) {
      const now = new Date()
      const month = now.getMonth() + 1 // 1-12
      const hour = now.getHours()

      // Seasonal Algorithms
      if (month >= 7 && month <= 8) {
        dynamicRatio = 2.0 // Jul-Aug 200%
      } else if (month >= 6 && month <= 9) {
        dynamicRatio = 1.5 // Jun-Sep 150%
      }

      // Time-based Algorithms
      if (hour >= 8 && hour < 16) {
        surchargeMultiplier = 1.5 // 08-16h 150%
      } else if (hour >= 20 || hour < 6) {
        surchargeMultiplier = 0.8 // Night 80%
      }
    }

    let finalPrice = basePrice
    
    if (location.dynamic_pricing_enabled) {
      finalPrice *= dynamicRatio
    }
    
    if (location.surcharge_enabled) {
      finalPrice *= surchargeMultiplier
    }

    // Apply Smart AutoPilot Ceiling Constraints
    if (location.autopilot_enabled) {
      let ceiling = 0
      if (type === 'hourly') ceiling = location.rate_per_hour_ceiling || 0
      else if (type === 'daily') ceiling = location.base_price_daily_ceiling || 0
      else if (type === 'monthly') ceiling = location.base_price_monthly_ceiling || 0

      if (ceiling > 0 && finalPrice > ceiling) {
        finalPrice = ceiling
      }
    }

    // Round to 2 decimal places and convert to cents for Stripe
    const amountInCents = Math.round(finalPrice * 100)

    if (amountInCents <= 0) {
      return new Response(JSON.stringify({ error: 'Price calculation resulted in zero or negative amount' }), { status: 400 })
    }

    // 4. Create Stripe Checkout Session
    // Commission Logic: 15% platform fee
    const commissionPercent = 0.15;
    const applicationFeeAmount = Math.round(amountInCents * commissionPercent);

    const sessionParams: any = {
      payment_method_types: ['card'],
      phone_number_collection: {
        enabled: true,
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Parking ${type.toUpperCase()} - ${location.name}`,
              description: `Parking access at ${location.address}`,
            },
            unit_amount: amountInCents,
          },
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 99,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${supabaseUrl}/auth/v1/callback?next=/success`, 
      cancel_url: `${supabaseUrl}/auth/v1/callback?next=/cancel`, 
      metadata: {
        location_id: locationId,
        type: type,
        is_autopilot: (location.autopilot_enabled ?? false).toString(),
      },
      custom_fields: [
        {
          key: 'plate_number',
          label: { type: 'custom', custom: 'Vehicle Plate Number' },
          type: 'text',
        },
      ],
    };

    // If owner has a connected account, split the payment
    if (stripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // 5. Redirect user to Stripe (with No-Cache headers)
    return new Response(null, {
      status: 303,
      headers: { 
        'Location': session.url as string,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (err: any) {
    console.error('Error creating checkout:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
