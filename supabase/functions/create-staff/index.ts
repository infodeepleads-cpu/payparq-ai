import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!supabaseUrl) {
    return new Response(JSON.stringify({ error: "Missing server configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.text();
    const target = `${supabaseUrl}/functions/v1/create-officer`;
    const proxied = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("Content-Type") ?? "application/json",
        "Authorization": req.headers.get("Authorization") ?? "",
        "apikey": req.headers.get("apikey") ?? "",
      },
      body,
    });
    const text = await proxied.text();
    return new Response(text, {
      status: proxied.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
