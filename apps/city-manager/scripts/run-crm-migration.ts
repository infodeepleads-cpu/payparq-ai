
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials (URL or SERVICE_ROLE_KEY) in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function runMigration() {
  try {
    const sqlPath = path.resolve(process.cwd(), "scripts/setup-crm.sql");
    if (!fs.existsSync(sqlPath)) {
      console.error(`SQL file not found at: ${sqlPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, "utf-8");
    console.log("Reading SQL migration from:", sqlPath);
    console.log("SQL length:", sql.length);

    console.log("Executing SQL via 'exec_sql' RPC...");
    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error("❌ Migration failed:", error);
      if (error.message.includes("function exec_sql") && error.message.includes("does not exist")) {
        console.error("\n⚠️  The 'exec_sql' RPC function is missing in your Supabase database.");
        console.error("You must create it first via the Supabase SQL Editor:\n");
        console.error(`
create or replace function exec_sql(sql text)
returns void
language plpgsql
security definer
as $$
begin
  execute sql;
end;
$$;
        `);
      }
      process.exit(1);
    }

    console.log("✅ Migration completed successfully!");
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
}

runMigration();
