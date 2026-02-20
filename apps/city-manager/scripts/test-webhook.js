import crypto from 'crypto';

const WEBHOOK_URL = "https://city-manager-xi.vercel.app/api/webhooks/resend";
const SECRET = "whsec_/arvZ+Jpat/fYR8q4EYSUvwr4QFqi8tF";

const payload = JSON.stringify({
  type: "email.received",
  created_at: new Date().toISOString(),
  data: {
    from: "Test <test@example.com>",
    to: ["support@rexeokiod.resend.app"],
    subject: "Test Webhook Manual",
    html: "<p>This is a test</p>",
    text: "This is a test",
  },
});

async function testWebhook() {
  try {
    const msgId = 'msg_test_' + Date.now();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Svix signature construction:
    // 1. Get the secret key (remove prefix and decode base64)
    const key = Buffer.from(SECRET.replace("whsec_", ""), "base64");
    
    // 2. Construct the content to sign: msgId.timestamp.payload
    const toSign = `${msgId}.${timestamp}.${payload}`;
    
    // 3. Compute HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', key)
      .update(toSign)
      .digest('base64');
      
    // 4. Construct headers
    const headers = {
      'Content-Type': 'application/json',
      'svix-id': msgId,
      'svix-timestamp': timestamp,
      'svix-signature': `v1,${signature}`,
    };
    
    console.log("Sending webhook to:", WEBHOOK_URL);
    console.log("Headers:", headers);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: payload,
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);
    
    if (response.status === 200) {
      console.log("✅ Webhook verified successfully!");
    } else {
      console.log("❌ Webhook failed.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testWebhook();
