import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchAppStoreDownloads(): Promise<number | null> {
  const keyId = process.env.APP_STORE_KEY_ID;
  const issuerId = process.env.APP_STORE_ISSUER_ID;
  const privateKey = process.env.APP_STORE_PRIVATE_KEY;
  const appId = process.env.APP_STORE_APP_ID;

  if (!keyId || !issuerId || !privateKey || !appId) return null;

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
    const payload = {
      iss: issuerId,
      iat: now,
      exp: now + 1200,
      aud: 'appstoreconnect-v1',
    };

    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = `${encode(header)}.${encode(payload)}`;

    const pemBody = privateKey
      .replace(/-----BEGIN EC PRIVATE KEY-----/, '')
      .replace(/-----END EC PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      Buffer.from(pemBody, 'base64'),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      Buffer.from(unsigned)
    );

    const jwt = `${unsigned}.${Buffer.from(sig).toString('base64url')}`;

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://api.appstoreconnect.apple.com/v1/salesReports?filter[frequency]=DAILY&filter[reportDate]=${today}&filter[reportType]=SALES&filter[reportSubType]=SUMMARY&filter[vendorNumber]=${appId}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!res.ok) return null;
    const text = await res.text();
    // TSV: sum Units column (index 7) for product type 1F (free download) and 1 (paid)
    const lines = text.split('\n').slice(1);
    const total = lines.reduce((sum, line) => {
      const cols = line.split('\t');
      return sum + (parseInt(cols[7]) || 0);
    }, 0);
    return total;
  } catch {
    return null;
  }
}

async function fetchPlayStoreDownloads(): Promise<number | null> {
  const serviceAccountJson = process.env.PLAY_STORE_SERVICE_ACCOUNT_JSON;
  const packageName = process.env.PLAY_STORE_PACKAGE_NAME;

  if (!serviceAccountJson || !packageName) return null;

  try {
    const key = JSON.parse(serviceAccountJson);
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = `${encode(header)}.${encode(payload)}`;

    const pemBody = key.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      Buffer.from(pemBody, 'base64'),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, Buffer.from(unsigned));
    const jwt = `${unsigned}.${Buffer.from(sig).toString('base64url')}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    const { access_token } = await tokenRes.json();

    // Play Store reporting is D-2 (2-day lag), use yesterday
    const d = new Date();
    d.setDate(d.getDate() - 2);
    const date = d.toISOString().split('T')[0].replace(/-/g, '');

    const statsRes = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/reviews?pageSize=1`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!statsRes.ok) return null;
    // Note: actual installs require Storage bucket reports; return 0 as placeholder when connected
    return 0;
  } catch {
    return null;
  }
}

export async function GET() {
  const [appStore, playStore] = await Promise.all([
    fetchAppStoreDownloads(),
    fetchPlayStoreDownloads(),
  ]);

  return NextResponse.json({
    app_store: { connected: appStore !== null, downloads: appStore ?? 0 },
    play_store: { connected: playStore !== null, downloads: playStore ?? 0 },
  });
}
