import webpush from "web-push";
import { env } from "../../../../lib/env";
import { getSubscription } from "../../../../lib/pushStore";

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
  const subscription = getSubscription();
  if (!subscription) {
    return json({ error: "No subscription" }, 200);
  }

  webpush.setVapidDetails("mailto:admin@example.com", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  await webpush.sendNotification(subscription, JSON.stringify(body)).catch(() => {});
  return json({ ok: true });
}
