import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();

    // Basic auth check
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
    }

    // Read and execute migration SQL
    const sqlPath = path.join(process.cwd(), 'src/lib/email_tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.error('Migration error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      statements: statements.length
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
