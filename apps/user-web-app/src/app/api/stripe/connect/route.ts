import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user_id parameter" },
        { status: 400 }
      );
    }

    const stripeClientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!stripeClientId) {
      return NextResponse.json(
        { error: "Stripe Connect not configured" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/stripe/connect/callback`;

    const authUrl = new URL("https://connect.stripe.com/oauth/authorize");
    authUrl.searchParams.append("client_id", stripeClientId);
    authUrl.searchParams.append("state", userId);
    authUrl.searchParams.append("scope", "read_write");
    authUrl.searchParams.append("redirect_uri", redirectUri);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Stripe Connect" },
      { status: 500 }
    );
  }
}
