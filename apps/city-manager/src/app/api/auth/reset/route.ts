import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }

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

    // Generate recovery link
    // Prisilno koristimo produkcijsku domenu za redirect na Vercelu
    const origin = process.env.NODE_ENV === "production" 
      ? "https://city-manager-xi.vercel.app" 
      : (req.headers.get("origin") || new URL(req.url).origin);
    
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: { 
        redirectTo: `${origin}/auth/confirm?type=recovery` 
      }
    });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const recoveryLink = linkData.properties.action_link;

    // Use verified domain info.payparq.com
    const fromAddress = process.env.NODE_ENV === "development" 
      ? "onboarding@resend.dev" 
      : "PayParq <team@info.payparq.com>";

    const { data, error } = await resend.emails.send({
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
          <p style="font-size: 12px; color: #666;">Ako niste zatražili ovaj email, možete ga slobodno zanemariti. Link će biti aktivan 60 minuta.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">Sva prava pridržana © 2026 PayParq Global Inc.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
