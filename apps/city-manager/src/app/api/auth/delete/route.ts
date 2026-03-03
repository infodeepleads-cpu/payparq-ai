import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    // 1. Get auth token from headers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    // 2. Initialize standard Supabase client to verify user
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = user.id;
    console.log(`Attempting to delete account for user: ${userId} (${user.email})`);

    // 3. Initialize Admin Client to perform deletion
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const adminClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 4. Clean up application data to avoid foreign key violations
    // Some tables might be missing ON DELETE CASCADE
    const tablesToCleanup = [
      { table: "stripe_accounts", column: "user_id" },
      { table: "profiles", column: "id" },
      { table: "user_progress", column: "user_id" },
      { table: "document_submissions", column: "user_id" },
      { table: "push_subscriptions", column: "user_id" },
      { table: "reminders", column: "user_id" },
      { table: "emails", column: "user_id" },
      { table: "crm_contacts", column: "user_id" },
      { table: "drivers", column: "id" },
      { table: "rides", column: "passenger_id" },
      { table: "crm_organizations", column: "created_by" }
    ];

    console.log(`[DeleteAPI] Cleaning up data for user ${userId} in ${tablesToCleanup.length} tables...`);

    for (const { table, column } of tablesToCleanup) {
      try {
        const { error: cleanupError } = await adminClient
          .from(table)
          .delete()
          .eq(column, userId);
        
        if (cleanupError) {
          // If the table doesn't exist or we have another issue, log it but continue
          // Some environments might not have all tables (e.g., ride-hailing tables)
          if (cleanupError.code !== 'PGRST116' && cleanupError.code !== '42P01') { 
             console.warn(`[DeleteAPI] Warning cleaning up ${table}:`, cleanupError.message);
          }
        }
      } catch (err: any) {
        console.warn(`[DeleteAPI] Exception cleaning up ${table}:`, err.message);
      }
    }

    // 5. Delete user from Supabase Auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Unhandled error in delete route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
