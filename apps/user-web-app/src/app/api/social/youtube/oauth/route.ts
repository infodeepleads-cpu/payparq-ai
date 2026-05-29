import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID || '',
        client_secret: YOUTUBE_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: YOUTUBE_REDIRECT_URI || '',
        code,
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to get access token', details: tokenData }, { status: 500 });
    }

    // Get channel info
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true&access_token=${tokenData.access_token}`
    );
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({ error: 'Failed to get channel info' }, { status: 500 });
    }

    const channel = channelData.items[0];
    const channelId = channel.id;
    const channelName = channel.snippet.title;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Store YouTube account
    const { error } = await supabaseAdmin
      .from('youtube_accounts')
      .upsert({
        channel_id: channelId,
        channel_name: channelName,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        is_active: true,
      }, { onConflict: 'channel_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Redirect to admin panel
    return NextResponse.redirect('https://payparq.com/members?activeItem=social&youtube=connected');
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
