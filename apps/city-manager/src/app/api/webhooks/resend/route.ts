import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { env } from "../../../../lib/env";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!env.RESEND_API_KEY || !env.RESEND_WEBHOOK_SECRET) {
      return new NextResponse("Webhook email service not configured", { status: 500 });
    }
    if (!env.NEXT_PUBLIC_SUPABASE_URL || (!env.SUPABASE_SERVICE_ROLE_KEY && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return new NextResponse("Webhook database service not configured", { status: 500 });
    }

    const resend = new Resend(env.RESEND_API_KEY);
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const payload = await req.text();

    const id = req.headers.get("svix-id");
    const timestamp = req.headers.get("svix-timestamp");
    const signature = req.headers.get("svix-signature");
    if (!id || !timestamp || !signature || !env.RESEND_WEBHOOK_SECRET) {
      console.error("Missing webhook headers or secret", {
        id: !!id,
        timestamp: !!timestamp,
        signature: !!signature,
        secret: !!env.RESEND_WEBHOOK_SECRET,
      });
      return new NextResponse("Missing webhook headers or secret", { status: 400 });
    }

    const event = await resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    });

    if (event?.type !== "email.received") {
      return NextResponse.json({ ok: true, ignored: event?.type }, { status: 200 });
    }

    const data: any = event.data || {};
    const from = data.from || "";
    const to = data.to || "";
    const subject = data.subject || "(No Subject)";
    const html = data.html || null;
    const text = data.text || null;

    if (!from || !to) {
      return NextResponse.json({ error: "Missing from or to" }, { status: 400 });
    }

    const { error } = await supabase.from("emails").insert({
      from_address: from,
      to_address: to,
      subject,
      html_body: html,
      text_body: text,
      raw_json: event,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Error saving email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return new NextResponse("Invalid webhook", { status: 400 });
  }
}
