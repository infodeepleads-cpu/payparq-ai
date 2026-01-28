import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = (await headers()).get('stripe-signature') || '';
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('✅ Checkout session completed:', session.id);

    // 1. EXTRACT DATA
    let location_id = session.metadata?.location_id || '';
    let plate_number = session.metadata?.plate_number || '';

    // If metadata is empty, check custom fields (Payment Links)
    if ((!location_id || !plate_number) && session.custom_fields) {
      for (const f of session.custom_fields) {
        const key = f.key.toLowerCase();
        const val = f.text?.value || f.numeric?.value || ''; // simplified extraction
        
        if (key.includes('location')) location_id = val;
        if (key.includes('plate')) plate_number = val.toUpperCase();
      }
    }

    // Fallback defaults if still missing (prevents DB errors)
    if (!location_id) location_id = 'DEFAULT_LOC';
    if (!plate_number) plate_number = 'UNKNOWN';

    console.log(`📦 Data extracted - Plate: ${plate_number}, Location: ${location_id}`);

    // 2. CHECK IDEMPOTENCY
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from('parking_sessions')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle(); // maybeSingle avoids error if not found

    if (fetchError) {
      console.error('❌ Error checking existing session:', fetchError);
    }

    if (existingSession) {
      console.log(`🔄 Session ${session.id} already processed. Skipping.`);
      return NextResponse.json({ received: true });
    }

    // 3. INSERT INTO SUPABASE
    const insertData = {
      location_id,
      plate: plate_number,
      mobile: session.customer_details?.phone || '',
      email: session.customer_details?.email || '',
      price: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      stripe_session_id: session.id,
      payment_status: 'paid',
    };

    console.log('🚀 Inserting into Supabase:', insertData);

    const { error: insertError } = await supabaseAdmin
      .from('parking_sessions')
      .insert(insertData);

    if (insertError) {
      console.error('❌ Supabase INSERT failed:', insertError);
      // Don't return 500, or Stripe will retry indefinitely. Log error and return 200.
      return NextResponse.json({ error: insertError.message, received: true }); 
    }

    console.log('✨ Successfully inserted parking session!');

    // 4. UPDATE OCCUPANCY (Optional, best effort)
    try {
        // First check if location exists, if not create a dummy one to avoid error
        const { data: loc } = await supabaseAdmin.from('locations').select('occupancy').eq('id', location_id).maybeSingle();
        if (loc) {
             await supabaseAdmin.from('locations').update({ occupancy: (loc.occupancy || 0) + 1 }).eq('id', location_id);
             console.log('📈 Occupancy updated.');
        } else {
            console.log(`⚠️ Location ${location_id} not found, skipping occupancy update.`);
        }
    } catch (e) {
        console.error('⚠️ Failed to update occupancy:', e);
    }
  }

  return NextResponse.json({ received: true });
}
