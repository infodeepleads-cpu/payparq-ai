import { env } from "../../../../lib/env";

function fallbackSuggest(note: string) {
  const trimmed = note.trim();
  const urgent = /urgent|asap|immediately|today|now/i.test(trimmed);
  const nextStep =
    trimmed.length > 0
      ? `Summarize intent: "${trimmed}". Best next step: identify owner, set deadline, and send a concise message to confirm execution.`
      : "Write a note to get an actionable next step.";
  const whatsappDraft = `Quick update: ${trimmed}. Action: ${urgent ? "Priority now" : "Plan for tomorrow"}. Can you confirm and take it forward?`;
  const emailDraft = `Subject: Next step\n\n${trimmed}\n\nProposed next step:\n- Assign owner\n- Define deadline\n- Confirm scope\n\nPlease reply with confirmation.`;
  return { nextStep, whatsappDraft, emailDraft, urgent };
}

function json(data: unknown, init?: number | ResponseInit) {
  const options: ResponseInit =
    typeof init === "number" ? { status: init } : init || {};
  return new Response(JSON.stringify(data), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const note = body?.note ?? "";

  if (!env.OPENAI_API_KEY) {
    return json(fallbackSuggest(note));
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const prompt =
      `Manager note:\n${note}\n\n` +
      `Return JSON with keys: nextStep, whatsappDraft, emailDraft, urgent (boolean). ` +
      `Style: concise, actionable, manager-oriented. WhatsApp should be short. Email clear.`;
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You turn notes into actions and drafts." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!r.ok) return json(fallbackSuggest(note));
    const chat = await r.json();
    const content = chat?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return json({
      nextStep: parsed.nextStep || "",
      whatsappDraft: parsed.whatsappDraft || "",
      emailDraft: parsed.emailDraft || "",
      urgent: !!parsed.urgent
    });
  } catch {
    return json(fallbackSuggest(note));
  }
}
