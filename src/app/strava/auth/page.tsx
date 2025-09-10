"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function StravaAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const expiresAt = searchParams.get("expires_at");

    if (accessToken && refreshToken && expiresAt) {
      localStorage.setItem("strava_access_token", accessToken);
      localStorage.setItem("strava_refresh_token", refreshToken);
      localStorage.setItem("strava_expires_at", expiresAt);
      router.push("/app");
    }
  }, [searchParams, router]);

  return <div>Authenticating with Strava...</div>;
}
