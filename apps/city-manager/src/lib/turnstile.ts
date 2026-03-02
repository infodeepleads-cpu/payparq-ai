import { env } from "./env";

/**
 * Verifies a Cloudflare Turnstile token on the server side.
 * @param token The token received from the Turnstile widget.
 * @param ip Optional client IP address.
 * @returns A promise that resolves to true if the token is valid, false otherwise.
 */
export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secretKey = env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn("Cloudflare Turnstile secret key missing. Verification skipped (always returns true).");
    return true; // Skip verification if secret key is missing (for development)
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}${ip ? `&remoteip=${encodeURIComponent(ip)}` : ""}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}
