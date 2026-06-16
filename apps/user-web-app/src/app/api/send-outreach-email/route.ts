import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { to, subject, text, html, nameVariant } = await req.json();

    let senderName = 'Karlo Zamic <team@info.payparq.com>';
    if (nameVariant === 'yugoslavia') {
      senderName = 'Karlo Žamić <team@info.payparq.com>';
    }

    const payload: any = {
      from: senderName,
      to,
      subject,
    };

    if (html) {
      payload.html = html;
    } else if (text) {
      payload.text = text;
    }

    const result = await resend.emails.send(payload);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error('Error sending outreach email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
