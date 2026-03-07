import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "team@info.payparq.com";
const defaultRedirectTo = Deno.env.get("SUPABASE_REDIRECT_URL") ??
  "https://mobile-scanner-flax-static.vercel.app/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isEmailValid(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
    return json({ error: "Missing server configuration" }, 500);
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!isEmailValid(email)) return json({ error: "Invalid email" }, 400);

    const redirectToRaw = String(body?.redirectTo ?? defaultRedirectTo).trim();
    const redirectUri = new URL(redirectToRaw);
    const redirectTo = redirectUri.toString();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) return json({ error: error.message }, 500);

    const actionLink = data?.properties?.action_link ?? data?.action_link;
    if (!actionLink) return json({ error: "Recovery link generation failed" }, 500);

    const subject = "Reset your Payparq password";
    const html =
      `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">` +
      `<h2 style="margin:0 0 12px 0">Reset your password</h2>` +
      `<p style="margin:0 0 16px 0">Click the button below to reset your Payparq account password.</p>` +
      `<p style="margin:0 0 16px 0"><a href="${actionLink}" style="background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block">Reset password</a></p>` +
      `<p style="margin:0;color:#666;font-size:13px">If you did not request this, you can ignore this email.</p>` +
      `</div>`;
    const text =
      `Reset your Payparq password: ${actionLink}\n\nIf you did not request this, ignore this email.`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [email],
        subject,
        html,
        text,
      }),
    });

    if (!resendResponse.ok) {
      const failure = await resendResponse.text();
      return json({ error: `Resend failed: ${failure}` }, 500);
    }

    return json({ ok: true, sent: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
