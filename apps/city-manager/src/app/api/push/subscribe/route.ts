import { setSubscription } from "../../../../lib/pushStore";

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
  if (sub) setSubscription(sub);
  return json({ ok: true });
}
