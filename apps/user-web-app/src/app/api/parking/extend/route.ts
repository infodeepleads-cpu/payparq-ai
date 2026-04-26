import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionId = (req.nextUrl.searchParams.get('session_id') ?? '').trim();

  if (!sessionId) {
    return NextResponse.json({ error: 'missing_session_id' }, { status: 400 });
  }

  return NextResponse.redirect(`https://www.payparq.com/success?session_id=${encodeURIComponent(sessionId)}`);
}
