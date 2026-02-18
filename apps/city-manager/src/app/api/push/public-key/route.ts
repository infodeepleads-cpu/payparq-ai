import { env } from "../../../../lib/env";

function json(data: unknown, init?: number | ResponseInit) {
  const options: ResponseInit =
    typeof init === "number" ? { status: init } : init || {};
  return new Response(JSON.stringify(data), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
}

export async function GET() {
  if (!env.VAPID_PUBLIC_KEY) {
    return json({ publicKey: "" }, 200);
  }
  return json({ publicKey: env.VAPID_PUBLIC_KEY });
}
