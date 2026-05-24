import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const err = new Error('Sentry test error — delete this route after verifying');
  Sentry.captureException(err);
  await Sentry.flush(2000);
  return NextResponse.json({ ok: true, message: 'Error sent to Sentry' });
}
