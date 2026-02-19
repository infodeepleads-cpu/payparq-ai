import { Resend } from "resend";
import fs from "fs";
import path from "path";

let apiKey = "";
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/RESEND_API_KEY=(.+)/);
    if (match) apiKey = match[1].trim();
  }
} catch {}

async function main() {
  if (!apiKey) {
    console.error("RESEND_API_KEY not found in .env.local");
    return;
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: "PayParq Team <team@mail.payparq.com>",
      to: "team@mail.payparq.com",
      subject: "Resend verification test (local)",
      html: "<p>This is a test sent from local dev to verify Resend config.</p>",
    });
    if (error) {
      console.error("Send error:", error);
    } else {
      console.log("Email sent. ID:", data?.id || "(no id)");
    }
  } catch (e) {
    console.error("Resend SDK error:", e.message);
  }
}

main();
