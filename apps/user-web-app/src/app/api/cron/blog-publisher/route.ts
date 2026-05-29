import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Daily cron: generates 1 new geo blog post per day
// Schedule via cron-job.org: POST https://payparq.com/api/cron/blog-publisher?token=YOUR_CRON_SECRET
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const tokenParam = new URL(req.url).searchParams.get('token');
    const provided = authHeader?.replace('Bearer ', '') || tokenParam;
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Call the blog generator
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://payparq.com';
  const cronSecret2 = process.env.CRON_SECRET || '';

  try {
    const res = await fetch(`${baseUrl}/api/blog/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret2}`,
      },
      body: JSON.stringify({ publish: true }),
    });

    const data = await res.json();
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
