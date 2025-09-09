"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GPXUploader from "@/components/GPXUploader";
import MapViewer from "@/components/MapViewer";
import DesignConfigurator from "@/components/DesignConfigurator";

export default function GPXDesignApp() {
  const [currentStep, setCurrentStep] = useState<"upload" | "map" | "design">(
    "upload",
  );
  const [gpxData, setGpxData] = useState<any>(null);
  const [boundingBox, setBoundingBox] = useState<string>("");
  const [designConfig, setDesignConfig] = useState({
    routeColor: "#2563eb",
    printType: "tile" as "tile" | "ornament",
    labels: [] as Array<{ text: string; x: number; y: number; size: number }>,
  });

  const handleGPXUpload = (parsedGPX: any) => {
    setGpxData(parsedGPX);
    if (parsedGPX) {
      setCurrentStep("map");
    } else {
      setCurrentStep("upload");
    }
  };

  const handleBoundingBoxConfirm = (bbox: string) => {
    setBoundingBox(bbox);
    setCurrentStep("design");
  };

  const handleRestart = () => {
    setCurrentStep("upload");
    setGpxData(null);
    setBoundingBox("");
    setDesignConfig({
      routeColor: "#2563eb",
      printType: "tile",
      labels: [],
    });
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
                Upload your GPX file, select the perfect area, and customize
                your 3D print design
              </p>

              {/* Progress Indicator */}
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center space-x-2 ${currentStep === "upload" ? "text-summit-sage" : currentStep === "map" || currentStep === "design" ? "text-basalt" : "text-slate-storm/50"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "upload" ? "bg-summit-sage text-white" : currentStep === "map" || currentStep === "design" ? "bg-basalt text-white" : "bg-slate-storm/20 text-slate-storm/50"}`}
                    >
                      1
                    </div>
                    <span className="text-sm font-semibold">Upload</span>
                  </div>
                  <div
                    className={`w-8 h-px ${currentStep === "map" || currentStep === "design" ? "bg-basalt" : "bg-slate-storm/20"}`}
                  ></div>
                  <div
                    className={`flex items-center space-x-2 ${currentStep === "map" ? "text-summit-sage" : currentStep === "design" ? "text-basalt" : "text-slate-storm/50"}`}
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
                    className={`flex items-center space-x-2 ${currentStep === "design" ? "text-summit-sage" : "text-slate-storm/50"}`}
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
            {/* Restart Button (shown after upload step) */}
            {currentStep !== "upload" && (
              <div className="mb-6 text-center">
                <button onClick={handleRestart} className="btn-secondary">
                  Start Over
                </button>
              </div>
            )}

            {/* Step Content */}
            {currentStep === "upload" && (
              <div className="max-w-2xl mx-auto">
                <GPXUploader onGPXUpload={handleGPXUpload} />
              </div>
            )}

            {currentStep === "map" && gpxData && (
              <div className="grid gap-8 lg:grid-cols-4">
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                    <h2 className="text-xl font-headline font-bold text-basalt mb-4">
                      Select Print Area
                    </h2>
                    <p className="text-sm text-slate-storm mb-4">
                      Draw a square on the map to choose which part of your
                      route to print.
                    </p>
                    <div className="text-xs text-slate-storm space-y-2">
                      <p>
                        <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">
                          Ctrl
                        </kbd>{" "}
                        + drag to draw area
                      </p>
                      <p>
                        <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">
                          ⌘
                        </kbd>{" "}
                        + drag on Mac
                      </p>
                    </div>
                    {boundingBox && (
                      <div className="mt-6 p-4 bg-summit-sage/5 rounded-lg">
                        <h3 className="font-headline font-semibold text-basalt mb-2">
                          Area Selected
                        </h3>
                        <button
                          onClick={() => handleBoundingBoxConfirm(boundingBox)}
                          className="btn-primary w-full"
                        >
                          Confirm Selection
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <MapViewer
                    gpxData={gpxData}
                    onBoundingBoxChange={setBoundingBox}
                  />
                </div>
              </div>
            )}

            {currentStep === "design" && gpxData && boundingBox && (
              <DesignConfigurator
                gpxData={gpxData}
                boundingBox={boundingBox}
                designConfig={designConfig}
                onConfigChange={setDesignConfig}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
