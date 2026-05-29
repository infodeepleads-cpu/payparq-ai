import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { videoPostId } = await req.json();

  if (!videoPostId || !supabaseAdmin) {
    return NextResponse.json({ error: 'videoPostId required' }, { status: 400 });
  }

  try {
    // Get video post
    const { data: videoPost } = await supabaseAdmin
      .from('video_posts')
      .select('*')
      .eq('id', videoPostId)
      .eq('platform', 'youtube')
      .single();

    if (!videoPost) {
      return NextResponse.json({ error: 'Video post not found' }, { status: 404 });
    }

    // Get YouTube account
    const { data: account } = await supabaseAdmin
      .from('youtube_accounts')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'YouTube account not connected' }, { status: 400 });
    }

    // Read video file
    const videoPath = path.join(process.cwd(), videoPost.file_path);
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 });
    }

    const videoBuffer = fs.readFileSync(videoPath);

    // Upload to YouTube
    const uploadRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'video/mp4',
      },
      body: videoBuffer,
    });

    const uploadData = await uploadRes.json();

    if (!uploadData.id) {
      return NextResponse.json({ error: uploadData.error?.message || 'Upload failed' }, { status: 500 });
    }

    // Update video post status
    await supabaseAdmin
      .from('video_posts')
      .update({
        status: 'posted',
        external_post_id: uploadData.id,
        posted_at: new Date().toISOString(),
      })
      .eq('id', videoPostId);

    return NextResponse.json({
      ok: true,
      videoId: uploadData.id,
      url: `https://youtube.com/watch?v=${uploadData.id}`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
