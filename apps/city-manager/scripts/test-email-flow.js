import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load Environment Variables
let apiKey = "";
try {
  // Try reading from .env.local first (local dev)
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/RESEND_API_KEY=(.+)/);
    if (match) apiKey = match[1].trim();
  } else {
     // Fallback or assume process.env if running in environment with variables loaded
     apiKey = process.env.RESEND_API_KEY;
  }
} catch (e) {
    console.log("Could not read .env.local");
}

if (!apiKey) {
  console.error("❌ Error: RESEND_API_KEY not found. Please set it in .env.local");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function testSending() {
  console.log("\n📧 Testing SENDING capability...");
  try {
    const { data, error } = await resend.emails.send({
      from: "PayParq Team <team@info.payparq.com>", // Using the verified domain
      to: "delivered@resend.dev", // Resend's sink address (always succeeds)
      subject: "Test Email from PayParq App",
      html: "<p>This is a test email to verify sending configuration.</p>",
    });

    if (error) {
      console.error("❌ Sending Failed:", error);
      return false;
    }

    console.log("✅ Sending Successful!");
    console.log("   ID:", data.id);
    return true;
  } catch (e) {
    console.error("❌ Sending Exception:", e);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting Resend Configuration Test for info.payparq.com");
  
  // Test Sending
  const sendResult = await testSending();
  
  if (sendResult) {
      console.log("\n✨ SUMMARY: Sending is configured correctly!");
      console.log("   You can send emails from: team@info.payparq.com");
  } else {
      console.log("\n⚠️ SUMMARY: Sending failed. Check your API Key and Domain Verification.");
  }
  
  console.log("\nℹ️  To test RECEIVING:");
  console.log("   Please send a REAL email from your personal inbox to: team@info.payparq.com");
  console.log("   Then check your App's Inbox to see if it appears.");
}

main();
