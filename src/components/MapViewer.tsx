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
    <div className="space-y-4">
      {/* Instructions above map */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-blue-600 rounded-sm"></div>
              <span className="text-sm text-slate-storm font-medium">
                Your route
              </span>
            </div>

            <div className="text-sm text-slate-storm space-y-1">
              <p className="font-medium">Draw print area:</p>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-slate-200 rounded text-xs font-mono">
                  Ctrl
                </kbd>
                <span>+ drag to draw</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-slate-200 rounded text-xs font-mono">
                  ⌘
                </kbd>
                <span>+ drag on Mac</span>
              </div>
            </div>
          </div>

          {/* Route info */}
          {gpxData && (
            <div className="text-sm text-slate-storm space-y-1">
              <p className="font-medium text-basalt">{gpxData.fileName}</p>
              <p>{gpxData.totalPoints.toLocaleString()} GPS points</p>
              <p>{(gpxData.fileSize / 1024).toFixed(1)} KB</p>
              <p className="text-xs text-slate-storm/70 mt-2">
                The area will be automatically adjusted to form a perfect square
                for printing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map container - now with full space */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="h-96 md:h-[500px] lg:h-[600px] w-full">
          <MapWithInteraction
            gpxData={gpxData}
            onBoundingBoxChange={onBoundingBoxChange}
          />
        </div>
      </div>
    </div>
  );
}
