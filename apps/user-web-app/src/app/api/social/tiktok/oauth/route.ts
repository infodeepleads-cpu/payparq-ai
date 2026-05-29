import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://open.tiktokapis.com/v1/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: TIKTOK_CLIENT_ID || '',
        client_secret: TIKTOK_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_REDIRECT_URI || '',
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to get access token', details: tokenData }, { status: 500 });
    }

    // Get user info
    const userRes = await fetch('https://open.tiktokapis.com/v1/user/info/?fields=username,id', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();

    if (!userData.data?.user?.id) {
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Store TikTok account
    const { error } = await supabaseAdmin
      .from('tiktok_accounts')
      .upsert({
        user_id: userData.data.user.id,
        username: userData.data.user.username,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        is_active: true,
      }, { onConflict: 'user_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect('https://payparq.com/members?activeItem=social&tiktok=connected');
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
