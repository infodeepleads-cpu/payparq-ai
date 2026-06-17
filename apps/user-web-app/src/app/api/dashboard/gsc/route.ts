import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const key = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const unsigned = `${encode(header)}.${encode(payload)}`;

  // Sign with RS256 using Web Crypto
  const pemBody = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryDer = Buffer.from(pemBody, 'base64');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(unsigned)
  );

  const jwt = `${unsigned}.${Buffer.from(signature).toString('base64url')}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

export async function GET() {
  const serviceAccountJson = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const siteUrl = process.env.GSC_SITE_URL;

  if (!serviceAccountJson || !siteUrl) {
    return NextResponse.json({ connected: false });
  }

  try {
    const accessToken = await getGoogleAccessToken(serviceAccountJson);
    const today = new Date().toISOString().split('T')[0];

    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: today,
          endDate: today,
          dimensions: [],
        }),
      }
    );

    const data = await res.json();
    const row = data.rows?.[0];

    return NextResponse.json({
      connected: true,
      date: today,
      impressions: row?.impressions ?? 0,
      clicks: row?.clicks ?? 0,
      ctr: row ? parseFloat((row.ctr * 100).toFixed(2)) : 0,
      position: row ? parseFloat(row.position.toFixed(1)) : 0,
    });
  } catch {
    return NextResponse.json({ connected: false, error: 'fetch_failed' });
  }
}
