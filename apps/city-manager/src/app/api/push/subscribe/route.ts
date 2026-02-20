import { setSubscription } from "../../../../lib/pushStore";
import { createClient } from "@supabase/supabase-js";
import { env } from "../../../../lib/env";

function json(data: unknown, init?: number | ResponseInit) {
  const options: ResponseInit =
    typeof init === "number" ? { status: init } : init || {};
  return new Response(JSON.stringify(data), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
}

export async function POST(req: Request) {
  const sub = await req.json().catch(() => null);
  if (!sub) return json({ ok: false }, 200);

  setSubscription(sub);

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const endpoint = sub?.endpoint || "";
  const keys = sub?.keys || {};
  const p256dh = keys?.p256dh || "";
  const auth = keys?.auth || "";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  if (endpoint) {
    try {
      await supabase
        .from("push_subscriptions")
        .upsert(
          {
            endpoint,
            p256dh,
            auth,
            ua
          },
          { onConflict: "endpoint" }
        );
    } catch {}
  }

  return json({ ok: true }, 200);
}
