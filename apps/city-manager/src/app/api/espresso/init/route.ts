import { NextRequest } from "next/server";
import { getSupabase } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";

function todayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const todayStr = todayDateString();

  let hasTodayTasks = false;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .select("id")
      .eq("due_at", todayStr)
      .limit(1);
    if (!error && data && data.length > 0) {
      hasTodayTasks = true;
    }
  } catch {
    hasTodayTasks = false;
  }

  if (!hasTodayTasks) {
    try {
      await fetch(`${baseUrl}/api/crm/ingest/split-area?limit=40&persist=true`, {
        method: "GET",
        cache: "no-store",
      });
    } catch {}

    try {
      const espressoRes = await fetch(`${baseUrl}/api/espresso/daily?persist=true`, {
        method: "GET",
        cache: "no-store",
      });
      if (espressoRes.ok) {
        const json = await espressoRes.json();
        return new Response(JSON.stringify({ createdToday: true, ...json }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {}
  }

  try {
    const espressoRes = await fetch(`${baseUrl}/api/espresso/daily`, {
      method: "GET",
      cache: "no-store",
    });
    if (espressoRes.ok) {
      const json = await espressoRes.json();
      return new Response(JSON.stringify({ createdToday: hasTodayTasks, ...json }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {}

  return new Response(
    JSON.stringify({
      createdToday: hasTodayTasks,
      error: "espresso_init_failed",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
