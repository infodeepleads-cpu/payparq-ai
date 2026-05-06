import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect("/members?tab=payments&error=invalid_auth");
    }

    const stripeClientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeClientId || !stripeSecretKey) {
      return NextResponse.redirect("/members?tab=payments&error=config_error");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_secret: stripeSecretKey,
        code,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.stripe_user_id) {
      console.error("Stripe token response:", tokenData);
      return NextResponse.redirect("/members?tab=payments&error=invalid_response");
    }

    // Save to database
    await supabaseAdmin
      .from("stripe_accounts")
      .upsert({
        user_id: state,
        stripe_account_id: tokenData.stripe_user_id,
        is_connected: true,
        updated_at: new Date().toISOString(),
      });

    return NextResponse.redirect("/members?tab=payments&success=stripe_connected");
  } catch (error) {
    console.error("Stripe Connect callback error:", error);
    return NextResponse.redirect("/members?tab=payments&error=connection_failed");
  }
}
