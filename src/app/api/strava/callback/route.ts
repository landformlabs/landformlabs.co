import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  const data = await response.json();

  console.log("Strava token data:", data);

  // In a real app, you'd store the tokens securely, e.g., in an HttpOnly cookie
  // For now, we'll redirect to the app page with the tokens in the query string
  // THIS IS NOT SECURE AND SHOULD NOT BE USED IN PRODUCTION
  const redirectUrl = new URL("/strava/auth", request.url);
  redirectUrl.searchParams.set("access_token", data.access_token);
  redirectUrl.searchParams.set("refresh_token", data.refresh_token);
  redirectUrl.searchParams.set("expires_at", data.expires_at);

  return NextResponse.redirect(redirectUrl);
}
