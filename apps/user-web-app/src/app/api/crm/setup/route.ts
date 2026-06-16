import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Create table using raw SQL via RPC
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS crm_entries (
          id text PRIMARY KEY,
          company text NOT NULL,
          contact text,
          status text,
          next_action text,
          date text,
          notes text,
          city text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS crm_entries_company_idx ON crm_entries(company);
        CREATE INDEX IF NOT EXISTS crm_entries_city_idx ON crm_entries(city);
      `
    });

    if (error && !error.message.includes('already exists')) {
      // Try alternative: just test if table exists by selecting from it
      const { error: selectError } = await supabaseAdmin
        .from('crm_entries')
        .select('id')
        .limit(1);

      if (selectError && selectError.code === '42P01') {
        return NextResponse.json({
          error: 'Table does not exist. Please create it manually in Supabase SQL Editor.',
          sql: `CREATE TABLE crm_entries (id text PRIMARY KEY, company text NOT NULL, contact text, status text, next_action text, date text, notes text, city text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());`
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Table ready' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}
