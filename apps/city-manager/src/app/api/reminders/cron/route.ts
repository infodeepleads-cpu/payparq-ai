import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { env } from "../../../../lib/env";

function json(data: unknown, init?: number | ResponseInit) {
  const options: ResponseInit =
    typeof init === "number" ? { status: init } : init || {};
  return new Response(JSON.stringify(data), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
}

export async function GET(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const secret = env.CRON_SECRET || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return json({ error: "vapid" }, 200);
  }
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const now = new Date().toISOString();
  const { data: reminders } = await supabase
    .from("reminders")
    .select("id,title,scheduled_at,fired")
    .lte("scheduled_at", now)
    .eq("fired", false);

  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.endpoint || !sub?.p256dh || !sub?.auth) {
    return json({ error: "nosub" }, 200);
  }

  const subscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth }
  };

  webpush.setVapidDetails("mailto:admin@example.com", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

  for (const r of reminders || []) {
    const payload = JSON.stringify({
      title: "Reminder",
      body: r.title,
      url: "/reminders"
    });
    try {
      await webpush.sendNotification(subscription, payload);
      await supabase.from("reminders").update({ fired: true }).eq("id", r.id);
    } catch {}
  }

  return json({ ok: true, count: (reminders || []).length }, 200);
}
