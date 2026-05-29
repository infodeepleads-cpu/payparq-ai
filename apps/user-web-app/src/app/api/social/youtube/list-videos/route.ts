import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  try {
    // Get YouTube account
    const { data: account } = await supabaseAdmin
      .from('youtube_accounts')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'YouTube account not connected' }, { status: 400 });
    }

    // Fetch videos from YouTube channel
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50&order=date&access_token=${account.access_token}`
    );

    const videosData = await videosRes.json();

    if (!videosData.items) {
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    const videos = videosData.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.default.url,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({
      ok: true,
      count: videos.length,
      videos,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
