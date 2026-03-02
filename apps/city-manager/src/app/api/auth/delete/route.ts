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

    // 4. Optional: Clean up application data
    // Delete stripe accounts if they exist
    await adminClient
      .from("stripe_accounts")
      .delete()
      .eq("user_id", userId);

    // Add other tables here if needed in the future

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
