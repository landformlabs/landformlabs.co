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
            {/* Step Content */}
            {currentStep === "upload" && (
              <div className="max-w-2xl mx-auto">
                <GPXUploader onGPXUpload={handleGPXUpload} />
              </div>
            )}

            {currentStep === "map" && gpxData && (
              <MapViewer
                gpxData={gpxData}
                onBoundingBoxChange={setBoundingBox}
                boundingBox={boundingBox}
                onConfirmSelection={() => handleBoundingBoxConfirm(boundingBox)}
                onRestart={handleRestart}
              />
            )}

            {currentStep === "design" && gpxData && boundingBox && (
              <DesignConfigurator
                gpxData={gpxData}
                boundingBox={boundingBox}
                designConfig={designConfig}
                onConfigChange={setDesignConfig}
                onRestart={handleRestart}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
