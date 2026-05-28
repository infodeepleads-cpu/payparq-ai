import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return Object.entries(req.cookies.getAll()).map(([name, cookie]) => ({
              name,
              value: cookie.value,
            }));
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profileRow } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profileRow as { role?: string } | null)?.role;
    if (role !== 'superadmin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Only superadmins can create templates' }, { status: 403 });
    }

    const body = await req.json();
    const { name, subject, htmlContent, category, description } = body;

    if (!name || !subject || !htmlContent) {
      return NextResponse.json({ error: 'Missing required fields: name, subject, htmlContent' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        name,
        subject,
        html_content: htmlContent,
        category: category || null,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, template: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
