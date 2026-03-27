import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const appBaseUrl = (Deno.env.get("STRIPE_CONNECT_APP_URL") ?? "https://mobile-scanner-ruddy.vercel.app").trim().replace(/\/+$/, "");
const desiredCountry = (Deno.env.get("STRIPE_CONNECT_COUNTRY") ?? "HR").trim().toUpperCase();
const refreshPath = (Deno.env.get("STRIPE_CONNECT_REFRESH_PATH") ?? "/#/finance").trim();
const returnPath = (Deno.env.get("STRIPE_CONNECT_RETURN_PATH") ?? "/#/finance").trim();
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCountry(raw: string): string {
  const value = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(value) ? value : "HR";
}

function buildAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appBaseUrl}${normalizedPath}`;
}

async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return null;

  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user?.id) return null;
  return data.user.id;
}

type ProfileRow = {
  id: string;
  stripe_account_id: string | null;
};

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id,stripe_account_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: String(data.id),
    stripe_account_id: data.stripe_account_id ? String(data.stripe_account_id) : null,
  };
}

async function persistStripeAccount(userId: string, accountId: string): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .update({
      stripe_account_id: accountId,
      stripe_onboarding_complete: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

async function createExpressAccount(userId: string, country: string): Promise<Stripe.Account> {
  return await stripe.accounts.create({
    type: "express",
    country,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    metadata: {
      profile_id: userId,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !stripeSecretKey) {
    return json({ error: "Missing server configuration" }, 500);
  }

  try {
    const userId = await resolveUserId(req);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const profile = await fetchProfile(userId);
    if (!profile) return json({ error: "Profile not found" }, 404);

    const targetCountry = normalizeCountry(desiredCountry);
    let stripeAccountId = profile.stripe_account_id;
    let accountCountry = "";

    if (stripeAccountId) {
      try {
        const existing = await stripe.accounts.retrieve(stripeAccountId);
        accountCountry = String(existing.country ?? "").toUpperCase();
        if (accountCountry !== targetCountry) {
          const replacement = await createExpressAccount(userId, targetCountry);
          stripeAccountId = replacement.id;
          accountCountry = String(replacement.country ?? "").toUpperCase();
          await persistStripeAccount(userId, stripeAccountId);
        }
      } catch {
        stripeAccountId = null;
      }
    }

    if (!stripeAccountId) {
      const created = await createExpressAccount(userId, targetCountry);
      stripeAccountId = created.id;
      accountCountry = String(created.country ?? "").toUpperCase();
      await persistStripeAccount(userId, stripeAccountId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: "account_onboarding",
      refresh_url: buildAbsoluteUrl(refreshPath),
      return_url: buildAbsoluteUrl(returnPath),
    });

    return json({
      ok: true,
      url: accountLink.url,
      stripe_account_id: stripeAccountId,
      country: accountCountry || targetCountry,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
