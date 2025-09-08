"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GPXUploader from "@/components/GPXUploader";
import MapViewer from "@/components/MapViewer";
import AppAuth from "@/components/AppAuth";

function GPXDesignApp() {
  const [gpxData, setGpxData] = useState<any>(null);
  const [boundingBox, setBoundingBox] = useState<string>("");

  const handleGPXUpload = (parsedGPX: any) => {
    setGpxData(parsedGPX);
  };

  const handleBoundingBoxChange = (bbox: string) => {
    setBoundingBox(bbox);
  };

  const copyToClipboard = async () => {
    if (boundingBox) {
      try {
        await navigator.clipboard.writeText(boundingBox);
        // TODO: Add toast notification
        console.log("Coordinates copied to clipboard:", boundingBox);
      } catch (err) {
        console.error("Failed to copy coordinates:", err);
      }
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-alpine-mist">
        {/* Hero Section */}
        <div className="bg-alpine-mist py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold text-basalt sm:text-5xl lg:text-6xl">
                Design Your{" "}
                <span className="text-gradient-adventure">Route Print</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-storm">
                Upload your GPX file, visualize your route on the map, and
                select the perfect area for your custom 3D print.
              </p>
            </div>
          </div>
        </div>

        {/* App Content */}
        <div className="py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Panel - Controls */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                  <h2 className="text-2xl font-headline font-bold text-basalt mb-6">
                    Upload & Configure
                  </h2>

                  <GPXUploader onGPXUpload={handleGPXUpload} />

                  {boundingBox && (
                    <div className="mt-6 p-4 bg-summit-sage/5 rounded-lg">
                      <h3 className="font-headline font-semibold text-basalt mb-3">
                        Bounding Box Coordinates
                      </h3>
                      <div className="bg-white p-3 rounded border text-sm font-mono text-basalt mb-3 break-all">
                        {boundingBox}
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="btn-primary w-full"
                      >
                        Copy Coordinates
                      </button>
                      <p className="text-sm text-slate-storm mt-2">
                        Use these coordinates when ordering your custom print.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Map */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <MapViewer
                    gpxData={gpxData}
                    onBoundingBoxChange={handleBoundingBoxChange}
                  />
                </div>
              </div>
            </div>

            {/* Instructions */}
            {!gpxData && (
              <div className="mt-12 max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-headline font-bold text-basalt mb-6">
                    How It Works
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-summit-sage rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-lg">1</span>
                      </div>
                      <h3 className="font-headline font-semibold text-basalt mb-2">
                        Upload GPX File
                      </h3>
                      <p className="text-slate-storm text-sm">
                        Upload your GPX file from Strava, Garmin Connect, or any
                        GPS device.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-summit-sage rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-lg">2</span>
                      </div>
                      <h3 className="font-headline font-semibold text-basalt mb-2">
                        Select Print Area
                      </h3>
                      <p className="text-slate-storm text-sm">
                        Draw a square on the map to choose which part of your
                        route to print.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-summit-sage rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-lg">3</span>
                      </div>
                      <h3 className="font-headline font-semibold text-basalt mb-2">
                        Copy Coordinates
                      </h3>
                      <p className="text-slate-storm text-sm">
                        Copy the coordinates and include them with your custom
                        order.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function AppPage() {
  return (
    <AppAuth>
      <GPXDesignApp />
    </AppAuth>
  );
}
