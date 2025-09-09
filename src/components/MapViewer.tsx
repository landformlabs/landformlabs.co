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
    <div className="h-96 md:h-[500px] lg:h-[600px] w-full">
      <MapWithInteraction
        gpxData={gpxData}
        onBoundingBoxChange={onBoundingBoxChange}
      />
    </div>
  );
}
