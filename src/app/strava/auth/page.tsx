"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StravaAuthPage() {
  const router = useRouter();

  useEffect(() => {
    // Authentication is now handled by the callback route with secure cookies
    // This page is no longer needed, redirect to app
    router.push("/app");
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-basalt mb-2">
          Completing Strava Authentication
        </h1>
        <p className="text-slate-storm">
          You'll be redirected to the app momentarily...
        </p>
      </div>
    </div>
  );
}
