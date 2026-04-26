import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type MagicLinkPayload = {
  email?: string;
  redirectTo?: string;
  source?: "members_login" | "members_verification";
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const unwrapped = trimmed.replace(/^["'`]+/, "").replace(/["'`]+$/, "");
  return unwrapped.replace(/\/+$/, "");
}

function resolveConfiguredOrigin() {
  const configured =
    normalizeUrl(process.env.NEXT_PUBLIC_APP_ORIGIN || "") ||
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || "");

  if (configured) {
    if (configured.startsWith("http://") || configured.startsWith("https://")) {
      return configured;
    }
    return `https://${configured}`;
  }
  return "";
}

function resolvePublicOrigin(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function resolveFromAddress() {
  const fromValue = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "PayParq Team <team@info.payparq.com>";
  return fromValue;
}

function applyRedirectToActionLink(actionLink: string, redirectTo: string) {
  try {
    const parsed = new URL(actionLink);
    parsed.searchParams.set("redirect_to", redirectTo);
    return parsed.toString();
  } catch {
    return actionLink;
  }
}

function buildInternalConfirmLink(origin: string, tokenHash: string, redirectTo: string) {
  return `${origin}/members?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent(redirectTo)}`;
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function resolveRedirectTo(req: NextRequest, requestedRedirectTo: string) {
  const configuredOrigin = resolveConfiguredOrigin();
  const requestOrigin = resolvePublicOrigin(req);
  const baseOrigin = configuredOrigin || requestOrigin;

  if (!requestedRedirectTo) {
    return { redirectTo: `${baseOrigin}/dashboard`, internalOrigin: baseOrigin };
  }

  if (requestedRedirectTo.startsWith("/")) {
    return { redirectTo: `${baseOrigin}${requestedRedirectTo}`, internalOrigin: baseOrigin };
  }

  try {
    const parsed = new URL(requestedRedirectTo);
    if (isLocalHost(parsed.hostname) && configuredOrigin) {
      const configured = new URL(configuredOrigin);
      const rewrittenRedirect = `${configured.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
      return { redirectTo: rewrittenRedirect, internalOrigin: configured.origin };
    }
    return { redirectTo: parsed.toString(), internalOrigin: parsed.origin };
  } catch {
    return { redirectTo: `${baseOrigin}/dashboard`, internalOrigin: baseOrigin };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as MagicLinkPayload | null;
    const email = (body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 500 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "Resend is not configured." }, { status: 500 });
    }

    const requestedRedirectTo = normalizeUrl(body?.redirectTo || "");
    const { redirectTo, internalOrigin } = resolveRedirectTo(req, requestedRedirectTo);
    const resend = new Resend(resendKey);

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false,
    });
    if (createError && !createError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo,
      },
    });

    const actionLink = linkData?.properties?.action_link || "";
    const tokenHash = linkData?.properties?.hashed_token || "";
    const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "");

    let finalActionLink = "";
    if (tokenHash) {
      finalActionLink = buildInternalConfirmLink(internalOrigin, tokenHash, redirectTo);
    } else if (actionLink) {
      finalActionLink = applyRedirectToActionLink(actionLink, redirectTo);
    }
    if (!finalActionLink && tokenHash && supabaseUrl) {
      finalActionLink = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=magiclink&redirect_to=${encodeURIComponent(redirectTo)}`;
    }

    if (linkError || !finalActionLink) {
      return NextResponse.json(
        { error: linkError?.message || "Unable to generate magic link." },
        { status: 500 }
      );
    }

    const subject =
      body?.source === "members_verification"
        ? "Potvrdite e-poštu za Payparq"
        : "Prijava u Payparq Members";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111827;background:#ffffff;">
        <h2 style="margin:0 0 16px 0;">Payparq Members</h2>
        <p style="margin:0 0 14px 0;">Kliknite na gumb ispod za prijavu u Members zonu:</p>
        <p style="margin:0 0 18px 0;">
          <a href="${finalActionLink}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#5F3DFC;color:#ffffff;text-decoration:none;font-weight:600;">Otvori Members</a>
        </p>
        <p style="margin:0;color:#6B7280;font-size:12px;">Ako niste tražili ovu prijavu, slobodno zanemarite ovu poruku.</p>
      </div>
    `;

    const { error: sendError, data: sendData } = await resend.emails.send({
      from: resolveFromAddress(),
      to: email,
      subject,
      html,
    });

    if (sendError) {
      return NextResponse.json({ error: sendError.message || "Failed to send email." }, { status: 500 });
    }

    if (!sendData?.id) {
      return NextResponse.json(
        { error: "Email provider did not confirm delivery request." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, id: sendData.id, email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
