import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, name, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

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

        const { data: usersData, error: listError } =
          await adminClient.auth.admin.listUsers();

        if (!listError && usersData?.users?.length) {
          const targetUser = usersData.users.find(
            (u) => u.email?.toLowerCase() === String(email).toLowerCase()
          );

          if (targetUser) {
            await adminClient.auth.admin.updateUserById(targetUser.id, {
              email_confirm: true,
            });
          }
        }
      } catch (adminError) {
        console.error("Supabase admin email confirm error:", adminError);
      }
    }

    // Magic Link URL - Supabase handles the actual verification
    // We point to our confirm route which will handle the session
    const confirmUrl = `${new URL(req.url).origin}/auth/confirm?email=${encodeURIComponent(email)}`;

    // Use verified domain info.payparq.com
    const fromAddress = process.env.NODE_ENV === "development" 
      ? "onboarding@resend.dev" 
      : "PayParq <team@info.payparq.com>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Potvrdite vaš PayParq račun",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #7C3AED;">Dobrodošli u PayParq, ${name || 'korisniče'}!</h2>
          <p>Hvala vam na registraciji. Kako biste aktivirali svoj račun kao <strong>${getRoleLabel(role)}</strong>, kliknite na gumb ispod:</p>
          <div style="margin: 30px 0;">
            <a href="${confirmUrl}" style="background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Potvrdi račun</a>
          </div>
          <p style="font-size: 12px; color: #666;">Ako niste zatražili ovaj email, možete ga slobodno zanemariti.</p>
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
