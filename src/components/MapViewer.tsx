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
  boundingBox?: string;
  onConfirmSelection?: () => void;
  onRestart?: () => void;
}

export default function MapViewer({
  gpxData,
  onBoundingBoxChange,
  boundingBox,
  onConfirmSelection,
  onRestart,
}: MapViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCopy = () => {
    if (boundingBox) {
      navigator.clipboard.writeText(boundingBox);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

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

          {/* Route info and confirm button */}
          {gpxData && (
            <div className="text-sm text-slate-storm space-y-1">
              <p className="font-medium text-basalt">{gpxData.fileName}</p>
              <p>{gpxData.totalPoints.toLocaleString()} GPS points</p>
              <p>{(gpxData.fileSize / 1024).toFixed(1)} KB</p>
              <p className="text-xs text-slate-storm/70 mt-2">
                The area will be automatically adjusted to form a perfect square
                for printing.
              </p>

              {/* Bounding Box Coords */}
              {boundingBox && (
                <div className="mt-4">
                  <p className="font-medium text-basalt">Bounding Box</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={boundingBox}
                      className="w-full px-2 py-1 bg-slate-100 rounded text-xs font-mono"
                    />
                    <button
                      onClick={handleCopy}
                      className="btn-secondary text-xs py-1 px-2"
                    >
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm selection button */}
              {boundingBox && onConfirmSelection && (
                <div className="mt-4 pt-3 border-t border-slate-storm/10">
                  <button onClick={onConfirmSelection} className="btn-primary">
                    Confirm Selection & Continue
                  </button>
                </div>
              )}
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
