import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

function parseIso(value: string | null | undefined) {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function resolveExitTimeFromQuantity(params: {
  entryIso: string;
  quantity: number;
  pricingType: string;
}) {
  const entry = new Date(params.entryIso);
  if (Number.isNaN(entry.getTime())) return null;
  const quantity = Number.isFinite(params.quantity) && params.quantity > 0 ? params.quantity : 1;
  const pricingType = params.pricingType.trim().toLowerCase();
  const exit = new Date(entry.getTime());
  if (pricingType === 'daily') {
    exit.setUTCDate(exit.getUTCDate() + quantity);
  } else if (pricingType === 'monthly') {
    exit.setUTCDate(exit.getUTCDate() + quantity * 30);
  } else {
    exit.setUTCHours(exit.getUTCHours() + quantity);
  }
  return exit.toISOString();
}

async function ensureMemberAccountByEmail(rawEmail: string | null | undefined) {
  const email = (rawEmail ?? '').trim().toLowerCase();
  if (!email || !supabaseAdmin) {
    return { ok: false, created: false };
  }
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    console.error('❌ Failed to list auth users:', listError.message);
    return { ok: false, created: false };
  }
  const existing = listData.users.find(
    (item) => (item.email ?? '').trim().toLowerCase() === email
  );
  if (existing) {
    return { ok: true, created: false };
  }
  const generatedPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: false,
    user_metadata: {
      role: 'member',
      membership_source: 'stripe_checkout',
    },
  });
  if (createError) {
    console.error('❌ Failed to create member auth user:', createError.message);
    return { ok: false, created: false };
  }
  return { ok: true, created: true };
}

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
    if (session.mode === 'setup') {
      console.log('🔐 Payment method setup completed.');
      return NextResponse.json({ received: true });
    }

    const sessionMetadata = session.metadata ?? {};

    // 1. EXTRACT DATA
    let location_id = sessionMetadata.location_id || '';
    let plate_number = sessionMetadata.plate_number || '';

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

    // Ensure Supabase client
    const client = supabaseAdmin ?? supabase;
    if (!client) {
      console.warn('Supabase client not configured; skipping DB writes.');
      return NextResponse.json({ received: true });
    }

    // 2. CHECK IDEMPOTENCY
    const { data: existingSession, error: fetchError } = await client
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

    let lineItemQuantity = 1;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const quantityFromStripe = Number(lineItems.data?.[0]?.quantity ?? 1);
      if (Number.isFinite(quantityFromStripe) && quantityFromStripe > 0) {
        lineItemQuantity = quantityFromStripe;
      }
    } catch {
      lineItemQuantity = 1;
    }

    const pricingType = (sessionMetadata.pricing_type ?? 'hourly').toString();
    const checkInFromMetadata = parseIso(sessionMetadata.check_in);
    const checkOutFromMetadata = parseIso(sessionMetadata.check_out);
    const createdAtIso = new Date(session.created * 1000).toISOString();
    const entryTime = checkInFromMetadata ?? createdAtIso;
    const exitTime =
      checkOutFromMetadata ??
      resolveExitTimeFromQuantity({
        entryIso: entryTime,
        quantity: lineItemQuantity,
        pricingType,
      });
    const durationMinutes =
      exitTime != null
        ? Math.max(1, Math.round((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 60000))
        : null;

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
      status: 'active',
      entry_time: entryTime,
      exit_time: exitTime,
      quantity: lineItemQuantity,
      duration_minutes: durationMinutes,
      stripe_metadata: sessionMetadata,
    };

    console.log('🚀 Inserting into Supabase:', insertData);

    await ensureMemberAccountByEmail(session.customer_details?.email || null);

    const { error: insertError } = await client
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
        const { data: loc } = await client.from('locations').select('occupancy').eq('id', location_id).maybeSingle();
        if (loc) {
             await client.from('locations').update({ occupancy: (loc.occupancy || 0) + 1 }).eq('id', location_id);
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
