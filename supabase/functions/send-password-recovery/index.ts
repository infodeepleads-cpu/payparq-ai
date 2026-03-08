import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "team@info.payparq.com";
const tokenSecret = (Deno.env.get("PASSWORD_CHANGE_TOKEN_SECRET") ?? "").trim() ||
  supabaseServiceRoleKey;
const appLoginUrl = Deno.env.get("SUPABASE_REDIRECT_URL") ??
  "https://mobile-scanner-ruddy.vercel.app/";
const defaultRedirectTo = Deno.env.get("SUPABASE_REDIRECT_URL") ??
  "https://mobile-scanner-ruddy.vercel.app/";
const functionsBaseUrl = (Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? "").trim() ||
  `${supabaseUrl}/functions/v1`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isEmailValid(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
    + "=".repeat((4 - (value.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function aesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function encryptPassword(password: string, secret: string): Promise<{ iv: string; cipher: string }> {
  const key = await aesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(password),
  );
  return {
    iv: base64UrlEncode(iv),
    cipher: base64UrlEncode(new Uint8Array(encrypted)),
  };
}

async function decryptPassword(iv: string, cipher: string, secret: string): Promise<string> {
  const key = await aesKey(secret);
  const ivBytes = base64UrlDecode(iv) as unknown as BufferSource;
  const cipherBytes = base64UrlDecode(cipher) as unknown as BufferSource;
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    cipherBytes,
  );
  return decoder.decode(decrypted);
}

async function createSignedToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const payloadEncoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadEncoded));
  return `${payloadEncoded}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function parseSignedToken(token: string, secret: string): Promise<Record<string, unknown>> {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    throw new Error("Invalid token");
  }
  const key = await hmacKey(secret);
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadEncoded));
  const expectedEncoded = base64UrlEncode(new Uint8Array(expected));
  if (expectedEncoded !== signature) {
    throw new Error("Invalid token signature");
  }
  const payloadRaw = decoder.decode(base64UrlDecode(payloadEncoded));
  return JSON.parse(payloadRaw);
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  let page = 1;
  const needle = email.toLowerCase();
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    const match = users.find((user: { email?: string; id?: string }) =>
      (user.email ?? "").toLowerCase() == needle
    );
    if (match?.id) return match.id;
    if (users.length < 200) break;
    page++;
  }
  return null;
}

async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });
  if (!resendResponse.ok) {
    const failure = await resendResponse.text();
    throw new Error(`Resend failed: ${failure}`);
  }
}

async function handleRequestPasswordChange(req: Request): Promise<Response> {
  if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey || !tokenSecret) {
    return json({ error: "Missing server configuration" }, 500);
  }
  const body = await req.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const newPassword = String(body?.newPassword ?? "");
  if (!isEmailValid(email)) return json({ error: "Invalid email" }, 400);
  if (newPassword.trim().length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400);
  }
  const userId = await findUserIdByEmail(email);
  if (!userId) {
    return json({ error: "Account not found for this email" }, 404);
  }
  const { iv, cipher } = await encryptPassword(newPassword, tokenSecret);
  const exp = Date.now() + 3600000;
  const token = await createSignedToken({ email, iv, cipher, exp, userId }, tokenSecret);

  // Hardcode the link to ensure it points exactly to this Edge Function and avoids project-level redirects
  const confirmLink = `${supabaseUrl}/functions/v1/send-password-recovery?mode=confirm_password_change&token=${encodeURIComponent(token)}`;

  await sendResendEmail({
    to: email,
    subject: "Reset your Payparq password",
    html:
      `<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#111;max-width:500px;margin:40px auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;background-color:#ffffff">` +
      `<h1 style="margin:0 0 20px 0;font-size:24px;font-weight:700;color:#000;letter-spacing:-0.025em">Reset your password</h1>` +
      `<p style="margin:0 0 24px 0;font-size:16px;color:#374151">You requested a password reset for your Payparq account. Click the button below to activate your new password immediately.</p>` +
      `<div style="margin:32px 0">` +
      `<a href="${confirmLink}" style="background-color:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font-weight:600;font-size:16px">Reset Password</a>` +
      `</div>` +
      `<p style="margin:32px 0 0 0;color:#6b7280;font-size:14px;border-top:1px solid #f3f4f6;padding-top:20px">If you did not request this reset, you can safely ignore this email.</p>` +
      `</div>`,
    text:
      `Confirm your Payparq password reset by opening this link:\n${confirmLink}\n\nIf you did not request this, ignore this email.`,
  });
  return json({ ok: true, sent: true });
}

async function handleLegacyRecovery(req: Request): Promise<Response> {
  if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
    return json({ error: "Missing server configuration" }, 500);
  }
  const body = await req.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!isEmailValid(email)) return json({ error: "Invalid email" }, 400);

  const redirectToRaw = String(body?.redirectTo ?? defaultRedirectTo).trim();
  const redirectUri = new URL(redirectToRaw);
  const redirectTo = redirectUri.toString();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  if (error) return json({ error: error.message }, 500);

  const actionLink = data?.properties?.action_link ?? data?.action_link;
  if (!actionLink) return json({ error: "Recovery link generation failed" }, 500);
  await sendResendEmail({
    to: email,
    subject: "Reset your Payparq password",
    html:
      `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">` +
      `<h2 style="margin:0 0 12px 0">Reset your password</h2>` +
      `<p style="margin:0 0 16px 0">Click the button below to reset your Payparq account password.</p>` +
      `<p style="margin:0 0 16px 0"><a href="${actionLink}" style="background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block;font-weight:bold">Reset Password</a></p>` +
      `<p style="margin:0;color:#666;font-size:13px">If you did not request this, you can ignore this email.</p>` +
      `</div>`,
    text:
      `Reset your Payparq password: ${actionLink}\n\nIf you did not request this, ignore this email.`,
  });
  return json({ ok: true, sent: true });
}

async function handleConfirmPasswordChange(req: Request): Promise<Response> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return html("<h2>Configuration error</h2><p>Server is not configured.</p>", 500);
  }
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) {
    return html("<h2>Invalid link</h2><p>Missing token.</p>", 400);
  }
  try {
    const payload = await parseSignedToken(token, tokenSecret);
    const email = String(payload.email ?? "").toLowerCase().trim();
    const userId = String(payload.userId ?? "").trim();
    const iv = String(payload.iv ?? "");
    const cipher = String(payload.cipher ?? "");
    const exp = Number(payload.exp ?? 0);
    if (!isEmailValid(email)) throw new Error("Invalid email payload");
    if (!userId || !iv || !cipher || !exp || Date.now() > exp) throw new Error("Token expired");
    const newPassword = await decryptPassword(iv, cipher, tokenSecret);
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) throw new Error(error.message);
    const body = `<html><body style="font-family:Inter,Arial,sans-serif;padding:40px;color:#111;max-width:500px;margin:0 auto;text-align:center">` +
      `<h2 style="margin:0 0 16px 0;color:#000">Your password is now reset.</h2>` +
      `<p style="font-size:18px">You may log in now.</p>` +
      `</body></html>`;
    return html(body, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return html(
      `<html><body style="font-family:Inter,Arial,sans-serif;padding:40px;color:#111;max-width:500px;margin:0 auto;text-align:center">` +
      `<div style="padding:24px;border:1px solid #fee;border-radius:12px;background:#fffafb">` +
      `<h2 style="margin:0 0 16px 0;color:#c00">Activation Failed</h2>` +
      `<p>${message}</p>` +
      `<p style="color:#666;font-size:14px;margin-top:24px">Please try requesting a new reset link from the app.</p>` +
      `</div></body></html>`,
      400,
    );
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "";
  if (req.method === "GET" && mode === "confirm_password_change") {
    return handleConfirmPasswordChange(req);
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json();
    const action = String(body?.action ?? "");
    const newPassword = String(body?.newPassword ?? "");

    // Use new flow if action is explicitly set OR if newPassword is provided
    if (action === "request_password_change" || newPassword.length >= 8) {
      return handleRequestPasswordChange(
        new Request(req.url, {
          method: "POST",
          headers: req.headers,
          body: JSON.stringify(body),
        }),
      );
    }
    return handleLegacyRecovery(
      new Request(req.url, {
        method: "POST",
        headers: req.headers,
        body: JSON.stringify(body),
      }),
    );
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
