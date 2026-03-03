import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, name, role, password, metadata } = await req.json();
    const email = rawEmail?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log(`[VerifyAPI] Request for email: ${email}, role: ${role}`);

    // 1. Generate a real Supabase verification link
    const finalOrigin = resolvePublicOrigin(req);
    
    // Default fallback link
    let confirmUrl = `${finalOrigin}/auth/confirm?email=${encodeURIComponent(email)}&type=signup`;
    let linkGenerated = false;
    
    if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
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

        // Explicitly create user first if they don't exist
        // admin.generateLink with type: 'signup' sometimes doesn't work as expected for creation
        // depending on Supabase version and config.
        const generatedPassword = password && password.length >= 6
          ? password
          : `Tmp!${Math.random().toString(36).slice(2)}A1`;

        const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
          email: email,
          password: generatedPassword,
          email_confirm: false,
          user_metadata: metadata || { full_name: name, role: role }
        });

        if (createError) {
          console.log(`[VerifyAPI] User creation notice: ${createError.message}`);
          if (createError.message.includes("already registered") || createError.message.includes("already exists")) {
          } else if (createError.message.toLowerCase().includes("duplicate")) {
          } else {
             console.warn("[VerifyAPI] Continuing after user creation error:", createError.message);
          }
        } else {
          console.log(`[VerifyAPI] User created successfully: ${createdUser.user.id}`);
        }

        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: 'signup',
          email: email,
          password: generatedPassword,
          options: {
            redirectTo: `${finalOrigin}/auth/confirm?email=${encodeURIComponent(email)}&type=signup`
          }
        });

        const signupTokenHash = linkData?.properties?.hashed_token;
        if (signupTokenHash) {
          confirmUrl = `${finalOrigin}/auth/confirm?token_hash=${encodeURIComponent(signupTokenHash)}&type=signup&email=${encodeURIComponent(email)}`;
          linkGenerated = true;
          console.log(`[VerifyAPI] Generated signup token link for ${email}`);
        } else if (linkData?.properties?.action_link) {
          confirmUrl = linkData.properties.action_link;
          linkGenerated = true;
          console.log(`[VerifyAPI] Generated signup action link for ${email}`);
        } else if (linkError) {
          console.warn(`[VerifyAPI] Signup link failed (${linkError.message}), trying magiclink...`);
          // Fallback to magiclink if signup link fails (e.g. user exists)
          const { data: magicData, error: magicError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
              redirectTo: `${finalOrigin}/auth/confirm?email=${encodeURIComponent(email)}&type=magiclink`
            }
          });

          const magicTokenHash = magicData?.properties?.hashed_token;
          if (magicTokenHash) {
            confirmUrl = `${finalOrigin}/auth/confirm?token_hash=${encodeURIComponent(magicTokenHash)}&type=magiclink&email=${encodeURIComponent(email)}`;
            linkGenerated = true;
            console.log(`[VerifyAPI] Generated magiclink token for ${email}`);
          } else if (magicData?.properties?.action_link) {
            confirmUrl = magicData.properties.action_link;
            linkGenerated = true;
            console.log(`[VerifyAPI] Generated magiclink action link for ${email}`);
          } else {
            const message = magicError?.message || linkError.message || "Unable to generate verification link";
            console.error("[VerifyAPI] All link generation methods failed:", message);
            return NextResponse.json({ error: message }, { status: 500 });
          }
        }
      } catch (adminError: any) {
        console.error("[VerifyAPI] Supabase admin error:", adminError.message);
        return NextResponse.json({ error: adminError.message || "Supabase verification setup failed" }, { status: 500 });
      }
    }

    if (!env.RESEND_API_KEY) {
      console.error("[VerifyAPI] Missing RESEND_API_KEY");
      return NextResponse.json({ error: "Email service configuration missing" }, { status: 500 });
    }
    const resend = new Resend(env.RESEND_API_KEY);

    // Use exact same logic as reset/route.ts which is working
    const fromAddress = resolveFromAddress();

    console.log(`[VerifyAPI] Sending email to ${email} from ${fromAddress}. Link generated: ${linkGenerated}`);

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Potvrdite vaš PayParq račun",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
          <h2 style="color: #7C3AED;">Dobrodošli u PayParq, ${name || 'korisniče'}!</h2>
          <p>Hvala vam na registraciji. Kako biste aktivirali svoj račun kao <strong>${getRoleLabel(role)}</strong>, kliknite na gumb ispod:</p>
          <div style="margin: 30px 0;">
            <a href="${confirmUrl}" style="background-color: #7C3AED; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Potvrdi račun</a>
          </div>
          <p style="font-size: 12px; color: #666;">Ako gumb ne radi, kopirajte ovaj link u preglednik:</p>
          <p style="font-size: 11px; color: #7C3AED; word-break: break-all;">${confirmUrl}</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Ako niste zatražili ovaj email, možete ga slobodno zanemariti.</p>
          <p style="font-size: 10px; color: #999; margin-top: 10px;">Link vrijedi 24 sata.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">Sva prava pridržana © 2026 PayParq Global Inc.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error("[VerifyAPI] Resend send error:", resendError);
      const resendMessage =
        (resendError as any)?.message ||
        (resendError as any)?.name ||
        "Failed to send confirmation email";
      return NextResponse.json({ error: resendMessage }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: resendData?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function resolvePublicOrigin(req: NextRequest) {
  const headerOrigin = req.headers.get("origin") || "";
  const forwardedHost = req.headers.get("x-forwarded-host") || "";
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const forwardedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : "";
  const requestOrigin = new URL(req.url).origin;
  const derivedFromVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const configured =
    env.APP_BASE_URL ||
    env.NEXT_PUBLIC_APP_URL ||
    env.NEXT_PUBLIC_SITE_URL;

  const candidates = [
    normalizeUrl(forwardedOrigin),
    normalizeUrl(headerOrigin),
    normalizeUrl(requestOrigin),
    normalizeUrl(configured),
    normalizeUrl(derivedFromVercel)
  ].filter(Boolean);

  const nonLocal = candidates.find((value) => !isLocalOrigin(value));
  if (nonLocal) return nonLocal;
  return candidates[0] || "http://localhost:3000";
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

function isLocalOrigin(value: string) {
  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "0": return "Korisnik";
    case "1": return "Vozač";
    case "2": return "Partner";
    case "3": return "Ovlašteni zastupnik";
    case "4": return "Dostavljač";
    case "5": return "Referal";
    default: return "Korisnik";
  }
}
