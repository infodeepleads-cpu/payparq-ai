
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const [key, ...value] = line.split("=");
  if (key) env[key.trim()] = value.join("=").trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testLinkGeneration() {
  const email = "payparq@outlook.com"; // Using a known email
  const origin = "http://localhost:80";
  
  console.log(`Generating link for ${email} with redirectTo: ${origin}/auth/confirm?type=recovery`);
  
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: email,
    options: { 
      redirectTo: `${origin}/auth/confirm?type=recovery` 
    }
  });

  if (error) {
    console.error("Error generating link:", error);
    return;
  }

  console.log("\n--- Generated Link Data ---");
  console.log("Action Link:", data.properties.action_link);
  console.log("Email OTP:", data.properties.email_otp);
  console.log("Hashed Token:", data.properties.hashed_token);
  console.log("---------------------------\n");

  const actionLink = data.properties.action_link;
  const url = new URL(actionLink);
  console.log("Redirect To (decoded):", decodeURIComponent(url.searchParams.get("redirect_to")));
}

testLinkGeneration();
