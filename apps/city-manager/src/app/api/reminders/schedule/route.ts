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
  const body = await req.json().catch(() => ({}));
  const title = body?.title || "";
  const scheduled_at = body?.scheduled_at || "";
  if (!title || !scheduled_at) return json({ error: "missing" }, 200);

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { error } = await supabase
    .from("reminders")
    .insert({ title, scheduled_at, fired: false });
  if (error) return json({ error: "db" }, 200);
  return json({ ok: true }, 200);
}
