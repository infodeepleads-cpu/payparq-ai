import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  try {
    const { email, captchaToken } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify Turnstile token - SOFT FAIL
    // We only log if it fails, but we DON'T block the user.
    // This ensures real users are never blocked by Cloudflare issues.
    const isHuman = await verifyTurnstileToken(captchaToken, req.headers.get("x-forwarded-for") || undefined);
    if (!isHuman && captchaToken) {
      console.warn(`Captcha verification failed for ${email}, but proceeding anyway to avoid blocking real user.`);
    }

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }
    if (!env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service configuration missing" }, { status: 500 });
    }
    const resend = new Resend(env.RESEND_API_KEY);

    const adminClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const finalOrigin = resolvePublicOrigin(req);
    
    // Explicitly add type=recovery and email to the redirect URL to ensure it's picked up
    const redirectTo = `${finalOrigin}/auth/confirm?type=recovery&email=${encodeURIComponent(email)}`;
    
    console.log(`Generating recovery link for ${email} with redirectTo: ${redirectTo}`);
    
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectTo
      }
    });

    if (linkError) {
      console.error("Link Generation Error:", linkError);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const recoveryLink = linkData.properties.action_link as string;
    console.log("Generated Link:", recoveryLink);

    // Use verified domain info.payparq.com
    const fromAddress = resolveFromAddress();

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Ponovno postavljanje lozinke - PayParq",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #7C3AED;">Zaboravili ste lozinku?</h2>
          <p>Zaprimili smo zahtjev za ponovnim postavljanjem lozinke za vaš PayParq račun. Kliknite na gumb ispod kako biste postavili novu lozinku:</p>
          <div style="margin: 30px 0;">
            <a href="${recoveryLink}" style="background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Postavi novu lozinku</a>
          </div>
          <p>Ako gumb iznad ne radi, kopirajte ovaj link u vaš preglednik:</p>
          <p style="word-break: break-all; color: #7C3AED; font-size: 12px;">${recoveryLink}</p>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">Ako niste zatražili ovaj email, možete ga slobodno zanemariti. Link će biti aktivan 60 minuta.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">Sva prava pridržana © 2026 PayParq Global Inc.</p>
        </div>
      `,
    });

    if (resendError) {
      return NextResponse.json({ error: resendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: resendData?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function resolvePublicOrigin(req: NextRequest) {
  const headerOrigin = req.headers.get("origin") || "";
  const derivedFromVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const configured =
    env.APP_BASE_URL ||
    env.NEXT_PUBLIC_APP_URL ||
    env.NEXT_PUBLIC_SITE_URL ||
    derivedFromVercel;
  const normalizedConfigured = normalizeUrl(configured);
  if (normalizedConfigured) return normalizedConfigured;
  return normalizeUrl(headerOrigin) || new URL(req.url).origin;
}

function resolveFromAddress() {
  const fromEmail = env.RESEND_FROM_EMAIL || "team@info.payparq.com";
  return `PayParq <${fromEmail}>`;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const unwrapped = trimmed.replace(/^["'`]+/, "").replace(/["'`]+$/, "");
  return unwrapped.replace(/\/+$/, "");
}
