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

    // 1. Generate a real Supabase verification link
    const origin = process.env.NODE_ENV === "production" 
      ? "https://city-manager-xi.vercel.app" 
      : (req.headers.get("origin") || new URL(req.url).origin);
    
    const finalOrigin = origin.includes("localhost") ? origin : "https://city-manager-xi.vercel.app";
    
    let confirmUrl = `${finalOrigin}/auth/confirm?email=${encodeURIComponent(email)}`;
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

        // First, check if user exists and is already confirmed
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (existingUser?.email_confirmed_at) {
          console.log("User already confirmed, sending login link instead");
          const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
              redirectTo: `${finalOrigin}/profile`
            }
          });
          if (linkData?.properties?.action_link) {
            confirmUrl = linkData.properties.action_link;
            linkGenerated = true;
          }
        } else {
          // Generate the verification link for unconfirmed or new user
          // Try signup type first
          const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'signup',
            email: email,
            password: 'temp-password-123!', // Provide a temp password if it helps with existing users
            options: {
              redirectTo: `${finalOrigin}/auth/confirm?email=${encodeURIComponent(email)}&type=signup`
            }
          });

          if (linkError) {
            console.warn("Supabase generateLink (signup) error, trying magiclink:", linkError.message);
            // Fallback to magiclink which also confirms email if configured
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
            }
          } else if (linkData?.properties?.action_link) {
            confirmUrl = linkData.properties.action_link;
            linkGenerated = true;
            console.log("Generated Supabase signup link successfully");
          }
        }
        
        // Final fallback if no link generated but user exists
        if (!linkGenerated && existingUser) {
           console.log("No link generated, using direct confirm fallback for user ID:", existingUser.id);
           // We don't confirm here, we want them to click a link, but we'll use the basic URL
           // and maybe the confirm page can handle it if we pass enough info (not secure but works)
        }
      } catch (adminError) {
        console.error("Supabase admin error:", adminError);
      }
    }

    // 2. Use verified domain info.payparq.com
    // Fallback to onboarding@resend.dev if not in production or if needed for testing
    const fromAddress = (process.env.NODE_ENV === "development" || !env.RESEND_API_KEY.startsWith("re_"))
      ? "onboarding@resend.dev" 
      : "PayParq <team@info.payparq.com>";

    console.log(`Sending email to ${email} from ${fromAddress}. Link generated: ${linkGenerated}`);
    
    // Add a bit more detailed logging for Resend
    console.log("Resend API Key length:", env.RESEND_API_KEY?.length || 0);

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Potvrdite vaš PayParq račun",
      replyTo: "team@info.payparq.com",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
          <h2 style="color: #7C3AED;">Dobrodošli u PayParq, ${name || 'korisniče'}!</h2>
          <p>Hvala vam na registraciji. Kako biste aktivirali svoj račun kao <strong>${getRoleLabel(role)}</strong>, kliknite na gumb ispod:</p>
          <div style="margin: 30px 0;">
            <a href="${confirmUrl}" style="background-color: #7C3AED; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Potvrdi račun</a>
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
