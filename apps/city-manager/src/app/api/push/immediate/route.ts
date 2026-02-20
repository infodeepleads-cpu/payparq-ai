import webpush from "web-push";
import { env } from "../../../../lib/env";
import { getSubscription } from "../../../../lib/pushStore";
import { createClient } from "@supabase/supabase-js";

function json(data: unknown, init?: number | ResponseInit) {
  const options: ResponseInit =
    typeof init === "number" ? { status: init } : init || {};
  return new Response(JSON.stringify(data), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return json({ error: "VAPID keys missing" }, 200);
  }
  let subscription = getSubscription();
  if (!subscription) {
    try {
      const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data } = await supabase
        .from("push_subscriptions")
        .select("endpoint,p256dh,auth")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.endpoint && data?.p256dh && data?.auth) {
        subscription = {
          endpoint: data.endpoint,
          keys: { p256dh: data.p256dh, auth: data.auth }
        };
      }
    } catch {}
  }
  if (!subscription) return json({ error: "No subscription" }, 200);

  webpush.setVapidDetails("mailto:admin@example.com", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  await webpush.sendNotification(subscription, JSON.stringify(body)).catch(() => {});
  return json({ ok: true });
}
