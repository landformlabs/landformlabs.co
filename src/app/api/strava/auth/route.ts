import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;
    const refreshToken = cookieStore.get("strava_refresh_token")?.value;
    const expiresAt = cookieStore.get("strava_expires_at")?.value;

    if (!accessToken || !refreshToken || !expiresAt) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Check if token is expired
    const expirationTime = parseInt(expiresAt) * 1000;
    const now = Date.now();

    if (now >= expirationTime) {
      // Token is expired, attempt to refresh
      try {
        const refreshResponse = await fetch("https://www.strava.com/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh token");
        }

        const refreshData = await refreshResponse.json();

        // Update cookies with new tokens
        const newExpiresAt = new Date(refreshData.expires_at * 1000);

        cookieStore.set("strava_access_token", refreshData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          expires: newExpiresAt,
          path: "/",
        });

        cookieStore.set("strava_refresh_token", refreshData.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          path: "/",
        });

        cookieStore.set("strava_expires_at", refreshData.expires_at.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          expires: newExpiresAt,
          path: "/",
        });

        return NextResponse.json({
          authenticated: true,
          accessToken: refreshData.access_token
        });
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear invalid cookies
        cookieStore.delete("strava_access_token");
        cookieStore.delete("strava_refresh_token");
        cookieStore.delete("strava_expires_at");
        return NextResponse.json({ authenticated: false }, { status: 200 });
      }
    }

    return NextResponse.json({
      authenticated: true,
      accessToken: accessToken
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    cookieStore.delete("strava_access_token");
    cookieStore.delete("strava_refresh_token");
    cookieStore.delete("strava_expires_at");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
