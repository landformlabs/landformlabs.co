"use client";

import { useEffect } from "react";

export default function StravaPage() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;
    const responseType = "code";
    const approvalPrompt = "auto";
    const scope = "activity:read_all";

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&approval_prompt=${approvalPrompt}&scope=${scope}`;

    window.location.href = authUrl;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Connect with Strava</h1>
      <button
        onClick={handleLogin}
        className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
      >
        Connect with Strava
      </button>
    </div>
  );
}
