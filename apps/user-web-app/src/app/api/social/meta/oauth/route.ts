import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const META_APP_ID = '2976478279413016';
const META_APP_SECRET = '30f6731d248d08f0662530c0b990c3e8';
const REDIRECT_URI = 'https://payparq.com/api/social/meta/oauth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://graph.instagram.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }

    // Get user info to determine if Instagram or Facebook
    const userRes = await fetch(`https://graph.instagram.com/v18.0/me?fields=id,username,name&access_token=${tokenData.access_token}`);
    const userData = await userRes.json();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Determine platform (Instagram or Facebook)
    const platform = userData.username ? 'instagram' : 'facebook';

    // Store in social_accounts
    const { error } = await supabaseAdmin
      .from('social_accounts')
      .upsert({
        platform,
        account_name: userData.username || userData.name,
        access_token: tokenData.access_token,
        page_id: userData.id,
        is_active: true,
      }, { onConflict: 'platform' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Redirect to admin panel
    return NextResponse.redirect('https://payparq.com/members?activeItem=social&connected=true');
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
