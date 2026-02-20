import crypto from 'crypto';

const WEBHOOK_URL = "https://city-manager-xi.vercel.app/api/webhooks/resend";
const SECRET = "whsec_/arvZ+Jpat/fYR8q4EYSUvwr4QFqi8tF";

// Simulate an email sent to the custom domain
const payload = JSON.stringify({
  type: "email.received",
  created_at: new Date().toISOString(),
  data: {
    from: "Potential Customer <customer@gmail.com>",
    to: ["team@mail.payparq.com"], // Using your custom domain
    subject: "Inquiry about your services (Custom Domain Test)",
    html: "<p>Hello team, I saw your website and I am interested in your <strong>City Manager</strong> app.</p><p>Can we schedule a demo?</p>",
    text: "Hello team, I saw your website and I am interested in your City Manager app. Can we schedule a demo?",
  },
});

async function testWebhook() {
  try {
    const msgId = 'msg_custom_domain_' + Date.now();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const key = Buffer.from(SECRET.replace("whsec_", ""), "base64");
    const toSign = `${msgId}.${timestamp}.${payload}`;
    
    const signature = crypto
      .createHmac('sha256', key)
      .update(toSign)
      .digest('base64');
      
    const headers = {
      'Content-Type': 'application/json',
      'svix-id': msgId,
      'svix-timestamp': timestamp,
      'svix-signature': `v1,${signature}`,
    };
    
    console.log("Sending webhook to:", WEBHOOK_URL);
    console.log("Simulating email to: team@mail.payparq.com");
    
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
