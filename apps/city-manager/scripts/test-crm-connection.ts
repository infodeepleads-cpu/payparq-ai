
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  // Check if .env exists
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  console.log("Checked path:", envLocalPath);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCRM() {
  console.log("Testing Supabase CRM connection...");
  
  // 1. Test Select
  console.log("1. Testing SELECT...");
  const { data: selectData, error: selectError } = await supabase.from("crm_contacts").select("*").limit(1);
  
  if (selectError) {
    if (selectError.code === "42P01") { // undefined_table
      console.error("❌ Table 'crm_contacts' does not exist.");
      console.log("Please run the SQL script in scripts/setup-crm.sql in your Supabase SQL Editor.");
    } else {
      console.error("❌ Select failed:", selectError.message, selectError);
    }
    return;
  }
  console.log("✅ SELECT successful.");

  // 2. Test Insert
  console.log("2. Testing INSERT...");
  const testContact = {
    decision_maker: "Test Bot",
    location: "Localhost",
    tier: 1,
    status: "Test",
    notes: "Created by automated test script"
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from("crm_contacts")
    .insert(testContact)
    .select()
    .single();

  if (insertError) {
    console.error("❌ Insert failed:", insertError.message);
    return;
  }
  
  if (!insertData) {
    console.error("❌ Insert returned no data.");
    return;
  }

  console.log("✅ INSERT successful. ID:", insertData.id);

  // 3. Test Delete
  console.log("3. Testing DELETE...");
  const { error: deleteError } = await supabase
    .from("crm_contacts")
    .delete()
    .eq("id", insertData.id);

  if (deleteError) {
    console.error("❌ Delete failed:", deleteError.message);
    return;
  }
  console.log("✅ DELETE successful.");
  
  console.log("\n🎉 CRM Supabase integration is working correctly!");
}

testCRM();
