import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sitemaps = [
    'https://www.payparq.com/sitemap.xml',
    'https://www.payparq.com/blog/sitemap.xml',
  ];

  try {
    const pingRequests = [
      // Google
      ...sitemaps.map((sitemap) =>
        fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`)
          .then((r) => ({ engine: 'Google', sitemap, status: r.status }))
          .catch((e) => ({ engine: 'Google', sitemap, error: e.message }))
      ),
      // Bing
      ...sitemaps.map((sitemap) =>
        fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`)
          .then((r) => ({ engine: 'Bing', sitemap, status: r.status }))
          .catch((e) => ({ engine: 'Bing', sitemap, error: e.message }))
      ),
    ];

    const results = await Promise.all(pingRequests);

    const successful = results.filter((r) => r.status === 200).length;
    const failed = results.filter((r) => r.error).length;

    console.log(`[SEARCH ENGINE PING] Success: ${successful}, Failed: ${failed}`);

    return NextResponse.json({
      message: 'Search engines pinged successfully',
      timestamp: new Date().toISOString(),
      results: {
        sitemaps_pinged: sitemaps.length,
        engines: ['Google', 'Bing'],
        successful,
        failed,
        details: results,
      },
    });
  } catch (error) {
    console.error('[SEARCH ENGINE PING ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to ping search engines', details: String(error) },
      { status: 500 }
    );
  }
}
