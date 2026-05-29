import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function generateAdWithGroq(): Promise<{ caption: string; imageUrl?: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('No GROQ_API_KEY');

  const prompt = `Generate a short, compelling Instagram/Facebook ad (max 150 chars) promoting parking rental in Croatia.
Focus on: easy money, quick setup, passive income.
Language: Croatian
Format: Just the ad copy, no hashtags, no emojis.
Make it unique and different from typical parking ads.`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  const caption = data.choices?.[0]?.message?.content || '';

  return {
    caption: caption.trim(),
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=1080&fit=crop', // Generic parking image
  };
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
    // Generate ad copy
    const adContent = await generateAdWithGroq();

    // Create post in queue
    const { data: post, error: createError } = await supabaseAdmin
      .from('social_posts')
      .insert({
        platform: 'instagram',
        caption: adContent.caption,
        image_url: adContent.imageUrl,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Get connected Meta accounts
    const { data: accounts } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .in('platform', ['instagram', 'facebook']);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        ok: true,
        postId: post.id,
        caption: adContent.caption,
        message: 'Post created but not posted (no Meta accounts connected)',
      });
    }

    // Post to all connected Meta accounts
    const postResults: Record<string, any> = {};

    for (const account of accounts) {
      try {
        let endpoint = '';
        let payload: Record<string, any> = {};

        if (account.platform === 'instagram') {
          endpoint = `https://graph.instagram.com/v18.0/${account.page_id}/media`;
          payload = {
            caption: adContent.caption,
            image_url: adContent.imageUrl,
            access_token: account.access_token,
          };
        } else if (account.platform === 'facebook') {
          endpoint = `https://graph.facebook.com/v18.0/${account.page_id}/feed`;
          payload = {
            message: adContent.caption,
            link: adContent.imageUrl,
            access_token: account.access_token,
          };
        }

        const postRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const postData = await postRes.json();

        if (postData.id) {
          postResults[account.platform] = { ok: true, postId: postData.id };

          // Update post status
          await supabaseAdmin
            .from('social_posts')
            .update({
              status: 'posted',
              posted_at: new Date().toISOString(),
              external_post_id: postData.id,
            })
            .eq('id', post.id);
        } else {
          postResults[account.platform] = { error: postData.error?.message || 'Failed to post' };
        }
      } catch (err) {
        postResults[account.platform] = { error: String(err) };
      }
    }

    return NextResponse.json({
      ok: true,
      postId: post.id,
      caption: adContent.caption,
      posted: postResults,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
