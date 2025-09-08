"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Create a dynamic component that includes all the map functionality
const MapWithInteraction = dynamic(() => import("./MapWithInteraction"), {
  ssr: false,
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
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-96 md:h-[500px] lg:h-[600px] w-full">
        <MapWithInteraction
          gpxData={gpxData}
          onBoundingBoxChange={onBoundingBoxChange}
        />
      </div>

      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 max-w-sm shadow-lg z-[1000]">
        {!gpxData ? (
          <div>
            <h3 className="font-headline font-semibold text-basalt text-sm mb-2">
              Ready to Design
            </h3>
            <p className="text-xs text-slate-storm">
              Upload a GPX file to see your route on the map and start designing
              your print area.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="font-headline font-semibold text-basalt text-sm mb-2">
              Draw Print Area
            </h3>
            <p className="text-xs text-slate-storm mb-2">
              Hold{" "}
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">
                Ctrl
              </kbd>{" "}
              (or{" "}
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">⌘</kbd>{" "}
              on Mac) and click-drag to draw a square print area.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-1 bg-summit-sage rounded"></div>
              <span className="text-slate-storm">Your route</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
