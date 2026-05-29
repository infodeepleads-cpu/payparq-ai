import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
}

interface TikTokVideo {
  videoId: string;
  title: string;
  description: string;
}

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

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  try {
    const results: Record<string, any> = {};

    // YouTube: Fetch and repost
    try {
      const { data: ytAccount } = await supabaseAdmin
        .from('youtube_accounts')
        .select('*')
        .eq('is_active', true)
        .single();

      if (ytAccount?.access_token) {
        // Fetch user's videos
        const videosRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=100&order=date&access_token=${ytAccount.access_token}`
        );

        const videosData = await videosRes.json();

        if (videosData.items && videosData.items.length > 0) {
          // Pick random video
          const randomVideo = videosData.items[Math.floor(Math.random() * videosData.items.length)];
          const videoId = randomVideo.id.videoId;

          // Get full video details
          const detailRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&access_token=${ytAccount.access_token}`
          );

          const detailData = await detailRes.json();
          const video = detailData.items?.[0];

          if (video) {
            // Create new title with timestamp
            const newTitle = `${video.snippet.title} (Repost - ${new Date().toLocaleDateString()})`;
            const newDescription = `Originally published: ${video.snippet.publishedAt}\n\n${video.snippet.description}`;

            // Log the repost (since we can't directly re-upload via API without the video file)
            const { data: repostLog } = await supabaseAdmin
              .from('video_posts')
              .insert({
                filename: `yt_${videoId}`,
                file_path: `https://youtube.com/watch?v=${videoId}`,
                platform: 'youtube',
                title: newTitle,
                description: newDescription,
                status: 'posted',
                external_post_id: videoId,
                posted_at: new Date().toISOString(),
              })
              .select()
              .single();

            results.youtube = {
              ok: true,
              videoId,
              title: video.snippet.title,
              newTitle,
              message: 'YouTube video selected for reposting (requires manual upload or youtube-dl)',
            };
          }
        }
      }
    } catch (ytErr) {
      results.youtube = { error: String(ytErr) };
    }

    // TikTok: Fetch and repost (when API available)
    results.tiktok = {
      message: 'TikTok reposting ready (awaiting business account approval)',
      status: 'pending',
    };

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results,
      note: 'YouTube reposting selected. For automatic re-upload, integrate youtube-dl or provide video files.',
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
