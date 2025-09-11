import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Strava client configuration");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
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

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.access_token || !data.refresh_token) {
      throw new Error("Invalid token response from Strava");
    }

    // Store tokens in secure HTTP-only cookies
    const cookieStore = cookies();
    const expiresAt = new Date(data.expires_at * 1000);

    cookieStore.set("strava_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresAt,
      path: "/",
    });

    cookieStore.set("strava_refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      path: "/",
    });

    cookieStore.set("strava_expires_at", data.expires_at.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresAt,
      path: "/",
    });

    // Redirect to app without exposing tokens
    const redirectUrl = new URL("/app", request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Strava OAuth error:", error);
    const errorUrl = new URL("/strava", request.url);
    errorUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(errorUrl);
  }
}
