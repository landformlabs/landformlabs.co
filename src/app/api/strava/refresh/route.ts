import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { refresh_token } = await request.json();

  if (!refresh_token) {
    return NextResponse.json({ error: "No refresh token provided" }, { status: 400 });
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
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  return NextResponse.json(data);
}
