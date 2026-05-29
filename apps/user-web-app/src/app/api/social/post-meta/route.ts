import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { postId, platforms } = await req.json();

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  if (!postId || !platforms || platforms.length === 0) {
    return NextResponse.json({ error: 'postId and platforms required' }, { status: 400 });
  }

  // Get the post
  const { data: post } = await supabaseAdmin
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const results: Record<string, any> = {};

  // Post to each platform
  for (const platform of platforms) {
    try {
      // Get access token for this platform
      const { data: account } = await supabaseAdmin
        .from('social_accounts')
        .select('*')
        .eq('platform', platform)
        .single();

      if (!account || !account.access_token) {
        results[platform] = { error: 'Account not connected' };
        continue;
      }

      let externalPostId: string | null = null;

      if (platform === 'instagram') {
        // Post to Instagram
        const igRes = await fetch(
          `https://graph.instagram.com/v18.0/${account.page_id}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caption: post.caption,
              image_url: post.image_url,
              access_token: account.access_token,
            }),
          }
        );

        const igData = await igRes.json();
        if (igData.id) {
          externalPostId = igData.id;

          // Publish the media
          await fetch(
            `https://graph.instagram.com/v18.0/${igData.id}/publish`,
            {
              method: 'POST',
              body: JSON.stringify({ access_token: account.access_token }),
            }
          );

          results[platform] = { ok: true, postId: igData.id };
        } else {
          results[platform] = { error: igData.error?.message || 'Failed to post' };
        }
      } else if (platform === 'facebook') {
        // Post to Facebook page
        const fbRes = await fetch(
          `https://graph.facebook.com/v18.0/${account.page_id}/feed`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: post.caption,
              link: post.image_url,
              access_token: account.access_token,
            }),
          }
        );

        const fbData = await fbRes.json();
        if (fbData.id) {
          externalPostId = fbData.id;
          results[platform] = { ok: true, postId: fbData.id };
        } else {
          results[platform] = { error: fbData.error?.message || 'Failed to post' };
        }
      }

      // Update post status
      if (externalPostId) {
        await supabaseAdmin
          .from('social_posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            external_post_id: externalPostId,
          })
          .eq('id', postId);
      }
    } catch (err) {
      results[platform] = { error: String(err) };
    }
  }

  return NextResponse.json({ ok: true, results });
}
