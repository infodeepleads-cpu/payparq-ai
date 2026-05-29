import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('social_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data || [] });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const body = await req.json();
  const { platform, caption, image_url, scheduled_at } = body;

  if (!platform || !caption) {
    return NextResponse.json({ error: 'platform and caption required' }, { status: 400 });
  }

  const status = scheduled_at ? 'scheduled' : 'draft';

  const { data, error } = await supabaseAdmin
    .from('social_posts')
    .insert({ platform, caption, image_url, scheduled_at, status })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin.from('social_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
