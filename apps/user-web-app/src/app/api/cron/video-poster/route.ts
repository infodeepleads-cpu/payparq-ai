import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const VIDEOS_DIR = path.join(process.cwd(), 'public', 'videos');
const POSTED_DIR = path.join(VIDEOS_DIR, 'posted');

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
    // Create directories if they don't exist
    if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    if (!fs.existsSync(POSTED_DIR)) fs.mkdirSync(POSTED_DIR, { recursive: true });

    // Get video files in directory (mp4, mov, avi, webm)
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
    const files = fs.readdirSync(VIDEOS_DIR).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return videoExtensions.includes(ext) && f !== 'posted';
    });

    if (files.length === 0) {
      return NextResponse.json({ ok: true, message: 'No videos to post', posted: [] });
    }

    // Get next unposted video
    const videoFile = files[0];
    const videoPath = `public/videos/${videoFile}`;
    const fullPath = path.join(VIDEOS_DIR, videoFile);

    // Check if already in database
    const { data: existing } = await supabaseAdmin
      .from('video_posts')
      .select('id')
      .eq('file_path', videoPath)
      .single();

    if (existing) {
      // Already processed, move to posted folder
      fs.renameSync(fullPath, path.join(POSTED_DIR, videoFile));
      return NextResponse.json({ ok: true, message: 'Video already posted', skipped: videoFile });
    }

    // Get YouTube account
    const { data: account } = await supabaseAdmin
      .from('youtube_accounts')
      .select('*')
      .eq('is_active', true)
      .single();

    // Create video post entries (YouTube + TikTok)
    const platforms = account ? ['youtube', 'tiktok'] : ['tiktok'];
    const posts = platforms.map(platform => ({
      filename: videoFile,
      file_path: videoPath,
      platform,
      title: videoFile.replace(/\.[^/.]+$/, '').replace(/-/g, ' '),
      description: `Payparq Video - ${new Date().toLocaleDateString()}`,
      status: 'pending',
    }));

    const { data: createdPosts } = await supabaseAdmin
      .from('video_posts')
      .insert(posts)
      .select();

    const results: Record<string, any> = {};

    // Post to YouTube if account connected
    if (account && createdPosts) {
      const youtubePost = createdPosts.find(p => p.platform === 'youtube');
      if (youtubePost) {
        try {
          const videoBuffer = fs.readFileSync(fullPath);

          const uploadRes = await fetch(
            'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'X-Upload-Content-Type': 'video/mp4',
              },
              body: videoBuffer,
            }
          );

          const uploadData = await uploadRes.json();

          if (uploadData.id) {
            await supabaseAdmin
              .from('video_posts')
              .update({
                status: 'posted',
                external_post_id: uploadData.id,
                posted_at: new Date().toISOString(),
              })
              .eq('id', youtubePost.id);

            results.youtube = { ok: true, videoId: uploadData.id };
          } else {
            results.youtube = { error: uploadData.error?.message || 'Upload failed' };
          }
        } catch (err) {
          results.youtube = { error: String(err) };
        }
      }
    }

    // Move to posted folder
    fs.renameSync(fullPath, path.join(POSTED_DIR, videoFile));

    return NextResponse.json({
      ok: true,
      posted: videoFile,
      results,
      nextUp: files.length > 1 ? files[1] : null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
