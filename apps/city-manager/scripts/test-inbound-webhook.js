import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Webhook } from 'svix';

// Read .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const secret = env.RESEND_WEBHOOK_SECRET;

if (!secret) {
  console.error('Error: RESEND_WEBHOOK_SECRET not found in .env.local');
  process.exit(1);
}

const payload = {
  created_at: new Date().toISOString(),
  data: {
    created_at: new Date().toISOString(),
    delivery_status: {
      attempt_no: 1,
      message: null,
      status: "delivered",
      timestamp: new Date().toISOString(),
      tls: true,
    },
    from: "Test Sender <sender@example.com>",
    headers: [],
    html: "<p>Hello from local test!</p>",
    id: "re_123456789",
    object: "email",
    subject: "Test Inbound Email",
    text: "Hello from local test!",
    to: ["team@mail.payparq.com"],
  },
  type: "email.received"
};

const payloadString = JSON.stringify(payload);

const wh = new Webhook(secret);
// Svix timestamp is in seconds? No, check documentation. Usually seconds.
// But let's check what Resend sends.
// Actually Svix usually handles timestamp automatically when signing?
// No, wh.sign(payload, timestamp)
const timestamp = Math.floor(Date.now() / 1000); // Seconds? Or milliseconds? Svix usually uses seconds.
// Wait, Resend documentation says `svix-timestamp` header.
// Let's try signing.

// Actually, I can just use wh.sign() to get the signature.
// But svix library sign method signature: sign(msgId: string, timestamp: Date | number, payload: string)
// Wait, checking svix docs...
// wh.sign(payload) -> returns signature string?
// No, standard Svix usage:
// const signature = wh.sign(payload, { timestamp, id });

try {
  // Mocking the signing process is tricky without knowing the exact library version behavior.
  // But let's try to construct the signature manually if possible or use the library.
  // The library `svix` has `sign` method.
  
  // Let's create a simpler test:
  // We will construct the payload and headers, then send fetch.
  
  // Generate headers
  const svix_id = `msg_${Date.now()}`;
  const timestampDate = new Date();
  const svix_timestamp = Math.floor(timestampDate.getTime() / 1000);
  
  // Correct signature for svix sign: (msgId, timestamp, payload)
  const signature = wh.sign(svix_id, timestampDate, payloadString);

  // Svix signature header format is usually v1,signature
  // Check if signature already includes v1,
  const signatureHeader = signature.startsWith('v1,') ? signature : `v1,${signature}`;

  console.log('Sending webhook request...');
  console.log('URL: http://localhost:3000/api/webhooks/resend');
  
  const res = await fetch('http://localhost:3000/api/webhooks/resend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp.toString(),
      'svix-signature': signatureHeader
    },
    body: payloadString
  });

  if (res.ok) {
    console.log('✅ Webhook received successfully!');
    const data = await res.json();
    console.log('Response:', data);
  } else {
    console.error('❌ Webhook failed:', res.status, res.statusText);
    const text = await res.text();
    console.error('Response:', text);
  }

} catch (e) {
  console.error('Error running test:', e);
}
