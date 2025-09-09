"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const MapWithInteraction = dynamic(() => import("./MapWithInteraction"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-slate-100 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-slate-500 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

interface MapViewerProps {
  gpxData: any;
  onBoundingBoxChange: (bbox: string) => void;
}

export default function MapViewer({
  gpxData,
  onBoundingBoxChange,
}: MapViewerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-slate-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-summit-sage border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative">
        <div className="h-96 md:h-[500px] lg:h-[600px] w-full">
          <MapWithInteraction
            gpxData={gpxData}
            onBoundingBoxChange={onBoundingBoxChange}
          />
        </div>

        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 max-w-sm shadow-lg z-[1000]">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-summit-sage rounded-sm"></div>
              <span className="text-xs text-slate-storm font-medium">
                Your route
              </span>
            </div>

            <div className="text-xs text-slate-storm space-y-1">
              <p className="font-medium">Draw print area:</p>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">
                  Ctrl
                </kbd>
                <span>+ drag to draw</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">
                  ⌘
                </kbd>
                <span>+ drag on Mac</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-storm/10">
              <p className="text-xs text-slate-storm/70">
                The area will be automatically adjusted to form a perfect square
                for printing.
              </p>
            </div>
          </div>
        </div>

        {/* Route info overlay */}
        {gpxData && (
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
            <div className="text-xs text-slate-storm space-y-1">
              <p className="font-medium text-basalt">{gpxData.fileName}</p>
              <p>{gpxData.totalPoints.toLocaleString()} GPS points</p>
              <p>{(gpxData.fileSize / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
