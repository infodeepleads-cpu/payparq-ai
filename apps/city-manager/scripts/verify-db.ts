
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Verifying exec_sql RPC...");
  const { data, error } = await supabase.rpc("exec_sql", { sql: "SELECT count(*) FROM document_submissions" });
  
  if (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  } else {
    console.log("✅ Verification successful! exec_sql is working.");
    console.log("✅ document_submissions table exists.");
  }
}

test();
