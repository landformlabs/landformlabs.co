"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface AppAuthProps {
  children: React.ReactNode;
}

export default function AppAuth({ children }: AppAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Simple password - in production, this would be environment-based
  const DEMO_PASSWORD = "landform2024";

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = sessionStorage.getItem("landform-app-auth");
    if (authStatus === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === DEMO_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("landform-app-auth", "authenticated");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("landform-app-auth");
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-alpine-mist flex items-center justify-center">
          <div className="text-slate-storm">Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-alpine-mist">
          <div className="py-16 lg:py-24">
            <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-headline font-bold text-basalt mb-4">
                    Route Design Tool
                  </h1>
                  <p className="text-slate-storm">
                    This application is currently in development. Please enter the access password to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-headline font-semibold text-basalt mb-2">
                      Access Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt"
                      placeholder="Enter password"
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary w-full"
                  >
                    Access Application
                  </button>
                </form>

                <div className="mt-8 p-4 bg-summit-sage/5 rounded-lg">
                  <h3 className="font-headline font-semibold text-basalt text-sm mb-2">
                    Development Access
                  </h3>
                  <p className="text-xs text-slate-storm">
                    This authentication is temporary and only for development purposes.
                    The tool will be publicly available once development is complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // User is authenticated, show the app with logout option
  return (
    <div className="relative">
      {/* Logout button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-storm hover:text-basalt px-4 py-2 rounded-lg shadow-lg border border-slate-storm/20 text-sm font-semibold transition-all duration-200"
        >
          Logout
        </button>
      </div>
      {children}
    </div>
  );
}
