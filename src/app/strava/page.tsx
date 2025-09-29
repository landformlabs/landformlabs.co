"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertTriangle, Check } from "lucide-react";

function StravaPageContent() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams?.get("error");
    if (authError === "auth_failed") {
      setError("Failed to connect to Strava. Please try again.");
    }
  }, [searchParams]);

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;
    const responseType = "code";
    const approvalPrompt = "auto";
    const scope = "activity:read_all";

    if (!clientId || !redirectUri) {
      setError("Strava integration is not properly configured.");
      return;
    }

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&approval_prompt=${approvalPrompt}&scope=${scope}`;

    setIsConnecting(true);
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-alpine-mist flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-basalt mb-4 font-trispace">
              Connect with Strava
            </h1>
            <p className="text-lg text-slate-storm mb-8">
              Link your Strava account to easily import your activities and
              create custom route prints from your adventures.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
              <div className="flex items-center">
                <div className="w-5 h-5 text-red-500 mr-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-basalt mb-4">
              Why Connect Strava?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 text-summit-sage mt-1">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-basalt text-sm">
                    No Manual Uploads
                  </h3>
                  <p className="text-slate-storm text-sm">
                    Skip the GPX export process
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 text-summit-sage mt-1">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-basalt text-sm">
                    Easy Activity Selection
                  </h3>
                  <p className="text-slate-storm text-sm">
                    Browse and filter your activities
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 text-summit-sage mt-1">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-basalt text-sm">
                    Secure Connection
                  </h3>
                  <p className="text-slate-storm text-sm">
                    Read-only access to your activities
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 text-summit-sage mt-1">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-basalt text-sm">
                    Automatic Updates
                  </h3>
                  <p className="text-slate-storm text-sm">
                    Access new activities instantly
                  </p>
                </div>
              </div>
            </div>

            {isConnecting ? (
              <div className="flex items-center justify-center py-3 px-6 bg-slate-100 rounded-lg">
                <div className="w-5 h-5 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-basalt font-medium">
                  Connecting to Strava...
                </span>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="mx-auto block hover:opacity-90 transition-opacity"
              >
                <Image
                  src="/btn_strava_connect_with_orange.svg"
                  alt="Connect with Strava"
                  width={193}
                  height={48}
                  className="mx-auto"
                />
              </button>
            )}
          </div>

          <p className="text-sm text-slate-storm">
            By connecting, you authorize Landform Labs to read your Strava
            activities. We only access activity data needed to create your
            custom route prints.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function StravaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-alpine-mist flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <StravaPageContent />
    </Suspense>
  );
}
