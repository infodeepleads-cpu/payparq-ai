import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

const ALLOWED_ORIGINS = new Set([
  "https://payparq.com",
  "https://www.payparq.com",
  "https://mobile-scanner-ruddy.vercel.app",
]);

function makeCorsHeaders(origin: string): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://payparq.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return null;

  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user?.id) return null;
  return data.user.id;
}

serve(async (req) => {
  const origin = req.headers.get("Origin") ?? "";
  const cors = makeCorsHeaders(origin);
  const json = (data: Record<string, unknown>, status = 200): Response =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    return json({ error: "Missing server configuration" }, 500);
  }

  try {
    const userId = await resolveUserId(req);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) return json({ error: profileError.message }, 500);

    const stripeAccountId = String(profile?.stripe_account_id ?? "").trim();
    if (!stripeAccountId) {
      return json({ error: "Stripe account is not connected" }, 400);
    }

    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
    return json({ ok: true, url: loginLink.url, stripe_account_id: stripeAccountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
