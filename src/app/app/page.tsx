"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GPXUploader from "@/components/GPXUploader";
import StravaActivities from "@/components/StravaActivities";
import MapViewer from "@/components/MapViewer";
import DesignConfigurator from "@/components/DesignConfigurator";

export default function GPXDesignApp() {
  const [currentStep, setCurrentStep] = useState<"upload" | "map" | "design">(
    "upload",
  );
  const [gpxData, setGpxData] = useState<any>(null);
  const [processedGpxData, setProcessedGpxData] = useState<any>(null);
  const [boundingBox, setBoundingBox] = useState<string>("");
  const [designConfig, setDesignConfig] = useState({
    routeColor: "#2563eb",
    printType: "tile" as "tile" | "ornament",
    tileSize: "ridgeline" as "basecamp" | "ridgeline" | "summit",
    labels: [] as Array<{
      text: string;
      x: number;
      y: number;
      size: number;
      rotation: number;
      width: number;
      height: number;
      fontFamily: "Garamond" | "Poppins" | "Trispace";
      textAlign: "left" | "center" | "right";
      bold: boolean;
      italic: boolean;
    }>,
    ornamentLabels: [] as Array<{
      text: string;
      angle: number; // Position around circle in degrees (0 = top)
      radius: number; // Distance from center
      size: number;
      fontFamily: "Garamond" | "Poppins" | "Trispace";
      bold: boolean;
      italic: boolean;
    }>,
    ornamentCircle: {
      x: 200,
      y: 200,
      radius: 160,
    },
  });
  const [stravaAccessToken, setStravaAccessToken] = useState<string | null>(
    null,
  );
  const [showGpxUploader, setShowGpxUploader] = useState(false);
  const [designMode, setDesignMode] = useState<"route" | "geography">("route");

  useEffect(() => {
    const checkStravaAuth = async () => {
      try {
        const response = await fetch("/api/strava/auth", {
          method: "GET",
          credentials: "include", // Include cookies in request
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.accessToken) {
            setStravaAccessToken(data.accessToken);
          } else {
            setStravaAccessToken(null);
          }
        } else {
          setStravaAccessToken(null);
        }
      } catch (error) {
        console.error("Error checking Strava authentication:", error);
        setStravaAccessToken(null);
      }
    };

    checkStravaAuth();
  }, []);

  useEffect(() => {
    if (gpxData && gpxData.gpx) {
      const points = gpxData.gpx.trk.trkseg.trkpt.map((p: any) => ({
        lat: p["@_lat"],
        lon: p["@_lon"],
      }));

      const bounds = points.reduce(
        (acc: any, p: any) => ({
          minLat: Math.min(acc.minLat, p.lat),
          minLon: Math.min(acc.minLon, p.lon),
          maxLat: Math.max(acc.maxLat, p.lat),
          maxLon: Math.max(acc.maxLon, p.lon),
        }),
        {
          minLat: Infinity,
          minLon: Infinity,
          maxLat: -Infinity,
          maxLon: -Infinity,
        },
      );

      setProcessedGpxData({ ...gpxData, points, bounds });
    } else if (gpxData) {
      // Handle GPX files that are already processed
      setProcessedGpxData(gpxData);
    }
  }, [gpxData]);

  const handleGPXUpload = (parsedGPX: any) => {
    setGpxData(parsedGPX);
    if (parsedGPX) {
      setCurrentStep("map");
    } else {
      setCurrentStep("upload");
    }
  };

  const handleSkipToMap = () => {
    setGpxData(null);
    setDesignMode("geography");
    setCurrentStep("map");
  };

  const handleBoundingBoxConfirm = (bbox: string) => {
    setBoundingBox(bbox);
    setCurrentStep("design");
  };

  const handleRestart = () => {
    setCurrentStep("upload");
    setGpxData(null);
    setBoundingBox("");
    setDesignMode("route");
    setDesignConfig({
      routeColor: "#2563eb",
      printType: "tile",
      tileSize: "ridgeline",
      labels: [],
      ornamentLabels: [],
      ornamentCircle: {
        x: 200,
        y: 200,
        radius: 160,
      },
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-alpine-mist">
        {/* Hero Section */}
        <div className="bg-alpine-mist py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold text-basalt sm:text-5xl lg:text-6xl">
                Design Your{" "}
                <span className="text-gradient-adventure">Custom Print</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-storm">
                Upload your GPS data, search for any location, select the
                perfect area, and customize your 3D print design
              </p>

              {/* Progress Indicator */}
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-4">
                  <div
                    onClick={() => setCurrentStep("upload")}
                    className={`flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity ${currentStep === "upload" ? "text-summit-sage" : currentStep === "map" || currentStep === "design" ? "text-basalt" : "text-slate-storm/50"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "upload" ? "bg-summit-sage text-white" : currentStep === "map" || currentStep === "design" ? "bg-basalt text-white" : "bg-slate-storm/20 text-slate-storm/50"}`}
                    >
                      1
                    </div>
                    <span className="text-sm font-semibold">Data Source</span>
                  </div>
                  <div
                    className={`w-8 h-px ${currentStep === "map" || currentStep === "design" ? "bg-basalt" : "bg-slate-storm/20"}`}
                  ></div>
                  <div
                    onClick={() => setCurrentStep("map")}
                    className={`flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity ${currentStep === "map" ? "text-summit-sage" : currentStep === "design" ? "text-basalt" : "text-slate-storm/50"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "map" ? "bg-summit-sage text-white" : currentStep === "design" ? "bg-basalt text-white" : "bg-slate-storm/20 text-slate-storm/50"}`}
                    >
                      2
                    </div>
                    <span className="text-sm font-semibold">Select Area</span>
                  </div>
                  <div
                    className={`w-8 h-px ${currentStep === "design" ? "bg-basalt" : "bg-slate-storm/20"}`}
                  ></div>
                  <div
                    onClick={() => boundingBox && setCurrentStep("design")}
                    className={`flex items-center space-x-2 transition-opacity ${boundingBox ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"} ${currentStep === "design" ? "text-summit-sage" : "text-slate-storm/50"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "design" ? "bg-summit-sage text-white" : "bg-slate-storm/20 text-slate-storm/50"}`}
                    >
                      3
                    </div>
                    <span className="text-sm font-semibold">Design</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App Content */}
        <div className="py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Step Content */}
            {currentStep === "upload" && (
              <div className="max-w-4xl mx-auto">
                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                  <div className="flex bg-white rounded-lg shadow-lg p-1">
                    <button
                      onClick={() => setDesignMode("route")}
                      className={`px-6 py-3 rounded-md text-sm font-semibold transition-all ${
                        designMode === "route"
                          ? "bg-summit-sage text-white shadow-md"
                          : "text-slate-storm hover:text-basalt"
                      }`}
                    >
                      Upload Route
                    </button>
                    <button
                      onClick={() => setDesignMode("geography")}
                      className={`px-6 py-3 rounded-md text-sm font-semibold transition-all ${
                        designMode === "geography"
                          ? "bg-summit-sage text-white shadow-md"
                          : "text-slate-storm hover:text-basalt"
                      }`}
                    >
                      Free Design
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {designMode === "route" ? (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-headline font-bold text-basalt mb-2">
                        Upload Your Route
                      </h3>
                      <p className="text-slate-storm">
                        Create a print from your GPS data or Strava activity
                      </p>
                    </div>

                    {stravaAccessToken && !showGpxUploader ? (
                      <>
                        <StravaActivities
                          accessToken={stravaAccessToken}
                          onActivitySelect={handleGPXUpload}
                        />
                        <div className="mt-8 text-center">
                          <button
                            onClick={() => setShowGpxUploader(true)}
                            className="text-sm text-slate-storm hover:text-basalt"
                          >
                            Or upload a GPX file manually
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <GPXUploader onGPXUpload={handleGPXUpload} />
                        {stravaAccessToken && (
                          <div className="mt-8 text-center">
                            <button
                              onClick={() => setShowGpxUploader(false)}
                              className="text-sm text-slate-storm hover:text-basalt"
                            >
                              Back to Strava Activities
                            </button>
                          </div>
                        )}
                        {!stravaAccessToken && (
                          <div className="mt-8 text-center">
                            <p className="text-slate-storm mb-4">Or</p>
                            <a href="/strava">
                              <Image
                                src="/btn_strava_connect_with_orange.svg"
                                alt="Connect with Strava"
                                className="mx-auto"
                                width={193}
                                height={48}
                              />
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto text-center">
                    <div className="mb-6">
                      <h3 className="text-xl font-headline font-bold text-basalt mb-2">
                        Free Design Mode
                      </h3>
                      <p className="text-slate-storm">
                        Create a topographical print from any location
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-8 h-8 bg-summit-sage/10 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-summit-sage"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-basalt">
                            Search for any location
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-8 h-8 bg-summit-sage/10 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-summit-sage"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-basalt">
                            Select your print area
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-8 h-8 bg-summit-sage/10 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-summit-sage"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 13h4a2 2 0 012 2v4a2 2 0 01-2 2h-4m-6-6V9a2 2 0 012-2h2m5 0l2-2"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-basalt">
                            Customize your design
                          </span>
                        </div>
                      </div>
                    </div>

                    <button onClick={handleSkipToMap} className="btn-primary">
                      Start Free Design
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === "map" && (
              <MapViewer
                gpxData={processedGpxData}
                onBoundingBoxChange={setBoundingBox}
                boundingBox={boundingBox}
                onConfirmSelection={() => handleBoundingBoxConfirm(boundingBox)}
                onRestart={handleRestart}
                designMode={designMode}
              />
            )}

            {currentStep === "design" && boundingBox && (
              <DesignConfigurator
                gpxData={processedGpxData}
                boundingBox={boundingBox}
                designConfig={designConfig}
                onConfigChange={setDesignConfig}
                onRestart={handleRestart}
                designMode={designMode}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
