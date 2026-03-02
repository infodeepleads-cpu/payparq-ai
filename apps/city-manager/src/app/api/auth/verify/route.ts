import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, name, role } = await req.json();
    const email = rawEmail?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log(`[VerifyAPI] Request for email: ${email}, role: ${role}`);

    // 1. Generate a real Supabase verification link
    const origin = process.env.NODE_ENV === "production" 
      ? "https://city-manager-xi.vercel.app" 
      : (req.headers.get("origin") || new URL(req.url).origin);
    
    const finalOrigin = origin.includes("localhost") ? origin : "https://city-manager-xi.vercel.app";
    
    // Default fallback link (without token, but at least it's a link)
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

        // Directly try to generate signup link
        console.log(`[VerifyAPI] Attempting to generate signup link for ${email}`);
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: 'signup',
          email: email,
          password: 'TemporaryPassword123!', // Required by type 'signup', but user already exists
          options: {
            redirectTo: `${finalOrigin}/auth/confirm?email=${encodeURIComponent(email)}&type=signup`
          }
        });

        if (linkData?.properties?.action_link) {
          confirmUrl = linkData.properties.action_link;
          linkGenerated = true;
          console.log("[VerifyAPI] Successfully generated signup link");
        } else {
          console.warn("[VerifyAPI] Signup link generation failed, trying magiclink:", linkError?.message);
          
          // Try magiclink as fallback
          const { data: magicData, error: magicError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
              redirectTo: `${finalOrigin}/auth/confirm?email=${encodeURIComponent(email)}&type=signup`
            }
          });

          if (magicData?.properties?.action_link) {
            confirmUrl = magicData.properties.action_link;
            linkGenerated = true;
            console.log("[VerifyAPI] Successfully generated magiclink as fallback");
          } else {
             console.error("[VerifyAPI] All link generation attempts failed:", magicError?.message);
          }
        }
      } catch (adminError: any) {
        console.error("[VerifyAPI] Supabase admin error:", adminError.message);
      }
    }

    if (!env.RESEND_API_KEY) {
      console.error("[VerifyAPI] Missing RESEND_API_KEY");
      return NextResponse.json({ error: "Email service configuration missing" }, { status: 500 });
    }

    const fromAddress = (process.env.NODE_ENV === "development" || !env.RESEND_API_KEY.startsWith("re_"))
      ? "onboarding@resend.dev" 
      : "PayParq <team@info.payparq.com>";

    console.log(`[VerifyAPI] Sending email to ${email} from ${fromAddress}. Link generated: ${linkGenerated}`);

    const { data, error } = await resend.emails.send({
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

    if (error) {
      console.error("Resend send error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Email sent successfully, ID:", data?.id);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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
