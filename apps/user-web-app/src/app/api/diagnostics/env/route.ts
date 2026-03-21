import { NextResponse } from 'next/server';

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const hasResend = typeof resendApiKey === 'string' && resendApiKey.length > 0;

  const smtpHost = process.env.EMAIL_SERVER_HOST;
  const smtpUser = process.env.EMAIL_SERVER_USER;
  const smtpPass = process.env.EMAIL_SERVER_PASSWORD;
  const hasSMTP = !!(smtpHost && smtpUser && smtpPass && smtpPass !== "your_app_password_here");

  return NextResponse.json({
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    email: {
      resend: {
        present: hasResend,
        key_length: hasResend ? resendApiKey.length : 0,
        from: process.env.EMAIL_FROM || "Not set (using fallback: team@info.payparq.com)",
        to: process.env.EMAIL_TO || "Not set (using fallback: payparq@outlook.com)",
      },
      smtp: {
        present: hasSMTP,
        host: smtpHost || "Not set",
        user: smtpUser || "Not set",
        port: process.env.EMAIL_SERVER_PORT || "587",
      }
    }
  });
}
