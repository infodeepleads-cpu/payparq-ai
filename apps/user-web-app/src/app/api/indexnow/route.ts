import { NextRequest, NextResponse } from 'next/server';

const INDEXNOW_API_URL = 'https://api.indexnow.microsoft.com/indexnow';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_HOST = process.env.NEXT_PUBLIC_SITE_URL || 'www.payparq.com';

export async function POST(request: NextRequest) {
  try {
    if (!INDEXNOW_KEY) {
      return NextResponse.json(
        { error: 'IndexNow API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }

    const payload = {
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${INDEXNOW_HOST}/indexnow-key.txt`,
      urlList: urls,
    };

    const response = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IndexNow API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to submit URLs to IndexNow', details: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, submitted: urls.length });
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
