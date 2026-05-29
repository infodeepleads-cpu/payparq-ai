import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

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

    // Get accounts
    const { data: ytAccount } = await supabaseAdmin
      .from('youtube_accounts')
      .select('*')
      .eq('is_active', true)
      .single();

    const { data: ttAccount } = await supabaseAdmin
      .from('tiktok_accounts')
      .select('*')
      .eq('is_active', true)
      .single();

    // YouTube → TikTok
    if (ytAccount?.access_token) {
      try {
        // Fetch random YouTube video
        const videosRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=100&order=date&access_token=${ytAccount.access_token}`
        );

        const videosData = await videosRes.json();

        if (videosData.items?.length > 0) {
          const randomVideo = videosData.items[Math.floor(Math.random() * videosData.items.length)];
          const videoId = randomVideo.id.videoId;

          // Get full details
          const detailRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&access_token=${ytAccount.access_token}`
          );

          const detailData = await detailRes.json();
          const video = detailData.items?.[0];

          if (video) {
            const youtubeUrl = `https://youtube.com/watch?v=${videoId}`;
            const caption = `${video.snippet.title}\n\n🎬 From our YouTube: ${youtubeUrl}`;

            // Log cross-post
            await supabaseAdmin
              .from('video_posts')
              .insert({
                filename: `yt_${videoId}_to_tt`,
                file_path: youtubeUrl,
                platform: 'tiktok',
                title: video.snippet.title,
                description: caption,
                status: 'pending',
                posted_at: new Date().toISOString(),
              });

            results.youtube_to_tiktok = {
              ok: true,
              fromPlatform: 'youtube',
              toPlatform: 'tiktok',
              videoId,
              title: video.snippet.title,
              youtubeUrl,
              caption,
              status: 'queued_for_tiktok',
              note: 'Awaiting TikTok Business API approval. Will auto-post when ready.',
            };
          }
        }
      } catch (err) {
        results.youtube_to_tiktok = { error: String(err) };
      }
    }

    // TikTok → YouTube Shorts
    if (ttAccount?.access_token) {
      try {
        // Fetch random TikTok video
        const videosRes = await fetch(
          `https://open.tiktokapis.com/v1/video/list?fields=id,title,create_time&access_token=${ttAccount.access_token}`
        );

        const videosData = await videosRes.json();

        if (videosData.data?.videos?.length > 0) {
          const randomVideo = videosData.data.videos[Math.floor(Math.random() * videosData.data.videos.length)];

          // Log cross-post
          await supabaseAdmin
            .from('video_posts')
            .insert({
              filename: `tt_${randomVideo.id}_to_yt`,
              file_path: `tiktok:${randomVideo.id}`,
              platform: 'youtube',
              title: randomVideo.title,
              description: `Reposted from TikTok - Originally: ${randomVideo.create_time}`,
              status: 'pending',
              posted_at: new Date().toISOString(),
            });

          results.tiktok_to_youtube = {
            ok: true,
            fromPlatform: 'tiktok',
            toPlatform: 'youtube',
            videoId: randomVideo.id,
            title: randomVideo.title,
            status: 'queued_for_youtube',
            note: 'TikTok video queued. Download and post to YouTube Shorts when ready.',
          };
        }
      } catch (err) {
        results.tiktok_to_youtube = { error: String(err) };
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results,
      summary: 'Cross-posting cron: YouTube→TikTok and TikTok→YouTube',
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
