import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "../../../../lib/env";

export async function GET() {
  try {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const publicKeySet = !!env.VAPID_PUBLIC_KEY;
    const hasSubscription = !!data?.endpoint;

    return NextResponse.json({
      publicKeySet,
      hasSubscription,
      latestEndpoint: hasSubscription ? data?.endpoint : null,
      createdAt: hasSubscription ? data?.created_at : null,
      error: error?.message || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown_error" }, { status: 500 });
  }
}
